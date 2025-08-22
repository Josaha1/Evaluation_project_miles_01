<?php

namespace App\Http\Controllers;

use App\Models\SatisfactionEvaluation;
use App\Models\Evaluation;
use App\Models\Answer;
use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SatisfactionEvaluationController extends Controller
{
    /**
     * Show satisfaction evaluation form
     */
    public function show(Request $request, int $evaluationId)
    {
        try {
            $user = Auth::user();
            $fiscalYear = $request->input('fiscal_year', date('Y'));
            
            // Check if user has completed the main evaluation
            $hasCompletedEvaluation = $this->hasUserCompletedEvaluation($user->id, $evaluationId, $fiscalYear);
            
            if (!$hasCompletedEvaluation) {
                return redirect()->route('evaluation.show', $evaluationId)
                    ->with('error', 'กรุณาทำแบบประเมินให้เสร็จสิ้นก่อน');
            }
            
            // Check if user has already completed satisfaction evaluation
            $hasCompletedSatisfaction = SatisfactionEvaluation::hasUserCompletedSatisfaction(
                $user->id, 
                $evaluationId, 
                $fiscalYear
            );
            
            if ($hasCompletedSatisfaction) {
                return redirect()->route('dashboard')
                    ->with('success', 'คุณได้ประเมินความพึงพอใจแล้ว');
            }
            
            // Get evaluation details
            $evaluation = Evaluation::findOrFail($evaluationId);
            
            return Inertia::render('SatisfactionEvaluation', [
                'evaluation' => [
                    'id' => $evaluation->id,
                    'title' => $evaluation->title,
                    'description' => $evaluation->description,
                ],
                'questions' => SatisfactionEvaluation::getQuestions(),
                'ratingScale' => SatisfactionEvaluation::getRatingScale(),
                'fiscalYear' => $fiscalYear,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->fname . ' ' . $user->lname,
                ],
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error showing satisfaction evaluation: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'เกิดข้อผิดพลาดในการแสดงแบบประเมินความพึงพอใจ');
        }
    }

    /**
     * Store satisfaction evaluation
     */
    public function store(Request $request, int $evaluationId)
    {
        try {
            $user = Auth::user();
            $fiscalYear = $request->input('fiscal_year', date('Y'));
            
            // Validate request
            $validated = $request->validate([
                'question_1' => 'required|integer|min:1|max:5',
                'question_2' => 'required|integer|min:1|max:5',
                'question_3' => 'required|integer|min:1|max:5',
                'question_4' => 'required|integer|min:1|max:5',
                'question_5' => 'required|integer|min:1|max:5',
                'question_6' => 'required|integer|min:1|max:5',
                'question_7' => 'required|integer|min:1|max:5',
                'question_8' => 'required|integer|min:1|max:5',
                'additional_comments' => 'nullable|string|max:1000',
                'fiscal_year' => 'required|string|size:4',
            ]);

            // Check if user has completed the main evaluation
            $hasCompletedEvaluation = $this->hasUserCompletedEvaluation($user->id, $evaluationId, $fiscalYear);
            
            if (!$hasCompletedEvaluation) {
                return response()->json([
                    'message' => 'กรุณาทำแบบประเมินให้เสร็จสิ้นก่อน'
                ], 400);
            }

            // Check if already completed satisfaction evaluation
            $hasCompletedSatisfaction = SatisfactionEvaluation::hasUserCompletedSatisfaction(
                $user->id, 
                $evaluationId, 
                $fiscalYear
            );
            
            if ($hasCompletedSatisfaction) {
                return response()->json([
                    'message' => 'คุณได้ประเมินความพึงพอใจแล้ว'
                ], 400);
            }

            // Store satisfaction evaluation
            DB::transaction(function () use ($validated, $user, $evaluationId, $fiscalYear) {
                SatisfactionEvaluation::create([
                    'user_id' => $user->id,
                    'evaluation_id' => $evaluationId,
                    'fiscal_year' => $fiscalYear,
                    'question_1' => $validated['question_1'],
                    'question_2' => $validated['question_2'],
                    'question_3' => $validated['question_3'],
                    'question_4' => $validated['question_4'],
                    'question_5' => $validated['question_5'],
                    'question_6' => $validated['question_6'],
                    'question_7' => $validated['question_7'],
                    'question_8' => $validated['question_8'],
                    'additional_comments' => $validated['additional_comments'],
                ]);
            });

            return redirect()->route('dashboard')
                ->with('success', 'บันทึกการประเมินความพึงพอใจเรียบร้อยแล้ว');

        } catch (ValidationException $e) {
            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'ข้อมูลไม่ถูกต้อง');
        } catch (\Exception $e) {
            Log::error('Error storing satisfaction evaluation: ' . $e->getMessage());
            return redirect()->back()
                ->withInput()
                ->with('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    }

    /**
     * Check if user has completed all assigned evaluations
     */
    private function hasUserCompletedEvaluation(int $userId, int $evaluationId, string $fiscalYear): bool
    {
        // Get all assignments for this user as evaluator (ทุกคนที่ได้รับมอบหมาย)
        $assignments = EvaluationAssignment::where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->get();

        if ($assignments->isEmpty()) {
            return false;
        }

        // Check if user has answered all required questions for all assignments
        foreach ($assignments as $assignment) {
            $hasAnsweredForThisAssignment = Answer::where('user_id', $userId)
                ->where('evaluatee_id', $assignment->evaluatee_id)
                ->where('evaluation_id', $assignment->evaluation_id)
                ->exists();

            if (!$hasAnsweredForThisAssignment) {
                return false;
            }
        }

        return true;
    }

    /**
     * Show satisfaction evaluation results (Admin only)
     */
    public function results(Request $request, int $evaluationId)
    {
        try {
            $user = Auth::user();
            
            // Check if user is admin
            if ($user->role !== 'admin') {
                return redirect()->route('dashboard')
                    ->with('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            }

            $fiscalYear = $request->input('fiscal_year', date('Y'));
            
            // Get satisfaction statistics
            $stats = SatisfactionEvaluation::getSatisfactionStats($evaluationId, $fiscalYear);
            
            // Get evaluation details
            $evaluation = Evaluation::findOrFail($evaluationId);
            
            // Get all satisfaction evaluations for detailed view
            $satisfactionEvaluations = SatisfactionEvaluation::with('user')
                ->where('evaluation_id', $evaluationId)
                ->where('fiscal_year', $fiscalYear)
                ->orderBy('created_at', 'desc')
                ->get();

            return Inertia::render('Admin/SatisfactionEvaluationResults', [
                'evaluation' => [
                    'id' => $evaluation->id,
                    'title' => $evaluation->title,
                    'description' => $evaluation->description,
                ],
                'fiscalYear' => $fiscalYear,
                'stats' => $stats,
                'questions' => SatisfactionEvaluation::getQuestions(),
                'ratingScale' => SatisfactionEvaluation::getRatingScale(),
                'satisfactionEvaluations' => $satisfactionEvaluations->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'user' => [
                            'name' => $item->user->fname . ' ' . $item->user->lname,
                            'position' => $item->user->position->title ?? 'ไม่ระบุ',
                            'division' => $item->user->division->name ?? 'ไม่ระบุ',
                        ],
                        'average_score' => $item->getAverageScore(),
                        'satisfaction_level' => $item->getSatisfactionLevel(),
                        'satisfaction_color' => $item->getSatisfactionColor(),
                        'additional_comments' => $item->additional_comments,
                        'created_at' => $item->created_at->format('d/m/Y H:i'),
                        'scores' => [
                            'question_1' => $item->question_1,
                            'question_2' => $item->question_2,
                            'question_3' => $item->question_3,
                            'question_4' => $item->question_4,
                            'question_5' => $item->question_5,
                            'question_6' => $item->question_6,
                            'question_7' => $item->question_7,
                            'question_8' => $item->question_8,
                        ],
                    ];
                }),
            ]);

        } catch (\Exception $e) {
            Log::error('Error showing satisfaction results: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'เกิดข้อผิดพลาดในการแสดงผลการประเมินความพึงพอใจ');
        }
    }

    /**
     * Check satisfaction evaluation status
     */
    public function checkStatus(Request $request, int $evaluationId)
    {
        try {
            $user = Auth::user();
            $fiscalYear = $request->input('fiscal_year', date('Y'));
            
            $hasCompletedEvaluation = $this->hasUserCompletedEvaluation($user->id, $evaluationId, $fiscalYear);
            $hasCompletedSatisfaction = SatisfactionEvaluation::hasUserCompletedSatisfaction(
                $user->id, 
                $evaluationId, 
                $fiscalYear
            );

            return response()->json([
                'has_completed_evaluation' => $hasCompletedEvaluation,
                'has_completed_satisfaction' => $hasCompletedSatisfaction,
                'can_evaluate_satisfaction' => $hasCompletedEvaluation && !$hasCompletedSatisfaction,
            ]);

        } catch (\Exception $e) {
            Log::error('Error checking satisfaction status: ' . $e->getMessage());
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
            ], 500);
        }
    }
}