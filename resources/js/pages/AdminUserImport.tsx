import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type LookupItem = { id: number; name?: string; title?: string };

interface Props {
    divisions: LookupItem[];
    departments: LookupItem[];
    factions: LookupItem[];
    positions: LookupItem[];
}

interface PreviewRow {
    row_no: number;
    emid: string;
    prename: string;
    fname: string;
    lname: string;
    position: string;
    grade: string;
    department: string;
    faction: string;
    division: string;
    birthdate: string | null;
    division_id: number | null;
    department_id: number | null;
    faction_id: number | null;
    position_id: number | null;
    sex: string;
    duplicate: boolean;
    errors: string[];
    status: "ok" | "duplicate" | "error" | "missing_lookup";
}

interface PreviewResponse {
    rows: PreviewRow[];
    missing: {
        divisions: string[];
        departments: string[];
        factions: string[];
        positions: string[];
    };
    summary: {
        total: number;
        ok: number;
        duplicate: number;
        error: number;
        missing_lookup: number;
    };
}

type MappingType = "divisions" | "departments" | "factions" | "positions";
type Mappings = Record<MappingType, Record<string, string>>;

const STATUS_STYLES: Record<PreviewRow["status"], { color: string; label: string; icon: any }> = {
    ok: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "พร้อมนำเข้า", icon: CheckCircle2 },
    missing_lookup: { color: "bg-amber-100 text-amber-700 border-amber-300", label: "ต้องจับคู่", icon: AlertTriangle },
    duplicate: { color: "bg-gray-100 text-gray-600 border-gray-300", label: "มีอยู่แล้ว", icon: XCircle },
    error: { color: "bg-red-100 text-red-700 border-red-300", label: "ข้อมูลไม่ครบ", icon: XCircle },
};

export default function AdminUserImport({ divisions, departments, factions, positions }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [mappings, setMappings] = useState<Mappings>({
        divisions: {},
        departments: {},
        factions: {},
        positions: {},
    });
    const [result, setResult] = useState<{ created: number; skipped: number; details: string[] } | null>(null);

    const handleUpload = async () => {
        if (!file) return toast.error("กรุณาเลือกไฟล์ Excel");
        const fd = new FormData();
        fd.append("file", file);
        setLoading(true);
        try {
            const res = await fetch(route("admin.users.import.preview"), {
                method: "POST",
                body: fd,
                headers: {
                    "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
                    Accept: "application/json",
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "อ่านไฟล์ไม่สำเร็จ");
            setPreview(data);
            // pre-fill mappings: empty string = unselected
            const init: Mappings = { divisions: {}, departments: {}, factions: {}, positions: {} };
            (Object.keys(init) as MappingType[]).forEach((k) => {
                data.missing[k].forEach((name: string) => (init[k][name] = ""));
            });
            setMappings(init);
            setStep(2);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!preview) return;
        // Validate: all missing mappings must be either an id or 'create'
        const unresolved: string[] = [];
        (Object.keys(mappings) as MappingType[]).forEach((k) => {
            Object.entries(mappings[k]).forEach(([name, val]) => {
                if (!val) unresolved.push(`${k}: "${name}"`);
            });
        });
        if (unresolved.length) {
            toast.error(`ยังจับคู่ไม่ครบ: ${unresolved.length} รายการ`);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(route("admin.users.import.execute"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "",
                    Accept: "application/json",
                },
                body: JSON.stringify({ rows: preview.rows, mappings }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "นำเข้าไม่สำเร็จ");
            setResult(data);
            setStep(3);
            toast.success(`นำเข้าสำเร็จ ${data.created} ราย`);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const lookupOptions = (type: MappingType): { id: number; label: string }[] => {
        const list = type === "divisions" ? divisions
            : type === "departments" ? departments
            : type === "factions" ? factions
            : positions;
        return list.map((it) => ({ id: it.id, label: (it.name ?? it.title ?? "").trim() }));
    };

    const TYPE_LABELS: Record<MappingType, string> = {
        divisions: "สายงาน",
        departments: "กอง",
        factions: "ฝ่าย",
        positions: "ตำแหน่ง",
    };

    return (
        <MainLayout
            title="นำเข้าสมาชิกจาก Excel"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการสมาชิก", href: route("admin.users.index") },
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
                    <div className="glass-card rounded-2xl p-4 flex items-center justify-center gap-4">
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
                                <FileSpreadsheet className="w-6 h-6" /> เลือกไฟล์ Excel
                            </h2>
                            <p className="text-sm text-gray-600">
                                ระบบรองรับไฟล์ <code>.xlsx / .xls</code> โดยใช้ Sheet แรก คอลัมน์:
                                <br />
                                <code className="text-xs">A ลำดับ | B รหัสพนักงาน | C คำนำหน้า | D ชื่อ | E นามสกุล | F ตำแหน่ง | G ระดับ | H กอง | I ฝ่าย | J สายงาน | K วันเกิด</code>
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm border-2 border-dashed border-violet-300 rounded-xl p-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                            />
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 space-y-1">
                                <div className="font-semibold">ข้อตกลง:</div>
                                <ul className="list-disc list-inside space-y-0.5">
                                    <li>รหัสพนักงานที่มีอยู่แล้วจะถูก <b>ข้าม</b> ไม่ทับข้อมูลเดิม</li>
                                    <li>รหัสผ่านเริ่มต้น = วันเกิด format <code>DDMMYYYY</code> (ปี พ.ศ.) เช่น 13/11/2541 → <code>13112541</code></li>
                                    <li>เพศจะถูกอนุมานจากคำนำหน้า (นาย → ชาย, นาง/นางสาว → หญิง)</li>
                                    <li>role = user, user_type = internal</li>
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
                            {/* Summary */}
                            <div className="glass-card rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-gradient-primary mb-4">ผลการตรวจสอบ</h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <SummaryCard label="ทั้งหมด" value={preview.summary.total} color="violet" />
                                    <SummaryCard label="พร้อมนำเข้า" value={preview.summary.ok} color="emerald" />
                                    <SummaryCard label="ต้องจับคู่" value={preview.summary.missing_lookup} color="amber" />
                                    <SummaryCard label="มีอยู่แล้ว" value={preview.summary.duplicate} color="gray" />
                                    <SummaryCard label="ข้อมูลไม่ครบ" value={preview.summary.error} color="red" />
                                </div>
                            </div>

                            {/* Mapping for missing lookups */}
                            {(["divisions", "departments", "factions", "positions"] as MappingType[]).some(
                                (k) => preview.missing[k].length > 0
                            ) && (
                                <div className="glass-card rounded-2xl p-6 space-y-4">
                                    <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        จับคู่ข้อมูลที่ไม่พบในระบบ
                                    </h3>
                                    {(["divisions", "departments", "factions", "positions"] as MappingType[]).map(
                                        (type) =>
                                            preview.missing[type].length > 0 && (
                                                <div key={type}>
                                                    <h4 className="font-semibold text-gray-700 mb-2">
                                                        {TYPE_LABELS[type]} ({preview.missing[type].length} รายการ)
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {preview.missing[type].map((name) => (
                                                            <div
                                                                key={name}
                                                                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200"
                                                            >
                                                                <div className="flex-1 font-medium text-gray-800 break-all">
                                                                    "{name}"
                                                                </div>
                                                                <select
                                                                    value={mappings[type][name] || ""}
                                                                    onChange={(e) =>
                                                                        setMappings((prev) => ({
                                                                            ...prev,
                                                                            [type]: { ...prev[type], [name]: e.target.value },
                                                                        }))
                                                                    }
                                                                    className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 min-w-[280px]"
                                                                >
                                                                    <option value="">-- เลือก --</option>
                                                                    <option value="create">+ สร้างใหม่ "{name}"</option>
                                                                    <optgroup label="จับคู่กับของเดิม">
                                                                        {lookupOptions(type).map((o) => (
                                                                            <option key={o.id} value={o.id}>
                                                                                {o.label}
                                                                            </option>
                                                                        ))}
                                                                    </optgroup>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                    )}
                                </div>
                            )}

                            {/* Preview rows */}
                            <div className="glass-card rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-violet-50 sticky top-0">
                                            <tr>
                                                <th className="p-2">#</th>
                                                <th className="p-2">สถานะ</th>
                                                <th className="p-2">EMID</th>
                                                <th className="p-2 text-left">ชื่อ - สกุล</th>
                                                <th className="p-2">ตำแหน่ง</th>
                                                <th className="p-2">ระดับ</th>
                                                <th className="p-2">กอง</th>
                                                <th className="p-2">ฝ่าย</th>
                                                <th className="p-2">สายงาน</th>
                                                <th className="p-2">วันเกิด</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.rows.map((r) => {
                                                const s = STATUS_STYLES[r.status];
                                                const Icon = s.icon;
                                                return (
                                                    <tr key={r.row_no} className="border-t hover:bg-violet-50/30">
                                                        <td className="p-2 text-center text-gray-500">{r.row_no}</td>
                                                        <td className="p-2">
                                                            <span
                                                                className={cn(
                                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
                                                                    s.color
                                                                )}
                                                            >
                                                                <Icon className="w-3 h-3" />
                                                                {s.label}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 text-center font-mono">{r.emid}</td>
                                                        <td className="p-2">
                                                            {r.prename}
                                                            {r.fname} {r.lname}
                                                        </td>
                                                        <td className="p-2">
                                                            {r.position}
                                                            {!r.position_id && <Badge>ใหม่</Badge>}
                                                        </td>
                                                        <td className="p-2 text-center">{r.grade}</td>
                                                        <td className="p-2">
                                                            {r.department}
                                                            {!r.department_id && <Badge>ใหม่</Badge>}
                                                        </td>
                                                        <td className="p-2">
                                                            {r.faction}
                                                            {!r.faction_id && <Badge>ใหม่</Badge>}
                                                        </td>
                                                        <td className="p-2">
                                                            {r.division}
                                                            {!r.division_id && <Badge>ใหม่</Badge>}
                                                        </td>
                                                        <td className="p-2 text-center text-gray-600">{r.birthdate ?? "-"}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between gap-3">
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
                                <button
                                    onClick={handleExecute}
                                    disabled={loading || preview.summary.ok + preview.summary.missing_lookup === 0}
                                    className="px-8 py-2.5 gradient-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg"
                                >
                                    {loading ? "กำลังนำเข้า..." : "ยืนยันนำเข้า"}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && result && (
                        <div className="glass-card rounded-2xl p-8 space-y-6">
                            <div className="text-center space-y-3">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                                <h2 className="text-2xl font-bold text-gradient-primary">นำเข้าสำเร็จ</h2>
                                <div className="flex justify-center gap-6 text-sm">
                                    <span className="text-emerald-600">
                                        ✓ สร้างใหม่: <b>{result.created}</b> ราย
                                    </span>
                                    <span className="text-gray-500">
                                        — ข้าม: <b>{result.skipped}</b> ราย
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
                                <h3 className="font-semibold mb-2">รายละเอียด</h3>
                                <ul className="text-xs space-y-1 font-mono">
                                    {result.details.map((d, i) => (
                                        <li key={i} className={d.startsWith("แถว") && d.includes("✓") ? "text-emerald-700" : "text-gray-600"}>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
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
                                    onClick={() => router.visit(route("admin.users.index"))}
                                    className="px-8 py-2.5 gradient-primary text-white rounded-xl font-semibold"
                                >
                                    ไปหน้ารายชื่อ →
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
    };
    return (
        <div className={cn("rounded-xl border-2 p-4 text-center", colorMap[color])}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs mt-1">{label}</div>
        </div>
    );
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="ml-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">
            {children}
        </span>
    );
}
