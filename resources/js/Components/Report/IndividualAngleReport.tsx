import React, { useState, useEffect } from 'react';
import { User, Award, TrendingUp, BarChart3, Eye, Download } from 'lucide-react';

interface AngleData {
    average: number;
    count: number;
    weight_percentage: number;
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
}

interface IndividualAngleReportProps {
    userId: number;
    fiscalYear?: number;
    onClose?: () => void;
}

const IndividualAngleReport: React.FC<IndividualAngleReportProps> = ({ 
    userId, 
    fiscalYear,
    onClose 
}) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        user: UserData;
        fiscal_year: number;
        evaluation_data: EvaluationData;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReportData();
    }, [userId, fiscalYear]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                    <div className="text-red-500 mr-3">⚠️</div>
                    <div>
                        <h3 className="text-red-800 font-medium">เกิดข้อผิดพลาด</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
                <button
                    onClick={fetchReportData}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    ลองใหม่
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center text-gray-500">
                ไม่พบข้อมูลรายงาน
            </div>
        );
    }

    const { user, evaluation_data } = data;

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Award className="h-8 w-8" />
                        <div>
                            <h2 className="text-xl font-bold">
                                ผลการประเมินผู้บริหารระดับ {user.grade}
                            </h2>
                            <p className="text-blue-100">
                                {user.name} ตามองศาการประเมิน
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl"
                        >
                            ×
                        </button>
                    )}
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-blue-200">ตำแหน่ง:</span>
                        <p className="font-medium">{user.position}</p>
                    </div>
                    <div>
                        <span className="text-blue-200">หน่วยงาน:</span>
                        <p className="font-medium">{user.department}</p>
                    </div>
                    <div>
                        <span className="text-blue-200">ปีงบประมาณ:</span>
                        <p className="font-medium">{data.fiscal_year}</p>
                    </div>
                </div>
            </div>

            {/* Main Report Table */}
            <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-900">
                                    ประเด็นการประเมิน
                                </th>
                                {['top', 'bottom', 'self', 'left', 'right'].map(angle => (
                                    <th key={angle} className="border border-gray-300 px-3 py-3 text-center">
                                        <div className="font-medium text-gray-900 mb-1">
                                            {getAngleLabel(angle)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                                            <span>เฉลี่ย</span>
                                            <span>น้ำหนัก</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {evaluation_data.aspects.map((aspect, index) => (
                                <tr key={aspect.aspect_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                                        {aspect.aspect_name}
                                    </td>
                                    {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                        const angleData = aspect.angles[angle as keyof typeof aspect.angles];
                                        return (
                                            <td key={angle} className="border border-gray-300 px-3 py-3">
                                                <div className="grid grid-cols-2 gap-1 text-center text-sm">
                                                    <span className="font-medium">
                                                        {formatScore(angleData.average)}
                                                    </span>
                                                    <span className="text-blue-600">
                                                        {formatScore(angleData.weight_percentage)}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            
                            {/* Totals Row */}
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                                <td className="border border-gray-300 px-4 py-3 font-bold text-gray-900">
                                    โดยรวม
                                </td>
                                {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                    const angleTotal = evaluation_data.totals.angle_totals[angle as keyof AngleTotals];
                                    return (
                                        <td key={angle} className="border border-gray-300 px-3 py-3">
                                            <div className="grid grid-cols-2 gap-1 text-center text-sm font-bold">
                                                <span className="text-gray-900">
                                                    {formatScore(angleTotal.final_average)}
                                                </span>
                                                <span className="text-blue-600">
                                                    {formatScore(angleTotal.final_weight)}
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                            
                            {/* Weight Criteria Row */}
                            <tr className="bg-yellow-50">
                                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                                    เกณฑ์น้ำหนัก
                                </td>
                                {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                    const criteriaWeight = evaluation_data.totals.weight_criteria[angle];
                                    return (
                                        <td key={angle} className="border border-gray-300 px-3 py-3 text-center font-medium text-yellow-700">
                                            {criteriaWeight}
                                        </td>
                                    );
                                })}
                            </tr>
                            
                            {/* Actual Weight Row */}
                            <tr className="bg-green-50">
                                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                                    น้ำหนักที่ได้
                                </td>
                                {['top', 'bottom', 'self', 'left', 'right'].map(angle => {
                                    const angleTotal = evaluation_data.totals.angle_totals[angle as keyof AngleTotals];
                                    return (
                                        <td key={angle} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700">
                                            {formatScore(angleTotal.actual_weight)}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Final Score */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                            <span className="text-lg font-medium text-gray-900">คะแนนรวม:</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {formatScore(evaluation_data.final_score)}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออก Excel
                    </button>
                    <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <Eye className="h-4 w-4 mr-2" />
                        ดูรายละเอียด
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IndividualAngleReport;