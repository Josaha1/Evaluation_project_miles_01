# Self-Eval Form Alignment

## ปัญหา

ตรวจ DB พบว่า **636 row ใน prod** (และ 641 ใน test) ของ `evaluation_assignments` ที่ `angle='self'` ผูกกับฟอร์มทั่วไป (regular form) ไม่ใช่ฟอร์ม "ประเมินตนเอง" (self form)

| evaluation_id ที่ใช้ผิด | grade | ควรใช้ | จำนวน (prod) |
|---|---|---|---|
| 37 (พนักงาน 4-8 regular fy=2026) | 4-8 | **40** (self 4-8 fy=2026) | 525 |
| 35 (ผู้บริหาร 9-12 regular fy=2026) | 9-12 | **39** (self 9-12 fy=2026) | 110 |
| 33 (ผู้ว่าการ regular fy=2025) | 13 | **38** (self ผู้ว่าการ fy=2026) | 1 |

นอกจากนั้น ในฝั่ง `answers` พบว่า self answers (user_id == evaluatee_id) ของ fy=2026 บางส่วนผูกกับ eval_id ของ regular form แทน self form (39 row ใน prod ที่ eval=37)

## ผลกระทบ

- **ตอน user กรอกฟอร์ม**: SelfEvaluationController ใช้ `EvaluationLookupService::findSelfEvalByGrade()` (lookup จาก grade) → กรอกฟอร์มที่ถูกต้อง ✓
- **Reports/Exports**: JOIN `answers ↔ assignments` ที่ต้องตรงกันทุกคอลัมน์ — ถ้า assignment.eval_id ผิด → row ไม่ปรากฏใน export

## Fix

### Migration SQL (transaction)

```sql
START TRANSACTION;

-- Backup
CREATE TABLE _backup_assignments_fix_20260429 AS
  SELECT * FROM evaluation_assignments
  WHERE fiscal_year=2026 AND angle='self' AND evaluation_id IN (37, 35, 33);

CREATE TABLE _backup_answers_fix_20260429 AS
  SELECT * FROM answers
  WHERE fiscal_year=2026 AND user_id=evaluatee_id AND evaluation_id IN (37, 35, 33);

-- Re-point assignments
UPDATE evaluation_assignments SET evaluation_id=40 WHERE fiscal_year=2026 AND angle='self' AND evaluation_id=37;
UPDATE evaluation_assignments SET evaluation_id=39 WHERE fiscal_year=2026 AND angle='self' AND evaluation_id=35;
UPDATE evaluation_assignments SET evaluation_id=38 WHERE fiscal_year=2026 AND angle='self' AND evaluation_id=33;

-- Re-point answers (self answers ที่บันทึกที่ eval ผิด)
UPDATE answers SET evaluation_id=40 WHERE fiscal_year=2026 AND user_id=evaluatee_id AND evaluation_id=37;
UPDATE answers SET evaluation_id=39 WHERE fiscal_year=2026 AND user_id=evaluatee_id AND evaluation_id=35;
UPDATE answers SET evaluation_id=38 WHERE fiscal_year=2026 AND user_id=evaluatee_id AND evaluation_id=33;

COMMIT;
```

## ผลลัพธ์ (audit หลัง migration)

- prod: 6,206 assignments → ok ทั้งหมด (จากเดิม 5,550 ok + 656 ผิด)
- test: 6,224 assignments → ok ทั้งหมด

## Rollback

```sql
START TRANSACTION;
-- Revert assignments
DELETE FROM evaluation_assignments WHERE id IN (SELECT id FROM _backup_assignments_fix_20260429);
INSERT INTO evaluation_assignments SELECT * FROM _backup_assignments_fix_20260429;
-- Revert answers
DELETE FROM answers WHERE id IN (SELECT id FROM _backup_answers_fix_20260429);
INSERT INTO answers SELECT * FROM _backup_answers_fix_20260429;
COMMIT;
```

## Note

- Mapping eval-id ใน prod = test (ทั้งสอง DB มี eval id ตรงกัน — 37, 35, 33, 38, 39, 40, 41)
- Self answers ใน prod ที่ migrate: 39 row (จาก eval=37 → 40)
- การ migrate นี้ไม่ทำให้ user เห็นความแตกต่างขณะกรอกฟอร์ม (lookup-by-grade ใช้ form ถูกอยู่แล้ว) แต่ทำให้ export/report สมบูรณ์
