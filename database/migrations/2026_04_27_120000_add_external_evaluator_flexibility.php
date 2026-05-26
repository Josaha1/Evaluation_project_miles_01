<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Sessions: add evaluator identity (who from the org filled this in)
        Schema::table('external_evaluation_sessions', function (Blueprint $table) {
            $table->string('evaluator_name', 255)->nullable()->after('user_agent');
            $table->string('evaluator_position', 255)->nullable()->after('evaluator_name');
        });

        // 2. Access codes: support reusable codes (multiple people from same org)
        Schema::table('external_access_codes', function (Blueprint $table) {
            $table->integer('use_count')->default(0)->after('is_used');
            $table->integer('max_uses')->nullable()->after('use_count')->comment('null = unlimited');
        });

        // 3. Answers: link to specific external session so multiple submissions don't collide
        Schema::table('answers', function (Blueprint $table) {
            $table->unsignedBigInteger('external_session_id')->nullable()->after('external_access_code_id');
            $table->foreign('external_session_id')
                  ->references('id')->on('external_evaluation_sessions')
                  ->onDelete('set null');
        });

        // 4. Drop old unique → new compound unique includes external_session_id
        // MySQL treats NULL as distinct in unique → internal answers (session_id=NULL) stay unique by old key,
        // external answers can have multiple rows for same (eval, evaluatee, question) with different session_ids
        Schema::table('answers', function (Blueprint $table) {
            $table->dropUnique('answers_evaluation_id_user_id_evaluatee_id_question_id_unique');
        });

        Schema::table('answers', function (Blueprint $table) {
            $table->unique(
                ['evaluation_id', 'user_id', 'evaluatee_id', 'question_id', 'external_session_id'],
                'answers_unique_with_session'
            );
        });

        // 5. Backfill (MySQL-only; SQLite test DB is always empty)
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("
                UPDATE answers a
                JOIN (
                    SELECT external_access_code_id, MAX(id) AS session_id
                    FROM external_evaluation_sessions
                    WHERE completed_at IS NOT NULL
                    GROUP BY external_access_code_id
                ) s ON s.external_access_code_id = a.external_access_code_id
                SET a.external_session_id = s.session_id
                WHERE a.external_access_code_id IS NOT NULL
                  AND a.external_session_id IS NULL
            ");
        }
    }

    public function down(): void
    {
        Schema::table('answers', function (Blueprint $table) {
            $table->dropUnique('answers_unique_with_session');
            $table->dropForeign(['external_session_id']);
            $table->dropColumn('external_session_id');
            // restore original unique
            $table->unique(['evaluation_id', 'user_id', 'evaluatee_id', 'question_id']);
        });

        Schema::table('external_access_codes', function (Blueprint $table) {
            $table->dropColumn(['use_count', 'max_uses']);
        });

        Schema::table('external_evaluation_sessions', function (Blueprint $table) {
            $table->dropColumn(['evaluator_name', 'evaluator_position']);
        });
    }
};
