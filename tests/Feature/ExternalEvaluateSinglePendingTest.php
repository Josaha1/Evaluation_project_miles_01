<?php

use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use App\Models\Part;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

uses(RefreshDatabase::class);

function spUser(): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 9999999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 9999999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 9999999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 9999999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create(['division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac, 'birthdate' => '1980-01-01', 'role' => 'user', 'grade' => '9']);
}

it('showEvaluation: เหลือยังไม่ประเมินคนเดียว → form ส่ง evaluatee แค่ 1 (รายคน)', function () {
    $eval = Evaluation::factory()->create(['status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'internal', 'grade_min' => 9, 'grade_max' => 12, 'title' => 'eval ext']);
    $part = Part::factory()->create(['evaluation_id' => $eval->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);
    $q = Question::factory()->create(['part_id' => $part->id, 'aspect_id' => $aspect->id, 'type' => 'rating', 'order' => 1]);

    $A = spUser(); $B = spUser();
    $org = ExternalOrganization::factory()->create(['name' => 'g']);
    $code = ExternalAccessCode::factory()->create(['external_organization_id' => $org->id, 'evaluation_id' => $eval->id, 'fiscal_year' => '2026', 'is_used' => false, 'max_uses' => null, 'expires_at' => null]);
    foreach ([$A, $B] as $u) {
        DB::table('external_code_evaluatees')->insert(['external_access_code_id' => $code->id, 'evaluatee_id' => $u->id, 'evaluation_id' => $eval->id, 'created_at' => now(), 'updated_at' => now()]);
    }
    foreach ([$A, $B] as $u) {
        ExternalStakeholder::create(['external_access_code_id' => $code->id, 'evaluatee_id' => $u->id, 'fiscal_year' => 2026, 'group_label' => 'g', 'organization_name' => 'บริษัท ร่วม จำกัด', 'contact_person' => 'นายโจ ใจดี']);
    }

    // login → scope = A,B
    $this->post(route('external.login.submit'), ['code' => $code->code, 'evaluator_name' => 'นายโจ ใจดี', 'evaluator_position' => 'บริษัท ร่วม จำกัด']);

    // GET form ตอนแรก → 2 คน
    $this->get(route('external.evaluate'))
        ->assertInertia(fn (AssertableInertia $p) => $p->component('ExternalEvaluation')->has('evaluatees', 2));

    // ประเมิน A เสร็จ (1 จาก 2)
    $this->post(route('external.evaluate.submit'), ['answers' => [['question_id' => $q->id, 'evaluatee_id' => $A->id, 'value' => '4']]]);

    // GET form อีกครั้ง → เหลือ B คนเดียว = รายคน
    $this->get(route('external.evaluate'))
        ->assertInertia(fn (AssertableInertia $p) => $p->component('ExternalEvaluation')
            ->has('evaluatees', 1)
            ->where('evaluatees.0.id', $B->id));
});
