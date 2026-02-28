<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->foreignId('external_access_code_id')
                ->nullable()
                ->after('other_text')
                ->constrained('external_access_codes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->dropForeign(['external_access_code_id']);
            $table->dropColumn('external_access_code_id');
        });
    }
};
