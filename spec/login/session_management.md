# Session Management Specification - ระบบประเมิน 360 องศา

## Overview / ภาพรวม

This document details the session management system that handles user authentication state, security measures, and lifecycle management in the 360-degree evaluation system.

เอกสารนี้รายละเอียดระบบจัดการเซสชันที่จัดการสถานะการยืนยันตัวตนของผู้ใช้ มาตรการความปลอดภัย และการจัดการวงจรชีวิตในระบบประเมิน 360 องศา

## Session Configuration / การตั้งค่าเซสชัน

### File Location / ตำแหน่งไฟล์
- **Configuration**: `config/session.php`
- **Migration**: `database/migrations/*_create_sessions_table.php`

### Session Driver Configuration / การตั้งค่า Session Driver

```php
// config/session.php
return [
    'driver' => env('SESSION_DRIVER', 'file'),
    'lifetime' => 120,                    // 2 hours in minutes
    'expire_on_close' => false,           // Persistent sessions
    'encrypt' => false,                   // HTTPS handles encryption
    'files' => storage_path('framework/sessions'),
    'connection' => null,                 // Database connection (if using DB driver)
    'table' => 'sessions',               // Database table name
    'store' => null,                     // Custom store
    'lottery' => [2, 100],               // 2% chance of cleanup
    'cookie' => env('SESSION_COOKIE', 'laravel_session'),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN', null),
    'secure' => env('SESSION_SECURE_COOKIE', false),
    'http_only' => true,                 // Prevent XSS attacks
    'same_site' => 'lax',               // CSRF protection
];
```

### Database Schema (for database sessions) / โครงสร้างฐานข้อมูล (สำหรับเซสชันฐานข้อมูล)

```php
// database/migrations/*_create_sessions_table.php
Schema::create('sessions', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->foreignId('user_id')->nullable()->index();
    $table->string('ip_address', 45)->nullable();
    $table->text('user_agent')->nullable();
    $table->text('payload');
    $table->integer('last_activity')->index();
});
```

## Session Lifecycle / วงจรชีวิตเซสชัน

### 1. Session Creation / การสร้างเซสชัน

#### On Login Success / เมื่อล็อกอินสำเร็จ

```php
// LoginController@login
if (Auth::attempt($credentials, $remember)) {
    // Clear rate limiting
    RateLimiter::clear($key);
    
    // Regenerate session to prevent fixation
    $request->session()->regenerate();
    
    // Force logout from other devices (single session policy)
    Auth::logoutOtherDevices($request->password);
    
    // Log successful login
    Log::info('Login successful', [
        'emid'       => $request->emid,
        'ip'         => $request->ip(),
        'user_agent' => $request->userAgent(),
        'time'       => now(),
        'session_id' => session()->getId(),
    ]);
}
```

#### Session Data Structure / โครงสร้างข้อมูลเซสชัน

```php
// Session data example
[
    '_token' => 'abc123...',              // CSRF token
    '_previous' => ['url' => '/dashboard'], // Previous URL
    '_flash' => [
        'old' => [],
        'new' => ['success' => 'ยินดีต้อนรับกลับ!']
    ],
    'login_web_59ba36addc2b2f9401580f014c7f58ea4e30989d' => 123, // Auth guard session
    'remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d' => 'remember_token...',
    'url' => [
        'intended' => '/dashboard'         // Intended URL after login
    ]
]
```

### 2. Session Validation / การตรวจสอบเซสชัน

#### Middleware Validation Chain / ห่วงโซ่การตรวจสอบ Middleware

```php
// 1. StartSession Middleware
// - Starts session
// - Loads session data
// - Sets session ID cookie

// 2. Auth Middleware (when required)
// - Validates authentication state
// - Checks session for user ID
// - Loads user from database

// 3. Custom validation in controllers
if (!Auth::check()) {
    return redirect()->route('login');
}
```

### 3. Session Refresh / การรีเฟรชเซสชัน

#### Automatic Refresh / การรีเฟรชอัตโนมัติ

```php
// Automatic refresh on each request
// Session lifetime extended when user is active
// Last activity timestamp updated

// Manual refresh (if needed)
$request->session()->migrate(true); // Regenerate session ID
```

#### Activity Tracking / การติดตามกิจกรรม

```php
// Each request updates last_activity timestamp
// Session garbage collection based on last_activity
// Configurable via SESSION_LIFETIME environment variable
```

### 4. Session Termination / การยุติเซสชัน

#### Logout Process / กระบวนการออกจากระบบ

```php
// LoginController@logout
public function logout(Request $request)
{
    // 1. Clear authentication state
    Auth::logout();
    
    // 2. Invalidate entire session
    $request->session()->invalidate();
    
    // 3. Regenerate CSRF token
    $request->session()->regenerateToken();
    
    // 4. Clear remember token
    if ($request->user()) {
        $request->user()->setRememberToken(null);
        $request->user()->save();
    }
    
    return redirect('/');
}
```

#### Automatic Expiration / การหมดอายุอัตโนมัติ

```php
// Session expires after 120 minutes of inactivity
// Configurable via config/session.php
'lifetime' => 120,

// Browser close behavior
'expire_on_close' => false, // Sessions persist across browser sessions
```

## Security Features / คุณสมบัติความปลอดภัย

### 1. Session Fixation Prevention / การป้องกัน Session Fixation

```php
// Regenerate session ID on login
$request->session()->regenerate();

// Also available as migrate() for manual control
$request->session()->migrate($destroy = true);
```

#### Implementation Details / รายละเอียดการดำเนินการ

- **When**: Every successful login
- **Effect**: New session ID generated, old session data transferred
- **Purpose**: Prevent attackers from hijacking pre-set session IDs

### 2. Single Device Policy / นโยบายอุปกรณ์เดียว

```php
// Force logout from all other devices
Auth::logoutOtherDevices($password);
```

#### How It Works / วิธีการทำงาน

1. **Password verification**: Requires current password for security
2. **Session invalidation**: All other sessions for the user are deleted
3. **Database cleanup**: Session records removed from database
4. **Current session preservation**: Only current session remains active

### 3. CSRF Protection / การป้องกัน CSRF

```php
// CSRF token stored in session
'_token' => csrf_token(),

// Automatic verification via VerifyCsrfToken middleware
// Token regenerated on logout for additional security
$request->session()->regenerateToken();
```

#### Token Management / การจัดการโทเค็น

- Generated per session
- Included in all forms automatically
- Verified on all state-changing requests
- Regenerated on authentication state changes

### 4. Session Cookie Security / ความปลอดภัยของคุกกี้เซสชัน

```php
// Secure cookie configuration
'cookie' => env('SESSION_COOKIE', 'laravel_session'),
'path' => '/',
'domain' => env('SESSION_DOMAIN', null),
'secure' => env('SESSION_SECURE_COOKIE', false),    // HTTPS only
'http_only' => true,                                // Prevent XSS
'same_site' => 'lax',                              // CSRF protection
```

#### Cookie Attributes / คุณสมบัติคุกกี้

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `HttpOnly` | `true` | Prevent JavaScript access (XSS protection) |
| `Secure` | `true` (in production) | HTTPS only transmission |
| `SameSite` | `lax` | CSRF protection, allows reasonable cross-site usage |
| `Path` | `/` | Available across entire domain |
| `Domain` | configurable | Control subdomain access |

## Session Storage / การเก็บข้อมูลเซสชัน

### 1. File Storage (Default) / การเก็บแบบไฟล์ (เริ่มต้น)

```php
// Configuration
'driver' => 'file',
'files' => storage_path('framework/sessions'),

// File structure
// storage/framework/sessions/abc123...
// Content: serialized session data
```

#### Advantages / ข้อดี
- Simple setup and configuration
- No database dependency
- Good performance for small to medium applications

#### Considerations / ข้อพิจารณา
- File system cleanup required
- Not suitable for load-balanced environments
- Limited scalability

### 2. Database Storage / การเก็บแบบฐานข้อมูล

```php
// Configuration
'driver' => 'database',
'connection' => 'mysql',
'table' => 'sessions',

// Enable with: php artisan session:table && php artisan migrate
```

#### Database Schema / โครงสร้างฐานข้อมูล

```sql
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL,
    INDEX sessions_user_id_index (user_id),
    INDEX sessions_last_activity_index (last_activity)
);
```

#### Advantages / ข้อดี
- Better for load-balanced environments
- Easier session management and monitoring
- Can track user activity across sessions
- Built-in garbage collection

### 3. Session Data Management / การจัดการข้อมูลเซสชัน

#### Storing Custom Data / การเก็บข้อมูลกำหนดเอง

```php
// Store data in session
session(['key' => 'value']);
$request->session()->put('key', 'value');

// Retrieve data
$value = session('key');
$value = $request->session()->get('key', 'default');

// Flash data (one-time use)
$request->session()->flash('message', 'Success!');

// Keep flash data for another request
$request->session()->reflash();
$request->session()->keep(['message']);
```

#### Session Data Sharing via Inertia / การแชร์ข้อมูลเซสชันผ่าน Inertia

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        // Flash messages
        'flash' => function () use ($request) {
            return [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ];
        },

        // Validation errors
        'errors' => function () use ($request) {
            $errors = $request->session()->get('errors');
            return $errors ? $errors->getBag('default')->getMessages() : (object) [];
        },
    ]);
}
```

## Session Monitoring / การติดตามเซสชัน

### 1. Active Session Tracking / การติดตามเซสชันที่ใช้งาน

```php
// Get active sessions for user (database driver)
$activeSessions = DB::table('sessions')
    ->where('user_id', Auth::id())
    ->orderBy('last_activity', 'desc')
    ->get();

// Session information
foreach ($activeSessions as $session) {
    echo "Session ID: " . $session->id;
    echo "IP: " . $session->ip_address;
    echo "User Agent: " . $session->user_agent;
    echo "Last Activity: " . Carbon::createFromTimestamp($session->last_activity);
}
```

### 2. Session Analytics / การวิเคราะห์เซสชัน

```php
// Total active sessions
$totalSessions = DB::table('sessions')->count();

// Active sessions by user
$sessionsByUser = DB::table('sessions')
    ->select('user_id', DB::raw('count(*) as session_count'))
    ->whereNotNull('user_id')
    ->groupBy('user_id')
    ->orderBy('session_count', 'desc')
    ->get();

// Sessions by time period
$recentSessions = DB::table('sessions')
    ->where('last_activity', '>=', now()->subHours(24)->timestamp)
    ->count();
```

### 3. Security Monitoring / การติดตามความปลอดภัย

```php
// Unusual session patterns
$multipleIpSessions = DB::table('sessions')
    ->select('user_id', 'ip_address', DB::raw('count(*) as count'))
    ->whereNotNull('user_id')
    ->groupBy('user_id', 'ip_address')
    ->having('count', '>', 1)
    ->get();

// Long-running sessions
$longSessions = DB::table('sessions')
    ->where('last_activity', '<', now()->subHours(24)->timestamp)
    ->get();
```

## Session Cleanup / การทำความสะอาดเซสชัน

### 1. Automatic Cleanup / การทำความสะอาดอัตโนมัติ

```php
// Configuration
'lottery' => [2, 100], // 2% chance per request

// Manual cleanup command
php artisan session:gc
```

#### Garbage Collection Process / กระบวนการเก็บขยะ

1. **Triggered by lottery**: 2% chance on each request
2. **Cleanup expired sessions**: Removes sessions older than lifetime
3. **Database optimization**: For database driver, removes old records
4. **File cleanup**: For file driver, removes old session files

### 2. Manual Cleanup / การทำความสะอาดด้วยตนเอง

```php
// Force cleanup via command
Artisan::call('session:gc');

// Custom cleanup logic
DB::table('sessions')
    ->where('last_activity', '<', now()->subHours(24)->timestamp)
    ->delete();

// Cleanup for specific user
DB::table('sessions')
    ->where('user_id', $userId)
    ->delete();
```

### 3. Session Maintenance Commands / คำสั่งการบำรุงรักษาเซสชัน

```bash
# Create sessions table migration
php artisan session:table

# Run garbage collection
php artisan session:gc

# Clear all sessions (emergency)
php artisan session:flush

# Monitor session storage size
du -sh storage/framework/sessions/
```

## Performance Optimization / การปรับปรุงประสิทธิภาพ

### 1. Session Size Optimization / การปรับปรุงขนาดเซสชัน

```php
// Minimize session data
// Only store essential user information
'auth' => [
    'user_id' => $user->id,
    'role' => $user->role,
];

// Avoid storing large objects in session
// Use database or cache for complex data
```

### 2. Database Indexing / การสร้างดัชนีฐานข้อมูล

```sql
-- Essential indexes for session table
CREATE INDEX sessions_user_id_index ON sessions (user_id);
CREATE INDEX sessions_last_activity_index ON sessions (last_activity);
CREATE INDEX sessions_ip_address_index ON sessions (ip_address);
```

### 3. Caching Strategy / กลยุทธ์การแคช

```php
// Cache frequently accessed session data
Cache::remember("user_permissions_{$userId}", 3600, function () use ($userId) {
    return User::find($userId)->permissions;
});

// Session-level caching
session(['cached_permissions' => $permissions]);
```

## Troubleshooting / การแก้ปัญหา

### 1. Common Issues / ปัญหาทั่วไป

#### Session Not Persisting / เซสชันไม่คงอยู่

```php
// Check configuration
php artisan config:clear

// Verify session driver
echo config('session.driver');

// Check file permissions (file driver)
chmod -R 755 storage/framework/sessions/

// Verify database table (database driver)
php artisan migrate
```

#### Session Conflicts / ความขัดแย้งเซสชัน

```php
// Clear all sessions
php artisan session:flush

// Regenerate session key
php artisan key:generate

// Clear configuration cache
php artisan config:clear
```

### 2. Debugging Tools / เครื่องมือการแก้ไขจุดบกพร่อง

```php
// Debug session data
dd(session()->all());

// Check session configuration
dd(config('session'));

// Monitor session activity
Log::debug('Session activity', [
    'session_id' => session()->getId(),
    'user_id' => Auth::id(),
    'session_data' => session()->all(),
]);
```

### 3. Production Considerations / ข้อพิจารณาสำหรับการใช้งานจริง

```php
// Environment-specific configuration
// .env.production
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=.yourdomain.com

// Monitoring setup
// Monitor session table size
// Set up alerts for unusual session activity
// Regular cleanup schedules
```

## Security Best Practices / แนวปฏิบัติที่ดีด้านความปลอดภัย

### 1. Session Security Checklist / รายการตรวจสอบความปลอดภัยเซสชัน

- ✅ **Session regeneration on login**
- ✅ **HttpOnly cookies**
- ✅ **Secure cookies in production**
- ✅ **SameSite cookie attribute**
- ✅ **CSRF token protection**
- ✅ **Session timeout configuration**
- ✅ **Single device policy**
- ✅ **Session invalidation on logout**

### 2. Monitoring Requirements / ข้อกำหนดการติดตาม

```php
// Log session security events
Log::security('Session created', ['user_id' => $userId, 'ip' => $ip]);
Log::security('Session regenerated', ['user_id' => $userId]);
Log::security('Multiple sessions detected', ['user_id' => $userId]);
Log::security('Session expired', ['session_id' => $sessionId]);
```

### 3. Compliance Considerations / ข้อพิจารณาด้านการปฏิบัติตามกฎระเบียบ

- **Data retention policies**: Configure appropriate session lifetime
- **Privacy regulations**: Handle session data according to local laws
- **Audit requirements**: Maintain session activity logs
- **Security standards**: Follow OWASP session management guidelines