<?php

use App\Models\Evaluation;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function loginUser(): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 999999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 999999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create(['division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac, 'birthdate' => '1980-01-01', 'role' => 'user', 'grade' => '9']);
}

it('login: บริษัทใช้ร่วม — เลือก contact ตัวเอง → resolve stakeholder_id ถูก row (ไม่ใช่ row แรกบริษัท)', function () {
    $eval = Evaluation::factory()->create(['status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12, 'title' => 'eval ext']);
    $A = loginUser(); // ธีรชัย-จำลอง (เป้าของธเนศ)
    $B = loginUser(); // สุพัฒน์-จำลอง (row แรกบริษัท)
    $org = ExternalOrganization::factory()->create(['name' => 'คู่ความร่วมมือ']);
    $code = ExternalAccessCode::factory()->create(['external_organization_id' => $org->id, 'evaluation_id' => $eval->id, 'fiscal_year' => '2026', 'is_used' => false, 'max_uses' => null, 'expires_at' => null]);

    foreach ([$A, $B] as $u) {
        DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $code->id, 'evaluatee_id' => $u->id, 'evaluation_id' => $eval->id, 'created_at' => now(), 'updated_at' => now()]);
    }
    // 2 row บริษัทเดียวกัน คนละ contact คนละ evaluatee
    $rowB = ExternalStakeholder::create(['external_access_code_id' => $code->id, 'evaluatee_id' => $B->id, 'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ', 'organization_name' => 'บริษัท ร่วม จำกัด', 'contact_person' => 'นายสุพัฒน์ ทดสอบ']);
    $rowA = ExternalStakeholder::create(['external_access_code_id' => $code->id, 'evaluatee_id' => $A->id, 'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ', 'organization_name' => 'บริษัท ร่วม จำกัด', 'contact_person' => 'นายธเนศ ทดสอบ']);

    // frontend ส่ง stakeholder_id = rowB (row แรกบริษัท ผิด) แต่ evaluator_name = ธเนศ (ถูก)
    $this->post(route('external.login.submit'), [
        'code' => $code->code,
        'evaluator_name' => 'นายธเนศ ทดสอบ',
        'evaluator_position' => 'บริษัท ร่วม จำกัด',
        'stakeholder_id' => $rowB->id,
    ]);

    $session = ExternalEvaluationSession::where('evaluator_name', 'นายธเนศ ทดสอบ')->latest('id')->first();
    expect($session)->not->toBeNull();
    expect($session->external_stakeholder_id)->toBe($rowA->id); // resolve เป็น row ธเนศ ไม่ใช่ rowB
    expect($session->evaluatee_id)->toBe($A->id);               // เริ่มที่ evaluatee ของธเนศ (ธีรชัย-จำลอง)
});
