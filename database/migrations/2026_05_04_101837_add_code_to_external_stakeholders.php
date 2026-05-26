<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Add per-stakeholder login code.
 *
 * Multiple `external_stakeholders` rows can share the same `code` when they
 * represent the same external entity (same org_name + group_label + fiscal_year).
 * Login by stakeholder code → list all evaluatees this entity needs to evaluate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_stakeholders', function (Blueprint $table) {
            $table->string('code', 20)->nullable()->after('coordinator');
            $table->index('code', 'ext_stakeholder_code_idx');
        });

        // Backfill: assign shared codes per (org_name, group_label, fiscal_year) identity
        if (DB::connection()->getDriverName() === 'mysql') {
            $identities = DB::table('external_stakeholders')
                ->select('organization_name', 'group_label', 'fiscal_year')
                ->groupBy('organization_name', 'group_label', 'fiscal_year')
                ->get();

            foreach ($identities as $i) {
                $code = self::generateUniqueCode();
                DB::table('external_stakeholders')
                    ->where('organization_name', $i->organization_name)
                    ->where('group_label', $i->group_label)
                    ->where('fiscal_year', $i->fiscal_year)
                    ->update(['code' => $code]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('external_stakeholders', function (Blueprint $table) {
            $table->dropIndex('ext_stakeholder_code_idx');
            $table->dropColumn('code');
        });
    }

    private static function generateUniqueCode(): string
    {
        do {
            $candidate = 'IEAT-S-' . strtoupper(Str::random(8));
        } while (
            DB::table('external_stakeholders')->where('code', $candidate)->exists() ||
            DB::table('external_access_codes')->where('code', $candidate)->exists()
        );
        return $candidate;
    }
};
