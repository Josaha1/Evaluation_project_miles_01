<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->unsignedSmallInteger('fiscal_year')->nullable()->after('external_access_code_id');
            $table->index('fiscal_year');
        });

        // Backfill — MySQL-only (SQLite for tests doesn't support UPDATE...JOIN, and tests start empty anyway)
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("
                UPDATE answers a
                INNER JOIN evaluation_assignments ea
                    ON a.evaluation_id = ea.evaluation_id
                    AND a.user_id = ea.evaluator_id
                    AND a.evaluatee_id = ea.evaluatee_id
                SET a.fiscal_year = ea.fiscal_year
                WHERE a.fiscal_year IS NULL
            ");

            DB::statement("
                UPDATE answers a
                INNER JOIN evaluation_assignments ea
                    ON a.evaluatee_id = ea.evaluatee_id
                    AND a.evaluation_id = ea.evaluation_id
                SET a.fiscal_year = ea.fiscal_year
                WHERE a.fiscal_year IS NULL
                  AND a.user_id = a.evaluatee_id
            ");

            DB::statement("UPDATE answers SET fiscal_year = 2025 WHERE fiscal_year IS NULL");
        }
    }

    public function down(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->dropIndex(['fiscal_year']);
            $table->dropColumn('fiscal_year');
        });
    }
};
