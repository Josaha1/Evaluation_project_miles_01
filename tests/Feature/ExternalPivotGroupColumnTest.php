<?php

use App\Models\Answer;
use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
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

it('external pivot: แยกคอลัมน์ "กลุ่ม" (I) ออกจากชื่อผู้ประเมิน (H)', function () {
    [$eval, $q] = makeRatingEval();
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'สื่อมวลชน']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'นายประเสริฐ หวังศักราทิตย์',
    ]);
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $q->id, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $sheet = invokePivot($eval->id, ['fiscal_year' => 2026], false, true);

    expect($sheet->getCell('H5')->getValue())->toBe('ผู้ประเมิน');
    expect($sheet->getCell('I5')->getValue())->toBe('กลุ่ม');
    expect($sheet->getCell('J5')->getValue())->toBe('องศาการประเมิน');

    expect($sheet->getCell('H6')->getValue())->toBe('นายประเสริฐ หวังศักราทิตย์');
    expect($sheet->getCell('I6')->getValue())->toBe('สื่อมวลชน');
});

it('regular pivot: คอลัมน์คงเดิม (ไม่มี "กลุ่ม", ไม่ขยับ)', function () {
    [$eval, $q] = makeRatingEval();
    $evaluator = makeOrgUserGC(['role' => 'user', 'grade' => '7']);
    $evaluatee = makeOrgUserGC(['role' => 'user', 'grade' => '12']);

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
    expect($sheet->getCell('I5')->getValue())->toBe('องศาการประเมิน');
});
