<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Original migration declared angle as ENUM('top','bottom','left','right').
 * Prod DB already uses 'self' — schema drifted from migrations. This migration
 * brings the migration definition in sync so SQLite (used in tests) accepts 'self'.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: drop indexes referencing angle, recreate column as string, restore indexes
            $indexes = collect(DB::select("PRAGMA index_list('evaluation_assignments')"))
                ->map(fn($r) => $r->name)
                ->filter(fn($n) => !str_starts_with($n, 'sqlite_autoindex_'))
                ->all();

            foreach ($indexes as $idxName) {
                $cols = collect(DB::select("PRAGMA index_info(" . DB::getPdo()->quote($idxName) . ")"))
                    ->pluck('name')->all();
                if (in_array('angle', $cols, true)) {
                    DB::statement("DROP INDEX IF EXISTS " . $idxName);
                }
            }

            Schema::table('evaluation_assignments', function (Blueprint $table) {
                $table->string('angle_tmp', 16)->nullable()->after('angle');
            });
            DB::statement('UPDATE evaluation_assignments SET angle_tmp = angle');
            Schema::table('evaluation_assignments', function (Blueprint $table) {
                $table->dropColumn('angle');
            });
            Schema::table('evaluation_assignments', function (Blueprint $table) {
                $table->renameColumn('angle_tmp', 'angle');
            });

            // Restore the indexes (best-effort — match names from earlier migrations)
            DB::statement('CREATE INDEX IF NOT EXISTS ea_angle_idx ON evaluation_assignments (angle)');
            DB::statement('CREATE INDEX IF NOT EXISTS ea_fiscal_angle_idx ON evaluation_assignments (fiscal_year, angle)');
        } else {
            DB::statement("ALTER TABLE evaluation_assignments MODIFY angle ENUM('top','bottom','left','right','self') NOT NULL");
        }
    }

    public function down(): void
    {
        // Forward-only
    }
};
