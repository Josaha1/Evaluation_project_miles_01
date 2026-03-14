<?php

use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

it('admin can list external organizations', function () {
    ExternalOrganization::factory()->count(3)->create();

    $response = $this->actingAs($this->admin)
        ->get(route('admin.external-organizations.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('AdminExternalOrganizationIndex')
            ->has('organizations.data', 3)
    );
});

it('admin can create an external organization with name and org_code', function () {
    $response = $this->actingAs($this->admin)
        ->post(route('admin.external-organizations.store'), [
            'name' => 'Test Organization',
            'org_code' => 'TORG',
            'description' => 'A test organization',
            'contact_person' => 'John Doe',
            'contact_email' => 'john@example.com',
            'contact_phone' => '0812345678',
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.external-organizations.index'));

    $this->assertDatabaseHas('external_organizations', [
        'name' => 'Test Organization',
        'org_code' => 'TORG',
    ]);
});

it('org_code is stored as uppercase', function () {
    $this->actingAs($this->admin)
        ->post(route('admin.external-organizations.store'), [
            'name' => 'Lowercase Org',
            'org_code' => 'abcd',
            'is_active' => true,
        ]);

    $this->assertDatabaseHas('external_organizations', [
        'org_code' => 'ABCD',
    ]);

    $this->assertDatabaseMissing('external_organizations', [
        'org_code' => 'abcd',
    ]);
});

it('org_code must be unique', function () {
    ExternalOrganization::factory()->create(['org_code' => 'UNIQ']);

    $response = $this->actingAs($this->admin)
        ->post(route('admin.external-organizations.store'), [
            'name' => 'Duplicate Org',
            'org_code' => 'UNIQ',
            'is_active' => true,
        ]);

    $response->assertSessionHasErrors('org_code');
});

it('admin can update an external organization', function () {
    $org = ExternalOrganization::factory()->create([
        'name' => 'Old Name',
        'org_code' => 'OLD1',
    ]);

    $response = $this->actingAs($this->admin)
        ->put(route('admin.external-organizations.update', $org), [
            'name' => 'New Name',
            'org_code' => 'NEW1',
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.external-organizations.index'));

    $this->assertDatabaseHas('external_organizations', [
        'id' => $org->id,
        'name' => 'New Name',
        'org_code' => 'NEW1',
    ]);
});

it('cannot delete organization with unused access codes', function () {
    $org = ExternalOrganization::factory()->create();

    // Create an unused access code for this org
    ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id,
        'is_used' => false,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('admin.external-organizations.destroy', $org));

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $this->assertDatabaseHas('external_organizations', ['id' => $org->id]);
});

it('can delete organization without access codes', function () {
    $org = ExternalOrganization::factory()->create();

    $response = $this->actingAs($this->admin)
        ->delete(route('admin.external-organizations.destroy', $org));

    $response->assertRedirect(route('admin.external-organizations.index'));

    $this->assertDatabaseMissing('external_organizations', ['id' => $org->id]);
});

it('supports search by name', function () {
    ExternalOrganization::factory()->create(['name' => 'Alpha Company']);
    ExternalOrganization::factory()->create(['name' => 'Beta Inc']);
    ExternalOrganization::factory()->create(['name' => 'Gamma Ltd']);

    $response = $this->actingAs($this->admin)
        ->get(route('admin.external-organizations.index', ['search' => 'Alpha']));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('AdminExternalOrganizationIndex')
            ->has('organizations.data', 1)
    );
});
