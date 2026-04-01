<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EvaluationController extends Controller
{
    public function index()
    {
        $evaluations = Evaluation::with(['parts.aspects.subAspects.questions.options'])->get();

        return Inertia::render('AdminEvaluationManager', [
            'evaluations' => $evaluations,
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminEvaluationCreate', [
            'userTypes' => [
                ['value' => 'internal', 'label' => 'บุคลากรภายใน'],
                ['value' => 'external', 'label' => 'บุคลากรภายนอก'],
            ],
            'grades'    => [
                ['min' => 9, 'max' => 12],
                ['min' => 5, 'max' => 8],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'user_type'   => 'required|in:internal,external',
            'grade_min'   => 'required|integer',
            'grade_max'   => 'required|integer',
            'fiscal_year' => 'nullable|integer|min:2020|max:2100',
        ]);

        $evaluation = Evaluation::create($validated);

        // สร้าง 3 parts โดย default
        Part::insert([
            ['evaluation_id' => $evaluation->id, 'title' => 'ส่วนที่ 1', 'order' => 1],
            ['evaluation_id' => $evaluation->id, 'title' => 'ส่วนที่ 2', 'order' => 2],
            ['evaluation_id' => $evaluation->id, 'title' => 'ส่วนที่ 3', 'order' => 3],
        ]);

        return redirect()->route('evaluations.edit', ['evaluation' => $evaluation->id])
            ->with('success', 'สร้างแบบประเมินสำเร็จ');

    }

    public function edit(Evaluation $evaluation)
    {
        $evaluation->load('parts.aspects.subAspects.questions.options');

        // นับรวม
        $partsCount      = $evaluation->parts->count();
        $aspectsCount    = $evaluation->parts->flatMap->aspects->count();
        $subaspectsCount = $evaluation->parts->flatMap->aspects->flatMap->subAspects->count();
        $questionsCount  = $evaluation->parts->flatMap->aspects->flatMap->subAspects->flatMap->questions->count();
        $optionsCount    = $evaluation->parts->flatMap->aspects->flatMap->subAspects->flatMap->questions->flatMap->options->count();

        return Inertia::render('AdminEvaluationEdit', [
            'evaluation' => $evaluation,
            'stats'      => [
                'parts'      => $partsCount,
                'aspects'    => $aspectsCount,
                'subaspects' => $subaspectsCount,
                'questions'  => $questionsCount,
                'options'    => $optionsCount,
            ],
        ]);
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'user_type'   => 'required|in:internal,external',
            'grade_min'   => 'required|integer',
            'grade_max'   => 'required|integer',
            'fiscal_year' => 'nullable|integer|min:2020|max:2100',
        ]);

        $evaluation->update($validated);

        return redirect()->route('evaluations.index')->with('success', 'อัปเดตแบบประเมินสำเร็จ');
    }

    public function destroy(Evaluation $evaluation)
    {
        $evaluation->parts->each(function ($part) {
            $part->aspects->each(function ($aspect) {
                $aspect->subAspects->each(function ($subAspect) {
                    $subAspect->questions->each(fn($q) => $q->options()->delete());
                    $subAspect->questions()->delete();
                });

                $aspect->questions->each(fn($q) => $q->options()->delete());
                $aspect->questions()->delete();

                $aspect->subAspects()->delete();
            });

            $part->aspects()->delete();
        });

        $evaluation->parts()->delete();
        $evaluation->delete();

        return redirect()->route('evaluations.index')->with('success', 'ลบแบบประเมินเรียบร้อย');
    }
    public function preview(Evaluation $evaluation)
    {
        $evaluation->load([
            'parts' => fn($q) => $q->orderBy('order'),
            'parts.aspects.subAspects.questions' => fn($q) => $q->orderBy('order'),
            'parts.aspects.subAspects.questions.options',
            'parts.aspects.questions' => fn($q) => $q->orderBy('order'),
            'parts.aspects.questions.options',
        ]);

        // 🔁 mapping title fields + ensure subaspects key for frontend
        foreach ($evaluation->parts as $part) {
            foreach ($part->aspects as $aspect) {
                $aspect->title = $aspect->name;
                // Ensure 'subaspects' key exists for frontend (Laravel serializes as sub_aspects)
                $aspect->setAttribute('subaspects', $aspect->subAspects);

                if ($aspect->has_subaspects && $aspect->subAspects) {
                    foreach ($aspect->subAspects as $sub) {
                        $sub->title = $sub->name;
                    }
                }
            }
        }

        $evaluation->aspects_count    = $evaluation->parts->flatMap->aspects->count();
        $evaluation->subaspects_count = $evaluation->parts->flatMap->aspects->flatMap->subaspects->count();
        $evaluation->questions_count  = $evaluation->parts->flatMap->aspects->flatMap(function ($aspect) {
            return $aspect->has_subaspects ? $aspect->subaspects->flatMap->questions : $aspect->questions;
        })->count();
        $evaluation->options_count = $evaluation->parts->flatMap->aspects->flatMap(function ($aspect) {
            return $aspect->has_subaspects
            ? $aspect->subaspects->flatMap(fn($s) => $s->questions->flatMap->options)
            : $aspect->questions->flatMap->options;
        })->count();

        return Inertia::render('AdminEvaluationPreview', [
            'evaluation' => $evaluation,
        ]);
    }
    public function publish(Evaluation $evaluation)
    {
        if ($evaluation->status === 'published') {
            return back()->with('error', 'แบบประเมินนี้ถูกเผยแพร่แล้ว');
        }

        $evaluation->update([
            'status' => 'published',
        ]);

        return redirect()->route('evaluations.index')->with('success', 'เผยแพร่แบบประเมินเรียบร้อยแล้ว');
    }

}
