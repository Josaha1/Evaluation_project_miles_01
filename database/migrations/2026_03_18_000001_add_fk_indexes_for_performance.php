<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users FK indexes - critical for withCount('users') in Division/Department/Faction controllers
        Schema::table('users', function (Blueprint $table) {
            $table->index('division_id', 'users_division_id_idx');
            $table->index('department_id', 'users_department_id_idx');
            $table->index('faction_id', 'users_faction_id_idx');
        });

        // Departments FK index - for withCount('departments') in Division controller
        if (Schema::hasColumn('departments', 'division_id')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->index('division_id', 'departments_division_id_idx');
            });
        }

        // Positions FK index - for withCount('positions') in Department controller
        if (Schema::hasColumn('positions', 'department_id')) {
            Schema::table('positions', function (Blueprint $table) {
                $table->index('department_id', 'positions_department_id_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_division_id_idx');
            $table->dropIndex('users_department_id_idx');
            $table->dropIndex('users_faction_id_idx');
        });

        if (Schema::hasColumn('departments', 'division_id')) {
            Schema::table('departments', function (Blueprint $table) {
                $table->dropIndex('departments_division_id_idx');
            });
        }

        if (Schema::hasColumn('positions', 'department_id')) {
            Schema::table('positions', function (Blueprint $table) {
                $table->dropIndex('positions_department_id_idx');
            });
        }
    }
};
