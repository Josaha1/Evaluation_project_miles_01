import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Pencil, Trash2, PlusCircle, Briefcase, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.07 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

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
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-7xl mx-auto px-2 sm:px-6 py-10 space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">
                                จัดการตำแหน่ง (Position)
                            </h1>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ค้นหาตำแหน่ง..."
                                    className="pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-900 dark:text-white dark:border-gray-700 transition-all"
                                />
                            </div>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="px-4 py-2 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-900 dark:text-white dark:border-gray-700 transition-all"
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
                                className="inline-flex items-center px-5 py-2 gradient-primary text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
                            >
                                <PlusCircle className="w-5 h-5 mr-2" />
                                เพิ่มตำแหน่งใหม่
                            </a>
                        </div>
                    </motion.div>

                    {/* Table or empty state */}
                    <motion.div variants={itemVariants}>
                        {positions.data.length === 0 ? (
                            <div className="glass-card rounded-2xl p-6 text-center text-gray-500 dark:text-gray-400 py-20">
                                ไม่พบข้อมูลตำแหน่ง
                            </div>
                        ) : (
                            <div className="glass-card rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                        <thead className="bg-violet-50 dark:bg-violet-900/20">
                                            <tr>
                                                <th className="p-4 text-left text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                    ชื่อตำแหน่ง
                                                </th>
                                                <th className="p-4 text-center text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                    หน่วยงาน
                                                </th>
                                                <th className="p-4 text-center text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                    สายงาน
                                                </th>
                                                <th className="p-4 text-center text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                    จำนวนสมาชิก
                                                </th>
                                                <th className="p-4 text-center text-sm font-semibold text-violet-700 dark:text-violet-300">
                                                    การจัดการ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                                            {positions.data.map((pos, index) => (
                                                <motion.tr
                                                    key={pos.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.04 }}
                                                    className="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors"
                                                >
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
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                            {pos.users_count} คน
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <a
                                                                href={route("admin.positions.edit", { position: pos.id })}
                                                                className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-900/30 transition-colors"
                                                                title="แก้ไข"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDelete(pos.id)}
                                                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                                                                title={pos.users_count > 0 ? "ไม่สามารถลบได้ มีสมาชิกอยู่" : "ลบ"}
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
                    </motion.div>

                    {/* Pagination */}
                    {positions.links.length > 1 && (
                        <motion.div variants={itemVariants} className="flex justify-end space-x-1">
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
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                        link.active
                                            ? "gradient-primary text-white shadow-md shadow-violet-500/25"
                                            : "bg-white/80 border border-gray-200 text-gray-700 hover:bg-violet-50 hover:border-violet-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-violet-900/20"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </MainLayout>
    );
}
