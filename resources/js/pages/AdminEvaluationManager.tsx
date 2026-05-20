import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { useEffect } from "react";
import { Pencil, Trash2, PlusCircle, Eye, ClipboardList } from "lucide-react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Evaluation {
    id: number;
    title: string;
    description?: string;
    user_type: string;
    parts_count?: number;
    created_at: string;
    status: string;
}

export default function AdminEvaluationManager() {
    const { evaluations, flash } = usePage<{
        evaluations: Evaluation[];
        flash: any;
    }>().props;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const handleDelete = (id: number) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแบบประเมินนี้?")) {
            router.delete(route("evaluations.destroy", { evaluation: id }));
        }
    };

    return (
        <MainLayout
            title="จัดการแบบประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        {
                            label: "แดชบอร์ดผู้ดูแลระบบ",
                            href: route("admindashboard"),
                        },
                        { label: "รายการแบบประเมิน", active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                            <div className="p-2 gradient-primary rounded-xl">
                                <ClipboardList className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-gradient-primary">รายการแบบประเมิน</span>
                        </h1>
                        <a
                            href={route("evaluations.create")}
                            className="inline-flex items-center px-5 py-2 gradient-primary text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            สร้างแบบประเมินใหม่
                        </a>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="glass-card rounded-2xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="gradient-primary text-white">
                                    <tr>
                                        <th className="p-4 text-left font-semibold">ชื่อแบบประเมิน</th>
                                        <th className="p-4 text-left font-semibold">ประเภท</th>
                                        <th className="p-4 text-left font-semibold">จำนวนส่วน</th>
                                        <th className="p-4 text-left font-semibold">วันที่สร้าง</th>
                                        <th className="p-4 text-left font-semibold">สถานะ</th>
                                        <th className="p-4 text-center font-semibold">การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evaluations.map((evalItem, index) => (
                                        <motion.tr
                                            key={evalItem.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-t dark:border-gray-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors"
                                        >
                                            <td className="p-4 text-gray-800 dark:text-white font-medium">
                                                {evalItem.title}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {evalItem.user_type}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {evalItem.parts_count ?? "-"}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                {new Date(evalItem.created_at).toLocaleDateString("th-TH")}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                                                        evalItem.status === "published"
                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    )}
                                                >
                                                    {evalItem.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                route("evaluations.preview", { evaluation: evalItem.id })
                                                            )
                                                        }
                                                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                                                        title="ดูตัวอย่างแบบประเมิน"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                route("evaluations.edit", { evaluation: evalItem.id })
                                                            )
                                                        }
                                                        className="p-2 rounded-lg text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(evalItem.id)}
                                                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {evaluations.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center p-12 text-gray-500 dark:text-gray-400">
                                                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p className="text-lg">ไม่มีรายการแบบประเมิน</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
