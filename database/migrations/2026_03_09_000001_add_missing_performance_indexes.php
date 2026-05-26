<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Answers table - critical indexes for report queries
        Schema::table('answers', function (Blueprint $table) {
            // For getEvaluatorsForUser / getAspectScoresForUser batch queries
            $table->index(['evaluatee_id', 'fiscal_year'], 'answers_evaluatee_fiscal_idx');
            // For question-level aggregation
            $table->index(['question_id', 'evaluatee_id', 'fiscal_year'], 'answers_question_evaluatee_fiscal_idx');
            // For external evaluation queries
            $table->index(['external_access_code_id', 'fiscal_year'], 'answers_external_code_fiscal_idx');
        });

        // Evaluation assignments - compound index for angle-based queries
        // Note: ea_evaluator_fiscal_idx and ea_evaluatee_fiscal_idx already exist
        // in 2026_03_08_000001_add_performance_indexes.php
        Schema::table('evaluation_assignments', function (Blueprint $table) {
            // For angle-based queries filtered by fiscal year
            $table->index(['fiscal_year', 'angle'], 'ea_fiscal_angle_idx');
        });
    }

    public function down(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->dropIndex('answers_evaluatee_fiscal_idx');
            $table->dropIndex('answers_question_evaluatee_fiscal_idx');
            $table->dropIndex('answers_external_code_fiscal_idx');
        });

        Schema::table('evaluation_assignments', function (Blueprint $table) {
            $table->dropIndex('ea_fiscal_angle_idx');
        });
    }
};
