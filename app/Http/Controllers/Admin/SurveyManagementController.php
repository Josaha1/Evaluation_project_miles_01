<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\SurveyType;
use App\Models\SurveySection;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\RatingScale;
use App\Models\QuestionRatingScale;
use App\Models\QuestionMatrixOption;
use App\Models\SurveyTemplate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class SurveyManagementController extends Controller
{
    /**
     * แสดงหน้าจัดการ Survey (รายชื่อกลุ่ม + สร้างกลุ่ม)
     */
    public function index(): Response
    {
        $surveyTypes = SurveyType::orderBy('created_at', 'desc')
            ->get()
            ->map(fn($st) => [
                'id'          => $st->id,
                'name'        => $st->name,
                'code'        => $st->code,
                'description' => $st->description,
                'created_at'  => $st->created_at->format('Y-m-d'),
            ]);

        return Inertia::render('Admin/Survey/Index', [
            'surveyTypes' => $surveyTypes,
        ]);
    }

    //
    // -------------------------
    //  Questions Management
    // -------------------------
    //

    /**
     * แสดงรายการคำถามทั้งหมด (with pagination หรือ filter ตามกลุ่ม/section)
     */
    public function questions(Request $request): Response
    {
        $perPage = $request->input('perpage', 20);
        $surveyTypeId = $request->input('survey_type_id');
        $sectionId = $request->input('survey_section_id');

        $query = Question::with(['type', 'section']);

        if ($surveyTypeId) {
            $query->whereHas('section', fn($q) => $q->where('survey_type_id', $surveyTypeId));
        }
        if ($sectionId) {
            $query->where('survey_section_id', $sectionId);
        }

        $questions = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->through(fn($q) => [
                'id'          => $q->id,
                'text'        => $q->text,
                'code'        => $q->code,
                'type'        => $q->type->name,
                'sectionName' => $q->section->name,
                'is_required' => $q->is_required,
                'is_active'   => $q->is_active,
                'created_at'  => $q->created_at->format('Y-m-d'),
            ]);

        // ดึงตัวเลือก SurveyType เพื่อ filter
        $surveyTypes = SurveyType::orderBy('name')->get(['id', 'name']);
        // ถ้ามี surveyTypeId ให้ดึง sections มา
        $sections = [];
        if ($surveyTypeId) {
            $sections = SurveySection::where('survey_type_id', $surveyTypeId)
                ->orderBy('order_index')
                ->get(['id', 'name']);
        }

        return Inertia::render('Admin/Survey/Questions', [
            'questions'    => $questions,
            'surveyTypes'  => $surveyTypes,
            'sections'     => $sections,
            'filters'      => $request->only(['survey_type_id', 'survey_section_id', 'perpage']),
        ]);
    }

    /**
     * สร้างคำถามใหม่
     */
    public function storeQuestion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'survey_section_id' => 'required|exists:survey_sections,id',
            'question_type_id'  => 'required|exists:question_types,id',
            'text'              => 'required|string',
            'code'              => 'required|string|unique:questions,code',
            'is_required'       => 'boolean',
            'order_index'       => 'integer',
            'extra_config'      => 'nullable|array',
            'is_active'         => 'boolean',
            // สำหรับ choice หรือ multiple_choice ให้มี options
            'options'           => 'nullable|array',
            'options.*.label'   => 'required_with:options|string',
            'options.*.value'   => 'required_with:options|string',
            // สำหรับ rating ให้มี rating_scale_ids
            'rating_scale_ids'  => 'nullable|array',
            'rating_scale_ids.*'=> 'exists:rating_scales,id',
            // สำหรับ matrix ให้มี matrix_options
            'matrix_options'    => 'nullable|array',
            'matrix_options.*.label' => 'required_with:matrix_options|string',
            'matrix_options.*.value' => 'nullable|string',
        ]);

        $data = $validator->validated();

        DB::transaction(function() use ($data) {
            // สร้าง Question
            $question = Question::create([
                'survey_section_id' => $data['survey_section_id'],
                'question_type_id'  => $data['question_type_id'],
                'text'              => $data['text'],
                'code'              => $data['code'],
                'is_required'       => $data['is_required'] ?? false,
                'order_index'       => $data['order_index'] ?? 0,
                'extra_config'      => $data['extra_config'] ?? null,
                'is_active'         => $data['is_active'] ?? true,
            ]);

            // ถ้ามี options ให้สร้าง QuestionOption
            if (!empty($data['options'])) {
                foreach ($data['options'] as $opt) {
                    QuestionOption::create([
                        'question_id' => $question->id,
                        'label'       => $opt['label'],
                        'value'       => $opt['value'],
                        'order_index' => 0,
                        'is_active'   => true,
                    ]);
                }
            }

            // ถ้ามี rating_scale_ids ให้สร้าง pivot record ใน question_rating_scales
            if (!empty($data['rating_scale_ids'])) {
                foreach ($data['rating_scale_ids'] as $rsId) {
                    QuestionRatingScale::create([
                        'question_id'     => $question->id,
                        'rating_scale_id' => $rsId,
                        'order_index'     => 0,
                        'is_active'       => true,
                    ]);
                }
            }

            // ถ้ามี matrix_options ให้สร้าง QuestionMatrixOption
            if (!empty($data['matrix_options'])) {
                foreach ($data['matrix_options'] as $m) {
                    QuestionMatrixOption::create([
                        'question_id' => $question->id,
                        'label'       => $m['label'],
                        'value'       => $m['value'] ?? null,
                        'order_index' => 0,
                        'is_active'   => true,
                        'extra_config'=> null,
                    ]);
                }
            }
        });

        return redirect()->route('admin.survey.questions')
            ->with('success', 'สร้างคำถามเรียบร้อยแล้ว');
    }

    /**
     * อัปเดตคำถาม
     */
    public function updateQuestion(Request $request, Question $question)
    {
        $validator = Validator::make($request->all(), [
            'survey_section_id' => 'required|exists:survey_sections,id',
            'question_type_id'  => 'required|exists:question_types,id',
            'text'              => 'required|string',
            'code'              => [
                'required','string',
                Rule::unique('questions','code')->ignore($question->id),
            ],
            'is_required'       => 'boolean',
            'order_index'       => 'integer',
            'extra_config'      => 'nullable|array',
            'is_active'         => 'boolean',
            'options'           => 'nullable|array',
            'options.*.id'      => 'nullable|exists:question_options,id',
            'options.*.label'   => 'required_with:options|string',
            'options.*.value'   => 'required_with:options|string',
            'rating_scale_ids'  => 'nullable|array',
            'rating_scale_ids.*'=> 'exists:rating_scales,id',
            'matrix_options'    => 'nullable|array',
            'matrix_options.*.id'=> 'nullable|exists:question_matrix_options,id',
            'matrix_options.*.label' => 'required_with:matrix_options|string',
            'matrix_options.*.value'=> 'nullable|string',
        ]);

        $data = $validator->validated();

        DB::transaction(function() use ($data, $question) {
            // อัปเดต Question
            $question->update([
                'survey_section_id' => $data['survey_section_id'],
                'question_type_id'  => $data['question_type_id'],
                'text'              => $data['text'],
                'code'              => $data['code'],
                'is_required'       => $data['is_required'] ?? false,
                'order_index'       => $data['order_index'] ?? 0,
                'extra_config'      => $data['extra_config'] ?? null,
                'is_active'         => $data['is_active'] ?? true,
            ]);

            // อัปเดต/ลบ/สร้าง QuestionOption
            $existingOpts = $question->options->pluck('id')->toArray();
            $newOptIds = [];
            if (!empty($data['options'])) {
                foreach ($data['options'] as $opt) {
                    if (!empty($opt['id'])) {
                        // อัปเดต option เดิม
                        $qo = QuestionOption::find($opt['id']);
                        $qo->update([
                            'label'       => $opt['label'],
                            'value'       => $opt['value'],
                            'is_active'   => true,
                        ]);
                        $newOptIds[] = $opt['id'];
                    } else {
                        // สร้าง option ใหม่
                        $new = QuestionOption::create([
                            'question_id' => $question->id,
                            'label'       => $opt['label'],
                            'value'       => $opt['value'],
                            'order_index' => 0,
                            'is_active'   => true,
                        ]);
                        $newOptIds[] = $new->id;
                    }
                }
            }
            // ลบ option ที่ไม่มีใน newOptIds
            $toDeleteOpts = array_diff($existingOpts, $newOptIds);
            if (!empty($toDeleteOpts)) {
                QuestionOption::whereIn('id', $toDeleteOpts)->delete();
            }

            // อัปเดต pivot question_rating_scales
            $existingRS = $question->questionRatingScales->pluck('rating_scale_id')->toArray();
            $desiredRS  = $data['rating_scale_ids'] ?? [];
            // ลบอันที่ต้องลบ
            $toRemoveRS = array_diff($existingRS, $desiredRS);
            if (!empty($toRemoveRS)) {
                QuestionRatingScale::where('question_id', $question->id)
                    ->whereIn('rating_scale_id', $toRemoveRS)
                    ->delete();
            }
            // สร้างอันที่ไม่มี
            $toAddRS = array_diff($desiredRS, $existingRS);
            foreach ($toAddRS as $rsId) {
                QuestionRatingScale::create([
                    'question_id'     => $question->id,
                    'rating_scale_id' => $rsId,
                    'order_index'     => 0,
                    'is_active'       => true,
                ]);
            }

            // อัปเดต matrix options
            $existingMatrix = $question->matrixOptions->pluck('id')->toArray();
            $newMatrixIds = [];
            if (!empty($data['matrix_options'])) {
                foreach ($data['matrix_options'] as $m) {
                    if (!empty($m['id'])) {
                        // อัปเดตเดิม
                        $qm = QuestionMatrixOption::find($m['id']);
                        $qm->update([
                            'label'     => $m['label'],
                            'value'     => $m['value'] ?? null,
                            'is_active' => true,
                        ]);
                        $newMatrixIds[] = $m['id'];
                    } else {
                        // สร้างใหม่
                        $new = QuestionMatrixOption::create([
                            'question_id'=> $question->id,
                            'label'      => $m['label'],
                            'value'      => $m['value'] ?? null,
                            'order_index'=> 0,
                            'is_active'  => true,
                            'extra_config' => null,
                        ]);
                        $newMatrixIds[] = $new->id;
                    }
                }
            }
            $toDeleteMatrix = array_diff($existingMatrix, $newMatrixIds);
            if (!empty($toDeleteMatrix)) {
                QuestionMatrixOption::whereIn('id', $toDeleteMatrix)->delete();
            }
        });

        return redirect()->route('admin.survey.questions')
            ->with('success', 'อัปเดตคำถามเรียบร้อยแล้ว');
    }

    /**
     * ลบคำถาม
     */
    public function destroyQuestion(Question $question)
    {
        $question->delete();

        return redirect()->route('admin.survey.questions')
            ->with('success', 'ลบคำถามเรียบร้อยแล้ว');
    }

    //
    // -------------------------
    //  Groups Management (SurveyType)
    // -------------------------
    //

    /**
     * แสดงรายชื่อกลุ่ม (SurveyType) และฟอร์มสร้าง
     */
    public function groups(): Response
    {
        $groups = SurveyType::orderBy('created_at', 'desc')
            ->get()
            ->map(fn($st) => [
                'id'          => $st->id,
                'name'        => $st->name,
                'code'        => $st->code,
                'description' => $st->description,
                'created_at'  => $st->created_at->format('Y-m-d'),
            ]);

        return Inertia::render('Admin/Survey/Groups', [
            'groups' => $groups,
        ]);
    }

    /**
     * สร้างกลุ่มใหม่ (SurveyType)
     */
    public function storeGroup(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|unique:survey_types,name',
            'code'        => 'required|string|unique:survey_types,code',
            'description' => 'nullable|string',
        ]);

        SurveyType::create($data);

        return redirect()->route('admin.survey.groups')
            ->with('success', 'สร้างกลุ่มใหม่เรียบร้อยแล้ว');
    }

    /**
     * อัปเดตกลุ่ม (SurveyType)
     */
    public function updateGroup(Request $request, SurveyType $group)
    {
        $data = $request->validate([
            'name'        => ['required','string',Rule::unique('survey_types','name')->ignore($group->id)],
            'code'        => ['required','string',Rule::unique('survey_types','code')->ignore($group->id)],
            'description' => 'nullable|string',
        ]);

        $group->update($data);

        return redirect()->route('admin.survey.groups')
            ->with('success', 'อัปเดตกลุ่มเรียบร้อยแล้ว');
    }

    //
    // -------------------------
    //  Settings (อาจเป็นการตั้งค่าทั่วไปของระบบ Survey)
    // -------------------------
    //

    /**
     * แสดงหน้าตั้งค่า Survey (เช่น ค่าทั่วไป, default templates)
     */
    public function settings(): Response
    {
        // ตัวอย่าง: ดึง SurveyTemplate ทุกอัน
        $templates = SurveyTemplate::with('surveyType')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($tpl) => [
                'id'            => $tpl->id,
                'survey_type'   => $tpl->surveyType->name,
                'name'          => $tpl->name,
                'is_default'    => $tpl->is_default,
                'created_at'    => $tpl->created_at->format('Y-m-d'),
            ]);

        return Inertia::render('Admin/Survey/Settings', [
            'templates' => $templates,
        ]);
    }

    /**
     * อัปเดต (สร้าง/เปลี่ยน) Settings (เช่น default template)
     */
    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'default_template_id' => 'nullable|exists:survey_templates,id',
            // อาจมีการตั้งค่าอื่นๆ เช่น custom CSS, พารามิเตอร์ทั่วไป ฯลฯ
        ]);

        if (!empty($data['default_template_id'])) {
            // เคลียร์ is_default เดิมทั้งหมด
            SurveyTemplate::where('is_default', true)
                ->update(['is_default' => false]);

            // ตั้งค่าใหม่
            $tpl = SurveyTemplate::findOrFail($data['default_template_id']);
            $tpl->is_default = true;
            $tpl->save();
        }

        return redirect()->route('admin.survey.settings')
            ->with('success', 'อัปเดตการตั้งค่าเรียบร้อยแล้ว');
    }
}
