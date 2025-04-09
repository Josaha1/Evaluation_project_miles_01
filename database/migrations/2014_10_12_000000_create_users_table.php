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
            $table->string('emid')->unique();
            $table->string('prename');
            $table->string('fname');
            $table->string('lname');
            $table->string('sex');
            $table->string('position');
            $table->string('grade');
            $table->string('organize');
            $table->string('password');
            $table->date('birthdate');
            $table->rememberToken();
            $table->timestamps();

            $table->string('photo')->nullable();
            $table->string('role')->default('user'); // Add role column with default value 'user'
            $table->enum('user_type', ['internal', 'external'])->default('internal');
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
