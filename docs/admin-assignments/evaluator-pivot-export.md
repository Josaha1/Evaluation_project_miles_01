# Admin Assignments — Evaluator-Centric Excel Export

> Updated 2026-05-05

## Goal

ทีมงานต้องการ Excel ส่งออกจาก `/admin/assignments` ที่:
- 1 row = 1 ผู้ประเมิน (ตรงข้าม template เดิมที่ 1 row = 1 ผู้ถูกประเมิน)
- แยก column **ตามแบบประเมิน** (4-8 / 9-12 / ผู้ว่าการ ฯลฯ)
- แต่ละ cell แสดงรายชื่อผู้ถูกประเมิน + ระดับ + สายงาน
- ใช้ตรวจสอบกับหน้าเว็บว่าแสดงครบถูกต้อง

## Endpoint

```
GET /admin/assignments/export?fiscal_year=2026[&include_stakeholders=1]
```

ปุ่มสีส้ม **"ส่งออก Excel"** บนหน้า `/admin/assignments` (ข้างปุ่ม "นำเข้า Excel")

## Layout

Single sheet "รายชื่อผู้ประเมิน":

| ลำดับ | รหัส | ชื่อผู้ประเมิน | ตำแหน่ง | ระดับ | สายงาน | ตนเอง | <eval 1> | <eval 2> | ... |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 | นาย ก ขขข | ผอ. | 9 | สายงาน X | ✓ | [3 ราย] 1. นาย ค · ระดับ 6 · สายงาน X | [2 ราย] 1. นาย ง · ระดับ 7 · สายงาน Y | - |

### Column mapping
- A-G: ข้อมูล evaluator + ✓ ตนเอง
- H+: dynamic — 1 column ต่อ evaluation form ที่มีการ assignment

### Column header (auto label)
ตัด prefix ทำให้สั้นลง:
- `แบบประเมิน 360 องศา สำหรับพนักงานระดับ 4-8 สำหรับพนักงาน` → `พนักงานระดับ 4-8 · พนักงาน`
- `แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายใน` → `ผู้ว่าการ กนอ. · บุคลากรภายใน`

### Self-evaluation forms
แบบประเมินที่ title มี "ประเมินตนเอง" (ids 38/39/40) **ถูกตัดออก** จาก columns เพราะข้อมูลซ้ำกับ column "ตนเอง" (✓)

## Cell content

Format:
```
[3 ราย]
1. นาย ก ข · ระดับ 6 · สายงานปฏิบัติการ 1
2. นาง ค ง · ระดับ 7 · สายงานบริหาร
3. นาย จ ฉ · ระดับ 5 · สายงาน...
```

Wrap text + auto row height (cap 400)

## Visual

- Header: น้ำเงินเข้ม `#5B6FBC` พื้น + ขาว font
- Zebra: แถวคี่พื้น `#F8F9FE`
- Stakeholder ภายนอก: พื้นน้ำตาลอ่อน `#FFF7E6`
- Border: เทา `#D5DAE8`
- Freeze pane: C3 (ลื่นยังเห็นรหัส + ชื่อ)

## Stakeholder integration

ถ้า `include_stakeholders=1` (default true):
- query `external_stakeholders` join `external_access_codes.evaluation_id`
- bucket ลง column ของ evaluation นั้น (ปกติคือแบบ "ภายนอก")
- evaluator name = `organization_name`, position = `contact_person`

## Files

- `app/Http/Controllers/AdminEvaluationAssignmentController.php`
  - `export()` — entry point
- `app/Services/EvaluationExportService.php`
  - `exportAssignmentsByEvaluator()` — fetch + pivot
  - `buildEvaluatorPivotSheet()` — render
  - `formatEvaluateePivotList()` — cell content
  - `evaluationColumnLabel()` — header shorten

## Iterations

1. v1: 2 sheets (summary + detail line-by-line)
2. v2: 1 sheet per evaluation form
3. v3 (final): 1 sheet, columns ตาม evaluation form, cell มีรายชื่อพร้อมระดับ + สายงาน
