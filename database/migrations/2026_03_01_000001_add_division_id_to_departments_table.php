<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Production DB ขาด division_id ใน departments
     * เพิ่ม FK เพื่อให้ตรงตาม spec (Division → Department hierarchy)
     */
    public function up(): void
    {
        if (Schema::hasColumn('departments', 'division_id')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            $table->unsignedBigInteger('division_id')->nullable()->after('id');

            $table->foreign('division_id')
                ->references('id')
                ->on('divisions')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('departments', 'division_id')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['division_id']);
            $table->dropColumn('division_id');
        });
    }
};
