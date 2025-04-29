<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssignedEvaluationController extends Controller
{
    public function show($evaluateeId)
    {
        $user = auth()->user();

        $assignment = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->firstOrFail();

        $evaluatee = $assignment->evaluatee;

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $evaluatee->grade)
            ->where('grade_max', '>=', $evaluatee->grade)
            ->latest()
            ->firstOrFail();

        $parts = $evaluation->parts()->with([
            'aspects.questions',
            'aspects.subaspects.questions',
            'questions',
        ])->orderBy('order')->get();

        $stepToResume = 1;

        foreach ($parts as $index => $part) {
            $grouped = collect();

            foreach ($part->aspects as $aspect) {
                if ($aspect->subaspects->isNotEmpty()) {
                    foreach ($aspect->subaspects as $sub) {
                        $grouped->push($sub->questions->pluck('id'));
                    }
                }

                if ($aspect->questions->isNotEmpty()) {
                    $grouped->push($aspect->questions->pluck('id'));
                }
            }

            if ($part->questions->isNotEmpty()) {
                $grouped->prepend($part->questions->pluck('id'));
            }

            foreach ($grouped as $gIndex => $qIds) {
                $answered = Answer::where('evaluation_id', $evaluation->id)
                    ->where('user_id', $user->id)
                    ->where('evaluatee_id', $evaluateeId)
                    ->whereIn('question_id', $qIds)
                    ->pluck('question_id');

                if ($qIds->diff($answered)->isNotEmpty()) {
                    return redirect()->route('assigned-evaluations.questions', [
                        'evaluatee' => $evaluateeId,
                        'step'      => $index + 1,
                        'group'     => $gIndex,
                    ]);
                }
            }
        }

        // ถ้าทำครบทุกกลุ่ม
        return redirect()->route('assigned-evaluations.questions', [
            'evaluatee' => $evaluateeId,
            'step'      => 1,
            'group'     => 0,
        ]);
    }

    public function step($evaluateeId, $step, Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'part_id'       => 'required|exists:parts,id',
            'answers'       => 'required|array',
        ]);

        // ✅ บันทึกคำตอบ
        foreach ($data['answers'] as $question_id => $value) {
            Answer::updateOrCreate(
                [
                    'evaluation_id' => $data['evaluation_id'],
                    'user_id'       => $user->id,
                    'evaluatee_id'  => $evaluateeId,
                    'question_id'   => $question_id,
                ],
                [
                    'value' => is_array($value) ? json_encode($value) : $value,
                ]
            );
        }

        // ✅ โหลดคำถามทั้งหมด
        $evaluation = Evaluation::with('parts.aspects.subaspects.questions', 'parts.aspects.questions', 'parts.questions')
            ->findOrFail($data['evaluation_id']);

        $questionIds = collect();

        foreach ($evaluation->parts as $part) {
            $questionIds = $questionIds
                ->merge($part->questions->pluck('id'))
                ->merge($part->aspects->flatMap(fn($aspect) => $aspect->questions->pluck('id')))
                ->merge($part->aspects->flatMap(fn($aspect) =>
                    optional($aspect->subaspects)->flatMap(fn($sub) => $sub->questions->pluck('id')) ?? collect()
                ));
        }

        $questionIds = $questionIds->unique()->filter();

        $answeredCount = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->whereIn('question_id', $questionIds)
            ->count();

        $totalQuestions = $questionIds->count();
        $progress       = $totalQuestions > 0 ? round(($answeredCount / $totalQuestions) * 100, 2) : 0;

        return response()->json(['success' => true]);
    }

    public function showStep($evaluateeId, $step, Request $request)
    {
        $user = auth()->user();

        $assignment = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->firstOrFail();

        $evaluatee = $assignment->evaluatee;

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $evaluatee->grade)
            ->where('grade_max', '>=', $evaluatee->grade)
            ->latest()
            ->firstOrFail();

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
            'questions.options',
        ])->orderBy('order')->get();

        $currentPart = $parts->get($step - 1);

        if (! $currentPart) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบตอนที่ต้องการ');
        }
        $groupIndex = 0;
        $allGroups  = collect();

        foreach ($currentPart->aspects as $aspect) {
            foreach ($aspect->subaspects ?? [] as $sub) {
                $allGroups->push([
                    'subaspect_id' => $sub->id,
                    'question_ids' => $sub->questions->pluck('id'),
                ]);
            }

            if ($aspect->questions->isNotEmpty()) {
                $allGroups->push([
                    'subaspect_id' => null,
                    'question_ids' => $aspect->questions->pluck('id'),
                ]);
            }
        }

        foreach ($allGroups as $i => $group) {
            $answered = Answer::where('evaluation_id', $evaluation->id)
                ->where('user_id', $user->id)
                ->where('evaluatee_id', $evaluateeId)
                ->whereIn('question_id', $group['question_ids'])
                ->pluck('question_id');

            if ($group['question_ids']->diff($answered)->isNotEmpty()) {
                $groupIndex = $i;
                break;
            }
        }
        return Inertia::render('AssignedEvaluationStep', [
            'evaluation'   => $evaluation,
            'current_part' => $currentPart,
            'step'         => (int) $step,
            'total_steps'  => $parts->count(),
            'evaluatee_id' => $evaluatee->id,
            'is_self'      => false,
            'auth'         => ['user' => $user],
            'groupIndex'    => $groupIndex,
        ]);
    }

}
