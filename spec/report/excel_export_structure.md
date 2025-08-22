# Excel Export Structure Analysis - Technical Specification

## ภาพรวมระบบ Excel Export

ระบบการส่งออก Excel ใน AdminEvaluationReport มีโครงสร้างที่ซับซ้อนและหลากหลาย โดยแต่ละประเภทรายงานจะมีรูปแบบการจัดเรียงข้อมูลและคอลัมน์ที่แตกต่างกันตามความต้องการเฉพาะ

## 📊 ประเภทรายงาน Excel ทั้งหมด

### 1. **Comprehensive Report (รายงานครบถ้วน)**
**ไฟล์ที่สร้าง**: `รายงานการประเมิน_360_องศา_[timestamp].xlsx`

**โครงสร้าง Multi-Sheet**:
```
📊 รายงานการประเมิน_360_องศา.xlsx
├── 📝 ผู้บริหารระดับ 9-12     (Executive Sheet)
├── 📝 พนักงานระดับ 5-8        (Employee Sheet)  
├── 📝 สรุปภาพรวม            (Summary Sheet)
└── 📝 รายการคำถามและตัวเลือก  (Question Mapping Sheet)
```

#### Sheet 1: ผู้บริหารระดับ 9-12
**ข้อมูลที่แสดง**: การประเมิน evaluation_id = 1 สำหรับ grades [9,10,11,12]

**22 คอลัมน์หลัก**:
| คอลัมน์ | ชื่อคอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
|---------|-------------|------------|-----------|
| A | ลำดับ | Number | เลขลำดับแถว |
| B | รหัสพนักงานผู้ถูกประเมิน | String | evaluatee.emid |
| C | ชื่อผู้ถูกประเมิน | String | evaluatee.fname + evaluatee.lname |
| D | ระดับ | Number | evaluatee.grade |
| E | หน่วยงาน | String | division.name |
| F | แผนก | String | department.name |
| G | ตำแหน่ง | String | position.title |
| H | รหัสพนักงานผู้ประเมิน | String | evaluator.emid |
| I | ชื่อผู้ประเมิน | String | evaluator.fname + evaluator.lname |
| J | มุมการประเมิน | String | evaluation_angle (แปลเป็นไทย) |
| K | รหัสคำถาม | Number | question.id |
| L | ส่วนที่ | String | part.title |
| M | หมวดหมู่ | String | aspect.name |
| N | หมวดหมู่ย่อย | String | sub_aspect.name |
| O | คำถาม | Text | question.title |
| P | ประเภทคำถาม | String | question.type (แปลเป็นไทย) |
| Q | รหัสตัวเลือก | Number | option.id |
| R | คำตอบ | String | option.label |
| S | คะแนน | Number | option.score |
| T | ข้อความเพิ่มเติม | Text | answer.other_text |
| U | วันที่ตอบ | DateTime | answer.created_at |
| V | ปีงบประมาณ | Number | evaluation_assignment.fiscal_year |

#### Sheet 2: พนักงานระดับ 5-8
**ข้อมูลที่แสดง**: การประเมิน evaluation_id = 3 สำหรับ grades [5,6,7,8]
**โครงสร้าง**: เหมือนกับ Sheet 1 แต่เปลี่ยนข้อมูลเป็นพนักงาน

#### Sheet 3: สรุปภาพรวม
**รูปแบบการจัดเรียง**:
```
A1:D1  | สรุปภาพรวมการประเมิน 360 องศา (Merged & Centered)
       |
A3     | สรุปผู้บริหารระดับ 9-12 (Bold)
A4     | จำนวนผู้ถูกประเมิน:        | B4: [จำนวน]
A5     | คะแนนเฉลี่ยรวม:           | B5: [คะแนน]
A6     | จำนวนคำตอบทั้งหมด:        | B6: [จำนวน]
       |
A8     | สรุปพนักงานระดับ 5-8 (Bold)
A9     | จำนวนผู้ถูกประเมิน:        | B9: [จำนวน]
A10    | คะแนนเฉลี่ยรวม:           | B10: [คะแนน]
A11    | จำนวนคำตอบทั้งหมด:        | B11: [จำนวน]
       |
A13    | สรุปรวมทั้งระบบ (Bold)
A14    | จำนวนผู้ถูกประเมินรวม:     | B14: [จำนวน]
A15    | คะแนนเฉลี่ยรวมทั้งระบบ:    | B15: [คะแนน]
A16    | จำนวนคำตอบรวมทั้งระบบ:     | B16: [จำนวน]
```

#### Sheet 4: รายการคำถามและตัวเลือก
**8 คอลัมน์**:
| คอลัมน์ | ชื่อคอลัมน์ | ข้อมูล |
|---------|-------------|--------|
| A | รหัสคำถาม | question.id |
| B | ส่วนของแบบประเมิน | part.title |
| C | หมวดหมู่ | aspect.name |
| D | คำถาม | question.title |
| E | ประเภทคำถาม | question.type (แปลเป็นไทย) |
| F | รหัสตัวเลือก | option.id |
| G | ตัวเลือกคำตอบ | option.label |
| H | คะแนน | option.score |

### 2. **Executive Report (รายงานผู้บริหาร)**
**ไฟล์ที่สร้าง**: `รายงานการประเมิน_1_[timestamp].xlsx`

**โครงสร้าง**: Single Sheet
- ใช้ `EvaluationExportService->exportByEvaluationType(1, $filters)`
- evaluation_id = 1 สำหรับ grades ตาม evaluation.grade_min ถึง evaluation.grade_max
- 22 คอลัมน์เหมือนกับ Comprehensive Report Sheet 1

### 3. **Employee Report (รายงานพนักงาน)**
**ไฟล์ที่สร้าง**: `รายงานการประเมิน_3_[timestamp].xlsx`

**โครงสร้าง**: Single Sheet
- ใช้ `EvaluationExportService->exportByEvaluationType(3, $filters)`
- evaluation_id = 3 สำหรับ grades ตาม evaluation.grade_min ถึง evaluation.grade_max
- 22 คอลัมน์เหมือนกับ Comprehensive Report Sheet 2

### 4. **Self-Evaluation Report (รายงานการประเมินตนเอง)**
**ไฟล์ที่สร้าง**: `รายงานการประเมินตนเอง_[timestamp].xlsx`

**เงื่อนไขพิเศษ**: 
```sql
WHERE a.user_id = a.evaluatee_id  -- Self-evaluation condition
```

**22 คอลัมน์**: เหมือนกับรายงานอื่นๆ แต่มีข้อมูลเฉพาะการประเมินตนเอง (angle = 'self')

### 5. **Detailed Evaluation Data (รายงานรายละเอียดครบถ้วน)**
**ไฟล์ที่สร้าง**: `รายงานรายละเอียดการประเมิน_[evaluation_id]_[timestamp].xlsx`

**18 คอลัมน์ (แตกต่างจากรายงานอื่น)**:
| คอลัมน์ | ชื่อคอลัมน์ | ข้อมูล |
|---------|-------------|--------|
| A | ลำดับ | เลขลำดับ |
| B | รหัสพนักงานผู้ถูกประเมิน | evaluatee.emid |
| C | ชื่อผู้ถูกประเมิน | evaluatee.fname + evaluatee.lname |
| D | ระดับ | evaluatee.grade |
| E | หน่วยงาน | division.name |
| F | แผนก | department.name |
| G | ตำแหน่ง | position.title |
| H | รหัสพนักงานผู้ประเมิน | evaluator.emid |
| I | ชื่อผู้ประเมิน | evaluator.fname + evaluator.lname |
| J | มุมการประเมิน | evaluation_angle (แปลเป็นไทย) |
| K | ส่วนที่ | part.title |
| L | หมวดหมู่ | aspect.name |
| M | หมวดหมู่ย่อย | sub_aspect.name |
| N | คำถาม | question.title |
| O | คำตอบ | option.label |
| P | คะแนน | option.score |
| Q | ข้อความเพิ่มเติม | other_text |
| R | วันที่ตอบ | answer.created_at |

### 6. **Summary Report (รายงานสรุป)**
**ไฟล์ที่สร้าง**: `รายงานสรุปการประเมิน_[fiscal_year].xlsx`

**โครงสร้างแบบพิเศษ**:
```
A1:D1  | รายงานสรุปการประเมิน 360 องศา (Merged, 16pt, Bold)

A3     | ผู้เข้าร่วม:              | B3: [จำนวน]
A4     | เสร็จสิ้น:               | B4: [จำนวน]  
A5     | คะแนนเฉลี่ย:             | B5: [คะแนน]

A7     | ระดับ    | B7: จำนวน  | C7: เสร็จสิ้น | D7: คะแนนเฉลี่ย (Bold Row)
A8     | C5       | B8: [xx]   | C8: [xx]     | D8: [xx.xx]
A9     | C6       | B9: [xx]   | C9: [xx]     | D9: [xx.xx]
...    | ...      | ...        | ...          | ...
```

### 7. **Individual Detailed Report (รายงานรายบุคคลละเอียด)**
**ไฟล์ที่สร้าง**: `รายงานรายบุคคล_[user_name]_[fiscal_year].xlsx`

**โครงสร้างรายบุคคล**:
```
A1:B1  | รายงานการประเมินรายบุคคล (Merged, 16pt, Bold)

A3     | ชื่อ:                    | B3: [ชื่อผู้ใช้]
A4     | ตำแหน่ง:                 | B4: [ตำแหน่ง]
A5     | หน่วยงาน:                | B5: [หน่วยงาน]

A7     | ประเมินตนเอง:            | B7: [คะแนน]
A8     | องศาบน:                  | B8: [คะแนน]
A9     | องศาล่าง:                | B9: [คะแนน]
A10    | องศาซ้าย:                | B10: [คะแนน]
A11    | องศาขวา:                 | B11: [คะแนน]
```

## 🎨 การจัดรูปแบบและ Styling

### Header Styling
```php
// Main Title (A1)
$sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
$sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

// Column Headers (Row 5)
$sheet->getStyle('A5:V5')->getFont()->setBold(true);
$sheet->getStyle('A5:V5')->getFill()
      ->setFillType(Fill::FILL_SOLID)
      ->getStartColor()->setRGB('4F46E5');  // Blue background
$sheet->getStyle('A5:V5')->getFont()->getColor()->setRGB('FFFFFF');  // White text
$sheet->getStyle('A5:V5')->getBorders()->getAllBorders()
      ->setBorderStyle(Border::BORDER_THIN);
```

### Column Width Optimization
```php
// Auto-size ทุกคอลัมน์
foreach (range('A', 'V') as $column) {
    $sheet->getColumnDimension($column)->setAutoSize(true);
}

// กำหนดความกว้างเฉพาะ
$sheet->getColumnDimension('B')->setWidth(15);  // รหัสพนักงาน
$sheet->getColumnDimension('C')->setWidth(25);  // ชื่อผู้ถูกประเมิน
$sheet->getColumnDimension('H')->setWidth(15);  // รหัสผู้ประเมิน
$sheet->getColumnDimension('I')->setWidth(25);  // ชื่อผู้ประเมิน
$sheet->getColumnDimension('O')->setWidth(50);  // คำถาม
$sheet->getColumnDimension('R')->setWidth(15);  // คำตอบ
$sheet->getColumnDimension('T')->setWidth(30);  // ข้อความเพิ่มเติม
```

### Border และ Grid
```php
// เพิ่ม border ให้ทุกเซลล์ที่มีข้อมูล
if ($maxRows > 5) {
    $range = 'A5:V' . $maxRows;
    $sheet->getStyle($range)->getBorders()->getAllBorders()
          ->setBorderStyle(Border::BORDER_THIN);
}

// กำหนดความสูงของ header row
$sheet->getRowDimension(5)->setRowHeight(25);
```

## 🔄 Data Processing Pipeline

### 1. Data Retrieval (การดึงข้อมูล)
```php
$query = DB::table('answers as a')
    ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
    ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
    ->join('questions as q', 'a.question_id', '=', 'q.id')
    ->join('options as o', 'a.value', '=', 'o.id')
    ->join('evaluation_assignments as ea', function($join) {
        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
             ->on('a.user_id', '=', 'ea.evaluator_id')
             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
    })
    ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
    ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
    ->leftJoin('sub_aspects as sub_asp', 'q.sub_aspect_id', '=', 'sub_asp.id')
    ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
    ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
    ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id');
```

### 2. Data Filtering
```php
// Filter by fiscal year
if (!empty($filters['fiscal_year'])) {
    $query->where(function($q) use ($filters) {
        $q->whereYear('a.created_at', $filters['fiscal_year'])
          ->orWhereExists(function($subq) use ($filters) {
              $subq->select(DB::raw(1))
                   ->from('evaluations as eval')
                   ->whereColumn('eval.id', 'a.evaluation_id')
                   ->whereYear('eval.created_at', $filters['fiscal_year']);
          });
    });
}

// Filter by division
if (!empty($filters['division_id'])) {
    $query->where('evaluatee.division_id', $filters['division_id']);
}

// Filter by specific user
if (!empty($filters['user_id'])) {
    $query->where('evaluatee.id', $filters['user_id']);
}
```

### 3. Data Ordering
```php
$results = $query->orderBy('evaluatee.id')
                ->orderBy('p.order')           // Part order
                ->orderBy('q.id')             // Question ID
                ->orderBy('ea.angle')         // Evaluation angle
                ->get();
```

### 4. Data Transformation
```php
private function processEvaluationResults(Collection $results): array
{
    $processedData = [];
    
    foreach ($results as $result) {
        $evaluateeKey = $result->evaluatee_id;
        
        if (!isset($processedData[$evaluateeKey])) {
            $processedData[$evaluateeKey] = [
                'evaluatee_id' => $result->evaluatee_id,
                'evaluatee_emid' => $result->evaluatee_emid ?? '',
                'evaluatee_name' => trim($result->evaluatee_fname . ' ' . $result->evaluatee_lname),
                'evaluatee_grade' => $result->evaluatee_grade,
                'evaluatee_division' => $result->evaluatee_division ?? 'ไม่ระบุ',
                'evaluatee_department' => $result->evaluatee_department ?? 'ไม่ระบุ',
                'evaluatee_position' => $result->evaluatee_position ?? 'ไม่ระบุ',
                'evaluations' => []
            ];
        }
        
        $evaluationKey = $result->evaluator_emid . '_' . $result->evaluation_angle . '_' . $result->question_id;
        
        $processedData[$evaluateeKey]['evaluations'][$evaluationKey] = [
            'evaluator_emid' => $result->evaluator_emid ?? '',
            'evaluator_name' => trim($result->evaluator_fname . ' ' . $result->evaluator_lname),
            'angle' => $result->evaluation_angle,
            'question_id' => $result->question_id,
            'question_title' => $result->question_title,
            'question_type' => $result->question_type,
            'part_title' => $result->part_title,
            'part_order' => $result->part_order,
            'aspect_name' => $result->aspect_name,
            'sub_aspect_name' => $result->sub_aspect_name,
            'option_id' => $result->option_id,
            'option_label' => $result->option_label,
            'option_score' => $result->option_score,
            'other_text' => $result->other_text,
            'answer_date' => $result->answer_date,
            'fiscal_year' => $result->fiscal_year
        ];
    }
    
    return array_values($processedData);
}
```

## 🌐 Translation Systems

### Evaluation Angle Translation
```php
private function translateAngle(string $angle): string
{
    $translations = [
        'self' => 'ประเมินตนเอง',
        'top' => 'ผู้บังคับบัญชา',
        'bottom' => 'ผู้ใต้บังคับบัญชา',
        'left' => 'เพื่อนร่วมงาน (ซ้าย)',
        'right' => 'เพื่อนร่วมงาน (ขวา)'
    ];
    
    return $translations[$angle] ?? $angle;
}
```

### Question Type Translation
```php
private function translateQuestionType(string $type): string
{
    $translations = [
        'rating' => 'คะแนน',
        'choice' => 'เลือกตอบ',
        'multiple_choice' => 'เลือกหลายคำตอบ',
        'open_text' => 'ข้อความ'
    ];
    
    return $translations[$type] ?? $type;
}
```

## 📈 Statistical Calculations

### Summary Statistics
```php
private function calculateSummaryStats(array $evaluationData): array
{
    $totalEvaluatees = count($evaluationData);
    $totalAnswers = 0;
    $totalScore = 0;
    $scoreCount = 0;
    
    foreach ($evaluationData as $evaluatee) {
        foreach ($evaluatee['evaluations'] as $evaluation) {
            $totalAnswers++;
            if (is_numeric($evaluation['option_score'])) {
                $totalScore += $evaluation['option_score'];
                $scoreCount++;
            }
        }
    }
    
    return [
        'total_evaluatees' => $totalEvaluatees,
        'total_answers' => $totalAnswers,
        'average_score' => $scoreCount > 0 ? $totalScore / $scoreCount : 0
    ];
}
```

## 🗂️ File Naming Conventions

### Filename Patterns
```php
// Comprehensive Report
'รายงานการประเมิน_360_องศา_' . now()->format('Y-m-d_H-i-s') . '.xlsx'

// Executive Report
'รายงานการประเมิน_' . $evaluation->id . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx'

// Self-Evaluation Report  
'รายงานการประเมินตนเอง_' . now()->format('Y-m-d_H-i-s') . '.xlsx'

// Detailed Evaluation Data
'รายงานรายละเอียดการประเมิน_' . $evaluationId . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx'

// Summary Report
"รายงานสรุปการประเมิน_{$fiscalYear}.xlsx"

// Individual Report
"รายงานรายบุคคล_{$user['name']}_{$fiscalYear}.xlsx"
```

## 🔧 Technical Implementation Details

### PhpSpreadsheet Components Used
```php
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
```

### Memory Management
```php
// File generation and cleanup
$filePath = storage_path('app/exports/' . $filename);

if (!file_exists(dirname($filePath))) {
    mkdir(dirname($filePath), 0755, true);
}

$writer = new Xlsx($spreadsheet);
$writer->save($filePath);

// Response with auto-delete
return response()->download($filePath, $filename)->deleteFileAfterSend(true);
```

### Stream Download for Large Files
```php
return response()->streamDownload(function() use ($writer) {
    $writer->save('php://output');
}, $filename, [
    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
```

## 📝 Data Validation และ Error Handling

### Input Validation
```php
// Fiscal year validation
if (!empty($filters['fiscal_year'])) {
    $filters['fiscal_year'] = (int) $filters['fiscal_year'];
    if ($filters['fiscal_year'] < 2020 || $filters['fiscal_year'] > 2030) {
        throw new \InvalidArgumentException('Invalid fiscal year');
    }
}

// Evaluation ID validation
if (!$evaluationId) {
    return response()->json(['error' => 'กรุณาระบุรหัสการประเมิน'], 400);
}

$evaluation = Evaluation::findOrFail($evaluationId);
```

### Exception Handling
```php
try {
    $spreadsheet = new Spreadsheet();
    // ... export logic
    return $filePath;
} catch (\Exception $e) {
    Log::error('Export comprehensive evaluation report error: ' . $e->getMessage());
    throw $e;
}
```

## 🎯 Performance Considerations

### Query Optimization
- ใช้ `leftJoin` สำหรับข้อมูลที่อาจไม่มี
- Order by หลายคอลัมน์เพื่อการจัดเรียงที่สมเหตุสมผล
- Select เฉพาะฟิลด์ที่จำเป็น

### Memory Usage
- ใช้ `streamDownload()` สำหรับไฟล์ขนาดใหญ่
- ลบไฟล์หลังการส่งด้วย `deleteFileAfterSend(true)`
- Processing แบบ chunk สำหรับข้อมูลจำนวนมาก

### File Size Optimization
- Auto-size columns เฉพาะที่จำเป็น
- กำหนดความกว้างคอลัมน์ที่เหมาะสม
- ใช้ styling อย่างมีประสิทธิภาพ

## สรุป

ระบบ Excel Export มีความซับซ้อนสูงด้วยการรองรับ 7 ประเภทรายงานหลัก แต่ละประเภทมีโครงสร้างและการจัดการข้อมูลที่แตกต่างกัน ระบบใช้ PhpSpreadsheet อย่างเต็มประสิทธิภาพ พร้อมกับการจัดการ styling, translation, และ performance optimization ที่ครอบคลุม

ข้อมูลที่ส่งออกครอบคลุมการประเมิน 360 องศาแบบสมบูรณ์ ตั้งแต่ข้อมูลระดับผู้ใช้ไปจนถึงรายละเอียดของแต่ละคำถามและคำตอบ พร้อมกับการแปลภาษาและการคำนวณสถิติที่เหมาะสม