<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_access_codes', function (Blueprint $table) {
            $table->unsignedSmallInteger('fiscal_year')->change();
        });
    }

    public function down(): void
    {
        Schema::table('external_access_codes', function (Blueprint $table) {
            $table->year('fiscal_year')->change();
        });
    }
};
