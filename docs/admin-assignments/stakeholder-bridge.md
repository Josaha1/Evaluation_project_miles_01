# Admin Assignments — Stakeholder Bridge

> Updated 2026-05-05

## Problem

`/admin/assignments` page อ่านจาก `evaluation_assignments` table → ไม่เห็น stakeholder ภายนอก เพราะ `StakeholderImportService` **ไม่สร้าง** EvaluationAssignment rows (`evaluator_id` is NOT NULL FK และ stakeholder ไม่มี user_id)

ผลที่ user เห็น: หน้า /admin/assignments ขาดข้อมูล "องศาขวา" จาก stakeholder pairing

## Solution: synthetic right-angle bridge

ที่ controller index() — load assignments ปกติ แล้ว **append synthetic rows** จาก `external_stakeholders` ก่อนส่ง render

ที่: `app/Http/Controllers/AdminEvaluationAssignmentController.php`
- `index()` (line 18-105) — fetch + concat
- `getStakeholderRightAngleAssignments()` (line ~1755) — synthesize

## Synthetic structure (ตรงรูป serialized EvaluationAssignment)

```php
[
    'id'             => 1_000_000_000 + stakeholder.id,  // กัน collision กับ assignments.id
    'angle'          => 'right',
    'fiscal_year'    => stakeholder.fiscal_year,
    'created_at'     => stakeholder.created_at,
    'evaluator_id'   => null,
    'evaluator'      => [
        'id'         => null,
        'fname'      => '(ภายนอก)',
        'lname'      => stakeholder.organization_name,
        'user_type'  => 'external_org',
        'position'   => ['title' => stakeholder.contact_person ?? ''],
        'department' => ['name' => stakeholder.sub_group ?? ''],
        // ...
    ],
    'evaluatee_id'   => stakeholder.evaluatee_id,
    'evaluatee'      => [...],  // real User shape
    'is_external_stakeholder' => true,
    'stakeholder_org_name'    => organization_name,
]
```

## Frontend impact

`resources/js/Pages/AdminEvaluationAssignmentManager.tsx` group ตาม `evaluatee.id` → angle → จะเห็น synthetic right-angle ใน column "ขวา" ของแต่ละ evaluatee card

ไม่ต้องแก้ frontend — payload shape เดิมๆ จะ render ได้เลย เพราะ synthetic ถูกสร้างให้เหมือน serialized EvaluationAssignment

## "see more" cell

หน้า Excel mode บางเซลล์มี evaluators เยอะ → ต้องเลื่อน → เพิ่ม `EvaluatorListCell` component:
- แสดง 5 รายการแรก
- ถ้ามี > 5 → ปุ่ม `▼ ดูเพิ่ม (+N)` → expand ทั้งหมด → กดอีกครั้งเป็น `▲ ย่อ`
- Per-cell state — ขยาย cell หนึ่งไม่กระทบ cell อื่น

## Limitations

- Search/filter ที่ frontend ไม่ scope stakeholder rows (ใช้ search ของ assignments ปกติ) — ปกติพอ
- `card_data` (per-evaluator group) ไม่ได้รวม stakeholder — frontend ใช้ evaluatee-centric อยู่แล้ว เลยไม่กระทบ
- "is_external_stakeholder" flag ใช้ใน export evaluator-pivot เพื่อ highlight แถวสีน้ำตาลอ่อน

## Why bridge approach (vs creating users + assignments)

ตัวเลือกที่พิจารณา:
- **A** Bridge in controller (เลือก) — UI-only, ไม่กระทบ schema/import flow, ปลอดภัย
- **B** Make import create User + Assignment — ต้องสร้าง User สำหรับ stakeholder (no email, no login) → ปนเปื้อน users table + ส่งผลกับรายงานอื่นที่ join users
- **C** ไม่แสดง — ผิด requirements

A ชนะ: low-risk, idempotent (รันใหม่ render ใหม่), ไม่กระทบ schema
