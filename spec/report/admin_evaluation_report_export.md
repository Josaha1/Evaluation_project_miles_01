# AdminEvaluationReport Export System - Technical Specification

## ภาพรวมระบบ

ระบบการ Export ในหน้า AdminEvaluationReport เป็นระบบที่ครอบคลุมการส่งออกรายงานการประเมิน 360 องศา ทั้งในรูปแบบ Excel และ PDF พร้อมกับ UI/UX ที่ทันสมัยและฟีเจอร์ขั้นสูง

## สถาปัตยกรรมระบบ

### 1. Frontend Architecture

#### 1.1 Main Component Structure
```typescript
// AdminEvaluationReport.tsx - หน้าหลัก
├── ExportModal Component          // Modal สำหรับตั้งค่าการส่งออก
├── ExportsView Component          // หน้า Exports ใน Dashboard
└── ReportExport Component         // Component ย่อยสำหรับการส่งออก
```

#### 1.2 State Management
```typescript
interface ExportOptions {
    format: 'excel' | 'pdf' | 'csv';           // รูปแบบไฟล์
    includeCharts: boolean;                     // รวมกราฟ
    includeRawData: boolean;                    // รวมข้อมูลดิบ
    dateRange: 'all' | 'current' | 'custom';   // ช่วงเวลา
    reportType: 'summary' | 'detailed' | 'individual' | 'comparison';
    divisions: string[];                        // หน่วยงานที่เลือก
    grades: number[];                          // ระดับที่เลือก
}

interface DashboardConfig {
    theme: 'light' | 'dark';                   // ธีม
    view: 'dashboard' | 'analytics' | 'reports' | 'exports';
    layout: 'grid' | 'list';                  // รูปแบบการแสดงผล
    compactMode: boolean;                      // โหมดกะทัดรัด
    autoRefresh: boolean;                      // รีเฟรชอัตโนมัติ
    refreshInterval: number;                   // ระยะเวลารีเฟรช (ms)
}
```

### 2. Export Types และ Configuration

#### 2.1 Export Templates (5 ประเภทหลัก)
```typescript
const exportTypes = [
    {
        id: 'comprehensive',
        title: 'รายงานรวมผู้บริหารและพนักงาน',
        description: 'รายงานครบถ้วนทั้งระดับ 9-12 และ 5-8 พร้อม Option Mapping',
        icon: Building,
        color: 'emerald',
        endpoint: '/admin/reports/evaluation/export/comprehensive'
    },
    {
        id: 'executives',
        title: 'รายงานผู้บริหารระดับ 9-12',
        description: 'รายงานเฉพาะผู้บริหารระดับ 9-12 พร้อมคำถามและคะแนน',
        icon: Crown,
        color: 'amber',
        endpoint: '/admin/reports/evaluation/export/executives'
    },
    {
        id: 'employees',
        title: 'รายงานพนักงานระดับ 5-8',
        description: 'รายงานเฉพาะพนักงานระดับ 5-8 พร้อมคำถามและคะแนน',
        icon: Users,
        color: 'cyan',
        endpoint: '/admin/reports/evaluation/export/employees'
    },
    {
        id: 'self-evaluation',
        title: 'การประเมินตนเอง',
        description: 'รายงานการประเมินตนเองของทุกระดับพร้อมคำถามและคะแนน',
        icon: User,
        color: 'indigo',
        endpoint: '/admin/reports/evaluation/export/self-evaluation'
    },
    {
        id: 'detailed-data',
        title: 'รายงานรายละเอียดครบถ้วน',
        description: 'ข้อมูลรายละเอียดทุกคำถาม ผู้ประเมิน และผู้ถูกประเมิน',
        icon: Database,
        color: 'violet',
        endpoint: '/admin/reports/evaluation/export/detailed-data'
    }
];
```

#### 2.2 Export Configuration Options
```typescript
// Format Selection
const formats = ['excel', 'pdf', 'csv'];

// Date Range Options
const dateRanges = [
    { value: 'current', label: 'ปีงบประมาณปัจจุบัน' },
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'custom', label: 'กำหนดเอง' }
];

// Report Type Options
const reportTypes = [
    { value: 'summary', label: 'สรุปภาพรวม' },
    { value: 'detailed', label: 'รายละเอียด' },
    { value: 'individual', label: 'รายบุคคล' },
    { value: 'comparison', label: 'เปรียบเทียบ' }
];
```

## 3. Export Process Flow

### 3.1 Frontend Export Handler
```typescript
const handleExport = async (type: string) => {
    setIsExporting(true);
    
    try {
        // 1. Prepare FormData
        const formData = new FormData();
        formData.append('fiscal_year', fiscalYear);
        formData.append('export_type', type);
        formData.append('format', exportOptions.format);
        formData.append('include_charts', exportOptions.includeCharts.toString());
        formData.append('include_raw_data', exportOptions.includeRawData.toString());
        formData.append('date_range', exportOptions.dateRange);
        formData.append('report_type', exportOptions.reportType);
        
        // 2. Add filters
        if (selectedDivision) formData.append('division_id', selectedDivision);
        if (selectedGrade) formData.append('grade', selectedGrade);
        
        // 3. Add evaluation_id for specific types
        if (['detailed-data', 'executives', 'employees', 'self-evaluation'].includes(type)) {
            const evaluationId = type === 'employees' ? '3' : '1';
            formData.append('evaluation_id', evaluationId);
        }
        
        // 4. Add arrays
        exportOptions.divisions.forEach(div => formData.append('divisions[]', div));
        exportOptions.grades.forEach(grade => formData.append('grades[]', grade.toString()));
        
        // 5. Add CSRF token
        formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

        // 6. Determine endpoint
        let endpoint = `/admin/reports/evaluation/export/${type}`;
        if (type === 'self-evaluation') {
            endpoint = '/admin/reports/evaluation/export/self-evaluation';
        }
        
        // 7. Make request
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        // 8. Handle response
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const fileExtension = exportOptions.format === 'excel' ? 'xlsx' : 
                                exportOptions.format === 'pdf' ? 'pdf' : 'csv';
            link.download = `รายงานการประเมิน_${type}_${fiscalYear}.${fileExtension}`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } else {
            // Handle errors
            throw new Error(`Export failed: ${response.status}`);
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
        setIsExporting(false);
        setShowExportModal(false);
    }
};
```

### 3.2 Backend Controller Methods

#### 3.2.1 Export Routes Mapping
```php
// File: routes/web.php
Route::prefix('admin/evaluation-report')->name('admin.evaluation-report.')->group(function () {
    // Enhanced export methods with option mapping
    Route::post('/export/comprehensive', [AdminEvaluationReportController::class, 'exportComprehensiveReport'])
        ->name('export-comprehensive');
    Route::post('/export/executives', [AdminEvaluationReportController::class, 'exportExecutiveReport'])
        ->name('export-executives');  
    Route::post('/export/employees', [AdminEvaluationReportController::class, 'exportEmployeeReport'])
        ->name('export-employees');
    Route::post('/export/self-evaluation', [AdminEvaluationReportController::class, 'exportSelfEvaluationReport'])
        ->name('export-self-evaluation');
    Route::post('/export/detailed-data', [AdminEvaluationReportController::class, 'exportDetailedEvaluationData'])
        ->name('export-detailed-data');
});
```

#### 3.2.2 Controller Export Methods

##### exportComprehensiveReport()
```php
public function exportComprehensiveReport(Request $request)
{
    try {
        $filters = [
            'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
            'division_id' => $request->input('division_id'),
            'user_id' => $request->input('user_id')
        ];

        $filePath = $this->evaluationExportService->exportComprehensiveEvaluationReport($filters);
        $filename = basename($filePath);

        return response()->download($filePath, $filename)->deleteFileAfterSend(true);
    } catch (\Exception $e) {
        Log::error('Export comprehensive report error: ' . $e->getMessage());
        return response()->json(['error' => 'การส่งออกรายงานล้มเหลว'], 500);
    }
}
```

##### exportExecutiveReport()
```php
public function exportExecutiveReport(Request $request)
{
    try {
        $filters = [
            'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
            'division_id' => $request->input('division_id'),
            'user_id' => $request->input('user_id')
        ];

        // Evaluation ID 1 is for internal executives 9-12
        $filePath = $this->evaluationExportService->exportByEvaluationType(1, $filters);
        $filename = basename($filePath);

        return response()->download($filePath, $filename)->deleteFileAfterSend(true);
    } catch (\Exception $e) {
        Log::error('Export executive report error: ' . $e->getMessage());
        return response()->json(['error' => 'การส่งออกรายงานผู้บริหารล้มเหลว'], 500);
    }
}
```

##### exportEmployeeReport()
```php
public function exportEmployeeReport(Request $request)
{
    try {
        $filters = [
            'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
            'division_id' => $request->input('division_id'),
            'user_id' => $request->input('user_id')
        ];

        // Evaluation ID 3 is for employees 5-8
        $filePath = $this->evaluationExportService->exportByEvaluationType(3, $filters);
        $filename = basename($filePath);

        return response()->download($filePath, $filename)->deleteFileAfterSend(true);
    } catch (\Exception $e) {
        Log::error('Export employee report error: ' . $e->getMessage());
        return response()->json(['error' => 'การส่งออกรายงานพนักงานล้มเหลว'], 500);
    }
}
```

##### exportDetailedEvaluationData()
```php
public function exportDetailedEvaluationData(Request $request)
{
    try {
        $evaluationId = $request->input('evaluation_id');
        $fiscalYear = $request->input('fiscal_year', $this->getCurrentFiscalYear());
        $divisionId = $request->input('division_id');
        $userId = $request->input('user_id');

        if (!$evaluationId) {
            return response()->json(['error' => 'กรุณาระบุรหัสการประเมิน'], 400);
        }

        $evaluation = Evaluation::findOrFail($evaluationId);
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('รายงานรายละเอียด');
        
        // Get detailed data with questions, evaluators, and option mappings
        $detailedData = $this->getDetailedEvaluationData($evaluationId, $fiscalYear, $divisionId, $userId);
        
        $this->populateDetailedDataSheet($sheet, $detailedData, $evaluation->title);
        
        $filename = 'รายงานรายละเอียดการประเมิน_' . $evaluationId . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
        
        $writer = new Xlsx($spreadsheet);
        
        return response()->streamDownload(function() use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    } catch (\Exception $e) {
        Log::error('Export detailed evaluation data error: ' . $e->getMessage());
        return response()->json(['error' => 'การส่งออกรายงานรายละเอียดล้มเหลว'], 500);
    }
}
```

## 4. UI/UX Features

### 4.1 Export Modal Component
```typescript
const ExportModal: React.FC<{
    exportOptions: ExportOptions;
    setExportOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
    handleExport: (type: string) => Promise<void>;
    isExporting: boolean;
    onClose: () => void;
    dashboardConfig: DashboardConfig;
    availableDivisions: any[];
    availableGrades: number[];
}> = ({ ... }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">ส่งออกรายงาน</h2>
                    <button onClick={onClose}>×</button>
                </div>

                {/* Export Options Form */}
                <div className="space-y-6">
                    {/* Format Selection */}
                    <div className="grid grid-cols-3 gap-3">
                        {['excel', 'pdf', 'csv'].map((format) => (
                            <FormatButton key={format} format={format} />
                        ))}
                    </div>
                    
                    {/* Advanced Options */}
                    <AdvancedOptionsSection />
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <ExportButton />
                        <CancelButton />
                    </div>
                </div>
            </div>
        </div>
    );
};
```

### 4.2 Exports View Page
```typescript
const ExportsView: React.FC<{...}> = ({ ... }) => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">ส่งออกรายงาน</h2>
                <div className="px-4 py-2 rounded-xl bg-blue-100">
                    <span>รูปแบบ: {exportOptions.format.toUpperCase()}</span>
                </div>
            </div>

            {/* Export Configuration Panel */}
            <ExportConfigurationPanel />

            {/* Export Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exportTypes.map((type) => (
                    <ExportCard key={type.id} type={type} />
                ))}
            </div>
        </div>
    );
};
```

### 4.3 Theme Support
```css
/* Dark Mode Support */
.export-container {
    @apply rounded-2xl p-6 shadow-xl;
}

.export-container.dark {
    @apply bg-slate-800/50 border border-slate-700;
}

.export-container.light {
    @apply bg-white border border-gray-200;
}

/* Export Button States */
.export-button {
    @apply py-2 px-4 rounded-lg font-medium transition-colors;
}

.export-button:disabled {
    @apply opacity-50 cursor-not-allowed;
}

.export-button.exporting {
    @apply bg-blue-500 text-white;
}
```

## 5. การจัดการ State และ Loading

### 5.1 Export State Management
```typescript
const [isExporting, setIsExporting] = useState(false);
const [showExportModal, setShowExportModal] = useState(false);
const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeCharts: true,
    includeRawData: false,
    dateRange: 'current',
    reportType: 'summary',
    divisions: [],
    grades: []
});
```

### 5.2 Loading States และ Progress Tracking
```typescript
// Progress Indicator Component
const ExportProgress: React.FC<{ isExporting: boolean }> = ({ isExporting }) => {
    return (
        <div className={`flex items-center gap-2 ${isExporting ? 'visible' : 'hidden'}`}>
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
                กำลังส่งออก...
            </span>
        </div>
    );
};

// Export Button with Loading State
const ExportButton: React.FC<{ onClick: () => void; isExporting: boolean }> = ({ onClick, isExporting }) => {
    return (
        <button
            onClick={onClick}
            disabled={isExporting}
            className="w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
        >
            {isExporting ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังส่งออก...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    ส่งออก
                </>
            )}
        </button>
    );
};
```

## 6. Error Handling และ Validation

### 6.1 Frontend Error Handling
```typescript
try {
    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    });

    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Export failed: ${response.status} ${response.statusText}`);
        } else {
            throw new Error(`Export failed: ${response.status} ${response.statusText}`);
        }
    }
    
    // Handle success response
    const blob = await response.blob();
    // ... download logic
} catch (error) {
    console.error('Export error:', error);
    alert('ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง');
}
```

### 6.2 Backend Error Handling
```php
try {
    $filters = [
        'fiscal_year' => $request->input('fiscal_year', $this->getCurrentFiscalYear()),
        'division_id' => $request->input('division_id'),
        'user_id' => $request->input('user_id')
    ];

    $filePath = $this->evaluationExportService->exportComprehensiveEvaluationReport($filters);
    $filename = basename($filePath);

    return response()->download($filePath, $filename)->deleteFileAfterSend(true);
} catch (\Exception $e) {
    Log::error('Export comprehensive report error: ' . $e->getMessage());
    return response()->json(['error' => 'การส่งออกรายงานล้มเหลว'], 500);
}
```

## 7. Performance Optimization

### 7.1 Frontend Optimizations
- **Lazy Loading**: Components โหลดเมื่อจำเป็น
- **Debouncing**: การค้นหาและ filter
- **Memoization**: React.memo สำหรับ components ที่ไม่เปลี่ยนแปลงบ่อย
- **Chunked Rendering**: แสดงผลข้อมูลเป็นชุดๆ

### 7.2 Backend Optimizations
- **Streaming Response**: ใช้ `streamDownload()` สำหรับไฟล์ขนาดใหญ่
- **Memory Management**: จัดการ memory ใน PHP อย่างเหมาะสม
- **Query Optimization**: ใช้ eager loading และ select specific fields
- **Cache Strategy**: Cache ข้อมูลที่ไม่เปลี่ยนแปลงบ่อย

## 8. Security Features

### 8.1 Authentication และ Authorization
```php
// Route Protection
Route::middleware(['auth', 'role:admin'])->group(function () {
    // Export routes
});

// Controller Level Checks
public function exportComprehensiveReport(Request $request)
{
    if (!auth()->user()->hasRole('admin')) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    // ...
}
```

### 8.2 CSRF Protection
```typescript
// Frontend CSRF Token
formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');
```

### 8.3 Input Validation
```php
// Backend Validation
$request->validate([
    'fiscal_year' => 'integer|min:2020|max:2030',
    'division_id' => 'integer|exists:divisions,id',
    'evaluation_id' => 'integer|exists:evaluations,id',
    'format' => 'in:excel,pdf,csv'
]);
```

### 8.4 File Security
```php
// Secure File Handling
$filePath = storage_path('app/exports/' . $filename);
return response()->download($filePath, $filename)->deleteFileAfterSend(true);
```

## 9. Dashboard Integration

### 9.1 Tab System
```typescript
const dashboardTabs = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: Grid3X3 },
    { id: 'analytics', label: 'วิเคราะห์', icon: TrendingUp },
    { id: 'reports', label: 'รายงาน', icon: FileText },
    { id: 'exports', label: 'ส่งออก', icon: Download }  // Export Tab
];
```

### 9.2 Export Button in Header
```typescript
{/* Export Button in Main Header */}
<button
    onClick={() => setShowExportModal(true)}
    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg flex items-center gap-2"
>
    <Download className="h-5 w-5 text-gray-300" />
    ส่งออกรายงาน
</button>
```

### 9.3 View Switching
```typescript
{/* Conditional Rendering based on view */}
{dashboardConfig.view === 'exports' && (
    <ExportsView 
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
        handleExport={handleExport}
        isExporting={isExporting}
        dashboardConfig={dashboardConfig}
        availableDivisions={availableDivisions}
        availableGrades={availableGrades}
    />
)}
```

## 10. การทดสอบและ Quality Assurance

### 10.1 Frontend Testing
```typescript
// Unit Tests
describe('Export Functionality', () => {
    test('should handle export request correctly', async () => {
        // Test implementation
    });
    
    test('should show loading state during export', () => {
        // Test implementation
    });
    
    test('should handle export errors gracefully', () => {
        // Test implementation
    });
});
```

### 10.2 Backend Testing
```php
// Feature Tests
class ExportTest extends TestCase
{
    public function test_comprehensive_export_returns_file()
    {
        $response = $this->actingAs($admin)
            ->post('/admin/evaluation-report/export/comprehensive', [
                'fiscal_year' => 2024
            ]);
            
        $response->assertOk();
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
```

## สรุป

ระบบ Export ในหน้า AdminEvaluationReport เป็นระบบที่ซับซ้อนและครอบคลุม ประกอบด้วย:

### จุดเด่นของระบบ
1. **UI/UX ที่ทันสมัย**: รองรับ Dark/Light theme, Responsive design
2. **ความยืดหยุ่นสูง**: รองรับการส่งออกหลายรูปแบบ (Excel, PDF, CSV)
3. **Configuration ที่หลากหลาย**: ตั้งค่าการส่งออกได้ตามต้องการ
4. **Performance ที่ดี**: ใช้ streaming download และ memory optimization
5. **Security**: CSRF protection, Authentication, Authorization
6. **Error Handling**: จัดการข้อผิดพลาดอย่างครอบคลุม

### Architecture ที่ใช้
- **Frontend**: React + TypeScript, Modern hooks, State management
- **Backend**: Laravel, Service layer pattern, Repository pattern
- **File Generation**: PhpSpreadsheet (Excel), DomPDF (PDF)
- **Security**: Laravel built-in security features

### การพัฒนาต่อ
1. **Real-time Progress**: แสดงความคืบหน้าการส่งออกแบบ real-time
2. **Background Jobs**: ประมวลผลการส่งออกแบบ asynchronous
3. **Template System**: ระบบ template สำหรับการส่งออกที่ปรับแต่งได้
4. **Audit Trail**: เก็บประวัติการส่งออกอย่างละเอียด

ระบบนี้ได้รับการออกแบบมาเพื่อรองรับการใช้งานในองค์กรขนาดใหญ่ พร้อมกับความต้องการในการส่งออกรายงานที่หลากหลายและซับซ้อน