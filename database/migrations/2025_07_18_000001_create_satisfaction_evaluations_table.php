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
        Schema::create('satisfaction_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->string('fiscal_year', 4);
            
            // 8 questions with 1-5 rating scale
            $table->tinyInteger('question_1')->comment('ระดับความพึงพอใจต่อการใช้งานระบบประเมิน');
            $table->tinyInteger('question_2')->comment('ระดับความพึงพอใจต่อความง่ายในการใช้งาน');
            $table->tinyInteger('question_3')->comment('ระดับความพึงพอใจต่อความเร็วในการตอบสนองของระบบ');
            $table->tinyInteger('question_4')->comment('ระดับความพึงพอใจต่อความถูกต้องของข้อมูล');
            $table->tinyInteger('question_5')->comment('ระดับความพึงพอใจต่อความสะดวกในการเข้าถึง');
            $table->tinyInteger('question_6')->comment('ระดับความพึงพอใจต่อความครบถ้วนของข้อมูล');
            $table->tinyInteger('question_7')->comment('ระดับความพึงพอใจต่อความเหมาะสมของเนื้อหา');
            $table->tinyInteger('question_8')->comment('ระดับความพึงพอใจโดยรวมต่อระบบประเมิน');
            
            $table->text('additional_comments')->nullable()->comment('ความคิดเห็นเพิ่มเติม');
            $table->timestamps();
            
            // Prevent duplicate satisfaction evaluation
            $table->unique(['user_id', 'evaluation_id', 'fiscal_year'], 'satisfaction_eval_unique');
            
            // Index for performance
            $table->index(['fiscal_year', 'evaluation_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('satisfaction_evaluations');
    }
};