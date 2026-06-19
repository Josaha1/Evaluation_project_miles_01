<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalStakeholder extends Model
{
    protected $fillable = [
        'external_access_code_id',
        'evaluatee_id',
        'fiscal_year',
        'group_label',
        'sub_group',
        'sequence_no',
        'organization_name',
        'contact_person',
        'contact_info',
        'coordinator',
        'code',
        'source_sheet',
        'source_row',
        'external_session_id',
    ];

    /**
     * Normalize an organization name for comparison: lowercase + strip ALL whitespace.
     * Example: "บริษัท X จำกัด (มหาชน)" and "บริษัท X จำกัด(มหาชน)" → same key.
     * Used for cross-group consolidation match where Excel files spell the same
     * company slightly differently (whitespace before parenthesis, etc.).
     */
    public static function normalizeName(?string $name): string
    {
        if (! $name) return '';
        return preg_replace('/\s+/u', '', mb_strtolower(trim($name)));
    }

    /** คีย์เทียบชื่อผู้ประเมิน↔contact_person: ตัดคำนำหน้า + ช่องว่าง + lowercase (รวม variant สเปซ/คำนำหน้า ใช้กับชื่ออังกฤษได้). */
    public static function matchKey(?string $name): string
    {
        if (! $name) return '';
        $s = mb_strtolower(trim(preg_split('/\r|\n/', $name)[0]));
        foreach (['นางสาว', 'น.ส.', 'นาย', 'นาง', 'คุณ', 'ดร.', 'ว่าที่ร้อยตรี', 'ว่าที่ ร.ต.', 'ว่าที่'] as $p) {
            $pp = mb_strtolower($p);
            if (mb_strpos($s, $pp) === 0) { $s = mb_substr($s, mb_strlen($pp)); break; }
        }
        return preg_replace('/\s+/u', '', $s);
    }

    /** คีย์ระบุตัวคน: บรรทัดแรก → ตัดคำนำหน้า → ตัด "ตำแหน่ง/เบอร์" → เก็บเฉพาะอักษรไทย (รวม variant ชื่อเดียวกัน). */
    public static function personKey(?string $name): string
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

    /** นับ token ชื่อ (อักษรไทย) — กันชื่อโดด 1 คำ/ชื่ออังกฤษ match มั่ว. */
    public static function nameTokens(?string $name): int
    {
        if (! $name) return 0;
        $s = preg_split('/\r|\n/', $name)[0];
        $s = mb_strtolower(trim($s));
        foreach (['นางสาว', 'น.ส.', 'นาย', 'นาง', 'คุณ', 'ดร.', 'ว่าที่ร้อยตรี', 'ว่าที่ ร.ต.', 'ว่าที่'] as $p) {
            $pp = mb_strtolower($p);
            if (mb_strpos($s, $pp) === 0) { $s = mb_substr($s, mb_strlen($pp)); break; }
        }
        $cut = mb_strpos($s, 'ตำแหน่ง');
        if ($cut !== false) $s = mb_substr($s, 0, $cut);
        return count(array_filter(preg_split('/\s+/u', trim($s)), fn ($t) => preg_match('/[ก-๙]/u', $t)));
    }

    /** แก่นชื่อบริษัท: ตัดวงเล็บ + บริษัท/จำกัด/มหาชน + เก็บเฉพาะอักษรไทย. */
    public static function orgCore(?string $org): string
    {
        if (! $org) return '';
        $s = mb_strtolower(trim($org));
        $s = preg_replace('/\(.*?\)/u', '', $s);
        foreach (['บริษัท', 'จำกัด', 'มหาชน', 'หจก.', 'ห้างหุ้นส่วน'] as $w) $s = str_replace(mb_strtolower($w), '', $s);
        return preg_replace('/[^ก-๙]/u', '', $s);
    }

    public static function sameCompany(?string $a, ?string $b): bool
    {
        if (! $a || ! $b) return false;
        return $a === $b || mb_strpos($a, $b) !== false || mb_strpos($b, $a) !== false;
    }

    /**
     * row stakeholder ทั้งหมดของ "คนเดียวกัน" ในปีงบ — รวม variant ชื่อ/บริษัท + ข้าม code/กลุ่ม.
     * ใช้ scope ผู้ประเมินภายนอกให้เห็น/ประเมินครบใน login เดียว (และ derive evaluatee/code ที่สอดคล้องกัน).
     * ถ้าชื่อไม่เข้าเกณฑ์ (โดด/อังกฤษ) → fallback exact contact + normalize org (พฤติกรรมเดิม กันมั่ว).
     */
    public static function identityRows($fiscalYear, ?string $contactName, ?string $orgName): \Illuminate\Support\Collection
    {
        $all = static::where('fiscal_year', $fiscalYear)->get();
        $key = static::personKey($contactName);

        if ($key === '' || static::nameTokens($contactName) < 2) {
            $orgN = static::normalizeName($orgName);
            return $all->filter(fn ($s) => static::normalizeName($s->organization_name) === $orgN
                && (empty($contactName) || $s->contact_person === $contactName))->values();
        }

        $orgCore = static::orgCore($orgName);
        return $all->filter(fn ($s) => static::personKey($s->contact_person) === $key
            && static::sameCompany(static::orgCore($s->organization_name), $orgCore))->values();
    }

    /** evaluatee_id ทั้งหมดของคนเดียวกัน (จาก identityRows). */
    public static function evaluateeScope($fiscalYear, ?string $contactName, ?string $orgName): array
    {
        return static::identityRows($fiscalYear, $contactName, $orgName)
            ->pluck('evaluatee_id')->unique()->values()->all();
    }

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(ExternalAccessCode::class, 'external_access_code_id');
    }

    public function evaluatee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExternalEvaluationSession::class, 'external_session_id');
    }
}
