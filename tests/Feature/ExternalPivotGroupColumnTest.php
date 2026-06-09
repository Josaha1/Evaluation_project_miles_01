<?php

use App\Models\Answer;
use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use App\Models\Part;
use App\Models\Question;
use App\Models\User;
use App\Services\EvaluationExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

uses(RefreshDatabase::class);

function makeOrgUserGC(array $overrides = []): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 9999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 9999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 9999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 9999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create(array_merge([
        'division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac,
        'birthdate' => '1980-01-01',
    ], $overrides));
}

function invokePivot(int $evalId, array $filters, bool $self, bool $ext): \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet
{
    $svc = app(EvaluationExportService::class);
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $m = new ReflectionMethod($svc, 'buildPivotSheet');
    $m->setAccessible(true);
    $m->invoke($svc, $sheet, $evalId, $filters, null, $self, $ext);
    return $sheet;
}

function makeRatingEval(): array
{
    $eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'internal',
        'grade_min' => 9, 'grade_max' => 12, 'title' => 'แบบประเมิน rating 2569',
    ]);
    $part = Part::factory()->create(['evaluation_id' => $eval->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);
    $q = Question::factory()->create(['part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'rating', 'order' => 1]);
    return [$eval, $q];
}

// buildPivotSheet ใช้ CONCAT ใน raw SQL → รันได้บน mysql เท่านั้น (sqlite ไม่รองรับ)
beforeEach(function () {
    if (DB::connection()->getDriverName() === 'sqlite') {
        $this->markTestSkipped('buildPivotSheet ใช้ CONCAT ใน raw SQL — รันบน mysql เท่านั้น');
    }
});

it('external pivot: แยก "ชื่อบริษัท" (I) + "กลุ่ม" (J) ออกจากชื่อผู้ประเมิน (H)', function () {
    [$eval, $q] = makeRatingEval();
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'สื่อมวลชน']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    // stakeholder = ชื่อบริษัทจริง (organization_name) ผูกกับ session ผ่าน external_stakeholder_id
    $stakeholder = ExternalStakeholder::create([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $evaluatee->id,
        'fiscal_year' => 2026, 'group_label' => 'สื่อมวลชน', 'organization_name' => 'บริษัท ABC จำกัด',
    ]);
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'external_stakeholder_id' => $stakeholder->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'นายประเสริฐ หวังศักราทิตย์',
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, true);

    expect($sheet->getCell('H5')->getValue())->toBe('ผู้ประเมิน');
    expect($sheet->getCell('I5')->getValue())->toBe('ชื่อบริษัท');
    expect($sheet->getCell('J5')->getValue())->toBe('กลุ่ม');
    expect($sheet->getCell('K5')->getValue())->toBe('องศาการประเมิน');

    expect($sheet->getCell('H6')->getValue())->toBe('นายประเสริฐ หวังศักราทิตย์');
    expect($sheet->getCell('I6')->getValue())->toBe('บริษัท ABC จำกัด');
    expect($sheet->getCell('J6')->getValue())->toBe('สื่อมวลชน');
});

it('external pivot: ชื่อพิมพ์มือมีคำนำหน้า "นาย" → normalize match contact_person → ได้บริษัท', function () {
    [$eval, $q] = makeRatingEval();
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'สื่อมวลชน']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    // master list เก็บ contact_person ไม่มีคำนำหน้า + มีเบอร์ต่อท้ายหลังบรรทัดใหม่
    ExternalStakeholder::create([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $evaluatee->id,
        'fiscal_year' => 2026, 'group_label' => 'สื่อมวลชน', 'organization_name' => 'บริษัท XYZ จำกัด',
        'contact_person' => "สมชาย ใจดี\n081-234-5678",
    ]);
    // ผู้ประเมินพิมพ์ "นายสมชาย ใจดี" (มีคำนำหน้า, ไม่มีเบอร์) — ไม่ผูก stakeholder_id
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'นายสมชาย ใจดี',
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, true);

    expect($sheet->getCell('I6')->getValue())->toBe('บริษัท XYZ จำกัด');
});

it('external pivot: ชื่อพิมพ์เป็น substring ของ contact (กลุ่มชี้บริษัทเดียว) → ได้บริษัทจริง', function () {
    [$eval, $q] = makeRatingEval();
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'สื่อมวลชน']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    ExternalStakeholder::create([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $evaluatee->id,
        'fiscal_year' => 2026, 'group_label' => 'สื่อมวลชน', 'organization_name' => 'บริษัท เดลต้า จำกัด',
        'contact_person' => 'ปัญญดา วงศ์ใหญ่',
    ]);
    // พิมพ์ชื่อต้นอย่างเดียว "ปัญญดา" (substring ของ contact) — ไม่ผูก stakeholder_id, ไม่ exact match
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'ปัญญดา',
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, true);

    expect($sheet->getCell('I6')->getValue())->toBe('บริษัท เดลต้า จำกัด');
});

it('external pivot: จับบริษัทไม่ได้เลย → fallback "(ไม่ระบุหน่วยงาน)" (ไม่โชว์ชื่อคน)', function () {
    [$eval, $q] = makeRatingEval();
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'สื่อมวลชน']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'นายไม่ระบุ',
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, true);

    expect($sheet->getCell('I6')->getValue())->toBe('(ไม่ระบุหน่วยงาน)');
});

it('external pivot: link ตรง external_stakeholders.external_session_id → ได้บริษัท (ไม่ต้อง match ชื่อ)', function () {
    [$eval, $q] = makeRatingEval();
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'สื่อมวลชน']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    // ชื่อพิมพ์เพี้ยนจน match ไม่ได้ แต่ stakeholder ชี้ session ตรง ๆ
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'Xyz',
    ]);
    ExternalStakeholder::create([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $evaluatee->id,
        'fiscal_year' => 2026, 'group_label' => 'สื่อมวลชน', 'organization_name' => 'บริษัท แกมม่า จำกัด',
        'contact_person' => 'คนละชื่อ', 'external_session_id' => $session->id,
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, true);

    expect($sheet->getCell('I6')->getValue())->toBe('บริษัท แกมม่า จำกัด');
});

it('regular pivot (ผู้บริหาร/พนักงาน): มีคอลัมน์ "ตำแหน่งของผู้ประเมิน" (I) + แสดงตำแหน่ง', function () {
    [$eval, $q] = makeRatingEval();
    $evaluator = makeOrgUserGC(['role' => 'user', 'grade' => '7']);
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);
    $evaluatorPos = DB::table('positions')->where('id', $evaluator->position_id)->value('title');

    EvaluationAssignment::factory()->create([
        'evaluator_id' => $evaluator->id, 'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $eval->id, 'angle' => 'top', 'fiscal_year' => '2026', 'submitted_at' => now(),
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluator->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, false);

    expect($sheet->getCell('H5')->getValue())->toBe('ผู้ประเมิน');
    expect($sheet->getCell('I5')->getValue())->toBe('ตำแหน่งของผู้ประเมิน');
    expect($sheet->getCell('J5')->getValue())->toBe('องศาการประเมิน');
    expect($sheet->getCell('I6')->getValue())->toBe($evaluatorPos);
});
