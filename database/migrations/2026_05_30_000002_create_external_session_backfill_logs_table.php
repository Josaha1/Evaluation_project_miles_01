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
            $table->unsignedBigInteger('external_evaluation_session_id');
            $table->string('status', 20);
            $table->unsignedBigInteger('matched_stakeholder_id')->nullable();
            $table->json('candidates')->nullable();
            $table->text('reason')->nullable();
            $table->boolean('dry_run')->default(false);
            $table->timestamps();

            $table->index('external_evaluation_session_id', 'esbl_sess_idx');
            $table->index('status', 'esbl_status_idx');
            $table->foreign('external_evaluation_session_id', 'esbl_sess_fk')
                ->references('id')->on('external_evaluation_sessions')->cascadeOnDelete();
            $table->foreign('matched_stakeholder_id', 'esbl_stk_fk')
                ->references('id')->on('external_stakeholders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('external_session_backfill_logs', function (Blueprint $table) {
            $table->dropForeign('esbl_sess_fk');
            $table->dropForeign('esbl_stk_fk');
        });
        Schema::dropIfExists('external_session_backfill_logs');
    }
};
