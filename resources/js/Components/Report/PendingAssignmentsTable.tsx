import React, { useState, useMemo } from 'react';
import { 
    Clock, 
    User, 
    AlertTriangle, 
    Search, 
    Calendar,
    Building,
    Award,
    ArrowRight,
    Filter,
    Download,
    Send
} from 'lucide-react';

interface PendingAssignmentsTableProps {
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

const PendingAssignmentsTable: React.FC<PendingAssignmentsTableProps> = ({
    pendingAssignments
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByDays, setFilterByDays] = useState('all');
    const [filterByAngle, setFilterByAngle] = useState('all');
    const [sortBy, setSortBy] = useState('days_pending');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Get unique angles for filter
    const uniqueAngles = useMemo(() => {
        const angles = [...new Set(pendingAssignments.map(assignment => assignment.angle))];
        return angles.sort();
    }, [pendingAssignments]);

    // Get priority level based on days pending
    const getPriorityLevel = (days: number) => {
        if (days > 14) return 'urgent';
        if (days > 7) return 'high';
        if (days > 3) return 'medium';
        return 'normal';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'เร่งด่วนมาก';
            case 'high': return 'เร่งด่วน';
            case 'medium': return 'ปานกลาง';
            default: return 'ปกติ';
        }
    };

    const getAngleColor = (angle: string) => {
        switch (angle) {
            case 'top': return 'bg-blue-100 text-blue-800';
            case 'bottom': return 'bg-green-100 text-green-800';
            case 'left': return 'bg-yellow-100 text-yellow-800';
            case 'right': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter and sort assignments
    const filteredAndSortedAssignments = useMemo(() => {
        let filtered = pendingAssignments.filter(assignment => {
            const matchesSearch = 
                assignment.evaluator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.evaluatee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.evaluator.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
                assignment.evaluatee.division.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDays = filterByDays === 'all' || 
                (filterByDays === 'urgent' && assignment.days_pending > 14) ||
                (filterByDays === 'high' && assignment.days_pending > 7 && assignment.days_pending <= 14) ||
                (filterByDays === 'medium' && assignment.days_pending > 3 && assignment.days_pending <= 7) ||
                (filterByDays === 'normal' && assignment.days_pending <= 3);

            const matchesAngle = filterByAngle === 'all' || assignment.angle === filterByAngle;

            return matchesSearch && matchesDays && matchesAngle;
        });

        // Sort assignments
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case 'days_pending':
                    aValue = a.days_pending;
                    bValue = b.days_pending;
                    break;
                case 'evaluator':
                    aValue = a.evaluator.name;
                    bValue = b.evaluator.name;
                    break;
                case 'evaluatee':
                    aValue = a.evaluatee.name;
                    bValue = b.evaluatee.name;
                    break;
                case 'angle':
                    aValue = a.angle;
                    bValue = b.angle;
                    break;
                case 'created_at':
                    aValue = new Date(a.created_at);
                    bValue = new Date(b.created_at);
                    break;
                default:
                    aValue = a.days_pending;
                    bValue = b.days_pending;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });

        return filtered;
    }, [pendingAssignments, searchTerm, filterByDays, filterByAngle, sortBy, sortOrder]);

    // Statistics
    const stats = useMemo(() => {
        const urgent = pendingAssignments.filter(a => a.days_pending > 14).length;
        const high = pendingAssignments.filter(a => a.days_pending > 7 && a.days_pending <= 14).length;
        const medium = pendingAssignments.filter(a => a.days_pending > 3 && a.days_pending <= 7).length;
        const normal = pendingAssignments.filter(a => a.days_pending <= 3).length;

        return { urgent, high, medium, normal };
    }, [pendingAssignments]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const exportToCSV = () => {
        const headers = ['ผู้ประเมิน', 'หน่วยงานผู้ประเมิน', 'ผู้ถูกประเมิน', 'หน่วยงานผู้ถูกประเมิน', 'ตำแหน่ง', 'ระดับ', 'องศา', 'วันที่มอบหมาย', 'วันที่ค้าง'];
        const csvContent = [
            headers.join(','),
            ...filteredAndSortedAssignments.map(assignment => [
                assignment.evaluator.name,
                assignment.evaluator.division,
                assignment.evaluatee.name,
                assignment.evaluatee.division,
                assignment.evaluatee.position,
                assignment.evaluatee.grade,
                assignment.angle_thai,
                new Date(assignment.created_at).toLocaleDateString('th-TH'),
                assignment.days_pending
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pending_assignments_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">เร่งด่วนมาก</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                    <div className="text-xs text-red-600">มากกว่า 14 วัน</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">เร่งด่วน</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
                    <div className="text-xs text-orange-600">8-14 วัน</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">ปานกลาง</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                    <div className="text-xs text-yellow-600">4-7 วัน</div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">ปกติ</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-600">{stats.normal}</div>
                    <div className="text-xs text-gray-600">1-3 วัน</div>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        การมอบหมายที่ค้างอยู่ ({filteredAndSortedAssignments.length} รายการ)
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            ส่งออก CSV
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อหรือหน่วยงาน..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={filterByDays}
                        onChange={(e) => setFilterByDays(e.target.value)}
                    >
                        <option value="all">ทุกระดับความเร่งด่วน</option>
                        <option value="urgent">เร่งด่วนมาก (>14 วัน)</option>
                        <option value="high">เร่งด่วน (8-14 วัน)</option>
                        <option value="medium">ปานกลาง (4-7 วัน)</option>
                        <option value="normal">ปกติ (1-3 วัน)</option>
                    </select>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={filterByAngle}
                        onChange={(e) => setFilterByAngle(e.target.value)}
                    >
                        <option value="all">ทุกองศา</option>
                        {uniqueAngles.map(angle => (
                            <option key={angle} value={angle}>
                                {angle === 'top' ? 'บน' : 
                                 angle === 'bottom' ? 'ล่าง' : 
                                 angle === 'left' ? 'ซ้าย' : 
                                 angle === 'right' ? 'ขวา' : angle}
                            </option>
                        ))}
                    </select>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="days_pending">เรียงตามวันที่ค้าง</option>
                        <option value="evaluator">เรียงตามผู้ประเมิน</option>
                        <option value="evaluatee">เรียงตามผู้ถูกประเมิน</option>
                        <option value="angle">เรียงตามองศา</option>
                        <option value="created_at">เรียงตามวันที่มอบหมาย</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">ความเร่งด่วน</th>
                                <th 
                                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleSort('evaluator')}
                                >
                                    ผู้ประเมิน
                                </th>
                                <th 
                                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleSort('evaluatee')}
                                >
                                    ผู้ถูกประเมิน
                                </th>
                                <th 
                                    className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleSort('angle')}
                                >
                                    องศา
                                </th>
                                <th 
                                    className="text-center py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                                    onClick={() => handleSort('days_pending')}
                                >
                                    วันที่ค้าง
                                </th>
                                <th className="text-center py-3 px-4 font-medium text-gray-700">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredAndSortedAssignments.map((assignment) => {
                                const priority = getPriorityLevel(assignment.days_pending);
                                return (
                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(priority)}`}>
                                                {getPriorityText(priority)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {assignment.evaluator.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Building className="h-3 w-3" />
                                                        {assignment.evaluator.division}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Award className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {assignment.evaluatee.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Building className="h-3 w-3" />
                                                        {assignment.evaluatee.division} • ระดับ {assignment.evaluatee.grade}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {assignment.evaluatee.position}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAngleColor(assignment.angle)}`}>
                                                {assignment.angle_thai}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-lg font-bold text-gray-900">
                                                    {assignment.days_pending}
                                                </span>
                                                <span className="text-xs text-gray-500">วัน</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                                                    title="ส่งการแจ้งเตือน"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </button>
                                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {filteredAndSortedAssignments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>ไม่พบการมอบหมายที่ค้างอยู่ตามเงื่อนไขที่กำหนด</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingAssignmentsTable;