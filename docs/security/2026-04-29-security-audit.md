# Cybersecurity Audit — Prod & Test (2026-04-29)

> ผลการตรวจสอบความปลอดภัยของ `evaluation.milesconsult.com` (prod) และ `testevaluation.milesconsult.com` (test)
> ใช้เซิร์ฟเวอร์เดียวกัน (VPS Hostinger 187.127.97.68) Ubuntu + nginx + PHP-FPM 8.2 + MariaDB
> Scope: server config, application code, dependencies, network exposure
> Severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

## Executive Summary

| Severity | Findings |
|---|---|
| 🔴 Critical | 3 |
| 🟠 High | 5 |
| 🟡 Medium | 6 |
| 🟢 Low | 4 |

**3 ที่ต้องแก้ด่วนสุด:**
1. APP_KEY แชร์ระหว่าง prod ↔ test → ถ้า test ถูก compromise → prod data ถูก decrypt
2. Test exposed บน internet โดยไม่มี basic auth + APP_DEBUG=true → ข้อมูล PII จริง + stack trace
3. PhpSpreadsheet มี SSRF vulnerability (CVE-2025-54370, severity HIGH) — ใช้ใน Excel export

---

## 🔴 Critical

### C1. APP_KEY ใช้ key เดียวกันทั้ง prod และ test
**Risk**: ถ้า test instance / repo / backup รั่ว → attacker ถือ APP_KEY เดียวกับ prod → decrypt encrypted columns + ปลอม session cookie ของ prod ได้

**Evidence**:
```
prod: APP_KEY=base64:0jacXojNa435cfP...
test: APP_KEY=base64:0jacXojNa435cfP...
→ identical
```

**Fix**:
```bash
# บน VPS, generate new key for test
cd /var/www/evaluation-test
php artisan key:generate --force
# Decrypt-then-reencrypt encrypted DB columns ถ้ามี (Laravel encrypted casts)
# Re-cache config
php artisan config:cache
systemctl reload php8.2-fpm
```
ใน `docs/server/test-environment.md` ระบุไว้ว่า "ใช้ key เดียวกับ prod เพื่อ decrypt encrypted columns" — ถ้าไม่มี encrypted columns จริง ให้แยก key เลย

---

### C2. Test environment เปิดสาธารณะ + APP_DEBUG=true + ข้อมูล PII จริง
**Risk**:
- `APP_DEBUG=true` → stack trace + .env values ใน error response
- ไม่มี basic auth → ใครก็เข้า `https://testevaluation.milesconsult.com` ได้
- DB clone จาก prod → ชื่อ-อีเมล user จริง 1,200+ คน
- มี comment ใน docs/server: ❌ Basic auth กันคน random, ❌ PII anonymization

**Evidence**:
```
TEST .env: APP_DEBUG=true
nginx test vhost: ไม่มี auth_basic
DB: real user emid/email/grade
```

**Fix (เลือกอย่างใดอย่างหนึ่งหรือทั้งหมด):**
1. nginx basic auth:
   ```nginx
   location / {
       auth_basic "Test - Restricted";
       auth_basic_user_file /etc/nginx/.htpasswd-test;
       try_files $uri $uri/ /index.php?$query_string;
   }
   ```
2. IP whitelist (allow office/VPN only):
   ```nginx
   allow 1.2.3.4;
   deny all;
   ```
3. PII anonymization in `refresh-test.sh`: hash emails, replace names with `Test User N`
4. Set `APP_DEBUG=false` on test (แม้ว่า ENV จะเป็น staging)

---

### C3. PhpSpreadsheet SSRF (CVE-2025-54370, HIGH)
**Risk**: Excel ที่ admin upload (Assignment Import / User Import) มี HTML/CSS อ้างอิง URL ภายนอก → SSRF (read internal services, 169.254.169.254 metadata, ฯลฯ)

**Evidence**: `composer audit` reports
- `phpoffice/phpspreadsheet 4.2.0` (vulnerable: <=5.6.0)
- 3 advisories: 1× HIGH (SSRF), 2× MEDIUM (XSS via @ format code)
- `league/commonmark 2.8.1` MEDIUM (embed extension domain bypass)
- `dompdf/dompdf 3.1.4` outdated (used for PDF export)

**Fix**:
```bash
composer require phpoffice/phpspreadsheet:^5.7
composer require league/commonmark:^2.8.2
composer update --with-all-dependencies
```

---

## 🟠 High

### H1. session.cookie_secure = 0 (PHP ini)
**Risk**: ถ้า user เผลอเข้าผ่าน HTTP (URL พิมพ์ผิด, mixed content, MITM downgrade) → session cookie ส่งแบบ plaintext

**Evidence**: `php -i` → `session.cookie_secure=` (empty = false)

**Fix**: ใน `config/session.php` ตั้ง `'secure' => env('SESSION_SECURE_COOKIE', true)` แล้ว `.env` set `SESSION_SECURE_COOKIE=true` (Laravel จัดการเอง ไม่ต้องพึ่ง php.ini) — verify `config/session.php` มีบรรทัดนี้

### H2. session.cookie_httponly = 0 (PHP ini)
**Risk**: XSS payload สามารถอ่าน `document.cookie` → exfiltrate session

**Fix**: ใน `config/session.php` `'http_only' => true,` (Laravel default คือ true ถ้าไม่ override) — verify Laravel config ไม่ override เป็น false

### H3. ไม่มี HSTS header
**Risk**: เปิดช่อง downgrade attack (HTTPS → HTTP MITM)

**Evidence**: `curl -I https://evaluation.milesconsult.com` ไม่มี `Strict-Transport-Security`

**Fix** ใน nginx vhost:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### H4. ไม่มี Content-Security-Policy
**Risk**: ถ้า XSS หลุด → ไม่มี CSP block inline script / external script

**Fix**:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';" always;
```
(ปรับ unsafe-inline ตามที่ frontend ใช้ Tailwind/Inertia — อาจต้องใช้ nonce)

### H5. ไม่มี fail2ban / ufw firewall
**Risk**: SSH brute-force ไม่มี rate-limit → bot รุ่นถี่ ๆ จะเดารหัสได้
**Evidence**: `systemctl is-active fail2ban` → inactive; `ufw status` → inactive

**Fix**:
```bash
apt install fail2ban
systemctl enable --now fail2ban
# /etc/fail2ban/jail.local
[sshd]
enabled = true
maxretry = 5
bantime = 3600
```
หรือเปลี่ยน SSH เป็น key-only + disable password auth ใน `/etc/ssh/sshd_config`:
```
PasswordAuthentication no
```

---

## 🟡 Medium

### M1. ภาพอัปโหลดไม่ตรวจ MIME — แค่ extension
ใน `ProfileController::savePhotoForSharedHosting()` line 169:
```php
$fileName = 'user_' . $userId . '_' . time() . '.' . $photo->getClientOriginalExtension();
```
ไม่ตรวจว่าไฟล์เป็นภาพจริงตามนามสกุล → upload `shell.php` rename เป็น `shell.jpg` แล้วเข้าถึงผ่าน path จะถูก execute ถ้าไป path ที่ PHP run ได้

**Fix**:
```php
$validated = $request->validate([
    'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],  // 5 MB
]);
// Store ใน storage/app/public, ไม่ใช่ public_html/storage โดยตรง
// nginx vhost block: location ~ \.php$ ใน path /storage/ → return 403
```

### M2. expose_php = 1
**Risk**: response header `X-Powered-By: PHP/8.2.30` → ลด fingerprinting

**Fix**: `/etc/php/8.2/fpm/php.ini` → `expose_php = Off` แล้ว `systemctl reload php8.2-fpm`

### M3. ไม่มี 2FA สำหรับ admin
ผู้ใช้สิทธิ์ admin ลง prod DB ทั้งระบบได้ ผ่าน password ตัวเดียว
**Fix**: เพิ่ม TOTP (laragear/two-factor หรือ pragmarx/google2fa-laravel) สำหรับ role=admin

### M4. Login attempts: 5 ครั้ง/60 วินาที (พอใช้ได้แต่ตื้น)
ใน `LoginController::checkTooManyAttempts()`: 5 retries → block 60 วินาที
- ใช้ throttle key = IP + emid → bypass ได้ด้วย IP rotation
- ไม่มี alert/log ที่ชี้ pattern brute force ข้าม IP

**Fix**: เพิ่ม alert log ที่นับ failed login per emid (ข้าม IP) และส่ง notification เมื่อเกิน 20 ครั้ง/ชม.

### M5. CONCURRENT login ไม่จำกัด (เปลี่ยนเมื่อ 2026-04-29)
เพิ่งลบ `Auth::logoutOtherDevices()` ออก → ผู้ใช้แชร์รหัสกันได้ + leaked credential ไม่ถูก invalidate อัตโนมัติ
**Trade-off**: รับมาเพราะ UX (admin ต้อง login บนหลายเครื่อง) แต่ควรพิจารณา:
- Log session count per user → flag ถ้าเกิน threshold
- Force re-auth ทุก 8 ชม. (`config/session.php` lifetime)

### M6. SSH key shared (`hostinger_deploy`)
ผู้ที่มี key นี้เข้าได้ทุกอย่าง — ไม่มี audit trail ระบุว่าใครเข้า
**Fix**: ใช้ user-specific key, audit `~/.ssh/authorized_keys` per developer; rotate quarterly

---

## 🟢 Low

### L1. Outdated Laravel + dependencies (ไม่ใช่ security CVE แต่ควร patch)
- Laravel 12.53 → 12.58 available
- Inertia.js 2.0 → 3.0 available (major)
- Sanctum 4.0.8 → 4.3.1
- bacon/bacon-qr-code 2.0 → 3.1 (major)

### L2. ไม่มี integrity ตรวจ Composer dep
ไม่มี `composer.lock` checksum verification ใน CI/deploy

### L3. SSL ใช้ Let's Encrypt auto-renew — OK แต่:
- ใช้ default options-ssl-nginx.conf (TLS 1.2+, modern ciphers ✓)
- ไม่มี OCSP stapling? — ให้ตรวจ `ssl_stapling on;`
- HSTS preload list registration ยังไม่ทำ

### L4. Logs ที่ `LOG_LEVEL=debug` + `storage/logs/laravel.log` (รวม PII)
- Login log บันทึก emid + ip + user_agent — เก็บได้แต่ rotate ทุก 30 วันถ้าเก็บ in-place
- Debug log ใน prod อาจ leak query/payload

**Fix**: prod ตั้ง `LOG_LEVEL=warning` หรือ `info`; logrotate config:
```bash
/etc/logrotate.d/evaluation:
/var/www/evaluation/storage/logs/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
}
```

---

## ✅ ที่ทำดีแล้ว

- ✅ HTTPS (Let's Encrypt + auto-renew)
- ✅ MariaDB bind to `127.0.0.1` only (ไม่เปิด public)
- ✅ DB user แยก (`eval_user` กับ `eval_test_user` privileges scoped)
- ✅ `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` ที่ nginx
- ✅ `X-Robots-Tag: noindex, nofollow` ที่ test vhost
- ✅ Laravel CSRF middleware (auto-applied with `web` group)
- ✅ Login throttle ใช้ Laravel RateLimiter (5 retry/60s)
- ✅ External login throttle (`throttle:5,1`) — รวมที่ฝั่ง external
- ✅ Eloquent ORM ใช้ prepared statements (ไม่มี raw SQL injection ที่ผม audit เห็น)
- ✅ Mass assignment ใช้ `$fillable` (User, Answer, EvaluationAssignment)
- ✅ Session driver = file (มี security ok ถ้า perms ถูก, แต่ scale ยาก)
- ✅ Authorization middleware (`auth`, `role:user`, `role:admin`) ครอบ admin routes ครบ

---

## ลำดับความสำคัญในการแก้

| # | งาน | Effort | Severity |
|---|---|---|---|
| 1 | แยก APP_KEY ของ test | 30 นาที | C1 |
| 2 | nginx basic auth สำหรับ test | 30 นาที | C2 |
| 3 | `composer update phpoffice/phpspreadsheet league/commonmark` | 1 ชม. (ทดสอบ export) | C3 |
| 4 | เพิ่ม HSTS, CSP header ใน nginx | 30 นาที | H3, H4 |
| 5 | install fail2ban + sshd jail | 30 นาที | H5 |
| 6 | ตั้ง `SESSION_SECURE_COOKIE=true` ใน .env | 5 นาที | H1, H2 |
| 7 | Profile photo MIME validation | 30 นาที | M1 |
| 8 | `expose_php = Off` ใน php.ini | 5 นาที | M2 |
| 9 | logrotate + LOG_LEVEL=info สำหรับ prod | 15 นาที | L4 |
| 10 | 2FA admin (option) | 4–8 ชม. | M3 |
| 11 | composer outdated patches | 2–4 ชม. (regression) | L1 |

**Quick wins (รวมเวลาไม่เกิน 2 ชม.):** #1, #2, #4, #5, #6, #8, #9 → ลดความเสี่ยงทันที

---

## เครื่องมือที่ใช้ตรวจ

```bash
# Server-side recon (run on VPS)
ss -tlnp                                 # open ports
systemctl is-active fail2ban             # IDS
ufw status                               # firewall
mysql -e "SELECT user, host FROM mysql.user;"

# Headers / TLS
curl -sI https://evaluation.milesconsult.com
testssl.sh evaluation.milesconsult.com   # (optional, ถ้าติดตั้ง)

# Laravel-side
composer audit                           # Composer security advisories
php artisan route:list                   # ดู middleware coverage

# Static analysis (optional)
./vendor/bin/phpstan analyse             # type/null safety
./vendor/bin/psalm --taint-analysis      # XSS/SQLi taint flow
```

## หมายเหตุ

- เอกสารนี้ตรวจในวันที่ 2026-04-29 ค่าที่บันทึกไว้สะท้อนสถานะ ณ ตอนนั้น ควร rerun หลัง patch
- Fix ที่แนะนำมีบางอันต้องทดสอบ regression (เช่น dependency update / CSP) — แนะนำลองที่ test ก่อน
- ไม่ได้ทำ pen-test แบบ active (ไม่ได้ลอง exploit จริง) — เป็น static + config audit เท่านั้น
- `mysql -uroot` ไม่มี password ในผลลัพธ์ — VPS อาจตั้ง unix_socket auth (verified ใน plugin column = caching_sha2_password — ใช้ password) ควร audit `/root/.my.cnf` หรือ `mysql_config_editor`
