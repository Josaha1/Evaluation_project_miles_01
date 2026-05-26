import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Building2, UserSearch, Download } from "lucide-react";
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

interface StakeholderRow {
    source_row: number;
    sub_group: string | null;
    sequence_no: string;
    organization_name: string;
    contact_person: string | null;
    contact_info: string | null;
    coordinator: string | null;
}

interface GroupItem {
    label: string;
    row_start: number;
    stakeholders: StakeholderRow[];
    stakeholder_count: number;
    duplicate?: boolean;
    empty?: boolean;
    existing_code?: string | null;
}

interface PreviewRow {
    source_file?: string;
    sheet: string;
    sheet_clean: string;
    emid: string | null;
    evaluatee_id: number | null;
    evaluatee_name: string | null;
    grade: number | null;
    evaluation_id: number | null;
    match_source: "g4_emid" | "sheet_name" | null;
    groups: GroupItem[];
    status: "ok" | "evaluatee_not_found" | "no_evaluation" | "duplicate" | "all_empty";
    errors: string[];
}

interface PreviewResponse {
    source_file?: string;
    sheets: { sheet: string; valid: boolean; reason: string | null }[];
    rows: PreviewRow[];
    summary: {
        total_sheets: number;
        valid_sheets: number;
        skipped_sheets: number;
        codes_to_create: number;
        codes_duplicate: number;
        stakeholders_to_create: number;
        empty_groups?: number;
        evaluatee_not_found: number;
        no_evaluation: number;
        matched_by_emid: number;
        matched_by_sheet_name: number;
    };
}

interface ExecuteResult {
    created_orgs: number;
    created_codes: number;
    created_stakeholders: number;
    skipped_duplicate: number;
    skipped_no_evaluatee: number;
    skipped_no_evaluation: number;
    skipped_empty_groups?: number;
    details: string[];
    code_summary: {
        sheet: string;
        evaluatee: string;
        emid: string;
        group: string;
        code: string;
        max_uses: number;
        stakeholders_new: number;
        stakeholders_total: number;
        status: "created" | "shared" | "duplicate";
    }[];
}

const STATUS_STYLES: Record<PreviewRow["status"], { color: string; label: string }> = {
    ok: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "พร้อมสร้าง" },
    duplicate: { color: "bg-gray-100 text-gray-600 border-gray-300", label: "ซ้ำทั้งหมด" },
    all_empty: { color: "bg-amber-100 text-amber-700 border-amber-300", label: "ไม่มีรายชื่อ" },
    evaluatee_not_found: { color: "bg-red-100 text-red-700 border-red-300", label: "ไม่พบผู้ถูกประเมิน" },
    no_evaluation: { color: "bg-red-100 text-red-700 border-red-300", label: "ไม่พบแบบประเมิน" },
};

export default function AdminStakeholderImport({ fiscal_years, selected_year, users }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [fiscalYear, setFiscalYear] = useState<number>(selected_year);
    const [defaultEvaluateeId, setDefaultEvaluateeId] = useState<string>("");
    const [defaultUserSearch, setDefaultUserSearch] = useState<string>("");
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ExecuteResult | null>(null);
    // {sheet_title => user_id | "skip"}
    const [mappings, setMappings] = useState<Record<string, string>>({});
    const [userSearch, setUserSearch] = useState<Record<string, string>>({});

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

    const filterUsers = (q: string): UserOption[] => {
        const term = q.trim().toLowerCase();
        if (term.length < 2) return [];
        return users
            .filter((u) => u.label.toLowerCase().includes(term) || u.emid.includes(term))
            .slice(0, 10);
    };

    const unresolvedSheets = useMemo(
        () => preview?.rows.filter((r) => r.status === "evaluatee_not_found") ?? [],
        [preview]
    );

    const allUnresolvedHandled = useMemo(
        () => unresolvedSheets.every((r) => mappings[r.sheet]),
        [unresolvedSheets, mappings]
    );

    const handleUpload = async () => {
        if (!file) return toast.error("กรุณาเลือกไฟล์ Excel");
        const fd = new FormData();
        fd.append("file", file);
        fd.append("fiscal_year", String(fiscalYear));
        if (defaultEvaluateeId) fd.append("default_evaluatee_id", defaultEvaluateeId);
        setLoading(true);
        try {
            const res = await fetch(route("admin.stakeholders.import.preview"), {
                method: "POST",
                body: fd,
                headers: { "X-CSRF-TOKEN": csrf(), Accept: "application/json" },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "อ่านไฟล์ไม่สำเร็จ");
            setPreview(data);
            setMappings({});
            setUserSearch({});
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadUnmatched = async () => {
        if (!preview) return;
        try {
            const res = await fetch(route("admin.stakeholders.import.export-unmatched"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf(),
                    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
                body: JSON.stringify({ rows: preview.rows }),
            });
            if (!res.ok) throw new Error("ดาวน์โหลดไม่สำเร็จ");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const sourceTag = preview.source_file
                ? preview.source_file.replace(/\.xlsx?$/i, "").replace(/[^฀-๿a-zA-Z0-9_-]+/g, "_").slice(0, 40)
                : "all";
            a.download = `unmatched-${sourceTag}-${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("ดาวน์โหลดสำเร็จ");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleExecute = async () => {
        if (!preview) return;
        if (unresolvedSheets.length > 0 && !allUnresolvedHandled) {
            toast.error(`ยังจับคู่ผู้ถูกประเมินไม่ครบ: ${unresolvedSheets.filter((r) => !mappings[r.sheet]).length} sheet`);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(route("admin.stakeholders.import.execute"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrf(),
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    rows: preview.rows,
                    fiscal_year: fiscalYear,
                    mappings,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "นำเข้าไม่สำเร็จ");
            setResult(data);
            setStep(3);
            toast.success(`สร้าง Access Code สำเร็จ ${data.created_codes} รายการ`);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout
            title="นำเข้า Stakeholder องศาขวาจาก Excel"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "Access Codes", href: route("admin.access-codes.index") },
                        { label: "นำเข้า Stakeholder", active: true },
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
                                    {s === 1 ? "อัปโหลดไฟล์" : s === 2 ? "ตรวจสอบ" : "ผลการนำเข้า"}
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

                            {/* Default evaluatee selector — for files like "ผู้ว่าการ" where every sheet evaluates the same user */}
                            <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 space-y-2">
                                <label className="block text-sm font-semibold text-violet-800">
                                    ผู้ถูกประเมิน <span className="font-normal text-violet-600 text-xs">(ตัวเลือก — ใช้เมื่อ sheet ทั้งไฟล์ประเมินคนเดียวกัน เช่น ไฟล์ผู้ว่าการ)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={defaultUserSearch}
                                        onChange={(e) => setDefaultUserSearch(e.target.value)}
                                        placeholder="ค้นหาผู้ใช้ (พิมพ์ชื่อ/EMID อย่างน้อย 2 ตัว)..."
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                    />
                                    {filterUsers(defaultUserSearch).length > 0 && (
                                        <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg bg-white absolute z-20 w-full shadow-lg">
                                            {filterUsers(defaultUserSearch).map((opt) => (
                                                <button
                                                    type="button"
                                                    key={opt.id}
                                                    onClick={() => {
                                                        setDefaultEvaluateeId(String(opt.id));
                                                        setDefaultUserSearch("");
                                                    }}
                                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-violet-50 border-b last:border-0"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {defaultEvaluateeId && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-violet-700">✓ ใช้ default:</span>
                                        <span className="font-medium">{users.find((u) => String(u.id) === defaultEvaluateeId)?.label}</span>
                                        <button type="button" onClick={() => setDefaultEvaluateeId("")} className="text-red-500 hover:text-red-700">✕</button>
                                    </div>
                                )}
                                <p className="text-[11px] text-violet-700">
                                    💡 ระบบจะใช้ผู้ใช้นี้เป็น fallback สำหรับ sheet ที่ emid + ชื่อ sheet + ชื่อในเซลล์ R2 ทั้งหมด match ไม่เจอ
                                </p>
                            </div>

                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1">
                                <div className="font-semibold">โครงสร้างไฟล์ที่รองรับ:</div>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li><b>Auto-detect column layout</b> — รองรับ template 4 รูปแบบ (col layout ต่างกัน)</li>
                                    <li><b>Auto-detect emid</b> — มองหา cell ที่อยู่ใต้ header "รหัสพนักงาน" หรือ "รหัส"</li>
                                    <li><b>Fuzzy match ชื่อผู้ถูกประเมิน</b> — ลองจาก ชื่อ sheet, R2C1, default evaluatee ตามลำดับ</li>
                                    <li>1 group × 1 ปีงบ → 1 access code (shared ระหว่าง evaluatees)</li>
                                    <li>Idempotent — รันซ้ำไม่สร้างซ้ำ</li>
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
                                <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
                                    <h3 className="font-bold text-gray-700">📑 Sheet ที่พบในไฟล์ ({preview.sheets.length})</h3>
                                    {preview.source_file && (
                                        <span className="text-xs text-gray-500">
                                            📁 ไฟล์: <code className="bg-gray-100 rounded px-1.5 py-0.5">{preview.source_file}</code>
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {preview.sheets.map((s, i) => (
                                        <span
                                            key={i}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm border",
                                                !s.valid
                                                    ? "bg-gray-50 text-gray-400 border-gray-200 line-through"
                                                    : "bg-violet-50 text-violet-700 border-violet-200"
                                            )}
                                            title={s.reason ?? ""}
                                        >
                                            {s.sheet}
                                            {!s.valid && ` — ข้าม (${s.reason === "no_emid" ? "ไม่พบ emid ที่ G4" : "ไม่พบกลุ่ม"})`}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Summary cards */}
                            <div className="glass-card rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-gradient-primary mb-4">ผลการตรวจสอบ</h2>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    <SummaryCard label="Sheet ทั้งหมด" value={preview.summary.total_sheets} color="violet" />
                                    <SummaryCard label="Sheet ใช้ได้" value={preview.summary.valid_sheets} color="emerald" />
                                    <SummaryCard label="Sheet ข้าม" value={preview.summary.skipped_sheets} color="gray" />
                                    <SummaryCard label="Code ที่จะสร้าง" value={preview.summary.codes_to_create} color="emerald" />
                                    <SummaryCard label="Stakeholder ที่จะเก็บ" value={preview.summary.stakeholders_to_create} color="violet" />
                                    <SummaryCard label="⊘ Group ว่าง (skip)" value={preview.summary.empty_groups ?? 0} color="amber" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                    <SummaryCard label="🆔 match จาก G4" value={preview.summary.matched_by_emid} color="emerald" />
                                    <SummaryCard label="📋 match จากชื่อ sheet" value={preview.summary.matched_by_sheet_name} color="amber" />
                                    <SummaryCard label="Code ซ้ำ (skip)" value={preview.summary.codes_duplicate} color="gray" />
                                    <SummaryCard label="❌ ไม่พบผู้ถูกประเมิน" value={preview.summary.evaluatee_not_found} color="red" />
                                </div>
                            </div>

                            {/* Manual mapping for unresolved rows */}
                            {unresolvedSheets.length > 0 && (
                                <div className="glass-card rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            จับคู่ Sheet ที่ระบบหาผู้ถูกประเมินไม่เจอ ({unresolvedSheets.length} sheet)
                                        </h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const all: Record<string, string> = {};
                                                    unresolvedSheets.forEach((r) => (all[r.sheet] = "skip"));
                                                    setMappings(all);
                                                    toast.success(`Skip ทั้งหมด ${unresolvedSheets.length} sheet`);
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300"
                                            >
                                                Skip ทั้งหมด
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setMappings({});
                                                    setUserSearch({});
                                                    toast.info("ล้างการจับคู่");
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50"
                                            >
                                                ล้าง
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {unresolvedSheets.map((r) => {
                                            const matches = filterUsers(userSearch[r.sheet] || "");
                                            const selectedId = mappings[r.sheet];
                                            const selected = selectedId && selectedId !== "skip"
                                                ? users.find((u) => String(u.id) === selectedId)
                                                : null;
                                            return (
                                                <div key={r.sheet} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-800">
                                                                Sheet: "{r.sheet}"
                                                            </div>
                                                            <div className="text-xs text-gray-600 mt-1">
                                                                {r.errors.join(", ")}
                                                            </div>
                                                            <div className="mt-2 relative">
                                                                <UserSearch className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    value={userSearch[r.sheet] || ""}
                                                                    onChange={(e) =>
                                                                        setUserSearch((p) => ({ ...p, [r.sheet]: e.target.value }))
                                                                    }
                                                                    placeholder="ค้นหาผู้ใช้ในระบบ (ชื่อ หรือ EMID อย่างน้อย 2 ตัว)..."
                                                                    className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5"
                                                                />
                                                                {matches.length > 0 && (
                                                                    <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg bg-white absolute z-20 w-full shadow-lg">
                                                                        {matches.map((opt) => (
                                                                            <button
                                                                                key={opt.id}
                                                                                onClick={() => {
                                                                                    setMappings((prev) => ({ ...prev, [r.sheet]: String(opt.id) }));
                                                                                    setUserSearch((prev) => ({ ...prev, [r.sheet]: "" }));
                                                                                }}
                                                                                className={cn(
                                                                                    "block w-full text-left px-3 py-2 text-sm hover:bg-violet-50 border-b last:border-0",
                                                                                    String(opt.id) === selectedId && "bg-violet-100"
                                                                                )}
                                                                            >
                                                                                {opt.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {selected && (
                                                                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700 font-medium">
                                                                    ✓ {selected.label}
                                                                    <button
                                                                        onClick={() => {
                                                                            const next = { ...mappings };
                                                                            delete next[r.sheet];
                                                                            setMappings(next);
                                                                        }}
                                                                        className="ml-1 hover:text-red-600"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="sm:w-44 space-y-2">
                                                            <button
                                                                onClick={() =>
                                                                    setMappings((prev) => ({ ...prev, [r.sheet]: "skip" }))
                                                                }
                                                                className={cn(
                                                                    "w-full px-3 py-2 rounded-lg text-sm font-medium border",
                                                                    mappings[r.sheet] === "skip"
                                                                        ? "bg-gray-200 text-gray-700 border-gray-300"
                                                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                                )}
                                                            >
                                                                Skip Sheet นี้
                                                            </button>
                                                            <div className="text-xs text-center">
                                                                {mappings[r.sheet] === "skip" && (
                                                                    <span className="text-gray-500">⊘ จะข้าม</span>
                                                                )}
                                                                {mappings[r.sheet] && mappings[r.sheet] !== "skip" && (
                                                                    <span className="text-emerald-600">✓ จับคู่แล้ว</span>
                                                                )}
                                                                {!mappings[r.sheet] && (
                                                                    <span className="text-amber-600">⚠ ยังไม่เลือก</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Preview rows */}
                            <div className="glass-card rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-violet-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="p-2 text-left">Sheet</th>
                                                <th className="p-2">สถานะ</th>
                                                <th className="p-2">EMID</th>
                                                <th className="p-2 text-left">ผู้ถูกประเมิน</th>
                                                <th className="p-2">ระดับ</th>
                                                <th className="p-2 text-left">กลุ่ม Stakeholder</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.rows.map((r, i) => {
                                                const s = STATUS_STYLES[r.status];
                                                return (
                                                    <tr key={i} className="border-t hover:bg-violet-50/30 align-top">
                                                        <td className="p-2 text-xs text-gray-500">{r.sheet}</td>
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
                                                        <td className="p-2 text-center font-mono text-xs">
                                                            {r.emid ?? <span className="text-gray-300">—</span>}
                                                        </td>
                                                        <td className="p-2">
                                                            <div className="flex items-center gap-2">
                                                                <span>{r.evaluatee_name ?? "-"}</span>
                                                                {r.match_source === "g4_emid" && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700" title="match จาก emid ที่ G4">
                                                                        🆔 G4
                                                                    </span>
                                                                )}
                                                                {r.match_source === "sheet_name" && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700" title="match จากชื่อ sheet (fuzzy)">
                                                                        📋 sheet
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {r.errors.length > 0 && (
                                                                <div className="text-xs text-red-500 mt-1">{r.errors.join(", ")}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-2 text-center">{r.grade ?? "-"}</td>
                                                        <td className="p-2">
                                                            <div className="flex flex-col gap-2">
                                                                {r.groups.map((g, j) => {
                                                                    const filled = g.stakeholders.filter(s => s.organization_name);
                                                                    const empty = filled.length === 0;
                                                                    return (
                                                                        <details
                                                                            key={j}
                                                                            className={cn(
                                                                                "rounded border text-xs",
                                                                                empty
                                                                                    ? "bg-amber-50/50 text-amber-700 border-amber-200"
                                                                                    : g.duplicate
                                                                                        ? "bg-gray-50 text-gray-600 border-gray-200"
                                                                                        : "bg-emerald-50/50 text-emerald-800 border-emerald-200"
                                                                            )}
                                                                        >
                                                                            <summary className="cursor-pointer px-2 py-1 flex items-center gap-2">
                                                                                <Building2 className="w-3 h-3" />
                                                                                <b>{g.label.length > 40 ? g.label.slice(0, 40) + "…" : g.label}</b>
                                                                                <span className="text-[10px] opacity-70">
                                                                                    ({filled.length} stakeholder)
                                                                                </span>
                                                                                {empty && (
                                                                                    <span className="text-[10px] font-semibold">⊘ ไม่มีรายชื่อ — ข้าม</span>
                                                                                )}
                                                                                {g.duplicate && !empty && (
                                                                                    <span className="text-[10px]">🔁 {g.existing_code}</span>
                                                                                )}
                                                                            </summary>
                                                                            {filled.length > 0 && (
                                                                                <div className="px-2 pb-2 pt-1 space-y-1 bg-white rounded-b">
                                                                                    {filled.map((s, k) => (
                                                                                        <div key={k} className="text-[11px] border-l-2 border-emerald-300 pl-2 py-0.5">
                                                                                            <div>
                                                                                                <span className="font-mono text-gray-400">{s.sequence_no || "•"}</span>{" "}
                                                                                                <b className="text-gray-800">{s.organization_name}</b>
                                                                                                {s.sub_group && <span className="ml-2 text-violet-600">[{s.sub_group}]</span>}
                                                                                            </div>
                                                                                            {(s.contact_person || s.contact_info || s.coordinator) && (
                                                                                                <div className="text-gray-500 ml-3">
                                                                                                    {s.contact_person && <>👤 {s.contact_person} </>}
                                                                                                    {s.contact_info && <>📞 {s.contact_info} </>}
                                                                                                    {s.coordinator && <>🤝 {s.coordinator}</>}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </details>
                                                                    );
                                                                })}
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
                                <div className="flex gap-3 ml-auto flex-wrap">
                                    {(unresolvedSheets.length > 0 ||
                                      (preview.summary.no_evaluation ?? 0) > 0 ||
                                      (preview.summary.empty_groups ?? 0) > 0) && (
                                        <button
                                            onClick={handleDownloadUnmatched}
                                            className="inline-flex items-center px-5 py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            ดาวน์โหลด Excel ปัญหา/ที่ skip
                                        </button>
                                    )}
                                    <button
                                        onClick={handleExecute}
                                        disabled={
                                            loading ||
                                            (preview.summary.codes_to_create === 0 &&
                                                !Object.values(mappings).some((v) => v && v !== "skip")) ||
                                            (unresolvedSheets.length > 0 && !allUnresolvedHandled)
                                        }
                                        className="px-8 py-2.5 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg"
                                    >
                                        {loading ? "กำลังนำเข้า..." : `ยืนยันสร้าง`}
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
                                <p className="text-gray-600">
                                    สร้าง {result.created_codes} access codes · {result.created_stakeholders} stakeholders · {result.created_orgs} หน่วยงานใหม่
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mt-4">
                                    <SummaryCard label="✓ Codes ใหม่" value={result.created_codes} color="emerald" />
                                    <SummaryCard label="📋 Stakeholders" value={result.created_stakeholders} color="violet" />
                                    <SummaryCard label="🏢 Orgs ใหม่" value={result.created_orgs} color="violet" />
                                    <SummaryCard label="🔁 Code ซ้ำ" value={result.skipped_duplicate} color="amber" />
                                    <SummaryCard label="⊘ Group ว่าง" value={result.skipped_empty_groups ?? 0} color="amber" />
                                    <SummaryCard label="ไม่พบผู้ถูกประเมิน" value={result.skipped_no_evaluatee} color="red" />
                                    <SummaryCard label="ไม่พบแบบประเมิน" value={result.skipped_no_evaluation} color="red" />
                                </div>
                            </div>

                            {result.code_summary.length > 0 && (
                                <div className="rounded-2xl border-2 border-emerald-200 overflow-hidden">
                                    <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                                        <h3 className="font-bold text-emerald-800">รายการ Access Codes ({result.code_summary.length})</h3>
                                    </div>
                                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto bg-white">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-emerald-100/50 sticky top-0">
                                                <tr>
                                                    <th className="p-2 text-left">Sheet</th>
                                                    <th className="p-2">EMID</th>
                                                    <th className="p-2 text-left">ผู้ถูกประเมิน</th>
                                                    <th className="p-2 text-left">กลุ่ม</th>
                                                    <th className="p-2 text-left">Code</th>
                                                    <th className="p-2">Max Uses</th>
                                                    <th className="p-2">Stakeholders</th>
                                                    <th className="p-2">สถานะ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.code_summary.map((c, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="p-2 text-xs text-gray-500">{c.sheet}</td>
                                                        <td className="p-2 text-center font-mono">{c.emid}</td>
                                                        <td className="p-2">{c.evaluatee}</td>
                                                        <td className="p-2 text-xs">{c.group}</td>
                                                        <td className="p-2 font-mono text-violet-700">{c.code}</td>
                                                        <td className="p-2 text-center">{c.max_uses}</td>
                                                        <td className="p-2 text-center text-xs">
                                                            <span className="text-emerald-700 font-semibold">{c.stakeholders_new}</span>
                                                            <span className="text-gray-400">/{c.stakeholders_total}</span>
                                                        </td>
                                                        <td className="p-2 text-center text-xs">
                                                            {c.status === "created" && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold" title="สร้าง code + pivot + stakeholders ใหม่ทั้งหมด">
                                                                    🆕 ใหม่
                                                                </span>
                                                            )}
                                                            {c.status === "shared" && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold" title="ใช้ code ร่วมกับ evaluatee อื่น แต่เพิ่ม stakeholders ของคนนี้">
                                                                    🔗 ใช้ร่วม +{c.stakeholders_new}
                                                                </span>
                                                            )}
                                                            {c.status === "duplicate" && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" title="ทุกอย่างซ้ำ ไม่เพิ่มข้อมูล">
                                                                    🔁 ซ้ำ
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <details className="bg-gray-50 rounded-xl p-4">
                                <summary className="cursor-pointer font-semibold text-gray-700">
                                    รายละเอียดทั้งหมด ({result.details.length} บรรทัด)
                                </summary>
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
                                    }}
                                    className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    นำเข้าไฟล์ใหม่
                                </button>
                                <button
                                    onClick={() => router.visit(route("admin.access-codes.index"))}
                                    className="px-8 py-2.5 gradient-primary text-white rounded-xl font-semibold"
                                >
                                    ไปหน้า Access Codes →
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
