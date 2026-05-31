<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_evaluation_sessions', function (Blueprint $table) {
            // ผูก session กับ stakeholder row → scope ระดับบุคคล (ไม่ใช่ระดับ org เดิม)
            $table->foreignId('external_stakeholder_id')
                ->nullable()
                ->after('evaluatee_id')
                ->constrained('external_stakeholders')
                ->nullOnDelete();
            $table->index('external_stakeholder_id', 'eval_sess_stk_idx');
        });
    }

    public function down(): void
    {
        Schema::table('external_evaluation_sessions', function (Blueprint $table) {
            $table->dropForeign(['external_stakeholder_id']);
            $table->dropIndex('eval_sess_stk_idx');
            $table->dropColumn('external_stakeholder_id');
        });
    }
};
