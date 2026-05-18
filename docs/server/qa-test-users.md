# QA Test Users — บัญชีทดลองประเมิน

> **สร้างเมื่อ 2026-04-26** บน test environment (`testevaluation.milesconsult.com`)
> **Note**: Login form validate `emid = digits:6` (ตัวเลข 6 หลัก) — emid ของ test users ใช้ `99000X` (ไม่ใช่ T9XXXX)
> สำหรับทีม QA ทดลองใช้งานระบบประเมิน 360° จริงครบทุก angle

---

## 🌐 URL + Password

```
https://testevaluation.milesconsult.com
```

**Password ของทุก user**: `01012540`
*(วันเกิด 1/1/2540 → format ddmmYYYY ปี พ.ศ.)*

---

## 👥 บัญชีทดสอบ 6 คน

| EMID | ชื่อ | ระดับ | งานเมื่อ login |
|---|---|---|---|
| **990001** | นายทดสอบ ผู้บริหาร | 12 | ประเมิน 2 ผอ. (top angle) |
| **990002** | นางทดสอบ ผอ.หนึ่ง | 10 | self + peer + 1 ลูกน้อง = 3 tasks |
| **990003** | นายทดสอบ ผอ.สอง | 10 | self + peer + 1 ลูกน้อง = 3 tasks |
| **990004** ⭐ | นางสาวทดสอบ พนักงานหนึ่ง | 8 | self + 2 หัวหน้า + 2 ลูกน้อง = **5 tasks** |
| **990005** | นายทดสอบ พนักงานสอง | 6 | self + peer = 2 tasks |
| **990006** | นางสาวทดสอบ พนักงานสาม | 6 | self + peer = 2 tasks |

⭐ **990004 = บัญชีแนะนำ** — เห็นครบ 3 angle (self/top/bottom) ใน 1 login

---

## 🎯 Assignment Map (17 รายการ)

```
                         990001 (Boss g12)
                          ╱            ╲
                       top              top
                        ╱                ╲
              990002 (ผอ.1 g10) ←left→ 990003 (ผอ.2 g10)
                        ╲                ╱
                       top              top
                        ╲                ╱
                       990004 (พนง.1 g8)
                        ╱                ╲
                       top              top
                        ╱                ╲
              990005 (พนง.2 g6) ←left→ 990006 (พนง.3 g6)

  + bottom: 990004 → 990002, 990004 → 990003 (ลูกน้องประเมินหัวหน้า)
  + self: ทุกคนประเมินตนเอง (6 รายการ)
```

### รายละเอียดทุกคู่

| Angle | Evaluator | Evaluatee | Eval Form |
|---|---|---|---|
| self | 990002 | 990002 | #35 (g9-12 internal) |
| top | 990001 | 990002 | #35 |
| left | 990003 | 990002 | #35 |
| bottom | 990004 | 990002 | #35 |
| self | 990003 | 990003 | #35 |
| top | 990001 | 990003 | #35 |
| left | 990002 | 990003 | #35 |
| bottom | 990004 | 990003 | #35 |
| self | 990004 | 990004 | #37 (g4-8) |
| top | 990002 | 990004 | #37 |
| top | 990003 | 990004 | #37 |
| self | 990005 | 990005 | #37 |
| top | 990004 | 990005 | #37 |
| left | 990006 | 990005 | #37 |
| self | 990006 | 990006 | #37 |
| top | 990004 | 990006 | #37 |
| left | 990005 | 990006 | #37 |

---

## 🧪 Test Scenarios แนะนำ

### Scenario 1: ทดสอบ Self-evaluation (สั้นที่สุด)
1. Login `990005` / `01012540`
2. ไปหน้า "การประเมินที่ต้องทำ"
3. กรอก self-eval ของตัวเอง → submit

### Scenario 2: ทดสอบ Full 360° จาก 1 user
1. Login **990004** (พนักงานหนึ่ง g8)
2. ดูรายการประเมินทั้ง 5 อัน:
   - self (ตัวเอง)
   - bottom × 2 (ประเมิน ผอ.หนึ่ง + ผอ.สอง — ลูกน้องประเมินหัวหน้า)
   - top × 2 (ประเมิน พนักงานสอง + พนักงานสาม — หัวหน้าประเมินลูกน้อง)
3. กรอกครบทั้ง 5 อัน
4. ตรวจว่า 4 angle ใช้ form ต่างกันถูกต้อง (self → #37, top/bottom → #37)

### Scenario 3: ทดสอบ Peer (left angle)
1. Login `990002` → กรอก left ของ 990003
2. Logout → Login `990003` → กรอก left ของ 990002
3. ตรวจว่าผลลัพธ์ peer ทั้งคู่ถูกต้อง

### Scenario 4: ทดสอบ Boss View
1. Login `990001` (ผู้บริหาร g12)
2. ดู 2 task — ประเมิน ผอ.หนึ่ง + ผอ.สอง (top angle)
3. กรอกครบทั้งสอง

### Scenario 5: ทดสอบ Cross-grade evaluation form
- 990002 (g10) — เปิด self → ใช้ form #35 (executive)
- 990004 (g8) — เปิด self → ใช้ form #37 (employee)
- ตรวจว่าคำถามต่างกันถูกต้อง

### Scenario 6: ทดสอบ Report
หลังกรอกครบ 17 assignments → admin login → ดูหน้า Report
- ตรวจว่ารายงานต่อ evaluatee แสดงคะแนนครบ 4 angle (สำหรับ 990002, 990003)
- ตรวจว่ารายงานของ 990004 (g8) ไม่มี bottom (เพราะ g8 ไม่รองรับ)

---

## 🛠 Setup Script

หากต้องการ **reset / re-create test users** ให้รัน script ต่อไปนี้บน VPS:

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68
cd /var/www/evaluation-test
# (อัปโหลด setup_test_users.php ก่อน — ดู git history หรือ sync จาก local)
php setup_test_users.php
```

Script ใช้ `User::updateOrCreate()` + `EvaluationAssignment::firstOrCreate()` → รันซ้ำได้ปลอดภัย ไม่สร้าง duplicate

---

## 🧹 Cleanup (ลบทิ้งหลัง QA เสร็จ)

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68
mysql evaluation_db_test -e "
DELETE FROM evaluation_assignments
  WHERE evaluator_id IN (SELECT id FROM users WHERE emid LIKE '990%')
     OR evaluatee_id IN (SELECT id FROM users WHERE emid LIKE '990%');
DELETE FROM answers
  WHERE evaluator_id IN (SELECT id FROM users WHERE emid LIKE '990%');
DELETE FROM users WHERE emid LIKE '990%';
"
```

⚠️ ห้ามรันบน prod (`evaluation_db`) — script นี้สำหรับ test เท่านั้น

---

## 📊 ตรวจสถานะ

### ดู assignments ปัจจุบันของ test users
```sql
SELECT u.emid, CONCAT(u.fname, ' ', u.lname) AS name, u.grade,
  SUM(CASE WHEN a.angle='self' THEN 1 ELSE 0 END) AS s,
  SUM(CASE WHEN a.angle='top' THEN 1 ELSE 0 END) AS t,
  SUM(CASE WHEN a.angle='bottom' THEN 1 ELSE 0 END) AS b,
  SUM(CASE WHEN a.angle='left' THEN 1 ELSE 0 END) AS l
FROM users u
LEFT JOIN evaluation_assignments a ON a.evaluator_id = u.id AND a.fiscal_year = 2026
WHERE u.emid LIKE '990%'
GROUP BY u.id, u.emid, u.fname, u.lname, u.grade
ORDER BY u.emid;
```

### ดู answers ที่ QA submit แล้ว
```sql
SELECT u.emid AS evaluator, CONCAT(u2.fname, ' ', u2.lname) AS evaluatee,
       a.angle, COUNT(ans.id) AS answers
FROM evaluation_assignments a
JOIN users u ON u.id = a.evaluator_id
JOIN users u2 ON u2.id = a.evaluatee_id
LEFT JOIN answers ans ON ans.assignment_id = a.id
WHERE u.emid LIKE '990%' AND a.fiscal_year = 2026
GROUP BY a.id, u.emid, u2.fname, u2.lname, a.angle
ORDER BY u.emid, a.angle;
```

---

## เอกสารที่เกี่ยวข้อง

- [SSH Guide](./ssh-guide.md) — เข้า server, deploy
- [Test Environment](./test-environment.md) — โครงสร้าง test instance + refresh script
- [DBeaver Access](./dbeaver-access.md) — เข้า DB ผ่าน GUI
- [Spec: evaluation_responses.md](../../spec/evaluation_responses.md) — โครงสร้างคำตอบ
- [Spec: users.md](../../spec/users.md) — โครงสร้าง user
