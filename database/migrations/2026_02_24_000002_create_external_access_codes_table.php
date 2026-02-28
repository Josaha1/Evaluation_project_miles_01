<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_access_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->foreignId('external_organization_id')->constrained('external_organizations')->onDelete('cascade');
            $table->foreignId('evaluation_assignment_id')->nullable()->constrained('evaluation_assignments')->onDelete('set null');
            $table->foreignId('evaluatee_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('evaluation_id')->nullable()->constrained('evaluations')->onDelete('set null');
            $table->year('fiscal_year');
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_access_codes');
    }
};
