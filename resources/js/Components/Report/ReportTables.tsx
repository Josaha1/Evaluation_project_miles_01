import React, { useState, useMemo } from "react";
import { Eye, Search, Filter, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";

interface WeightedSummaryItem {
    id: number;
    name: string;
    position: string;
    grade: number;
    division: string;
    user_type: string;
    self: number;
    top: number;
    bottom?: number;
    left: number;
    right?: number;
    average: number;
    rating: number;
    rating_text: string;
    completion_rate: number;
}

interface ReportTablesProps {
    weightedSummary: WeightedSummaryItem[];
    onViewDetails?: (userId: number) => void;
}

type SortField = 'name' | 'grade' | 'division' | 'average' | 'completion_rate';
type SortDirection = 'asc' | 'desc';

const ReportTables: React.FC<ReportTablesProps> = ({ weightedSummary, onViewDetails }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGrade, setFilterGrade] = useState<string>("");
    const [filterDivision, setFilterDivision] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>('grade');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Get unique values for filters
    const uniqueGrades = useMemo(() => {
        return Array.from(new Set(weightedSummary.map(item => item.grade))).sort();
    }, [weightedSummary]);

    const uniqueDivisions = useMemo(() => {
        return Array.from(new Set(weightedSummary.map(item => item.division))).sort();
    }, [weightedSummary]);

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        let filtered = weightedSummary.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.position.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGrade = !filterGrade || item.grade.toString() === filterGrade;
            const matchesDivision = !filterDivision || item.division === filterDivision;
            
            return matchesSearch && matchesGrade && matchesDivision;
        });

        // Sort data
        filtered.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = (bValue as string).toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filtered;
    }, [weightedSummary, searchTerm, filterGrade, filterDivision, sortField, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const paginatedData = filteredAndSortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
        }
        return sortDirection === 'asc' 
            ? <ChevronUp className="h-4 w-4 text-blue-600" />
            : <ChevronDown className="h-4 w-4 text-blue-600" />;
    };

    const getPerformanceColor = (rating: number) => {
        const colors = {
            5: 'bg-green-100 text-green-800 border-green-200',
            4: 'bg-blue-100 text-blue-800 border-blue-200',
            3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            2: 'bg-orange-100 text-orange-800 border-orange-200',
            1: 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[rating as keyof typeof colors] || colors[1];
    };

    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'text-green-600 font-semibold';
        if (score >= 4.0) return 'text-blue-600 font-semibold';
        if (score >= 3.0) return 'text-yellow-600 font-semibold';
        if (score >= 2.0) return 'text-orange-600 font-semibold';
        return 'text-red-600 font-semibold';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        รายละเอียดผลการประเมิน ({filteredAndSortedData.length} คน)
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อหรือตำแหน่ง..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Grade Filter */}
                        <select
                            value={filterGrade}
                            onChange={(e) => {
                                setFilterGrade(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">ทุกระดับ</option>
                            {uniqueGrades.map(grade => (
                                <option key={grade} value={grade}>C{grade}</option>
                            ))}
                        </select>

                        {/* Division Filter */}
                        <select
                            value={filterDivision}
                            onChange={(e) => {
                                setFilterDivision(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">ทุกสายงาน</option>
                            {uniqueDivisions.map(division => (
                                <option key={division} value={division}>{division}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('name')}
                                    className="flex items-center gap-1 hover:text-gray-700"
                                >
                                    ชื่อ-สกุล
                                    {getSortIcon('name')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ตำแหน่ง
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('grade')}
                                    className="flex items-center gap-1 hover:text-gray-700"
                                >
                                    ระดับ
                                    {getSortIcon('grade')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('division')}
                                    className="flex items-center gap-1 hover:text-gray-700"
                                >
                                    สายงาน
                                    {getSortIcon('division')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Self
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Top
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Left
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('average')}
                                    className="flex items-center gap-1 hover:text-gray-700 mx-auto"
                                >
                                    คะแนนรวม
                                    {getSortIcon('average')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ระดับผลงาน
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('completion_rate')}
                                    className="flex items-center gap-1 hover:text-gray-700 mx-auto"
                                >
                                    ความครบถ้วน
                                    {getSortIcon('completion_rate')}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                การดำเนินการ
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {item.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.position}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        C{item.grade}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{item.division}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm text-gray-900">{item.self.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm text-gray-900">{item.top.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm text-gray-900">{item.left.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`text-sm font-semibold ${getScoreColor(item.average)}`}>
                                        {item.average.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPerformanceColor(item.rating)}`}>
                                        {item.rating_text}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center">
                                        <span className="text-sm text-gray-900">{item.completion_rate.toFixed(1)}%</span>
                                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${item.completion_rate}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {onViewDetails && (
                                        <button
                                            onClick={() => onViewDetails(item.id)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            แสดง {((currentPage - 1) * itemsPerPage) + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} จาก {filteredAndSortedData.length} รายการ
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                ก่อนหน้า
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = Math.max(1, currentPage - 2) + i;
                                    if (page > totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 text-sm border rounded ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                ถัดไป
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportTables;