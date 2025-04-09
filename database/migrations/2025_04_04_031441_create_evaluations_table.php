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
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('user_type')->nullable();
            $table->integer('grade_min')->nullable();
            $table->integer('grade_max')->nullable();
            $table->timestamps();
        });

        Schema::create('evaluation_section', function (Blueprint $table) {
            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('section_id')->constrained()->onDelete('cascade');
        });

        Schema::create('evaluation_aspect', function (Blueprint $table) {
            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('aspect_id')->constrained()->onDelete('cascade');
        });

        Schema::create('evaluation_question', function (Blueprint $table) {
            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
