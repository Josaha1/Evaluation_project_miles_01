<?php

namespace App\Console\Commands;

use App\Models\Answer;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalStakeholder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanExternalOverscopeAnswers extends Command
{
    protected $signature = 'external:clean-overscope-answers
                            {--dry-run : ไม่ลบจริง — แค่ log/รายงานว่าจะลบอะไร}
                            {--session= : เฉพาะ external_evaluation_session id เดียว}
                            {--fiscal= : จำกัดเฉพาะ fiscal_year (ค.ศ.) ของ access code}';

    protected $description = 'ลบ answers ภายนอกที่อยู่นอก scope ที่ stakeholder ตั้งใจ (over-scope ก่อน refactor) แบบ reversible (backup+log)';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $onlySession = $this->option('session');
        $fiscal = $this->option('fiscal');
        $backup = '_backup_answers_overscope_'.now()->format('Ymd');

        // session ที่มี answers ผูกอยู่
        $sessionIds = Answer::whereNotNull('external_session_id')
            ->when($onlySession, fn ($q) => $q->where('external_session_id', $onlySession))
            ->distinct()->pluck('external_session_id');

        $cleaned = $unmapped = $inScope = $deletedTotal = 0;

        foreach ($sessionIds as $sid) {
            $session = ExternalEvaluationSession::find($sid);
            if (! $session) continue;
            if ($fiscal && (int) optional($session->accessCode)->fiscal_year !== (int) $fiscal) continue;

            $answers = Answer::where('external_session_id', $sid)->get();
            if ($answers->isEmpty()) continue;

            [$intended, $tier] = $this->deriveIntended($session);

            // หา scope ที่ตั้งใจไม่ได้ → ไม่ตัดสินว่า over-scope → ไม่แตะ
            if ($intended === null) {
                $this->logRow($sid, 'unmapped', null, [], [], 0, $dry);
                $unmapped++;
                continue;
            }

            $outIds = $answers->whereNotIn('evaluatee_id', $intended)->pluck('id')->all();
            if (empty($outIds)) {
                $this->logRow($sid, 'in_scope', $tier, $intended, [], 0, $dry);
                $inScope++;
                continue;
            }

            if (! $dry) {
                // backup table (idempotent) นอก transaction กัน DDL implicit-commit
                DB::statement("CREATE TABLE IF NOT EXISTS `$backup` AS SELECT * FROM answers WHERE 1=0");
                DB::transaction(function () use ($backup, $outIds, $sid) {
                    $idList = implode(',', array_map('intval', $outIds));
                    DB::statement("INSERT INTO `$backup` SELECT * FROM answers WHERE id IN ($idList)");
                    Answer::whereIn('id', $outIds)->delete();
                    // session ไม่เหลือ answer → ไม่มีผลประเมินแล้ว → เคลียร์ completed_at
                    if (Answer::where('external_session_id', $sid)->count() === 0) {
                        ExternalEvaluationSession::where('id', $sid)->update(['completed_at' => null]);
                    }
                });
            }

            $this->logRow($sid, 'cleaned', $tier, $intended, $outIds, count($outIds), $dry);
            $cleaned++;
            $deletedTotal += count($outIds);
        }

        $this->table(['status', 'count'], [
            ['cleaned', $cleaned],
            ['unmapped (ต้อง map มือ)', $unmapped],
            ['in_scope (ไม่ต้องแก้)', $inScope],
            ['answers '.($dry ? 'จะลบ' : 'ลบแล้ว'), $deletedTotal],
        ]);
        $this->info($dry ? 'DRY-RUN — ไม่มีการลบจริง' : "ลบเสร็จ — backup ที่ตาราง `$backup`");

        return self::SUCCESS;
    }

    /**
     * คืน [intended evaluatee ids, tier] หรือ [null, null] ถ้า map ไม่ได้.
     * Tier1 = ผูก external_stakeholder_id ตรง / Tier2 = ชื่อผู้ประเมินตรง contact_person ใน code เดียวกัน.
     */
    private function deriveIntended(ExternalEvaluationSession $session): array
    {
        // Tier1 — FK ตรง
        if ($session->external_stakeholder_id && ($stk = $session->stakeholder)) {
            $ids = $this->stakeholderScope($stk->fiscal_year, $stk->organization_name, $stk->contact_person);
            if (! empty($ids)) return [$ids, 'fk'];
        }

        // Tier2 — normalize(evaluator_name) == normalize(contact_person) ใน code เดียวกัน
        $ne = ExternalStakeholder::normalizeName($session->evaluator_name);
        if ($ne !== '') {
            $matches = ExternalStakeholder::where('external_access_code_id', $session->external_access_code_id)
                ->get()
                ->filter(fn ($s) => $s->contact_person
                    && ExternalStakeholder::normalizeName($s->contact_person) === $ne);
            if ($matches->isNotEmpty()) {
                $ids = [];
                foreach ($matches->unique(fn ($s) => $s->organization_name.'|'.$s->contact_person) as $m) {
                    $ids = array_merge($ids, $this->stakeholderScope($m->fiscal_year, $m->organization_name, $m->contact_person));
                }
                $ids = array_values(array_unique($ids));
                if (! empty($ids)) return [$ids, 'name'];
            }
        }

        return [null, null];
    }

    /**
     * evaluatee ทั้งหมดของ stakeholder identity (fiscal + normalize org + contact ตรง) — มิเรอร์ scope ของ dashboard.
     */
    private function stakeholderScope($fiscalYear, ?string $org, ?string $contact): array
    {
        $orgN = ExternalStakeholder::normalizeName($org);

        return ExternalStakeholder::where('fiscal_year', $fiscalYear)->get()
            ->filter(fn ($s) => ExternalStakeholder::normalizeName($s->organization_name) === $orgN
                && (empty($contact) || $s->contact_person === $contact))
            ->pluck('evaluatee_id')->unique()->values()->all();
    }

    private function logRow(int $sid, string $status, ?string $tier, array $intended, array $deletedIds, int $count, bool $dry): void
    {
        DB::table('external_overscope_cleanup_logs')->insert([
            'external_evaluation_session_id' => $sid,
            'status' => $status,
            'tier' => $tier,
            'intended_ids' => json_encode(array_values($intended)),
            'deleted_answer_ids' => json_encode(array_values($deletedIds)),
            'deleted_count' => $count,
            'dry_run' => $dry,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
