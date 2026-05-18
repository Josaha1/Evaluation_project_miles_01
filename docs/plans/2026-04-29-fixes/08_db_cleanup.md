# DB Cleanup — Corrupted Answers in fy=2026

## ปัญหา

หลัง migration assignments (เอกสาร 05, 06) ยังพบ answer rows ที่ **ไม่ตรงกับ assignment**:

JOIN condition ที่ export ใช้:
```sql
SELECT ... FROM answers a
JOIN evaluation_assignments ea
  ON a.evaluation_id = ea.evaluation_id
 AND a.user_id        = ea.evaluator_id
 AND a.evaluatee_id   = ea.evaluatee_id
WHERE ea.fiscal_year = 2026
```

ถ้า `a.evaluation_id != ea.evaluation_id` → JOIN ไม่ติด → answer ไม่ปรากฏใน report

### เคสที่เจอใน fy=2026

| Type | Prod | Test | สาเหตุ |
|---|---|---|---|
| **Mismatch**: answer.eval_id ≠ assignment.eval_id | 127 | 190 | กรอกฟอร์มผ่าน flow ที่ load form ผิด (pre-existing) |
| **Orphan**: answer มี แต่ assignment ไม่มี | 3 | 42 | assignment ถูกลบไปแล้ว แต่ answer ยังคา |
| **รวม** | 130 | 232 | |

ตัวอย่าง mismatch ที่ดูแล้ว: user 449 (grade 8) ประเมิน user 453 (grade 4) angle=left
- assignment.eval=37 (4-8 regular form) ✓ ถูกต้อง
- answer.eval=39 (self 9-12 form) ❌ ผิด — question_id ที่บันทึก (1490+) เป็นของ form 39 ไม่ใช่ form 37

## ทำไม remap eval_id ไม่ได้

answer มี `question_id` ผูกอยู่กับฟอร์มเดิม — ถ้า UPDATE eval_id ไป form ที่ถูก คำถามที่อ้างอิงไม่มีในฟอร์มใหม่ → orphan question_id → คะแนนคำนวณไม่ได้

## Fix — Delete corrupt answers

### Backup-then-Delete (transaction)

```sql
START TRANSACTION;

CREATE TABLE _backup_answers_corrupt_20260429 AS
  SELECT a.* FROM answers a
  JOIN evaluation_assignments ea
    ON ea.evaluator_id=a.user_id
   AND ea.evaluatee_id=a.evaluatee_id
   AND ea.fiscal_year=a.fiscal_year
  WHERE a.fiscal_year=2026 AND a.evaluation_id != ea.evaluation_id
  UNION
  SELECT a.* FROM answers a
  LEFT JOIN evaluation_assignments ea
    ON ea.evaluator_id=a.user_id
   AND ea.evaluatee_id=a.evaluatee_id
   AND ea.fiscal_year=a.fiscal_year
  WHERE a.fiscal_year=2026 AND ea.id IS NULL;

DELETE a FROM answers a
JOIN evaluation_assignments ea
  ON ea.evaluator_id=a.user_id
 AND ea.evaluatee_id=a.evaluatee_id
 AND ea.fiscal_year=a.fiscal_year
WHERE a.fiscal_year=2026 AND a.evaluation_id != ea.evaluation_id;

DELETE a FROM answers a
LEFT JOIN evaluation_assignments ea
  ON ea.evaluator_id=a.user_id
 AND ea.evaluatee_id=a.evaluatee_id
 AND ea.fiscal_year=a.fiscal_year
WHERE a.fiscal_year=2026 AND ea.id IS NULL;

COMMIT;
```

## ผลลัพธ์

- prod: ลบ 130 row → remaining mismatches = 0 ✓
- test: ลบ 232 row → remaining mismatches = 0 ✓

## ผลกระทบต่อ user

User ที่ถูกลบ answer (130 prod / 232 test) ต้อง **กรอกฟอร์มใหม่** เพราะข้อมูลเดิมอ้างอิงคำถามจากฟอร์มผิด

ตอนนี้ระบบ load ฟอร์มถูกต้องแล้ว (หลัง migration assignments) → กรอกใหม่จะบันทึกที่ฟอร์มที่ถูก ๆ

## Rollback

```sql
INSERT INTO answers SELECT * FROM _backup_answers_corrupt_20260429;
```

## Note

- ไม่ลบ row ของ fy อื่น (2025, 2024) — เก็บไว้สำหรับการตรวจย้อนหลัง
- การ cleanup นี้แก้ pre-existing data corruption — ไม่ใช่ผล side-effect จาก migration
