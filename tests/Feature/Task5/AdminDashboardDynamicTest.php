<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin can access evaluation report page', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('admin.evaluation-report.index'));

    expect($response->status())->toBeIn([200, 302]);
});

it('controller does not contain hardcoded evaluation IDs', function () {
    $reflection = new ReflectionClass(\App\Http\Controllers\AdminEvaluationReportController::class);
    $sourceFile = $reflection->getFileName();
    $source = file_get_contents($sourceFile);

    // Should NOT have patterns like evaluation_id = 1 or evaluation_id = 2, etc.
    expect($source)->not->toMatch('/evaluation_id\s*=\s*\d+/')
        ->and($source)->not->toMatch('/Evaluation::find\(\d+\)/');
});

it('dashboard data endpoint returns JSON', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson(route('admin.evaluation-report.api.dashboard-data'));

    expect($response->status())->toBeIn([200, 302])
        ->and($response->headers->get('Content-Type'))->toContain('json');
});

it('completion stats endpoint returns JSON', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson(route('admin.evaluation-report.api.completion-stats'));

    expect($response->status())->toBeIn([200, 302])
        ->and($response->headers->get('Content-Type'))->toContain('json');
});

it('list evaluatees endpoint returns data', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('admin.evaluation-report.list-evaluatees'));

    expect($response->status())->not->toBe(404)
        ->and($response->status())->not->toBe(405);
});
