<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Production DB ขาด department_id ใน positions
     * เพิ่ม FK เพื่อให้ตรงตาม spec (Department → Position hierarchy)
     */
    public function up(): void
    {
        if (Schema::hasColumn('positions', 'department_id')) {
            return;
        }

        Schema::table('positions', function (Blueprint $table) {
            $table->unsignedBigInteger('department_id')->nullable()->after('id');

            $table->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('positions', 'department_id')) {
            return;
        }

        Schema::table('positions', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });
    }
};
