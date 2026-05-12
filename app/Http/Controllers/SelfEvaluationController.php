<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\EvaluationLookupService;
use App\Support\AnswerNormalizer;

class SelfEvaluationController extends Controller
{
    /**
     * Get fiscal year from request or fallback to current fiscal year (Oct-Sep)
     */
    private function getFiscalYear(Request $request): int
    {
        if ($request->has('fiscal_year') && $request->fiscal_year) {
            return (int) $request->fiscal_year;
        }
        return EvaluationLookupService::currentFiscalYear();
    }

    /**
     * Lock once the user has explicitly submitted AND answers still exist.
     * ถ้า answer ถูก reset (admin ลบ) → ปลดล็อคให้ทำใหม่ได้ ไม่ให้ submitted_at
     * เก่าค้างจน stuck (เคยเกิด: ลบ answers fy=2026 แต่ submitted_at ยังอยู่)
     */
    private function isSelfEvalSubmitted(int $userId, int $fiscalYear): bool
    {
        $assignment = EvaluationAssignment::where('evaluator_id', $userId)
            ->where('evaluatee_id', $userId)
            ->where('angle', 'self')
            ->where('fiscal_year', $fiscalYear)
            ->whereNotNull('submitted_at')
            ->first(['evaluation_id']);

        if (!$assignment) return false;

        return Answer::where('user_id', $userId)
            ->where('evaluatee_id', $userId)
            ->where('evaluation_id', $assignment->evaluation_id)
            ->where('fiscal_year', $fiscalYear)
            ->exists();
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $fiscalYear = $this->getFiscalYear($request);

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade, $fiscalYear);

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งของคุณ');
        }

        if ($this->isSelfEvalSubmitted($user->id, $fiscalYear)) {
            return redirect()->route('dashboard')->with('error', 'คุณได้ส่งแบบประเมินตนเองแล้ว ไม่สามารถแก้ไขได้');
        }

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
        ])->orderBy('order')->get();

        // Get existing answers for this evaluation (filtered by fiscal year)
        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->mapWithKeys(function ($a) {
                $value = $a->value;
                // Decode JSON arrays for multi-choice
                if (is_string($value) && str_starts_with($value, '[') && str_ends_with($value, ']')) {
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) $value = $decoded;
                }
                if ($a->other_text) {
                    return [$a->question_id => ['value' => $value, 'other_text' => $a->other_text]];
                }
                return [$a->question_id => $value];
            })
            ->toArray();

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'      => $evaluation,
            'current_part'    => $parts->first(),
            'step'            => 1,
            'total_steps'     => $parts->count(),
            'evaluatee_id'    => $user->id,
            'is_self'         => true,
            'auth'            => ['user' => $user],
            'existingAnswers' => $existingAnswers,
            'fiscal_year'     => $fiscalYear,
        ]);
    }

    public function resume(Request $request)
    {
        $user = auth()->user();
        $fiscalYear = $this->getFiscalYear($request);

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade, $fiscalYear);

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งของคุณ');
        }

        if ($this->isSelfEvalSubmitted($user->id, $fiscalYear)) {
            return redirect()->route('dashboard')->with('error', 'คุณได้ส่งแบบประเมินตนเองแล้ว ไม่สามารถแก้ไขได้');
        }

        $parts = $evaluation->parts()->with([
            'aspects.subaspects.questions.options',
            'aspects.questions.options',
            'questions.options',
        ])->orderBy('order')->get();

        // Get answered question IDs for resume logic (only need IDs, not full models)
        $answeredQuestionIds = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->where('fiscal_year', $fiscalYear)
            ->pluck('question_id');

        $stepToResume       = 1;
        $groupIndexToResume = 0;
        $foundIncomplete    = false;

        // Find the first incomplete question group
        foreach ($parts as $partIndex => $part) {
            $groups = [];

            foreach ($part->aspects as $aspect) {
                foreach ($aspect->subaspects ?? [] as $sub) {
                    if ($sub->questions->isNotEmpty()) {
                        $groups[] = [
                            'type' => 'subaspect',
                            'name' => $sub->name,
                            'questions' => $sub->questions
                        ];
                    }
                }

                if ($aspect->questions->isNotEmpty()) {
                    $groups[] = [
                        'type' => 'aspect',
                        'name' => $aspect->name,
                        'questions' => $aspect->questions
                    ];
                }
            }

            if ($part->questions->isNotEmpty()) {
                $groups[] = [
                    'type' => 'part',
                    'name' => $part->title,
                    'questions' => $part->questions
                ];
            }

            foreach ($groups as $index => $group) {
                $questionIds = $group['questions']->pluck('id');
                $remaining = $questionIds->diff($answeredQuestionIds);

                if ($remaining->isNotEmpty()) {
                    $stepToResume       = $partIndex + 1;
                    $groupIndexToResume = $index;
                    $foundIncomplete    = true;
                    break 2;
                }
            }
        }

        if (!$foundIncomplete) {
            return redirect()->route('dashboard')->with('success', 'การประเมินตนเองเสร็จสมบูรณ์แล้ว');
        }

        $currentPart = $parts->get($stepToResume - 1);

        // Load answer values only for the page render (separate lean query)
        $existingAnswerValues = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->mapWithKeys(function ($a) {
                $value = $a->value;
                if (is_string($value) && str_starts_with($value, '[') && str_ends_with($value, ']')) {
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) $value = $decoded;
                }
                if ($a->other_text) {
                    return [$a->question_id => ['value' => $value, 'other_text' => $a->other_text]];
                }
                return [$a->question_id => $value];
            })
            ->toArray();

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'            => $evaluation,
            'current_part'          => $currentPart,
            'step'                  => $stepToResume,
            'total_steps'           => $parts->count(),
            'group_index_to_resume' => $groupIndexToResume,
            'evaluatee_id'          => $user->id,
            'is_self'               => true,
            'auth'                  => ['user' => $user],
            'existingAnswers'       => $existingAnswerValues,
            'fiscal_year'           => $fiscalYear,
        ]);
    }

    public function step($step, Request $request)
    {
        $user = auth()->user();
        $fiscalYear = $this->getFiscalYear($request);

        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'part_id'       => 'required|exists:parts,id',
            'answers'       => 'required|array',
        ]);

        $evaluateeId = $request->get('evaluatee_id') ?? $user->id;

        // DELETE+INSERT: wipe every question in payload, then insert fresh rows.
        // Guarantees no stale columns (other_text, value, etc.) leak across saves.
        $questionIds = array_keys($data['answers']);
        Answer::where('evaluation_id', $data['evaluation_id'])
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->whereIn('question_id', $questionIds)
            ->delete();

        $insertData = [];
        foreach ($data['answers'] as $question_id => $value) {
            ['value' => $finalValue, 'other_text' => $otherText] = AnswerNormalizer::normalize($value);

            // Skip empty (already deleted above)
            if ($finalValue === null || $finalValue === ''
                || (is_array($finalValue) && count($finalValue) === 0)) {
                continue;
            }

            $insertData[] = [
                'evaluation_id' => $data['evaluation_id'],
                'user_id'       => $user->id,
                'evaluatee_id'  => $evaluateeId,
                'question_id'   => $question_id,
                'value'         => is_array($finalValue) ? json_encode($finalValue) : $finalValue,
                'other_text'    => $otherText,
                'fiscal_year'   => $fiscalYear,
                'updated_at'    => now(),
                'created_at'    => now(),
            ];
        }

        if (!empty($insertData)) {
            Answer::insert($insertData);
        }

        return response()->json(['success' => true]);
    }

    public function showStep($step, Request $request)
    {
        $user = auth()->user();
        $fiscalYear = $this->getFiscalYear($request);

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade, $fiscalYear);

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งของคุณ');
        }

        // No completion lock here — user is mid-flow navigating between parts.
        // Lock applies only at entry points (index/resume) so dashboard re-entry is blocked
        // but step-to-step transitions (e.g. last part being open_text) work freely.

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
        ])->orderBy('order')->get();

        $currentPart = $parts->get($step - 1);

        if (! $currentPart) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบตอนที่ต้องการ');
        }

        // Get existing answers for this evaluation (filtered by fiscal year)
        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->mapWithKeys(function ($a) {
                $value = $a->value;
                // Decode JSON arrays for multi-choice
                if (is_string($value) && str_starts_with($value, '[') && str_ends_with($value, ']')) {
                    $decoded = json_decode($value, true);
                    if (is_array($decoded)) $value = $decoded;
                }
                if ($a->other_text) {
                    return [$a->question_id => ['value' => $value, 'other_text' => $a->other_text]];
                }
                return [$a->question_id => $value];
            })
            ->toArray();

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'      => $evaluation,
            'current_part'    => $currentPart,
            'step'            => (int) $step,
            'total_steps'     => $parts->count(),
            'evaluatee_id'    => $user->id,
            'is_self'         => true,
            'auth'            => ['user' => $user],
            'existingAnswers' => $existingAnswers,
            'fiscal_year'     => $fiscalYear,
        ]);
    }

    public function submit(Request $request)
    {
        $userId       = auth()->id();
        $evaluationId = $request->get('evaluation_id');
        $evaluateeId  = $request->get('evaluatee_id') ?? $userId;
        $fiscalYear   = $this->getFiscalYear($request);

        $data = $request->validate([
            'answers'               => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.value'       => 'nullable',
        ]);

        // DELETE+INSERT to wipe stale columns
        $questionIds = array_map(fn($a) => $a['question_id'], $data['answers']);
        Answer::where('evaluation_id', $evaluationId)
            ->where('user_id', $userId)
            ->where('evaluatee_id', $evaluateeId)
            ->whereIn('question_id', $questionIds)
            ->delete();

        $insertData = [];
        foreach ($data['answers'] as $answerData) {
            ['value' => $value, 'other_text' => $otherText] = AnswerNormalizer::normalize($answerData['value']);

            if ($value === null || $value === '' || (is_array($value) && count($value) === 0)) {
                continue;
            }
            if (is_array($value)) {
                $value = json_encode($value);
            }

            $insertData[] = [
                'evaluation_id' => $evaluationId,
                'user_id'       => $userId,
                'evaluatee_id'  => $evaluateeId,
                'question_id'   => $answerData['question_id'],
                'value'         => $value,
                'other_text'    => $otherText,
                'fiscal_year'   => $fiscalYear,
                'updated_at'    => now(),
                'created_at'    => now(),
            ];
        }
        if (!empty($insertData)) {
            Answer::insert($insertData);
        }

        // Mark this self-eval as submitted — locks the form against further edits
        EvaluationAssignment::updateOrCreate(
            [
                'evaluator_id' => $userId,
                'evaluatee_id' => $evaluateeId,
                'fiscal_year'  => $fiscalYear,
                'angle'        => 'self',
            ],
            [
                'evaluation_id' => $evaluationId,
                'submitted_at'  => now(),
            ]
        );

        return redirect()->route('dashboard')->with('success', 'ส่งแบบประเมินเรียบร้อยแล้ว');
    }

    /**
     * Get evaluation form based on user grade for self-evaluation
     */
    private function getEvaluationByGrade($userGrade, ?int $fiscalYear = null)
    {
        return EvaluationLookupService::findSelfEvalByGrade((int) $userGrade, $fiscalYear);
    }
}
