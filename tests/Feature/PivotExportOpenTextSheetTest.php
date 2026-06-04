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
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

uses(RefreshDatabase::class);

function makeOrgUserPV(array $overrides = []): User
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

function invokeAppendOpenText(int $evalId, array $filters, bool $self, bool $ext): string
{
    $svc = app(EvaluationExportService::class);
    $spreadsheet = new Spreadsheet();
    $m = new ReflectionMethod($svc, 'appendOpenTextSheet');
    $m->setAccessible(true);
    $m->invoke($svc, $spreadsheet, $evalId, $filters, $self, $ext);
    $tmp = tempnam(sys_get_temp_dir(), 'ot').'.xlsx';
    (new Xlsx($spreadsheet))->save($tmp);
    return $tmp;
}

function openTextSheetText(string $path): string
{
    $loaded = IOFactory::load($path);
    if (!$loaded->sheetNameExists('คำถามปลายเปิด')) {
        return '__NO_SHEET__';
    }
    $rows = $loaded->getSheetByName('คำถามปลายเปิด')->toArray();
    return collect($rows)->flatten()->filter()->implode(' | ');
}

function makeEvalWithOpenQuestion(): array
{
    $eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'internal',
        'grade_min' => 9, 'grade_max' => 12, 'title' => 'แบบประเมิน 360 ปี 2569',
    ]);
    $part = Part::factory()->create(['evaluation_id' => $eval->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);
    $openQ = Question::factory()->create(['part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'open_text', 'order' => 1]);
    return [$eval, $openQ];
}

it('regular mode (governor/exec/employee): open_text sheet shows the typed answer', function () {
    [$eval, $openQ] = makeEvalWithOpenQuestion();
    $evaluator = makeOrgUserPV(['role' => 'user', 'grade' => '7']);
    $evaluatee = makeOrgUserPV(['role' => 'user', 'grade' => '12']);

    EvaluationAssignment::factory()->create([
        'evaluator_id' => $evaluator->id, 'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $eval->id, 'angle' => 'top', 'fiscal_year' => '2026', 'submitted_at' => now(),
    ]);
    $text = 'ควรพัฒนาการสื่อสารในทีมให้มากขึ้น';
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluator->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $openQ->id, 'value' => $text, 'fiscal_year' => 2026,
    ]);

    $path = invokeAppendOpenText($eval->id, ['fiscal_year' => 2026], false, false);
    $out = openTextSheetText($path);
    @unlink($path);

    expect($out)->toContain($text);
});

it('self mode: open_text sheet shows the self-evaluation answer', function () {
    [$eval, $openQ] = makeEvalWithOpenQuestion();
    $user = makeOrgUserPV(['role' => 'user', 'grade' => '12']);

    $text = 'จุดที่ฉันอยากพัฒนาคือการบริหารเวลา';
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $user->id, 'evaluatee_id' => $user->id,
        'question_id' => $openQ->id, 'value' => $text, 'fiscal_year' => 2026,
    ]);

    $path = invokeAppendOpenText($eval->id, ['fiscal_year' => 2026], true, false);
    $out = openTextSheetText($path);
    @unlink($path);

    expect($out)->toContain($text);
});

it('external mode: open_text sheet shows external evaluator answer + org name', function () {
    [$eval, $openQ] = makeEvalWithOpenQuestion();
    $evaluatee = makeOrgUserPV(['role' => 'user', 'grade' => '12']);

    $org = ExternalOrganization::factory()->create(['name' => 'บริษัท ทดสอบ จำกัด']);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id, 'evaluation_id' => $eval->id,
        'evaluatee_id' => $evaluatee->id, 'fiscal_year' => '2026',
    ]);
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluation_id' => $eval->id, 'evaluatee_id' => $evaluatee->id, 'evaluator_name' => 'คุณสมชาย ภายนอก',
    ]);

    $text = 'องค์กรภายนอกเห็นว่าควรปรับปรุงการประสานงาน';
    Answer::create([
        'evaluation_id' => $eval->id, 'user_id' => $evaluatee->id, 'evaluatee_id' => $evaluatee->id,
        'question_id' => $openQ->id, 'value' => $text, 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $session->id,
    ]);

    $path = invokeAppendOpenText($eval->id, ['fiscal_year' => 2026], false, true);
    $out = openTextSheetText($path);
    @unlink($path);

    expect($out)->toContain($text);
    expect($out)->toContain('บริษัท ทดสอบ จำกัด');
});

it('no open_text questions → no sheet added', function () {
    $eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'internal',
        'grade_min' => 9, 'grade_max' => 12,
    ]);
    $part = Part::factory()->create(['evaluation_id' => $eval->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);
    Question::factory()->create(['part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'rating', 'order' => 1]);

    $path = invokeAppendOpenText($eval->id, ['fiscal_year' => 2026], false, false);
    $out = openTextSheetText($path);
    @unlink($path);

    expect($out)->toBe('__NO_SHEET__');
});
