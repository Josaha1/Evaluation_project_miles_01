# คู่มือเข้า SSH Server — evaluation.milesconsult.com

> **อัปเดต 2026-04-09**: ย้ายจาก Hostinger shared hosting มาเป็น VPS (root access)
> เอกสารเก่าเก็บใน git history (commit ก่อนหน้านี้) หากต้องการอ้างอิง
>
> **อัปเดต 2026-04-25**: เพิ่ม test instance `testevaluation.milesconsult.com` บน VPS เดียวกัน
> ดูคู่มือ test แยก: [test-environment.md](./test-environment.md)
>
> **อัปเดต 2026-04-26**: เพิ่ม MySQL user สำหรับ DBeaver — ดู [dbeaver-access.md](./dbeaver-access.md)
>
> **อัปเดต 2026-05-26**: เพิ่ม feature ปิดระบบประเมินตามเวลา — ดู [evaluation-deadline.md](./evaluation-deadline.md)

## ข้อมูล Server

| รายการ | ค่า |
|--------|-----|
| **Hosting** | VPS (Ubuntu) |
| **Domain** | evaluation.milesconsult.com |
| **SSH IP** | 187.127.97.68 |
| **SSH Port** | 22 (default) |
| **Username** | root |
| **Auth** | SSH Key (`~/.ssh/hostinger_deploy`) |
| **OS** | Ubuntu (kernel 6.8.0) |
| **Hostname** | srv1545724 |
| **PHP** | 8.2.30 (php8.2-fpm) |
| **Web Server** | nginx |
| **Database** | MySQL (local socket, DB `evaluation_db`) |

## เชื่อมต่อ SSH

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68
```

> **Note**: password login ของ root ยังเปิดอยู่ (เดิมเคยใช้ `Mathas.m_1244`).
> แนะนำปิดแล้วใช้ key อย่างเดียว: แก้ `/etc/ssh/sshd_config` → `PermitRootLogin prohibit-password` แล้ว `systemctl reload ssh`

## โครงสร้างไฟล์บน Server

```
/var/www/evaluation/              ← Laravel project root (owner: deploy:www-data)
├── app/
├── bootstrap/
├── config/
├── database/
├── resources/
├── routes/
├── storage/
├── vendor/
├── public_html/                  ← Document Root (nginx serve ที่นี่)
│   ├── index.php
│   ├── .htaccess
│   ├── build/                    ← Vite compiled assets
│   │   ├── manifest.json
│   │   └── assets/
│   ├── assets/
│   ├── images/
│   └── static/
├── public -> public_html         ← symlink (Laravel ใช้ชื่อ public)
├── laravel_project -> .          ← symlink (อ้างอิงภายใน)
├── .env                          ← APP_ENV=production
└── artisan

/var/backups/                     ← เก็บ tar + DB dump ตอน deploy
```

## คำสั่งที่ใช้บ่อย

### เข้าไปที่โปรเจค

```bash
cd /var/www/evaluation
```

### ดู Log

```bash
tail -50 storage/logs/laravel.log
tail -f storage/logs/laravel.log
tail -f /var/log/nginx/error.log
tail -f /var/log/php8.2-fpm.log
```

### ล้าง Cache

```bash
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### รัน Migration

```bash
php artisan migrate --force
php artisan migrate:status
```

### ตรวจ Database

```bash
php artisan db:show
mysql evaluation_db              # เข้า MySQL โดยตรง (root ไม่ต้องใส่ password)
```

### ดูสถานะ

```bash
php artisan --version
php -v
composer --version
systemctl status php8.2-fpm nginx mysql
```

### ตรวจ Disk/Permission

```bash
df -h                                          # ดู disk space
chown -R deploy:www-data /var/www/evaluation   # แก้ ownership
chmod -R 755 storage bootstrap/cache           # แก้ permission
```

### Restart Services

```bash
systemctl reload php8.2-fpm
systemctl reload nginx
```

## Deploy จาก Local

### วิธีที่ 1: Deploy เฉพาะ Backend (Controllers/Models/Services)

```bash
# 1. สร้าง tar จาก local
cd C:/00_miles/Evaluation_project_miles_01-main
tar czf /tmp/backend.tar.gz app/Http/Controllers app/Models app/Services routes

# 2. Upload
scp -i ~/.ssh/hostinger_deploy /tmp/backend.tar.gz root@187.127.97.68:/tmp/

# 3. Extract + cache บน server
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation
tar xzf /tmp/backend.tar.gz --overwrite
chown -R deploy:www-data app routes
php artisan config:cache
php artisan route:cache
php artisan view:cache
systemctl reload php8.2-fpm
'
```

### วิธีที่ 2: Deploy เฉพาะ Frontend (Build Assets)

```bash
# 1. Build บน local
cd C:/00_miles/Evaluation_project_miles_01-main
npm run build

# 2. สร้าง tar
tar czf /tmp/build.tar.gz -C public_html/build .

# 3. Upload
scp -i ~/.ssh/hostinger_deploy /tmp/build.tar.gz root@187.127.97.68:/tmp/

# 4. Extract บน server
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation/public_html/build
rm -rf assets manifest.json
tar xzf /tmp/build.tar.gz
chown -R deploy:www-data /var/www/evaluation/public_html/build
cd /var/www/evaluation
php artisan view:cache
'
```

### วิธีที่ 3: Deploy ทั้ง Backend + Frontend (Full Deploy)

```bash
# ───────── LOCAL ─────────
cd C:/00_miles/Evaluation_project_miles_01-main

# 1. Build frontend
npm run build

# 2. สร้าง tar backend (ไม่รวม node_modules, vendor, .git, tests, docs)
tar czf /tmp/full_deploy.tar.gz \
  --exclude='node_modules' --exclude='vendor' --exclude='.git' \
  --exclude='.claude' --exclude='tests' --exclude='.env' \
  --exclude='public_html' --exclude='docker*' --exclude='docs' \
  --exclude='test-results' --exclude='playwright-report' \
  app bootstrap config database resources routes \
  composer.json composer.lock artisan vite.config.js package.json

# 3. สร้าง tar build
tar czf /tmp/build.tar.gz -C public_html/build .

# 4. Upload ทั้งคู่
scp -i ~/.ssh/hostinger_deploy \
  /tmp/full_deploy.tar.gz /tmp/build.tar.gz \
  root@187.127.97.68:/tmp/

# ───────── PROD (VPS) ─────────
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
set -e
STAMP=$(date +%Y%m%d-%H%M%S)
cd /var/www/evaluation

# 5.1 Backup current code
tar czf /var/backups/evaluation-code-$STAMP.tar.gz \
  --exclude=vendor --exclude=node_modules \
  app bootstrap config database resources routes public_html \
  composer.json composer.lock artisan vite.config.js 2>/dev/null || true

# 5.2 Backup DB
mysqldump evaluation_db > /var/backups/evaluation_db-$STAMP.sql

# 5.3 Extract backend
tar xzf /tmp/full_deploy.tar.gz --overwrite

# 5.4 Extract frontend
cd public_html/build
rm -rf assets manifest.json
tar xzf /tmp/build.tar.gz
cd /var/www/evaluation

# 5.5 Composer + migrate + cache
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan cache:clear

# 5.6 Fix permissions
chown -R deploy:www-data .
chmod -R 755 storage bootstrap/cache

# 5.7 Reload PHP-FPM
systemctl reload php8.2-fpm

echo "Deploy complete: $STAMP"
'
```

### วิธีที่ 4: Deploy จาก Git (Recommended)

> ⚠️ **บังคับทุก deploy** — ทำครบทั้ง 3 phase ตามลำดับ: **LOCAL master** → **VPS clean build** → **cache + reload**
> ห้าม shortcut "config:cache only" แม้ commit จะเป็น BE-only เพราะ FE bundle/manifest อาจ desync

**Phase 1 — LOCAL (housekeeping)**

```bash
# 1. commit + push branch ของคุณขึ้น GitHub
git push josaha <branch-name>

# 2. กลับมาที่ master locally — ห้ามค้างอยู่บน fix branch
git checkout master
```

**Phase 2 + 3 — VPS (clean build → cache → reload)**

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
set -e
STAMP=$(date +%Y%m%d-%H%M%S)
TARGET=/var/www/evaluation-test            # หรือ /var/www/evaluation สำหรับ prod
BRANCH=fix/your-branch                     # ★ เปลี่ยนเป็น branch ที่ต้องการ deploy
DB=evaluation_db_test                      # หรือ evaluation_db สำหรับ prod
cd $TARGET

# Backup .env + DB
cp .env /var/backups/$(basename $TARGET)-env-$STAMP 2>/dev/null || true
mysqldump --routines --triggers --events $DB > /var/backups/$(basename $TARGET)-db-$STAMP.sql

# Fetch + checkout (non-destructive — ไม่ใช้ reset --hard)
git fetch --depth=1 origin $BRANCH
git checkout origin/$BRANCH -- .
git update-ref refs/heads/$BRANCH origin/$BRANCH
git symbolic-ref HEAD refs/heads/$BRANCH

# Clean build (บังคับ — กัน stale FE bundle)
rm -rf public_html/build
composer install --no-dev --optimize-autoloader --no-interaction
npm ci 2>&1 | tail -3
npm run build 2>&1 | tail -5

# Cache + reload
php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R deploy:www-data .
chmod -R 755 storage bootstrap/cache
systemctl reload php8.2-fpm

echo "Deploy from git: $(git log -1 --oneline) @ $STAMP"
'
```

**Smoke test หลัง deploy**

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://testevaluation.milesconsult.com/
# หรือ https://evaluation.milesconsult.com/ สำหรับ prod
```

**ทำไมต้อง clean build ทุกครั้ง:**
- BE-only commit ดูเหมือนไม่ต้อง npm build แต่ Vite manifest อาจ stale → browser โหลด CSS/JS hash เก่า
- `rm -rf public_html/build` + `npm ci` (ใช้ lockfile) → กัน drift ระหว่าง deploy
- bundle hash เปลี่ยน → browser cache bust อัตโนมัติ ไม่ต้องให้ user Ctrl+Shift+R

**Rollback ผ่าน git:**

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation
git log --oneline -10                       # หา sha ที่ต้องการกลับไป
git checkout <SHA> -- .                     # apply working tree เป็น sha นั้น
rm -rf public_html/build && npm run build
php artisan config:cache && php artisan route:cache && php artisan view:cache
systemctl reload php8.2-fpm
'
```

## Rollback

```bash
ssh -i ~/.ssh/hostinger_deploy root@187.127.97.68 '
cd /var/www/evaluation
ls -lt /var/backups/evaluation-code-*.tar.gz | head -5   # เลือก tar ล่าสุด
tar xzf /var/backups/evaluation-code-YYYYMMDD-HHMMSS.tar.gz --overwrite
mysql evaluation_db < /var/backups/evaluation_db-YYYYMMDD-HHMMSS.sql
php artisan config:cache && php artisan route:cache && php artisan view:cache
chown -R deploy:www-data .
systemctl reload php8.2-fpm
'
```

## Troubleshooting

### 500 Error

```bash
cd /var/www/evaluation
tail -100 storage/logs/laravel.log
tail -50 /var/log/nginx/error.log
chown -R deploy:www-data .
chmod -R 755 storage bootstrap/cache
php artisan config:clear && php artisan cache:clear && php artisan config:cache
systemctl reload php8.2-fpm
```

### หน้าขาว / ไม่มี CSS/JS

```bash
# ตรวจ build files
ls /var/www/evaluation/public_html/build/manifest.json

# ลบ hot file (Vite dev server leftover)
rm -f /var/www/evaluation/public_html/hot
```

### Database Error

```bash
cd /var/www/evaluation
php artisan migrate:status
cat .env | grep DB_
mysql evaluation_db -e "SHOW TABLES;"
```

### Composer Error

```bash
cd /var/www/evaluation
rm -rf vendor
composer install --no-dev --optimize-autoloader --no-interaction
chown -R deploy:www-data vendor
```

## ข้อมูล Database

| รายการ | ค่า |
|--------|-----|
| Host | 127.0.0.1 (local) |
| Database | evaluation_db |
| User | eval_user |
| Access | root บน VPS เข้า `mysql evaluation_db` ได้เลย |

## SSH Key

Public key ที่ลงทะเบียนบน server:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGBr7aRt3Z3FowsrVsDLYzBjFNl14BSp1M8KEPQPsKp9 Asus@DESKTOP-N12R021
```

ไฟล์ key:
- Private: `~/.ssh/hostinger_deploy`
- Public: `~/.ssh/hostinger_deploy.pub`

## Security Notes

- ⚠️ ควรปิด root password login เหลือเฉพาะ key auth
- ⚠️ ตั้ง `fail2ban` หรือ `ufw` จำกัด SSH access
- ⚠️ `.env` บน prod อย่าแก้ผ่าน deploy (script จะ skip ด้วย `--exclude='.env'`)
