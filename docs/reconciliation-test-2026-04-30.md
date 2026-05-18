# รายงานผลตรวจ Reconciliation ข้อมูลผู้ใช้ปี 2569

> **วันที่ตรวจ**: 2026-04-30
> **เครื่องมือ**: `UserReconciliationService` + script `scripts/verify_combined.php`
> **DB เป้าหมาย**: `evaluation_db_test` (test environment) — 690 users ทั้งหมด
> **แหล่งข้อมูล Excel**: 8 ไฟล์จาก 2 โฟลเดอร์ใน `docs/`

---

## 1. ขอบเขต Excel ที่ตรวจ

### A. `docs/รายชื่อพนักงานใหม่/` (1 ไฟล์)
| ไฟล์ | จำนวน user |
|---|---:|
| รายชื่อพนักงานบรรจุใหม่ (รอบประเมินปี 2569).xlsx | 56 |

### B. `docs/ประเมิน 360 องศา ปี 2569 (ข้อมูลองศาประเมิน)/` (7 ไฟล์)
| ไฟล์ | จำนวน user |
|---|---:|
| 1. ผู้ว่าการ กนอ. ( มี.ค. 69).xlsx | 1 |
| 2. รองผู้ว่าการ ระดับ 12 กนอ. ( มี.ค. 69).xlsx | 7 |
| 3. ผู้ช่วยผู้ว่าการ ระดับ 11 กนอ. (มี.ค. 69).xlsx | 16 |
| 4. ผอ. ระดับ 10 กนอ. (มี.ค. 69).xlsx | 30 |
| 5. ผอ. ระดับ 9 และ พนักงานระดับ 9 กนอ. (มี.ค. 69).xlsx | 69 |
| 6. พนักงานระดับ 5-8 กนอ. ( มี.ค. 69) UP..xlsx | 485 |
| 7. เลขานุการ กนอ. ( มี.ค. 69) UP..xlsx | 36 |
| **รวม** | **644** (dedup เหลือ 635) |

### Combined (dedup by emid)
| ส่วน | จำนวน |
|---|---:|
| Unique emids ทั้งหมด | **635** |
| อยู่เฉพาะ A (รายชื่อใหม่) | 0 |
| อยู่เฉพาะ B (ข้อมูลองศา) | 575 |
| อยู่ทั้ง A + B (overlap) | 56 |

---

## 2. ผลการเปรียบเทียบ Excel vs DB

### 2.1 Match Rate รวม

| สถานะ | จำนวน | % |
|---|---:|---:|
| ✅ **Exact match (ทั้ง 8 fields ตรง)** | **492** | **77.5%** |
| ⚠ Has differences (≥ 1 field ต่าง) | 143 | 22.5% |
| ❌ Not found in DB | 0 | 0.0% |
| **Total** | **635** | 100% |

> **สรุป**: ข้อมูล Excel ตรงกับ DB เพียง **77.5%** — ต้องอัปเดต **143 user** ให้เป็นปัจจุบัน

### 2.2 Mismatch by Field (จาก 143 users)

| Field | จำนวน user เปลี่ยน | % ของ 635 | หมายเหตุ |
|---|---:|---:|---|
| **grade (ระดับ)** | **95** | 15.0% | เลื่อน/ลดระดับ — สำคัญสุดสำหรับการประเมิน |
| **department (กอง)** | **52** | 8.2% | โอนย้ายระหว่างกอง + rename |
| **faction (ฝ่าย)** | **35** | 5.5% | จัดโครงสร้างฝ่ายใหม่ |
| **position (ตำแหน่ง)** | **29** | 4.6% | เลื่อนตำแหน่ง |
| **division (สายงาน)** | **23** | 3.6% | ย้ายสายงาน |
| fname (ชื่อ) | 5 | 0.8% | ส่วนใหญ่เป็น Excel typo |
| prename (คำนำหน้า) | 2 | 0.3% | – |
| lname (นามสกุล) | 1 | 0.2% | สมรสหรือแก้ไข |

---

## 3. ประเภทความไม่ตรง — แยกตามสาเหตุ

### 3.1 ✅ Real changes (ต้อง apply) — ~120 users

การเปลี่ยนแปลงที่เป็นจริง สะท้อน HR update ปี 2569:

**ตัวอย่าง:**
- `691001 เรืองยศ ตั้งศรีตะนัย`: position `นักบริหารงานทั่วไป` → `นักบริการการลงทุน` (โอนตำแหน่ง)
- 95 users มี grade เปลี่ยน — เลื่อนระดับประจำปี

### 3.2 ⚠ Excel data-quality issues — ~10 users

ปัญหาคุณภาพ Excel ไม่ใช่การเปลี่ยนแปลงจริง — admin ควร **skip**:

| ตัวอย่าง | ปัญหา |
|---|---|
| `691005 จิรัชญา` → Excel `"นางสาวจิรัชญา"` | prename glued ติดกับ fname |
| `691006 แพรพลอย` → `"นางสาวแพรพลอย"` | เหมือนกัน |
| `691004 สุรเชษฐ์` → `"นายสุรเชษฐ์"` | เหมือนกัน |
| `681050 ณัฐ สาปคำ`: dept `อีสเทิร์นซีบอร์ด` → `อีสเทิร์นซีบอดร์ด` | typo ใน Excel (สะกดผิด) |

### 3.3 🔁 Org naming inconsistency — ~10 users

ชื่อ org ใน Excel กับ DB ใช้รูปแบบต่างกัน — admin ตัดสินใจ:
- Map ไปยัง record ที่มี (ถ้าเป็นคนเดียวกัน) หรือ
- สร้างใหม่ (ถ้าเป็น org ใหม่จริง)

| ตัวอย่าง | DB | Excel | คำแนะนำ |
|---|---|---|---|
| `681018 กมลชนก` | `ฝ่ายพัฒนาองค์กร` | `ฝ่ายพัฒนาองค์กร (ระดับฝ่าย)` | Map (rename suffix) |
| `681052 ศุจิดา` | `ผู้ช่วยผู้ว่าการ (ปฏิบัติการ 2)` | `ผู้ช่วยผู้ว่าการ 2` | Map (รูปแบบย่อ) |

### 3.4 ➕ Org ใหม่ใน Excel ที่ไม่มีใน DB — 5-10 users

Excel ระบุ org name ที่ไม่มีใน DB (lookup_missing) — ใช้ feature ใหม่ "+ สร้างใหม่":

| emid | ชื่อ | Field | Excel ต้องการ |
|---|---|---|---|
| 681034 | ฮารีส งามสมชาติ | department | สำนักงานนิคมฯ หนองละลอก |
| 681037 | สุธิดา จิตต์สาครสิริ | department | สำนักงานนิคมฯ ซีพีจีซี |
| 681032 | ณธษา สารเมืองโฮม | department | สำนักงานนิคมฯ บ่อทอง 33 จ.ปราจีนบุรี |
| 681050 | ณัฐ สาปคำ | faction | สำนักงานนิคมฯ อีสเทิร์นซีบอร์ด (ระยอง) |
| 681033 | ชิตพล เรืองกูล | faction | (เหมือนกัน) |

---

## 4. การจัดการที่แนะนำ (Action Plan สำหรับ Admin)

### Step 1: Filter รายการที่ apply ทันที (auto-approvable)
- ✅ grade changes 95 ราย — verify กับ HR letter ก่อน
- ✅ position changes 29 ราย — verify กับ HR
- ✅ division/department changes ที่ Map กับ org ที่มี

### Step 2: Reject Excel typo (8 fname/prename/lname)
- กดยกเลิก checkbox ใน UI สำหรับรายการเหล่านี้
- ผู้ทำ Excel ควร review + แก้ไข Excel ก่อน import รอบหน้า

### Step 3: ใช้ "+ สร้างใหม่" / "→ Map" สำหรับ blocked
- Org ที่ไม่อยู่ DB → "+ สร้างใหม่" (auto inherit FK จาก user)
- Org ที่ rename อย่างเดียว → "→ Map" ไปยัง record เดิม

### Step 4: Apply + Audit
- ระบบสร้าง `batch_id` (UUID) ลง `user_change_logs`
- รองรับ rollback ทั้ง batch ผ่านปุ่มในหน้า Result

---

## 5. ผลทดสอบระบบเทียบ scope จาก Quotation (QT-2569-004)

| Quotation บอกว่า | ผลตรวจจริง |
|---|---|
| "user บางส่วนมีการเปลี่ยนแปลง" | ✅ 143 users (22.5%) |
| "ต้องเปรียบ Excel กับ DB ทีละคน" | ✅ ทดสอบสำเร็จกับ 635 users |
| "อาจมี org ใหม่ที่ต้องสร้าง" | ✅ พบ 5+ blocked entries — แก้ผ่าน "+ สร้างใหม่" |
| "มี audit log ที่ rollback ได้" | ✅ `user_change_logs` table + batch_id rollback |

→ Scope ที่เสนอราคาไว้ **ครอบคลุมงานจริง** ที่ต้องทำ

---

## 6. ไฟล์ที่เกี่ยวข้อง

### Backend
- `app/Services/UserReconciliationService.php` — parse + diff + apply + rollback
- `app/Models/UserChangeLog.php` — audit trail
- `app/Http/Controllers/AdminUserController.php` — methods `showReconcile`, `previewReconcile`, `executeReconcile`, `rollbackReconcile`
- `database/migrations/2026_04_30_000001_create_user_change_logs_table.php`

### Frontend
- `resources/js/pages/AdminUserReconcile.tsx` — 3-step wizard

### Routes
- `GET  /admin/users/reconcile` — หน้าอัปโหลด
- `POST /admin/users/reconcile/preview` — diff
- `POST /admin/users/reconcile/execute` — apply
- `POST /admin/users/reconcile/rollback` — undo by batch_id

### Tests
- `tests/Feature/Admin/UserReconciliationTest.php` — 14 tests / 56 assertions ✅

### Verification scripts
- `scripts/verify_combined.php` — script ที่ใช้ตรวจรอบนี้
- `scripts/test_reconcile_diff.php` — diff service test
- `scripts/test_reconcile_parse.php` — parser test

---

## 7. ขั้นตอนถัดไป

- [ ] Deploy ไป test environment เพื่อให้ admin ทดลองใช้งานจริงผ่าน UI
- [ ] รอ HR ส่ง confirmation list สำหรับ 95 grade changes
- [ ] Apply การเปลี่ยนแปลงบน prod หลัง UAT ผ่าน
- [ ] เก็บ Excel ที่ใช้ + audit log batch_id เป็น proof of change

> **หมายเหตุ**: ตัวเลขในเอกสารนี้สะท้อนสถานะ test DB ณ วันที่ 2026-04-30
> หาก rerun ในเวลาต่างกัน ตัวเลขอาจต่างเล็กน้อย (เนื่องจาก admin อาจปรับ DB เอง)
