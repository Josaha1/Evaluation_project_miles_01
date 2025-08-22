import React, { useState } from "react";
import { Download, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Database, BarChart3, FileText, Users, Target, Info, File } from "lucide-react";
import { router } from "@inertiajs/react";

interface ReportExportProps {
    fiscalYear: string;
    filters: {
        division?: string;
        grade?: string;
        user_id?: string;
    };
    totalRecords: number;
    availableUsers?: { id: number; name: string }[];
}

const ReportExport: React.FC<ReportExportProps> = ({ fiscalYear, filters, totalRecords, availableUsers }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [exportMessage, setExportMessage] = useState('');
    const [detailedOptions, setDetailedOptions] = useState({
        includeRawScores: true,
        includeAngleBreakdown: true,
        includeQuestionDetails: false,
        selectedUsers: [] as number[]
    });

    const handleExport = async (groupFilter: string = 'all', format: string = 'xlsx') => {
        if (isExporting) return;

        setIsExporting(true);
        setExportStatus('idle');
        setExportMessage('กำลังสร้างไฟล์...');

        try {
            const exportData = {
                fiscal_year: fiscalYear,
                division: filters.division || null,
                group_filter: groupFilter,
                format: format,
            };

            // Create a form and submit to trigger download
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.evaluation-report.export-individual');
            form.style.display = 'none';

            // Add CSRF token with better error handling
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add export data
            Object.entries(exportData).forEach(([key, value]) => {
                if (value !== null) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value.toString();
                    form.appendChild(input);
                }
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            // Simulate progress
            setTimeout(() => {
                setExportStatus('success');
                setExportMessage('ส่งออกสำเร็จ');
                setTimeout(() => {
                    setIsExporting(false);
                    setExportStatus('idle');
                    setExportMessage('');
                }, 2000);
            }, 1500);

        } catch (error) {
            console.error('Export error:', error);
            setExportStatus('error');
            setExportMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออก');
            setTimeout(() => {
                setIsExporting(false);
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        }
    };

    const handleCompletionExport = async (format: string = 'xlsx') => {
        if (isExporting) return;

        setIsExporting(true);
        setExportStatus('idle');
        setExportMessage('กำลังสร้างไฟล์ข้อมูลความครบถ้วน...');

        try {
            const exportData = {
                fiscal_year: fiscalYear,
                division: filters.division || null,
                grade: filters.grade || null,
                format: format,
            };

            // Create a form and submit to trigger download
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.evaluation-report.export-completion-data');
            form.style.display = 'none';

            // Add CSRF token with better error handling
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add export data
            Object.entries(exportData).forEach(([key, value]) => {
                if (value !== null) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value.toString();
                    form.appendChild(input);
                }
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            // Simulate progress
            setTimeout(() => {
                setExportStatus('success');
                setExportMessage('ส่งออกข้อมูลความครบถ้วนสำเร็จ');
                setTimeout(() => {
                    setIsExporting(false);
                    setExportStatus('idle');
                    setExportMessage('');
                }, 2000);
            }, 1500);

        } catch (error) {
            console.error('Completion export error:', error);
            setExportStatus('error');
            setExportMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูลความครบถ้วน');
            setTimeout(() => {
                setIsExporting(false);
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        }
    };

    const handleRawDataExport = async (format: string = 'xlsx') => {
        if (isExporting) return;

        setIsExporting(true);
        setExportStatus('idle');
        setExportMessage('กำลังสร้างไฟล์ข้อมูลดิบ...');

        try {
            const exportData = {
                fiscal_year: fiscalYear,
                division: filters.division || null,
                grade: filters.grade || null,
                format: format,
            };

            // Create a form and submit to trigger download
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.evaluation-report.export-raw-data');
            form.style.display = 'none';

            // Add CSRF token with better error handling
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add export data
            Object.entries(exportData).forEach(([key, value]) => {
                if (value !== null) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value.toString();
                    form.appendChild(input);
                }
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            // Simulate progress
            setTimeout(() => {
                setExportStatus('success');
                setExportMessage('ส่งออกข้อมูลดิบสำเร็จ');
                setTimeout(() => {
                    setIsExporting(false);
                    setExportStatus('idle');
                    setExportMessage('');
                }, 2000);
            }, 1500);

        } catch (error) {
            console.error('Raw data export error:', error);
            setExportStatus('error');
            setExportMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกข้อมูลดิบ');
            setTimeout(() => {
                setIsExporting(false);
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        }
    };

    const handleDetailedExport = async (format: string = 'xlsx') => {
        if (isExporting) return;

        setIsExporting(true);
        setExportStatus('idle');
        setExportMessage('กำลังสร้างรายงานรายละเอียดแบบครบถ้วน...');

        try {
            const exportData = {
                fiscal_year: fiscalYear,
                division: filters.division || null,
                grade_group: filters.grade || 'all',
                user_ids: detailedOptions.selectedUsers.length > 0 ? detailedOptions.selectedUsers : null,
                include_raw_scores: detailedOptions.includeRawScores,
                include_angle_breakdown: detailedOptions.includeAngleBreakdown,
                include_question_details: detailedOptions.includeQuestionDetails,
                format: format,
            };

            // Create a form and submit to trigger download
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.evaluation-report.export-detailed');
            form.style.display = 'none';

            // Add CSRF token with better error handling
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add export data
            Object.entries(exportData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            const input = document.createElement('input');
                            input.type = 'hidden';
                            input.name = `${key}[${index}]`;
                            input.value = item.toString();
                            form.appendChild(input);
                        });
                    } else {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = value.toString();
                        form.appendChild(input);
                    }
                }
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            // Simulate progress
            setTimeout(() => {
                setExportStatus('success');
                setExportMessage('ส่งออกรายงานรายละเอียดสำเร็จ');
                setTimeout(() => {
                    setIsExporting(false);
                    setExportStatus('idle');
                    setExportMessage('');
                }, 2000);
            }, 2000);

        } catch (error) {
            console.error('Detailed export error:', error);
            setExportStatus('error');
            setExportMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออกรายงานรายละเอียด');
            setTimeout(() => {
                setIsExporting(false);
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        }
    };

    const handlePdfExport = async (groupFilter: string = 'all') => {
        if (isExporting) return;

        setIsExporting(true);
        setExportStatus('idle');
        setExportMessage('กำลังสร้างไฟล์ PDF...');

        try {
            const exportData = {
                fiscal_year: fiscalYear,
                division: filters.division || null,
                group_filter: groupFilter,
                format: 'pdf',
            };

            // Create a form and submit to trigger download
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = route('admin.evaluation-report.export-individual-pdf');
            form.style.display = 'none';

            // Add CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page.');
            }
            
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = '_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            // Add export data
            Object.entries(exportData).forEach(([key, value]) => {
                if (value !== null) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value.toString();
                    form.appendChild(input);
                }
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            // Simulate progress
            setTimeout(() => {
                setExportStatus('success');
                setExportMessage('ส่งออก PDF สำเร็จ');
                setTimeout(() => {
                    setIsExporting(false);
                    setExportStatus('idle');
                    setExportMessage('');
                }, 2000);
            }, 2000);

        } catch (error) {
            console.error('PDF export error:', error);
            setExportStatus('error');
            setExportMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งออก PDF');
            setTimeout(() => {
                setIsExporting(false);
                setExportStatus('idle');
                setExportMessage('');
            }, 3000);
        }
    };

    const exportOptions = [
        {
            id: 'all',
            title: 'ส่งออกทั้งหมด',
            description: 'รายงานครบถ้วนทุกกลุ่ม',
            icon: FileSpreadsheet,
            color: 'blue',
            records: totalRecords,
        },
        {
            id: '5-8',
            title: 'พนักงานภายใน (C5-C8)',
            description: 'เฉพาะพนักงานระดับ 5-8',
            icon: FileSpreadsheet,
            color: 'green',
            records: Math.floor(totalRecords * 0.6), // Estimate
        },
        {
            id: '9-12',
            title: 'ผู้บริหาร (C9-C12)',
            description: 'เฉพาะผู้บริหารระดับ 9-12',
            icon: FileSpreadsheet,
            color: 'purple',
            records: Math.floor(totalRecords * 0.4), // Estimate
        },
    ];

    const getStatusIcon = () => {
        switch (exportStatus) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'error':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            default:
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
        }
    };

    const getStatusColor = () => {
        switch (exportStatus) {
            case 'success':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-blue-600';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Download className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">ส่งออกรายงาน</h3>
            </div>

            {/* Export Status */}
            {isExporting && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className={`text-sm font-medium ${getStatusColor()}`}>
                            {exportMessage}
                        </span>
                    </div>
                    {exportStatus === 'idle' && (
                        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                        </div>
                    )}
                </div>
            )}

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {exportOptions.map((option) => {
                    const Icon = option.icon;
                    const colorClasses = {
                        blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
                        green: 'bg-green-50 border-green-200 hover:bg-green-100',
                        purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
                    };

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleExport(option.id)}
                            disabled={isExporting}
                            className={`p-4 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                colorClasses[option.color as keyof typeof colorClasses]
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Icon className="h-6 w-6 text-gray-700" />
                                <div className="text-left">
                                    <div className="font-medium text-gray-900">{option.title}</div>
                                    <div className="text-sm text-gray-600">{option.description}</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                {option.records.toLocaleString()} รายการ
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ENHANCED: Detailed Export Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold text-gray-900">🚀 ส่งออกรายงานรายละเอียดครบถ้วน</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    ส่งออกข้อมูลการประเมินแบบครบถ้วน แจกแจงตามองศา คะแนนดิบ และรายละเอียดคำถาม เหมาะสำหรับการวิเคราะห์เชิงลึก
                </p>
                
                {/* Export Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={detailedOptions.includeRawScores}
                            onChange={(e) => setDetailedOptions(prev => ({ ...prev, includeRawScores: e.target.checked }))}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">รายละเอียดแต่ละคน</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={detailedOptions.includeAngleBreakdown}
                            onChange={(e) => setDetailedOptions(prev => ({ ...prev, includeAngleBreakdown: e.target.checked }))}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">แจกแจงตามองศา</span>
                    </label>
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={detailedOptions.includeQuestionDetails}
                            onChange={(e) => setDetailedOptions(prev => ({ ...prev, includeQuestionDetails: e.target.checked }))}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-700">รายละเอียดคำถาม</span>
                    </label>
                </div>

                {/* User Selection */}
                {availableUsers && availableUsers.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            เลือกผู้ถูกประเมินเฉพาะ (ไม่เลือก = ทั้งหมด)
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                            {availableUsers.map(user => (
                                <label key={user.id} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={detailedOptions.selectedUsers.includes(user.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setDetailedOptions(prev => ({ 
                                                    ...prev, 
                                                    selectedUsers: [...prev.selectedUsers, user.id] 
                                                }));
                                            } else {
                                                setDetailedOptions(prev => ({ 
                                                    ...prev, 
                                                    selectedUsers: prev.selectedUsers.filter(id => id !== user.id) 
                                                }));
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    <span className="text-gray-700">{user.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => handleDetailedExport('xlsx')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            กำลังส่งออก...
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4" />
                            ส่งออกรายงานรายละเอียดครบถ้วน (Excel)
                        </>
                    )}
                </button>
            </div>

            {/* NEW: Completion Data Export Section */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">🆕 ส่งออกข้อมูลความครบถ้วน</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    ส่งออกข้อมูลความครบถ้วนการประเมินตามองศา พร้อมสถิติและแนวโน้ม เหมาะสำหรับการติดตามความคืบหน้า
                </p>
                <button
                    onClick={() => handleCompletionExport('xlsx')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            กำลังส่งออก...
                        </>
                    ) : (
                        <>
                            <FileSpreadsheet className="h-4 w-4" />
                            ส่งออกข้อมูลความครบถ้วน (Excel)
                        </>
                    )}
                </button>
            </div>

            {/* Raw Data Export Section */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <Database className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-900">ส่งออกข้อมูลดิบ (Raw Data)</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    ส่งออกข้อมูลรายละเอียดในระดับคำถาม พร้อมคะแนนจากแต่ละองศาการประเมิน
                </p>
                
                <button
                    onClick={() => handleRawDataExport('xlsx')}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Database className="h-4 w-4" />
                    ส่งออกข้อมูลดิบ
                    {isExporting && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
                
                <div className="mt-3 text-xs text-orange-700 bg-orange-100 rounded p-2">
                    <strong>ข้อมูลที่จะได้:</strong>
                    <ul className="mt-1 space-y-1">
                        <li>• รายละเอียดคำถามแต่ละข้อ พร้อมคะแนนจากแต่ละองศา</li>
                        <li>• ข้อมูลผู้ประเมินและผู้ถูกประเมินในแต่ละคำตอบ</li>
                        <li>• สรุปคะแนนตามคำถามและตามบุคคล</li>
                        <li>• เหมาะสำหรับการวิเคราะห์เชิงลึกและตรวจสอบข้อมูล</li>
                    </ul>
                </div>
            </div>

            {/* Export Info */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">ข้อมูลในรายงาน</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• ข้อมูลการประเมิน 360 องศา</li>
                    <li>• คะแนนตามมุมมอง (Self, Top, Bottom, Left, Right)</li>
                    <li>• คะแนนถ่วงน้ำหนักและระดับผลงาน</li>
                    <li>• สถิติและการวิเคราะห์เปรียบเทียบ</li>
                    <li>• กราฟและแผนภูมิประกอบ</li>
                </ul>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">ปีงบประมาณ:</span>
                        <span className="font-medium">{parseInt(fiscalYear) + 543}</span>
                    </div>
                    {filters.division && (
                        <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">สายงาน:</span>
                            <span className="font-medium">ที่เลือก</span>
                        </div>
                    )}
                    {filters.grade && (
                        <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">ระดับ:</span>
                            <span className="font-medium">C{filters.grade}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* NEW: PDF Export Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <File className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-gray-900">📄 ส่งออกรายงาน PDF (ข้อความเท่านั้น)</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    ส่งออกรายงานในรูปแบบ PDF ที่มีเฉพาะข้อความ ไม่มีการแปะรูปภาพ เหมาะสำหรับการพิมพ์และการแชร์เอกสาร
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                        onClick={() => handlePdfExport('all')}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <File className="h-4 w-4" />
                        PDF ทั้งหมด
                    </button>
                    <button
                        onClick={() => handlePdfExport('5-8')}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <File className="h-4 w-4" />
                        PDF พนักงาน (C5-C8)
                    </button>
                    <button
                        onClick={() => handlePdfExport('9-12')}
                        disabled={isExporting}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <File className="h-4 w-4" />
                        PDF ผู้บริหาร (C9-C12)
                    </button>
                </div>
                
                <div className="mt-3 text-xs text-red-700 bg-red-100 rounded p-2">
                    <strong>คุณสมบัติ PDF:</strong>
                    <ul className="mt-1 space-y-1">
                        <li>• ข้อความเท่านั้น ไม่มีการแปะรูปภาพ</li>
                        <li>• ไม่มีการแบ่งหน้าตามส่วน เนื้อหาต่อเนื่อง</li>
                        <li>• รูปแบบที่อ่านง่ายและเหมาะสำหรับการพิมพ์</li>
                        <li>• ไฟล์ขนาดเล็ก แชร์ง่าย</li>
                    </ul>
                </div>
            </div>

            {/* Format Options */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>รูปแบบไฟล์:</span>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Excel (.xlsx)
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            PDF (.pdf) ✨ ใหม่!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportExport;