import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Pencil, Trash2, PlusCircle, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";

interface Organization {
    id: number;
    name: string;
    description: string | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
    access_codes_count: number;
    evaluation_sessions_count: number;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function AdminExternalOrganizationIndex() {
    const { organizations, filters } = usePage<{
        organizations: Paginated<Organization>;
        filters: { search: string };
    }>().props;

    const [search, setSearch] = useState(filters.search || "");
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

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

    const handleDelete = (id: number) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบองค์กรนี้?")) {
            router.delete(route("admin.external-organizations.destroy", { external_organization: id }));
        }
    };

    return (
        <MainLayout
            title="จัดการองค์กรภายนอก"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการองค์กรภายนอก", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Building2 className="w-7 h-7" />
                        จัดการองค์กรภายนอก
                    </h1>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาองค์กร..."
                            className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white"
                        />
                        <a
                            href={route("admin.external-organizations.create")}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            เพิ่มองค์กรใหม่
                        </a>
                    </div>
                </div>

                {organizations.data.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-20 border rounded bg-white dark:bg-gray-800 shadow">
                        ไม่พบข้อมูลองค์กรภายนอก
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 text-left">ชื่อองค์กร</th>
                                    <th className="p-4 text-left">ผู้ติดต่อ</th>
                                    <th className="p-4 text-center">Access Codes</th>
                                    <th className="p-4 text-center">Sessions</th>
                                    <th className="p-4 text-center">สถานะ</th>
                                    <th className="p-4 text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {organizations.data.map((org) => (
                                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800 dark:text-white">{org.name}</div>
                                            {org.description && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">
                                                    {org.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                            {org.contact_person && <div>{org.contact_person}</div>}
                                            {org.contact_email && <div className="text-xs text-gray-500">{org.contact_email}</div>}
                                            {org.contact_phone && <div className="text-xs text-gray-500">{org.contact_phone}</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                {org.access_codes_count} codes
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                {org.evaluation_sessions_count} sessions
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                org.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                            }`}>
                                                {org.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <a
                                                    href={route("admin.external-organizations.edit", { external_organization: org.id })}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(org.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {organizations.links.length > 1 && (
                    <div className="flex justify-end mt-6 space-x-1">
                        {organizations.links.map((link, index) => (
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
