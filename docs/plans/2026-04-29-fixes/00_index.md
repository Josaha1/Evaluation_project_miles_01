# Fixes Session — 2026-04-29

> งานปรับแก้ทั้งหมดที่ทำในวันที่ 2026-04-29 รอบเดียวกับการเริ่มใช้งานปีงบประมาณ 2026 (พ.ศ. 2569)
> Code deploy: prod (`/var/www/evaluation`) + test (`/var/www/evaluation-test`)

## ลำดับเอกสาร

| # | หัวข้อ | ไฟล์ |
|---|---|---|
| 1 | Excel Assignment Import — fuzzy-match bug + sub-columns | [01_import_fuzzy_subcols.md](./01_import_fuzzy_subcols.md) |
| 2 | Admin Assignments search — เปลี่ยนเป็น evaluatee-centric | [02_admin_assignments_search.md](./02_admin_assignments_search.md) |
| 3 | Dashboard — แสดง "ประเมินผู้ว่าการ" + ลบ self-eval gate + กรอง self ออกจาก target | [03_dashboard_fixes.md](./03_dashboard_fixes.md) |
| 4 | Assigned Evaluation — uncheck answer (toggle) | [04_assigned_eval_uncheck.md](./04_assigned_eval_uncheck.md) |
| 5 | Self-eval form alignment — assignment + answer migration | [05_self_eval_form_alignment.md](./05_self_eval_form_alignment.md) |
| 6 | Governor form clone — eval 33 (fy=2025) → eval 41 (fy=2026) | [06_governor_form_clone.md](./06_governor_form_clone.md) |
| 7 | Export — fiscal_year-aware evaluation lookup | [07_export_fy_lookup.md](./07_export_fy_lookup.md) |
| 8 | DB cleanup — corrupted answers in fy=2026 | [08_db_cleanup.md](./08_db_cleanup.md) |

## ผลรวม

### Code (deploy ทั้ง prod + test)
- `app/Http/Controllers/AdminEvaluationAssignmentController.php` — search by evaluatee
- `app/Http/Controllers/EvaluationAssignmentController.php` — exclude self from target list
- `app/Http/Controllers/AssignedEvaluationController.php` — null value → delete answer row
- `app/Http/Controllers/AdminEvaluationReportController.php` — fy-aware grade lookup
- `app/Services/AssignmentImportService.php` — strict fuzzy match + read angle ranges
- `app/Services/EvaluationExportService.php` — fy-aware summary sheet lookup
- `resources/js/pages/Dashboard.tsx` — ลบ self-eval gate
- `resources/js/components/{MultiEvaluatee,Evaluatee}*Card.tsx`, `QuestionCard.tsx` — toggle answer
- `scripts/clone_eval_form.php` — utility สำหรับ clone evaluation form ข้ามปี

### Database (prod + test)
- เพิ่ม `evaluations.id=41` (governor regular fy=2026, clone จาก eval 33)
- ลบ assignment fuzzy-mismatch 2 row
- เพิ่ม assignment 13 row (ผช.ผวก. + เลขา → governor 1042 angle=bottom)
- Migrate self assignments + self answers ไป eval ที่ถูกต้อง
- Migrate governor non-self assignments → eval 41
- ลบ corrupted answers (mismatch + orphan) ใน fy=2026: prod 130 row, test 232 row

### Backup tables ที่สร้างขึ้น (prod + test เหมือนกัน)
- `_backup_assignments_20260429` (2 row จากการลบ fuzzy mismatch ตอนแรก)
- `_backup_assignments_fix_20260429` (660+ row จาก migration)
- `_backup_answers_fix_20260429` (39–907 row)
- `_backup_answers_corrupt_20260429` (130–232 row จาก cleanup)

### Code backup (file system, prod)
- `/var/backups/code-20260429-060112/` — initial code backup
- `/var/backups/EvaluationAssignmentController-evaluation-*.php.bak`
- `/var/backups/EvaluationExportService-evaluation-*.php.bak`
- `/var/backups/AdminEvalRpt-evaluation-*.php.bak`
- `/var/backups/build-evaluation-*.tar.gz`
