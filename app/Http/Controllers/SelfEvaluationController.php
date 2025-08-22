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

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade);

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งของคุณ');
        }

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
        ])->orderBy('order')->get();
        
        // Get existing answers for this evaluation
        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->get()
            ->pluck('value', 'question_id')
            ->toArray();
            
        \Log::info('SelfEvaluationController index - existingAnswers:', $existingAnswers);

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'      => $evaluation,
            'current_part'    => $parts->first(),
            'step'            => 1,
            'total_steps'     => $parts->count(),
            'evaluatee_id'    => $user->id,
            'is_self'         => true,
            'auth'            => ['user' => $user],
            'existingAnswers' => $existingAnswers,
        ]);
    }

    public function resume(Request $request)
    {
        $user = auth()->user();

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade);

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งของคุณ');
        }

        $parts = $evaluation->parts()->with([
            'aspects.subaspects.questions.options',
            'aspects.questions.options',
            'questions.options',
        ])->orderBy('order')->get();

        // Get all existing answers for this evaluation
        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->get()
            ->keyBy('question_id');

        $stepToResume       = 1;
        $groupIndexToResume = 0;
        $foundIncomplete    = false;

        // Find the first incomplete question group
        foreach ($parts as $partIndex => $part) {
            // เตรียมกลุ่มคำถามแบบ grouped
            $groups = [];

            // Add questions from subaspects
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

                // Add questions from aspects (direct questions)
                if ($aspect->questions->isNotEmpty()) {
                    $groups[] = [
                        'type' => 'aspect',
                        'name' => $aspect->name,
                        'questions' => $aspect->questions
                    ];
                }
            }

            // Add questions from parts (direct questions)
            if ($part->questions->isNotEmpty()) {
                $groups[] = [
                    'type' => 'part',
                    'name' => $part->title,
                    'questions' => $part->questions
                ];
            }

            // Check each group for incomplete questions
            foreach ($groups as $index => $group) {
                $questionIds = $group['questions']->pluck('id');
                $answeredIds = $existingAnswers->whereIn('question_id', $questionIds->toArray())
                    ->pluck('question_id');

                $remaining = $questionIds->diff($answeredIds);

                if ($remaining->isNotEmpty()) {
                    $stepToResume       = $partIndex + 1;
                    $groupIndexToResume = $index;
                    $foundIncomplete    = true;
                    break 2; // ออกจากทั้งสอง loop
                }
            }
        }

        // If all questions are completed, redirect to dashboard
        if (!$foundIncomplete) {
            return redirect()->route('dashboard')->with('success', 'การประเมินตนเองเสร็จสมบูรณ์แล้ว');
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
            'existingAnswers'       => $existingAnswers->pluck('value', 'question_id')->toArray(),
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

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getEvaluationByGrade($user->grade);

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
        
        // Get existing answers for this evaluation
        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->get()
            ->pluck('value', 'question_id')
            ->toArray();
            
        \Log::info('SelfEvaluationController showStep - existingAnswers:', $existingAnswers);

        return Inertia::render('SelfEvaluationStep', [
            'evaluation'      => $evaluation,
            'current_part'    => $currentPart,
            'step'            => (int) $step,
            'total_steps'     => $parts->count(),
            'evaluatee_id'    => $user->id,
            'is_self'         => true,
            'auth'            => ['user' => $user],
            'existingAnswers' => $existingAnswers,
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

    /**
     * Get evaluation form based on user grade for self-evaluation
     * Uses specific evaluation forms: ID 4 for grades 9-12, ID 5 for grades 5-8
     */
    private function getEvaluationByGrade($userGrade)
    {
        $evaluationQuery = Evaluation::where('status', 'published')
            ->where('user_type', 'internal');
        
        if ($userGrade >= 9 && $userGrade <= 12) {
            // Executive level (grades 9-12) - use specific self-evaluation form (ID 4)
            $evaluation = $evaluationQuery->where('grade_min', '<=', 12)
                ->where('grade_max', '>=', 9)
                ->where('title', 'LIKE', '%ประเมินตนเอง%')
                ->first();
        } elseif ($userGrade >= 5 && $userGrade <= 8) {
            // Staff level (grades 5-8) - use specific self-evaluation form (ID 5)
            $evaluation = $evaluationQuery->where('grade_min', '<=', 8)
                ->where('grade_max', '>=', 5)
                ->where('title', 'LIKE', '%ประเมินตนเอง%')
                ->first();
        } else {
            // Fallback to original logic for other grades
            $evaluation = $evaluationQuery->where('grade_min', '<=', $userGrade)
                ->where('grade_max', '>=', $userGrade)
                ->where('title', 'LIKE', '%ประเมินตนเอง%')
                ->first();
        }

        return $evaluation;
    }
}
