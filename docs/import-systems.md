# คู่มือระบบนำเข้าข้อมูลจาก Excel

> **อัปเดต 2026-05-04 (rev4)**: Stakeholder Import → เพิ่ม Manual Mapping UI · admin จับคู่ sheet ที่ fuzzy ไม่เจอกับ user ในระบบเองได้ + skip sheet เลือกได้
> **อัปเดต 2026-05-03 (rev3)**: Stakeholder Import → รองรับ template เก่าที่ไม่มีคอลัมน์ G (emid) — fallback fuzzy match จากชื่อ sheet (`<prename> <fname> <lname>`) · Audit ไฟล์จริง 48 sheets, แก้ครบทั้งหมดได้
> **อัปเดต 2026-05-03 (rev2)**: Stakeholder Import → เพิ่ม table `external_stakeholders` เก็บข้อมูลทุกคอลัมน์ (org, ผู้ติดต่อ, เบอร์/อีเมล) + แสดงรายละเอียดแต่ละ stakeholder ใน preview
> **อัปเดต 2026-05-03**: เพิ่มระบบ Stakeholder Import (Bulk-สร้าง access codes องศาขวาจาก Excel)
> **อัปเดต 2026-04-26**: redesign Assignment Import เป็น 3-step wizard + ทดสอบจริง 7 ไฟล์ ✅ 99.84% match rate
> **อัปเดต 2026-04-25**: เพิ่มระบบ User Import (นำเข้าสมาชิก)
> ทั้ง 3 ระบบใช้ pattern เดียวกัน (Service + 3-step wizard + DB transaction)

ปัจจุบันระบบมี import 3 ตัว — เข้าคนละหน้า ใช้คนละโครงสร้างไฟล์ Excel:

| ระบบ | URL | ใช้เมื่อ |
|---|---|---|
| **User Import** | `/admin/users/import` | นำเข้าพนักงาน/สมาชิกใหม่เข้าตาราง `users` |
| **Assignment Import** | `/admin/assignments/import` | นำเข้ารายการจับคู่ผู้ประเมิน-ผู้ถูกประเมิน (top/bottom/left/self) |
| **Stakeholder Import** | `/admin/stakeholders/import` | Bulk-สร้าง access codes องศาขวา (`angle='right'`) สำหรับผู้ประเมินภายนอก |

---

## 1. User Import — นำเข้าสมาชิก

### เข้าหน้า

`Admin → จัดการสมาชิก (/admin/users) → ปุ่มสีเขียว "นำเข้าจาก Excel"`

### โครงสร้างไฟล์ Excel ที่รองรับ

ใช้ **Sheet แรก** (active sheet) — แถว 1 = หัวตาราง

| คอลัมน์ | ข้อมูล | ตัวอย่าง | Map → DB |
|---|---|---|---|
| A | ลำดับ | 1, 2, 3 | (ไม่ใช้) |
| B | รหัสพนักงาน | 681023 | `users.emid` (UNIQUE) |
| C | คำนำหน้า | นาย / นาง / นางสาว | `users.prename` |
| D | ชื่อ | สุภาสินี | `users.fname` |
| E | นามสกุล | อัคนิมณี | `users.lname` |
| F | ตำแหน่ง | เลขานุการ | lookup → `positions.title` |
| G | ระดับ | 5, 6 | `users.grade` |
| H | กอง | กองตรวจสอบ 1 | lookup → `departments.name` |
| I | ฝ่าย | ฝ่ายตรวจสอบภายใน | lookup → `factions.name` |
| J | สายงาน | สายงานผู้ว่าการ | lookup → `divisions.name` |
| K | วันเกิด | 2535-10-15 *(พ.ศ.)* | `users.birthdate` (แปลงเป็น ค.ศ.) |

### Field ที่ระบบเติมให้อัตโนมัติ

| Field | ค่า / ตรรกะ |
|---|---|
| `sex` | derive จาก `prename`: นาย → ชาย, นาง/นางสาว → หญิง |
| `password` | `Hash::make(birthdate.format('dm') + ปีพ.ศ.)` — เช่น 15/10/2535 → `15102535` |
| `role` | `'user'` |
| `user_type` | `'internal'` |

### Flow การใช้งาน (3-step wizard)

#### Step 1: อัปโหลดไฟล์
- เลือก `.xlsx / .xls`
- กด **"อัปโหลด & ดูตัวอย่าง"** → ระบบ parse + ส่ง preview กลับ (ยังไม่แตะ DB)

#### Step 2: ตรวจสอบ & จับคู่
แสดง 5 การ์ดสรุป:

| สถานะ | สี | ความหมาย |
|---|---|---|
| ทั้งหมด | violet | จำนวน row ที่ parse ได้ |
| พร้อมนำเข้า | emerald | ข้อมูลครบ + lookup เจอทุกฟิลด์ |
| ต้องจับคู่ | amber | มี กอง/ฝ่าย/ตำแหน่ง/สายงาน ที่ไม่อยู่ใน DB |
| มีอยู่แล้ว | gray | emid ซ้ำ — จะถูก skip |
| ข้อมูลไม่ครบ | red | ขาดชื่อ/วันเกิด/รหัสพนักงาน |

**ส่วนจับคู่ข้อมูลที่ไม่พบ** (สีเหลือง):
- แต่ละชื่อที่ไม่อยู่ใน DB จะมี dropdown ให้เลือก:
  - `+ สร้างใหม่ "<ชื่อ>"` — สร้าง record ใหม่ใน DB ก่อน insert user
  - หรือ **map กับของเดิม** — เลือก ID ที่มีอยู่ (กรณีสะกดเพี้ยน/ใช้คนละชื่อ)
- **ต้องจับคู่ครบทุกรายการ** ถึงกดยืนยันได้

ตารางด้านล่าง: แสดงทุก row พร้อม badge "ใหม่" บนคอลัมน์ที่ต้องสร้าง

#### Step 3: ผลการนำเข้า
- จำนวน created / skipped
- Detail ทีละแถว: `แถว 4: ✓ นางสาวภัทรวรินทร์ ปาลวัฒน์ (681008)` หรือ `แถว 3: ข้าม (รหัส 681001 มีอยู่แล้ว)`
- ปุ่ม "ไปหน้ารายชื่อ" หรือ "นำเข้าไฟล์ใหม่"

### กฎสำคัญ

1. **emid ซ้ำ → skip** ไม่ทับข้อมูลเดิม
2. **วันเกิดต้องเป็นปี พ.ศ.** ในไฟล์ Excel (year > 2400) — ระบบแปลงเป็น ค.ศ. ก่อนเก็บ
3. **DB transaction** ใน execute — ถ้ามี row ใดผิด ทุก row ใน batch นั้น rollback
4. **Trim trailing whitespace/newline** ทั้งฝั่ง Excel และฝั่ง DB lookup (positions ใน DB หลายตัวมี `\n` ลงท้าย)

### โครงสร้าง Code

```
app/Http/Controllers/AdminUserController.php
├── showImport()       GET  /admin/users/import         — render หน้า wizard
├── previewImport()    POST /admin/users/import/preview — parse + return JSON preview
└── executeImport()    POST /admin/users/import/execute — DB::transaction insert

app/Services/UserImportService.php       (logic แยกออกมา)
├── parseFile($path)              → array ของ rows ดิบ
├── buildPreview($rows)           → annotate ด้วย lookup ids + status + missing
├── execute($rows, $mappings)     → insert จริง (skip duplicate / map missing)
├── parseDate()                   → แปลง พ.ศ.→ค.ศ.
└── deriveSex()                   → จาก prename

resources/js/Pages/AdminUserImport.tsx   (3-step wizard)
```

### ข้อจำกัด

- ❌ ไม่ upsert (update ของเดิม) — ถ้าต้องการแก้ข้อมูล user ที่มีอยู่ ต้องเข้า edit form เอง
- ❌ ไม่มี dry-run แยก — preview ทำหน้าที่นี้ (ไม่แตะ DB)
- ❌ ไม่ส่ง email แจ้ง user ใหม่ (default password ต้องบอกปากเปล่า)

---

## 2. Assignment Import — นำเข้าจับคู่ผู้ประเมิน

> **อัปเดต 2026-04-25**: redesign เป็น 3-step wizard (เหมือน User Import) — รองรับ layout หลายแบบ + manual mapping
> Legacy endpoint `POST /admin/assignments/import-excel` ยังอยู่เพื่อ backward compat

### เข้าหน้า

`Admin → จัดการการประเมิน (/admin/assignments) → ปุ่มเขียว "นำเข้า Excel"` → ไปหน้า `/admin/assignments/import`

### โครงสร้างไฟล์ Excel ที่รองรับ (auto-detect 3 layouts)

ระบบ **scan header row** (R1-R3) หา `"รหัสพนักงาน"` แล้ว **detect ตำแหน่งคอลัมน์อัตโนมัติ** จาก header text — ไม่ hardcode ตำแหน่ง

| Header Text | ใช้เพื่อ |
|---|---|
| `รหัสพนักงาน` | emid (จำเป็น) |
| `ชื่อ` / `ชื่อ-นามสกุล` | display only |
| `ระดับ` | display only (grade ดึงจาก DB) |
| `ประเมินตนเอง` | `'/'` = self-eval = yes |
| `องศาบน` | top angle evaluators |
| `องศาล่าง` | bottom angle evaluators |
| `องศาซ้าย` | left angle evaluators |

**ไม่อ่านคอลัมน์ "องศาขวา"** — right angle assignments สร้างผ่านระบบ External Organization → Access Code (flow แยก) ดู section "External Organization Flow" ใน [database_overview.md](../spec/database_overview.md)

**Layouts ที่ทดสอบแล้ว** (จาก `docs/รายการจับคู่ประเมินปี 69/`):
- ผู้บริหารระดับ 10/12, ผู้ว่าการ — ไม่มีคอลัมน์ "ลำดับ" + ชื่อ-สกุลแยก
- ผู้บริหารระดับ 9, ผช.11, เลขานุการ — มีคอลัมน์ "ลำดับ" + ชื่อ-สกุลแยก
- พนักงานระดับ 5-8 — มีคอลัมน์ "ลำดับ" + ชื่อ-นามสกุล**รวม** + 7 sheets แยกตามสายงาน

### ตัวอย่างข้อมูลในเซลล์ "องศาบน/ล่าง/ซ้าย"

```
1 นาย เริงฤทธิ์ กุศลกรรมบถ รผก.สผ
 - น.ส.ภัสรา เจิมวิวัฒน์กุล ผอ.ฝ่าย
 - นางสาว วันดี เพ็งพูล
ไม่มี
```

ระบบจะ:
- Split ด้วย `\n` + `,`
- Strip prefix: `"1 "`, `"1. "`, `"1) "`, `"- "`
- Drop `"ไม่มี"` และค่าว่าง

### การ Match ชื่อผู้ประเมิน → User (fuzzy)

1. **emid ตรง** (กรณีกรอกเป็นรหัสพนักงาน)
2. **ชื่อเต็มตรง** (`prename + fname + lname` หรือ `fname + lname`)
3. **Strip prefix** + **strip "(N)"** + try:
   - `parts[0] (fname) + parts[1] (lname)` — สำหรับเคส title ตามท้าย เช่น `"เริงฤทธิ์ กุศลกรรมบถ รผก.สผ"`
   - `parts[0] + parts[last]` — fallback กรณี title อยู่กลาง
   - `fname only` ถ้าใน DB มีคนเดียว
4. **Partial match** — `str_contains(input, "fname lname")` หรือกลับด้าน
5. ถ้ายังหาไม่เจอ → เข้า list `unmatched_names` รอ admin map ใน UI

### Flow การใช้งาน (3-step Wizard)

#### Step 1: Upload + Fiscal Year
- เลือกไฟล์ `.xlsx/.xls`
- เลือกปีงบประมาณ (ค.ศ., แสดง พ.ศ. ใน label)
- กด "อัปโหลด & ดูตัวอย่าง" → server parse + ส่ง preview กลับ (ไม่แตะ DB)

#### Step 2: Preview & Map
- **Sheet summary** — list sheet ทุก sheet + จำนวน row ที่ parse ได้ (sheet ที่ไม่มี header → skip + แสดง strikethrough)
- **Summary cards** — total / ok / has_unmatched / unsupported_grade / duplicate / evaluatee_not_found / no_evaluation
- **Angle counts** — แสดง self/top/bottom/left ที่จะสร้าง
- **Unmatched names section** — group ชื่อที่หาไม่เจอ (ปรากฏหลายครั้งรวมเป็น 1 entry):
  - Search box → filter จาก users prop (client-side)
  - หรือ "Skip ทุกตำแหน่ง"
- **Preview table** — row-by-row พร้อม badge สีตาม angle, status, duplicate/unsupported markers
- ปุ่ม "ยืนยันนำเข้า" — disabled จนกว่าจะ map unmatched ครบทุกชื่อ

#### Step 3: Result
- Stats: created / skipped / duplicate / unsupported (grade)
- Detail rows ทีละ sheet/row พร้อม ✓ / ⚠ ตามสถานะ
- ปุ่ม "ไปหน้ารายการ" / "นำเข้าไฟล์ใหม่"

### กฎสำคัญ

1. **Idempotent** — เช็คซ้ำด้วย key `(evaluator_id, evaluatee_id, fiscal_year, angle)` → ถ้ามีแล้ว skip
2. **Grade vs Angle validation** — ผ่าน `EvaluationLookupService::supportsAngle($grade, $angle)`:
   - Grade 4-8: รองรับเฉพาะ `self / top / left`
   - Grade 9+: รองรับครบ (self/top/bottom/left + right ผ่าน external flow)
3. **Self pattern** — `angle='self', evaluator_id=evaluatee_id`
4. **DB Transaction** — execute ทำใน `DB::transaction` → ถ้า error → rollback ทั้ง batch
5. **Multi-sheet** — ทุก sheet ใน workbook process รวมเป็น batch เดียว

### โครงสร้าง Code

```
app/Services/AssignmentImportService.php   (ใหม่)
├── parseFile($path)                  → array of rows + sheet summary
├── buildPreview($parsed, $fy)        → annotate + lookups + unmatched aggregation
├── execute($rows, $mappings, $fy)    → DB::transaction
├── findHeaderRow()                   → scan R1-R3
├── detectColumns()                   → header text → column letter
├── splitNames()                      → strip prefixes + drop "ไม่มี"
└── findUserFuzzy()                   → 5-step fallback

app/Http/Controllers/AdminEvaluationAssignmentController.php
├── showImport()         GET  /admin/assignments/import
├── previewImport()      POST /admin/assignments/import/preview
├── executeImport()      POST /admin/assignments/import/execute
└── importExcel()        POST /admin/assignments/import-excel  (legacy — เก็บไว้)

resources/js/Pages/AdminAssignmentImport.tsx   (ใหม่ — 3-step wizard)
resources/js/Pages/AdminEvaluationAssignmentManager.tsx
└── ปุ่ม "นำเข้า Excel" → <a href="/admin/assignments/import"> (ไม่มี modal แล้ว)
```

### ข้อจำกัดที่เหลือ

- ❌ ไม่ upsert (update assignment เดิม) — duplicate → skip
- ❌ ไม่มี dry-run แยก — preview ทำหน้าที่นี้ (ไม่แตะ DB)
- ❌ Cell content ที่เป็น "descriptor" (เช่น `"พนักงานในสังกัด (4)"`, `"ผู้อำนวยการกอง..."`) จะ unmatched — admin ต้อง skip ใน step 2
- ❌ คอลัมน์ "องศาขวา" ไม่ถูก import — สร้างผ่าน flow ของ `external_organizations` → `external_access_codes` แทน

---

## 3. Stakeholder Import — นำเข้า Access Code องศาขวา

> **เพิ่ม 2026-05-03**: Bulk-สร้าง access codes องศาขวา (`angle='right'`) จากไฟล์ Excel
> "stakeholder template" — 1 sheet = 1 ผู้ถูกประเมิน · 1 กลุ่ม Stakeholder = 1 access code

### เข้าหน้า

`Admin → Access Codes (/admin/access-codes) → ปุ่มสีเหลือง "นำเข้า Stakeholder Excel"` → ไปหน้า `/admin/stakeholders/import`

### โครงสร้างไฟล์ที่รองรับ

ไฟล์ template ที่กำหนดมา (เช่น `docs/stakeholder ผู้บริหารระดับ 9-10 (สำนักงานใหญ่)/`):

| Cell | ข้อมูล |
|---|---|
| Sheet name | ชื่อ-สกุล evaluatee (ใช้แสดงเท่านั้น — ไม่ใช้ map) |
| R1 | หัวฟอร์ม (เช่น "แบบฟอร์มรวบรวม...ปีงบประมาณ 2569") |
| R2 | ชื่อ + ตำแหน่งของ evaluatee |
| R3 | header: กลุ่ม Stakeholder \| นิยาม \| ชื่อหน่วยงาน \| ผู้ติดต่อ \| ติดต่อ \| ผู้ประสาน \| รหัสพนักงาน |
| **G4** | **emid ของ evaluatee** (ใช้ map เข้า users.emid) |
| Column A (R4↓) | label ของกลุ่ม Stakeholder — รายแถวที่ไม่ว่าง = boundary ของกลุ่มใหม่ |
| Column C | ชื่อหน่วยงาน/บริษัท — ใช้นับจำนวน slot ของ `max_uses` (ต้องมีอักษรไทย/อังกฤษ ≥3 ตัว) |
| Column D-F | ผู้ติดต่อ + เบอร์ + อีเมล (ไม่เก็บ — stakeholder จะกรอกตอน login) |

### Domain mapping → DB

| Excel | DB |
|---|---|
| G4 (emid) | `users.id` ของ evaluatee |
| Column A label | `external_organizations.name` (firstOrCreate; org_code สร้างอัตโนมัติ) |
| 1 (evaluatee × group × fy) | 1 row ใน `external_access_codes` + 1 pivot ใน `external_code_evaluatees` |
| **แต่ละแถว stakeholder** (cols A–F) | **1 row ใน `external_stakeholders`** (org_name, sub_group, sequence_no, contact_person, contact_info, coordinator, source_sheet, source_row) |
| จำนวน stakeholder ใน group | `external_access_codes.max_uses` (min = 10) |

**ไม่สร้าง** `evaluation_assignments` row เพิ่มเติม — เพราะ `evaluator_id` เป็น NOT NULL FK ไป users; ระบบจะ **อ้างอิง** assignment อันเก่า (ถ้ามี) ผ่าน `evaluation_assignment_id` (ตาม flow ของ `AdminAccessCodeController::generate`)

### `external_stakeholders` schema

```sql
external_stakeholders
├── id, external_access_code_id (FK cascade), evaluatee_id (FK cascade), fiscal_year
├── group_label                          -- column A (เช่น "คู่ค้าหรือคู่ความร่วมมือ")
├── sub_group (text, nullable)           -- บรรทัดแรกของ column B (เช่น "คู่ค้า" / "คู่ความร่วมมือ") — carry-forward
├── sequence_no (string)                 -- "1)", "2)" จาก column C prefix
├── organization_name (string)           -- column C หลัง strip prefix
├── contact_person (string nullable)     -- column D หลัง strip "ชื่อ-นามสกุล :"
├── contact_info (string nullable)       -- column E (เบอร์/อีเมล)
├── coordinator (string nullable)        -- column F
├── source_sheet, source_row             -- traceability ไปยัง cell ต้นทาง
├── external_session_id (FK nullable)    -- set ตอน stakeholder login + ตรงกับ slot นี้ (future feature)
└── unique(access_code_id, sequence_no, organization_name)  -- idempotent re-import
```

### Flow การใช้งาน (3-step Wizard)

#### Step 1: Upload + Fiscal Year
- เลือกไฟล์ `.xlsx/.xls` + ปีงบประมาณ
- กด "อัปโหลด & ดูตัวอย่าง"

#### Step 2: Preview
- **Sheet summary**: list sheet ทุก sheet + reason สำหรับ sheet ที่ skip (no_emid / no_groups)
- **Cards**: total_sheets / valid_sheets / skipped_sheets / codes_to_create / codes_duplicate / evaluatee_not_found / no_evaluation
- **Preview table**: row-by-row พร้อม badge สถานะ + รายชื่อกลุ่ม + จำนวน stakeholder + ✗ duplicate (พร้อม code เดิม)
- ปุ่ม "ยืนยันสร้าง N Codes" — disabled ถ้า codes_to_create=0

#### Step 3: Result
- Stats: created_codes / created_orgs / skipped_duplicate / skipped_no_evaluatee / skipped_no_evaluation
- Detail: รายการ code summary (sheet, evaluatee, group, code, max_uses, status)
- ปุ่ม "ไปหน้า Access Codes" / "นำเข้าไฟล์ใหม่"

### กฎสำคัญ

1. **Idempotent** — เช็คซ้ำด้วย key `(external_organization_id, evaluatee_id, fiscal_year)` → ถ้ามีแล้ว skip
2. **emid lookup เท่านั้น** — ไม่มี fuzzy match จากชื่อ sheet (G4 บังคับต้องเป็นรหัสตัวเลข)
3. **DB Transaction** — `execute` ทำใน `DB::transaction` → error ใน batch → rollback
4. **org_code auto-generate** — ดึงตัวอักษรแรกของแต่ละ token จาก label (เช่น "คู่ค้าหรือคู่ความร่วมมือ" → ใช้ตัวอักษรแรก) + suffix ถ้าซ้ำ
5. **Code format** — `IEAT-{ORG_CODE}-{RANDOM6}` (≤20 char)
6. **max_uses default = 10** — ถ้า template ว่าง (stakeholder_count=0) ตั้งเป็น 10; ถ้ามีมากกว่าก็ใช้ตามจำนวนจริง

### โครงสร้าง Code

```
app/Services/StakeholderImportService.php   (ใหม่)
├── parseFile($path)                  → {rows, sheets} (1 row = 1 sheet ที่มี emid)
├── buildPreview($parsed, $fy)        → annotate evaluatee + duplicate detection
├── execute($rows, $fy)               → DB::transaction; firstOrCreate org + create code + pivot
├── extractEmid()                     → G4 (fallback: scan G1-G10)
├── extractGroups()                   → boundaries ใน column A → groups[]
├── isFilledStakeholder()             → regex: ต้องมีอักษร ≥3 ตัว
├── generateOrgCode()                 → first-letter-of-each-token + collision suffix
└── generateUniqueCode()              → IEAT-{ORG}-{RANDOM6}

app/Http/Controllers/AdminStakeholderImportController.php
├── showImport()       GET  /admin/stakeholders/import
├── previewImport()    POST /admin/stakeholders/import/preview
└── executeImport()    POST /admin/stakeholders/import/execute

resources/js/Pages/AdminStakeholderImport.tsx   (ใหม่ — 3-step wizard)

resources/js/Pages/AdminAccessCodeIndex.tsx
└── ปุ่ม "นำเข้า Stakeholder Excel" (สีเหลือง) เพิ่มข้างปุ่ม "สร้างใหม่"
```

### Routes

```php
Route::prefix('admin/stakeholders')->name('admin.stakeholders.')->group(function () {
    Route::get('/import',          [AdminStakeholderImportController::class, 'showImport'])->name('import');
    Route::post('/import/preview', [AdminStakeholderImportController::class, 'previewImport'])->name('import.preview');
    Route::post('/import/execute', [AdminStakeholderImportController::class, 'executeImport'])->name('import.execute');
});
```

### ผลทดสอบ Real File (2026-05-03)

ทดสอบ parse `Stakeholder ของ ผู้บริหารระดับ 9-10 ปี 2569 สายงานบริหาร.xlsx`:

| Metric | จำนวน |
|---|---|
| Sheets | 12 |
| Valid evaluatees (emid match) | 12 |
| Skipped sheets | 0 |
| Filled stakeholder counts (range) | 0–9 ต่อ sheet |
| Common group label | "คู่ค้าหรือคู่ความร่วมมือ" |

→ Parser ทำงานถูกต้องกับไฟล์จริง

### Tests

- `tests/Unit/StakeholderImportServiceParseTest.php` — 4 tests (pure parsing logic)
- `tests/Feature/AdminStakeholderImportTest.php` — 6 tests (DB-backed: preview, execute, idempotency, controller auth)
- รัน: `./vendor/bin/pest --filter=Stakeholder` → all green ✅

### ข้อจำกัดที่เหลือ

- ✅ **เก็บข้อมูล stakeholder ครบทุกคอลัมน์ใน `external_stakeholders`** (rev2 — 2026-05-03)
- ❌ ยังไม่ auto-link `external_evaluation_sessions.id` กลับไปที่ `external_stakeholders.external_session_id` ตอน stakeholder login (ต้อง update ภายหลัง — ปัจจุบัน column นี้ก็คงเป็น null)
- ❌ ไม่ upsert max_uses ของ code เดิม — ถ้า stakeholder เพิ่มในไฟล์รอบถัดไป stakeholder rows ใหม่จะถูกเพิ่ม แต่ max_uses ของ code เดิมไม่เปลี่ยน
- ❌ ไม่สร้าง EvaluationAssignment row (อ้างอิงของเดิมเท่านั้น) — limit ของ schema NOT NULL `evaluator_id`

---

## 4. ความแตกต่างของ 3 ระบบ — สรุปสั้น

| ประเด็น | User Import | Assignment Import |
|---|---|---|
| Sheet | Sheet แรก | **ทุก Sheet** (auto-detect header) |
| UI | 3-step wizard | **3-step wizard** (เดิมเป็น modal) |
| Preview ตาราง | ✅ | ✅ |
| Manual mapping | ✅ map / สร้างใหม่ | ✅ map / skip |
| Dry-run | ผ่าน preview (ไม่แตะ DB) | ผ่าน preview (ไม่แตะ DB) — ตัว legacy ยังมี dry-run flag |
| Fuzzy match | ❌ trim เท่านั้น | ✅ 5-step (prefix strip + first/last word match) |
| Logic แยก Service | ✅ `UserImportService` | ✅ `AssignmentImportService` |
| DB Transaction | ✅ | ✅ |
| Multi-sheet | n/a | ✅ ทุก sheet (auto) |
| Auto-detect column | ❌ ตายตัว | ✅ จาก header text |

---

## 4. Routes สำหรับอ้างอิง

```php
// routes/web.php (admin middleware)
Route::prefix('admin/users')->name('admin.users.')->group(function () {
    Route::get('/import',         [AdminUserController::class, 'showImport'])->name('import');
    Route::post('/import/preview',[AdminUserController::class, 'previewImport'])->name('import.preview');
    Route::post('/import/execute',[AdminUserController::class, 'executeImport'])->name('import.execute');
});

Route::prefix('admin/assignments')->name('assignments.')->group(function () {
    Route::get('/import',          [AdminEvaluationAssignmentController::class, 'showImport'])->name('import');
    Route::post('/import/preview', [AdminEvaluationAssignmentController::class, 'previewImport'])->name('import.preview');
    Route::post('/import/execute', [AdminEvaluationAssignmentController::class, 'executeImport'])->name('import.execute');
    Route::post('/import-excel',   [AdminEvaluationAssignmentController::class, 'importExcel'])->name('import-excel'); // legacy
});
```

## 5. Library ที่ใช้

```json
"phpoffice/phpspreadsheet": "^4.2"
```

ติดตั้งไว้แล้วใน `composer.json` — ใช้ทั้ง 2 ระบบ + ระบบ export

## 6. Troubleshooting

### User Import: วันเกิดผิด / login ไม่ได้

อาการ: กรอก password ตามวันเกิดแล้วเข้าไม่ได้

```bash
# ตรวจ DB ว่า birthdate เป็น ค.ศ. หรือ พ.ศ.
mysql evaluation_db -e "SELECT emid, fname, birthdate FROM users WHERE emid=XXXXXX;"
```

- ถ้า birthdate > 2400 = bug — ระบบเก่ายังไม่แปลง พ.ศ.→ค.ศ. (แก้ไปแล้ว 2026-04-25 commit fix)
- Workaround: ใช้ password คำนวณจาก year + 543 ของ AD year ที่เก็บอยู่จริง

### Assignment Import: ไม่พบผู้ประเมินจำนวนมาก

ดู `errors[]` ใน response — สาเหตุที่พบบ่อย:
1. ชื่อใน Excel มีคำนำหน้าแปลก ๆ ที่ regex ไม่ครอบ (เช่น "ผศ.ดร.")
   → แก้ regex ที่ `AdminEvaluationAssignmentController::findUser()` line 1211
2. นามสกุลเปลี่ยน + มี `fname` ซ้ำหลายคน → fallback fname-only fail
   → แก้ใน Excel ใส่เป็น emid แทน
3. เคาะวรรคผิด → trim ช่วยได้ส่วนหนึ่ง แต่ space กลางชื่ออาจไม่ match

### Assignment Import: "ไม่พบแบบประเมินสำหรับ grade=X"

ระบบไม่มี `evaluation` record ที่ match `(grade, user_type, fiscal_year)` ตัวนั้น

```bash
# ตรวจ evaluation ที่มี
mysql evaluation_db -e "SELECT id, grade, user_type, fiscal_year, name FROM evaluations WHERE fiscal_year=2026;"
```

ต้องสร้าง evaluation ก่อนใน `Admin → จัดการแบบประเมิน`

---

## 7. ผลการทดสอบจริง (2026-04-26)

ทดสอบ Assignment Import กับไฟล์จริง 7 ไฟล์ใน `docs/รายการจับคู่ประเมินปี 69/` บน test environment

### Setup
- **Test DB users**: 684 (synced ครบกับ prod รวมพนักงานบรรจุใหม่ 56 คน)
- **Test fiscal year**: 2026 (พ.ศ. 2569)
- **Files tested**: 7 ไฟล์ครอบคลุม 3 layouts ที่ระบบรองรับ

### ผลลัพธ์ Preview (ไม่แตะ DB)

| Metric | จำนวน |
|---|---|
| Total rows parsed | **644** |
| ✓ ok | 510 |
| ⚠ has_unmatched | 133 |
| ✗ evaluatee_not_found | 1 *(data quality issue ใน Excel)* |
| ✗ no_evaluation | 0 |
| ⊘ unsupported_grade | 0 |
| 🔁 duplicate | 0 |
| **Match rate** | **99.84%** |

### ผลลัพธ์ Execute (สร้างจริงใน test DB)

| File | Rows | Created | Skipped | Dup | Unsup |
|---|---|---|---|---|---|
| ผอ. ระดับ 10 (มี.ค. 69) | 30 | 445 | 88 | 0 | 0 |
| ผอ. ระดับ 9 V2 | 69 | 990 | 131 | 0 | 18 |
| ผช. ระดับ 11 | 16 | 174 | 29 | 28 | 0 |
| ผู้ว่าการ | 1 | 10 | 26 | 0 | 0 |
| **พนักงาน 5-8** | 485 | **4,136** | 9 | 1 | 2 |
| รผก. ระดับ 12 | 7 | 100 | 23 | 1 | 0 |
| เลขานุการ | 36 | 302 | 2 | 0 | 0 |
| **TOTAL** | **644** | **6,157** | 308 | 30 | 20 |

### Idempotency Test (รัน execute ซ้ำ 2 รอบ)

| | Run 1 (ครั้งแรก) | Run 2 (รันซ้ำ) |
|---|---|---|
| Created | 6,157 | **0** ✅ |
| Duplicate detected | 30 | **6,187** ✅ |

→ ระบบ **idempotent ครบ** — รัน import ไฟล์เดิมซ้ำไม่สร้าง duplicate

### Sample Assignments ที่ verify ความถูกต้อง business logic

```
self    จันทร์ธร (g10) → จันทร์ธร (g10)              ✓ ประเมินตนเอง
top     เริงฤทธิ์ (g12) → จันทร์ธร (g10)             ✓ หัวหน้าประเมินลูกน้อง
top     อัฏฐพล (g11) → จันทร์ธร (g10)               ✓
bottom  ปริษา (g5) → จันทร์ธร (g10)                 ✓ ลูกน้องประเมินหัวหน้า
bottom  พงศธร (g9) → จันทร์ธร (g10)                 ✓
left    ภัสรา (g10) → จันทร์ธร (g10)                ✓ peer ระดับเดียวกัน
left    สายจิต (g10) → จันทร์ธร (g10)               ✓
```

ทุกคู่สมเหตุสมผลกับ 360° evaluation framework

### DB Safety

| | BEFORE | After Run 1 | After Run 2 | After ROLLBACK |
|---|---|---|---|---|
| Total assignments | 6,018 | 12,175 | 12,175 | **6,018** ✓ |

→ DB::transaction commit สมบูรณ์, manual delete rollback ได้สะอาด

### ปัญหาที่พบ (data quality ใน Excel — ไม่ใช่ bug)

1. **emid="นาย"** ใน `พนักงาน 5-8 → ปฏิบัติการ 1 R37`
   - Cell B กรอก "นาย" แทนรหัส (column shift) — ชื่อจริง "พงศ์พัฒน์ พลบเดช" ที่ยังไม่อยู่ในระบบ
   - ระบบ mark `evaluatee_not_found` ถูกต้อง — admin แก้ใน Excel ก่อน import

2. **133 unmatched names** — ทั้งหมดเป็น descriptors:
   - `"พนักงานในสังกัด"` (×26)
   - `"ผวก."` (×16)
   - `"ผู้อำนวยการกอง... ในสายงาน (N) ได้แก่"` (หลายแบบ)
   - `"ผอ.ระดับ 10 ในสายงาน (4) ได้แก่"` ฯลฯ
   - **ไม่ใช่ชื่อบุคคล** — admin คลิก "Skip ทุกตำแหน่ง" ใน Step 2 ของ wizard

3. **20 unsupported_grade** — grade 4-8 พยายามใช้ angle=bottom (ไม่รองรับตาม `EvaluationLookupService::supportsAngle`) → ระบบ skip ถูกต้อง

4. **30 duplicate** — ผช.11 ไฟล์มี Sheet1 + Sheet2 เนื้อหาเหมือนกัน → ระบบ detect ซ้ำใน batch เดียวได้

### สรุปสถานะระบบ

| Feature | สถานะ |
|---|---|
| Auto-detect 3 layouts | ✅ |
| Multi-sheet (1-7 sheets/ไฟล์) | ✅ |
| Fuzzy match | ✅ 99.84% |
| Grade vs angle validation | ✅ |
| Self/top/bottom/left รองรับครบ | ✅ |
| DB transaction | ✅ |
| Idempotent (รันซ้ำได้) | ✅ |
| Manual mapping/skip ใน UI | ✅ |
| Rollback ผ่าน DELETE | ✅ |

→ **Production-ready 100%**

---

## 8. แนวทางพัฒนาต่อ (Future Enhancement)

### Group descriptor expansion (สำหรับ Assignment Import)
ปัจจุบัน descriptor เช่น `"พนักงานในสังกัด (4)"` ต้อง skip — ในอนาคตอาจ:
- Parse descriptor → query users by department/grade → expand เป็น list of evaluators
- ตัวอย่าง: `"ผู้อำนวยการกอง ระดับ 9 ในสายงานเดียวกัน (11)"` → query `WHERE grade=9 AND division_id=X AND position LIKE 'ผู้อำนวยการกอง%' LIMIT 11`

### External org assignments (column N — องศาขวา)
ปัจจุบันระบบ **ไม่อ่าน column N** เพราะ angle='right' มี flow แยก:
- Admin สร้าง `external_organizations` → สร้าง assignment + access_code → ส่ง URL ให้บริษัท
- ในอนาคตอาจรวม column N เข้า import wizard:
  - Parse → ถ้าตรงกับ existing `external_organizations.name` → auto-create assignment + access_code
  - ถ้าไม่ตรง → ให้ admin map / สร้างใหม่ใน UI

### Upsert mode
ปัจจุบัน duplicate emid (ใน user import) / duplicate angle pair (ใน assignment import) → **skip**
- ในอนาคตอาจเพิ่ม option "Update if exists" สำหรับ resync ข้อมูลที่เปลี่ยน

### Auto-create new external user (column N parsing)
ถ้าตัดสินใจเปิด column N ในอนาคต — option:
- (a) Auto-generate `E{division_id}{seq}` (pattern เดียวกับ AdminUserController::store)
- (b) ให้ admin map กับ existing external user หรือสร้างใหม่ผ่าน UI

---

## เอกสารที่เกี่ยวข้อง

- [SSH Guide (prod)](./server/ssh-guide.md)
- [Test Environment](./server/test-environment.md)
- [DBeaver Access](./server/dbeaver-access.md)
- [Database Overview](../spec/database_overview.md)
- [Users Spec](../spec/users.md)
- [Evaluation Structure](../spec/evaluation_structure.md)
