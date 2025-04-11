<?php
namespace App\Http\Controllers;

use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\Part;
use App\Models\Question;
use App\Models\SubAspect;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuestionController extends Controller
{
    public function index(Request $request, Evaluation $evaluation, Part $part, Aspect $aspect, SubAspect $subaspect = null)
    {
        $query = $aspect->questions()->with('options');

        if ($subaspect) {
            $query->where('sub_aspect_id', $subaspect->id);
        } else {
            $query->whereNull('sub_aspect_id');
        }

        $questions = $query->get();

        return Inertia::render('AdminQuestionIndex', [
            'evaluation' => $evaluation,
            'part'       => $part,
            'aspect'     => $aspect,
            'subaspect'  => $subaspect, // อาจเป็น null
            'questions'  => $questions,
        ]);
    }

    // QuestionController.php
    public function create(Request $request, Evaluation $evaluation, Part $part)
    {
        $aspects = $part->aspects()->with('subAspects')->get();

        // ดึง subaspects แยกสำหรับใช้กรองในฟอร์ม
        $subaspects = $aspects->flatMap->subAspects;

        return Inertia::render('AdminQuestionCreate', [
            'evaluation'     => $evaluation,
            'part'           => $part,
            'aspects'        => $aspects,
            'subaspects'     => $subaspects, // ✅ ส่งมาด้วย
            'selectedAspect' => (int) $request->get('aspect'),
            'selectedSub'    => (int) $request->get('subaspect'),
        ]);
    }

    public function store(Request $request, Evaluation $evaluation, Part $part)
    {
        $optionsRequired = in_array($request->type, ['rating', 'choice', 'multiple_choice']);
        $validated       = $request->validate([
            'title'           => ['required', 'string'],
            'type'            => ['required', 'in:rating,open_text,choice,multiple_choice'],
            'aspect_id'       => ['nullable', 'exists:aspects,id'],
            'sub_aspect_id'   => ['nullable', 'exists:sub_aspects,id'],
            'options'         => $optionsRequired ? ['required', 'array'] : ['nullable'],
            'options.*.label' => $optionsRequired ? ['required', 'string'] : ['nullable'],
            'options.*.score' => $request->type === 'rating' ? ['required', 'integer'] : ['nullable'],
        ]);

        $question = $part->questions()->create([
            'title'         => $validated['title'],
            'type'          => $validated['type'],
            'aspect_id'     => $validated['aspect_id'] ?? null,
            'sub_aspect_id' => $validated['sub_aspect_id'] ?? null,
            'order'         => ($part->questions()->max('order') ?? 0) + 1,
        ]);
        // ตรวจสอบเฉพาะเมื่อไม่ใช่ open_text
        if (! in_array($validated['type'], ['open_text']) && ! empty($validated['options'])) {
            $options = collect($validated['options'])->map(function ($opt) use ($validated) {
                if ($validated['type'] !== 'rating') {
                    unset($opt['score']); // ลบ score ถ้าไม่ใช่ rating
                }
                return $opt;
            })->toArray();

            $question->options()->createMany($options);
        }

        if ($question->sub_aspect_id) {
            return redirect()->route('questions.index.subaspect', [
                'evaluation' => $evaluation->id,
                'part'       => $part->id,
                'aspect'     => $question->aspect_id,
                'subaspect'  => $question->sub_aspect_id,
            ])->with('success', 'เพิ่มคำถามในด้านย่อยเรียบร้อยแล้ว!');
        } elseif ($question->aspect_id) {
            return redirect()->route('questions.index.aspect', [
                'evaluation' => $evaluation->id,
                'part'       => $part->id,
                'aspect'     => $question->aspect_id,
            ])->with('success', 'เพิ่มคำถามในด้านเรียบร้อยแล้ว!');
        } else {
            return redirect()->route('questions.index', [
                'evaluation' => $evaluation->id,
                'part'       => $part->id,
            ])->with('success', 'เพิ่มคำถามเรียบร้อยแล้ว!');
        }

    }

    public function edit(
        Evaluation $evaluation,
        Part $part,
        Aspect $aspect = null,
        SubAspect $subaspect = null,
        Question $question
    ) {
        $aspects    = $part->aspects()->with('subAspects')->get();
        $subaspects = $aspects->flatMap->subAspects;

        return Inertia::render('AdminQuestionEdit', [
            'evaluation'     => $evaluation,
            'part'           => $part,
            'question'       => $question->load('options'),
            'aspects'        => $aspects,
            'subaspects'     => $subaspects,
            'selectedAspect' => $question->aspect_id,
            'selectedSub'    => $question->sub_aspect_id,
            'aspect'         => $aspect,
            'subaspect'      => $subaspect,
        ]);
    }

    public function update(Request $request, Evaluation $evaluation, Part $part, Question $question)
    {
        $validated = $request->validate([
            'title'           => ['required', 'string'],
            'type'            => ['required', 'in:rating,open_text,choice,multiple_choice'],
            'aspect_id'       => ['nullable', 'exists:aspects,id'],
            'sub_aspect_id'   => ['nullable', 'exists:sub_aspects,id'],
            'options'         => ['nullable', 'array'],
            'options.*.label' => ['required_with:options', 'string'],
            'options.*.score' => $request->type === 'rating' ? ['required_with:options', 'integer'] : ['nullable'],
        ]);

        $question->update([
            'title'         => $validated['title'],
            'type'          => $validated['type'],
            'aspect_id'     => $validated['aspect_id'] ?? null,
            'sub_aspect_id' => $validated['sub_aspect_id'] ?? null,
        ]);

        // 🔄 อัปเดตตัวเลือก (ถ้ามี)
        $question->options()->delete();

        if (! in_array($validated['type'], ['open_text']) && ! empty($validated['options'])) {
            $options = collect($validated['options'])->map(function ($opt) use ($validated) {
                if ($validated['type'] !== 'rating') {
                    unset($opt['score']);
                }
                return $opt;
            })->toArray();

            $question->options()->createMany($options);
        }

        // 📍 Redirect กลับตาม context
        if ($question->sub_aspect_id) {
            return redirect()->route('questions.index.subaspect', [
                'evaluation' => $evaluation->id,
                'part'       => $part->id,
                'aspect'     => $question->aspect_id,
                'subaspect'  => $question->sub_aspect_id,
            ])->with('success', 'อัปเดตคำถามในด้านย่อยเรียบร้อยแล้ว!');
        } elseif ($question->aspect_id) {
            return redirect()->route('questions.index.aspect', [
                'evaluation' => $evaluation->id,
                'part'       => $part->id,
                'aspect'     => $question->aspect_id,
            ])->with('success', 'อัปเดตคำถามในด้านเรียบร้อยแล้ว!');
        } else {
            return redirect()->route('questions.index', [
                'evaluation' => $evaluation->id,
                'part'       => $part->id,
            ])->with('success', 'อัปเดตคำถามเรียบร้อยแล้ว!');
        }
    }

    public function destroy(Evaluation $evaluation, Part $part, Question $question)
    {
        $question->options()->delete();
        $question->delete();

        return redirect()->back()->with('success', 'ลบคำถามเรียบร้อยแล้ว');
    }
}
