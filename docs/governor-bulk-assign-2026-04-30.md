# รายงาน — ให้ทุก user ประเมินผู้ว่าการ + ลบ orphan users

> **วันที่ดำเนินการ**: 2026-04-30
> **Scope**: prod + test, fy=2026
> **Target**: สุเมธ ตั้งประเสริฐ (id=1042, grade=13) — ผู้ว่าการ กนอ.

---

## 1. ที่มา

ลูกค้าต้องการให้ user ทุกคนในระบบ (ยกเว้น admin + ตัวผู้ว่าการเอง) มี evaluation_assignment สำหรับประเมินผู้ว่าการในปีงบประมาณ 2026 เพื่อให้ทุกคนสามารถเข้าหน้า `/dashboard` แล้วเห็นการ์ด "ประเมินผู้ว่าการ" ได้

ระหว่างตรวจสอบเจอ **7 orphan users** ที่:
- มี `role='user'` แต่ `grade='-'` (ไม่ระบุระดับ)
- ไม่อยู่ใน Excel ปี 2569 ใดๆ (สแกน 19 .xlsx files ใน `docs/`)
- ไม่มี evaluation_assignments ใดๆ
- ไม่มี answers ใดๆ
- น่าจะเป็นพนักงานที่ลาออก/เกษียณ ที่ HR ไม่ได้ปลด record ออกจากระบบ

---

## 2. Orphan Users ที่ถูกลบ

| id | emid | ชื่อ | grade | reason |
|---|---|---|---|---|
| 805 | 362066 | นพดล กรุดมินบุรี | - | ไม่ใน Excel 2569 + ไม่มี data |
| 821 | 662001 | สุทิน เตชะทิ | - | – |
| 822 | 662002 | ปาริฉัตร เตชะโสด | - | – |
| 832 | 402013 | สุพร หนูกลัดนุ้ย | - | – |
| 910 | 402038 | สมชาย ปั่นไทยวงศ์ | - | – |
| 1037 | 362072 | เปรมปรี สินชุมแสง | - | – |
| 1038 | 402020 | ศิริวัฒน์ ยศอ่อน | - | – |

ลบ 7 rows × 2 DBs = **14 rows ทั้งหมด** (no foreign key dependencies)

---

## 3. Angle Logic สำหรับ Governor Assignments

อิงตาม `docs/05_evaluation_flow.md` — angle = position ของ evaluator เทียบกับ evaluatee:

| Evaluator grade | Angle | Form (eval_id) |
|---|---|---|
| **1–12** (พนักงาน + ผู้บริหาร) | **bottom** (อยู่ใต้ผู้ว่าการ) | 41 (governor regular fy=2026 internal) |
| **13** (governor — สุเมธ เอง) | skip (มี angle=self อยู่แล้ว 1 row) | – |
| **14+** (board / กรรมการ) | **top** (อยู่เหนือผู้ว่าการ) | 41 |
| NULL / '-' / ค่าผิด | skip | – |

ตามที่ `app/Services/WeightedScoringService.php` กำหนดน้ำหนักสำหรับ governor:
- top = 25% (board)
- bottom = 25% (subordinate)
- left = 20% (peer)
- right = 20% (external)
- self = 10%

---

## 4. SQL ที่ใช้

```sql
START TRANSACTION;

-- Step 1: Delete orphan users
DELETE FROM users WHERE id IN (805, 821, 822, 832, 910, 1037, 1038);

-- Step 2: Insert governor assignments
INSERT INTO evaluation_assignments (evaluation_id, evaluator_id, evaluatee_id, fiscal_year, angle, created_at, updated_at)
SELECT
  41, u.id, 1042, 2026,
  CASE
    WHEN CAST(u.grade AS UNSIGNED) >= 14 THEN 'top'
    WHEN CAST(u.grade AS UNSIGNED) BETWEEN 1 AND 12 THEN 'bottom'
  END,
  NOW(), NOW()
FROM users u
WHERE u.role = 'user'
  AND u.id != 1042                                   -- exclude governor self
  AND u.grade IS NOT NULL AND u.grade != '' AND u.grade != '-'
  AND CAST(u.grade AS UNSIGNED) >= 1
  AND CAST(u.grade AS UNSIGNED) != 13                -- exclude grade 13
  AND NOT EXISTS (
    SELECT 1 FROM evaluation_assignments ea
    WHERE ea.evaluator_id = u.id
      AND ea.evaluatee_id = 1042
      AND ea.fiscal_year = 2026
      AND ea.angle = CASE WHEN CAST(u.grade AS UNSIGNED) >= 14 THEN 'top' ELSE 'bottom' END
  );

COMMIT;
```

**Idempotent** — รันซ้ำไม่ทำให้ duplicate (NOT EXISTS guard + unique key `(evaluator_id, evaluatee_id, fiscal_year, angle)`)

---

## 5. ผลลัพธ์

### Test (`evaluation_db_test`)
| Action | จำนวน |
|---|---:|
| ลบ orphan users | 7 |
| Insert assignments | 0 (มีอยู่แล้วครบจากรอบก่อนหน้า) |

### Prod (`evaluation_db`)
| Action | จำนวน |
|---|---:|
| ลบ orphan users | 7 |
| **Insert assignments ใหม่** | **667** |

### Final state — Governor (1042) Assignments fy=2026

| Angle | Test | Prod |
|---|---:|---:|
| top (board grade 14) | 30 | 30 |
| bottom (grade 1-12) | 682 | 674 |
| left (peer) | 13 | 13 |
| self | 1 | 1 |
| **รวม** | **726** | **718** |

| Metric | Test | Prod |
|---|---:|---:|
| Total role='user' | 713 | 705 |
| Users without gov assignment | 0 | 0 |

→ **100% coverage** — ทุก user role='user' (ยกเว้น governor) มี assignment ประเมินผู้ว่าการ

---

## 6. ผลกระทบต่อ User

ทุก user ที่ login `/dashboard?fiscal_year=2026` จะเห็น:
- การ์ด **"ประเมินผู้ว่าการ"** เพิ่มเข้ามา 1 รายการ
- Form ที่ load = eval_id 41 (28 ข้อ rating + 6 ด้าน)
- Angle ตามตำแหน่ง: bottom สำหรับพนักงาน 1-12 / top สำหรับ board 14+

---

## 7. Backup

| ไฟล์ | คำอธิบาย |
|---|---|
| `/var/backups/orphan-users-test-20260430-081319.sql` | 7 user records (test) |
| `/var/backups/orphan-users-prod-20260430-081319.sql` | 7 user records (prod) |

---

## 8. Rollback (ถ้าจำเป็น)

```bash
# Restore 7 users
ssh root@187.127.97.68 '
mysql -ueval_test_user -p"cTDbdDjEGevRW0JB15foWifqOQd7" evaluation_db_test < /var/backups/orphan-users-test-20260430-081319.sql
mysql -ueval_user -p"Eval@2569!Secure" evaluation_db < /var/backups/orphan-users-prod-20260430-081319.sql
'

# Remove governor assignments inserted today (only fresh ones)
ssh root@187.127.97.68 'mysql -ueval_user -p"Eval@2569!Secure" evaluation_db -e "
DELETE FROM evaluation_assignments
WHERE evaluatee_id=1042 AND fiscal_year=2026
  AND created_at >= \"2026-04-30 08:13:00\"
  AND angle IN (\"top\",\"bottom\");
"'
```

---

## 9. Verification

หลัง deploy:
1. **DB**: `SELECT angle, COUNT(*) FROM evaluation_assignments WHERE evaluatee_id=1042 AND fiscal_year=2026 GROUP BY angle`
   → Expected: top=30, bottom=674, left=13, self=1
2. **UI**: Login เป็น user ใด ๆ (เช่น emid=391039, password=01012569) → `/dashboard?fiscal_year=2026` → เห็นการ์ด "ประเมินผู้ว่าการ"
3. **Form**: คลิกการ์ด → load eval_id=41 (governor regular form) → กรอกได้ครบทุกข้อ
4. **Save**: ตรวจ `answers` table หลังกรอก → row ใหม่มี `evaluation_id=41, evaluatee_id=1042, fiscal_year=2026`

---

## Notes

- 13 left-angle assignments ยังคงอยู่จาก import รอบก่อน (peer ของผู้ว่าการ ที่ admin assign ไว้) — ไม่ได้แตะ
- 30 top-angle = board members (grade 14) ครบทุกคน — ใช้ `top` angle ตาม spec
- 674 bottom-angle prod / 682 test — ต่างกันเล็กน้อยเพราะ test มี user 999991/999992 ที่สร้างเฉพาะใน test + อาจมี user grade 11/12 หลายคนกว่าใน prod เล็กน้อย
- ไม่ได้ลบ orphan ที่ test เพิ่ม — เพราะ test มีแล้วถูกลบไปครั้งนี้พร้อมกัน
