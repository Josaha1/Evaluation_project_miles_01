# กระบวนการประเมิน (Evaluation Flow)

## ภาพรวม 5 ขั้นตอนหลัก

```
┌──────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐
│  SETUP   │───▶│ ASSIGNMENT │───▶│ EVALUATION │───▶│  REPORT  │───▶│SATISFACT.│
└──────────┘    └────────────┘    └────────────┘    └──────────┘    └──────────┘
```

---

## ขั้นตอนที่ 1: SETUP — การตั้งค่าระบบ (Admin)

### 1.1 สร้างโครงสร้างองค์กร
```
Admin สร้าง:
  divisions (สายงาน) → departments (หน่วยงาน) → positions (ตำแหน่ง)
  factions (ฝ่าย)
```

### 1.2 สร้างผู้ใช้งาน
```
Admin → /admin/users/create
  กรอก: emid, prename, fname, lname, sex
        division, department, position, faction
        grade (4-12), birthdate, role, user_type
```

### 1.3 ออกแบบแบบประเมิน
```
Admin → /evaluations/create
  สร้าง Evaluation → สร้าง Parts → สร้าง Aspects → สร้าง Questions → สร้าง Options
  Publish เมื่อพร้อม
```

---

## ขั้นตอนที่ 2: ASSIGNMENT — การมอบหมาย (Admin)

### 2.1 สร้าง Evaluation Assignments

Admin กำหนดว่า "ใครประเมินใคร ด้วยแบบประเมินอะไร ในมุมมองไหน":

```sql
INSERT INTO evaluation_assignments
  (evaluation_id, evaluator_id, evaluatee_id, fiscal_year, angle)
VALUES
  (1, 411, 412, '2025', 'bottom'),  -- 411 ประเมิน 412 จากมุม bottom
  (1, 413, 412, '2025', 'left'),    -- 413 ประเมิน 412 จากมุม left
  (4, 412, 412, '2025', NULL)       -- 412 ประเมินตนเอง
```

### 2.2 Matrix การ Assignment ตามระดับ

| ผู้ถูกประเมิน | แบบประเมิน | ผู้ประเมิน | angle |
|---|---|---|---|
| ผู้บริหาร 9-12 | eval 1 | ผู้ใต้บังคับบัญชา | bottom |
| ผู้บริหาร 9-12 | eval 1 | เพื่อนร่วมงาน | left / right |
| ผู้บริหาร 9-12 | eval 2 | บุคลากรภายนอก | - |
| ผู้บริหาร 9-12 | eval 4 | ตนเอง | (self) |
| พนักงาน 5-8 | eval 3 | ผู้บังคับบัญชา | top |
| พนักงาน 5-8 | eval 3 | เพื่อนร่วมงาน | left / right |
| พนักงาน 5-8 | eval 5 | ตนเอง | (self) |

---

## ขั้นตอนที่ 3: EVALUATION — การทำแบบประเมิน (User)

### 3.1 Self Evaluation Flow

```
User → /evaluations/self
  └── SelfEvaluationController@index
       ├── ตรวจสอบ: มี assignment (self) ไหม?
       ├── ตรวจสอบ: ยังไม่ได้ submit?
       └── Redirect → Step 1

→ POST /evaluations/self/questions/{step}
  └── SelfEvaluationController@step
       ├── validate คำตอบ
       ├── upsert ลง answers table
       │    (evaluation_id, question_id, user_id, evaluatee_id=user_id, value)
       └── redirect → step ถัดไป / หน้า review

→ POST /evaluations/self/submit
  └── บันทึก submit timestamp / mark complete
```

### 3.2 Assigned Evaluation Flow

```
User → /dashboard
  └── เห็นรายชื่อที่ต้องประเมิน (evaluatees)

→ GET /assigned-evaluations/{evaluateeId}
  └── AssignedEvaluationController@show
       ├── ดึง assignments ของ evaluatee นี้
       └── แสดง evaluation form

→ POST /assigned-evaluations/{evaluatee}/step/{step}
  └── AssignedEvaluationController@step
       ├── validate คำตอบ
       ├── upsert ลง answers table
       │    (evaluation_id, question_id, user_id=evaluator, evaluatee_id, value)
       └── redirect → step ถัดไป
```

### 3.3 การบันทึกคำตอบ (Upsert Logic)

```php
// Unique constraint ป้องกัน duplicate
Answer::updateOrCreate(
    [
        'evaluation_id' => $evaluationId,
        'question_id'   => $questionId,
        'user_id'       => $userId,
        'evaluatee_id'  => $evaluateeId,
    ],
    [
        'value'      => $value,
        'other_text' => $otherText,
    ]
);
```

### 3.4 รูปแบบ value ตามประเภทคำถาม

```
rating          → "1" | "2" | "3" | "4" | "5"
choice          → "{option_id}"        เช่น "4889"
multiple_choice → "[{id1},{id2},...]"  เช่น "[4898,4896]"
open_text       → "{text}"            เช่น "สามารถคิดวิเคราะห์สาเหตุ..."
```

---

## ขั้นตอนที่ 4: REPORT — รายงาน (Admin)

### 4.1 Dashboard Overview

```
GET /admin/reports/evaluation
└── AdminEvaluationReportController@index
     └── AdminEvaluationReport.tsx
          ├── ภาพรวมสถิติ (completion rates)
          ├── กราฟ (Recharts)
          ├── ตาราง Evaluatees
          └── Export Panel
```

### 4.2 Export Types (5 ประเภท)

| ประเภท | Endpoint | คำอธิบาย |
|---|---|---|
| Comprehensive | `export/comprehensive` | รวมทุกกลุ่ม (9-12 + 5-8) |
| Executives | `export/executives` | ผู้บริหาร 9-12 เท่านั้น |
| Employees | `export/employees` | พนักงาน 5-8 เท่านั้น |
| Self-evaluation | `export/self-evaluation` | การประเมินตนเอง |
| Detailed Data | `export/detailed-data` | ทุกคำถาม ทุกคน |

### 4.3 Score Calculation Logic

```
Rating Score = ค่า value ที่ User เลือก (1-5)

Average per Aspect = ผลรวม rating / จำนวน evaluators
Average per Part   = ผลรวม aspect averages / จำนวน aspects
Weighted Score     = Σ (angle_weight × angle_average)
```

### 4.4 Weighted Scoring ตาม Angle

```
ตัวอย่าง Weight configuration:
  top    = 0.30 (30%)
  bottom = 0.20 (20%)
  left   = 0.25 (25%)
  right  = 0.25 (25%)
```

---

## ขั้นตอนที่ 5: SATISFACTION — แบบสอบถามระบบ (User)

```
User → /satisfaction-evaluation/{evaluationId}
└── SatisfactionEvaluationController@show
     └── SatisfactionEvaluation.tsx
          ├── 8 คำถาม (scale 1-5)
          └── ช่อง additional_comments

→ POST /satisfaction-evaluation/{evaluationId}
└── บันทึกลง satisfaction_evaluations
     UNIQUE: (user_id, evaluation_id, fiscal_year) — ป้องกันตอบซ้ำ
```

---

## การตรวจสอบสถานะการประเมิน

### ตรวจสอบว่า User ทำแบบประเมินครบหรือยัง

```sql
-- ตรวจสอบจำนวนคำตอบที่ User ให้สำหรับ evaluatee คนหนึ่ง
SELECT COUNT(DISTINCT question_id) as answered
FROM answers
WHERE evaluation_id = ?
  AND user_id = ?
  AND evaluatee_id = ?

-- เทียบกับจำนวนคำถามทั้งหมดของ evaluation
SELECT COUNT(*) as total
FROM questions
WHERE part_id IN (SELECT id FROM parts WHERE evaluation_id = ?)
```

### Progress Indicator
- แสดง percentage ความคืบหน้าในแต่ละ part
- เช็คจากจำนวน answers vs จำนวน questions ทั้งหมด

---

## Edge Cases ที่ต้องระวัง

### 1. Self-evaluation Detection
```php
// Self = evaluator_id === evaluatee_id
// ไม่มี angle ใน evaluation_assignments
if ($assignment->evaluator_id === $assignment->evaluatee_id) {
    // Self evaluation
}
```

### 2. Cross-angle Evaluation
- User หนึ่งคนอาจมีหลาย assignments กับ evaluatee เดียวกัน
- ต้องระบุ angle เพื่อดึงข้อมูลที่ถูกต้อง

### 3. External Users (eval_id=2)
- `user_type = 'external'`
- มีเฉพาะ evaluation_id=2 เท่านั้น
- Login ด้วย emid เหมือนกัน

### 4. Duplicate Prevention
- answers table มี UNIQUE constraint
- การตอบซ้ำจะใช้ `updateOrCreate` (upsert)
- satisfaction_evaluations ก็มี UNIQUE constraint เช่นกัน
