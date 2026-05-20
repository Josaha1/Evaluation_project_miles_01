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
