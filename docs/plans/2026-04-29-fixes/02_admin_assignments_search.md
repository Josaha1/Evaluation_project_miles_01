# Admin Assignments — Search by Evaluatee

## ปัญหา

หน้า `/admin/assignments?fiscal_year=2026&search=สุเมธ&view=card` ไม่แสดงข้อมูลของผู้ถูกประเมิน

UI ออกแบบเป็น **evaluatee-centric** (1 card = 1 ผู้ถูกประเมิน, ภายในแสดง evaluators แยกตาม angle):
- placeholder: `"ค้นหาชื่อหรือ EMID ผู้ถูกประเมิน..."`  (`AdminEvaluationAssignmentManager.tsx:680`)
- frontend group by `evaluatee_id` (`evaluateeGroups` line 204)

แต่ controller (`AdminEvaluationAssignmentController::index`) ค้นจาก `evaluator` name → ไม่ตรง intent

## Root Cause

`app/Http/Controllers/AdminEvaluationAssignmentController.php` ใช้ `whereHas('evaluator', ...)` ใน 4 จุด:
| Line | Method | ผลกระทบ |
|---|---|---|
| 48 | `index()` | search หลัก |
| 1110 | `calculateKPIs()` | KPI |
| 1826 | `getBasicAnalytics()` | analytics summary cards |
| 1914 | `getCompletedEvaluatorsCount()` | completed count |

ตัวอย่าง: search "สุเมธ" (id=1042) → match เฉพาะ row ที่ evaluator=1042 → เจอแค่ self (1 row) → 4 angle อื่นว่าง

## Fix

เปลี่ยน 4 จุดเป็น `whereHas('evaluatee', ...)` + เพิ่ม `emid` ใน search:

```php
$baseQuery->whereHas('evaluatee', function ($query) use ($search) {
    $query->where('fname', 'like', "%{$search}%")
        ->orWhere('lname', 'like', "%{$search}%")
        ->orWhere('emid', 'like', "%{$search}%")
        ->orWhereRaw("CONCAT(fname, ' ', lname) LIKE ?", ["%{$search}%"]);
});
```

`getBasicAnalytics` + `getCompletedEvaluatorsCount` เปลี่ยน join:
```php
->join('users as u', 'evaluation_assignments.evaluatee_id', '=', 'u.id')  // was evaluator_id
```

## Verify

หลัง fix: search "สุเมธ" → คืน assignments ที่ evaluatee=1042 ทั้งหมด → frontend จัดเป็น 1 card สุเมธ + แสดง evaluators แยก self/top/bottom/left/right

## Files

- `app/Http/Controllers/AdminEvaluationAssignmentController.php`
