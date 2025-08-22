# ระบบจัดการประเมินผลงาน 360 องศา (360-Degree Performance Evaluation Management System)

## สารบัญ
1. [ภาพรวมของระบบ](#ภาพรวมของระบบ)
2. [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
3. [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
4. [ระบบ Frontend](#ระบบ-frontend)
5. [ระบบ Backend](#ระบบ-backend)
6. [ระบบประเมินผล 360 องศา](#ระบบประเมินผล-360-องศา)
7. [ระบบคะแนนถ่วงน้ำหนัก](#ระบบคะแนนถ่วงน้ำหนัก)
8. [ระบบรายงานและส่งออกข้อมูล](#ระบบรายงานและส่งออกข้อมูล)
9. [ระบบรักษาความปลอดภัย](#ระบบรักษาความปลอดภัย)
10. [การติดตั้งและการใช้งาน](#การติดตั้งและการใช้งาน)

---

## ภาพรวมของระบบ

### วัตถุประสงค์
ระบบจัดการประเมินผลงาน 360 องศา เป็นระบบบริหารจัดการการประเมินผลงานพนักงานแบบหลากหลายมุมมอง (360-degree feedback) ที่ออกแบบมาเพื่อองค์กรภาครัฐและเอกชน โดยมีเป้าหมายเพื่อให้การประเมินผลงานเป็นไปอย่างยุติธรรม ครอบคลุม และมีประสิทธิภาพ

### คุณสมบัติหลัก
- **ระบบประเมิน 360 องศา**: รองรับการประเมินจากหลายมุมมอง (บน/ล่าง/ซ้าย/ขวา/ตนเอง)
- **ระบบคะแนนถ่วงน้ำหนัก**: คำนวณคะแนนตามเกณฑ์ที่แตกต่างกันตามระดับพนักงาน
- **ระบบรายงานขั้นสูง**: ส่งออกรายงานในรูปแบบต่างๆ พร้อมกราฟและสถิติ
- **ระบบจัดการผู้ใช้**: บริหารจัดการผู้ใช้ตามโครงสร้างองค์กร
- **ระบบติดตาม**: ติดตามความคืบหน้าของการประเมินแบบเรียลไทม์

### กลุ่มผู้ใช้
1. **ผู้ดูแลระบบ (Admin)**: จัดการระบบทั้งหมด สร้างแบบประเมิน จัดการผู้ใช้ และดูรายงาน
2. **ผู้ใช้ทั่วไป (User)**: ทำการประเมินตนเองและประเมินผู้อื่นที่ได้รับมอบหมาย
3. **ผู้ถูกประเมิน (Evaluatee)**: ผู้ที่ได้รับการประเมินจากผู้อื่น

---

## สถาปัตยกรรมระบบ

### เทคโนโลยีหลัก

#### Backend (Laravel 12)
- **Framework**: Laravel 12 with PHP 8.2+
- **Database**: MySQL with Eloquent ORM
- **Authentication**: Laravel Sanctum
- **Frontend Integration**: Inertia.js for SPA-like experience
- **Queue System**: Background job processing
- **Export**: PhpSpreadsheet for Excel exports

#### Frontend (React 19 + TypeScript)
- **Framework**: React 19 with TypeScript
- **Routing**: Inertia.js (server-side routing)
- **Styling**: Tailwind CSS v4 with Radix UI components
- **Charts**: Highcharts with React integration
- **Build Tool**: Vite with custom output to `public_html/build/`
- **State Management**: Server-driven via Inertia

### โครงสร้างไฟล์

#### Laravel Backend
```
app/
├── Http/Controllers/          # API controllers
│   ├── Admin*                # Admin controllers
│   ├── AssignedEvaluation*   # Evaluation controllers
│   └── Auth/                 # Authentication controllers
├── Models/                   # Eloquent models
├── Services/                 # Business logic services
├── Enums/                    # Type definitions
├── Policies/                 # Authorization policies
└── Export/                   # Export functionality

database/
├── migrations/               # Database schema
├── seeders/                  # Test data
└── factories/                # Model factories

routes/
└── web.php                   # Application routes
```

#### React Frontend
```
resources/js/
├── pages/                    # Inertia page components
│   ├── Admin*               # Admin pages
│   ├── Dashboard.tsx        # User dashboard
│   └── Auth/                # Authentication pages
├── Components/              # Reusable components
│   ├── ui/                  # shadcn/ui components
│   └── Report/              # Report components
├── Layouts/                 # Layout components
├── hooks/                   # Custom hooks
└── utils/                   # Utility functions
```

---

## โครงสร้างฐานข้อมูล

### ตารางหลัก

#### 1. โครงสร้างการประเมิน
```sql
-- การประเมิน
evaluations (id, title, description, status, user_type, grade_min, grade_max)

-- ส่วนของการประเมิน
parts (id, evaluation_id, title, order)

-- ด้านการประเมิน
aspects (id, part_id, name, has_subaspects)

-- ด้านย่อย
sub_aspects (id, aspect_id, name)

-- คำถาม
questions (id, part_id, aspect_id, sub_aspect_id, title, type, order)

-- ตัวเลือก
options (id, question_id, label, score)
```

#### 2. ผู้ใช้และโครงสร้างองค์กร
```sql
-- ผู้ใช้
users (id, emid, prename, fname, lname, sex, birthdate, password, photo, 
       grade, role, user_type, division_id, department_id, position_id, faction_id)

-- โครงสร้างองค์กร
divisions (id, name)
departments (id, name, division_id)
positions (id, title, department_id)
factions (id, name)
```

#### 3. ระบบมอบหมายและคำตอบ
```sql
-- การมอบหมายการประเมิน
evaluation_assignments (id, evaluation_id, evaluator_id, evaluatee_id, 
                        fiscal_year, angle)

-- คำตอบ
answers (id, evaluation_id, question_id, user_id, evaluatee_id, value, other_text)

-- ความคืบหน้า
evaluation_answer (id, evaluator_id, evaluatee_id, evaluation_id, 
                   status, progress, completed_at)
```

### ความสัมพันธ์ของข้อมูล

#### User Model
```php
// ความสัมพันธ์องค์กร
public function position(): BelongsTo
public function division(): BelongsTo
public function department(): BelongsTo
public function faction(): BelongsTo

// ความสัมพันธ์การประเมิน
public function assignmentsAsEvaluator(): HasMany
public function assignmentsAsEvaluatee(): HasMany
public function answersGiven(): HasMany
public function answersReceived(): HasMany
```

#### Evaluation Structure
```php
// โครงสร้างลำดับชั้น
Evaluation → Parts → Aspects → SubAspects → Questions → Options
```

---

## ระบบ Frontend

### สถาปัตยกรรม Component

#### 1. Layout Components
- **MainLayout**: Layout หลักสำหรับผู้ใช้ที่ล็อกอินแล้ว
- **GuestLayout**: Layout สำหรับผู้ใช้ที่ยังไม่ได้ล็อกอิน

#### 2. Page Components
- **Dashboard**: หน้าหลักของผู้ใช้
- **AdminDashboard**: หน้าหลักของผู้ดูแลระบบ
- **AssignedEvaluationStep**: ขั้นตอนการประเมินผู้อื่น
- **SelfEvaluationStep**: ขั้นตอนการประเมินตนเอง
- **AdminEvaluationReport**: รายงานการประเมิน

#### 3. Reusable Components
- **QuestionCard**: แสดงคำถามแบบต่างๆ
- **ProgressIndicator**: แสดงความคืบหน้า
- **EvaluateeRatingCard**: แสดงคะแนนการประเมิน

### การจัดการข้อมูล

#### Inertia.js Integration
- **Server-side rendering**: ส่งข้อมูลจาก Laravel มา React
- **Type-safe routing**: ใช้ Ziggy สำหรับ routing
- **Form handling**: ใช้ useForm hook

#### State Management
- **Server-driven state**: ข้อมูลส่วนใหญ่มาจาก server
- **Local state**: ใช้ useState สำหรับ component state
- **Custom hooks**: เช่น useDarkMode

### UI/UX Features

#### Design System
- **Tailwind CSS**: Utility-first styling
- **Dark Mode**: รองรับโหมดมืด
- **Responsive Design**: รองรับหน้าจอทุกขนาด
- **Accessibility**: รองรับ screen reader

#### User Experience
- **Progressive Loading**: โหลดข้อมูลเป็นขั้นตอน
- **Real-time Feedback**: แสดงสถานะการทำงาน
- **Error Handling**: จัดการข้อผิดพลาดอย่างเหมาะสม

---

## ระบบ Backend

### Controllers

#### Administrative Controllers

##### AdminEvaluationAssignmentController
**หน้าที่**: จัดการการมอบหมายการประเมิน 360 องศา

**คุณสมบัติสำคัญ**:
- **Card View Data**: จัดกลุ่มข้อมูลตามผู้ประเมิน
- **Fiscal Year Management**: จัดการปีงบประมาณ
- **Bulk Operations**: ดำเนินการหลายรายการพร้อมกัน
- **Analytics**: วิเคราะห์ข้อมูล KPI และสถิติ

##### AdminEvaluationReportController
**หน้าที่**: สร้างรายงานและส่งออกข้อมูล

**คุณสมบัติสำคัญ**:
- **Multiple Export Formats**: Excel, CSV
- **Dashboard Analytics**: สถิติแบบเรียลไทม์
- **Performance Monitoring**: ติดตามประสิทธิภาพระบบ

##### AdminUserController
**หน้าที่**: จัดการผู้ใช้และโครงสร้างองค์กร

**คุณสมบัติสำคัญ**:
- **Auto-generated Employee IDs**: สร้างรหัสพนักงานอัตโนมัติ
- **Password Management**: จัดการรหัสผ่านตามวันเกิด
- **Organizational Structure**: จัดการโครงสร้างองค์กร

#### User-Facing Controllers

##### AssignedEvaluationController
**หน้าที่**: จัดการการประเมิน 360 องศา

**คุณสมบัติสำคัญ**:
- **Multi-Evaluatee Support**: ประเมินหลายคนพร้อมกัน
- **Grade-Based Selection**: เลือกแบบฟอร์มตามเกรด
- **Progress Tracking**: ติดตามความคืบหน้า
- **Peer Comparison**: เปรียบเทียบกับผู้อื่น

##### SelfEvaluationController
**หน้าที่**: จัดการการประเมินตนเอง

**คุณสมบัติสำคัญ**:
- **Grade-Specific Forms**: แบบฟอร์มเฉพาะเกรด
- **Progress Resume**: กลับมาทำต่อได้
- **Grouped Questions**: จัดกลุ่มคำถาม

### Services

#### WeightedScoringService
**หน้าที่**: คำนวณคะแนนถ่วงน้ำหนัก

**น้ำหนักตามเกรด**:
- **เกรด 5-8**: IQ(25%), EQ(25%), AQ/TQ(30%), Sustainability(20%)
- **เกรด 9-10**: Leadership(25%), Vision(15%), Communication(15%), Innovation(15%), Ethics(10%), Teamwork(20%)
- **เกรด 11-12**: Leadership(25%), Vision(25%), Communication(20%), Innovation(15%), Ethics(10%), Teamwork(15%)

**น้ำหนักผู้ประเมิน**:
- **เกรด 5-8**: Self(20%), Superior(50%), Peer(30%)
- **เกรด 9-12**: Self(15%), Superior(35%), Subordinate(25%), Peer(20%), External(5%)

#### ScoreCalculationService
**หน้าที่**: คำนวณคะแนนและสถิติ

**คุณสมบัติสำคัญ**:
- **Statistical Analysis**: ความแปรปรวน, ส่วนเบี่ยงเบนมาตรฐาน
- **Performance Ratings**: ระดับผลงาน 5 ระดับ
- **Data Quality**: ประเมินคุณภาพข้อมูล

---

## ระบบประเมินผล 360 องศา

### หลักการของระบบ 360 องศา

#### มุมมองการประเมิน (Evaluation Angles)
1. **บน (Top)**: ผู้บังคับบัญชาประเมิน
2. **ล่าง (Bottom)**: ผู้ใต้บังคับบัญชาประเมิน
3. **ซ้าย (Left)**: เพื่อนร่วมงานประเมิน
4. **ขวา (Right)**: ผู้มีส่วนได้ส่วนเสียภายนอกประเมิน
5. **ตนเอง (Self)**: ประเมินตนเอง

#### เกณฑ์การประเมินตามเกรด

##### เกรด 5-8
- **มุมมองที่ต้องการ**: บน, ซ้าย, ตนเอง
- **เหตุผล**: พนักงานระดับเริ่มต้นไม่มีผู้ใต้บังคับบัญชา

##### เกรด 9-12
- **มุมมองที่ต้องการ**: บน, ล่าง, ซ้าย, ขวา, ตนเอง
- **เหตุผล**: ผู้บริหารต้องได้รับการประเมินจากทุกมุมมอง

### ระบบมอบหมายการประเมิน

#### การสร้างงานมอบหมาย
```php
// ตัวอย่างการสร้างงานมอบหมาย
$assignment = new EvaluationAssignment([
    'evaluation_id' => $evaluationId,
    'evaluator_id' => $evaluatorId,
    'evaluatee_id' => $evaluateeId,
    'fiscal_year' => $fiscalYear,
    'angle' => $angle
]);
```

#### การตรวจสอบความเข้ากันได้
```php
// ตรวจสอบว่าผู้ประเมินสามารถประเมินผู้ถูกประเมินได้หรือไม่
public function canEvaluateUser($userId, $angle): bool
{
    $targetUser = User::find($userId);
    
    switch ($angle) {
        case 'top':
            return $this->grade > $targetUser->grade;
        case 'bottom':
            return $this->grade < $targetUser->grade;
        case 'left':
            return $this->grade == $targetUser->grade;
        case 'right':
            return $this->user_type == 'external';
        default:
            return false;
    }
}
```

### ขั้นตอนการประเมิน

#### 1. การประเมินตนเอง
- ผู้ใช้เข้าสู่ระบบและเลือกการประเมินตนเอง
- ระบบเลือกแบบฟอร์มตามเกรดของผู้ใช้
- ผู้ใช้ทำการประเมินทีละส่วน (Part)
- ระบบบันทึกความคืบหน้าและอนุญาตให้กลับมาทำต่อได้

#### 2. การประเมินผู้อื่น
- ผู้ประเมินเลือกงานมอบหมายที่ต้องการทำ
- ระบบแสดงรายชื่อผู้ถูกประเมินตามมุมมองที่กำหนด
- ผู้ประเมินสามารถประเมินหลายคนพร้อมกันได้
- ระบบเปรียบเทียบคะแนนระหว่างผู้ถูกประเมินแบบเรียลไทม์

#### 3. การติดตามความคืบหน้า
- Dashboard แสดงสถานะการประเมินทั้งหมด
- Progress bar แสดงความคืบหน้าแยกตามมุมมอง
- การแจ้งเตือนเมื่อมีการประเมินที่ค้างอยู่

---

## ระบบคะแนนถ่วงน้ำหนัก

### หลักการคำนวณคะแนน

#### ระดับการถ่วงน้ำหนัก
1. **น้ำหนักเกณฑ์การประเมิน (Criteria Weight)**: น้ำหนักของแต่ละด้านการประเมิน
2. **น้ำหนักผู้ประเมิน (Stakeholder Weight)**: น้ำหนักของแต่ละมุมมองการประเมิน

#### สูตรการคำนวณ
```
คะแนนสุดท้าย = Σ(คะแนนเกณฑ์ × น้ำหนักเกณฑ์ × น้ำหนักผู้ประเมิน)
```

### การกำหนดน้ำหนักตามเกรด

#### เกรด 5-8: พนักงานปฏิบัติการ
**เกณฑ์การประเมิน**:
- **IQ (Intelligence Quotient)**: 25%
- **EQ (Emotional Quotient)**: 25%
- **AQ/TQ (Adaptability/Teamwork Quotient)**: 30%
- **Sustainability (ความยั่งยืน)**: 20%

**น้ำหนักผู้ประเมิน**:
- **Self (ตนเอง)**: 20%
- **Superior (ผู้บังคับบัญชา)**: 50%
- **Peer (เพื่อนร่วมงาน)**: 30%

#### เกรด 9-10: พนักงานระดับกลาง
**เกณฑ์การประเมิน**:
- **Leadership (ภาวะผู้นำ)**: 25%
- **Vision (วิสัยทัศน์)**: 15%
- **Communication (การสื่อสาร)**: 15%
- **Innovation (นวัตกรรม)**: 15%
- **Ethics (จริยธรรม)**: 10%
- **Teamwork (การทำงานเป็นทีม)**: 20%

**น้ำหนักผู้ประเมิน**:
- **Self (ตนเอง)**: 15%
- **Superior (ผู้บังคับบัญชา)**: 35%
- **Subordinate (ผู้ใต้บังคับบัญชา)**: 25%
- **Peer (เพื่อนร่วมงาน)**: 20%
- **External (ภายนอก)**: 5%

#### เกรด 11-12: พนักงานระดับสูง
**เกณฑ์การประเมิน**:
- **Leadership (ภาวะผู้นำ)**: 25%
- **Vision (วิสัยทัศน์)**: 25%
- **Communication (การสื่อสาร)**: 20%
- **Innovation (นวัตกรรม)**: 15%
- **Ethics (จริยธรรม)**: 10%
- **Teamwork (การทำงานเป็นทีม)**: 15%

**น้ำหนักผู้ประเมิน**:
- **Self (ตนเอง)**: 15%
- **Superior (ผู้บังคับบัญชา)**: 35%
- **Subordinate (ผู้ใต้บังคับบัญชา)**: 25%
- **Peer (เพื่อนร่วมงาน)**: 20%
- **External (ภายนอก)**: 5%

### ระบบประเมินผลงาน

#### ระดับผลงาน (Performance Rating)
1. **ดีเยี่ยม (Excellent)**: 4.21-5.00
2. **ดีมาก (Very Good)**: 3.41-4.20
3. **ดี (Good)**: 2.61-3.40
4. **พอใช้ (Fair)**: 1.81-2.60
5. **ต้องปรับปรุง (Needs Improvement)**: 1.00-1.80

#### การวิเคราะห์สถิติ
- **ค่าเฉลี่ย (Mean)**: คะแนนเฉลี่ยของการประเมิน
- **ส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation)**: ความแปรปรวนของคะแนน
- **ช่วงความเชื่อมั่น (Confidence Interval)**: ช่วงความน่าเชื่อถือของคะแนน
- **คุณภาพข้อมูล (Data Quality)**: ความสมบูรณ์และความสอดคล้องของข้อมูล

---

## ระบบรายงานและส่งออกข้อมูล

### ประเภทรายงาน

#### 1. รายงานผลการประเมินรายบุคคล
- **ข้อมูลพื้นฐาน**: ชื่อ, ตำแหน่ง, แผนก, เกรด
- **คะแนนรวม**: คะแนนถ่วงน้ำหนักทั้งหมด
- **คะแนนแยกตามด้าน**: คะแนนแต่ละเกณฑ์การประเมิน
- **คะแนนแยกตามมุมมอง**: คะแนนจากผู้ประเมินแต่ละมุมมอง
- **กราฟแสดงผล**: Radar chart, Bar chart
- **ข้อเสนอแนะ**: จุดแข็ง, จุดที่ต้องปรับปรุง

#### 2. รายงานผลการประเมินกลุ่ม
- **สถิติภาพรวม**: จำนวนผู้ถูกประเมิน, อัตราการตอบสนอง
- **การกระจายคะแนน**: Histogram, Box plot
- **การเปรียบเทียบ**: เปรียบเทียบระหว่างแผนก, ตำแหน่ง
- **แนวโน้ม**: การเปลี่ยนแปลงของคะแนนตามเวลา

#### 3. รายงานการติดตามความคืบหน้า
- **สถานะการประเมิน**: จำนวนที่เสร็จสิ้น, ค้างอยู่
- **อัตราการตอบสนอง**: แยกตามแผนก, ตำแหน่ง
- **การแจ้งเตือน**: รายชื่อผู้ที่ยังไม่ได้ประเมิน

### รูปแบบการส่งออก

#### 1. Microsoft Excel (.xlsx)
- **ข้อดี**: รองรับกราฟและตาราง, สามารถแก้ไขได้
- **การใช้งาน**: รายงานที่ต้องการวิเคราะห์เพิ่มเติม
- **รูปแบบ**: Multiple sheets, Formatted tables, Charts

#### 2. CSV (Comma-Separated Values)
- **ข้อดี**: ขนาดเล็ก, รองรับระบบต่างๆ
- **การใช้งาน**: ข้อมูลดิบสำหรับวิเคราะห์
- **รูปแบบ**: Plain text, UTF-8 encoding

#### 3. PDF
- **ข้อดี**: รูปแบบคงที่, พร้อมสำหรับพิมพ์
- **การใช้งาน**: รายงานอย่างเป็นทางการ
- **รูปแบบ**: Professional layout, Charts, Tables

### Dashboard Analytics

#### Real-time Statistics
- **จำนวนการประเมินรวม**: อัปเดตแบบเรียลไทม์
- **อัตราการเสร็จสิ้น**: แสดงเป็นเปอร์เซ็นต์
- **แนวโน้มการประเมิน**: กราฟแสดงการเปลี่ยนแปลง

#### Interactive Charts
- **Highcharts Integration**: กราฟแบบโต้ตอบ
- **Multiple Chart Types**: Bar, Line, Pie, Radar
- **Responsive Design**: รองรับทุกขนาดหน้าจอ

---

## ระบบรักษาความปลอดภัย

### การยืนยันตัวตน (Authentication)

#### Laravel Sanctum
- **Token-based Authentication**: ใช้ token สำหรับการยืนยันตัวตน
- **Session Management**: จัดการ session อย่างปลอดภัย
- **Single Device Login**: ห้ามล็อกอินหลายเครื่องพร้อมกัน

#### Login Security
- **Rate Limiting**: จำกัดการพยายามล็อกอินเป็น 5 ครั้ง/นาที
- **Audit Logging**: บันทึกการเข้าใช้งานทั้งหมด
- **Password Security**: รหัสผ่านเข้ารหัสด้วย bcrypt

### การให้สิทธิ์ (Authorization)

#### Role-based Access Control
- **Admin Role**: เข้าถึงฟังก์ชันการบริหารจัดการทั้งหมด
- **User Role**: เข้าถึงฟังก์ชันการประเมินและดูผลลัพธ์
- **Route Protection**: ป้องกัน route ด้วย middleware

#### Permission System
```php
// ตัวอย่างการตรวจสอบสิทธิ์
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
});
```

### ความปลอดภัยของข้อมูล

#### Input Validation
- **Request Validation**: ตรวจสอบข้อมูลก่อนประมวลผล
- **SQL Injection Prevention**: ใช้ Eloquent ORM
- **XSS Protection**: ป้องกันการโจมตี Cross-site scripting

#### Data Protection
- **Encryption**: เข้ารหัสข้อมูลสำคัญ
- **Secure Headers**: ใช้ security headers
- **HTTPS**: บังคับใช้ HTTPS

### การตรวจสอบและบันทึก

#### Audit Trail
- **Login Attempts**: บันทึกการพยายามล็อกอิน
- **User Actions**: บันทึกการกระทำของผู้ใช้
- **System Events**: บันทึกเหตุการณ์ระบบ

#### Error Handling
- **Graceful Error Handling**: จัดการข้อผิดพลาดอย่างเหมาะสม
- **Error Logging**: บันทึกข้อผิดพลาดสำหรับการแก้ไข
- **User-friendly Messages**: แสดงข้อความที่เข้าใจง่าย

---

## การติดตั้งและการใช้งาน

### ความต้องการของระบบ

#### Server Requirements
- **PHP**: 8.2 หรือสูงกว่า
- **Laravel**: 12.x
- **Database**: MySQL 8.0 หรือสูงกว่า
- **Node.js**: 18.x หรือสูงกว่า
- **Web Server**: Apache/Nginx

#### PHP Extensions
- BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML, GD

### การติดตั้ง

#### 1. Clone Repository
```bash
git clone <repository-url>
cd evaluation-system
```

#### 2. Install Dependencies
```bash
# Backend dependencies
composer install

# Frontend dependencies
npm install
```

#### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=evaluation_system
DB_USERNAME=root
DB_PASSWORD=
```

#### 4. Database Setup
```bash
# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed
```

#### 5. Build Frontend
```bash
npm run build
```

### คำสั่งการพัฒนา

#### Backend Development
```bash
# Start Laravel server
php artisan serve

# Start queue worker
php artisan queue:listen --tries=1

# Run all services
composer run dev
```

#### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Database Management
```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Laravel interactive shell
php artisan tinker
```

#### Code Quality
```bash
# PHP code formatting
./vendor/bin/pint

# Run tests
phpunit
```

### การใช้งาน

#### สำหรับผู้ดูแลระบบ

1. **สร้างผู้ใช้**: เข้าสู่ Admin Dashboard → User Management
2. **สร้างแบบประเมิน**: Evaluation Management → Create Evaluation
3. **มอบหมายการประเมิน**: Assignment Management → Create Assignment
4. **ติดตามผลงาน**: Reports → View Dashboard

#### สำหรับผู้ใช้ทั่วไป

1. **ล็อกอิน**: ใช้ EMID และรหัสผ่าน
2. **ประเมินตนเอง**: Dashboard → Self Evaluation
3. **ประเมินผู้อื่น**: Dashboard → Assigned Evaluations
4. **ดูผลการประเมิน**: Profile → Evaluation Results

### การปรับแต่ง

#### การปรับแต่งน้ำหนัก
แก้ไขไฟล์ `app/Services/WeightedScoringService.php`

#### การปรับแต่ง UI
แก้ไขไฟล์ใน `resources/js/Components/`

#### การเพิ่มภาษา
แก้ไขไฟล์ใน `resources/lang/`

### การแก้ไขปัญหา

#### ปัญหาทั่วไป
1. **ไม่สามารถล็อกอินได้**: ตรวจสอบ database connection
2. **ไม่แสดงรูปภาพ**: ตรวจสอบ storage link
3. **ข้อผิดพลาด 500**: ดู log ใน storage/logs/

#### Debug Mode
```bash
# Enable debug mode
APP_DEBUG=true

# View logs
tail -f storage/logs/laravel.log
```

---

## สรุป

ระบบจัดการประเมินผลงาน 360 องศา เป็นระบบที่ครอบคลุมและทันสมัย ที่ออกแบบมาเพื่อรองรับความต้องการของการประเมินผลงานในองค์กรขนาดใหญ่ ด้วยคุณสมบัติหลักดังนี้:

### จุดเด่นของระบบ
- **ระบบประเมิน 360 องศา**: ครอบคลุมทุกมุมมองการประเมิน
- **ระบบคะแนนถ่วงน้ำหนัก**: คำนวณคะแนนอย่างยุติธรรม
- **ระบบรายงานขั้นสูง**: วิเคราะห์ข้อมูลเชิงลึก
- **ความปลอดภัยสูง**: ระบบรักษาความปลอดภัยแบบองค์กร
- **ใช้งานง่าย**: UI/UX ที่ใช้งานง่าย

### ข้อดีของการใช้งาน
- **ประหยัดเวลา**: ลดเวลาการประเมินและสร้างรายงาน
- **ความแม่นยำ**: การคำนวณคะแนนอัตโนมัติ
- **ความโปร่งใส**: ผู้ใช้สามารถติดตามการประเมินได้
- **ความยืดหยุ่น**: ปรับแต่งได้ตามความต้องการ

### การพัฒนาในอนาคต
- **Mobile Application**: พัฒนาแอพมือถือ
- **AI Integration**: ใช้ AI ในการวิเคราะห์ข้อมูล
- **Real-time Notification**: แจ้งเตือนแบบเรียลไทม์
- **Advanced Analytics**: การวิเคราะห์ข้อมูลขั้นสูง

ระบบนี้พร้อมที่จะตอบสนองความต้องการของการประเมินผลงานในยุคดิจิทัล และสามารถขยายขนาดได้ตามการเติบโตขององค์กร

---

*เอกสารนี้สร้างขึ้นเมื่อ: วันที่ 14 กรกฎาคม 2568*
*เวอร์ชัน: 1.0*
*สร้างโดย: Claude Code Analysis*