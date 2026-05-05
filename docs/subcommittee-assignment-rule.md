# Subcommittee Assignment Rule

> Updated 2026-05-05

## Rule

**ใครที่เป็น "อนุกรรมการ" (subcommittee) จะประเมินเฉพาะ "ผู้ว่าการ" (governor) ในองศาซ้ายเท่านั้น**

ห้ามมี:
- top/bottom/right ของผู้ว่าการ
- ประเมินคนอื่นนอกจากผู้ว่าการ
- ประเมินตนเอง

## Why

อนุกรรมการเป็น stakeholder ภายนอกที่อยู่นอกสายงานบริหาร — ไม่ได้บังคับบัญชาผู้ว่าการ ดังนั้นต้องประเมินจากมุมเสมอภาค (ซ้าย) ไม่ใช่บนล่าง

## Identification

อนุกรรมการ resolve จาก `positions.title` ที่ match pattern หนึ่งใน:
- `LIKE '%อนุกรรมการ%'` — สะกดถูก เช่น "อนุกรรมการการเงิน งบประมาณและการลงทุน"
- `LIKE 'อนุก%การ%'` — รองรับ typo เช่น **"อนุกรรรมการด้านทรัพยากรบุคคล..."** (3 ร แทน 2 — ตำแหน่ง id=366 บน prod)

ผู้ว่าการ resolve จาก `positions.title = 'ผู้ว่าการ'` แล้ว lookup user

## Enforcement

### 1. One-shot migration: `php artisan assignments:fix-subcommittee`

`app/Console/Commands/FixSubcommitteeAssignments.php`

```bash
php artisan assignments:fix-subcommittee --fiscal-year=2026 [--dry-run]
```

ทำหน้าที่:
1. Resolve อนุกรรมการ user IDs (รวม typo position)
2. Resolve governor user
3. **DELETE** assignments ทุก row ที่ evaluator เป็น อนุกรรมการ AND (angle != 'left' OR evaluatee != governor)
4. **CREATE** (left, governor) assignment สำหรับ อนุกรรมการ ที่ยังขาด

Idempotent — รันซ้ำได้

### 2. Model guard — ป้องกัน creation ในอนาคต

`app/Models/EvaluationAssignment::booted()`

Hook `creating` event:
- ถ้า evaluator เป็น อนุกรรมการ AND (angle != 'left' OR evaluatee != governor) → return false (block save)
- Log warning ที่ stack channel

ครอบคลุมทุก path:
- Manual UI create (`/admin/assignments/create`)
- Bulk store
- Import from Excel
- Programmatic create

### 3. Cache

`isSubcommitteeUserId($userId)` + `governorUserId()` ใช้ `Cache::driver('array')` (per-request memory) → ไม่ persist, no flush needed

## Audit history

- 2026-05-04: รัน fix-subcommittee ครั้งแรก → 12 อนุกรรมการ (ตอนนั้น) ลบ top assignments 12 + เพิ่ม left ที่ขาด 2
- 2026-05-04: พบ duplicate กวิน (2 entries) → user dedup เหลือ emid 778899 (ตำแหน่ง "ที่ปรึกษา")
- 2026-05-05: พบ typo "อนุกร**ร**รมการ" (id=366) → 1 user (ฉัตรเฉลิม 332211) ตกหล่น → widen pattern → fix รอบ 2 ลบ top 1

## Out of scope

- ที่ปรึกษาประธานกรรมการ + กรรมการ + ประธานกรรมการ ไม่ถูกบังคับด้วย rule นี้ (ยังคง top/อื่นๆ ตามที่จัดไว้)
- ถ้าจะขยาย scope → แก้ pattern ใน `isSubcommitteeUserId()` + re-run command
