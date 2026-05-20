<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot: 1 access code can cover MANY evaluatees
        Schema::create('external_code_evaluatees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_access_code_id')->constrained('external_access_codes')->onDelete('cascade');
            $table->foreignId('evaluatee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('evaluation_id')->constrained('evaluations')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['external_access_code_id', 'evaluatee_id'], 'ext_code_evaluatee_unique');
            $table->index('evaluatee_id');
        });

        // Backfill: 1:1 from existing access codes
        DB::statement("
            INSERT INTO external_code_evaluatees (external_access_code_id, evaluatee_id, evaluation_id, created_at, updated_at)
            SELECT id, evaluatee_id, evaluation_id, created_at, updated_at
            FROM external_access_codes
            WHERE evaluatee_id IS NOT NULL AND evaluation_id IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('external_code_evaluatees');
    }
};
