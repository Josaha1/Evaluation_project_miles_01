# Excel Assignment Import — Fuzzy Match Bug + Sub-Columns

## ปัญหา

### 1. Fuzzy match จับคนนอก → user ภายในผิดคน

ไฟล์ `ผู้ว่าการ กนอ. ( มี.ค. 69)(1) (issue).xlsx` มีรายชื่อ "กรรมการ กนอ." (board) ซึ่งเป็น **คนนอก** ไม่อยู่ใน users table แต่ผู้ใช้ภายในบางคนบังเอิญมี fname ตรงกัน

`AssignmentImportService::findUserFuzzy()` มี fallback "match จาก fname อย่างเดียว ถ้า unique" → จับคู่ผิด:

| Excel "องศาบน" | Match ผิดเป็น | DB row |
|---|---|---|
| `นายเอกภัทร วังสุวรรณ กรรมการ` | user 544 = `เอกภัทร ตั้งคงสถิตย์` (grade 9) | 31052 angle=top |
| `นายธันยพร สุนทรธรรม อนุกรรมการ` | user 983 = `ธันยพร อัศวทองชัย` (grade 6) | 31060 angle=left |

### 2. Sub-columns ไม่ถูกอ่าน

ไฟล์ผู้ว่าการมี layout พิเศษ — header ของ angle อยู่แค่คอลัมน์แรกของกลุ่ม คอลัมน์ที่เหลือไม่มี header แต่ยังเป็น angle เดียวกัน:

```
row1:  | องศาบน | (none) | องศาล่าง | (none) | (none) | องศาซ้าย | (none) | องศาขวา |
        G        H        I          J        K        L          M        N
        board    advisors deputies   assists  secret   subcomm    minist   external
```

`detectColumns()` จับเฉพาะคอลัมน์ที่มี exact-match header text → คอลัมน์ H, J, K, M ถูกข้าม → assignments หาย ~30 ราย (ที่ปรึกษา 7, ผช.ผวก. 8, เลขา 5, กระทรวง 12)

ไฟล์อื่นทุกไฟล์ (ผอ. 10, 9, 11, 12, พนักงาน 5-8, เลขา) **ไม่มี** sub-columns issue — header ของแต่ละ angle ติดกันทุกคอลัมน์

## Root Cause

`app/Services/AssignmentImportService.php`:
- `findUserFuzzy()` step 3 + 5: fname-only fallback ทำงานทุกครั้งที่ unique → match คนนอกผิด
- `parseFile()` อ่านแค่คอลัมน์เดียวต่อ angle ตามที่ `detectColumns()` คืน

## Fix

### Code

**1. `findUserFuzzy()` — strict matching เมื่อมี lname**
```php
// ลบ fname-only fallback เมื่อ input มี ≥ 2 parts (มี lname บอกว่าเป็นคนละคน)
if (count($parts) >= 2) {
    // try fname+parts[1], fname+parts[last], fname+middle pairs
    // → return null if all fail (admin map ใน UI ภายหลัง)
}
// คง fname-only fallback ไว้เฉพาะ input คำเดียว
if (count($parts) === 1) { ... }
```

**2. `HEADER_KEYS` + `readAngleRange()` — รวมคอลัมน์ในช่วง angle เดียว**
```php
private const HEADER_KEYS = [
    ...,
    'right' => ['องศาขวา'],  // ใช้เป็น boundary marker เท่านั้น (ไม่ import)
];

// อ่านทุกคอลัมน์จาก start ของ angle ปัจจุบัน → ถึงคอลัมน์ก่อนหน้า angle ถัดไป
private function readAngleRange($sheet, $cols, $angle, $row): string {
    [start, end] = หา range จาก next-angle column - 1
    return implode("\n", cells in start..end)
}
```

ผลลัพธ์: Governor file → top: G+H, bottom: I+J+K, left: L+M (right: N ถูกข้ามตามเดิม)

### DB Cleanup

| Row | Action |
|---|---|
| `evaluation_assignments.id=31052` (test), `19482` (prod) | DELETE — fuzzy match ผิด |
| `evaluation_assignments.id=31060` (test), `19490` (prod) | DELETE — fuzzy match ผิด |
| INSERT 13 ราย (ผช.ผวก. 8 + เลขา 5) → angle=bottom | คนที่ควรถูก import แต่ถูกข้ามเพราะ sub-columns |

## Verify

ลอง import file ผู้ว่าการอีกครั้ง → ตอนนี้ readAngleRange จะอ่านครบทุก sub-column และ fuzzy match จะไม่ map คนนอกที่ไม่ตรง lname

## Files

- `app/Services/AssignmentImportService.php` — code fix (lines 22-26, 143-147, 365-405, 437-465)
- Test: 9/9 PASS — `tests/Feature/Evaluation/AssignedEvaluationTest.php`
