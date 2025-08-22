import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Building, Trophy, Download, Eye, Calendar, Clock, Target, TrendingUp, BarChart3, Award, CheckCircle, AlertCircle, Loader2, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { router } from '@inertiajs/react';

interface IndividualDetailedReportProps {
    userId: number;
    fiscalYear: number;
    isOpen: boolean;
    onClose: () => void;
}

interface UserDetailData {
    user: {
        id: number;
        name: string;
        position: string;
        division: string;
        grade: number;
        user_type: string;
    };
    scores: {
        self: number;
        top: number;
        bottom: number;
        left: number;
        right: number;
        average: number;
    };
    completion_data: {
        total_angles: number;
        completed_angles: number;
        completion_rate: number;
        total_answers: number;
        last_updated: string;
    };
    evaluators: Array<{
        id: number;
        name: string;
        angle: string;
        completed: boolean;
        score: number;
        division: string;
        completed_at: string;
    }>;
    aspect_scores: Array<{
        aspect: string;
        score: number;
        max_score: number;
        percentage: number;
    }>;
    comparison_data: {
        grade_average: number;
        division_average: number;
        overall_average: number;
        rank_in_grade: number;
        rank_in_division: number;
        total_in_grade: number;
        total_in_division: number;
    };
    evaluator_assignments: EvaluatorAssignments;
}

interface EvaluatorAssignments {
    assignments: EvaluatorAssignment[];
    summary: AssignmentSummary;
}

interface EvaluatorAssignment {
    assignment_id: number;
    evaluation_id: number;
    evaluation_title: string;
    evaluatee: {
        id: number;
        emid: string;
        name: string;
        position: string;
        division: string;
        grade: number;
    };
    angle: string;
    angle_text: string;
    progress: {
        answered_questions: number;
        total_questions: number;
        completion_percentage: number;
        is_completed: boolean;
        last_answered: string | null;
        completed_at: string | null;
    };
    status: string;
    priority: string;
}

interface AssignmentSummary {
    total_assignments: number;
    completed_assignments: number;
    in_progress_assignments: number;
    not_started_assignments: number;
    overall_completion_percentage: number;
    by_angle: Array<{
        angle: string;
        angle_text: string;
        count: number;
        completed: number;
        completion_percentage: number;
    }>;
    by_evaluation: Array<{
        evaluation_id: number;
        evaluation_title: string;
        count: number;
        completed: number;
        completion_percentage: number;
    }>;
}

const IndividualDetailedReport: React.FC<IndividualDetailedReportProps> = ({
    userId,
    fiscalYear,
    isOpen,
    onClose
}) => {
    const [data, setData] = useState<UserDetailData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'evaluators' | 'comparison' | 'assignments'>('overview');

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails();
        }
    }, [isOpen, userId, fiscalYear]);

    const fetchUserDetails = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (fiscalYear) {
                params.append('fiscal_year', fiscalYear.toString());
            }
            
            const url = route('admin.evaluation-report.user-details', { userId }) + (params.toString() ? '?' + params.toString() : '');
            console.log('Fetching user details from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('User details result:', result);
            
            // Validate response structure
            if (!result.user || !result.scores) {
                throw new Error('Invalid response structure');
            }
            
            setData(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
            setError(errorMessage);
            console.error('Error fetching user details:', err);
        } finally {
            setLoading(false);
        }
    };

    // Utility functions for data formatting and display
    const getAngleText = (angle: string) => {
        switch (angle) {
            case 'self': return 'ตนเอง';
            case 'top': return 'องศาบน';
            case 'bottom': return 'องศาล่าง';
            case 'left': return 'องศาซ้าย';
            case 'right': return 'องศาขวา';
            default: return angle;
        }
    };

    const getAngleColor = (angle: string) => {
        switch (angle) {
            case 'self': return 'bg-gray-500';
            case 'top': return 'bg-blue-500';
            case 'bottom': return 'bg-green-500';
            case 'left': return 'bg-yellow-500';
            case 'right': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'text-green-600';
        if (score >= 4.0) return 'text-blue-600';
        if (score >= 3.5) return 'text-yellow-600';
        if (score >= 3.0) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreText = (score: number) => {
        if (score >= 4.5) return 'ดีเยี่ยม';
        if (score >= 4.0) return 'ดีมาก';
        if (score >= 3.5) return 'ดี';
        if (score >= 3.0) return 'พอใช้';
        return 'ต้องปรับปรุง';
    };

    const getComparisonIcon = (value: number, comparison: number) => {
        if (value > comparison) return <ArrowUp className="h-4 w-4 text-green-600" />;
        if (value < comparison) return <ArrowDown className="h-4 w-4 text-red-600" />;
        return <Minus className="h-4 w-4 text-gray-600" />;
    };

    const formatScore = (score: number) => {
        return score ? score.toFixed(2) : '0.00';
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    // Calculate derived data
    const derivedData = useMemo(() => {
        if (!data) return null;

        const completionStatus = data.completion_data.completion_rate >= 100 ? 'completed' : 
                                data.completion_data.completion_rate >= 75 ? 'nearly_complete' : 
                                data.completion_data.completion_rate > 0 ? 'in_progress' : 'not_started';

        const performanceLevel = data.scores.average >= 4.5 ? 'excellent' :
                                data.scores.average >= 4.0 ? 'very_good' :
                                data.scores.average >= 3.5 ? 'good' :
                                data.scores.average >= 3.0 ? 'fair' : 'needs_improvement';

        const rankingText = {
            grade: `${data.comparison_data.rank_in_grade}/${data.comparison_data.total_in_grade}`,
            division: `${data.comparison_data.rank_in_division}/${data.comparison_data.total_in_division}`
        };

        return {
            completionStatus,
            performanceLevel,
            rankingText
        };
    }, [data]);

    const exportIndividualReport = async () => {
        if (!data) return;

        try {
            const formData = new FormData();
            formData.append('user_id', userId.toString());
            formData.append('fiscal_year', fiscalYear.toString());
            formData.append('_token', document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '');

            const response = await fetch('/admin/reports/evaluation/export/individual-detailed', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `รายงานประเมินรายบุคคล_${data.user.name}_${fiscalYear}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full h-full max-h-[95vh] flex flex-col focus:outline-none" tabIndex={-1}>
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-300" />
                        </div>
                        <div>
                            <h2 id="modal-title" className="text-xl font-semibold">
                                รายงานการประเมิน 360 องศา - รายบุคคล
                            </h2>
                            <p className="text-blue-100 text-sm">
                                ปีงบประมาณ {fiscalYear}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {data && (
                            <button
                                onClick={exportIndividualReport}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                            >
                                <Download className="h-4 w-4 text-gray-300" />
                                ส่งออกรายงาน
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500 hover:bg-opacity-90 rounded-lg transition-colors"
                            aria-label="ปิดหน้าต่าง"
                            title="ปิดหน้าต่าง"
                        >
                            <X className="h-5 w-5 text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation - Fixed */}
                {data && (
                    <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
                        <div className="flex space-x-6 px-6 overflow-x-auto">
                            {[
                                { id: 'overview', label: 'ภาพรวม', icon: Trophy },
                                { id: 'scores', label: 'คะแนนรายละเอียด', icon: BarChart3 },
                                { id: 'evaluators', label: 'ผู้ประเมิน', icon: User },
                                { id: 'assignments', label: 'ประเมินผู้อื่น', icon: Target },
                                { id: 'comparison', label: 'เปรียบเทียบ', icon: TrendingUp }
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                        aria-controls={`tab-panel-${tab.id}`}
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50" role="main" aria-live="polite">
                    <div className="min-h-full">{/* This ensures proper scroll behavior */}
                        {loading && (
                            <div className="flex items-center justify-center py-20" role="status" aria-label="กำลังโหลดข้อมูล">
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" aria-hidden="true" />
                                    <p className="text-gray-600 text-lg">กำลังโหลดข้อมูลรายงาน...</p>
                                    <p className="text-gray-400 text-sm mt-2">กรุณารอสักครู่</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center justify-center py-20" role="alert" aria-live="assertive">
                                <div className="text-center max-w-md">
                                    <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
                                    <h3 className="text-xl font-semibold text-red-900 mb-2">เกิดข้อผิดพลาด</h3>
                                    <p className="text-red-600 mb-6">{error}</p>
                                    <button
                                        onClick={fetchUserDetails}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        aria-label="ลองโหลดข้อมูลใหม่"
                                    >
                                        ลองใหม่
                                    </button>
                                </div>
                            </div>
                        )}

                        {data && (
                            <div className="p-6">
                                {/* User Info Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                                            <User className="h-8 w-8 text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                                {data.user.name}
                                            </h3>
                                            <p className="text-gray-600 flex items-center gap-1 mb-2">
                                                <Building className="h-4 w-4 text-gray-600" />
                                                {data.user.position} • {data.user.division}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    ระดับ C{data.user.grade}
                                                </span>
                                                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                    {data.user.user_type === 'internal' ? 'พนักงานภายใน' : 'พนักงานภายนอก'}
                                                </span>
                                                <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                    {formatPercentage(data.completion_data.completion_rate)} สมบูรณ์
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-blue-600 mb-1">
                                                {formatScore(data.scores.average)}
                                            </div>
                                            <div className={`text-sm font-medium ${getScoreColor(data.scores.average)} mb-1`}>
                                                {getScoreText(data.scores.average)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {data.completion_data.completion_rate}% เสร็จสิ้น
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6" role="tabpanel" id="tab-panel-overview" aria-labelledby="tab-overview">
                                        {/* Score Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <CheckCircle className="h-8 w-8 text-gray-600" />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">ความคืบหน้า</h4>
                                                        <p className="text-sm text-gray-500">การประเมิน</p>
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold text-green-600">
                                                    {data.completion_data.completion_rate}%
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {data.completion_data.completed_angles}/{data.completion_data.total_angles} คน
                                                </div>
                                            </div>

                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Award className="h-8 w-8 text-gray-600" />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">คะแนนเฉลี่ย</h4>
                                                        <p className="text-sm text-gray-500">รวมทุกมุมมอง</p>
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {data.scores.average.toFixed(2)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    จาก 5.00 คะแนน
                                                </div>
                                            </div>

                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <Target className="h-8 w-8 text-gray-600" />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">คำตอบทั้งหมด</h4>
                                                        <p className="text-sm text-gray-500">จำนวนข้อมูล</p>
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {data.completion_data.total_answers}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    คำตอบ
                                                </div>
                                            </div>
                                        </div>

                                        {/* Angle Scores */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <h4 className="font-semibold text-gray-900 mb-4">คะแนนตามมุมมอง</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(data.scores).filter(([key]) => key !== 'average').map(([angle, score]) => (
                                                    <div key={angle} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className={`w-4 h-4 rounded-full ${getAngleColor(angle)}`} />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">
                                                                {getAngleText(angle)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {score ? score.toFixed(2) : 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'scores' && (
                                    <div className="space-y-6" role="tabpanel" id="tab-panel-scores" aria-labelledby="tab-scores">
                                        {data.aspect_scores && data.aspect_scores.length > 0 && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">คะแนนรายด้าน</h4>
                                                <div className="space-y-4">
                                                    {data.aspect_scores.map((aspect, index) => (
                                                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-medium text-gray-900">{aspect.aspect}</h5>
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    {aspect.score.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                    style={{ width: `${aspect.percentage}%` }}
                                                                />
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {aspect.percentage.toFixed(1)}% จาก {aspect.max_score} คะแนน
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'evaluators' && (
                                    <div className="space-y-6" role="tabpanel" id="tab-panel-evaluators" aria-labelledby="tab-evaluators">
                                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                                            <h4 className="font-semibold text-gray-900 mb-4">ผู้ประเมิน</h4>
                                            <div className="space-y-3">
                                                {data.evaluators.map((evaluator) => (
                                                    <div key={evaluator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full ${getAngleColor(evaluator.angle)}`} />
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {evaluator.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {evaluator.division} • {getAngleText(evaluator.angle)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    {evaluator.score.toFixed(2)}
                                                                </span>
                                                                {evaluator.completed ? (
                                                                    <CheckCircle className="h-5 w-5 text-gray-500" />
                                                                ) : (
                                                                    <Clock className="h-5 w-5 text-gray-500" />
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {evaluator.completed_at ? 
                                                                    new Date(String(evaluator.completed_at)).toLocaleDateString('th-TH') : 
                                                                    'รออนุมัติ'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'comparison' && (
                                    <div className="space-y-6" role="tabpanel" id="tab-panel-comparison" aria-labelledby="tab-comparison">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">การเปรียบเทียบคะแนน</h4>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                        <span className="text-gray-700">คะแนนของฉน</span>
                                                        <span className="font-bold text-blue-600">
                                                            {data.scores.average.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-700">เฉลี่ยของระดับ</span>
                                                        <span className="font-bold text-gray-600">
                                                            {data.comparison_data.grade_average.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-700">เฉลี่ยของหน่วยงาน</span>
                                                        <span className="font-bold text-gray-600">
                                                            {data.comparison_data.division_average.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <span className="text-gray-700">เฉลี่ยทั้งหมด</span>
                                                        <span className="font-bold text-gray-600">
                                                            {data.comparison_data.overall_average.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">อันดับ</h4>
                                                <div className="space-y-4">
                                                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                                        <div className="text-2xl font-bold text-yellow-600">
                                                            {data.comparison_data.rank_in_grade}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            อันดับที่ในระดับ (จาก {data.comparison_data.total_in_grade} คน)
                                                        </div>
                                                    </div>
                                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {data.comparison_data.rank_in_division}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            อันดับที่ในหน่วยงาน (จาก {data.comparison_data.total_in_division} คน)
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'assignments' && (
                                    <div className="space-y-6" role="tabpanel" id="tab-panel-assignments" aria-labelledby="tab-assignments">
                                        {data.evaluator_assignments && (
                                            <>
                                                {/* Assignment Summary */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                    <h4 className="font-semibold text-gray-900 mb-4">สรุปการประเมินผู้อื่น</h4>
                                                    
                                                    {/* Summary Cards */}
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-blue-600">
                                                                {data.evaluator_assignments.summary.total_assignments}
                                                            </div>
                                                            <div className="text-sm text-gray-600">รายการทั้งหมด</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-green-600">
                                                                {data.evaluator_assignments.summary.completed_assignments}
                                                            </div>
                                                            <div className="text-sm text-gray-600">เสร็จสิ้น</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-yellow-600">
                                                                {data.evaluator_assignments.summary.in_progress_assignments}
                                                            </div>
                                                            <div className="text-sm text-gray-600">กำลังดำเนินการ</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-gray-600">
                                                                {data.evaluator_assignments.summary.not_started_assignments}
                                                            </div>
                                                            <div className="text-sm text-gray-600">ยังไม่เริ่ม</div>
                                                        </div>
                                                    </div>

                                                    {/* Overall Progress */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-gray-900">ความคืบหน้ารวม</span>
                                                            <span className="text-lg font-bold text-blue-600">
                                                                {data.evaluator_assignments.summary.overall_completion_percentage}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                                            <div 
                                                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                                style={{ 
                                                                    width: `${data.evaluator_assignments.summary.overall_completion_percentage}%` 
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* By Angle Summary */}
                                                {data.evaluator_assignments.summary.by_angle.length > 0 && (
                                                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                        <h4 className="font-semibold text-gray-900 mb-4">สรุปตามมุมมอง</h4>
                                                        <div className="space-y-3">
                                                            {data.evaluator_assignments.summary.by_angle.map((angleData, index) => (
                                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-4 h-4 rounded-full ${getAngleColor(angleData.angle)}`} />
                                                                        <div>
                                                                            <div className="font-medium text-gray-900">
                                                                                {angleData.angle_text}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                {angleData.completed}/{angleData.count} รายการ
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-lg font-bold text-blue-600">
                                                                            {angleData.completion_percentage}%
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Detailed Assignment List */}
                                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                    <h4 className="font-semibold text-gray-900 mb-4">รายการประเมินผู้อื่น</h4>
                                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                                        {data.evaluator_assignments.assignments.map((assignment) => (
                                                            <div 
                                                                key={assignment.assignment_id} 
                                                                className={`p-4 border rounded-lg transition-colors ${
                                                                    assignment.progress.is_completed 
                                                                        ? 'bg-green-50 border-green-200' 
                                                                        : assignment.progress.completion_percentage > 0
                                                                        ? 'bg-yellow-50 border-yellow-200'
                                                                        : 'bg-gray-50 border-gray-200'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className={`w-3 h-3 rounded-full ${getAngleColor(assignment.angle)}`} />
                                                                            <h5 className="font-medium text-gray-900">
                                                                                {assignment.evaluatee.name}
                                                                            </h5>
                                                                            {assignment.progress.is_completed && (
                                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 mb-1">
                                                                            {assignment.evaluatee.position} • {assignment.evaluatee.division}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {assignment.angle_text} • ระดับ C{assignment.evaluatee.grade}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right ml-4">
                                                                        <div className="text-lg font-bold text-blue-600">
                                                                            {assignment.progress.completion_percentage}%
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {assignment.progress.answered_questions}/{assignment.progress.total_questions} ข้อ
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Progress Bar */}
                                                                <div className="mb-3">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                                assignment.progress.is_completed 
                                                                                    ? 'bg-green-500' 
                                                                                    : assignment.progress.completion_percentage > 0
                                                                                    ? 'bg-yellow-500'
                                                                                    : 'bg-gray-400'
                                                                            }`}
                                                                            style={{ 
                                                                                width: `${assignment.progress.completion_percentage}%` 
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Status and Last Activity */}
                                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                            assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                            assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                            assignment.status === 'nearly_complete' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                            {assignment.status === 'completed' ? 'เสร็จสิ้น' :
                                                                             assignment.status === 'in_progress' ? 'กำลังดำเนินการ' :
                                                                             assignment.status === 'nearly_complete' ? 'ใกล้เสร็จ' :
                                                                             'ยังไม่เริ่ม'}
                                                                        </span>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                            assignment.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                                            assignment.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-blue-100 text-blue-800'
                                                                        }`}>
                                                                            {assignment.priority === 'high' ? 'สำคัญมาก' :
                                                                             assignment.priority === 'medium' ? 'สำคัญ' :
                                                                             'สำคัญน้อย'}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        {assignment.progress.last_answered && (
                                                                            <span>
                                                                                อัปเดตล่าสุด: {new Date(assignment.progress.last_answered).toLocaleDateString('th-TH')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        {data.evaluator_assignments.assignments.length === 0 && (
                                                            <div className="text-center py-8 text-gray-500">
                                                                <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                                                <p>ไม่มีรายการประเมินผู้อื่น</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndividualDetailedReport;