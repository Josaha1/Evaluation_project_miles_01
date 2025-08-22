# Login System Specification - ระบบประเมิน 360 องศา

## Overview / ภาพรวม

This directory contains comprehensive documentation for the login and authentication system of the 360-degree evaluation platform. The system provides secure user authentication with role-based access control.

ไดเรกทอรีนี้ประกอบด้วยเอกสารครบถ้วนสำหรับระบบล็อกอินและการยืนยันตัวตนของแพลตฟอร์มประเมิน 360 องศา ระบบให้การยืนยันตัวตนของผู้ใช้ที่ปลอดภัยพร้อมการควบคุมการเข้าถึงแบบบทบาท

## Authentication System Features / คุณสมบัติระบบยืนยันตัวตน

### Core Features / คุณสมบัติหลัก
- **Employee ID + Password Authentication** / การยืนยันตัวตนด้วยรหัสพนักงาน + รหัสผ่าน
- **Role-Based Access Control (RBAC)** / การควบคุมการเข้าถึงแบบบทบาท
- **Rate Limiting & Brute Force Protection** / การจำกัดอัตราและป้องกันการโจมตีแบบลองรหัส
- **Session Security & Management** / ความปลอดภัยและการจัดการเซสชัน
- **Single Device Policy** / นโยบายอุปกรณ์เดียว
- **Comprehensive Audit Logging** / การบันทึกตรวจสอบแบบครบถ้วน

### UI/UX Features / คุณสมบัติ UI/UX
- **Responsive Design** / การออกแบบตอบสนอง
- **Announcement System** / ระบบประกาศ
- **Help & Support Integration** / การเชื่อมต่อช่วยเหลือและสนับสนุน
- **Video Tutorial Modal** / โมดัลวีดีโอแนะนำ
- **LINE Support Integration** / การเชื่อมต่อช่วยเหลือ LINE

## Documentation Structure / โครงสร้างเอกสาร

### 📋 [Authentication Flow](./authentication_flow.md)
Complete authentication process from login attempt to successful access, including:
- Pre-login phase with announcement system
- Login validation and security checks
- Post-login security measures and redirections
- Rate limiting and error handling
- Comprehensive flow diagrams

กระบวนการยืนยันตัวตนแบบครบถ้วนตั้งแต่การพยายามล็อกอินจนถึงการเข้าถึงที่สำเร็จ

### 🔒 [Security Features](./security_features.md)
Detailed security mechanisms and protections:
- Rate limiting and brute force protection
- Session security and fixation prevention
- Input validation and sanitization
- CSRF protection and error handling
- Logging and audit trails
- Attack vector protection strategies

กลไกความปลอดภัยและการป้องกันแบบละเอียด

### 🎨 [User Interface](./user_interface.md)
UI components, design patterns, and user experience:
- Login page layout and responsive design
- Form components and validation
- Modal systems (announcements, help, video)
- Error handling and accessibility
- Animation and theme support

คอมโพเนนต์ UI รูปแบบการออกแบบ และประสบการณ์ผู้ใช้

### 🔌 [API Endpoints](./api_endpoints.md)
Backend routes, controllers, and API specifications:
- Route definitions and middleware
- Request/response formats
- Error codes and messages
- Controller implementations
- Security measures and testing

เส้นทางแบ็กเอนด์ controllers และข้อกำหนด API

### 🛡️ [Middleware & Guards](./middleware_and_guards.md)
Authentication middleware and authorization systems:
- Guest and auth middleware
- Custom role middleware
- Guard configurations
- Policy-based authorization
- Middleware execution flow

Middleware การยืนยันตัวตนและระบบการอนุญาต

### 📊 [Session Management](./session_management.md)
Session lifecycle, security, and configuration:
- Session creation and validation
- Security features and storage options
- Performance optimization
- Monitoring and cleanup
- Troubleshooting guide

วงจรชีวิตเซสชัน ความปลอดภัย และการตั้งค่า

### 👥 [Role-Based Access](./role_based_access.md)
Role system and permission management:
- User roles and permission matrix
- Route-based authorization
- Frontend permission integration
- Evaluation-specific authorization
- Security considerations

ระบบบทบาทและการจัดการสิทธิ์

## Quick Reference / อ้างอิงด่วน

### Authentication Credentials / ข้อมูลยืนยันตัวตน

| Field | Format | Example | Validation |
|-------|--------|---------|------------|
| Employee ID | 6 digits | `123456` | `required\|digits:6` |
| Password | 8 digits | `01012568` | `required\|digits:8` |
| Remember Me | Boolean | `true/false` | `boolean` |

### User Roles / บทบาทผู้ใช้

| Role | Thai Name | Dashboard Route | Permissions |
|------|-----------|-----------------|-------------|
| `admin` | ผู้ดูแลระบบ | `/dashboardadmin` | Full system access |
| `user` | ผู้ใช้ทั่วไป | `/dashboard` | Evaluation access only |

### Key Routes / เส้นทางหลัก

| Method | Route | Purpose | Middleware |
|--------|-------|---------|------------|
| `GET` | `/login` | Show login form | `guest` |
| `POST` | `/login` | Process login | `guest` |
| `POST` | `/logout` | Logout user | `web` |
| `GET` | `/dashboard` | User dashboard | `auth`, `role:user` |
| `GET` | `/dashboardadmin` | Admin dashboard | `auth`, `role:admin` |

### Security Configuration / การตั้งค่าความปลอดภัย

| Feature | Configuration | Value |
|---------|---------------|-------|
| Rate Limiting | Max attempts | 5 per minute |
| Session Lifetime | Duration | 120 minutes |
| Password Policy | Default | `01012568` |
| CSRF Protection | Enabled | Yes |
| Session Regeneration | On login | Yes |
| Single Device | Enforced | Yes |

## File Locations / ตำแหน่งไฟล์

### Backend Files / ไฟล์แบ็กเอนด์

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Auth/
│   │       └── LoginController.php          # Main login controller
│   └── Middleware/
│       ├── RoleMiddleware.php               # Role-based authorization
│       └── HandleInertiaRequests.php       # Inertia middleware
├── Models/
│   └── User.php                             # User model with auth methods
config/
├── auth.php                                 # Authentication configuration
└── session.php                              # Session configuration
routes/
└── web.php                                  # Route definitions
```

### Frontend Files / ไฟล์ฟรอนต์เอนด์

```
resources/js/
├── pages/
│   ├── Auth/
│   │   └── Login.tsx                        # Main login component
│   └── errors/
│       └── unauthorized.tsx                 # Error page
└── Components/
    ├── AnnouncementModal.tsx                # Announcement system
    ├── TextInput.tsx                        # Form inputs
    └── InputLabel.tsx                       # Form labels
```

## Development Workflow / ขั้นตอนการพัฒนา

### 1. Authentication Testing / การทดสอบการยืนยันตัวตน

```bash
# Run authentication tests
php artisan test --filter=AuthenticationTest

# Test specific scenarios
php artisan test tests/Feature/LoginTest.php
```

### 2. Security Validation / การตรวจสอบความปลอดภัย

```bash
# Check rate limiting
php artisan test --filter=RateLimitTest

# Validate CSRF protection
php artisan test --filter=CsrfTest
```

### 3. Role Authorization Testing / การทดสอบการอนุญาตตามบทบาท

```bash
# Test role-based access
php artisan test --filter=RoleTest

# Validate middleware
php artisan test tests/Unit/RoleMiddlewareTest.php
```

## Troubleshooting / การแก้ปัญหา

### Common Issues / ปัญหาทั่วไป

1. **Login fails with correct credentials**
   - Check database connection
   - Verify user exists with correct `emid`
   - Confirm password format (8 digits)

2. **Rate limiting triggered incorrectly**
   - Clear rate limit cache: `php artisan cache:clear`
   - Check IP address detection
   - Verify throttle key generation

3. **Session not persisting**
   - Check session configuration
   - Verify file permissions for file driver
   - Confirm database table for database driver

4. **Role redirection not working**
   - Verify user role in database
   - Check route middleware configuration
   - Confirm role middleware registration

### Debug Commands / คำสั่งแก้ไขจุดบกพร่อง

```bash
# Clear all caches
php artisan optimize:clear

# Check configuration
php artisan config:show session
php artisan config:show auth

# Monitor logs
tail -f storage/logs/laravel.log

# Check routes
php artisan route:list --name=login
```

## Security Checklist / รายการตรวจสอบความปลอดภัย

### Production Deployment / การนำไปใช้งานจริง

- [ ] **HTTPS enabled** for all authentication endpoints
- [ ] **Session cookies** set to secure and httpOnly
- [ ] **Rate limiting** configured and tested
- [ ] **CSRF protection** enabled and verified
- [ ] **Session lifetime** set appropriately
- [ ] **Error messages** don't reveal sensitive information
- [ ] **Logging** configured for security events
- [ ] **Database indexes** optimized for performance
- [ ] **Input validation** comprehensive and tested
- [ ] **Role permissions** properly restricted

### Ongoing Maintenance / การบำรุงรักษาต่อเนื่อง

- [ ] **Regular security audits** of authentication flow
- [ ] **Session cleanup** scheduled and running
- [ ] **Log monitoring** for suspicious activity
- [ ] **Performance monitoring** of authentication endpoints
- [ ] **User feedback** collection and analysis
- [ ] **Documentation updates** as system evolves

## Contact & Support / การติดต่อและการสนับสนุน

For questions about the login system or this documentation:

สำหรับคำถามเกี่ยวกับระบบล็อกอินหรือเอกสารนี้:

- **LINE Support**: Scan QR code in login page or visit `https://line.me/ti/g/h-kyfpQGQE`
- **Working Hours**: 8:30-16:30, Monday-Friday / จันทร์-ศุกร์
- **Video Tutorial**: Available in login page modal / มีในโมดัลหน้าล็อกอิน

---

*Last Updated: August 2025*  
*เอกสารนี้อัปเดตครั้งล่าสุด: สิงหาคม 2568*