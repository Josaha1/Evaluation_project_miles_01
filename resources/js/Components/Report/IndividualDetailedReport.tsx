import React, { useState, useEffect } from 'react';
import { User, Award, TrendingUp, BarChart3, Eye, Download, X } from 'lucide-react';

interface AngleData {
    average: number;
    weight_percentage: number;
    count: number;
}

interface AspectData {
    aspect_id: number;
    aspect_name: string;
    angles: {
        top: AngleData;
        bottom: AngleData;
        self: AngleData;
        left: AngleData;
        right: AngleData;
    };
    overall_average: number;
    overall_weight: number;
}

interface AngleTotals {
    top: {
        final_average: number;
        final_weight: number;
        criteria_weight: number;
        actual_weight: number;
    };
    bottom: {
        final_average: number;
        final_weight: number;
        criteria_weight: number;
        actual_weight: number;
    };
    self: {
        final_average: number;
        final_weight: number;
        criteria_weight: number;
        actual_weight: number;
    };
    left: {
        final_average: number;
        final_weight: number;
        criteria_weight: number;
        actual_weight: number;
    };
    right: {
        final_average: number;
        final_weight: number;
        criteria_weight: number;
        actual_weight: number;
    };
}

interface EvaluationData {
    aspects: AspectData[];
    totals: {
        angle_totals: AngleTotals;
        final_weighted_score: number;
        weight_criteria: Record<string, number>;
    };
    weight_criteria: Record<string, number>;
    final_score: number;
}

interface UserData {
    id: number;
    name: string;
    grade: number;
    position: string;
    department: string;
    division?: string;
    faction?: string;
}

interface IndividualDetailedReportProps {
    userId: number;
    fiscalYear?: number;
    onClose?: () => void;
    isOpen?: boolean;
}

const IndividualDetailedReport: React.FC<IndividualDetailedReportProps> = ({ 
    userId, 
    fiscalYear,
    onClose,
    isOpen = false
}) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        user: UserData;
        fiscal_year: number;
        evaluation_data: EvaluationData;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchReportData();
        }
    }, [userId, fiscalYear, isOpen]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                user_id: userId.toString(),
                ...(fiscalYear && { fiscal_year: fiscalYear.toString() })
            });

            const response = await fetch(`/admin/reports/evaluation/api/individual-angle-report?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const getAngleLabel = (angle: string): string => {
        const labels: Record<string, string> = {
            'top': 'องศาบน',
            'bottom': 'องศาล่าง', 
            'self': 'ประเมินตนเอง',
            'left': 'องศาซ้าย',
            'right': 'องศาขวา'
        };
        return labels[angle] || angle;
    };

    const formatScore = (score: number): string => {
        return score > 0 ? score.toFixed(2) : '-';
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                user_id: userId.toString(),
                ...(fiscalYear && { fiscal_year: fiscalYear.toString() }),
                format: 'excel'
            });

            const response = await fetch(`/admin/reports/evaluation/export/individual-detailed?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `รายงานประเมินรายบุคคล_${data?.user.name}_${data?.fiscal_year}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('เกิดข้อผิดพลาดในการส่งออกไฟล์');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="text-red-500 mr-3">⚠️</div>
                                <div>
                                    <h3 className="text-red-800 font-medium">เกิดข้อผิดพลาด</h3>
                                    <p className="text-red-600">{error}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-red-500 hover:text-red-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <button
                            onClick={fetchReportData}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            ลองใหม่
                        </button>
                    </div>
                ) : !data ? (
                    <div className="p-6 text-center text-gray-500">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                        ไม่พบข้อมูลรายงาน
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Award className="h-8 w-8" />
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            ตาราง 4.66 ผลการประเมินผู้บริหารระดับ {data.user.grade}
                                        </h2>
                                        <p className="text-blue-100">
                                            {data.user.name} ปีงบประมาณ {data.fiscal_year}
                                        </p>
                                    </div>
                                </div>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="text-white hover:text-gray-200 text-2xl p-2 hover:bg-white/10 rounded"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-200">ตำแหน่ง:</span>
                                    <p className="font-medium">{data.user.position}</p>
                                </div>
                                <div>
                                    <span className="text-blue-200">หน่วยงาน:</span>
                                    <p className="font-medium">{data.user.department}</p>
                                </div>
                                <div>
                                    <span className="text-blue-200">ปีงบประมาณ:</span>
                                    <p className="font-medium">{data.fiscal_year}</p>
                                </div>
                                <div>
                                    <span className="text-blue-200">เกรด:</span>
                                    <p className="font-medium">C{data.user.grade}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Report Content */}
                        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300 text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                            <th rowSpan={2} className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900 dark:text-white min-w-[200px]">
                                                ประเด็นการประเมิน
                                            </th>
                                            {['top', 'bottom', 'self', 'left', 'right'].map(angle => (
                                                <th key={angle} colSpan={2} className="border border-gray-300 px-3 py-2 text-center">
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {getAngleLabel(angle)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                            {['top', 'bottom', 'self', 'left', 'right'].map(angle => (
                                                <React.Fragment key={angle}>
                                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                                                        เฉลี่ย
                                                    </th>
                                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                                                        น้ำหนัก
                                                    </th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.evaluation_data.aspects.map((aspect, index) => (
                                            <tr key={aspect.aspect_id} className={index % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-gray-50 dark:bg-gray-800'}>
                                                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                    {aspect.aspect_name}
                                                </td>
                                                {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                                    const angleData = aspect.angles[angle as keyof typeof aspect.angles];
                                                    return (
                                                        <React.Fragment key={angle}>
                                                            <td className="border border-gray-300 px-3 py-3 text-center">
                                                                <span className="font-medium">
                                                                    {formatScore(angleData.average)}
                                                                </span>
                                                            </td>
                                                            <td className="border border-gray-300 px-3 py-3 text-center">
                                                                <span className="text-blue-600 dark:text-blue-400">
                                                                    {formatScore(angleData.weight_percentage)}
                                                                </span>
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        
                                        {/* Overall Totals Row */}
                                        <tr className="bg-blue-50 dark:bg-blue-900/30 border-t-2 border-blue-200 font-bold">
                                            <td className="border border-gray-300 px-4 py-3 font-bold text-gray-900 dark:text-white">
                                                โดยรวม
                                            </td>
                                            {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                                const angleTotal = data.evaluation_data.totals.angle_totals[angle as keyof AngleTotals];
                                                return (
                                                    <React.Fragment key={angle}>
                                                        <td className="border border-gray-300 px-3 py-3 text-center">
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                {formatScore(angleTotal.final_average)}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 px-3 py-3 text-center">
                                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                                {formatScore(angleTotal.final_weight)}
                                                            </span>
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                        
                                        {/* Weight Criteria Row */}
                                        <tr className="bg-yellow-50 dark:bg-yellow-900/30">
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                เกณฑ์น้ำหนัก
                                            </td>
                                            {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                                const criteriaWeight = data.evaluation_data.totals.weight_criteria[angle];
                                                return (
                                                    <React.Fragment key={angle}>
                                                        <td colSpan={2} className="border border-gray-300 px-3 py-3 text-center font-medium text-yellow-700 dark:text-yellow-400">
                                                            {criteriaWeight}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                        
                                        {/* Actual Weight Row */}
                                        <tr className="bg-green-50 dark:bg-green-900/30">
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                น้ำหนักที่ได้
                                            </td>
                                            {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                                const angleTotal = data.evaluation_data.totals.angle_totals[angle as keyof AngleTotals];
                                                return (
                                                    <React.Fragment key={angle}>
                                                        <td colSpan={2} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 dark:text-green-400">
                                                            {formatScore(angleTotal.actual_weight)}
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                        
                                        {/* Final Total Row */}
                                        <tr className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30">
                                            <td className="border border-gray-300 px-4 py-3 font-bold text-gray-900 dark:text-white">
                                                รวม
                                            </td>
                                            <td colSpan={10} className="border border-gray-300 px-3 py-3 text-center">
                                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatScore(data.evaluation_data.final_score)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 flex justify-end space-x-3">
                                <button 
                                    onClick={handleExport}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    ส่งออก Excel
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IndividualDetailedReport;