<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SelfEvaluationController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $user->grade)
            ->where('grade_max', '>=', $user->grade)
            ->latest()
            ->firstOrFail();

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
        ])->orderBy('order')->get();

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'   => $evaluation,
            'current_part' => $parts->first(),
            'step'         => 1,
            'total_steps'  => $parts->count(),
        ]);
    }

    public function resume(Request $request)
    {
        $user = auth()->user();

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $user->grade)
            ->where('grade_max', '>=', $user->grade)
            ->latest()
            ->firstOrFail();

        $parts = $evaluation->parts()->with([
            'aspects.subaspects.questions.options',
            'aspects.questions.options',
            'questions.options',
        ])->orderBy('order')->get();

        $stepToResume       = 1;
        $groupIndexToResume = 0;

        foreach ($parts as $partIndex => $part) {
            // เตรียมกลุ่มคำถามแบบ grouped
            $groups = [];

            foreach ($part->aspects as $aspect) {
                foreach ($aspect->subaspects ?? [] as $sub) {
                    $groups[] = $sub->questions;
                }

                if ($aspect->questions->isNotEmpty()) {
                    $groups[] = $aspect->questions;
                }
            }

            foreach ($groups as $index => $group) {
                $questionIds = $group->pluck('id');
                $answeredIds = Answer::where('evaluation_id', $evaluation->id)
                    ->where('user_id', $user->id)
                    ->where('evaluatee_id', $user->id)
                    ->whereIn('question_id', $questionIds)
                    ->pluck('question_id');

                $remaining = $questionIds->diff($answeredIds);

                if ($remaining->isNotEmpty()) {
                    $stepToResume       = $partIndex + 1;
                    $groupIndexToResume = $index;
                    break 2; // ออกจากทั้งสอง loop
                }
            }
        }

        $currentPart = $parts->get($stepToResume - 1);

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'            => $evaluation,
            'current_part'          => $currentPart,
            'step'                  => $stepToResume,
            'total_steps'           => $parts->count(),
            'group_index_to_resume' => $groupIndexToResume,
            'evaluatee_id'          => $user->id,
            'is_self'               => true,
            'auth'                  => ['user' => $user],
        ]);
    }

    public function step($step, Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'part_id'       => 'required|exists:parts,id',
            'answers'       => 'required|array',
        ]);

        $evaluateeId = $request->get('evaluatee_id') ?? $user->id;

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

        return response()->json(['success' => true]);
    }

    public function showStep($step, Request $request)
    {
        $user = auth()->user();

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $user->grade)
            ->where('grade_max', '>=', $user->grade)
            ->latest()
            ->firstOrFail();

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
        ])->orderBy('order')->get();

        $currentPart = $parts->get($step - 1);

        if (! $currentPart) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบตอนที่ต้องการ');
        }

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'   => $evaluation,
            'current_part' => $currentPart,
            'step'         => (int) $step,
            'total_steps'  => $parts->count(),
            'evaluatee_id' => $user->id,
            'is_self'      => true,
            'auth'         => ['user' => $user],
        ]);
    }

    public function submit(Request $request)
    {
        $userId       = auth()->id();
        $evaluationId = $request->get('evaluation_id');
        $evaluateeId  = $request->get('evaluatee_id') ?? $userId;

        $data = $request->validate([
            'answers'               => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.value'       => 'nullable',
        ]);

        foreach ($data['answers'] as $answerData) {
            Answer::updateOrCreate(
                [
                    'evaluation_id' => $evaluationId,
                    'user_id'       => $userId,
                    'evaluatee_id'  => $evaluateeId,
                    'question_id'   => $answerData['question_id'],
                ],
                [
                    'value' => $answerData['value'],
                ]
            );
        }

        return redirect()->route('dashboard')->with('success', 'บันทึกผลเรียบร้อยแล้ว');
    }
}
