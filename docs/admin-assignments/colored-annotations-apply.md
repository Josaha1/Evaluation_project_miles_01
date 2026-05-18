# Apply Colored Annotations from Excel Export

> Updated 2026-05-05

## Why

ทีมงานใช้ไฟล์ส่งออก `รายชื่อผู้ประเมิน_พศ2569_*.xlsx` (จาก `/admin/assignments → ส่งออก Excel`) แล้ว highlight สีในเซลล์เพื่อระบุการเปลี่ยนแปลง:

| สี | ตำแหน่ง | ความหมาย |
|---|---|---|
| 🔴 Fill `#FF0000` ทั้ง row | row | **ลบ evaluator ทั้งคน** — ลบ assignments fy=2026 ทุก row |
| 🔴 Font `#FF0000` ในเซลล์ | text run ในเซลล์ | **ลบ evaluatee เฉพาะ** ออกจาก evaluator นั้น |
| 🟡 Font `#FFFF00` ในเซลล์ | text run | **Duplicate angle** — เก็บ row ที่ angle ตามกฎ ลบ row อื่น |
| 🟢 Font `#00B050` ในเซลล์ | text run | **เพิ่ม evaluatee** ใหม่ภายใต้ evaluator นั้น |

ตัวเลข total ครั้งล่าสุด (5 พ.ค. 2569):
- 6 evaluators ลบทั้งคน
- 56 specific (evaluator, evaluatee) pairs ลบ
- 1 duplicate angle dedup
- 218 pairs ใหม่ → insert 151 (67 มีอยู่แล้ว)

## Service: `App\Services\ApplyColoredAnnotationsService`

### `parseLine(string $line): ?string`
Strip leading ordinal/dash (`"1. "`, `"- "`) + trailing details (`" · ระดับ 4 · ..."`, `" ผอ.กอง..."`, `" (1)"`) — เหลือเฉพาะ prename + fname + lname

### `findUserExact(string $name, Collection $users): ?User`
**Strict match** — normalize `lowercase + strip whitespace` แล้วเทียบกับ `prename+fname+lname` (3 รูปแบบ space variant) → return user **เฉพาะถ้า match เป็น 1 คนเดียว** (ambiguous → null)

มี alias table สำหรับ spelling variants ที่ต้อง override:
```php
private const NAME_ALIASES = [
    'นางสาวศิริรัตน์เกลี้ยง' => '361032',  // actual: ภู่เกลี้ยง
];
```

### `computeAngle(?int $evGrade, ?int $eeGrade, ?string $evType): string`
| Condition | Angle |
|---|---|
| evType = `external`/`external_org` | `right` |
| evGrade > eeGrade | `top` (boss → subordinate) |
| evGrade < eeGrade | `bottom` |
| evGrade == eeGrade | `left` |

### `applyRedRows(array $emids, int $fy, bool $dryRun)`
DELETE all evaluation_assignments WHERE evaluator's emid in `$emids` AND fy.

### `applyYellowDedup(array $pairs, int $fy, bool $dryRun)`
สำหรับแต่ละ `[evaluator_id, evaluatee_id]` หาก DB มี > 1 row ในปีนั้น → เก็บ row ที่ angle ตรงตามกฎ ลบที่เหลือ.

### `applyGreenAdds(array $rows, int $fy, bool $dryRun)`
INSERT (evaluator, evaluatee, angle, evaluation_id) — angle resolve อัตโนมัติ; skip ถ้ามีอยู่แล้ว; skip ถ้า model guard block (อนุกรรมการ → non-governor).

### `scanFile(string $filePath): array`
อ่าน xlsx → return `['red_rows', 'red_runs', 'green_runs', 'yellow_runs']`. ใช้ PhpSpreadsheet `getRichTextElements()` ดู font color ของแต่ละ run ในเซลล์ + `getFill()` ของทั้งเซลล์.

## Tests

`tests/Feature/ApplyColoredAnnotationsServiceTest.php` — **15 cases**:
- parseLine: numbered/dash/empty/plain
- findUserExact: match / whitespace-tolerant / no-match / ambiguous
- computeAngle: 4 cases
- applyRedRows: delete + dry-run
- applyYellowDedup: dedup correct angle

## Workflow

```
1. ทีมส่งออก Excel จาก /admin/assignments
2. ทีม annotate สีในไฟล์ (red/yellow/green)
3. Run scanFile + apply → backup + execute on test
4. Verify (compare DB ↔ Excel)
5. Apply on prod
```

## Apply audit (2026-05-05)

| Phase | Test deleted | Test inserted | Prod deleted | Prod inserted |
|---|---|---|---|---|
| Red row (6 evaluators) | 15 | — | 14 | — |
| Red runs (specific pairs) | 56 | — | 56 | — |
| Yellow dedup | 1 | — | 1 | — |
| Green adds | — | 151 | — | 151 |

**Backup files:**
- `/var/backups/evaluation_db-redrow-ea-{stamp}.sql`
- `/var/backups/{db}-ea-coloredapply-{stamp}.sql`

**Verification post-apply:**
- 0 red row residuals
- 0 red run residuals
- 0 green missing
- 0 yellow remaining duplicates

## Limitations

- ชื่อใน Excel ที่ม่ลำต่างเล็กน้อย (เช่น "ภู่เกลี้ยง" vs "เกลี้ยง") — ต้องเพิ่ม alias manually
- Angle ที่ใช้คำนวณจาก grade เท่านั้น — ไม่ได้พิจารณา reporting hierarchy จริง
- ถ้า cell มี mid-line " - " separator ระหว่าง 2 ชื่อ → parser แยกได้ แต่ format อื่นๆ อาจ miss
