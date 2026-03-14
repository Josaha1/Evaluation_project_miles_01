<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

it('generated code follows IEAT-[ORG]-[RANDOM6] format', function () {
    $org = ExternalOrganization::factory()->create(['org_code' => 'MYORG']);
    $evaluation = Evaluation::factory()->create(['status' => 'published']);
    $evaluatee = User::factory()->create();

    // Create an assignment so the code generation finds it
    EvaluationAssignment::factory()->create([
        'evaluation_id' => $evaluation->id,
        'evaluatee_id' => $evaluatee->id,
        'fiscal_year' => (string) now()->year,
        'angle' => 'right',
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.access-codes.generate'), [
            'organization_id' => $org->id,
            'evaluation_id' => $evaluation->id,
            'evaluatee_ids' => [$evaluatee->id],
            'fiscal_year' => now()->year,
        ]);

    $code = ExternalAccessCode::where('external_organization_id', $org->id)->first();

    expect($code)->not->toBeNull();
    expect($code->code)->toMatch('/^IEAT-MYORG-[A-Z0-9]{6}$/');
});

it('admin can access generate page', function () {
    $response = $this->actingAs($this->admin)
        ->get(route('admin.access-codes.create'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('AdminAccessCodeGenerate')
            ->has('organizations')
            ->has('evaluations')
            ->has('evaluatees')
    );
});

it('admin can view code detail with QR', function () {
    $code = ExternalAccessCode::factory()->create();

    $response = $this->actingAs($this->admin)
        ->get(route('admin.access-codes.show', $code));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('AdminAccessCodeShow')
            ->has('accessCode')
            ->has('qrCodeSvg')
            ->has('qrCodeUrl')
    );
});

it('can revoke unused code', function () {
    $code = ExternalAccessCode::factory()->create([
        'is_used' => false,
    ]);

    $response = $this->actingAs($this->admin)
        ->put(route('admin.access-codes.revoke', $code));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $code->refresh();
    expect($code->is_used)->toBeTrue();
    expect($code->used_at)->not->toBeNull();
});

it('can regenerate code with new code and reset is_used', function () {
    // Note: regenerate route is not yet defined in routes/web.php
    // This test validates the controller method logic directly
    $org = ExternalOrganization::factory()->create(['org_code' => 'RGEN']);
    $code = ExternalAccessCode::factory()->used()->create([
        'external_organization_id' => $org->id,
        'code' => 'IEAT-RGEN-OLDOLD',
    ]);

    $oldCode = $code->code;

    // Directly call the regenerate method on the controller
    $controller = new \App\Http\Controllers\AdminAccessCodeController();
    $response = $controller->regenerate($code);

    $code->refresh();

    expect($code->code)->not->toBe($oldCode);
    expect($code->is_used)->toBeFalse();
    expect($code->used_at)->toBeNull();
    expect($code->code)->toMatch('/^IEAT-RGEN-[A-Z0-9]{6}$/');
});

it('cannot delete used code', function () {
    $code = ExternalAccessCode::factory()->used()->create();

    $response = $this->actingAs($this->admin)
        ->delete(route('admin.access-codes.destroy', $code));

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $this->assertDatabaseHas('external_access_codes', ['id' => $code->id]);
});

it('can delete unused code', function () {
    $code = ExternalAccessCode::factory()->create([
        'is_used' => false,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('admin.access-codes.destroy', $code));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('external_access_codes', ['id' => $code->id]);
});

it('exports codes as CSV', function () {
    ExternalAccessCode::factory()->count(3)->create();

    $response = $this->actingAs($this->admin)
        ->get(route('admin.access-codes.export'));

    $response->assertStatus(200);
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
});

it('unused and unexpired code isValid returns true', function () {
    $code = ExternalAccessCode::factory()->create([
        'is_used' => false,
        'expires_at' => now()->addMonth(),
    ]);

    expect($code->isValid())->toBeTrue();
});

it('used code isValid returns false', function () {
    $code = ExternalAccessCode::factory()->used()->create();

    expect($code->isValid())->toBeFalse();
});

it('expired code isValid returns false', function () {
    $code = ExternalAccessCode::factory()->expired()->create();

    expect($code->isValid())->toBeFalse();
});
