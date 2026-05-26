import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import {
    Trash2, PlusCircle, Eye, Ban, Download, KeyRound, Search,
    Users, ChevronDown, ChevronUp, Building2, RefreshCw, Upload,
    UserCheck, UserPlus, CheckCircle2, Clock, Copy,
} from "lucide-react";
import FiscalYearSelector from "@/Components/FiscalYearSelector";
import { useState, useEffect } from "react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Session {
    id: number;
    evaluator_name: string | null;
    evaluator_position: string | null;
    evaluatee_id: number;
    completed_at: string | null;
}

interface Stakeholder {
    id: number;
    sequence_no: string | null;
    organization_name: string;
    sub_group: string | null;
    contact_person: string | null;
    external_session_id: number | null;
}

interface CodeEvaluatee {
    id: number;
    evaluatee_id: number;
    evaluatee: { id: number; fname: string; lname: string; grade: number | null; prename: string | null } | null;
}

interface AccessCode {
    id: number;
    code: string;
    fiscal_year: number;
    is_used: boolean;
    use_count: number;
    max_uses: number | null;
    used_at: string | null;
    expires_at: string | null;
    organization: { id: number; name: string } | null;
    evaluatee: { id: number; fname: string; lname: string; grade: number | null; prename: string | null } | null;
    evaluation: { id: number; title: string } | null;
    sessions: Session[];
    stakeholders: Stakeholder[];
    stakeholders_count: number;
    code_evaluatees: CodeEvaluatee[];
    evaluatees_count: number;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

export default function AdminAccessCodeIndex() {
    const { codes, organizations, fiscalYears, filters, flash } = usePage<{
        codes: Paginated<AccessCode>;
        organizations: { id: number; name: string }[];
        fiscalYears: number[];
        filters: { search?: string; organization_id?: string; status?: string; fiscal_year?: string };
        flash?: { success?: string; error?: string; warning?: string };
    }>().props;

    const [search, setSearch] = useState(filters.search || "");
    const [orgFilter, setOrgFilter] = useState(filters.organization_id || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [fiscalYearFilter, setFiscalYearFilter] = useState(filters.fiscal_year || "");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get(
                route("admin.access-codes.index"),
                { search, organization_id: orgFilter, status: statusFilter, fiscal_year: fiscalYearFilter },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(t);
    }, [search, orgFilter, statusFilter, fiscalYearFilter]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (flash?.warning) toast.warning(flash.warning, { duration: 10000 });
    }, [flash]);

    const handleRevoke = (id: number) => {
        if (confirm("ยกเลิกรหัสนี้?")) router.put(route("admin.access-codes.revoke", { accessCode: id }));
    };
    const handleDelete = (id: number) => {
        if (confirm("ลบรหัสนี้ทิ้งถาวร?")) router.delete(route("admin.access-codes.destroy", { accessCode: id }));
    };
    const handleRegenerate = (id: number) => {
        if (confirm("สร้างรหัสใหม่?")) router.put(route("admin.access-codes.regenerate", { accessCode: id }));
    };
    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success("คัดลอกแล้ว");
    };

    const getStatus = (code: AccessCode) => {
        if (code.is_used) return { label: "ระงับแล้ว", color: "bg-gray-200 text-gray-600" };
        if (code.expires_at && new Date(code.expires_at) < new Date()) return { label: "หมดอายุ", color: "bg-red-100 text-red-700" };
        if (code.max_uses !== null && code.use_count >= code.max_uses) return { label: "ครบโควตา", color: "bg-orange-100 text-orange-700" };
        if (code.use_count > 0) return { label: "ใช้งานอยู่", color: "bg-blue-100 text-blue-700" };
        return { label: "พร้อมใช้", color: "bg-emerald-100 text-emerald-700" };
    };

    const progressPct = (code: AccessCode) => {
        const denom = code.max_uses ?? code.stakeholders_count ?? 0;
        if (!denom) return 0;
        return Math.min(100, Math.round((code.use_count / denom) * 100));
    };

    const selectClass = "rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 px-3 py-2 text-sm";

    return (
        <MainLayout
            title="จัดการ Access Codes"
            breadcrumb={
                <Breadcrumb items={[
                    { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                    { label: "Access Codes", active: true },
                ]} />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg">
                                <KeyRound className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gradient-primary">Access Codes</h1>
                                <p className="text-xs text-gray-500">1 รหัส = 1 กลุ่ม Stakeholder × 1 ผู้ถูกประเมิน · ผู้ประเมินภายนอกค้นหา/เลือกหน่วยงานตอน login</p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <a href={route("admin.access-codes.export", { organization_id: orgFilter })}
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 shadow-md">
                                <Download className="w-4 h-4 mr-1.5" /> Export
                            </a>
                            <a href={route("admin.stakeholders.import")}
                                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 shadow-md">
                                <Upload className="w-4 h-4 mr-1.5" /> นำเข้า Stakeholder Excel
                            </a>
                            <a href={route("admin.access-codes.create")}
                                className="inline-flex items-center px-4 py-2 gradient-primary text-white rounded-xl text-sm shadow-md hover:shadow-lg">
                                <PlusCircle className="w-4 h-4 mr-1.5" /> สร้างใหม่
                            </a>
                        </div>
                    </div>

                    {/* Concept banner */}
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-xs text-violet-900 space-y-0.5">
                        <div>💡 <b>Progress bar</b> = Sessions ที่ submit แล้ว / max_uses (จำนวน slot ของ stakeholder)</div>
                        <div>📋 คลิก expand เพื่อดูรายชื่อบริษัทที่ pre-list ไว้ + sessions ที่กรอกแล้ว</div>
                    </div>

                    {/* Filters */}
                    <div className="glass-card rounded-2xl p-3">
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ค้นหา code / ผู้ถูกประเมิน / กลุ่ม..."
                                    className={cn("pl-9 w-full", selectClass)} />
                            </div>
                            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)} className={selectClass}>
                                <option value="">ทุกกลุ่ม</option>
                                {organizations.map((org) => <option key={org.id} value={org.id}>{org.name.length > 35 ? org.name.slice(0, 35) + "…" : org.name}</option>)}
                            </select>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                                <option value="">ทุกสถานะ</option>
                                <option value="active">พร้อมใช้</option>
                                <option value="unused">ยังไม่เคยใช้</option>
                                <option value="used">ใช้ไปแล้ว ≥1 ครั้ง</option>
                                <option value="limit_reached">ครบโควตา</option>
                                <option value="expired">หมดอายุ</option>
                                <option value="revoked">ถูกระงับ</option>
                            </select>
                            <FiscalYearSelector value={fiscalYearFilter} years={fiscalYears || []}
                                onChange={(y) => setFiscalYearFilter(y)} variant="filter" showAllOption />
                        </div>
                    </div>

                    {/* List */}
                    {codes.data.length === 0 ? (
                        <div className="glass-card rounded-2xl p-16 text-center text-gray-500">
                            <KeyRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>ไม่พบ Access Code</p>
                            <p className="text-xs text-gray-400 mt-2">
                                เริ่มต้นโดย{" "}
                                <a href={route("admin.stakeholders.import")} className="text-violet-600 underline">นำเข้า Stakeholder Excel</a>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {codes.data.map((code, i) => {
                                const status = getStatus(code);
                                const isExpanded = expandedId === code.id;
                                const pct = progressPct(code);
                                const denom = code.max_uses ?? code.stakeholders_count;
                                const submitted = code.use_count;
                                const remaining = denom !== null ? Math.max(0, denom - submitted) : null;
                                return (
                                    <motion.div key={code.id}
                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="glass-card rounded-xl overflow-hidden">

                                        <div className="grid grid-cols-12 gap-3 p-3 items-center">
                                            <div className="col-span-12 md:col-span-3">
                                                <button onClick={() => copyCode(code.code)} className="flex items-center gap-1.5 group hover:underline">
                                                    <KeyRound className="w-4 h-4 text-violet-500" />
                                                    <span className="font-mono text-sm font-bold text-violet-700 break-all">{code.code}</span>
                                                    <Copy className="w-3 h-3 text-gray-300 group-hover:text-violet-500" />
                                                </button>
                                                <div className="text-[10px] text-gray-400 mt-0.5">FY {code.fiscal_year + 543}</div>
                                            </div>

                                            <div className="col-span-12 md:col-span-3">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                                    <Building2 className="w-3 h-3" />
                                                    <span className="truncate">{code.organization?.name || "-"}</span>
                                                </div>
                                                {code.evaluatee ? (
                                                    /* Legacy 1-evaluatee code */
                                                    <div className="font-semibold text-sm text-gray-900 truncate">
                                                        → {code.evaluatee.prename ?? ""}{code.evaluatee.fname} {code.evaluatee.lname}
                                                        {code.evaluatee.grade && <span className="ml-2 text-xs text-gray-400">C{code.evaluatee.grade}</span>}
                                                    </div>
                                                ) : (
                                                    /* Group-shared: list multiple evaluatees */
                                                    <div className="font-semibold text-sm text-gray-900">
                                                        → ประเมิน <span className="text-violet-700">{code.evaluatees_count} คน</span>
                                                        {code.code_evaluatees && code.code_evaluatees.length > 0 && (
                                                            <div className="text-[11px] font-normal text-gray-500 mt-0.5 line-clamp-2">
                                                                {code.code_evaluatees.slice(0, 3).map((ce) => ce.evaluatee
                                                                    ? `${ce.evaluatee.fname} ${ce.evaluatee.lname}` : null
                                                                ).filter(Boolean).join(", ")}
                                                                {code.code_evaluatees.length > 3 && ` … +${code.code_evaluatees.length - 3} คน`}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-span-8 md:col-span-3">
                                                <div className="flex items-center justify-between text-[10px] mb-1">
                                                    <span className="text-emerald-700 font-bold">✓ {submitted} submitted</span>
                                                    {remaining !== null && (
                                                        <span className={cn("font-semibold", remaining === 0 ? "text-orange-600" : "text-gray-500")}>
                                                            {remaining === 0 ? "ครบแล้ว" : `เหลือ ${remaining}`}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-2 rounded-full transition-all",
                                                            pct >= 100 ? "bg-orange-500" : pct >= 50 ? "bg-emerald-500" : "bg-violet-500"
                                                        )}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {code.stakeholders_count > 0 ? `${code.stakeholders_count} stakeholder slots` :
                                                     code.max_uses !== null ? `max ${code.max_uses}` : "ไม่จำกัด"}
                                                </div>
                                            </div>

                                            <div className="col-span-4 md:col-span-1 text-center">
                                                <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap", status.color)}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1">
                                                {(code.stakeholders_count > 0 || code.sessions.length > 0) && (
                                                    <button onClick={() => setExpandedId(isExpanded ? null : code.id)}
                                                        className="p-1.5 rounded text-blue-600 hover:bg-blue-50">
                                                        <Users className="w-4 h-4" />
                                                        {isExpanded ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />}
                                                    </button>
                                                )}
                                                <a href={route("admin.access-codes.show", { accessCode: code.id })}
                                                    className="p-1.5 rounded text-violet-600 hover:bg-violet-100" title="QR Code">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => handleRegenerate(code.id)}
                                                    className="p-1.5 rounded text-amber-600 hover:bg-amber-100" title="สร้างรหัสใหม่">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                                {!code.is_used && (
                                                    <button onClick={() => handleRevoke(code.id)}
                                                        className="p-1.5 rounded text-orange-600 hover:bg-orange-100" title="ระงับ">
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {code.use_count === 0 && (
                                                    <button onClick={() => handleDelete(code.id)}
                                                        className="p-1.5 rounded text-red-600 hover:bg-red-100" title="ลบ">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-gradient-to-br from-blue-50/50 to-violet-50/50 border-t p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs font-bold text-violet-700 mb-2 flex items-center gap-1">
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        Stakeholders ที่ pre-list ไว้ ({code.stakeholders.length})
                                                    </div>
                                                    {code.stakeholders.length === 0 ? (
                                                        <div className="text-xs text-gray-400 italic">ไม่มี — ผู้ประเมินกรอกชื่อเองตอน login</div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {code.stakeholders.map((s) => (
                                                                <div key={s.id} className="bg-white rounded-lg p-2 text-xs border border-violet-100 flex items-start gap-2">
                                                                    <span className="font-mono text-gray-400 shrink-0">{s.sequence_no || "•"}</span>
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-gray-800">{s.organization_name}</div>
                                                                        {s.contact_person && <div className="text-gray-500">👤 {s.contact_person}</div>}
                                                                        {s.sub_group && <div className="text-violet-600 mt-0.5">[{s.sub_group}]</div>}
                                                                    </div>
                                                                    {s.external_session_id && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        Sessions ที่กรอกเสร็จ ({code.sessions.length})
                                                    </div>
                                                    {code.sessions.length === 0 ? (
                                                        <div className="text-xs text-gray-400 italic">
                                                            <Clock className="w-3 h-3 inline mr-1" /> ยังไม่มีใครกรอก
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {code.sessions.map((s) => (
                                                                <div key={s.id} className="bg-white rounded-lg p-2 text-xs border border-emerald-100">
                                                                    <div className="font-semibold text-gray-800">{s.evaluator_name || "(ไม่ระบุชื่อ)"}</div>
                                                                    {s.evaluator_position && <div className="text-gray-500">{s.evaluator_position}</div>}
                                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                                        ✓ {s.completed_at ? new Date(s.completed_at).toLocaleString("th-TH") : "-"}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {codes.links.length > 1 && (
                        <div className="flex justify-end space-x-1">
                            {codes.links.map((link, i) => (
                                <button key={i} disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                                    className={cn(
                                        "px-3 py-1 rounded-xl text-sm font-medium",
                                        link.active ? "gradient-primary text-white shadow-md"
                                            : "bg-white/80 text-gray-700 hover:bg-violet-50 border border-gray-200"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
