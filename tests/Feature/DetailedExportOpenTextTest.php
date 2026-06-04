<?php

use App\Http\Controllers\AdminEvaluationReportController;
use App\Models\Answer;
use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\Option;
use App\Models\Part;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function makeOrgUserOT(array $overrides = []): User
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

function callGetDetailedData(int $evaluationId, int $fiscalYear): array
{
    $controller = app(AdminEvaluationReportController::class);
    $ref = new ReflectionMethod($controller, 'getDetailedEvaluationData');
    $ref->setAccessible(true);
    return $ref->invoke($controller, $evaluationId, $fiscalYear, null, null);
}

beforeEach(function () {
    $this->evaluator = makeOrgUserOT(['role' => 'user', 'grade' => '7']);
    $this->evaluatee = makeOrgUserOT(['role' => 'user', 'grade' => '12']);
    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
        'title' => 'แบบประเมิน 360 ปี 2569',
    ]);
    $part = Part::factory()->create(['evaluation_id' => $this->eval->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);

    $this->ratingQ = Question::factory()->create([
        'part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'rating', 'order' => 1,
    ]);
    $this->ratingOpt = Option::factory()->create(['question_id' => $this->ratingQ->id, 'label' => 'ดีมาก', 'score' => 5]);

    $this->openQ = Question::factory()->create([
        'part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'open_text', 'order' => 2,
    ]);

    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id,
        'angle' => 'top',
        'fiscal_year' => '2026',
        'submitted_at' => now(),
    ]);

    // rating: value = option id (resolve เป็น label)
    Answer::create([
        'evaluation_id' => $this->eval->id, 'user_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id, 'question_id' => $this->ratingQ->id,
        'value' => (string) $this->ratingOpt->id, 'fiscal_year' => 2026,
    ]);

    // open_text: value = ข้อความที่ผู้ประเมินพิมพ์
    $this->openTextAnswer = 'ควรพัฒนาการสื่อสารในทีมให้มากขึ้น';
    Answer::create([
        'evaluation_id' => $this->eval->id, 'user_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id, 'question_id' => $this->openQ->id,
        'value' => $this->openTextAnswer, 'fiscal_year' => 2026,
    ]);
});

it('exports open_text question rows in detailed report (currently dropped by inner join)', function () {
    $rows = callGetDetailedData($this->eval->id, 2026);

    $openRow = collect($rows)->firstWhere('question_id', $this->openQ->id);
    expect($openRow)->not->toBeNull();
});

it('open_text answer shows the typed text as the answer value', function () {
    $rows = callGetDetailedData($this->eval->id, 2026);

    $openRow = collect($rows)->firstWhere('question_id', $this->openQ->id);
    // renderer ใช้ option_label ?? raw_value → open_text ต้องได้ข้อความที่ตอบ
    $shown = $openRow->option_label ?? ($openRow->raw_value ?? null);
    expect($shown)->toBe($this->openTextAnswer);
});

it('rating rows remain present after the fix (regression guard)', function () {
    $rows = callGetDetailedData($this->eval->id, 2026);

    $ratingRow = collect($rows)->firstWhere('question_id', $this->ratingQ->id);
    expect($ratingRow)->not->toBeNull();
    expect($ratingRow->option_label)->toBe('ดีมาก');
});
