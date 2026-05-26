import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Search, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserOption {
    id: number;
    emid: string;
    label: string;
}

interface Props {
    fiscal_years: number[];
    selected_year: number;
    users: UserOption[];
}

interface Pair {
    angle: "self" | "top" | "bottom" | "left";
    name: string;
    evaluator_id: number | null;
    matched: boolean;
    unsupported: boolean;
    duplicate: boolean;
}

interface PreviewRow {
    sheet: string;
    row_no: number;
    emid: string;
    evaluatee_name: string | null;
    grade: number | null;
    evaluation_id: number | null;
    pairs: Pair[];
    status: "ok" | "evaluatee_not_found" | "no_evaluation" | "has_unmatched" | "unsupported_grade" | "duplicate" | "empty";
    errors: string[];
}

interface UnmatchedName {
    name: string;
    count: number;
    angles: Record<string, number>;
}

interface PreviewResponse {
    sheets: { sheet: string; rows: number; skipped: boolean }[];
    rows: PreviewRow[];
    unmatched_names: UnmatchedName[];
    summary: {
        total: number;
        ok: number;
        has_unmatched: number;
        no_evaluation: number;
        unsupported_grade: number;
        duplicate: number;
        evaluatee_not_found: number;
        angle_counts: Record<string, number>;
    };
}

const STATUS_STYLES: Record<PreviewRow["status"], { color: string; label: string }> = {
    ok: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "พร้อมนำเข้า" },
    has_unmatched: { color: "bg-amber-100 text-amber-700 border-amber-300", label: "ต้องจับคู่" },
    duplicate: { color: "bg-gray-100 text-gray-600 border-gray-300", label: "ซ้ำทั้งหมด" },
    evaluatee_not_found: { color: "bg-red-100 text-red-700 border-red-300", label: "ไม่พบผู้ถูกประเมิน" },
    no_evaluation: { color: "bg-red-100 text-red-700 border-red-300", label: "ไม่พบแบบประเมิน" },
    unsupported_grade: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "ระดับไม่รองรับ" },
    empty: { color: "bg-gray-100 text-gray-500 border-gray-300", label: "ว่าง" },
};

const ANGLE_COLORS: Record<string, string> = {
    self: "bg-violet-100 text-violet-700",
    top: "bg-blue-100 text-blue-700",
    bottom: "bg-emerald-100 text-emerald-700",
    left: "bg-orange-100 text-orange-700",
};

const ANGLE_LABELS: Record<string, string> = { self: "ตนเอง", top: "บน", bottom: "ล่าง", left: "ซ้าย" };

export default function AdminAssignmentImport({ fiscal_years, selected_year, users }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [fiscalYear, setFiscalYear] = useState<number>(selected_year);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [userSearch, setUserSearch] = useState<Record<string, string>>({});
    const [result, setResult] = useState<{
        created: number;
        skipped: number;
        unsupported: number;
        duplicate: number;
        details: string[];
        evaluateeSummary?: {
            emid: string;
            name: string;
            grade: number;
            sheet: string;
            row_no: number;
            angles: { self: number; top: number; bottom: number; left: number };
            total: number;
            skipped: number;
        }[];
    } | null>(null);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

    const filterUsers = (query: string): UserOption[] => {
        const q = query.trim().toLowerCase();
        if (q.length < 2) return [];
        return users
            .filter((u) => u.label.toLowerCase().includes(q) || u.emid.includes(q))
            .slice(0, 10);
    };

    const handleUpload = async () => {
        if (!file) return toast.error("กรุณาเลือกไฟล์ Excel");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("fiscal_year", String(fiscalYear));
        setLoading(true);
        try {
            const res = await fetch(route("assignments.import.preview"), {
                method: "POST",
                body: fd,
                headers: { "X-CSRF-TOKEN": csrf(), Accept: "application/json" },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "อ่านไฟล์ไม่สำเร็จ");
            setPreview(data);
            const init: Record<string, string> = {};
            data.unmatched_names.forEach((u: UnmatchedName) => (init[u.name] = ""));
            setMappings(init);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const allMapped = useMemo(() => {
        if (!preview) return false;
        return preview.unmatched_names.every((u) => mappings[u.name]);
    }, [preview, mappings]);

    const handleDownloadIssues = async () => {
        if (!preview) return;
        try {
            const res = await fetch(route("assignments.import.export-issues"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf(),
                    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
                body: JSON.stringify({
                    rows: preview.rows,
                    unmatched_names: preview.unmatched_names,
                }),
            });
            if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `import-issues-${Date.now()}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("ดาวน์โหลดสำเร็จ");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleExecute = async () => {
        if (!preview) return;
        if (!allMapped && preview.unmatched_names.length > 0) {
            toast.error(`ยังจับคู่ไม่ครบ: ${preview.unmatched_names.filter((u) => !mappings[u.name]).length} ชื่อ`);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(route("assignments.import.execute"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf(),
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    rows: preview.rows,
                    mappings,
                    fiscal_year: fiscalYear,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "นำเข้าไม่สำเร็จ");
            setResult(data);
            setStep(3);
            toast.success(`นำเข้าสำเร็จ ${data.created} รายการ`);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout
            title="นำเข้าจับคู่ผู้ประเมินจาก Excel"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการจับคู่ผู้ประเมิน", href: route("assignments.index") },
                        { label: "นำเข้าจาก Excel", active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-7xl mx-auto py-6 space-y-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Stepper */}
                    <div className="glass-card rounded-2xl p-4 flex items-center justify-center gap-4 flex-wrap">
                        {([1, 2, 3] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all",
                                        step === s
                                            ? "gradient-primary text-white shadow-md"
                                            : step > s
                                            ? "bg-emerald-500 text-white"
                                            : "bg-gray-200 text-gray-500"
                                    )}
                                >
                                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                                </div>
                                <span className={cn("text-sm font-medium", step === s ? "text-violet-700" : "text-gray-500")}>
                                    {s === 1 ? "อัปโหลดไฟล์" : s === 2 ? "ตรวจ & จับคู่" : "ผลการนำเข้า"}
                                </span>
                                {i < 2 && <ArrowRight className="w-4 h-4 text-gray-300" />}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="glass-card rounded-2xl p-8 space-y-6">
                            <h2 className="text-xl font-bold text-gradient-primary flex items-center gap-2">
                                <FileSpreadsheet className="w-6 h-6" /> เลือกไฟล์ + ปีงบประมาณ
                            </h2>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">ไฟล์ Excel</label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm border-2 border-dashed border-violet-300 rounded-xl p-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">ปีงบประมาณ</label>
                                <select
                                    value={fiscalYear}
                                    onChange={(e) => setFiscalYear(Number(e.target.value))}
                                    className="w-full md:w-1/3 text-sm border-2 border-gray-200 rounded-xl px-3 py-2"
                                >
                                    {fiscal_years.map((fy) => (
                                        <option key={fy} value={fy}>
                                            พ.ศ. {Number(fy) + 543} (ค.ศ. {fy})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1">
                                <div className="font-semibold">ระบบรองรับ:</div>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>Layout 3 แบบ — auto-detect ตำแหน่งคอลัมน์จาก header</li>
                                    <li>หลาย Sheet ในไฟล์เดียว (process รวมเป็น batch เดียว)</li>
                                    <li>ตัด prefix ของชื่อ (เช่น <code>1 นาย...</code>, <code>- นาง...</code>)</li>
                                    <li>Self-eval marker = <code>'/'</code> ในคอลัมน์ "ประเมินตนเอง"</li>
                                    <li><b>คอลัมน์ "องศาขวา" จะถูกข้าม</b> — สร้างผ่านระบบ External Organization → Access Code แทน</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="w-full py-3 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
                            >
                                <Upload className="w-5 h-5 inline mr-2" />
                                {loading ? "กำลังอ่านไฟล์..." : "อัปโหลด & ดูตัวอย่าง"}
                            </button>
                        </div>
                    )}

                    {step === 2 && preview && (
                        <div className="space-y-6">
                            {/* Sheets summary */}
                            <div className="glass-card rounded-2xl p-6">
                                <h3 className="font-bold text-gray-700 mb-3">📑 Sheet ที่พบในไฟล์</h3>
                                <div className="flex flex-wrap gap-2">
                                    {preview.sheets.map((s, i) => (
                                        <span
                                            key={i}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm border",
                                                s.skipped
                                                    ? "bg-gray-50 text-gray-400 border-gray-200 line-through"
                                                    : "bg-violet-50 text-violet-700 border-violet-200"
                                            )}
                                        >
                                            {s.sheet} {!s.skipped && <b>({s.rows} แถว)</b>}
                                            {s.skipped && " — ข้าม (ไม่พบ header)"}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="glass-card rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-gradient-primary mb-4">ผลการตรวจสอบ</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                    <SummaryCard label="ทั้งหมด" value={preview.summary.total} color="violet" />
                                    <SummaryCard label="พร้อมนำเข้า" value={preview.summary.ok} color="emerald" />
                                    <SummaryCard label="ต้องจับคู่" value={preview.summary.has_unmatched} color="amber" />
                                    <SummaryCard label="ระดับไม่รองรับ" value={preview.summary.unsupported_grade} color="orange" />
                                    <SummaryCard label="ซ้ำ" value={preview.summary.duplicate} color="gray" />
                                    <SummaryCard label="ไม่พบผู้ถูกประเมิน" value={preview.summary.evaluatee_not_found} color="red" />
                                    <SummaryCard label="ไม่พบแบบประเมิน" value={preview.summary.no_evaluation} color="red" />
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    <span className="text-gray-600">จะสร้าง:</span>
                                    {Object.entries(preview.summary.angle_counts).map(([angle, n]) => (
                                        <span key={angle} className={cn("px-2 py-0.5 rounded-full font-semibold", ANGLE_COLORS[angle])}>
                                            {ANGLE_LABELS[angle]} {n}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Unmatched names mapping */}
                            {preview.unmatched_names.length > 0 && (
                                <div className="glass-card rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            จับคู่ชื่อที่ไม่พบในระบบ ({preview.unmatched_names.length} ชื่อ)
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const all: Record<string, string> = {};
                                                    preview.unmatched_names.forEach((u) => (all[u.name] = "skip"));
                                                    setMappings(all);
                                                    toast.success(`Skip ทั้งหมด ${preview.unmatched_names.length} ชื่อ`);
                                                }}
                                                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            >
                                                Skip ทั้งหมด
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setMappings({});
                                                    setUserSearch({});
                                                    toast.info("ล้างการจับคู่ทั้งหมด");
                                                }}
                                                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50"
                                            >
                                                ล้าง
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {preview.unmatched_names.map((u) => (
                                            <div key={u.name} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-800">"{u.name}"</div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            ปรากฏ {u.count} ครั้ง (
                                                            {Object.entries(u.angles)
                                                                .map(([a, n]) => `${ANGLE_LABELS[a] ?? a}: ${n}`)
                                                                .join(", ")}
                                                            )
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={userSearch[u.name] || ""}
                                                            onChange={(e) => setUserSearch((p) => ({ ...p, [u.name]: e.target.value }))}
                                                            placeholder="ค้นหาผู้ใช้ในระบบ (พิมพ์ชื่อหรือ EMID อย่างน้อย 2 ตัว)..."
                                                            className="mt-2 w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                                                        />
                                                        {filterUsers(userSearch[u.name] || "").length > 0 && (
                                                            <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg bg-white">
                                                                {filterUsers(userSearch[u.name] || "").map((opt) => (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={() =>
                                                                            setMappings((prev) => ({ ...prev, [u.name]: String(opt.id) }))
                                                                        }
                                                                        className={cn(
                                                                            "block w-full text-left px-3 py-2 text-sm hover:bg-violet-50 border-b last:border-0",
                                                                            mappings[u.name] === String(opt.id) && "bg-violet-100"
                                                                        )}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="sm:w-48 space-y-2">
                                                        <button
                                                            onClick={() =>
                                                                setMappings((prev) => ({ ...prev, [u.name]: "skip" }))
                                                            }
                                                            className={cn(
                                                                "w-full px-3 py-2 rounded-lg text-sm font-medium border",
                                                                mappings[u.name] === "skip"
                                                                    ? "bg-gray-200 text-gray-700 border-gray-300"
                                                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            Skip ทุกตำแหน่ง
                                                        </button>
                                                        <div className="text-xs text-center">
                                                            {mappings[u.name] === "skip" && (
                                                                <span className="text-gray-500">✓ Skip</span>
                                                            )}
                                                            {mappings[u.name] && mappings[u.name] !== "skip" && (
                                                                <span className="text-emerald-600">✓ จับคู่แล้ว</span>
                                                            )}
                                                            {!mappings[u.name] && (
                                                                <span className="text-amber-600">⚠ ยังไม่เลือก</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Preview rows */}
                            <div className="glass-card rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-violet-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-2">Sheet</th>
                                                <th className="p-2">#</th>
                                                <th className="p-2">สถานะ</th>
                                                <th className="p-2">EMID</th>
                                                <th className="p-2 text-left">ผู้ถูกประเมิน</th>
                                                <th className="p-2">ระดับ</th>
                                                <th className="p-2 text-left">ผู้ประเมิน (มุม)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.rows.map((r, i) => {
                                                const s = STATUS_STYLES[r.status];
                                                return (
                                                    <tr key={i} className="border-t hover:bg-violet-50/30 align-top">
                                                        <td className="p-2 text-xs text-gray-500">{r.sheet}</td>
                                                        <td className="p-2 text-center text-gray-500">{r.row_no}</td>
                                                        <td className="p-2">
                                                            <span
                                                                className={cn(
                                                                    "inline-block px-2 py-0.5 rounded-full border text-xs font-medium",
                                                                    s.color
                                                                )}
                                                            >
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center font-mono">{r.emid}</td>
                                                        <td className="p-2">{r.evaluatee_name ?? "-"}</td>
                                                        <td className="p-2 text-center">{r.grade ?? "-"}</td>
                                                        <td className="p-2">
                                                            {r.pairs.length === 0 && r.errors.length > 0 && (
                                                                <span className="text-red-500 text-xs">{r.errors.join(", ")}</span>
                                                            )}
                                                            <div className="flex flex-wrap gap-1">
                                                                {r.pairs.map((p, j) => (
                                                                    <span
                                                                        key={j}
                                                                        className={cn(
                                                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
                                                                            ANGLE_COLORS[p.angle],
                                                                            !p.matched && "opacity-50 line-through",
                                                                            p.unsupported && "bg-orange-100 text-orange-700",
                                                                            p.duplicate && "bg-gray-100 text-gray-500"
                                                                        )}
                                                                        title={p.name}
                                                                    >
                                                                        <b>{ANGLE_LABELS[p.angle]}</b>
                                                                        {p.name.length > 25 ? p.name.slice(0, 25) + "…" : p.name}
                                                                        {!p.matched && " ⚠"}
                                                                        {p.duplicate && " 🔁"}
                                                                        {p.unsupported && " ✕"}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between gap-3 flex-wrap">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setPreview(null);
                                        setFile(null);
                                    }}
                                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    ← ย้อนกลับ
                                </button>
                                <div className="flex gap-3 ml-auto">
                                    {(preview.unmatched_names.length > 0 || preview.summary.evaluatee_not_found > 0 || preview.summary.no_evaluation > 0 || preview.summary.unsupported_grade > 0) && (
                                        <button
                                            onClick={handleDownloadIssues}
                                            className="inline-flex items-center px-5 py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            ดาวน์โหลด Excel ที่ import ไม่ได้
                                        </button>
                                    )}
                                    <button
                                        onClick={handleExecute}
                                        disabled={loading || (preview.unmatched_names.length > 0 && !allMapped)}
                                        className="px-8 py-2.5 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg"
                                    >
                                        {loading ? "กำลังนำเข้า..." : "ยืนยันนำเข้า"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && result && (
                        <div className="glass-card rounded-2xl p-8 space-y-6">
                            <div className="text-center space-y-3">
                                <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
                                <h2 className="text-3xl font-bold text-gradient-primary">นำเข้าสำเร็จ ✨</h2>
                                <p className="text-gray-600">สร้าง {result.created.toLocaleString()} คู่ประเมินใน {result.evaluateeSummary?.length ?? 0} ผู้ถูกประเมิน</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                    <SummaryCard label="✓ สร้างใหม่" value={result.created} color="emerald" />
                                    <SummaryCard label="ข้าม" value={result.skipped} color="gray" />
                                    <SummaryCard label="🔁 ซ้ำ (skip)" value={result.duplicate} color="amber" />
                                    <SummaryCard label="⊘ ระดับไม่รองรับ" value={result.unsupported} color="orange" />
                                </div>
                            </div>

                            {/* Per-evaluatee summary table */}
                            {result.evaluateeSummary && result.evaluateeSummary.length > 0 && (
                                <div className="glass-card rounded-2xl border-2 border-emerald-200 overflow-hidden">
                                    <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-emerald-700" />
                                        <h3 className="font-bold text-emerald-800">รายการผู้ถูกประเมินที่สร้างสำเร็จ ({result.evaluateeSummary.length} คน)</h3>
                                    </div>
                                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-emerald-100/50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-2 text-left">Sheet</th>
                                                    <th className="p-2">แถว</th>
                                                    <th className="p-2">EMID</th>
                                                    <th className="p-2 text-left">ผู้ถูกประเมิน</th>
                                                    <th className="p-2">ระดับ</th>
                                                    <th className="p-2 bg-violet-50">Self</th>
                                                    <th className="p-2 bg-blue-50">Top</th>
                                                    <th className="p-2 bg-emerald-50">Bottom</th>
                                                    <th className="p-2 bg-orange-50">Left</th>
                                                    <th className="p-2 font-bold">รวม</th>
                                                    <th className="p-2 text-amber-700">Skipped</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.evaluateeSummary.map((e, i) => (
                                                    <tr key={i} className="border-t hover:bg-emerald-50/30">
                                                        <td className="p-2 text-xs text-gray-500">{e.sheet}</td>
                                                        <td className="p-2 text-center text-gray-500">{e.row_no}</td>
                                                        <td className="p-2 text-center font-mono">{e.emid}</td>
                                                        <td className="p-2">{e.name}</td>
                                                        <td className="p-2 text-center">{e.grade}</td>
                                                        <td className="p-2 text-center font-medium">{e.angles.self || "-"}</td>
                                                        <td className="p-2 text-center font-medium">{e.angles.top || "-"}</td>
                                                        <td className="p-2 text-center font-medium">{e.angles.bottom || "-"}</td>
                                                        <td className="p-2 text-center font-medium">{e.angles.left || "-"}</td>
                                                        <td className="p-2 text-center font-bold text-emerald-700">{e.total}</td>
                                                        <td className="p-2 text-center text-xs text-amber-700">{e.skipped > 0 ? e.skipped : "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-emerald-50 sticky bottom-0">
                                                <tr className="border-t-2 border-emerald-300 font-bold">
                                                    <td colSpan={5} className="p-2 text-right">รวม:</td>
                                                    <td className="p-2 text-center">{result.evaluateeSummary.reduce((s, e) => s + e.angles.self, 0)}</td>
                                                    <td className="p-2 text-center">{result.evaluateeSummary.reduce((s, e) => s + e.angles.top, 0)}</td>
                                                    <td className="p-2 text-center">{result.evaluateeSummary.reduce((s, e) => s + e.angles.bottom, 0)}</td>
                                                    <td className="p-2 text-center">{result.evaluateeSummary.reduce((s, e) => s + e.angles.left, 0)}</td>
                                                    <td className="p-2 text-center text-emerald-700">{result.created}</td>
                                                    <td className="p-2"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Optional details (raw text) */}
                            <details className="bg-gray-50 rounded-xl p-4">
                                <summary className="cursor-pointer font-semibold text-gray-700">รายละเอียดทั้งหมด ({result.details.length} บรรทัด)</summary>
                                <ul className="text-xs space-y-1 font-mono mt-2 max-h-64 overflow-y-auto">
                                    {result.details.map((d, i) => (
                                        <li key={i} className={cn(d.includes("✓") ? "text-emerald-700" : "text-gray-600")}>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setFile(null);
                                        setPreview(null);
                                        setResult(null);
                                        setMappings({});
                                    }}
                                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    นำเข้าไฟล์ใหม่
                                </button>
                                <button
                                    onClick={() => router.visit(route("assignments.index"))}
                                    className="px-8 py-2.5 gradient-primary text-white rounded-xl font-semibold"
                                >
                                    ไปหน้ารายการ →
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </MainLayout>
    );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colorMap: Record<string, string> = {
        violet: "bg-violet-50 text-violet-700 border-violet-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        gray: "bg-gray-50 text-gray-700 border-gray-200",
        red: "bg-red-50 text-red-700 border-red-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return (
        <div className={cn("rounded-xl border-2 p-3 text-center", colorMap[color])}>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[11px] mt-1">{label}</div>
        </div>
    );
}
