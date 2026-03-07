<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_organizations', function (Blueprint $table) {
            $table->string('org_code', 10)->nullable()->unique()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('external_organizations', function (Blueprint $table) {
            $table->dropColumn('org_code');
        });
    }
};
