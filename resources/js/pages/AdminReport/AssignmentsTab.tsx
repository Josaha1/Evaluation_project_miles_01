import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Search, ChevronUp, ChevronDown, Loader2,
    CheckCircle, Clock, AlertTriangle, Filter, X,
    Users, ArrowUpDown, FileEdit, Lock,
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
    submitted_at: string | null;
    answer_count: number;
    total_questions: number;
    completion_pct: number;
}

interface EvaluationOption {
    id: number;
    title: string;
    user_type: 'internal' | 'external';
    grade_min: number;
    grade_max: number;
    fiscal_year: number;
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

    // Selection + Change-evaluation modal
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [modal, setModal] = useState<{ open: boolean; targets: number[] }>({ open: false, targets: [] });
    const [evalOptions, setEvalOptions] = useState<EvaluationOption[]>([]);
    const [chosenEvalId, setChosenEvalId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

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

    // Clear selection เมื่อเปลี่ยน fiscalYear หรือ filter (กัน select id ที่ filter ออกไปแล้ว)
    useEffect(() => { setSelected(new Set()); }, [fiscalYear, filterAngle, filterDivision, filterGrade, filterStatus]);

    const isLocked = (r: AssignmentRecord) => r.submitted_at !== null;
    const allSelectableOnPageChecked = paginatedSelectableAll(paginated, selected);

    function paginatedSelectableAll(rows: AssignmentRecord[], sel: Set<number>) {
        const sels = rows.filter(r => !isLocked(r));
        return sels.length > 0 && sels.every(r => sel.has(r.id));
    }

    const toggleRow = (id: number) => setSelected(prev => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });
    const togglePageAll = () => setSelected(prev => {
        const n = new Set(prev);
        const sels = paginated.filter(r => !isLocked(r));
        if (allSelectableOnPageChecked) sels.forEach(r => n.delete(r.id));
        else sels.forEach(r => n.add(r.id));
        return n;
    });
    const clearSelection = () => setSelected(new Set());

    const openModal = async (targets: number[]) => {
        if (targets.length === 0) return;
        setModal({ open: true, targets });
        setChosenEvalId(null);
        if (evalOptions.length === 0) {
            try {
                const res = await fetch(`/admin/reports/evaluation/api/available-evaluations?fiscal_year=${fiscalYear}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                const json = await res.json();
                setEvalOptions(json.data ?? []);
            } catch {
                toast.error('โหลดรายการแบบประเมินไม่ได้');
            }
        }
    };
    const closeModal = () => { setModal({ open: false, targets: [] }); setChosenEvalId(null); };

    const submitChange = async () => {
        if (!chosenEvalId || modal.targets.length === 0) return;
        setSubmitting(true);
        try {
            const isBulk = modal.targets.length > 1;
            const url = isBulk
                ? '/admin/assignments/bulk-change-evaluation'
                : `/admin/assignments/${modal.targets[0]}/evaluation`;
            const method = isBulk ? 'POST' : 'PATCH';
            const body = isBulk
                ? JSON.stringify({ assignment_ids: modal.targets, evaluation_id: chosenEvalId })
                : JSON.stringify({ evaluation_id: chosenEvalId });

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
                body,
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(json?.message || 'เปลี่ยนแบบประเมินไม่สำเร็จ');
                return;
            }
            toast.success(isBulk ? `เปลี่ยนแบบประเมินสำเร็จ ${json.success_count ?? modal.targets.length} รายการ` : 'เปลี่ยนแบบประเมินสำเร็จ');
            clearSelection();
            closeModal();
            fetchData();
        } catch {
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setSubmitting(false);
        }
    };

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

            {/* Bulk action bar — โผล่เฉพาะตอนเลือก ≥1 row */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="flex items-center justify-between gap-3 rounded-xl bg-violet-600 text-white px-4 py-2.5 shadow-lg ring-1 ring-violet-700/30"
                    >
                        <div className="flex items-center gap-2.5 text-sm">
                            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-white/20 font-bold">{selected.size}</span>
                            <span>เลือกแล้ว — เปลี่ยนแบบประเมินพร้อมกัน</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => openModal(Array.from(selected))}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-violet-700 text-xs font-semibold hover:bg-violet-50 transition-colors">
                                <FileEdit className="w-3.5 h-3.5" />เปลี่ยนแบบประเมิน
                            </button>
                            <button onClick={clearSelection}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-700/40 text-white text-xs hover:bg-violet-700/60 transition-colors">
                                <X className="w-3.5 h-3.5" />ยกเลิก
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card rounded-xl overflow-hidden ring-1 ring-gray-200/60 dark:ring-gray-700/40"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-3 py-3 w-10">
                                    <input type="checkbox"
                                        checked={allSelectableOnPageChecked}
                                        onChange={togglePageAll}
                                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500/40"
                                        aria-label="เลือกทั้งหน้า"
                                    />
                                </th>
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
                                <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 w-24">การกระทำ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
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
                                    const locked = isLocked(r);
                                    return (
                                        <tr key={r.id} className={cn(
                                            "transition-colors group",
                                            selected.has(r.id) ? "bg-violet-50/70 dark:bg-violet-900/20" : "hover:bg-violet-50/40 dark:hover:bg-violet-900/10"
                                        )} title={tooltipText}>
                                            <td className="px-3 py-2.5">
                                                {locked ? (
                                                    <Lock className="w-3.5 h-3.5 text-gray-300" aria-label="ส่งคำตอบแล้ว — เปลี่ยนไม่ได้" />
                                                ) : (
                                                    <input type="checkbox"
                                                        checked={selected.has(r.id)}
                                                        onChange={() => toggleRow(r.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500/40"
                                                        aria-label={`เลือก row ${r.id}`}
                                                    />
                                                )}
                                            </td>
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
                                            <td className="px-3 py-2.5 text-center">
                                                <button
                                                    disabled={locked}
                                                    onClick={() => openModal([r.id])}
                                                    title={locked ? 'ส่งคำตอบแล้ว — เปลี่ยนไม่ได้' : 'เปลี่ยนแบบประเมิน'}
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors",
                                                        locked
                                                            ? "bg-gray-50 text-gray-300 cursor-not-allowed dark:bg-gray-800/40"
                                                            : "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                                                    )}
                                                >
                                                    <FileEdit className="w-3 h-3" />เปลี่ยน
                                                </button>
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

            {/* Modal เปลี่ยนแบบประเมิน */}
            <AnimatePresence>
                {modal.open && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={(e) => e.target === e.currentTarget && !submitting && closeModal()}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 8 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
                            className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden"
                        >
                            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileEdit className="w-4 h-4 text-violet-600" />
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                        เปลี่ยนแบบประเมิน {modal.targets.length > 1 ? `(${modal.targets.length} รายการ)` : ''}
                                    </h3>
                                </div>
                                <button onClick={closeModal} disabled={submitting} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                                <p className="text-xs text-gray-500">
                                    เลือกแบบประเมินปลายทาง — ปีงบ พ.ศ. {Number(fiscalYear) + 543}
                                </p>
                                <div className="space-y-1.5">
                                    {evalOptions.length === 0 ? (
                                        <div className="flex items-center gap-2 text-xs text-gray-400 py-4 justify-center">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />กำลังโหลด...
                                        </div>
                                    ) : evalOptions.map(ev => (
                                        <label key={ev.id}
                                            className={cn(
                                                "flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors border",
                                                chosenEvalId === ev.id
                                                    ? "border-violet-400 bg-violet-50/60 dark:bg-violet-900/20 dark:border-violet-600"
                                                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                            )}
                                        >
                                            <input type="radio" name="eval-target" checked={chosenEvalId === ev.id}
                                                onChange={() => setChosenEvalId(ev.id)}
                                                className="mt-0.5 w-3.5 h-3.5 text-violet-600 focus:ring-violet-500/40"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">{ev.title}</div>
                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                                                        {ev.user_type === 'internal' ? 'ภายใน' : 'ภายนอก'}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                                                        ระดับ {ev.grade_min}{ev.grade_min !== ev.grade_max ? `-${ev.grade_max}` : ''}
                                                    </span>
                                                    <span className="text-gray-400">#{ev.id}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2 bg-gray-50/60 dark:bg-gray-800/40">
                                <button onClick={closeModal} disabled={submitting}
                                    className="px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700 disabled:opacity-50">
                                    ยกเลิก
                                </button>
                                <button onClick={submitChange} disabled={!chosenEvalId || submitting}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                                    {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                    ยืนยันเปลี่ยน
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssignmentsTab;
