# ระบบรายงานและ Export

## ภาพรวม

ระบบรายงานอยู่ที่ `/admin/reports/evaluation` รับผิดชอบโดย:
- **Frontend**: `AdminEvaluationReport.tsx`
- **Controller**: `AdminEvaluationReportController.php`
- **Services**: `EvaluationExportService.php`, `EvaluationPdfExportService.php`, `ScoreCalculationService.php`, `WeightedScoringService.php`

---

## Frontend Architecture

### Component Structure (`AdminEvaluationReport.tsx`)

```typescript
AdminEvaluationReport
├── DashboardView           // ภาพรวมสถิติ
├── AnalyticsView           // วิเคราะห์เชิงลึก
├── ReportsView             // รายงานตาราง
└── ExportsView             // หน้า Export
     └── ExportModal        // Modal ตั้งค่าการ export
```

### State Management

```typescript
interface ExportOptions {
    format: 'excel' | 'pdf' | 'csv';
    includeCharts: boolean;
    includeRawData: boolean;
    dateRange: 'all' | 'current' | 'custom';
    reportType: 'summary' | 'detailed' | 'individual' | 'comparison';
    divisions: string[];
    grades: number[];
}

interface DashboardConfig {
    theme: 'light' | 'dark';
    view: 'dashboard' | 'analytics' | 'reports' | 'exports';
    layout: 'grid' | 'list';
    compactMode: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
}
```

---

## Export Types (5 ประเภทหลัก)

### 1. Comprehensive Report
- **Endpoint**: `POST /admin/reports/evaluation/export/comprehensive`
- **Route Name**: `admin.evaluation-report.export-comprehensive`
- **คำอธิบาย**: รายงานรวมผู้บริหาร (9-12) + พนักงาน (5-8) พร้อม Option Mapping
- **ข้อมูลที่รวม**: ทุก evaluation (1, 2, 3, 4, 5)

### 2. Executive Report (ผู้บริหาร 9-12)
- **Endpoint**: `POST /admin/reports/evaluation/export/executives`
- **Route Name**: `admin.evaluation-report.export-executives`
- **คำอธิบาย**: eval 1, 2, 4 เท่านั้น
- **ข้อมูล**: คำถาม + คะแนน + แยก angle

### 3. Employee Report (พนักงาน 5-8)
- **Endpoint**: `POST /admin/reports/evaluation/export/employees`
- **Route Name**: `admin.evaluation-report.export-employees`
- **คำอธิบาย**: eval 3, 5 เท่านั้น
- **ข้อมูล**: คำถาม + คะแนน + แยก angle

### 4. Self-Evaluation Report
- **Endpoint**: `POST /admin/reports/evaluation/export/self-evaluation`
- **Route Name**: `admin.evaluation-report.export-self-evaluation`
- **คำอธิบาย**: การประเมินตนเอง eval 4 + eval 5

### 5. Detailed Data Report
- **Endpoint**: `POST /admin/reports/evaluation/export/detailed-data`
- **Route Name**: `admin.evaluation-report.export-detailed-data`
- **คำอธิบาย**: ข้อมูลทุกคำถาม ทุกผู้ประเมิน ทุกผู้ถูกประเมิน (ข้อมูลดิบ)

---

## รูปแบบไฟล์ Export

| รูปแบบ | Library | ใช้กับ |
|---|---|---|
| Excel (.xlsx) | PhpSpreadsheet | รายงานทุกประเภท |
| PDF | DomPDF | Individual, Comprehensive PDF |
| CSV | Native PHP | Raw data |

---

## โครงสร้าง Excel Export (ตาม `spec/report/excel_export_structure.md`)

### Sheet 1: Summary
```
แถว 1: หัวข้อรายงาน
แถว 2: วันที่สร้าง, ปีงบประมาณ
แถว 3: จำนวนผู้เข้าร่วม

ตาราง: สรุปคะแนนรายบุคคล
  | ชื่อ-สกุล | หน่วยงาน | ระดับ | คะแนน Part 1 | คะแนน Part 2 | รวม |
```

### Sheet 2: By Aspect
```
ตาราง: คะแนนแยกตาม Aspect
  | ชื่อ-สกุล | Aspect 1 | Aspect 2 | ... | รวม |
  (แยกตาม angle: top / bottom / left / right / overall)
```

### Sheet 3: By Angle
```
ตาราง: คะแนนแยกตาม Angle
  | ชื่อ-สกุล | Top | Bottom | Left | Right | Self | Overall |
```

### Sheet 4: Raw Data
```
ตาราง: ข้อมูลดิบทุกคำตอบ
  | evaluatee | evaluator | angle | question | value | score |
```

---

## Data API Endpoints

### Dashboard Data
```
GET /admin/reports/evaluation/api/dashboard-data
Response: {
    total_evaluatees: int,
    completed: int,
    in_progress: int,
    not_started: int,
    completion_rate: float,
    by_division: [...],
    by_grade: [...],
    score_distribution: [...]
}
```

### Completion Stats
```
GET /admin/reports/evaluation/api/completion-stats
Response: {
    fiscal_year: string,
    evaluations: [
        {
            evaluation_id: int,
            title: string,
            total_assigned: int,
            completed: int,
            completion_rate: float
        }
    ]
}
```

### Individual Angle Report
```
GET /admin/reports/evaluation/api/individual-angle-report
    ?evaluatee_id={id}&fiscal_year={year}
Response: {
    user: {...},
    scores_by_angle: {
        top: { aspects: [...], total: float },
        bottom: { aspects: [...], total: float },
        left: { aspects: [...], total: float },
        right: { aspects: [...], total: float },
        self: { aspects: [...], total: float }
    },
    weighted_score: float
}
```

### Evaluatee Details
```
GET /admin/reports/evaluation/api/evaluatee-details/{evaluateeId}
Response: {
    user: {
        id, emid, name, grade, division, department, position
    },
    assignments: [...],
    completion_status: {...},
    scores: {...}
}
```

---

## Score Calculation Logic

### ขั้นตอนการคำนวณคะแนน

```
1. ดึง answers ทั้งหมดสำหรับ evaluatee คนหนึ่ง
   WHERE evaluatee_id = ? AND evaluation_id = ?

2. กรองเฉพาะ rating questions
   JOIN questions ON question_id WHERE type = 'rating'

3. คำนวณ score ต่อ aspect ต่อ evaluator
   aspect_score = AVG(answer.value) for all rating questions in that aspect

4. คำนวณ score ต่อ angle
   angle_score = AVG(aspect_scores) across all evaluators of that angle

5. คำนวณ weighted total
   weighted = Σ(angle_weight × angle_score)
```

### Option Mapping สำหรับ choice/multiple_choice

```
คำถามประเภท choice/multiple_choice:
  value = option_id → join กับ options table → ดู score ของ option นั้น

ตัวอย่าง:
  answer.value = "4889"
  options WHERE id = 4889 → score = 1 (ถูก) หรือ 0 (ผิด)
```

---

## System Health & Cache

### Clear Cache
```
POST /admin/reports/evaluation/api/clear-cache
→ ล้าง Laravel cache สำหรับข้อมูลรายงาน
```

### System Health
```
GET /admin/reports/evaluation/api/system-health
→ ตรวจสอบ DB connection, cache status, queue status
```

---

## Debug Endpoints (สำหรับ Development)

| Endpoint | คำอธิบาย |
|---|---|
| `/api/debug-completion` | Debug ข้อมูลการ complete |
| `/api/debug-data` | Debug ความพร้อมของข้อมูล |
| `/api/quick-debug` | Quick debug ภาพรวม |
| `/api/debug-participant-count` | Debug จำนวนผู้เข้าร่วม |
| `/debug/evaluation-assignments/{id}` | Debug assignments ของ evaluator |
| `/debug/cross-angle-evaluation/{id}` | Debug cross-angle logic |

> **หมายเหตุ**: Debug endpoints ควรลบออกก่อน Production deployment
