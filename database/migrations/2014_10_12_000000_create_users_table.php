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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('emid')->unique(); // รหัสพนักงาน เช่น 350101 หรือ E01001
            $table->string('prename');
            $table->string('fname');
            $table->string('lname');
            $table->string('sex');

                                                                                    // 🔗 เชื่อมตรงกับตารางหลัก 3 ตาราง
            $table->foreignId('division_id')->constrained()->onDelete('cascade');   // สายงาน
            $table->foreignId('department_id')->constrained()->onDelete('cascade'); // หน่วยงาน
            $table->foreignId('position_id')->constrained()->onDelete('cascade');   // ตำแหน่ง
            $table->foreignId('faction_id')->constrained()->onDelete('cascade');    //  ฝ่าย
            $table->string('grade')->nullable();                                    // ระดับ
            $table->date('birthdate');
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();

            $table->string('photo')->nullable();
            $table->string('role')->default('user');                                  // user หรือ admin
            $table->enum('user_type', ['internal', 'external'])->default('internal'); // ประเภทบุคลากร
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
