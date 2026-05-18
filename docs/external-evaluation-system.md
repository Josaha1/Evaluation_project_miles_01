# ระบบประเมินภายนอก (External Evaluation)

> **Redesign**: 2026-04-27 → 2026-04-28
> ระบบใหม่รองรับ 1 รหัส = 1 องค์กร × หลายคนประเมิน × หลายผู้ถูกประเมิน

## 🎯 Concept

```
   1 Access Code                    Org X
        │
        ├─ ผู้ประเมิน A (กรอกชื่อ "นายสมชาย")  ← session 1
        ├─ ผู้ประเมิน B (กรอกชื่อ "นางสมหญิง") ← session 2
        └─ ผู้ประเมิน C (กรอกชื่อ "นายวินัย")  ← session 3
                    ↓
         ทุกคนเห็น list เดียวกัน
                    ↓
         ┌─ ผู้ถูกประเมิน 1 (ผอ. ABC)
         ├─ ผู้ถูกประเมิน 2 (ผอ. DEF)
         └─ ผู้ถูกประเมิน 3 (ผช.ผวก. XYZ)
```

**1 access code** ที่ admin ส่งให้ org → คนของ org **กี่คนก็ได้** ใช้รหัสเดียวกันเข้ามาประเมิน → ทุกคนทำให้กับ **ผู้ถูกประเมินทุกคน** ที่ admin assign ไว้กับ org นั้น

---

## 🗄 Database Schema

### `external_organizations`
ข้อมูลองค์กรภายนอก (เดิม)

### `external_access_codes` *(เปลี่ยน)*
| Field | Note |
|---|---|
| `id`, `code` (unique), `external_organization_id`, `fiscal_year` | เดิม |
| `evaluatee_id` *(legacy)* | ผู้ถูกประเมิน "ตัวแรก" (default landing) — ใช้ pivot จริง |
| `evaluation_id` *(legacy)* | แบบประเมินตัวแรก |
| `is_used` | **ความหมายเปลี่ยน** = "ระงับด้วยมือ" (ไม่ใช่ "ใช้แล้ว" ตามชื่อ) |
| `use_count` ⭐ | จำนวนครั้งที่มีคน submit (เพิ่ม) |
| `max_uses` ⭐ | null = ไม่จำกัด · ตัวเลข = limit จำนวน sessions |
| `expires_at` | เดิม |

### `external_code_evaluatees` ⭐ *(ตารางใหม่ — pivot)*
1 access code ↔ N evaluatees

| Field | Note |
|---|---|
| `external_access_code_id` | FK → access_codes (cascade) |
| `evaluatee_id` | FK → users |
| `evaluation_id` | FK → evaluations (auto-pick by grade) |
| **unique** | (access_code_id, evaluatee_id) |

### `external_evaluation_sessions` *(เพิ่ม fields)*
1 row = 1 ครั้งที่คนของ org login

| Field | Note |
|---|---|
| `id, external_access_code_id, external_organization_id` | เดิม |
| `evaluatee_id, evaluation_id` | "ปัจจุบันที่กำลังประเมิน" — เปลี่ยนได้ตอน selectEvaluatee |
| `session_token` | ใช้กับ Laravel session |
| `evaluator_name` ⭐ | ชื่อคนที่กรอก (สำคัญ — แยก session) |
| `evaluator_position` ⭐ | ตำแหน่ง (optional) |
| `started_at, completed_at` | เดิม |

### `answers` *(เปลี่ยน unique key)*
| Field | Note |
|---|---|
| เดิม | evaluation_id, user_id, evaluatee_id, question_id, value |
| `external_session_id` ⭐ | FK → sessions, **null สำหรับ internal** |
| **Unique** | (eval, user, evaluatee, question, **external_session_id**) |

> NULL ใน unique = แต่ละ NULL ถือว่า distinct → internal answers ไม่ทับกัน, external สาม session แยกกัน

---

## 🔄 Workflow

### A. Admin สร้าง code (1 batch = 1 code)

```
/admin/access-codes/create
   │
   ├─ Org: เลือก
   ├─ Evaluatees: ติ๊ก 7 คน (เกรด ≥ 9)
   ├─ Fiscal year: 2569 (ค.ศ. 2026)
   └─ Max uses: เว้นว่าง (= ไม่จำกัด)
                      ↓
   ┌────── สร้าง 1 code ──────┐
   │  IEAT-ORG1-A1B2C3        │
   │  org_id: 5               │
   │  evaluatee_id: 411 (1st) │  ← legacy primary
   │  evaluation_id: 36       │
   └──────────────────────────┘
                      ↓
   ┌── Pivot rows (7) ──────────────┐
   │  code 99 ↔ evaluatee 411 (eval 36) │
   │  code 99 ↔ evaluatee 412 (eval 36) │
   │  code 99 ↔ evaluatee 413 (eval 36) │
   │  ...                          │
   └────────────────────────────────┘
```

**ตรวจ pre-validation อัตโนมัติ**: evaluatee ที่ไม่มี external eval form สำหรับ grade+fy → badge แดง "ไม่มีแบบประเมิน" ติ๊กไม่ได้

### B. External user login

```
URL: https://evaluation.milesconsult.com/external/login?code=IEAT-ORG1-A1B2C3

ฟอร์ม:
   - Access code:        IEAT-ORG1-A1B2C3
   - ชื่อ-นามสกุล:        นายสมชาย ใจดี           (required)
   - ตำแหน่ง:           ผู้จัดการฝ่ายการตลาด    (optional)

→ POST /external/login
→ สร้าง session: { evaluator_name, evaluator_position, ... }
→ Redirect → /external/dashboard
```

### C. Dashboard

```
หน้าหลัก
   ┌─ สวัสดี นายสมชาย ใจดี · ผู้จัดการ            ┐
   │  ความคืบหน้า: 0/7                           │
   └────────────────────────────────────────────┘

   ผู้ที่ต้องประเมิน (7 คน):
   ┌───────────────────┬──┬───────────────────┐
   │ ผอ. ABC (g10)     │  │ ผอ. DEF (g10)     │
   │ [ประเมินเลย →]    │  │ [ประเมินเลย →]    │
   ├───────────────────┼──┼───────────────────┤
   │ ผช.ผวก. XYZ (g11) │  │ ...               │
   │ [ประเมินเลย →]    │  │                   │
   └───────────────────┴──┴───────────────────┘
```

คลิก [ประเมินเลย] → POST `/external/select-evaluatee/{evaluatee_id}` → update session.evaluatee_id → redirect /external/evaluate

### D. Evaluation form

ตามแบบประเมิน external สำหรับ grade ของผู้ถูกประเมิน คนนั้น (auto-pick by grade)

### E. Submit

```
POST /external/evaluate
   ├─ บันทึก answers (unique key includes external_session_id)
   ├─ session.completed_at = NULL (allow more)
   ├─ access_code.use_count += 1
   ├─ access_code.is_used = ยังคง false (active)
   └─ Redirect → /external/dashboard
                          ↓
                ผู้ถูกประเมินคนนั้นมี ✓ "ประเมินแล้ว"
                คลิกคนถัดไปได้ทันที (ไม่ต้อง logout)
```

### F. คนที่ 2 ของ org

ใช้ URL+code เดียวกัน → กรอกชื่อ "นางสมหญิง" → session ใหม่ → dashboard ใหม่ (ทั้ง 7 evaluatees ใหม่หมด ไม่เห็นที่นายสมชายทำ)

---

## 🔐 Validity rules ของ code

`isValid()` ใน `ExternalAccessCode`:

```php
return !is_used                               // ไม่ถูกระงับด้วยมือ
    && (expires_at IS NULL || not past)       // ไม่หมดอายุ
    && (max_uses IS NULL || use_count < max_uses)  // ไม่ครบโควตา
```

---

## 📊 รายงาน (Reports)

### Excel export "องค์กรภายนอก" (`exportExternalOrgReport`)

ใช้ `buildPivotSheet()` กับ `externalOrgMode = true`:

```sql
SELECT
  'right' AS angle,
  CONCAT('SESS-', ses.id) AS evaluator_emid,           -- ← session ใช้เป็น unique key
  CONCAT(ses.evaluator_name, ' [', eo.name, ']') AS evaluator_name,
  ...
FROM answers a
JOIN external_access_codes eac ON a.external_access_code_id = eac.id
JOIN external_organizations eo ON eac.external_organization_id = eo.id
LEFT JOIN external_evaluation_sessions ses ON a.external_session_id = ses.id
WHERE a.evaluation_id = ?
  AND a.external_access_code_id IS NOT NULL
  AND a.fiscal_year = ?
ORDER BY eo.name, evaluatee.fname
```

**1 row = 1 session** (= 1 คนของ org ที่ submit) → 3 คนจาก org เดียวกันประเมิน A → 3 rows แยกกันใน Excel

### รายงานรายบุคคล (`getUserDetails`)

ส่วน "External evaluators" ของ user:

```php
DB::table('external_evaluation_sessions as ses')
  ->join('external_organizations as eo', 'ses.external_organization_id', '=', 'eo.id')
  ->where('ses.evaluatee_id', $userId)
  ->whereNotNull('ses.completed_at')
  ->whereExists(answers ที่ session_id ตรง)
  ->get();
```

→ list แต่ละ session เป็น row พร้อมชื่อจริง + ตำแหน่ง + org

---

## 🛠 Code structure

### Backend

| File | บทบาท |
|---|---|
| `app/Http/Controllers/AdminAccessCodeController.php` | Admin CRUD + auto-pick eval + pivot insert |
| `app/Http/Controllers/ExternalEvaluatorController.php` | login/dashboard/selectEvaluatee/submit |
| `app/Models/ExternalAccessCode.php` | + sessions(), codeEvaluatees(), isValid() ใหม่ |
| `app/Models/ExternalCodeEvaluatee.php` | ⭐ ใหม่ — model ของ pivot |
| `app/Models/ExternalEvaluationSession.php` | + evaluator_name, evaluator_position |
| `app/Models/Answer.php` | + external_session_id |
| `app/Services/EvaluationExportService.php` | buildPivotSheet — added externalOrgMode |

### Frontend

| File | หน้า |
|---|---|
| `resources/js/Pages/ExternalLogin.tsx` | + name + position fields |
| `resources/js/Pages/ExternalDashboard.tsx` | grid evaluatees + completion ring |
| `resources/js/Pages/AdminAccessCodeIndex.tsx` | list with sessions expand + use_count |
| `resources/js/Pages/AdminAccessCodeGenerate.tsx` | grade ≥9 only + auto-pick eval + supported badges |

### Routes

```php
// Admin
GET  /admin/access-codes/create
POST /admin/access-codes  (generate — 1 batch = 1 code + N pivot)
PUT  /admin/access-codes/{id}/revoke
PUT  /admin/access-codes/{id}/regenerate

// External
GET  /external/login
POST /external/login                           // require code + evaluator_name
GET  /external/dashboard                       // list pivot evaluatees
POST /external/select-evaluatee/{evaluateeId}  // ⭐ ใหม่ — switch session pointer
GET  /external/evaluate
POST /external/evaluate                        // submit (no auto-revoke)
POST /external/logout
```

---

## 🧪 Tests

ดู [docs/server/testing.md](./server/testing.md) สำหรับวิธีรัน

### Coverage

| Layer | File | Tests |
|---|---|---|
| Pest (PHP) | `tests/Feature/External/ExternalRedesignFlowTest.php` | 12 ผ่าน |
| Vitest (React) | `tests/js/Task3/ExternalLoginRedesign.test.tsx` | 5 ผ่าน |
| Playwright (E2E) | `tests/e2e/external-redesign.spec.ts` | 5 (require live test env + EXTERNAL_TEST_CODE env) |

---

## 🚀 Migrations ที่เกี่ยวข้อง

| File | Schema change |
|---|---|
| `2026_04_27_120000_add_external_evaluator_flexibility.php` | sessions.evaluator_name/position + codes.use_count/max_uses + answers.external_session_id + new unique |
| `2026_04_27_140000_add_external_code_evaluatees_pivot.php` | สร้าง pivot table + backfill 1:1 จาก codes เดิม |

ทั้งคู่ deploy แล้วทั้ง prod + test (2026-04-27)

---

## 📝 Backups (rollback ได้)

```
/var/backups/evaluation_db-pre-external-redesign-20260427-162937.sql  (60 MB)
/var/backups/evaluation_db-pre-pivot-20260427-165119.sql              (19 MB — focused tables)
```

### Rollback (ฉุกเฉิน)
```bash
cd /var/www/evaluation
php artisan migrate:rollback --step=2 --force
mysql evaluation_db < /var/backups/evaluation_db-pre-external-redesign-20260427-162937.sql
# redeploy old code from git
```

---

## 🔗 เอกสารที่เกี่ยวข้อง

- [SSH Guide](./server/ssh-guide.md)
- [Test Environment](./server/test-environment.md)
- [DBeaver Access](./server/dbeaver-access.md)
- [Testing Guide](./server/testing.md)
- [Import Systems](./import-systems.md)
- [Database Overview](../spec/database_overview.md)
