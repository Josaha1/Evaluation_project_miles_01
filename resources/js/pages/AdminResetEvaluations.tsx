import { useState, FormEvent } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Search, Loader2, RotateCcw, AlertTriangle, User as UserIcon,
    History, ShieldAlert, CheckCircle2, FileWarning,
} from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';

interface RecentLog {
    id: number;
    scope_role: string;
    fiscal_year: number;
    answers_deleted: number;
    assignments_reset: number;
    created_at: string;
    admin_name: string;
    target_name: string;
    target_emid: string;
}

interface PageProps {
    recent_logs: RecentLog[];
    [key: string]: unknown;
}

interface PreviewResult {
    user: { id: number; emid: string; name: string; grade: string };
    counts: { answers: number; submitted_assignments: number };
}

const ROLE_OPTIONS = [
    { value: 'evaluator', label: 'Evaluator — เขาประเมินคนอื่น' },
    { value: 'evaluatee', label: 'Evaluatee — คนอื่นประเมินเขา' },
    { value: 'both',      label: 'ทั้งสอง role' },
];

const FY_OPTIONS = [2025, 2026, 2027].map(y => ({ value: y, label: `FY ${y} (พ.ศ. ${y + 543})` }));

export default function AdminResetEvaluations() {
    const { recent_logs } = usePage<PageProps>().props;

    const [emid, setEmid]               = useState('');
    const [role, setRole]               = useState('evaluator');
    const [fiscalYear, setFiscalYear]   = useState(2026);
    const [preview, setPreview]         = useState<PreviewResult | null>(null);
    const [previewing, setPreviewing]   = useState(false);
    const [confirmEmid, setConfirmEmid] = useState('');
    const [executing, setExecuting]     = useState(false);

    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

    const runPreview = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!emid.trim()) return;
        setPreviewing(true);
        setPreview(null);
        setConfirmEmid('');
        try {
            const res  = await fetch(`/admin/reset-evaluations/preview?emid=${encodeURIComponent(emid)}&role=${role}&fiscal_year=${fiscalYear}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.message || 'preview ล้มเหลว');
                return;
            }
            setPreview(json);
        } catch {
            toast.error('เชื่อมต่อไม่ได้');
        } finally {
            setPreviewing(false);
        }
    };

    const runExecute = async () => {
        if (!preview) return;
        if (confirmEmid !== preview.user.emid) {
            toast.error('โปรดพิมพ์ emid ให้ตรง');
            return;
        }
        setExecuting(true);
        try {
            const res = await fetch('/admin/reset-evaluations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
                body: JSON.stringify({ emid: preview.user.emid, role, fiscal_year: fiscalYear, confirm_emid: confirmEmid }),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.message || 'reset ล้มเหลว');
                return;
            }
            toast.success(`รีเซ็ตสำเร็จ — ลบ ${json.answers_deleted} answers, reset ${json.assignments_reset} assignments`);
            setPreview(null);
            setEmid('');
            setConfirmEmid('');
            setTimeout(() => window.location.reload(), 1200);
        } catch {
            toast.error('เชื่อมต่อไม่ได้');
        } finally {
            setExecuting(false);
        }
    };

    const isDanger = preview && (preview.counts.answers > 0 || preview.counts.submitted_assignments > 0);

    return (
        <MainLayout title="Reset Evaluations">
            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
                        <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-300" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">รีเซ็ตการประเมินรายบุคคล</h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    ล้างคำตอบ + ปลดล็อก submitted_at ของ user ที่ระบุ ทุก action จะถูกบันทึกใน audit log
                </p>

                {/* Warning */}
                <div className="mb-6 flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>คำเตือน:</strong> การ reset ทำให้ <em>คำตอบเดิมหายถาวร</em> จากตาราง answers
                        และปลดล็อก submitted_at — มี snapshot ใน audit log แต่การ restore ต้อง DBA ทำเอง
                    </div>
                </div>

                {/* Step 1: search + scope */}
                <form onSubmit={runPreview} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold">1</span>
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">ค้น + กำหนด scope</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">emid</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={emid} onChange={e => setEmid(e.target.value)}
                                    placeholder="เช่น 441027"
                                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">role</label>
                            <select value={role} onChange={e => setRole(e.target.value)}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-2 focus:ring-2 focus:ring-violet-500/30">
                                {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1 block">ปีงบ</label>
                            <select value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value))}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-3 py-2 focus:ring-2 focus:ring-violet-500/30">
                                {FY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="submit" disabled={!emid.trim() || previewing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                            {previewing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            ดู preview
                        </button>
                    </div>
                </form>

                {/* Step 2: Preview result + confirm */}
                {preview && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold">2</span>
                            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">ผล preview</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                                    <UserIcon className="w-3 h-3" />user
                                </div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{preview.user.name}</p>
                                <p className="text-[11px] text-gray-500">emid {preview.user.emid} · ระดับ {preview.user.grade}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-800">
                                <div className="text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1">answers จะลบ</div>
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{preview.counts.answers.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
                                <div className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">submitted ปลดล็อก</div>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{preview.counts.submitted_assignments}</p>
                            </div>
                        </div>

                        {!isDanger ? (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 text-sm text-gray-500">
                                <FileWarning className="w-4 h-4" />
                                ไม่มีข้อมูลที่ต้อง reset ใน scope นี้ — ไม่ต้องทำอะไรต่อ
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-rose-800 dark:text-rose-200">
                                        เพื่อยืนยัน โปรดพิมพ์ emid <strong className="font-mono">{preview.user.emid}</strong> ลงในกล่องด้านล่าง
                                    </p>
                                </div>
                                <input
                                    value={confirmEmid} onChange={e => setConfirmEmid(e.target.value)}
                                    placeholder={`พิมพ์ ${preview.user.emid}`}
                                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border-2 border-rose-200 dark:border-rose-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
                                />
                                <div className="flex justify-end">
                                    <button onClick={runExecute}
                                        disabled={confirmEmid !== preview.user.emid || executing}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-30 disabled:cursor-not-allowed">
                                        {executing
                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />กำลังรีเซ็ต...</>
                                            : <><RotateCcw className="w-3.5 h-3.5" />รีเซ็ตทันที</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent logs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-gray-500" />
                        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">ประวัติการ reset (30 รายการล่าสุด)</h2>
                    </div>
                    {recent_logs.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">ยังไม่มีประวัติ</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-2">เวลา</th>
                                        <th className="text-left py-2 px-2">admin</th>
                                        <th className="text-left py-2 px-2">target</th>
                                        <th className="text-left py-2 px-2">scope</th>
                                        <th className="text-right py-2 px-2">answers</th>
                                        <th className="text-right py-2 px-2">assigns</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {recent_logs.map(l => (
                                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                            <td className="py-2 px-2 text-gray-500 whitespace-nowrap">{l.created_at}</td>
                                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{l.admin_name}</td>
                                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                                {l.target_name} <span className="text-gray-400 font-mono">{l.target_emid}</span>
                                            </td>
                                            <td className="py-2 px-2">
                                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">{l.scope_role}</span>
                                                <span className="ml-1 text-gray-400">FY{l.fiscal_year}</span>
                                            </td>
                                            <td className="py-2 px-2 text-right font-mono">{l.answers_deleted}</td>
                                            <td className="py-2 px-2 text-right font-mono">{l.assignments_reset}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Success placeholder (toast handles it) */}
                <div className="hidden">
                    <CheckCircle2 />
                </div>
            </div>
        </MainLayout>
    );
}
