import React, { useState } from 'react';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    Building, 
    Award,
    ChevronDown,
    ChevronUp,
    Target,
    Clock,
    CheckCircle2
} from 'lucide-react';

interface EvaluationProgressWidgetProps {
    evaluationProgress: {
        assignment_level: {
            total: number;
            completed: number;
            pending: number;
            completion_rate: number;
        };
        evaluatee_level: {
            total: number;
            completed: number;
            pending: number;
            completion_rate: number;
        };
        grade_breakdown: Array<{
            grade: number;
            total: number;
            completed: number;
            pending: number;
            completion_rate: number;
        }>;
        division_breakdown: Array<{
            division_id: number;
            division_name: string;
            total: number;
            completed: number;
            pending: number;
            completion_rate: number;
        }>;
    };
}

const EvaluationProgressWidget: React.FC<EvaluationProgressWidgetProps> = ({
    evaluationProgress
}) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const getProgressColor = (rate: number) => {
        if (rate >= 90) return 'bg-green-500';
        if (rate >= 70) return 'bg-blue-500';
        if (rate >= 50) return 'bg-yellow-500';
        if (rate >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getProgressTextColor = (rate: number) => {
        if (rate >= 90) return 'text-green-700';
        if (rate >= 70) return 'text-blue-700';
        if (rate >= 50) return 'text-yellow-700';
        if (rate >= 30) return 'text-orange-700';
        return 'text-red-700';
    };

    const getProgressBgColor = (rate: number) => {
        if (rate >= 90) return 'bg-green-50';
        if (rate >= 70) return 'bg-blue-50';
        if (rate >= 50) return 'bg-yellow-50';
        if (rate >= 30) return 'bg-orange-50';
        return 'bg-red-50';
    };

    return (
        <div className="space-y-6">
            {/* Overall Progress Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Level Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">ระดับการมอบหมาย</h3>
                            <p className="text-sm text-gray-500">ความคืบหน้าการประเมินแต่ละครั้ง</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">ความคืบหน้ารวม</span>
                            <span className="text-2xl font-bold text-blue-600">
                                {evaluationProgress.assignment_level.completion_rate}%
                            </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(evaluationProgress.assignment_level.completion_rate)}`}
                                style={{ width: `${evaluationProgress.assignment_level.completion_rate}%` }}
                            />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {evaluationProgress.assignment_level.total}
                                </div>
                                <div className="text-xs text-gray-500">รวมทั้งหมด</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {evaluationProgress.assignment_level.completed}
                                </div>
                                <div className="text-xs text-gray-500">เสร็จสิ้น</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {evaluationProgress.assignment_level.pending}
                                </div>
                                <div className="text-xs text-gray-500">ค้างอยู่</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evaluatee Level Progress */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">ระดับผู้ถูกประเมิน</h3>
                            <p className="text-sm text-gray-500">ความคืบหน้าของแต่ละบุคคล</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">ความคืบหน้ารวม</span>
                            <span className="text-2xl font-bold text-purple-600">
                                {evaluationProgress.evaluatee_level.completion_rate}%
                            </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(evaluationProgress.evaluatee_level.completion_rate)}`}
                                style={{ width: `${evaluationProgress.evaluatee_level.completion_rate}%` }}
                            />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {evaluationProgress.evaluatee_level.total}
                                </div>
                                <div className="text-xs text-gray-500">รวมทั้งหมด</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {evaluationProgress.evaluatee_level.completed}
                                </div>
                                <div className="text-xs text-gray-500">เสร็จสิ้น</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {evaluationProgress.evaluatee_level.pending}
                                </div>
                                <div className="text-xs text-gray-500">ค้างอยู่</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grade Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div 
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('grade')}
                >
                    <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            ความคืบหน้าตามระดับ ({evaluationProgress.grade_breakdown.length} ระดับ)
                        </h3>
                    </div>
                    {expandedSection === 'grade' ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </div>
                
                {expandedSection === 'grade' && (
                    <div className="px-6 pb-6">
                        <div className="space-y-4">
                            {evaluationProgress.grade_breakdown
                                .sort((a, b) => a.grade - b.grade)
                                .map((grade) => (
                                    <div key={grade.grade} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {grade.grade}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    ระดับ {grade.grade}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {grade.completed}/{grade.total} คน
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(grade.completion_rate)}`}
                                                    style={{ width: `${grade.completion_rate}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-medium ${getProgressTextColor(grade.completion_rate)}`}>
                                                {grade.completion_rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Division Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div 
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection('division')}
                >
                    <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            ความคืบหน้าตามหน่วยงาน ({evaluationProgress.division_breakdown.length} หน่วยงาน)
                        </h3>
                    </div>
                    {expandedSection === 'division' ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </div>
                
                {expandedSection === 'division' && (
                    <div className="px-6 pb-6">
                        <div className="space-y-4">
                            {evaluationProgress.division_breakdown
                                .sort((a, b) => b.completion_rate - a.completion_rate)
                                .map((division) => (
                                    <div key={division.division_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getProgressBgColor(division.completion_rate)}`}>
                                                <Building className={`h-4 w-4 ${getProgressTextColor(division.completion_rate)}`} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {division.division_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {division.completed}/{division.total} คน
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(division.completion_rate)}`}
                                                    style={{ width: `${division.completion_rate}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-medium ${getProgressTextColor(division.completion_rate)}`}>
                                                {division.completion_rate}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">สรุปผลการดำเนินงาน</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">ประสิทธิภาพรวม</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {Math.round((evaluationProgress.assignment_level.completion_rate + evaluationProgress.evaluatee_level.completion_rate) / 2)}%
                        </div>
                        <div className="text-xs text-gray-500">ค่าเฉลี่ยความคืบหน้า</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700">งานที่ค้างอยู่</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                            {evaluationProgress.assignment_level.pending + evaluationProgress.evaluatee_level.pending}
                        </div>
                        <div className="text-xs text-gray-500">รายการที่ต้องดำเนินการ</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">แนวโน้ม</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                            {evaluationProgress.assignment_level.completion_rate > 75 ? 'ดี' : 
                             evaluationProgress.assignment_level.completion_rate > 50 ? 'ปานกลาง' : 'ต้องปรับปรุง'}
                        </div>
                        <div className="text-xs text-gray-500">สถานะการดำเนินงาน</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationProgressWidget;