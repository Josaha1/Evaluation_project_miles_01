# Migration History

## ลำดับ Migration ทั้งหมด

| ไฟล์ Migration | ตารางที่สร้าง | วันที่ |
|---|---|---|
| `2014_10_12_000000_create_users_table.php` | `users` | 2014-10-12 |
| `2014_10_12_100000_create_password_reset_tokens_table.php` | `password_reset_tokens` | 2014-10-12 |
| `2019_08_19_000000_create_failed_jobs_table.php` | `failed_jobs` | 2019-08-19 |
| `2019_12_14_000001_create_personal_access_tokens_table.php` | `personal_access_tokens` | 2019-12-14 |
| `2025_04_04_000001_create_evaluations_table.php` | `evaluations` | 2025-04-04 |
| `2025_04_04_000002_create_parts_table.php` | `parts` | 2025-04-04 |
| `2025_04_04_000004_create_aspects_table.php` | `aspects` | 2025-04-04 |
| `2025_04_04_000005_create_sub_aspects_table.php` | `sub_aspects` | 2025-04-04 |
| `2025_04_04_000006_create_questions_table.php` | `questions` | 2025-04-04 |
| `2025_04_04_000007_create_options_table.php` | `options` | 2025-04-04 |
| `2025_04_07_223219_create_evaluation_assignments_table.php` | `evaluation_assignments` | 2025-04-07 |
| `2025_04_20_124322_add_status_to_evaluations_table.php` | ALTER `evaluations` | 2025-04-20 |
| `2025_04_22_143728_create_answers_table.php` | `answers` | 2025-04-22 |
| `2025_04_28_101804_create_divisions_table.php` | `divisions` | 2025-04-28 |
| `2025_04_28_101827_create_departments_table.php` | `departments` | 2025-04-28 |
| `2025_04_28_101845_create_positions_table.php` | `positions` | 2025-04-28 |
| `2025_05_07_153428_create_cache_table.php` | `cache`, `cache_locks` | 2025-05-07 |
| `2025_05_07_153526_create_sessions_table.php` | `sessions` | 2025-05-07 |
| `2025_06_12_111609_create_factions_table.php` | `factions` | 2025-06-12 |
| `2025_06_12_121341_create_jobs_table.php` | `jobs` | 2025-06-12 |
| `2025_07_18_000001_create_satisfaction_evaluations_table.php` | `satisfaction_evaluations` | 2025-07-18 |

---

## Timeline การพัฒนา

```
2025-04-04  → สร้างโครงสร้างแบบประเมิน (evaluations, parts, aspects, sub_aspects, questions, options)
2025-04-07  → เพิ่มระบบ assignment
2025-04-20  → เพิ่ม status field ใน evaluations
2025-04-22  → สร้าง answers table (เก็บคำตอบ)
2025-04-28  → เพิ่มโครงสร้างองค์กร (divisions, departments, positions)
2025-05-07  → เพิ่ม cache + sessions (ย้ายจาก file-based)
2025-06-12  → เพิ่ม factions + background jobs
2025-07-18  → เพิ่ม satisfaction_evaluations (แบบสอบถามความพึงพอใจ)
```

---

## หมายเหตุการออกแบบ

### ทำไมถึงเพิ่ม `divisions`, `departments`, `positions` ทีหลัง?
- เริ่มต้นระบบใช้ข้อมูล organizational structure แบบ simple
- เพิ่ม 3 ตารางนี้เมื่อ 2025-04-28 เพื่อรองรับการกรองรายงานตามสายงาน/หน่วยงาน

### ทำไม `factions` มาหลังสุด?
- เพิ่มเมื่อ 2025-06-12 เพื่อรองรับการจัดกลุ่ม cross-cutting teams

### การออกแบบ `answers.value` เป็น text
- รองรับหลายรูปแบบ: string, JSON array, open text
- ยืดหยุ่นกว่าการแยกหลาย columns
- ต้อง parse ใน application layer

### ไม่มี `evaluation_id` ใน `questions` โดยตรง
- Questions join ผ่าน `part_id → parts.evaluation_id`
- ทำให้ structure ยืดหยุ่น (1 question อยู่ใน 1 part เท่านั้น)

### `sub_aspects` ยังไม่ได้ใช้งานจริง
- `has_subaspects = 0` ทุก aspect ในข้อมูลจริง
- Table พร้อมสำหรับใช้งานในอนาคต
