import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { getGradeLabel, getScoreColor } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportsTabProps {
    filteredResults: Array<{
        id: number;
        evaluateeName: string;
        evaluateeGrade: number;
        evaluateeDivision: string;
        evaluateePosition: string;
        scores: { self: number; top: number; bottom: number; left: number; right: number; average: number };
        completionStatus: { totalAngles: number; completedAngles: number; completionRate: number; lastActivity: string };
    }>;
    externalOrgMetrics: Array<{ org_id: number; org_name: string; total_responses: number; avg_score: number; evaluatee_count: number }>;
    onViewIndividual: (userId: number) => void;
}

type SortField =
    | 'evaluateeName'
    | 'evaluateeGrade'
    | 'evaluateeDivision'
    | 'self'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'average'
    | 'completionRate';

type SortDirection = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 20;

const COLUMNS: { label: string; field: SortField; center?: boolean }[] = [
    { label: 'ชื่อ-นามสกุล', field: 'evaluateeName' },
    { label: 'ระดับ', field: 'evaluateeGrade', center: true },
    { label: 'สายงาน', field: 'evaluateeDivision' },
    { label: 'ตนเอง', field: 'self', center: true },
    { label: 'บน', field: 'top', center: true },
    { label: 'ล่าง', field: 'bottom', center: true },
    { label: 'ซ้าย', field: 'left', center: true },
    { label: 'ขวา', field: 'right', center: true },
    { label: 'เฉลี่ย', field: 'average', center: true },
    { label: 'สถานะ', field: 'completionRate', center: true },
];

// ---------------------------------------------------------------------------
// Inline helpers
// ---------------------------------------------------------------------------

const ScoreCell = ({ score }: { score: number }) => {
    if (!score || score === 0) return <span className="text-gray-400">-</span>;
    const color =
        score >= 4.5
            ? 'text-emerald-600'
            : score >= 3.5
              ? 'text-blue-600'
              : score >= 2.5
                ? 'text-yellow-600'
                : 'text-red-600';
    return <span className={`font-semibold ${color}`}>{score.toFixed(2)}</span>;
};

const AverageCell = ({ score }: { score: number }) => {
    if (!score || score === 0) return <span className="text-gray-400 font-bold text-base">-</span>;
    const color =
        score >= 4.5
            ? 'text-emerald-600'
            : score >= 3.5
              ? 'text-blue-600'
              : score >= 2.5
                ? 'text-yellow-600'
                : 'text-red-600';
    return <span className={`font-bold text-base ${color}`}>{score.toFixed(2)}</span>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ReportsTab: React.FC<ReportsTabProps> = ({ filteredResults, onViewIndividual }) => {
    const [sortField, setSortField] = useState<SortField>('average');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // -- Sort handler --
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection(field === 'evaluateeName' || field === 'evaluateeDivision' ? 'asc' : 'desc');
        }
        setCurrentPage(1);
    };

    // -- Sorted data --
    const sortedResults = useMemo(() => {
        return [...filteredResults].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            switch (sortField) {
                case 'evaluateeName':
                    aVal = a.evaluateeName;
                    bVal = b.evaluateeName;
                    break;
                case 'evaluateeGrade':
                    aVal = a.evaluateeGrade;
                    bVal = b.evaluateeGrade;
                    break;
                case 'evaluateeDivision':
                    aVal = a.evaluateeDivision;
                    bVal = b.evaluateeDivision;
                    break;
                case 'self':
                case 'top':
                case 'bottom':
                case 'left':
                case 'right':
                case 'average':
                    aVal = a.scores[sortField];
                    bVal = b.scores[sortField];
                    break;
                case 'completionRate':
                    aVal = a.completionStatus.completionRate;
                    bVal = b.completionStatus.completionRate;
                    break;
                default:
                    aVal = a.scores.average;
                    bVal = b.scores.average;
            }

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortDirection === 'asc' ? aVal.localeCompare(bVal, 'th') : bVal.localeCompare(aVal, 'th');
            }
            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [filteredResults, sortField, sortDirection]);

    // -- Pagination --
    const totalItems = sortedResults.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

    // -- Sort icon --
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
        return sortDirection === 'asc' ? (
            <ChevronUp className="h-3 w-3 text-white" />
        ) : (
            <ChevronDown className="h-3 w-3 text-white" />
        );
    };

    // -- Status cell --
    const StatusCell = ({ status }: { status: ReportsTabProps['filteredResults'][0]['completionStatus'] }) => {
        if (status.completionRate >= 100) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    ✅ ครบ
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-xs font-semibold">
                {status.completedAngles}/{status.totalAngles} มุม
            </span>
        );
    };

    // -- Page numbers to display --
    const getPageNumbers = (): (number | 'ellipsis')[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | 'ellipsis')[] = [1];
        if (currentPage > 3) pages.push('ellipsis');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('ellipsis');
        pages.push(totalPages);
        return pages;
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
            >
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">รายชื่อผู้ถูกประเมิน</h2>
                <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
                    {totalItems} คน
                </span>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="gradient-primary text-white">
                                <th className="px-4 py-3 text-center font-semibold whitespace-nowrap w-12">#</th>
                                {COLUMNS.map((col) => (
                                    <th
                                        key={col.field}
                                        className={`px-4 py-3 font-semibold whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors select-none ${
                                            col.center ? 'text-center' : 'text-left'
                                        }`}
                                        onClick={() => handleSort(col.field)}
                                    >
                                        <div className={`flex items-center gap-1 ${col.center ? 'justify-center' : ''}`}>
                                            {col.label}
                                            <SortIcon field={col.field} />
                                        </div>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center font-semibold whitespace-nowrap w-16" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {paginatedResults.length > 0 ? (
                                paginatedResults.map((result, index) => (
                                    <motion.tr
                                        key={result.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className={`hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors ${
                                            index % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                                        }`}
                                    >
                                        {/* # */}
                                        <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                                            {startIndex + index + 1}
                                        </td>

                                        {/* ชื่อ-นามสกุล */}
                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                            {result.evaluateeName}
                                        </td>

                                        {/* ระดับ */}
                                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                            {result.evaluateeGrade}
                                        </td>

                                        {/* สายงาน */}
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                                            {result.evaluateeDivision}
                                        </td>

                                        {/* ตนเอง */}
                                        <td className="px-4 py-3 text-center">
                                            <ScoreCell score={result.scores.self} />
                                        </td>

                                        {/* บน */}
                                        <td className="px-4 py-3 text-center">
                                            <ScoreCell score={result.scores.top} />
                                        </td>

                                        {/* ล่าง */}
                                        <td className="px-4 py-3 text-center">
                                            <ScoreCell score={result.scores.bottom} />
                                        </td>

                                        {/* ซ้าย */}
                                        <td className="px-4 py-3 text-center">
                                            <ScoreCell score={result.scores.left} />
                                        </td>

                                        {/* ขวา */}
                                        <td className="px-4 py-3 text-center">
                                            <ScoreCell score={result.scores.right} />
                                        </td>

                                        {/* เฉลี่ย */}
                                        <td className="px-4 py-3 text-center">
                                            <AverageCell score={result.scores.average} />
                                        </td>

                                        {/* สถานะ */}
                                        <td className="px-4 py-3 text-center">
                                            <StatusCell status={result.completionStatus} />
                                        </td>

                                        {/* Eye button */}
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => onViewIndividual(result.id)}
                                                className="p-2 rounded-xl gradient-primary text-white hover:opacity-90 transition-opacity shadow-sm"
                                                title="ดูรายละเอียด"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={12} className="px-4 py-16 text-center text-gray-400 dark:text-gray-500 text-base">
                                        ไม่พบข้อมูลผู้ถูกประเมิน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            แสดง {startIndex + 1}-{endIndex} จาก {totalItems} รายการ
                        </span>
                        <div className="flex items-center gap-1">
                            {/* Previous */}
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            >
                                &laquo;
                            </button>

                            {/* Page numbers */}
                            {getPageNumbers().map((page, idx) =>
                                page === 'ellipsis' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            currentPage === page
                                                ? 'gradient-primary text-white shadow-sm'
                                                : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ),
                            )}

                            {/* Next */}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            >
                                &raquo;
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ReportsTab;
