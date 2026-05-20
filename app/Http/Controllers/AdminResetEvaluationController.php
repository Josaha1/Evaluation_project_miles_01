<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminResetEvaluationController extends Controller
{
    private const ROLES = ['evaluator', 'evaluatee', 'both'];

    public function index()
    {
        return Inertia::render('AdminResetEvaluations', [
            'recent_logs' => DB::table('evaluation_reset_logs as l')
                ->join('users as a', 'a.id', '=', 'l.admin_id')
                ->join('users as t', 't.id', '=', 'l.target_user_id')
                ->select(
                    'l.id', 'l.scope_role', 'l.fiscal_year',
                    'l.answers_deleted', 'l.assignments_reset', 'l.created_at',
                    DB::raw("CONCAT(a.prename, a.fname, ' ', a.lname) as admin_name"),
                    DB::raw("CONCAT(t.prename, t.fname, ' ', t.lname) as target_name"),
                    't.emid as target_emid'
                )
                ->orderByDesc('l.created_at')
                ->limit(30)
                ->get(),
        ]);
    }

    public function preview(Request $request)
    {
        $data = $request->validate([
            'emid'        => ['required', 'string'],
            'role'        => ['required', 'in:evaluator,evaluatee,both'],
            'fiscal_year' => ['required', 'integer', 'between:2020,2100'],
        ]);

        $user = User::where('emid', $data['emid'])->first();
        if (! $user) {
            return response()->json(['message' => 'ไม่พบผู้ใช้ emid นี้'], 404);
        }

        return response()->json([
            'user'   => [
                'id'    => $user->id,
                'emid'  => $user->emid,
                'name'  => trim("{$user->prename}{$user->fname} {$user->lname}"),
                'grade' => $user->grade,
            ],
            'counts' => $this->countAffected($user->id, $data['role'], (int) $data['fiscal_year']),
        ]);
    }

    public function execute(Request $request)
    {
        $data = $request->validate([
            'emid'         => ['required', 'string'],
            'role'         => ['required', 'in:evaluator,evaluatee,both'],
            'fiscal_year'  => ['required', 'integer', 'between:2020,2100'],
            'confirm_emid' => ['required', 'string'],
        ]);

        if ($data['confirm_emid'] !== $data['emid']) {
            return response()->json(['message' => 'confirm_emid ไม่ตรง — ป้องกัน click ผิด'], 422);
        }

        $user = User::where('emid', $data['emid'])->first();
        if (! $user) {
            return response()->json(['message' => 'ไม่พบผู้ใช้'], 404);
        }

        $fy   = (int) $data['fiscal_year'];
        $role = $data['role'];

        $result = DB::transaction(function () use ($user, $role, $fy, $request) {
            // snapshot ก่อนลบ — เก็บ JSON ไว้ใน audit log
            $answersSnapshot     = $this->collectAnswers($user->id, $role, $fy);
            $assignmentsSnapshot = $this->collectSubmittedAssignments($user->id, $role, $fy);

            $answersDeleted = $this->deleteAnswers($user->id, $role, $fy);
            $assignmentsReset = $this->resetSubmittedAt($user->id, $role, $fy);

            DB::table('evaluation_reset_logs')->insert([
                'admin_id'              => $request->user()->id,
                'target_user_id'        => $user->id,
                'scope_role'            => $role,
                'fiscal_year'           => $fy,
                'answers_snapshot'      => $answersSnapshot->toJson(),
                'assignments_snapshot'  => $assignmentsSnapshot->toJson(),
                'answers_deleted'       => $answersDeleted,
                'assignments_reset'     => $assignmentsReset,
                'created_at'            => now(),
                'updated_at'            => now(),
            ]);

            return compact('answersDeleted', 'assignmentsReset');
        });

        Log::info('reset_evaluations', [
            'admin_id' => $request->user()->id,
            'target_user_id' => $user->id, 'role' => $role, 'fy' => $fy,
            'answers_deleted' => $result['answersDeleted'],
            'assignments_reset' => $result['assignmentsReset'],
        ]);

        return response()->json([
            'success'           => true,
            'answers_deleted'   => $result['answersDeleted'],
            'assignments_reset' => $result['assignmentsReset'],
        ]);
    }

    private function countAffected(int $userId, string $role, int $fy): array
    {
        $answersQ     = Answer::query()->where('fiscal_year', $fy);
        $submittedQ   = EvaluationAssignment::query()
            ->where('fiscal_year', (string) $fy)
            ->whereNotNull('submitted_at');

        $this->applyRole($answersQ, $userId, $role, 'answers');
        $this->applyRole($submittedQ, $userId, $role, 'assignments');

        return [
            'answers'                 => $answersQ->count(),
            'submitted_assignments'   => $submittedQ->count(),
        ];
    }

    private function collectAnswers(int $userId, string $role, int $fy)
    {
        $q = Answer::query()->where('fiscal_year', $fy);
        $this->applyRole($q, $userId, $role, 'answers');
        return $q->get();
    }

    private function collectSubmittedAssignments(int $userId, string $role, int $fy)
    {
        $q = EvaluationAssignment::query()
            ->where('fiscal_year', (string) $fy)
            ->whereNotNull('submitted_at');
        $this->applyRole($q, $userId, $role, 'assignments');
        return $q->get();
    }

    private function deleteAnswers(int $userId, string $role, int $fy): int
    {
        $q = Answer::query()->where('fiscal_year', $fy);
        $this->applyRole($q, $userId, $role, 'answers');
        return $q->delete();
    }

    private function resetSubmittedAt(int $userId, string $role, int $fy): int
    {
        $q = EvaluationAssignment::query()
            ->where('fiscal_year', (string) $fy)
            ->whereNotNull('submitted_at');
        $this->applyRole($q, $userId, $role, 'assignments');
        return $q->update(['submitted_at' => null]);
    }

    /**
     * โซน role: answers ใช้ user_id (=evaluator) / evaluatee_id
     *           assignments ใช้ evaluator_id / evaluatee_id
     */
    private function applyRole($q, int $userId, string $role, string $context): void
    {
        $cols = $context === 'answers'
            ? ['evaluator' => 'user_id', 'evaluatee' => 'evaluatee_id']
            : ['evaluator' => 'evaluator_id', 'evaluatee' => 'evaluatee_id'];

        if ($role === 'evaluator') {
            $q->where($cols['evaluator'], $userId);
        } elseif ($role === 'evaluatee') {
            $q->where($cols['evaluatee'], $userId);
        } else { // both
            $q->where(function ($w) use ($userId, $cols) {
                $w->where($cols['evaluator'], $userId)->orWhere($cols['evaluatee'], $userId);
            });
        }
    }
}
