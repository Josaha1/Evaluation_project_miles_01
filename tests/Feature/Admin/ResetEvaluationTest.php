<?php

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function makeOrgUser(array $overrides = []): User
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
    $this->admin  = makeOrgUser(['role' => 'admin', 'emid' => '999999']);
    $this->target = makeOrgUser(['role' => 'user', 'emid' => '441027', 'grade' => '10']);
    $this->other  = makeOrgUser(['role' => 'user', 'emid' => '888888', 'grade' => '10']);

    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
    ]);

    // target เป็น evaluator: 2 rows (1 submitted, 1 not)
    $this->a1 = EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->target->id,
        'evaluatee_id'  => $this->other->id,
        'fiscal_year'   => '2026',
        'angle'         => 'left',
    ]);
    $this->a1->submitted_at = now();
    $this->a1->save();

    $this->a2 = EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->target->id,
        'evaluatee_id'  => $this->other->id,
        'fiscal_year'   => '2026',
        'angle'         => 'top',
    ]);
});

// 1) preview: ค้น emid แล้ว return user + counts ของ scope
it('preview returns user info and counts for valid emid', function () {
    Answer::factory()->create([
        'user_id' => $this->target->id, 'evaluatee_id' => $this->other->id,
        'evaluation_id' => $this->eval->id, 'fiscal_year' => '2026',
    ]);

    $res = $this->actingAs($this->admin)->getJson(
        '/admin/reset-evaluations/preview?emid=441027&role=evaluator&fiscal_year=2026'
    );

    $res->assertOk();
    $res->assertJsonPath('user.emid', '441027');
    $res->assertJsonPath('counts.answers', 1);
    $res->assertJsonPath('counts.submitted_assignments', 1);
});

// 2) preview: emid ไม่พบ → 404
it('preview returns 404 when emid not found', function () {
    $res = $this->actingAs($this->admin)->getJson('/admin/reset-evaluations/preview?emid=000000&role=evaluator&fiscal_year=2026');
    $res->assertStatus(404);
});

// 3) execute: ลบ answers + reset submitted_at + log row
it('execute deletes answers, resets submitted_at, and writes audit log', function () {
    Answer::factory()->count(2)->create([
        'user_id' => $this->target->id, 'evaluatee_id' => $this->other->id,
        'evaluation_id' => $this->eval->id, 'fiscal_year' => '2026',
    ]);

    $res = $this->actingAs($this->admin)->postJson('/admin/reset-evaluations', [
        'emid'        => '441027',
        'role'        => 'evaluator',
        'fiscal_year' => 2026,
        'confirm_emid' => '441027',
    ]);

    $res->assertOk();
    $res->assertJsonPath('answers_deleted', 2);
    $res->assertJsonPath('assignments_reset', 1);

    expect(Answer::where('user_id', $this->target->id)->where('fiscal_year', 2026)->count())->toBe(0);
    expect(EvaluationAssignment::find($this->a1->id)->submitted_at)->toBeNull();

    $this->assertDatabaseHas('evaluation_reset_logs', [
        'admin_id'        => $this->admin->id,
        'target_user_id'  => $this->target->id,
        'scope_role'      => 'evaluator',
        'fiscal_year'     => 2026,
        'answers_deleted' => 2,
        'assignments_reset' => 1,
    ]);
});

// 4) execute: confirm_emid mismatch → 422
it('rejects when confirm_emid does not match', function () {
    $res = $this->actingAs($this->admin)->postJson('/admin/reset-evaluations', [
        'emid'         => '441027',
        'role'         => 'evaluator',
        'fiscal_year'  => 2026,
        'confirm_emid' => 'wrong',
    ]);

    $res->assertStatus(422);
});

// 5) non-admin → 403/302
it('non-admin user cannot access reset endpoints', function () {
    $user = makeOrgUser(['role' => 'user']);

    $r1 = $this->actingAs($user)->getJson('/admin/reset-evaluations/preview?emid=441027&role=evaluator&fiscal_year=2026');
    $r2 = $this->actingAs($user)->postJson('/admin/reset-evaluations', [
        'emid' => '441027', 'role' => 'evaluator', 'fiscal_year' => 2026, 'confirm_emid' => '441027',
    ]);

    expect($r1->status())->toBeIn([302, 403]);
    expect($r2->status())->toBeIn([302, 403]);
});

// 6) snapshot ถูกบันทึก
it('audit log contains snapshot of affected answers and assignments', function () {
    Answer::factory()->create([
        'user_id' => $this->target->id, 'evaluatee_id' => $this->other->id,
        'evaluation_id' => $this->eval->id, 'fiscal_year' => '2026',
    ]);

    $this->actingAs($this->admin)->postJson('/admin/reset-evaluations', [
        'emid' => '441027', 'role' => 'evaluator', 'fiscal_year' => 2026,
        'confirm_emid' => '441027',
    ])->assertOk();

    $log = DB::table('evaluation_reset_logs')->latest()->first();
    expect($log)->not->toBeNull();
    expect($log->answers_snapshot)->not->toBeNull();
    expect($log->assignments_snapshot)->not->toBeNull();

    $answers = json_decode($log->answers_snapshot, true);
    expect($answers)->toBeArray();
    expect(count($answers))->toBe(1);
});

// 7) invalid role → 422
it('rejects invalid role value', function () {
    $res = $this->actingAs($this->admin)->postJson('/admin/reset-evaluations', [
        'emid' => '441027', 'role' => 'foo', 'fiscal_year' => 2026, 'confirm_emid' => '441027',
    ]);
    $res->assertStatus(422);
});
