import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { Search, Edit2, Trash2, Building2, User as UserIcon, Phone, X, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Evaluatee {
    id: number;
    fname: string;
    lname: string;
    prename: string | null;
    grade: number;
    emid: string;
}

interface AccessCode {
    id: number;
    code: string;
    fiscal_year: number | string;
    organization?: { id: number; name: string; org_code: string | null };
}

interface Session {
    id: number;
    evaluator_name: string | null;
    evaluator_position: string | null;
    started_at: string | null;
    completed_at: string | null;
}

interface Stakeholder {
    id: number;
    fiscal_year: number;
    group_label: string;
    sub_group: string | null;
    sequence_no: string | null;
    organization_name: string;
    contact_person: string | null;
    contact_info: string | null;
    coordinator: string | null;
    code: string | null;
    source_sheet: string | null;
    source_row: number | null;
    evaluatee: Evaluatee | null;
    access_code: AccessCode | null;
    session: Session | null;
}

interface PaginatedStakeholders {
    data: Stakeholder[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    stakeholders: PaginatedStakeholders;
    fiscal_years: number[];
    group_labels: string[];
    filters: {
        fiscal_year?: string;
        evaluatee_id?: string;
        group_label?: string;
        has_session?: string;
        search?: string;
    };
}

export default function AdminStakeholderList({ stakeholders, fiscal_years, group_labels, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? "");
    const [fy, setFy] = useState(filters.fiscal_year ?? "");
    const [group, setGroup] = useState(filters.group_label ?? "");
    const [hasSession, setHasSession] = useState(filters.has_session ?? "");
    const [editing, setEditing] = useState<Stakeholder | null>(null);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

    const applyFilters = () => {
        router.get(
            route("admin.stakeholders.index"),
            { search, fiscal_year: fy, group_label: group, has_session: hasSession },
            { preserveState: true, preserveScroll: true }
        );
    };

    const clearFilters = () => {
        setSearch(""); setFy(""); setGroup(""); setHasSession("");
        router.get(route("admin.stakeholders.index"), {}, { preserveScroll: true });
    };

    const handleDelete = (s: Stakeholder) => {
        if (!confirm(`ลบ stakeholder "${s.organization_name}" ออกจากระบบ?`)) return;
        router.delete(route("admin.stakeholders.destroy", { stakeholder: s.id }), {
            preserveScroll: true,
            onSuccess: () => toast.success("ลบสำเร็จ"),
            onError: () => toast.error("ลบไม่สำเร็จ"),
        });
    };

    const evaluateeName = (e: Evaluatee | null) =>
        e ? `${e.prename ?? ""}${e.fname} ${e.lname} (g${e.grade})` : "—";

    return (
        <MainLayout
            title="รายชื่อ Stakeholders"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "รายชื่อ Stakeholders", active: true },
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
                    {/* Header */}
                    <div className="glass-card rounded-2xl p-6 flex items-start justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gradient-primary">รายชื่อ Stakeholders</h1>
                            <p className="text-xs text-gray-500 mt-1">
                                บริษัท/หน่วยงาน Stakeholder รายตัวจากการ Import Excel · {stakeholders.total.toLocaleString()} รายการ
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={route("admin.stakeholders.import")}
                                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 shadow-md"
                            >
                                + นำเข้าจาก Excel
                            </a>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                placeholder="ค้นหา ชื่อบริษัท / ผู้ติดต่อ / ผู้ถูกประเมิน / EMID..."
                                className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2"
                            />
                        </div>
                        <select
                            value={fy}
                            onChange={(e) => setFy(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                        >
                            <option value="">ทุกปีงบ</option>
                            {fiscal_years.map((y) => (
                                <option key={y} value={y}>
                                    พ.ศ. {y + 543}
                                </option>
                            ))}
                        </select>
                        <select
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                        >
                            <option value="">ทุกกลุ่ม</option>
                            {group_labels.map((g) => (
                                <option key={g} value={g}>
                                    {g.length > 30 ? g.slice(0, 30) + "…" : g}
                                </option>
                            ))}
                        </select>
                        <select
                            value={hasSession}
                            onChange={(e) => setHasSession(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                        >
                            <option value="">Session: ทั้งหมด</option>
                            <option value="yes">มี session แล้ว</option>
                            <option value="no">ยังไม่มี session</option>
                        </select>
                        <div className="md:col-span-5 flex justify-end gap-2">
                            <button onClick={clearFilters} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                                ล้าง
                            </button>
                            <button onClick={applyFilters} className="px-5 py-2 text-sm gradient-primary text-white rounded-lg font-semibold">
                                ค้นหา
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-violet-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 text-left">ผู้ถูกประเมิน</th>
                                        <th className="p-2 text-left">กลุ่ม / ประเภท</th>
                                        <th className="p-2 text-center">#</th>
                                        <th className="p-2 text-left">ชื่อหน่วยงาน/บริษัท</th>
                                        <th className="p-2 text-left">ผู้ติดต่อ</th>
                                        <th className="p-2 text-left">Code</th>
                                        <th className="p-2 text-center">Session</th>
                                        <th className="p-2 text-center">การกระทำ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stakeholders.data.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-400">
                                                ไม่พบ Stakeholder
                                            </td>
                                        </tr>
                                    )}
                                    {stakeholders.data.map((s) => (
                                        <tr key={s.id} className="border-t hover:bg-violet-50/30 align-top">
                                            <td className="p-2 text-xs">
                                                <div>{evaluateeName(s.evaluatee)}</div>
                                                <div className="text-gray-400 font-mono">
                                                    {s.evaluatee?.emid ?? "—"} · พ.ศ. {Number(s.fiscal_year) + 543}
                                                </div>
                                            </td>
                                            <td className="p-2 text-xs">
                                                <div className="font-medium">
                                                    {s.group_label.length > 30 ? s.group_label.slice(0, 30) + "…" : s.group_label}
                                                </div>
                                                {s.sub_group && (
                                                    <div className="text-violet-600 mt-0.5">
                                                        [{s.sub_group.length > 30 ? s.sub_group.slice(0, 30) + "…" : s.sub_group}]
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 text-center text-xs text-gray-500">{s.sequence_no ?? "—"}</td>
                                            <td className="p-2">
                                                <div className="flex items-start gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                                    <span className="text-xs">{s.organization_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-2 text-xs">
                                                {s.contact_person && (
                                                    <div className="flex items-center gap-1">
                                                        <UserIcon className="w-3 h-3 text-gray-400" /> {s.contact_person}
                                                    </div>
                                                )}
                                                {s.contact_info && (
                                                    <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                                                        <Phone className="w-3 h-3 text-gray-400" /> {s.contact_info}
                                                    </div>
                                                )}
                                                {!s.contact_person && !s.contact_info && <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="p-2 text-xs space-y-0.5">
                                                {s.code ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(s.code!);
                                                            toast.success("คัดลอกแล้ว");
                                                        }}
                                                        className="font-mono text-violet-700 hover:underline cursor-pointer"
                                                        title="คัดลอกรหัส (1 QR ต่อ stakeholder)"
                                                    >
                                                        {s.code}
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                                {s.access_code && (
                                                    <div className="text-[10px] text-gray-400">
                                                        legacy: <a
                                                            href={route("admin.access-codes.show", { accessCode: s.access_code.id })}
                                                            className="font-mono hover:underline"
                                                        >
                                                            {s.access_code.code}
                                                        </a>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 text-center text-xs">
                                                {s.session ? (
                                                    s.session.completed_at ? (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                                            <CheckCircle2 className="w-3 h-3" /> เสร็จ
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                                            <Clock className="w-3 h-3" /> ทำอยู่
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => setEditing(s)}
                                                        className="p-1.5 rounded hover:bg-violet-100 text-violet-600"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(s)}
                                                        className="p-1.5 rounded hover:bg-red-100 text-red-600"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {stakeholders.last_page > 1 && (
                            <div className="flex justify-center items-center gap-1 p-4 border-t flex-wrap">
                                {stakeholders.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url, { preserveScroll: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={cn(
                                            "px-3 py-1 rounded text-xs",
                                            link.active && "bg-violet-600 text-white",
                                            !link.url && "text-gray-300 cursor-not-allowed",
                                            link.url && !link.active && "text-violet-700 hover:bg-violet-100"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Edit modal */}
            {editing && (
                <EditStakeholderModal
                    stakeholder={editing}
                    onClose={() => setEditing(null)}
                    csrf={csrf()}
                />
            )}
        </MainLayout>
    );
}

function EditStakeholderModal({
    stakeholder, onClose, csrf,
}: {
    stakeholder: Stakeholder;
    onClose: () => void;
    csrf: string;
}) {
    const [form, setForm] = useState({
        organization_name: stakeholder.organization_name,
        sub_group: stakeholder.sub_group ?? "",
        sequence_no: stakeholder.sequence_no ?? "",
        contact_person: stakeholder.contact_person ?? "",
        contact_info: stakeholder.contact_info ?? "",
        coordinator: stakeholder.coordinator ?? "",
    });
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.put(
            route("admin.stakeholders.update", { stakeholder: stakeholder.id }),
            form,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("บันทึกสำเร็จ");
                    onClose();
                },
                onError: () => toast.error("บันทึกไม่สำเร็จ"),
                onFinish: () => setSaving(false),
            }
        );
    };

    const Field = ({ label, value, onChange, required = false }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h3 className="font-bold text-gradient-primary">แก้ไข Stakeholder</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="text-xs bg-violet-50 border border-violet-200 rounded-lg p-3 text-violet-800 space-y-0.5">
                        <div>📋 จาก: <b>{stakeholder.source_sheet}</b> แถว {stakeholder.source_row}</div>
                        <div>👤 ผู้ถูกประเมิน: <b>{stakeholder.evaluatee?.fname} {stakeholder.evaluatee?.lname}</b> (g{stakeholder.evaluatee?.grade})</div>
                        <div>🏷 กลุ่ม: <b>{stakeholder.group_label}</b></div>
                    </div>
                    <Field label="ชื่อหน่วยงาน/บริษัท" value={form.organization_name} onChange={(v) => setForm({ ...form, organization_name: v })} required />
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="ลำดับ" value={form.sequence_no} onChange={(v) => setForm({ ...form, sequence_no: v })} />
                        <Field label="ประเภทย่อย" value={form.sub_group} onChange={(v) => setForm({ ...form, sub_group: v })} />
                    </div>
                    <Field label="ผู้ติดต่อ" value={form.contact_person} onChange={(v) => setForm({ ...form, contact_person: v })} />
                    <Field label="เบอร์/อีเมล" value={form.contact_info} onChange={(v) => setForm({ ...form, contact_info: v })} />
                    <Field label="ผู้ประสานงาน" value={form.coordinator} onChange={(v) => setForm({ ...form, coordinator: v })} />
                </div>
                <div className="px-6 py-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
                        ยกเลิก
                    </button>
                    <button onClick={save} disabled={saving} className="px-5 py-2 gradient-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
