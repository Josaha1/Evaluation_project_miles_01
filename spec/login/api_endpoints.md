# API Endpoints Specification - ระบบประเมิน 360 องศา

## Overview / ภาพรวม

This document details all API endpoints related to authentication, including routes, controllers, request/response formats, and security measures.

เอกสารนี้รายละเอียด API endpoints ทั้งหมดที่เกี่ยวข้องกับการยืนยันตัวตน รวมถึงเส้นทาง controllers รูปแบบ request/response และมาตรการความปลอดภัย

## Authentication Routes / เส้นทางการยืนยันตัวตน

### File Location / ตำแหน่งไฟล์
- **Routes File**: `routes/web.php`
- **Controller**: `app/Http/Controllers/Auth/LoginController.php`

## Route Definitions / การกำหนดเส้นทาง

### Guest Routes / เส้นทางสำหรับผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบ

```php
Route::middleware('guest')->group(function () {
    Route::get('/', [HomeController::class, 'welcome'])->name('home');
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});
```

### Logout Route / เส้นทางออกจากระบบ

```php
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
```

## Endpoint Details / รายละเอียด Endpoints

### 1. Display Login Form / แสดงฟอร์มเข้าสู่ระบบ

#### Endpoint Information / ข้อมูล Endpoint

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/login` |
| **Route Name** | `login` |
| **Controller** | `LoginController@showLoginForm` |
| **Middleware** | `guest` |

#### Request / คำขอ

```http
GET /login HTTP/1.1
Host: evaluation.example.com
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
Accept-Language: th,en;q=0.5
Accept-Encoding: gzip, deflate
```

#### Response / การตอบกลับ

```php
// Controller Response
return Inertia::render('Auth/Login', [
    'announcement' => [
        'title' => 'ประกาศการประเมิน 360 องศา กนอ.',
        'deadline' => '28 มีนาคม 2568',
        'year' => '2567-2568',
        'show' => true
    ]
]);
```

#### Response Format / รูปแบบการตอบกลับ

```json
{
  "component": "Auth/Login",
  "props": {
    "announcement": {
      "title": "ประกาศการประเมิน 360 องศา กนอ.",
      "deadline": "28 มีนาคม 2568",
      "year": "2567-2568",
      "show": true
    },
    "auth": {
      "user": null
    },
    "flash": {},
    "errors": {}
  },
  "url": "/login",
  "version": "1.0"
}
```

### 2. Process Login / ดำเนินการเข้าสู่ระบบ

#### Endpoint Information / ข้อมูล Endpoint

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/login` |
| **Controller** | `LoginController@login` |
| **Middleware** | `guest` |

#### Request / คำขอ

##### Headers / หัวข้อ

```http
POST /login HTTP/1.1
Host: evaluation.example.com
Content-Type: application/json
Accept: application/json
X-Requested-With: XMLHttpRequest
X-Inertia: true
X-Inertia-Version: 1.0
X-CSRF-TOKEN: {{ csrf_token }}
```

##### Request Body / เนื้อหาคำขอ

```json
{
  "emid": "123456",
  "password": "01012568",
  "remember": true
}
```

##### Validation Rules / กฎการตรวจสอบ

```php
$credentials = $request->validate([
    'emid'     => 'required|digits:6',
    'password' => 'required|digits:8',
]);
```

#### Response Scenarios / สถานการณ์การตอบกลับ

##### 1. Successful Login (Admin) / การล็อกอินสำเร็จ (ผู้ดูแลระบบ)

```http
HTTP/1.1 302 Found
Location: /dashboardadmin
X-Inertia-Location: /dashboardadmin
```

```json
{
  "props": {
    "flash": {
      "success": "ยินดีต้อนรับกลับ Admin!"
    }
  }
}
```

##### 2. Successful Login (User) / การล็อกอินสำเร็จ (ผู้ใช้ทั่วไป)

```http
HTTP/1.1 302 Found
Location: /dashboard
X-Inertia-Location: /dashboard
```

```json
{
  "props": {
    "flash": {
      "success": "ยินดีต้อนรับกลับ!"
    }
  }
}
```

##### 3. Invalid Credentials / ข้อมูลไม่ถูกต้อง

```http
HTTP/1.1 302 Found
Location: /login
```

```json
{
  "props": {
    "errors": {
      "emid": "ข้อมูลไม่ถูกต้อง"
    },
    "flash": {}
  }
}
```

##### 4. Validation Errors / ข้อผิดพลาดการตรวจสอบ

```http
HTTP/1.1 422 Unprocessable Entity
```

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "emid": [
      "The emid field is required.",
      "The emid must be 6 digits."
    ],
    "password": [
      "The password field is required.",
      "The password must be 8 digits."
    ]
  }
}
```

##### 5. Rate Limit Exceeded / เกินขีดจำกัดการพยายาม

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

```json
{
  "message": "พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่..."
}
```

### 3. Logout / ออกจากระบบ

#### Endpoint Information / ข้อมูล Endpoint

| Property | Value |
|----------|-------|
| **Method** | `POST` |
| **URL** | `/logout` |
| **Route Name** | `logout` |
| **Controller** | `LoginController@logout` |
| **Middleware** | `web` |

#### Request / คำขอ

```http
POST /logout HTTP/1.1
Host: evaluation.example.com
Content-Type: application/json
X-CSRF-TOKEN: {{ csrf_token }}
X-Requested-With: XMLHttpRequest
X-Inertia: true
Authorization: Bearer {{ session_token }}
```

#### Response / การตอบกลับ

```http
HTTP/1.1 302 Found
Location: /
X-Inertia-Location: /
```

```json
{
  "props": {
    "auth": {
      "user": null
    },
    "flash": {}
  }
}
```

## Controller Implementation / การดำเนินการ Controller

### LoginController Class / คลาส LoginController

```php
<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LoginController extends Controller
{
    // Methods implementation...
}
```

### Method Specifications / ข้อกำหนดเมธอด

#### 1. showLoginForm() Method

```php
/**
 * แสดงฟอร์มเข้าสู่ระบบ
 * 
 * @return \Inertia\Response
 */
public function showLoginForm()
{
    return Inertia::render('Auth/Login', [
        'announcement' => [
            'title' => 'ประกาศการประเมิน 360 องศา กนอ.',
            'deadline' => '28 มีนาคม 2568',
            'year' => '2567-2568',
            'show' => true
        ]
    ]);
}
```

#### 2. login() Method

```php
/**
 * ดำเนินการเข้าสู่ระบบ
 * 
 * @param \Illuminate\Http\Request $request
 * @return \Illuminate\Http\RedirectResponse
 */
public function login(Request $request)
{
    // 1. Check rate limiting
    $this->checkTooManyAttempts($request);

    // 2. Validate input
    $credentials = $request->validate([
        'emid'     => 'required|digits:6',
        'password' => 'required|digits:8',
    ]);

    // 3. Attempt authentication
    $remember = $request->boolean('remember');
    $key = $this->throttleKey($request);

    if (Auth::attempt($credentials, $remember)) {
        // Success flow
        RateLimiter::clear($key);
        $request->session()->regenerate();
        Auth::logoutOtherDevices($request->password);
        
        // Log successful login
        Log::info('Login successful', [
            'emid'       => $request->emid,
            'ip'         => $request->ip(),
            'user_agent' => $request->userAgent(),
            'time'       => now(),
        ]);

        // Role-based redirect
        if (Auth::user()->role === 'admin') {
            return redirect()->route('admindashboard')
                           ->with('success', 'ยินดีต้อนรับกลับ Admin!');
        }

        return redirect()->route('dashboard')
                       ->with('success', 'ยินดีต้อนรับกลับ!');
    }

    // Failure flow
    RateLimiter::hit($key, 60);
    
    Log::warning('Login failed', [
        'emid'       => $request->emid,
        'ip'         => $request->ip(),
        'user_agent' => $request->userAgent(),
        'time'       => now(),
    ]);

    return back()->withErrors([
        'emid' => 'ข้อมูลไม่ถูกต้อง',
    ])->onlyInput('emid');
}
```

#### 3. logout() Method

```php
/**
 * ออกจากระบบ
 * 
 * @param \Illuminate\Http\Request $request
 * @return \Illuminate\Http\RedirectResponse
 */
public function logout(Request $request)
{
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    
    return redirect('/');
}
```

#### 4. Rate Limiting Helper Methods

```php
/**
 * ตรวจสอบการพยายามเข้าสู่ระบบมากเกินไป
 * 
 * @param \Illuminate\Http\Request $request
 * @throws \Symfony\Component\HttpKernel\Exception\HttpException
 */
protected function checkTooManyAttempts(Request $request)
{
    $key = $this->throttleKey($request);
    if (RateLimiter::tooManyAttempts($key, 5)) {
        abort(429, 'พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่...');
    }
}

/**
 * สร้าง throttle key ต่อ IP + emid
 * 
 * @param \Illuminate\Http\Request $request
 * @return string
 */
protected function throttleKey(Request $request)
{
    return Str::lower($request->input('emid')) . '|' . $request->ip();
}
```

## Security Implementation / การดำเนินการด้านความปลอดภัย

### 1. CSRF Protection / การป้องกัน CSRF

```php
// Automatic CSRF protection via web middleware
// Token included in all forms and AJAX requests
'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
```

### 2. Rate Limiting Configuration / การตั้งค่าจำกัดอัตรา

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Max Attempts | 5 | Prevent brute force |
| Decay Time | 60 seconds | Lockout duration |
| Key Format | `{emid}\|{ip}` | Per-user-per-IP |

### 3. Session Security / ความปลอดภัยเซสชัน

```php
// Session configuration in config/session.php
'lifetime' => 120,              // 2 hours
'expire_on_close' => false,     // Persistent sessions
'encrypt' => false,             // Handled by HTTPS
'files' => storage_path('framework/sessions'),
'connection' => null,
'table' => 'sessions',
'store' => null,
'lottery' => [2, 100],          // 2% chance of cleanup
'cookie' => env('SESSION_COOKIE', 'laravel_session'),
'path' => '/',
'domain' => env('SESSION_DOMAIN', null),
'secure' => env('SESSION_SECURE_COOKIE', false),
'http_only' => true,
'same_site' => 'lax',
```

## Error Codes & Messages / รหัสข้อผิดพลาดและข้อความ

### HTTP Status Codes / รหัสสถานะ HTTP

| Code | Scenario | Description |
|------|----------|-------------|
| 200 | Successful page load | Login form displayed |
| 302 | Successful login | Redirect to dashboard |
| 422 | Validation error | Invalid input format |
| 429 | Rate limit exceeded | Too many attempts |
| 500 | Server error | Internal system error |

### Error Messages / ข้อความแสดงข้อผิดพลาด

| Type | Thai Message | English Equivalent |
|------|-------------|-------------------|
| Invalid credentials | ข้อมูลไม่ถูกต้อง | Invalid credentials |
| Rate limit | พยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่... | Too many login attempts, please wait |
| Validation - required | ฟิลด์นี้จำเป็นต้องกรอก | This field is required |
| Validation - digits | ต้องเป็นตัวเลข X หลัก | Must be X digits |

## Logging & Monitoring / การบันทึกและติดตามการใช้งาน

### Log Levels / ระดับการบันทึก

```php
// Successful logins
Log::info('Login successful', $context);

// Failed logins
Log::warning('Login failed', $context);

// Rate limit hits
Log::warning('Rate limit exceeded', $context);

// System errors
Log::error('Login system error', $context);
```

### Log Context Data / ข้อมูลบริบทการบันทึก

```php
$context = [
    'emid'       => $request->emid,        // Employee ID
    'ip'         => $request->ip(),        // Client IP
    'user_agent' => $request->userAgent(), // Browser info
    'time'       => now(),                 // Timestamp
    'session_id' => session()->getId(),    // Session identifier
];
```

## Integration Points / จุดเชื่อมต่อ

### 1. Inertia.js Integration / การเชื่อมต่อ Inertia.js

```javascript
// Frontend form submission
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing, errors } = useForm({
    emid: '',
    password: '',
    remember: false,
});

const submit = (e) => {
    e.preventDefault();
    post('/login');
};
```

### 2. Middleware Integration / การเชื่อมต่อ Middleware

```php
// Route middleware stack
Route::middleware(['web', 'guest'])->group(function () {
    // Guest routes
});

Route::middleware(['web', 'auth'])->group(function () {
    // Authenticated routes
});
```

### 3. User Model Integration / การเชื่อมต่อ User Model

```php
// Custom route key binding
public function getRouteKeyName(): string
{
    return 'emid';  // Use employee ID instead of primary key
}
```

## Performance Considerations / ข้อพิจารณาด้านประสิทธิภาพ

### 1. Database Optimization / การปรับปรุงฐานข้อมูล

```php
// Indexed fields for fast lookup
Schema::table('users', function (Blueprint $table) {
    $table->index('emid');
    $table->index(['emid', 'password']);
});
```

### 2. Caching Strategy / กลยุทธ์การแคช

```php
// Rate limiting uses Laravel's cache
// Session data cached for performance
// User lookup optimization via index
```

### 3. Response Optimization / การปรับปรุงการตอบกลับ

- Minimal data in authentication responses
- Efficient redirect handling
- Compressed response data

## Testing Endpoints / การทดสอบ Endpoints

### 1. Unit Tests / การทดสอบหน่วย

```php
// Test login with valid credentials
$response = $this->post('/login', [
    'emid' => '123456',
    'password' => '01012568'
]);

$response->assertRedirect('/dashboard');
```

### 2. Integration Tests / การทดสอบการเชื่อมต่อ

```php
// Test rate limiting
for ($i = 0; $i < 6; $i++) {
    $this->post('/login', ['emid' => '123456', 'password' => 'wrong']);
}

$response = $this->post('/login', [
    'emid' => '123456',
    'password' => '01012568'
]);

$response->assertStatus(429);
```

### 3. Security Tests / การทดสอบความปลอดภัย

```php
// Test CSRF protection
$response = $this->withoutMiddleware(VerifyCsrfToken::class)
                 ->post('/login', $credentials);

// Test SQL injection prevention  
$response = $this->post('/login', [
    'emid' => "'; DROP TABLE users; --",
    'password' => '01012568'
]);
```