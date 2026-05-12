# Export ผู้ประเมิน (Evaluator-Centric Export) — Design

**วันที่:** 2026-05-04
**ผู้เขียน:** brainstorming session
**สถานะ:** approved (รอ implementation plan)

## Goal

เพิ่มปุ่ม Export บนหน้า `/admin/assignments` เพื่อส่งออกข้อมูล "ผู้ประเมิน" — แต่ละแถวคือผู้ประเมิน 1 คน พร้อมรายชื่อผู้ที่เขาต้องประเมินแบ่งตามองศา (mirror ของ template `docs/ประเมิน 360 องศา ปี 2569 (ข้อมูลองศาประเมิน)/*.xlsx` ซึ่งปัจจุบันเป็นมุมมองของผู้ถูกประเมิน)

## Non-Goals

- ไม่แก้ไข export เดิม (`/admin/assignments/export`) ที่ยัง stub อยู่
- ไม่รองรับการ import ไฟล์ฟอร์แมตใหม่นี้กลับเข้าระบบ
- ไม่ทำ scheduling / async job — กดแล้ว download ทันที

## Architecture

### Backend
- **Route ใหม่:** `GET /admin/assignments/export-evaluators` → ชื่อ route `assignments.export-evaluators`
- **Controller method:** `AdminEvaluationAssignmentController@exportEvaluators`
- **Service ใหม่:** `app/Services/EvaluatorAssignmentExportService.php`
  - Method หลัก: `build(int $fiscalYear, array $filters): \PhpOffice\PhpSpreadsheet\Spreadsheet`
  - แยก concern: query → group → render sheets
- **Library:** PhpSpreadsheet (มีใน composer แล้ว ใช้ใน `EvaluationExportService`)

### Frontend
- ไฟล์: `resources/js/pages/AdminEvaluationAssignmentManager.tsx`
- เพิ่มปุ่ม "ส่งออกผู้ประเมิน" ข้างปุ่ม import/export ที่มีอยู่
- onClick: เปิด `route('assignments.export-evaluators', { ...activeFilters })` ใน tab ใหม่ → browser ดาวน์โหลด xlsx โดยตรง
- ไม่มี modal — ใช้ filter ที่ active บนหน้าจออยู่แล้ว

## ไฟล์ผลลัพธ์

ชื่อไฟล์: `evaluators-FY{fiscal_year}-{YYYYMMDD-HHmmss}.xlsx`

### Sheets (skip ถ้าไม่มี evaluator)

| ลำดับ | Sheet name | ขอบเขต |
|---|---|---|
| 1 | `ระดับ 13 (ผวก.)` | internal, grade=13 |
| 2 | `ระดับ 12` | internal, grade=12 |
| 3 | `ระดับ 11` | internal, grade=11 |
| 4 | `ระดับ 10` | internal, grade=10 |
| 5 | `ระดับ 9` | internal, grade=9 |
| 6 | `ระดับ 5-8` | internal, grade ∈ {5,6,7,8} |
| 7 | `ระดับ 4` | internal, grade=4 |
| 8 | `External Evaluators` | user_type=external |

### Columns (ทุก sheet)

| Col | Header | Source | Note |
|---|---|---|---|
| A | รหัสพนักงาน | `evaluator.emid` | |
| B | คำนำหน้า | `evaluator.prename` | |
| C | ชื่อ | `evaluator.fname` | |
| D | นามสกุล | `evaluator.lname` | |
| E | ตำแหน่ง | `evaluator.position.title` | |
| F | ระดับ | `evaluator.grade` | ว่างถ้า external |
| G | กอง | `evaluator.department.name` | |
| H | ฝ่าย | `evaluator.division.name` | |
| I | สายงาน | `evaluator.faction.name` | |
| J | ประเมินตนเอง | `/` | ถ้ามี assignment ที่ evaluator_id=evaluatee_id |
| K | ประเมินเป็นองศาบนของ | list (angle=top) | |
| L | ประเมินเป็นองศาล่างของ | list (angle=bottom) | |
| M | ประเมินเป็นองศาซ้ายของ | list (angle=left) | |
| N | ประเมินเป็นองศาขวาของ | list (angle=right) | ปกติมีค่าเฉพาะ external |

### Cell format (รายการในคอลัมน์ K-N)

ตรงกับ pattern ใน template เดิม:

```
- {prename} {fname} {lname} {position.title}
- {prename} {fname} {lname} {position.title}
```

- ขีดนำ + space, แต่ละคนคั่นด้วย `\n`
- ใช้ `position.title` ตรงๆ (ไม่ map คำย่อใน iteration นี้ — ถ้าต้องการคำย่อ ค่อยทำ phase 2)
- Cell ตั้ง `wrapText = true`

### Header style
- Row 1: title sheet เช่น `ผู้ประเมิน ระดับ 10` (merge A1:N1)
- Row 2: header columns
- Bold header, freeze pane ที่ row 3

## Data flow

```
Request (fiscal_year + filters)
  → Controller validate
  → Service::build()
      ├─ Query EvaluationAssignment WHERE fiscal_year=? AND filters
      │    ->with(evaluator.position/division/department/faction,
      │           evaluatee.position/division/department/faction)
      ├─ Group by evaluator_id
      ├─ สำหรับแต่ละ evaluator:
      │    - แยก list ตาม angle (top/bottom/left/right)
      │    - flag ประเมินตนเอง
      ├─ จัด evaluator เข้า sheet ตาม grade / user_type
      └─ render Spreadsheet
  → Response: xlsx download (Content-Disposition: attachment)
```

## Filters ที่รองรับ

ส่งผ่าน query string จาก state ของหน้า Manager:
- `fiscal_year` (required, default = current Thai year)
- `division_id`
- `department_id`
- `faction_id`
- `grade`
- `angle`
- `user_type`
- `search` (ชื่อ/รหัสพนักงาน — match กับ evaluator)

Filter ทำใน query layer ทั้งหมด (ไม่ filter ใน-memory)

## Validation

- `fiscal_year`: integer, 2500-2700 (ปีไทย)
- ID-based filters: integer, exists in respective tables (ใช้ Laravel validation rules)
- string filters: max:255

## Error handling

- ผลลัพธ์ว่าง → return xlsx ที่มีแต่ sheet header (ไม่ throw)
- Exception → log + return 500 JSON `{message: 'เกิดข้อผิดพลาด...'}`
- Wrap ใน try/catch ที่ controller

## Testing (ตาม TDD policy ใน MEMORY.md)

ไฟล์: `tests/Feature/Admin/ExportEvaluatorsTest.php` (Pest)

Test cases:
1. **Route auth:** non-admin ได้ 403
2. **Happy path:** admin GET → 200 + Content-Type xlsx
3. **Grouping:** evaluator A อยู่ 3 angles ต่าง evaluatees → 1 row, 3 cells มี data
4. **Self-eval flag:** evaluator A มี self-assignment → col J = `/`
5. **Sheet routing:** evaluator grade=10 → อยู่ sheet "ระดับ 10" เท่านั้น
6. **External isolation:** external evaluator → อยู่ sheet "External Evaluators" เท่านั้น
7. **Filter respected:** filter `division_id=X` → ได้เฉพาะ evaluator ใน division นั้น
8. **Empty result:** ไม่มี assignment → xlsx valid + sheet มี header
9. **Validation:** `fiscal_year` ที่ไม่ใช่ int → 422

ใช้ PhpSpreadsheet load xlsx ใน test แล้วตรวจ cell values

## Implementation order

1. Failing test (#2 happy path) → ติด route+controller stub
2. Service skeleton + test #3-6
3. Controller filters + test #7
4. Validation + test #1, #9
5. Edge cases (empty, external) #8
6. UI button + manual smoke test
7. Update doc index `docs/00_index.md`

## Files to touch

**สร้างใหม่:**
- `app/Services/EvaluatorAssignmentExportService.php`
- `tests/Feature/Admin/ExportEvaluatorsTest.php`

**แก้ไข:**
- `routes/web.php` — เพิ่ม route
- `app/Http/Controllers/AdminEvaluationAssignmentController.php` — เพิ่ม `exportEvaluators()`
- `resources/js/pages/AdminEvaluationAssignmentManager.tsx` — เพิ่มปุ่ม
- `docs/00_index.md` — เพิ่ม pointer ถ้ามี section export

## Open questions (defer)

- ตำแหน่งย่อ (เช่น "ผอ.กองพัฒนา" แทน "ผู้อำนวยการกองพัฒนา"): phase 2 ถ้า user request
- Export เป็น PDF: ไม่ทำใน iteration นี้
