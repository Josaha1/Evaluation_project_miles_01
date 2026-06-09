<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_overscope_cleanup_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_evaluation_session_id');
            $table->string('status', 20);                 // cleaned | unmapped | in_scope
            $table->string('tier', 10)->nullable();        // fk | name
            $table->json('intended_ids')->nullable();      // evaluatee ที่อยู่ใน scope ที่ตั้งใจ
            $table->json('deleted_answer_ids')->nullable(); // answer.id ที่ถูกลบ (นอก scope)
            $table->unsignedInteger('deleted_count')->default(0);
            $table->boolean('dry_run')->default(false);
            $table->timestamps();

            $table->index('external_evaluation_session_id', 'eocl_sess_idx');
            $table->index('status', 'eocl_status_idx');
            $table->foreign('external_evaluation_session_id', 'eocl_sess_fk')
                ->references('id')->on('external_evaluation_sessions')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('external_overscope_cleanup_logs', function (Blueprint $table) {
            $table->dropForeign('eocl_sess_fk');
        });
        Schema::dropIfExists('external_overscope_cleanup_logs');
    }
};
