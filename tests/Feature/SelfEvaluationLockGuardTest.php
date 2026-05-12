<?php

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Self-eval form for grade 4-8
    $this->eval = Evaluation::factory()->create([
        'title' => 'แบบประเมิน 360 องศา สำหรับประเมินตนเองระดับ 4-8',
        'user_type' => 'internal',
        'grade_min' => 4, 'grade_max' => 8,
        'fiscal_year' => 2026, 'status' => 'published',
    ]);
    $this->user = User::factory()->create([
        'emid' => '591034', 'fname' => 'อรรวินท์', 'lname' => 'นุ่มนิ่ม',
        'grade' => 8, 'user_type' => 'internal', 'role' => 'user',
    ]);
    EvaluationAssignment::create([
        'evaluator_id' => $this->user->id, 'evaluatee_id' => $this->user->id,
        'evaluation_id' => $this->eval->id, 'angle' => 'self', 'fiscal_year' => 2026,
    ]);
});

it('blocks self-eval index when submitted_at is set AND answers exist', function () {
    // user submitted + has answers → should be locked
    EvaluationAssignment::where('evaluator_id', $this->user->id)
        ->where('angle', 'self')->update(['submitted_at' => now()]);

    // Seed at least 1 answer (proving submission completed)
    $part = $this->eval->parts()->create(['title' => 'P', 'name' => 'P', 'order' => 1]);
    $aspect = $part->aspects()->create(['name' => 'A', 'order' => 1]);
    $q = $aspect->questions()->create(['title' => 'Q', 'type' => 'rating', 'order' => 1, 'part_id' => $part->id]);
    Answer::create([
        'evaluation_id' => $this->eval->id, 'user_id' => $this->user->id,
        'evaluatee_id' => $this->user->id, 'question_id' => $q->id,
        'value' => '5', 'fiscal_year' => 2026,
    ]);

    $response = $this->actingAs($this->user)->get('/evaluations/self?fiscal_year=2026');
    $response->assertRedirect(route('dashboard'));
    $response->assertSessionHas('error');
});

it('allows self-eval index when submitted_at is set but answers were deleted', function () {
    // The bug: user has submitted_at but answers were wiped → guard should let them in
    EvaluationAssignment::where('evaluator_id', $this->user->id)
        ->where('angle', 'self')->update(['submitted_at' => now()->subDays(5)]);
    // NO answers seeded → 0 answers

    $response = $this->actingAs($this->user)->get('/evaluations/self?fiscal_year=2026');
    $response->assertStatus(200);  // should render the form, not redirect
});

it('allows self-eval index when never submitted (submitted_at is null)', function () {
    // Default state: no submitted_at, no answers
    $response = $this->actingAs($this->user)->get('/evaluations/self?fiscal_year=2026');
    $response->assertStatus(200);
});
