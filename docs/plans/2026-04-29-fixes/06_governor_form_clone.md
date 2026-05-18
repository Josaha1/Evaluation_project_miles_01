# Governor Form Clone — eval 33 (fy=2025) → eval 41 (fy=2026)

## ปัญหา

ตรวจ DB พบว่า **ไม่มีฟอร์ม Governor Regular สำหรับ fy=2026**:

| eval_id | title | user_type | grade | fiscal_year |
|---|---|---|---|---|
| 33 | ผู้ว่าการ กนอ. (internal) | internal | 13 | **2025** |
| 34 | ผู้ว่าการ กนอ. (external) | external | 13 | 2025 |
| 38 | ประเมินตนเอง ผู้ว่าการ (self) | internal | 13 | 2026 |
| — | governor regular for fy=2026 | — | — | **MISSING** |

→ assignments fy=2026 ของผู้ว่าการที่ angle != self ทุก row ชี้ไปที่ eval 33 (fy=2025) → fiscal_year mismatch (20 row ใน prod)

## Fix

### 1. สร้าง utility script

`scripts/clone_eval_form.php` — clone evaluation form ทั้งหมด (parts/aspects/sub_aspects/questions/options) ไปฟอร์มใหม่ในปีที่ระบุ ในที่เดียวภายใน transaction

```php
function cloneEvalForm(int $sourceId, int $targetFiscalYear): int {
    // 1. Insert evaluation row (copy fields, fiscal_year=$targetFiscalYear)
    // 2. Loop parts → insert with new evaluation_id, build $partMap
    // 3. Loop aspects → insert with mapped part_id
    // 4. Loop sub_aspects → insert with mapped aspect_id
    // 5. Loop questions → insert with mapped part_id/aspect_id/sub_aspect_id
    // 6. Loop options → insert with mapped question_id
    // → return new evaluation id
}
```

Idempotent guard — ถ้ามี form เดิมอยู่แล้ว (same title, type, grade, fy, status='published') → return id เดิม

### 2. Run clone

```bash
php artisan tinker --execute="require base_path('scripts/clone_eval_form.php'); cloneEvalForm(33, 2026);"
```

ผลลัพธ์ทั้ง prod + test:
- เพิ่ม `evaluation.id=41` (governor regular fy=2026)
- 2 parts, 7 aspects, 0 sub_aspects, 31 questions, 140 options

### 3. Re-point governor non-self assignments

```sql
UPDATE evaluation_assignments
SET evaluation_id=41
WHERE fiscal_year=2026
  AND angle != 'self'
  AND evaluatee_id=1042
  AND evaluation_id IN (33, 35);  -- 35 ในกรณี test ที่ผมเคย insert ผิด
```

### 4. Verify

หลัง migration: governor 1042 fy=2026 มี
- self×1 → eval 38
- bottom×20 → eval 41 (รองผวก. 7 + ผช.ผวก. 8 + เลขา 5)
- top×0, left×0, right×0 (ภายในไม่มี evaluator ที่ match — กรรมการ/อนุกรรมการเป็นคนนอก ใช้ external access-code flow)

## Rollback

```sql
-- ย้อน assignments
UPDATE evaluation_assignments SET evaluation_id=33
WHERE fiscal_year=2026 AND angle != 'self' AND evaluatee_id=1042 AND evaluation_id=41;

-- ลบ form 41
DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE part_id IN (SELECT id FROM parts WHERE evaluation_id=41));
DELETE FROM questions WHERE part_id IN (SELECT id FROM parts WHERE evaluation_id=41);
DELETE FROM sub_aspects WHERE aspect_id IN (SELECT id FROM aspects WHERE part_id IN (SELECT id FROM parts WHERE evaluation_id=41));
DELETE FROM aspects WHERE part_id IN (SELECT id FROM parts WHERE evaluation_id=41);
DELETE FROM parts WHERE evaluation_id=41;
DELETE FROM evaluations WHERE id=41;
```

## Files

- `scripts/clone_eval_form.php` (new)
- DB: prod + test
