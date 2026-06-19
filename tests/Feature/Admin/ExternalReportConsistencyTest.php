<?php

// ทำให้ export องค์กรภายนอกทุกตัว "สม่ำเสมอ": ไม่ drop ผู้ส่งที่ชื่อพิมพ์ไม่ตรง pre-list
// + จัดกลุ่ม OPEN (ไม่มี stakeholder) ด้วย eo.name + ไม่ false-pending

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function rcUser(array $o = []): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 999999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 999999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create(array_merge([
        'division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac,
        'birthdate' => '1980-01-01', 'role' => 'user',
    ], $o));
}

function rcXlsx($response): \PhpOffice\PhpSpreadsheet\Spreadsheet
{
    $base = $response->baseResponse ?? $response;
    if ($base instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
        return \PhpOffice\PhpSpreadsheet\IOFactory::load($base->getFile()->getPathname());
    }
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    return \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
}

// completed session + 1 answer = submission จริง (answer-based)
function rcSubmission(int $codeId, int $orgId, int $evaluateeId, int $evalId, string $evaluatorName, ?string $position = null): void
{
    $ses = ExternalEvaluationSession::create([
        'external_access_code_id' => $codeId, 'external_organization_id' => $orgId,
        'evaluatee_id' => $evaluateeId, 'evaluation_id' => $evalId, 'session_token' => 'tok'.$codeId.'-'.$evaluateeId.'-'.rand(1, 9999),
        'evaluator_name' => $evaluatorName, 'evaluator_position' => $position,
        'started_at' => now()->subMinutes(20), 'completed_at' => now(),
    ]);
    $partId = DB::table('parts')->insertGetId(['evaluation_id' => $evalId, 'title' => 'P', 'order' => 1, 'created_at' => now(), 'updated_at' => now()]);
    $qId = DB::table('questions')->insertGetId(['part_id' => $partId, 'title' => 'Q', 'type' => 'rating', 'order' => 1, 'created_at' => now(), 'updated_at' => now()]);
    Answer::create([
        'evaluation_id' => $evalId, 'user_id' => $evaluateeId, 'evaluatee_id' => $evaluateeId,
        'question_id' => $qId, 'value' => '5', 'fiscal_year' => 2026,
        'external_access_code_id' => $codeId, 'external_session_id' => $ses->id,
    ]);
}

beforeEach(function () {
    $this->admin = rcUser(['role' => 'admin']);
    $this->eval  = Evaluation::factory()->create(['status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'external', 'grade_min' => 9, 'grade_max' => 12, 'title' => 'แบบประเมินภายนอก']);
});

it('completed-external: ผู้ส่งที่ชื่อพิมพ์ต่าง spacing จาก contact_person → ไม่ drop (ทุก org)', function () {
    $ee = rcUser(['grade' => '12', 'prename' => 'นาย', 'fname' => 'ผู้ถูก', 'lname' => 'ประเมิน']);
    $org = ExternalOrganization::create(['name' => 'คู่ค้า', 'org_code' => 'KC1', 'is_active' => true]);
    $code = ExternalAccessCode::create(['code' => 'IEAT-'.rand(1000, 9999), 'external_organization_id' => $org->id, 'evaluatee_id' => null, 'evaluation_id' => null, 'fiscal_year' => 2026, 'is_used' => false]);
    DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $code->id, 'evaluatee_id' => $ee->id, 'evaluation_id' => $this->eval->id, 'created_at' => now(), 'updated_at' => now()]);
    DB::table('external_stakeholders')->insert([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $ee->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ค้า', 'organization_name' => 'บริษัท เอสซีจี จำกัด', 'contact_person' => 'นายเอกพงษ์ มิทิน',
        'code' => 'IEAT-S-1', 'created_at' => now(), 'updated_at' => now(),
    ]);
    // submission ชื่อ spacing ต่าง (normalize แล้วตรง แต่ exact ไม่ตรง)
    rcSubmission($code->id, $org->id, $ee->id, $this->eval->id, 'นาย เอกพงษ์  มิทิน', 'บริษัท เอสซีจี จำกัด');

    $res = $this->actingAs($this->admin)->post('/admin/reports/evaluation/export/completed-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = rcXlsx($res)->getActiveSheet();

    $found = false;
    for ($r = 5; $r <= $sheet->getHighestRow(); $r++) {
        if ($sheet->getCell('B'.$r)->getValue() === 'บริษัท เอสซีจี จำกัด') { $found = true; break; }
    }
    expect($found)->toBeTrue(); // ต้องไม่ถูก drop
});

it('group-summary: open submission (ไม่มี stakeholder) → กลุ่ม = eo.name ไม่ใช่ (ไม่ระบุกลุ่ม)', function () {
    $ee = rcUser(['grade' => '13', 'fname' => 'ผวก', 'lname' => 'กนอ']);
    $org = ExternalOrganization::create(['name' => 'บุคคลภายนอกทั่วไป (Open)', 'org_code' => 'OPN', 'is_active' => true]);
    $code = ExternalAccessCode::create(['code' => 'OPEN-'.rand(1000, 9999), 'external_organization_id' => $org->id, 'evaluatee_id' => $ee->id, 'evaluation_id' => $this->eval->id, 'fiscal_year' => 2026, 'is_used' => false]);
    DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $code->id, 'evaluatee_id' => $ee->id, 'evaluation_id' => $this->eval->id, 'created_at' => now(), 'updated_at' => now()]);
    rcSubmission($code->id, $org->id, $ee->id, $this->eval->id, 'นางสาวบุคคล ภายนอก', 'บริษัท เปิดเสรี จำกัด');

    $res = $this->actingAs($this->admin)->post('/admin/reports/evaluation/export/external-group-summary', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = rcXlsx($res)->getSheetByName('สรุปตามกลุ่ม');

    $found = false;
    for ($r = 4; $r <= $sheet->getHighestRow(); $r++) {
        if ($sheet->getCell('A'.$r)->getValue() === 'บุคคลภายนอกทั่วไป (Open)') {
            expect((int) $sheet->getCell('C'.$r)->getValue())->toBeGreaterThanOrEqual(1); // ส่งแล้ว >= 1
            $found = true; break;
        }
    }
    expect($found)->toBeTrue();
});

it('pending-external: stakeholder ที่ส่งแล้ว (ชื่อ variant) → ไม่ false-pending', function () {
    $ee = rcUser(['grade' => '12', 'fname' => 'ผู้ถูก', 'lname' => 'ประเมิน']);
    $org = ExternalOrganization::create(['name' => 'คู่ค้า', 'org_code' => 'KC2', 'is_active' => true]);
    $code = ExternalAccessCode::create(['code' => 'IEAT-'.rand(1000, 9999), 'external_organization_id' => $org->id, 'evaluatee_id' => null, 'evaluation_id' => null, 'fiscal_year' => 2026, 'is_used' => false]);
    DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $code->id, 'evaluatee_id' => $ee->id, 'evaluation_id' => $this->eval->id, 'created_at' => now(), 'updated_at' => now()]);
    DB::table('external_stakeholders')->insert([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $ee->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ค้า', 'organization_name' => 'บริษัท เอสซีจี จำกัด', 'contact_person' => 'นายเอกพงษ์ มิทิน',
        'code' => 'IEAT-S-2', 'created_at' => now(), 'updated_at' => now(),
    ]);
    rcSubmission($code->id, $org->id, $ee->id, $this->eval->id, 'นาย เอกพงษ์  มิทิน', 'บริษัท เอสซีจี จำกัด');

    $res = $this->actingAs($this->admin)->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = rcXlsx($res)->getActiveSheet();
    // ส่งแล้ว → ต้องไม่อยู่ใน pending
    expect($sheet->getCell('A5')->getValue())->toContain('ไม่มีข้อมูล');
});
