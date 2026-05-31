<?php

namespace App\Console\Commands;

use App\Models\ExternalEvaluationSession;
use App\Models\ExternalStakeholder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillExternalSessionStakeholder extends Command
{
    protected $signature = 'external:backfill-stakeholder
                            {--dry-run : ไม่ update จริง — แค่ log candidates}
                            {--session= : เฉพาะ session_id เดียว}';

    protected $description = 'Backfill external_stakeholder_id ใน external_evaluation_sessions โดย match จาก (code, org, name, evaluatee)';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');
        $onlyId = $this->option('session');

        $q = ExternalEvaluationSession::query()
            ->whereNull('external_stakeholder_id');
        if ($onlyId) $q->where('id', $onlyId);

        $sessions = $q->get();
        $this->info("scan: {$sessions->count()} sessions, dry-run=" . ($dry ? 'YES' : 'NO'));

        $matched = $ambiguous = $unmatched = 0;

        foreach ($sessions as $session) {
            // match logic: (access_code + evaluatee + normalized evaluator_position) → unique stakeholder
            $candidates = ExternalStakeholder::query()
                ->where('external_access_code_id', $session->external_access_code_id)
                ->where('evaluatee_id', $session->evaluatee_id)
                ->get();

            // ขั้นที่ 1: filter ด้วย contact_person ที่ตรงกับ evaluator_name
            if ($candidates->count() > 1 && $session->evaluator_name) {
                $byName = $candidates->filter(fn ($s) => $s->contact_person
                    && $this->normalize($s->contact_person) === $this->normalize($session->evaluator_name));
                if ($byName->count() === 1) $candidates = $byName;
            }

            // ขั้นที่ 2: filter ด้วย org_name ที่ตรงกับ evaluator_position
            if ($candidates->count() > 1 && $session->evaluator_position) {
                $byOrg = $candidates->filter(fn ($s) => $this->normalize($s->organization_name)
                    === $this->normalize($session->evaluator_position));
                if ($byOrg->count() === 1) $candidates = $byOrg;
            }

            // ขั้นที่ 3: ถ้า session.external_session_id มีอยู่ใน stakeholder row → match ตรง
            if ($candidates->count() > 1) {
                $byLink = $candidates->where('external_session_id', $session->id);
                if ($byLink->count() === 1) $candidates = $byLink;
            }

            $status = match (true) {
                $candidates->count() === 0 => 'unmatched',
                $candidates->count() === 1 => 'matched',
                default => 'ambiguous',
            };

            $matchedRow = $candidates->count() === 1 ? $candidates->first() : null;

            DB::table('external_session_backfill_logs')->insert([
                'external_evaluation_session_id' => $session->id,
                'status' => $status,
                'matched_stakeholder_id' => $matchedRow?->id,
                'candidates' => json_encode($candidates->pluck('id')->all()),
                'reason' => $status === 'ambiguous' ? 'multiple candidates after all filters' :
                            ($status === 'unmatched' ? 'no stakeholder row matches' : null),
                'dry_run' => $dry,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (!$dry && $matchedRow) {
                $session->update(['external_stakeholder_id' => $matchedRow->id]);
            }

            $matched += $status === 'matched' ? 1 : 0;
            $ambiguous += $status === 'ambiguous' ? 1 : 0;
            $unmatched += $status === 'unmatched' ? 1 : 0;
        }

        $this->table(['status', 'count'], [
            ['matched', $matched],
            ['ambiguous', $ambiguous],
            ['unmatched', $unmatched],
        ]);

        return self::SUCCESS;
    }

    private function normalize(?string $s): string
    {
        if (!$s) return '';
        return preg_replace('/\s+/u', '', mb_strtolower(trim($s)));
    }
}
