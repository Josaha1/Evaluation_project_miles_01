<?php

namespace App\Console\Commands;

use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Enforce business rule: อนุกรรมการ (subcommittee members) evaluate the Governor
 * (ผู้ว่าการ) ONLY, and ONLY in the "left" angle. All other assignments where the
 * evaluator is a subcommittee member are removed; the required left-angle assignment
 * is created if missing.
 */
class FixSubcommitteeAssignments extends Command
{
    protected $signature = 'assignments:fix-subcommittee
                            {--fiscal-year= : Fiscal year (defaults to current)}
                            {--dry-run : Print the planned changes without applying}';

    protected $description = 'Reset subcommittee assignments so each อนุกรรมการ evaluates only the governor in the left angle';

    public function handle(): int
    {
        $fy = (int) ($this->option('fiscal-year') ?? now()->year);
        $dryRun = (bool) $this->option('dry-run');

        // Resolve subcommittee user IDs by position title — pattern intentionally
        // tolerant of typos like "อนุกรรรมการ" (extra ร) seen on prod position 366.
        $subPositionIds = DB::table('positions')
            ->where(function ($q) {
                $q->where('title', 'like', '%อนุกรรมการ%')
                  ->orWhere('title', 'like', 'อนุก%การ%');
            })
            ->pluck('id')
            ->all();
        if (empty($subPositionIds)) {
            $this->warn('No อนุกรรมการ positions found.');
            return self::SUCCESS;
        }

        $subUsers = User::whereIn('position_id', $subPositionIds)
            ->select('id', 'fname', 'lname')->get();
        if ($subUsers->isEmpty()) {
            $this->warn('No users with อนุกรรมการ positions.');
            return self::SUCCESS;
        }

        // Resolve governor user (ตำแหน่ง = "ผู้ว่าการ")
        $governorPositionId = DB::table('positions')
            ->where('title', 'ผู้ว่าการ')->value('id');
        if (! $governorPositionId) {
            $this->error('Position "ผู้ว่าการ" not found.');
            return self::FAILURE;
        }
        $governor = User::where('position_id', $governorPositionId)->first();
        if (! $governor) {
            $this->error('No user assigned to "ผู้ว่าการ".');
            return self::FAILURE;
        }

        $this->info("Fiscal year: {$fy}");
        $this->info("Governor: {$governor->fname} {$governor->lname} (id={$governor->id})");
        $this->info("Subcommittee users: {$subUsers->count()}");

        $subUserIds = $subUsers->pluck('id')->all();

        // Find assignments to delete: any assignment where evaluator is subcommittee
        // AND (angle != 'left' OR evaluatee != governor)
        $toDelete = EvaluationAssignment::whereIn('evaluator_id', $subUserIds)
            ->where('fiscal_year', $fy)
            ->where(function ($q) use ($governor) {
                $q->where('angle', '!=', 'left')
                    ->orWhere('evaluatee_id', '!=', $governor->id);
            })
            ->get();

        $this->info("Assignments to remove: {$toDelete->count()}");

        // Find subcommittee users missing the required (left, governor) assignment
        $existingLeftIds = EvaluationAssignment::whereIn('evaluator_id', $subUserIds)
            ->where('fiscal_year', $fy)
            ->where('angle', 'left')
            ->where('evaluatee_id', $governor->id)
            ->pluck('evaluator_id')->all();

        $missingLeft = collect($subUserIds)->diff($existingLeftIds)->values();
        $this->info("Subcommittee users missing left/governor assignment: {$missingLeft->count()}");

        if ($dryRun) {
            $this->warn('DRY RUN — no changes applied.');
            return self::SUCCESS;
        }

        DB::transaction(function () use ($toDelete, $missingLeft, $governor, $fy) {
            $toDelete->each->delete();

            // Need an evaluation_id for the new assignments. Pull governor's evaluation
            // from any existing left assignment for the governor in this fy, or fallback
            // to the first published evaluation of grade 13.
            $evalId = EvaluationAssignment::where('evaluatee_id', $governor->id)
                ->where('fiscal_year', $fy)
                ->where('angle', 'left')
                ->value('evaluation_id');

            if (! $evalId) {
                $evalId = DB::table('evaluations')
                    ->where('status', 'published')
                    ->orderByDesc('id')
                    ->value('id');
            }

            foreach ($missingLeft as $evaluatorId) {
                EvaluationAssignment::create([
                    'evaluator_id' => $evaluatorId,
                    'evaluatee_id' => $governor->id,
                    'evaluation_id' => $evalId,
                    'angle' => 'left',
                    'fiscal_year' => $fy,
                ]);
            }
        });

        $this->info('Done.');
        return self::SUCCESS;
    }
}
