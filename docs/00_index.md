# Documentation Index — ระบบประเมิน 360 องศา กนอ.

> **วันที่สร้าง**: 2026-02-23
> **ฐานข้อมูล**: `milesconsultdb` (MariaDB 10.4)
> **Framework**: Laravel + React (Inertia.js)

---

## สารบัญ

| ไฟล์ | หัวข้อ | คำอธิบาย |
|---|---|---|
| [01_system_overview.md](./01_system_overview.md) | ภาพรวมระบบ | Stack, โครงสร้าง App, Roles, Flow หลัก |
| [02_database_schema.md](./02_database_schema.md) | Database Schema | ทุกตาราง + columns + constraints + ข้อมูลจริง |
| [03_database_data_analysis.md](./03_database_data_analysis.md) | วิเคราะห์ข้อมูล | ปริมาณข้อมูล, ไฟล์ CSV/SQL, สถิติ |
| [04_routes_and_controllers.md](./04_routes_and_controllers.md) | Routes & Controllers | ทุก Route, Controllers, Services |
| [05_evaluation_flow.md](./05_evaluation_flow.md) | กระบวนการประเมิน | 5 ขั้นตอน Setup→Assignment→Eval→Report→Satisfaction |
| [06_report_and_export_system.md](./06_report_and_export_system.md) | ระบบรายงาน & Export | Export types, Excel structure, API endpoints |
| [07_frontend_pages.md](./07_frontend_pages.md) | Frontend Pages | React pages, components, Inertia.js data flow |
| [08_evaluation_content.md](./08_evaluation_content.md) | เนื้อหาแบบประเมิน | คำถามทุกข้อแยกตาม evaluation |
| [09_migrations_history.md](./09_migrations_history.md) | Migration History | ลำดับ migration + timeline การพัฒนา |
| [10_key_queries.md](./10_key_queries.md) | Key SQL Queries | Query สำคัญ 10 ข้อสำหรับรายงาน/วิเคราะห์ |
| [11_admin_management_system.md](./11_admin_management_system.md) | ระบบจัดการโครงสร้างองค์กร | CRUD Division, Department, Position, Faction |

---

## Quick Reference

### ตาราง 5 อันดับแรกที่สำคัญที่สุด

| ตาราง | บทบาท | ข้อมูลที่มี |
|---|---|---|
| `answers` | **หัวใจหลัก** — เก็บคำตอบทั้งหมด | ~207,000+ แถว |
| `evaluation_assignments` | กำหนดว่าใครประเมินใคร | 8,200+ แถว |
| `users` | ข้อมูลพนักงาน | ~1,200+ คน |
| `questions` | คำถามทั้งหมด | ~80 ข้อ |
| `evaluations` | แบบประเมิน | 9 แบบ |

### Evaluation IDs ที่สำคัญ

| ID | ชื่อย่อ | ใช้กับ |
|---|---|---|
| 1 | 360 Internal Exec | ผู้บริหาร 9-12 (โดยคนอื่น, internal) |
| 2 | 360 External Exec | ผู้บริหาร 9-12 (โดย external) |
| 3 | 360 Employee | พนักงาน 5-8 (โดยคนอื่น) |
| 4 | Self Exec | ผู้บริหาร 9-12 (ประเมินตนเอง) |
| 5 | Self Employee | พนักงาน 5-8 (ประเมินตนเอง) |
| 14 | Satisfaction | ความพึงพอใจระบบ (draft) |
| 15* | 360 Internal Governor | ผู้ว่าการ ระดับ 13 (โดยคนอื่น, internal) |
| 16* | 360 External Governor | ผู้ว่าการ ระดับ 13 (โดย external) |
| 17* | Self Governor | ผู้ว่าการ ระดับ 13 (ประเมินตนเอง) |

> \* ID 15-17 จะถูกสร้างอัตโนมัติผ่าน GovernorEvaluationSeeder (ID จริงอาจแตกต่างตาม auto_increment)

### Angles

| angle | ความหมาย |
|---|---|
| `top` | ผู้บังคับบัญชา → ผู้ใต้บังคับบัญชา |
| `bottom` | ผู้ใต้บังคับบัญชา → ผู้บังคับบัญชา |
| `left` | เพื่อนร่วมงาน / peer |
| `right` | Cross-functional |
| *(self)* | evaluator_id = evaluatee_id |

### Grade Ranges

| กลุ่ม | Grade | Evaluations |
|---|---|---|
| ผู้ว่าการ | 13 | eval 15*, 16*, 17* |
| ผู้บริหาร | 9–12 | eval 1, 2, 4 |
| พนักงาน | 5–8 | eval 3, 5 |

---

## ไฟล์ข้อมูลในโฟลเดอร์ `/database`

```
database/
├── u917560495_milesconsultdb.csv    ← Full DB dump (CSV, ทุกตาราง)
├── fromdb/
│   └── u917560495_milesconsultdb.sql ← Full SQL dump (production)
├── question/
│   ├── evaluations (1).sql           ← 6 evaluations
│   ├── governor_evaluations.sql     ← 3 governor evaluations (grade 13)
│   ├── parts (1).sql                 ← 14 parts
│   ├── aspects (2).sql               ← 28 aspects
│   ├── questions (1).sql             ← ~80 questions
│   ├── options.sql                   ← ~500+ options
│   └── answers (3).sql              ← ~57,000 answers (ย่อย)
├── migrations/                       ← 21 migration files
├── seeders/
└── factories/
```
