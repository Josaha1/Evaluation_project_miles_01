# Frontend Pages (React + Inertia.js)

## โครงสร้าง Pages

```
resources/js/pages/
├── Welcome.tsx                          ← หน้าแรก (guest)
├── Login.tsx                            ← หน้า Login
├── CookiePolicy.tsx                     ← นโยบาย Cookie

├── Dashboard.tsx                        ← User Dashboard
├── ProfileEditPage.tsx                  ← แก้ไขโปรไฟล์

├── SelfEvaluationStep.tsx               ← ทำแบบประเมินตนเอง
├── AssignedEvaluationStep.tsx           ← ทำแบบประเมินคนอื่น
├── EvaluationShow.tsx                   ← ดูผลการประเมิน

├── SatisfactionEvaluation.tsx           ← แบบสอบถามความพึงพอใจ
├── SatisfactionEvaluationResults.tsx    ← ผลแบบสอบถามความพึงพอใจ

├── Admindashboard.tsx                   ← Admin Dashboard
├── AdminEvaluationManager.tsx           ← จัดการแบบประเมิน
├── AdminEvaluationCreate.tsx            ← สร้างแบบประเมิน
├── AdminEvaluationEdit.tsx              ← แก้ไขแบบประเมิน
├── AdminEvaluationPreview.tsx           ← Preview แบบประเมิน
├── AdminEvaluationReport.tsx            ← รายงาน 360 องศา
├── AdminEvaluationAssignmentManager.tsx ← จัดการ Assignments
├── AdminEvaluationAssignmentForm.tsx    ← ฟอร์ม Assignment
├── AdminUserManager.tsx                 ← จัดการ Users
├── AdminUserForm.tsx                    ← ฟอร์ม User

├── AdminDivisionIndex.tsx               ← จัดการสายงาน (Division)
├── AdminDivisionForm.tsx               ← ฟอร์มสายงาน
├── AdminDepartmentIndex.tsx            ← จัดการหน่วยงาน (Department)
├── AdminDepartmentForm.tsx             ← ฟอร์มหน่วยงาน
├── AdminPositionIndex.tsx              ← จัดการตำแหน่ง (Position)
├── AdminPositionForm.tsx               ← ฟอร์มตำแหน่ง
├── AdminFactionIndex.tsx               ← จัดการฝ่าย (Faction)
├── AdminFactionForm.tsx                ← ฟอร์มฝ่าย
│
├── AdminSectionIndex.tsx                ← จัดการ Parts/Sections
├── AdminPartIndex.tsx / AdminPartCreate.tsx / AdminPartEdit.tsx
├── AdminAspectIndex.tsx / AdminAspectCreate.tsx / AdminAspectEdit.tsx
├── AdminSubAspectIndex.tsx / AdminSubAspectCreate.tsx / AdminSubAspectEdit.tsx
└── AdminQuestionIndex.tsx / AdminQuestionCreate.tsx / AdminQuestionEdit.tsx
```

---

## Layout Component

### `MainLayout.tsx`
- Navigation bar
- Sidebar (Admin)
- Footer
- Auth check

---

## หน้าสำคัญ — รายละเอียด

### `Dashboard.tsx` (User)

**ข้อมูลที่แสดง:**
- รายชื่อผู้ที่ต้องประเมิน (assigned evaluatees)
- สถานะการทำแบบประเมินตนเอง (self evaluation status)
- Progress ของแต่ละ evaluation
- ปุ่ม "เริ่มประเมิน" / "ทำต่อ"

**Props จาก Controller:**
```typescript
{
    assignments: EvaluationAssignment[],
    selfEvaluationStatus: {
        evaluation_id: number,
        completed: boolean,
        progress: number
    },
    user: User
}
```

---

### `SelfEvaluationStep.tsx`

**การทำงาน:**
- แสดงทีละ Part (multi-step form)
- แต่ละ step = 1 aspect หรือ 1 part
- Progress indicator แสดง % ความคืบหน้า
- Auto-save ทุกครั้งที่ตอบคำถาม

**Component ย่อย:**
- `QuestionCard.tsx` — แสดงแต่ละคำถาม
- `ProgressIndicator.tsx` — แถบความคืบหน้า

**ประเภทคำถามที่รองรับ:**
```typescript
// Rating (1-5 stars/radio)
<RatingInput value={1-5} />

// Choice (single select radio)
<ChoiceInput options={options[]} />

// Multiple Choice (checkbox)
<MultipleChoiceInput options={options[]} />

// Open Text (textarea)
<OpenTextInput />
```

---

### `AssignedEvaluationStep.tsx`

**คล้าย SelfEvaluationStep แต่:**
- มี evaluatee info แสดงชื่อ-ตำแหน่งของผู้ถูกประเมิน
- บางคำถามมี context เพิ่มเติม

---

### `AdminEvaluationReport.tsx`

**4 Views:**

```
Dashboard View
├── KPI Cards: จำนวนผู้เข้าร่วม, completion rate, คะแนนเฉลี่ย
├── Chart: Completion by Division (Bar chart)
├── Chart: Score Distribution (Radar/Bar)
└── Table: Top Evaluatees

Analytics View
├── Detailed charts
├── Score breakdown by aspect
└── Comparison across divisions

Reports View
├── Table: รายชื่อ evaluatees + scores
├── Filter: division, grade, status
└── Click → Modal รายละเอียดรายบุคคล

Exports View
├── Export Type Selection (5 types)
├── Format Selection (Excel/PDF/CSV)
├── Filter Options
└── Export Button
```

---

## Component ย่อยที่ใช้ร่วมกัน

### `QuestionCard.tsx`
- แสดงคำถาม 1 ข้อพร้อมตัวเลือก
- รองรับทุก question type

### `ProgressIndicator.tsx`
- แถบ progress (%)
- แสดง step ปัจจุบัน / ทั้งหมด

### `ChartSection.tsx`
- Recharts wrapper
- Bar chart, Radar chart, Line chart

### `AspectTables.tsx`
- ตารางแสดงคะแนนแยกตาม aspect
- ใช้ในหน้า Report

### `WeightedTables.tsx`
- ตารางคะแนนแบบ Weighted
- แสดง weight ต่อ angle

### `EvaluatorSummaryTable.tsx`
- สรุปรายชื่อ evaluators ที่ตอบแล้ว/ยังไม่ตอบ

---

## การส่งข้อมูลระหว่าง Controller → React (Inertia.js)

```php
// Controller
return Inertia::render('Dashboard', [
    'assignments' => $assignments,
    'user' => $user,
]);

// React Page
export default function Dashboard({ assignments, user }: Props) {
    // ใช้ข้อมูลได้ทันที
}
```

---

## การส่งข้อมูลกลับ React → Controller

```typescript
// ใช้ Inertia.js router
import { router } from '@inertiajs/react';

// POST
router.post('/evaluations/self/save-answer', {
    evaluation_id: 4,
    question_id: 515,
    value: '4',
});

// AJAX / Fetch (สำหรับ API endpoints)
const response = await fetch('/admin/reports/evaluation/api/dashboard-data');
const data = await response.json();
```
