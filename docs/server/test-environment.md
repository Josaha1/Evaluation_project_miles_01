# คู่มือ Test Environment — testevaluation.milesconsult.com

> **สร้างเมื่อ 2026-04-25** จาก snapshot prod (2026-04-25 08:40)
> Test instance อยู่บน VPS เดียวกับ prod — **DB / code คนละชุด แต่แชร์ MySQL/PHP-FPM/เครื่อง**

## TL;DR สำหรับทีมเทส

- URL: **https://testevaluation.milesconsult.com**
- Login: ใช้ username/password เดียวกับ prod (ข้อมูลทั้งหมดเป็น snapshot จริง)
- เห็นแถบสีแดงบนสุด = อยู่ใน TEST ปลอดภัย; ไม่เห็นแถบ = อยู่ prod ระวัง!
- เมล/SMS/external API ของ test ไม่ส่งของจริง (MAIL_MAILER=log)
- ทำข้อมูลพังหรือ test เสร็จต้องการรีเซ็ต → แจ้ง admin รัน `refresh-test.sh`

## ข้อมูล Server (ฝั่ง test)

| รายการ | ค่า |
|--------|-----|
| Domain | testevaluation.milesconsult.com |
| IP | 187.127.97.68 (เครื่องเดียวกับ prod) |
| Path | `/var/www/evaluation-test` |
| Document root | `/var/www/evaluation-test/public_html` |
| Database | `evaluation_db_test` |
| DB user | `eval_test_user` (grant เฉพาะ `evaluation_db_test`, **ไม่มีสิทธิ์แตะ prod DB**) |
| DB password | บันทึกใน `/root/.test-db-credential` (root only) |
| nginx vhost | `/etc/nginx/sites-available/evaluation-test` |
| SSL | Let's Encrypt — auto-renew (expire 2026-07-24) |
| nginx logs | `/var/log/nginx/testevaluation.{access,error}.log` |
| APP_ENV | `staging` (`APP_DEBUG=true`) |
| MAIL_MAILER | `log` (เก็บที่ `storage/logs/laravel.log` ไม่ส่งจริง) |
| Queue | `sync` (รันทันที ไม่มี worker) |
| Session cookie | `eval_test_session` (แยกจาก prod) |

## โครงสร้างที่ต่างจาก prod

```
/var/www/evaluation/         ← prod (APP_ENV=production)
/var/www/evaluation-test/    ← test (APP_ENV=staging) — clone จาก prod
  ├── .env                   ← override: APP_ENV, APP_URL, DB_*, MAIL=log
  ├── resources/views/app.blade.php   ← inject TEST banner เมื่อ env != production
  └── ... (โครงเหมือน prod ทุกอย่าง)
```

Banner สีแดงคาดหัวทุกหน้า ฝังใน `app.blade.php`:
```php
@if(config('app.env') !== 'production')
<div style="position:fixed;top:0;...">
    TEST ENVIRONMENT — {{ strtoupper(config('app.env')) }} — ข้อมูลไม่อยู่บนระบบจริง
</div>
@endif
```
**สำคัญ:** ห้ามลบ guard `@if` นี้ — ถ้าลบ banner จะแสดงบน prod ด้วย

## สิ่งที่ test แชร์กับ prod (เพื่อให้รู้ขอบเขต)

| ทรัพยากร | ผลที่อาจเกิด |
|---|---|
| MySQL server (instance เดียว, คนละ DB) | test query หนัก/lock → prod อาจหน่วง |
| PHP-FPM pool (`php8.2-fpm.sock` เดียวกัน) | test ทำ PHP loop/leak → prod 502 ได้ |
| CPU/RAM/Disk | export Excel ใหญ่บน test = prod ช้าตาม |
| APP_KEY | ใช้ key เดียวกับ prod เพื่อ decrypt encrypted columns ได้ — **ห้าม leak** |
| External API keys ใน `.env` | คัดลอกจาก prod ตอนสร้าง — ถ้ามี integration อะไรที่ไม่ควรยิงจริง ต้อง override เป็น dummy แยกใน `.env` test |

## การ Refresh Test จาก Prod

ใช้ script `/root/refresh-test.sh` บน VPS — backup test ปัจจุบันก่อนทุกครั้ง

```bash
# 1) Refresh ทั้ง DB + code (default)
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'bash /root/refresh-test.sh'

# 2) Refresh เฉพาะ DB (เร็วกว่า, ใช้บ่อย)
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'bash /root/refresh-test.sh db-only'

# 3) Sync เฉพาะ code (หลัง deploy prod แล้วอยาก test ตามทัน)
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'bash /root/refresh-test.sh code-only'
```

Backup ไฟล์ของ test ที่จะถูกทับ ถูกเก็บไว้ที่:
- DB: `/var/backups/test-before-refresh-<STAMP>.sql`
- Code: `/var/backups/test-code-before-refresh-<STAMP>.tar.gz`

Script ทำอะไรบ้าง (โดยย่อ)
1. dump test DB ปัจจุบัน → `/var/backups/test-before-refresh-*.sql`
2. dump prod → temp file
3. drop & recreate `evaluation_db_test` → grant ให้ `eval_test_user`
4. import prod dump เข้า test
5. tar test code → backup
6. rsync code prod → test (exclude `.env`, `app.blade.php` ที่มี banner, storage/cache, vendor, .git)
7. composer install, php artisan migrate, cache build, fix permission, reload php-fpm

**Note:** rsync exclude `.env` และ `app.blade.php` เพื่อให้ banner กับ env override คงไว้

## Deploy ขึ้น Test เพื่อ Smoke Test ก่อน Prod

ถ้าต้องการ deploy code ใหม่ขึ้น test ก่อน (ไม่ใช่ refresh จาก prod):

```bash
# ───────── LOCAL ─────────
cd C:/00_miles/Evaluation_project_miles_01-main
npm run build

tar czf /tmp/test_deploy.tar.gz \
  --exclude='node_modules' --exclude='vendor' --exclude='.git' \
  --exclude='.claude' --exclude='tests' --exclude='.env' \
  --exclude='public_html' --exclude='docker*' --exclude='docs' \
  --exclude='test-results' --exclude='playwright-report' \
  --exclude='resources/views/app.blade.php' \
  app bootstrap config database resources routes \
  composer.json composer.lock artisan vite.config.js package.json

tar czf /tmp/build.tar.gz -C public_html/build .

scp -i ~/.ssh/hostinger_deploy \
  /tmp/test_deploy.tar.gz /tmp/build.tar.gz \
  root@187.127.97.68:/tmp/

# ───────── TEST (VPS) ─────────
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
set -e
STAMP=$(date +%Y%m%d-%H%M%S)
cd /var/www/evaluation-test

tar czf /var/backups/test-code-$STAMP.tar.gz \
  --exclude=vendor --exclude=node_modules \
  app bootstrap config database resources routes public_html \
  composer.json composer.lock artisan vite.config.js 2>/dev/null || true

mysqldump evaluation_db_test > /var/backups/test-db-$STAMP.sql

tar xzf /tmp/test_deploy.tar.gz --overwrite
cd public_html/build && rm -rf assets manifest.json
tar xzf /tmp/build.tar.gz
cd /var/www/evaluation-test

composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
chown -R deploy:www-data .
chmod -R 755 storage bootstrap/cache
systemctl reload php8.2-fpm
echo "Deploy to TEST: $STAMP"
'
```

## Troubleshooting

### Test เปิดเป็น prod (ไม่มี banner / ใช้ DB prod)

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation-test
grep -E "APP_ENV|APP_URL|DB_DATABASE|DB_USERNAME" .env
# ต้องเห็น: APP_ENV=staging, APP_URL=https://testevaluation..., DB_DATABASE=evaluation_db_test, DB_USERNAME=eval_test_user
php artisan config:clear && php artisan config:cache
systemctl reload php8.2-fpm
'
```

### ลืม password ของ eval_test_user

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 'cat /root/.test-db-credential'
# หรือ reset:
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
NEW=$(openssl rand -base64 24 | tr -d "/+=" | head -c 28)
mysql -e "ALTER USER '"'"'eval_test_user'"'"'@'"'"'localhost'"'"' IDENTIFIED BY '"'"'"$NEW"'"'"';"
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$NEW|" /var/www/evaluation-test/.env
echo "eval_test_user password: $NEW" > /root/.test-db-credential
cd /var/www/evaluation-test && php artisan config:cache
systemctl reload php8.2-fpm
'
```

### หน้า test ขึ้น 500 / ไม่โหลด CSS

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation-test
tail -50 storage/logs/laravel.log
tail -30 /var/log/nginx/testevaluation.error.log
ls public_html/build/manifest.json
chown -R deploy:www-data .
chmod -R 755 storage bootstrap/cache
php artisan config:clear && php artisan config:cache
systemctl reload php8.2-fpm
'
```

### Banner ไม่แสดง (ทั้งที่ APP_ENV=staging)

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation-test
grep -c "TEST ENVIRONMENT" resources/views/app.blade.php  # ต้องได้ 1
php artisan view:clear && rm -f storage/framework/views/*.php
php artisan view:cache
systemctl reload php8.2-fpm
'
```

## Security Notes

- ⚠️ Test instance อยู่บน internet — ถ้ามี user data sensitive ที่ไม่ควร expose ให้ทำ **PII anonymization** หรือเพิ่ม **basic auth** ใน nginx vhost
- ⚠️ APP_KEY = ของ prod → ถ้า test code/server ถูก compromise = prod data รั่วได้
- ⚠️ External API keys (ถ้ามี) ถูกคัดลอกมาจาก prod → ตรวจ `.env` แล้ว override เป็น sandbox/dummy ถ้ามี integration จริง
- ⚠️ `MAIL_MAILER=log` ทำให้ test ไม่ส่งอีเมล แต่ถ้ามี integration ผ่าน LINE Notify / Slack webhook / SMS gateway ที่ไม่ใช่ Laravel mail → ต้อง override คีย์ใน `.env` แยก

## ที่ทำไว้แล้วและที่ยังไม่ทำ

✅ DNS A record `testevaluation.milesconsult.com → 187.127.97.68`
✅ nginx vhost + SSL (Let's Encrypt auto-renew)
✅ DB `evaluation_db_test` + DB user แยก (`eval_test_user`)
✅ `.env` test (APP_ENV=staging, MAIL=log, sync queue)
✅ Banner คาดทุกหน้าเฉพาะ env ≠ production
✅ `header X-Robots-Tag "noindex, nofollow"` ใน nginx
✅ `/root/refresh-test.sh` รีเซ็ต DB+code จาก prod

❌ Basic auth กันคน random
❌ PII anonymization (email/ชื่อ users ยังเป็นของจริง)
❌ Override external API keys (ถ้ามี)

## เอกสารที่เกี่ยวข้อง

- [SSH Guide (prod)](./ssh-guide.md) — VPS ทั่วไป, deploy prod
- [DBeaver Access](./dbeaver-access.md) — เข้าถึง DB ผ่าน DBeaver + SSH tunnel
- [Spec database overview](../../spec/database_overview.md)
