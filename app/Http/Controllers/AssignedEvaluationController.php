<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Services\EvaluationLookupService;
use App\Support\AnswerNormalizer;
class AssignedEvaluationController extends Controller
{
    public function show($evaluateeId, Request $request)
    {
        $user = auth()->user();

        $query = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId);

        // If fiscal_year specified, filter by it; otherwise get latest
        if ($request->has('fiscal_year') && $request->fiscal_year) {
            $query->where('fiscal_year', (int) $request->fiscal_year);
        } else {
            $query->orderByDesc('fiscal_year');
        }

        $assignment = $query->firstOrFail();

        $evaluatee = $assignment->evaluatee;

        // Use evaluation from assignment first (preserves correct form for the fiscal year)
        $evaluation = null;
        if ($assignment->evaluation_id) {
            $evaluation = Evaluation::where('id', $assignment->evaluation_id)
                ->where('status', 'published')
                ->first();
        }
        // Fallback: find by grade + fiscal year from assignment
        if (!$evaluation) {
            $targetGrade = (int) $evaluatee->grade;
            $assignmentFiscalYear = $assignment->fiscal_year ? (int) $assignment->fiscal_year : null;
            $evaluation = EvaluationLookupService::findByGrade($targetGrade, $evaluatee->user_type ?? 'internal', $assignmentFiscalYear);
        }

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งนี้');
        }

        // Lock once user has explicitly submitted (any angle row for this evaluator-evaluatee-fy)
        $isSubmitted = EvaluationAssignment::where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereNotNull('submitted_at')
            ->exists();
        if ($isSubmitted) {
            return redirect()->route('dashboard')->with('error', 'คุณได้ส่งแบบประเมินนี้แล้ว ไม่สามารถแก้ไขได้');
        }

        $parts = $evaluation->parts()->with([
            'aspects.questions',
            'aspects.subaspects.questions',
            'questions',
        ])->orderBy('order')->get();

        // ✅ รวบรวมคำถามทั้งหมดของแบบประเมิน
        $allQuestionIds = collect();
        foreach ($parts as $part) {
            $allQuestionIds = $allQuestionIds
                ->merge($part->questions->pluck('id'))
                ->merge($part->aspects->flatMap(fn($aspect) => $aspect->questions->pluck('id')))
                ->merge($part->aspects->flatMap(fn($aspect) =>
                    optional($aspect->subaspects)->flatMap(fn($sub) => $sub->questions->pluck('id')) ?? collect()
                ));
        }

        $allQuestionIds = $allQuestionIds->unique()->filter();

        $answeredCount = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereIn('question_id', $allQuestionIds)
            ->count();

        if ($answeredCount === $allQuestionIds->count()) {
            // ✅ ตอบครบแล้ว ส่งกลับหน้ารวม
            return redirect()->route('dashboard', ['fiscal_year' => $assignment->fiscal_year])->with('success', 'ประเมินเสร็จสมบูรณ์แล้ว');
        }

        // ⛔ ถ้ายังไม่ครบ หาหัวข้อล่าสุดที่ประเมินแล้วจริงๆ (รองรับการประเมินหลายคน)
        
        // Get all assignments for this evaluator in the same fiscal year
        // Exclude self-eval rows — those go through /evaluations/self, not assigned-eval
        $allAssignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')
            ->get();

        $targetGrade = $evaluatee->grade;
        $targetEvalId = (int) $evaluation->id;

        // Group evaluatees by which FORM they're assigned to (not by personal grade) —
        // ensures grade-overrides (e.g. user grade 9 assigned to a 4-8 form) batch with
        // the form's group, not their natural grade group. Falls back to grade-group when
        // assignment->evaluation_id is missing (legacy rows).
        $filteredEvaluatees = $allAssignments->filter(function ($a) use ($targetEvalId, $targetGrade) {
            $aEvalId = (int) ($a->evaluation_id ?? 0);
            if ($aEvalId > 0 && $targetEvalId > 0) {
                return $aEvalId === $targetEvalId;
            }
            return EvaluationLookupService::isSameGradeGroup($targetGrade, (int) $a->evaluatee->grade);
        });

        // Get IDs of evaluatees in the same grade range
        $sameRangeEvaluateeIds = $filteredEvaluatees->pluck('evaluatee_id')->toArray();
        
        // Keep compatibility with existing system
        $sameAngleEvaluateeIds = $this->getEvaluateeIdsInSameAngle($user->id, $evaluateeId, $evaluation->id);

        // Use the already loaded assignment
        $currentAssignment = $assignment;

        // BATCH: Load ALL answers for this user + evaluation + all evaluatees in ONE query (filtered by fiscal year)
        $allAnsweredSet = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereIn('evaluatee_id', $sameRangeEvaluateeIds)
            ->select('evaluatee_id', 'question_id')
            ->get()
            ->map(fn($a) => $a->evaluatee_id . '_' . $a->question_id)
            ->flip();

        $lastCompletedStep  = 1;
        $lastCompletedGroup = 0;
        $hasAnyAnswers      = $allAnsweredSet->isNotEmpty();
        $foundIncompleteGroup = false;

        foreach ($parts as $partIndex => $part) {
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

            foreach ($grouped as $groupIndex => $questionIds) {
                $allAnswered = true;
                $hasPartialAnswers = false;

                // In-memory check using pre-loaded answer set (no DB queries!)
                foreach ($questionIds as $questionId) {
                    foreach ($sameRangeEvaluateeIds as $evalId) {
                        if ($allAnsweredSet->has($evalId . '_' . $questionId)) {
                            $hasPartialAnswers = true;
                        } else {
                            $allAnswered = false;
                        }
                    }
                }

                if ($allAnswered) {
                    $lastCompletedStep = $partIndex + 1;
                    $lastCompletedGroup = $groupIndex;
                } else {
                    if (!$foundIncompleteGroup) {
                        $foundIncompleteGroup = true;

                        if (!$hasAnyAnswers) {
                            return redirect()->route('assigned-evaluations.questions', [
                                'evaluatee' => $evaluateeId,
                                'step'      => 1,
                                'group'     => 0,
                            'fiscal_year' => $assignment->fiscal_year,
                        ]);
                        }
                        
                        if ($hasPartialAnswers) {
                            return redirect()->route('assigned-evaluations.questions', [
                                'evaluatee' => $evaluateeId,
                                'step'      => $partIndex + 1,
                                'group'     => $groupIndex,
                                'fiscal_year' => $assignment->fiscal_year,
                            ]);
                        }
                        
                        return redirect()->route('assigned-evaluations.questions', [
                            'evaluatee' => $evaluateeId,
                            'step'      => $partIndex + 1,
                            'group'     => $groupIndex,
                        'fiscal_year' => $assignment->fiscal_year,
                        ]);
                    }
                }
            }
        }

        return redirect()->route('dashboard', ['fiscal_year' => $assignment->fiscal_year])->with('success', 'การประเมินเสร็จสมบูรณ์แล้ว');
    }

    public function step($evaluateeId, $step, Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'part_id'       => 'required|exists:parts,id',
            'answers'       => 'required|array',
            'answers.*'     => 'nullable', // Allow various answer formats
        ]);

        // Get fiscal_year from request first, then from assignment, then fallback to current
        if ($request->has('fiscal_year') && $request->fiscal_year) {
            $fiscalYear = (int) $request->fiscal_year;
        } else {
            $currentAssignment = EvaluationAssignment::where('evaluator_id', $user->id)
                ->where('evaluatee_id', $evaluateeId)
                ->orderByDesc('fiscal_year')
                ->first();
            $fiscalYear = $currentAssignment ? $currentAssignment->fiscal_year : EvaluationLookupService::currentFiscalYear();
        }

        // บันทึกคำตอบ - รองรับทุกประเภทคำถามและหลายคน
        $savedAnswersCount = 0;
        $errors = [];
        
        foreach ($data['answers'] as $key => $value) {
            try {
                // Check if this is a multi-evaluatee answer (format: questionId_evaluateeId)
                // Use array_key_exists (not isset) so null values still hit this branch — null means "uncheck"
                if (is_array($value) && isset($value['question_id']) && isset($value['evaluatee_id']) && array_key_exists('value', $value)) {
                    // Multi-evaluatee envelope: {question_id, evaluatee_id, value, other_text?}
                    $rowEvaluateeId = $value['evaluatee_id'];
                    $rowQuestionId = $value['question_id'];
                    ['value' => $answerValue, 'other_text' => $otherText] = AnswerNormalizer::normalize($value['value']);
                    if (!empty($value['other_text']) && $otherText === null) {
                        $otherText = $value['other_text'];
                    }
                } else {
                    // Traditional single-evaluatee format
                    $rowEvaluateeId = $evaluateeId;
                    $rowQuestionId = $key;
                    ['value' => $answerValue, 'other_text' => $otherText] = AnswerNormalizer::normalize($value);
                }

                // DELETE+INSERT: always wipe stale row first so no stale columns leak
                Answer::where('evaluation_id', $data['evaluation_id'])
                    ->where('user_id', $user->id)
                    ->where('evaluatee_id', $rowEvaluateeId)
                    ->where('question_id', $rowQuestionId)
                    ->delete();

                // Skip insert if uncheck (empty value)
                if ($answerValue === null || $answerValue === '' || (is_array($answerValue) && count($answerValue) === 0)) {
                    $savedAnswersCount++;
                    continue;
                }

                $finalValue = is_array($answerValue) ? json_encode($answerValue) : $answerValue;

                Answer::create([
                    'evaluation_id' => $data['evaluation_id'],
                    'user_id'       => $user->id,
                    'evaluatee_id'  => $rowEvaluateeId,
                    'question_id'   => $rowQuestionId,
                    'value'         => $finalValue,
                    'other_text'    => $otherText,
                    'fiscal_year'   => $fiscalYear,
                ]);

                $savedAnswersCount++;
                
            } catch (\Exception $e) {
                $errors[] = [
                    'key' => $key,
                    'error' => $e->getMessage(),
                    'value' => $value
                ];
                \Log::error("Failed to save answer", [
                    'key' => $key,
                    'value' => $value,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        // โหลดคำถามทั้งหมด
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

        // Use distinct question_id to avoid double-counting (multi-row per question)
        $answeredCount = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $fiscalYear)
            ->whereIn('question_id', $questionIds)
            ->distinct('question_id')
            ->count('question_id');

        $totalQuestions = $questionIds->count();
        $progress       = $totalQuestions > 0 ? min(100, round(($answeredCount / $totalQuestions) * 100, 2)) : 0;

        // Check if evaluation is completed for all evaluatees in the same angle
        $sameAngleEvaluateeIds = $this->getEvaluateeIdsInSameAngle($user->id, $evaluateeId, $data['evaluation_id']);

        // Calculate overall completion — count distinct (evaluatee, question) pairs
        $totalExpectedAnswers = $totalQuestions * count($sameAngleEvaluateeIds);
        $totalActualAnswers = Answer::where('evaluation_id', $data['evaluation_id'])
            ->where('user_id', $user->id)
            ->where('fiscal_year', $fiscalYear)
            ->whereIn('evaluatee_id', $sameAngleEvaluateeIds)
            ->whereIn('question_id', $questionIds)
            ->select('evaluatee_id', 'question_id')->distinct()
            ->get()->count();

        $overallProgress = $totalExpectedAnswers > 0 ? min(100, round(($totalActualAnswers / $totalExpectedAnswers) * 100, 2)) : 0;
        $isCompleted = $totalActualAnswers >= $totalExpectedAnswers;
        
        return response()->json([
            'success' => true,
            'progress' => $overallProgress,
            'answered_count' => $totalActualAnswers,
            'total_questions' => $totalExpectedAnswers,
            'evaluatees_count' => count($sameAngleEvaluateeIds),
            'individual_progress' => $progress,
            'is_completed' => $isCompleted,
            'saved_answers_count' => $savedAnswersCount,
            'errors_count' => count($errors),
            'errors' => $errors,
            'message' => $isCompleted ? 'การประเมินเสร็จสมบูรณ์แล้ว' : 
                        ($savedAnswersCount > 0 ? "บันทึกคำตอบเรียบร้อยแล้ว ({$savedAnswersCount} รายการ)" : 'ไม่มีข้อมูลที่บันทึก'),
            'debug_info' => [
                'same_angle_evaluatees' => count($sameAngleEvaluateeIds),
                'evaluation_id' => $data['evaluation_id'],
                'step' => $step,
                'user_id' => $user->id
            ]
        ]);
    }
    /**
     * Mark assignment(s) as submitted for the given evaluatee+fiscal_year.
     * Locks the form against further edits.
     */
    public function submit($evaluateeId, Request $request)
    {
        $user = auth()->user();
        $fiscalYear = $request->has('fiscal_year') && $request->fiscal_year
            ? (int) $request->fiscal_year
            : EvaluationLookupService::currentFiscalYear();

        EvaluationAssignment::where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $fiscalYear)
            ->whereNull('submitted_at')
            ->update(['submitted_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function getExistingAnswers($evaluateeId, $evaluationId)
    {
        $user = auth()->user();

        // Get fiscal year from assignment
        $assignment = EvaluationAssignment::where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->orderByDesc('fiscal_year')
            ->first();
        $fiscalYear = $assignment ? $assignment->fiscal_year : EvaluationLookupService::currentFiscalYear();

        $answers = Answer::where('evaluation_id', $evaluationId)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->mapWithKeys(function ($answer) {
                $value = $answer->value;

                // ถ้ามี other_text ให้สร้าง object
                if ($answer->other_text) {
                    try {
                        $decodedValue = json_decode($value, true);
                        if (is_array($decodedValue)) {
                            // multiple choice case
                            return [$answer->question_id => $decodedValue];
                        } else {
                            // single choice case
                            return [$answer->question_id => [
                                'option_id'  => null, // จะต้องหา option_id จากข้อมูล
                                'other_text' => $answer->other_text,
                            ]];
                        }
                    } catch (\Exception $e) {
                        return [$answer->question_id => $answer->other_text];
                    }
                }

                // ถ้าไม่มี other_text ให้ใช้ value ปกติ
                try {
                    $decodedValue = json_decode($value, true);
                    return [$answer->question_id => $decodedValue ?? $value];
                } catch (\Exception $e) {
                    return [$answer->question_id => $value];
                }
            });

        return response()->json($answers);
    }

    /**
     * Get peer comparison data for the same angle and evaluation
     */
    public function getPeerComparison($evaluateeId)
    {
        $user = auth()->user();

        // ดึงข้อมูล assignment ของผู้ประเมินปัจจุบัน
        $currentAssignment = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->firstOrFail();

        $evaluatee    = $currentAssignment->evaluatee;
        $currentAngle = $currentAssignment->angle;

        // หา evaluation ที่เหมาะสม
        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', $evaluatee->user_type)
            ->where('grade_min', '<=', $evaluatee->grade)
            ->where('grade_max', '>=', $evaluatee->grade)
            ->latest()
            ->firstOrFail();

        // ดึงรายชื่อผู้ถูกประเมินอื่นๆ ในองศาเดียวกันที่ผู้ประเมินคนนี้ประเมิน - รวม evaluation_id filter
        $peerAssignments = EvaluationAssignment::with(['evaluatee.position', 'evaluatee.department', 'evaluatee.division'])
            ->where('evaluator_id', $user->id)
            ->where('angle', $currentAngle)
            ->where('evaluation_id', $evaluation->id)
            ->where('evaluatee_id', '!=', $evaluateeId) // ไม่รวมคนที่กำลังประเมินอยู่
            ->get();

        $peerComparisons = [];

        foreach ($peerAssignments as $assignment) {
            $peerEvaluatee = $assignment->evaluatee;

            // คำนวณคะแนนรวมของ peer
            $totalScore       = $this->calculateTotalScore($evaluation->id, $user->id, $peerEvaluatee->id);
            $maxPossibleScore = $this->calculateMaxPossibleScore($evaluation->id);

            $scorePercentage = $maxPossibleScore > 0 ? round(($totalScore / $maxPossibleScore) * 100, 2) : 0;

            // ตรวจสอบสถานะการประเมิน
            $isCompleted = $this->isEvaluationCompleted($evaluation->id, $user->id, $peerEvaluatee->id);

            $peerComparisons[] = [
                'id'               => $peerEvaluatee->id,
                'name'             => $peerEvaluatee->fname . ' ' . $peerEvaluatee->lname,
                'position'         => $peerEvaluatee->position ? $peerEvaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                'department'       => $peerEvaluatee->department ? $peerEvaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                'division'         => $peerEvaluatee->division ? $peerEvaluatee->division->name : 'ไม่ระบุสายงาน',
                'grade'            => $peerEvaluatee->grade,
                'total_score'      => $totalScore,
                'max_score'        => $maxPossibleScore,
                'score_percentage' => $scorePercentage,
                'is_completed'     => $isCompleted,
                'angle'            => $currentAngle,
            ];
        }

        // เรียงลำดับตามคะแนนจากสูงไปต่ำ
        usort($peerComparisons, function ($a, $b) {
            return $b['score_percentage'] <=> $a['score_percentage'];
        });

        // คำนวณคะแนนของคนที่กำลังประเมิน
        $currentScore           = $this->calculateTotalScore($evaluation->id, $user->id, $evaluateeId);
        $currentScorePercentage = $maxPossibleScore > 0 ? round(($currentScore / $maxPossibleScore) * 100, 2) : 0;
        $currentIsCompleted     = $this->isEvaluationCompleted($evaluation->id, $user->id, $evaluateeId);

        return response()->json([
            'current_evaluatee' => [
                'id'               => $evaluatee->id,
                'name'             => $evaluatee->fname . ' ' . $evaluatee->lname,
                'position'         => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                'department'       => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                'division'         => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                'grade'            => $evaluatee->grade,
                'total_score'      => $currentScore,
                'max_score'        => $maxPossibleScore,
                'score_percentage' => $currentScorePercentage,
                'is_completed'     => $currentIsCompleted,
                'angle'            => $currentAngle,
            ],
            'peer_comparisons'  => $peerComparisons,
            'angle'             => $currentAngle,
            'total_peers'       => count($peerComparisons),
        ]);
    }

    /**
     * Calculate total score for a specific evaluation
     */
    private function calculateTotalScore($evaluationId, $evaluatorId, $evaluateeId)
    {
        $answers = Answer::where('evaluation_id', $evaluationId)
            ->where('user_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->get();

        $totalScore = 0;

        foreach ($answers as $answer) {
            $value = $answer->value;

            // จัดการกับคำตอบที่เป็น JSON (multiple choice)
            if (is_string($value) && json_decode($value) !== null) {
                $decodedValue = json_decode($value, true);
                if (is_array($decodedValue)) {
                    // สำหรับ multiple choice ให้รวมคะแนนทั้งหมด
                    foreach ($decodedValue as $optionId) {
                        if (is_numeric($optionId)) {
                            $option = \DB::table('options')->where('id', $optionId)->first();
                            if ($option) {
                                $totalScore += $option->score;
                            }
                        }
                    }
                } else {
                    // สำหรับ single choice
                    if (is_numeric($decodedValue)) {
                        $option = \DB::table('options')->where('id', $decodedValue)->first();
                        if ($option) {
                            $totalScore += $option->score;
                        }
                    }
                }
            } else {
                // สำหรับคำตอบที่เป็นตัวเลขโดยตรง
                if (is_numeric($value)) {
                    $option = \DB::table('options')->where('id', $value)->first();
                    if ($option) {
                        $totalScore += $option->score;
                    }
                }
            }
        }

        return $totalScore;
    }

    /**
     * Calculate maximum possible score for an evaluation
     */
    private function calculateMaxPossibleScore($evaluationId)
    {
        $evaluation = Evaluation::with('parts.aspects.questions.options', 'parts.aspects.subaspects.questions.options', 'parts.questions.options')
            ->find($evaluationId);

        if (! $evaluation) {
            return 0;
        }

        $maxScore = 0;

        foreach ($evaluation->parts as $part) {
            // Questions ที่อยู่ใน part โดยตรง
            foreach ($part->questions as $question) {
                if ($question->options && $question->options->count() > 0) {
                    $maxScore += $question->options->max('score');
                }
            }

            // Questions ที่อยู่ใน aspects
            foreach ($part->aspects as $aspect) {
                foreach ($aspect->questions as $question) {
                    if ($question->options && $question->options->count() > 0) {
                        $maxScore += $question->options->max('score');
                    }
                }

                // Questions ที่อยู่ใน subaspects
                if ($aspect->subaspects) {
                    foreach ($aspect->subaspects as $subaspect) {
                        foreach ($subaspect->questions as $question) {
                            if ($question->options && $question->options->count() > 0) {
                                $maxScore += $question->options->max('score');
                            }
                        }
                    }
                }
            }
        }

        return $maxScore;
    }

    /**
     * Check if evaluation is completed
     */
    private function isEvaluationCompleted($evaluationId, $evaluatorId, $evaluateeId)
    {
        $evaluation = Evaluation::with('parts.aspects.questions', 'parts.aspects.subaspects.questions', 'parts.questions')
            ->find($evaluationId);

        if (! $evaluation) {
            return false;
        }

        // รวบรวมคำถามทั้งหมด
        $allQuestionIds = collect();

        foreach ($evaluation->parts as $part) {
            $allQuestionIds = $allQuestionIds
                ->merge($part->questions->pluck('id'))
                ->merge($part->aspects->flatMap(fn($aspect) => $aspect->questions->pluck('id')))
                ->merge($part->aspects->flatMap(fn($aspect) =>
                    optional($aspect->subaspects)->flatMap(fn($sub) => $sub->questions->pluck('id')) ?? collect()
                ));
        }

        $allQuestionIds = $allQuestionIds->unique()->filter();

        $answeredCount = Answer::where('evaluation_id', $evaluationId)
            ->where('user_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->whereIn('question_id', $allQuestionIds)
            ->count();

        return $answeredCount === $allQuestionIds->count();
    }
    /**
     * Get all assigned evaluatees for current evaluator
     */
    public function getAssignedEvaluatees()
    {
        $user = auth()->user();

        $assignments = EvaluationAssignment::with(['evaluatee.position', 'evaluatee.department', 'evaluatee.division'])
            ->where('evaluator_id', $user->id)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')  // exclude self
            ->get()
            ->groupBy('evaluatee_id')
            ->map(function ($group) {
                $evaluatee = $group->first()->evaluatee;
                $angles    = $group->pluck('angle')->unique()->values();

                return [
                    'id'         => $evaluatee->id,
                    'name'       => $evaluatee->fname . ' ' . $evaluatee->lname,
                    'position'   => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                    'department' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                    'division'   => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                    'grade'      => $evaluatee->grade,
                    'angles'     => $angles,
                    'user_type'  => $evaluatee->user_type,
                ];
            })
            ->values();

        return response()->json($assignments);
    }

    /**
     * Get evaluatees in the same angle as current evaluatee
     */
    public function getEvaluateesByAngle($evaluateeId)
    {
        $user = auth()->user();

        // หาองศาของคนที่กำลังประเมินอยู่ - ต้องระบุ evaluation_id ด้วย
        $currentAssignment = EvaluationAssignment::where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->first();

        if (!$currentAssignment) {
            return response()->json(['error' => 'Assignment not found'], 404);
        }

        $currentAngle = $currentAssignment->angle;

        // หาคนอื่นๆ ในองศาเดียวกัน - ต้องระบุ evaluation_id ด้วย
        $sameAngleAssignments = EvaluationAssignment::with(['evaluatee.position', 'evaluatee.department', 'evaluatee.division'])
            ->where('evaluator_id', $user->id)
            ->where('angle', $currentAngle)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')  // exclude self
            ->get()
            ->groupBy('evaluatee_id')
            ->map(function ($group) use ($user) {
                $evaluatee = $group->first()->evaluatee;
                $angles = $group->pluck('angle')->unique()->values();

                // ตรวจสอบสถานะการประเมิน
                $evaluation = Evaluation::where('status', 'published')
                    ->where('user_type', $evaluatee->user_type)
                    ->where('grade_min', '<=', $evaluatee->grade)
                    ->where('grade_max', '>=', $evaluatee->grade)
                    ->latest()
                    ->first();

                $isCompleted = false;
                if ($evaluation) {
                    $isCompleted = $this->isEvaluationCompleted($evaluation->id, $user->id, $evaluatee->id);
                }

                return [
                    'id' => $evaluatee->id,
                    'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                    'position' => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                    'department' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                    'division' => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                    'grade' => $evaluatee->grade,
                    'angles' => $angles,
                    'user_type' => $evaluatee->user_type,
                    'is_completed' => $isCompleted,
                ];
            })
            ->values();

        return response()->json([
            'current_angle' => $currentAngle,
            'evaluatees' => $sameAngleAssignments,
            'total_count' => $sameAngleAssignments->count(),
        ]);
    }

    public function showStep($evaluateeId, $step, Request $request)
    {
        $user = auth()->user();

        $query = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId);

        // If fiscal_year specified, filter by it; otherwise get latest
        if ($request->has('fiscal_year') && $request->fiscal_year) {
            $query->where('fiscal_year', (int) $request->fiscal_year);
        } else {
            $query->orderByDesc('fiscal_year');
        }

        $assignment = $query->firstOrFail();

        $evaluatee = $assignment->evaluatee;

        // Use evaluation from assignment first (preserves correct form for the fiscal year)
        $evaluation = null;
        if ($assignment->evaluation_id) {
            $evaluation = Evaluation::where('id', $assignment->evaluation_id)
                ->where('status', 'published')
                ->first();
        }
        // Fallback: find by grade + fiscal year from assignment
        if (!$evaluation) {
            $assignmentFy = $assignment->fiscal_year ? (int) $assignment->fiscal_year : null;
            $evaluation = EvaluationLookupService::findByGrade((int) $evaluatee->grade, $evaluatee->user_type ?? 'internal', $assignmentFy);
        }
        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งนี้');
        }

        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
            'questions.options',
        ])->orderBy('order')->get();

        $currentPart = $parts->get($step - 1);

        if (! $currentPart) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบตอนที่ต้องการ');
        }

        // โหลดข้อมูลคนในองศาเดียวกัน - ใช้ helper method (เก่า)
        $sameAngleEvaluatees = $this->getEvaluateesInSameAngle($user->id, $evaluatee->id, $evaluation->id);
        $sameAngleEvaluateeIds = collect($sameAngleEvaluatees)->pluck('id')->toArray();
        
        // Get all assignments for this evaluator in the same fiscal year as current assignment
        // Exclude self-eval rows — those go through /evaluations/self
        $allAssignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')
            ->get();

        $targetGrade = $evaluatee->grade;
        $targetEvalId = (int) $evaluation->id;

        // Group by form (not personal grade) — see show() for rationale
        $filteredEvaluatees = $allAssignments->filter(function ($a) use ($targetEvalId, $targetGrade) {
            $aEvalId = (int) ($a->evaluation_id ?? 0);
            if ($aEvalId > 0 && $targetEvalId > 0) {
                return $aEvalId === $targetEvalId;
            }
            return EvaluationLookupService::isSameGradeGroup((int) $targetGrade, (int) $a->evaluatee->grade);
        });

        // Get IDs of evaluatees in the same grade range
        $sameRangeEvaluateeIds = $filteredEvaluatees->pluck('evaluatee_id')->toArray();

        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereIn('evaluatee_id', $sameRangeEvaluateeIds)
            ->get()
            ->groupBy('question_id')
            ->map(function ($answers) {
                return $answers->mapWithKeys(function ($answer) {
                    $value = $answer->value;

                    // จัดการกับข้อมูลที่มี other_text
                    if ($answer->other_text) {
                        // ตรวจสอบว่าเป็น JSON array หรือไม่ (multiple choice)
                        if (is_string($value) && str_starts_with($value, '[') && str_ends_with($value, ']')) {
                            try {
                                $decodedValue = json_decode($value, true);
                                if (is_array($decodedValue)) {
                                    // คืนค่าเป็น object format เสมอ
                                    return [$answer->evaluatee_id => [
                                        'value' => $decodedValue,
                                        'other_text' => $answer->other_text
                                    ]];
                                }
                            } catch (\Exception $e) {
                                \Log::warning("Failed to decode JSON value with other_text", ['value' => $value, 'error' => $e->getMessage()]);
                            }
                        }
                        
                        // Choice question with other_text - คืนค่าเป็น object format เสมอ
                        return [$answer->evaluatee_id => [
                            'value' => is_numeric($value) ? (int) $value : $value,
                            'other_text' => $answer->other_text
                        ]];
                    }
                    
                    // จัดการกับ multiple choice ธรรมดา (ไม่มี other_text) - แปลงเป็น object format เสมอ
                    if (is_string($value) && str_starts_with($value, '[') && str_ends_with($value, ']')) {
                        try {
                            $decodedValue = json_decode($value, true);
                            if (is_array($decodedValue)) {
                                // คืนค่าเป็น object format เสมอ - ไม่มี other_text แต่ไม่เป็น array โดยตรง
                                return [$answer->evaluatee_id => [
                                    'value' => $decodedValue,
                                    'other_text' => null
                                ]];
                            }
                        } catch (\Exception $e) {
                            \Log::warning("Failed to decode JSON value without other_text", ['value' => $value, 'error' => $e->getMessage()]);
                        }
                    }

                    // จัดการกับ open_text (string) - ไม่ต้องแปลง
                    if (is_string($value) && !is_numeric($value)) {
                        return [$answer->evaluatee_id => $value];
                    }

                    // จัดการกับ rating และ choice (numeric) - ไม่ต้องแปลง
                    if (is_numeric($value)) {
                        return [$answer->evaluatee_id => (int) $value];
                    }

                    return [$answer->evaluatee_id => $value];
                });
            });

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

        // Batch load all answered question-evaluatee pairs for this step (1 query instead of N*M)
        $allGroupQuestionIds = $allGroups->flatMap(fn($g) => $g['question_ids'])->unique();
        $answeredInStep = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('fiscal_year', $assignment->fiscal_year)
            ->whereIn('evaluatee_id', $sameAngleEvaluateeIds)
            ->whereIn('question_id', $allGroupQuestionIds)
            ->select('evaluatee_id', 'question_id')
            ->get()
            ->map(fn($a) => $a->evaluatee_id . '_' . $a->question_id)
            ->flip();

        $lastCompletedGroupIndex = -1;

        foreach ($allGroups as $i => $group) {
            $allAnswered = true;
            $hasAnyAnswers = false;

            foreach ($group['question_ids'] as $questionId) {
                foreach ($sameAngleEvaluateeIds as $evalId) {
                    if ($answeredInStep->has($evalId . '_' . $questionId)) {
                        $hasAnyAnswers = true;
                    } else {
                        $allAnswered = false;
                    }
                }
            }
            
            if ($allAnswered) {
                $lastCompletedGroupIndex = $i;
            } else if ($hasAnyAnswers) {
                // Group มีคำตอบบางข้อ แต่ยังไม่เสร็จ ให้ไปต่อที่ group นี้
                $groupIndex = $i;
                break;
            } else if ($lastCompletedGroupIndex >= 0) {
                // Group นี้ยังไม่มีคำตอบเลย แต่มี group อื่นที่ทำแล้ว ให้ไปต่อที่ group นี้
                $groupIndex = $i;
                break;
            } else {
                // ยังไม่เคยทำอะไรเลย ให้เริ่มจาก group แรก
                $groupIndex = $i;
                break;
            }
        }

        // ดึงรายชื่อผู้ถูกประเมินทั้งหมดของผู้ประเมินคนนี้
        $assignedEvaluateesResponse = $this->getAssignedEvaluatees();
        $assignedEvaluatees = json_decode($assignedEvaluateesResponse->getContent(), true);

        // Get all evaluatees from all assignments for this evaluator
        $allEvaluateesWithAngles = $filteredEvaluatees->map(function ($assignment) {
            return [
                'id' => $assignment->evaluatee->id,
                'name' => $assignment->evaluatee->fname . ' ' . $assignment->evaluatee->lname,
                'position' => $assignment->evaluatee->position ? $assignment->evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                'department' => $assignment->evaluatee->department ? $assignment->evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                'division' => $assignment->evaluatee->division ? $assignment->evaluatee->division->name : 'ไม่ระบุสายงาน',
                'grade' => $assignment->evaluatee->grade,
                'user_type' => $assignment->evaluatee->user_type,
                'angle' => $assignment->angle,
                'angle_label' => $this->getAngleLabel($assignment->angle),
            ];
        })->values()->all();

        // Convert to final format
        $finalEvaluatees = $allEvaluateesWithAngles;

        return Inertia::render('AssignedEvaluationStep', [
            'evaluation'          => $evaluation,
            'current_part'        => $currentPart,
            'step'                => (int) $step,
            'total_steps'         => $parts->count(),
            'evaluatee_id'        => $evaluatee->id,
            'current_evaluatee'   => [
                'id' => $evaluatee->id,
                'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'position' => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                'department' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                'division' => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                'grade' => $evaluatee->grade,
            ],
            'assigned_evaluatees' => $assignedEvaluatees,
            'current_angle'       => $assignment->angle,
            'same_angle_evaluatees' => $sameAngleEvaluatees,
            'all_evaluatees_in_angle' => $finalEvaluatees,
            'is_self'             => false,
            'auth'                => ['user' => $user],
            'groupIndex'          => $groupIndex,
            'totalGroups'         => $allGroups->count(),
            'existingAnswers'     => $existingAnswers,
            'fiscal_year'         => $assignment->fiscal_year,
        ]);
    }

    /**
     * Helper method to get angle label
     */
    private function getAngleLabel($angle)
    {
        switch ($angle) {
            case 'top':
                return 'ผู้บังคับบัญชา';
            case 'bottom':
                return 'ผู้ใต้บังคับบัญชา';
            case 'left':
                return 'องศาซ้าย';
            case 'right':
                return 'องศาขวา';
            default:
                return 'องศาอื่นๆ';
        }
    }

    /**
     * Helper method to get evaluatees in the same angle for a specific evaluation
     */
    private function getEvaluateesInSameAngle($evaluatorId, $evaluateeId, $evaluationId)
    {
        $currentAssignment = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->first();

        if (!$currentAssignment) {
            $evaluatee = User::with(['position', 'department', 'division'])->find($evaluateeId);
            if (!$evaluatee) {
                return [];
            }

            return [[
                'id' => $evaluatee->id,
                'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'position' => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                'department' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                'division' => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                'grade' => $evaluatee->grade,
                'user_type' => $evaluatee->user_type
            ]];
        }

        // โหลด evaluatees ทั้งหมดในองศาเดียวกัน (exclude self)
        $allSameAngleAssignments = EvaluationAssignment::with(['evaluatee.position', 'evaluatee.department', 'evaluatee.division'])
            ->where('evaluator_id', $evaluatorId)
            ->where('angle', $currentAssignment->angle)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')
            ->get();

        // Filter ด้วย evaluation_id
        $exactMatchAssignments = $allSameAngleAssignments->where('evaluation_id', $evaluationId);
        $finalAssignments = $exactMatchAssignments;

        // ถ้าพบน้อยกว่าที่มี ให้ใช้ compatibility check
        if ($exactMatchAssignments->count() < $allSameAngleAssignments->count()) {
            $targetEvaluation = Evaluation::find($evaluationId);

            if ($targetEvaluation) {
                $finalAssignments = $allSameAngleAssignments->filter(function($assignment) use ($targetEvaluation, $evaluationId) {
                    if ($assignment->evaluation_id == $evaluationId) {
                        return true;
                    }
                    if (!$assignment->evaluatee) {
                        return false;
                    }
                    $evaluatee = $assignment->evaluatee;
                    return $targetEvaluation->user_type == $evaluatee->user_type
                        && $targetEvaluation->grade_min <= $evaluatee->grade
                        && $targetEvaluation->grade_max >= $evaluatee->grade;
                });
            }
        }

        // แปลงข้อมูล assignments เป็น evaluatees array
        $evaluatees = [];
        foreach ($finalAssignments as $assignment) {
            if (!$assignment->evaluatee) {
                continue;
            }

            $evaluatees[] = [
                'id' => $assignment->evaluatee->id,
                'name' => $assignment->evaluatee->fname . ' ' . $assignment->evaluatee->lname,
                'position' => $assignment->evaluatee->position ? $assignment->evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                'department' => $assignment->evaluatee->department ? $assignment->evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                'division' => $assignment->evaluatee->division ? $assignment->evaluatee->division->name : 'ไม่ระบุสายงาน',
                'grade' => $assignment->evaluatee->grade,
                'user_type' => $assignment->evaluatee->user_type
            ];
        }

        // ถ้าไม่มีคนอื่นในองศาเดียวกัน ให้คืนค่าเฉพาะคนที่กำลังประเมิน
        if (empty($evaluatees)) {
            $evaluatee = User::with(['position', 'department', 'division'])->find($evaluateeId);
            if ($evaluatee) {
                return [[
                    'id' => $evaluatee->id,
                    'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                    'position' => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                    'department' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                    'division' => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                    'grade' => $evaluatee->grade,
                    'user_type' => $evaluatee->user_type
                ]];
            }
        }

        return $evaluatees;
    }

    /**
     * Helper method to get evaluatee IDs in the same angle for a specific evaluation
     */
    private function getEvaluateeIdsInSameAngle($evaluatorId, $evaluateeId, $evaluationId)
    {
        $currentAssignment = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->first();

        if (!$currentAssignment) {
            return [$evaluateeId];
        }

        // ดึง IDs ทั้งหมดในองศาเดียวกัน (exclude self)
        $allSameAngleIds = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('angle', $currentAssignment->angle)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')
            ->pluck('evaluatee_id')
            ->toArray();

        // Filter ด้วย evaluation_id
        $exactMatchIds = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('angle', $currentAssignment->angle)
            ->where('evaluation_id', $evaluationId)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')
            ->pluck('evaluatee_id')
            ->toArray();

        $finalIds = $exactMatchIds;

        // ถ้าพบน้อยกว่าที่มี ให้ใช้ compatibility check
        if (count($exactMatchIds) < count($allSameAngleIds)) {
            $targetEvaluation = Evaluation::find($evaluationId);

            if ($targetEvaluation) {
                $allSameAngleAssignments = EvaluationAssignment::with(['evaluatee'])
                    ->where('evaluator_id', $evaluatorId)
                    ->where('angle', $currentAssignment->angle)
                    ->get();

                $compatibleIds = [];
                foreach ($allSameAngleAssignments as $assignment) {
                    if ($assignment->evaluation_id == $evaluationId) {
                        $compatibleIds[] = $assignment->evaluatee_id;
                        continue;
                    }
                    if (!$assignment->evaluatee) {
                        continue;
                    }
                    $evaluatee = $assignment->evaluatee;
                    if ($targetEvaluation->user_type == $evaluatee->user_type
                        && $targetEvaluation->grade_min <= $evaluatee->grade
                        && $targetEvaluation->grade_max >= $evaluatee->grade) {
                        $compatibleIds[] = $assignment->evaluatee_id;
                    }
                }

                $finalIds = $compatibleIds;
            }
        }

        if (empty($finalIds)) {
            return [$evaluateeId];
        }

        return $finalIds;
    }

}
