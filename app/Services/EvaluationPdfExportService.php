<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class EvaluationPdfExportService
{
    private WeightedScoringService $weightedScoringService;
    private ScoreCalculationService $scoreCalculationService;

    public function __construct(
        WeightedScoringService $weightedScoringService,
        ScoreCalculationService $scoreCalculationService
    ) {
        $this->weightedScoringService = $weightedScoringService;
        $this->scoreCalculationService = $scoreCalculationService;
    }

    /**
     * Export evaluation report as PDF with text content only
     */
    public function exportEvaluationReport(array $filters = []): string
    {
        try {
            $fiscalYear = $filters['fiscal_year'] ?? $this->getCurrentFiscalYear();
            $division = $filters['division'] ?? null;
            $grade = $filters['grade'] ?? null;
            $groupFilter = $filters['group_filter'] ?? 'all';
            $compact = $filters['compact'] ?? true; // Default to compact layout

            // Get evaluation data
            $evaluationData = $this->getEvaluationData($fiscalYear, $division, $grade, $groupFilter);
            
            // Prepare data for PDF
            $pdfData = [
                'title' => 'รายงานการประเมิน 360 องศา',
                'fiscalYear' => $fiscalYear + 543, // Convert to Buddhist year
                'filters' => $filters,
                'evaluationData' => $evaluationData,
                'summary' => $this->calculateSummaryStats($evaluationData),
                'generatedAt' => now()->format('d/m/Y H:i:s'),
                'compact' => $compact
            ];

            // Generate PDF from text content - use compact template
            $template = $compact ? 'exports.evaluation-report' : 'exports.evaluation-report-detailed';
            $pdf = Pdf::loadView($template, $pdfData);
            $pdf->setPaper('A4', 'portrait');
            
            $filename = 'รายงานการประเมิน_360_องศา_' . ($compact ? 'แบบกระชับ_' : '') . now()->format('Y-m-d_H-i-s') . '.pdf';
            $filePath = storage_path('app/exports/' . $filename);
            
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            
            $pdf->save($filePath);
            
            return $filePath;
        } catch (\Exception $e) {
            Log::error('PDF export error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get evaluation data for PDF export
     */
    private function getEvaluationData($fiscalYear, $division, $grade, $groupFilter): Collection
    {
        $query = User::with([
            'evaluationAssignments' => function ($query) use ($fiscalYear) {
                $query->whereHas('evaluation', function ($q) use ($fiscalYear) {
                    $q->where('fiscal_year', $fiscalYear);
                });
            },
            'evaluationAssignments.evaluation',
            'evaluationAssignments.answers.question.aspect',
            'division'
        ])
        ->where('user_type', '!=', 'admin')
        ->whereNotNull('grade');

        // Apply grade filter based on group
        if ($groupFilter === '5-8') {
            $query->whereIn('grade', [5, 6, 7, 8]);
        } elseif ($groupFilter === '9-12') {
            $query->whereIn('grade', [9, 10, 11, 12]);
        } elseif ($grade) {
            $query->where('grade', $grade);
        }

        if ($division) {
            $query->where('division_id', $division);
        }

        $users = $query->get();

        return $users->map(function ($user) {
            $userScores = $this->weightedScoringService->calculateUserScores($user->id);
            
            return [
                'id' => $user->id,
                'name' => $user->name,
                'division' => $user->division->name ?? 'ไม่ระบุ',
                'grade' => $user->grade,
                'position' => $user->position ?? 'ไม่ระบุ',
                'scores' => $userScores,
                'evaluation_details' => $this->getEvaluationDetails($user)
            ];
        });
    }

    /**
     * Get detailed evaluation information for a user
     */
    private function getEvaluationDetails($user): array
    {
        $details = [];
        
        foreach ($user->evaluationAssignments as $assignment) {
            $evaluation = $assignment->evaluation;
            $answers = $assignment->answers->groupBy('question.aspect.name');
            
            $aspectScores = [];
            foreach ($answers as $aspectName => $aspectAnswers) {
                $totalScore = $aspectAnswers->sum('selected_option.score');
                $maxPossibleScore = $aspectAnswers->count() * 5; // Assuming 5 is max score
                $percentage = $maxPossibleScore > 0 ? ($totalScore / $maxPossibleScore) * 100 : 0;
                
                $aspectScores[$aspectName] = [
                    'score' => $totalScore,
                    'max_score' => $maxPossibleScore,
                    'percentage' => round($percentage, 2)
                ];
            }
            
            $details[] = [
                'evaluation_name' => $evaluation->title,
                'aspect_scores' => $aspectScores,
                'total_answers' => $assignment->answers->count(),
                'completion_status' => $assignment->is_completed ? 'สมบูรณ์' : 'ไม่สมบูรณ์'
            ];
        }
        
        return $details;
    }

    /**
     * Calculate summary statistics
     */
    private function calculateSummaryStats($evaluationData): array
    {
        $totalUsers = $evaluationData->count();
        $completedEvaluations = $evaluationData->filter(function ($user) {
            return collect($user['evaluation_details'])->where('completion_status', 'สมบูรณ์')->count() > 0;
        })->count();

        $averageScores = [];
        if ($totalUsers > 0) {
            $allScores = $evaluationData->pluck('scores')->filter();
            if ($allScores->count() > 0) {
                $averageScores = [
                    'self' => round($allScores->avg('self_score') ?? 0, 2),
                    'top' => round($allScores->avg('top_score') ?? 0, 2),
                    'bottom' => round($allScores->avg('bottom_score') ?? 0, 2),
                    'left' => round($allScores->avg('left_score') ?? 0, 2),
                    'right' => round($allScores->avg('right_score') ?? 0, 2),
                    'overall' => round($allScores->avg('overall_score') ?? 0, 2)
                ];
            }
        }

        return [
            'total_users' => $totalUsers,
            'completed_evaluations' => $completedEvaluations,
            'completion_rate' => $totalUsers > 0 ? round(($completedEvaluations / $totalUsers) * 100, 2) : 0,
            'average_scores' => $averageScores
        ];
    }

    /**
     * Get current fiscal year
     */
    private function getCurrentFiscalYear(): int
    {
        return now()->year;
    }
}