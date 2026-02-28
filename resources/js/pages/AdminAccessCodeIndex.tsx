import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Trash2, PlusCircle, Eye, Ban, Download, Printer, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";

interface Organization {
    id: number;
    name: string;
}

interface AccessCode {
    id: number;
    code: string;
    external_organization_id: number;
    evaluatee_id: number | null;
    evaluation_id: number | null;
    fiscal_year: number;
    is_used: boolean;
    used_at: string | null;
    expires_at: string | null;
    organization: { id: number; name: string } | null;
    evaluatee: { id: number; fname: string; lname: string } | null;
    evaluation: { id: number; title: string } | null;
    session: { id: number; completed_at: string | null } | null;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function AdminAccessCodeIndex() {
    const { codes, organizations, filters } = usePage<{
        codes: Paginated<AccessCode>;
        organizations: Organization[];
        filters: { search?: string; organization_id?: string; status?: string };
    }>().props;

    const [search, setSearch] = useState(filters.search || "");
    const [orgFilter, setOrgFilter] = useState(filters.organization_id || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                route("admin.access-codes.index"),
                { search, organization_id: orgFilter, status: statusFilter },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, orgFilter, statusFilter]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleRevoke = (id: number) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิก Access Code นี้?")) {
            router.put(route("admin.access-codes.revoke", { accessCode: id }));
        }
    };

    const handleDelete = (id: number) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Access Code นี้?")) {
            router.delete(route("admin.access-codes.destroy", { accessCode: id }));
        }
    };

    const handlePrintCards = () => {
        if (selectedIds.length === 0) {
            toast.error("กรุณาเลือก Access Code ที่ต้องการพิมพ์");
            return;
        }

        // Submit as form
        const form = document.createElement("form");
        form.method = "POST";
        form.action = route("admin.access-codes.print-cards");

        // CSRF token
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
            const csrfInput = document.createElement("input");
            csrfInput.type = "hidden";
            csrfInput.name = "_token";
            csrfInput.value = csrfMeta.getAttribute("content") || "";
            form.appendChild(csrfInput);
        }

        selectedIds.forEach((id) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "code_ids[]";
            input.value = String(id);
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === codes.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(codes.data.map((c) => c.id));
        }
    };

    const getStatusBadge = (code: AccessCode) => {
        if (code.is_used && code.session?.completed_at) {
            return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">ประเมินแล้ว</span>;
        }
        if (code.is_used) {
            return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">ถูกยกเลิก</span>;
        }
        if (code.expires_at && new Date(code.expires_at) < new Date()) {
            return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">หมดอายุ</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">พร้อมใช้</span>;
    };

    return (
        <MainLayout
            title="จัดการ Access Codes"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการ Access Codes", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <KeyRound className="w-7 h-7" />
                        จัดการ Access Codes
                    </h1>
                    <div className="flex gap-3 flex-wrap">
                        <a
                            href={route("admin.access-codes.create")}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            สร้าง Code ใหม่
                        </a>
                        <a
                            href={route("admin.access-codes.export", { organization_id: orgFilter })}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Export CSV
                        </a>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหา code, ชื่อผู้ประเมิน..."
                        className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white flex-1 min-w-[200px]"
                    />
                    <select
                        value={orgFilter}
                        onChange={(e) => setOrgFilter(e.target.value)}
                        className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white"
                    >
                        <option value="">ทุกองค์กร</option>
                        {organizations.map((org) => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white"
                    >
                        <option value="">ทุกสถานะ</option>
                        <option value="unused">พร้อมใช้</option>
                        <option value="used">ใช้แล้ว</option>
                        <option value="expired">หมดอายุ</option>
                    </select>
                </div>

                {/* Bulk actions */}
                {selectedIds.length > 0 && (
                    <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center gap-4">
                        <span className="text-sm text-indigo-700 dark:text-indigo-300">
                            เลือกแล้ว {selectedIds.length} รายการ
                        </span>
                        <button
                            onClick={handlePrintCards}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                            <Printer className="w-4 h-4 mr-1" />
                            พิมพ์ QR Cards
                        </button>
                    </div>
                )}

                {codes.data.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-20 border rounded bg-white dark:bg-gray-800 shadow">
                        ไม่พบ Access Code
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === codes.data.length && codes.data.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded"
                                        />
                                    </th>
                                    <th className="p-4 text-left">Code</th>
                                    <th className="p-4 text-left">องค์กร</th>
                                    <th className="p-4 text-left">ผู้ถูกประเมิน</th>
                                    <th className="p-4 text-center">ปี</th>
                                    <th className="p-4 text-center">สถานะ</th>
                                    <th className="p-4 text-center">วันหมดอายุ</th>
                                    <th className="p-4 text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {codes.data.map((code) => (
                                    <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(code.id)}
                                                onChange={() => toggleSelect(code.id)}
                                                className="w-4 h-4 rounded"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                {code.code}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                            {code.organization?.name || "-"}
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                            {code.evaluatee
                                                ? `${code.evaluatee.fname} ${code.evaluatee.lname}`
                                                : "-"}
                                        </td>
                                        <td className="p-4 text-center text-sm">{code.fiscal_year}</td>
                                        <td className="p-4 text-center">{getStatusBadge(code)}</td>
                                        <td className="p-4 text-center text-sm text-gray-500">
                                            {code.expires_at
                                                ? new Date(code.expires_at).toLocaleDateString("th-TH")
                                                : "-"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <a
                                                    href={route("admin.access-codes.show", { accessCode: code.id })}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="ดู QR Code"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </a>
                                                {!code.is_used && (
                                                    <>
                                                        <button
                                                            onClick={() => handleRevoke(code.id)}
                                                            className="text-amber-600 hover:text-amber-800"
                                                            title="ยกเลิก"
                                                        >
                                                            <Ban className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(code.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {codes.links.length > 1 && (
                    <div className="flex justify-end mt-6 space-x-1">
                        {codes.links.map((link, index) => (
                            <button
                                key={index}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.visit(link.url, {
                                        preserveScroll: true,
                                        preserveState: true,
                                    })
                                }
                                className={`px-3 py-1 border rounded text-sm ${
                                    link.active
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-white"
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
