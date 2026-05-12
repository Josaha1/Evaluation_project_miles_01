# Stakeholder Cross-Group Consolidation

> Updated 2026-05-05

## Problem

จาก audit ไฟล์ Excel จริง 9 ไฟล์ × 164 sheets × 515 distinct บริษัท พบว่า **34 บริษัท (~6.6%) อยู่ข้ามกลุ่ม**:
บริษัทเดียวอาจถูก list ใน "คู่ค้า" + "คู่ความร่วมมือ" + "ผู้ส่งมอบ" → ได้ QR ต่างกัน 2-3 ใบ → ใช้ผิด/ลืมใช้ครบ → ประเมินไม่ครบ

ตัวอย่าง:
- บริษัท GUSCO (โกลบอล ยูทิลิตี้) อยู่ **4 กลุ่ม**: คู่ค้า + คู่ความร่วมมือ + คู่ค้าหรือคู่ความร่วมมือ + ผู้ส่งมอบ — รวม 5 evaluatees กระจาย 4 codes
- บริษัท GEM อยู่ 3 กลุ่ม
- บริษัท เทคนิคสิ่งแวดล้อมไทย อยู่ 2 กลุ่ม รวม 12 evaluatees

## Solution: 1 บริษัท = 1 session ครอบทุกกลุ่ม

ตอน stakeholder login → ค้น/เลือกบริษัทตัวเอง → backend หา codes อื่นๆ ของบริษัทเดียวกันใน fy เดียวกัน → merge ผู้ถูกประเมินทั้งหมดเข้า dashboard เดียว ไม่ว่าจะ scan QR กลุ่มไหนก็เห็นครบ

## Login UX (3 steps)

### Step 1 — กรอก code
`GET /external/login?code=XXX-XXX-XXX` → user กรอก / prefill จาก URL → กด "ยืนยัน"

### Step 2 — ค้น/เลือกชื่อบริษัท
`POST /external/verify` → return JSON ของ stakeholders ใน code นั้น (deduped ด้วย `normalizeName`)
User search → click pick

### Step 2.5 — Confirmation
แสดง:
- ชื่อบริษัท
- กลุ่มทั้งหมดที่บริษัทนี้อยู่ (badges)
- จำนวนผู้ถูกประเมิน N คน + รายชื่อพร้อม source_group tag
- ปุ่ม "← เปลี่ยน" / "✓ ใช่ เริ่มประเมิน"

### Step 3 — Submit
`POST /external/login` → backend create session + เก็บ `related_code_ids[]` + `picked_org_name` ใน Laravel session → redirect dashboard

## Backend logic

### `verify()` — ส่ง preview ไปให้ frontend
ที่: `app/Http/Controllers/ExternalEvaluatorController.php:31-153`

```
fetch stakeholders ของ code นี้
groupBy normalizeName(organization_name) → list ของ unique orgs
แต่ละ org: query stakeholder ของชื่อเดียวกันใน fy ทุก code → preview_evaluatees (deduped) + related_code_ids + related_groups
```

### `login()` — เก็บ session state
ที่: `ExternalEvaluatorController.php:158-318`

```
ถ้า user เลือก stakeholder_id:
  related_code_ids = [codes ของบริษัทเดียวกันใน fy]
  picked_org_name = ชื่อที่ user เห็น/เลือก
  session.put(['related_code_ids', 'picked_org_name'])
  เลือก starting evaluatee + access_code ที่ pair ตรง (อันแรกที่ยังไม่ submit)
```

### `showDashboard()` — รวมข้ามกลุ่ม
ที่: `ExternalEvaluatorController.php:432-535`

```
related_code_ids = session.get(...)
pivot WHERE access_code_id IN (related_code_ids)
  AND EXISTS (external_stakeholders WHERE org_name match)
→ groupBy(evaluatee_id) → dedup → annotate source_groups[]
```

### `selectEvaluatee()` — สลับ code อัตโนมัติ
ที่: `ExternalEvaluatorController.php:597-646`

เมื่อคลิก evaluatee จาก code คนละตัว → switch session.access_code_id อัตโนมัติ → submit ลง code ที่ถูก

## Frontend

| File | Lines | Note |
|---|---|---|
| `resources/js/Pages/ExternalLogin.tsx` | 564 | 3-step flow + animation |
| `resources/js/Pages/ExternalDashboard.tsx` | 320 | List + source_groups badges + progress |
| `resources/js/Pages/ExternalConfirm.tsx` | 213 | (legacy single-evaluatee confirm — ใช้น้อย) |

## Tests

`tests/Feature/ExternalEvaluatorFlowTest.php`:
- it verify endpoint returns code info with evaluatees + deduped stakeholders
- it merges evaluatees across codes when stakeholder appears in multiple groups
- it verify exposes cross-group preview for picked stakeholder
- it login picks evaluatee from picked stakeholder and redirects to dashboard
- it login links picked stakeholder row to session for that evaluatee
- it verify rejects unknown codes
- it login without stakeholder_id starts with first evaluatee in pivot

7/7 pass

## Related docs

- `docs/stakeholder-org-name-normalization.md` — ทำไม whitespace ต่างกันต้อง dedup ให้รวมเป็น entry เดียว
- `docs/admin-assignments-bridge.md` — แสดง stakeholder ใน /admin/assignments ผ่าน synthetic right-angle
