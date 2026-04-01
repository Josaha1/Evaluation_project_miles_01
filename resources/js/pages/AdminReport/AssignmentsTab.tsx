import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Search, ChevronUp, ChevronDown, Loader2,
    CheckCircle, Clock, AlertTriangle, Filter, X,
    Users, ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAngleLabel } from './types';

/* ================================================================ */
/*  Types                                                           */
/* ================================================================ */

interface AssignmentRecord {
    id: number;
    evaluation_id: number;
    evaluation_title: string;
    evaluator_name: string;
    evaluator_grade: number;
    evaluatee_name: string;
    evaluatee_grade: number;
    evaluatee_division: string;
    fiscal_year: string;
    angle: string;
    answer_count: number;
    total_questions: number;
    completion_pct: number;
}

interface AssignmentsTabProps {
    fiscalYear: string;
    availableDivisions?: { id: number; name: string }[];
}

type SortField = 'evaluator_name' | 'evaluatee_name' | 'evaluatee_grade' | 'evaluatee_division' | 'evaluation_title' | 'angle' | 'completion_pct';

/* ================================================================ */
/*  Constants                                                       */
/* ================================================================ */

const ITEMS_PER_PAGE = 25;

const ANGLE_OPTIONS = [
    { value: '', label: 'ทุกมุม' },
    { value: 'self', label: 'ตนเอง' },
    { value: 'top', label: 'ผู้บังคับบัญชา' },
    { value: 'bottom', label: 'ผู้ใต้บังคับบัญชา' },
    { value: 'left', label: 'เพื่อนร่วมงาน' },
    { value: 'right', label: 'องค์กรภายนอก' },
];

const COLUMNS: { label: string; field: SortField; center?: boolean; width?: string }[] = [
    { label: 'ผู้ประเมิน', field: 'evaluator_name' },
    { label: 'ผู้ถูกประเมิน', field: 'evaluatee_name' },
    { label: 'ระดับ', field: 'evaluatee_grade', center: true, width: 'w-16' },
    { label: 'สายงาน', field: 'evaluatee_division' },
    { label: 'แบบประเมิน', field: 'evaluation_title' },
    { label: 'มุม', field: 'angle', center: true, width: 'w-28' },
    { label: 'สถานะ', field: 'completion_pct', center: true, width: 'w-28' },
];

/* ================================================================ */
/*  Component                                                       */
/* ================================================================ */

const AssignmentsTab: React.FC<AssignmentsTabProps> = ({ fiscalYear, availableDivisions = [] }) => {
    const [data, setData] = useState<AssignmentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [filterAngle, setFilterAngle] = useState('');
    const [filterDivision, setFilterDivision] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterStatus, setFilterStatus] = useState<'' | 'completed' | 'pending'>('');

    // Sort & pagination
    const [sortField, setSortField] = useState<SortField>('evaluatee_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);

    /* ---------- Fetch data ---------- */
    useEffect(() => {
        fetchData();
    }, [fiscalYear]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/admin/reports/evaluation/api/assignments-data?fiscal_year=${fiscalYear}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json.data ?? []);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลการจับคู่ได้');
            toast.error('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    /* ---------- Filter + Sort + Paginate ---------- */
    const filtered = useMemo(() => {
        let result = data;
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(r => r.evaluator_name.toLowerCase().includes(s) || r.evaluatee_name.toLowerCase().includes(s));
        }
        if (filterAngle) result = result.filter(r => r.angle === filterAngle);
        if (filterDivision) result = result.filter(r => r.evaluatee_division === filterDivision);
        if (filterGrade) result = result.filter(r => String(r.evaluatee_grade) === filterGrade);
        if (filterStatus === 'completed') result = result.filter(r => r.completion_pct >= 100);
        if (filterStatus === 'pending') result = result.filter(r => r.completion_pct < 100);
        return result;
    }, [data, search, filterAngle, filterDivision, filterGrade, filterStatus]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const va = a[sortField] ?? '';
            const vb = b[sortField] ?? '';
            const cmp = typeof va === 'number' ? va - (vb as number) : String(va).localeCompare(String(vb), 'th');
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortField, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [search, filterAngle, filterDivision, filterGrade, filterStatus]);

    const activeFilterCount = [search, filterAngle, filterDivision, filterGrade, filterStatus].filter(Boolean).length;
    const clearFilters = () => { setSearch(''); setFilterAngle(''); setFilterDivision(''); setFilterGrade(''); setFilterStatus(''); };

    // Stats
    const totalAssignments = data.length;
    const completedCount = data.filter(r => r.completion_pct >= 100).length;
    const pendingCount = totalAssignments - completedCount;

    /* ---------- Render ---------- */
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                <p className="text-sm text-gray-500">กำลังโหลดข้อมูลการจับคู่...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
                <button onClick={fetchData} className="text-sm text-violet-600 underline hover:text-violet-800">ลองใหม่</button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats bar */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-3"
            >
                <div className="glass-card rounded-xl p-4 ring-1 ring-gray-200/60 dark:ring-gray-700/40">
                    <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-violet-500" />
                        <div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalAssignments.toLocaleString()}</p>
                            <p className="text-[11px] text-gray-500">การจับคู่ทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 ring-1 ring-emerald-200/60 dark:ring-emerald-700/40">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <div>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount.toLocaleString()}</p>
                            <p className="text-[11px] text-gray-500">ประเมินแล้ว</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card rounded-xl p-4 ring-1 ring-amber-200/60 dark:ring-amber-700/40">
                    <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <div>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{pendingCount.toLocaleString()}</p>
                            <p className="text-[11px] text-gray-500">รอประเมิน</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="glass-card rounded-xl p-4 ring-1 ring-gray-200/60 dark:ring-gray-700/40"
            >
                <div className="flex flex-wrap items-end gap-3">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">ค้นหา</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="ค้นหาชื่อผู้ประเมิน/ผู้ถูกประเมิน..."
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                            />
                            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
                        </div>
                    </div>

                    {/* Angle */}
                    <div className="w-40">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">มุมประเมิน</label>
                        <select value={filterAngle} onChange={e => setFilterAngle(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-2 focus:ring-2 focus:ring-violet-500/30"
                        >
                            {ANGLE_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                    </div>

                    {/* Division */}
                    <div className="w-40">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">สายงาน</label>
                        <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-2 focus:ring-2 focus:ring-violet-500/30"
                        >
                            <option value="">ทั้งหมด</option>
                            {availableDivisions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>

                    {/* Grade */}
                    <div className="w-28">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">ระดับ</label>
                        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-2 focus:ring-2 focus:ring-violet-500/30"
                        >
                            <option value="">ทั้งหมด</option>
                            {[4,5,6,7,8,9,10,11,12,13].map(g => <option key={g} value={g}>ระดับ {g}</option>)}
                        </select>
                    </div>

                    {/* Status */}
                    <div className="w-32">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">สถานะ</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-2 focus:ring-2 focus:ring-violet-500/30"
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="completed">เสร็จแล้ว</option>
                            <option value="pending">ยังไม่เสร็จ</option>
                        </select>
                    </div>

                    {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline pb-2">ล้าง ({activeFilterCount})</button>
                    )}
                </div>
            </motion.div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card rounded-xl overflow-hidden ring-1 ring-gray-200/60 dark:ring-gray-700/40"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-10">#</th>
                                {COLUMNS.map(col => (
                                    <th key={col.field}
                                        onClick={() => handleSort(col.field)}
                                        className={cn(
                                            "px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 cursor-pointer hover:text-violet-600 transition-colors select-none",
                                            col.center ? "text-center" : "text-left",
                                            col.width,
                                        )}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {col.label}
                                            {sortField === col.field ? (
                                                sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                        <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        ไม่พบข้อมูลตามเงื่อนไข
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((r, i) => {
                                    const isComplete = r.completion_pct >= 100;
                                    const rowNum = (page - 1) * ITEMS_PER_PAGE + i + 1;
                                    const statusText = isComplete ? 'เสร็จสมบูรณ์' : r.answer_count > 0 ? `กำลังดำเนินการ (${Math.round(r.completion_pct)}%)` : 'ยังไม่เริ่ม';
                                    const tooltipText = [
                                        `ผู้ประเมิน: ${r.evaluator_name} (ระดับ ${r.evaluator_grade})`,
                                        `ผู้ถูกประเมิน: ${r.evaluatee_name} (ระดับ ${r.evaluatee_grade})`,
                                        `สายงาน: ${r.evaluatee_division || '-'}`,
                                        `แบบประเมิน: ${r.evaluation_title} (ID: ${r.evaluation_id})`,
                                        `มุมประเมิน: ${getAngleLabel(r.angle)}`,
                                        `ปีงบประมาณ: พ.ศ. ${Number(r.fiscal_year) + 543}`,
                                        `ตอบแล้ว: ${r.answer_count}/${r.total_questions} ข้อ`,
                                        `สถานะ: ${statusText}`,
                                    ].join('\n');
                                    return (
                                        <tr key={r.id} className="hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors group" title={tooltipText}>
                                            <td className="px-3 py-2.5 text-xs text-gray-400">{rowNum}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200 cursor-help"
                                                title={`${r.evaluator_name} (ระดับ ${r.evaluator_grade})`}>
                                                {r.evaluator_name}
                                            </td>
                                            <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200 cursor-help"
                                                title={`${r.evaluatee_name} (ระดับ ${r.evaluatee_grade}) — ${r.evaluatee_division || 'ไม่ระบุสายงาน'}`}>
                                                {r.evaluatee_name}
                                            </td>
                                            <td className="px-3 py-2.5 text-center cursor-help"
                                                title={`ระดับ ${r.evaluatee_grade}`}>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                                    C{r.evaluatee_grade}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 text-xs cursor-help"
                                                title={r.evaluatee_division || 'ไม่ระบุ'}>
                                                {r.evaluatee_division || '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 cursor-help"
                                                title={`${r.evaluation_title}\nEval ID: ${r.evaluation_id}\nปีงบ: พ.ศ. ${Number(r.fiscal_year) + 543}`}>
                                                <span className="whitespace-normal leading-snug">{r.evaluation_title}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center cursor-help"
                                                title={`มุมประเมิน: ${getAngleLabel(r.angle)}`}>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                                    r.angle === 'self' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                    : r.angle === 'top' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                    : r.angle === 'bottom' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                    : r.angle === 'left' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                                                )}>
                                                    {getAngleLabel(r.angle)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-center cursor-help"
                                                title={`${statusText}\nตอบแล้ว ${r.answer_count} จาก ${r.total_questions} ข้อ`}>
                                                {isComplete ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                        <CheckCircle className="w-3 h-3" />เสร็จ
                                                    </span>
                                                ) : r.answer_count > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                        <Clock className="w-3 h-3" />{r.answer_count}/{r.total_questions}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                        <Clock className="w-3 h-3" />0/{r.total_questions}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                        <p className="text-xs text-gray-500">
                            แสดง {((page-1)*ITEMS_PER_PAGE)+1}-{Math.min(page*ITEMS_PER_PAGE, sorted.length)} จาก {sorted.length.toLocaleString()} รายการ
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                            >ก่อนหน้า</button>
                            <span className="px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                                {page}/{totalPages}
                            </span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}
                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                            >ถัดไป</button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default AssignmentsTab;
