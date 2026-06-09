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
     * คืน [intended evaluatee ids, tier] หรือ [null, null] ถ้า map ไม่ได้/ก้ำกึ่ง.
     * scope = union evaluatee ทุก row ของ "คนเดียวกัน" ข้ามกลุ่ม/ข้าม code (FK ชี้บริษัท / ไม่งั้น match ชื่อ).
     */
    private function deriveIntended(ExternalEvaluationSession $session): array
    {
        // ระบุ "คน" จาก FK (ถ้ามี) หรือชื่อผู้ประเมิน — 1 คนเป็น stakeholder ได้หลายกลุ่ม → ต้องประเมินหลายคน
        $fkOrgCore = null;
        $tier = 'name';
        $key = '';
        if ($session->external_stakeholder_id && ($stk = $session->stakeholder)) {
            $key = $this->personKey($stk->contact_person);
            $fkOrgCore = $this->orgCore($stk->organization_name);
            $tier = 'fk';
        }
        if ($key === '') {
            $key = $this->personKey($session->evaluator_name);
            $tier = 'name';
        }
        if (mb_strlen($key) < 4) return [null, null];

        $fy = optional($session->accessCode)->fiscal_year ?? optional($session->stakeholder)->fiscal_year;

        $rows = ExternalStakeholder::query()
            ->when($fy, fn ($q) => $q->where('fiscal_year', $fy))
            ->get()
            ->filter(fn ($s) => $this->personKey($s->contact_person) === $key);
        if ($rows->isEmpty()) return [null, null];

        if ($fkOrgCore) {
            // FK ชี้บริษัทชัด → เก็บเฉพาะ row บริษัทเดียวกับ FK (รองรับสะกดต่าง = substring กัน)
            $rows = $rows->filter(fn ($s) => $this->sameCompany($this->orgCore($s->organization_name), $fkOrgCore));
        } else {
            // ชื่อตรงแต่โยงหลายบริษัท + แยกไม่ออก → ก้ำกึ่ง → ไม่แตะ (safe)
            $orgs = $rows->map(fn ($s) => $this->orgCore($s->organization_name))->filter()->unique()->values()->all();
            if (count($orgs) > 1 && ! $this->orgsOneCompany($orgs)) return [null, null];
        }

        $intended = $rows->pluck('evaluatee_id')->unique()->values()->all();
        return empty($intended) ? [null, null] : [$intended, $tier];
    }

    /** คีย์ระบุตัวคน: บรรทัดแรก → ตัดคำนำหน้า → ตัดส่วน "ตำแหน่ง/เบอร์" → เก็บเฉพาะอักษรไทย (รวม variant ชื่อเดียวกัน). */
    private function personKey(?string $name): string
    {
        if (! $name) return '';
        $s = preg_split('/\r|\n/', $name)[0];
        $s = mb_strtolower(trim($s));
        foreach (['นางสาว', 'น.ส.', 'นาย', 'นาง', 'คุณ', 'ดร.', 'ว่าที่ร้อยตรี', 'ว่าที่ ร.ต.', 'ว่าที่'] as $p) {
            $pp = mb_strtolower($p);
            if (mb_strpos($s, $pp) === 0) { $s = mb_substr($s, mb_strlen($pp)); break; }
        }
        $cut = mb_strpos($s, 'ตำแหน่ง');
        if ($cut !== false) $s = mb_substr($s, 0, $cut);
        return preg_replace('/[^ก-๙]/u', '', $s);
    }

    /** แก่นชื่อบริษัท: ตัดวงเล็บ + คำว่าบริษัท/จำกัด/มหาชน + เก็บเฉพาะอักษรไทย. */
    private function orgCore(?string $org): string
    {
        if (! $org) return '';
        $s = mb_strtolower(trim($org));
        $s = preg_replace('/\(.*?\)/u', '', $s);
        foreach (['บริษัท', 'จำกัด', 'มหาชน', 'หจก.', 'ห้างหุ้นส่วน'] as $w) $s = str_replace(mb_strtolower($w), '', $s);
        return preg_replace('/[^ก-๙]/u', '', $s);
    }

    private function sameCompany(string $a, string $b): bool
    {
        if ($a === '' || $b === '') return false;
        return $a === $b || mb_strpos($a, $b) !== false || mb_strpos($b, $a) !== false;
    }

    /** ตัวสั้นสุดเป็น substring ของทุกตัว → ถือว่าบริษัทเดียวกัน (สะกดต่าง). */
    private function orgsOneCompany(array $orgs): bool
    {
        $orgs = array_values(array_filter($orgs));
        if (count($orgs) <= 1) return true;
        usort($orgs, fn ($x, $y) => mb_strlen($x) <=> mb_strlen($y));
        $short = $orgs[0];
        foreach ($orgs as $o) if (mb_strpos($o, $short) === false) return false;
        return true;
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
