<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // evaluation_assignments — heavily queried by fiscal_year, evaluator_id, evaluatee_id, angle
        Schema::table('evaluation_assignments', function (Blueprint $table) {
            $table->index('fiscal_year', 'ea_fiscal_year_idx');
            $table->index('angle', 'ea_angle_idx');
            $table->index(['evaluator_id', 'fiscal_year'], 'ea_evaluator_fiscal_idx');
            $table->index(['evaluatee_id', 'fiscal_year'], 'ea_evaluatee_fiscal_idx');
            $table->index(['evaluatee_id', 'evaluation_id', 'fiscal_year'], 'ea_evaluatee_eval_fiscal_idx');
        });

        // users — filtered by grade and role on nearly every request
        Schema::table('users', function (Blueprint $table) {
            $table->index('grade', 'users_grade_idx');
            $table->index('role', 'users_role_idx');
        });

        // evaluations — filtered by status and user_type
        Schema::table('evaluations', function (Blueprint $table) {
            $table->index(['status', 'user_type'], 'evaluations_status_type_idx');
            $table->index(['status', 'user_type', 'grade_min', 'grade_max'], 'evaluations_status_type_grade_idx');
        });

        // answers — additional indexes for common query patterns
        Schema::table('answers', function (Blueprint $table) {
            $table->index(['user_id', 'evaluatee_id', 'evaluation_id'], 'answers_user_evaluatee_eval_idx');
        });

        // external_access_codes — filtered by is_used and organization
        Schema::table('external_access_codes', function (Blueprint $table) {
            $table->index('is_used', 'eac_is_used_idx');
            $table->index('fiscal_year', 'eac_fiscal_year_idx');
        });

        // sessions — cleanup queries by last_activity
        if (Schema::hasColumn('sessions', 'last_activity')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->index('last_activity', 'sessions_last_activity_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('evaluation_assignments', function (Blueprint $table) {
            $table->dropIndex('ea_fiscal_year_idx');
            $table->dropIndex('ea_angle_idx');
            $table->dropIndex('ea_evaluator_fiscal_idx');
            $table->dropIndex('ea_evaluatee_fiscal_idx');
            $table->dropIndex('ea_evaluatee_eval_fiscal_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_grade_idx');
            $table->dropIndex('users_role_idx');
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropIndex('evaluations_status_type_idx');
            $table->dropIndex('evaluations_status_type_grade_idx');
        });

        Schema::table('answers', function (Blueprint $table) {
            $table->dropIndex('answers_user_evaluatee_eval_idx');
        });

        Schema::table('external_access_codes', function (Blueprint $table) {
            $table->dropIndex('eac_is_used_idx');
            $table->dropIndex('eac_fiscal_year_idx');
        });

        if (Schema::hasColumn('sessions', 'last_activity')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->dropIndex('sessions_last_activity_idx');
            });
        }
    }
};
