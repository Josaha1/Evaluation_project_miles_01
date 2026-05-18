# คู่มือเข้า DB ผ่าน DBeaver

> **อัปเดต 2026-04-26**: สร้าง dedicated MySQL user สำหรับ DBeaver — แยก test/prod แต่ละ user เห็นเฉพาะ DB ของตัวเอง

ใช้ **DBeaver Community** + **SSH tunnel** (built-in) → เข้าถึง MySQL บน VPS ได้โดยไม่ต้องเปิด port 3306 ออก internet

## สถาปัตยกรรม

```
[เครื่อง Local]
   DBeaver ──SSH tunnel (port 22, key auth)──→ [VPS 187.127.97.68]
                                                  └─ MySQL 127.0.0.1:3306
                                                        ├─ evaluation_db        (prod)
                                                        └─ evaluation_db_test   (test)
```

MySQL bind อยู่ที่ `127.0.0.1` เท่านั้น — เข้าตรงจาก internet ไม่ได้ ต้องผ่าน SSH ทุกครั้ง

## MySQL Users สำหรับ DBeaver

| User | Host | Database ที่เข้าได้ | สิทธิ์ |
|---|---|---|---|
| `dbeaver_test` | `127.0.0.1` | `evaluation_db_test` | ALL |
| `dbeaver_prod` | `127.0.0.1` | `evaluation_db` | ALL |

⚠️ ทั้ง 2 user ใช้ `mysql_native_password` (TCP login) — ผูกกับ host `127.0.0.1` เท่านั้น (ผ่าน SSH tunnel)

**Password เก็บที่**: `/root/.dbeaver_credential` บน VPS (root อ่านได้คนเดียว)
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'cat /root/.dbeaver_credential'
```

## ขั้นตอนตั้งค่า DBeaver

### 1. ติดตั้ง DBeaver Community (ฟรี)
https://dbeaver.io/download/

### 2. New Database Connection → MySQL → Next

### 3. Tab "Main"

```
Server Host: 127.0.0.1
Port:        3306
Database:    evaluation_db_test     (หรือ evaluation_db สำหรับ prod)
Username:    dbeaver_test           (หรือ dbeaver_prod)
Password:    (จาก /root/.dbeaver_credential)
```

### 4. Tab "SSH" — เปิด tunnel (สำคัญ)

ติ๊ก ☑️ **Use SSH Tunnel**

```
Host:                   187.127.97.68
Port:                   22
User name:              root
Authentication Method:  Public key
Private key:            C:\Users\Asus\.ssh\hostinger_deploy   (Windows)
                        ~/.ssh/hostinger_deploy               (Mac/Linux)
Passphrase:             (ว่าง)
```

กด **"Test tunnel configuration"** → ต้องขึ้น "Connected" สีเขียว

### 5. Tab "Driver properties"

```
allowPublicKeyRetrieval: true
useSSL:                  false
```

### 6. กด "Test Connection" → "Finish"

## แยก connection สำหรับ test / prod

แนะนำให้สร้าง 2 connections — ตั้งสีต่างกันกัน confuse:

### 🟢 eval-test
- Database: `evaluation_db_test`
- User: `dbeaver_test`
- Edit Connection → **Connection type** = `Development`

### 🔴 eval-prod
- Database: `evaluation_db`
- User: `dbeaver_prod`
- Edit Connection → **Connection type** = `Production` (สีแดง)

## Query ที่ใช้บ่อย

```sql
-- assignments ของปีงบ 2569 (= AD 2026)
SELECT angle, COUNT(*) FROM evaluation_assignments WHERE fiscal_year=2026 GROUP BY angle;

-- user ที่เพิ่ง import (ปี 68/69)
SELECT emid, fname, lname FROM users WHERE emid LIKE '68%' OR emid LIKE '69%' ORDER BY id DESC;

-- ดู assignments ของ user เป็น evaluatee
SELECT a.angle, e.fname AS evaluator, e.grade
FROM evaluation_assignments a
JOIN users e ON e.id = a.evaluator_id
WHERE a.evaluatee_id = (SELECT id FROM users WHERE emid='391039');

-- ดู assignment ทั้งหมดของ grade ใดๆ
SELECT a.angle, e1.fname AS evaluator, e2.fname AS evaluatee
FROM evaluation_assignments a
JOIN users e1 ON e1.id = a.evaluator_id
JOIN users e2 ON e2.id = a.evaluatee_id
WHERE a.fiscal_year = 2026 AND e2.grade = 12
ORDER BY e2.emid, a.angle;
```

## Backup / Restore

- **Dump DB**: คลิกขวา DB → Tools → **Dump database** → เลือก SQL file
- **Restore**: คลิกขวา DB → Tools → **Execute script** → เลือกไฟล์ .sql

หรือผ่าน CLI:
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'mysqldump evaluation_db_test > /tmp/test.sql'
scp -i ~/.ssh/hostinger_deploy root@187.127.97.68:/tmp/test.sql ./
```

## Troubleshooting

### "Communications link failure"
- SSH tunnel ไม่เปิด — check tab SSH กด "Test tunnel"
- private key path ผิด — ตรวจ path เต็ม + ไฟล์มีอยู่จริง

### "Access denied for user 'root'@'localhost'"
- กำลัง login ด้วย root → ใช้ไม่ได้ผ่าน TCP (root ใช้ `auth_socket` Unix socket only)
- เปลี่ยนไปใช้ `dbeaver_test` หรือ `dbeaver_prod`

### "Public Key Retrieval is not allowed"
- เพิ่ม **Driver properties** → `allowPublicKeyRetrieval: true`

### เห็น DB ทั้ง prod + test ใน connection เดียว
- กำลังใช้ user เก่า `dbeaver_admin` (ถูกลบไปแล้ว) หรือ user ที่มี grant ทั้ง 2 DB
- ใช้ user แยก: `dbeaver_test` (test เท่านั้น), `dbeaver_prod` (prod เท่านั้น)

## การจัดการ User

### Reset password
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68
NEW_PW=$(openssl rand -base64 24 | tr -d "/+=" | head -c 24)
mysql -e "ALTER USER 'dbeaver_test'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '$NEW_PW';"
echo "TEST: dbeaver_test / $NEW_PW" >> /root/.dbeaver_credential
```

### Revoke access (ลบ user)
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 \
  'mysql -e "DROP USER '"'"'dbeaver_test'"'"'@'"'"'127.0.0.1'"'"';"'
```

### List ทุก MySQL user
```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 \
  'mysql -e "SELECT user, host, plugin FROM mysql.user;"'
```

## Security Notes

- ⚠️ **Password ห้ามแชร์** — ส่งผ่าน secure channel เท่านั้น
- ⚠️ User `dbeaver_prod` มีสิทธิ์ `ALL` บน prod — **DROP/UPDATE ผิดทำให้ข้อมูลเสียหาย** ใช้ Connection Type = Production (DBeaver จะ confirm ก่อน execute SQL ที่อันตราย)
- ⚠️ Private key `~/.ssh/hostinger_deploy` ห้ามแชร์ — ถ้ารั่วต้อง revoke + ออก key ใหม่
- ✅ MySQL ไม่ expose ออก internet (bind 127.0.0.1) — attacker ต้องผ่าน SSH ก่อน
- ✅ เพิ่มความปลอดภัย: enable MFA บน SSH, fail2ban, ufw จำกัด port 22 จาก IP เฉพาะ

## เอกสารที่เกี่ยวข้อง

- [SSH Guide](./ssh-guide.md) — เข้า server, deploy, log
- [Test Environment](./test-environment.md) — โครงสร้าง test instance
- [Database Schema](../02_database_schema.md) — โครงสร้างตาราง
