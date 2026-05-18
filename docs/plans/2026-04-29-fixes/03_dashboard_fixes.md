# Dashboard — Multiple Fixes

แก้ไข `/dashboard` (controller + frontend) 3 ประเด็น

## 1. ส่วน "ประเมินผู้ว่าการ" ไม่แสดง

### ปัญหา
- Frontend `Dashboard.tsx:439-442` filter governor card ด้วย `grade >= 13`
- ผู้ว่าการ (id=1042 สุเมธ) เคยมี `grade=12` → ไม่ entered governor card

### Fix
**ไม่ใช่ code bug** — ต้องอัปเดต `users.grade` ของผู้ว่าการ จริง = 13 ใน DB

---

## 2. ชื่อตัวเองโผล่ในการ์ดที่ไม่ใช่ "ประเมินตนเอง"

### ปัญหา

`EvaluationAssignmentController::index()` ดึง assignments ทั้งหมดที่ `evaluator_id = userId`:
```php
$rawAssignments = EvaluationAssignment::with([...])
    ->where('evaluator_id', $userId)
    ->where('fiscal_year', $fiscalYear)
    ->whereHas('evaluatee')
    ->get();
```

→ รวม row `angle='self'` (evaluator==evaluatee) → frontend categorize ตาม grade → user เห็นชื่อตัวเองใน executive/staff card

### Fix

`app/Http/Controllers/EvaluationAssignmentController.php` เพิ่ม filter:
```php
->whereColumn('evaluator_id', '!=', 'evaluatee_id')
```

Self-eval ยังคงแสดงในการ์ด "ประเมินตนเอง" ผ่านตัวแปร `$selfEvaluation` ที่แยกจาก target

---

## 3. ลบ Self-Eval Gate (Step 2 ถูก lock จนกว่า self จะเสร็จ)

### ปัญหา

`Dashboard.tsx`:
- L1310: ครอบ step 2 ด้วย `opacity-50 pointer-events-none select-none` ถ้า `!selfCompleted`
- L594-597, L638-641: `handleCategoryClick` + `handleEvaluateeClick` block click + toast เตือน
- L1354: `isLocked = !selfCompleted` ครอบการ์ด disabled button

User ไม่สามารถ **ดู** รายชื่อผู้ที่ต้องประเมินได้จนกว่าจะทำ self ครบ

### Fix

`resources/js/pages/Dashboard.tsx`:
- ลบ block ใน `handleCategoryClick` + `handleEvaluateeClick`
- ลบ class `opacity-50 pointer-events-none` ออกจาก step 2 wrapper
- ตั้ง `isLocked = false`

**คงไว้** (visual hint):
- Lock icon + ข้อความ "กรุณาทำแบบประเมินตนเองให้เสร็จก่อน" ที่เส้นคั่น step
- ตัวเลข "2" ของ step 2 ยังเป็นสีเทา จน self complete

---

## Files

- `app/Http/Controllers/EvaluationAssignmentController.php` (1 บรรทัด)
- `resources/js/pages/Dashboard.tsx` (4 จุด)
