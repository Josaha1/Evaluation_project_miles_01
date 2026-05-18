# 📂 Server Documentation

เอกสารทุกอย่างเกี่ยวกับ infrastructure / server / DB access

## 📋 ในโฟลเดอร์นี้

| ไฟล์ | เนื้อหา |
|---|---|
| [ssh-guide.md](./ssh-guide.md) | คู่มือ SSH เข้า VPS, โครงสร้างไฟล์, deploy, log, rollback, troubleshooting |
| [test-environment.md](./test-environment.md) | Test instance (`testevaluation.milesconsult.com`) — refresh script, banner, isolation |
| [dbeaver-access.md](./dbeaver-access.md) | เข้า MySQL ผ่าน DBeaver + SSH tunnel — credentials, queries, security |
| [qa-test-users.md](./qa-test-users.md) | บัญชีทดลอง 6 users + 17 assignments บน test สำหรับ QA |
| [load-test-report.md](./load-test-report.md) | รายงานผล load test |
| [load-test-report.docx](./load-test-report.docx) | รายงาน Word version |
| [u917560495_milesconsultdb.sql](./u917560495_milesconsultdb.sql) | DB dump (เก่าจากตอน Hostinger shared) |
| `Websites _ Hostinger - *.png` | screenshots ตอน setup Hostinger panel |

## 🌐 URLs

| Environment | URL | ใช้เมื่อ |
|---|---|---|
| **Production** | https://evaluation.milesconsult.com | งานจริง |
| **Test/Staging** | https://testevaluation.milesconsult.com | ทดสอบก่อนขึ้น prod |

## 🔑 Credentials Quick Reference

ทุก credential เก็บบน VPS (`root only`):

| File | เนื้อหา |
|---|---|
| `~/.ssh/hostinger_deploy` (local) | SSH private key เข้า VPS |
| `/root/.test-db-credential` | password ของ `eval_test_user` |
| `/root/.dbeaver_credential` | password ของ `dbeaver_test` + `dbeaver_prod` |

```bash
# ดูรหัสได้ผ่าน
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'cat /root/.dbeaver_credential'
```

## 🛠 Workflows ที่ใช้บ่อย

### Deploy code ขึ้น prod + test
ดู [ssh-guide.md → Deploy section](./ssh-guide.md#deploy-จาก-local)

### Reset test DB จาก prod snapshot
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'bash /root/refresh-test.sh'
```
ดู [test-environment.md → Refresh section](./test-environment.md#การ-refresh-test-จาก-prod)

### เข้าดู DB ผ่าน GUI
ดู [dbeaver-access.md](./dbeaver-access.md)

### ทดสอบระบบประเมินด้วยบัญชี QA
ดู [qa-test-users.md](./qa-test-users.md)

### Rollback ครั้งล่าสุด
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'ls -lt /var/backups/ | head -10'
```
ดู [ssh-guide.md → Rollback](./ssh-guide.md#rollback)
