<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// helper: สร้าง user พร้อม parent FK rows (ไม่มี factory ของ division/dept/position/faction)
function makeUserWith(array $overrides = []): User
{
    $div  = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 9999), 'created_at' => now(), 'updated_at' => now()]);
    $fac  = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 9999), 'created_at' => now(), 'updated_at' => now()]);
    $dep  = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 9999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos  = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 9999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);

    return User::factory()->create(array_merge([
        'division_id'   => $div,
        'department_id' => $dep,
        'position_id'   => $pos,
        'faction_id'    => $fac,
        'birthdate'     => '1980-01-01',
    ], $overrides));
}

beforeEach(function () {
    $this->admin     = makeUserWith(['role' => 'admin']);
    $this->evaluator = makeUserWith(['grade' => '10']);
    $this->evaluatee = makeUserWith(['grade' => '10']);

    $this->oldEval = Evaluation::factory()->create([
        'status'       => 'published',
        'fiscal_year'  => 2026,
        'user_type'    => 'internal',
        'grade_min'    => 9,
        'grade_max'    => 12,
    ]);
    $this->newEval = Evaluation::factory()->create([
        'status'       => 'published',
        'fiscal_year'  => 2026,
        'user_type'    => 'internal',
        'grade_min'    => 9,
        'grade_max'    => 12,
    ]);

    $this->assignment = EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->oldEval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2026',
        'angle'         => 'top',
        'submitted_at'  => null,
    ]);
});

// 1) happy path — single change
it('admin can change evaluation_id of a single assignment', function () {
    $res = $this->actingAs($this->admin)->patchJson(
        route('assignments.change-evaluation', $this->assignment->id),
        ['evaluation_id' => $this->newEval->id]
    );

    $res->assertOk();
    $this->assertDatabaseHas('evaluation_assignments', [
        'id'            => $this->assignment->id,
        'evaluation_id' => $this->newEval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'angle'         => 'top',
    ]);
});

// 2) reject — fiscal_year mismatch
it('rejects when target evaluation fiscal_year mismatches assignment', function () {
    $otherYearEval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2025,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
    ]);

    $res = $this->actingAs($this->admin)->patchJson(
        route('assignments.change-evaluation', $this->assignment->id),
        ['evaluation_id' => $otherYearEval->id]
    );

    $res->assertStatus(422);
    $this->assertDatabaseHas('evaluation_assignments', [
        'id' => $this->assignment->id, 'evaluation_id' => $this->oldEval->id,
    ]);
});

// 3) reject — evaluation not published
it('rejects when target evaluation is not published', function () {
    $draft = Evaluation::factory()->create([
        'status' => 'draft', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
    ]);

    $res = $this->actingAs($this->admin)->patchJson(
        route('assignments.change-evaluation', $this->assignment->id),
        ['evaluation_id' => $draft->id]
    );

    $res->assertStatus(422);
});

// 4) reject — submitted_at != null (already answered)
it('rejects change when assignment already submitted', function () {
    $this->assignment->submitted_at = now();
    $this->assignment->save();

    $res = $this->actingAs($this->admin)->patchJson(
        route('assignments.change-evaluation', $this->assignment->id),
        ['evaluation_id' => $this->newEval->id]
    );

    $res->assertStatus(422);
    $this->assertDatabaseHas('evaluation_assignments', [
        'id' => $this->assignment->id, 'evaluation_id' => $this->oldEval->id,
    ]);
});

// 5) reject — non-existent evaluation
it('rejects non-existent evaluation_id', function () {
    $res = $this->actingAs($this->admin)->patchJson(
        route('assignments.change-evaluation', $this->assignment->id),
        ['evaluation_id' => 999999]
    );

    $res->assertStatus(422);
});

// 6) non-admin → 403
it('non-admin user cannot change evaluation', function () {
    $user = makeUserWith(['role' => 'user']);
    $res  = $this->actingAs($user)->patchJson(
        route('assignments.change-evaluation', $this->assignment->id),
        ['evaluation_id' => $this->newEval->id]
    );

    expect($res->status())->toBeIn([302, 403]);
    $this->assertDatabaseHas('evaluation_assignments', [
        'id' => $this->assignment->id, 'evaluation_id' => $this->oldEval->id,
    ]);
});

// 7) bulk — all valid succeeds
it('bulk-change applies to all valid assignments', function () {
    $a2 = EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->oldEval->id, 'fiscal_year' => '2026',
        'evaluator_id' => $this->evaluator->id, 'evaluatee_id' => $this->evaluatee->id,
        'angle' => 'left', 'submitted_at' => null,
    ]);

    $res = $this->actingAs($this->admin)->postJson(
        route('assignments.bulk-change-evaluation'),
        [
            'assignment_ids' => [$this->assignment->id, $a2->id],
            'evaluation_id'  => $this->newEval->id,
        ]
    );

    $res->assertOk();
    $res->assertJsonPath('success_count', 2);
    $res->assertJsonPath('failed_count', 0);
    $this->assertDatabaseHas('evaluation_assignments', ['id' => $this->assignment->id, 'evaluation_id' => $this->newEval->id]);
    $this->assertDatabaseHas('evaluation_assignments', ['id' => $a2->id,             'evaluation_id' => $this->newEval->id]);
});

// 8) bulk — mixed valid/invalid rolls back all
it('bulk-change rolls back when any item is invalid (submitted)', function () {
    $submitted = EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->oldEval->id, 'fiscal_year' => '2026',
        'evaluator_id' => $this->evaluator->id, 'evaluatee_id' => $this->evaluatee->id,
        'angle' => 'right', 'submitted_at' => now(),
    ]);

    $res = $this->actingAs($this->admin)->postJson(
        route('assignments.bulk-change-evaluation'),
        [
            'assignment_ids' => [$this->assignment->id, $submitted->id],
            'evaluation_id'  => $this->newEval->id,
        ]
    );

    $res->assertStatus(422);
    $this->assertDatabaseHas('evaluation_assignments', ['id' => $this->assignment->id, 'evaluation_id' => $this->oldEval->id]);
    $this->assertDatabaseHas('evaluation_assignments', ['id' => $submitted->id,        'evaluation_id' => $this->oldEval->id]);
});
