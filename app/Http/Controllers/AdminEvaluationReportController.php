<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Divisions;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use App\Services\ScoreCalculationService;
use App\Services\WeightedScoringService;
use App\Services\EvaluationExportService;
use App\Services\EvaluationLookupService;
use App\Services\EvaluationPdfExportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AdminEvaluationReportController extends Controller
{
    private const CACHE_TTL = 3600; // 1 hour
    private ScoreCalculationService $scoreCalculationService;
    private WeightedScoringService $weightedScoringService;
    private EvaluationExportService $evaluationExportService;
    private EvaluationPdfExportService $evaluationPdfExportService;

    public function __construct(
        ScoreCalculationService $scoreCalculationService,
        WeightedScoringService $weightedScoringService,
        EvaluationExportService $evaluationExportService,
        EvaluationPdfExportService $evaluationPdfExportService
    ) {
        $this->scoreCalculationService = $scoreCalculationService;
        $this->weightedScoringService = $weightedScoringService;
        $this->evaluationExportService = $evaluationExportService;
        $this->evaluationPdfExportService = $evaluationPdfExportService;
    }

    /**
     * Boost memory/time limits for heavy export operations.
     */
    private function boostLimits(): void
    {
        ini_set('memory_limit', '1G');
        set_time_limit(300);
    }

    /**
     * Main dashboard for AdminEvaluationReport React component
     */
    public function index(Request $request)
    {
        try {
            $validated = $this->validateRequest($request);
            $fiscalYear = $validated['fiscal_year'] ?? $this->getCurrentFiscalYear();
            $divisionId = $validated['division'] ?? null;
            $grade = $validated['grade'] ?? null;
            $userId = $validated['user_id'] ?? null;

            // Use Inertia lazy loading — detailedResults only loaded when tab is active
            $data = $this->fetchComprehensiveData($fiscalYear, $divisionId, $grade, $userId);

            return Inertia::render('AdminEvaluationReport', [
                'fiscalYear' => (string) $fiscalYear,
                'filters' => [
                    'fiscal_year' => (string) $fiscalYear,
                    'division' => $divisionId,
                    'grade' => $grade,
                    'user_id' => $userId,
                ],

                // Filter options (cached 2 hours separately)
                'availableYears' => $data['availableYears'],
                'availableDivisions' => $data['availableDivisions'],
                'availableGrades' => $data['availableGrades'],
                'availableUsers' => $data['availableUsers'] ?? [],
                'availableDepartments' => $data['availableDepartments'] ?? [],
                'availablePositions' => $data['availablePositions'] ?? [],

                // Dashboard data (cached 1 hour)
                'dashboardStats' => $data['dashboardStats'],
                'evaluationMetrics' => $data['evaluationMetrics'],
                'detailedResults' => $data['detailedResults'],
                'externalOrgMetrics' => $data['externalOrgMetrics'],
            ]);
        } catch (\Exception $e) {
            Log::error('AdminEvaluationReport index error: ' . $e->getMessage());
            return back()->with('error', 'เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน');
        }
    }

    /**
     * Fetch comprehensive data for the dashboard
     */
    private function fetchComprehensiveData(int $fiscalYear, $divisionId, $grade, $userId): array
    {
        // Filter options (realtime)
        $filterOptions = [
            'availableYears' => $this->getAvailableYears(),
            'availableDivisions' => $this->getAvailableDivisions(),
            'availableGrades' => $this->getAvailableGrades(),
            'availableUsers' => $this->getAvailableUsers(),
            'availableDepartments' => $this->getAvailableDepartments(),
            'availablePositions' => $this->getAvailablePositions(),
        ];

        // Report data (realtime)
        $rawScores = $this->getRawScores($fiscalYear, $divisionId, $grade, $userId);

        $assignments = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->when($divisionId, fn($q) => $q->join('users as u', 'evaluation_assignments.evaluatee_id', '=', 'u.id')->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->join('users as ug', 'evaluation_assignments.evaluatee_id', '=', 'ug.id')->where('ug.grade', $grade))
            ->select('evaluation_assignments.evaluator_id', 'evaluation_assignments.evaluatee_id')
            ->get();

        $reportData = [
            'dashboardStats' => $this->calculateDashboardStats($rawScores, collect(), $assignments),
            'evaluationMetrics' => $this->calculateEvaluationMetrics($rawScores, $fiscalYear),
            'detailedResults' => $this->formatDetailedResults($rawScores, $fiscalYear),
            'externalOrgMetrics' => $this->getExternalOrgMetrics($fiscalYear),
        ];

        return array_merge($filterOptions, $reportData);
    }

    /**
     * Get raw scores data from actual database
     */
    private function getRawScores(int $fiscalYear, $divisionId = null, $grade = null, $userId = null): Collection
    {
        try {
            // First, get all evaluation assignments for the fiscal year
            $assignmentsQuery = DB::table('evaluation_assignments as ea')
                ->join('users as evaluatee', 'ea.evaluatee_id', '=', 'evaluatee.id')
                ->leftJoin('divisions as d', 'evaluatee.division_id', '=', 'd.id')
                ->leftJoin('positions as p', 'evaluatee.position_id', '=', 'p.id')
                ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
                ->where('ea.fiscal_year', $fiscalYear);

            // Apply filters to assignments
            if ($divisionId) {
                $assignmentsQuery->where('evaluatee.division_id', $divisionId);
            }
            if ($grade) {
                $assignmentsQuery->where('evaluatee.grade', $grade);
            }
            if ($userId) {
                $assignmentsQuery->where('evaluatee.id', $userId);
            }

            $assignments = $assignmentsQuery->select([
                'ea.*',
                'evaluatee.fname',
                'evaluatee.lname',
                'evaluatee.grade as evaluatee_grade',
                'd.name as evaluatee_division',
                'dept.name as evaluatee_department',
                'p.title as evaluatee_position'
            ])->get();

            // BATCH: Get aggregated scores per evaluatee+angle
            $evaluateeIds = $assignments->pluck('evaluatee_id')->unique();

            // Also include evaluatees from external access codes
            $externalEvaluateeIds = DB::table('external_access_codes')
                ->where('fiscal_year', $fiscalYear)
                ->whereNotNull('evaluatee_id')
                ->distinct()
                ->pluck('evaluatee_id');
            $allEvaluateeIds = $evaluateeIds->merge($externalEvaluateeIds)->unique();

            if ($allEvaluateeIds->isEmpty()) {
                return collect([]);
            }

            // Pre-load option scores lookup (734 rows, 1ms)
            $optionScores = DB::table('options')->pluck('score', 'id')->toArray();

            // Helper: resolve score from value (option ID or direct 1-5)
            $resolveScore = function ($value) use ($optionScores) {
                if (isset($optionScores[$value])) return (float) $optionScores[$value];
                if (preg_match('/^[1-5]$/', $value)) return (float) $value;
                return null;
            };

            // Helper: aggregate raw rows into evaluatee+angle scores
            $aggregateRows = function ($rows, $angleField = 'angle') use ($resolveScore) {
                $scores = [];
                foreach ($rows as $row) {
                    $score = $resolveScore($row->value);
                    if ($score === null) continue;
                    $key = $row->evaluatee_id . '-' . $row->$angleField;
                    if (!isset($scores[$key])) {
                        $scores[$key] = (object) ['evaluatee_id' => $row->evaluatee_id, 'angle' => $row->$angleField, 'total' => 0, 'count' => 0];
                    }
                    $scores[$key]->total += $score * $row->cnt;
                    $scores[$key]->count += $row->cnt;
                }
                return collect($scores)->map(function ($s) {
                    return (object) ['evaluatee_id' => $s->evaluatee_id, 'angle' => $s->angle, 'score' => $s->count > 0 ? round($s->total / $s->count, 2) : 0, 'answer_count' => $s->count];
                })->values();
            };

            // Query 1: Internal scores (NO options join = 10x faster)
            $internalRaw = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->whereIn('a.evaluatee_id', $allEvaluateeIds)
                ->where('ea.fiscal_year', $fiscalYear)
                ->whereNull('a.external_access_code_id')
                ->groupBy('a.evaluatee_id', 'ea.angle', 'a.value')
                ->select('a.evaluatee_id', 'ea.angle', 'a.value', DB::raw('COUNT(*) as cnt'))
                ->get();
            $internalAnswers = $aggregateRows($internalRaw);

            // Query 2: Self-evaluation (user_id = evaluatee_id, no assignment)
            $selfRaw = DB::table('answers as a')
                ->whereColumn('a.user_id', 'a.evaluatee_id')
                ->whereNull('a.external_access_code_id')
                ->where('a.fiscal_year', $fiscalYear)
                ->whereIn('a.evaluatee_id', $allEvaluateeIds)
                ->groupBy('a.evaluatee_id', 'a.value')
                ->select('a.evaluatee_id', DB::raw("'self' as angle"), 'a.value', DB::raw('COUNT(*) as cnt'))
                ->get();
            $selfAnswers = $aggregateRows($selfRaw);

            // Query 3: External answers → 'right' angle
            $externalRaw = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->where('eac.fiscal_year', $fiscalYear)
                ->whereNotNull('a.external_access_code_id')
                ->whereIn('a.evaluatee_id', $allEvaluateeIds)
                ->groupBy('a.evaluatee_id', 'a.value')
                ->select('a.evaluatee_id', DB::raw("'right' as angle"), 'a.value', DB::raw('COUNT(*) as cnt'))
                ->get();
            $externalAnswers = $aggregateRows($externalRaw);

            // Merge internal + self + external
            $mergedAnswers = $internalAnswers->concat($selfAnswers)->concat($externalAnswers);
            $allAnswers = $mergedAnswers->groupBy('evaluatee_id')->map(function ($rows) {
                // If both internal right and external right exist, average them
                return $rows->groupBy('angle')->map(function ($angleRows) {
                    $totalScore = 0;
                    $totalCount = 0;
                    foreach ($angleRows as $row) {
                        if ($row->score > 0 && $row->answer_count > 0) {
                            $totalScore += $row->score * $row->answer_count;
                            $totalCount += $row->answer_count;
                        }
                    }
                    return (object) [
                        'angle' => $angleRows->first()->angle,
                        'score' => $totalCount > 0 ? round($totalScore / $totalCount, 2) : 0,
                        'answer_count' => $totalCount,
                    ];
                });
            });

            // BATCH: Get evaluator progress for ALL users in a single query
            $allEvaluatorProgress = $this->getBatchEvaluatorProgress($allEvaluateeIds, $fiscalYear);

            $userScores = [];
            $groupedAssignments = $assignments->groupBy('evaluatee_id');

            // Add external-only evaluatees (not in assignments) to groupedAssignments
            $externalOnlyIds = $externalEvaluateeIds->diff($evaluateeIds);
            if ($externalOnlyIds->isNotEmpty()) {
                $externalUsers = DB::table('users as u')
                    ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                    ->leftJoin('departments as dep', 'u.department_id', '=', 'dep.id')
                    ->leftJoin('positions as p', 'u.position_id', '=', 'p.id')
                    ->whereIn('u.id', $externalOnlyIds)
                    ->select([
                        'u.id as evaluatee_id', 'u.fname', 'u.lname',
                        'u.grade as evaluatee_grade',
                        'd.name as evaluatee_division',
                        'dep.name as evaluatee_department',
                        'p.title as evaluatee_position',
                        DB::raw("'right' as angle"),
                        DB::raw('0 as evaluation_id'),
                    ])
                    ->get();
                foreach ($externalUsers as $eu) {
                    $groupedAssignments[$eu->evaluatee_id] = collect([$eu]);
                }
            }

            foreach ($groupedAssignments as $evaluateeId => $userAssignments) {
                $firstAssignment = $userAssignments->first();
                $answers = $allAnswers->get($evaluateeId, collect());

                // Scores aggregated per angle (already keyed by angle from merge logic)
                $angleScores = $answers->map(fn($row) => (float) $row->score);

                $selfScore = $angleScores->get('self', 0);
                $topScore = $angleScores->get('top', 0);
                $bottomScore = $angleScores->get('bottom', 0);
                $leftScore = $angleScores->get('left', 0);
                $rightScore = $angleScores->get('right', 0);

                // Available angles: from assignments + 'right' if external answers exist
                $assignmentAngles = $userAssignments->pluck('angle')->unique()->toArray();
                if ($angleScores->has('right') && !in_array('right', $assignmentAngles)) {
                    $assignmentAngles[] = 'right';
                }
                $availableAngles = count($assignmentAngles);
                $completedAngles = $angleScores->filter(fn($score) => $score > 0)->count();

                // Weighted average ตามระดับ (grade) ของผู้ถูกประเมิน
                $grade = (int) ($firstAssignment->evaluatee_grade ?? 0);
                $weights = $this->getStakeholderWeights($grade);
                $scoreMap = ['self' => $selfScore, 'top' => $topScore, 'bottom' => $bottomScore, 'left' => $leftScore, 'right' => $rightScore];
                $weightedSum = 0;
                $totalWeight = 0;
                foreach ($weights as $angle => $weight) {
                    if (($scoreMap[$angle] ?? 0) > 0 && $weight > 0) {
                        $weightedSum += $scoreMap[$angle] * $weight;
                        $totalWeight += $weight;
                    }
                }
                $average = $totalWeight > 0 ? $weightedSum / $totalWeight : 0;
                $completionRate = $availableAngles > 0 ? ($completedAngles / $availableAngles) * 100 : 0;

                $userScores[] = [
                    'evaluatee_id' => $evaluateeId,
                    'evaluatee_name' => trim($firstAssignment->fname . ' ' . $firstAssignment->lname),
                    'evaluatee_grade' => $firstAssignment->evaluatee_grade,
                    'evaluatee_division' => $firstAssignment->evaluatee_division ?? 'ไม่ระบุ',
                    'evaluatee_department' => $firstAssignment->evaluatee_department ?? 'ไม่ระบุ',
                    'evaluatee_position' => $firstAssignment->evaluatee_position ?? 'ไม่ระบุ',
                    'self' => round($selfScore, 2),
                    'top' => round($topScore, 2),
                    'bottom' => round($bottomScore, 2),
                    'left' => round($leftScore, 2),
                    'right' => round($rightScore, 2),
                    'average' => round($average, 2),
                    'completion_rate' => round($completionRate, 1),
                    'total_answers' => $answers->sum('answer_count'),
                    'available_angles' => $availableAngles,
                    'completed_angles' => $completedAngles,
                    'last_updated' => null,
                    'evaluator_progress' => $allEvaluatorProgress[$evaluateeId] ?? [
                        'total_assignments' => 0, 'completed_assignments' => 0,
                        'in_progress_assignments' => 0, 'not_started_assignments' => 0,
                        'overall_progress_percentage' => 0, 'total_questions_to_answer' => 0,
                        'total_questions_answered' => 0, 'detailed_progress_percentage' => 0,
                        'status' => 'no_assignments'
                    ],
                ];
            }

            return collect($userScores);

        } catch (\Exception $e) {
            Log::error('Error fetching raw scores: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return collect([]);
        }
    }

    /**
     * Calculate dashboard statistics from pre-loaded data (zero extra queries).
     * Was: 7+ separate DB queries. Now: all derived from $rawScores + $assignments.
     */
    private function calculateDashboardStats(Collection $rawScores, Collection $users, Collection $assignments): array
    {
        // uniqueEvaluatees = from rawScores (already includes external-only evaluatees)
        $uniqueEvaluatees = $rawScores->pluck('evaluatee_id')->unique()->count();
        $totalAssignments = $assignments->count();

        // Completed evaluations — evaluatees who have all assigned angles scored
        $completedEvaluations = $rawScores->filter(function ($score) {
            // If evaluatee has evaluator_progress, use that
            $progress = $score['evaluator_progress'] ?? null;
            if ($progress && ($progress['status'] === 'completed' || ($progress['overall_progress_percentage'] ?? 0) >= 100)) {
                return true;
            }
            // Fallback: completion_rate >= 100
            return ($score['completion_rate'] ?? 0) >= 100;
        })->count();

        $pendingEvaluations = max(0, $uniqueEvaluatees - $completedEvaluations);
        $overallCompletionRate = $uniqueEvaluatees > 0 ? ($completedEvaluations / $uniqueEvaluatees) * 100 : 0;

        // Average score from rawScores (already has per-evaluatee averages)
        $validScores = $rawScores->pluck('average')->filter(fn($s) => $s > 0);
        $averageScore = $validScores->isNotEmpty() ? $validScores->avg() : 0;

        // Total answers from evaluator_progress data
        $totalAnswers = $rawScores->sum(fn($s) => $s['evaluator_progress']['total_questions_answered'] ?? $s['total_answers'] ?? 0);
        $totalQuestions = $rawScores->sum(fn($s) => $s['evaluator_progress']['total_questions_to_answer'] ?? 0);

        $highPerformers = $rawScores->filter(fn($score) => $score['average'] >= 4.0)->count();

        return [
            'totalParticipants' => $uniqueEvaluatees,
            'completedEvaluations' => $completedEvaluations,
            'pendingEvaluations' => $pendingEvaluations,
            'overallCompletionRate' => round($overallCompletionRate, 1),
            'averageScore' => round($averageScore, 2),
            'totalQuestions' => $totalQuestions,
            'totalAnswers' => $totalAnswers,
            'uniqueEvaluators' => $assignments->pluck('evaluator_id')->unique()->count(),
            'uniqueEvaluatees' => $uniqueEvaluatees,
            'evaluationTypes' => 1,
            'totalAssignments' => $totalAssignments,
            'avgCompletionRate' => round($overallCompletionRate, 1),
            'highPerformers' => $highPerformers,
            'lastUpdated' => now()->toISOString()
        ];
    }

    /**
     * Calculate evaluation metrics for analytics
     */
    private function calculateEvaluationMetrics(Collection $rawScores, int $fiscalYear = 0): array
    {
        return [
            'byGrade' => $this->getMetricsByGrade($rawScores),
            'byDivision' => $this->getMetricsByDivision($rawScores),
            'byAngle' => $this->getMetricsByAngle($rawScores),
            'trends' => $this->getTrendMetrics($rawScores, $fiscalYear),
        ];
    }

    /**
     * Format detailed results for individual reports
     * Uses batch-loaded evaluators and aspect scores to avoid N+1 queries
     */
    private function formatDetailedResults(Collection $rawScores, int $fiscalYear): array
    {
        // Lightweight: send only summary data to frontend.
        // evaluators + aspectScores are loaded on-demand via API (getEvaluateeDetails).
        return $rawScores->map(function ($score) {
            return [
                'id' => $score['evaluatee_id'],
                'evaluateeName' => $score['evaluatee_name'],
                'evaluateeGrade' => $score['evaluatee_grade'],
                'evaluateeDivision' => $score['evaluatee_division'],
                'evaluateeDepartment' => $score['evaluatee_department'],
                'evaluateePosition' => $score['evaluatee_position'],
                'scores' => [
                    'self' => $score['self'],
                    'top' => $score['top'],
                    'bottom' => $score['bottom'],
                    'left' => $score['left'],
                    'right' => $score['right'],
                    'average' => $score['average'],
                ],
                'completionStatus' => [
                    'totalAngles' => $score['available_angles'] ?? 5,
                    'completedAngles' => $score['completed_angles'] ?? 0,
                    'completionRate' => $score['completion_rate'],
                ],
                'completed_angles' => $score['completed_angles'] ?? 0,
                'available_angles' => $score['available_angles'] ?? 5,
                'total_answers' => $score['total_answers'] ?? 0,
                'evaluator_progress' => $score['evaluator_progress'] ?? [
                    'total_assignments' => 0,
                    'completed_assignments' => 0,
                    'overall_progress_percentage' => 0,
                    'total_questions_to_answer' => 0,
                    'total_questions_answered' => 0,
                    'status' => 'no_assignments'
                ],
            ];
        })->toArray();
    }

    /**
     * Get metrics by grade
     */
    private function getMetricsByGrade(Collection $rawScores): array
    {
        return $rawScores->groupBy('evaluatee_grade')->map(function ($scores, $grade) {
            $total = $scores->count();
            $completed = $scores->where('completion_rate', '>=', 80)->count();
            $completionRate = $total > 0 ? ($completed / $total) * 100 : 0;
            $averageScore = $scores->avg('average') ?? 0;

            return [
                'grade' => $grade,
                'total' => $total,
                'completed' => $completed,
                'averageScore' => round($averageScore, 2),
                'completionRate' => round($completionRate, 1),
            ];
        })->values()->toArray();
    }

    /**
     * Get metrics by division
     */
    private function getMetricsByDivision(Collection $rawScores): array
    {
        // Pre-load all division name→id mappings in one query (was N+1)
        $divisionMap = DB::table('divisions')->pluck('id', 'name');

        return $rawScores->groupBy('evaluatee_division')->map(function ($scores, $division) use ($divisionMap) {
            $total = $scores->count();
            $completed = $scores->where('completion_rate', '>=', 80)->count();
            $completionRate = $total > 0 ? ($completed / $total) * 100 : 0;
            $averageScore = $scores->avg('average') ?? 0;

            return [
                'division' => $division ?? 'N/A',
                'divisionId' => $divisionMap[$division] ?? 0,
                'total' => $total,
                'completed' => $completed,
                'averageScore' => round($averageScore, 2),
                'completionRate' => round($completionRate, 1),
            ];
        })->values()->toArray();
    }

    /**
     * Get metrics by angle
     */
    private function getMetricsByAngle(Collection $rawScores): array
    {
        $angles = ['self', 'top', 'bottom', 'left', 'right'];
        
        return collect($angles)->map(function ($angle) use ($rawScores) {
            $angleScores = $rawScores->pluck($angle)->filter(fn($score) => $score > 0);
            
            return [
                'angle' => $angle,
                'total' => $rawScores->count(),
                'completed' => $angleScores->count(),
                'averageScore' => round($angleScores->avg() ?? 0, 2),
            ];
        })->toArray();
    }

    /**
     * Get trend metrics from actual database data.
     * Optimized: 2 aggregate queries instead of 24 (was 12 months × 2 queries).
     */
    private function getTrendMetrics(Collection $rawScores, int $fiscalYear = 0): array
    {
        try {
            $startDate = now()->subMonths(11)->startOfMonth()->toDateString();
            $endDate = now()->endOfMonth()->toDateString();

            // Monthly completions: internal + external
            $internalCompletions = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function ($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->whereBetween('a.created_at', [$startDate, $endDate])
                ->when($fiscalYear > 0, fn($q) => $q->where('ea.fiscal_year', $fiscalYear))
                ->select(DB::raw("DATE_FORMAT(a.created_at, '%Y-%m') as ym"), DB::raw('COUNT(DISTINCT CONCAT(a.evaluatee_id, "-", ea.angle)) as completions'))
                ->groupBy('ym')
                ->pluck('completions', 'ym');

            $externalCompletions = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->whereNotNull('a.external_access_code_id')
                ->whereBetween('a.created_at', [$startDate, $endDate])
                ->when($fiscalYear > 0, fn($q) => $q->where('eac.fiscal_year', $fiscalYear))
                ->select(DB::raw("DATE_FORMAT(a.created_at, '%Y-%m') as ym"), DB::raw('COUNT(DISTINCT a.evaluatee_id) as completions'))
                ->groupBy('ym')
                ->pluck('completions', 'ym');

            // Merge completions
            $monthlyCompletions = $internalCompletions->toArray();
            foreach ($externalCompletions as $ym => $count) {
                $monthlyCompletions[$ym] = ($monthlyCompletions[$ym] ?? 0) + $count;
            }

            // Monthly avg scores: use answers directly (works for both internal + external)
            $monthlyScores = DB::table('answers as a')
                ->where('a.fiscal_year', $fiscalYear > 0 ? $fiscalYear : now()->year)
                ->whereBetween('a.created_at', [$startDate, $endDate])
                ->where('a.value', '!=', '')
                ->whereNotNull('a.value')
                ->select(
                    DB::raw("DATE_FORMAT(a.created_at, '%Y-%m') as ym"),
                    DB::raw("AVG(CASE WHEN a.value REGEXP '^[0-9]+(\\.?[0-9]*)$' THEN CAST(a.value AS DECIMAL(5,2)) ELSE NULL END) as avg_score")
                )
                ->groupBy('ym')
                ->pluck('avg_score', 'ym');

            // Build results in PHP
            $trends = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $ym = $month->format('Y-m');
                $trends[] = [
                    'date' => $month->format('Y-m-d'),
                    'month_name' => $month->format('M Y'),
                    'completions' => (int) ($monthlyCompletions[$ym] ?? 0),
                    'averageScore' => round((float) ($monthlyScores[$ym] ?? 0), 2),
                    'target' => 4.0,
                ];
            }

            return $trends;
        } catch (\Exception $e) {
            Log::error('Error getting trend metrics: ' . $e->getMessage());
            $trends = [];
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $trends[] = [
                    'date' => $month->format('Y-m-d'),
                    'month_name' => $month->format('M Y'),
                    'completions' => 0,
                    'averageScore' => 0,
                    'target' => 4.0,
                ];
            }
            return $trends;
        }
    }

    /**
     * Get available years from actual data
     */
    private function getAvailableYears(): array
    {
        try {
            // Single UNION query instead of 2 separate queries
            $allYears = DB::select("
                SELECT DISTINCT fiscal_year AS y FROM evaluation_assignments WHERE fiscal_year IS NOT NULL
                UNION
                SELECT DISTINCT YEAR(created_at) AS y FROM answers WHERE created_at IS NOT NULL
                ORDER BY y
            ");

            $years = collect($allYears)->pluck('y')->filter()->unique()->sort()->values();

            $currentFiscalYear = EvaluationLookupService::currentFiscalYear();
            if (!$years->contains($currentFiscalYear)) {
                $years->push($currentFiscalYear);
            }

            return $years->map(fn($y) => (string) $y)->values()->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting available years: ' . $e->getMessage());
            $fallbackYear = EvaluationLookupService::currentFiscalYear();
            return [(string) $fallbackYear];
        }
    }

    /**
     * Get available divisions
     */
    private function getAvailableDivisions(): array
    {
        try {
            return DB::table('divisions')
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get available grades
     */
    private function getAvailableGrades(): array
    {
        try {
            return DB::table('users')
                ->whereNotNull('grade')
                ->distinct()
                ->pluck('grade')
                ->sort()
                ->values()
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get available users
     */
    private function getAvailableUsers(): array
    {
        // LOV ผู้ถูกประเมิน (id + ชื่อเต็ม) ใช้โดย ExportsTab filter + modal เลือกผู้ถูกประเมิน
        // ประกอบชื่อใน PHP ไม่ใช้ CONCAT ใน SQL (กัน sqlite ไม่รองรับตอน test)
        return DB::table('users')
            ->where('role', 'user')
            ->orderBy('fname')->orderBy('lname')
            ->get(['id', 'prename', 'fname', 'lname'])
            ->map(fn ($u) => [
                'id'   => $u->id,
                'name' => trim(($u->prename ?? '') . $u->fname . ' ' . $u->lname),
            ])
            ->all();
    }

    /**
     * Get available departments
     */
    private function getAvailableDepartments(): array
    {
        try {
            return DB::table('departments')
                ->select('id', 'name as title')
                ->orderBy('name')
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get available positions
     */
    private function getAvailablePositions(): array
    {
        try {
            return DB::table('positions')
                ->select('id', 'title')
                ->orderBy('title')
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get users
     */
    private function getUsers($divisionId = null, $grade = null): Collection
    {
        $query = DB::table('users')->where('role', 'user');
        
        if ($divisionId) {
            $query->where('division_id', $divisionId);
        }
        if ($grade) {
            $query->where('grade', $grade);
        }
        
        return $query->get();
    }

    /**
     * Get assignments
     */
    private function getAssignments(int $fiscalYear, $divisionId = null, $grade = null): Collection
    {
        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1);
        $end = Carbon::createFromDate($fiscalYear, 9, 30);
        
        $query = DB::table('evaluation_assignments as ea')
            ->join('users as u', 'ea.evaluatee_id', '=', 'u.id')
            ->whereBetween('ea.created_at', [$start, $end]);
            
        if ($divisionId) {
            $query->where('u.division_id', $divisionId);
        }
        if ($grade) {
            $query->where('u.grade', $grade);
        }
        
        return $query->get();
    }

    /**
     * Get completed angles count
     */
    private function getCompletedAnglesCount(array $score): int
    {
        $angles = ['self', 'top', 'bottom', 'left', 'right'];
        return count(array_filter($angles, fn($angle) => ($score[$angle] ?? 0) > 0));
    }

    /**
     * Get evaluators for user (actual implementation using database)
     */
    private function getEvaluatorsForUser(int $userId): array
    {
        try {
            return DB::table('evaluation_assignments as ea')
                ->join('users as u', 'ea.evaluator_id', '=', 'u.id')
                ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                ->leftJoin('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->where('ea.evaluatee_id', $userId)
                ->select([
                    'ea.id as assignment_id',
                    DB::raw("CONCAT(u.fname, ' ', u.lname) as name"),
                    'u.emid as evaluator_emid',
                    'ea.angle',
                    'd.name as division',
                    'ea.created_at',
                    DB::raw('MAX(a.created_at) as last_answer_date'),
                    DB::raw('COUNT(a.id) as answer_count'),
                    DB::raw('AVG(COALESCE(o.score, 
                        CASE 
                            WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                            ELSE 0 
                        END)) as avg_score')
                ])
                ->groupBy([
                    'ea.id', 'u.fname', 'u.lname', 'u.emid', 'ea.angle', 
                    'd.name', 'ea.created_at'
                ])
                ->get()
                ->map(function ($evaluator) {
                    $completed = !is_null($evaluator->last_answer_date);
                    return [
                        'id' => 0, // Not needed for display
                        'name' => $evaluator->name,
                        'angle' => $evaluator->angle,
                        'completed' => $completed,
                        'score' => $completed ? round($evaluator->avg_score, 2) : 0,
                        'division' => $evaluator->division ?? 'N/A',
                        'completed_at' => $evaluator->last_answer_date,
                    ];
                })
                ->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting evaluators: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get aspect scores for user (actual implementation using database)
     */
    private function getAspectScoresForUser(int $userId): array
    {
        try {
            $aspectScores = DB::table('answers as a')
                ->join('questions as q', 'a.question_id', '=', 'q.id')
                ->join('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->where('a.evaluatee_id', $userId)
                ->whereNotNull('asp.name')
                ->select([
                    'asp.id as aspect_id',
                    'asp.name as aspect_name',
                    DB::raw('AVG(COALESCE(o.score, 
                        CASE 
                            WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                            ELSE 0 
                        END)) as avg_score'),
                    DB::raw('COUNT(a.id) as answer_count')
                ])
                ->groupBy('asp.id', 'asp.name')
                ->orderBy('asp.name')
                ->get();

            return $aspectScores->map(function($aspect) {
                $score = round($aspect->avg_score, 2);
                return [
                    'aspect' => $aspect->aspect_name,
                    'score' => $score,
                    'max_score' => 5.0,
                    'percentage' => round(($score / 5.0) * 100, 1),
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting aspect scores: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Batch-load evaluators for multiple evaluatees in a single query.
     * Returns an array grouped by evaluatee_id.
     */
    private function getBatchEvaluatorsForUsers(array $evaluateeIds, int $fiscalYear): array
    {
        if (empty($evaluateeIds)) {
            return [];
        }

        try {
            $rows = DB::table('evaluation_assignments as ea')
                ->join('users as u', 'ea.evaluator_id', '=', 'u.id')
                ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                ->leftJoin('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->whereIn('ea.evaluatee_id', $evaluateeIds)
                ->select([
                    'ea.evaluatee_id',
                    'ea.id as assignment_id',
                    DB::raw("CONCAT(u.fname, ' ', u.lname) as name"),
                    'u.emid as evaluator_emid',
                    'ea.angle',
                    'd.name as division',
                    'ea.created_at',
                    DB::raw('MAX(a.created_at) as last_answer_date'),
                    DB::raw('COUNT(a.id) as answer_count'),
                    DB::raw('AVG(COALESCE(o.score,
                        CASE
                            WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                            ELSE 0
                        END)) as avg_score')
                ])
                ->groupBy([
                    'ea.evaluatee_id', 'ea.id', 'u.fname', 'u.lname', 'u.emid',
                    'ea.angle', 'd.name', 'ea.created_at'
                ])
                ->get();

            $grouped = [];
            foreach ($rows as $evaluator) {
                $completed = !is_null($evaluator->last_answer_date);
                $grouped[$evaluator->evaluatee_id][] = [
                    'id' => 0,
                    'name' => $evaluator->name,
                    'angle' => $evaluator->angle,
                    'completed' => $completed,
                    'score' => $completed ? round($evaluator->avg_score, 2) : 0,
                    'division' => $evaluator->division ?? 'N/A',
                    'completed_at' => $evaluator->last_answer_date,
                ];
            }

            return $grouped;
        } catch (\Exception $e) {
            Log::error('Error batch-loading evaluators: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Batch-load aspect scores for multiple evaluatees in a single query.
     * Returns an array grouped by evaluatee_id.
     */
    private function getBatchAspectScoresForUsers(array $evaluateeIds, int $fiscalYear): array
    {
        if (empty($evaluateeIds)) {
            return [];
        }

        try {
            $rows = DB::table('answers as a')
                ->join('questions as q', 'a.question_id', '=', 'q.id')
                ->join('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->whereIn('a.evaluatee_id', $evaluateeIds)
                ->whereNotNull('asp.name')
                ->select([
                    'a.evaluatee_id',
                    'asp.id as aspect_id',
                    'asp.name as aspect_name',
                    DB::raw('AVG(COALESCE(o.score,
                        CASE
                            WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                            ELSE 0
                        END)) as avg_score'),
                    DB::raw('COUNT(a.id) as answer_count')
                ])
                ->groupBy('a.evaluatee_id', 'asp.id', 'asp.name')
                ->orderBy('asp.name')
                ->get();

            $grouped = [];
            foreach ($rows as $aspect) {
                $score = round($aspect->avg_score, 2);
                $grouped[$aspect->evaluatee_id][] = [
                    'aspect' => $aspect->aspect_name,
                    'score' => $score,
                    'max_score' => 5.0,
                    'percentage' => round(($score / 5.0) * 100, 1),
                ];
            }

            return $grouped;
        } catch (\Exception $e) {
            Log::error('Error batch-loading aspect scores: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get division ID by name
     */
    // getDivisionId removed — division lookup now pre-loaded in getMetricsByDivision()

    /**
     * Get external organization metrics for the fiscal year
     */
    private function getExternalOrgMetrics(int $fiscalYear): array
    {
        try {
            // Phase 4: evaluator_count นับ stakeholder คนจริง (ถ้า session มี stakeholder_id)
            // fallback ใช้ session_id สำหรับ session legacy ก่อน backfill
            $results = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
                ->leftJoin('external_evaluation_sessions as ses', 'a.external_session_id', '=', 'ses.id')
                ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                ->where('eac.fiscal_year', $fiscalYear)
                ->whereNotNull('a.external_access_code_id')
                ->where('a.value', '!=', '')
                ->whereNotNull('a.value')
                ->groupBy('eo.id', 'eo.name')
                ->select([
                    'eo.id as org_id',
                    'eo.name as org_name',
                    DB::raw('COUNT(a.id) as total_responses'),
                    DB::raw('ROUND(AVG(CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[0-9]+(\\.?[0-9]*)$" THEN CAST(a.value AS DECIMAL(5,2)) ELSE NULL END), 2) as avg_score'),
                    DB::raw('COUNT(DISTINCT a.evaluatee_id) as evaluatee_count'),
                    DB::raw('COUNT(DISTINCT COALESCE(ses.external_stakeholder_id, ses.id)) as evaluator_count'),
                ])
                ->get();

            return $results->map(function ($row) {
                return [
                    'org_id' => $row->org_id,
                    'org_name' => $row->org_name,
                    'total_responses' => $row->total_responses,
                    'avg_score' => round((float) $row->avg_score, 2),
                    'evaluatee_count' => $row->evaluatee_count,
                    'evaluator_count' => $row->evaluator_count ?? 0,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting external org metrics: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get total questions count
     */
    private function getTotalQuestions(): int
    {
        try {
            return DB::table('questions')->count();
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get current fiscal year
     */
    /**
     * Get stakeholder weights by evaluatee grade
     * พนักงาน 4-8: self 50%, top 20%, left 30%
     * ผู้บริหาร 9-12: self 10%, top 25%, bottom 25%, left 20%, right 20%
     * ผู้ว่าการ 13+: self 10%, top 25%, bottom 25%, left 20%, right 20%
     */
    private function getStakeholderWeights(int $grade): array
    {
        if ($grade >= 9) {
            return ['self' => 0.10, 'top' => 0.25, 'bottom' => 0.25, 'left' => 0.20, 'right' => 0.20];
        }
        return ['self' => 0.50, 'top' => 0.20, 'bottom' => 0.0, 'left' => 0.30, 'right' => 0.0];
    }

    private function getCurrentFiscalYear(): int
    {
        $now = now();
        $fiscalYear = $now->month >= 10 ? $now->year + 1 : $now->year;

        // Fallback to most recent year with data if current year is empty
        $hasCurrentYearData = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->exists();
            
        if (!$hasCurrentYearData) {
            $mostRecentYear = DB::table('evaluation_assignments')
                ->orderBy('fiscal_year', 'desc')
                ->value('fiscal_year');
            
            if ($mostRecentYear) {
                Log::info("No data for current fiscal year {$fiscalYear}, using most recent year: {$mostRecentYear}");
                return $mostRecentYear;
            }
        }
        
        return $fiscalYear;
    }

    /**
     * Validate request parameters
     */
    private function validateRequest(Request $request): array
    {
        return $request->validate([
            'fiscal_year' => 'nullable|integer|min:2020|max:' . (now()->year + 5),
            'division' => 'nullable|exists:divisions,id',
            'grade' => 'nullable|integer|min:1|max:20',
            'user_id' => 'nullable|exists:users,id',
        ]);
    }

    /**
     * API endpoint for real-time data updates
     */
    public function getRealTimeData(Request $request): JsonResponse
    {
        try {
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $grade = $request->input('grade');
            
            $data = $this->fetchComprehensiveData($fiscalYear, $divisionId, $grade, null);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'dashboardStats' => $data['dashboardStats'],
                    'evaluationMetrics' => $data['evaluationMetrics'],
                    'detailedResults' => $data['detailedResults'],
                ],
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Real-time data fetch error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch real-time data',
            ], 500);
        }
    }

    /**
     * Get user details for individual report modal
     */
    public function getUserDetails(Request $request, $userId): JsonResponse
    {
        try {
            $fiscalYear = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());

            // No cache - realtime data
            $data = (function () use ($userId, $fiscalYear) {

                $user = User::with(['position', 'division'])->findOrFail($userId);

                // Single query: get all angle scores from assignments + external
                $scoreExpr = 'CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[1-5]$" THEN CAST(a.value AS UNSIGNED) ELSE NULL END';

                $internalScores = DB::table('answers as a')
                    ->join('evaluation_assignments as ea', function ($join) {
                        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                             ->on('a.user_id', '=', 'ea.evaluator_id')
                             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                    })
                    ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                    ->where('a.evaluatee_id', $userId)
                    ->where('ea.fiscal_year', $fiscalYear)
                    ->groupBy('ea.angle')
                    ->select('ea.angle', DB::raw("ROUND(AVG({$scoreExpr}), 2) as score"), DB::raw('COUNT(a.id) as cnt'))
                    ->pluck('score', 'angle');

                $externalScore = DB::table('answers as a')
                    ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                    ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                    ->where('a.evaluatee_id', $userId)
                    ->where('eac.fiscal_year', $fiscalYear)
                    ->whereNotNull('a.external_access_code_id')
                    ->selectRaw("ROUND(AVG({$scoreExpr}), 2) as score")
                    ->selectRaw('COUNT(a.id) as cnt')
                    ->first();

                $selfScore = (float) ($internalScores['self'] ?? 0);
                $topScore = (float) ($internalScores['top'] ?? 0);
                $bottomScore = (float) ($internalScores['bottom'] ?? 0);
                $leftScore = (float) ($internalScores['left'] ?? 0);
                $rightScore = (float) ($internalScores['right'] ?? ($externalScore->score ?? 0));

                // Weighted average by grade
                $userGrade = (int) ($user->grade ?? 0);
                $weights = $this->getStakeholderWeights($userGrade);
                $scoreMap = ['self' => $selfScore, 'top' => $topScore, 'bottom' => $bottomScore, 'left' => $leftScore, 'right' => $rightScore];
                $wSum = 0; $wTotal = 0;
                foreach ($weights as $a => $w) {
                    if (($scoreMap[$a] ?? 0) > 0 && $w > 0) { $wSum += $scoreMap[$a] * $w; $wTotal += $w; }
                }
                $avgScore = $wTotal > 0 ? round($wSum / $wTotal, 2) : 0;
                $completedAngles = count(array_filter([$selfScore, $topScore, $bottomScore, $leftScore, $rightScore], fn($s) => $s > 0));

                // Single query: evaluators
                $evaluators = DB::table('evaluation_assignments as ea')
                    ->join('users as u', 'ea.evaluator_id', '=', 'u.id')
                    ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                    ->where('ea.evaluatee_id', $userId)
                    ->where('ea.fiscal_year', $fiscalYear)
                    ->select([
                        DB::raw("CONCAT(u.fname, ' ', u.lname) as name"),
                        'ea.angle', 'd.name as division',
                    ])
                    ->get()
                    ->map(fn($e) => [
                        'id' => 0, 'name' => $e->name, 'angle' => $e->angle,
                        'completed' => ($internalScores[$e->angle] ?? 0) > 0,
                        'score' => round((float) ($internalScores[$e->angle] ?? 0), 2),
                        'division' => $e->division ?? 'N/A', 'completed_at' => null,
                    ])
                    ->toArray();

                // Add external evaluators — list each session as a separate evaluator
                $extSessions = DB::table('external_evaluation_sessions as ses')
                    ->join('external_organizations as eo', 'ses.external_organization_id', '=', 'eo.id')
                    ->where('ses.evaluatee_id', $userId)
                    ->whereNotNull('ses.completed_at')
                    ->whereExists(function ($q) use ($fiscalYear) {
                        $q->select(DB::raw(1))->from('answers')
                          ->whereColumn('answers.external_session_id', 'ses.id')
                          ->where('answers.fiscal_year', $fiscalYear);
                    })
                    ->select('ses.id', 'ses.evaluator_name', 'ses.evaluator_position', 'ses.completed_at', 'eo.name as org_name')
                    ->get();
                foreach ($extSessions as $s) {
                    $evaluators[] = [
                        'id' => 0,
                        'name' => ($s->evaluator_name ?: '(ไม่ระบุชื่อ)') . ' [' . $s->org_name . ']',
                        'angle' => 'right',
                        'completed' => true,
                        'score' => $rightScore,
                        'division' => 'องค์กรภายนอก' . ($s->evaluator_position ? ' · ' . $s->evaluator_position : ''),
                        'completed_at' => $s->completed_at,
                    ];
                }

                // Single query: aspect scores
                $aspectScores = DB::table('answers as a')
                    ->join('questions as q', 'a.question_id', '=', 'q.id')
                    ->join('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                    ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                    ->where('a.evaluatee_id', $userId)
                    ->where('a.fiscal_year', $fiscalYear)
                    ->whereNotNull('asp.name')
                    ->groupBy('asp.id', 'asp.name')
                    ->select('asp.name as aspect_name', DB::raw("ROUND(AVG({$scoreExpr}), 2) as score"))
                    ->orderBy('asp.name')
                    ->get()
                    ->map(fn($a) => [
                        'aspect' => $a->aspect_name, 'score' => (float) $a->score,
                        'max_score' => 5.0, 'percentage' => round(((float) $a->score / 5.0) * 100, 1),
                    ])
                    ->toArray();

                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => trim($user->fname . ' ' . $user->lname),
                        'position' => $user->position->title ?? 'N/A',
                        'division' => $user->division->name ?? 'N/A',
                        'grade' => $user->grade ?? 0,
                        'user_type' => 'internal',
                    ],
                    'scores' => compact('selfScore', 'topScore', 'bottomScore', 'leftScore', 'rightScore') + [
                        'self' => $selfScore, 'top' => $topScore, 'bottom' => $bottomScore,
                        'left' => $leftScore, 'right' => $rightScore, 'average' => $avgScore,
                    ],
                    'completion_data' => [
                        'total_angles' => 5, 'completed_angles' => $completedAngles,
                        'completion_rate' => round(($completedAngles / 5) * 100, 1),
                        'total_answers' => 0, 'last_updated' => now()->toISOString(),
                    ],
                    'evaluators' => $evaluators,
                    'aspect_scores' => $aspectScores,
                    'comparison_data' => (function () use ($userId, $fiscalYear, $avgScore) {
                        $gradeAvg = DB::table('answers as a')
                            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
                            ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                            ->where('a.fiscal_year', $fiscalYear)
                            ->where('u.grade', DB::table('users')->where('id', $userId)->value('grade'))
                            ->selectRaw('AVG(CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[1-5]$" THEN CAST(a.value AS UNSIGNED) ELSE NULL END) as avg')
                            ->value('avg');
                        $divAvg = DB::table('answers as a')
                            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
                            ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                            ->where('a.fiscal_year', $fiscalYear)
                            ->where('u.division_id', DB::table('users')->where('id', $userId)->value('division_id'))
                            ->selectRaw('AVG(CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[1-5]$" THEN CAST(a.value AS UNSIGNED) ELSE NULL END) as avg')
                            ->value('avg');
                        return [
                            'grade_average' => round((float) ($gradeAvg ?? 0), 2),
                            'division_average' => round((float) ($divAvg ?? 0), 2),
                            'overall_average' => round((float) ($gradeAvg ?? 0), 2),
                        ];
                    })(),
                    'evaluator_assignments' => (function () use ($userId, $fiscalYear) {
                        $assignments = DB::table('evaluation_assignments as ea')
                            ->join('users as evaluatee', 'ea.evaluatee_id', '=', 'evaluatee.id')
                            ->leftJoin('divisions as d', 'evaluatee.division_id', '=', 'd.id')
                            ->where('ea.evaluator_id', $userId)
                            ->where('ea.fiscal_year', $fiscalYear)
                            ->select('ea.*', DB::raw("CONCAT(evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"), 'evaluatee.grade as evaluatee_grade', 'd.name as division_name')
                            ->get();

                        $completed = 0; $inProgress = 0; $notStarted = 0;
                        $byAngle = [];
                        $details = [];
                        foreach ($assignments as $a) {
                            $answerCount = DB::table('answers')
                                ->where('evaluation_id', $a->evaluation_id)
                                ->where('user_id', $userId)
                                ->where('evaluatee_id', $a->evaluatee_id)
                                ->count();
                            $status = $answerCount > 0 ? 'completed' : 'not_started';
                            if ($status === 'completed') $completed++;
                            else $notStarted++;

                            $byAngle[$a->angle] = ($byAngle[$a->angle] ?? 0) + 1;
                            $details[] = [
                                'evaluatee_name' => $a->evaluatee_name,
                                'evaluatee_grade' => $a->evaluatee_grade,
                                'division' => $a->division_name ?? '-',
                                'angle' => $a->angle,
                                'status' => $status,
                                'answer_count' => $answerCount,
                            ];
                        }
                        $total = $assignments->count();
                        return [
                            'summary' => [
                                'total_assignments' => $total,
                                'completed_assignments' => $completed,
                                'in_progress_assignments' => $inProgress,
                                'not_started_assignments' => $notStarted,
                                'overall_completion_percentage' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                                'by_angle' => collect($byAngle)->map(fn($count, $angle) => ['angle' => $angle, 'count' => $count])->values()->toArray(),
                            ],
                            'details' => $details,
                        ];
                    })(),
                ];
            })();

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error fetching user details: ' . $e->getMessage());
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    /**
     * Export summary report
     */
    public function exportSummary(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $format = $request->input('format', 'excel');
            
            $data = $this->fetchComprehensiveData($fiscalYear, null, null, null);
            $filename = "รายงานสรุปการประเมิน_{$fiscalYear}";
            
            if ($format === 'excel') {
                return $this->generateExcelSummaryReport($data, $filename);
            }
            
            return response()->json(['error' => 'Unsupported format'], 400);
        } catch (\Exception $e) {
            Log::error('Export summary error: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed'], 500);
        }
    }

    /**
     * Export individual report
     */
    public function exportIndividualDetailed(Request $request)
    {
        try {
            $this->boostLimits();
            $userId = $request->input('user_id');
            $fiscalYear = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());

            if (!$userId) {
                return response()->json(['error' => 'User ID required'], 400);
            }

            $user = User::with(['position', 'division'])->findOrFail($userId);
            $scores = $this->weightedScoringService->getIndividualAngleReport($userId, $fiscalYear);
            $scores = $scores ?? [];

            // Include external scores
            $externalScore = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->where('a.evaluatee_id', $userId)
                ->where('eac.fiscal_year', $fiscalYear)
                ->whereNotNull('a.external_access_code_id')
                ->selectRaw('AVG(CASE WHEN a.value REGEXP "^[0-9]+(\\.?[0-9]*)$" THEN CAST(a.value AS DECIMAL(5,2)) ELSE NULL END) as avg_score')
                ->selectRaw('COUNT(a.id) as answer_count')
                ->first();

            $rightScore = $scores['right'] ?? ($externalScore && $externalScore->avg_score ? round($externalScore->avg_score, 2) : 0);
            $selfScore = $scores['self'] ?? 0;
            $topScore = $scores['top'] ?? 0;
            $bottomScore = $scores['bottom'] ?? 0;
            $leftScore = $scores['left'] ?? 0;
            $validScores = array_filter([$selfScore, $topScore, $bottomScore, $leftScore, $rightScore], fn($s) => $s > 0);
            $avgScore = count($validScores) > 0 ? round(array_sum($validScores) / count($validScores), 2) : 0;

            $data = [
                'user' => [
                    'name' => trim($user->fname . ' ' . $user->lname),
                    'position' => $user->position->title ?? 'N/A',
                    'division' => $user->division->name ?? 'N/A',
                    'grade' => $user->grade ?? 0,
                ],
                'scores' => array_merge($scores, [
                    'self' => $selfScore,
                    'top' => $topScore,
                    'bottom' => $bottomScore,
                    'left' => $leftScore,
                    'right' => $rightScore,
                    'average' => $avgScore,
                ]),
            ];

            $filename = "รายงานรายบุคคล_{$data['user']['name']}_{$fiscalYear}";

            return $this->generateExcelIndividualReport($data, $filename);
        } catch (\Exception $e) {
            Log::error('Export individual error: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed'], 500);
        }
    }

    /**
     * Generate Excel summary report
     */
    private function generateExcelSummaryReport(array $data, string $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('สรุปการประเมิน');
        
        $row = 1;
        
        // Header
        $sheet->setCellValue('A' . $row, 'รายงานสรุปการประเมิน 360 องศา');
        $sheet->mergeCells('A' . $row . ':D' . $row);
        $sheet->getStyle('A' . $row)->getFont()->setSize(16)->setBold(true);
        $row += 2;
        
        // Dashboard Stats
        $stats = $data['dashboardStats'];
        $sheet->setCellValue('A' . $row, 'ผู้เข้าร่วม:');
        $sheet->setCellValue('B' . $row, $stats['totalParticipants']);
        $row++;
        
        $sheet->setCellValue('A' . $row, 'เสร็จสิ้น:');
        $sheet->setCellValue('B' . $row, $stats['completedEvaluations']);
        $row++;
        
        $sheet->setCellValue('A' . $row, 'คะแนนเฉลี่ย:');
        $sheet->setCellValue('B' . $row, $stats['averageScore']);
        $row += 2;
        
        // Grade breakdown
        $sheet->setCellValue('A' . $row, 'ระดับ');
        $sheet->setCellValue('B' . $row, 'จำนวน');
        $sheet->setCellValue('C' . $row, 'เสร็จสิ้น');
        $sheet->setCellValue('D' . $row, 'คะแนนเฉลี่ย');
        $sheet->getStyle('A' . $row . ':D' . $row)->getFont()->setBold(true);
        $row++;
        
        foreach ($data['evaluationMetrics']['byGrade'] as $gradeData) {
            $sheet->setCellValue('A' . $row, 'C' . $gradeData['grade']);
            $sheet->setCellValue('B' . $row, $gradeData['total']);
            $sheet->setCellValue('C' . $row, $gradeData['completed']);
            $sheet->setCellValue('D' . $row, $gradeData['averageScore']);
            $row++;
        }
        
        foreach (range('A', 'D') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        $writer = new Xlsx($spreadsheet);
        
        return response()->streamDownload(function() use ($writer) {
            $writer->save('php://output');
        }, $filename . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Generate Excel individual report
     */
    private function generateExcelIndividualReport(array $data, string $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('รายบุคคล');
        
        $row = 1;
        
        // Header
        $sheet->setCellValue('A' . $row, 'รายงานการประเมินรายบุคคล');
        $sheet->mergeCells('A' . $row . ':B' . $row);
        $sheet->getStyle('A' . $row)->getFont()->setSize(16)->setBold(true);
        $row += 2;
        
        // User info
        $user = $data['user'];
        $sheet->setCellValue('A' . $row, 'ชื่อ:');
        $sheet->setCellValue('B' . $row, $user['name']);
        $row++;
        
        $sheet->setCellValue('A' . $row, 'ตำแหน่ง:');
        $sheet->setCellValue('B' . $row, $user['position']);
        $row++;
        
        $sheet->setCellValue('A' . $row, 'หน่วยงาน:');
        $sheet->setCellValue('B' . $row, $user['division']);
        $row += 2;
        
        // Scores
        $scores = $data['scores'];
        $angles = [
            'self' => 'ประเมินตนเอง',
            'top' => 'ประเมินโดยผู้บังคับบัญชา',
            'bottom' => 'ประเมินโดยผู้ใต้บังคับบัญชา',
            'left' => 'ประเมินโดยเพื่อนร่วมงาน',
            'right' => 'ประเมินโดยผู้ประเมินภายนอก'
        ];
        
        foreach ($angles as $key => $label) {
            $sheet->setCellValue('A' . $row, $label . ':');
            $sheet->setCellValue('B' . $row, round($scores[$key] ?? 0, 2));
            $row++;
        }
        
        $sheet->setCellValue('A' . $row, 'คะแนนเฉลี่ย:');
        $sheet->setCellValue('B' . $row, round($scores['average'] ?? 0, 2));
        $sheet->getStyle('A' . $row . ':B' . $row)->getFont()->setBold(true);
        
        foreach (range('A', 'B') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        $writer = new Xlsx($spreadsheet);
        
        return response()->streamDownload(function() use ($writer) {
            $writer->save('php://output');
        }, $filename . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Get assignments data for the Assignments tab
     */
    public function getAssignmentsData(Request $request): JsonResponse
    {
        try {
            $fiscalYear = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());

            // Subquery: count answers per assignment
            $answerCounts = DB::table('answers')
                ->select('evaluation_id', 'user_id as evaluator_id', 'evaluatee_id', DB::raw('COUNT(*) as answer_count'))
                ->where('fiscal_year', $fiscalYear)
                ->groupBy('evaluation_id', 'user_id', 'evaluatee_id');

            // Subquery: count total questions per evaluation
            // ไม่นับ open_text ใน total — ตรงกับ FE progress (EvaluationAssignmentController:64)
            // ถ้านับ → user ที่ตอบ required ครบแต่ไม่ตอบ open_text จะค้างเป็น pending ตลอด
            $questionCounts = DB::table('questions')
                ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
                ->join('parts', 'aspects.part_id', '=', 'parts.id')
                ->where('questions.type', '!=', 'open_text')
                ->select('parts.evaluation_id', DB::raw('COUNT(*) as total_questions'))
                ->groupBy('parts.evaluation_id');

            $data = DB::table('evaluation_assignments as ea')
                ->join('evaluations as e', 'ea.evaluation_id', '=', 'e.id')
                ->join('users as evaluator', 'ea.evaluator_id', '=', 'evaluator.id')
                ->join('users as evaluatee', 'ea.evaluatee_id', '=', 'evaluatee.id')
                ->leftJoin('divisions as d', 'evaluatee.division_id', '=', 'd.id')
                ->leftJoinSub($answerCounts, 'ans', function ($join) {
                    $join->on('ea.evaluation_id', '=', 'ans.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'ans.evaluator_id')
                         ->on('ea.evaluatee_id', '=', 'ans.evaluatee_id');
                })
                ->leftJoinSub($questionCounts, 'qc', function ($join) {
                    $join->on('ea.evaluation_id', '=', 'qc.evaluation_id');
                })
                ->where('ea.fiscal_year', $fiscalYear)
                ->select([
                    'ea.id',
                    'ea.evaluation_id',
                    'e.title as evaluation_title',
                    DB::raw("CONCAT(evaluator.prename, evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
                    'evaluator.grade as evaluator_grade',
                    DB::raw("CONCAT(evaluatee.prename, evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"),
                    'evaluatee.grade as evaluatee_grade',
                    'd.name as evaluatee_division',
                    'ea.fiscal_year',
                    'ea.angle',
                    'ea.submitted_at',
                    DB::raw('COALESCE(ans.answer_count, 0) as answer_count'),
                    DB::raw('COALESCE(qc.total_questions, 0) as total_questions'),
                    DB::raw('ROUND(COALESCE(ans.answer_count, 0) / GREATEST(COALESCE(qc.total_questions, 1), 1) * 100, 1) as completion_pct'),
                ])
                ->orderBy('evaluatee.fname')
                ->orderBy('ea.angle')
                ->get();

            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            Log::error('getAssignmentsData error: ' . $e->getMessage());
            return response()->json(['error' => 'ไม่สามารถโหลดข้อมูลได้', 'data' => []], 500);
        }
    }
    /**
     * รายการแบบประเมิน published ในปีงบที่กำหนด — สำหรับ dropdown เปลี่ยนแบบประเมิน
     */
    public function getAvailableEvaluations(Request $request): JsonResponse
    {
        $fiscalYear = (int) $request->input("fiscal_year", $this->getCurrentFiscalYear());
        $rows = \App\Models\Evaluation::where("status", "published")
            ->where("fiscal_year", $fiscalYear)
            ->orderBy("user_type")
            ->orderBy("grade_min")
            ->get(["id", "title", "user_type", "grade_min", "grade_max", "fiscal_year"]);
        return response()->json(["data" => $rows]);
    }


    /**
     * Clear cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            Cache::flush();
            return response()->json([
                'success' => true,
                'message' => 'Cache cleared successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to clear cache',
            ], 500);
        }
    }

    /**
     * Get system health
     */
    public function getSystemHealth(): JsonResponse
    {
        try {
            $health = [
                'database' => $this->checkDatabaseHealth(),
                'cache' => $this->checkCacheHealth(),
                'timestamp' => now()->toISOString(),
            ];
            
            $overallStatus = collect($health)->except(['timestamp'])->every(fn($status) => $status === 'healthy');
            
            return response()->json([
                'status' => $overallStatus ? 'healthy' : 'degraded',
                'components' => $health,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'error' => 'Health check failed',
            ], 500);
        }
    }

    /**
     * Check database health
     */
    private function checkDatabaseHealth(): string
    {
        try {
            DB::connection()->getPdo();
            return 'healthy';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }

    /**
     * Check cache health
     */
    private function checkCacheHealth(): string
    {
        try {
            Cache::put('health_check', 'test', 1);
            $result = Cache::get('health_check');
            Cache::forget('health_check');
            return $result === 'test' ? 'healthy' : 'degraded';
        } catch (\Exception $e) {
            return 'unhealthy';
        }
    }

    /**
     * Export evaluatee score table — ชื่อ + คะแนนแต่ละองศา
     */
    public function exportEvaluateeScoreTable(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division_id');
            $grade = $request->input('grade');

            $rawScores = $this->getRawScores($fiscalYear, $divisionId, $grade, null);

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('คะแนนผู้ถูกประเมิน');

            // Title
            $sheet->setCellValue('A1', 'รายงานคะแนนผู้ถูกประเมิน 360 องศา');
            $sheet->mergeCells('A1:K1');
            $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('A2', 'ปีงบประมาณ พ.ศ. ' . ($fiscalYear + 543) . ' | วันที่สร้าง: ' . now()->format('d/m/Y H:i'));
            $sheet->mergeCells('A2:K2');

            // Headers
            $headers = [
                'A4' => 'ลำดับ', 'B4' => 'รหัสพนักงาน', 'C4' => 'ชื่อ-นามสกุล',
                'D4' => 'ระดับ', 'E4' => 'หน่วยงาน', 'F4' => 'ตนเอง',
                'G4' => 'ผู้บังคับบัญชา', 'H4' => 'ผู้ใต้บังคับบัญชา',
                'I4' => 'เพื่อนร่วมงาน', 'J4' => 'องค์กรภายนอก', 'K4' => 'เฉลี่ย',
            ];
            foreach ($headers as $cell => $header) {
                $sheet->setCellValue($cell, $header);
            }
            $sheet->getStyle('A4:K4')->getFont()->setBold(true);
            $sheet->getStyle('A4:K4')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('7C3AED');
            $sheet->getStyle('A4:K4')->getFont()->getColor()->setRGB('FFFFFF');
            $sheet->getStyle('A4:K4')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Data rows
            $row = 5;
            $counter = 1;
            foreach ($rawScores as $score) {
                // Get user emid
                $user = \App\Models\User::find($score['evaluatee_id']);
                $emid = $user->emid ?? '-';

                $sheet->setCellValue('A' . $row, $counter);
                $sheet->setCellValue('B' . $row, $emid);
                $sheet->setCellValue('C' . $row, $score['evaluatee_name']);
                $sheet->setCellValue('D' . $row, $score['evaluatee_grade']);
                $sheet->setCellValue('E' . $row, $score['evaluatee_division']);
                $sheet->setCellValue('F' . $row, $score['self'] ?: '-');
                $sheet->setCellValue('G' . $row, $score['top'] ?: '-');
                $sheet->setCellValue('H' . $row, $score['bottom'] ?: '-');
                $sheet->setCellValue('I' . $row, $score['left'] ?: '-');
                $sheet->setCellValue('J' . $row, $score['right'] ?: '-');
                $sheet->setCellValue('K' . $row, $score['average'] ?: '-');

                // Color code average
                if (($score['average'] ?? 0) > 0) {
                    $avgColor = $score['average'] >= 4.5 ? '059669' : ($score['average'] >= 3.5 ? '2563EB' : ($score['average'] >= 2.5 ? 'D97706' : 'DC2626'));
                    $sheet->getStyle('K' . $row)->getFont()->setBold(true)->getColor()->setRGB($avgColor);
                }

                // Alternating row color
                if ($counter % 2 === 0) {
                    $sheet->getStyle("A{$row}:K{$row}")->getFill()
                        ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('F5F3FF');
                }

                $row++;
                $counter++;
            }

            // Auto-size columns
            foreach (range('A', 'K') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            // Score columns center-aligned
            $sheet->getStyle("F5:K" . ($row - 1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Summary row
            $sheet->setCellValue('A' . $row, '');
            $sheet->setCellValue('C' . $row, 'จำนวนทั้งหมด: ' . ($counter - 1) . ' คน');
            $sheet->getStyle('C' . $row)->getFont()->setBold(true);

            $filename = "คะแนนผู้ถูกประเมิน_360องศา_พศ" . ($fiscalYear + 543) . '_' . now()->format('Ymd_Hi') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);

            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }

            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export evaluatee score table error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export comprehensive evaluation report with detailed option mapping
     */
    public function exportComprehensiveReport(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
            ];

            $filePath = $this->evaluationExportService->exportComprehensiveEvaluationReport($filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export comprehensive report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว'], 500);
        }
    }

    /**
     * Export executive level report (9-12)
     */
    public function exportExecutiveReport(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
            ];

            // Dynamic lookup: find 360 internal evaluation for grades 9-12 (not self-eval)
            $evaluation = EvaluationLookupService::findByGrade(9, 'internal', (int) $filters['fiscal_year']);

            if (!$evaluation) {
                return response()->json(['error' => 'ไม่พบแบบประเมินสำหรับระดับ 9-12'], 404);
            }

            $filePath = $this->evaluationExportService->exportByEvaluationType($evaluation->id, $filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export executive report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานผู้บริหารล้มเหลว'], 500);
        }
    }

    /**
     * Export employee level report (4-8)
     */
    public function exportEmployeeReport(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
            ];

            // Dynamic lookup: find 360 internal evaluation for grades 4-8 (not self-eval)
            $evaluation = EvaluationLookupService::findByGrade(5, 'internal', (int) $filters['fiscal_year']);

            if (!$evaluation) {
                return response()->json(['error' => 'ไม่พบแบบประเมินสำหรับระดับ 4-8'], 404);
            }

            $filePath = $this->evaluationExportService->exportByEvaluationType($evaluation->id, $filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export employee report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานพนักงานล้มเหลว'], 500);
        }
    }

    /**
     * Export governor level report (grade 13)
     */
    public function exportGovernorReport(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
            ];

            // Dynamic lookup: find 360 internal evaluation for grade 13 (not self-eval)
            $evaluation = EvaluationLookupService::findByGrade(13, 'internal', (int) $filters['fiscal_year']);

            if (!$evaluation) {
                return response()->json(['error' => 'ไม่พบแบบประเมินสำหรับผู้ว่าการ'], 404);
            }

            $filePath = $this->evaluationExportService->exportByEvaluationType($evaluation->id, $filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export governor report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานผู้ว่าการล้มเหลว กรุณาตรวจสอบว่ามีแบบประเมินผู้ว่าการในระบบ'], 500);
        }
    }

    /**
     * Export external organization evaluation report
     */
    public function exportExternalOrgReport(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'external_org_id' => $request->input('external_org_id'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
                'user_id' => $request->input('user_id'),
            ];

            $filePath = $this->evaluationExportService->exportExternalOrgReport($filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export external org report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานองค์กรภายนอกล้มเหลว'], 500);
        }
    }

    /**
     * Export detailed evaluation data with questions and evaluators
     */
    public function exportDetailedEvaluationData(Request $request)
    {
        try {
            $this->boostLimits();
            $evaluationId = $request->input('evaluation_id');
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division_id');
            $userId = $request->input('user_id');

            // Dynamic lookup by grade if no evaluation_id provided — respect fiscal_year
            if (!$evaluationId && $request->input('grade_lookup')) {
                $gradeLookup = (int) $request->input('grade_lookup');
                $evaluation = \App\Services\EvaluationLookupService::findByGrade(
                    $gradeLookup,
                    'internal',
                    $fiscalYear ? (int) $fiscalYear : null
                );
                $evaluationId = $evaluation?->id;
            }

            if (!$evaluationId) {
                return response()->json(['error' => 'กรุณาระบุรหัสการประเมินหรือระดับพนักงาน'], 400);
            }

            $evaluation = Evaluation::findOrFail($evaluationId);
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('รายงานรายละเอียด');
            
            // Get detailed data with questions, evaluators, and option mappings
            $detailedData = $this->getDetailedEvaluationData($evaluationId, $fiscalYear, $divisionId, $userId);
            
            $this->populateDetailedDataSheet($sheet, $detailedData, $evaluation->title);
            
            $filename = 'รายงานรายละเอียดการประเมิน_' . $evaluationId . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            
            $writer = new Xlsx($spreadsheet);
            
            return response()->streamDownload(function() use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            Log::error('Export detailed evaluation data error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานรายละเอียดล้มเหลว'], 500);
        }
    }

    /**
     * Get detailed evaluation data
     */
    private function getDetailedEvaluationData(int $evaluationId, int $fiscalYear, $divisionId = null, $userId = null): array
    {
        $query = DB::table('answers as a')
            ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
            ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            // leftJoin กัน open_text (a.value = ข้อความ ไม่ใช่ o.id) ถูก drop ทั้งแถว
            ->leftJoin('options as o', 'a.value', '=', 'o.id')
            ->join('evaluation_assignments as ea', function($join) {
                $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                     ->on('a.user_id', '=', 'ea.evaluator_id')
                     ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
            })
            ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
            ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
            ->leftJoin('sub_aspects as sub_asp', 'q.sub_aspect_id', '=', 'sub_asp.id')
            ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
            ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
            ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
            ->where('a.evaluation_id', $evaluationId)
            ->whereYear('a.created_at', $fiscalYear)
            ->select([
                'evaluatee.id as evaluatee_id',
                'evaluatee.emid as evaluatee_emid',
                'evaluatee.fname as evaluatee_fname',
                'evaluatee.lname as evaluatee_lname',
                'evaluatee.grade as evaluatee_grade',
                'div.name as evaluatee_division',
                'dept.name as evaluatee_department',
                'pos.title as evaluatee_position',
                'evaluator.emid as evaluator_emid',  
                'evaluator.fname as evaluator_fname',
                'evaluator.lname as evaluator_lname',
                'ea.angle as evaluation_angle',
                'ea.fiscal_year',
                'q.id as question_id',
                'q.title as question_title',
                'q.type as question_type',
                'p.title as part_title',
                'p.order as part_order',
                'asp.name as aspect_name',
                'sub_asp.name as sub_aspect_name',
                'o.id as option_id',
                'o.label as option_label',
                'o.score as option_score',
                'a.value as raw_value',
                'a.other_text',
                'a.created_at as answer_date',
                'a.updated_at as answer_updated'
            ]);

        if ($divisionId) {
            $query->where('evaluatee.division_id', $divisionId);
        }
        
        if ($userId) {
            $query->where('evaluatee.id', $userId);
        }

        return $query->orderBy('evaluatee.id')
                    ->orderBy('p.order')
                    ->orderBy('q.id')
                    ->orderBy('ea.angle')
                    ->get()
                    ->toArray();
    }

    /**
     * Populate detailed data sheet
     */
    private function populateDetailedDataSheet($sheet, array $data, string $evaluationTitle): void
    {
        // Title
        $sheet->setCellValue('A1', 'รายงานรายละเอียดการประเมิน: ' . $evaluationTitle);
        $sheet->mergeCells('A1:N1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Generation info
        $sheet->setCellValue('A2', 'วันที่สร้างรายงาน: ' . now()->format('d/m/Y H:i:s'));
        $sheet->mergeCells('A2:N2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Headers
        $headers = [
            'A4' => 'ลำดับ',
            'B4' => 'รหัสพนักงานผู้ถูกประเมิน',
            'C4' => 'ชื่อผู้ถูกประเมิน',
            'D4' => 'ระดับ',
            'E4' => 'หน่วยงาน',
            'F4' => 'แผนก',
            'G4' => 'ตำแหน่ง',
            'H4' => 'รหัสพนักงานผู้ประเมิน',
            'I4' => 'ชื่อผู้ประเมิน',
            'J4' => 'มุมการประเมิน',
            'K4' => 'ส่วนที่',
            'L4' => 'หมวดหมู่',
            'M4' => 'คำถาม',
            'N4' => 'คำตอบ'
        ];
        
        foreach ($headers as $cell => $header) {
            $sheet->setCellValue($cell, $header);
        }
        
        // Style headers
        $headerRange = 'A4:N4';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
              ->setFillType(Fill::FILL_SOLID)
              ->getStartColor()->setRGB('4F46E5');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getBorders()->getAllBorders()
              ->setBorderStyle(Border::BORDER_THIN);
        
        // Data
        $row = 5;
        $counter = 1;
        
        foreach ($data as $item) {
            $sheet->setCellValue('A' . $row, $counter);
            $sheet->setCellValue('B' . $row, $item->evaluatee_emid);
            $sheet->setCellValue('C' . $row, trim($item->evaluatee_fname . ' ' . $item->evaluatee_lname));
            $sheet->setCellValue('D' . $row, $item->evaluatee_grade);
            $sheet->setCellValue('E' . $row, $item->evaluatee_division ?? 'ไม่ระบุ');
            $sheet->setCellValue('F' . $row, $item->evaluatee_department ?? 'ไม่ระบุ');
            $sheet->setCellValue('G' . $row, $item->evaluatee_position ?? 'ไม่ระบุ');
            $sheet->setCellValue('H' . $row, $item->evaluator_emid);
            $sheet->setCellValue('I' . $row, trim($item->evaluator_fname . ' ' . $item->evaluator_lname));
            $sheet->setCellValue('J' . $row, $this->translateAngle($item->evaluation_angle));
            $sheet->setCellValue('K' . $row, $item->part_title);
            $sheet->setCellValue('L' . $row, $item->aspect_name);
            $sheet->setCellValue('M' . $row, $item->question_title);
            // open_text/ค่าที่ไม่ match option → ใช้ค่าที่ตอบจริง (a.value); ว่าง → null
            $sheet->setCellValue('N' . $row, $item->option_label ?? $item->raw_value);
            
            $row++;
            $counter++;
        }
        
        // Auto-size columns
        foreach (range('A', 'N') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        // Add borders to data
        if (count($data) > 0) {
            $dataRange = 'A4:N' . ($row - 1);
            $sheet->getStyle($dataRange)->getBorders()->getAllBorders()
                  ->setBorderStyle(Border::BORDER_THIN);
        }
    }

    /**
     * Get evaluatee details for evaluatee details modal
     */
    public function getEvaluateeDetails(Request $request, $evaluateeId): JsonResponse
    {
        try {
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            
            // Get evaluatee information
            $evaluatee = User::with(['position', 'division', 'department'])->findOrFail($evaluateeId);
            
            // Get evaluatee's evaluation assignments
            $assignments = DB::table('evaluation_assignments as ea')
                ->join('users as evaluator', 'ea.evaluator_id', '=', 'evaluator.id')
                ->leftJoin('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->where('ea.evaluatee_id', $evaluateeId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->select([
                    'evaluator.emid as evaluator_emid',
                    'evaluator.fname as evaluator_fname', 
                    'evaluator.lname as evaluator_lname',
                    'ea.angle',
                    DB::raw('MAX(a.created_at) as answer_date'),
                    DB::raw('COUNT(a.id) as answer_count'),
                    DB::raw('AVG(COALESCE(o.score, 
                        CASE 
                            WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                            ELSE 0 
                        END)) as avg_score')
                ])
                ->groupBy([
                    'evaluator.emid', 'evaluator.fname', 'evaluator.lname', 
                    'ea.angle'
                ])
                ->get();

            // Process evaluator data
            $evaluatorsByAngle = [];
            $completedAngles = 0;
            $totalScore = 0;
            $totalScoreCount = 0;

            foreach ($assignments as $assignment) {
                $completed = !is_null($assignment->answer_date) && $assignment->answer_count > 0;
                $evaluatorName = trim($assignment->evaluator_fname . ' ' . $assignment->evaluator_lname);
                $score = $assignment->avg_score ?? 0;
                
                $evaluatorsByAngle[$assignment->angle] = [
                    'name' => $evaluatorName,
                    'emid' => $assignment->evaluator_emid,
                    'angle' => $assignment->angle,
                    'completed' => $completed,
                    'score' => round($score, 2),
                    'submittedAt' => $assignment->answer_date,
                    'answer_count' => $assignment->answer_count ?? 0
                ];

                if ($completed && $score > 0) {
                    $completedAngles++;
                    $totalScore += $score;
                    $totalScoreCount++;
                }
            }

            // Calculate scores by angle for display
            $scoresByAngle = [];
            foreach (['self', 'top', 'bottom', 'left', 'right'] as $angle) {
                $scoresByAngle[$angle] = isset($evaluatorsByAngle[$angle]) ? 
                    round($evaluatorsByAngle[$angle]['score'], 2) : 0;
            }

            $averageScore = $totalScoreCount > 0 ? round($totalScore / $totalScoreCount, 2) : 0;
            $completionRate = $completedAngles > 0 ? round(($completedAngles / 5) * 100, 1) : 0;

            // Get detailed remaining evaluations (evaluations this person still needs to complete)
            $remainingEvaluationsData = DB::table('evaluation_assignments as ea')
                ->join('users as evaluatee_user', 'ea.evaluatee_id', '=', 'evaluatee_user.id')
                ->join('evaluations as ev', 'ea.evaluation_id', '=', 'ev.id')
                ->leftJoin('positions as pos', 'evaluatee_user.position_id', '=', 'pos.id')
                ->leftJoin('divisions as div', 'evaluatee_user.division_id', '=', 'div.id')
                ->leftJoin(DB::raw('(
                    SELECT ea2.evaluation_id, ea2.evaluator_id, ea2.evaluatee_id, 
                           COUNT(a.id) as answered_questions,
                           (SELECT COUNT(q.id) 
                            FROM questions q 
                            JOIN parts p ON q.part_id = p.id 
                            WHERE p.evaluation_id = ea2.evaluation_id) as total_questions
                    FROM evaluation_assignments ea2
                    LEFT JOIN answers a ON ea2.evaluation_id = a.evaluation_id 
                                        AND ea2.evaluator_id = a.user_id 
                                        AND ea2.evaluatee_id = a.evaluatee_id
                    GROUP BY ea2.evaluation_id, ea2.evaluator_id, ea2.evaluatee_id
                ) as progress'), function($join) {
                    $join->on('ea.evaluation_id', '=', 'progress.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'progress.evaluator_id')
                         ->on('ea.evaluatee_id', '=', 'progress.evaluatee_id');
                })
                ->where('ea.evaluator_id', $evaluateeId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->select([
                    'ea.id as assignment_id',
                    'ea.angle',
                    'evaluatee_user.fname',
                    'evaluatee_user.lname',
                    'evaluatee_user.emid',
                    'pos.title as position',
                    'div.name as division',
                    'ev.title as evaluation_title',
                    DB::raw('COALESCE(progress.answered_questions, 0) as answered_questions'),
                    DB::raw('COALESCE(progress.total_questions, 0) as total_questions'),
                    DB::raw('CASE 
                        WHEN COALESCE(progress.total_questions, 0) > 0 
                        THEN ROUND((COALESCE(progress.answered_questions, 0) / progress.total_questions) * 100, 1)
                        ELSE 0 
                    END as completion_percentage')
                ])
                ->get();

            $remainingEvaluations = $remainingEvaluationsData->where('completion_percentage', '<', 100)->count();

            $data = [
                'user' => [
                    'id' => $evaluatee->id,
                    'emid' => $evaluatee->emid,
                    'name' => trim($evaluatee->fname . ' ' . $evaluatee->lname),
                    'position' => $evaluatee->position->title ?? 'N/A',
                    'division' => $evaluatee->division->name ?? 'N/A',
                    'department' => $evaluatee->department->name ?? 'N/A',
                    'grade' => $evaluatee->grade ?? 0,
                ],
                'scores' => [
                    'self' => $scoresByAngle['self'],
                    'top' => $scoresByAngle['top'],
                    'bottom' => $scoresByAngle['bottom'],
                    'left' => $scoresByAngle['left'],
                    'right' => $scoresByAngle['right'],
                    'average' => $averageScore,
                ],
                'completion_data' => [
                    'total_angles' => 5,
                    'completed_angles' => $completedAngles,
                    'completion_rate' => $completionRate,
                    'remaining_evaluations' => $remainingEvaluations,
                    'last_updated' => now()->toISOString(),
                ],
                'evaluators' => array_values($evaluatorsByAngle),
                'statistics' => [
                    'total_questions_answered' => $assignments->sum('answer_count'),
                    'completion_percentage' => round($completionRate, 1),
                    'remaining_as_evaluator' => $remainingEvaluations,
                ],
                'remaining_evaluations_detail' => $remainingEvaluationsData->map(function($item) {
                    return [
                        'assignment_id' => $item->assignment_id,
                        'evaluatee_name' => trim($item->fname . ' ' . $item->lname),
                        'evaluatee_emid' => $item->emid,
                        'position' => $item->position ?? 'ไม่ระบุ',
                        'division' => $item->division ?? 'ไม่ระบุ',
                        'evaluation_title' => $item->evaluation_title,
                        'angle' => $item->angle,
                        'answered_questions' => $item->answered_questions,
                        'total_questions' => $item->total_questions,
                        'completion_percentage' => $item->completion_percentage,
                        'is_completed' => $item->completion_percentage >= 100,
                    ];
                })->toArray(),
            ];
            
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error fetching evaluatee details: ' . $e->getMessage());
            return response()->json(['error' => 'ไม่พบข้อมูลผู้ถูกประเมิน'], 404);
        }
    }

    /**
     * Translate evaluation angle to Thai
     */
    private function translateAngle(string $angle): string
    {
        $translations = [
            'self' => 'ประเมินตนเอง',
            'top' => 'ประเมินโดยผู้บังคับบัญชา',
            'bottom' => 'ประเมินโดยผู้ใต้บังคับบัญชา',
            'left' => 'ประเมินโดยเพื่อนร่วมงาน',
            'right' => 'ประเมินโดยผู้ประเมินภายนอก'
        ];
        
        return $translations[$angle] ?? $angle;
    }

    /**
     * Convert Christian Era year to Buddhist Era year
     */
    private function convertToBuddhistEra($year): string
    {
        if (empty($year) || !is_numeric($year)) {
            return '';
        }
        
        return (int)$year + 543;
    }

    /**
     * Export self-evaluation report
     */
    public function exportSelfEvaluationReport(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            
            // Convert Buddhist year to Gregorian year if needed
            if ($fiscalYear > 2500) {
                $fiscalYear = $fiscalYear - 543;
            }
            
            // Check if we have self-evaluation data (where user_id = evaluatee_id in answers)
            $selfEvalCount = DB::table('answers')
                ->where('answers.user_id', '=', DB::raw('answers.evaluatee_id'))
                ->whereYear('answers.created_at', $fiscalYear)
                ->count();
                
            Log::info("Self-evaluation export requested", [
                'fiscal_year' => $fiscalYear,
                'self_eval_count' => $selfEvalCount,
                'filters' => $request->all()
            ]);
            
            if ($selfEvalCount == 0) {
                return response()->json(['error' => 'ไม่พบข้อมูลการประเมินตนเองในปี ' . $fiscalYear . ' (พ.ศ. ' . ($fiscalYear + 543) . ')'], 404);
            }
            
            // Get self-evaluation data (where user_id = evaluatee_id)
            $filters = [
                'fiscal_year' => $fiscalYear,
                'self_evaluation' => true,
                'only_completed' => $request->input('only_completed'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'user_id' => $request->input('user_id'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
            ];
            
            if ($request->filled('division_id')) {
                $filters['division_id'] = $request->input('division_id');
            }
            
            if ($request->filled('grade')) {
                $filters['grade'] = $request->input('grade');
            }
            
            Log::info('Self-evaluation export filters (all parts):', $filters);
            
            $filePath = $this->evaluationExportService->exportSelfEvaluationReport($filters);
            
            if (!file_exists($filePath)) {
                return response()->json(['error' => 'ไม่สามารถสร้างไฟล์รายงานได้'], 500);
            }
            
            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Self-evaluation export error: ' . $e->getMessage());
            return response()->json(['error' => 'ไม่สามารถส่งออกรายงานการประเมินตนเองได้'], 500);
        }
    }

    /**
     * Export evaluation report as PDF with text content only (no images)
     */
    public function exportIndividualPdf(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division' => $request->input('division'),
                'grade' => $request->input('grade'),
                'group_filter' => $request->input('group_filter', 'all'),
                'format' => 'pdf'
            ];

            $filePath = $this->evaluationPdfExportService->exportEvaluationReport($filters);
            
            if (!file_exists($filePath)) {
                return response()->json(['error' => 'ไม่สามารถสร้างไฟล์ PDF ได้'], 500);
            }

            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('PDF export error: ' . $e->getMessage());
            return response()->json(['error' => 'เกิดข้อผิดพลาดในการส่งออก PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export comprehensive PDF report
     */
    public function exportComprehensivePdf(Request $request)
    {
        try {
            $this->boostLimits();
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division' => $request->input('division'),
                'grade' => $request->input('grade'),
                'group_filter' => 'all',
                'format' => 'pdf'
            ];

            $filePath = $this->evaluationPdfExportService->exportEvaluationReport($filters);
            
            if (!file_exists($filePath)) {
                return response()->json(['error' => 'ไม่สามารถสร้างไฟล์ PDF ได้'], 500);
            }

            return response()->download($filePath)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('PDF comprehensive export error: ' . $e->getMessage());
            return response()->json(['error' => 'เกิดข้อผิดพลาดในการส่งออก PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get dashboard data API
     */
    public function getDashboardData(Request $request): JsonResponse
    {
        try {
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $grade = $request->input('grade');
            
            $data = $this->fetchComprehensiveData($fiscalYear, $divisionId, $grade, null);
            
            return response()->json([
                'success' => true,
                'data' => $data['dashboardStats'],
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard data fetch error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch dashboard data',
            ], 500);
        }
    }

    /**
     * Get completion stats API
     */
    public function getCompletionStats(Request $request): JsonResponse
    {
        try {
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $grade = $request->input('grade');
            
            $data = $this->fetchComprehensiveData($fiscalYear, $divisionId, $grade, null);
            
            return response()->json([
                'success' => true,
                'data' => $data['evaluationMetrics'],
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Completion stats fetch error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch completion stats',
            ], 500);
        }
    }

    /**
     * Get individual angle report API
     */
    public function getIndividualAngleReport(Request $request): JsonResponse
    {
        try {
            $userId = $request->input('user_id');
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            
            if (!$userId) {
                return response()->json(['error' => 'User ID required'], 400);
            }
            
            $scores = $this->weightedScoringService->getIndividualAngleReport($userId, $fiscalYear);
            
            return response()->json([
                'success' => true,
                'data' => $scores,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Individual angle report error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch individual angle report',
            ], 500);
        }
    }

    /**
     * List evaluatees (legacy support)
     */
    public function listEvaluatees(Request $request): JsonResponse
    {
        try {
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $grade = $request->input('grade');
            
            $query = DB::table('users as u')
                ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                ->leftJoin('positions as p', 'u.position_id', '=', 'p.id')
                ->leftJoin('departments as dept', 'u.department_id', '=', 'dept.id')
                ->where('u.role', 'user')
                ->select([
                    'u.id',
                    'u.emid',
                    DB::raw("CONCAT(u.fname, ' ', u.lname) as name"),
                    'u.grade',
                    'd.name as division',
                    'dept.name as department',
                    'p.title as position'
                ]);
                
            if ($divisionId) {
                $query->where('u.division_id', $divisionId);
            }
            
            if ($grade) {
                $query->where('u.grade', $grade);
            }
            
            $evaluatees = $query->orderBy('u.fname')->get();
            
            return response()->json([
                'success' => true,
                'data' => $evaluatees,
                'total' => $evaluatees->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('List evaluatees error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch evaluatees list',
            ], 500);
        }
    }

    /**
     * Export comparison report
     */
    public function exportComparison(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $format = $request->input('format', 'excel');
            
            $data = $this->fetchComprehensiveData($fiscalYear, null, null, null);
            $filename = "รายงานเปรียบเทียบการประเมิน_{$fiscalYear}";
            
            if ($format === 'excel') {
                return $this->generateComparisonExcelReport($data, $filename);
            }
            
            return response()->json(['error' => 'Unsupported format'], 400);
        } catch (\Exception $e) {
            Log::error('Export comparison error: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed'], 500);
        }
    }

    /**
     * Generate comparison Excel report
     */
    private function generateComparisonExcelReport(array $data, string $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('เปรียบเทียบการประเมิน');
        
        $row = 1;
        
        // Header
        $sheet->setCellValue('A' . $row, 'รายงานเปรียบเทียบการประเมิน 360 องศา');
        $sheet->mergeCells('A' . $row . ':F' . $row);
        $sheet->getStyle('A' . $row)->getFont()->setSize(16)->setBold(true);
        $row += 2;
        
        // By Grade comparison
        $sheet->setCellValue('A' . $row, 'เปรียบเทียบตามระดับ');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row += 1;
        
        $sheet->setCellValue('A' . $row, 'ระดับ');
        $sheet->setCellValue('B' . $row, 'จำนวน');
        $sheet->setCellValue('C' . $row, 'เสร็จสิ้น');
        $sheet->setCellValue('D' .$row, 'คะแนนเฉลี่ย');
        $sheet->setCellValue('E' . $row, '% เสร็จสิ้น');
        $sheet->getStyle('A' . $row . ':E' . $row)->getFont()->setBold(true);
        $row++;
        
        foreach ($data['evaluationMetrics']['byGrade'] as $gradeData) {
            $sheet->setCellValue('A' . $row, 'C' . $gradeData['grade']);
            $sheet->setCellValue('B' . $row, $gradeData['total']);
            $sheet->setCellValue('C' . $row, $gradeData['completed']);
            $sheet->setCellValue('D' . $row, $gradeData['averageScore']);
            $sheet->setCellValue('E' . $row, $gradeData['completionRate'] . '%');
            $row++;
        }
        
        $row += 2;
        
        // By Division comparison
        $sheet->setCellValue('A' . $row, 'เปรียบเทียบตามหน่วยงาน');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row += 1;
        
        $sheet->setCellValue('A' . $row, 'หน่วยงาน');
        $sheet->setCellValue('B' . $row, 'จำนวน');
        $sheet->setCellValue('C' . $row, 'เสร็จสิ้น');
        $sheet->setCellValue('D' . $row, 'คะแนนเฉลี่ย');
        $sheet->setCellValue('E' . $row, '% เสร็จสิ้น');
        $sheet->getStyle('A' . $row . ':E' . $row)->getFont()->setBold(true);
        $row++;
        
        foreach ($data['evaluationMetrics']['byDivision'] as $divisionData) {
            $sheet->setCellValue('A' . $row, $divisionData['division']);
            $sheet->setCellValue('B' . $row, $divisionData['total']);
            $sheet->setCellValue('C' . $row, $divisionData['completed']);
            $sheet->setCellValue('D' . $row, $divisionData['averageScore']);
            $sheet->setCellValue('E' . $row, $divisionData['completionRate'] . '%');
            $row++;
        }
        
        foreach (range('A', 'E') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        $writer = new Xlsx($spreadsheet);
        
        return response()->streamDownload(function() use ($writer) {
            $writer->save('php://output');
        }, $filename . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Get count of users who completed ALL their assigned evaluation questions.
     * Optimized: uses 3 queries instead of N+1 loop (was ~4000+ queries).
     */
    private function getCompletedEvaluationsCount(string $fiscalYear): int
    {
        // 1) Pre-compute question counts per evaluation_id (single query)
        $questionCounts = DB::table('questions as q')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->select('p.evaluation_id', DB::raw('COUNT(*) as q_count'))
            ->groupBy('p.evaluation_id')
            ->pluck('q_count', 'evaluation_id');

        // 2) Get required questions per evaluator (single query)
        $assignments = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->select('evaluator_id', 'evaluation_id')
            ->get();

        $requiredPerEvaluator = [];
        foreach ($assignments as $a) {
            $qCount = $questionCounts[$a->evaluation_id] ?? 0;
            $requiredPerEvaluator[$a->evaluator_id] = ($requiredPerEvaluator[$a->evaluator_id] ?? 0) + $qCount;
        }

        // 3) Count actual answers per evaluator (single query)
        $actualCounts = DB::table('answers as a')
            ->join('evaluation_assignments as ea', function ($join) {
                $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                     ->on('a.user_id', '=', 'ea.evaluator_id')
                     ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
            })
            ->where('ea.fiscal_year', $fiscalYear)
            ->select('ea.evaluator_id', DB::raw('COUNT(*) as answer_count'))
            ->groupBy('ea.evaluator_id')
            ->pluck('answer_count', 'evaluator_id');

        // 4) Compare in PHP — no more loops hitting DB
        $completedCount = 0;
        foreach ($requiredPerEvaluator as $evaluatorId => $required) {
            if ($required > 0 && ($actualCounts[$evaluatorId] ?? 0) >= $required) {
                $completedCount++;
            }
        }

        return $completedCount;
    }

    /**
     * Get user comparison data with rankings and averages
     */
    private function getUserComparisonData(int $userId, string $fiscalYear): array
    {
        try {
            $user = User::findOrFail($userId);
            $userScore = $this->weightedScoringService->getIndividualAngleReport($userId, $fiscalYear)['average'] ?? 0;

            // Get grade average
            $gradeAverage = DB::table('users as u')
                ->join('evaluation_assignments as ea', 'u.id', '=', 'ea.evaluatee_id')
                ->join('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->where('u.grade', $user->grade)
                ->where('ea.fiscal_year', $fiscalYear)
                ->selectRaw('AVG(COALESCE(o.score, 
                    CASE 
                        WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                        ELSE 0 
                    END)) as avg_score')
                ->value('avg_score') ?? 0;

            // Get division average
            $divisionAverage = DB::table('users as u')
                ->join('evaluation_assignments as ea', 'u.id', '=', 'ea.evaluatee_id')
                ->join('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->where('u.division_id', $user->division_id)
                ->where('ea.fiscal_year', $fiscalYear)
                ->selectRaw('AVG(COALESCE(o.score, 
                    CASE 
                        WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                        ELSE 0 
                    END)) as avg_score')
                ->value('avg_score') ?? 0;

            // Get overall average
            $overallAverage = DB::table('evaluation_assignments as ea')
                ->join('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
                })
                ->where('ea.fiscal_year', $fiscalYear)
                ->selectRaw('AVG(COALESCE(o.score, 
                    CASE 
                        WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                        ELSE 0 
                    END)) as avg_score')
                ->value('avg_score') ?? 0;

            // Get rankings
            $gradeRanking = $this->getUserRankingInGrade($userId, $fiscalYear);
            $divisionRanking = $this->getUserRankingInDivision($userId, $fiscalYear);

            return [
                'grade_average' => round($gradeAverage, 2),
                'division_average' => round($divisionAverage, 2),
                'overall_average' => round($overallAverage, 2),
                'rank_in_grade' => $gradeRanking['rank'],
                'rank_in_division' => $divisionRanking['rank'],
                'total_in_grade' => $gradeRanking['total'],
                'total_in_division' => $divisionRanking['total'],
            ];
        } catch (\Exception $e) {
            Log::error('Error getting user comparison data: ' . $e->getMessage());
            return [
                'grade_average' => 0,
                'division_average' => 0,
                'overall_average' => 0,
                'rank_in_grade' => 0,
                'rank_in_division' => 0,
                'total_in_grade' => 0,
                'total_in_division' => 0,
            ];
        }
    }

    /**
     * Get user ranking within their grade
     */
    private function getUserRankingInGrade(int $userId, string $fiscalYear): array
    {
        $user = User::findOrFail($userId);
        
        // Get all users in same grade with their average scores
        $usersInGrade = DB::table('users as u')
            ->join('evaluation_assignments as ea', 'u.id', '=', 'ea.evaluatee_id')
            ->join('answers as a', function($join) {
                $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                     ->on('ea.evaluator_id', '=', 'a.user_id')
                     ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
            })
            ->leftJoin('options as o', function($join) {
                $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
            })
            ->where('u.grade', $user->grade)
            ->where('ea.fiscal_year', $fiscalYear)
            ->groupBy('u.id')
            ->selectRaw('u.id, AVG(COALESCE(o.score, 
                CASE 
                    WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                    ELSE 0 
                END)) as avg_score')
            ->orderByDesc('avg_score')
            ->get();

        $rank = 1;
        $total = $usersInGrade->count();
        
        foreach ($usersInGrade as $index => $userInGrade) {
            if ($userInGrade->id == $userId) {
                $rank = $index + 1;
                break;
            }
        }

        return ['rank' => $rank, 'total' => $total];
    }

    /**
     * Get user ranking within their division
     */
    private function getUserRankingInDivision(int $userId, string $fiscalYear): array
    {
        $user = User::findOrFail($userId);
        
        // Get all users in same division with their average scores
        $usersInDivision = DB::table('users as u')
            ->join('evaluation_assignments as ea', 'u.id', '=', 'ea.evaluatee_id')
            ->join('answers as a', function($join) {
                $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                     ->on('ea.evaluator_id', '=', 'a.user_id')
                     ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
            })
            ->leftJoin('options as o', function($join) {
                $join->on('a.value', '=', DB::raw('CAST(o.id AS CHAR)'));
            })
            ->where('u.division_id', $user->division_id)
            ->where('ea.fiscal_year', $fiscalYear)
            ->groupBy('u.id')
            ->selectRaw('u.id, AVG(COALESCE(o.score, 
                CASE 
                    WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                    ELSE 0 
                END)) as avg_score')
            ->orderByDesc('avg_score')
            ->get();

        $rank = 1;
        $total = $usersInDivision->count();
        
        foreach ($usersInDivision as $index => $userInDivision) {
            if ($userInDivision->id == $userId) {
                $rank = $index + 1;
                break;
            }
        }

        return ['rank' => $rank, 'total' => $total];
    }

    /**
     * BATCH: Get evaluator progress for multiple users in 2 queries instead of N
     */
    private function getBatchEvaluatorProgress($userIds, string $fiscalYear): array
    {
        try {
            // Query 1: Get total questions per evaluation
            $questionCounts = DB::table('questions as q')
                ->join('parts as p', 'q.part_id', '=', 'p.id')
                ->select('p.evaluation_id', DB::raw('COUNT(q.id) as total_questions'))
                ->groupBy('p.evaluation_id')
                ->pluck('total_questions', 'evaluation_id');

            // Query 2: Get all assignments + answer counts for all users at once
            $rows = DB::table('evaluation_assignments as ea')
                ->leftJoin('answers as a', function($join) {
                    $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'a.user_id')
                         ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                })
                ->whereIn('ea.evaluator_id', $userIds)
                ->where('ea.fiscal_year', $fiscalYear)
                ->groupBy('ea.evaluator_id', 'ea.evaluation_id', 'ea.evaluatee_id')
                ->select([
                    'ea.evaluator_id',
                    'ea.evaluation_id',
                    DB::raw('COUNT(a.id) as answered_questions'),
                ])
                ->get();

            $result = [];
            $grouped = $rows->groupBy('evaluator_id');

            foreach ($grouped as $uId => $userRows) {
                $totalAssignments = $userRows->count();
                $completed = 0; $inProgress = 0; $notStarted = 0;
                $totalQToAnswer = 0; $totalQAnswered = 0;

                foreach ($userRows as $row) {
                    $totalQ = $questionCounts[$row->evaluation_id] ?? 0;
                    $answeredQ = (int) $row->answered_questions;
                    $totalQToAnswer += $totalQ;
                    $totalQAnswered += $answeredQ;
                    if ($totalQ > 0 && $answeredQ >= $totalQ) $completed++;
                    elseif ($answeredQ > 0) $inProgress++;
                    else $notStarted++;
                }

                $overallProgress = $totalAssignments > 0 ? round(($completed / $totalAssignments) * 100, 1) : 0;
                $detailedProgress = $totalQToAnswer > 0 ? round(($totalQAnswered / $totalQToAnswer) * 100, 1) : 0;

                $result[$uId] = [
                    'total_assignments' => $totalAssignments,
                    'completed_assignments' => $completed,
                    'in_progress_assignments' => $inProgress,
                    'not_started_assignments' => $notStarted,
                    'overall_progress_percentage' => $overallProgress,
                    'total_questions_to_answer' => $totalQToAnswer,
                    'total_questions_answered' => $totalQAnswered,
                    'detailed_progress_percentage' => $detailedProgress,
                    'status' => $this->getProgressStatus($overallProgress, $completed, $totalAssignments),
                ];
            }

            foreach ($userIds as $uid) {
                if (!isset($result[$uid])) {
                    $result[$uid] = [
                        'total_assignments' => 0, 'completed_assignments' => 0,
                        'in_progress_assignments' => 0, 'not_started_assignments' => 0,
                        'overall_progress_percentage' => 0, 'total_questions_to_answer' => 0,
                        'total_questions_answered' => 0, 'detailed_progress_percentage' => 0,
                        'status' => 'no_assignments'
                    ];
                }
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Batch evaluator progress error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get evaluator progress for a single user (kept for backward compatibility)
     */
    private function getEvaluatorProgress(int $userId, string $fiscalYear): array
    {
        try {
            // Get all assignments where this user is the evaluator
            $evaluatorAssignments = DB::table('evaluation_assignments as ea')
                ->join('evaluations as ev', 'ea.evaluation_id', '=', 'ev.id')
                ->leftJoin(DB::raw('(
                    SELECT ea2.evaluation_id, ea2.evaluator_id, ea2.evaluatee_id, 
                           COUNT(a.id) as answered_questions,
                           (SELECT COUNT(q.id) 
                            FROM questions q 
                            JOIN parts p ON q.part_id = p.id 
                            WHERE p.evaluation_id = ea2.evaluation_id) as total_questions
                    FROM evaluation_assignments ea2
                    LEFT JOIN answers a ON ea2.evaluation_id = a.evaluation_id 
                                        AND ea2.evaluator_id = a.user_id 
                                        AND ea2.evaluatee_id = a.evaluatee_id
                    GROUP BY ea2.evaluation_id, ea2.evaluator_id, ea2.evaluatee_id
                ) as progress'), function($join) {
                    $join->on('ea.evaluation_id', '=', 'progress.evaluation_id')
                         ->on('ea.evaluator_id', '=', 'progress.evaluator_id')
                         ->on('ea.evaluatee_id', '=', 'progress.evaluatee_id');
                })
                ->where('ea.evaluator_id', $userId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->select([
                    'ea.id as assignment_id',
                    'ea.evaluation_id',
                    'ea.evaluatee_id',
                    'ev.title as evaluation_title',
                    DB::raw('COALESCE(progress.answered_questions, 0) as answered_questions'),
                    DB::raw('COALESCE(progress.total_questions, 0) as total_questions'),
                    DB::raw('CASE 
                        WHEN COALESCE(progress.total_questions, 0) > 0 
                        THEN ROUND((COALESCE(progress.answered_questions, 0) / progress.total_questions) * 100, 1)
                        ELSE 0 
                    END as completion_percentage')
                ])
                ->get();

            $totalAssignments = $evaluatorAssignments->count();
            $completedAssignments = $evaluatorAssignments->where('completion_percentage', '>=', 100)->count();
            $inProgressAssignments = $evaluatorAssignments->where('completion_percentage', '>', 0)->where('completion_percentage', '<', 100)->count();
            $notStartedAssignments = $evaluatorAssignments->where('completion_percentage', '=', 0)->count();
            
            $overallProgress = $totalAssignments > 0 ? 
                round(($completedAssignments / $totalAssignments) * 100, 1) : 0;

            $totalQuestionsToAnswer = $evaluatorAssignments->sum('total_questions');
            $totalQuestionsAnswered = $evaluatorAssignments->sum('answered_questions');
            
            $detailedProgress = $totalQuestionsToAnswer > 0 ? 
                round(($totalQuestionsAnswered / $totalQuestionsToAnswer) * 100, 1) : 0;

            return [
                'total_assignments' => $totalAssignments,
                'completed_assignments' => $completedAssignments,
                'in_progress_assignments' => $inProgressAssignments,
                'not_started_assignments' => $notStartedAssignments,
                'overall_progress_percentage' => $overallProgress,
                'total_questions_to_answer' => $totalQuestionsToAnswer,
                'total_questions_answered' => $totalQuestionsAnswered,
                'detailed_progress_percentage' => $detailedProgress,
                'status' => $this->getProgressStatus($overallProgress, $completedAssignments, $totalAssignments)
            ];
        } catch (\Exception $e) {
            Log::error('Error getting evaluator progress: ' . $e->getMessage());
            return [
                'total_assignments' => 0,
                'completed_assignments' => 0,
                'in_progress_assignments' => 0,
                'not_started_assignments' => 0,
                'overall_progress_percentage' => 0,
                'total_questions_to_answer' => 0,
                'total_questions_answered' => 0,
                'detailed_progress_percentage' => 0,
                'status' => 'no_assignments'
            ];
        }
    }

    /**
     * Get progress status based on completion
     */
    private function getProgressStatus(float $overallProgress, int $completedAssignments, int $totalAssignments): string
    {
        if ($totalAssignments === 0) {
            return 'no_assignments';
        } elseif ($completedAssignments === $totalAssignments) {
            return 'completed';
        } elseif ($overallProgress >= 75) {
            return 'nearly_complete';
        } elseif ($overallProgress > 0) {
            return 'in_progress';
        } else {
            return 'not_started';
        }
    }

    /**
     * Get detailed evaluator assignments for a user
     */
    private function getEvaluatorAssignments(int $userId, string $fiscalYear): array
    {
        try {
            $assignments = DB::table('evaluation_assignments as ea')
                ->join('users as evaluatee', 'ea.evaluatee_id', '=', 'evaluatee.id')
                ->join('evaluations as ev', 'ea.evaluation_id', '=', 'ev.id')
                ->leftJoin('positions as p', 'evaluatee.position_id', '=', 'p.id')
                ->leftJoin('divisions as d', 'evaluatee.division_id', '=', 'd.id')
                ->leftJoin(
                    DB::raw('(
                        SELECT 
                            a.evaluation_id,
                            a.user_id,
                            a.evaluatee_id,
                            COUNT(a.id) as answered_questions,
                            MAX(a.created_at) as last_answered
                        FROM answers a
                        GROUP BY a.evaluation_id, a.user_id, a.evaluatee_id
                    ) as answer_progress'),
                    function($join) {
                        $join->on('ea.evaluation_id', '=', 'answer_progress.evaluation_id')
                             ->on('ea.evaluator_id', '=', 'answer_progress.user_id')
                             ->on('ea.evaluatee_id', '=', 'answer_progress.evaluatee_id');
                    }
                )
                ->leftJoin(
                    DB::raw('(
                        SELECT 
                            part.evaluation_id,
                            COUNT(q.id) as total_questions
                        FROM questions q
                        JOIN parts part ON q.part_id = part.id
                        GROUP BY part.evaluation_id
                    ) as question_counts'),
                    'ea.evaluation_id', '=', 'question_counts.evaluation_id'
                )
                ->where('ea.evaluator_id', $userId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->where('ea.is_self_evaluation', 0) // ไม่รวมการประเมินตนเอง
                ->select([
                    'ea.id as assignment_id',
                    'ea.evaluation_id',
                    'ea.evaluatee_id',
                    'ea.angle',
                    'ea.completed_at',
                    'evaluatee.emid as evaluatee_emid',
                    'evaluatee.fname as evaluatee_fname',
                    'evaluatee.lname as evaluatee_lname',
                    'evaluatee.grade as evaluatee_grade',
                    'p.title as evaluatee_position',
                    'd.name as evaluatee_division',
                    'ev.title as evaluation_title',
                    DB::raw('COALESCE(answer_progress.answered_questions, 0) as answered_questions'),
                    DB::raw('COALESCE(question_counts.total_questions, 0) as total_questions'),
                    'answer_progress.last_answered'
                ])
                ->orderBy('evaluatee.fname')
                ->orderBy('evaluatee.lname')
                ->get();

            $processedAssignments = $assignments->map(function ($assignment) {
                $answeredQuestions = (int) $assignment->answered_questions;
                $totalQuestions = (int) $assignment->total_questions;
                $completionPercentage = $totalQuestions > 0 ? round(($answeredQuestions / $totalQuestions) * 100, 1) : 0;
                $isCompleted = $answeredQuestions > 0 && $answeredQuestions >= $totalQuestions;

                return [
                    'assignment_id' => $assignment->assignment_id,
                    'evaluation_id' => $assignment->evaluation_id,
                    'evaluation_title' => $assignment->evaluation_title,
                    'evaluatee' => [
                        'id' => $assignment->evaluatee_id,
                        'emid' => $assignment->evaluatee_emid,
                        'name' => trim($assignment->evaluatee_fname . ' ' . $assignment->evaluatee_lname),
                        'position' => $assignment->evaluatee_position ?? 'N/A',
                        'division' => $assignment->evaluatee_division ?? 'N/A',
                        'grade' => $assignment->evaluatee_grade ?? 0,
                    ],
                    'angle' => $assignment->angle,
                    'angle_text' => $this->getAngleText($assignment->angle),
                    'progress' => [
                        'answered_questions' => $answeredQuestions,
                        'total_questions' => $totalQuestions,
                        'completion_percentage' => $completionPercentage,
                        'is_completed' => $isCompleted,
                        'last_answered' => $assignment->last_answered,
                        'completed_at' => $assignment->completed_at,
                    ],
                    'status' => $this->getAssignmentStatus($completionPercentage, $isCompleted),
                    'priority' => $this->getAssignmentPriority($completionPercentage),
                ];
            });

            // สรุปข้อมูลรวม
            $summary = [
                'total_assignments' => $processedAssignments->count(),
                'completed_assignments' => $processedAssignments->where('progress.is_completed', true)->count(),
                'in_progress_assignments' => $processedAssignments->where('progress.completion_percentage', '>', 0)
                    ->where('progress.is_completed', false)->count(),
                'not_started_assignments' => $processedAssignments->where('progress.completion_percentage', 0)->count(),
                'overall_completion_percentage' => $processedAssignments->count() > 0 
                    ? round($processedAssignments->avg('progress.completion_percentage'), 1) 
                    : 0,
                'by_angle' => $processedAssignments->groupBy('angle')->map(function ($angleGroup, $angle) {
                    return [
                        'angle' => $angle,
                        'angle_text' => $this->getAngleText($angle),
                        'count' => $angleGroup->count(),
                        'completed' => $angleGroup->where('progress.is_completed', true)->count(),
                        'completion_percentage' => round($angleGroup->avg('progress.completion_percentage'), 1),
                    ];
                })->values(),
                'by_evaluation' => $processedAssignments->groupBy('evaluation_id')->map(function ($evalGroup) {
                    $first = $evalGroup->first();
                    return [
                        'evaluation_id' => $first['evaluation_id'],
                        'evaluation_title' => $first['evaluation_title'],
                        'count' => $evalGroup->count(),
                        'completed' => $evalGroup->where('progress.is_completed', true)->count(),
                        'completion_percentage' => round($evalGroup->avg('progress.completion_percentage'), 1),
                    ];
                })->values(),
            ];

            return [
                'assignments' => $processedAssignments->values()->toArray(),
                'summary' => $summary,
            ];

        } catch (\Exception $e) {
            Log::error('Error fetching evaluator assignments: ' . $e->getMessage());
            return [
                'assignments' => [],
                'summary' => [
                    'total_assignments' => 0,
                    'completed_assignments' => 0,
                    'in_progress_assignments' => 0,
                    'not_started_assignments' => 0,
                    'overall_completion_percentage' => 0,
                    'by_angle' => [],
                    'by_evaluation' => [],
                ],
            ];
        }
    }

    /**
     * Get angle display text
     */
    private function getAngleText(string $angle): string
    {
        switch ($angle) {
            case 'self': return 'ตนเอง';
            case 'top': return 'ประเมินโดยผู้บังคับบัญชา';
            case 'bottom': return 'ประเมินโดยผู้ใต้บังคับบัญชา';
            case 'left': return 'ประเมินโดยเพื่อนร่วมงาน';
            case 'right': return 'ประเมินโดยผู้ประเมินภายนอก';
            default: return $angle;
        }
    }

    /**
     * Get assignment status based on completion
     */
    private function getAssignmentStatus(float $completionPercentage, bool $isCompleted): string
    {
        if ($isCompleted) {
            return 'completed';
        } elseif ($completionPercentage >= 75) {
            return 'nearly_complete';
        } elseif ($completionPercentage > 0) {
            return 'in_progress';
        } else {
            return 'not_started';
        }
    }

    /**
     * Get assignment priority level
     */
    private function getAssignmentPriority(float $completionPercentage): string
    {
        if ($completionPercentage >= 75) {
            return 'low';
        } elseif ($completionPercentage >= 25) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    /**
     * Export individual evaluation report by grade group
     * Used by ReportExport.tsx handleExport()
     */
    public function exportIndividual(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $groupFilter = $request->input('group_filter', 'all');
            $divisionId = $request->input('division');

            $filters = [
                'fiscal_year' => $fiscalYear,
                'division_id' => $divisionId,
                'only_completed' => $request->input('only_completed'),
                'angle' => $request->input('angle'),
                'department_id' => $request->input('department_id'),
                'position_id' => $request->input('position_id'),
                'grade' => $request->input('grade'),
                'user_id' => $request->input('user_id'),
            ];

            if ($groupFilter === 'all') {
                $filePath = $this->evaluationExportService->exportComprehensiveEvaluationReport($filters);
            } else {
                // Parse grade range from group_filter (e.g. '5-8' or '9-12')
                $parts = explode('-', $groupFilter);
                $gradeMin = (int) ($parts[0] ?? 5);
                $gradeMax = (int) ($parts[1] ?? 8);

                $evaluation = EvaluationLookupService::findByGrade($gradeMin, 'internal', (int) $fiscalYear);

                if (!$evaluation) {
                    return response()->json(['error' => "ไม่พบแบบประเมินสำหรับระดับ C{$gradeMin}-C{$gradeMax}"], 404);
                }

                $filePath = $this->evaluationExportService->exportByEvaluationType($evaluation->id, $filters);
            }

            $filename = basename($filePath);
            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export individual error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว'], 500);
        }
    }

    /**
     * Export completion tracking data
     * Used by ReportExport.tsx handleCompletionExport()
     */
    public function exportCompletionData(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $grade = $request->input('grade');

            // Query: for each evaluatee, get completion status per angle
            $query = DB::table('users as u')
                ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                ->leftJoin('departments as dept', 'u.department_id', '=', 'dept.id')
                ->leftJoin('positions as pos', 'u.position_id', '=', 'pos.id')
                ->where('u.role', 'user')
                ->whereExists(function ($sub) use ($fiscalYear) {
                    $sub->select(DB::raw(1))
                        ->from('evaluation_assignments as ea')
                        ->whereColumn('ea.evaluatee_id', 'u.id')
                        ->where('ea.fiscal_year', $fiscalYear);
                })
                ->select([
                    'u.id', 'u.emid', 'u.fname', 'u.lname', 'u.grade',
                    'd.name as division', 'dept.name as department', 'pos.title as position',
                ]);

            if ($divisionId) {
                $query->where('u.division_id', $divisionId);
            }
            if ($grade) {
                $query->where('u.grade', $grade);
            }

            $evaluatees = $query->orderBy('u.grade')->orderBy('u.fname')->get();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('ข้อมูลความครบถ้วน');

            // Title
            $sheet->setCellValue('A1', 'รายงานความครบถ้วนการประเมิน 360 องศา');
            $sheet->mergeCells('A1:L1');
            $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('A2', 'ปีงบประมาณ: ' . ($fiscalYear + 543) . ' | วันที่สร้าง: ' . now()->format('d/m/Y H:i'));
            $sheet->mergeCells('A2:L2');
            $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Headers
            $headers = [
                'A4' => 'ลำดับ', 'B4' => 'รหัสพนักงาน', 'C4' => 'ชื่อ-สกุล',
                'D4' => 'ระดับ', 'E4' => 'หน่วยงาน', 'F4' => 'แผนก', 'G4' => 'ตำแหน่ง',
                'H4' => 'ตนเอง', 'I4' => 'ผู้บังคับบัญชา', 'J4' => 'ผู้ใต้บังคับบัญชา',
                'K4' => 'เพื่อนร่วมงาน (ซ้าย)', 'L4' => 'เพื่อนร่วมงาน (ขวา)',
                'M4' => 'องศาครบ', 'N4' => '% ครบถ้วน',
            ];

            foreach ($headers as $cell => $header) {
                $sheet->setCellValue($cell, $header);
            }

            $headerRange = 'A4:N4';
            $sheet->getStyle($headerRange)->getFont()->setBold(true);
            $sheet->getStyle($headerRange)->getFill()
                  ->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('4F46E5');
            $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
            $sheet->getStyle($headerRange)->getBorders()->getAllBorders()
                  ->setBorderStyle(Border::BORDER_THIN);

            $row = 5;
            $counter = 1;

            foreach ($evaluatees as $evaluatee) {
                $sheet->setCellValue('A' . $row, $counter);
                $sheet->setCellValue('B' . $row, $evaluatee->emid);
                $sheet->setCellValue('C' . $row, trim($evaluatee->fname . ' ' . $evaluatee->lname));
                $sheet->setCellValue('D' . $row, $evaluatee->grade);
                $sheet->setCellValue('E' . $row, $evaluatee->division ?? 'ไม่ระบุ');
                $sheet->setCellValue('F' . $row, $evaluatee->department ?? 'ไม่ระบุ');
                $sheet->setCellValue('G' . $row, $evaluatee->position ?? 'ไม่ระบุ');

                // Check each angle completion
                $completedAngles = 0;
                foreach (['self' => 'H', 'top' => 'I', 'bottom' => 'J', 'left' => 'K', 'right' => 'L'] as $angle => $col) {
                    if ($angle === 'self') {
                        // Self-evaluation: check if user answered their own evaluation
                        $hasAnswers = DB::table('answers')
                            ->where('user_id', $evaluatee->id)
                            ->where('evaluatee_id', $evaluatee->id)
                            ->whereYear('created_at', $fiscalYear)
                            ->exists();
                    } else {
                        $hasAnswers = DB::table('evaluation_assignments as ea')
                            ->join('answers as a', function ($join) {
                                $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                                     ->on('ea.evaluator_id', '=', 'a.user_id')
                                     ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                            })
                            ->where('ea.evaluatee_id', $evaluatee->id)
                            ->where('ea.angle', $angle)
                            ->where('ea.fiscal_year', $fiscalYear)
                            ->exists();
                    }

                    $status = $hasAnswers ? 'สำเร็จ' : 'รอดำเนินการ';
                    $sheet->setCellValue($col . $row, $status);

                    if ($hasAnswers) {
                        $sheet->getStyle($col . $row)->getFont()->getColor()->setRGB('28A745');
                        $completedAngles++;
                    } else {
                        $sheet->getStyle($col . $row)->getFont()->getColor()->setRGB('DC3545');
                    }
                }

                $sheet->setCellValue('M' . $row, $completedAngles . '/5');
                $sheet->setCellValue('N' . $row, round(($completedAngles / 5) * 100, 1) . '%');

                $row++;
                $counter++;
            }

            // Auto-size columns
            foreach (range('A', 'N') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            // Add borders to data
            if ($evaluatees->count() > 0) {
                $dataRange = 'A4:N' . ($row - 1);
                $sheet->getStyle($dataRange)->getBorders()->getAllBorders()
                      ->setBorderStyle(Border::BORDER_THIN);
            }

            $filename = 'รายงานความครบถ้วนการประเมิน_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            Log::error('Export completion data error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกข้อมูลความครบถ้วนล้มเหลว'], 500);
        }
    }

    /**
     * Export raw question-level data
     * Used by ReportExport.tsx handleRawDataExport()
     */
    public function exportRawQuestionData(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $grade = $request->input('grade');

            $query = DB::table('answers as a')
                ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
                ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                ->join('questions as q', 'a.question_id', '=', 'q.id')
                ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                ->leftJoin('evaluation_assignments as ea', function ($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
                ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->leftJoin('sub_aspects as sub_asp', 'q.sub_aspect_id', '=', 'sub_asp.id')
                ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
                ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
                ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
                ->select([
                    'evaluatee.emid as evaluatee_emid',
                    DB::raw("CONCAT(evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"),
                    'evaluatee.grade as evaluatee_grade',
                    'div.name as evaluatee_division',
                    'dept.name as evaluatee_department',
                    'pos.title as evaluatee_position',
                    'evaluator.emid as evaluator_emid',
                    DB::raw("CONCAT(evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
                    'ea.angle as evaluation_angle',
                    'q.id as question_id',
                    'p.title as part_title',
                    'asp.name as aspect_name',
                    'sub_asp.name as sub_aspect_name',
                    'q.title as question_title',
                    'q.type as question_type',
                    'o.id as option_id',
                    'o.label as option_label',
                    'o.score as option_score',
                    'a.other_text',
                    'a.created_at as answer_date',
                    'ea.fiscal_year',
                ]);

            // Apply filters
            $query->where(function ($q) use ($fiscalYear) {
                $q->whereYear('a.created_at', $fiscalYear)
                  ->orWhere('ea.fiscal_year', $fiscalYear);
            });

            if ($divisionId) {
                $query->where('evaluatee.division_id', $divisionId);
            }
            if ($grade) {
                $query->where('evaluatee.grade', $grade);
            }

            $results = $query->orderBy('evaluatee.id')
                            ->orderBy('p.order')
                            ->orderBy('q.id')
                            ->orderBy('ea.angle')
                            ->get();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('ข้อมูลดิบ');

            // Title
            $sheet->setCellValue('A1', 'ข้อมูลดิบการประเมิน 360 องศา');
            $sheet->mergeCells('A1:V1');
            $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('A2', 'ปีงบประมาณ: ' . ($fiscalYear + 543) . ' | จำนวนคำตอบ: ' . $results->count() . ' | วันที่สร้าง: ' . now()->format('d/m/Y H:i'));
            $sheet->mergeCells('A2:V2');
            $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Headers (22 columns per spec)
            $headers = [
                'A' => 'ลำดับ', 'B' => 'รหัสพนักงานผู้ถูกประเมิน', 'C' => 'ชื่อผู้ถูกประเมิน',
                'D' => 'ระดับ', 'E' => 'หน่วยงาน', 'F' => 'แผนก', 'G' => 'ตำแหน่ง',
                'H' => 'รหัสพนักงานผู้ประเมิน', 'I' => 'ชื่อผู้ประเมิน', 'J' => 'มุมการประเมิน',
                'K' => 'รหัสคำถาม', 'L' => 'ส่วนที่', 'M' => 'หมวดหมู่', 'N' => 'หมวดหมู่ย่อย',
                'O' => 'คำถาม', 'P' => 'ประเภทคำถาม',
                'Q' => 'รหัสตัวเลือก', 'R' => 'คำตอบ', 'S' => 'คะแนน',
                'T' => 'ข้อความเพิ่มเติม', 'U' => 'วันที่ตอบ', 'V' => 'ปีงบประมาณ',
            ];

            $headerRow = 4;
            foreach ($headers as $col => $header) {
                $sheet->setCellValue($col . $headerRow, $header);
            }

            $headerRange = 'A4:V4';
            $sheet->getStyle($headerRange)->getFont()->setBold(true);
            $sheet->getStyle($headerRange)->getFill()
                  ->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('4F46E5');
            $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
            $sheet->getStyle($headerRange)->getBorders()->getAllBorders()
                  ->setBorderStyle(Border::BORDER_THIN);

            $row = 5;
            $counter = 1;

            foreach ($results as $item) {
                $sheet->setCellValue('A' . $row, $counter);
                $sheet->setCellValue('B' . $row, $item->evaluatee_emid);
                $sheet->setCellValue('C' . $row, $item->evaluatee_name);
                $sheet->setCellValue('D' . $row, $item->evaluatee_grade);
                $sheet->setCellValue('E' . $row, $item->evaluatee_division ?? 'ไม่ระบุ');
                $sheet->setCellValue('F' . $row, $item->evaluatee_department ?? 'ไม่ระบุ');
                $sheet->setCellValue('G' . $row, $item->evaluatee_position ?? 'ไม่ระบุ');
                $sheet->setCellValue('H' . $row, $item->evaluator_emid);
                $sheet->setCellValue('I' . $row, $item->evaluator_name);
                $sheet->setCellValue('J' . $row, $this->translateAngle($item->evaluation_angle ?? ''));
                $sheet->setCellValue('K' . $row, $item->question_id);
                $sheet->setCellValue('L' . $row, $item->part_title);
                $sheet->setCellValue('M' . $row, $item->aspect_name);
                $sheet->setCellValue('N' . $row, $item->sub_aspect_name);
                $sheet->setCellValue('O' . $row, $item->question_title);
                $sheet->setCellValue('P' . $row, $this->translateQuestionType($item->question_type ?? ''));
                $sheet->setCellValue('Q' . $row, $item->option_id);
                $sheet->setCellValue('R' . $row, $item->option_label);
                $sheet->setCellValue('S' . $row, $item->option_score);
                $sheet->setCellValue('T' . $row, $item->other_text);
                $sheet->setCellValue('U' . $row, $item->answer_date);
                $sheet->setCellValue('V' . $row, $item->fiscal_year);

                $row++;
                $counter++;
            }

            // Auto-size columns
            foreach (range('A', 'V') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }

            // Specific widths for long content
            $sheet->getColumnDimension('O')->setWidth(50);
            $sheet->getColumnDimension('T')->setWidth(30);

            // Add borders
            if ($results->count() > 0) {
                $dataRange = 'A4:V' . ($row - 1);
                $sheet->getStyle($dataRange)->getBorders()->getAllBorders()
                      ->setBorderStyle(Border::BORDER_THIN);
            }

            $filename = 'ข้อมูลดิบการประเมิน_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            Log::error('Export raw question data error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกข้อมูลดิบล้มเหลว'], 500);
        }
    }

    /**
     * Translate question type to Thai
     */
    private function translateQuestionType(string $type): string
    {
        $translations = [
            'rating' => 'คะแนน',
            'choice' => 'เลือกตอบ',
            'multiple_choice' => 'เลือกหลายคำตอบ',
            'open_text' => 'ข้อความ',
        ];

        return $translations[$type] ?? $type;
    }

    /**
     * Export detailed evaluation report with angle breakdown and question details
     * Used by ReportExport.tsx handleDetailedExport()
     */
    public function exportDetailedEvaluationReport(Request $request)
    {
        try {
            $this->boostLimits();
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division');
            $gradeGroup = $request->input('grade_group', 'all');
            $userIds = $request->input('user_ids');
            $includeRawScores = filter_var($request->input('include_raw_scores', true), FILTER_VALIDATE_BOOLEAN);
            $includeAngleBreakdown = filter_var($request->input('include_angle_breakdown', true), FILTER_VALIDATE_BOOLEAN);
            $includeQuestionDetails = filter_var($request->input('include_question_details', false), FILTER_VALIDATE_BOOLEAN);

            // Build evaluatee query
            $evaluateeQuery = DB::table('users as u')
                ->leftJoin('divisions as d', 'u.division_id', '=', 'd.id')
                ->leftJoin('departments as dept', 'u.department_id', '=', 'dept.id')
                ->leftJoin('positions as pos', 'u.position_id', '=', 'pos.id')
                ->where('u.role', 'user')
                ->whereExists(function ($sub) use ($fiscalYear) {
                    $sub->select(DB::raw(1))
                        ->from('evaluation_assignments as ea')
                        ->whereColumn('ea.evaluatee_id', 'u.id')
                        ->where('ea.fiscal_year', $fiscalYear);
                })
                ->select([
                    'u.id', 'u.emid', 'u.fname', 'u.lname', 'u.grade',
                    'd.name as division', 'dept.name as department', 'pos.title as position',
                ]);

            if ($divisionId) {
                $evaluateeQuery->where('u.division_id', $divisionId);
            }

            if ($gradeGroup !== 'all') {
                $parts = explode('-', $gradeGroup);
                if (count($parts) === 2) {
                    $evaluateeQuery->whereBetween('u.grade', [(int) $parts[0], (int) $parts[1]]);
                } else {
                    $evaluateeQuery->where('u.grade', (int) $gradeGroup);
                }
            }

            if (!empty($userIds) && is_array($userIds)) {
                $evaluateeQuery->whereIn('u.id', $userIds);
            }

            $evaluatees = $evaluateeQuery->orderBy('u.grade')->orderBy('u.fname')->get();

            $spreadsheet = new Spreadsheet();

            // --- Sheet 1: Summary ---
            $summarySheet = $spreadsheet->getActiveSheet();
            $summarySheet->setTitle('สรุปรายบุคคล');

            $summarySheet->setCellValue('A1', 'รายงานรายละเอียดการประเมิน 360 องศา');
            $summarySheet->mergeCells('A1:K1');
            $summarySheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
            $summarySheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $summaryHeaders = [
                'A3' => 'ลำดับ', 'B3' => 'รหัสพนักงาน', 'C3' => 'ชื่อ-สกุล',
                'D3' => 'ระดับ', 'E3' => 'หน่วยงาน', 'F3' => 'ตำแหน่ง',
                'G3' => 'ตนเอง', 'H3' => 'ผู้บังคับบัญชา', 'I3' => 'ผู้ใต้บังคับบัญชา',
                'J3' => 'เพื่อนร่วมงาน (ซ้าย)', 'K3' => 'เพื่อนร่วมงาน (ขวา)',
                'L3' => 'คะแนนถ่วงน้ำหนัก',
            ];

            foreach ($summaryHeaders as $cell => $header) {
                $summarySheet->setCellValue($cell, $header);
            }

            $sHeaderRange = 'A3:L3';
            $summarySheet->getStyle($sHeaderRange)->getFont()->setBold(true);
            $summarySheet->getStyle($sHeaderRange)->getFill()
                         ->setFillType(Fill::FILL_SOLID)
                         ->getStartColor()->setRGB('4F46E5');
            $summarySheet->getStyle($sHeaderRange)->getFont()->getColor()->setRGB('FFFFFF');
            $summarySheet->getStyle($sHeaderRange)->getBorders()->getAllBorders()
                         ->setBorderStyle(Border::BORDER_THIN);

            $sRow = 4;
            $counter = 1;

            foreach ($evaluatees as $evaluatee) {
                $scores = $this->weightedScoringService->getIndividualAngleReport($evaluatee->id, $fiscalYear);

                $summarySheet->setCellValue('A' . $sRow, $counter);
                $summarySheet->setCellValue('B' . $sRow, $evaluatee->emid);
                $summarySheet->setCellValue('C' . $sRow, trim($evaluatee->fname . ' ' . $evaluatee->lname));
                $summarySheet->setCellValue('D' . $sRow, $evaluatee->grade);
                $summarySheet->setCellValue('E' . $sRow, $evaluatee->division ?? 'ไม่ระบุ');
                $summarySheet->setCellValue('F' . $sRow, $evaluatee->position ?? 'ไม่ระบุ');

                foreach (['self' => 'G', 'top' => 'H', 'bottom' => 'I', 'left' => 'J', 'right' => 'K'] as $angle => $col) {
                    $value = $scores[$angle] ?? 0;
                    $summarySheet->setCellValue($col . $sRow, $value > 0 ? round($value, 2) : '-');
                }

                $weighted = $scores['weighted_score'] ?? $scores['average'] ?? 0;
                $summarySheet->setCellValue('L' . $sRow, $weighted > 0 ? round($weighted, 2) : '-');

                $sRow++;
                $counter++;
            }

            foreach (range('A', 'L') as $column) {
                $summarySheet->getColumnDimension($column)->setAutoSize(true);
            }

            if ($evaluatees->count() > 0) {
                $summarySheet->getStyle('A3:L' . ($sRow - 1))->getBorders()->getAllBorders()
                             ->setBorderStyle(Border::BORDER_THIN);
            }

            // --- Sheet 2: Angle Breakdown (optional) ---
            if ($includeAngleBreakdown) {
                $angleSheet = $spreadsheet->createSheet();
                $angleSheet->setTitle('แจกแจงตามองศา');

                $angleHeaders = [
                    'A1' => 'รหัสพนักงาน', 'B1' => 'ชื่อ-สกุล', 'C1' => 'ระดับ',
                    'D1' => 'องศา', 'E1' => 'ผู้ประเมิน', 'F1' => 'คะแนนเฉลี่ย',
                    'G1' => 'จำนวนคำตอบ', 'H1' => 'สถานะ',
                ];

                foreach ($angleHeaders as $cell => $header) {
                    $angleSheet->setCellValue($cell, $header);
                }

                $aHeaderRange = 'A1:H1';
                $angleSheet->getStyle($aHeaderRange)->getFont()->setBold(true);
                $angleSheet->getStyle($aHeaderRange)->getFill()
                           ->setFillType(Fill::FILL_SOLID)
                           ->getStartColor()->setRGB('059669');
                $angleSheet->getStyle($aHeaderRange)->getFont()->getColor()->setRGB('FFFFFF');

                $aRow = 2;

                foreach ($evaluatees as $evaluatee) {
                    $assignments = DB::table('evaluation_assignments as ea')
                        ->join('users as evaluator', 'ea.evaluator_id', '=', 'evaluator.id')
                        ->leftJoin('answers as a', function ($join) {
                            $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                                 ->on('ea.evaluator_id', '=', 'a.user_id')
                                 ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
                        })
                        ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                        ->where('ea.evaluatee_id', $evaluatee->id)
                        ->where('ea.fiscal_year', $fiscalYear)
                        ->groupBy('ea.angle', 'evaluator.emid', 'evaluator.fname', 'evaluator.lname')
                        ->select([
                            'ea.angle',
                            'evaluator.emid as evaluator_emid',
                            DB::raw("CONCAT(evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
                            DB::raw('AVG(o.score) as avg_score'),
                            DB::raw('COUNT(a.id) as answer_count'),
                        ])
                        ->get();

                    foreach ($assignments as $assignment) {
                        $angleSheet->setCellValue('A' . $aRow, $evaluatee->emid);
                        $angleSheet->setCellValue('B' . $aRow, trim($evaluatee->fname . ' ' . $evaluatee->lname));
                        $angleSheet->setCellValue('C' . $aRow, $evaluatee->grade);
                        $angleSheet->setCellValue('D' . $aRow, $this->translateAngle($assignment->angle));
                        $angleSheet->setCellValue('E' . $aRow, $assignment->evaluator_name);
                        $angleSheet->setCellValue('F' . $aRow, $assignment->avg_score ? round($assignment->avg_score, 2) : '-');
                        $angleSheet->setCellValue('G' . $aRow, $assignment->answer_count);
                        $angleSheet->setCellValue('H' . $aRow, $assignment->answer_count > 0 ? 'สำเร็จ' : 'รอดำเนินการ');
                        $aRow++;
                    }
                }

                foreach (range('A', 'H') as $column) {
                    $angleSheet->getColumnDimension($column)->setAutoSize(true);
                }
            }

            // --- Sheet 3: Question Details (optional) ---
            if ($includeQuestionDetails) {
                $qSheet = $spreadsheet->createSheet();
                $qSheet->setTitle('รายละเอียดคำถาม');

                $qHeaders = [
                    'A1' => 'ผู้ถูกประเมิน', 'B1' => 'องศา', 'C1' => 'ผู้ประเมิน',
                    'D1' => 'ส่วนที่', 'E1' => 'หมวดหมู่', 'F1' => 'คำถาม',
                    'G1' => 'คำตอบ', 'H1' => 'คะแนน', 'I1' => 'ข้อความเพิ่มเติม',
                ];

                foreach ($qHeaders as $cell => $header) {
                    $qSheet->setCellValue($cell, $header);
                }

                $qHeaderRange = 'A1:I1';
                $qSheet->getStyle($qHeaderRange)->getFont()->setBold(true);
                $qSheet->getStyle($qHeaderRange)->getFill()
                       ->setFillType(Fill::FILL_SOLID)
                       ->getStartColor()->setRGB('D97706');
                $qSheet->getStyle($qHeaderRange)->getFont()->getColor()->setRGB('FFFFFF');

                $evaluateeIds = $evaluatees->pluck('id')->toArray();

                $questionData = DB::table('answers as a')
                    ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
                    ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                    ->join('questions as q', 'a.question_id', '=', 'q.id')
                    ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                    ->leftJoin('evaluation_assignments as ea', function ($join) {
                        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                             ->on('a.user_id', '=', 'ea.evaluator_id')
                             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                    })
                    ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
                    ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                    ->whereIn('a.evaluatee_id', $evaluateeIds)
                    ->where(function ($qry) use ($fiscalYear) {
                        $qry->whereYear('a.created_at', $fiscalYear)
                            ->orWhere('ea.fiscal_year', $fiscalYear);
                    })
                    ->select([
                        DB::raw("CONCAT(evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"),
                        'ea.angle',
                        DB::raw("CONCAT(evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
                        'p.title as part_title',
                        'asp.name as aspect_name',
                        'q.title as question_title',
                        'o.label as option_label',
                        'o.score as option_score',
                        'a.other_text',
                    ])
                    ->orderBy('evaluatee.id')
                    ->orderBy('p.order')
                    ->orderBy('q.id')
                    ->get();

                $qRow = 2;
                foreach ($questionData as $item) {
                    $qSheet->setCellValue('A' . $qRow, $item->evaluatee_name);
                    $qSheet->setCellValue('B' . $qRow, $this->translateAngle($item->angle ?? ''));
                    $qSheet->setCellValue('C' . $qRow, $item->evaluator_name);
                    $qSheet->setCellValue('D' . $qRow, $item->part_title);
                    $qSheet->setCellValue('E' . $qRow, $item->aspect_name);
                    $qSheet->setCellValue('F' . $qRow, $item->question_title);
                    $qSheet->setCellValue('G' . $qRow, $item->option_label);
                    $qSheet->setCellValue('H' . $qRow, $item->option_score);
                    $qSheet->setCellValue('I' . $qRow, $item->other_text);
                    $qRow++;
                }

                foreach (range('A', 'I') as $column) {
                    $qSheet->getColumnDimension($column)->setAutoSize(true);
                }
                $qSheet->getColumnDimension('F')->setWidth(50);
            }

            $filename = 'รายงานรายละเอียดครบถ้วน_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            Log::error('Export detailed evaluation report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานรายละเอียดล้มเหลว'], 500);
        }
}    public function exportPendingEvaluators(Request $request)
    {
        try {
            $this->boostLimits();

            $fiscalYear   = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId   = $request->input('division_id');
            $departmentId = $request->input('department_id');
            $positionId   = $request->input('position_id');
            $grade        = $request->input('grade');
            $angle        = $request->input('angle');
            $userId       = $request->input('user_id');

            // นับ answer ต่อ assignment + นับ question ต่อ evaluation (ดู getAssignmentsData)
            $answerCounts = DB::table('answers')
                ->select('evaluation_id', 'user_id as evaluator_id', 'evaluatee_id',
                         DB::raw('COUNT(*) as answer_count'))
                ->where('fiscal_year', $fiscalYear)
                ->groupBy('evaluation_id', 'user_id', 'evaluatee_id');

            // ไม่นับ open_text ใน total — ตรงกับ FE progress (EvaluationAssignmentController:64)
            // ถ้านับ → user ที่ตอบ required ครบแต่ไม่ตอบ open_text จะค้างเป็น pending ตลอด
            $questionCounts = DB::table('questions')
                ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
                ->join('parts', 'aspects.part_id', '=', 'parts.id')
                ->where('questions.type', '!=', 'open_text')
                ->select('parts.evaluation_id', DB::raw('COUNT(*) as total_questions'))
                ->groupBy('parts.evaluation_id');

            $rowsQuery = DB::table('evaluation_assignments as ea')
                ->join('users as ev', 'ev.id', '=', 'ea.evaluator_id')
                ->leftJoin('users as ee', 'ee.id', '=', 'ea.evaluatee_id')
                ->leftJoin('evaluations as e', 'e.id', '=', 'ea.evaluation_id')
                ->leftJoin('positions as p', 'p.id', '=', 'ev.position_id')
                ->leftJoin('departments as dep', 'dep.id', '=', 'ev.department_id')
                ->leftJoin('factions as f', 'f.id', '=', 'ev.faction_id')
                ->leftJoin('divisions as d', 'd.id', '=', 'ev.division_id')
                ->leftJoinSub($answerCounts, 'ans', function ($j) {
                    $j->on('ea.evaluation_id', '=', 'ans.evaluation_id')
                      ->on('ea.evaluator_id', '=', 'ans.evaluator_id')
                      ->on('ea.evaluatee_id', '=', 'ans.evaluatee_id');
                })
                ->leftJoinSub($questionCounts, 'qc', function ($j) {
                    $j->on('ea.evaluation_id', '=', 'qc.evaluation_id');
                })
                ->where('ev.user_type', 'internal')
                ->where('ea.fiscal_year', $fiscalYear)
                ->where(function ($w) {
                    $w->whereNull('ea.submitted_at')
                      ->orWhereRaw('COALESCE(ans.answer_count, 0) < COALESCE(qc.total_questions, 0)');
                })
                ->when($divisionId,   fn($q) => $q->where('ev.division_id', $divisionId))
                ->when($departmentId, fn($q) => $q->where('ev.department_id', $departmentId))
                ->when($positionId,   fn($q) => $q->where('ev.position_id', $positionId))
                ->when($grade,        fn($q) => $q->where('ev.grade', $grade))
                ->when($angle,        fn($q) => $q->where('ea.angle', $angle))
                ->when($userId,       fn($q) => $q->where('ev.id', $userId))
                ->orderBy('ev.emid')->orderBy('ee.fname')
                ->select(
                    'ev.emid', 'ev.prename', 'ev.fname', 'ev.lname', 'ev.grade',
                    'p.title as position',
                    'dep.name as department', 'f.name as faction', 'd.name as division',
                    'ee.prename as ee_prename', 'ee.fname as ee_fname', 'ee.lname as ee_lname',
                    'ee.grade as evaluatee_grade',
                    'ea.angle', 'e.title as evaluation_title',
                    DB::raw('COALESCE(ans.answer_count, 0) as answer_count'),
                    DB::raw('COALESCE(qc.total_questions, 0) as total_questions')
                );
            // stream rows ผ่าน cursor → memory คงที่แม้ dataset ใหญ่
            $cursor = $rowsQuery->cursor();
            $totalCount = (clone $rowsQuery)->count();

            $angleLabels = [
                'top'    => 'ผู้บังคับบัญชา (บน)',
                'bottom' => 'ผู้ใต้บังคับบัญชา (ล่าง)',
                'left'   => 'เพื่อนร่วมงาน (ซ้าย)',
                'right'  => 'องค์กรภายนอก (ขวา)',
                'self'   => 'ตนเอง',
            ];

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Pending Evaluators');

            // Title
            $sheet->setCellValue('A1', 'รายชื่อผู้ประเมินที่ยังไม่เสร็จสิ้น — ปีงบประมาณ พ.ศ. ' . ($fiscalYear + 543));
            $sheet->mergeCells('A1:M1');
            $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Metadata
            $sheet->setCellValue('A2', 'สร้างเมื่อ: ' . now()->format('d/m/Y H:i') . ' | จำนวน: ' . $totalCount . ' รายการ');
            $sheet->mergeCells('A2:M2');

            // Headers
            $headers = [
                'A4' => 'รหัสพนักงาน', 'B4' => 'คำนำหน้า', 'C4' => 'ชื่อ', 'D4' => 'นามสกุล',
                'E4' => 'ตำแหน่ง', 'F4' => 'ระดับ', 'G4' => 'กอง', 'H4' => 'ฝ่าย', 'I4' => 'สายงาน',
                'J4' => 'ผู้ถูกประเมิน', 'K4' => 'ระดับผู้ถูกประเมิน', 'L4' => 'มุม', 'M4' => 'แบบประเมิน',
            ];
            foreach ($headers as $cell => $h) {
                $sheet->setCellValue($cell, $h);
            }
            $sheet->getStyle('A4:M4')->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle('A4:M4')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('7C3AED');
            $sheet->getStyle('A4:M4')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            // Data rows — stream ผ่าน cursor + flush-on-emid-change
            // หลีกเลี่ยง autoSize (O(rows×cols) ทุก style) → fixed widths
            $colWidths = ['A'=>12,'B'=>10,'C'=>14,'D'=>16,'E'=>22,'F'=>8,'G'=>22,'H'=>22,'I'=>22,'J'=>22,'K'=>10,'L'=>18,'M'=>28];
            foreach ($colWidths as $col => $w) {
                $sheet->getColumnDimension($col)->setWidth($w);
            }

            $row = 5;
            if ($totalCount === 0) {
                $sheet->setCellValue('A' . $row, 'ไม่มีข้อมูลผู้ประเมินที่ค้างอยู่');
                $sheet->mergeCells("A{$row}:M{$row}");
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->getColor()->setRGB('9CA3AF');
            } else {
                $prevEmid    = null;
                $groupStart  = 5;
                $groupIdx    = 0;
                $firstRow    = null;

                $flush = function (int $groupEnd) use ($sheet, &$groupIdx, &$groupStart) {
                    if ($groupEnd < $groupStart) return;
                    // merge A-I ของ group (ครั้งเดียวต่อ group — เร็วกว่า style ต่อ cell)
                    if ($groupEnd > $groupStart) {
                        foreach (range('A', 'I') as $col) {
                            $sheet->mergeCells("{$col}{$groupStart}:{$col}{$groupEnd}");
                        }
                    }
                    $sheet->getStyle("A{$groupStart}:I{$groupEnd}")->getAlignment()
                        ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    if ($groupIdx % 2 === 1) {
                        $sheet->getStyle("A{$groupStart}:M{$groupEnd}")->getFill()
                            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                            ->getStartColor()->setRGB('F9FAFB');
                    }
                    if ($groupIdx > 0) {
                        $sheet->getStyle("A{$groupStart}:M{$groupStart}")->getBorders()
                            ->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                    }
                    $groupIdx++;
                };

                foreach ($cursor as $r) {
                    if ($prevEmid !== null && $r->emid !== $prevEmid) {
                        $flush($row - 1);
                        $groupStart = $row;
                        $firstRow = null;
                    }
                    if ($firstRow === null) {
                        // evaluator info เฉพาะ row แรกของ group
                        $sheet->setCellValue('A' . $row, $r->emid);
                        $sheet->setCellValue('B' . $row, $r->prename ?? '');
                        $sheet->setCellValue('C' . $row, $r->fname ?? '');
                        $sheet->setCellValue('D' . $row, $r->lname ?? '');
                        $sheet->setCellValue('E' . $row, $r->position ?? '-');
                        $sheet->setCellValue('F' . $row, $r->grade ?? '-');
                        $sheet->setCellValue('G' . $row, $r->department ?? '-');
                        $sheet->setCellValue('H' . $row, $r->faction ?? '-');
                        $sheet->setCellValue('I' . $row, $r->division ?? '-');
                        $firstRow = $row;
                    }
                    $eeName = trim(($r->ee_prename ?? '') . ($r->ee_fname ?? '') . ' ' . ($r->ee_lname ?? ''));
                    $sheet->setCellValue('J' . $row, $eeName ?: '-');
                    $sheet->setCellValue('K' . $row, $r->evaluatee_grade ?? '-');
                    $sheet->setCellValue('L' . $row, $angleLabels[$r->angle] ?? $r->angle);
                    $sheet->setCellValue('M' . $row, $r->evaluation_title ?? '-');
                    $prevEmid = $r->emid;
                    $row++;
                }
                // flush last group
                $flush($row - 1);

                $sheet->getStyle("F5:F" . ($row - 1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("K5:L" . ($row - 1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            }

            $filename = 'pending-evaluators-FY' . ($fiscalYear + 543) . '-' . now()->format('YmdHis') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export pending evaluators error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Export Excel — ผู้ประเมิน "ภายใน" ที่ส่งครบแล้ว (สำเร็จ)
     * predicate: submitted_at IS NOT NULL AND answer_count >= total_questions
     */
    public function exportCompletedEvaluatorsInternal(Request $request)
    {
        try {
            $this->boostLimits();

            $fiscalYear   = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId   = $request->input('division_id');
            $departmentId = $request->input('department_id');
            $positionId   = $request->input('position_id');
            $grade        = $request->input('grade');
            $angle        = $request->input('angle');
            $userId       = $request->input('user_id');

            $answerCounts = DB::table('answers')
                ->select('evaluation_id', 'user_id as evaluator_id', 'evaluatee_id',
                         DB::raw('COUNT(*) as answer_count'))
                ->where('fiscal_year', $fiscalYear)
                ->groupBy('evaluation_id', 'user_id', 'evaluatee_id');

            // ไม่นับ open_text ใน total — ตรงกับ FE progress (EvaluationAssignmentController:64)
            // ถ้านับ → user ที่ตอบ required ครบแต่ไม่ตอบ open_text จะค้างเป็น pending ตลอด
            $questionCounts = DB::table('questions')
                ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
                ->join('parts', 'aspects.part_id', '=', 'parts.id')
                ->where('questions.type', '!=', 'open_text')
                ->select('parts.evaluation_id', DB::raw('COUNT(*) as total_questions'))
                ->groupBy('parts.evaluation_id');

            $rowsQuery = DB::table('evaluation_assignments as ea')
                ->join('users as ev', 'ev.id', '=', 'ea.evaluator_id')
                ->leftJoin('users as ee', 'ee.id', '=', 'ea.evaluatee_id')
                ->leftJoin('evaluations as e', 'e.id', '=', 'ea.evaluation_id')
                ->leftJoin('positions as p', 'p.id', '=', 'ev.position_id')
                ->leftJoin('departments as dep', 'dep.id', '=', 'ev.department_id')
                ->leftJoin('factions as f', 'f.id', '=', 'ev.faction_id')
                ->leftJoin('divisions as d', 'd.id', '=', 'ev.division_id')
                ->leftJoinSub($answerCounts, 'ans', function ($j) {
                    $j->on('ea.evaluation_id', '=', 'ans.evaluation_id')
                      ->on('ea.evaluator_id', '=', 'ans.evaluator_id')
                      ->on('ea.evaluatee_id', '=', 'ans.evaluatee_id');
                })
                ->leftJoinSub($questionCounts, 'qc', function ($j) {
                    $j->on('ea.evaluation_id', '=', 'qc.evaluation_id');
                })
                ->where('ev.user_type', 'internal')
                ->where('ea.fiscal_year', $fiscalYear)
                ->whereNotNull('ea.submitted_at')
                ->whereRaw('COALESCE(ans.answer_count, 0) >= COALESCE(qc.total_questions, 0)')
                ->whereRaw('COALESCE(qc.total_questions, 0) > 0')
                ->when($divisionId,   fn($q) => $q->where('ev.division_id', $divisionId))
                ->when($departmentId, fn($q) => $q->where('ev.department_id', $departmentId))
                ->when($positionId,   fn($q) => $q->where('ev.position_id', $positionId))
                ->when($grade,        fn($q) => $q->where('ev.grade', $grade))
                ->when($angle,        fn($q) => $q->where('ea.angle', $angle))
                ->when($userId,       fn($q) => $q->where('ev.id', $userId))
                ->orderBy('ev.emid')->orderBy('ee.fname')
                ->select(
                    'ev.emid', 'ev.prename', 'ev.fname', 'ev.lname', 'ev.grade',
                    'p.title as position',
                    'dep.name as department', 'f.name as faction', 'd.name as division',
                    'ee.prename as ee_prename', 'ee.fname as ee_fname', 'ee.lname as ee_lname',
                    'ee.grade as evaluatee_grade',
                    'ea.angle', 'ea.submitted_at', 'e.title as evaluation_title'
                );

            $rows = $rowsQuery->get();
            $totalCount = $rows->count();

            $angleLabels = [
                'top'    => 'ผู้บังคับบัญชา (บน)',
                'bottom' => 'ผู้ใต้บังคับบัญชา (ล่าง)',
                'left'   => 'เพื่อนร่วมงาน (ซ้าย)',
                'right'  => 'องค์กรภายนอก (ขวา)',
                'self'   => 'ตนเอง',
            ];

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Completed Internal');

            $sheet->setCellValue('A1', 'รายชื่อผู้ประเมินภายในที่ประเมินสำเร็จแล้ว — ปีงบประมาณ พ.ศ. ' . ($fiscalYear + 543));
            $sheet->mergeCells('A1:N1');
            $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('A2', 'สร้างเมื่อ: ' . now()->format('d/m/Y H:i') . ' | จำนวน: ' . $totalCount . ' รายการ');
            $sheet->mergeCells('A2:N2');

            $headers = [
                'A4' => 'รหัสพนักงาน', 'B4' => 'คำนำหน้า', 'C4' => 'ชื่อ', 'D4' => 'นามสกุล',
                'E4' => 'ตำแหน่ง', 'F4' => 'ระดับ', 'G4' => 'กอง', 'H4' => 'ฝ่าย', 'I4' => 'สายงาน',
                'J4' => 'ผู้ถูกประเมิน', 'K4' => 'ระดับผู้ถูกประเมิน', 'L4' => 'มุม', 'M4' => 'แบบประเมิน', 'N4' => 'ส่งเมื่อ',
            ];
            foreach ($headers as $cell => $h) {
                $sheet->setCellValue($cell, $h);
            }
            $sheet->getStyle('A4:N4')->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle('A4:N4')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('059669');
            $sheet->getStyle('A4:N4')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $colWidths = ['A'=>12,'B'=>10,'C'=>14,'D'=>16,'E'=>22,'F'=>8,'G'=>22,'H'=>22,'I'=>22,'J'=>22,'K'=>10,'L'=>18,'M'=>28,'N'=>18];
            foreach ($colWidths as $col => $w) {
                $sheet->getColumnDimension($col)->setWidth($w);
            }

            $row = 5;
            if ($totalCount === 0) {
                $sheet->setCellValue('A' . $row, 'ไม่มีข้อมูลผู้ประเมินที่ส่งครบแล้ว');
                $sheet->mergeCells("A{$row}:N{$row}");
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->getColor()->setRGB('9CA3AF');
            } else {
                foreach ($rows as $r) {
                    $sheet->setCellValue('A' . $row, $r->emid);
                    $sheet->setCellValue('B' . $row, $r->prename ?? '');
                    $sheet->setCellValue('C' . $row, $r->fname ?? '');
                    $sheet->setCellValue('D' . $row, $r->lname ?? '');
                    $sheet->setCellValue('E' . $row, $r->position ?? '-');
                    $sheet->setCellValue('F' . $row, $r->grade ?? '-');
                    $sheet->setCellValue('G' . $row, $r->department ?? '-');
                    $sheet->setCellValue('H' . $row, $r->faction ?? '-');
                    $sheet->setCellValue('I' . $row, $r->division ?? '-');
                    $eeName = trim(($r->ee_prename ?? '') . ($r->ee_fname ?? '') . ' ' . ($r->ee_lname ?? ''));
                    $sheet->setCellValue('J' . $row, $eeName ?: '-');
                    $sheet->setCellValue('K' . $row, $r->evaluatee_grade ?? '-');
                    $sheet->setCellValue('L' . $row, $angleLabels[$r->angle] ?? $r->angle);
                    $sheet->setCellValue('M' . $row, $r->evaluation_title ?? '-');
                    $sheet->setCellValue('N' . $row, $r->submitted_at ? \Carbon\Carbon::parse($r->submitted_at)->format('d/m/Y H:i') : '-');
                    $row++;
                }
            }

            $filename = 'completed-evaluators-internal-FY' . ($fiscalYear + 543) . '-' . now()->format('YmdHis') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export completed evaluators internal error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export Excel — ผู้ประเมิน "ภายนอก" ที่ส่งครบแล้ว (สำเร็จ)
     * predicate: external_evaluation_sessions.completed_at IS NOT NULL
     */
    public function exportCompletedEvaluatorsExternal(Request $request)
    {
        return $this->exportExternalEvaluatorsByStatus($request, completed: true);
    }

    /**
     * Export Excel — ผู้ประเมิน "ภายนอก" ที่ยังไม่เสร็จสิ้น
     * predicate: ยังไม่มี session หรือ session.completed_at IS NULL
     */
    public function exportPendingEvaluatorsExternal(Request $request)
    {
        return $this->exportExternalEvaluatorsByStatus($request, completed: false);
    }

    /**
     * shared external evaluators export — split by status
     * row = 1 external_stakeholders entry (1 stakeholder × 1 evaluatee)
     * v3 schema: base = external_stakeholders (ชื่อ/contact จริง); evaluation_id ดึงจาก pivot
     */
    protected function exportExternalEvaluatorsByStatus(Request $request, bool $completed)
    {
        try {
            $this->boostLimits();

            $fiscalYear = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());

            // session-per-slot key จาก answers ไม่ใช่ session row โดยตรง
            // (session.evaluatee_id = คนแรกที่เลือกตอน login เท่านั้น แต่ submit ครอบหลายคน
            //  เช่น session 199 ของวีรชาติ มี evaluatee_id=1042 แต่ answers ครอบ {872,946,1042}
            //  ต้อง group จาก answers.evaluatee_id เพื่อ leftJoin แต่ละ stakeholder slot ติด)
            $sessionSub = DB::table('answers as a')
                ->join('external_evaluation_sessions as ses', 'ses.id', '=', 'a.external_session_id')
                ->select(
                    'a.external_access_code_id',
                    'a.evaluatee_id',
                    'ses.evaluator_name',
                    DB::raw('MIN(ses.started_at) as started_at'),
                    DB::raw('MAX(ses.completed_at) as completed_at')
                )
                ->groupBy('a.external_access_code_id', 'a.evaluatee_id', 'ses.evaluator_name');

            $q = DB::table('external_stakeholders as st')
                ->leftJoin('external_access_codes as ac', 'ac.id', '=', 'st.external_access_code_id')
                ->leftJoin('external_organizations as eo', 'eo.id', '=', 'ac.external_organization_id')
                ->leftJoin('external_code_evaluatees as ece', function ($j) {
                    $j->on('ece.external_access_code_id', '=', 'ac.id')
                      ->on('ece.evaluatee_id', '=', 'st.evaluatee_id');
                })
                ->leftJoin('evaluations as ev', 'ev.id', '=', 'ece.evaluation_id')
                ->leftJoin('users as ee', 'ee.id', '=', 'st.evaluatee_id')
                ->leftJoinSub($sessionSub, 's', function ($j) {
                    $j->on('s.external_access_code_id', '=', 'st.external_access_code_id')
                      ->on('s.evaluatee_id', '=', 'st.evaluatee_id')
                      ->on('s.evaluator_name', '=', 'st.contact_person');
                })
                ->where('st.fiscal_year', $fiscalYear);

            if ($completed) {
                // สำเร็จ = มี answer ของ (code, evaluatee) + evaluator_name = contact_person ใน session ที่ completed
                // (เลิกใช้ st.external_session_id เป็น join key เพราะ field นี้ stale —
                //  user login ซ้ำ session ใหม่ไม่ถูก link → คน submit จริงหายจาก export.
                //  ต้อง match evaluator_name กับ contact_person เพื่อกัน false positive ระหว่าง
                //  stakeholder slot คนละคน ที่ใช้ (code, evaluatee) เดียวกัน)
                $q->whereExists(function ($sub) {
                    $sub->select(DB::raw(1))->from('answers as ans2')
                        ->join('external_evaluation_sessions as ses2', 'ses2.id', '=', 'ans2.external_session_id')
                        ->whereColumn('ans2.external_access_code_id', 'st.external_access_code_id')
                        ->whereColumn('ans2.evaluatee_id', 'st.evaluatee_id')
                        ->whereNotNull('ses2.completed_at')
                        ->where(function ($w) {
                            $w->whereColumn('ses2.evaluator_name', 'st.contact_person')
                              ->orWhereNull('st.contact_person');
                        });
                });
            } else {
                $q->whereNotExists(function ($sub) {
                    $sub->select(DB::raw(1))->from('answers as ans2')
                        ->join('external_evaluation_sessions as ses2', 'ses2.id', '=', 'ans2.external_session_id')
                        ->whereColumn('ans2.external_access_code_id', 'st.external_access_code_id')
                        ->whereColumn('ans2.evaluatee_id', 'st.evaluatee_id')
                        ->whereNotNull('ses2.completed_at')
                        ->where(function ($w) {
                            $w->whereColumn('ses2.evaluator_name', 'st.contact_person')
                              ->orWhereNull('st.contact_person');
                        });
                });
            }

            // filter ตาม evaluatee (ผู้ถูกประเมิน)
            if ($v = $request->input('user_id'))       $q->where('ee.id', $v);
            if ($v = $request->input('grade'))         $q->where('ee.grade', (string) $v);
            if ($v = $request->input('division_id'))   $q->where('ee.division_id', $v);
            if ($v = $request->input('department_id')) $q->where('ee.department_id', $v);
            if ($v = $request->input('position_id'))   $q->where('ee.position_id', $v);

            $rows = $q->orderBy('eo.name')->orderBy('st.organization_name')->orderBy('ee.fname')
                ->select(
                    'eo.name as group_label',
                    'st.organization_name', 'st.contact_person', 'st.contact_info', 'st.coordinator',
                    'st.code as stakeholder_code',
                    'ee.prename as ee_prename', 'ee.fname as ee_fname', 'ee.lname as ee_lname',
                    'ee.grade as evaluatee_grade',
                    'ev.title as evaluation_title',
                    's.started_at', 's.completed_at', 's.evaluator_name'
                )->get();

            $totalCount = $rows->count();
            $label = $completed ? 'ที่ประเมินสำเร็จแล้ว' : 'ที่ยังไม่เสร็จสิ้น';
            $titleColor = $completed ? '059669' : '7C3AED';

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle($completed ? 'Completed External' : 'Pending External');

            $sheet->setCellValue('A1', 'รายชื่อผู้ประเมินภายนอก' . $label . ' — ปีงบประมาณ พ.ศ. ' . ($fiscalYear + 543));
            $sheet->mergeCells('A1:M1');
            $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('A2', 'สร้างเมื่อ: ' . now()->format('d/m/Y H:i') . ' | จำนวน: ' . $totalCount . ' รายการ');
            $sheet->mergeCells('A2:M2');

            $headers = [
                'A4' => 'หมวดองค์กร',       'B4' => 'ชื่อหน่วยงานองค์กร',
                'C4' => 'ผู้ติดต่อ',        'D4' => 'ติดต่อ (โทร/อีเมล)',
                'E4' => 'ผู้ประสานงาน',     'F4' => 'รหัสเข้าใช้งาน',
                'G4' => 'ผู้ถูกประเมิน',    'H4' => 'ระดับผู้ถูกประเมิน',
                'I4' => 'แบบประเมิน',       'J4' => 'เริ่มเมื่อ',
                'K4' => 'ส่งเมื่อ',         'L4' => 'สถานะ',
                'M4' => 'ผู้กรอกข้อมูล',
            ];
            foreach ($headers as $cell => $h) {
                $sheet->setCellValue($cell, $h);
            }
            $sheet->getStyle('A4:M4')->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
            $sheet->getStyle('A4:M4')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB($titleColor);
            $sheet->getStyle('A4:M4')->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);

            $colWidths = ['A'=>22,'B'=>34,'C'=>22,'D'=>24,'E'=>20,'F'=>18,'G'=>26,'H'=>10,'I'=>28,'J'=>16,'K'=>16,'L'=>12,'M'=>22];
            foreach ($colWidths as $col => $w) {
                $sheet->getColumnDimension($col)->setWidth($w);
            }

            $row = 5;
            if ($totalCount === 0) {
                $sheet->setCellValue('A' . $row, $completed ? 'ไม่มีข้อมูลผู้ประเมินภายนอกที่ส่งครบแล้ว' : 'ไม่มีข้อมูลผู้ประเมินภายนอกที่ค้างอยู่');
                $sheet->mergeCells("A{$row}:M{$row}");
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("A{$row}")->getFont()->setItalic(true)->getColor()->setRGB('9CA3AF');
            } else {
                // 2 ชั้น merge: A = หมวด (group_label); B-E = stakeholder ภายในหมวด
                $prevGroup  = null;
                $prevOrg    = null;
                $groupStart = 5;
                $orgStart   = 5;
                $orgIdx     = 0;

                $flushOrg = function (int $orgEnd) use ($sheet, &$orgIdx, &$orgStart) {
                    if ($orgEnd < $orgStart) return;
                    if ($orgEnd > $orgStart) {
                        foreach (range('B', 'E') as $col) {
                            $sheet->mergeCells("{$col}{$orgStart}:{$col}{$orgEnd}");
                        }
                    }
                    $sheet->getStyle("B{$orgStart}:E{$orgEnd}")->getAlignment()
                        ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                    if ($orgIdx % 2 === 1) {
                        $sheet->getStyle("A{$orgStart}:M{$orgEnd}")->getFill()
                            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                            ->getStartColor()->setRGB('F9FAFB');
                    }
                    $orgIdx++;
                };
                $flushGroup = function (int $groupEnd) use ($sheet, &$groupStart) {
                    if ($groupEnd <= $groupStart) return;
                    $sheet->mergeCells("A{$groupStart}:A{$groupEnd}");
                    $sheet->getStyle("A{$groupStart}:A{$groupEnd}")->getAlignment()
                        ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
                };

                foreach ($rows as $r) {
                    $groupKey = (string) ($r->group_label ?? '');
                    $orgKey   = (string) ($r->organization_name ?? '') . '|' . $groupKey;

                    if ($prevGroup !== null && $groupKey !== $prevGroup) {
                        $flushOrg($row - 1);
                        $flushGroup($row - 1);
                        $groupStart = $row;
                        $orgStart   = $row;
                    } elseif ($prevOrg !== null && $orgKey !== $prevOrg) {
                        $flushOrg($row - 1);
                        $orgStart = $row;
                    }

                    if ($groupKey !== $prevGroup) {
                        $sheet->setCellValue('A' . $row, $groupKey !== '' ? $groupKey : '-');
                    }
                    if ($orgKey !== $prevOrg) {
                        $sheet->setCellValue('B' . $row, $r->organization_name ?? '-');
                        $sheet->setCellValue('C' . $row, $r->contact_person ?? '-');
                        $sheet->setCellValue('D' . $row, $r->contact_info ?? '-');
                        $sheet->setCellValue('E' . $row, $r->coordinator ?? '-');
                    }

                    $sheet->setCellValue('F' . $row, $r->stakeholder_code ?? '-');
                    $eeName = trim(($r->ee_prename ?? '') . ($r->ee_fname ?? '') . ' ' . ($r->ee_lname ?? ''));
                    $sheet->setCellValue('G' . $row, $eeName !== '' ? $eeName : '-');
                    $sheet->setCellValue('H' . $row, $r->evaluatee_grade ?? '-');
                    $sheet->setCellValue('I' . $row, $r->evaluation_title ?? '-');
                    $sheet->setCellValue('J' . $row, $r->started_at ? \Carbon\Carbon::parse($r->started_at)->format('d/m/Y H:i') : '-');
                    $sheet->setCellValue('K' . $row, $r->completed_at ? \Carbon\Carbon::parse($r->completed_at)->format('d/m/Y H:i') : '-');
                    // อ้างจาก $completed flag (filter ผ่าน EXISTS แล้ว) ไม่ใช่ joined ts
                    // (joined ts อาจ NULL ถ้า contact_person ↔ evaluator_name ไม่ตรง 100%)
                    $status = $completed ? 'สำเร็จ' : ($r->started_at ? 'กำลังทำ' : 'ยังไม่เริ่ม');
                    $sheet->setCellValue('L' . $row, $status);
                    $sheet->setCellValue('M' . $row, $r->evaluator_name ?? '-');

                    $prevGroup = $groupKey;
                    $prevOrg   = $orgKey;
                    $row++;
                }
                $flushOrg($row - 1);
                $flushGroup($row - 1);
                $sheet->getStyle("H5:H" . ($row - 1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("L5:L" . ($row - 1))->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            }

            // เส้นตาราง — header หนา + data บาง + outline หนารอบทั้งตาราง
            $lastDataRow = max(5, $row - 1);
            $borderStyle = \PhpOffice\PhpSpreadsheet\Style\Border::class;
            $sheet->getStyle("A4:M4")->getBorders()->applyFromArray([
                'allBorders' => ['borderStyle' => $borderStyle::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF']],
                'outline'    => ['borderStyle' => $borderStyle::BORDER_MEDIUM, 'color' => ['rgb' => '111827']],
            ]);
            $sheet->getStyle("A5:M{$lastDataRow}")->getBorders()->applyFromArray([
                'allBorders' => ['borderStyle' => $borderStyle::BORDER_THIN, 'color' => ['rgb' => 'D1D5DB']],
                'outline'    => ['borderStyle' => $borderStyle::BORDER_MEDIUM, 'color' => ['rgb' => '111827']],
            ]);
            $sheet->getStyle("A4:M{$lastDataRow}")->getAlignment()->setWrapText(true);
            for ($r = 5; $r <= $lastDataRow; $r++) {
                $sheet->getRowDimension($r)->setRowHeight(-1);
            }

            $base = $completed ? 'completed-evaluators-external' : 'pending-evaluators-external';
            $filename = $base . '-FY' . ($fiscalYear + 543) . '-' . now()->format('YmdHis') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export external evaluators error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export สรุปผู้ประเมินภายนอกตามกลุ่ม (ต่อ 1 ผู้ถูกประเมิน) — รูปแบบ sumet_external_evaluators v2
     * 3 sheet: สรุปตามกลุ่ม / รายชื่อผู้ส่งแล้ว / รายชื่อผู้ได้รับเชิญทั้งหมด
     * "กลุ่ม" มาจาก access code (1 code = 1 group_label) ไม่ใช่ name-match;
     * sent = นับ completed session, map กลุ่มผ่าน code; session ที่ code ไม่มี stakeholder → (ไม่ระบุกลุ่ม)
     */
    public function exportExternalGroupSummary(Request $request)
    {
        try {
            $this->boostLimits();

            $fiscalYear  = (int) $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $evaluateeId = $request->input('user_id');
            $UNGROUPED   = '(ไม่ระบุกลุ่ม)';
            $UNKNOWN_ORG = '(ไม่ระบุหน่วยงาน)';

            // 1) ผู้ได้รับเชิญ = external_stakeholders ของ evaluatee + ปีงบ
            $stQ = DB::table('external_stakeholders as st')->where('st.fiscal_year', $fiscalYear);
            if ($evaluateeId) $stQ->where('st.evaluatee_id', $evaluateeId);
            $stakeholders = $stQ
                ->orderByRaw("COALESCE(NULLIF(TRIM(st.group_label),''),'~')")
                ->orderBy('st.organization_name')
                ->select('st.external_access_code_id', 'st.group_label', 'st.organization_name', 'st.contact_person')
                ->get();

            // map: code -> group_label (1 code = 1 group), code -> [contact_person => org]
            $codeGroup  = [];
            $contactOrg = [];
            $invited    = [];
            foreach ($stakeholders as $s) {
                $g = trim((string) ($s->group_label ?? ''));
                if ($g !== '' && !isset($codeGroup[$s->external_access_code_id])) {
                    $codeGroup[$s->external_access_code_id] = $g;
                }
                $contactOrg[$s->external_access_code_id][(string) $s->contact_person] = $s->organization_name;
                $key = $g !== '' ? $g : $UNGROUPED;
                $invited[$key] = ($invited[$key] ?? 0) + 1;
            }

            // 2) ส่งแล้ว = completed session ที่มี answer ของ evaluatee (1 submission = 1 แถว)
            $sentQ = DB::table('external_evaluation_sessions as ses')
                ->join('answers as a', 'a.external_session_id', '=', 'ses.id')
                ->whereNotNull('ses.completed_at');
            if ($evaluateeId) $sentQ->where('a.evaluatee_id', $evaluateeId);
            $sentSessions = $sentQ
                ->groupBy('ses.id', 'ses.external_access_code_id', 'ses.evaluator_name', 'ses.evaluator_position', 'ses.completed_at')
                ->orderBy('ses.completed_at')
                ->get(['ses.id', 'ses.external_access_code_id', 'ses.evaluator_name', 'ses.evaluator_position', 'ses.completed_at']);

            $sent          = [];
            $submitterRows = [];
            foreach ($sentSessions as $ss) {
                $g = $codeGroup[$ss->external_access_code_id] ?? $UNGROUPED;
                $sent[$g] = ($sent[$g] ?? 0) + 1;
                // open code: ไม่มี stakeholder → ใช้บริษัทที่ผู้ประเมินพิมพ์เอง (evaluator_position) ก่อน fallback unknown
                $typedOrg = trim((string) ($ss->evaluator_position ?? ''));
                $org = $contactOrg[$ss->external_access_code_id][(string) $ss->evaluator_name]
                    ?? ($typedOrg !== '' ? $typedOrg : $UNKNOWN_ORG);
                $submitterRows[] = [
                    'name'  => $ss->evaluator_name ?: '-',
                    'org'   => $org,
                    'group' => $g,
                    'date'  => $ss->completed_at ? \Carbon\Carbon::parse($ss->completed_at)->format('Y-m-d H:i:s') : '-',
                ];
            }

            // evaluatee name + ตำแหน่ง สำหรับหัวเรื่อง
            $eeName = '';
            $eePos  = '';
            if ($evaluateeId) {
                $ee = DB::table('users as u')->leftJoin('positions as p', 'p.id', '=', 'u.position_id')
                    ->where('u.id', $evaluateeId)
                    ->select('u.prename', 'u.fname', 'u.lname', 'p.title as pos')->first();
                if ($ee) {
                    $eeName = trim(($ee->prename ?? '') . ($ee->fname ?? '') . ' ' . ($ee->lname ?? ''));
                    $eePos  = $ee->pos ?? '';
                }
            }

            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $bold   = ['font' => ['bold' => true]];
            $hdrFill = function ($sheet, $range) {
                $sheet->getStyle($range)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
                $sheet->getStyle($range)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('0F766E');
            };

            // ── Sheet 1: สรุปตามกลุ่ม ──
            $s1 = $spreadsheet->getActiveSheet();
            $s1->setTitle('สรุปตามกลุ่ม');
            $titleSuffix = $eeName !== '' ? (' — ' . $eeName . ($eePos !== '' ? " ({$eePos})" : '')) : '';
            $s1->setCellValue('A1', 'สรุปผู้ประเมินภายนอก' . $titleSuffix . ' ปีงบ ' . ($fiscalYear + 543));
            $s1->mergeCells('A1:D1');
            $s1->getStyle('A1')->getFont()->setSize(14)->setBold(true);
            $s1->setCellValue('A3', 'กลุ่มที่สังกัด');
            $s1->setCellValue('B3', 'ผู้ได้รับเชิญ');
            $s1->setCellValue('C3', 'ส่งแล้ว');
            $s1->setCellValue('D3', 'คงเหลือ');
            $hdrFill($s1, 'A3:D3');

            $groups = array_unique(array_merge(array_keys($invited), array_keys($sent)));
            usort($groups, fn ($a, $b) => strcmp($a, $b)); // "(" มาก่อนตัวอักษรไทย → (ไม่ระบุกลุ่ม) อยู่บน
            $row = 4;
            $totInv = $totSent = 0;
            foreach ($groups as $g) {
                $inv = $invited[$g] ?? 0;
                $snt = $sent[$g] ?? 0;
                $s1->setCellValue('A' . $row, $g);
                $s1->setCellValue('B' . $row, $inv);
                $s1->setCellValue('C' . $row, $snt);
                $s1->setCellValue('D' . $row, $inv - $snt);
                $totInv += $inv;
                $totSent += $snt;
                $row++;
            }
            $s1->setCellValue('A' . $row, 'รวมทั้งหมด');
            $s1->setCellValue('B' . $row, $totInv);
            $s1->setCellValue('C' . $row, $totSent);
            $s1->setCellValue('D' . $row, $totInv - $totSent);
            $s1->getStyle("A{$row}:D{$row}")->applyFromArray($bold);
            foreach (['A' => 34, 'B' => 14, 'C' => 12, 'D' => 12] as $c => $w) $s1->getColumnDimension($c)->setWidth($w);

            // ── Sheet 2: รายชื่อผู้ส่งแล้ว ──
            $s2 = $spreadsheet->createSheet();
            $s2->setTitle('รายชื่อผู้ส่งแล้ว');
            foreach (['A1' => 'ลำดับ', 'B1' => 'ชื่อผู้ประเมิน', 'C1' => 'หน่วยงาน', 'D1' => 'กลุ่มที่สังกัด', 'E1' => 'วันที่ส่ง'] as $cell => $h) {
                $s2->setCellValue($cell, $h);
            }
            $hdrFill($s2, 'A1:E1');
            $r = 2;
            foreach ($submitterRows as $i => $sr) {
                $s2->setCellValue('A' . $r, $i + 1);
                $s2->setCellValue('B' . $r, $sr['name']);
                $s2->setCellValue('C' . $r, $sr['org']);
                $s2->setCellValue('D' . $r, $sr['group']);
                $s2->setCellValue('E' . $r, $sr['date']);
                $r++;
            }
            foreach (['A' => 8, 'B' => 32, 'C' => 40, 'D' => 26, 'E' => 20] as $c => $w) $s2->getColumnDimension($c)->setWidth($w);

            // ── Sheet 3: รายชื่อผู้ได้รับเชิญทั้งหมด ──
            $s3 = $spreadsheet->createSheet();
            $s3->setTitle('รายชื่อผู้ได้รับเชิญทั้งหมด');
            foreach (['A1' => 'ลำดับ', 'B1' => 'ชื่อผู้ประเมิน', 'C1' => 'หน่วยงาน', 'D1' => 'กลุ่มที่สังกัด'] as $cell => $h) {
                $s3->setCellValue($cell, $h);
            }
            $hdrFill($s3, 'A1:D1');
            $r = 2;
            foreach ($stakeholders as $i => $s) {
                $s3->setCellValue('A' . $r, $i + 1);
                $s3->setCellValue('B' . $r, $s->contact_person ?: '-');
                $s3->setCellValue('C' . $r, $s->organization_name ?: '-');
                $s3->setCellValue('D' . $r, trim((string) ($s->group_label ?? '')) ?: $UNGROUPED);
                $r++;
            }
            foreach (['A' => 8, 'B' => 32, 'C' => 40, 'D' => 26] as $c => $w) $s3->getColumnDimension($c)->setWidth($w);

            $spreadsheet->setActiveSheetIndex(0);

            $filename = 'external-group-summary-FY' . ($fiscalYear + 543) . '-' . now()->format('YmdHis') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export external group summary error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานล้มเหลว: ' . $e->getMessage()], 500);
        }
    }
}
