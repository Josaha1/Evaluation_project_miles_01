import React, { useState, useMemo } from 'react';
import { 
    Users, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    Search, 
    Filter,
    TrendingUp,
    Calendar,
    User,
    Building,
    ArrowRight,
    Award,
    RefreshCw
} from 'lucide-react';

interface AssignmentTrackingProps {
    assignmentTracking: Array<{
        evaluatee: {
            id: number;
            name: string;
            grade: number;
            division: string;
            position: string;
        };
        required_angles: string[];
        angle_progress: Record<string, {
            total: number;
            completed: number;
            pending: number;
            completion_rate: number;
            evaluators: Array<{
                id: number;
                name: string;
                completed: boolean;
                assignment_id: number;
            }>;
        }>;
        overall_progress: {
            total_assignments: number;
            completed_assignments: number;
            pending_assignments: number;
            completion_rate: number;
        };
        status: string;
        last_updated: string;
    }>;
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
    pendingAssignments: Array<{
        id: number;
        evaluator: {
            id: number;
            name: string;
            division: string;
        };
        evaluatee: {
            id: number;
            name: string;
            grade: number;
            division: string;
            position: string;
        };
        evaluation: {
            id: number;
            title: string;
        };
        angle: string;
        angle_thai: string;
        created_at: string;
        days_pending: number;
    }>;
}

const AssignmentTrackingDashboard: React.FC<AssignmentTrackingProps> = ({
    assignmentTracking,
    evaluationProgress,
    pendingAssignments,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [gradeFilter, setGradeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('completion_rate');

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'nearly_complete': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'started': return 'bg-orange-100 text-orange-800';
            case 'not_started': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return 'เสร็จสิ้น';
            case 'nearly_complete': return 'ใกล้เสร็จ';
            case 'in_progress': return 'กำลังดำเนินการ';
            case 'started': return 'เริ่มแล้ว';
            case 'not_started': return 'ยังไม่เริ่ม';
            default: return 'ไม่ทราบสถานะ';
        }
    };

    const getAngleColor = (angle: string) => {
        switch (angle) {
            case 'top': return 'bg-blue-500';
            case 'bottom': return 'bg-green-500';
            case 'left': return 'bg-yellow-500';
            case 'right': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const getAngleText = (angle: string) => {
        switch (angle) {
            case 'top': return 'บน';
            case 'bottom': return 'ล่าง';
            case 'left': return 'ซ้าย';
            case 'right': return 'ขวา';
            default: return angle;
        }
    };

    // Filter and sort tracking data
    const filteredTrackingData = useMemo(() => {
        let filtered = assignmentTracking.filter(item => {
            const matchesSearch = item.evaluatee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.evaluatee.division.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesGrade = gradeFilter === 'all' || item.evaluatee.grade.toString() === gradeFilter;
            return matchesSearch && matchesStatus && matchesGrade;
        });

        // Sort data
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'completion_rate':
                    return a.overall_progress.completion_rate - b.overall_progress.completion_rate;
                case 'name':
                    return a.evaluatee.name.localeCompare(b.evaluatee.name);
                case 'grade':
                    return a.evaluatee.grade - b.evaluatee.grade;
                case 'division':
                    return a.evaluatee.division.localeCompare(b.evaluatee.division);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [assignmentTracking, searchTerm, statusFilter, gradeFilter, sortBy]);

    // High priority pending assignments (over 7 days)
    const urgentPendingAssignments = useMemo(() => {
        return pendingAssignments.filter(assignment => assignment.days_pending > 7);
    }, [pendingAssignments]);

    return (
        <div className="space-y-6">
            {/* Progress Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600">การมอบหมายทั้งหมด</p>
                            <p className="text-2xl font-bold text-blue-900">
                                {evaluationProgress.assignment_level.total}
                            </p>
                        </div>
                        <Users className="h-10 w-10 text-blue-600" />
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-green-700">
                            {evaluationProgress.assignment_level.completed} เสร็จสิ้น
                        </span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">อัตราการเสร็จสิ้น</p>
                            <p className="text-2xl font-bold text-green-900">
                                {evaluationProgress.assignment_level.completion_rate}%
                            </p>
                        </div>
                        <TrendingUp className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${evaluationProgress.assignment_level.completion_rate}%` }}
                        />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-600">ค้างดำเนินการ</p>
                            <p className="text-2xl font-bold text-orange-900">
                                {evaluationProgress.assignment_level.pending}
                            </p>
                        </div>
                        <Clock className="h-10 w-10 text-orange-600" />
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-red-700">
                            {urgentPendingAssignments.length} เร่งด่วน
                        </span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600">ผู้ถูกประเมิน</p>
                            <p className="text-2xl font-bold text-purple-900">
                                {evaluationProgress.evaluatee_level.total}
                            </p>
                        </div>
                        <Award className="h-10 w-10 text-purple-600" />
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-green-700">
                            {evaluationProgress.evaluatee_level.completed} คนเสร็จสิ้น
                        </span>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        รายการติดตามการประเมิน
                    </h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อหรือหน่วยงาน..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">สถานะทั้งหมด</option>
                            <option value="not_started">ยังไม่เริ่ม</option>
                            <option value="started">เริ่มแล้ว</option>
                            <option value="in_progress">กำลังดำเนินการ</option>
                            <option value="nearly_complete">ใกล้เสร็จ</option>
                            <option value="completed">เสร็จสิ้น</option>
                        </select>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                        >
                            <option value="all">ระดับทั้งหมด</option>
                            {[...new Set(assignmentTracking.map(item => item.evaluatee.grade))].sort().map(grade => (
                                <option key={grade} value={grade.toString()}>ระดับ {grade}</option>
                            ))}
                        </select>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="completion_rate">เรียงตามความคืบหน้า</option>
                            <option value="name">เรียงตามชื่อ</option>
                            <option value="grade">เรียงตามระดับ</option>
                            <option value="division">เรียงตามหน่วยงาน</option>
                        </select>
                    </div>
                </div>

                {/* Tracking Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">ผู้ถูกประเมิน</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">ความคืบหน้าตามองศา</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-700">ความคืบหน้ารวม</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-700">สถานะ</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-700">อัปเดตล่าสุด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTrackingData.map((item) => (
                                <tr key={item.evaluatee.id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {item.evaluatee.name}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {item.evaluatee.division} • ระดับ {item.evaluatee.grade}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {item.evaluatee.position}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-wrap gap-2">
                                            {item.required_angles.map(angle => (
                                                <div key={angle} className="flex items-center gap-1 text-xs">
                                                    <div className={`w-3 h-3 rounded-full ${getAngleColor(angle)}`} />
                                                    <span className="font-medium">{getAngleText(angle)}</span>
                                                    <span className="text-gray-500">
                                                        {item.angle_progress[angle]?.completed || 0}/
                                                        {item.angle_progress[angle]?.total || 0}
                                                    </span>
                                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                                        (item.angle_progress[angle]?.completion_rate || 0) === 100 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {item.angle_progress[angle]?.completion_rate || 0}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {item.overall_progress.completed_assignments}/
                                                    {item.overall_progress.total_assignments}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({item.overall_progress.completion_rate}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${item.overall_progress.completion_rate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                                            {getStatusText(item.status)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                            <Calendar className="h-3 w-3" />
                                            {item.last_updated ? new Date(item.last_updated).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {filteredTrackingData.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Urgent Pending Assignments */}
            {urgentPendingAssignments.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h3 className="text-lg font-semibold text-red-900">
                            การมอบหมายที่ค้างเกิน 7 วัน ({urgentPendingAssignments.length} รายการ)
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {urgentPendingAssignments.slice(0, 10).map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                        <User className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {assignment.evaluator.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            ประเมิน {assignment.evaluatee.name} • {assignment.angle_thai}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-red-700 font-medium">
                                        {assignment.days_pending} วัน
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-red-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentTrackingDashboard;