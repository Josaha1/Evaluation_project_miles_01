import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { useMemo, useState } from "react";
import axios from "axios";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Change = {
    old: string | number | null;
    new: string | number | null;
    old_label: string | null;
    new_label: string | null;
};

type Blocked = {
    current_label: string | null;
    excel_value: string;
    reason: string;
};

type Diff = {
    user_id: number;
    emid: string;
    name: string;
    sheet: string;
    row_no: number;
    changes: Record<string, Change>;
    blocked: Record<string, Blocked>;
};

type PreviewResponse = {
    diffs: Diff[];
    not_found: string[];
    missing_lookups: {
        divisions: string[];
        departments: string[];
        factions: string[];
        positions: string[];
    };
    summary: {
        total_excel: number;
        total_changed: number;
        total_blocked: number;
        total_with_blocked: number;
        total_unchanged: number;
        total_not_found: number;
    };
};

type LookupItem = { id: number; name?: string; title?: string };
type Lookups = {
    divisions: LookupItem[];
    departments: LookupItem[];
    factions: LookupItem[];
    positions: LookupItem[];
};

type BlockedAction = {
    user_id: number;
    field: string;
    action: "create" | "map" | "skip";
    excel_value: string;
    target_id?: number | null;
};

const FIELD_TO_LOOKUP: Record<string, keyof Lookups> = {
    department_id: "departments",
    faction_id: "factions",
    division_id: "divisions",
    position_id: "positions",
};

const FIELD_LABEL: Record<string, string> = {
    prename: "คำนำหน้า",
    fname: "ชื่อ",
    lname: "นามสกุล",
    grade: "ระดับ",
    position_id: "ตำแหน่ง",
    department_id: "กอง",
    faction_id: "ฝ่าย",
    division_id: "สายงาน",
};

export default function AdminUserReconcile({ lookups }: { lookups: Lookups }) {
    const [files, setFiles] = useState<File[]>([]);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [preview, setPreview] = useState<PreviewResponse | null>(null);
    const [approvals, setApprovals] = useState<Record<number, Set<string>>>({});
    // Per (user_id, field) blocked-action choice
    const [blockedActions, setBlockedActions] = useState<Record<string, BlockedAction>>({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        batch_id: string;
        updated_users: number;
        logged_changes: number;
        created_orgs: { departments: number; factions: number; divisions: number; positions: number };
        details: string[];
    } | null>(null);

    const blockedKey = (uid: number, field: string) => `${uid}|${field}`;

    const handleFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        const valid = Array.from(fileList).filter(f => /\.(xlsx|xls)$/i.test(f.name));
        if (valid.length !== fileList.length) {
            toast.error("รับเฉพาะไฟล์ .xlsx / .xls");
        }
        setFiles(valid);
    };

    const handlePreview = async () => {
        if (files.length === 0) {
            toast.error("เลือกไฟล์ก่อน");
            return;
        }
        setLoading(true);
        const fd = new FormData();
        files.forEach(f => fd.append("files[]", f));
        try {
            const res = await axios.post(route("admin.users.reconcile.preview"), fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const data = res.data as PreviewResponse;
            setPreview(data);
            // pre-select all changed fields + blocked fields by default
            const init: Record<number, Set<string>> = {};
            const initBlocked: Record<string, BlockedAction> = {};
            data.diffs.forEach(d => {
                const fields = new Set([...Object.keys(d.changes), ...Object.keys(d.blocked || {})]);
                init[d.user_id] = fields;
                Object.entries(d.blocked || {}).forEach(([field, b]) => {
                    initBlocked[blockedKey(d.user_id, field)] = {
                        user_id: d.user_id,
                        field,
                        action: "skip",
                        excel_value: b.excel_value,
                        target_id: null,
                    };
                });
            });
            setApprovals(init);
            setBlockedActions(initBlocked);
            setStep(2);
            const blockedCount = data.summary.total_with_blocked || 0;
            toast.success(
                `พบการเปลี่ยนแปลง ${data.summary.total_changed} ราย${blockedCount ? ` + ${blockedCount} blocked (ต้องสร้าง org)` : ""}`
            );
        } catch (e: any) {
            toast.error(e.response?.data?.error || "อ่านไฟล์ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const toggleField = (userId: number, field: string) => {
        setApprovals(prev => {
            const set = new Set(prev[userId] ?? []);
            if (set.has(field)) set.delete(field);
            else set.add(field);
            return { ...prev, [userId]: set };
        });
    };

    const toggleAllForUser = (userId: number, fields: string[], on: boolean) => {
        setApprovals(prev => ({ ...prev, [userId]: new Set(on ? fields : []) }));
    };

    const approveAll = () => {
        if (!preview) return;
        const all: Record<number, Set<string>> = {};
        preview.diffs.forEach(d => { all[d.user_id] = new Set(Object.keys(d.changes)); });
        setApprovals(all);
    };

    const rejectAll = () => {
        if (!preview) return;
        const none: Record<number, Set<string>> = {};
        preview.diffs.forEach(d => { none[d.user_id] = new Set(); });
        setApprovals(none);
    };

    const totalApprovedFields = useMemo(() => {
        return Object.values(approvals).reduce((sum, s) => sum + s.size, 0);
    }, [approvals]);

    const handleApply = async () => {
        if (!preview) return;
        const payload = preview.diffs
            .map(d => ({ user_id: d.user_id, fields: Array.from(approvals[d.user_id] ?? []) }))
            .filter(a => a.fields.length > 0);

        if (payload.length === 0) {
            toast.error("ยังไม่ได้เลือกการเปลี่ยนแปลงใด");
            return;
        }

        // Build blocked_actions payload — only fields that user approved AND have non-skip action
        const blockedPayload = Object.values(blockedActions).filter(ba => {
            if (ba.action === "skip") return false;
            const userApproved = approvals[ba.user_id]?.has(ba.field);
            if (!userApproved) return false;
            if (ba.action === "map" && !ba.target_id) return false;
            return true;
        });

        const createCount = blockedPayload.filter(b => b.action === "create").length;
        const mapCount = blockedPayload.filter(b => b.action === "map").length;
        let confirmMsg = `ยืนยันอัปเดต ${payload.length} ราย (${totalApprovedFields} fields)?`;
        if (createCount) confirmMsg += `\nจะสร้าง org ใหม่ ${createCount} รายการ`;
        if (mapCount) confirmMsg += `\nMap กับ org ที่มี ${mapCount} รายการ`;
        if (!confirm(confirmMsg)) return;

        setLoading(true);
        try {
            const res = await axios.post(route("admin.users.reconcile.execute"), {
                diffs: preview.diffs,
                approvals: payload,
                blocked_actions: blockedPayload,
            });
            setResult(res.data);
            setStep(3);
            toast.success(`อัปเดต ${res.data.updated_users} ราย เรียบร้อย`);
        } catch (e: any) {
            toast.error(e.response?.data?.error || "อัปเดตไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const updateBlockedAction = (userId: number, field: string, patch: Partial<BlockedAction>) => {
        setBlockedActions(prev => {
            const k = blockedKey(userId, field);
            const existing = prev[k] ?? { user_id: userId, field, action: "skip", excel_value: "" };
            return { ...prev, [k]: { ...existing, ...patch } };
        });
    };

    const lookupItemsFor = (field: string): LookupItem[] => {
        const key = FIELD_TO_LOOKUP[field];
        return key ? lookups[key] : [];
    };
    const lookupLabelOf = (field: string, item: LookupItem) =>
        field === "position_id" ? (item.title ?? "") : (item.name ?? "");

    const handleRollback = async () => {
        if (!result?.batch_id) return;
        if (!confirm("ย้อนกลับการเปลี่ยนแปลงครั้งนี้ทั้งหมด?")) return;
        setLoading(true);
        try {
            const res = await axios.post(route("admin.users.reconcile.rollback"), {
                batch_id: result.batch_id,
            });
            toast.success(`ย้อนกลับ ${res.data.reverted_users} ราย`);
            reset();
        } catch (e: any) {
            toast.error(e.response?.data?.error || "ย้อนกลับไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFiles([]); setPreview(null); setApprovals({}); setResult(null); setStep(1);
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
                <Breadcrumb items={[
                    { label: "Admin", href: "/dashboardadmin" },
                    { label: "ผู้ใช้", href: "/admin/users" },
                    { label: "ปรับปรุงข้อมูลปี 2569" },
                ]} />

                <div className="glass-card rounded-2xl p-6">
                    <h1 className="text-2xl font-bold text-violet-700 dark:text-violet-300 mb-2">
                        ปรับปรุงข้อมูลผู้ใช้ปี 2569
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        เปรียบเทียบไฟล์ Excel ปัจจุบันกับฐานข้อมูล แล้วเลือกการเปลี่ยนแปลงที่ต้องการอัปเดต
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-3 text-sm">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full",
                            s === step ? "bg-violet-600 text-white" :
                            s < step ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        )}>
                            <span className="font-bold">{s}</span>
                            <span>{s === 1 ? "อัปโหลด" : s === 2 ? "ตรวจ + เลือก" : "เสร็จสิ้น"}</span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <label className="block">
                            <div className="border-2 border-dashed border-violet-300 rounded-xl p-8 text-center hover:bg-violet-50/50 cursor-pointer transition">
                                <Upload className="w-10 h-10 mx-auto text-violet-500 mb-2" />
                                <div className="font-medium">เลือกไฟล์ Excel (เลือกหลายไฟล์ได้)</div>
                                <div className="text-xs text-gray-500 mt-1">.xlsx / .xls</div>
                                <input
                                    type="file"
                                    multiple
                                    accept=".xlsx,.xls"
                                    onChange={(e) => handleFiles(e.target.files)}
                                    className="hidden"
                                />
                            </div>
                        </label>

                        {files.length > 0 && (
                            <div className="space-y-1">
                                {files.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                        <span>{f.name}</span>
                                        <span className="text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handlePreview}
                            disabled={files.length === 0 || loading}
                            className="w-full px-6 py-3 gradient-primary text-white rounded-xl font-medium disabled:opacity-50"
                        >
                            {loading ? "กำลังวิเคราะห์..." : "วิเคราะห์ความเปลี่ยนแปลง"}
                            <ArrowRight className="w-4 h-4 inline ml-2" />
                        </button>
                    </div>
                )}

                {/* Step 2: Preview + Approve */}
                {step === 2 && preview && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="แถวใน Excel" value={preview.summary.total_excel} color="violet" />
                            <StatCard label="พบการเปลี่ยนแปลง" value={preview.summary.total_changed} color="amber" />
                            <StatCard label="ไม่เปลี่ยน" value={preview.summary.total_unchanged} color="emerald" />
                            <StatCard label="ไม่พบ user" value={preview.summary.total_not_found} color="red" />
                        </div>

                        {Object.values(preview.missing_lookups).flat().length > 0 && (
                            <div className="glass-card rounded-xl p-4 border-l-4 border-amber-400 bg-amber-50/50">
                                <div className="flex items-center gap-2 font-medium text-amber-800 mb-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Lookup ที่หาไม่เจอ — Field ที่อ้างอิงเหล่านี้จะถูกข้าม
                                </div>
                                <div className="text-xs space-y-1">
                                    {(["divisions", "departments", "factions", "positions"] as const).map(k =>
                                        preview.missing_lookups[k].length > 0 && (
                                            <div key={k}>
                                                <strong>{k}:</strong> {preview.missing_lookups[k].join(", ")}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {preview.diffs.length === 0 ? (
                            <div className="glass-card rounded-xl p-12 text-center">
                                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                                <div className="font-medium">ไม่มีข้อมูลที่ต้องอัปเดต</div>
                                <div className="text-sm text-gray-500">DB ตรงกับ Excel แล้ว</div>
                                <button onClick={reset} className="mt-4 px-4 py-2 bg-gray-100 rounded-xl">เริ่มใหม่</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap gap-2 sticky top-0 bg-white/80 backdrop-blur p-3 rounded-xl z-10">
                                    <button onClick={approveAll} className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg">
                                        ✓ เลือกทั้งหมด
                                    </button>
                                    <button onClick={rejectAll} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg">
                                        ✗ ยกเลิกทั้งหมด
                                    </button>
                                    <div className="flex-1 text-sm text-gray-600 self-center">
                                        เลือกแล้ว <strong>{totalApprovedFields}</strong> field
                                    </div>
                                    <button onClick={reset} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg">เริ่มใหม่</button>
                                    <button
                                        onClick={handleApply}
                                        disabled={totalApprovedFields === 0 || loading}
                                        className="px-4 py-1.5 text-sm gradient-primary text-white rounded-lg disabled:opacity-50"
                                    >
                                        {loading ? "กำลังอัปเดต..." : `ยืนยันอัปเดต ${totalApprovedFields}`}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {preview.diffs.map(d => {
                                        const changeFields = Object.keys(d.changes);
                                        const blockedFields = Object.keys(d.blocked || {});
                                        const allFields = [...changeFields, ...blockedFields];
                                        const approvedSet = approvals[d.user_id] ?? new Set();
                                        const allApproved = approvedSet.size === allFields.length;
                                        return (
                                            <div key={d.user_id} className="glass-card rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <div className="font-medium">
                                                            <span className="font-mono text-xs text-gray-500">{d.emid}</span>
                                                            {" "}{d.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            จาก sheet "{d.sheet}" แถว {d.row_no}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleAllForUser(d.user_id, allFields, !allApproved)}
                                                        className={cn(
                                                            "text-xs px-2 py-1 rounded",
                                                            allApproved ? "bg-emerald-100 text-emerald-700" : "bg-gray-100"
                                                        )}
                                                    >
                                                        {allApproved ? "เลือกแล้วทั้งหมด" : "เลือกทั้งคน"}
                                                    </button>
                                                </div>

                                                {/* Auto-applicable changes */}
                                                <div className="space-y-1.5 text-sm">
                                                    {changeFields.map(field => {
                                                        const c = d.changes[field];
                                                        const isApproved = approvedSet.has(field);
                                                        return (
                                                            <label
                                                                key={field}
                                                                className={cn(
                                                                    "flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-violet-50/50",
                                                                    isApproved && "bg-emerald-50/50"
                                                                )}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isApproved}
                                                                    onChange={() => toggleField(d.user_id, field)}
                                                                    className="mt-1"
                                                                />
                                                                <div className="flex-1">
                                                                    <span className="font-medium text-gray-700">{FIELD_LABEL[field] ?? field}: </span>
                                                                    <span className="line-through text-red-500">{c.old_label ?? c.old ?? "(ว่าง)"}</span>
                                                                    <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" />
                                                                    <span className="text-emerald-600 font-medium">{c.new_label ?? c.new}</span>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>

                                                {/* Blocked changes — need create or map */}
                                                {blockedFields.length > 0 && (
                                                    <div className="mt-2 space-y-2 border-l-4 border-amber-300 pl-3 bg-amber-50/30 rounded-r p-2">
                                                        {blockedFields.map(field => {
                                                            const b = d.blocked[field];
                                                            const isApproved = approvedSet.has(field);
                                                            const ba = blockedActions[blockedKey(d.user_id, field)];
                                                            const items = lookupItemsFor(field);
                                                            return (
                                                                <div key={field} className="text-sm">
                                                                    <label className={cn(
                                                                        "flex items-start gap-2 p-1 rounded cursor-pointer",
                                                                        isApproved && "bg-amber-100/50"
                                                                    )}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isApproved}
                                                                            onChange={() => toggleField(d.user_id, field)}
                                                                            className="mt-1"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <div>
                                                                                <span className="font-medium text-amber-700">⚠ {FIELD_LABEL[field] ?? field}: </span>
                                                                                <span className="line-through text-gray-500">{b.current_label ?? "(ว่าง)"}</span>
                                                                                <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" />
                                                                                <span className="text-amber-700 font-medium">{b.excel_value}</span>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 italic">
                                                                                ⓘ ชื่อ "{b.excel_value}" ไม่อยู่ในระบบ — เลือกการดำเนินการ:
                                                                            </div>
                                                                        </div>
                                                                    </label>

                                                                    {isApproved && (
                                                                        <div className="ml-7 mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                                            <select
                                                                                value={ba?.action ?? "skip"}
                                                                                onChange={e => updateBlockedAction(d.user_id, field, {
                                                                                    action: e.target.value as BlockedAction["action"],
                                                                                    target_id: null,
                                                                                })}
                                                                                className="px-2 py-1 border rounded"
                                                                            >
                                                                                <option value="skip">— ข้าม (ไม่อัปเดต field นี้)</option>
                                                                                <option value="create">+ สร้างใหม่ "{b.excel_value}"</option>
                                                                                <option value="map">→ Map กับที่มีในระบบ</option>
                                                                            </select>

                                                                            {ba?.action === "map" && (
                                                                                <select
                                                                                    value={ba.target_id ?? ""}
                                                                                    onChange={e => updateBlockedAction(d.user_id, field, {
                                                                                        target_id: e.target.value ? Number(e.target.value) : null,
                                                                                    })}
                                                                                    className="px-2 py-1 border rounded flex-1 min-w-[200px]"
                                                                                >
                                                                                    <option value="">— เลือก —</option>
                                                                                    {items.map(it => (
                                                                                        <option key={it.id} value={it.id}>{lookupLabelOf(field, it)}</option>
                                                                                    ))}
                                                                                </select>
                                                                            )}

                                                                            {ba?.action === "create" && (
                                                                                <span className="text-emerald-600 inline-flex items-center gap-1">
                                                                                    <Plus className="w-3 h-3" />
                                                                                    จะสร้างเมื่อกดยืนยัน
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Step 3: Result */}
                {step === 3 && result && (
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <div className="text-center">
                            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-2" />
                            <h2 className="text-xl font-bold">อัปเดตเรียบร้อย</h2>
                            <div className="text-gray-600 text-sm">
                                อัปเดต <strong className="text-emerald-600">{result.updated_users}</strong> ราย
                                ({result.logged_changes} field)
                            </div>
                            {result.created_orgs && (
                                Object.values(result.created_orgs).some(n => n > 0) && (
                                    <div className="text-xs text-violet-600 mt-1">
                                        สร้าง org ใหม่:
                                        {result.created_orgs.divisions > 0 && ` สายงาน ${result.created_orgs.divisions}`}
                                        {result.created_orgs.departments > 0 && ` กอง ${result.created_orgs.departments}`}
                                        {result.created_orgs.factions > 0 && ` ฝ่าย ${result.created_orgs.factions}`}
                                        {result.created_orgs.positions > 0 && ` ตำแหน่ง ${result.created_orgs.positions}`}
                                    </div>
                                )
                            )}
                            <div className="text-xs text-gray-400 mt-2 font-mono">
                                Batch ID: {result.batch_id}
                            </div>
                        </div>

                        <div className="border rounded-lg p-3 max-h-80 overflow-y-auto text-sm font-mono space-y-0.5">
                            {result.details.map((d, i) => <div key={i}>{d}</div>)}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={reset} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl">
                                เริ่มใหม่
                            </button>
                            <button
                                onClick={handleRollback}
                                disabled={loading}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl"
                            >
                                <RefreshCw className="w-4 h-4 inline mr-1" />
                                ย้อนกลับ batch นี้
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    const colors: Record<string, string> = {
        violet: "bg-violet-50 text-violet-700",
        amber: "bg-amber-50 text-amber-700",
        emerald: "bg-emerald-50 text-emerald-700",
        red: "bg-red-50 text-red-700",
    };
    return (
        <div className={cn("glass-card rounded-xl p-3 text-center", colors[color])}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs">{label}</div>
        </div>
    );
}
