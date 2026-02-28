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

            // Get all necessary data
            $data = $this->fetchComprehensiveData($fiscalYear, $divisionId, $grade, $userId);

            return Inertia::render('AdminEvaluationReport', [
                'fiscalYear' => $fiscalYear,
                'filters' => [
                    'fiscal_year' => $fiscalYear,
                    'division' => $divisionId,
                    'grade' => $grade,
                    'user_id' => $userId,
                ],
                
                // Filter options
                'availableYears' => $data['availableYears'],
                'availableDivisions' => $data['availableDivisions'],
                'availableGrades' => $data['availableGrades'],
                'availableUsers' => $data['availableUsers'],
                'availableDepartments' => $data['availableDepartments'],
                'availablePositions' => $data['availablePositions'],
                
                // Main dashboard data for React component
                'dashboardStats' => $data['dashboardStats'],
                'evaluationMetrics' => $data['evaluationMetrics'],
                'detailedResults' => $data['detailedResults'],
                
                // Metadata
                'metadata' => [
                    'lastUpdated' => now()->toISOString(),
                    'dataVersion' => '3.0',
                    'totalRecords' => count($data['detailedResults']),
                ],
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
        $cacheKey = "evaluation_report_{$fiscalYear}_{$divisionId}_{$grade}_{$userId}";
        
        // DEBUG: Log cache key and check if cached
        $isCached = Cache::has($cacheKey);
        Log::info('fetchComprehensiveData cache info:', [
            'cache_key' => $cacheKey,
            'is_cached' => $isCached,
            'cache_ttl_hours' => self::CACHE_TTL / 3600,
            'fiscal_year' => $fiscalYear
        ]);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($fiscalYear, $divisionId, $grade, $userId) {
            Log::info('Cache miss - generating fresh data for fiscal year: ' . $fiscalYear);
            // Get basic data
            $rawScores = $this->getRawScores($fiscalYear, $divisionId, $grade, $userId);
            $users = $this->getUsers($divisionId, $grade);
            $assignments = $this->getAssignments($fiscalYear, $divisionId, $grade);
            
            return [
                'availableYears' => $this->getAvailableYears(),
                'availableDivisions' => $this->getAvailableDivisions(),
                'availableGrades' => $this->getAvailableGrades(),
                'availableUsers' => $this->getAvailableUsers(),
                'availableDepartments' => $this->getAvailableDepartments(),
                'availablePositions' => $this->getAvailablePositions(),
                
                'dashboardStats' => $this->calculateDashboardStats($rawScores, $users, $assignments),
                'evaluationMetrics' => $this->calculateEvaluationMetrics($rawScores),
                'detailedResults' => $this->formatDetailedResults($rawScores),
            ];
        });
    }

    /**
     * Get raw scores data from actual database
     */
    private function getRawScores(int $fiscalYear, $divisionId = null, $grade = null, $userId = null): Collection
    {
        try {
            Log::info('getRawScores called', [
                'fiscalYear' => $fiscalYear,
                'divisionId' => $divisionId,
                'grade' => $grade,
                'userId' => $userId
            ]);

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

            Log::info('Found assignments: ' . $assignments->count());
            Log::info('Using fiscal year: ' . $fiscalYear);

            if ($assignments->isEmpty()) {
                Log::info('No assignments found for fiscal year: ' . $fiscalYear);
                // Return empty collection but log what fiscal years are available
                $availableFiscalYears = DB::table('evaluation_assignments')
                    ->distinct()
                    ->pluck('fiscal_year')
                    ->sort()
                    ->values();
                Log::info('Available fiscal years in assignments: ' . $availableFiscalYears->implode(', '));
                
                // Also log total assignments for debugging
                $totalAssignments = DB::table('evaluation_assignments')->count();
                Log::info('Total assignments in database: ' . $totalAssignments);
                
                return collect([]);
            }

            // Now get answers for these assignments
            $userScores = [];
            $groupedAssignments = $assignments->groupBy('evaluatee_id');

            foreach ($groupedAssignments as $evaluateeId => $userAssignments) {
                $firstAssignment = $userAssignments->first();
                
                // Get answers for this evaluatee
                $answersQuery = DB::table('answers as a')
                    ->join('evaluation_assignments as ea', function($join) {
                        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                             ->on('a.user_id', '=', 'ea.evaluator_id')
                             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                    })
                    ->leftJoin('options as o', function($join) {
                        $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
                    })
                    ->where('a.evaluatee_id', $evaluateeId)
                    ->where('ea.fiscal_year', $fiscalYear)
                    ->select([
                        'ea.angle',
                        DB::raw('COALESCE(o.score, 
                            CASE 
                                WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                                ELSE 0 
                            END) as score')
                    ]);

                $answers = $answersQuery->get();
                
                Log::info("Evaluatee {$evaluateeId} has {$answers->count()} answers");

                // Calculate scores by angle
                $angleScores = $answers->groupBy('angle')->map(function($answers) {
                    $validScores = $answers->filter(fn($answer) => $answer->score > 0);
                    return $validScores->isNotEmpty() ? $validScores->avg('score') : 0;
                });

                $selfScore = $angleScores->get('self', 0);
                $topScore = $angleScores->get('top', 0);
                $bottomScore = $angleScores->get('bottom', 0);
                $leftScore = $angleScores->get('left', 0);
                $rightScore = $angleScores->get('right', 0);

                // Count available angles for this user
                $availableAngles = $userAssignments->pluck('angle')->unique()->count();
                $completedAngles = $angleScores->filter(fn($score) => $score > 0)->count();
                
                $validScores = array_filter([
                    $selfScore, $topScore, $bottomScore, $leftScore, $rightScore
                ], fn($score) => $score > 0);

                $average = count($validScores) > 0 ? array_sum($validScores) / count($validScores) : 0;
                $completionRate = $availableAngles > 0 ? ($completedAngles / $availableAngles) * 100 : 0;

                // Get evaluation progress for this user as an evaluator
                // Note: $evaluateeId is actually used as the ID of the person we're reporting on
                // We need to get their progress as an evaluator (how many people they need to evaluate)
                $evaluatorProgress = $this->getEvaluatorProgress($evaluateeId, $fiscalYear);

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
                    'total_answers' => $answers->count(),
                    'available_angles' => $availableAngles,
                    'completed_angles' => $completedAngles,
                    'last_updated' => $answers->isNotEmpty() ? $answers->max('created_at') : null,
                    // Add evaluator progress data
                    'evaluator_progress' => $evaluatorProgress,
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
     * Calculate dashboard statistics with correct business logic
     */
    private function calculateDashboardStats(Collection $rawScores, Collection $users, Collection $assignments): array
    {
        $fiscalYear = $this->getCurrentFiscalYear();
        
        // DEBUG: Log fiscal year being used
        Log::info('calculateDashboardStats - Fiscal Year being used: ' . $fiscalYear);
        
        // ผู้เข้าร่วม: ใช้ GROUP BY evaluator_id แบบที่ผู้ใช้ต้องการ สำหรับปีงบประมาณปัจจุบัน
        // ใช้ subquery เพื่อให้ได้ผลลัพธ์ที่ถูกต้องเหมือน SQL: SELECT evaluator_id FROM evaluation_assignments WHERE fiscal_year = 2025 GROUP BY evaluator_id
        $participantsByGroupBy = DB::select("
            SELECT COUNT(*) as total 
            FROM (
                SELECT evaluator_id 
                FROM evaluation_assignments 
                WHERE fiscal_year = ? 
                GROUP BY evaluator_id
            ) as grouped
        ", [$fiscalYear])[0]->total;
        
        // เปรียบเทียบกับวิธีเดิม
        $totalParticipantsDistinct = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->distinct('evaluator_id')
            ->count();
            
        // ใช้วิธี GROUP BY ตามที่ผู้ใช้ต้องการ
        $totalParticipants = $participantsByGroupBy;
        
        // DEBUG: Log comparison
        Log::info('Participant Count Comparison (Using Raw SQL GROUP BY):', [
            'group_by_raw_sql_method' => $participantsByGroupBy,
            'distinct_method' => $totalParticipantsDistinct,
            'fiscal_year_used' => $fiscalYear,
            'method_used' => 'Raw SQL: SELECT COUNT(*) FROM (SELECT evaluator_id FROM evaluation_assignments WHERE fiscal_year = ? GROUP BY evaluator_id)',
            'should_match_user_query_607' => $participantsByGroupBy == 607 ? 'YES' : 'NO',
            'difference_between_methods' => $totalParticipantsDistinct - $participantsByGroupBy
        ]);
            
        // Count unique evaluatees who have assignments
        $uniqueEvaluatees = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->distinct('evaluatee_id')
            ->count();
            
        // Count total assignments for reference
        $totalAssignments = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->count();
        
        // เสร็จสิ้น: นับ user_id จาก answers ที่ตอบคำถามครบทุกข้อแล้ว
        $completedEvaluations = $this->getCompletedEvaluationsCount($fiscalYear);
        
        // รอดำเนินการ: ผู้เข้าร่วม - เสร็จสิ้น
        $pendingEvaluations = max(0, $totalParticipants - $completedEvaluations);
        $overallCompletionRate = $totalParticipants > 0 ? ($completedEvaluations / $totalParticipants) * 100 : 0;
        
        // Calculate weighted average score from actual answers
        $averageScore = DB::table('answers as a')
            ->join('evaluation_assignments as ea', function($join) {
                $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                     ->on('a.user_id', '=', 'ea.evaluator_id')
                     ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
            })
            ->leftJoin('options as o', function($join) {
                $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
            })
            ->where('ea.fiscal_year', $fiscalYear)
            ->avg(DB::raw('COALESCE(o.score, 
                CASE 
                    WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                    ELSE 0 
                END)')) ?? 0;
        
        $totalAnswers = DB::table('answers as a')
            ->join('evaluation_assignments as ea', function($join) {
                $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                     ->on('a.user_id', '=', 'ea.evaluator_id')
                     ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
            })
            ->where('ea.fiscal_year', $fiscalYear)
            ->count();

        // Get additional stats
        $totalQuestions = $this->getTotalQuestions();
        $avgCompletionRate = $totalParticipants > 0 ? ($completedEvaluations / $totalParticipants) * 100 : 0;
        
        // Count evaluatees with high average scores (>= 4.0)
        $highPerformers = $rawScores->filter(fn($score) => $score['average'] >= 4.0)->count();
        
        // Additional debug: Check fiscal years available in database
        $availableFiscalYears = DB::table('evaluation_assignments')
            ->select('fiscal_year', DB::raw('COUNT(DISTINCT evaluator_id) as participant_count'))
            ->groupBy('fiscal_year')
            ->orderBy('fiscal_year', 'desc')
            ->get();
        
        // Check if current fiscal year matches what user expects  
        $userQueryEquivalent = DB::table('evaluation_assignments')
            ->select(DB::raw('COUNT(DISTINCT evaluator_id) as total_count'))
            ->first();
        
        Log::info('Dashboard stats calculation with Raw SQL GROUP BY method', [
            'fiscal_year' => $fiscalYear,
            'total_participants_raw_sql_group_by' => $totalParticipants,
            'total_participants_distinct' => $totalParticipantsDistinct,
            'completed_evaluations_all_questions' => $completedEvaluations,
            'pending_evaluations' => $pendingEvaluations,
            'total_assignments' => $totalAssignments,
            'counting_method_used' => 'Raw SQL with GROUP BY subquery',
            'matches_expected_607' => $totalParticipants == 607 ? 'YES' : 'NO',
            'available_fiscal_years' => $availableFiscalYears->toArray(),
            'user_query_equivalent_count' => $userQueryEquivalent->total_count
        ]);
        
        return [
            'totalParticipants' => $totalParticipants, // นับด้วย Raw SQL GROUP BY evaluator_id (ควรได้ 607)
            'completedEvaluations' => $completedEvaluations, // นับ user_id ที่ตอบครบทุกข้อ
            'pendingEvaluations' => $pendingEvaluations, // ผู้เข้าร่วม - เสร็จสิ้น
            'overallCompletionRate' => round($overallCompletionRate, 1),
            'averageScore' => round($averageScore, 2),
            'totalQuestions' => $totalQuestions,
            'totalAnswers' => $totalAnswers,
            'uniqueEvaluators' => $totalParticipants, // Same as total participants
            'uniqueEvaluatees' => $uniqueEvaluatees,
            'evaluationTypes' => 1, // 360-degree evaluation
            'totalAssignments' => $totalAssignments,
            'avgCompletionRate' => round($avgCompletionRate, 1),
            'highPerformers' => $highPerformers,
            'lastUpdated' => now()->toISOString()
        ];
    }

    /**
     * Calculate evaluation metrics for analytics
     */
    private function calculateEvaluationMetrics(Collection $rawScores): array
    {
        return [
            'byGrade' => $this->getMetricsByGrade($rawScores),
            'byDivision' => $this->getMetricsByDivision($rawScores),
            'byAngle' => $this->getMetricsByAngle($rawScores),
            'trends' => $this->getTrendMetrics($rawScores),
        ];
    }

    /**
     * Format detailed results for individual reports
     */
    private function formatDetailedResults(Collection $rawScores): array
    {
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
                    'lastActivity' => $score['last_updated'] ?? now()->toISOString(),
                ],
                // ข้อมูลสำหรับคอลัมน์ "ถูกประเมิน"
                'completed_angles' => $score['completed_angles'] ?? 0,
                'available_angles' => $score['available_angles'] ?? 5,
                'total_answers' => $score['total_answers'] ?? 0,
                // ข้อมูลสำหรับคอลัมน์ "ประเมินผู้อื่น"
                'evaluator_progress' => $score['evaluator_progress'] ?? [
                    'total_assignments' => 0,
                    'completed_assignments' => 0,
                    'overall_progress_percentage' => 0,
                    'total_questions_to_answer' => 0,
                    'total_questions_answered' => 0,
                    'status' => 'no_assignments'
                ],
                'evaluators' => $this->getEvaluatorsForUser($score['evaluatee_id']),
                'aspectScores' => $this->getAspectScoresForUser($score['evaluatee_id']),
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
        return $rawScores->groupBy('evaluatee_division')->map(function ($scores, $division) {
            $total = $scores->count();
            $completed = $scores->where('completion_rate', '>=', 80)->count();
            $completionRate = $total > 0 ? ($completed / $total) * 100 : 0;
            $averageScore = $scores->avg('average') ?? 0;

            return [
                'division' => $division ?? 'N/A',
                'divisionId' => $this->getDivisionId($division),
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
     * Get trend metrics from actual database data
     */
    private function getTrendMetrics(Collection $rawScores): array
    {
        try {
            // Get actual completion trends from database
            $trends = [];
            $currentYear = now()->year;
            
            // Get monthly data for the past 12 months
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $startDate = $month->startOfMonth()->toDateString();
                $endDate = $month->endOfMonth()->toDateString();
                
                // Get actual completions for this month
                $monthlyCompletions = DB::table('answers as a')
                    ->join('evaluation_assignments as ea', function($join) {
                        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                             ->on('a.user_id', '=', 'ea.evaluator_id')
                             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                    })
                    ->whereBetween('a.created_at', [$startDate, $endDate])
                    ->where('ea.fiscal_year', $currentYear)
                    ->distinct(['a.evaluatee_id', 'ea.angle'])
                    ->count();
                
                // Get average score for this month
                $monthlyAvgScore = DB::table('answers as a')
                    ->join('evaluation_assignments as ea', function($join) {
                        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                             ->on('a.user_id', '=', 'ea.evaluator_id')
                             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                    })
                    ->leftJoin('options as o', function($join) {
                        $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
                    })
                    ->whereBetween('a.created_at', [$startDate, $endDate])
                    ->where('ea.fiscal_year', $currentYear)
                    ->avg(DB::raw('COALESCE(o.score, 
                        CASE 
                            WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                            ELSE 0 
                        END)')) ?? 0;
                
                $trends[] = [
                    'date' => $month->format('Y-m-d'),
                    'month_name' => $month->format('M Y'),
                    'completions' => $monthlyCompletions,
                    'averageScore' => round($monthlyAvgScore, 2),
                    'target' => 4.0, // Target score
                ];
            }
            
            return $trends;
        } catch (\Exception $e) {
            Log::error('Error getting trend metrics: ' . $e->getMessage());
            
            // Fallback to sample data if error occurs
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
            // Get years from evaluation_assignments table
            $yearsFromAssignments = DB::table('evaluation_assignments')
                ->distinct()
                ->pluck('fiscal_year')
                ->filter()
                ->sort()
                ->values()
                ->toArray();
            
            // Get years from answers table
            $yearsFromAnswers = DB::table('answers')
                ->selectRaw('YEAR(created_at) as year')
                ->distinct()
                ->pluck('year')
                ->filter()
                ->sort()
                ->values()
                ->toArray();
            
            // Combine and deduplicate
            $allYears = collect($yearsFromAssignments)
                ->concat($yearsFromAnswers)
                ->unique()
                ->sort()
                ->values();
            
            // Add current year if not present
            $currentYear = now()->year;
            if (!$allYears->contains($currentYear)) {
                $allYears->push($currentYear);
            }
            
            // Convert to strings and return
            $result = $allYears->map(fn($year) => (string)$year)->toArray();
            
            Log::info('Available years found: ' . implode(', ', $result));
            
            return array_values($result);
        } catch (\Exception $e) {
            Log::error('Error getting available years: ' . $e->getMessage());
            return [(string)now()->year];
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
        try {
            return DB::table('users')
                ->select('id', DB::raw("CONCAT(fname, ' ', lname) as name"))
                ->where('role', 'user')
                ->orderBy('fname')
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            return [];
        }
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
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
     * Get division ID by name
     */
    private function getDivisionId($divisionName): int
    {
        if (!$divisionName) return 0;
        
        $division = DB::table('divisions')->where('name', $divisionName)->first();
        return $division->id ?? 0;
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
    private function getCurrentFiscalYear(): int
    {
        $now = now();
        $fiscalYear = $now->month >= 10 ? $now->year + 1 : $now->year;
        
        // DEBUG: Log fiscal year calculation
        Log::info('getCurrentFiscalYear calculation:', [
            'current_date' => $now->toDateString(),
            'current_month' => $now->month,
            'calculated_fiscal_year' => $fiscalYear,
            'logic' => $now->month >= 10 ? 'month >= 10, so year + 1' : 'month < 10, so current year'
        ]);
        
        // Check if current fiscal year has any data, if not try to find the most recent year with data
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
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            
            $user = User::with(['position', 'division'])->findOrFail($userId);
            $scores = $this->weightedScoringService->getIndividualAngleReport($userId, $fiscalYear);
            
            $data = [
                'user' => [
                    'id' => $user->id,
                    'name' => trim($user->fname . ' ' . $user->lname),
                    'position' => $user->position->title ?? 'N/A',
                    'division' => $user->division->name ?? 'N/A',
                    'grade' => $user->grade ?? 0,
                    'user_type' => 'internal', // Default type
                ],
                'scores' => [
                    'self' => $scores['self'] ?? 0,
                    'top' => $scores['top'] ?? 0,
                    'bottom' => $scores['bottom'] ?? 0,
                    'left' => $scores['left'] ?? 0,
                    'right' => $scores['right'] ?? 0,
                    'average' => $scores['average'] ?? 0,
                ],
                'completion_data' => [
                    'total_angles' => 5,
                    'completed_angles' => $this->getCompletedAnglesCount($scores),
                    'completion_rate' => round($scores['completion_rate'] ?? 0, 1),
                    'total_answers' => $scores['total_answers'] ?? 0,
                    'last_updated' => now()->toISOString(),
                ],
                'evaluators' => $this->getEvaluatorsForUser($userId),
                'aspect_scores' => $this->getAspectScoresForUser($userId),
                'comparison_data' => $this->getUserComparisonData($userId, $fiscalYear),
                'evaluator_assignments' => $this->getEvaluatorAssignments($userId, $fiscalYear),
            ];
            
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
            $userId = $request->input('user_id');
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            
            if (!$userId) {
                return response()->json(['error' => 'User ID required'], 400);
            }
            
            $user = User::with(['position', 'division'])->findOrFail($userId);
            $scores = $this->weightedScoringService->getIndividualAngleReport($userId, $fiscalYear);
            
            $data = [
                'user' => [
                    'name' => trim($user->fname . ' ' . $user->lname),
                    'position' => $user->position->title ?? 'N/A',
                    'division' => $user->division->name ?? 'N/A',
                    'grade' => $user->grade ?? 0,
                ],
                'scores' => $scores,
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
            'top' => 'องศาบน',
            'bottom' => 'องศาล่าง',
            'left' => 'องศาซ้าย',
            'right' => 'องศาขวา'
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
     * Export comprehensive evaluation report with detailed option mapping
     */
    public function exportComprehensiveReport(Request $request)
    {
        try {
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed')
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
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed')
            ];

            // Dynamic lookup: find 360 internal evaluation for grades 9-12
            $evaluation = Evaluation::where('user_type', 'internal')
                ->where('grade_min', 9)->where('grade_max', 12)
                ->where('title', 'like', '%360%')
                ->where('status', 'published')
                ->firstOrFail();

            $filePath = $this->evaluationExportService->exportByEvaluationType($evaluation->id, $filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export executive report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานผู้บริหารล้มเหลว'], 500);
        }
    }

    /**
     * Export employee level report (5-8)
     */
    public function exportEmployeeReport(Request $request)
    {
        try {
            $filters = [
                'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
                'division_id' => $request->input('division_id'),
                'user_id' => $request->input('user_id'),
                'only_completed' => $request->input('only_completed')
            ];

            // Dynamic lookup: find 360 internal evaluation for grades 5-8
            $evaluation = Evaluation::where('user_type', 'internal')
                ->where('grade_min', 5)->where('grade_max', 8)
                ->where('title', 'like', '%360%')
                ->where('status', 'published')
                ->firstOrFail();

            $filePath = $this->evaluationExportService->exportByEvaluationType($evaluation->id, $filters);
            $filename = basename($filePath);

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Export employee report error: ' . $e->getMessage());
            return response()->json(['error' => 'การส่งออกรายงานพนักงานล้มเหลว'], 500);
        }
    }

    /**
     * Export detailed evaluation data with questions and evaluators
     */
    public function exportDetailedEvaluationData(Request $request)
    {
        try {
            $evaluationId = $request->input('evaluation_id');
            $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
            $divisionId = $request->input('division_id');
            $userId = $request->input('user_id');

            if (!$evaluationId) {
                return response()->json(['error' => 'กรุณาระบุรหัสการประเมิน'], 400);
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
            ->join('options as o', 'a.value', '=', 'o.id')
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
            $sheet->setCellValue('N' . $row, $item->option_label);
            
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
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
            'top' => 'ผู้บังคับบัญชา',
            'bottom' => 'ผู้ใต้บังคับบัญชา',
            'left' => 'เพื่อนร่วมงาน (ซ้าย)',
            'right' => 'เพื่อนร่วมงาน (ขวา)'
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
                'self_evaluation' => true,  // Custom flag to indicate self-evaluation filtering
                'only_completed' => $request->input('only_completed')
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
     * Get count of users who completed ALL their assigned evaluation questions
     */
    private function getCompletedEvaluationsCount(string $fiscalYear): int
    {
        // Get all unique evaluators who have assignments in this fiscal year
        $evaluators = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->distinct('evaluator_id')
            ->pluck('evaluator_id');

        $completedCount = 0;

        foreach ($evaluators as $evaluatorId) {
            // Get all assignments for this evaluator in the fiscal year
            $assignments = DB::table('evaluation_assignments')
                ->where('evaluator_id', $evaluatorId)
                ->where('fiscal_year', $fiscalYear)
                ->get(['evaluation_id', 'evaluatee_id']);

            // Calculate total questions this evaluator needs to answer
            $totalRequiredQuestions = 0;
            foreach ($assignments as $assignment) {
                $questionCount = DB::table('questions as q')
                    ->join('parts as p', 'q.part_id', '=', 'p.id')
                    ->where('p.evaluation_id', $assignment->evaluation_id)
                    ->count();
                $totalRequiredQuestions += $questionCount;
            }

            // Count how many questions this evaluator actually answered
            $actualAnswersCount = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->where('ea.evaluator_id', $evaluatorId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->count();

            // If they answered all required questions, count as completed
            if ($actualAnswersCount >= $totalRequiredQuestions && $totalRequiredQuestions > 0) {
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
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
                $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
                $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
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
     * Get evaluator progress for a user (assignments they need to complete as evaluator)
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
            case 'top': return 'องศาบน';
            case 'bottom': return 'องศาล่าง';
            case 'left': return 'องศาซ้าย';
            case 'right': return 'องศาขวา';
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
}