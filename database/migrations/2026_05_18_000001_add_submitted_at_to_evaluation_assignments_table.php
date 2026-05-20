<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('evaluation_assignments', function (Blueprint $table) {
            // เคยมีใน prod แต่ไม่เคย commit migration → ใช้ guard กัน double-add
            if (! Schema::hasColumn('evaluation_assignments', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('angle')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('evaluation_assignments', function (Blueprint $table) {
            if (Schema::hasColumn('evaluation_assignments', 'submitted_at')) {
                $table->dropColumn('submitted_at');
            }
        });
    }
};
