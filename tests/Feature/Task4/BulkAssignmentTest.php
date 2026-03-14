<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed governor evaluations so published evaluations exist for matching
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

it('admin can bulk-store multiple assignments', function () {
    $admin = User::factory()->admin()->create();
    $evaluator = User::factory()->create(['role' => 'user']);
    $evaluatee1 = User::factory()->create(['role' => 'user']);
    $evaluatee2 = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($admin)->post(route('assignments.bulk-store'), [
        'evaluator_id' => $evaluator->id,
        'assignments' => [
            ['evaluatee_id' => $evaluatee1->id, 'angle' => 'top'],
            ['evaluatee_id' => $evaluatee2->id, 'angle' => 'left'],
        ],
    ]);

    expect($response->status())->toBeIn([200, 302]);

    $this->assertDatabaseHas('evaluation_assignments', [
        'evaluator_id' => $evaluator->id,
        'evaluatee_id' => $evaluatee1->id,
        'angle' => 'top',
    ]);
    $this->assertDatabaseHas('evaluation_assignments', [
        'evaluator_id' => $evaluator->id,
        'evaluatee_id' => $evaluatee2->id,
        'angle' => 'left',
    ]);
});

it('bulk-store detects duplicate assignments', function () {
    $admin = User::factory()->admin()->create();
    $evaluator = User::factory()->create(['role' => 'user']);
    $evaluatee = User::factory()->create(['role' => 'user']);

    // Create first assignment
    $this->actingAs($admin)->post(route('assignments.bulk-store'), [
        'evaluator_id' => $evaluator->id,
        'assignments' => [
            ['evaluatee_id' => $evaluatee->id, 'angle' => 'top'],
        ],
    ]);

    // Try to create the same assignment again
    $response = $this->actingAs($admin)->post(route('assignments.bulk-store'), [
        'evaluator_id' => $evaluator->id,
        'assignments' => [
            ['evaluatee_id' => $evaluatee->id, 'angle' => 'top'],
        ],
    ]);

    // Should succeed but report duplicates (not create new records)
    $count = EvaluationAssignment::where('evaluator_id', $evaluator->id)
        ->where('evaluatee_id', $evaluatee->id)
        ->where('angle', 'top')
        ->count();

    expect($count)->toBe(1);
});

it('bulk-store validates evaluator exists', function () {
    $admin = User::factory()->admin()->create();
    $evaluatee = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($admin)->post(route('assignments.bulk-store'), [
        'evaluator_id' => 999999,
        'assignments' => [
            ['evaluatee_id' => $evaluatee->id, 'angle' => 'top'],
        ],
    ]);

    $response->assertSessionHasErrors('evaluator_id');
});

it('bulk-store validates angle is valid', function () {
    $admin = User::factory()->admin()->create();
    $evaluator = User::factory()->create(['role' => 'user']);
    $evaluatee = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($admin)->post(route('assignments.bulk-store'), [
        'evaluator_id' => $evaluator->id,
        'assignments' => [
            ['evaluatee_id' => $evaluatee->id, 'angle' => 'invalid_angle'],
        ],
    ]);

    $response->assertSessionHasErrors('assignments.0.angle');
});

it('admin can single-store assignment', function () {
    $admin = User::factory()->admin()->create();
    $evaluator = User::factory()->create(['role' => 'user']);
    $evaluatee = User::factory()->create(['role' => 'user']);
    $evaluation = Evaluation::factory()->create(['status' => 'published']);

    $response = $this->actingAs($admin)->post(route('assignments.store'), [
        'evaluator_id' => $evaluator->id,
        'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $evaluation->id,
        'angle' => 'left',
    ]);

    expect($response->status())->toBeIn([200, 302]);
});

it('admin can delete assignment', function () {
    $admin = User::factory()->admin()->create();
    $assignment = EvaluationAssignment::factory()->create();

    $response = $this->actingAs($admin)->delete(route('assignments.destroy', $assignment));

    expect($response->status())->toBeIn([200, 302]);
    $this->assertDatabaseMissing('evaluation_assignments', ['id' => $assignment->id]);
});
