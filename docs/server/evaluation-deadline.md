# คู่มือปิด/เปิดระบบประเมิน (EVALUATION_DEADLINE)

## Overview

ระบบมี **deadline cutoff** ที่อ่านจาก env `EVALUATION_DEADLINE`
หลังเวลานี้:
- **user (role=user)** เข้า `/dashboard`, `/evaluations/self*`, `/assigned-evaluations/*` → ถูก logout + redirect `/login` + flash "ระบบประเมินปิดให้บริการแล้ว"
- **external (`/external/*`)** → forget session + redirect `/external/login` + flash
- **admin (role=admin)** → ผ่านปกติ + เข้าหน้า reports ได้

## รหัส (อ้างอิง)

| ชิ้น | ที่อยู่ |
|------|--------|
| Config | `config/evaluation.php` (key `deadline` อ่านจาก `EVALUATION_DEADLINE`) |
| Middleware | `app/Http/Middleware/EvaluationDeadlineMiddleware.php` |
| Alias | `bootstrap/app.php` → `'evaluation.deadline'` |
| Routes | `routes/web.php` — กลุ่ม `auth + role:user` และ `external + throttle:30,1` |

## วิธีตั้งเวลาปิด

### Set ครั้งแรก (หรือเปลี่ยนเวลา)

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68

# ทำทั้ง test + prod ในรอบเดียว
for TARGET in /var/www/evaluation-test /var/www/evaluation; do
  cd $TARGET
  # ใช้ sed -i แทน .env ทั้งบรรทัด (รักษา quote + รูปแบบ)
  if grep -q '^EVALUATION_DEADLINE=' .env; then
    sed -i 's|^EVALUATION_DEADLINE=.*|EVALUATION_DEADLINE="2026-06-05 23:59:59"|' .env
  else
    echo 'EVALUATION_DEADLINE="2026-06-05 23:59:59"' >> .env
  fi
  grep EVALUATION_DEADLINE .env
  php artisan config:cache
done
systemctl reload php8.2-fpm

# smoke test
curl -sS -o /dev/null -w 'test %{http_code}\n' https://testevaluation.milesconsult.com/
curl -sS -o /dev/null -w 'prod %{http_code}\n' https://evaluation.milesconsult.com/
```

> รูปแบบ datetime: `Y-m-d H:i:s` (24 ชม.) เช่น `"2026-06-05 23:59:59"`
> Timezone = server TZ (ตรวจด้วย `date` บน VPS — ปกติ Asia/Bangkok)

### เฉพาะ test หรือเฉพาะ prod

```bash
# เฉพาะ test
cd /var/www/evaluation-test
sed -i 's|^EVALUATION_DEADLINE=.*|EVALUATION_DEADLINE="2026-06-05 23:59:59"|' .env
php artisan config:cache
systemctl reload php8.2-fpm

# เฉพาะ prod — เปลี่ยน TARGET เป็น /var/www/evaluation
```

## วิธีเปิดระบบกลับ (ปลด deadline)

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68
for TARGET in /var/www/evaluation-test /var/www/evaluation; do
  cd $TARGET
  sed -i '/^EVALUATION_DEADLINE=/d' .env
  php artisan config:cache
done
systemctl reload php8.2-fpm
```

หรือถ้าอยากเก็บค่าไว้ comment เฉยๆ:

```bash
sed -i 's|^EVALUATION_DEADLINE=|# EVALUATION_DEADLINE=|' .env
php artisan config:cache && systemctl reload php8.2-fpm
```

## ตรวจสอบสถานะปัจจุบัน

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 \
  "grep EVALUATION_DEADLINE /var/www/evaluation/.env; \
   grep EVALUATION_DEADLINE /var/www/evaluation-test/.env"
```

## ทดสอบ

หลัง set deadline → ลอง:
1. Login เป็น user → ถ้าก่อน deadline เข้า `/dashboard` ได้, ถ้าหลัง deadline ถูก redirect `/login`
2. Login external (`/external/login`) → ถ้าหลัง deadline หลัง verify code จะ kick กลับ login
3. Login admin → เข้า `/dashboardadmin` + reports ได้ทุกเวลา

## Troubleshooting

### ตั้งแล้วยังเข้าได้

```bash
# 1. ตรวจว่า .env ถูกอ่าน — เช็ค config cache
cd /var/www/evaluation
php artisan tinker --execute='echo config("evaluation.deadline");'

# 2. ถ้า output ว่าง → config cache ยังเก่า
php artisan config:clear && php artisan config:cache
systemctl reload php8.2-fpm
```

### ตั้งแล้ว block admin ด้วย

ไม่ควรเกิด — middleware ตรวจ `auth()->user()?->role === 'admin'` ก่อนเช็คเวลา
ถ้าเกิด: ตรวจว่า user row ใน DB มี `role='admin'` จริง (`SELECT id, emid, role FROM users WHERE emid='999999';`)

### เปลี่ยนเวลาแล้วไม่ตรง

`config:cache` ต้องรันทุกครั้งหลังแก้ .env — `config:cache` flush + rebuild cache
ถ้าลืม → Laravel อ่านจาก cache เก่า → ค่าใหม่ไม่ผล

### ตรวจ timezone

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'date; date -u'
# ปกติ TZ=Asia/Bangkok (+07:00)
```

ถ้า server TZ ผิด → deadline เพี้ยน → แก้ `/etc/timezone` หรือใช้ `Carbon::parse($deadline, 'Asia/Bangkok')` ใน middleware

## Rollback (ปลด feature ทั้งหมด)

ถ้าต้องการลบ feature นี้ออกชั่วคราว (ไม่ใช่แค่ปิด deadline):

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68
cd /var/www/evaluation
git checkout <commit-ก่อน-feat-deadline> -- routes/web.php bootstrap/app.php
php artisan config:cache && php artisan route:cache
systemctl reload php8.2-fpm
```

หรือลบ env var:

```bash
sed -i '/^EVALUATION_DEADLINE=/d' .env
php artisan config:cache && systemctl reload php8.2-fpm
```

> middleware ที่ deadline=null จะ pass-through → ไม่กระทบ traffic
