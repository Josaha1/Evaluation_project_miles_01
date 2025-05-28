<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminEvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        // คำนวณปีงบประมาณปัจจุบัน (ตุลาคม - กันยายน)
        $currentFiscalYear = Carbon::now()->month >= 10
            ? Carbon::now()->addYear()->year
            : Carbon::now()->year;

        $year = $request->get('fiscal_year', $currentFiscalYear);
        $search = $request->get('search', '');
        $perPage = (int) $request->get('per_page', 15);

        /**
         * ------------------------------------------------------------------
         * 1️⃣ Base Query — reused for both paginated & full collections
         * ------------------------------------------------------------------
         */
        $baseQuery = EvaluationAssignment::with([
            'evaluator:id,fname,lname,grade,user_type',
            'evaluatee:id,fname,lname,grade,user_type',
        ])->where('fiscal_year', $year);

        // 🔍 Optional search filter (first‑name / last‑name ของผู้ถูกประเมินหรือผู้ประเมิน)
        if (!empty($search)) {
            $baseQuery->where(function ($q) use ($search) {
                $q->whereHas('evaluatee', function ($query) use ($search) {
                    $query->where('fname', 'like', "%{$search}%")
                        ->orWhere('lname', 'like', "%{$search}%");
                })->orWhereHas('evaluator', function ($query) use ($search) {
                    $query->where('fname', 'like', "%{$search}%")
                        ->orWhere('lname', 'like', "%{$search}%");
                });
            });
        }

        /**
         * ------------------------------------------------------------------
         * 2️⃣ Card View Data - จัดกลุ่มตามผู้ถูกประเมิน
         * ------------------------------------------------------------------
         */
        $allAssignments = (clone $baseQuery)->get();
        $cardViewData = $this->prepareCardViewData($allAssignments);

        /**
         * ------------------------------------------------------------------
         * 3️⃣ Paginated collection — ใช้กับ Table View เท่านั้น
         * ------------------------------------------------------------------
         */
        $assignments = (clone $baseQuery)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends($request->only(['fiscal_year', 'search', 'per_page']));

        // รายการปีงบประมาณทั้งหมดที่มีข้อมูล
        $fiscalYears = EvaluationAssignment::select('fiscal_year')
            ->distinct()
            ->orderBy('fiscal_year', 'desc')
            ->pluck('fiscal_year');

        // 🔥 Ultimate Analytics Engine
        $analytics = $this->getUltimateAnalytics($year, $search);

        return Inertia::render('AdminEvaluationAssignmentManager', [
            'assignments' => $assignments,    // ➡️ สำหรับ Table View
            'card_data' => $cardViewData,   // ➡️ สำหรับ Card View (แทน Analysis)
            'fiscal_years' => $fiscalYears,
            'selected_year' => $year,
            'analytics' => $analytics,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * จัดเตรียมข้อมูลสำหรับ Card View
     */
    private function prepareCardViewData($assignments)
    {
        $grouped = [];

        foreach ($assignments as $assignment) {
            $evaluateeKey = $assignment->evaluatee
                ? $assignment->evaluatee->id
                : 'unknown_' . $assignment->id;

            if (!isset($grouped[$evaluateeKey])) {
                $evaluateeGrade = $assignment->evaluatee ? (int)$assignment->evaluatee->grade : 0;
                $requiredAngles = $evaluateeGrade >= 9
                    ? ['top', 'bottom', 'left', 'right']
                    : ['top', 'left'];

                $grouped[$evaluateeKey] = [
                    'evaluatee' => $assignment->evaluatee,
                    'grade' => $evaluateeGrade,
                    'required_angles' => $requiredAngles,
                    'assignments' => [
                        'top' => [],
                        'bottom' => [],
                        'left' => [],
                        'right' => []
                    ],
                    'stats' => [
                        'total_evaluators' => 0,
                        'completed_angles' => 0,
                        'completion_rate' => 0,
                        'is_complete' => false
                    ]
                ];
            }

            $angle = $assignment->angle ?? 'unknown';
            if (isset($grouped[$evaluateeKey]['assignments'][$angle])) {
                $grouped[$evaluateeKey]['assignments'][$angle][] = [
                    'id' => $assignment->id,
                    'evaluator' => $assignment->evaluator,
                    'angle' => $angle,
                    'created_at' => $assignment->created_at,
                    'fiscal_year' => $assignment->fiscal_year
                ];
            }
        }

        // คำนวณสถิติสำหรับแต่ละกลุ่ม
        foreach ($grouped as $key => &$group) {
            $totalEvaluators = 0;
            $completedAngles = 0;

            foreach ($group['required_angles'] as $angle) {
                $evaluatorCount = count($group['assignments'][$angle]);
                if ($evaluatorCount > 0) {
                    $completedAngles++;
                }
                $totalEvaluators += $evaluatorCount;
            }

            $group['stats'] = [
                'total_evaluators' => $totalEvaluators,
                'completed_angles' => $completedAngles,
                'required_angles_count' => count($group['required_angles']),
                'completion_rate' => count($group['required_angles']) > 0
                    ? round(($completedAngles / count($group['required_angles'])) * 100, 2)
                    : 0,
                'is_complete' => $completedAngles === count($group['required_angles'])
            ];
        }

        // เรียงลำดับตามชื่อผู้ถูกประเมิน
        uasort($grouped, function ($a, $b) {
            $nameA = $a['evaluatee'] ? $a['evaluatee']->fname . ' ' . $a['evaluatee']->lname : '';
            $nameB = $b['evaluatee'] ? $b['evaluatee']->fname . ' ' . $b['evaluatee']->lname : '';
            return strcmp($nameA, $nameB);
        });

        return [
            'groups' => array_values($grouped),
            'summary' => [
                'total_evaluatees' => count($grouped),
                'complete_count' => count(array_filter($grouped, fn($g) => $g['stats']['is_complete'])),
                'incomplete_count' => count(array_filter($grouped, fn($g) => !$g['stats']['is_complete'])),
                'total_relationships' => array_sum(array_column(array_column($grouped, 'stats'), 'total_evaluators'))
            ]
        ];
    }

    /**
     * Simplified Analytics Engine - ใช้งานได้จริง
     */
    private function getUltimateAnalytics($fiscalYear, $search = '')
    {
        // 1. 📊 KPI Overview
        $kpis = $this->calculateKPIs($fiscalYear, $search);

        // 2. 🎯 Completion Analytics
        $completion = $this->analyzeCompletion($fiscalYear, $search);

        // 3. 👥 People Analytics
        $people = $this->analyzePeople($fiscalYear, $search);

        // 4. 📅 Timeline Analytics
        $timeline = $this->analyzeTimeline($fiscalYear);

        // 5. 🔥 Performance Insights
        $performance = $this->analyzePerformance($fiscalYear);

        // 6. 🎨 Visual Data for Charts
        $visualData = $this->prepareVisualData($fiscalYear, $search);

        // 7. 🚨 Alerts & Recommendations
        $insights = $this->generateInsights($fiscalYear, $kpis, $completion);

        return [
            'kpis' => $kpis,
            'completion' => $completion,
            'people' => $people,
            'timeline' => $timeline,
            'performance' => $performance,
            'visual_data' => $visualData,
            'insights' => $insights,
            'metadata' => [
                'generated_at' => now()->toISOString(),
                'fiscal_year' => $fiscalYear,
                'has_search_filter' => !empty($search),
            ],
        ];
    }

    /**
     * 📊 Calculate Key Performance Indicators
     */
    private function calculateKPIs($fiscalYear, $search = '')
    {
        $baseQuery = EvaluationAssignment::where('fiscal_year', $fiscalYear);
        if (!empty($search)) {
            $baseQuery->whereHas('evaluatee', function ($query) use ($search) {
                $query->where('fname', 'like', "%{$search}%")
                    ->orWhere('lname', 'like', "%{$search}%");
            });
        }

        $totalEvaluatees = (clone $baseQuery)->distinct('evaluatee_id')->count('evaluatee_id');
        $totalRelationships = (clone $baseQuery)->count();
        $totalEvaluators = (clone $baseQuery)->distinct('evaluator_id')->count('evaluator_id');
        $uniqueAngles = (clone $baseQuery)->distinct('angle')->count('angle');
        $avgRequiredAngles = (clone $baseQuery)
            ->join('users', 'evaluation_assignments.evaluatee_id', '=', 'users.id')
            ->selectRaw('AVG(CASE WHEN users.grade BETWEEN 5 AND 8 THEN 2 ELSE 4 END) as avg_required_angles')
            ->value('avg_required_angles');

        // Previous year comparison
        $previousYear = $fiscalYear - 1;
        $prevBase = EvaluationAssignment::where('fiscal_year', $previousYear);
        $prevEvaluatees = (clone $prevBase)->distinct('evaluatee_id')->count('evaluatee_id');
        $prevRelationships = (clone $prevBase)->count();
        $prevEvaluators = (clone $prevBase)->distinct('evaluator_id')->count('evaluator_id');

        return [
            'total_evaluatees' => $totalEvaluatees,
            'total_relationships' => $totalRelationships,
            'total_evaluators' => $totalEvaluators,
            'unique_angles' => $uniqueAngles,
            'growth_rates' => [
                'evaluatees' => $this->calculateGrowthRate($totalEvaluatees, $prevEvaluatees),
                'relationships' => $this->calculateGrowthRate($totalRelationships, $prevRelationships),
                'evaluators' => $this->calculateGrowthRate($totalEvaluators, $prevEvaluators),
            ],
            'efficiency_metrics' => [
                'avg_evaluators_per_evaluatee' => $totalEvaluatees > 0 ? round($totalRelationships / $totalEvaluatees, 2) : 0,
                'avg_evaluations_per_evaluator' => $totalEvaluators > 0 ? round($totalRelationships / $totalEvaluators, 2) : 0,
                'system_utilization' => $avgRequiredAngles > 0 ? round(($totalRelationships / ($totalEvaluatees * $avgRequiredAngles)) * 100, 2) : 0,
            ],
        ];
    }

    /**
     * 🎯 Analyze Completion Status
     */
    private function analyzeCompletion($fiscalYear, $search = '')
    {
        $searchFilter = !empty($search) ? " AND (u.fname LIKE '%{$search}%' OR u.lname LIKE '%{$search}%')" : "";

        $completionData = DB::select("
            WITH EvaluateeStats AS (
                SELECT
                    ea.evaluatee_id,
                    u.fname,
                    u.lname,
                    u.grade,
                    COUNT(DISTINCT ea.angle) as assigned_angles,
                    COUNT(ea.id) as total_assignments,
                    CASE WHEN u.grade >= 9 THEN 4 ELSE 2 END as required_angles,
                    CASE
                        WHEN u.grade >= 9 AND COUNT(DISTINCT ea.angle) >= 4 THEN 'complete'
                        WHEN u.grade < 9 AND COUNT(DISTINCT ea.angle) >= 2 THEN 'complete'
                        ELSE 'incomplete'
                    END as status,
                    CASE
                        WHEN u.grade BETWEEN 5 AND 8 THEN 'C5-C8'
                        WHEN u.grade BETWEEN 9 AND 12 THEN 'C9-C12'
                        ELSE 'Other'
                    END as grade_group
                FROM evaluation_assignments ea
                JOIN users u ON ea.evaluatee_id = u.id
                WHERE ea.fiscal_year = ? {$searchFilter}
                GROUP BY ea.evaluatee_id, u.fname, u.lname, u.grade
            )
            SELECT
                status,
                grade_group,
                COUNT(*) as count,
                AVG(assigned_angles * 100.0 / required_angles) as avg_completion_rate,
                MIN(assigned_angles * 100.0 / required_angles) as min_completion_rate,
                MAX(assigned_angles * 100.0 / required_angles) as max_completion_rate
            FROM EvaluateeStats
            GROUP BY status, grade_group
            ORDER BY grade_group, status
        ", [$fiscalYear]);

        // Summary stats
        $summary = DB::select("
            WITH EvaluateeStats AS (
                SELECT
                    ea.evaluatee_id,
                    u.grade,
                    COUNT(DISTINCT ea.angle) as assigned_angles,
                    CASE WHEN u.grade >= 9 THEN 4 ELSE 2 END as required_angles
                FROM evaluation_assignments ea
                JOIN users u ON ea.evaluatee_id = u.id
                WHERE ea.fiscal_year = ? {$searchFilter}
                GROUP BY ea.evaluatee_id, u.grade
            )
            SELECT
                COUNT(*) as total_evaluatees,
                COUNT(CASE WHEN assigned_angles >= required_angles THEN 1 END) as complete_count,
                COUNT(CASE WHEN assigned_angles < required_angles THEN 1 END) as incomplete_count,
                AVG(assigned_angles * 100.0 / required_angles) as overall_completion_rate
            FROM EvaluateeStats
        ", [$fiscalYear])[0];

        return [
            'summary' => [
                'total_evaluatees' => $summary->total_evaluatees,
                'complete_count' => $summary->complete_count,
                'incomplete_count' => $summary->incomplete_count,
                'completion_rate' => round($summary->overall_completion_rate, 2),
            ],
            'by_grade_and_status' => collect($completionData)->groupBy('grade_group'),
            'completion_distribution' => [
                'excellent' => collect($completionData)->where('avg_completion_rate', '>=', 100)->sum('count'),
                'good' => collect($completionData)->whereBetween('avg_completion_rate', [75, 99])->sum('count'),
                'fair' => collect($completionData)->whereBetween('avg_completion_rate', [50, 74])->sum('count'),
                'poor' => collect($completionData)->where('avg_completion_rate', '<', 50)->sum('count'),
            ],
        ];
    }

    /**
     * 👥 Analyze People & Roles
     */
    private function analyzePeople($fiscalYear, $search = '')
    {
        $searchFilter = !empty($search) ? " AND (u.fname LIKE '%{$search}%' OR u.lname LIKE '%{$search}%')" : "";

        // Top Evaluators Analysis
        $topEvaluators = DB::select("
            SELECT
                u.id,
                u.fname,
                u.lname,
                u.grade,
                COUNT(ea.id) as evaluation_count,
                COUNT(DISTINCT ea.evaluatee_id) as unique_evaluatees,
                COUNT(DISTINCT ea.angle) as angle_variety,
                ROUND(COUNT(ea.id) * 1.0 / COUNT(DISTINCT ea.evaluatee_id), 2) as avg_evaluations_per_person,
                RANK() OVER (ORDER BY COUNT(ea.id) DESC) as rank_by_count
            FROM evaluation_assignments ea
            JOIN users u ON ea.evaluator_id = u.id
            WHERE ea.fiscal_year = ?
            GROUP BY u.id, u.fname, u.lname, u.grade
            ORDER BY evaluation_count DESC
            LIMIT 15
        ", [$fiscalYear]);

        // Most Evaluated People
        $mostEvaluated = DB::select("
            SELECT
                u.id,
                u.fname,
                u.lname,
                u.grade,
                COUNT(ea.id) as times_evaluated,
                COUNT(DISTINCT ea.evaluator_id) as unique_evaluators,
                COUNT(DISTINCT ea.angle) as angles_covered,
                CASE WHEN u.grade >= 9 THEN 4 ELSE 2 END as required_angles,
                ROUND(COUNT(DISTINCT ea.angle) * 100.0 / CASE WHEN u.grade >= 9 THEN 4 ELSE 2 END, 2) as completion_percentage
            FROM evaluation_assignments ea
            JOIN users u ON ea.evaluatee_id = u.id
            WHERE ea.fiscal_year = ? {$searchFilter}
            GROUP BY u.id, u.fname, u.lname, u.grade
            ORDER BY times_evaluated DESC
            LIMIT 15
        ", [$fiscalYear]);

        // Grade Distribution
        $gradeDistribution = DB::select("
            SELECT
                CASE
                    WHEN u.grade BETWEEN 5 AND 8 THEN 'C5-C8'
                    WHEN u.grade BETWEEN 9 AND 12 THEN 'C9-C12'
                    ELSE 'Other'
                END as grade_group,
                COUNT(DISTINCT ea.evaluator_id) as evaluator_count,
                COUNT(DISTINCT ea.evaluatee_id) as evaluatee_count,
                COUNT(ea.id) as total_relationships,
                ROUND(AVG(u.grade), 1) as avg_grade
            FROM evaluation_assignments ea
            JOIN users u ON ea.evaluator_id = u.id
            WHERE ea.fiscal_year = ?
            GROUP BY grade_group
            ORDER BY avg_grade
        ", [$fiscalYear]);

        return [
            'top_evaluators' => $topEvaluators,
            'most_evaluated' => $mostEvaluated,
            'grade_distribution' => $gradeDistribution,
            'insights' => [
                'most_active_evaluator' => $topEvaluators[0] ?? null,
                'most_evaluated_person' => $mostEvaluated[0] ?? null,
                'total_people_involved' => DB::table('evaluation_assignments')
                    ->where('fiscal_year', $fiscalYear)
                    ->selectRaw('COUNT(DISTINCT evaluator_id) + COUNT(DISTINCT evaluatee_id) as total')
                    ->first()->total ?? 0,
            ],
        ];
    }

    /**
     * 📅 Timeline Analytics
     */
    private function analyzeTimeline($fiscalYear)
    {
        // Daily activity for last 30 days
        $dailyActivity = DB::select("
            SELECT
                DATE(created_at) as date,
                COUNT(*) as daily_count,
                COUNT(DISTINCT evaluator_id) as unique_evaluators,
                COUNT(DISTINCT evaluatee_id) as unique_evaluatees
            FROM evaluation_assignments
            WHERE fiscal_year = ?
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ", [$fiscalYear]);

        // Monthly trends
        $monthlyTrends = DB::select("
            SELECT
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                COUNT(*) as monthly_count,
                COUNT(DISTINCT evaluator_id) as unique_evaluators,
                COUNT(DISTINCT evaluatee_id) as unique_evaluatees
            FROM evaluation_assignments
            WHERE fiscal_year = ?
            GROUP BY YEAR(created_at), MONTH(created_at)
            ORDER BY year, month
        ", [$fiscalYear]);

        return [
            'daily_activity' => $dailyActivity,
            'monthly_trends' => $monthlyTrends,
            'insights' => [
                'most_active_day' => collect($dailyActivity)->sortByDesc('daily_count')->first(),
                'total_active_days' => count($dailyActivity),
                'avg_daily_activity' => count($dailyActivity) > 0 ? round(collect($dailyActivity)->avg('daily_count'), 2) : 0,
            ],
        ];
    }

    /**
     * 🔥 Performance Analytics
     */
    private function analyzePerformance($fiscalYear)
    {
        // Angle performance
        $anglePerformance = DB::select("
            SELECT
                angle,
                COUNT(*) as total_assignments,
                COUNT(DISTINCT evaluator_id) as unique_evaluators,
                COUNT(DISTINCT evaluatee_id) as unique_evaluatees,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM evaluation_assignments WHERE fiscal_year = ?), 2) as percentage_share
            FROM evaluation_assignments
            WHERE fiscal_year = ?
            GROUP BY angle
            ORDER BY total_assignments DESC
        ", [$fiscalYear, $fiscalYear]);

        // System efficiency metrics
        $efficiency = DB::select("
            WITH EfficiencyMetrics AS (
                SELECT
                    evaluatee_id,
                    COUNT(DISTINCT evaluator_id) as evaluator_count,
                    COUNT(DISTINCT angle) as angle_count,
                    (SELECT grade FROM users WHERE id = evaluatee_id) as grade
                FROM evaluation_assignments
                WHERE fiscal_year = ?
                GROUP BY evaluatee_id
            )
            SELECT
                AVG(evaluator_count) as avg_evaluators_per_evaluatee,
                AVG(angle_count) as avg_angles_per_evaluatee,
                COUNT(CASE WHEN angle_count = CASE WHEN grade >= 9 THEN 4 ELSE 2 END THEN 1 END) as optimal_assignments,
                COUNT(*) as total_assignments,
                ROUND(COUNT(CASE WHEN angle_count = CASE WHEN grade >= 9 THEN 4 ELSE 2 END THEN 1 END) * 100.0 / COUNT(*), 2) as optimization_rate
            FROM EfficiencyMetrics
        ", [$fiscalYear])[0];

        return [
            'angle_performance' => $anglePerformance,
            'efficiency_metrics' => $efficiency,
            'system_health' => [
                'optimization_rate' => $efficiency->optimization_rate,
                'avg_evaluators_per_evaluatee' => round($efficiency->avg_evaluators_per_evaluatee, 2),
                'avg_angles_per_evaluatee' => round($efficiency->avg_angles_per_evaluatee, 2),
                'health_score' => min(100, round(($efficiency->optimization_rate +
                    ($efficiency->avg_angles_per_evaluatee * 25) +
                    min($efficiency->avg_evaluators_per_evaluatee * 20, 40)) / 3, 2)),
            ],
        ];
    }

    /**
     * 🎨 Prepare Visual Data for Charts
     */
    private function prepareVisualData($fiscalYear, $search = '')
    {
        $searchFilter = !empty($search) ? " AND (u.fname LIKE '%{$search}%' OR u.lname LIKE '%{$search}%')" : "";

        // Angle distribution for pie chart
        $angleDistribution = DB::select("
            SELECT
                angle,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM evaluation_assignments WHERE fiscal_year = ?), 2) as percentage
            FROM evaluation_assignments ea
            JOIN users u ON ea.evaluatee_id = u.id
            WHERE ea.fiscal_year = ? {$searchFilter}
            GROUP BY angle
            ORDER BY count DESC
        ", [$fiscalYear, $fiscalYear]);

        // Grade completion heatmap
        $completionHeatmap = DB::select("
            SELECT
                u.grade,
                ea.angle,
                COUNT(*) as assignment_count,
                COUNT(DISTINCT ea.evaluatee_id) as unique_evaluatees
            FROM evaluation_assignments ea
            JOIN users u ON ea.evaluatee_id = u.id
            WHERE ea.fiscal_year = ? {$searchFilter}
            GROUP BY u.grade, ea.angle
            ORDER BY u.grade, ea.angle
        ", [$fiscalYear]);

        return [
            'angle_distribution' => collect($angleDistribution)->mapWithKeys(function ($item) {
                return [$this->translateAngleToThai($item->angle) => [
                    'count' => $item->count,
                    'percentage' => $item->percentage,
                ]];
            }),
            'completion_heatmap' => collect($completionHeatmap)->groupBy('grade'),
            'chart_colors' => [
                'primary' => '#3B82F6',
                'success' => '#10B981',
                'warning' => '#F59E0B',
                'danger' => '#EF4444',
                'info' => '#8B5CF6',
                'secondary' => '#6B7280',
            ],
        ];
    }

    /**
     * 🚨 Generate Insights & Recommendations
     */
    private function generateInsights($fiscalYear, $kpis, $completion)
    {
        $insights = [];
        $recommendations = [];
        $alerts = [];

        // Performance insights
        if ($kpis['efficiency_metrics']['system_utilization'] > 90) {
            $insights[] = [
                'type' => 'success',
                'title' => 'ประสิทธิภาพระบบยอดเยี่ยม',
                'message' => 'ระบบมีการใช้งานที่เหมาะสมและมีประสิทธิภาพสูง',
                'icon' => '🎯',
            ];
        } elseif ($kpis['efficiency_metrics']['system_utilization'] < 50) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'ประสิทธิภาพระบบต่ำ',
                'message' => 'ระบบมีการใช้งานต่ำกว่าเกณฑ์ที่กำหนด',
                'icon' => '⚠️',
            ];
            $recommendations[] = 'พิจารณาเพิ่มการมอบหมายผู้ประเมินให้ครบถ้วนมากขึ้น';
        }

        // Completion insights
        if ($completion['summary']['completion_rate'] > 85) {
            $insights[] = [
                'type' => 'success',
                'title' => 'ความครบถ้วนสูง',
                'message' => "มีผู้ถูกประเมิน {$completion['summary']['completion_rate']}% ที่ได้รับการประเมินครบถ้วน",
                'icon' => '✅',
            ];
        } elseif ($completion['summary']['completion_rate'] < 60) {
            $alerts[] = [
                'type' => 'danger',
                'title' => 'ความครบถ้วนต่ำ',
                'message' => "มีผู้ถูกประเมินเพียง {$completion['summary']['completion_rate']}% ที่ได้รับการประเมินครบถ้วน",
                'icon' => '🚨',
            ];
            $recommendations[] = 'จำเป็นต้องเพิ่มผู้ประเมินให้ครบตามองศาที่กำหนด';
        }

        // Growth insights
        foreach ($kpis['growth_rates'] as $metric => $rate) {
            if ($rate > 20) {
                $insights[] = [
                    'type' => 'info',
                    'title' => 'การเติบโตสูง',
                    'message' => ucfirst($metric) . " เติบโตขึ้น {$rate}% เมื่อเทียบกับปีที่แล้ว",
                    'icon' => '📈',
                ];
            } elseif ($rate < -10) {
                $alerts[] = [
                    'type' => 'warning',
                    'title' => 'การลดลง',
                    'message' => ucfirst($metric) . " ลดลง " . abs($rate) . "% เมื่อเทียบกับปีที่แล้ว",
                    'icon' => '📉',
                ];
            }
        }

        return [
            'insights' => $insights,
            'alerts' => $alerts,
            'recommendations' => $recommendations,
            'summary' => [
                'total_insights' => count($insights),
                'total_alerts' => count($alerts),
                'total_recommendations' => count($recommendations),
                'overall_health' => $this->calculateOverallHealth($kpis, $completion),
            ],
        ];
    }

    /**
     * Calculate overall system health score
     */
    private function calculateOverallHealth($kpis, $completion)
    {
        $scores = [
            'completion' => min(100, $completion['summary']['completion_rate']),
            'utilization' => min(100, $kpis['efficiency_metrics']['system_utilization']),
            'growth' => max(0, min(100, 50 + ($kpis['growth_rates']['relationships'] / 2))),
        ];

        $overallScore = round(array_sum($scores) / count($scores), 1);

        return [
            'score' => $overallScore,
            'rating' => $overallScore >= 85 ? 'excellent' :
                ($overallScore >= 70 ? 'good' :
                    ($overallScore >= 55 ? 'fair' : 'poor')),
            'breakdown' => $scores,
        ];
    }

    /**
     * Helper: Calculate growth rate
     */
    private function calculateGrowthRate($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }

    /**
     * Helper: Translate angle to Thai
     */
    private function translateAngleToThai($angle)
    {
        $translations = ['top' => 'บน', 'bottom' => 'ล่าง', 'left' => 'ซ้าย', 'right' => 'ขวา'];
        return $translations[$angle] ?? $angle;
    }

    public function create()
    {
        // ดึงข้อมูล users ตามโครงสร้างฐานข้อมูลจริง
        $users = User::select([
            'id', 'emid', 'prename', 'fname', 'lname', 'grade', 'user_type',
            'position_id', 'division_id', 'department_id', 'sex', // เพิ่มฟิลด์ที่จำเป็น
        ])
            ->orderBy('fname')
            ->get()
            ->map(function ($user) {
                // แปลง user_type เป็น string ถ้าเป็น Enum
                $userType = $user->user_type instanceof \BackedEnum
                    ? $user->user_type->value
                    : $user->user_type;

                $positionTitle = $user->position ?
                    trim($user->position->title) : // ใช้ trim เพื่อลบ \r\n
                    'ไม่ระบุตำแหน่ง';

                $departmentName = $user->department ?
                    trim($user->department->name) : // ใช้ trim เพื่อลบ \r\n
                    'ไม่ระบุหน่วยงาน';

                $divisionName = $user->division ?
                    trim($user->division->name) :
                    'ไม่ระบุสายงาน';
                
                return [
                    'id' => $user->id,
                    'emid' => $user->emid,
                    'prename' => $user->prename,
                    'fname' => $user->fname,
                    'lname' => $user->lname,
                    'grade' => (int) $user->grade,
                    'user_type' => $userType,
                    'sex' => $user->sex,

                    // ส่งในโครงสร้างที่ frontend ต้องการ
                    'position' => [
                        'title' => $positionTitle,
                    ],
                    'division' => [
                        'name' => $divisionName,
                    ],
                    'department' => [
                        'name' => $departmentName,
                    ],
                    'division_id' => $user->division_id,
                    'department_id' => $user->department_id,
                    'position_id' => $user->position_id,
                    'position_title' => $positionTitle,
                    'department_name' => $departmentName,
                    'division_name' => $divisionName,
                ];
            });

        return Inertia::render('AdminEvaluationAssignmentForm', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        // Validation rules
        $validated = $request->validate([
            'evaluator_id' => 'required|exists:users,id',
            'evaluatee_id' => 'required|exists:users,id|different:evaluator_id',
            'angle' => ['required', Rule::in(['top', 'bottom', 'left', 'right'])],
        ], [
            'evaluator_id.required' => 'กรุณาเลือกผู้ประเมิน',
            'evaluator_id.exists' => 'ผู้ประเมินที่เลือกไม่มีในระบบ',
            'evaluatee_id.required' => 'กรุณาเลือกผู้ถูกประเมิน',
            'evaluatee_id.exists' => 'ผู้ถูกประเมินที่เลือกไม่มีในระบบ',
            'evaluatee_id.different' => 'ผู้ประเมินและผู้ถูกประเมินต้องเป็นคนละคน',
            'angle.required' => 'กรุณาเลือกองศาการประเมิน',
            'angle.in' => 'องศาการประเมินไม่ถูกต้อง',
        ]);

        try {
            DB::beginTransaction();

            // ดึงข้อมูลผู้ถูกประเมิน
            $evaluatee = User::findOrFail($validated['evaluatee_id']);
            $evaluator = User::findOrFail($validated['evaluator_id']);

            // ตรวจสอบเกรดและประเภทผู้ใช้
            $grade = (int) $evaluatee->grade;
            $userType = $evaluatee->user_type instanceof \BackedEnum
                ? $evaluatee->user_type->value
                : $evaluatee->user_type;

            // ตรวจสอบว่าองศาที่เลือกเหมาะสมกับเกรดหรือไม่
            if ($grade < 9 && in_array($validated['angle'], ['bottom', 'right'])) {
                return redirect()->back()->withErrors([
                    'angle' => 'ผู้ถูกประเมินเกรด C5-C8 สามารถประเมินได้เฉพาะองศาบนและซ้ายเท่านั้น',
                ]);
            }

            // ค้นหา evaluation ที่เหมาะสม
            $evaluation = Evaluation::where('user_type', $userType)
                ->where('grade_min', '<=', $grade)
                ->where('grade_max', '>=', $grade)
                ->where('status', 'published')
                ->latest()
                ->first();

            if (!$evaluation) {
                Log::error('ไม่พบ evaluation ที่ตรงกับเงื่อนไข', [
                    'user_type' => $userType,
                    'grade' => $grade,
                    'evaluatee_id' => $validated['evaluatee_id'],
                ]);

                return redirect()->back()->withErrors([
                    'evaluatee_id' => 'ไม่พบแบบประเมินที่ตรงกับประเภทและระดับของผู้ถูกประเมิน',
                ]);
            }

            // คำนวณปีงบประมาณ
            $fiscalYear = Carbon::now()->month >= 10
                ? Carbon::now()->addYear()->year
                : Carbon::now()->year;

            // ตรวจสอบการซ้ำ (เดิมไม่มี angle ในการเช็ค แต่ตอนนี้ต้องเช็คด้วย)
            $exists = EvaluationAssignment::where('evaluator_id', $validated['evaluator_id'])
                ->where('evaluatee_id', $validated['evaluatee_id'])
                ->where('angle', $validated['angle'])
                ->where('fiscal_year', $fiscalYear)
                ->exists();

            if ($exists) {
                return redirect()->back()->withErrors([
                    'evaluator_id' => 'ผู้ประเมินนี้ได้ถูกกำหนดให้ประเมินบุคคลนี้ในองศานี้แล้วในปีงบประมาณนี้',
                ]);
            }

            // สร้างความสัมพันธ์ใหม่
            EvaluationAssignment::create([
                'evaluator_id' => $validated['evaluator_id'],
                'evaluatee_id' => $validated['evaluatee_id'],
                'evaluation_id' => $evaluation->id,
                'fiscal_year' => $fiscalYear,
                'angle' => $validated['angle'],
            ]);

            DB::commit();

            Log::info('สร้างความสัมพันธ์การประเมินสำเร็จ', [
                'evaluator' => $evaluator->fname . ' ' . $evaluator->lname,
                'evaluatee' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'angle' => $validated['angle'],
                'fiscal_year' => $fiscalYear,
            ]);

            return redirect()->route('assignments.index')
                ->with('success', '✅ เพิ่มความสัมพันธ์ผู้ประเมินสำเร็จ');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('เกิดข้อผิดพลาดในการสร้างความสัมพันธ์การประเมิน', [
                'error' => $e->getMessage(),
                'request_data' => $validated,
            ]);

            return redirect()->back()
                ->withErrors(['error' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง'])
                ->withInput();
        }
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        try {
            $evaluatorName = $assignment->evaluator->fname . ' ' . $assignment->evaluator->lname;
            $evaluateeName = $assignment->evaluatee->fname . ' ' . $assignment->evaluatee->lname;
            $angle = $assignment->angle;

            $assignment->delete();

            Log::info('ลบความสัมพันธ์การประเมินสำเร็จ', [
                'evaluator' => $evaluatorName,
                'evaluatee' => $evaluateeName,
                'angle' => $angle,
            ]);

            return redirect()->back()->with('success', '✅ ลบความสัมพันธ์เรียบร้อยแล้ว');

        } catch (\Exception $e) {
            Log::error('เกิดข้อผิดพลาดในการลบความสัมพันธ์การประเมิน', [
                'assignment_id' => $assignment->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'ไม่สามารถลบความสัมพันธ์ได้ กรุณาลองใหม่อีกครั้ง',
            ]);
        }
    }

    /**
     * ดึงสถิติสำหรับแดชบอร์ด
     */
    private function getStatistics($fiscalYear)
    {
        // นับจำนวนผู้ถูกประเมินที่ไม่ซ้ำ
        $totalEvaluatees = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->select('evaluatee_id')
            ->distinct()
            ->count('evaluatee_id');

        // นับจำนวนความสัมพันธ์ทั้งหมด (รวมซ้ำ)
        $totalRelationships = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->count();

        // นับจำนวนผู้ประเมินที่ไม่ซ้ำ
        $totalEvaluators = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->distinct('evaluator_id')
            ->count();

        // **นับจำนวนผู้ประเมินซ้ำ (รวมทุก record)**
        $totalEvaluatorRecords = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->count('evaluator_id');

        // วิเคราะห์ความครบถ้วนของการประเมิน
        $evaluateeCompleteness = DB::select("
            SELECT
                evaluatee_id,
                COUNT(DISTINCT angle) as assigned_angles,
                (SELECT grade FROM users WHERE id = evaluatee_id) as grade
            FROM evaluation_assignments
            WHERE fiscal_year = ?
            GROUP BY evaluatee_id
        ", [$fiscalYear]);

        $completeEvaluatees = 0;
        $incompleteEvaluatees = 0;

        foreach ($evaluateeCompleteness as $evaluatee) {
            $requiredAngles = (int) $evaluatee->grade >= 9 ? 4 : 2;
            if ($evaluatee->assigned_angles >= $requiredAngles) {
                $completeEvaluatees++;
            } else {
                $incompleteEvaluatees++;
            }
        }

        return [
            'total_evaluatees' => $totalEvaluatees,
            'total_relationships' => $totalRelationships,
            'total_evaluators' => $totalEvaluators,       // ผู้ประเมิน "ไม่ซ้ำ"
            'total_evaluator_records' => $totalEvaluatorRecords, // จำนวน record ผู้ประเมินทั้งหมด (รวมซ้ำ)
            'complete_evaluatees' => $completeEvaluatees,
            'incomplete_evaluatees' => $incompleteEvaluatees,
            'completion_rate' => $totalEvaluatees > 0
                ? round(($completeEvaluatees / $totalEvaluatees) * 100, 2)
                : 0,
        ];
    }

    /**
     * API สำหรับดึงข้อมูลผู้ประเมินที่เหมาะสมตามองศา
     */
    public function getEvaluatorsByAngle(Request $request)
    {
        $evaluateeId = $request->get('evaluatee_id');
        $angle = $request->get('angle');

        if (!$evaluateeId || !$angle) {
            return response()->json(['data' => []]);
        }

        $evaluatee = User::find($evaluateeId);
        if (!$evaluatee) {
            return response()->json(['data' => []]);
        }

        // กรองผู้ประเมินตามองศาและเกรด (logic เดียวกับที่ใช้ใน frontend)
        $grade = (int) $evaluatee->grade;
        $divisionId = null; // placeholder เนื่องจากไม่มี division_id ใน migration
        $departmentId = null; // placeholder

        $query = User::where('id', '!=', $evaluateeId); // ไม่เลือกตัวเอง

        // ใส่ logic การกรองตามองศาที่ซับซ้อน (ตามที่กำหนดใน frontend)
        // แต่เนื่องจากไม่มี division_id และ department_id ใน migration
        // จะใช้แค่การกรองพื้นฐาน

        if ($angle === 'ขวา') {
            $query->where('user_type', 'external');
        } else {
            $query->where('user_type', 'internal');
        }

        $evaluators = $query->select(['id', 'fname', 'lname', 'grade', 'position', 'organize'])
            ->orderBy('fname')
            ->get();

        return response()->json(['data' => $evaluators]);
    }

    /**
     * ส่งออกรายงาน
     */
    public function export(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', Carbon::now()->year);

        $assignments = EvaluationAssignment::with(['evaluator', 'evaluatee'])
            ->where('fiscal_year', $fiscalYear)
            ->orderBy('evaluatee_id')
            ->orderBy('angle')
            ->get();

        // สามารถเพิ่ม logic การส่งออก Excel/PDF ตรงนี้

        return response()->json([
            'message' => 'ฟีเจอร์การส่งออกกำลังพัฒนา',
            'data_count' => $assignments->count(),
        ]);
    }

    /**
     * API สำหรับดึงข้อมูลสถิติรวม
     */
    public function getOverallStats(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', Carbon::now()->year);
        return response()->json($this->getStatistics($fiscalYear));
    }

    /**
     * API สำหรับดึงข้อมูล Analytics แบบ Real-time
     */
    public function getAnalytics(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', Carbon::now()->year);
        $search = $request->get('search', '');
        
        return response()->json($this->getUltimateAnalytics($fiscalYear, $search));
    }

    /**
     * Bulk Assignment - เพิ่มผู้ประเมินหลายคนพร้อมกัน
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'evaluatee_id' => 'required|exists:users,id',
            'assignments' => 'required|array|min:1',
            'assignments.*.evaluator_id' => 'required|exists:users,id|different:evaluatee_id',
            'assignments.*.angle' => ['required', Rule::in(['top', 'bottom', 'left', 'right'])],
        ]);

        try {
            DB::beginTransaction();

            $evaluatee = User::findOrFail($validated['evaluatee_id']);
            $grade = (int) $evaluatee->grade;
            $userType = $evaluatee->user_type instanceof \BackedEnum
                ? $evaluatee->user_type->value
                : $evaluatee->user_type;

            // ค้นหา evaluation ที่เหมาะสม
            $evaluation = Evaluation::where('user_type', $userType)
                ->where('grade_min', '<=', $grade)
                ->where('grade_max', '>=', $grade)
                ->where('status', 'published')
                ->latest()
                ->first();

            if (!$evaluation) {
                return response()->json([
                    'error' => 'ไม่พบแบบประเมินที่ตรงกับประเภทและระดับของผู้ถูกประเมิน'
                ], 422);
            }

            $fiscalYear = Carbon::now()->month >= 10
                ? Carbon::now()->addYear()->year
                : Carbon::now()->year;

            $createdCount = 0;
            $errors = [];

            foreach ($validated['assignments'] as $index => $assignment) {
                // ตรวจสอบการซ้ำ
                $exists = EvaluationAssignment::where('evaluator_id', $assignment['evaluator_id'])
                    ->where('evaluatee_id', $validated['evaluatee_id'])
                    ->where('angle', $assignment['angle'])
                    ->where('fiscal_year', $fiscalYear)
                    ->exists();

                if ($exists) {
                    $evaluator = User::find($assignment['evaluator_id']);
                    $errors[] = "ผู้ประเมิน {$evaluator->fname} {$evaluator->lname} ได้ถูกกำหนดให้ประเมินในองศา{$this->translateAngleToThai($assignment['angle'])}แล้ว";
                    continue;
                }

                // ตรวจสอบเกรดและองศา
                if ($grade < 9 && in_array($assignment['angle'], ['bottom', 'right'])) {
                    $errors[] = "ไม่สามารถกำหนดองศา{$this->translateAngleToThai($assignment['angle'])}สำหรับผู้ถูกประเมินเกรด C5-C8";
                    continue;
                }

                EvaluationAssignment::create([
                    'evaluator_id' => $assignment['evaluator_id'],
                    'evaluatee_id' => $validated['evaluatee_id'],
                    'evaluation_id' => $evaluation->id,
                    'fiscal_year' => $fiscalYear,
                    'angle' => $assignment['angle'],
                ]);

                $createdCount++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "เพิ่มความสัมพันธ์สำเร็จ {$createdCount} รายการ",
                'created_count' => $createdCount,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('เกิดข้อผิดพลาดในการเพิ่มความสัมพันธ์แบบกลุ่ม', [
                'error' => $e->getMessage(),
                'request_data' => $validated,
            ]);

            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
            ], 500);
        }
    }

    /**
     * Bulk Delete - ลบความสัมพันธ์หลายรายการพร้อมกัน
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|exists:evaluation_assignments,id',
        ]);

        try {
            $deletedCount = EvaluationAssignment::whereIn('id', $validated['ids'])->delete();
            
            Log::info('ลบความสัมพันธ์การประเมินแบบกลุ่มสำเร็จ', [
                'deleted_count' => $deletedCount,
                'ids' => $validated['ids']
            ]);

            return response()->json([
                'success' => true,
                'message' => "ลบความสัมพันธ์สำเร็จ {$deletedCount} รายการ",
                'deleted_count' => $deletedCount
            ]);

        } catch (\Exception $e) {
            Log::error('เกิดข้อผิดพลาดในการลบความสัมพันธ์แบบกลุ่ม', [
                'error' => $e->getMessage(),
                'ids' => $validated['ids']
            ]);

            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการลบข้อมูล'
            ], 500);
        }
    }
}
