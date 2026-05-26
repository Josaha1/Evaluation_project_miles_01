<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function makeOrgUserCE(array $overrides = []): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 9999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 9999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 9999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 9999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);

    return User::factory()->create(array_merge([
        'division_id'   => $div,
        'department_id' => $dep,
        'position_id'   => $pos,
        'faction_id'    => $fac,
        'birthdate'     => '1980-01-01',
    ], $overrides));
}

beforeEach(function () {
    $this->admin     = makeOrgUserCE(['role' => 'admin']);
    $this->evaluator = makeOrgUserCE(['role' => 'user', 'grade' => '10']);
    $this->evaluatee = makeOrgUserCE(['role' => 'user', 'grade' => '12']);

    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
    ]);
});

// ─── COMPLETED INTERNAL ───────────────────────────────────────────────

it('completed-internal: returns 200 + xlsx', function () {
    EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2026',
        'angle'         => 'top',
        'submitted_at'  => now(),
    ]);

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/completed-evaluators-internal', ['fiscal_year' => 2026]);

    $res->assertOk();
    expect($res->headers->get('content-type'))->toContain('spreadsheetml');
});

it('completed-internal: excludes pending (submitted_at NULL)', function () {
    EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2026',
        'angle'         => 'top',
        'submitted_at'  => null,
    ]);

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/completed-evaluators-internal', ['fiscal_year' => 2026]);

    $res->assertOk();
});

it('completed-internal: non-admin blocked', function () {
    $user = makeOrgUserCE(['role' => 'user']);
    $res = $this->actingAs($user)
        ->post('/admin/reports/evaluation/export/completed-evaluators-internal', ['fiscal_year' => 2026]);
    expect($res->status())->toBeIn([302, 403]);
});

// ─── EXTERNAL COMPLETED / PENDING ─────────────────────────────────────

function makeExtPair(int $evaluateeId, int $evalId, ?\Carbon\Carbon $completedAt): array
{
    $org = ExternalOrganization::create([
        'name'           => 'Org '.rand(1, 9999),
        'org_code'       => 'OC'.rand(100, 999),
        'contact_person' => 'Contact',
        'contact_email'  => 'c@x.test',
        'contact_phone'  => '0800000000',
        'is_active'      => true,
    ]);

    $code = ExternalAccessCode::create([
        'code'                     => 'EAC'.rand(100000, 999999),
        'external_organization_id' => $org->id,
        'evaluatee_id'             => $evaluateeId,
        'evaluation_id'            => $evalId,
        'fiscal_year'              => 2026,
        'is_used'                  => $completedAt !== null,
    ]);

    if ($completedAt !== null) {
        ExternalEvaluationSession::create([
            'external_access_code_id'  => $code->id,
            'external_organization_id' => $org->id,
            'evaluatee_id'             => $evaluateeId,
            'evaluation_id'            => $evalId,
            'session_token'            => 'tok'.$code->id,
            'started_at'               => $completedAt->copy()->subMinutes(30),
            'completed_at'             => $completedAt,
        ]);
    }

    return [$org, $code];
}

it('completed-external: returns 200 + xlsx', function () {
    makeExtPair($this->evaluatee->id, $this->eval->id, now());

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/completed-evaluators-external', ['fiscal_year' => 2026]);

    $res->assertOk();
    expect($res->headers->get('content-type'))->toContain('spreadsheetml');
});

it('completed-external: 200 with placeholder when none', function () {
    makeExtPair($this->evaluatee->id, $this->eval->id, null);

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/completed-evaluators-external', ['fiscal_year' => 2026]);

    $res->assertOk();
});

it('pending-external: returns 200 + xlsx for unfinished', function () {
    makeExtPair($this->evaluatee->id, $this->eval->id, null);

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);

    $res->assertOk();
    expect($res->headers->get('content-type'))->toContain('spreadsheetml');
});

it('pending-external: excludes already completed', function () {
    makeExtPair($this->evaluatee->id, $this->eval->id, now());

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);

    $res->assertOk();
});

it('pending-external: non-admin blocked', function () {
    $user = makeOrgUserCE(['role' => 'user']);
    $res = $this->actingAs($user)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    expect($res->status())->toBeIn([302, 403]);
});

it('completed-external: non-admin blocked', function () {
    $user = makeOrgUserCE(['role' => 'user']);
    $res = $this->actingAs($user)
        ->post('/admin/reports/evaluation/export/completed-evaluators-external', ['fiscal_year' => 2026]);
    expect($res->status())->toBeIn([302, 403]);
});

// ─── v3 SCHEMA (stakeholder-based) — pending-external ─────────────────
// access code มี evaluatee_id=NULL + ใช้ external_stakeholders + pivot
// ตรง schema จริงบน prod FY2026

function loadXlsx($response): \PhpOffice\PhpSpreadsheet\Spreadsheet
{
    $baseResponse = $response->baseResponse ?? $response;
    if ($baseResponse instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
        return \PhpOffice\PhpSpreadsheet\IOFactory::load($baseResponse->getFile()->getPathname());
    }
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    return \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
}

function makeV3Stakeholder(int $evaluateeId, int $evalId, ?int $sessionId = null, array $stOverrides = []): array
{
    $org = ExternalOrganization::create([
        'name' => $stOverrides['group_label'] ?? 'คู่ค้า', // ext_org.name = หมวด
        'org_code' => '4EF',
        'contact_person' => null, // contact จริงอยู่ที่ stakeholder
        'contact_email' => null,
        'contact_phone' => null,
        'is_active' => true,
    ]);
    $code = ExternalAccessCode::create([
        'code' => 'IEAT-V3-'.rand(100, 999),
        'external_organization_id' => $org->id,
        'evaluatee_id' => null, // v3: NULL
        'evaluation_id' => null, // v3: NULL
        'fiscal_year' => 2026,
        'is_used' => false,
    ]);
    DB::table('external_code_evaluatees')->insert([
        'external_access_code_id' => $code->id,
        'evaluatee_id' => $evaluateeId,
        'evaluation_id' => $evalId,
        'created_at' => now(), 'updated_at' => now(),
    ]);
    DB::table('external_stakeholders')->insert(array_merge([
        'external_access_code_id' => $code->id,
        'evaluatee_id' => $evaluateeId,
        'fiscal_year' => 2026,
        'group_label' => 'คู่ค้า',
        'organization_name' => 'บริษัท เอสซีจี เซรามิกส์ จำกัด',
        'contact_person' => 'นายเอกพงษ์ มิทิน',
        'contact_info' => '0818447766',
        'coordinator' => 'นางสาวประสาน',
        'code' => 'IEAT-S-ABC',
        'external_session_id' => $sessionId,
        'created_at' => now(), 'updated_at' => now(),
    ], $stOverrides));
    return [$org, $code];
}

it('pending-external v3: column A = หมวด (group_label จาก ext_org.name)', function () {
    Evaluation::find($this->eval->id)->update(['title' => 'แบบประเมิน 360 ปี 2569']);
    makeV3Stakeholder($this->evaluatee->id, $this->eval->id);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    expect($sheet->getCell('A5')->getValue())->toBe('คู่ค้า');
});

it('pending-external v3: column B = ชื่อหน่วยงานจริง จาก external_stakeholders.organization_name', function () {
    makeV3Stakeholder($this->evaluatee->id, $this->eval->id);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    expect($sheet->getCell('B5')->getValue())->toBe('บริษัท เอสซีจี เซรามิกส์ จำกัด');
});

it('pending-external v3: column C/D/E = contact_person/contact_info/coordinator', function () {
    makeV3Stakeholder($this->evaluatee->id, $this->eval->id);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    expect($sheet->getCell('C5')->getValue())->toBe('นายเอกพงษ์ มิทิน');
    expect($sheet->getCell('D5')->getValue())->toBe('0818447766');
    expect($sheet->getCell('E5')->getValue())->toBe('นางสาวประสาน');
});

it('pending-external v3: column F = stakeholder.code (รหัส login เฉพาะ stakeholder)', function () {
    makeV3Stakeholder($this->evaluatee->id, $this->eval->id, null, ['code' => 'IEAT-S-XYZ123']);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    expect($sheet->getCell('F5')->getValue())->toBe('IEAT-S-XYZ123');
});

it('pending-external v3: column G = evaluatee name + H = grade + I = evaluation title', function () {
    $ee = makeOrgUserCE(['role' => 'user', 'prename' => 'นาย', 'fname' => 'สมชาย', 'lname' => 'ใจดี', 'grade' => '11']);
    Evaluation::find($this->eval->id)->update(['title' => 'แบบประเมิน 360 ปี 2569']);
    makeV3Stakeholder($ee->id, $this->eval->id);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    expect($sheet->getCell('G5')->getValue())->toContain('สมชาย');
    expect($sheet->getCell('G5')->getValue())->toContain('ใจดี');
    expect((string) $sheet->getCell('H5')->getValue())->toBe('11');
    expect($sheet->getCell('I5')->getValue())->toBe('แบบประเมิน 360 ปี 2569');
});

it('pending-external v3: 1 row per stakeholder (ไม่ Cartesian กับ sessions)', function () {
    // 1 stakeholder + 2 sessions ไม่เกี่ยว → ต้องเหลือ 1 row (ไม่ใช่ 2)
    [$org, $code] = makeV3Stakeholder($this->evaluatee->id, $this->eval->id);
    // 2 sessions ของ access_code นี้ แต่ของ evaluatee อื่น (ไม่เกี่ยว stakeholder row นี้)
    $other = makeOrgUserCE(['role' => 'user']);
    ExternalEvaluationSession::create([
        'external_access_code_id' => $code->id,
        'external_organization_id' => $org->id,
        'evaluatee_id' => $other->id,
        'evaluation_id' => $this->eval->id,
        'session_token' => 'tok1', 'started_at' => now(),
    ]);
    ExternalEvaluationSession::create([
        'external_access_code_id' => $code->id,
        'external_organization_id' => $org->id,
        'evaluatee_id' => $other->id,
        'evaluation_id' => $this->eval->id,
        'session_token' => 'tok2', 'started_at' => now(),
    ]);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    // row 5 = data + row 6 ต้องว่าง (ไม่มีแถวที่ 2)
    expect($sheet->getCell('F5')->getValue())->not->toBeEmpty();
    expect($sheet->getCell('F6')->getValue())->toBeEmpty();
});

it('pending-external v3: excludes stakeholders ที่มี completed session', function () {
    [$org, $code] = makeV3Stakeholder($this->evaluatee->id, $this->eval->id);
    $session = ExternalEvaluationSession::create([
        'external_access_code_id' => $code->id,
        'external_organization_id' => $org->id,
        'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id,
        'session_token' => 'tok-done',
        'started_at' => now()->subHour(),
        'completed_at' => now(),
    ]);
    DB::table('external_stakeholders')->where('external_access_code_id', $code->id)
        ->update(['external_session_id' => $session->id]);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators-external', ['fiscal_year' => 2026]);
    $res->assertOk();
    $sheet = loadXlsx($res)->getActiveSheet();
    expect($sheet->getCell('A5')->getValue())->toContain('ไม่มีข้อมูล');
});
