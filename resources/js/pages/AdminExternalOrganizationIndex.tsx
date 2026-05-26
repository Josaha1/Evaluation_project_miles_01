import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Pencil, Trash2, PlusCircle, Search, Users, KeyRound, Activity, Globe, Power } from "lucide-react";
import { useState, useEffect } from "react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Organization {
    id: number;
    name: string;
    org_code: string | null;
    description: string | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
    access_codes_count: number;
    completed_codes_count: number;
    stakeholders_count: number;
    evaluation_sessions_count: number;
    completed_sessions_count: number;
}

interface Totals {
    groups: number;
    active: number;
    codes_total: number;
    stakeholders: number;
    sessions_total: number;
    sessions_done: number;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function AdminExternalOrganizationIndex() {
    const { organizations, filters, totals } = usePage<{
        organizations: Paginated<Organization>;
        filters: { search: string };
        totals: Totals;
    }>().props;

    const [search, setSearch] = useState(filters.search || "");
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                route("admin.external-organizations.index"),
                { search },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleDelete = (id: number, name: string) => {
        if (confirm(`ลบกลุ่ม "${name}"? — ต้องไม่มี Access Code ที่ยังใช้งานได้`)) {
            router.delete(route("admin.external-organizations.destroy", { external_organization: id }));
        }
    };

    return (
        <MainLayout
            title="จัดการกลุ่ม Stakeholder"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "กลุ่ม Stakeholder", active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gradient-primary">กลุ่ม Stakeholder</h1>
                                <p className="text-xs text-gray-500">
                                    หมวดหมู่ผู้ประเมินภายนอก (เช่น คู่ค้า · ลูกค้า · ชุมชน) — ใช้เป็น parent ของ Access Codes
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ค้นหาชื่อกลุ่ม / org_code..."
                                    className="pl-9 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                                />
                            </div>
                            <a
                                href={route("admin.external-organizations.create")}
                                className="inline-flex items-center px-4 py-2 gradient-primary text-white rounded-xl text-sm shadow-md hover:shadow-lg"
                            >
                                <PlusCircle className="w-4 h-4 mr-1.5" /> เพิ่มกลุ่มใหม่
                            </a>
                        </div>
                    </motion.div>

                    {/* Summary stats */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <StatCard label="กลุ่มทั้งหมด" value={totals.groups} icon={<Globe className="w-4 h-4" />} color="violet" />
                        <StatCard label="เปิดใช้งาน" value={totals.active} icon={<Power className="w-4 h-4" />} color="emerald" />
                        <StatCard label="Access Codes" value={totals.codes_total} icon={<KeyRound className="w-4 h-4" />} color="amber" />
                        <StatCard label="Stakeholders รายชื่อ" value={totals.stakeholders} icon={<Users className="w-4 h-4" />} color="violet" />
                        <StatCard label="Sessions ทั้งหมด" value={totals.sessions_total} icon={<Activity className="w-4 h-4" />} color="blue" />
                        <StatCard label="Sessions เสร็จ" value={totals.sessions_done} icon={<Activity className="w-4 h-4" />} color="emerald" />
                    </div>

                    {/* Concept hint */}
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-xs text-violet-900">
                        💡 <b>หมายเหตุ:</b> "กลุ่ม Stakeholder" คือ <u>ประเภท</u>ผู้ประเมินภายนอก (เช่น "คู่ค้าหรือคู่ความร่วมมือ") — บริษัทรายตัวอยู่ใน
                        <a href={route("admin.stakeholders.index")} className="text-violet-700 underline mx-1">รายชื่อ Stakeholders</a>
                        · กลุ่มจะถูกสร้างอัตโนมัติเมื่อ
                        <a href={route("admin.stakeholders.import")} className="text-violet-700 underline mx-1">นำเข้าจาก Excel</a>
                    </div>

                    {/* Table */}
                    {organizations.data.length === 0 ? (
                        <div className="glass-card rounded-2xl p-16 text-center text-gray-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>ไม่พบกลุ่ม Stakeholder ตามเงื่อนไข</p>
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="gradient-primary text-white">
                                        <tr>
                                            <th className="p-3 text-left font-semibold">ชื่อกลุ่ม</th>
                                            <th className="p-3 text-center font-semibold">org_code</th>
                                            <th className="p-3 text-left font-semibold">ผู้ติดต่อกลุ่ม</th>
                                            <th className="p-3 text-center font-semibold">Codes</th>
                                            <th className="p-3 text-center font-semibold">Stakeholders</th>
                                            <th className="p-3 text-center font-semibold">Sessions เสร็จ</th>
                                            <th className="p-3 text-center font-semibold">สถานะ</th>
                                            <th className="p-3 text-center font-semibold">การกระทำ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {organizations.data.map((org, i) => (
                                            <motion.tr
                                                key={org.id}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className={cn(
                                                    "transition-colors",
                                                    org.is_active ? "hover:bg-violet-50/50" : "bg-gray-50/50 opacity-70"
                                                )}
                                            >
                                                <td className="p-3">
                                                    <div className="font-medium text-gray-800">{org.name}</div>
                                                    {org.description && (
                                                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-md">
                                                            {org.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-700">
                                                        {org.org_code ?? "—"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-gray-600">
                                                    {org.contact_person && <div>{org.contact_person}</div>}
                                                    {org.contact_email && <div className="text-gray-500">{org.contact_email}</div>}
                                                    {org.contact_phone && <div className="text-gray-500">{org.contact_phone}</div>}
                                                    {!org.contact_person && !org.contact_email && !org.contact_phone && (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <a
                                                        href={`${route("admin.access-codes.index")}?organization_id=${org.id}`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                        title="ดู Access Codes ของกลุ่มนี้"
                                                    >
                                                        <KeyRound className="w-3 h-3" />
                                                        {org.access_codes_count}
                                                    </a>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <a
                                                        href={`${route("admin.stakeholders.index")}?group_label=${encodeURIComponent(org.name)}`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200"
                                                        title="ดูรายชื่อ Stakeholders ของกลุ่มนี้"
                                                    >
                                                        <Users className="w-3 h-3" />
                                                        {org.stakeholders_count}
                                                    </a>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="text-xs">
                                                        <span className="text-emerald-700 font-semibold">{org.completed_sessions_count}</span>
                                                        <span className="text-gray-400">/{org.evaluation_sessions_count}</span>
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                                                            org.is_active
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-gray-200 text-gray-600"
                                                        )}
                                                    >
                                                        {org.is_active ? "เปิด" : "ปิด"}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <a
                                                            href={route("admin.external-organizations.edit", { external_organization: org.id })}
                                                            className="p-1.5 rounded text-violet-600 hover:bg-violet-100"
                                                            title="แก้ไข"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDelete(org.id, org.name)}
                                                            className="p-1.5 rounded text-red-600 hover:bg-red-100"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {organizations.links.length > 1 && (
                        <div className="flex justify-end space-x-1">
                            {organizations.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })
                                    }
                                    className={cn(
                                        "px-3 py-1 rounded-xl text-sm font-medium",
                                        link.active
                                            ? "gradient-primary text-white shadow-md"
                                            : "bg-white/80 text-gray-700 hover:bg-violet-50 border border-gray-200"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

function StatCard({
    label, value, icon, color,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: "violet" | "emerald" | "amber" | "blue";
}) {
    const colors = {
        violet: "bg-violet-50 text-violet-700 border-violet-200",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
        amber: "bg-amber-50 text-amber-700 border-amber-200",
        blue: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return (
        <div className={cn("rounded-xl border p-3 flex items-center gap-2.5", colors[color])}>
            <div className="opacity-70">{icon}</div>
            <div>
                <div className="text-lg font-bold leading-none">{value.toLocaleString()}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{label}</div>
            </div>
        </div>
    );
}
