<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stakeholder rows captured from "องศาขวา" Excel templates — preserves the
 * organization/contact data that previously was discarded during import.
 *
 * 1 row per stakeholder line in the source spreadsheet (e.g. one company
 * under "คู่ค้าหรือคู่ความร่วมมือ" group). Each row belongs to one access
 * code and (later) may be linked to the external session that consumed it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_stakeholders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_access_code_id')
                  ->constrained('external_access_codes')->cascadeOnDelete();
            $table->foreignId('evaluatee_id')
                  ->constrained('users')->cascadeOnDelete();
            $table->year('fiscal_year');

            // Source data
            $table->string('group_label', 191);                 // column A — e.g., "คู่ค้าหรือคู่ความร่วมมือ"
            $table->text('sub_group')->nullable();              // column B definition text
            $table->string('sequence_no', 20)->nullable();      // "1)", "2)" prefix
            $table->string('organization_name', 500);           // column C — main identifier
            $table->string('contact_person', 500)->nullable();  // column D
            $table->string('contact_info', 500)->nullable();    // column E (phone / email)
            $table->string('coordinator', 500)->nullable();     // column F

            // Traceability (which import row this came from)
            $table->string('source_sheet', 255)->nullable();
            $table->unsignedInteger('source_row')->nullable();

            // Set when an external session uses this code AND this stakeholder slot is consumed.
            // Stays NULL if the code is used by people not pre-listed in the Excel.
            $table->foreignId('external_session_id')->nullable()
                  ->constrained('external_evaluation_sessions')->nullOnDelete();

            $table->timestamps();

            // Idempotent re-import: same (code × sequence × org name) → skip
            $table->unique(
                ['external_access_code_id', 'sequence_no', 'organization_name'],
                'ext_stakeholder_unique'
            );
            $table->index(['evaluatee_id', 'fiscal_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_stakeholders');
    }
};
