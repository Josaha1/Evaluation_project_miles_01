<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_session_backfill_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_evaluation_session_id')->constrained('external_evaluation_sessions')->cascadeOnDelete();
            $table->string('status', 20)->index();
            $table->foreignId('matched_stakeholder_id')->nullable()->constrained('external_stakeholders')->nullOnDelete();
            $table->json('candidates')->nullable();
            $table->text('reason')->nullable();
            $table->boolean('dry_run')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_session_backfill_logs');
    }
};
