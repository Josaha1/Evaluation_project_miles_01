<?php

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

function makeOrgUserDS(array $overrides = []): User
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

beforeEach(function () {
    $this->evaluator = makeOrgUserDS(['role' => 'user', 'grade' => '7']);
    $this->evaluatee = makeOrgUserDS(['role' => 'user', 'grade' => '12']);
    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
        'title' => 'แบบประเมิน 360 ปี 2569',
    ]);
    $part = Part::factory()->create(['evaluation_id' => $this->eval->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);
    $this->q = Question::factory()->create([
        'part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'rating', 'order' => 1,
    ]);
    $this->opt = Option::factory()->create(['question_id' => $this->q->id, 'label' => 'L1', 'score' => 1]);
});

it('answered-but-not-submitted assignment is NOT counted as completed', function () {
    // assignment ตอบครบ (progress=100) แต่ยังไม่กดส่ง
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id,
        'angle' => 'top',
        'fiscal_year' => '2026',
        'submitted_at' => null,
    ]);
    Answer::create([
        'evaluation_id' => $this->eval->id,
        'user_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'question_id' => $this->q->id,
        'option_id' => $this->opt->id,
        'fiscal_year' => 2026,
    ]);

    $res = $this->actingAs($this->evaluator)->get(route('dashboard'));
    $res->assertOk();
    $props = $res->viewData('page')['props'];

    // target evaluation มี 1 assignment ตอบครบ แต่ submitted_at NULL → total_completed = 0
    $evalGroups = collect($props['evaluation_groups'])->values();
    expect($evalGroups)->not->toBeEmpty();
    expect($evalGroups[0]['total_completed'])->toBe(0);
    $angleTop = collect($evalGroups[0]['angle_groups'])->firstWhere('angle', 'top');
    expect($angleTop['evaluatees'][0]['is_submitted'])->toBeFalse();
    expect($angleTop['evaluatees'][0]['progress'])->toBeGreaterThanOrEqual(100);
});

it('submitted assignment IS counted as completed', function () {
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id,
        'angle' => 'top',
        'fiscal_year' => '2026',
        'submitted_at' => now(),
    ]);
    Answer::create([
        'evaluation_id' => $this->eval->id,
        'user_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'question_id' => $this->q->id,
        'option_id' => $this->opt->id,
        'fiscal_year' => 2026,
    ]);

    $res = $this->actingAs($this->evaluator)->get(route('dashboard'));
    $res->assertOk();
    $props = $res->viewData('page')['props'];

    $evalGroups = collect($props['evaluation_groups'])->values();
    expect($evalGroups[0]['total_completed'])->toBe(1);
    $angleTop = collect($evalGroups[0]['angle_groups'])->firstWhere('angle', 'top');
    expect($angleTop['evaluatees'][0]['is_submitted'])->toBeTrue();
});

it('assigned-eval show: answered-but-not-submitted ไม่ถูก redirect ออก (ต้องเปิด form ให้กดส่งได้)', function () {
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id,
        'angle' => 'top',
        'fiscal_year' => '2026',
        'submitted_at' => null,
    ]);
    // ตอบครบทุกข้อ
    Answer::create([
        'evaluation_id' => $this->eval->id,
        'user_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'question_id' => $this->q->id,
        'option_id' => $this->opt->id,
        'fiscal_year' => 2026,
    ]);

    $res = $this->actingAs($this->evaluator)
        ->get('/assigned-evaluations/'.$this->evaluatee->id.'?fiscal_year=2026');

    // ก่อน fix: redirect ไป /dashboard with 'ประเมินเสร็จสมบูรณ์แล้ว'
    // หลัง fix: redirect ไป /assigned-evaluations/.../step/N/group/G (เปิดหน้า form ให้กดส่ง)
    $res->assertRedirect();
    expect($res->headers->get('Location'))->not->toContain('/dashboard');
    expect($res->headers->get('Location'))->toContain('/assigned-evaluations/');
    expect((string) session('success'))->not->toContain('ประเมินเสร็จสมบูรณ์');
});

it('assigned-eval show: submitted แล้ว ยัง block (กลับ dashboard with error)', function () {
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id,
        'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id,
        'angle' => 'top',
        'fiscal_year' => '2026',
        'submitted_at' => now(),
    ]);

    $res = $this->actingAs($this->evaluator)
        ->get('/assigned-evaluations/'.$this->evaluatee->id.'?fiscal_year=2026');

    $res->assertRedirect();
    expect(session('error'))->toContain('ส่งแบบประเมิน');
});

it('angle_summary completed_count uses is_submitted not progress', function () {
    // 2 assignments: 1 submitted, 1 answered-only
    $ee2 = makeOrgUserDS(['role' => 'user', 'grade' => '12']);
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id, 'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $this->eval->id, 'angle' => 'top',
        'fiscal_year' => '2026', 'submitted_at' => now(),
    ]);
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id, 'evaluatee_id' => $ee2->id,
        'evaluation_id' => $this->eval->id, 'angle' => 'top',
        'fiscal_year' => '2026', 'submitted_at' => null,
    ]);
    foreach ([$this->evaluatee->id, $ee2->id] as $eeId) {
        Answer::create([
            'evaluation_id' => $this->eval->id, 'user_id' => $this->evaluator->id,
            'evaluatee_id' => $eeId, 'question_id' => $this->q->id,
            'option_id' => $this->opt->id, 'fiscal_year' => 2026,
        ]);
    }

    $res = $this->actingAs($this->evaluator)->get(route('dashboard'));
    $props = $res->viewData('page')['props'];

    // angle_summary.top.completed_count = 1 (เฉพาะที่ submitted) ไม่ใช่ 2
    expect($props['angle_summary']['top']['completed_count'])->toBe(1);
});

it('submit endpoint: marks all evaluatees in same evaluation form (bulk)', function () {
    // 3 evaluatees ในแบบประเมินเดียวกัน, evaluator เดียวกัน, fiscal_year เดียวกัน — ทุกคน submitted_at = NULL
    $ee2 = makeOrgUserDS(['role' => 'user', 'grade' => '12']);
    $ee3 = makeOrgUserDS(['role' => 'user', 'grade' => '12']);
    foreach ([$this->evaluatee->id, $ee2->id, $ee3->id] as $eeId) {
        EvaluationAssignment::factory()->create([
            'evaluator_id' => $this->evaluator->id, 'evaluatee_id' => $eeId,
            'evaluation_id' => $this->eval->id, 'angle' => 'left',
            'fiscal_year' => '2026', 'submitted_at' => null,
        ]);
    }
    // แบบประเมินอื่น — ไม่ควรถูก submit
    $otherEval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 4, 'grade_max' => 8,
    ]);
    EvaluationAssignment::factory()->create([
        'evaluator_id' => $this->evaluator->id, 'evaluatee_id' => $this->evaluatee->id,
        'evaluation_id' => $otherEval->id, 'angle' => 'top',
        'fiscal_year' => '2026', 'submitted_at' => null,
    ]);

    $res = $this->actingAs($this->evaluator)
        ->post('/assigned-evaluations/'.$this->evaluatee->id.'/submit', [
            'fiscal_year' => 2026,
            'evaluation_id' => $this->eval->id,
        ]);
    $res->assertOk();

    foreach ([$this->evaluatee->id, $ee2->id, $ee3->id] as $eeId) {
        $a = \App\Models\EvaluationAssignment::where('evaluator_id', $this->evaluator->id)
            ->where('evaluatee_id', $eeId)
            ->where('evaluation_id', $this->eval->id)->first();
        expect($a->submitted_at)->not->toBeNull();
    }
    $other = \App\Models\EvaluationAssignment::where('evaluation_id', $otherEval->id)->first();
    expect($other->submitted_at)->toBeNull();
});
