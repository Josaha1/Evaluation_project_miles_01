# Business Rules

กฎเชิงธุรกิจที่ต้อง enforce ผ่าน model events / migrations / artisan commands

## ไฟล์ในโฟลเดอร์

| ไฟล์ | เรื่อง |
|---|---|
| [subcommittee-rule.md](./subcommittee-rule.md) | อนุกรรมการ → ผู้ว่าการ left only + tolerant ของ typo position + model guard + idempotent migration command |

## Artisan commands

- `php artisan assignments:fix-subcommittee --fiscal-year=YYYY [--dry-run]` — เคลียร์ assignments ของอนุกรรมการให้ตรงกฎ
