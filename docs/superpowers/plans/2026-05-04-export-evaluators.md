# Export ผู้ประเมิน (Evaluator-Centric Export) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม export xlsx ในมุมมอง "ผู้ประเมิน" (รายแถว = 1 ผู้ประเมิน, คอลัมน์องศาบน/ล่าง/ซ้าย/ขวา = list ผู้ถูกประเมิน) เข้าหน้า `/admin/assignments`

**Architecture:** Service ใหม่ `EvaluatorAssignmentExportService` รับ fiscal_year + filters → คืน `Spreadsheet` (PhpSpreadsheet) ที่มี sheet ตามระดับผู้ประเมิน + sheet "External Evaluators". Controller บาง ๆ stream ไฟล์ออก. Frontend เพิ่มปุ่ม link ที่หน้า Manager ส่ง active filters เป็น query string.

**Tech Stack:** Laravel 11, Inertia, React (TSX), PhpSpreadsheet, Pest 3, Tailwind, lucide-react

**Spec:** `docs/superpowers/specs/2026-05-04-export-evaluators-design.md`

---

## File Structure

| Path | Status | Responsibility |
|---|---|---|
| `app/Services/EvaluatorAssignmentExportService.php` | new | Build `Spreadsheet` จาก assignments |
| `app/Http/Controllers/AdminEvaluationAssignmentController.php` | modify | เพิ่ม method `exportEvaluators(Request)` |
| `routes/web.php` | modify | เพิ่ม route `assignments.export-evaluators` |
| `resources/js/pages/AdminEvaluationAssignmentManager.tsx` | modify | เพิ่มปุ่ม "ส่งออกผู้ประเมิน" |
| `tests/Feature/Admin/ExportEvaluatorsTest.php` | new | Pest feature tests |

---

## Task 1: Skeleton route + controller + happy-path test

**Files:**
- Create: `tests/Feature/Admin/ExportEvaluatorsTest.php`
- Modify: `routes/web.php` (insert after line 266)
- Modify: `app/Http/Controllers/AdminEvaluationAssignmentController.php` (add method, add `use` statements)

- [ ] **Step 1.1: Write failing happy-path test**

Create `tests/Feature/Admin/ExportEvaluatorsTest.php`:

```php
<?php

use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

it('admin can download evaluator export xlsx', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(
        route('assignments.export-evaluators', ['fiscal_year' => 2569])
    );

    expect($response->status())->toBe(200);
    expect($response->headers->get('content-type'))
        ->toContain('spreadsheetml');
    expect($response->headers->get('content-disposition'))
        ->toContain('evaluators-FY2569');
});

it('rejects non-admin', function () {
    $user = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($user)->get(
        route('assignments.export-evaluators', ['fiscal_year' => 2569])
    );

    expect($response->status())->toBeIn([302, 403]);
});
```

- [ ] **Step 1.2: Run test — expect FAIL (route undefined)**

```
php artisan test --filter=ExportEvaluatorsTest
```

Expected: failure with `Route [assignments.export-evaluators] not defined`

- [ ] **Step 1.3: Add route**

In `routes/web.php`, after line 266 (`Route::get('/export', ...)`), add:

```php
        Route::get('/export-evaluators', [AdminEvaluationAssignmentController::class, 'exportEvaluators'])->name('export-evaluators');
```

- [ ] **Step 1.4: Add controller method (skeleton)**

In `app/Http/Controllers/AdminEvaluationAssignmentController.php`:

Add to `use` block at top (after line 14):

```php
use App\Services\EvaluationLookupService;
use App\Services\EvaluatorAssignmentExportService;
use Symfony\Component\HttpFoundation\StreamedResponse;
```

Add method (place after the existing `export()` method around line 1523):

```php
    /**
     * ส่งออกผู้ประเมิน (Evaluator-centric export) — xlsx, แยก sheet ตามระดับ
     */
    public function exportEvaluators(Request $request, EvaluatorAssignmentExportService $service)
    {
        $validated = $request->validate([
            'fiscal_year'    => 'required|integer|between:2500,2700',
            'division_id'    => 'nullable|integer',
            'department_id'  => 'nullable|integer',
            'faction_id'     => 'nullable|integer',
            'grade'          => 'nullable|string|max:10',
            'angle'          => 'nullable|in:top,bottom,left,right',
            'user_type'      => 'nullable|in:internal,external',
            'search'         => 'nullable|string|max:255',
        ]);

        $fiscalYear = (int) $validated['fiscal_year'];
        $filters    = collect($validated)->except('fiscal_year')->filter()->all();

        try {
            $spreadsheet = $service->build($fiscalYear, $filters);

            $filename = sprintf(
                'evaluators-FY%d-%s.xlsx',
                $fiscalYear,
                Carbon::now()->format('Ymd-His')
            );

            return new StreamedResponse(function () use ($spreadsheet) {
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
                $writer->save('php://output');
            }, 200, [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control'       => 'no-store, no-cache',
            ]);
        } catch (\Throwable $e) {
            Log::error('Export evaluators error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'เกิดข้อผิดพลาดในการส่งออก: ' . $e->getMessage()], 500);
        }
    }
```

- [ ] **Step 1.5: Add minimal Service stub (so first test passes)**

Create `app/Services/EvaluatorAssignmentExportService.php`:

```php
<?php

namespace App\Services;

use App\Models\EvaluationAssignment;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class EvaluatorAssignmentExportService
{
    /** Internal grade groups → sheet name */
    public const SHEET_GROUPS = [
        'ระดับ 13 (ผวก.)' => [13],
        'ระดับ 12'        => [12],
        'ระดับ 11'        => [11],
        'ระดับ 10'        => [10],
        'ระดับ 9'         => [9],
        'ระดับ 5-8'       => [5, 6, 7, 8],
        'ระดับ 4'         => [4],
    ];

    public const EXTERNAL_SHEET = 'External Evaluators';

    public const HEADERS = [
        'A' => 'รหัสพนักงาน',
        'B' => 'คำนำหน้า',
        'C' => 'ชื่อ',
        'D' => 'นามสกุล',
        'E' => 'ตำแหน่ง',
        'F' => 'ระดับ',
        'G' => 'กอง',
        'H' => 'ฝ่าย',
        'I' => 'สายงาน',
        'J' => 'ประเมินตนเอง',
        'K' => 'ประเมินเป็นองศาบนของ',
        'L' => 'ประเมินเป็นองศาล่างของ',
        'M' => 'ประเมินเป็นองศาซ้ายของ',
        'N' => 'ประเมินเป็นองศาขวาของ',
    ];

    public function build(int $fiscalYear, array $filters = []): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $assignments = $this->queryAssignments($fiscalYear, $filters);
        $byEvaluator = $this->groupByEvaluator($assignments);
        $bySheet     = $this->bucketIntoSheets($byEvaluator);

        $sheetIndex = 0;
        foreach ($bySheet as $sheetName => $evaluators) {
            if (empty($evaluators)) continue;
            $this->writeSheet($spreadsheet, $sheetName, $evaluators, $sheetIndex++);
        }

        // Always have at least one sheet so xlsx is valid
        if ($spreadsheet->getSheetCount() === 0) {
            $this->writeSheet($spreadsheet, 'ระดับ 10', [], 0);
        }

        $spreadsheet->setActiveSheetIndex(0);
        return $spreadsheet;
    }

    protected function queryAssignments(int $fiscalYear, array $filters)
    {
        return EvaluationAssignment::with([
            'evaluator:id,emid,prename,fname,lname,grade,user_type,position_id,division_id,department_id,faction_id',
            'evaluator.position:id,title',
            'evaluator.division:id,name',
            'evaluator.department:id,name',
            'evaluator.faction:id,name',
            'evaluatee:id,emid,prename,fname,lname,grade,user_type,position_id',
            'evaluatee.position:id,title',
        ])
        ->where('fiscal_year', $fiscalYear)
        ->when(isset($filters['division_id']),   fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('division_id', $filters['division_id'])))
        ->when(isset($filters['department_id']), fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('department_id', $filters['department_id'])))
        ->when(isset($filters['faction_id']),    fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('faction_id', $filters['faction_id'])))
        ->when(isset($filters['grade']),         fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('grade', $filters['grade'])))
        ->when(isset($filters['user_type']),    fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('user_type', $filters['user_type'])))
        ->when(isset($filters['angle']),         fn($q) => $q->where('angle', $filters['angle']))
        ->when(isset($filters['search']),        function ($q) use ($filters) {
            $s = $filters['search'];
            $q->whereHas('evaluator', function ($e) use ($s) {
                $e->where('fname', 'like', "%{$s}%")
                  ->orWhere('lname', 'like', "%{$s}%")
                  ->orWhere('emid', 'like', "%{$s}%");
            });
        })
        ->get();
    }

    protected function groupByEvaluator($assignments): array
    {
        $byEvaluator = [];
        foreach ($assignments as $a) {
            if (!$a->evaluator) continue;
            $eid = $a->evaluator_id;
            if (!isset($byEvaluator[$eid])) {
                $byEvaluator[$eid] = [
                    'user'         => $a->evaluator,
                    'self_eval'    => false,
                    'top'          => [],
                    'bottom'       => [],
                    'left'         => [],
                    'right'        => [],
                ];
            }
            if ($a->evaluator_id === $a->evaluatee_id) {
                $byEvaluator[$eid]['self_eval'] = true;
                continue;
            }
            $angle = $a->angle;
            if (in_array($angle, ['top','bottom','left','right'], true)) {
                $byEvaluator[$eid][$angle][] = $a->evaluatee;
            }
        }
        return $byEvaluator;
    }

    protected function bucketIntoSheets(array $byEvaluator): array
    {
        $buckets = array_fill_keys(array_keys(self::SHEET_GROUPS), []);
        $buckets[self::EXTERNAL_SHEET] = [];

        foreach ($byEvaluator as $row) {
            $user = $row['user'];
            $userType = $user->user_type instanceof \BackedEnum
                ? $user->user_type->value
                : $user->user_type;

            if ($userType === 'external') {
                $buckets[self::EXTERNAL_SHEET][] = $row;
                continue;
            }

            $grade = (int) $user->grade;
            foreach (self::SHEET_GROUPS as $sheet => $grades) {
                if (in_array($grade, $grades, true)) {
                    $buckets[$sheet][] = $row;
                    break;
                }
            }
        }
        return $buckets;
    }

    protected function writeSheet(Spreadsheet $spreadsheet, string $sheetName, array $evaluators, int $index): void
    {
        $sheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, $sheetName);
        $spreadsheet->addSheet($sheet, $index);

        // Title row
        $sheet->setCellValue('A1', 'ผู้ประเมิน — ' . $sheetName);
        $sheet->mergeCells('A1:N1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        // Header row
        foreach (self::HEADERS as $col => $label) {
            $sheet->setCellValue($col . '2', $label);
        }
        $sheet->getStyle('A2:N2')->getFont()->setBold(true);
        $sheet->freezePane('A3');

        $r = 3;
        foreach ($evaluators as $row) {
            $u = $row['user'];
            $sheet->setCellValueExplicit("A{$r}", (string) ($u->emid ?? ''), \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("B{$r}", $u->prename);
            $sheet->setCellValue("C{$r}", $u->fname);
            $sheet->setCellValue("D{$r}", $u->lname);
            $sheet->setCellValue("E{$r}", optional($u->position)->title ?? '');
            $sheet->setCellValue("F{$r}", (string) ($u->grade ?? ''));
            $sheet->setCellValue("G{$r}", optional($u->department)->name ?? '');
            $sheet->setCellValue("H{$r}", optional($u->division)->name ?? '');
            $sheet->setCellValue("I{$r}", optional($u->faction)->name ?? '');
            $sheet->setCellValue("J{$r}", $row['self_eval'] ? '/' : '');
            $sheet->setCellValue("K{$r}", $this->formatList($row['top']));
            $sheet->setCellValue("L{$r}", $this->formatList($row['bottom']));
            $sheet->setCellValue("M{$r}", $this->formatList($row['left']));
            $sheet->setCellValue("N{$r}", $this->formatList($row['right']));
            $sheet->getStyle("K{$r}:N{$r}")->getAlignment()->setWrapText(true)->setVertical('top');
            $r++;
        }

        foreach (range('A','N') as $c) {
            $sheet->getColumnDimension($c)->setAutoSize(true);
        }
    }

    protected function formatList(array $evaluatees): string
    {
        if (empty($evaluatees)) return '';
        $lines = [];
        foreach ($evaluatees as $e) {
            $title = optional($e->position)->title ?? '';
            $lines[] = sprintf('- %s %s %s %s',
                trim($e->prename ?? ''),
                trim($e->fname ?? ''),
                trim($e->lname ?? ''),
                trim($title)
            );
        }
        return implode("\n", $lines);
    }
}
```

- [ ] **Step 1.6: Run test — expect PASS**

```
php artisan test --filter=ExportEvaluatorsTest
```

Expected: 2 passed (admin downloads xlsx; non-admin rejected)

If "non-admin rejected" fails because the route group doesn't enforce admin-only middleware, check `routes/web.php` — the `admin/assignments` group should already be inside an admin middleware. If not, the spec assumes existing middleware; do not add new middleware here, and adjust the test to reflect actual current behavior (assertion should match what the middleware stack produces).

- [ ] **Step 1.7: Commit**

```bash
git add app/Services/EvaluatorAssignmentExportService.php \
        app/Http/Controllers/AdminEvaluationAssignmentController.php \
        routes/web.php \
        tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "feat(assignments): add evaluator-centric export route + service skeleton"
```

---

## Task 2: Test grouping (1 evaluator → multi-angle row)

**Files:**
- Modify: `tests/Feature/Admin/ExportEvaluatorsTest.php`

- [ ] **Step 2.1: Add grouping test**

Append to test file:

```php
it('groups one evaluator with multiple angles into single row', function () {
    $admin = User::factory()->admin()->create();
    $eval  = Evaluation::factory()->create(['fiscal_year' => 2569, 'is_published' => true]);
    $A = User::factory()->create(['role' => 'user', 'grade' => '10', 'user_type' => 'internal']);
    $B = User::factory()->create(['role' => 'user', 'grade' => '9']);
    $C = User::factory()->create(['role' => 'user', 'grade' => '8']);
    $D = User::factory()->create(['role' => 'user', 'grade' => '7']);

    EvaluationAssignment::create(['evaluator_id'=>$A->id,'evaluatee_id'=>$B->id,'evaluation_id'=>$eval->id,'fiscal_year'=>2569,'angle'=>'top']);
    EvaluationAssignment::create(['evaluator_id'=>$A->id,'evaluatee_id'=>$C->id,'evaluation_id'=>$eval->id,'fiscal_year'=>2569,'angle'=>'bottom']);
    EvaluationAssignment::create(['evaluator_id'=>$A->id,'evaluatee_id'=>$D->id,'evaluation_id'=>$eval->id,'fiscal_year'=>2569,'angle'=>'left']);

    $response = $this->actingAs($admin)->get(route('assignments.export-evaluators', ['fiscal_year' => 2569]));
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
    $sheet = $book->getSheetByName('ระดับ 10');

    expect($sheet)->not->toBeNull();
    expect($sheet->getCell('C3')->getValue())->toBe($A->fname);
    expect($sheet->getCell('K3')->getValue())->toContain($B->fname);
    expect($sheet->getCell('L3')->getValue())->toContain($C->fname);
    expect($sheet->getCell('M3')->getValue())->toContain($D->fname);
    expect($sheet->getCell('N3')->getValue())->toBe('');
    @unlink($tmp);
});
```

Add to top of test file (after `use` block):

```php
use App\Models\Evaluation;
```

- [ ] **Step 2.2: Run — expect PASS** (service already implements grouping)

```
php artisan test --filter="groups one evaluator"
```

Expected: PASS. If it fails, debug `groupByEvaluator()` and `bucketIntoSheets()`.

- [ ] **Step 2.3: Commit**

```bash
git add tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "test(export-evaluators): grouping multi-angle into single row"
```

---

## Task 3: Test self-eval flag

**Files:**
- Modify: `tests/Feature/Admin/ExportEvaluatorsTest.php`

- [ ] **Step 3.1: Add test**

```php
it('marks self-evaluation with /', function () {
    $admin = User::factory()->admin()->create();
    $eval  = Evaluation::factory()->create(['fiscal_year' => 2569, 'is_published' => true]);
    $A = User::factory()->create(['role' => 'user', 'grade' => '10', 'user_type' => 'internal']);

    EvaluationAssignment::create([
        'evaluator_id' => $A->id, 'evaluatee_id' => $A->id,
        'evaluation_id' => $eval->id, 'fiscal_year' => 2569, 'angle' => 'top',
    ]);

    $response = $this->actingAs($admin)->get(route('assignments.export-evaluators', ['fiscal_year' => 2569]));
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
    $sheet = $book->getSheetByName('ระดับ 10');

    expect($sheet->getCell('J3')->getValue())->toBe('/');
    @unlink($tmp);
});
```

- [ ] **Step 3.2: Run — expect PASS**

```
php artisan test --filter="self-evaluation"
```

- [ ] **Step 3.3: Commit**

```bash
git add tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "test(export-evaluators): self-evaluation marker"
```

---

## Task 4: Test sheet routing — internal grade & external

**Files:**
- Modify: `tests/Feature/Admin/ExportEvaluatorsTest.php`

- [ ] **Step 4.1: Add tests**

```php
it('routes internal evaluator to grade sheet only', function () {
    $admin = User::factory()->admin()->create();
    $eval  = Evaluation::factory()->create(['fiscal_year' => 2569, 'is_published' => true]);
    $A = User::factory()->create(['role' => 'user', 'grade' => '10', 'user_type' => 'internal']);
    $B = User::factory()->create(['role' => 'user', 'grade' => '9']);

    EvaluationAssignment::create([
        'evaluator_id' => $A->id, 'evaluatee_id' => $B->id,
        'evaluation_id' => $eval->id, 'fiscal_year' => 2569, 'angle' => 'top',
    ]);

    $response = $this->actingAs($admin)->get(route('assignments.export-evaluators', ['fiscal_year' => 2569]));
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);

    expect($book->getSheetByName('ระดับ 10'))->not->toBeNull();
    expect($book->getSheetByName('ระดับ 10')->getCell('C3')->getValue())->toBe($A->fname);
    expect($book->getSheetByName('ระดับ 9'))->toBeNull();
    expect($book->getSheetByName('External Evaluators'))->toBeNull();
    @unlink($tmp);
});

it('routes external evaluator to External Evaluators sheet', function () {
    $admin = User::factory()->admin()->create();
    $eval  = Evaluation::factory()->create(['fiscal_year' => 2569, 'is_published' => true]);
    $X = User::factory()->create(['role' => 'user', 'user_type' => 'external']);
    $B = User::factory()->create(['role' => 'user', 'grade' => '10', 'user_type' => 'internal']);

    EvaluationAssignment::create([
        'evaluator_id' => $X->id, 'evaluatee_id' => $B->id,
        'evaluation_id' => $eval->id, 'fiscal_year' => 2569, 'angle' => 'right',
    ]);

    $response = $this->actingAs($admin)->get(route('assignments.export-evaluators', ['fiscal_year' => 2569]));
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);

    expect($book->getSheetByName('External Evaluators'))->not->toBeNull();
    expect($book->getSheetByName('External Evaluators')->getCell('C3')->getValue())->toBe($X->fname);
    expect($book->getSheetByName('External Evaluators')->getCell('N3')->getValue())->toContain($B->fname);
    @unlink($tmp);
});
```

- [ ] **Step 4.2: Run — expect PASS**

```
php artisan test --filter="ExportEvaluatorsTest"
```

If user_type column on `users` is enum/string differs from value `'external'`, check `app/Models/User.php` and `database/factories/UserFactory.php` for the actual stored value.

- [ ] **Step 4.3: Commit**

```bash
git add tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "test(export-evaluators): sheet routing per grade and external"
```

---

## Task 5: Test filter respected (division_id)

**Files:**
- Modify: `tests/Feature/Admin/ExportEvaluatorsTest.php`

- [ ] **Step 5.1: Add test**

```php
it('respects division_id filter', function () {
    $admin = User::factory()->admin()->create();
    $eval  = Evaluation::factory()->create(['fiscal_year' => 2569, 'is_published' => true]);

    $A = User::factory()->create(['role' => 'user', 'grade' => '10', 'user_type' => 'internal', 'division_id' => 100]);
    $B = User::factory()->create(['role' => 'user', 'grade' => '10', 'user_type' => 'internal', 'division_id' => 200]);
    $T1 = User::factory()->create(['role' => 'user', 'grade' => '9']);
    $T2 = User::factory()->create(['role' => 'user', 'grade' => '9']);

    EvaluationAssignment::create(['evaluator_id'=>$A->id,'evaluatee_id'=>$T1->id,'evaluation_id'=>$eval->id,'fiscal_year'=>2569,'angle'=>'top']);
    EvaluationAssignment::create(['evaluator_id'=>$B->id,'evaluatee_id'=>$T2->id,'evaluation_id'=>$eval->id,'fiscal_year'=>2569,'angle'=>'top']);

    $response = $this->actingAs($admin)->get(route('assignments.export-evaluators', [
        'fiscal_year' => 2569,
        'division_id' => 100,
    ]));
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);
    $sheet = $book->getSheetByName('ระดับ 10');

    $rows = $sheet->toArray();
    $emids = array_column(array_slice($rows, 2), 0);
    expect($emids)->toContain($A->emid);
    expect($emids)->not->toContain($B->emid);
    @unlink($tmp);
});
```

- [ ] **Step 5.2: Run — expect PASS** (service already wired filters via `when()`)

```
php artisan test --filter="division_id filter"
```

- [ ] **Step 5.3: Commit**

```bash
git add tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "test(export-evaluators): division_id filter scoping"
```

---

## Task 6: Validation tests

**Files:**
- Modify: `tests/Feature/Admin/ExportEvaluatorsTest.php`

- [ ] **Step 6.1: Add tests**

```php
it('rejects missing fiscal_year', function () {
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->getJson(route('assignments.export-evaluators'));
    expect($response->status())->toBe(422);
});

it('rejects out-of-range fiscal_year', function () {
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->getJson(
        route('assignments.export-evaluators', ['fiscal_year' => 9999])
    );
    expect($response->status())->toBe(422);
});

it('rejects invalid angle', function () {
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->getJson(
        route('assignments.export-evaluators', ['fiscal_year' => 2569, 'angle' => 'diagonal'])
    );
    expect($response->status())->toBe(422);
});
```

- [ ] **Step 6.2: Run — expect PASS**

```
php artisan test --filter="ExportEvaluatorsTest"
```

- [ ] **Step 6.3: Commit**

```bash
git add tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "test(export-evaluators): request validation"
```

---

## Task 7: Empty-result test

**Files:**
- Modify: `tests/Feature/Admin/ExportEvaluatorsTest.php`

- [ ] **Step 7.1: Add test**

```php
it('produces valid xlsx when no assignments exist', function () {
    $admin = User::factory()->admin()->create();
    $response = $this->actingAs($admin)->get(
        route('assignments.export-evaluators', ['fiscal_year' => 2569])
    );

    expect($response->status())->toBe(200);
    $tmp = tempnam(sys_get_temp_dir(), 'xlsx_');
    file_put_contents($tmp, $response->getContent());
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmp);

    expect($book->getSheetCount())->toBeGreaterThan(0);
    expect($book->getSheet(0)->getCell('A2')->getValue())->toBe('รหัสพนักงาน');
    @unlink($tmp);
});
```

- [ ] **Step 7.2: Run — expect PASS**

```
php artisan test --filter="no assignments"
```

- [ ] **Step 7.3: Commit**

```bash
git add tests/Feature/Admin/ExportEvaluatorsTest.php
git commit -m "test(export-evaluators): empty result still produces valid xlsx"
```

---

## Task 8: Add UI button on AdminEvaluationAssignmentManager

**Files:**
- Modify: `resources/js/pages/AdminEvaluationAssignmentManager.tsx` (around line 637, next to the existing import button)

- [ ] **Step 8.1: Locate icon import**

Open file. Find the import line `import { ... } from "lucide-react"` (look near top of file). Add `Download` to the imports if not already present:

```tsx
import { Download, Upload, /* existing icons stay */ } from "lucide-react";
```

(if `Download` is already imported, skip this step)

- [ ] **Step 8.2: Add button next to import**

In `resources/js/pages/AdminEvaluationAssignmentManager.tsx`, locate the existing import button (around line 637):

```tsx
<a href={route("assignments.import")} className="inline-flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-md"><Upload className="w-4 h-4 mr-1.5"/>นำเข้า Excel</a>
```

Immediately after that `<a>`, add:

```tsx
<a
  href={route("assignments.export-evaluators", {
    fiscal_year: fiscalYear,
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(filterGrade !== "all" ? { grade: filterGrade } : {}),
  })}
  className="inline-flex items-center px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl shadow-md"
  title="ส่งออกผู้ประเมิน (xlsx)"
>
  <Download className="w-4 h-4 mr-1.5"/>ส่งออกผู้ประเมิน
</a>
```

Verify the variable names `fiscalYear`, `searchTerm`, `filterGrade` exist in the component's state (search the file). If any variable has a different name in this codebase, replace with the actual name. Do not invent variables that don't exist — drop the param if so.

- [ ] **Step 8.3: Type-check / build**

```
npm run build
```

Expected: build succeeds with no TS errors. If a state variable name doesn't match, fix the param key list.

- [ ] **Step 8.4: Commit**

```bash
git add resources/js/pages/AdminEvaluationAssignmentManager.tsx
git commit -m "feat(assignments): add ส่งออกผู้ประเมิน button"
```

---

## Task 9: Manual smoke test

**Files:** none

- [ ] **Step 9.1: Run dev server + login as admin**

```
php artisan serve
npm run dev
```

Navigate to `/admin/assignments`. Sign in as admin.

- [ ] **Step 9.2: Click button, verify download**

Click "ส่งออกผู้ประเมิน". A file `evaluators-FY{year}-{timestamp}.xlsx` downloads.

Open the file, verify:
- Multiple sheets present (one per grade with data + External Evaluators if any)
- Headers in row 2 match spec table
- Each row = 1 evaluator with their org info
- Cells K-N contain "- {prename} {fname} {lname} {position}" lines, wrap-text enabled
- Self-evaluation rows have "/" in column J

If any cell is malformed, debug `formatList()` or `writeSheet()` in the service.

- [ ] **Step 9.3: Verify filter passes through**

Filter by a single division on the Manager page (use existing UI), then click export. Open file → confirm only evaluators in that division appear.

- [ ] **Step 9.4: Commit (no code changes; just verify run-through)**

No commit needed.

---

## Task 10: Update doc index

**Files:**
- Modify: `docs/00_index.md`

- [ ] **Step 10.1: Add reference**

Open `docs/00_index.md`. Find the section that lists assignment-related documents (or the export/report section). Add a single entry:

```markdown
- [Export ผู้ประเมิน (Evaluator-Centric Export)](superpowers/specs/2026-05-04-export-evaluators-design.md) — รายแถว = ผู้ประเมิน 1 คน
```

If unsure where to place, add under the existing "## Specs" or "## Plans" heading. If neither exists, append a new heading `## Specs` at the end.

- [ ] **Step 10.2: Commit**

```bash
git add docs/00_index.md
git commit -m "docs: index evaluator-centric export spec"
```

---

## Self-Review Notes

- **Spec coverage:** routes (T1), service skeleton (T1), grouping (T2), self-eval (T3), sheet routing (T4), filters (T5), validation (T6), empty result (T7), UI button (T8), smoke (T9), docs (T10). All sections in spec map to a task.
- **Placeholder scan:** none. All test code, service code, controller code provided in full.
- **Type consistency:** `evaluator`, `evaluatee`, `evaluation_id`, `fiscal_year`, `angle` consistent with model. `user_type` checked as both string and BackedEnum (matches `getEvaluatorsByAngle` pattern in existing controller).
- **Risks/Watch-outs:**
  - The `division`/`department`/`faction` relationships exist on User per `getEvaluateeInfo` and `getEvaluatorsByAngle` patterns; if a user is missing these, `optional()` covers null safely.
  - Template "กอง"/"ฝ่าย" mapping to `department`/`division` matches existing Manager spec table — verify against any organizational docs and adjust column-G/H mapping if reversed.
  - If the route group does not enforce admin middleware, the non-admin test (1.6) needs to be removed or adjusted; do not add new middleware unilaterally.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-04-export-evaluators.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session with checkpoints for review

Which approach?
