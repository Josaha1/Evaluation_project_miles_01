<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
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

        // Get all evaluatees for this evaluator in this fiscal year
        $allAssignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('fiscal_year', now()->month >= 10 ? now()->addYear()->year : now()->year)
            ->get();

        // Determine evaluation type based on grade ranges
        $evaluationQuery = Evaluation::where('status', 'published')
            ->where('user_type', 'internal'); // Always use internal evaluations for assigned evaluations
        
        // Find the evaluation form based on the target evaluatee's grade
        $targetGrade = $evaluatee->grade;
        if ($targetGrade >= 13) {
            // Governor level - use 9-12 form but for higher grades (excluding self-evaluation forms)
            $evaluation = $evaluationQuery->where('grade_min', '<=', 12)
                ->where('grade_max', '>=', 9)
                ->where('title', 'NOT LIKE', '%ประเมินตนเอง%')
                ->latest()
                ->first();
        } elseif ($targetGrade >= 9 && $targetGrade <= 12) {
            // Executive level - use 9-12 form (excluding self-evaluation forms)
            $evaluation = $evaluationQuery->where('grade_min', '<=', 12)
                ->where('grade_max', '>=', 9)
                ->where('title', 'NOT LIKE', '%ประเมินตนเอง%')
                ->latest()
                ->first();
        } elseif ($targetGrade >= 5 && $targetGrade <= 8) {
            // Staff level - use 5-8 form (excluding self-evaluation forms)
            $evaluation = $evaluationQuery->where('grade_min', '<=', 8)
                ->where('grade_max', '>=', 5)
                ->where('title', 'NOT LIKE', '%ประเมินตนเอง%')
                ->latest()
                ->first();
        } else {
            // Fallback to original logic
            $evaluation = $evaluationQuery->where('grade_min', '<=', $evaluatee->grade)
                ->where('grade_max', '>=', $evaluatee->grade)
                ->where('title', 'NOT LIKE', '%ประเมินตนเอง%')
                ->latest()
                ->first();
        }

        if (!$evaluation) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบแบบประเมินสำหรับระดับตำแหน่งนี้');
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
            ->whereIn('question_id', $allQuestionIds)
            ->count();

        if ($answeredCount === $allQuestionIds->count()) {
            // ✅ ตอบครบแล้ว ส่งกลับหน้ารวม
            return redirect()->route('dashboard')->with('success', 'ประเมินเสร็จสมบูรณ์แล้ว');
        }

        // ⛔ ถ้ายังไม่ครบ หาหัวข้อล่าสุดที่ประเมินแล้วจริงๆ (รองรับการประเมินหลายคน)
        
        // Get all assignments for this evaluator in this fiscal year for the new system
        $allAssignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('fiscal_year', now()->month >= 10 ? now()->addYear()->year : now()->year)
            ->get();

        // Get target grade for filtering
        $targetGrade = $evaluatee->grade;

        // Filter evaluatees by grade range that matches the current evaluation
        $filteredEvaluatees = $allAssignments->filter(function ($assignment) use ($targetGrade) {
            $evalGrade = $assignment->evaluatee->grade;
            if ($targetGrade >= 13) {
                return $evalGrade >= 13; // Governor level
            } elseif ($targetGrade >= 9 && $targetGrade <= 12) {
                return $evalGrade >= 9 && $evalGrade <= 12; // Executive level
            } elseif ($targetGrade >= 5 && $targetGrade <= 8) {
                return $evalGrade >= 5 && $evalGrade <= 8; // Staff level
            }
            return true;
        });

        // Get IDs of evaluatees in the same grade range
        $sameRangeEvaluateeIds = $filteredEvaluatees->pluck('evaluatee_id')->toArray();
        
        // Keep compatibility with existing system
        $sameAngleEvaluateeIds = $this->getEvaluateeIdsInSameAngle($user->id, $evaluateeId, $evaluation->id);

        // Validation: Check for expected vs actual evaluatee count in show() method
        $currentAssignment = EvaluationAssignment::where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->first();
        
        if ($currentAssignment) {
            $expectedCountFromDb = EvaluationAssignment::where('evaluator_id', $user->id)
                ->where('angle', $currentAssignment->angle)
                ->count();
            
            \Log::info("=== show() Evaluatee Count Validation ===", [
                'evaluator_id' => $user->id,
                'target_evaluatee_id' => $evaluateeId,
                'evaluation_id' => $evaluation->id,
                'current_angle' => $currentAssignment->angle,
                'expected_count_from_db' => $expectedCountFromDb,
                'actual_count_returned' => count($sameAngleEvaluateeIds),
                'same_angle_evaluatee_ids' => $sameAngleEvaluateeIds
            ]);
            
            if (count($sameAngleEvaluateeIds) != $expectedCountFromDb) {
                \Log::warning("EVALUATEE COUNT MISMATCH DETECTED in show()!", [
                    'expected_count_from_db' => $expectedCountFromDb,
                    'actual_count_returned' => count($sameAngleEvaluateeIds),
                    'missing_count' => $expectedCountFromDb - count($sameAngleEvaluateeIds),
                    'angle' => $currentAssignment->angle,
                    'evaluator_id' => $user->id,
                    'evaluation_id' => $evaluation->id
                ]);
            }
        }

        $lastCompletedStep  = 1;
        $lastCompletedGroup = 0;
        $hasAnyAnswers      = false;
        $foundIncompleteGroup = false;

        \Log::info("=== Finding last completed step/group (Multi-evaluatee) ===");
        \Log::info("User ID: {$user->id}, Evaluatee ID: {$evaluateeId}, Evaluation ID: {$evaluation->id}");
        \Log::info("Same range evaluatees: " . implode(',', $sameRangeEvaluateeIds));
        \Log::info("Same angle evaluatees (legacy): " . implode(',', $sameAngleEvaluateeIds));

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
                
                // ตรวจสอบว่าทุกคำถามของทุกคนในกลุ่มนี้ตอบครบหรือไม่ (ใช้ระบบใหม่ที่กรองตาม grade range)
                foreach ($questionIds as $questionId) {
                    foreach ($sameRangeEvaluateeIds as $evalId) {
                        $answered = Answer::where('evaluation_id', $evaluation->id)
                            ->where('user_id', $user->id)
                            ->where('evaluatee_id', $evalId)
                            ->where('question_id', $questionId)
                            ->exists();
                        
                        if ($answered) {
                            $hasAnyAnswers = true;
                            $hasPartialAnswers = true;
                        } else {
                            $allAnswered = false;
                        }
                    }
                }

                \Log::info("Step " . ($partIndex + 1) . ", Group {$groupIndex}: " . ($allAnswered ? 'Complete' : 'Incomplete') . 
                          " (Has partial: " . ($hasPartialAnswers ? 'Yes' : 'No') . ")");

                if ($allAnswered) {
                    // Group นี้เสร็จสมบูรณ์แล้ว
                    $lastCompletedStep = $partIndex + 1;
                    $lastCompletedGroup = $groupIndex;
                    \Log::info("Updated last completed: Step {$lastCompletedStep}, Group {$lastCompletedGroup}");
                } else {
                    // Group นี้ยังไม่เสร็จ
                    \Log::info("Found incomplete group: Step " . ($partIndex + 1) . ", Group {$groupIndex}");
                    
                    if (!$foundIncompleteGroup) {
                        $foundIncompleteGroup = true;
                        
                        // ถ้ายังไม่เคยทำอะไรเลย ให้เริ่มจากขั้นตอนแรก
                        if (!$hasAnyAnswers) {
                            \Log::info("No answers yet, going to Step 1, Group 0");
                            return redirect()->route('assigned-evaluations.questions', [
                                'evaluatee' => $evaluateeId,
                                'step'      => 1,
                                'group'     => 0,
                            ]);
                        }
                        
                        // ถ้า group นี้มีคำตอบบางข้อแล้ว ให้ไปต่อที่ group นี้
                        if ($hasPartialAnswers) {
                            \Log::info("Group has partial answers, continuing at Step " . ($partIndex + 1) . ", Group {$groupIndex} (RESUME TO LAST INCOMPLETE)");
                            return redirect()->route('assigned-evaluations.questions', [
                                'evaluatee' => $evaluateeId,
                                'step'      => $partIndex + 1,
                                'group'     => $groupIndex,
                            ]);
                        }
                        
                        // ถ้า group นี้ยังไม่มีคำตอบเลย แต่มี group อื่นที่ทำแล้ว
                        // ให้ไปที่ group ถัดไปที่ยังไม่เสร็จ
                        \Log::info("Group has no answers, going to this incomplete group: Step " . ($partIndex + 1) . ", Group {$groupIndex}");
                        return redirect()->route('assigned-evaluations.questions', [
                            'evaluatee' => $evaluateeId,
                            'step'      => $partIndex + 1,
                            'group'     => $groupIndex,
                        ]);
                    }
                }
            }
        }

        // ถ้าทุก group ทำเสร็จหมดแล้ว กลับไปหน้า Dashboard
        \Log::info("All groups completed, redirecting to dashboard");
        return redirect()->route('dashboard')->with('success', 'การประเมินเสร็จสมบูรณ์แล้ว');
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

        \Log::info("=== AssignedEvaluationController::step ===", [
            'user_id' => $user->id,
            'evaluatee_id' => $evaluateeId,
            'step' => $step,
            'evaluation_id' => $data['evaluation_id'],
            'answers_count' => count($data['answers']),
            'answers_keys' => array_keys($data['answers'])
        ]);

        // ✅ บันทึกคำตอบ - รองรับทุกประเภทคำถามและหลายคน
        $savedAnswersCount = 0;
        $errors = [];
        
        foreach ($data['answers'] as $key => $value) {
            \Log::info("Processing answer key: {$key}", ['value' => $value]);
            
            try {
                // Check if this is a multi-evaluatee answer (format: questionId_evaluateeId)
                if (is_array($value) && isset($value['question_id']) && isset($value['evaluatee_id']) && isset($value['value'])) {
                // Multi-evaluatee format
                $questionId = $value['question_id'];
                $targetEvaluateeId = $value['evaluatee_id'];
                $answerValue = $value['value'];
                $otherText = isset($value['other_text']) ? $value['other_text'] : null;
                
                \Log::info("Multi-evaluatee answer", [
                    'question_id' => $questionId,
                    'evaluatee_id' => $targetEvaluateeId,
                    'value' => $answerValue,
                    'other_text' => $otherText
                ]);
                
                // จัดการข้อมูลตามประเภทคำถาม - ให้สม่ำเสมอ
                $finalValue = $answerValue;
                
                if (is_array($answerValue)) {
                    // สำหรับ multiple_choice - เก็บเป็น JSON เสมอ
                    $finalValue = json_encode($answerValue);
                    \Log::info("Multi-evaluatee multiple choice encoded", ['final_value' => $finalValue]);
                } else if (is_string($answerValue)) {
                    // สำหรับ open_text หรือค่าอื่นๆ ที่เป็น string
                    $finalValue = $answerValue;
                } else {
                    // สำหรับ rating, choice ที่เป็นตัวเลข
                    $finalValue = $answerValue;
                }
                
                // ถ้ามี other_text แต่ value ไม่ใช่ array ให้เก็บ other_text แยก
                // ไม่ต้องแปลงเป็น object format ที่ซับซ้อน
                
                \Log::info("Saving multi-evaluatee answer to database", [
                    'evaluation_id' => $data['evaluation_id'],
                    'user_id' => $user->id,
                    'evaluatee_id' => $targetEvaluateeId,
                    'question_id' => $questionId,
                    'final_value' => $finalValue,
                    'other_text' => $otherText
                ]);
                
                Answer::updateOrCreate(
                    [
                        'evaluation_id' => $data['evaluation_id'],
                        'user_id'       => $user->id,
                        'evaluatee_id'  => $targetEvaluateeId,
                        'question_id'   => $questionId,
                    ],
                    [
                        'value'      => $finalValue,
                        'other_text' => $otherText,
                    ]
                );
            } else {
                // Traditional single evaluatee format
                $question_id = $key;
                
                \Log::info("Single evaluatee answer", [
                    'question_id' => $question_id,
                    'evaluatee_id' => $evaluateeId,
                    'value' => $value
                ]);
                
                // จัดการกับข้อมูลที่เป็น object (สำหรับ other option) - ปรับให้สม่ำเสมอ
                $finalValue = $value;
                $otherText  = null;

                \Log::info("Processing single evaluatee answer value", [
                    'original_value' => $value,
                    'value_type' => gettype($value),
                    'is_array' => is_array($value)
                ]);

                if (is_array($value)) {
                    // รูปแบบใหม่: { value: ..., other_text: ... } - รองรับทั้ง choice และ multiple_choice
                    if (isset($value['value'])) {
                        $finalValue = $value['value'];
                        $otherText = isset($value['other_text']) ? $value['other_text'] : null;
                        
                        \Log::info("New object format detected", [
                            'value' => $finalValue,
                            'other_text' => $otherText,
                            'value_type' => gettype($finalValue)
                        ]);
                        
                        // ถ้า value เป็น array (multiple choice) ให้ encode เป็น JSON เสมอ
                        if (is_array($finalValue)) {
                            $finalValue = json_encode($finalValue);
                            \Log::info("Object format: Array value encoded to JSON", ['encoded_value' => $finalValue]);
                        }
                    }
                    // รูปแบบเก่า: { option_id: ..., other_text: ... }
                    elseif (isset($value['option_id'])) {
                        $finalValue = $value['option_id'];
                        $otherText  = isset($value['other_text']) ? $value['other_text'] : null;
                        
                        \Log::info("Legacy object format detected", [
                            'option_id' => $finalValue,
                            'other_text' => $otherText
                        ]);
                    }
                    // รูปแบบสำหรับ multiple choice ธรรมดา (array ของ option IDs)
                    else {
                        // ตรวจสอบว่าเป็น array ของ numbers หรือไม่
                        $isSimpleArray = true;
                        foreach ($value as $item) {
                            if (!is_numeric($item)) {
                                $isSimpleArray = false;
                                break;
                            }
                        }
                        
                        if ($isSimpleArray) {
                            // Simple array of option IDs - เก็บเป็น JSON เสมอ
                            $finalValue = json_encode($value);
                            \Log::info("Simple array format - encoded to JSON", ['value' => $finalValue]);
                        } else {
                            // Complex array with objects
                            $processedArray = [];
                            foreach ($value as $item) {
                                if (is_array($item) && isset($item['option_id'])) {
                                    $processedArray[] = $item['option_id'];
                                    if (isset($item['other_text'])) {
                                        $otherText = $item['other_text'];
                                    }
                                } else {
                                    $processedArray[] = $item;
                                }
                            }
                            $finalValue = json_encode($processedArray);
                            \Log::info("Complex array format - processed and encoded", [
                                'processed_value' => $finalValue,
                                'other_text' => $otherText
                            ]);
                        }
                    }
                } else {
                    // Simple value (rating, choice without other_text)
                    \Log::info("Simple value detected", ['value' => $finalValue]);
                }

                \Log::info("Final processed values for single evaluatee", [
                    'final_value' => $finalValue,
                    'other_text' => $otherText,
                    'question_id' => $question_id,
                    'evaluatee_id' => $evaluateeId
                ]);

                \Log::info("Saving single evaluatee answer to database", [
                    'evaluation_id' => $data['evaluation_id'],
                    'user_id' => $user->id,
                    'evaluatee_id' => $evaluateeId,
                    'question_id' => $question_id,
                    'final_value' => $finalValue,
                    'other_text' => $otherText,
                    'original_value_type' => gettype($value)
                ]);
                
                Answer::updateOrCreate(
                    [
                        'evaluation_id' => $data['evaluation_id'],
                        'user_id'       => $user->id,
                        'evaluatee_id'  => $evaluateeId,
                        'question_id'   => $question_id,
                    ],
                    [
                        'value'      => $finalValue,
                        'other_text' => $otherText,
                    ]
                );
                
                $savedAnswersCount++;
                \Log::info("Successfully saved answer", [
                    'question_id' => $question_id ?? $questionId,
                    'evaluatee_id' => $evaluateeId ?? $targetEvaluateeId
                ]);
                }
                
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
        
        \Log::info("Answer saving completed", [
            'saved_count' => $savedAnswersCount,
            'errors_count' => count($errors),
            'errors' => $errors
        ]);

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

        // Check if evaluation is completed for all evaluatees in the same angle
        $sameAngleEvaluateeIds = $this->getEvaluateeIdsInSameAngle($user->id, $evaluateeId, $data['evaluation_id']);
        
        // Calculate overall completion for all evaluatees
        $totalExpectedAnswers = $totalQuestions * count($sameAngleEvaluateeIds);
        $totalActualAnswers = Answer::where('evaluation_id', $data['evaluation_id'])
            ->where('user_id', $user->id)
            ->whereIn('evaluatee_id', $sameAngleEvaluateeIds)
            ->whereIn('question_id', $questionIds)
            ->count();
        
        $overallProgress = $totalExpectedAnswers > 0 ? round(($totalActualAnswers / $totalExpectedAnswers) * 100, 2) : 0;
        $isCompleted = $totalActualAnswers === $totalExpectedAnswers;
        
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
    public function getExistingAnswers($evaluateeId, $evaluationId)
    {
        $user = auth()->user();

        $answers = Answer::where('evaluation_id', $evaluationId)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
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

        $assignment = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('evaluatee_id', $evaluateeId)
            ->firstOrFail();

        $evaluatee = $assignment->evaluatee;

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', $evaluatee->user_type)
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

        // โหลดข้อมูลคนในองศาเดียวกัน - ใช้ helper method (เก่า)
        $sameAngleEvaluatees = $this->getEvaluateesInSameAngle($user->id, $evaluatee->id, $evaluation->id);
        $sameAngleEvaluateeIds = collect($sameAngleEvaluatees)->pluck('id')->toArray();
        
        \Log::info("=== showStep Same-Angle Evaluation Summary ===", [
            'evaluator_id' => $user->id,
            'target_evaluatee_id' => $evaluatee->id,
            'target_evaluatee_name' => $evaluatee->fname . ' ' . $evaluatee->lname,
            'evaluation_id' => $evaluation->id,
            'same_angle_evaluatees_count' => count($sameAngleEvaluatees),
            'same_angle_evaluatee_ids' => $sameAngleEvaluateeIds,
            'current_angle' => $assignment->angle,
            'evaluation_note' => "System shows evaluatees from same angle '{$assignment->angle}'"
        ]);
        
        // Validation: Check for expected vs actual evaluatee count
        $expectedCountFromDb = EvaluationAssignment::where('evaluator_id', $user->id)
            ->where('angle', $assignment->angle)
            ->count();
        
        if (count($sameAngleEvaluatees) != $expectedCountFromDb) {
            \Log::warning("EVALUATEE COUNT MISMATCH DETECTED!", [
                'expected_count_from_db' => $expectedCountFromDb,
                'actual_count_returned' => count($sameAngleEvaluatees),
                'missing_count' => $expectedCountFromDb - count($sameAngleEvaluatees),
                'angle' => $assignment->angle,
                'evaluator_id' => $user->id,
                'evaluation_id' => $evaluation->id
            ]);
        }
        
        // Get all assignments for this evaluator in this fiscal year for the new system
        $allAssignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $user->id)
            ->where('fiscal_year', now()->month >= 10 ? now()->addYear()->year : now()->year)
            ->get();

        // Get target grade for filtering
        $targetGrade = $evaluatee->grade;

        // Filter evaluatees by grade range that matches the current evaluation
        $filteredEvaluatees = $allAssignments->filter(function ($assignment) use ($targetGrade) {
            $evalGrade = $assignment->evaluatee->grade;
            if ($targetGrade >= 13) {
                return $evalGrade >= 13; // Governor level
            } elseif ($targetGrade >= 9 && $targetGrade <= 12) {
                return $evalGrade >= 9 && $evalGrade <= 12; // Executive level
            } elseif ($targetGrade >= 5 && $targetGrade <= 8) {
                return $evalGrade >= 5 && $evalGrade <= 8; // Staff level
            }
            return true;
        });

        // Get IDs of evaluatees in the same grade range
        $sameRangeEvaluateeIds = $filteredEvaluatees->pluck('evaluatee_id')->toArray();

        // โหลดคำตอบที่มีอยู่แล้วสำหรับทุกคนในระดับเดียวกัน (ใช้ระบบใหม่)
        
        \Log::info("Loading existing answers for evaluatees", [
            'same_range_evaluatee_ids' => $sameRangeEvaluateeIds,
            'same_angle_evaluatee_ids' => $sameAngleEvaluateeIds,
            'current_evaluatee_id' => $evaluatee->id,
            'user_id' => $user->id,
            'evaluation_id' => $evaluation->id
        ]);
        
        $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->whereIn('evaluatee_id', $sameRangeEvaluateeIds)
            ->get()
            ->groupBy('question_id')
            ->map(function ($answers) {
                return $answers->mapWithKeys(function ($answer) {
                    $value = $answer->value;

                    \Log::info("Loading existing answer", [
                        'question_id' => $answer->question_id,
                        'evaluatee_id' => $answer->evaluatee_id,
                        'value' => $value,
                        'other_text' => $answer->other_text
                    ]);

                    // จัดการกับข้อมูลที่มี other_text - แปลงเป็น object format เสมอ
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

                    // Default fallback - คืนค่าตามที่ได้รับ
                    \Log::info("Using fallback for value", ['value' => $value, 'type' => gettype($value)]);
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

        $lastCompletedGroupIndex = -1;
        
        foreach ($allGroups as $i => $group) {
            $allAnswered = true;
            $hasAnyAnswers = false;
            
            // Check if all questions in this group are answered for all evaluatees in the same angle
            foreach ($group['question_ids'] as $questionId) {
                foreach ($sameAngleEvaluateeIds as $evalId) {
                    $answered = Answer::where('evaluation_id', $evaluation->id)
                        ->where('user_id', $user->id)
                        ->where('evaluatee_id', $evalId)
                        ->where('question_id', $questionId)
                        ->exists();
                    
                    if ($answered) {
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

        \Log::info("Final data preparation for frontend", [
            'existing_answers_count' => $existingAnswers->count(),
            'same_angle_evaluatees_count' => count($sameAngleEvaluatees),
            'same_angle_evaluatee_ids' => $sameAngleEvaluateeIds,
            'current_angle' => $assignment->angle,
            'group_index' => $groupIndex,
            'total_groups' => $allGroups->count()
        ]);

        // Get all evaluatees from all assignments for this evaluator (not just same angle)
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
        ]);
    }

    /**
     * Helper method to get angle label
     */
    private function getAngleLabel($angle)
    {
        switch ($angle) {
            case 'top':
                return 'องศาบน';
            case 'bottom':
                return 'องศาล่าง';
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
        \Log::info("=== getEvaluateesInSameAngle DEBUG START ===", [
            'evaluator_id' => $evaluatorId,
            'evaluatee_id' => $evaluateeId,
            'evaluation_id' => $evaluationId
        ]);

        // หาการมอบหมายของ evaluatee ที่กำลังประเมิน - ไม่ filter evaluation_id ก่อน
        $currentAssignment = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->first();

        \Log::info("Current assignment search result:", [
            'assignment' => $currentAssignment ? [
                'id' => $currentAssignment->id,
                'evaluator_id' => $currentAssignment->evaluator_id,
                'evaluatee_id' => $currentAssignment->evaluatee_id,
                'angle' => $currentAssignment->angle,
                'evaluation_id' => $currentAssignment->evaluation_id,
                'matches_target_evaluation' => $currentAssignment->evaluation_id == $evaluationId
            ] : null
        ]);

        if (!$currentAssignment) {
            \Log::warning("No assignment found, returning single evaluatee");
            // ถ้าไม่พบการมอบหมาย ให้คืนค่าเฉพาะคนที่กำลังประเมิน
            $evaluatee = User::with(['position', 'department', 'division'])->find($evaluateeId);
            if (!$evaluatee) {
                \Log::error("Evaluatee not found", ['evaluatee_id' => $evaluateeId]);
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

        \Log::info("Found current assignment, searching for same angle evaluatees:", [
            'current_angle' => $currentAssignment->angle,
            'current_evaluation_id' => $currentAssignment->evaluation_id,
            'target_evaluation_id' => $evaluationId
        ]);

        // ขั้นตอนที่ 1: โหลดข้อมูล evaluatees ทั้งหมดในองศาเดียวกัน (ไม่ filter evaluation_id ก่อน)
        $allSameAngleAssignments = EvaluationAssignment::with(['evaluatee.position', 'evaluatee.department', 'evaluatee.division'])
            ->where('evaluator_id', $evaluatorId)
            ->where('angle', $currentAssignment->angle)
            ->get();

        \Log::info("ALL assignments in same angle (no evaluation_id filter):", [
            'count' => $allSameAngleAssignments->count(),
            'angle' => $currentAssignment->angle,
            'assignments' => $allSameAngleAssignments->map(function($a) {
                return [
                    'id' => $a->id,
                    'evaluatee_id' => $a->evaluatee_id,
                    'evaluation_id' => $a->evaluation_id,
                    'evaluatee_name' => $a->evaluatee ? $a->evaluatee->fname . ' ' . $a->evaluatee->lname : 'NULL'
                ];
            })->toArray()
        ]);

        // ขั้นตอนที่ 2: Filter ด้วย evaluation_id ที่เป็นเป้าหมาย
        $exactMatchAssignments = $allSameAngleAssignments->where('evaluation_id', $evaluationId);

        \Log::info("EXACT MATCH assignments (WITH evaluation_id filter):", [
            'count' => $exactMatchAssignments->count(),
            'evaluation_id_filter' => $evaluationId,
            'assignments' => $exactMatchAssignments->map(function($a) {
                return [
                    'evaluatee_id' => $a->evaluatee_id,
                    'evaluation_id' => $a->evaluation_id,
                    'evaluatee_name' => $a->evaluatee ? $a->evaluatee->fname . ' ' . $a->evaluatee->lname : 'NULL'
                ];
            })->toArray()
        ]);

        // ขั้นตอนที่ 3: ถ้าไม่พบ exact match หรือพบน้อยกว่าที่คาดหวัง ให้ใช้ compatibility check
        $finalAssignments = $exactMatchAssignments;

        if ($exactMatchAssignments->count() < $allSameAngleAssignments->count()) {
            \Log::warning("Exact match found fewer evaluatees than all same angle assignments. Attempting compatibility check.", [
                'exact_match_count' => $exactMatchAssignments->count(),
                'all_same_angle_count' => $allSameAngleAssignments->count(),
                'missing_count' => $allSameAngleAssignments->count() - $exactMatchAssignments->count()
            ]);

            // โหลดข้อมูล evaluation ที่เป็นเป้าหมาย
            $targetEvaluation = Evaluation::find($evaluationId);
            
            if ($targetEvaluation) {
                \Log::info("Target evaluation details:", [
                    'id' => $targetEvaluation->id,
                    'user_type' => $targetEvaluation->user_type,
                    'grade_min' => $targetEvaluation->grade_min,
                    'grade_max' => $targetEvaluation->grade_max,
                    'status' => $targetEvaluation->status
                ]);

                // ตรวจสอบ evaluatees ที่มี evaluation_id ต่างกัน แต่ compatible
                $compatibleAssignments = $allSameAngleAssignments->filter(function($assignment) use ($targetEvaluation, $evaluationId) {
                    // ถ้า evaluation_id ตรงกันอยู่แล้ว ให้ผ่าน
                    if ($assignment->evaluation_id == $evaluationId) {
                        return true;
                    }

                    // ตรวจสอบ compatibility ของ evaluation อื่น
                    if (!$assignment->evaluatee) {
                        \Log::warning("Assignment without evaluatee", ['assignment_id' => $assignment->id]);
                        return false;
                    }

                    $evaluatee = $assignment->evaluatee;
                    
                    // ตรวจสอบว่า evaluatee นี้เข้าเงื่อนไข target evaluation หรือไม่
                    $isCompatible = (
                        $targetEvaluation->user_type == $evaluatee->user_type &&
                        $targetEvaluation->grade_min <= $evaluatee->grade &&
                        $targetEvaluation->grade_max >= $evaluatee->grade
                    );

                    \Log::info("Compatibility check for evaluatee:", [
                        'evaluatee_id' => $evaluatee->id,
                        'evaluatee_name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                        'evaluatee_user_type' => $evaluatee->user_type,
                        'evaluatee_grade' => $evaluatee->grade,
                        'target_user_type' => $targetEvaluation->user_type,
                        'target_grade_range' => $targetEvaluation->grade_min . '-' . $targetEvaluation->grade_max,
                        'is_compatible' => $isCompatible,
                        'original_evaluation_id' => $assignment->evaluation_id,
                        'target_evaluation_id' => $evaluationId
                    ]);

                    return $isCompatible;
                });

                $finalAssignments = $compatibleAssignments;

                \Log::info("COMPATIBLE assignments (after compatibility check):", [
                    'count' => $compatibleAssignments->count(),
                    'assignments' => $compatibleAssignments->map(function($a) {
                        return [
                            'evaluatee_id' => $a->evaluatee_id,
                            'evaluation_id' => $a->evaluation_id,
                            'evaluatee_name' => $a->evaluatee ? $a->evaluatee->fname . ' ' . $a->evaluatee->lname : 'NULL'
                        ];
                    })->toArray()
                ]);
            } else {
                \Log::error("Target evaluation not found", ['evaluation_id' => $evaluationId]);
            }
        }

        // แปลงข้อมูล assignments เป็น evaluatees array
        $evaluatees = [];
        foreach ($finalAssignments as $assignment) {
            if (!$assignment->evaluatee) {
                \Log::warning("Assignment without evaluatee relationship", ['assignment_id' => $assignment->id]);
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

        \Log::info("Final evaluatees result:", [
            'count' => count($evaluatees),
            'angle' => $currentAssignment->angle,
            'evaluatees' => collect($evaluatees)->map(function($e) {
                return ['id' => $e['id'], 'name' => $e['name']];
            })->toArray()
        ]);

        // ถ้าไม่มีคนอื่นในองศาเดียวกัน ให้คืนค่าเฉพาะคนที่กำลังประเมิน
        if (empty($evaluatees)) {
            \Log::warning("No evaluatees found in same angle, falling back to single evaluatee", [
                'angle' => $currentAssignment->angle
            ]);
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

        \Log::info("=== getEvaluateesInSameAngle DEBUG END ===");
        return $evaluatees;
    }

    /**
     * Helper method to get evaluatee IDs in the same angle for a specific evaluation
     */
    private function getEvaluateeIdsInSameAngle($evaluatorId, $evaluateeId, $evaluationId)
    {
        \Log::info("=== getEvaluateeIdsInSameAngle DEBUG START ===", [
            'evaluator_id' => $evaluatorId,
            'evaluatee_id' => $evaluateeId,
            'evaluation_id' => $evaluationId
        ]);

        // หาการมอบหมายของ evaluatee ที่กำลังประเมิน - ไม่ filter evaluation_id ก่อน
        $currentAssignment = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->first();

        \Log::info("Current assignment for IDs:", [
            'assignment' => $currentAssignment ? [
                'id' => $currentAssignment->id,
                'evaluator_id' => $currentAssignment->evaluator_id,
                'evaluatee_id' => $currentAssignment->evaluatee_id,
                'angle' => $currentAssignment->angle,
                'evaluation_id' => $currentAssignment->evaluation_id,
                'matches_target_evaluation' => $currentAssignment->evaluation_id == $evaluationId
            ] : null
        ]);

        if (!$currentAssignment) {
            \Log::warning("No assignment found for IDs, returning single evaluatee ID");
            return [$evaluateeId];
        }

        \Log::info("Searching for same angle evaluatee IDs:", [
            'current_angle' => $currentAssignment->angle,
            'current_evaluation_id' => $currentAssignment->evaluation_id,
            'target_evaluation_id' => $evaluationId
        ]);

        // ขั้นตอนที่ 1: ดึง IDs ทั้งหมดในองศาเดียวกัน (ไม่ filter evaluation_id ก่อน)
        $allSameAngleIds = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('angle', $currentAssignment->angle)
            ->pluck('evaluatee_id')
            ->toArray();

        \Log::info("ALL evaluatee IDs in same angle (no evaluation_id filter):", [
            'count' => count($allSameAngleIds),
            'angle' => $currentAssignment->angle,
            'evaluatee_ids' => $allSameAngleIds
        ]);

        // ขั้นตอนที่ 2: Filter ด้วย evaluation_id ที่เป็นเป้าหมาย
        $exactMatchIds = EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('angle', $currentAssignment->angle)
            ->where('evaluation_id', $evaluationId)
            ->pluck('evaluatee_id')
            ->toArray();

        \Log::info("EXACT MATCH evaluatee IDs (WITH evaluation_id filter):", [
            'count' => count($exactMatchIds),
            'evaluation_id_filter' => $evaluationId,
            'evaluatee_ids' => $exactMatchIds
        ]);

        // ขั้นตอนที่ 3: ถ้าไม่พบ exact match หรือพบน้อยกว่าที่คาดหวัง ให้ใช้ compatibility check
        $finalIds = $exactMatchIds;

        if (count($exactMatchIds) < count($allSameAngleIds)) {
            \Log::warning("Exact match found fewer IDs than all same angle IDs. Attempting compatibility check.", [
                'exact_match_count' => count($exactMatchIds),
                'all_same_angle_count' => count($allSameAngleIds),
                'missing_count' => count($allSameAngleIds) - count($exactMatchIds)
            ]);

            // โหลดข้อมูล evaluation ที่เป็นเป้าหมายและ assignments ทั้งหมด
            $targetEvaluation = Evaluation::find($evaluationId);
            
            if ($targetEvaluation) {
                $allSameAngleAssignments = EvaluationAssignment::with(['evaluatee'])
                    ->where('evaluator_id', $evaluatorId)
                    ->where('angle', $currentAssignment->angle)
                    ->get();

                // ตรวจสอบ compatibility ของแต่ละ assignment
                $compatibleIds = [];
                foreach ($allSameAngleAssignments as $assignment) {
                    // ถ้า evaluation_id ตรงกันอยู่แล้ว ให้ผ่าน
                    if ($assignment->evaluation_id == $evaluationId) {
                        $compatibleIds[] = $assignment->evaluatee_id;
                        continue;
                    }

                    // ตรวจสอบ compatibility ของ evaluation อื่น
                    if (!$assignment->evaluatee) {
                        \Log::warning("Assignment without evaluatee for ID check", ['assignment_id' => $assignment->id]);
                        continue;
                    }

                    $evaluatee = $assignment->evaluatee;
                    
                    // ตรวจสอบว่า evaluatee นี้เข้าเงื่อนไข target evaluation หรือไม่
                    $isCompatible = (
                        $targetEvaluation->user_type == $evaluatee->user_type &&
                        $targetEvaluation->grade_min <= $evaluatee->grade &&
                        $targetEvaluation->grade_max >= $evaluatee->grade
                    );

                    \Log::info("Compatibility check for evaluatee ID:", [
                        'evaluatee_id' => $evaluatee->id,
                        'evaluatee_name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                        'evaluatee_user_type' => $evaluatee->user_type,
                        'evaluatee_grade' => $evaluatee->grade,
                        'target_user_type' => $targetEvaluation->user_type,
                        'target_grade_range' => $targetEvaluation->grade_min . '-' . $targetEvaluation->grade_max,
                        'is_compatible' => $isCompatible,
                        'original_evaluation_id' => $assignment->evaluation_id,
                        'target_evaluation_id' => $evaluationId
                    ]);

                    if ($isCompatible) {
                        $compatibleIds[] = $assignment->evaluatee_id;
                    }
                }

                $finalIds = $compatibleIds;

                \Log::info("COMPATIBLE evaluatee IDs (after compatibility check):", [
                    'count' => count($compatibleIds),
                    'evaluatee_ids' => $compatibleIds
                ]);
            } else {
                \Log::error("Target evaluation not found for ID check", ['evaluation_id' => $evaluationId]);
            }
        }

        \Log::info("Final evaluatee IDs result:", [
            'count' => count($finalIds),
            'angle' => $currentAssignment->angle,
            'evaluatee_ids' => $finalIds
        ]);

        // ถ้าไม่มีคนในองศาเดียวกัน ให้ใช้แค่คนที่กำลังประเมิน
        if (empty($finalIds)) {
            \Log::warning("No evaluatee IDs found in same angle, falling back to single ID");
            return [$evaluateeId];
        }

        \Log::info("=== getEvaluateeIdsInSameAngle DEBUG END ===");
        return $finalIds;
    }

}
