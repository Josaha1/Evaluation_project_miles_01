<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\EvaluationLookupService;

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

    public function index(Request $request)
    {
        $user = auth()->user();
        $fiscalYear = $this->getFiscalYear($request);

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade, $fiscalYear);

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งของคุณ');
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
            ->pluck('value', 'question_id')
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
            ->pluck('value', 'question_id')
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

        $upsertData = [];
        foreach ($data['answers'] as $question_id => $value) {
            $upsertData[] = [
                'evaluation_id' => $data['evaluation_id'],
                'user_id'       => $user->id,
                'evaluatee_id'  => $evaluateeId,
                'question_id'   => $question_id,
                'value'         => is_array($value) ? json_encode($value) : $value,
                'fiscal_year'   => $fiscalYear,
                'updated_at'    => now(),
                'created_at'    => now(),
            ];
        }

        Answer::upsert(
            $upsertData,
            ['evaluation_id', 'user_id', 'evaluatee_id', 'question_id'],
            ['value', 'fiscal_year', 'updated_at']
        );

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
            ->pluck('value', 'question_id')
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

        $upsertData = [];
        foreach ($data['answers'] as $answerData) {
            $upsertData[] = [
                'evaluation_id' => $evaluationId,
                'user_id'       => $userId,
                'evaluatee_id'  => $evaluateeId,
                'question_id'   => $answerData['question_id'],
                'value'         => $answerData['value'],
                'fiscal_year'   => $fiscalYear,
                'updated_at'    => now(),
                'created_at'    => now(),
            ];
        }
        Answer::upsert(
            $upsertData,
            ['evaluation_id', 'user_id', 'evaluatee_id', 'question_id'],
            ['value', 'fiscal_year', 'updated_at']
        );

        return redirect()->route('dashboard')->with('success', 'บันทึกผลเรียบร้อยแล้ว');
    }

    /**
     * Get evaluation form based on user grade for self-evaluation
     */
    private function getEvaluationByGrade($userGrade, ?int $fiscalYear = null)
    {
        return EvaluationLookupService::findSelfEvalByGrade((int) $userGrade, $fiscalYear);
    }
}
