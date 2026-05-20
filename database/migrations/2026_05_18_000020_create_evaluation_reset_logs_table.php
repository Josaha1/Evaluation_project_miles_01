<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('evaluation_reset_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('target_user_id')->constrained('users')->onDelete('restrict');
            $table->string('scope_role', 16); // evaluator | evaluatee | both
            $table->unsignedSmallInteger('fiscal_year');
            // snapshot ของ rows ที่กระทบ — JSON เก็บไว้ rollback ได้
            $table->longText('answers_snapshot')->nullable();
            $table->longText('assignments_snapshot')->nullable();
            $table->unsignedInteger('answers_deleted')->default(0);
            $table->unsignedInteger('assignments_reset')->default(0);
            $table->timestamps();
            $table->index(['target_user_id', 'fiscal_year']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluation_reset_logs');
    }
};
