# การวิเคราะห์ข้อมูลในฐานข้อมูล

## ไฟล์ข้อมูลในโฟลเดอร์ `/database`

| ไฟล์ | คำอธิบาย | ขนาด |
|---|---|---|
| `u917560495_milesconsultdb.csv` | Full DB dump ทุกตารางในรูปแบบ CSV | ~235,000+ rows |
| `fromdb/u917560495_milesconsultdb.sql` | Full SQL dump จาก production server | - |
| `question/evaluations (1).sql` | Dump ตาราง evaluations | 6 records |
| `question/parts (1).sql` | Dump ตาราง parts | 14 records |
| `question/aspects (2).sql` | Dump ตาราง aspects | 28 records |
| `question/questions (1).sql` | Dump ตาราง questions | ~80 records |
| `question/options.sql` | Dump ตาราง options | ~500+ records |
| `question/answers (3).sql` | Dump ตาราง answers (ย่อย) | ~57,000 records |

> **หมายเหตุเรื่อง CSV**: ไฟล์ `u917560495_milesconsultdb.csv` เป็น full database export ที่รวมทุกตาราง (headers ของแต่ละตารางปนอยู่ในไฟล์) ไม่ใช่แค่ตาราง answers

---

## ปริมาณข้อมูลจริงในระบบ

### ตาราง `answers` (ข้อมูลหลักที่สำคัญที่สุด)

| มิติ | ค่า |
|---|---|
| จำนวน row ทั้งหมด (จาก CSV) | **~207,000–235,000 แถว** |
| Answer ID ต่ำสุด (จาก SQL dump) | 9,295 |
| Answer ID สูงสุด (จาก SQL dump) | 57,532+ |
| ผู้ประเมิน (evaluators) ที่ไม่ซ้ำกัน | ~1,239 คน |
| ผู้ถูกประเมิน (evaluatees) ที่ไม่ซ้ำกัน | ~1,470 คน |
| ช่วงเวลาที่บันทึกข้อมูล | กรกฎาคม – สิงหาคม 2025 |

### ตัวอย่างข้อมูล `answers`

```
id    | eval_id | question_id | user_id | evaluatee_id | value         | other_text
------|---------|-------------|---------|--------------|---------------|------------
9295  | 4       | 515         | 831     | 831          | "4"           | NULL       ← self-eval, rating
9318  | 4       | 538         | 831     | 831          | "4780"        | NULL       ← choice
9321  | 4       | 540         | 831     | 831          | "[4780,4781]" | NULL       ← multiple_choice
9326  | 4       | 550         | 831     | 831          | NULL          | "ข้อความ..." ← open_text
57335 | 5       | 579         | 438     | 438          | NULL          | "เมื่องานมีปัญหา..." ← open_text
57327 | 5       | 567         | 438     | 438          | "4889"        | NULL       ← choice
57329 | 5       | 569         | 438     | 438          | "[4898,4896]" | NULL       ← multiple_choice
```

---

## การวิเคราะห์ข้อมูลตาราง `evaluations`

### 6 แบบประเมินในระบบ

```
eval_id=1  → ประเมินผู้บริหาร 9-12 โดยคนอื่น (internal)
               ├─ part 1: 6 aspects × ~4 questions = 25 rating questions
               └─ part 2: 2 aspects (วัฒนธรรม) = 8 rating + 8 rating

eval_id=2  → ประเมินผู้บริหาร 9-12 โดย external
               ├─ part 4: 6 aspects = 18 rating questions
               └─ part 5: วัฒนธรรมองค์กร

eval_id=3  → ประเมินพนักงาน 5-8 โดยคนอื่น
               ├─ part 7: 4 aspects (IQ/EQ/AQ+TQ/Sustainability) = 13 rating
               └─ part 8: วัฒนธรรมองค์กร

eval_id=4  → ประเมินตนเองผู้บริหาร 9-12
               ├─ part 10: 6 aspects = 25 rating questions
               ├─ part 11: ความรู้ค่านิยม (choice/multiple_choice)
               └─ part 12: open_text

eval_id=5  → ประเมินตนเองพนักงาน 5-8
               ├─ part 63: 4 aspects = 13 rating questions
               ├─ part 64: ความรู้ค่านิยม (choice/multiple_choice)
               └─ part 65: open_text

eval_id=14 → แบบประเมินความพึงพอใจ (draft - ยังไม่ได้ใช้)
               └─ parts 66-68 ยังว่างเปล่า
```

---

## การวิเคราะห์ข้อมูลตาราง `questions`

### ประเภทคำถามและการกระจาย

```
rating          → ส่วนที่ 1 ทุก evaluation (ประเมินคะแนน 1-5)
choice          → ส่วนวัฒนธรรมองค์กร (ถามความรู้เกี่ยวกับค่านิยม)
multiple_choice → ส่วนวัฒนธรรมองค์กร (เลือกแหล่งรับรู้/ช่องทาง)
open_text       → ส่วนคำถามปลายเปิด (ยกตัวอย่างพฤติกรรม)
```

### ตัวอย่างคำถามสำคัญ

**Rating — ด้านความเป็นผู้นำ (eval 1, part 1, aspect 1):**
- q1: ผู้บริหารสามารถจัดทำแผนงานที่สอดคล้องกับวิสัยทัศน์และเป้าหมายองค์กรได้
- q4: ผู้บริหารสามารถกำหนดกลยุทธ์และนำไปปฏิบัติในสถานการณ์ที่เปลี่ยนแปลงได้อย่างเหมาะสม
- q5: ผู้บริหารสนับสนุนให้ทีมทำงานด้วยความทุ่มเทและมุ่งมั่น
- q6: ผู้บริหารแสดงให้เห็นถึงความสามารถในการแก้ไขปัญหาภายใต้สถานการณ์ที่มีข้อจำกัด

**Choice — ความรู้ค่านิยม (eval 4, part 11, aspect 66):**
- q538: ค่านิยมใหม่ของ กนอ. (ภาษาไทย) คือ
- q539: ค่านิยมใหม่ของ กนอ. (ภาษาอังกฤษ) คือ
- q540: ท่านรับรู้ข้อมูลค่านิยม กนอ. จากใคร (multiple_choice)
- q541: ท่านรับรู้ข้อมูลค่านิยมจากช่องทางใดบ้าง (multiple_choice)

**Open Text — ปลายเปิด (eval 4, part 12, aspect 90):**
- q550: จงยกตัวอย่างพฤติกรรมที่พึงประสงค์ของค่านิยมหัวข้อ "เก่งงาน AQ"

---

## การวิเคราะห์ข้อมูล `evaluation_assignments`

### โครงสร้าง Assignment

```
ผู้บริหาร grade 9-12 จะถูกประเมินด้วย:
  - eval 1 (internal): โดยผู้ใต้บังคับบัญชา (bottom) / เพื่อนร่วมงาน (left/right)
  - eval 2 (external): โดยบุคลากรภายนอก
  - eval 4 (self): โดยตนเอง

พนักงาน grade 5-8 จะถูกประเมินด้วย:
  - eval 3: โดยผู้บังคับบัญชา (top) / เพื่อนร่วมงาน (left/right)
  - eval 5 (self): โดยตนเอง
```

### ตัวอย่าง Assignment Data

```
id    | eval_id | evaluator_id | evaluatee_id | fiscal_year | angle
8204  | 1       | 411          | 412          | 2025        | bottom
8205  | 1       | 411          | 413          | 2025        | bottom
...
```

---

## ไฟล์ CSV หลัก — `u917560495_milesconsultdb.csv`

### โครงสร้าง
ไฟล์นี้เป็น **Full Database Dump ในรูป CSV** ที่รวมทุกตาราง (ไม่ใช่แค่ answers):
- Header row ของแต่ละตารางจะปนอยู่ในไฟล์
- ลำดับคอลัมน์แต่ละตารางต่างกัน

### Header แถวแรก (ตาราง answers):
```
"id","evaluation_id","question_id","user_id","evaluatee_id","value","other_text","created_at","updated_at"
```

### ตารางที่พบในไฟล์ CSV นี้:
- answers (ส่วนใหญ่)
- users
- evaluations
- questions
- aspects
- parts
- evaluation_assignments
- sessions / jobs / personal_access_tokens

### สถิติ (จาก Python parsing):
- Total rows parse ได้: **207,743 rows** (บางส่วน encoding error จากภาษาไทย)
- Unique user_ids พบในคอลัมน์ที่ 4: **1,239 IDs**
- Unique evaluatee_ids พบในคอลัมน์ที่ 5: **1,518 IDs**

---

## สรุปภาพรวมข้อมูลในระบบ

| ตาราง | จำนวนข้อมูลโดยประมาณ |
|---|---|
| divisions | 7 |
| departments | ~50–100 |
| positions | ~200–400 |
| factions | ~20–50 |
| users | ~1,000–1,200+ |
| evaluations | 6 (5 published, 1 draft) |
| parts | 14 |
| aspects | 28 |
| sub_aspects | 0 (ยังไม่ได้ใช้) |
| questions | ~80 |
| options | ~500+ |
| evaluation_assignments | 8,200+ |
| answers | **207,000–235,000** |
| satisfaction_evaluations | ไม่ทราบ (draft) |
