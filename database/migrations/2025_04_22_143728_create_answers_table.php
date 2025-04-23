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
        Schema::create('answers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('evaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('question_id')->constrained()->onDelete('cascade');

            // ผู้ประเมิน (อาจจะเป็นตัวเองหรือคนอื่น)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // ผู้ถูกประเมิน (ถ้าเป็น self ก็จะเท่ากับ user_id)
            $table->foreignId('evaluatee_id')->constrained('users')->onDelete('cascade');

            // เก็บค่าแบบ flexible รองรับทั้งข้อความ ตัวเลข และหลายตัวเลือก
            $table->text('value')->nullable();

            $table->timestamps();

            // ป้องกันการตอบซ้ำในแบบเดียวกัน
            $table->unique(['evaluation_id', 'user_id', 'evaluatee_id', 'question_id']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('answers');
    }
};
