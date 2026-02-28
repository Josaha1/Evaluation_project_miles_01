# ภาพรวมระบบ — 360-Degree Evaluation System (กนอ.)

## 1. ชื่อและวัตถุประสงค์

**ระบบประเมิน 360 องศา การนิคมอุตสาหกรรมแห่งประเทศไทย (กนอ.)**

ระบบนี้พัฒนาขึ้นเพื่อรองรับกระบวนการประเมินบุคลากรของ กนอ. แบบ 360 องศา (Multi-Rater Feedback) ซึ่งให้บุคลากรได้รับการประเมินจากหลายมุมมอง ทั้งจากผู้บังคับบัญชา ผู้ใต้บังคับบัญชา เพื่อนร่วมงาน และตนเอง รวมถึงบุคลากรภายนอกองค์กร

---

## 2. Stack เทคโนโลยี

| Layer | เทคโนโลยี |
|---|---|
| Backend Framework | Laravel (PHP) |
| Frontend Framework | React + TypeScript (via Inertia.js) |
| UI Library | Tailwind CSS + shadcn/ui |
| Database | MariaDB 10.4 |
| Build Tool | Vite |
| Session | Database-driven sessions |
| Auth | Laravel Session Auth + Sanctum (API) |
| Export | PhpSpreadsheet (Excel), DomPDF (PDF) |
| Charts | Recharts (React) |

---

## 3. โครงสร้าง Application

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/LoginController.php
│   │   ├── HomeController.php
│   │   ├── ProfileController.php
│   │   ├── EvaluationController.php
│   │   ├── EvaluationAssignmentController.php
│   │   ├── SelfEvaluationController.php
│   │   ├── AssignedEvaluationController.php
│   │   ├── SatisfactionEvaluationController.php
│   │   ├── PartController.php
│   │   ├── AspectController.php
│   │   ├── SubAspectController.php
│   │   ├── QuestionController.php
│   │   ├── AdminUserController.php
│   │   ├── AdminEvaluationAssignmentController.php
│   │   └── AdminEvaluationReportController.php
├── Models/
│   ├── User.php
│   ├── Divisions.php / Departments.php / Position.php / Factions.php
│   ├── Evaluation.php / Part.php / Aspect.php / SubAspect.php
│   ├── Question.php / Option.php
│   ├── EvaluationAssignment.php
│   ├── Answer.php / Evaluation_answer.php / Evaluatee.php
│   └── SatisfactionEvaluation.php
└── Services/
    ├── EvaluationExportService.php
    ├── EvaluationPdfExportService.php
    ├── ScoreCalculationService.php
    └── WeightedScoringService.php

resources/js/pages/
├── Login.tsx
├── Dashboard.tsx
├── Admindashboard.tsx
├── AdminEvaluationReport.tsx
├── AdminEvaluationManager.tsx
├── AdminEvaluationAssignmentManager.tsx
├── AdminUserManager.tsx
├── SelfEvaluationStep.tsx
├── AssignedEvaluationStep.tsx
├── SatisfactionEvaluation.tsx
└── ...

database/
├── migrations/         Laravel migration files
├── question/           SQL dumps แยกตาราง
├── fromdb/             Full SQL dump จาก production
└── u917560495_milesconsultdb.csv   Full DB dump (CSV)
```

---

## 4. Role ผู้ใช้งาน

| Role | สิทธิ์ |
|---|---|
| `admin` | จัดการทุกอย่าง: Users, Evaluations, Assignments, Reports, Export |
| `user` | ทำแบบประเมิน (Self + Assigned), ดู Dashboard ส่วนตัว, ทำ Satisfaction Survey |

---

## 5. User Types

| user_type | คำอธิบาย |
|---|---|
| `internal` | บุคลากรภายในองค์กร กนอ. |
| `external` | บุคลากรภายนอก (ใช้ประเมิน eval id=2 เท่านั้น) |

---

## 6. กระบวนการทำงานหลัก (Core Flow)

```
1. SETUP
   Admin สร้างโครงสร้างองค์กร → สร้าง Users → ออกแบบแบบประเมิน

2. ASSIGNMENT
   Admin มอบหมายว่า "ใครประเมินใคร" (evaluation_assignments)
   พร้อมระบุ angle (top/bottom/left/right) และปีงบประมาณ

3. EVALUATION
   User login → เห็น Dashboard → ทำแบบประเมิน Self + Assigned
   คำตอบถูกเก็บใน answers table

4. REPORT
   Admin ดูรายงานสรุป → Export Excel/PDF
   มีระบบ Weighted Scoring และ Option Mapping

5. SATISFACTION
   User ทำแบบสอบถามความพึงพอใจระบบ (8 ข้อ)
```

---

## 7. ปีงบประมาณที่ใช้งาน

- **FY 2568 (2025)**: ปีงบประมาณหลักที่มีข้อมูลในระบบ
- การประเมินเริ่มต้น: กรกฎาคม 2025
- ข้อมูลล่าสุด: สิงหาคม 2025

---

## 8. ค่านิยมองค์กร กนอ. ที่ใช้ในการประเมิน

ค่านิยม **"I-EA-T for Sustainability"**:

| ตัวอักษร | ความหมายภาษาไทย | ความหมายอังกฤษ |
|---|---|---|
| I | เก่งคิด | Intelligence Quotient (IQ) |
| E | เก่งคน | Emotional Quotient (EQ) |
| A | เก่งงาน | Adversity Quotient (AQ) |
| T | เก่งงาน (เทคโนโลยี) | Technology Quotient (TQ) |
| for Sustainability | บนฐานความยั่งยืน | Environmental, Social, Governance |

---

## 9. ระดับพนักงาน (Grade)

| กลุ่ม | ระดับ | แบบประเมินที่เกี่ยวข้อง |
|---|---|---|
| ผู้บริหาร | Grade 9–12 | eval 1 (internal), eval 2 (external), eval 4 (self) |
| พนักงาน | Grade 5–8 | eval 3, eval 5 (self) |
| อื่นๆ | Grade 4 | - |
