<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Group-shared access codes: 1 code now spans MANY evaluatees within the same
 * stakeholder group. The same organization (e.g. "WHA") can appear in multiple
 * evaluatees' lists under one code, so the stakeholder unique key must include
 * `evaluatee_id` to allow those rows to coexist.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Add new unique FIRST (so the FK has an alternate index to lean on),
        // then drop the old unique. MySQL refuses to drop an index that backs an FK.
        Schema::table('external_stakeholders', function (Blueprint $table) {
            $table->unique(
                ['external_access_code_id', 'evaluatee_id', 'sequence_no', 'organization_name'],
                'ext_stakeholder_unique_v2'
            );
        });
        Schema::table('external_stakeholders', function (Blueprint $table) {
            $table->dropUnique('ext_stakeholder_unique');
        });
    }

    public function down(): void
    {
        Schema::table('external_stakeholders', function (Blueprint $table) {
            $table->unique(
                ['external_access_code_id', 'sequence_no', 'organization_name'],
                'ext_stakeholder_unique'
            );
        });
        Schema::table('external_stakeholders', function (Blueprint $table) {
            $table->dropUnique('ext_stakeholder_unique_v2');
        });
    }
};
