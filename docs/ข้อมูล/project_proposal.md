# ข้อเสนอโครงการพัฒนาระบบการประเมิน 360 องศา กนอ.
# Project Proposal — 360-Degree Evaluation System (Phase 3)

> **วันที่จัดทำ**: 1 มีนาคม 2569
> **ระยะงวด**: งวดงานที่ 3 (180 วัน)
> **กำหนดส่งมอบ**: 14 มิถุนายน 2569
> **ระบบ**: Laravel + React (Inertia.js) + MariaDB บน Hostinger

---

## 1. ภาพรวมโครงการ

ระบบการประเมิน 360 องศา กนอ. (การนิคมอุตสาหกรรมแห่งประเทศไทย) เป็นระบบประเมินบุคลากรครอบคลุมทุกระดับ ตั้งแต่ผู้ว่าการ (ระดับ 13) ผู้บริหาร (ระดับ 9-12) ไปจนถึงพนักงาน (ระดับ 4-8) โดยประเมินจากหลายมุมมอง (360 องศา) ได้แก่ ผู้บังคับบัญชา ผู้ใต้บังคับบัญชา เพื่อนร่วมงาน องค์กรภายนอก และการประเมินตนเอง รองรับแบบประเมิน 4 ประเภท ทั้งภายในและภายนอก พร้อมส่วนวัฒนธรรมองค์กร I-EA-T

### ระบบที่มีอยู่แล้ว (Baseline)

| รายการ | รายละเอียด |
|--------|-----------|
| Framework | Laravel + React (Inertia.js) |
| Database | MariaDB 10.4 — `milesconsultdb` |
| Hosting | Hostinger (12GB RAM, 6 Core, 300 PHP Workers) |
| ข้อมูลที่มีอยู่ | ~207,000+ คำตอบ, 1,200+ users, 8,200+ assignments |
| แบบประเมินปัจจุบัน | 4 ประเภท: ผู้ว่าการ ระดับ 13 (ภายใน+ภายนอก), ผู้บริหาร 9-12 (ภายใน), ผู้บริหาร 9-12 (ภายนอก), พนักงาน 4-8 |

---

## 2. Timeline งวดงานที่ 3

```
1 มี.ค. 2569  ────────────────────────────────────────  14 มิ.ย. 2569
    │                                                          │
    ├── Sprint 0 ──┤ Sprint 1 ────────┤ Sprint 2 ──┤          │
    │  1–6 มี.ค.   │  7–20 มี.ค.      │  21–31มี.ค │          │
    │  (6 วัน)     │  (14 วัน)        │  (11 วัน)  │          │
    │              │                  │             │          │
    ▼              ▼                  ▼             ▼          ▼
  Deploy        Task 3+4           Task 5        Live      Report
  Task 1,2     External+UX        Dashboard   (1เม.ย.)      Due
  4 แบบประเมิน                     ครบระบบ
```

### Milestone หลัก

| วันที่ | Milestone | สถานะที่ต้องการ |
|--------|-----------|----------------|
| **2–6 มี.ค. 2569** | ทดสอบความเที่ยงตรง + ชี้แจงระบบ | ระบบ stable, แบบประเมิน 4 ประเภทพร้อม |
| **7–31 มี.ค. 2569** | พัฒนาและปรับปรุงระบบ | External login, UX, Dashboard ครบ |
| **1 เม.ย. 2569** | เริ่ม Live Evaluation | Production-ready 100% |
| **31 พ.ค. 2569** | สิ้นสุด Live Evaluation | ข้อมูลครบ, ไม่มี critical bugs |
| **1–14 มิ.ย. 2569** | Progress Report 2 | Export/Report สมบูรณ์ |

---

## 3. ขอบเขตงาน (Scope of Work)

---

### Task 1 — แบบประเมิน 360 องศา ทั้ง 4 ประเภท (ปรับปรุงใหม่ ปี 2569)

**วัตถุประสงค์**: สร้างและปรับปรุงแบบประเมิน 360 องศาครบทุกกลุ่มเป้าหมาย ครอบคลุมตั้งแต่ผู้ว่าการ (ระดับ 13) ผู้บริหาร (ระดับ 9-12) ไปจนถึงพนักงาน (ระดับ 4-8) ทั้งภายในและภายนอก

#### รายละเอียดแบบประเมินทั้ง 4 ประเภท

##### 1. แบบประเมินผู้ว่าการ กนอ. (ระดับ 13) — ภายใน+ภายนอก

| รายการ | รายละเอียด |
|--------|-----------|
| แบบประเมิน Internal | 1 ชุด — 6 ด้าน 28 ข้อ (คะแนน 1-5) |
| แบบประเมิน External | 1 ชุด — 6 ด้าน 25 ข้อ (คะแนน 1-5, ปรับคำถามสำหรับมุมมองภายนอก) |
| โครงสร้าง | evaluation → parts → aspects → questions → options |
| คำถามปลายเปิด | จุดแข็ง, สิ่งที่ควรพัฒนา, ความคิดเห็นอื่นๆ |

**ด้านที่ประเมิน (ภายใน 6 ด้าน 28 ข้อ / ภายนอก 6 ด้าน 25 ข้อ):**

| # | ด้าน | ภายใน | ภายนอก |
|---|------|:-----:|:------:|
| 1 | ความเป็นผู้นำ/ความสามารถในการบริหารจัดการ | 6 ข้อ | ปรับ |
| 2 | วิสัยทัศน์และกลยุทธ์ | 5 ข้อ | ปรับ |
| 3 | ความสามารถในการสื่อสาร | 4 ข้อ | ปรับ |
| 4 | กรอบความคิด Mindset/Creativity/Innovation | 6 ข้อ | ปรับ |
| 5 | จริยธรรมในการปฏิบัติงาน | 4 ข้อ | ปรับ |
| 6 | ความสัมพันธ์และการทำงานร่วมกับผู้อื่น | 3 ข้อ | ปรับ |

##### 2. แบบประเมินกลุ่มผู้บริหารระดับ 9-12 — ภายใน

| รายการ | รายละเอียด |
|--------|-----------|
| ส่วนที่ 1 | 360 องศา 7 ด้าน 30 ข้อ (คะแนน 1-5: ดีเยี่ยม/ดีมาก/ดี/ต้องปรับปรุง/ต้องปรับปรุงอย่างมาก) |
| ส่วนที่ 2 | วัฒนธรรมองค์กร I-EA-T — 8 ข้อ x 2 ตาราง (ระดับความสำคัญ + ระดับพฤติกรรม) |
| ส่วนที่ 3 | คำถามปลายเปิด 4 ข้อ |

**ด้านที่ประเมิน (ส่วนที่ 1 — 7 ด้าน 30 ข้อ):**

| # | ด้าน | จำนวนข้อ |
|---|------|:--------:|
| 1 | ความเป็นผู้นำ Leadership | 5 |
| 2 | การมีวิสัยทัศน์ Vision | 3 |
| 3 | การติดต่อสื่อสาร Communication | 4 |
| 4 | ความสามารถในการคิดและนวัตกรรม Thinking & Innovation | 6 |
| 5 | จริยธรรมในการปฏิบัติงาน Ethics | 4 |
| 6 | ทักษะระหว่างบุคคลและความร่วมมือ Interpersonal & Collaboration | 4 |
| 7 | การบริหารความเสี่ยงและความรับผิดชอบ Risk Management & Accountability | 4 |

##### 3. แบบประเมินกลุ่มผู้บริหารระดับ 9-12 — ภายนอก

| รายการ | รายละเอียด |
|--------|-----------|
| ส่วนที่ 1 | 360 องศา 7 ด้าน 26 ข้อ (โครงสร้างเดียวกับภายใน ปรับคำถามสำหรับมุมมองภายนอก) |
| ส่วนที่ 2 | วัฒนธรรมองค์กร I-EA-T — 8 ข้อ x 2 ตาราง |
| ส่วนที่ 3 | คำถามปลายเปิด 4 ข้อ |

**ด้านที่ประเมิน (ส่วนที่ 1 — 7 ด้าน 26 ข้อ):**

| # | ด้าน | จำนวนข้อ |
|---|------|:--------:|
| 1 | ความสามารถในการเป็นผู้นำและการบริหารจัดการ | 5 |
| 2 | การส่งเสริมความยั่งยืน | 3 |
| 3 | ทักษะการติดต่อสื่อสารและการสร้างความสัมพันธ์ | 3 |
| 4 | ความสามารถในการคิดและนวัตกรรม | 5 |
| 5 | จริยธรรมในการปฏิบัติงาน | 3 |
| 6 | ทักษะระหว่างบุคคลและความร่วมมือ | 3 |
| 7 | การบริหารความเสี่ยงและความรับผิดชอบ | 4 |

##### 4. แบบประเมินพนักงานระดับ 4-8 — สำหรับพนักงาน (NEW!)

| รายการ | รายละเอียด |
|--------|-----------|
| ส่วนที่ 1 | 360 องศา 6 ด้าน 23 ข้อ (คะแนน 1-5: ดีเยี่ยม/ดีมาก/ดี/ต้องปรับปรุง/ต้องปรับปรุงอย่างมาก) |
| ส่วนที่ 2 | วัฒนธรรมองค์กร I-EA-T — 8 ข้อ x 2 ตาราง (ระดับความสำคัญ + ระดับพฤติกรรม) |
| ส่วนที่ 3 | คำถามปลายเปิด + ตัวอย่างพฤติกรรม |

**ด้านที่ประเมิน (ส่วนที่ 1 — 6 ด้าน 23 ข้อ):**

| # | ด้าน | จำนวนข้อ |
|---|------|:--------:|
| 1 | เก่งคิด IQ | 4 |
| 2 | เก่งคน EQ | 4 |
| 3 | เก่งงาน AQ+TQ | 4 |
| 4 | การปฏิบัติงานบนฐานความยั่งยืน Sustainability | 3 |
| 5 | การคิดเชิงนวัตกรรมและการแก้ปัญหา Innovative Thinking | 4 |
| 6 | การเรียนรู้และการปรับตัวอย่างต่อเนื่อง Learning Agility | 4 |

#### สรุปการเปลี่ยนแปลงจากระบบเดิม

| # | การเปลี่ยนแปลง |
|---|----------------|
| 1 | **ขยายกลุ่มเป้าหมาย**: จากเดิม ระดับ 5-12 เป็น ระดับ 4-12 + ผู้ว่าการ (ระดับ 13) |
| 2 | **เพิ่มแบบประเมินพนักงานระดับ 4-8**: ใช้ค่านิยม I-EA-T เป็นหลัก |
| 3 | **เพิ่มด้านใหม่**: Risk Management & Accountability, Learning Agility, Innovative Thinking |
| 4 | **ส่วนวัฒนธรรมองค์กร I-EA-T**: รับรู้/เข้าใจ/ยอมรับ(ความสำคัญ)/แสดงพฤติกรรม — ครบทุกแบบประเมิน (ยกเว้นผู้ว่าการ) |
| 5 | **ปีงบประมาณ**: ประจำปี 2569 |

#### งานที่ต้องทำ

- [ ] สร้าง Database Migration สำหรับ evaluations, parts, aspects, questions ทุกประเภท
- [ ] Seed ข้อมูลคำถาม + ตัวเลือกทั้ง 4 ประเภท (ผู้ว่าการ internal/external, ผู้บริหาร internal/external, พนักงาน)
- [ ] รองรับส่วนวัฒนธรรมองค์กร I-EA-T (2 ตาราง: ระดับความสำคัญ + ระดับพฤติกรรม)
- [ ] Admin UI: จัดการแบบประเมินทุกประเภทผ่าน Admin panel
- [ ] Assignment System: กำหนดว่าใครประเมินใครได้บ้าง ทุกระดับ
- [ ] ทดสอบ end-to-end flow ทุกประเภทแบบประเมิน

#### Angle Weights สำหรับผู้ว่าการ

| Angle | น้ำหนัก |
|-------|---------|
| ผู้บังคับบัญชา (top) | 25% |
| ผู้ใต้บังคับบัญชา (bottom) | 25% |
| ประเมินตนเอง (self) | 10% |
| เพื่อนร่วมงาน (left) | 20% |
| องค์กรภายนอก (right) | 20% |

**ประมาณชั่วโมงทำงาน**: 16–24 ชั่วโมง

---

### Task 2 — Maintenance Agreement (MA) ระบบรายเดือน

**วัตถุประสงค์**: ดูแลระบบให้ stable ตลอดช่วง Live Evaluation (เม.ย.–พ.ค.)

#### บริการที่ครอบคลุม

| บริการ | ความถี่ |
|--------|---------|
| Monitor Hostinger (CPU, RAM, PHP Workers) | ทุกวัน |
| Database Backup | ทุกสัปดาห์ |
| Security Patches (Laravel, dependencies) | เมื่อมี update สำคัญ |
| Performance Tuning (query optimization, cache) | เมื่อจำเป็น |
| Bug Fix (non-critical) | ภายใน 48 ชั่วโมง |
| Bug Fix (critical — ระบบใช้ไม่ได้) | ภายใน 4 ชั่วโมง |
| Hostinger Config Optimization | ครั้งแรก one-time setup |

#### Hostinger Server Specs (ที่มีอยู่)

```
Disk Space  : 300 GB        ✅ เพียงพอมาก
RAM         : 12,288 MB     ✅ รองรับ Laravel + DB + Queue ได้ดี
CPU Cores   : 6             ✅ รองรับ concurrent users สูง
PHP Workers : 300           ✅ ไม่ติด bottleneck
Max Process : 600           ✅ Queue jobs รองรับได้
Bandwidth   : Unlimited     ✅ ไม่ต้องห่วงเรื่อง traffic
```

**ประมาณชั่วโมงทำงาน**: 8–16 ชั่วโมง/เดือน

---

### Task 3 — ระบบ External Organization Login + องศาขวา

**วัตถุประสงค์**: สร้างระบบให้องค์กรภายนอก (ไม่มีรหัสพนักงาน) สามารถเข้ามาประเมินผู้บริหาร/ผู้ว่าการ กนอ. ได้ พร้อมระบุได้ว่าผลมาจากองค์กรใด

> ดู Technical Design เพิ่มเติมได้ที่: `docs/external_login_design.md`

#### การตัดสินใจ: Access Code + QR Code Hybrid

**ไม่ใช้ Email** — เลือกใช้ **Access Code + QR Code** เพราะเหมาะสมกับบริบทระบบประเมิน กนอ. มากที่สุด:

| เหตุผล | รายละเอียด |
|--------|-----------|
| ไม่พึ่ง 3rd Party | ไม่ต้องใช้ LINE API, SMS Gateway, SMTP |
| แจกได้ทุกช่องทาง | พิมพ์กระดาษ / LINE / SMS / งานประชุม |
| Tag Organization ชัดเจน | รหัสองค์กรฝังใน Code `IEAT-[ORG]-XXXXXX` |
| Report แยกตามองค์กร | รู้ว่าคะแนนมาจาก บริษัท A หรือ B |
| Revoke ได้ทันที | ถ้า code หลุด Admin ยกเลิกได้เลย |
| Dev เร็ว | ไม่มี OAuth flow ซับซ้อน ทันกำหนด Sprint 0 |

#### รูปแบบ Access Code

```
Access Code : IEAT-[ORG_CODE]-[RANDOM_6]
ตัวอย่าง   : IEAT-BKKP-A7X3K2

  IEAT    = ชื่อระบบ (คงที่)
  BKKP    = รหัสย่อองค์กร (Admin กำหนด)
  A7X3K2  = รหัสเฉพาะบุคคล 6 ตัว (auto-generate)

QR Code    : https://[domain]/external/evaluate?token=IEAT-BKKP-A7X3K2
             สแกนแล้วเข้าหน้าประเมินทันที ไม่ต้องพิมพ์
```

#### บัตรแจกให้ผู้ประเมินภายนอก (Print Card)

```
┌─────────────────────────────────────────┐
│      ระบบประเมิน 360 องศา กนอ.          │
│  ผู้ประเมิน : นาย ก. สมชาย              │
│  องค์กร    : บริษัท ABC จำกัด           │
│                                         │
│  รหัสเข้าถึง: IEAT-BKKP-A7X3K2         │
│              [████ QR CODE ████]        │
│                                         │
│  เว็บไซต์ : [domain]/external/login     │
│  หมดอายุ  : 31 พฤษภาคม 2569            │
└─────────────────────────────────────────┘
```

#### Database Architecture (ตารางใหม่)

```sql
-- ตาราง 1: องค์กรภายนอก
external_organizations (id, name, org_code, type, contact_name)

-- ตาราง 2: Access Codes
external_access_codes (id, access_code, qr_token,
    external_organization_id, evaluator_name, evaluator_position,
    expires_at, used_at, last_active_at, status)

-- ตาราง 3: Sessions
external_sessions (id, access_code_id, ip_address, expires_at)

-- เพิ่ม column ใน answers
ALTER TABLE answers ADD COLUMN external_access_code_id bigint NULL;
```

#### Flow การใช้งาน

```
ADMIN SIDE:
  1. สร้าง External Organization (ชื่อบริษัท / org_code)
  2. สร้าง Access Code ต่อบุคคล (ชื่อ + ตำแหน่ง + เลือก evaluatee)
     └─ ระบบ auto-generate: IEAT-BKKP-A7X3K2
     └─ ระบบ auto-generate QR Code
  3. พิมพ์ Print Card แจกในงานประชุม หรือส่ง code ผ่าน LINE
  4. กำหนดวันหมดอายุ (แนะนำ 31 พ.ค. 2569)

EXTERNAL EVALUATOR SIDE:
  วิธีที่ 1 — พิมพ์รหัส:
    เข้า /external/login → กรอก IEAT-BKKP-A7X3K2 → ยืนยันตัวตน → ประเมิน

  วิธีที่ 2 — สแกน QR:
    สแกน QR → เข้าหน้ายืนยันตัวตนทันที → ประเมิน

  Dashboard:
    ✅ ผู้ว่าการ กนอ.        เสร็จแล้ว
    🔄 รองผู้ว่าการ           [เริ่มประเมิน →]
    ⏳ ผู้ช่วยผู้ว่าการ       [เริ่มประเมิน →]

REPORT SIDE:
  ผลการประเมินองศาขวา — นาย ก. ผู้ว่าการ:
    ├─ บริษัท ABC จำกัด    → avg 4.2  (3 คน)
    ├─ บริษัท XYZ จำกัด    → avg 3.8  (2 คน)
    └─ รวมองศาขวา (avg)    → avg 4.0  × 20% weight
```

#### รายละเอียดงานที่ต้องทำ

| รายการ | รายละเอียด | ชั่วโมง |
|--------|-----------|:------:|
| Database Migration | 3 ตารางใหม่ + ALTER answers | 4 |
| ExternalAuth Middleware | Session validation + route protection | 4 |
| ExternalEvaluatorController | Login, QR entry, Confirm, Dashboard, Evaluate, Submit | 16 |
| Admin: External Organizations | CRUD + org_code management | 8 |
| Admin: Access Codes | CRUD + Generate + Revoke + Regenerate | 12 |
| QR Code Generation | simplesoftwareio/simple-qrcode library | 4 |
| Print Card PDF | พิมพ์บัตรแจก | 4 |
| React Pages (External) | Login, Confirm, Dashboard, Evaluate | 14 |
| React Pages (Admin) | Org management, Code management | 10 |
| Report Integration | คะแนนแยกตามองค์กรใน AdminDashboard | 8 |
| Security | Rate limiting (5 ครั้ง/นาที/IP), session expiry, audit log | 4 |
| Testing | End-to-end ทุก flow | 8 |
| **รวม** | | **96 ชั่วโมง** |

**ประมาณชั่วโมงทำงาน**: 80–96 ชั่วโมง

---

### Task 4 — Adjust Workflow ระบบเก่า

**วัตถุประสงค์**: ปรับ workflow การใช้งานให้เข้าใจง่ายขึ้น โดยไม่กระทบข้อมูลเก่า

#### ปัญหาปัจจุบัน vs. การแก้ไข

| # | ปัญหาปัจจุบัน | การแก้ไข |
|---|--------------|---------|
| 1 | Dashboard ไม่ชัดว่าต้องทำอะไรก่อน-หลัง | Step-based UI (Step 1: ตนเอง → Step 2: คนอื่น) |
| 2 | ไม่รู้ว่า auto-save ทำงานหรือยัง | Save indicator + confirmation toast |
| 3 | ส่งแบบประเมินเสร็จแล้วไม่มี feedback ชัดเจน | Modal confirmation + summary page |
| 4 | Admin ต้อง assign ทีละคน (ช้า) | Bulk assignment: เลือกหลายคนพร้อมกัน |
| 5 | ไม่เห็นภาพรวม progress ของตัวเอง | Progress tracker ครบทุก assignment |
| 6 | หน้าจอซับซ้อน มีข้อมูลเยอะเกินไป | Clean layout, ซ่อนข้อมูลรอง |

#### User Dashboard ใหม่ (Wire Concept)

```
┌──────────────────────────────────────────────────────┐
│  สวัสดี, [ชื่อ]           ปีงบประมาณ 2569           │
├──────────────────────────────────────────────────────┤
│  ✅ Step 1: ประเมินตนเอง                              │
│  [████████████░░░░] 75%   [ทำต่อ →]                 │
├──────────────────────────────────────────────────────┤
│  📋 Step 2: ประเมินผู้อื่น  (3/8 เสร็จแล้ว)         │
│                                                      │
│  ✅ นาย ก.    ผู้บริหาร  เสร็จแล้ว                  │
│  ✅ นาง ข.    ผู้จัดการ  เสร็จแล้ว                  │
│  🔄 นาย ค.    ผู้บริหาร  [เริ่มเลย →]  ⚡ ด่วน      │
│  ⏳ นาง ง.    พนักงาน   [เริ่ม →]                   │
└──────────────────────────────────────────────────────┘
```

**ประมาณชั่วโมงทำงาน**: 32–48 ชั่วโมง

---

### Task 5 — AdminDashboard ครบทุกระบบ

**วัตถุประสงค์**: ให้ AdminDashboard รองรับทุก evaluation type แบบ dynamic ไม่ hardcode eval IDs

#### ปัญหาปัจจุบัน

- Dashboard hardcode evaluation_id = 1 (ผู้บริหาร) และ 3 (พนักงาน)
- ไม่รองรับ ผู้ว่าการ evaluation (ที่กำลังจะสร้าง)
- ไม่รองรับ external organization data
- Export ทำได้เฉพาะบาง eval type
- Weighted score แสดงไม่ถูกต้องสำหรับทุก grade level

#### Dashboard Views ที่ต้องรองรับ (4 ประเภทแบบประเมิน)

```
AdminDashboard
├── 📊 Overview Tab
│   ├── KPI: จำนวนผู้เข้าร่วมทั้งหมด (ทุก eval)
│   ├── KPI: Completion rate แยกกลุ่ม
│   │   ├── ผู้ว่าการ ระดับ 13 (ภายใน 28 ข้อ + ภายนอก 25 ข้อ)  [x/y คน]
│   │   ├── ผู้บริหาร 9-12 ภายใน (30 ข้อ + I-EA-T 8 ข้อ)      [x/y คน]
│   │   ├── ผู้บริหาร 9-12 ภายนอก (26 ข้อ + I-EA-T 8 ข้อ)     [x/y คน]
│   │   └── พนักงาน 4-8 (23 ข้อ + I-EA-T 8 ข้อ)               [x/y คน]
│   ├── Chart: Completion by Division (Bar)
│   └── Chart: Score Distribution by Grade Group
│
├── 📈 Analytics Tab
│   ├── Filter: Grade Group / Division / Fiscal Year
│   ├── Weighted Score แสดงถูกตามน้ำหนักจริง
│   │   ├── ผู้ว่าการ:   top 25% / bottom 25% / self 10% / left 20% / right 20%
│   │   ├── ผู้บริหาร:  top 25% / bottom 25% / self 10% / left 20% / right 20%
│   │   └── พนักงาน 4-8: self 50% / top 20% / left 30%
│   ├── I-EA-T Culture Score Analysis (ระดับความสำคัญ vs ระดับพฤติกรรม)
│   └── External Org Analysis (คะแนนองศาขวาแยกตามองค์กร)
│
├── 📋 Reports Tab
│   ├── ตารางรายชื่อทุกกลุ่ม + คะแนน (รวม I-EA-T scores)
│   ├── Filter ครบ: eval type (4 ประเภท), grade, division, angle, fiscal year
│   └── Click → Individual Report popup (ทุก grade level)
│
└── 📤 Exports Tab
    ├── รายงานผู้ว่าการ ระดับ 13 (Excel/PDF) — ภายใน+ภายนอก
    ├── รายงานผู้บริหาร 9-12 ภายใน (Excel/PDF) — รวม I-EA-T
    ├── รายงานผู้บริหาร 9-12 ภายนอก (Excel/PDF) — รวม I-EA-T
    ├── รายงานพนักงาน 4-8 (Excel/PDF) — รวม I-EA-T
    ├── รายงานองค์กรภายนอก (Excel/PDF)
    ├── รายงานรวมทุกกลุ่ม (Excel/PDF)
    └── รายงานตนเอง (Excel/PDF)
```

#### งานที่ต้องทำ

| รายการ | ชั่วโมง |
|--------|---------|
| Refactor Controller: ลบ hardcoded IDs ให้ dynamic | 12 |
| KPI Cards รองรับทุก eval type | 10 |
| Charts: แยก view ตาม grade group | 14 |
| Weighted Score: ถูกต้องทุก grade level | 10 |
| External Org section ใน Report | 12 |
| Export: ครบทุก eval type รวม ผู้ว่าการ + external | 14 |
| Individual Report: ทุก grade | 8 |
| UI Polish + Filter UX | 10 |
| Testing | 8 |
| **รวม** | **98 ชั่วโมง** |

**ประมาณชั่วโมงทำงาน**: 80–100 ชั่วโมง

---

## 4. แผนการทำงาน — Developer 1 คน (OT Model)

> **รูปแบบ**: Developer 1 คน ทำงานนอกเวลา (OT) ควบคู่กับงานประจำ
> **เงินเดือนปกติ**: 40,000 บาท/เดือน
> **ทำงานวันธรรมดาหลังเลิกงาน**: ~2–3 ชม./วัน
> **ทำงานวันหยุด (เสาร์-อาทิตย์)**: ~6–8 ชม./วัน
> **กำลังการผลิต OT ต่อสัปดาห์**: ~25–30 ชม.

### เหตุผลที่ลดชั่วโมงจากแผนเดิม (~28%)

| # | เหตุผล | ผลกระทบ |
|---|--------|---------|
| 1 | ใช้ AI-assisted development (Claude Code) เร่งงาน coding, testing, docs | ลด 20–30% ต่อ task |
| 2 | Developer คนเดียว — ไม่มี communication overhead, merge conflict | ลด 5–10% |
| 3 | Reuse pattern จากระบบที่มีอยู่ (เช่น CRUD org structure ที่สร้างแล้ว) | ลด 10–15% |
| 4 | ลำดับงานต่อเนื่อง — ไม่ต้อง context switch ระหว่าง 2 คน | ลด 5% |

---

### Sprint 0 — เร่งด่วน (1 มี.ค. – 6 มี.ค.) = 6 วัน | 22 ชม.

**เป้าหมาย**: ระบบพร้อมทดสอบ + แบบประเมิน 4 ประเภทใช้งานได้ (ผู้ว่าการ, ผู้บริหาร 9-12 ภายใน/ภายนอก, พนักงาน 4-8)

| สัปดาห์ | งาน | ชม. OT |
|---------|-----|:------:|
| สัปดาห์ 1 (จ–ศ) | สร้าง Migration + Seed คำถามทั้ง 4 ประเภท + ส่วน I-EA-T + Admin UI | 12 |
| สัปดาห์ 1 (ส–อา) | Deploy + Config Hostinger + ทดสอบ Assignment | 10 |
| **รวม** | | **22** |

---

### Sprint 1 — พัฒนาหลัก (7 มี.ค. – 6 เม.ย.) = 31 วัน (~4.5 สัปดาห์) | 92 ชม.

**เป้าหมาย**: External Access Code + Workflow ใหม่

| สัปดาห์ | งาน | ชม. OT |
|---------|-----|:------:|
| สัปดาห์ 1 | External Organizations DB + Migration + Middleware | 22 |
| สัปดาห์ 2 | Admin: จัดการ Org + Access Codes + QR Generate | 22 |
| สัปดาห์ 3 | External Login/Confirm/Dashboard + Evaluation Form | 22 |
| สัปดาห์ 4 | User Dashboard Workflow redesign + Bulk Assignment | 20 |
| สัปดาห์ 4.5 | Testing + Bug fixes | 6 |
| **รวม** | | **92** |

---

### Sprint 2 — AdminDashboard ครบระบบ (7 เม.ย. – 30 เม.ย.) = 24 วัน (~3.5 สัปดาห์) | 64 ชม.

**เป้าหมาย**: Dashboard ครบ + Production-ready

| สัปดาห์ | งาน | ชม. OT |
|---------|-----|:------:|
| สัปดาห์ 1 | Refactor Controller (dynamic) + KPI Cards ทุก eval | 20 |
| สัปดาห์ 2 | Weighted Score ครบ + Charts + Filter | 20 |
| สัปดาห์ 3 | Export ครบทุก eval type + Individual Report | 18 |
| สัปดาห์ 3.5 | Security + Integration testing + Deploy | 6 |
| **รวม** | | **64** |

**เป้าหมาย Sprint 2**: ทุกระบบ Production-ready วันที่ 30 เม.ย.

---

### Sprint 3 — Live Evaluation + MA (1 พ.ค. – 31 พ.ค.) = 31 วัน | 10 ชม./เดือน

**เป้าหมาย**: ระบบ stable ตลอดช่วง Live

| รายการ | ความถี่ |
|--------|---------|
| Monitor Hostinger (CPU, RAM, PHP Workers) | ทุกวัน (5 นาที) |
| Database Backup verify | ทุกสัปดาห์ |
| Critical bug fix | ภายใน 4 ชั่วโมง |
| Non-critical bug fix | ภายใน 48 ชั่วโมง |

---

### Sprint 4 — Report Delivery (1–14 มิ.ย.) = 14 วัน | 14 ชม.

| รายการ | ชม. |
|--------|:---:|
| Export ทดสอบกับ Live data จริงครบ | 4 |
| Dashboard Summary สำหรับ Progress Report 2 | 4 |
| PDF/Excel รายงานทุกกลุ่ม | 4 |
| UAT + ส่งมอบ | 2 |
| **รวม** | **14** |

---

## 5. สรุปชั่วโมงทำงาน (ปรับลดสำหรับ 1 คน + AI-assisted)

### เปรียบเทียบชั่วโมงเดิม vs. ใหม่

| Task | งาน | เดิม (2 คน) | ปรับลด (1 คน) | ลด% |
|------|-----|:---:|:---:|:---:|
| Task 1 | แบบประเมิน 4 ประเภท (ผู้ว่าการ+ผู้บริหาร+พนักงาน+I-EA-T) | 20 ชม. | 14 ชม. | -30% |
| Task 3 | External Access Code + QR | 88 ชม. | 64 ชม. | -27% |
| Task 4 | Workflow Adjustment | 40 ชม. | 28 ชม. | -30% |
| Task 5 | AdminDashboard ครบระบบ | 90 ชม. | 64 ชม. | -29% |
| Deploy | Hostinger Setup + Config | 10 ชม. | 8 ชม. | -20% |
| Sprint 4 | Report Preparation | 20 ชม. | 14 ชม. | -30% |
| **รวม One-time** | | **268 ชม.** | **192 ชม.** | **-28%** |
| Task 2 | MA รายเดือน | 12 ชม. | 10 ชม. | -17% |

### กำลังการผลิต OT vs. ความต้องการ

| Sprint | ระยะเวลา | ชม. ที่ต้องการ | ชม. OT ที่มี | สถานะ |
|--------|---------|:---:|:---:|:---:|
| Sprint 0 | 6 วัน (~1 สัปดาห์) | 22 | ~55 | เพียงพอ |
| Sprint 1 | 31 วัน (~4.5 สัปดาห์) | 92 | ~125 | เพียงพอ |
| Sprint 2 | 24 วัน (~3.5 สัปดาห์) | 64 | ~95 | เพียงพอ |
| Sprint 3 | 31 วัน (MA) | 10 | ~30 | เพียงพอ |
| Sprint 4 | 14 วัน (~2 สัปดาห์) | 14 | ~55 | เพียงพอ |
| **รวม** | **106 วัน** | **202** | **~360** | **มี buffer 78%** |

---

## 6. ประเมินราคา — OT Model (Developer 1 คน)

### ฐานคำนวณ OT ตาม พ.ร.บ.คุ้มครองแรงงาน

| รายการ | การคำนวณ | อัตรา |
|--------|---------|:-----:|
| เงินเดือน | — | 40,000 บาท/เดือน |
| ค่าจ้างรายวัน | 40,000 / 30 | 1,333.33 บาท/วัน |
| ค่าจ้างรายชั่วโมง | 1,333.33 / 8 | **166.67 บาท/ชม.** |
| OT วันธรรมดา | 166.67 x 1.5 | **250 บาท/ชม.** |
| ทำงานวันหยุด (ชม.ปกติ) | 166.67 x 1.0 (เพิ่มเติม) | **167 บาท/ชม.** |
| OT วันหยุด (เกิน 8 ชม.) | 166.67 x 3.0 | **500 บาท/ชม.** |

> **หมายเหตุ**: ลูกจ้างรายเดือนทำงานวันหยุด ได้ค่าจ้างเพิ่ม 1 เท่า (มาตรา 62)
> ล่วงเวลาวันหยุด ได้ 3 เท่า (มาตรา 63)

---

### ประมาณสัดส่วน OT แยกประเภท

| Sprint | รวม (ชม.) | OT วันธรรมดา (1.5x) | วันหยุด ปกติ (1x) | OT วันหยุด (3x) |
|--------|:---:|:---:|:---:|:---:|
| Sprint 0 | 22 | 12 | 8 | 2 |
| Sprint 1 | 92 | 50 | 28 | 14 |
| Sprint 2 | 64 | 40 | 18 | 6 |
| Sprint 4 | 14 | 10 | 4 | 0 |
| **รวม Dev** | **192** | **112** | **58** | **22** |
| MA (4 เดือน) | 40 | 32 | 8 | 0 |
| **รวมทั้งหมด** | **232** | **144** | **66** | **22** |

---

### คำนวณค่าตอบแทน OT

#### งานพัฒนา (One-time) — 192 ชั่วโมง

| ประเภท OT | ชั่วโมง | อัตรา (บาท/ชม.) | ค่าตอบแทน (บาท) |
|-----------|:---:|:---:|:---:|
| OT วันธรรมดา (x1.5) | 112 | 250 | 28,000 |
| ทำงานวันหยุด ปกติ (x1.0 เพิ่ม) | 58 | 167 | 9,686 |
| OT วันหยุด (x3.0) | 22 | 500 | 11,000 |
| **รวม One-time** | **192** | | **48,686** |

#### MA — 40 ชั่วโมง (4 เดือน x 10 ชม.)

| ประเภท OT | ชั่วโมง | อัตรา (บาท/ชม.) | ค่าตอบแทน (บาท) |
|-----------|:---:|:---:|:---:|
| OT วันธรรมดา (x1.5) | 32 | 250 | 8,000 |
| ทำงานวันหยุด ปกติ (x1.0 เพิ่ม) | 8 | 167 | 1,336 |
| **รวม MA** | **40** | | **9,336** |

---

### สรุปราคารวม Project (งวดงานที่ 3) — OT Model

| รายการ | ชั่วโมง | ค่าตอบแทน (บาท) |
|--------|:---:|:---:|
| One-time Development | 192 ชม. | 48,686 |
| MA 4 เดือน (มี.ค.–มิ.ย.) | 40 ชม. | 9,336 |
| **รวมทั้งสิ้น** | **232 ชม.** | **58,022** |
| **ปัดเป็นเลขกลม** | | **~58,000 บาท** |

---

### เปรียบเทียบกับแผนเดิม (จ้างภายนอก 2 คน)

| รายการ | แผนเดิม (จ้างนอก 2 คน) | แผนใหม่ (OT 1 คน) | ประหยัด |
|--------|:---:|:---:|:---:|
| ชั่วโมงทำงาน | 268 + MA 48 = 316 ชม. | 192 + MA 40 = 232 ชม. | -27% |
| ค่าพัฒนา One-time | 214,400 บาท | 48,686 บาท | -77% |
| ค่า MA (4 เดือน) | ~32,000 บาท | 9,336 บาท | -71% |
| **รวมทั้งสิ้น** | **~246,400 บาท** | **~58,000 บาท** | **-76%** |

> **ข้อแลกเปลี่ยน**: ใช้เวลานานขึ้น (Sprint 1 ขยายจาก 14 วัน → 31 วัน)
> แต่ยังอยู่ในกรอบเวลารวม 106 วัน (14 มิ.ย. 2569)

---

### การจ่ายค่า OT รายเดือน (ประมาณ)

| เดือน | Sprint | ชม. OT | ค่า OT โดยประมาณ |
|-------|--------|:---:|:---:|
| มี.ค. 2569 | Sprint 0 + Sprint 1 (บางส่วน) | 70 | ~18,200 |
| เม.ย. 2569 | Sprint 1 (ส่วนที่เหลือ) + Sprint 2 (เริ่ม) | 80 | ~20,600 |
| พ.ค. 2569 | Sprint 2 (จบ) + Sprint 3 (MA) | 42 | ~11,200 |
| มิ.ย. 2569 | Sprint 3 (MA) + Sprint 4 | 40 | ~8,000 |
| **รวม** | | **232** | **~58,000** |

---

## 7. Deliverables (สิ่งที่ส่งมอบ)

| # | Deliverable | กำหนดส่ง |
|---|-------------|---------|
| D1 | แบบประเมิน 4 ประเภท: ผู้ว่าการ (internal+external), ผู้บริหาร 9-12 (internal+external), พนักงาน 4-8 พร้อม I-EA-T บน production | 1 มี.ค. |
| D2 | ระบบ External Organization Login + ประเมินองศาขวา | 20 มี.ค. |
| D3 | Workflow ใหม่ (User Dashboard + Admin Bulk Assign) | 20 มี.ค. |
| D4 | AdminDashboard รองรับทุก eval type + Export ครบ | 31 มี.ค. |
| D5 | Production Server Config + Load Test Report | 31 มี.ค. |
| D6 | MA Report (เม.ย.–พ.ค.) — สรุปการดูแลระบบรายเดือน | ทุกสิ้นเดือน |
| D7 | Export/Report สำหรับ Progress Report 2 | 10 มิ.ย. |

---

## 8. ข้อกำหนดและเงื่อนไข

### สิ่งที่ผู้ว่าจ้างต้องจัดเตรียม

- [ ] ข้อมูลคำถามแบบประเมินทั้ง 4 ประเภท (ผู้ว่าการ, ผู้บริหาร 9-12 ภายใน/ภายนอก, พนักงาน 4-8) ฉบับสมบูรณ์ รวมส่วน I-EA-T
- [ ] รายชื่อองค์กรภายนอกที่ต้องการเชิญประเมิน
- [ ] Hostinger credentials สำหรับ deploy
- [ ] Email server / SMTP credentials สำหรับส่ง invitation

### ข้อยกเว้นจาก Scope

- การเพิ่มคำถามใหม่ในแบบประเมินที่มีอยู่แล้ว (ทำเองผ่าน Admin)
- การออกแบบ Graphics / Branding ใหม่
- การแปลภาษาอื่นนอกจากภาษาไทย
- การ integrate กับระบบ HR ภายนอก (ถ้ามี ต้องประเมินเพิ่ม)

### SLA (Service Level Agreement) — ช่วง Live Evaluation

| ประเภท | ตอบกลับ | แก้ไข |
|--------|---------|-------|
| Critical (ระบบล่ม, login ไม่ได้, data loss) | 2 ชั่วโมง | 4 ชั่วโมง |
| High (ฟีเจอร์หลักใช้ไม่ได้) | 4 ชั่วโมง | 24 ชั่วโมง |
| Medium (ฟีเจอร์รองมีปัญหา) | 8 ชั่วโมง | 48 ชั่วโมง |
| Low (UI เล็กน้อย, ปรับปรุง) | 24 ชั่วโมง | Sprint ถัดไป |

---

## 9. สรุป

| หัวข้อ | รายละเอียด |
|--------|-----------|
| โครงการ | พัฒนาระบบการประเมิน 360 องศา กนอ. (Phase 3) |
| ระยะเวลา | 1 มี.ค. – 14 มิ.ย. 2569 (106 วัน) |
| ทีมพัฒนา | Developer 1 คน (ทำงานนอกเวลา OT) + AI-assisted |
| เงินเดือนฐาน | 40,000 บาท/เดือน |
| Tasks หลัก | 5 tasks + MA |
| ชั่วโมง OT รวม | 232 ชั่วโมง (192 dev + 40 MA) |
| ค่า OT รวม Project | **~58,000 บาท** |
| ค่า OT เฉลี่ยต่อเดือน | **~14,500 บาท/เดือน** (4 เดือน) |
| Authentication Approach | Account-based + External Organizations Table |
| Critical Deadline | **6 มีนาคม 2569** (ทดสอบระบบ) |

---

---

## 10. งานที่ดำเนินการแล้ว (Completed Work)

### 10.1 ระบบจัดการโครงสร้างองค์กร (Organizational Structure Management)

**สถานะ**: Completed (23 ก.พ. 2569)

ระบบ CRUD สำหรับจัดการโครงสร้างองค์กรทั้ง 4 entities ผ่าน Admin Panel:

| Entity | Controller | หน้า React | Routes |
|--------|-----------|-----------|--------|
| สายงาน (Division) | AdminDivisionController | AdminDivisionIndex + AdminDivisionForm | 6 routes |
| หน่วยงาน (Department) | AdminDepartmentController | AdminDepartmentIndex + AdminDepartmentForm | 6 routes |
| ตำแหน่ง (Position) | AdminPositionController | AdminPositionIndex + AdminPositionForm | 6 routes |
| ฝ่าย (Faction) | AdminFactionController | AdminFactionIndex + AdminFactionForm | 6 routes |

**ฟีเจอร์ที่ครอบคลุม:**
- CRUD ครบ (สร้าง, ดู, แก้ไข, ลบ) ทุก entity
- ค้นหา + Pagination (10 รายการ/หน้า)
- Filter by parent entity (Department filter by Division, Position filter by Department)
- Data integrity protection (ป้องกันลบ entity ที่มีสมาชิก)
- Dark mode support
- Breadcrumb navigation
- Toast notifications
- Dashboard integration (4 cards ใน Admin Dashboard)

**ไฟล์ที่สร้างใหม่**: 13 ไฟล์ (4 controllers + 8 React pages + 1 doc)
**ไฟล์ที่แก้ไข**: 10 ไฟล์ (3 models + routes + dashboard + AdminUserForm + 4 docs)

### 10.2 ระบบรายงานและ Export (Report & Export System)

**สถานะ**: Completed

- AdminEvaluationReport.tsx — Dashboard, Analytics, Reports, Exports 4 views
- Export Excel: Comprehensive, Executive, Employee, Self-Evaluation, Detailed Data, Individual, Weighted, Raw Data
- Export PDF: Individual, Comprehensive
- API endpoints: Dashboard data, Completion stats, Real-time data, Individual angle report

### 10.3 ระบบจัดการ Assignment (Assignment Management)

**สถานะ**: Completed

- Admin สามารถสร้าง, แก้ไข, ลบ evaluation assignments
- Bulk operations (สร้าง/ลบหลายรายการ)
- Analytics + Export

---

## 11. ระบบปีงบประมาณ (Fiscal Year System)

### 11.1 หลักการออกแบบ

ระบบปีงบประมาณแบ่งข้อมูลเป็น 2 ระดับ:

| ระดับ | ขอบเขต | ตัวอย่าง |
|-------|--------|----------|
| **Master Data (ข้อมูลหลัก)** | ใช้ร่วมทุกปี — ไม่มี fiscal_year | users, divisions, departments, positions, factions, evaluations, questions |
| **Execution Data (ข้อมูลการดำเนินงาน)** | แยกตามปีงบประมาณ — มี fiscal_year | evaluation_assignments, answers, satisfaction_evaluations, external_access_codes |

> **หลักการ**: แบบประเมิน (template) ใช้ซ้ำได้ทุกปี — เฉพาะ "ใครถูก assign ให้ประเมินใคร" และ "คำตอบ" เท่านั้นที่ผูกกับปีงบประมาณ

### 11.2 การคำนวณปีงบประมาณไทย (ต.ค. – ก.ย.)

```
ปีงบประมาณ = เดือนปัจจุบัน >= ตุลาคม ? ปี ค.ศ. ถัดไป : ปี ค.ศ. ปัจจุบัน
```

| ช่วงเวลา | ปี ค.ศ. | ปีงบประมาณ (พ.ศ.) |
|-----------|---------|-------------------|
| ม.ค. 2026 – ก.ย. 2026 | 2026 | 2569 |
| ต.ค. 2025 – ธ.ค. 2025 | 2026 | 2569 |
| ต.ค. 2026 – ธ.ค. 2026 | 2027 | 2570 |

### 11.3 ตารางที่มี Column ปีงบประมาณ

| ตาราง | Column | Type | หมายเหตุ |
|-------|--------|------|----------|
| `evaluation_assignments` | `fiscal_year` | varchar(255) | ตาราง assignment หลัก — ใช้กรอง assignment ทั้งหมด |
| `answers` | `fiscal_year` | unsignedSmallInteger | เพิ่มเมื่อ 8 มี.ค. 69 — backfill จาก assignment + index |
| `satisfaction_evaluations` | `fiscal_year` | varchar(4) | Unique constraint: user_id + evaluation_id + fiscal_year |
| `external_access_codes` | `fiscal_year` | integer | ผูก access code กับปีงบประมาณ |

### 11.4 วิเคราะห์การรองรับปีงบประมาณแต่ละหน้า

#### ก. หน้าที่มีตัวเลือกปีงบประมาณ (Fiscal Year Selector) ✅

| # | หน้า | Controller | การทำงาน |
|---|------|-----------|----------|
| 1 | **Admin Dashboard** (`/dashboardadmin`) | HomeController | Dropdown เลือกปี — KPI, สถิติ, Completion rate แยกตามปี |
| 2 | **User Dashboard** (`/dashboard`) | EvaluationAssignmentController | กรองรายการ assignment ตามปี — fallback ไปปีล่าสุดที่มีข้อมูล |
| 3 | **Admin Report** (`/admin/reports/evaluation`) | AdminEvaluationReportController | Filter ปี + สายงาน + ระดับ + หน่วยงาน — ข้อมูลรายงานทั้งหมดแยกตามปี |
| 4 | **Admin Assignment Manager** (`/admin/assignments`) | AdminEvaluationAssignmentController | Dropdown เลือกปี — ดู/สร้าง/แก้ไข assignment แยกตามปี + cache fiscal_years |
| 5 | **Admin Access Code Index** (`/admin/access-codes`) | AdminAccessCodeController | แสดงปีงบประมาณของแต่ละ code ในตาราง |
| 6 | **Admin Access Code Generate** (`/admin/access-codes/generate`) | AdminAccessCodeController | Input ระบุปีงบประมาณ (required, min: 2500) ตอนสร้าง code |
| 7 | **แบบสอบถามความพึงพอใจ** (`/satisfaction-evaluation`) | SatisfactionEvaluationController | ส่งปีงบประมาณร่วมกับคำตอบ — Unique constraint ป้องกันตอบซ้ำ |
| 8 | **ผลสำรวจความพึงพอใจ** (`/admin/satisfaction-results`) | SatisfactionEvaluationController | แสดงผลแยกตามปี |

#### ข. หน้าที่ Backend กรองปีงบประมาณอัตโนมัติ (ผู้ใช้ไม่ต้องเลือก) ✅

| # | หน้า | Controller | การทำงาน |
|---|------|-----------|----------|
| 1 | **ประเมินตนเอง** (`/evaluations/self`) | SelfEvaluationController | `getCurrentFiscalYear()` กรองอัตโนมัติ — คำตอบ save พร้อม fiscal_year |
| 2 | **ประเมินผู้อื่น** (`/assigned-evaluations/{id}`) | AssignedEvaluationController | ใช้ `assignment.fiscal_year` จากตาราง assignment — กรองโดยอิงจาก assignment |
| 3 | **External Login** (`/external/login`) | ExternalEvaluatorController | ใช้ fiscal_year จาก access_code |
| 4 | **External Dashboard** (`/external/dashboard`) | ExternalEvaluatorController | ใช้ fiscal_year จาก session ที่ผูกกับ access_code |
| 5 | **External Evaluation** (`/external/evaluate/{id}`) | ExternalEvaluatorController | คำตอบ save พร้อม fiscal_year จาก access_code |

#### ค. หน้าที่ไม่ต้องมีปีงบประมาณ (Master Data / Static) ✅

| กลุ่ม | หน้า | เหตุผล |
|-------|------|--------|
| **โครงสร้างองค์กร** | AdminDivisionIndex/Form, AdminDepartmentIndex/Form, AdminPositionIndex/Form, AdminFactionIndex/Form | ข้อมูลหลักใช้ร่วมทุกปี |
| **จัดการผู้ใช้** | AdminUserManager, AdminUserForm, ProfileEditPage | ผู้ใช้ไม่ผูกกับปีงบประมาณ |
| **แบบประเมิน (Template)** | AdminEvaluationManager/Create/Edit/Preview | Template ใช้ซ้ำได้ทุกปี |
| **โครงสร้างแบบประเมิน** | AdminPart, AdminAspect, AdminSubAspect, AdminQuestion (Index/Create/Edit) | ส่วนประกอบของ template |
| **องค์กรภายนอก** | AdminExternalOrganizationIndex/Form | ข้อมูลหลักองค์กร |
| **หน้าทั่วไป** | Welcome, Login, CookiePolicy, ExternalConfirm, ExternalThankYou | ไม่เกี่ยวกับข้อมูลประเมิน |

### 11.5 Data Flow: ปีงบประมาณในระบบ

```
                    ┌─────────────────────────────────────────┐
                    │          Admin สร้าง Assignment          │
                    │   กำหนด: ผู้ประเมิน + ผู้ถูกประเมิน     │
                    │          + ปีงบประมาณ (fiscal_year)       │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │      evaluation_assignments              │
                    │   fiscal_year = 2569                     │
                    └──────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼────────┐
    │   ประเมินตนเอง    │ │  ประเมินผู้อื่น │ │  External eval  │
    │  (auto fiscal yr) │ │ (from assign)  │ │ (from code)     │
    └─────────┬─────────┘ └───────┬────────┘ └────────┬────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │              answers                     │
                    │   fiscal_year = 2569                     │
                    │   (backfill from assignment)             │
                    └──────────────┬──────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼─────────┐ ┌───────▼────────┐ ┌────────▼────────┐
    │  Admin Dashboard  │ │  Admin Report  │ │  Excel/PDF      │
    │  (filter by year) │ │ (filter by yr) │ │  Export          │
    └───────────────────┘ └────────────────┘ └─────────────────┘
```

### 11.6 Services ที่รองรับปีงบประมาณ

| Service | Method ที่กรองตามปี | ใช้ใน |
|---------|-------------------|-------|
| **ScoreCalculationService** | `calculateScores($evaluateeId, $fiscalYear)` | Report, Dashboard |
| **WeightedScoringService** | `calculateWeightedScore($evaluateeId, $fiscalYear)`, `aggregateScores()` | Report ผู้ว่าการ |
| **EvaluationExportService** | `exportComprehensive($fiscalYear)`, `exportIndividual()` ฯลฯ | Export Excel/PDF |

### 11.7 สรุปความครบถ้วน

| Layer | สถานะ | รายละเอียด |
|-------|:------:|-----------|
| **Database** | ✅ ครบ | 4 ตารางมี fiscal_year + indexes + constraints |
| **Models** | ✅ ครบ | `scopeFiscalYear()`, fillable fiscal_year ทุกตาราง |
| **Controllers** | ✅ ครบ | 9 controllers กรองตามปี — master data controllers ไม่ต้องกรอง (ถูกต้อง) |
| **Services** | ✅ ครบ | Score, Weighted, Export ทุก service กรองตามปี |
| **Frontend** | ✅ ครบ | 8 หน้ามี selector/filter — 5 หน้า backend กรองอัตโนมัติ — ที่เหลือไม่ต้องกรอง |
| **Report/Export** | ✅ ครบ | Excel, PDF, Dashboard, Charts ทั้งหมดแยกตามปี |

> **ข้อสังเกต**: Type ของ `fiscal_year` ยังไม่ consistent ข้ามตาราง (varchar/smallint/int) — แนะนำให้ standardize เป็น `unsignedSmallInteger` ทุกตารางในอนาคต

---

*เอกสารนี้จัดทำเมื่อ 1 มีนาคม 2569 (ปรับปรุง 20 มีนาคม 2569 — อัปเดตแบบประเมิน 4 ประเภทใหม่ ปี 2569)*
*ราคาอาจปรับเปลี่ยนได้หาก scope มีการเปลี่ยนแปลงหลังเริ่มงาน*
