# /admin/assignments — Bridge + Export + Apply

หน้าจัดการการมอบหมายผู้ประเมิน-ผู้ถูกประเมิน

## ไฟล์ในโฟลเดอร์

| ไฟล์ | เรื่อง |
|---|---|
| [stakeholder-bridge.md](./stakeholder-bridge.md) | Bridge `external_stakeholders` → /admin/assignments เป็น synthetic right-angle (UI-only) + EvaluatorListCell "see more" |
| [evaluator-pivot-export.md](./evaluator-pivot-export.md) | Export Excel: 1 row = 1 ผู้ประเมิน, columns = แบบประเมิน, cell = รายชื่อ + ระดับ + สายงาน |
| [colored-annotations-apply.md](./colored-annotations-apply.md) | อ่านสี Red/Yellow/Green จาก Excel ที่ทีม annotate → apply เปลี่ยน assignments อัตโนมัติ (TDD + 15 Pest cases) |

## Routes

- `GET /admin/assignments` — manager page
- `GET /admin/assignments/export` — evaluator-pivot Excel
- ไม่มี API route สำหรับ apply colored — ใช้ artisan-style script ผ่านบรรทัดคำสั่ง
