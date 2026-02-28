import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";

interface Department {
    id: number;
    name: string;
    division?: { id: number; name: string };
}

interface Position {
    id: number;
    title: string;
    department_id: number;
    department?: Department;
    users_count: number;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export default function AdminPositionIndex() {
    const { positions, departments, filters } = usePage<{
        positions: Paginated<Position>;
        departments: Department[];
        filters: { search: string; department_id: string };
    }>().props;

    const [search, setSearch] = useState(filters.search || "");
    const [departmentId, setDepartmentId] = useState(filters.department_id || "");
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                route("admin.positions.index"),
                { search, department_id: departmentId || undefined },
                { preserveState: true, replace: true }
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, departmentId]);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleDelete = (id: number) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งนี้?")) {
            router.delete(route("admin.positions.destroy", { position: id }));
        }
    };

    // Group departments by division for the filter dropdown
    const groupedDepartments: { [divisionName: string]: Department[] } = {};
    departments.forEach((dept) => {
        const divName = dept.division?.name || "ไม่ระบุสายงาน";
        if (!groupedDepartments[divName]) groupedDepartments[divName] = [];
        groupedDepartments[divName].push(dept);
    });

    return (
        <MainLayout
            title="จัดการตำแหน่ง"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการตำแหน่ง", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        จัดการตำแหน่ง (Position)
                    </h1>
                    <div className="flex gap-3 flex-wrap">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ค้นหาตำแหน่ง..."
                            className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white"
                        />
                        <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            className="border rounded px-4 py-2 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="">ทุกหน่วยงาน</option>
                            {Object.entries(groupedDepartments).map(([divName, depts]) => (
                                <optgroup key={divName} label={divName}>
                                    {depts.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <a
                            href={route("admin.positions.create")}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            เพิ่มตำแหน่งใหม่
                        </a>
                    </div>
                </div>

                {positions.data.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-20 border rounded bg-white dark:bg-gray-800 shadow">
                        ไม่พบข้อมูลตำแหน่ง
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                <tr>
                                    <th className="p-4 text-left">ชื่อตำแหน่ง</th>
                                    <th className="p-4 text-center">หน่วยงาน</th>
                                    <th className="p-4 text-center">สายงาน</th>
                                    <th className="p-4 text-center">จำนวนสมาชิก</th>
                                    <th className="p-4 text-center">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {positions.data.map((pos) => (
                                    <tr key={pos.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="p-4 font-medium text-gray-800 dark:text-white">
                                            {pos.title}
                                        </td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                                            {pos.department?.name ?? "-"}
                                        </td>
                                        <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                                            {pos.department?.division?.name ?? "-"}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                {pos.users_count} คน
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <a
                                                    href={route("admin.positions.edit", { position: pos.id })}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(pos.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title={pos.users_count > 0 ? "ไม่สามารถลบได้ มีสมาชิกอยู่" : "ลบ"}
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

                {positions.links.length > 1 && (
                    <div className="flex justify-end mt-6 space-x-1">
                        {positions.links.map((link, index) => (
                            <button
                                key={index}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.visit(link.url, {
                                        preserveScroll: true,
                                        preserveState: true,
                                        data: {
                                            page: new URL(link.url).searchParams.get("page"),
                                            search,
                                            department_id: departmentId || undefined,
                                        },
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
