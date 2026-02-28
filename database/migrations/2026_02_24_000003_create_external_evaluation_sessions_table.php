<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_evaluation_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_access_code_id')->constrained('external_access_codes')->onDelete('cascade');
            $table->foreignId('external_organization_id')->constrained('external_organizations')->onDelete('cascade');
            $table->foreignId('evaluatee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('evaluation_id')->constrained('evaluations')->onDelete('cascade');
            $table->string('session_token', 64)->unique();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_evaluation_sessions');
    }
};
