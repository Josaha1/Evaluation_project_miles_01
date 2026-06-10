<?php

use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function scopeUser(): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 9999999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 9999999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 9999999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 9999999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create(['division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac, 'birthdate' => '1980-01-01', 'role' => 'user', 'grade' => '9']);
}

function stk(int $codeId, int $evId, string $org, string $contact): void
{
    ExternalStakeholder::create([
        'external_access_code_id' => $codeId, 'evaluatee_id' => $evId, 'fiscal_year' => 2026,
        'group_label' => 'g', 'organization_name' => $org, 'contact_person' => $contact,
    ]);
}

beforeEach(function () {
    $org = ExternalOrganization::factory()->create(['name' => 'g']);
    $this->c1 = ExternalAccessCode::factory()->create(['external_organization_id' => $org->id, 'fiscal_year' => '2026'])->id;
    $this->c2 = ExternalAccessCode::factory()->create(['external_organization_id' => $org->id, 'fiscal_year' => '2026'])->id;
    $this->A = scopeUser()->id; $this->B = scopeUser()->id; $this->C = scopeUser()->id;
});

it('evaluateeScope: รวม variant ชื่อ + org สะกดต่าง + ข้าม code = ครบ', function () {
    // คนเดียว (สมชาย) อยู่ 2 code, org สะกดต่าง, contact มี variant
    stk($this->c1, $this->A, 'บริษัท เทคนิคสิ่งแวดล้อมไทย จำกัด', 'นายสมชาย ปิยะวรสกุล');
    stk($this->c2, $this->B, 'บริษัท เทคนิคสิ่งแวดล้อม จำกัด', "นายสมชาย ปิยะวรสกุล ตำแหน่ง ผจก.\n081");

    $ids = ExternalStakeholder::evaluateeScope(2026, 'นายสมชาย ปิยะวรสกุล', 'บริษัท เทคนิคสิ่งแวดล้อมไทย จำกัด');
    sort($ids);
    expect($ids)->toBe(collect([$this->A, $this->B])->sort()->values()->all());
});

it('evaluateeScope: org guard — ชื่อเดียวกันคนละบริษัท → เอาเฉพาะบริษัทที่ตรง', function () {
    stk($this->c1, $this->A, 'บริษัท เอ จำกัด', 'นายโจ ใจดี');
    stk($this->c1, $this->B, 'บริษัท บี จำกัด', 'นายโจ ใจดี');

    $ids = ExternalStakeholder::evaluateeScope(2026, 'นายโจ ใจดี', 'บริษัท เอ จำกัด');
    expect($ids)->toBe([$this->A]); // บี ถูกกัน
});

it('evaluateeScope: ชื่อโดด 1 token → fallback exact (ไม่ขยายมั่ว)', function () {
    stk($this->c1, $this->A, 'บริษัท เอ จำกัด', 'ปัญญดา');
    stk($this->c1, $this->B, 'บริษัท เอ จำกัด', 'ปัญญดา วงศ์ใหญ่'); // คนละคน ชื่อขึ้นต้นเหมือน

    $ids = ExternalStakeholder::evaluateeScope(2026, 'ปัญญดา', 'บริษัท เอ จำกัด');
    expect($ids)->toBe([$this->A]); // exact "ปัญญดา" เท่านั้น ไม่กิน "ปัญญดา วงศ์ใหญ่"
});
