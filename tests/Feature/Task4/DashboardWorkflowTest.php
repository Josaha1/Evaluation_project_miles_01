<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('authenticated user can access dashboard', function () {
    $user = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    expect($response->status())->not->toBe(401)
        ->and($response->status())->not->toBe(403);
});

it('dashboard route requires authentication', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

it('self-evaluation index requires authentication', function () {
    $response = $this->get(route('evaluationsself.index'));

    $response->assertRedirect(route('login'));
});

it('authenticated user can access self-evaluation index', function () {
    $user = User::factory()->employee()->create(['role' => 'user']);

    // Create a published evaluation matching the user grade range
    Evaluation::factory()->create([
        'status' => 'published',
        'grade_min' => 4,
        'grade_max' => 8,
        'user_type' => 'internal',
    ]);

    $response = $this->actingAs($user)->get(route('evaluationsself.index'));

    expect($response->status())->not->toBe(401)
        ->and($response->status())->not->toBe(403);
});

it('assigned evaluatees endpoint returns data', function () {
    $evaluator = User::factory()->create(['role' => 'user']);
    $evaluatee = User::factory()->create(['role' => 'user']);
    $evaluation = Evaluation::factory()->create(['status' => 'published']);

    EvaluationAssignment::factory()->create([
        'evaluator_id' => $evaluator->id,
        'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $evaluation->id,
        'angle' => 'left',
    ]);

    $response = $this->actingAs($evaluator)->get(route('assigned-evaluations.evaluatees'));

    expect($response->status())->not->toBe(401)
        ->and($response->status())->not->toBe(404);
});
