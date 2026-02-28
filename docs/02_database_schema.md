# Database Schema — milesconsultdb

## ภาพรวม ERD (Entity Relationship)

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│  divisions  │────▶│  departments │────▶│ positions │
└─────────────┘     └──────────────┘     └───────────┘
      │                    │                    │
      └────────────────────┴────────────────────┘
                           │
                        ┌──▼──┐     ┌──────────┐
                        │users│────▶│ factions │
                        └──┬──┘     └──────────┘
                           │
          ┌────────────────┼────────────────────┐
          │                │                    │
          ▼                ▼                    ▼
  evaluation_      evaluation_        satisfaction_
  assignments      answers            evaluations
          │                │
          └────────┬───────┘
                   ▼
            evaluations
                   │
                ┌──▼──┐
                │parts│
                └──┬──┘
                   │
              ┌────▼────┐
              │ aspects │
              └────┬────┘
                   │
          ┌────────▼────────┐
          │   sub_aspects   │
          └─────────────────┘
                   │
              ┌────▼─────┐
              │ questions │
              └─────┬─────┘
                    │
               ┌────▼────┐
               │ options │
               └─────────┘
```

---

## กลุ่มที่ 1: โครงสร้างองค์กร

### ตาราง `divisions` (สายงาน)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสสายงาน |
| name | varchar(255) | NO | UNI | | ชื่อสายงาน (unique) |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**ข้อมูลในระบบ:**

| id | ชื่อสายงาน |
|---|---|
| 1 | สายงานผู้ว่าการ |
| 2 | สายงานบริหาร |
| 3 | สายงานยุทธศาสตร์ |
| 4 | สายงานพัฒนาที่ยั่งยืน |
| 5 | สายงานปฏิบัติการ 1 |
| 6 | สายงานปฏิบัติการ 2 |
| 7 | สายงานปฏิบัติการ 3 |

---

### ตาราง `departments` (หน่วยงาน)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสหน่วยงาน |
| division_id | bigint UNSIGNED | NO | FK | | FK → divisions.id CASCADE |
| name | varchar(255) | NO | | | ชื่อหน่วยงาน |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**Constraints:**
- `division_id` → `divisions.id` ON DELETE CASCADE

---

### ตาราง `positions` (ตำแหน่ง)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสตำแหน่ง |
| department_id | bigint UNSIGNED | NO | FK | | FK → departments.id CASCADE |
| title | varchar(255) | NO | | | ชื่อตำแหน่ง |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**Constraints:**
- `department_id` → `departments.id` ON DELETE CASCADE

---

### ตาราง `factions` (ฝ่าย)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสฝ่าย |
| name | varchar(255) | NO | | | ชื่อฝ่าย |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

> **หมายเหตุ**: factions เป็น cross-cutting groups ไม่ได้อยู่ภายใต้ departments

---

### ตาราง `users`

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสผู้ใช้ระบบ |
| emid | varchar(255) | NO | UNI | | รหัสพนักงาน (unique) เช่น 391039 |
| prename | varchar(255) | NO | | | คำนำหน้า: นาย, นาง, นางสาว, ดร. |
| fname | varchar(255) | NO | | | ชื่อ |
| lname | varchar(255) | NO | | | นามสกุล |
| sex | varchar(255) | NO | | | เพศ: ชาย / หญิง |
| division_id | bigint UNSIGNED | NO | FK | | FK → divisions.id CASCADE |
| department_id | bigint UNSIGNED | NO | FK | | FK → departments.id CASCADE |
| position_id | bigint UNSIGNED | NO | FK | | FK → positions.id CASCADE |
| faction_id | bigint UNSIGNED | NO | FK | | FK → factions.id CASCADE |
| grade | varchar(255) | YES | | NULL | ระดับ 4–12 |
| birthdate | date | NO | | | วันเกิด |
| password | varchar(255) | NO | | | Password (bcrypt hashed) |
| remember_token | varchar(100) | YES | | NULL | Remember me token |
| photo | varchar(255) | YES | | NULL | path รูปโปรไฟล์ |
| role | varchar(255) | NO | | 'user' | บทบาท: user / admin |
| user_type | enum | NO | | 'internal' | internal / external |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**Constraints:**
- UNIQUE: `emid`
- FK: `division_id` → `divisions.id` ON DELETE CASCADE
- FK: `department_id` → `departments.id` ON DELETE CASCADE
- FK: `position_id` → `positions.id` ON DELETE CASCADE
- FK: `faction_id` → `factions.id` ON DELETE CASCADE

**ตัวอย่างข้อมูล:**

| id | emid | prename | fname | lname | grade | role |
|---|---|---|---|---|---|---|
| 201 | 999999 | นางสาว | Admin | Control | 5 | admin |
| 411 | 391039 | นาย | เริงฤทธิ์ | กุศลกรรมบถ | 12 | user |
| 831 | (active) | - | - | - | 9–12 | user |

---

## กลุ่มที่ 2: โครงสร้างแบบประเมิน

### ตาราง `evaluations`

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสแบบประเมิน |
| title | varchar(255) | NO | | | ชื่อแบบประเมิน |
| description | text | YES | | NULL | คำอธิบาย |
| status | varchar(255) | NO | | 'draft' | สถานะ: draft / published |
| user_type | enum | NO | | | internal / external |
| grade_min | tinyint UNSIGNED | NO | | | ระดับขั้นต่ำ |
| grade_max | tinyint UNSIGNED | NO | | | ระดับสูงสุด |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**ข้อมูลในระบบ (6 แบบประเมิน):**

| id | ชื่อ | status | user_type | grade |
|---|---|---|---|---|
| 1 | แบบประเมิน 360 องศา สำหรับกลุ่มผู้บริหารระดับ 9-12 สำหรับบุคลากรภายใน | published | internal | 9–12 |
| 2 | แบบประเมิน 360 องศา สำหรับกลุ่มผู้บริหารระดับ 9-12 สำหรับบุคลากรภายนอก | published | external | 9–12 |
| 3 | แบบประเมิน 360 องศา สำหรับพนักงานระดับ 5-8 สำหรับพนักงาน | published | internal | 5–8 |
| 4 | แบบประเมิน 360 องศา สำหรับประเมินตนเองระดับ 9-12 | published | internal | 9–12 |
| 5 | แบบประเมิน 360 องศา สำหรับประเมินตนเองระดับ 5-8 | published | internal | 5–8 |
| 14 | แบบประเมินความพึงพอใจ | **draft** | internal | 5–12 |

---

### ตาราง `parts` (ส่วนของแบบประเมิน)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสส่วน |
| evaluation_id | bigint UNSIGNED | NO | FK | | FK → evaluations.id CASCADE |
| title | varchar(255) | NO | | | ชื่อส่วน |
| order | tinyint UNSIGNED | NO | | | ลำดับการแสดงผล |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**ข้อมูลในระบบ (Parts แยกตาม Evaluation):**

| eval_id | part_id | ชื่อส่วน | order |
|---|---|---|---|
| 1 | 1 | ส่วนที่ 1 การประเมินตามเกณฑ์การประเมิน 360 องศา | 1 |
| 1 | 2 | ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร | 2 |
| 2 | 4 | ส่วนที่ 1 แบบประเมิน 360 องศา ผู้บริหาร 9-12 ภายนอก | 1 |
| 2 | 5 | ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร | 2 |
| 3 | 7 | ส่วนที่ 1 ข้อมูลหลักเกณฑ์การประเมินตามค่านิยม กนอ. | 1 |
| 3 | 8 | ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร | 2 |
| 4 | 10 | ส่วนที่ 1 การประเมินตามเกณฑ์ 360 องศา | 1 |
| 4 | 11 | ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร | 2 |
| 4 | 12 | ส่วนที่ 3 ประเด็นคำถามปลายเปิด | 3 |
| 5 | 63 | ส่วนที่ 1 ข้อมูลหลักเกณฑ์ตามค่านิยม กนอ. | 1 |
| 5 | 64 | ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร | 2 |
| 5 | 65 | ส่วนที่ 3 ความคิดเห็นและข้อเสนอแนะ | 3 |
| 14 | 66–68 | ส่วนที่ 1–3 | 1–3 |

---

### ตาราง `aspects` (ด้านการประเมิน)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสด้าน |
| part_id | bigint UNSIGNED | NO | FK | | FK → parts.id CASCADE |
| name | varchar(255) | NO | | | ชื่อด้าน |
| has_subaspects | tinyint(1) | NO | | 0 | มีด้านย่อยหรือไม่ (bool) |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**ข้อมูลในระบบ (Aspects แยกตาม Part):**

**สำหรับผู้บริหาร eval 1 (part 1 — ด้านการประเมิน 360):**

| id | ชื่อด้าน |
|---|---|
| 1 | ด้านความเป็นผู้นำ (Leadership) |
| 2 | ด้านการมีวิสัยทัศน์ (Vision) |
| 3 | ด้านการติดต่อสื่อสาร (Communication) |
| 4 | ด้านความสามารถในการคิดและนวัตกรรม (Thinking and Innovation) |
| 5 | ด้านจริยธรรมในการปฏิบัติงาน (Ethics) |
| 6 | ด้านทักษะระหว่างบุคคลและความร่วมมือ (Interpersonal Skills and Collaboration) |

**สำหรับผู้บริหาร eval 1 (part 2 — วัฒนธรรมองค์กร):**

| id | ชื่อด้าน |
|---|---|
| 10 | 2.1 การยอมรับพฤติกรรมตามค่านิยม I-EA-T for Sustainability |
| 58 | 2.2 การแสดงพฤติกรรมตามค่านิยม I-EA-T for Sustainability |

**สำหรับพนักงาน eval 3 (part 7 — ค่านิยม กนอ.):**

| id | ชื่อด้าน |
|---|---|
| 46 | ด้านเก่งคิด (Intelligence Quotient: IQ) |
| 47 | ด้านเก่งคน (Emotional Quotient: EQ) |
| 48 | ด้านเก่งงาน (Adversity Quotient: AQ และ Technology Quotient: TQ) |
| 49 | ด้านการปฏิบัติงานบนฐานความยั่งยืน (Sustainability) |

**สำหรับ Self-eval ผู้บริหาร eval 4 (part 11 — วัฒนธรรมองค์กร):**

| id | ชื่อด้าน |
|---|---|
| 66 | 2.1 การรับรู้ค่านิยม I-EA-T for Sustainability |
| 67 | 2.2 ความเข้าใจค่านิยม I-EA-T for Sustainability |
| 68 | 2.3 ความเข้าใจเกี่ยวกับพฤติกรรมพึงประสงค์ของค่านิยม |
| 90 | ประเด็นคำถามปลายเปิด (part 12) |

---

### ตาราง `sub_aspects` (ด้านย่อย)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสด้านย่อย |
| aspect_id | bigint UNSIGNED | NO | FK | | FK → aspects.id CASCADE |
| name | varchar(255) | NO | | | ชื่อด้านย่อย |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

> **หมายเหตุ**: ปัจจุบัน `has_subaspects = 0` ทุก aspect — ยังไม่ได้ใช้งาน sub_aspects ในข้อมูลจริง

---

### ตาราง `questions`

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสคำถาม |
| part_id | bigint UNSIGNED | NO | FK | | FK → parts.id CASCADE |
| aspect_id | bigint UNSIGNED | YES | FK | NULL | FK → aspects.id CASCADE (optional) |
| sub_aspect_id | bigint UNSIGNED | YES | FK | NULL | FK → sub_aspects.id CASCADE (optional) |
| title | varchar(255) | NO | | | ข้อความคำถาม |
| type | enum | NO | | | ประเภทคำถาม |
| order | tinyint UNSIGNED | NO | | 1 | ลำดับการแสดงผล |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**Enum `type`:**

| ค่า | คำอธิบาย | รูปแบบคำตอบ |
|---|---|---|
| `rating` | คะแนน 1–5 | ตัวเลข string "1"–"5" |
| `open_text` | ตอบอิสระ | ข้อความภาษาไทย |
| `choice` | เลือกตอบข้อเดียว | option_id string เช่น "4889" |
| `multiple_choice` | เลือกได้หลายข้อ | JSON array เช่น "[4898,4896]" |

**สรุปจำนวนคำถามในระบบ:**

| eval_id | ประเภทคำถาม | จำนวน |
|---|---|---|
| 1, 4 | rating (ผู้บริหาร) | 25 ข้อ/ส่วน 1 + culture ส่วน 2 |
| 2 | rating (ภายนอก) | 18 ข้อ |
| 3, 5 | rating (พนักงาน) | 13 ข้อ/ส่วน 1 |
| 4, 5 | choice + multiple_choice | 4 ข้อ (ความรู้ค่านิยม) |
| 4, 5 | open_text | 1 ข้อ (ปลายเปิด) |

---

### ตาราง `options` (ตัวเลือกคำตอบ)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสตัวเลือก |
| question_id | bigint UNSIGNED | NO | FK | | FK → questions.id CASCADE |
| label | varchar(255) | NO | | | ข้อความตัวเลือก |
| score | int | YES | | NULL | คะแนนของตัวเลือกนี้ |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**รูปแบบ Options สำหรับคำถาม rating:**
- label: "5", score: 5
- label: "4", score: 4
- label: "3", score: 3
- label: "2", score: 2
- label: "1", score: 1

**รูปแบบ Options สำหรับ choice/multiple_choice:**
- label: ข้อความเนื้อหาค่านิยม, score: NULL (หรือ 1 = ถูก)

---

## กลุ่มที่ 3: กระบวนการประเมิน

### ตาราง `evaluation_assignments`

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัส assignment |
| evaluation_id | bigint UNSIGNED | NO | FK | | FK → evaluations.id CASCADE |
| evaluator_id | bigint UNSIGNED | NO | FK | | FK → users.id CASCADE (ผู้ประเมิน) |
| evaluatee_id | bigint UNSIGNED | NO | FK | | FK → users.id CASCADE (ผู้ถูกประเมิน) |
| fiscal_year | varchar(255) | NO | | | ปีงบประมาณ เช่น "2025" |
| angle | enum | NO | | | ทิศทางการประเมิน |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**Enum `angle`:**

| ค่า | ความหมาย |
|---|---|
| `top` | ผู้บังคับบัญชาประเมินผู้ใต้บังคับบัญชา (Top-down) |
| `bottom` | ผู้ใต้บังคับบัญชาประเมินผู้บังคับบัญชา (Bottom-up) |
| `left` | เพื่อนร่วมงาน/ระดับเดียวกัน (Peer) |
| `right` | Cross-functional evaluation |
| *(self)* | `evaluator_id = evaluatee_id` = ประเมินตนเอง |

> **หมายเหตุ**: Self-evaluation ไม่มี angle ใน assignments — ระบบตรวจสอบผ่าน `evaluator_id = evaluatee_id`

---

### ตาราง `answers` (คำตอบการประเมิน)

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัสคำตอบ |
| evaluation_id | bigint UNSIGNED | NO | FK | | FK → evaluations.id CASCADE |
| question_id | bigint UNSIGNED | NO | FK | | FK → questions.id CASCADE |
| user_id | bigint UNSIGNED | NO | FK | | FK → users.id CASCADE (ผู้ตอบ) |
| evaluatee_id | bigint UNSIGNED | NO | FK | | FK → users.id CASCADE (ผู้ถูกประเมิน) |
| value | text | YES | | NULL | คำตอบ (หลายรูปแบบ) |
| other_text | text | YES | | NULL | ข้อความเพิ่มเติม/ปลายเปิด |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**UNIQUE Constraint:** `(evaluation_id, user_id, evaluatee_id, question_id)` — ป้องกันตอบซ้ำ

**รูปแบบของ `value`:**

| ประเภทคำถาม | รูปแบบ value | ตัวอย่าง |
|---|---|---|
| rating | ตัวเลขเป็น string | `"4"` |
| open_text | ข้อความภาษาไทย | `"เมื่องานมีปัญหา สามารถคิดวิเคราะห์..."` |
| choice | option_id เป็น string | `"4889"` |
| multiple_choice | JSON array ของ option_ids | `"[4898,4896]"` |

---

### ตาราง `satisfaction_evaluations`

| คอลัมน์ | ประเภท | Null | Key | Default | คำอธิบาย |
|---|---|---|---|---|---|
| id | bigint UNSIGNED | NO | PRI | AUTO_INCREMENT | รหัส |
| user_id | bigint UNSIGNED | NO | FK | | FK → users.id CASCADE |
| evaluation_id | bigint UNSIGNED | NO | FK | | FK → evaluations.id CASCADE |
| fiscal_year | varchar(4) | NO | | | ปีงบประมาณ |
| question_1 | tinyint | NO | | | ความพึงพอใจต่อการใช้งานระบบ (1–5) |
| question_2 | tinyint | NO | | | ความง่ายในการใช้งาน (1–5) |
| question_3 | tinyint | NO | | | ความเร็วในการตอบสนอง (1–5) |
| question_4 | tinyint | NO | | | ความถูกต้องของข้อมูล (1–5) |
| question_5 | tinyint | NO | | | ความสะดวกในการเข้าถึง (1–5) |
| question_6 | tinyint | NO | | | ความครบถ้วนของข้อมูล (1–5) |
| question_7 | tinyint | NO | | | ความเหมาะสมของเนื้อหา (1–5) |
| question_8 | tinyint | NO | | | ความพึงพอใจโดยรวม (1–5) |
| additional_comments | text | YES | | NULL | ข้อเสนอแนะเพิ่มเติม |
| created_at | timestamp | YES | | NULL | วันที่สร้าง |
| updated_at | timestamp | YES | | NULL | วันที่แก้ไข |

**UNIQUE Constraint:** `(user_id, evaluation_id, fiscal_year)`
**Index:** `(fiscal_year, evaluation_id)`

---

## กลุ่มที่ 4: ตาราง Laravel Framework

### ตาราง `sessions`

| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| id | varchar(255) PK | Session ID |
| user_id | bigint UNSIGNED | FK → users (nullable) |
| ip_address | varchar(45) | IPv4/IPv6 |
| user_agent | text | Browser info |
| payload | longtext | Session data |
| last_activity | int (INDEX) | Unix timestamp |

### ตาราง `cache` / `cache_locks`

| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| key | varchar(255) PK | Cache key |
| value | mediumtext | Cached data |
| expiration | int | Unix timestamp |

### ตาราง `jobs` / `failed_jobs`

| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| id | bigint UNSIGNED PK | Job ID |
| queue | varchar(255) INDEX | Queue name |
| payload | longtext | Job data |
| attempts | tinyint UNSIGNED | Retry count |
| failed_at | timestamp | (failed_jobs only) |

### ตาราง `password_reset_tokens`

| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| email | varchar(255) PK | Email address |
| token | varchar(255) | Reset token |
| created_at | timestamp | สร้างเมื่อ |

### ตาราง `personal_access_tokens` (Sanctum)

| คอลัมน์ | ประเภท | คำอธิบาย |
|---|---|---|
| id | bigint UNSIGNED PK | Token ID |
| tokenable_type | varchar(255) | Model type |
| tokenable_id | bigint UNSIGNED | Model ID |
| name | varchar(255) | Token name |
| token | varchar(64) UNIQUE | Hashed token |
| abilities | text | Permissions |
| last_used_at | timestamp | ใช้ล่าสุดเมื่อ |
| expires_at | timestamp | หมดอายุเมื่อ |

---

## สรุป Cascading Delete Rules

```
divisions
  └─(CASCADE)→ departments
       └─(CASCADE)→ positions
                        └─(CASCADE)→ users (position_id)
users
  └─(CASCADE)→ evaluation_assignments (evaluator_id / evaluatee_id)
  └─(CASCADE)→ answers (user_id / evaluatee_id)
  └─(CASCADE)→ satisfaction_evaluations

evaluations
  └─(CASCADE)→ parts
       └─(CASCADE)→ aspects
            └─(CASCADE)→ sub_aspects
       └─(CASCADE)→ questions
            └─(CASCADE)→ options
  └─(CASCADE)→ evaluation_assignments
  └─(CASCADE)→ answers
  └─(CASCADE)→ satisfaction_evaluations
```
