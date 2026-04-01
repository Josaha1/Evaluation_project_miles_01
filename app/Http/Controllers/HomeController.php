<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\EvaluationLookupService;

class HomeController extends Controller
{
    public function welcome()
    {
        return Inertia::render("Welcome");
    }
    public function dashboard()
    {
        return Inertia::render("Dashboard");
    }

    public function admindashboard(Request $request)
    {
        // Use Thai fiscal year: Oct-Sep (month >= 10 → next year)
        $defaultFiscalYear = EvaluationLookupService::currentFiscalYear();

        // Allow admin to select fiscal year via request param
        $fiscalYear = $request->input('fiscal_year', $defaultFiscalYear);

        // If no data in selected year and no explicit selection, fall back to latest year
        $hasData = EvaluationAssignment::where('fiscal_year', $fiscalYear)->exists()
            || DB::table('external_access_codes')->where('fiscal_year', $fiscalYear)->exists();

        if (!$hasData && !$request->has('fiscal_year')) {
            $latestAssignment = EvaluationAssignment::max('fiscal_year');
            $latestExternal = DB::table('external_access_codes')->max('fiscal_year');
            $latestYear = max($latestAssignment, $latestExternal);
            if ($latestYear) {
                $fiscalYear = $latestYear;
            }
        }

        // Single query for user counts by role
        $userCounts = DB::table('users')
            ->selectRaw("SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as total_users")
            ->selectRaw("SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins")
            ->first();
        $totalUsers = (int) $userCounts->total_users;
        $totalAdmins = (int) $userCounts->total_admins;

        // Single query for assignment stats + angle breakdown
        $assignmentStats = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('COUNT(DISTINCT evaluator_id) as unique_evaluators')
            ->selectRaw('COUNT(DISTINCT evaluatee_id) as unique_evaluatees')
            ->first();

        $totalAssignments = (int) $assignmentStats->total;
        $uniqueEvaluators = (int) $assignmentStats->unique_evaluators;
        $uniqueEvaluatees = (int) $assignmentStats->unique_evaluatees;

        // Include external evaluators/evaluatees in counts
        $externalCounts = DB::table('external_access_codes')
            ->where('fiscal_year', $fiscalYear)
            ->selectRaw('COUNT(*) as total_codes')
            ->selectRaw('COUNT(DISTINCT evaluatee_id) as unique_evaluatees')
            ->selectRaw('SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used_codes')
            ->first();

        $totalAssignments += (int) $externalCounts->total_codes;
        $uniqueEvaluators += (int) $externalCounts->total_codes; // each code = 1 external evaluator
        // Merge unique evaluatees (avoid double counting)
        $externalEvaluateeIds = DB::table('external_access_codes')
            ->where('fiscal_year', $fiscalYear)
            ->distinct()->pluck('evaluatee_id')->toArray();
        $internalEvaluateeIds = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->distinct()->pluck('evaluatee_id')->toArray();
        $allEvaluateeIds = array_unique(array_merge($internalEvaluateeIds, $externalEvaluateeIds));
        $uniqueEvaluatees = count($allEvaluateeIds);

        $angleBreakdown = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->select('angle', DB::raw('COUNT(*) as count'))
            ->groupBy('angle')
            ->pluck('count', 'angle')
            ->toArray();

        // Add external as "right" angle
        if ((int) $externalCounts->total_codes > 0) {
            $angleBreakdown['right'] = ($angleBreakdown['right'] ?? 0) + (int) $externalCounts->total_codes;
        }

        // Completion: internal evaluators
        $completedEvaluators = DB::table('evaluation_assignments as ea')
            ->where('ea.fiscal_year', $fiscalYear)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('answers as a')
                    ->whereColumn('a.evaluation_id', 'ea.evaluation_id')
                    ->whereColumn('a.user_id', 'ea.evaluator_id')
                    ->whereColumn('a.evaluatee_id', 'ea.evaluatee_id');
            })
            ->distinct('ea.evaluator_id')
            ->count('ea.evaluator_id');

        // Add completed external evaluators
        $completedEvaluators += (int) $externalCounts->used_codes;

        $completionRate = $uniqueEvaluators > 0
            ? round(($completedEvaluators / $uniqueEvaluators) * 100, 1)
            : 0;

        // Grade group breakdown — from all evaluatees (internal + external combined)
        $gradeBreakdown = DB::table('users')
            ->whereIn('id', $allEvaluateeIds)
            ->selectRaw("COUNT(DISTINCT CASE WHEN grade >= 13 THEN id END) as governor")
            ->selectRaw("COUNT(DISTINCT CASE WHEN grade BETWEEN 9 AND 12 THEN id END) as executive")
            ->selectRaw("COUNT(DISTINCT CASE WHEN grade BETWEEN 4 AND 8 THEN id END) as employee")
            ->first();

        $gradeStats = [
            ['label' => 'ผู้ว่าการ (ระดับ 13)', 'color' => 'rose', 'evaluatees' => (int) $gradeBreakdown->governor],
            ['label' => 'ผู้บริหาร (ระดับ 9-12)', 'color' => 'amber', 'evaluatees' => (int) $gradeBreakdown->executive],
            ['label' => 'พนักงาน (ระดับ 4-8)', 'color' => 'cyan', 'evaluatees' => (int) $gradeBreakdown->employee],
        ];

        $publishedEvaluations = Evaluation::where('status', 'published')->count();

        // External counts (reuse $externalCounts from above)
        $externalCodeCount = (int) $externalCounts->total_codes;
        $externalUsedCount = (int) $externalCounts->used_codes;
        $externalOrgCount = DB::table('external_organizations')->where('is_active', true)->count();

        // External org evaluation results — scores by organization (fiscal year filtered)
        $externalOrgResults = DB::table('answers as a')
            ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
            ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
            ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
            ->where('eac.fiscal_year', $fiscalYear)
            ->whereNotNull('a.external_access_code_id')
            ->groupBy('eo.id', 'eo.name', 'eo.org_code')
            ->select([
                'eo.id as org_id',
                'eo.name as org_name',
                DB::raw("COALESCE(eo.org_code, '-') as org_code"),
                DB::raw('COUNT(DISTINCT a.evaluatee_id) as evaluatee_count'),
                DB::raw('COUNT(DISTINCT eac.id) as evaluator_count'),
                DB::raw('COUNT(a.id) as total_answers'),
                DB::raw('ROUND(AVG(CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[0-9]+(\\\\.?[0-9]*)$" THEN CAST(a.value AS DECIMAL(5,2)) ELSE NULL END), 2) as avg_score'),
            ])
            ->orderByDesc('avg_score')
            ->get();

        // Available fiscal years from all sources (assignments + access codes)
        $assignmentYears = EvaluationAssignment::select('fiscal_year')
            ->distinct()->pluck('fiscal_year');
        $accessCodeYears = DB::table('external_access_codes')
            ->select('fiscal_year')->distinct()->pluck('fiscal_year');
        $currentFiscalYear = EvaluationLookupService::currentFiscalYear();
        $availableFiscalYears = $assignmentYears->merge($accessCodeYears)
            ->push($currentFiscalYear)
            ->unique()->sortDesc()->values();

        return Inertia::render("Admindashboard", [
            'stats' => [
                'totalUsers' => $totalUsers,
                'totalAdmins' => $totalAdmins,
                'totalAssignments' => $totalAssignments,
                'uniqueEvaluators' => $uniqueEvaluators,
                'uniqueEvaluatees' => $uniqueEvaluatees,
                'completedEvaluators' => $completedEvaluators,
                'completionRate' => $completionRate,
                'publishedEvaluations' => $publishedEvaluations,
                'gradeStats' => $gradeStats,
                'angleBreakdown' => $angleBreakdown,
                'externalCodeCount' => $externalCodeCount,
                'externalUsedCount' => $externalUsedCount,
                'externalOrgCount' => $externalOrgCount,
                'externalOrgResults' => $externalOrgResults,
                'fiscalYear' => $fiscalYear,
                'fiscalYearBE' => $fiscalYear + 543,
                'availableFiscalYears' => $availableFiscalYears,
            ],
        ]);
    }

    public function adminquestionmanager()
    {
        return Inertia::render("AdminQuestionManager");
    }

    public function adminaspectmanager()
    {
        return Inertia::render("AdminAspectManager");
    }
}
