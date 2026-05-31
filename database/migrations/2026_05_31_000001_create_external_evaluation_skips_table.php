<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_evaluation_skips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_evaluation_session_id');
            $table->unsignedBigInteger('evaluatee_id');
            $table->string('reason', 255)->nullable();
            $table->timestamps();

            $table->unique(['external_evaluation_session_id', 'evaluatee_id'], 'ees_session_eval_uq');
            $table->index('external_evaluation_session_id', 'ees_session_idx');
            $table->index('evaluatee_id', 'ees_eval_idx');
            $table->foreign('external_evaluation_session_id', 'ees_session_fk')
                ->references('id')->on('external_evaluation_sessions')->cascadeOnDelete();
            $table->foreign('evaluatee_id', 'ees_eval_fk')
                ->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('external_evaluation_skips', function (Blueprint $table) {
            $table->dropForeign('ees_session_fk');
            $table->dropForeign('ees_eval_fk');
        });
        Schema::dropIfExists('external_evaluation_skips');
    }
};
