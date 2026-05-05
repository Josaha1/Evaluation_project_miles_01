# Stakeholder Organization-Name Normalization

> Updated 2026-05-05

## Problem

ตอน user ค้นชื่อบริษัทใน Step 2 ของ external login เห็น **entry ซ้ำ 2 อัน** สำหรับบริษัทเดียวกัน เช่น:
- "บริษัท เอสซีจี เซรามิกส์ จำกัด**(มหาชน)**" — Excel ไฟล์ A (no space)
- "บริษัท เอสซีจี เซรามิกส์ จำกัด **(มหาชน)**" — Excel ไฟล์ B (with space)

Dedup เดิมใช้แค่ `trim(mb_strtolower(...))` → trim หัวท้ายเท่านั้น → space ภายในยังต่าง → คนละ key

## Solution

`ExternalStakeholder::normalizeName()` — lowercase + ลบ whitespace ทั้งหมด

```php
public static function normalizeName(?string $name): string
{
    if (! $name) return '';
    return preg_replace('/\s+/u', '', mb_strtolower(trim($name)));
}
```

ใช้สำหรับเปรียบเทียบเท่านั้น **ไม่ใช่สำหรับเก็บ DB** — `organization_name` ใน DB ยังเก็บค่าดั้งเดิมจาก Excel

## Apply ที่ไหน

### PHP-side
- `verify()` groupBy key ตอน dedup stakeholders ใน Step 2

### SQL-side
ใช้ pattern (portable MySQL + sqlite):
```sql
LOWER(REPLACE(REPLACE(REPLACE(organization_name, ' ', ''), CHAR(9), ''), CHAR(10), ''))
```

จุดที่ apply (`ExternalEvaluatorController.php`):
- L89 — `verify()` cross-group preview lookup
- L207 — `login()` related_codes resolution
- L237 — `login()` starting unsubmitted evaluatee
- L300 — `login()` session linking
- L464 — `showDashboard()` whereExists pivot filter
- L485 — `showDashboard()` sessions for org
- L642 — `selectEvaluatee()` session linking on switch

## Why REPLACE chain instead of REGEXP_REPLACE

MySQL 8.0+ มี `REGEXP_REPLACE` แต่ sqlite (test memory DB) ไม่มี → tests fail

`REPLACE(REPLACE(REPLACE(..., ' ', ''), CHAR(9), ''), CHAR(10), '')` ครอบคลุม:
- ASCII space (0x20)
- Tab (CHAR(9))
- LF (CHAR(10))

ครอบคลุม whitespace ปกติ — ไม่ครอบ unicode whitespace แปลกๆ (เช่น ` ` non-breaking space) แต่ใน Thai company names แทบไม่มี

PHP-side `preg_replace('/\s+/u', '', ...)` ครอบ unicode whitespace ทั้งหมด → ถ้ามี unicode space ใน DB จะ match key PHP แต่ SQL ไม่ — minor edge case

## Trade-offs

**False positive (รวมที่ไม่ควรรวม):**
- "บริษัท ก ข ค" vs "บริษัทกขค" → match — แต่บริษัทแบบนี้แทบไม่มีในไทย
- ชื่อยาว 100+ ตัวอักษรเหมือนกันทุกตัวยกเว้น space → match ในทางปฏิบัติยังดีกว่า miss

**False negative (ควรรวมแต่ไม่):**
- typo (เช่น "เอสซิ" vs "เอสซี") — ยังไม่ match → ต้อง alias table (Phase 2)
- "บริษัท X จำกัด" vs "บจก. X" — ยังไม่ match → Phase 2

## Phase 2 (out of scope ตอนนี้)

- Admin alias UI สำหรับ map ชื่อต่างๆ → canonical organization_id
- Reconciliation page ให้ admin verify match ก่อน import
