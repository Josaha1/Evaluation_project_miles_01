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

function openCodeUser(): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 999999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 999999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create(['division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac, 'birthdate' => '1980-01-01', 'role' => 'user', 'grade' => '13']);
}

it('open code: ผวก. ต้องใช้แบบของ open code (eval 34) ไม่ใช่ eval ของ code อื่นที่ชื่อ+บริษัทไปแม็ตช์ (9-12)', function () {
    // ผู้ถูกประเมินคนเดียวกัน (ผวก.) แต่ map คนละแบบใน 2 code
    $gov   = openCodeUser();
    $evGov = Evaluation::factory()->create(['status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'external', 'grade_min' => 13, 'grade_max' => 13, 'title' => 'ผวก. external']);
    $evMid = Evaluation::factory()->create(['status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'external', 'grade_min' => 9, 'grade_max' => 12, 'title' => '9-12 external']);

    // code IEAT (มี stakeholder ภู่เกษร) — pivot ดัน ผวก.→9-12 (ผิด) เหมือน prod code 2-6
    $orgMid  = ExternalOrganization::factory()->create(['name' => 'IEAT group']);
    $codeMid = ExternalAccessCode::factory()->create(['external_organization_id' => $orgMid->id, 'evaluation_id' => null, 'evaluatee_id' => null, 'fiscal_year' => '2026', 'is_used' => false, 'max_uses' => null, 'expires_at' => null]);
    DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $codeMid->id, 'evaluatee_id' => $gov->id, 'evaluation_id' => $evMid->id, 'created_at' => now(), 'updated_at' => now()]);
    ExternalStakeholder::create(['external_access_code_id' => $codeMid->id, 'evaluatee_id' => $gov->id, 'fiscal_year' => 2026, 'group_label' => 'IEAT group', 'organization_name' => 'บริษัท กัลฟ์ บีแอล จำกัด', 'contact_person' => 'นายชานนท์ ภู่เกษร']);

    // open code (OPEN-PWK) — code ผูก evaluatee+evaluation ของตัวเอง (ผวก.→34), ไม่มี stakeholder pre-list
    $orgOpen  = ExternalOrganization::factory()->create(['name' => 'open governor']);
    $codeOpen = ExternalAccessCode::factory()->create(['external_organization_id' => $orgOpen->id, 'evaluation_id' => $evGov->id, 'evaluatee_id' => $gov->id, 'fiscal_year' => '2026', 'is_used' => false, 'max_uses' => null, 'expires_at' => null]);
    DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $codeOpen->id, 'evaluatee_id' => $gov->id, 'evaluation_id' => $evGov->id, 'created_at' => now(), 'updated_at' => now()]);

    // ภู่เกษร เข้าทาง open code แล้วกรอกชื่อ+บริษัทเอง (ชื่อ+บริษัทไปตรงกับ stakeholder ของ codeMid)
    $this->post(route('external.login.submit'), [
        'code'               => $codeOpen->code,
        'evaluator_name'     => 'นายชานนท์ ภู่เกษร',
        'evaluator_position' => 'บริษัท กัลฟ์ บีแอล จำกัด',
    ]);

    $session = ExternalEvaluationSession::where('evaluator_name', 'นายชานนท์ ภู่เกษร')->latest('id')->first();
    expect($session)->not->toBeNull();
    expect($session->evaluation_id)->toBe($evGov->id);            // ต้องเป็นแบบ ผวก. (34) ไม่ใช่ 9-12
    expect($session->external_access_code_id)->toBe($codeOpen->id); // session ผูก open code ไม่ใช่ code IEAT
});
