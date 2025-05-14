<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('evaluation_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('evaluator_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('evaluatee_id')->constrained('users')->onDelete('cascade');

            $table->string('fiscal_year'); // ปีงบประมาณ
            $table->enum('angle', ['top', 'bottom', 'left', 'right']); 
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluation_assignments');
    }
};
