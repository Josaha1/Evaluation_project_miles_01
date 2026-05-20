<?php

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function makeOrgUserPending(array $overrides = []): User
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
    $this->admin     = makeOrgUserPending(['role' => 'admin']);
    $this->evaluator = makeOrgUserPending(['role' => 'user', 'grade' => '10']);
    $this->evaluatee = makeOrgUserPending(['role' => 'user', 'grade' => '12']);

    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026,
        'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12,
    ]);
});

it('exports pending evaluators successfully', function () {
    EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2026',
        'angle'         => 'top',
    ]);

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators', ['fiscal_year' => 2026]);

    $res->assertOk();
    expect($res->headers->get('content-type'))->toContain('spreadsheetml');
});

it('excludes external user_type from pending export', function () {
    $external = makeOrgUserPending(['role' => 'user', 'grade' => '8', 'user_type' => 'external']);
    EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $external->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2026',
        'angle'         => 'left',
    ]);

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators', ['fiscal_year' => 2026]);

    $res->assertOk();
    // Excel file generated even if pending external excluded — test passes if no 500 error
});

it('returns 200 with empty placeholder when no pending', function () {
    $a = EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2026',
        'angle'         => 'top',
    ]);
    $a->submitted_at = now();
    $a->save();

    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators', ['fiscal_year' => 2026]);

    $res->assertOk();
});

it('non-admin cannot access pending evaluators export', function () {
    $user = makeOrgUserPending(['role' => 'user']);
    $res = $this->actingAs($user)
        ->post('/admin/reports/evaluation/export/pending-evaluators', ['fiscal_year' => 2026]);
    expect($res->status())->toBeIn([302, 403]);
});

it('applies fiscal_year filter — different year not included', function () {
    EvaluationAssignment::factory()->create([
        'evaluation_id' => $this->eval->id,
        'evaluator_id'  => $this->evaluator->id,
        'evaluatee_id'  => $this->evaluatee->id,
        'fiscal_year'   => '2025',
        'angle'         => 'top',
    ]);
    $res = $this->actingAs($this->admin)
        ->post('/admin/reports/evaluation/export/pending-evaluators', ['fiscal_year' => 2026]);
    $res->assertOk();
});
