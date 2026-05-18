# Deploy History

ประวัติ deploy + backup สำหรับ rollback

## ไฟล์ในโฟลเดอร์

| ไฟล์ | ช่วง |
|---|---|
| [2026-05.md](./2026-05.md) | พฤษภาคม 2569 — stakeholder cross-group, assignments bridge, evaluator-pivot export, subcommittee rule, colored annotations |

## Deploy recipes

อยู่ที่ `../server/ssh-guide.md` — วิธีที่ 1 (backend), วิธีที่ 2 (frontend), วิธีที่ 3 (full deploy)

## Backup location

VPS: `/var/backups/`
- `evaluation-code-{stamp}.tar.gz` — code snapshot
- `evaluation_db-{stamp}.sql` — full DB dump
- `evaluation_db-{purpose}-{stamp}.sql` — purpose-scoped dump (เช่น `subcomm-ea-`, `redrow-ea-`, `coloredapply-`)
