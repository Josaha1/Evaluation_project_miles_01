# Deploy History — 2026-05

> Notable deploys + rollbacks สำหรับ session พฤษภาคม 2569

## Backups

| Stamp | What |
|---|---|
| `20260504-010340` | ก่อน Stakeholder import deploy รอบแรก (1:03 น.) |
| `20260504-045350` ... `20260504-084506` | ระหว่าง iteration วันที่ 4 (5 backups วน rollback ไปมา) |
| `20260504-092520` | ก่อน sync prod กับ test (cross-group ฟีเจอร์ deploy) |
| `20260504-100108` | ก่อน Assignments bridge + EvaluatorListCell |
| `20260504-102237` | ก่อน "see more" cell deploy |
| `20260504-173100` | ก่อน evaluator-centric export (v1) |
| `20260504-174459` | DB-only — ก่อน fix-subcommittee รอบแรก |
| `20260505-030843` | ก่อน hide self-eval columns ใน export |
| `20260505-031144` | DB-only — ก่อน fix-subcommittee รอบ 2 (typo position) |
| `20260505-033916` | ก่อน whitespace-tolerant org match |

Path: `/var/backups/evaluation-code-*.tar.gz` + `evaluation_db-*.sql`
Rollback recipe: `docs/server/ssh-guide.md` Rollback section

## Composer.lock fix

Local `composer.lock` ระบุ Laravel 12.3.0 (มี bug `Call to a member function make() on null` ใน Console/Command::run()) แต่ vendor local เป็น 12.53.0
หลัง deploy → composer install ดึง 12.3.0 ตาม lock → artisan ทุก command พัง

แก้: `composer require laravel/framework:"^12.50" --update-with-all-dependencies` → ได้ 12.58.0 → redeploy ครบ

## Backup script gap

Backup tarball ของ ssh-guide method 3 backup `public_html/build/` ทั้ง folder แต่บางครั้ง `build/assets/` ถูก clear ก่อน backup → manifest อ้างถึงไฟล์ที่ไม่มีจริง → 404

Workaround: หลัง rollback ถ้า 404 build assets → upload `build_full.tar.gz` ของ local มา extract ใหม่

## Subcommittee fix audit

| Run | Fy | Subs found | Removed top | Added left |
|---|---|---|---|---|
| 1 (5/4) | 2026 | 12 | 12 | 2 |
| 2 (5/4) | 2026 | 10* | 0 | 0 |
| 3 (5/5 — typo fix) | 2026 | 11** | 1 (ฉัตรเฉลิม) | 0 |

*หลัง dedup กวิน เหลือ 10 อนุกรรมการ
**หลัง widen pattern จับ typo position 366 — เพิ่ม 1 user

## Test environment

Test = `/var/www/evaluation-test` + `evaluation_db_test`
Prod = `/var/www/evaluation` + `evaluation_db`

Sync schema same. Test data ~982 stakeholder rows / 539 distinct orgs / 6 access codes / 44 multi-group orgs

## Related

- `docs/server/ssh-guide.md` — deploy + rollback recipes
- `docs/server/test-environment.md` — test env setup
