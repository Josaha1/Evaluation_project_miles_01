<?php

use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows external login page', function () {
    $response = $this->get(route('external.login'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('ExternalLogin')
    );
});

it('login with valid code creates session', function () {
    $org = ExternalOrganization::factory()->create(['is_active' => true]);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id,
        'is_used' => false,
        'expires_at' => now()->addMonth(),
    ]);

    $response = $this->post(route('external.login.submit'), [
        'code' => $code->code,
    ]);

    $response->assertRedirect(route('external.confirm'));

    // Verify session was created in DB
    $this->assertDatabaseHas('external_evaluation_sessions', [
        'external_access_code_id' => $code->id,
        'external_organization_id' => $org->id,
    ]);
});

it('login with invalid code is rejected', function () {
    $response = $this->post(route('external.login.submit'), [
        'code' => 'INVALID-CODE-XYZ',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('code');
});

it('login with used code is rejected', function () {
    $org = ExternalOrganization::factory()->create(['is_active' => true]);
    $code = ExternalAccessCode::factory()->used()->create([
        'external_organization_id' => $org->id,
    ]);

    $response = $this->post(route('external.login.submit'), [
        'code' => $code->code,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('code');
});

it('login with expired code is rejected', function () {
    $org = ExternalOrganization::factory()->create(['is_active' => true]);
    $code = ExternalAccessCode::factory()->expired()->create([
        'external_organization_id' => $org->id,
    ]);

    $response = $this->post(route('external.login.submit'), [
        'code' => $code->code,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('code');
});

it('prefills code from query parameter', function () {
    $response = $this->get(route('external.login', ['code' => 'IEAT-TEST-ABC123']));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('ExternalLogin')
            ->where('prefillCode', 'IEAT-TEST-ABC123')
    );
});

it('unauthenticated access to dashboard redirects to login', function () {
    $response = $this->get(route('external.dashboard'));

    $response->assertRedirect(route('external.login'));
});

it('unauthenticated access to confirm redirects to login', function () {
    $response = $this->get(route('external.confirm'));

    $response->assertRedirect(route('external.login'));
});

it('unauthenticated access to evaluate redirects to login', function () {
    $response = $this->get(route('external.evaluate'));

    $response->assertRedirect(route('external.login'));
});

it('logout clears session and redirects to login', function () {
    $org = ExternalOrganization::factory()->create(['is_active' => true]);
    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id,
        'is_used' => false,
        'expires_at' => now()->addMonth(),
    ]);

    // Login first
    $this->post(route('external.login.submit'), [
        'code' => $code->code,
    ]);

    // Then logout
    $response = $this->post(route('external.logout'));

    $response->assertRedirect(route('external.login'));

    // Verify session data is cleared - accessing protected route should redirect
    $dashboardResponse = $this->get(route('external.dashboard'));
    $dashboardResponse->assertRedirect(route('external.login'));
});

it('thank you page renders', function () {
    $response = $this->get(route('external.thank-you'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('ExternalThankYou')
    );
});
