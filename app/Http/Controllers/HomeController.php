<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

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

    public function admindashboard()
    {
        $fiscalYear = date('Y');

        // Total users by role
        $totalUsers = User::where('role', 'user')->count();
        $totalAdmins = User::where('role', 'admin')->count();

        // Assignments stats for current fiscal year
        $totalAssignments = EvaluationAssignment::where('fiscal_year', $fiscalYear)->count();
        $uniqueEvaluators = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->distinct('evaluator_id')->count('evaluator_id');
        $uniqueEvaluatees = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->distinct('evaluatee_id')->count('evaluatee_id');

        // Completion: evaluators who have submitted answers
        $completedEvaluators = DB::table('evaluation_assignments as ea')
            ->join('answers as a', function ($join) {
                $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                     ->on('ea.evaluator_id', '=', 'a.user_id')
                     ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
            })
            ->where('ea.fiscal_year', $fiscalYear)
            ->distinct('ea.evaluator_id')
            ->count('ea.evaluator_id');

        $completionRate = $uniqueEvaluators > 0
            ? round(($completedEvaluators / $uniqueEvaluators) * 100, 1)
            : 0;

        // Grade group breakdown
        $gradeGroups = [
            ['label' => 'ผู้ว่าการ (ระดับ 13)', 'grades' => [13], 'color' => 'rose'],
            ['label' => 'ผู้บริหาร (ระดับ 9-12)', 'grades' => [9, 10, 11, 12], 'color' => 'amber'],
            ['label' => 'พนักงาน (ระดับ 5-8)', 'grades' => [5, 6, 7, 8], 'color' => 'cyan'],
        ];

        $gradeStats = [];
        foreach ($gradeGroups as $group) {
            $evaluateeCount = DB::table('evaluation_assignments as ea')
                ->join('users as u', 'ea.evaluatee_id', '=', 'u.id')
                ->where('ea.fiscal_year', $fiscalYear)
                ->whereIn('u.grade', $group['grades'])
                ->distinct('ea.evaluatee_id')
                ->count('ea.evaluatee_id');

            $gradeStats[] = [
                'label' => $group['label'],
                'color' => $group['color'],
                'evaluatees' => $evaluateeCount,
            ];
        }

        // Published evaluations count
        $publishedEvaluations = Evaluation::where('status', 'published')->count();

        // Assignments by angle
        $angleBreakdown = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->select('angle', DB::raw('COUNT(*) as count'))
            ->groupBy('angle')
            ->pluck('count', 'angle')
            ->toArray();

        // External evaluator stats
        $externalCodeCount = DB::table('external_access_codes')->count();
        $externalUsedCount = DB::table('external_access_codes')->where('is_used', true)->count();
        $externalOrgCount = DB::table('external_organizations')->where('is_active', true)->count();

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
                'fiscalYear' => $fiscalYear,
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
