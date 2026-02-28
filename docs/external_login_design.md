# External Organization Login — Technical Design
# ระบบ Login สำหรับองค์กรภายนอก (องศาขวา)

> **วันที่จัดทำ**: 23 กุมภาพันธ์ 2569
> **ระบบหลัก**: 360-Degree Evaluation — กนอ.

---

## 1. การตัดสินใจ: Access Code + QR Code Hybrid

### เหตุผลที่เลือก

| เหตุผล | รายละเอียด |
|--------|-----------|
| **ไม่พึ่ง 3rd Party** | ไม่ต้องใช้ LINE API, Google OAuth, SMS Gateway |
| **แจกได้ทุกช่องทาง** | LINE, เอกสาร, งานประชุม, SMS, พิมพ์กระดาษ |
| **Tag Organization ได้ชัดเจน** | รหัสองค์กรฝังอยู่ใน Access Code |
| **Audit Trail สมบูรณ์** | ทราบว่าใคร (code) จากองค์กรใด ประเมินเมื่อไร |
| **ง่ายสำหรับผู้ใช้** | พิมพ์ 2 ช่อง หรือสแกน QR ได้เลย |
| **Dev เร็ว** | ไม่มี OAuth flow, implement ใน Sprint 0 ได้ |
| **Revocable** | ยกเลิก/หมดอายุ code ได้ทันที |

---

## 2. รูปแบบ Access Code

### โครงสร้าง Code

```
Access Code: IEAT-[ORG_CODE]-[RANDOM_6]
ตัวอย่าง  : IEAT-BKKP-A7X3K2

ประกอบด้วย:
  IEAT      = ชื่อระบบ (คงที่)
  BKKP      = รหัสย่อองค์กร (Admin กำหนด)
  A7X3K2    = รหัสเฉพาะบุคคล 6 ตัวอักษร (auto-generate)
```

### QR Code

```
QR Code เนื้อหา:
  https://[domain]/external/evaluate?token=IEAT-BKKP-A7X3K2

→ สแกนแล้วเข้าหน้า pre-filled ทันที
→ ไม่ต้องพิมพ์อะไร
```

---

## 3. Database Design

### ตารางใหม่ที่ต้องสร้าง

```sql
-- ตาราง 1: องค์กรภายนอก
CREATE TABLE external_organizations (
    id              bigint UNSIGNED PK AUTO_INCREMENT,
    name            varchar(255) NOT NULL,    -- ชื่อองค์กร เช่น "บริษัท ABC จำกัด"
    org_code        varchar(20) UNIQUE,       -- รหัสย่อ เช่น "BKKP"
    type            varchar(100) NULL,         -- ประเภท: คู่ค้า / ผู้ประกอบการ / พันธมิตร
    contact_name    varchar(255) NULL,         -- ชื่อผู้ติดต่อหลัก
    created_at      timestamp NULL,
    updated_at      timestamp NULL
);

-- ตาราง 2: External Access Codes
CREATE TABLE external_access_codes (
    id                        bigint UNSIGNED PK AUTO_INCREMENT,
    access_code               varchar(50) UNIQUE NOT NULL,  -- IEAT-BKKP-A7X3K2
    qr_token                  varchar(100) UNIQUE NOT NULL, -- token สำหรับ URL
    external_organization_id  bigint UNSIGNED FK,           -- → external_organizations.id
    evaluator_name            varchar(255) NOT NULL,         -- ชื่อผู้ประเมิน (กรอกตอนสร้าง)
    evaluator_position        varchar(255) NULL,             -- ตำแหน่งในองค์กรภายนอก
    expires_at                timestamp NULL,                -- วันหมดอายุ (NULL = ไม่หมด)
    used_at                   timestamp NULL,                -- วันที่ใช้ครั้งแรก
    last_active_at            timestamp NULL,                -- ใช้งานล่าสุด
    status                    enum('active','used','expired','revoked') DEFAULT 'active',
    created_at                timestamp NULL,
    updated_at                timestamp NULL,

    FOREIGN KEY (external_organization_id) REFERENCES external_organizations(id)
);

-- ตาราง 3: Sessions สำหรับ External (แยกจาก Laravel session หลัก)
CREATE TABLE external_sessions (
    id              varchar(100) PK,          -- session token
    access_code_id  bigint UNSIGNED FK,       -- → external_access_codes.id
    payload         text,
    ip_address      varchar(45) NULL,
    user_agent      text NULL,
    last_activity   int NOT NULL,
    expires_at      timestamp NULL,

    FOREIGN KEY (access_code_id) REFERENCES external_access_codes(id)
);
```

### เพิ่ม Column ใน `evaluation_assignments`

```sql
-- ผูก assignment กับ access code ที่ใช้ประเมิน
ALTER TABLE evaluation_assignments
    ADD COLUMN external_access_code_id bigint UNSIGNED NULL,
    ADD FOREIGN KEY (external_access_code_id)
        REFERENCES external_access_codes(id) ON DELETE SET NULL;
```

### ความสัมพันธ์กับตาราง `answers`

```
answers.user_id          → ไม่มีการเปลี่ยนแปลง (ใช้ dummy user_id หรือ external_id)
answers.evaluation_id    → eval ID ของผู้ว่าการ/ผู้บริหาร (angle = 'right')
answers.evaluatee_id     → internal staff ที่ถูกประเมิน

เพิ่ม column ใน answers:
ALTER TABLE answers ADD COLUMN external_access_code_id bigint UNSIGNED NULL;
→ ทำให้รู้ว่าคำตอบนี้มาจาก access code ใด (= จากองค์กรใด)
```

---

## 4. Authentication Flow

### 4.1 เข้าผ่าน Access Code (พิมพ์เอง)

```
┌──────────────────────────────────────────────────────┐
│  หน้า External Login (/external/login)               │
│                                                      │
│  กรอกรหัสเข้าถึง:                                    │
│  ┌────────────────────────────────┐                  │
│  │  IEAT-BKKP-A7X3K2             │                  │
│  └────────────────────────────────┘                  │
│                                                      │
│         [ เข้าสู่ระบบประเมิน ]                      │
└──────────────────────────────────────────────────────┘
          │
          ▼ validate access_code
┌──────────────────────────────────────────────────────┐
│  หน้ายืนยันตัวตน (/external/confirm)                │
│                                                      │
│  ยืนยันข้อมูลของท่าน:                                │
│  ชื่อ      : [นาย ก. จาก ADMIN PRE-FILL]            │
│  องค์กร   : [บริษัท ABC จำกัด]                      │
│  ประเมินให้: [ผู้บริหาร X, Y, Z]                    │
│                                                      │
│    [ ยืนยัน และเริ่มประเมิน ]                       │
└──────────────────────────────────────────────────────┘
          │
          ▼ สร้าง external session
┌──────────────────────────────────────────────────────┐
│  หน้าประเมิน (/external/evaluate)                   │
│  แสดงรายชื่อที่ต้องประเมิน + ฟอร์ม                  │
└──────────────────────────────────────────────────────┘
```

### 4.2 เข้าผ่าน QR Code

```
สแกน QR Code
    │
    ▼
/external/evaluate?token=abc123xyz
    │
    ▼ validate qr_token → ดึง access code info
    │
    ▼ ข้ามหน้า login → เข้าหน้ายืนยันตัวตนทันที
    │
    ▼ เริ่มประเมิน
```

---

## 5. Laravel Implementation

### Routes (routes/web.php)

```php
// External Evaluator Routes (ไม่ต้องใช้ Auth middleware ปกติ)
Route::prefix('external')->name('external.')->group(function () {

    // Login page
    Route::get('/login', [ExternalEvaluatorController::class, 'showLogin'])
        ->name('login');
    Route::post('/login', [ExternalEvaluatorController::class, 'processLogin'])
        ->name('login.process');

    // QR Code direct entry
    Route::get('/evaluate', [ExternalEvaluatorController::class, 'qrEntry'])
        ->name('qr-entry');

    // Confirm identity
    Route::get('/confirm', [ExternalEvaluatorController::class, 'showConfirm'])
        ->middleware('external.auth')
        ->name('confirm');
    Route::post('/confirm', [ExternalEvaluatorController::class, 'processConfirm'])
        ->middleware('external.auth')
        ->name('confirm.process');

    // Evaluation
    Route::get('/dashboard', [ExternalEvaluatorController::class, 'dashboard'])
        ->middleware('external.auth')
        ->name('dashboard');
    Route::get('/evaluate/{evaluateeId}', [ExternalEvaluatorController::class, 'showEvaluation'])
        ->middleware('external.auth')
        ->name('evaluate');
    Route::post('/save-answer', [ExternalEvaluatorController::class, 'saveAnswer'])
        ->middleware('external.auth')
        ->name('save-answer');
    Route::post('/submit/{evaluateeId}', [ExternalEvaluatorController::class, 'submitEvaluation'])
        ->middleware('external.auth')
        ->name('submit');

    // Logout
    Route::post('/logout', [ExternalEvaluatorController::class, 'logout'])
        ->name('logout');
});

// Admin: จัดการ External Organizations + Codes
Route::prefix('admin/external')->middleware(['auth', 'role:admin'])
    ->name('admin.external.')->group(function () {

    Route::resource('organizations', AdminExternalOrganizationController::class);
    Route::resource('access-codes', AdminExternalAccessCodeController::class);
    Route::post('access-codes/{id}/regenerate', [AdminExternalAccessCodeController::class, 'regenerate'])
        ->name('access-codes.regenerate');
    Route::post('access-codes/{id}/revoke', [AdminExternalAccessCodeController::class, 'revoke'])
        ->name('access-codes.revoke');
    Route::get('access-codes/{id}/qr', [AdminExternalAccessCodeController::class, 'downloadQR'])
        ->name('access-codes.qr');
    Route::get('access-codes/{id}/print', [AdminExternalAccessCodeController::class, 'printCard'])
        ->name('access-codes.print');
});
```

### Middleware (app/Http/Middleware/ExternalAuth.php)

```php
class ExternalAuth
{
    public function handle(Request $request, Closure $next)
    {
        $sessionToken = session('external_session_token');

        if (!$sessionToken) {
            return redirect()->route('external.login')
                ->with('error', 'กรุณาเข้าสู่ระบบก่อน');
        }

        $externalSession = ExternalSession::where('id', $sessionToken)
            ->where('expires_at', '>', now())
            ->with('accessCode.organization')
            ->first();

        if (!$externalSession || $externalSession->accessCode->status !== 'active') {
            session()->forget('external_session_token');
            return redirect()->route('external.login')
                ->with('error', 'รหัสหมดอายุหรือถูกยกเลิก');
        }

        // แนบข้อมูลเข้า request
        $request->merge([
            'external_evaluator' => $externalSession->accessCode,
            'external_organization' => $externalSession->accessCode->organization,
        ]);

        return $next($request);
    }
}
```

### Controller หลัก

```php
class ExternalEvaluatorController extends Controller
{
    // 1. แสดงหน้า Login
    public function showLogin()
    {
        return Inertia::render('External/Login');
    }

    // 2. ตรวจสอบ Access Code
    public function processLogin(Request $request)
    {
        $code = strtoupper(trim($request->input('access_code')));

        $accessCode = ExternalAccessCode::where('access_code', $code)
            ->where('status', 'active')
            ->where(function($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->with(['organization', 'assignments.evaluatee'])
            ->first();

        if (!$accessCode) {
            return back()->withErrors(['access_code' => 'รหัสไม่ถูกต้องหรือหมดอายุ']);
        }

        // สร้าง external session
        $sessionToken = Str::random(60);
        ExternalSession::create([
            'id'             => $sessionToken,
            'access_code_id' => $accessCode->id,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'last_activity'  => now()->timestamp,
            'expires_at'     => now()->addHours(8),
        ]);

        // บันทึกเวลาที่ใช้ครั้งแรก
        if (!$accessCode->used_at) {
            $accessCode->update(['used_at' => now()]);
        }
        $accessCode->update(['last_active_at' => now()]);

        session(['external_session_token' => $sessionToken]);

        return redirect()->route('external.confirm');
    }

    // 3. QR Code Entry
    public function qrEntry(Request $request)
    {
        $token = $request->query('token');

        $accessCode = ExternalAccessCode::where('qr_token', $token)
            ->where('status', 'active')
            ->first();

        if (!$accessCode) {
            return redirect()->route('external.login')
                ->with('error', 'QR Code ไม่ถูกต้องหรือหมดอายุ');
        }

        // Auto-login ผ่าน QR (เหมือน processLogin แต่ใช้ qr_token)
        $sessionToken = Str::random(60);
        ExternalSession::create([...]);
        session(['external_session_token' => $sessionToken]);

        return redirect()->route('external.confirm');
    }

    // 4. Dashboard — รายชื่อที่ต้องประเมิน
    public function dashboard(Request $request)
    {
        $accessCode = $request->external_evaluator;

        $assignments = EvaluationAssignment::where('external_access_code_id', $accessCode->id)
            ->with(['evaluatee.position', 'evaluatee.department', 'evaluation'])
            ->get()
            ->map(function($assignment) use ($accessCode) {
                $answeredCount = Answer::where('external_access_code_id', $accessCode->id)
                    ->where('evaluatee_id', $assignment->evaluatee_id)
                    ->count();

                $totalQuestions = Question::whereHas('part', function($q) use ($assignment) {
                    $q->where('evaluation_id', $assignment->evaluation_id);
                })->count();

                return [
                    'evaluatee'       => $assignment->evaluatee,
                    'evaluation'      => $assignment->evaluation,
                    'answered'        => $answeredCount,
                    'total'           => $totalQuestions,
                    'completed'       => $answeredCount >= $totalQuestions,
                    'progress'        => $totalQuestions > 0
                        ? round(($answeredCount / $totalQuestions) * 100) : 0,
                ];
            });

        return Inertia::render('External/Dashboard', [
            'evaluatorName' => $accessCode->evaluator_name,
            'organization'  => $accessCode->organization->name,
            'assignments'   => $assignments,
            'expiresAt'     => $accessCode->expires_at,
        ]);
    }
}
```

---

## 6. Admin — จัดการ Access Codes

### Admin UI Flow

```
Admin Panel
└── External Organizations
    ├── 🏢 รายชื่อองค์กรภายนอก
    │   └── [+ เพิ่มองค์กร]
    │
    └── 🔑 Access Codes
        ├── ตารางรายการ codes ทั้งหมด
        │   ├── รหัส | ชื่อผู้ประเมิน | องค์กร | สถานะ | ใช้งาน | หมดอายุ
        │   └── ปุ่ม: [ดู QR] [พิมพ์ Card] [Revoke] [Regenerate]
        │
        └── [+ สร้าง Access Code ใหม่]
            ├── เลือกองค์กร (dropdown)
            ├── ชื่อผู้ประเมิน
            ├── ตำแหน่ง
            ├── เลือกผู้ถูกประเมิน (evaluatee)
            ├── วันหมดอายุ (optional)
            └── [สร้าง + Generate QR]
```

### Print Card สำหรับแจก

```
┌─────────────────────────────────────────┐
│         ระบบประเมิน 360 องศา กนอ.       │
│                                         │
│  ผู้ประเมิน: นาย ก. สมชาย               │
│  องค์กร   : บริษัท ABC จำกัด            │
│                                         │
│  รหัสเข้าถึง:                           │
│  ┌─────────────────────────────┐        │
│  │   IEAT-BKKP-A7X3K2         │        │
│  └─────────────────────────────┘        │
│                                         │
│  [████ QR CODE ████]                    │
│                                         │
│  เว็บไซต์: [domain]/external/login      │
│  หรือสแกน QR Code ด้านบน                │
│                                         │
│  หมดอายุ: 31 พฤษภาคม 2569              │
└─────────────────────────────────────────┘
```

---

## 7. Frontend Pages (React)

### หน้าที่ต้องสร้างใหม่

```
resources/js/pages/External/
├── Login.tsx          ← กรอก Access Code หรือสแกน QR
├── Confirm.tsx        ← ยืนยันตัวตนก่อนเริ่ม
├── Dashboard.tsx      ← รายชื่อที่ต้องประเมิน + progress
└── Evaluate.tsx       ← ฟอร์มประเมิน (reuse AssignedEvaluationStep)
```

### External Dashboard UI

```
┌─────────────────────────────────────────────────────┐
│  ระบบประเมิน 360 องศา กนอ.                         │
├─────────────────────────────────────────────────────┤
│  สวัสดี, นาย ก. สมชาย                               │
│  องค์กร: บริษัท ABC จำกัด                           │
│  หมดอายุ: 31 พ.ค. 2569                              │
├─────────────────────────────────────────────────────┤
│  รายชื่อผู้บริหารที่ท่านต้องประเมิน                 │
│                                                     │
│  ✅ นาย ก.   ผู้ว่าการ กนอ.    เสร็จแล้ว           │
│  🔄 นาย ข.   รองผู้ว่าการ      [เริ่มประเมิน →]    │
│  ⏳ นาง ค.   ผู้ช่วยผู้ว่าการ  [เริ่มประเมิน →]    │
│                                                     │
│  ความคืบหน้ารวม: [████████░░] 1/3 เสร็จแล้ว        │
└─────────────────────────────────────────────────────┘
```

---

## 8. Integration กับ Report

### ผลใน AdminDashboard

```php
// ดึงคะแนนองศาขวา แยกตามองค์กร
$rightAngleScores = DB::table('answers as a')
    ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
    ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
    ->join('questions as q', 'a.question_id', '=', 'q.id')
    ->join('options as o', 'a.value', '=', 'o.id')
    ->where('a.evaluation_id', $evaluationId)
    ->where('a.evaluatee_id', $evaluateeId)
    ->where('q.type', 'rating')
    ->groupBy('eo.id', 'eo.name')
    ->select([
        'eo.name as organization_name',
        DB::raw('AVG(CAST(a.value AS DECIMAL(5,2))) as avg_score'),
        DB::raw('COUNT(DISTINCT eac.id) as evaluator_count'),
    ])
    ->get();
```

### การแสดงผลในรายงาน

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ผลการประเมินองศาขวา (External) — ผู้บริหาร: นาย ก.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  บริษัท ABC จำกัด       4.2  ██████████░  (3 คน)
  บริษัท XYZ จำกัด       3.8  █████████░░  (2 คน)
  ท่าเรือ LMN             4.5  ███████████  (1 คน)
  ─────────────────────────────────────────
  รวมองศาขวา (avg)        4.1              × 20% weight
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 9. Security

| มาตรการ | รายละเอียด |
|---------|-----------|
| Code Format | `IEAT-[ORG]-[RANDOM]` — random 6 chars A-Z0-9 = 2.1 พันล้าน combinations |
| Rate Limiting | จำกัด login attempt 5 ครั้ง/นาที ต่อ IP |
| Session Expiry | หมดอายุอัตโนมัติ 8 ชั่วโมงหลัง login |
| Code Expiry | Admin กำหนดวันหมดอายุได้ (แนะนำ 31 พ.ค. 2569) |
| Revoke | Admin ยกเลิก code ได้ทันทีถ้าสงสัยว่าหลุด |
| CSRF | Laravel CSRF protection (มีอยู่แล้ว) |
| Audit Log | บันทึก IP + user agent + เวลาที่ใช้ |
| HTTPS | บังคับใช้ HTTPS บน Hostinger (Let's Encrypt) |

---

## 10. สรุปงานที่ต้องทำ

| รายการ | ชั่วโมง |
|--------|:------:|
| Database Migration (3 ตารางใหม่ + 2 ALTER) | 4 |
| ExternalAuth Middleware | 4 |
| ExternalEvaluatorController (Login, QR, Dashboard, Evaluate) | 16 |
| AdminExternalOrganizationController (CRUD) | 8 |
| AdminExternalAccessCodeController (CRUD + QR Generate + Print) | 12 |
| React Pages: Login, Confirm, Dashboard, Evaluate | 14 |
| Admin React Pages: Org Management, Code Management | 10 |
| QR Code Generation (ใช้ library: simplesoftwareio/simple-qrcode) | 4 |
| Print Card PDF | 4 |
| Report Integration (คะแนนแยกตามองค์กร) | 8 |
| Security (Rate limiting, audit log) | 4 |
| Testing | 8 |
| **รวม** | **96 ชั่วโมง** |

---

*เอกสารนี้จัดทำเมื่อ 23 กุมภาพันธ์ 2569*
