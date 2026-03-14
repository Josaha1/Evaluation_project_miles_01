<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('individual angle report endpoint exists', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->getJson(route('admin.evaluation-report.api.individual-angle-report'));

    expect($response->status())->not->toBe(404)
        ->and($response->status())->not->toBe(405);
});

it('user details endpoint works for any user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($admin)->getJson(route('admin.evaluation-report.user-details', ['userId' => $user->id]));

    expect($response->status())->not->toBe(404)
        ->and($response->status())->not->toBe(405);
});

it('evaluatee details endpoint works', function () {
    $admin = User::factory()->admin()->create();
    $evaluatee = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($admin)->getJson(route('admin.evaluation-report.evaluatee-details', ['evaluateeId' => $evaluatee->id]));

    expect($response->status())->not->toBe(404)
        ->and($response->status())->not->toBe(405);
});
