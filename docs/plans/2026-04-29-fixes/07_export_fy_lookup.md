# Export — Fiscal-Year-Aware Evaluation Lookup

## ปัญหา

หลังจาก migration self/governor forms (เอกสาร 05, 06) มี evaluation form ปี 2025 และ 2026 หลายตัวสำหรับ grade เดียวกัน ทำให้ export ที่ไม่ filter ปีงบประมาณตอน lookup จะคืน form ผิดปี

ตัวอย่าง:
```php
// ❌ ไม่กรอง fy → คืน form แรกเสมอ (มัก = oldest = fy=2025)
$execEval = Evaluation::where('user_type', 'internal')
    ->where('grade_min', 9)->where('grade_max', 12)
    ->where('title', 'like', '%360%')
    ->where('status', 'published')->first();
```

ถ้า admin export ปี 2026 แต่ระบบใช้ form fy=2025 → answers ที่ join ได้ = 0 → export เปล่า

## Root Cause

2 ที่ที่ไม่ใช้ `EvaluationLookupService::findByGrade()` ที่รองรับ fy filter:

| File:Line | Method | ผลกระทบ |
|---|---|---|
| `EvaluationExportService.php:122` | `createSummarySheet()` (Comprehensive Excel) | summary ของ Exec/Emp/Gov ใน sheet สรุปภาพรวม |
| `AdminEvaluationReportController.php:1986` | `exportDetailedEvaluationData()` (Detailed Excel) | กรณี request ส่ง `grade_lookup` แทน `evaluation_id` |

## Fix

### `EvaluationExportService.php`
```php
$fy = !empty($filters['fiscal_year']) ? (int) $filters['fiscal_year'] : null;
$execEval = EvaluationLookupService::findByGrade(10, 'internal', $fy);
$empEval  = EvaluationLookupService::findByGrade(6,  'internal', $fy);
$govEval  = EvaluationLookupService::findByGrade(13, 'internal', $fy);
```

### `AdminEvaluationReportController.php`
```php
if (!$evaluationId && $request->input('grade_lookup')) {
    $gradeLookup = (int) $request->input('grade_lookup');
    $evaluation = \App\Services\EvaluationLookupService::findByGrade(
        $gradeLookup,
        'internal',
        $fiscalYear ? (int) $fiscalYear : null
    );
    $evaluationId = $evaluation?->id;
}
```

## Smoke test (prod fy=2026)

| Group | resolved eval_id | answers joinable |
|---|---|---|
| Governor (13) | 41 (clone fy=2026) | 0 (ยังไม่มี answer) |
| Executive (10) | 35 (fy=2026) | 86 ✓ |
| Staff (6) | 37 (fy=2026) | 117 ✓ |
| Self 4-8 | 40 | 328 ✓ |
| Self 9-12 | 39 | 39 ✓ |
| Self Governor | 38 | 0 (สุเมธ ยังไม่กรอก) |

## Export ที่ได้ผลประโยชน์

ทุก endpoint ใน `routes/web.php:347-365`:
- `/admin/reports/export-individual`
- `/admin/reports/export-raw-data`
- `/admin/reports/export-completion-data`
- `/admin/reports/export-detailed`
- `/admin/reports/export-individual-detailed`
- `/admin/reports/export-individual-pdf`
- `/admin/reports/export-comprehensive-pdf`

(หลายตัวเรียกผ่าน `EvaluationExportService` ซึ่งใช้ `EvaluationLookupService` อยู่แล้วใน method ระดับ sheet — เพิ่ง summary sheet ที่หาย)

## Files

- `app/Services/EvaluationExportService.php`
- `app/Http/Controllers/AdminEvaluationReportController.php`
