<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

/**
 * Copy all evaluation_assignments from fiscal year 2568 (CE 2025)
 * to fiscal year 2569 (CE 2026), keeping the same
 * evaluator-evaluatee-angle-evaluation relationships.
 */
class FiscalYear2569Seeder extends Seeder
{
    public function run(): void
    {
        $sourceYear = 2025; // BE 2568
        $targetYear = 2026; // BE 2569

        // Check if target year already has data
        $existingCount = DB::table('evaluation_assignments')
            ->where('fiscal_year', $targetYear)
            ->count();

        if ($existingCount > 0) {
            $this->command->warn("Fiscal year {$targetYear} (BE " . ($targetYear + 543) . ") already has {$existingCount} assignments. Skipping.");
            return;
        }

        // Load all assignments from source year
        $sourceAssignments = DB::table('evaluation_assignments')
            ->where('fiscal_year', $sourceYear)
            ->get();

        if ($sourceAssignments->isEmpty()) {
            $this->command->error("No assignments found for fiscal year {$sourceYear} (BE " . ($sourceYear + 543) . ").");
            return;
        }

        $this->command->info("Copying {$sourceAssignments->count()} assignments from BE " . ($sourceYear + 543) . " to BE " . ($targetYear + 543) . "...");

        $now = Carbon::now();
        $chunks = $sourceAssignments->map(function ($assignment) use ($targetYear, $now) {
            return [
                'evaluation_id' => $assignment->evaluation_id,
                'evaluator_id'  => $assignment->evaluator_id,
                'evaluatee_id'  => $assignment->evaluatee_id,
                'fiscal_year'   => $targetYear,
                'angle'         => $assignment->angle,
                'created_at'    => $now,
                'updated_at'    => $now,
            ];
        })->chunk(500);

        $inserted = 0;
        foreach ($chunks as $chunk) {
            DB::table('evaluation_assignments')->insert($chunk->toArray());
            $inserted += $chunk->count();
            $this->command->info("  Inserted {$inserted} / {$sourceAssignments->count()}");
        }

        $this->command->info("Done! Created {$inserted} assignments for fiscal year {$targetYear} (BE " . ($targetYear + 543) . ").");

        // Show summary
        $summary = DB::table('evaluation_assignments')
            ->where('fiscal_year', $targetYear)
            ->select('angle', DB::raw('COUNT(*) as cnt'))
            ->groupBy('angle')
            ->get();

        $this->command->table(
            ['Angle', 'Count'],
            $summary->map(fn($row) => [$row->angle, $row->cnt])->toArray()
        );
    }
}
