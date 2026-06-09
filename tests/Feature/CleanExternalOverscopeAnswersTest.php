<?php

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

function ovsUser(): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 999999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 999999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 999999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);
    return User::factory()->create([
        'division_id' => $div, 'department_id' => $dep, 'position_id' => $pos, 'faction_id' => $fac,
        'birthdate' => '1980-01-01', 'role' => 'user', 'grade' => '10',
    ]);
}

function ovsAnswerFor(int $evalId, int $qId, int $codeId, int $sessionId, int $evaluatorId, int $evaluateeId): void
{
    Answer::create([
        'evaluation_id' => $evalId, 'user_id' => $evaluatorId, 'evaluatee_id' => $evaluateeId,
        'question_id' => $qId, 'value' => '4', 'fiscal_year' => 2026,
        'external_access_code_id' => $codeId, 'external_session_id' => $sessionId,
    ]);
}

beforeEach(function () {
    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'internal',
        'grade_min' => 9, 'grade_max' => 12, 'title' => 'eval ext 2569',
    ]);
    $this->q = Question::factory()->create(['type' => 'rating', 'order' => 1]);
    $this->org = ExternalOrganization::factory()->create(['name' => 'คู่ความร่วมมือ']);
    $this->code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $this->org->id, 'evaluation_id' => $this->eval->id,
        'fiscal_year' => '2026',
    ]);
    // evaluatees: A,B = ในขอบเขต stakeholder | C,D = นอกขอบเขต (over-scope)
    $this->A = ovsUser(); $this->B = ovsUser(); $this->C = ovsUser(); $this->D = ovsUser();
    $this->evaluator = ovsUser();
});

it('Tier2 name-match: ลบ answers นอก scope เก็บในขอบเขต + backup + log', function () {
    // stakeholder รายชื่อ contact = "พิมลวรรณ" → ตั้งใจประเมินแค่ A,B
    foreach ([$this->A, $this->B] as $u) {
        ExternalStakeholder::create([
            'external_access_code_id' => $this->code->id, 'evaluatee_id' => $u->id,
            'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ',
            'organization_name' => 'บริษัท เทคนิคสิ่งแวดล้อมไทย จำกัด', 'contact_person' => 'พิมลวรรณ ผู้มีสัตย์',
        ]);
    }
    // session ไม่มี FK, evaluator_name ตรง contact → Tier2
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'พิมลวรรณ ผู้มีสัตย์', 'external_stakeholder_id' => null, 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C, $this->D] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers');

    // ในขอบเขตอยู่ครบ
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->A->id)->exists())->toBeTrue();
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->B->id)->exists())->toBeTrue();
    // นอกขอบเขตถูกลบ
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->C->id)->exists())->toBeFalse();
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->D->id)->exists())->toBeFalse();
    // log
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'cleaned', 'tier' => 'name', 'deleted_count' => 2, 'dry_run' => false,
    ]);
    // backup table มี 2 rows ที่ลบ
    $bk = '_backup_answers_overscope_'.now()->format('Ymd');
    expect(DB::table($bk)->where('evaluatee_id', $this->C->id)->exists())->toBeTrue();
    expect(DB::table($bk)->count())->toBe(2);
});

it('Tier1 FK: scope จาก external_stakeholder_id → ลบเฉพาะนอก scope', function () {
    $stkA = ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->A->id,
        'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ',
        'organization_name' => 'บจก. หนึ่ง', 'contact_person' => 'สมชาย',
    ]);
    ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->B->id,
        'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ',
        'organization_name' => 'บจก. หนึ่ง', 'contact_person' => 'สมชาย',
    ]);
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'พิมพ์เพี้ยน', 'external_stakeholder_id' => $stkA->id, 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers');

    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->A->id)->exists())->toBeTrue();
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->B->id)->exists())->toBeTrue();
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->C->id)->exists())->toBeFalse();
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'cleaned', 'tier' => 'fk',
    ]);
});

it('unmapped: หา intended ไม่ได้ → ไม่ลบ + log unmapped', function () {
    // ไม่มี stakeholder row ที่ตรงชื่อเลย, ไม่มี FK
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'ไม่มีในลิสต์', 'external_stakeholder_id' => null, 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers');

    expect(Answer::where('external_session_id', $s->id)->count())->toBe(3); // ไม่ลบเลย
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'unmapped',
    ]);
});

it('dry-run: ไม่ลบจริง แต่ log dry_run=1', function () {
    foreach ([$this->A, $this->B] as $u) {
        ExternalStakeholder::create([
            'external_access_code_id' => $this->code->id, 'evaluatee_id' => $u->id,
            'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ',
            'organization_name' => 'บจก. สอง', 'contact_person' => 'พิมลวรรณ ทดสอบ',
        ]);
    }
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'พิมลวรรณ ทดสอบ', 'external_stakeholder_id' => null, 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C, $this->D] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers', ['--dry-run' => true]);

    expect(Answer::where('external_session_id', $s->id)->count())->toBe(4); // ครบเท่าเดิม
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'cleaned', 'dry_run' => true, 'deleted_count' => 2,
    ]);
});

it('in-scope: ไม่มี over-scope → ไม่ลบ + status in_scope', function () {
    ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->A->id,
        'fiscal_year' => 2026, 'group_label' => 'คู่ความร่วมมือ',
        'organization_name' => 'บจก. สาม', 'contact_person' => 'อาทิตย์ แจ่มใส',
    ]);
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'อาทิตย์ แจ่มใส', 'external_stakeholder_id' => null, 'completed_at' => now(),
    ]);
    ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $this->A->id);

    Artisan::call('external:clean-overscope-answers');

    expect(Answer::where('external_session_id', $s->id)->count())->toBe(1);
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'in_scope', 'deleted_count' => 0,
    ]);
});

it('multi-group: คนเดียวอยู่หลาย code + ชื่อมี variant → union ข้าม code (เก็บของจริงครบ ลบเฉพาะเกิน)', function () {
    $orgB = ExternalOrganization::factory()->create(['name' => 'คู่ค้า']);
    $codeB = ExternalAccessCode::factory()->create([
        'external_organization_id' => $orgB->id, 'evaluation_id' => $this->eval->id, 'fiscal_year' => '2026',
    ]);
    // A อยู่ code แรก | B อยู่ codeB (อีกกลุ่ม) — บริษัทเดียวกัน, contact variant ต่างกัน
    ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->A->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ความร่วมมือ', 'organization_name' => 'บริษัท เทคนิคสิ่งแวดล้อมไทย จำกัด',
        'contact_person' => 'นายสมชาย ปิยะวรสกุล',
    ]);
    ExternalStakeholder::create([
        'external_access_code_id' => $codeB->id, 'evaluatee_id' => $this->B->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ค้า', 'organization_name' => 'บริษัท เทคนิคสิ่งแวดล้อม จำกัด',
        'contact_person' => 'นายสมชาย ปิยะวรสกุล ตำแหน่ง ผู้จัดการทั่วไป'.chr(10).'082 468 6861',
    ]);
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'นายสมชาย ปิยะวรสกุล ตำแหน่ง ผู้จัดการทั่วไป'.chr(10).'082 468 6861', 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers');

    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->A->id)->exists())->toBeTrue();
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->B->id)->exists())->toBeTrue();  // ของจริงข้ามกลุ่ม ต้องไม่ถูกลบ
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->C->id)->exists())->toBeFalse(); // เกิน ลบ
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'cleaned', 'deleted_count' => 1,
    ]);
});

it('ชื่อ-สกุลเต็มเดียวกันหลายบริษัท → union ต่อกัน (เก็บทุก org ของคนนั้น)', function () {
    ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->A->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ความร่วมมือ', 'organization_name' => 'บริษัท เอ จำกัด', 'contact_person' => 'นายโจ ใจดี',
    ]);
    ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->B->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ความร่วมมือ', 'organization_name' => 'บริษัท บี จำกัด', 'contact_person' => 'นายโจ ใจดี',
    ]);
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'นายโจ ใจดี', 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers');

    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->A->id)->exists())->toBeTrue();
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->B->id)->exists())->toBeTrue();  // อีกบริษัท ก็เก็บ (คนเดียวกัน)
    expect(Answer::where('external_session_id', $s->id)->where('evaluatee_id', $this->C->id)->exists())->toBeFalse(); // เกิน ลบ
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'cleaned', 'deleted_count' => 1,
    ]);
});

it('ชื่อโดด 1 token (generic) → ไม่แตะ (unmapped)', function () {
    ExternalStakeholder::create([
        'external_access_code_id' => $this->code->id, 'evaluatee_id' => $this->A->id, 'fiscal_year' => 2026,
        'group_label' => 'คู่ความร่วมมือ', 'organization_name' => 'บริษัท เอ จำกัด', 'contact_person' => 'ปัญญดา',
    ]);
    $s = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $this->code->id, 'external_organization_id' => $this->org->id,
        'evaluation_id' => $this->eval->id, 'evaluatee_id' => $this->A->id,
        'evaluator_name' => 'ปัญญดา', 'completed_at' => now(),
    ]);
    foreach ([$this->A, $this->B, $this->C] as $u) {
        ovsAnswerFor($this->eval->id, $this->q->id, $this->code->id, $s->id, $this->evaluator->id, $u->id);
    }

    Artisan::call('external:clean-overscope-answers');

    expect(Answer::where('external_session_id', $s->id)->count())->toBe(3); // ไม่ลบเลย
    $this->assertDatabaseHas('external_overscope_cleanup_logs', [
        'external_evaluation_session_id' => $s->id, 'status' => 'unmapped',
    ]);
});
