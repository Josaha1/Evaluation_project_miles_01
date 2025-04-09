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
        Schema::create('section_user_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained()->onDelete('cascade');

            $table->enum('user_type', ['internal', 'external']); // ประเภทบุคคล
            $table->unsignedTinyInteger('grade_min');            // ระดับขั้นต่ำ เช่น 9
            $table->unsignedTinyInteger('grade_max');            // ระดับสูงสุด เช่น 12

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('section_user_type');
    }
};
