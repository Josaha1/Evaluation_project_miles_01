<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->unsignedSmallInteger('fiscal_year')->nullable()->after('grade_max')
                ->comment('ปีงบประมาณ ค.ศ. (e.g. 2025 = พ.ศ. 2568)');
            $table->index('fiscal_year');
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropIndex(['fiscal_year']);
            $table->dropColumn('fiscal_year');
        });
    }
};
