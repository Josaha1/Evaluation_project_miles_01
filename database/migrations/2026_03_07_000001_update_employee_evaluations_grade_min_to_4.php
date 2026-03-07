<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * รวมระดับ 4 เข้ากับกลุ่มพนักงาน (เดิม 5-8 → 4-8)
     */
    public function up(): void
    {
        // Update 360 employee evaluation (eval 3) grade_min from 5 to 4
        DB::table('evaluations')
            ->where('grade_min', 5)
            ->where('grade_max', 8)
            ->update(['grade_min' => 4]);
    }

    /**
     * Reverse: revert grade_min back to 5
     */
    public function down(): void
    {
        DB::table('evaluations')
            ->where('grade_min', 4)
            ->where('grade_max', 8)
            ->update(['grade_min' => 5]);
    }
};
