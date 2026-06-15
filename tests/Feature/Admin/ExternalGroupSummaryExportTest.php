<?php

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/* ── helpers (ชื่อ unique กันชนกับ test อื่นใน suite) ───────────────── */

function makeOrgUserGS(array $overrides = []): User
{
    $div = DB::table('divisions')->insertGetId(['name' => 'D'.rand(1, 99999), 'created_at' => now(), 'updated_at' => now()]);
    $fac = DB::table('factions')->insertGetId(['name' => 'F'.rand(1, 99999), 'created_at' => now(), 'updated_at' => now()]);
    $dep = DB::table('departments')->insertGetId(['name' => 'X'.rand(1, 99999), 'division_id' => $div, 'created_at' => now(), 'updated_at' => now()]);
    $pos = DB::table('positions')->insertGetId(['title' => 'P'.rand(1, 99999), 'department_id' => $dep, 'created_at' => now(), 'updated_at' => now()]);

    return User::factory()->create(array_merge([
        'division_id' => $div, 'department_id' => $dep, 'position_id' => $pos,
        'faction_id' => $fac, 'birthdate' => '1980-01-01',
    ], $overrides));
}

// v3 access code (evaluatee_id=NULL + pivot) ผูก 1 code = 1 group
function gsCode(int $evaluateeId, int $evalId): array
{
    $org = ExternalOrganization::create([
        'name' => 'O'.rand(1, 99999), 'org_code' => 'OC'.rand(100, 999),
        'contact_person' => null, 'contact_email' => null, 'contact_phone' => null, 'is_active' => true,
    ]);
    $code = ExternalAccessCode::create([
        'code' => 'EAC'.rand(100000, 999999), 'external_organization_id' => $org->id,
        'evaluatee_id' => null, 'evaluation_id' => null, 'fiscal_year' => 2026, 'is_used' => false,
    ]);
    DB::table('external_code_evaluatees')->insert([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $evaluateeId,
        'evaluation_id' => $evalId, 'created_at' => now(), 'updated_at' => now(),
    ]);

    return [$org, $code];
}

function gsStakeholder($code, int $evaluateeId, string $group, string $orgName, string $contact): void
{
    DB::table('external_stakeholders')->insert([
        'external_access_code_id' => $code->id, 'evaluatee_id' => $evaluateeId, 'fiscal_year' => 2026,
        'group_label' => $group, 'organization_name' => $orgName, 'contact_person' => $contact,
        'contact_info' => '08x', 'coordinator' => null, 'code' => 'S'.rand(1000, 9999),
        'external_session_id' => null, 'created_at' => now(), 'updated_at' => now(),
    ]);
}

function gsCompleted($org, $code, int $evaluateeId, int $evalId, string $name, ?\Carbon\Carbon $when = null): ExternalEvaluationSession
{
    $when ??= now();
    $ses = ExternalEvaluationSession::create([
        'external_access_code_id' => $code->id, 'external_organization_id' => $org->id,
        'evaluatee_id' => $evaluateeId, 'evaluation_id' => $evalId,
        'session_token' => 'tok'.rand(100000, 999999), 'evaluator_name' => $name,
        'started_at' => $when->copy()->subMinutes(20), 'completed_at' => $when,
    ]);
    $partId = DB::table('parts')->insertGetId([
        'evaluation_id' => $evalId, 'title' => 'P', 'order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);
    $qId = DB::table('questions')->insertGetId([
        'part_id' => $partId, 'title' => 'Q', 'type' => 'rating', 'order' => 1, 'created_at' => now(), 'updated_at' => now(),
    ]);
    Answer::create([
        'evaluation_id' => $evalId, 'user_id' => $evaluateeId, 'evaluatee_id' => $evaluateeId,
        'question_id' => $qId, 'value' => '5', 'fiscal_year' => 2026,
        'external_access_code_id' => $code->id, 'external_session_id' => $ses->id,
    ]);

    return $ses;
}

function gsLoadXlsx($response): \PhpOffice\PhpSpreadsheet\Spreadsheet
{
    $base = $response->baseResponse ?? $response;
    if ($base instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
        return \PhpOffice\PhpSpreadsheet\IOFactory::load($base->getFile()->getPathname());
    }
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());

    return \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
}

// อ่าน sheet "สรุปตามกลุ่ม" → [group => [invited, sent, remaining]]
function gsSummaryMap(\PhpOffice\PhpSpreadsheet\Spreadsheet $book): array
{
    $sheet = $book->getSheetByName('สรุปตามกลุ่ม');
    $map = [];
    for ($r = 4; $r <= $sheet->getHighestRow(); $r++) {
        $g = $sheet->getCell('A'.$r)->getValue();
        if ($g === null || $g === '') continue;
        $map[(string) $g] = [
            (int) $sheet->getCell('B'.$r)->getValue(),
            (int) $sheet->getCell('C'.$r)->getValue(),
            (int) $sheet->getCell('D'.$r)->getValue(),
        ];
    }

    return $map;
}

function gsPost($test, int $evaluateeId)
{
    return $test->post('/admin/reports/evaluation/export/external-group-summary', [
        'fiscal_year' => 2026, 'user_id' => $evaluateeId,
    ]);
}

beforeEach(function () {
    $this->admin = makeOrgUserGS(['role' => 'admin']);
    $this->evaluatee = makeOrgUserGS(['role' => 'user', 'grade' => '13', 'prename' => 'นาย', 'fname' => 'สุเมธ', 'lname' => 'ตั้งประเสริฐ']);
    $this->eval = Evaluation::factory()->create([
        'status' => 'published', 'fiscal_year' => 2026, 'user_type' => 'external',
        'grade_min' => 13, 'grade_max' => 13, 'title' => 'แบบประเมินผู้ว่าการ (ภายนอก)',
    ]);
});

/* ── tests ──────────────────────────────────────────────────────────── */

it('returns 200 + xlsx with 3 sheets', function () {
    [$org, $code] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($code, $this->evaluatee->id, 'คู่ค้า', 'บริษัท ก', 'นาย ก');

    $res = gsPost($this->actingAs($this->admin), $this->evaluatee->id);
    $res->assertOk();
    expect($res->headers->get('content-type'))->toContain('spreadsheetml');

    $book = gsLoadXlsx($res);
    $titles = collect($book->getAllSheets())->map(fn ($s) => $s->getTitle())->all();
    expect($titles)->toContain('สรุปตามกลุ่ม', 'รายชื่อผู้ส่งแล้ว', 'รายชื่อผู้ได้รับเชิญทั้งหมด');
});

it('non-admin blocked', function () {
    $user = makeOrgUserGS(['role' => 'user']);
    $res = gsPost($this->actingAs($user), $this->evaluatee->id);
    expect($res->status())->toBeIn([302, 403]);
});

it('summary: invited per group + total + remaining = invited - sent', function () {
    [$o1, $c1] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($c1, $this->evaluatee->id, 'คู่ค้า', 'บ.1', 'A');
    gsStakeholder($c1, $this->evaluatee->id, 'คู่ค้า', 'บ.2', 'B');
    [$o2, $c2] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($c2, $this->evaluatee->id, 'สื่อมวลชน', 'สื่อ.1', 'C');

    // 1 ส่งแล้วในกลุ่มคู่ค้า
    gsCompleted($o1, $c1, $this->evaluatee->id, $this->eval->id, 'someone');

    $book = gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk());
    $map = gsSummaryMap($book);

    expect($map['คู่ค้า'])->toBe([2, 1, 1]);        // invited2 sent1 remaining1
    expect($map['สื่อมวลชน'])->toBe([1, 0, 1]);
    expect($map['รวมทั้งหมด'])->toBe([3, 1, 2]);
});

it('summary: sent grouped by ACCESS CODE not by name-match', function () {
    [$org, $code] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($code, $this->evaluatee->id, 'คู่ค้า', 'บ.เวลโกรว์', 'นางสาวอัจฉรา สุนทรชัย');
    // ผู้ส่งชื่อไม่ตรง contact_person เลย แต่ใช้ code กลุ่มคู่ค้า → ต้องนับเป็นคู่ค้า
    gsCompleted($org, $code, $this->evaluatee->id, $this->eval->id, 'ชื่อไม่ตรงใคร');

    $map = gsSummaryMap(gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk()));
    expect($map['คู่ค้า'][1])->toBe(1);                 // sent นับเข้าคู่ค้า
    expect($map)->not->toHaveKey('(ไม่ระบุกลุ่ม)');     // ไม่ตกเป็นไม่ระบุ
});

it('summary: completed session on code w/o stakeholder → (ไม่ระบุกลุ่ม), remaining negative', function () {
    [$org, $code] = gsCode($this->evaluatee->id, $this->eval->id);
    // ไม่มี stakeholder row เลย แต่มีคนส่ง
    gsCompleted($org, $code, $this->evaluatee->id, $this->eval->id, 'ผู้ส่งไร้กลุ่ม');

    $map = gsSummaryMap(gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk()));
    expect($map['(ไม่ระบุกลุ่ม)'])->toBe([0, 1, -1]);
});

it('invited sheet lists every stakeholder (name/org/group)', function () {
    [$org, $code] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($code, $this->evaluatee->id, 'ผู้ใช้บริการ', 'บริษัท ทดสอบ จำกัด', 'นายทดสอบ ระบบ');

    $book = gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk());
    $sheet = $book->getSheetByName('รายชื่อผู้ได้รับเชิญทั้งหมด');
    expect($sheet->getCell('B2')->getValue())->toBe('นายทดสอบ ระบบ');
    expect($sheet->getCell('C2')->getValue())->toBe('บริษัท ทดสอบ จำกัด');
    expect($sheet->getCell('D2')->getValue())->toBe('ผู้ใช้บริการ');
});

it('submitter sheet: 1 row per completed session, group from code', function () {
    [$org, $code] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($code, $this->evaluatee->id, 'สื่อมวลชน', 'สำนักข่าว', 'บก.');
    gsCompleted($org, $code, $this->evaluatee->id, $this->eval->id, 'นักข่าว ก', \Carbon\Carbon::parse('2026-05-21 16:14:13'));

    $book = gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk());
    $sheet = $book->getSheetByName('รายชื่อผู้ส่งแล้ว');
    expect($sheet->getCell('B2')->getValue())->toBe('นักข่าว ก');
    expect($sheet->getCell('D2')->getValue())->toBe('สื่อมวลชน');
    expect((string) $sheet->getCell('E2')->getValue())->toContain('2026-05-21');
});

it('submitter sheet: open code (ไม่มี stakeholder) → หน่วยงาน = บริษัทที่พิมพ์เอง (evaluator_position)', function () {
    [$org, $code] = gsCode($this->evaluatee->id, $this->eval->id);
    // open code: ไม่มี stakeholder row; ผู้ส่งกรอกบริษัทเองเก็บใน evaluator_position
    $ses = gsCompleted($org, $code, $this->evaluatee->id, $this->eval->id, 'นายอิสระ กรอกเอง');
    $ses->update(['evaluator_position' => 'บริษัท เปิดเสรี จำกัด']);

    $book = gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk());
    $sheet = $book->getSheetByName('รายชื่อผู้ส่งแล้ว');
    expect($sheet->getCell('B2')->getValue())->toBe('นายอิสระ กรอกเอง');
    expect($sheet->getCell('C2')->getValue())->toBe('บริษัท เปิดเสรี จำกัด');
});

it('getAvailableUsers (LOV ของ modal) คืน role=user รวม evaluatee — กัน modal ว่าง', function () {
    // beforeEach สร้าง $this->evaluatee (role=user, fname=สุเมธ) + $this->admin (role=admin)
    $ctrl = app(App\Http\Controllers\AdminEvaluationReportController::class);
    $m = new ReflectionMethod($ctrl, 'getAvailableUsers');
    $m->setAccessible(true);
    $list = collect($m->invoke($ctrl));

    expect($list)->not->toBeEmpty();
    $names = $list->map(fn ($r) => is_array($r) ? $r['name'] : $r->name);
    expect($names->contains(fn ($n) => str_contains((string) $n, 'สุเมธ')))->toBeTrue();
    // admin ต้องไม่อยู่ใน LOV
    $ids = $list->map(fn ($r) => is_array($r) ? $r['id'] : $r->id);
    expect($ids->contains($this->admin->id))->toBeFalse();
});

it('filters by selected evaluatee (user_id)', function () {
    $other = makeOrgUserGS(['role' => 'user', 'grade' => '13']);
    [$o1, $c1] = gsCode($this->evaluatee->id, $this->eval->id);
    gsStakeholder($c1, $this->evaluatee->id, 'คู่ค้า', 'ของสุเมธ', 'A');
    [$o2, $c2] = gsCode($other->id, $this->eval->id);
    gsStakeholder($c2, $other->id, 'คู่ค้า', 'ของคนอื่น', 'B');

    $map = gsSummaryMap(gsLoadXlsx(gsPost($this->actingAs($this->admin), $this->evaluatee->id)->assertOk()));
    expect($map['รวมทั้งหมด'][0])->toBe(1);    // เห็นเฉพาะ stakeholder ของ evaluatee ที่เลือก
});
