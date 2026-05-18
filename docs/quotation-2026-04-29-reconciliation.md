# เอกสารเสนอราคาเพิ่มเติม — งานปรับปรุงข้อมูลผู้ใช้ ปี 2569
# Quotation Add-on — User Data Reconciliation 2569

> **เลขที่เอกสาร**: QT-2569-004 (Add-on)
> **วันที่จัดทำ**: 29 เมษายน 2569
> **อ้างอิง**: QT-2569-003 (โครงการประเมิน 360 องศา กนอ. — งวดงานที่ 3)
> **ระยะเวลา**: 6 วัน (30 เม.ย. – 5 พ.ค. 2569)
> **ค่าตอบแทน**: ฿8,000 บาท (เพิ่มเติมจากยอดเดิม 48,686 บาท)

---

## 1. ที่มาและความจำเป็น

ข้อมูลผู้ใช้งานในระบบประเมินปัจจุบันมี **684 ราย** (เป็นผู้ถูกประเมินในปีงบ 2569 = **642 ราย**) ถูก import จากไฟล์ Excel ปี 2568 ระหว่างปี 2568→2569 ผู้ใช้บางส่วนมีการเปลี่ยนแปลงข้อมูลสำคัญ ได้แก่:

| Field | ตัวอย่างการเปลี่ยนแปลง |
|---|---|
| ระดับ (grade) | เลื่อนระดับ เช่น 8 → 9, 9 → 10 |
| ชื่อ-นามสกุล (fname/lname) | สมรส, แก้ไขให้ถูกต้อง |
| สายงาน (division) | โอนย้ายข้ามสายงาน |
| กอง / ฝ่าย (department/faction) | ปรับโครงสร้างองค์กรใหม่ |
| ตำแหน่ง (position) | เลื่อนตำแหน่ง |

หากไม่ปรับข้อมูลให้เป็นปัจจุบัน → **ผลประเมินปี 2569 จะใช้ข้อมูลผิด** (เช่น คนที่ขึ้นเป็นระดับ 13 แล้วแต่ระบบยังเก็บไว้ที่ 12 → ใช้ฟอร์มประเมินผิดประเภท)

ข้อมูลปัจจุบันมีไฟล์ Excel 7 ไฟล์ใน `docs/ประเมิน 360 องศา ปี 2569 (ข้อมูลองศาประเมิน)/` ที่เป็น snapshot ปัจจุบัน (มี.ค. 2569) ต้อง reconcile ทีละคน

---

## 2. ขอบเขตงาน (Scope of Work)

### 2.1 Backend Service

**`UserReconciliationService`** — service ใหม่สำหรับ:

| Method | ทำหน้าที่ |
|---|---|
| `parseExcelFiles()` | อ่าน Excel 7 ไฟล์ + ดึง emid, prename, fname, lname, grade, division, department, faction, position |
| `diffAgainstDb()` | เปรียบเทียบทีละ user (match emid) → ระบุ field ที่เปลี่ยน + แสดง before/after |
| `applyChanges()` | UPDATE users table + บันทึก audit log ใน `user_change_logs` (transactional) |
| `lookupOrgIds()` | แปลงชื่อ division/department/faction/position → FK id (reuse pattern จาก `UserImportService` เดิม) |

### 2.2 Admin Review Page

หน้าใหม่ `/admin/users/reconcile` — admin เข้ามาทำ:

```
┌─────────────────────────────────────────────────────────┐
│  ปรับปรุงข้อมูลผู้ใช้ปี 2569                              │
│  ────────────────────────────────────────────────────  │
│  📁 อัปโหลด Excel (7 ไฟล์)                              │
│  [Browse...] [วิเคราะห์]                                 │
│                                                          │
│  📊 พบการเปลี่ยนแปลง 23 ราย จาก 642 ราย                 │
│  ────────────────────────────────────────────────────  │
│  ☑  emid 491011 จันทร์ธร ศรีธัญรัตน์                     │
│      • grade: 10 → 11   ✓                                │
│      • division: สผ. → สผ.ผวก. ✓                         │
│  ☑  emid 391039 เริงฤทธิ์ กุศลกรรมบถ                     │
│      • lname: -- → กุศลกรรมบถ ✓                          │
│  ☐  emid 666666 สุเมธ ตั้งประเสริฐ                       │
│      • grade: 12 → 13   ✓                                │
│      • position: รองผวก. → ผวก.   ✓                       │
│                                                          │
│  [✓ ยืนยันการเปลี่ยนแปลง 22 ราย]                          │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ตาราง diff แสดงเฉพาะ user ที่ field เปลี่ยน (กรอง user ที่ไม่เปลี่ยนออก)
- Checkbox per user ให้ admin ตัดสินใจ approve/skip ทีละราย
- Bulk approve/reject ทั้งหน้า
- Preview ฟิลด์ที่เปลี่ยน format **before → after**
- หลัง apply → แสดงสรุปจำนวนที่ update + link ไป audit log

### 2.3 Audit Log

ตารางใหม่ `user_change_logs` (rollback-friendly):

| Column | Type | คำอธิบาย |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK → users.id |
| field | varchar(50) | grade / division_id / fname / etc. |
| old_value | text | ค่าก่อนเปลี่ยน |
| new_value | text | ค่าหลังเปลี่ยน |
| batch_id | varchar(36) | UUID — group การเปลี่ยน 1 ครั้ง |
| changed_by | bigint | admin user_id |
| created_at | timestamp | – |

### 2.4 Reuse จากระบบเดิม (ประหยัดเวลา)

| Component ที่มีอยู่แล้ว | ใช้ทำอะไร |
|---|---|
| `UserImportService::parseExcel()` | อ่าน Excel + handle Buddhist year |
| `AssignmentImportService::findUserFuzzy()` | name matching (fix แล้วใน 2026-04-29) |
| `AdminAssignmentImport.tsx` | UI pattern (3-step wizard, preview table) |
| Org structure controllers (Division, Department, Position, Faction) | name → id lookup |

---

## 3. รายการชั่วโมงทำงาน

| # | งานย่อย | ชม. |
|---|---|:---:|
| 1 | สร้าง `UserReconciliationService` (parse + diff + apply) | 8 |
| 2 | Migration `user_change_logs` + Model | 2 |
| 3 | `AdminUserController` methods (showReconcile, previewReconcile, executeReconcile) | 3 |
| 4 | `AdminUserReconcile.tsx` หน้า admin (upload + preview table + apply) | 8 |
| 5 | Routes + middleware + integration ใน Admin nav | 1 |
| 6 | Test (parse → diff → apply on test DB) | 3 |
| 7 | Deploy prod + test + UAT 1 ครั้ง | 3 |
| | **รวม** | **28** |

---

## 4. ค่าตอบแทน OT

อ้างอิงฐานคำนวณตาม `docs/ข้อมูล/project_proposal.md` ส่วน 6:

ช่วงเวลา 30 เม.ย. – 5 พ.ค. 2569 — มี **2 วันธรรมดา** (พฤ. 30 เม.ย., อ. 5 พ.ค.) + **4 วันหยุด** (1 พ.ค. วันแรงงาน, 2-3 พ.ค. เสาร์-อาทิตย์, 4 พ.ค. วันฉัตรมงคล)

| ประเภท OT | ชั่วโมง | อัตรา (บาท/ชม.) | บาท |
|---|:---:|:---:|:---:|
| OT วันธรรมดา (x1.5) — หลังเลิกงาน 30 เม.ย. + 5 พ.ค. | 5 | 250.00 | 1,250 |
| ทำงานวันหยุด ปกติ (x1.0) — 1-4 พ.ค. ภายใน 8 ชม. | 16 | 166.67 | 2,667 |
| OT วันหยุด (x3.0) — 1-4 พ.ค. หลัง 8 ชม. | 7 | 500.00 | 3,500 |
| **รวม OT** | **28** | – | **7,417** |
| Buffer / 6-day rush premium (~8%) | – | – | 583 |
| **รวมเสนอราคา** | | | **8,000** |

---

## 5. Timeline (6 วัน)

```
  30 เม.ย.   1 พ.ค.    2 พ.ค.    3 พ.ค.    4 พ.ค.    5 พ.ค.
   พฤ.       ศ.★       ส.        อา.       จ.★       อ.
  (ปกติ)   (แรงงาน)   (เสาร์)  (อาทิตย์) (ฉัตรมงคล) (ปกติ)
   │         │         │         │         │         │
   ├ Service ┤         │         │         │         │
   │ + Diff  │         │         │         │         │
   │         ├ Migration + Audit ┤         │         │
   │         │         │         │         │         │
   │         │         ├ Admin UI + Controller ──────┤
   │         │         │         │         │         │
   │         │         │         │         ├ Test ───┤
   │         │         │         │         │         │
   │         │         │         │         │         ├ Deploy + UAT
   │         │         │         │         │         │
                                                       ▼
                                                   ส่งมอบ
                                                   ★ = วันหยุดราชการ
```

| วันที่ | งาน | ชม. |
|---|---|:---:|
| 30 เม.ย. (พฤ. — หลังเลิกงาน) | UserReconciliationService — parse + diff (start) | 2.5 |
| 1 พ.ค. (ศ. — วันแรงงาน) | Diff service complete + Migration + Audit log | 6 |
| 2 พ.ค. (ส. — วันหยุด) | Admin controller + routes + start UI | 7 |
| 3 พ.ค. (อา. — วันหยุด) | AdminUserReconcile.tsx + UI complete | 6 |
| 4 พ.ค. (จ. — ฉัตรมงคล) | Apply logic + test bench + integration test | 4 |
| 5 พ.ค. (อ. — หลังเลิกงาน) | Deploy prod + test + UAT | 2.5 |
| **รวม** | | **28** |

**กำหนดส่งมอบ**: 5 พ.ค. 2569 (อ.) เย็น

---

## 6. Deliverables

| # | สิ่งที่ส่งมอบ |
|---|---|
| D1 | Service `UserReconciliationService` พร้อม unit test |
| D2 | Migration + Model `UserChangeLog` ขึ้น production |
| D3 | หน้า `/admin/users/reconcile` ใช้งานได้ผ่าน Admin login |
| D4 | ข้อมูลผู้ใช้ใน prod ถูกอัปเดตให้ตรง Excel 2569 (ตามที่ admin approve) |
| D5 | Audit log ครบทุก field ที่เปลี่ยน — rollback ได้ผ่าน SQL |
| D6 | คู่มือใช้งาน 1 หน้าใน `docs/admin-user-reconcile.md` |

---

## 7. เงื่อนไขและสมมติฐาน

### สิ่งที่ผู้ว่าจ้างต้องจัดเตรียม

- [ ] Excel 7 ไฟล์ ปี 2569 (ฉบับล่าสุดที่ตรวจทานแล้ว)
- [ ] รายชื่อ admin ที่จะเข้าใช้หน้า `/admin/users/reconcile`
- [ ] เวลา UAT 1 ชั่วโมงในวันที่ 5 พ.ค. 2569

### สมมติฐาน

- Excel layout เหมือน `UserImportService` รองรับ (10 columns: emid, prename, fname, lname, position, grade, department, faction, division, birthdate)
- การ match user ใช้ `emid` เป็นหลัก — ถ้า Excel มี user ที่ emid ไม่อยู่ใน DB → ระบุเป็น "user ใหม่" (ใช้ User Import ปกติแยก, ไม่รวมใน scope นี้)
- ไม่รวมการลบ user ที่ลาออก (out of scope — ทำผ่าน Admin User panel ตามปกติ)

### ข้อยกเว้น

- ไม่รวมการสร้าง user ใหม่ (ใช้ `/admin/users/import` ที่มีอยู่แล้ว)
- ไม่รวมการ migrate evaluation_assignments / answers หาก grade เปลี่ยน (ทำแยกตามสถานการณ์ — มีอยู่แล้วใน session 2026-04-29)
- ไม่รวมการเปลี่ยน password / role (ทำผ่าน Profile/Admin User Form)
- หาก scope เพิ่มเติมหลังเริ่มงาน → ปรับราคาเพิ่มตามจริง

---

## 8. สรุปราคา

| รายการ | จำนวน |
|---|---|
| **ยอดเดิม (QT-2569-003 — One-time Development)** | 48,686 บาท |
| **Add-on (QT-2569-004 — User Data Reconciliation)** | **+8,000 บาท** |
| **รวมทั้งสิ้น** | **56,686 บาท** |

> ราคา add-on นี้ครอบคลุม service + admin UI + audit log + deploy + UAT
> ภายใน 6 วัน
> หาก scope ขยาย (เช่น full UI wizard 3-step, mapping unmatched names ทีละราย) → ปรับเป็น Tier 3 (~12,000 บาท, 8-9 วัน)

---

## 9. ลงนาม

| | ผู้เสนอราคา | ผู้อนุมัติ |
|---|:---:|:---:|
| ชื่อ | _________________________ | _________________________ |
| ตำแหน่ง | Developer | _________________________ |
| วันที่ | 29 เมษายน 2569 | ______ / ______ / _______ |
| ลายเซ็น | _________________________ | _________________________ |

---

*เอกสารนี้มีผลบังคับใช้ 14 วันนับจากวันที่จัดทำ*
*ราคาอาจปรับเปลี่ยนได้หาก scope มีการเปลี่ยนแปลงหลังเริ่มงาน*
