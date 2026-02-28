# Routes และ Controllers

## โครงสร้าง Routes (`routes/web.php`)

### 1. Guest Routes (ไม่ต้อง Login)

| Method | URL | Controller | ชื่อ Route | คำอธิบาย |
|---|---|---|---|---|
| GET | `/` | HomeController@welcome | `home` | หน้า Welcome |
| GET | `/login` | LoginController@showLoginForm | `login` | หน้า Login |
| POST | `/login` | LoginController@login | - | Submit Login |
| POST | `/logout` | LoginController@logout | `logout` | Logout |
| GET | `/cookie-policy` | (Inertia) | `cookie.policy` | นโยบาย Cookie |

---

### 2. Auth Routes (ต้อง Login — ทุก role)

| Method | URL | Controller | ชื่อ Route | คำอธิบาย |
|---|---|---|---|---|
| GET | `/profile` | ProfileController@show | `profile.show` | ดูโปรไฟล์ |
| GET | `/profile/edit` | ProfileController@edit | `profile.edit` | แก้ไขโปรไฟล์ |
| PUT | `/profile` | ProfileController@update | `profile.update` | บันทึกโปรไฟล์ |
| POST | `/profile/departments` | ProfileController@storeDepartment | `profile.departments.store` | เพิ่ม Department |
| POST | `/profile/factions` | ProfileController@storeFaction | `profile.factions.store` | เพิ่ม Faction |
| POST | `/profile/positions` | ProfileController@storePosition | `profile.positions.store` | เพิ่ม Position |
| GET | `/debug/evaluation-assignments/{evaluatorId}` | (inline) | - | Debug Assignments |
| GET | `/debug/cross-angle-evaluation/{evaluatorId}` | AssignedEvaluationController@debugCrossAngle | - | Debug Cross-angle |

---

### 3. User Routes (role: `user`)

#### Dashboard & Self Evaluation

| Method | URL | Controller | ชื่อ Route | คำอธิบาย |
|---|---|---|---|---|
| GET | `/dashboard` | EvaluationAssignmentController@index | `dashboard` | หน้าหลัก User |
| GET | `/evaluations/self` | SelfEvaluationController@index | `evaluationsself.index` | เริ่มประเมินตนเอง |
| POST | `/evaluations/self/questions/{step}` | SelfEvaluationController@step | `evaluations.self.step` | บันทึกแต่ละ step |
| POST | `/evaluations/self/save-answer` | SelfEvaluationController@saveAnswer | `evaluations.self.saveAnswer` | บันทึกคำตอบ |
| POST | `/evaluations/self/submit` | SelfEvaluationController@submit | `evaluations.self.submit` | ส่งแบบประเมิน |
| GET | `/evaluations/self/resume` | SelfEvaluationController@resume | `evaluationsself.resume` | กลับมาทำต่อ |

#### Assigned Evaluation (ประเมินคนอื่น)

| Method | URL | Controller | ชื่อ Route | คำอธิบาย |
|---|---|---|---|---|
| GET | `/assigned-evaluations/{evaluateeId}` | AssignedEvaluationController@show | `assigned-evaluations.show` | ดูรายการประเมิน |
| POST | `/assigned-evaluations/{evaluatee}/step/{step}` | AssignedEvaluationController@step | `assigned-evaluations.step` | บันทึก step |
| GET | `/assigned-evaluations/{evaluatee}/peer-comparison` | AssignedEvaluationController@getPeerComparison | `assigned-evaluations.peer-comparison` | เปรียบเทียบ peer |
| GET | `/assigned-evaluations/evaluatees` | AssignedEvaluationController@getAssignedEvaluatees | `assigned-evaluations.evaluatees` | รายชื่อที่ต้องประเมิน |
| GET | `/assigned-evaluations/{evaluatee}/same-angle` | AssignedEvaluationController@getEvaluateesByAngle | `assigned-evaluations.same-angle` | คนที่ประเมิน angle เดียวกัน |

#### Satisfaction Survey

| Method | URL | Controller | ชื่อ Route | คำอธิบาย |
|---|---|---|---|---|
| GET | `/satisfaction-evaluation/{evaluationId}` | SatisfactionEvaluationController@show | `satisfaction.show` | หน้า Survey |
| POST | `/satisfaction-evaluation/{evaluationId}` | SatisfactionEvaluationController@store | `satisfaction.store` | ส่ง Survey |
| GET | `/satisfaction-evaluation/{evaluationId}/status` | SatisfactionEvaluationController@checkStatus | `satisfaction.status` | ตรวจสอบสถานะ |

---

### 4. Admin Routes (role: `admin`)

#### Admin Dashboard

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `/dashboardadmin` | `admindashboard` | Admin Dashboard |

#### User Management (`/admin/users`)

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/users` | `admin.users.index` | รายการ Users |
| GET | `/admin/users/create` | `admin.users.create` | ฟอร์มสร้าง User |
| POST | `/admin/users` | `admin.users.store` | บันทึก User ใหม่ |
| GET | `/admin/users/{user}/edit` | `admin.users.edit` | แก้ไข User |
| PUT | `/admin/users/{user}` | `admin.users.update` | บันทึกการแก้ไข |
| DELETE | `/admin/users/{user}` | `admin.users.destroy` | ลบ User |
| POST | `/admin/departments/quick` | `admin.departments.quick-store` | เพิ่ม Department (inline) |
| POST | `/admin/factions/quick` | `admin.factions.quick-store` | เพิ่ม Faction (inline) |
| POST | `/admin/positions/quick` | `admin.positions.quick-store` | เพิ่ม Position (inline) |

#### Organizational Structure Management

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/divisions` | `admin.divisions.index` | รายการสายงาน |
| GET | `/admin/divisions/create` | `admin.divisions.create` | ฟอร์มสร้างสายงาน |
| POST | `/admin/divisions` | `admin.divisions.store` | บันทึกสายงานใหม่ |
| GET | `/admin/divisions/{division}/edit` | `admin.divisions.edit` | แก้ไขสายงาน |
| PUT | `/admin/divisions/{division}` | `admin.divisions.update` | บันทึกการแก้ไขสายงาน |
| DELETE | `/admin/divisions/{division}` | `admin.divisions.destroy` | ลบสายงาน |
| GET | `/admin/departments` | `admin.departments.index` | รายการหน่วยงาน |
| GET | `/admin/departments/create` | `admin.departments.create` | ฟอร์มสร้างหน่วยงาน |
| POST | `/admin/departments` | `admin.departments.store` | บันทึกหน่วยงานใหม่ |
| GET | `/admin/departments/{department}/edit` | `admin.departments.edit` | แก้ไขหน่วยงาน |
| PUT | `/admin/departments/{department}` | `admin.departments.update` | บันทึกการแก้ไขหน่วยงาน |
| DELETE | `/admin/departments/{department}` | `admin.departments.destroy` | ลบหน่วยงาน |
| GET | `/admin/positions` | `admin.positions.index` | รายการตำแหน่ง |
| GET | `/admin/positions/create` | `admin.positions.create` | ฟอร์มสร้างตำแหน่ง |
| POST | `/admin/positions` | `admin.positions.store` | บันทึกตำแหน่งใหม่ |
| GET | `/admin/positions/{position}/edit` | `admin.positions.edit` | แก้ไขตำแหน่ง |
| PUT | `/admin/positions/{position}` | `admin.positions.update` | บันทึกการแก้ไขตำแหน่ง |
| DELETE | `/admin/positions/{position}` | `admin.positions.destroy` | ลบตำแหน่ง |
| GET | `/admin/factions` | `admin.factions.index` | รายการฝ่าย |
| GET | `/admin/factions/create` | `admin.factions.create` | ฟอร์มสร้างฝ่าย |
| POST | `/admin/factions` | `admin.factions.store` | บันทึกฝ่ายใหม่ |
| GET | `/admin/factions/{faction}/edit` | `admin.factions.edit` | แก้ไขฝ่าย |
| PUT | `/admin/factions/{faction}` | `admin.factions.update` | บันทึกการแก้ไขฝ่าย |
| DELETE | `/admin/factions/{faction}` | `admin.factions.destroy` | ลบฝ่าย |

#### Assignment Management (`/admin/assignments`)

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/assignments` | `assignments.index` | รายการ Assignments |
| GET | `/admin/assignments/create` | `assignments.create` | ฟอร์มสร้าง |
| POST | `/admin/assignments` | `assignments.store` | บันทึก Assignment |
| GET | `/admin/assignments/{evaluateeId}/edit` | `assignments.edit` | แก้ไข |
| PUT | `/admin/assignments/{evaluateeId}` | `assignments.update` | บันทึกการแก้ไข |
| DELETE | `/admin/assignments/{assignment}` | `assignments.destroy` | ลบ |
| POST | `/admin/assignments/bulk-store` | `assignments.bulk-store` | สร้างหลายรายการ |
| DELETE | `/admin/assignments/bulk-delete` | `assignments.bulk-delete` | ลบหลายรายการ |
| GET | `/admin/assignments/analytics` | `assignments.analytics` | Analytics |
| GET | `/admin/assignments/export` | `assignments.export` | Export |
| GET | `/admin/assignments/stats` | `assignments.stats` | สถิติ |
| GET | `/admin/assignments/evaluatee-info` | `assignments.evaluatee-info` | ข้อมูล Evaluatee |
| GET | `/admin/assignments/evaluators-by-angle` | `assignments.evaluators-by-angle` | Evaluators ตาม angle |

#### Evaluation Form Management

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `/evaluations` | `evaluations.index` | รายการแบบประเมิน |
| GET | `/evaluations/create` | `evaluations.create` | สร้างใหม่ |
| POST | `/evaluations` | `evaluations.store` | บันทึก |
| GET | `/evaluations/{evaluation}/edit` | `evaluations.edit` | แก้ไข |
| PUT | `/evaluations/{evaluation}` | `evaluations.update` | บันทึกการแก้ไข |
| DELETE | `/evaluations/{evaluation}` | `evaluations.destroy` | ลบ |
| GET | `/evaluations/{evaluation}/preview` | `evaluations.preview` | Preview |
| PATCH | `/evaluations/{evaluation}/publish` | `evaluations.publish` | Publish |

#### Parts / Aspects / SubAspects / Questions Management

| Prefix | Actions | คำอธิบาย |
|---|---|---|
| `/evaluations/{eval}/parts` | index, create, store, edit, update, destroy | จัดการส่วน |
| `/evaluations/{eval}/parts/{part}/aspects` | index, create, store, edit, update, destroy | จัดการด้าน |
| `/evaluations/{eval}/parts/{part}/aspects/{aspect}/subaspects` | index, create, store, edit, update | จัดการด้านย่อย |
| `/evaluations/{eval}/parts/{part}/questions` | index, create, store, update, destroy | จัดการคำถาม |

#### Report System (`/admin/reports/evaluation`)

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `/admin/reports/evaluation` | `admin.evaluation-report.index` | หน้ารายงานหลัก |

**Export Endpoints:**

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| POST | `.../export/comprehensive` | `export-comprehensive` | รายงานรวมทุกกลุ่ม |
| POST | `.../export/executives` | `export-executives` | รายงานผู้บริหาร 9-12 |
| POST | `.../export/employees` | `export-employees` | รายงานพนักงาน 5-8 |
| POST | `.../export/self-evaluation` | `export-self-evaluation` | รายงานประเมินตนเอง |
| POST | `.../export/detailed-data` | `export-detailed-data` | ข้อมูลรายละเอียดทุกคำถาม |
| POST | `.../export/individual` | `export-individual` | รายงานรายบุคคล |
| POST | `.../export/weighted` | `export-weighted` | รายงานแบบ Weighted Score |
| POST | `.../export/raw-data` | `export-raw-data` | ข้อมูลดิบ |
| POST | `.../export/complete` | `export-complete` | ข้อมูลครบ |
| POST | `.../export/individual-pdf` | `export-individual-pdf` | PDF รายบุคคล |
| POST | `.../export/comprehensive-pdf` | `export-comprehensive-pdf` | PDF รวม |

**Data API Endpoints:**

| Method | URL | ชื่อ Route | คำอธิบาย |
|---|---|---|---|
| GET | `.../api/dashboard-data` | `api.dashboard-data` | ข้อมูล Dashboard |
| GET | `.../api/completion-stats` | `api.completion-stats` | สถิติการทำแบบประเมิน |
| GET | `.../api/real-time-data` | `api.real-time-data` | ข้อมูล Real-time |
| GET | `.../api/individual-angle-report` | `api.individual-angle-report` | รายงานแยก angle |
| GET | `.../api/user-details/{userId}` | `user-details` | ข้อมูลผู้ใช้ |
| GET | `.../api/evaluatee-details/{evaluateeId}` | `evaluatee-details` | ข้อมูลผู้ถูกประเมิน |
| POST | `.../api/clear-cache` | `api.clear-cache` | ล้าง Cache |
| GET | `.../api/system-health` | `api.system-health` | ตรวจสอบระบบ |

---

## Services

### `EvaluationExportService.php`
รับผิดชอบ Export ข้อมูลเป็น Excel (PhpSpreadsheet)

**Methods หลัก:**
- `exportComprehensiveReport()` — รายงานรวมผู้บริหาร + พนักงาน
- `exportExecutiveReport()` — ผู้บริหาร 9-12
- `exportEmployeeReport()` — พนักงาน 5-8
- `exportSelfEvaluationReport()` — ประเมินตนเอง
- `exportDetailedEvaluationData()` — ข้อมูลดิบทุกคำถาม

### `EvaluationPdfExportService.php`
รับผิดชอบ Export เป็น PDF (DomPDF)

### `ScoreCalculationService.php`
คำนวณคะแนน:
- คะแนนเฉลี่ยต่อ aspect
- คะแนนเฉลี่ยต่อ part
- คะแนนรวม

### `WeightedScoringService.php`
คำนวณคะแนนแบบ Weighted:
- กำหนดน้ำหนักต่อ angle (top/bottom/left/right)
- คำนวณ weighted average สำหรับรายงาน
