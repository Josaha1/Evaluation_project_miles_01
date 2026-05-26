import React from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Network, Save, ArrowLeft } from "lucide-react";

interface PageProps {
    mode: "create" | "edit";
    division?: { id: number; name: string };
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

export default function AdminDivisionForm() {
    const { mode, division } = usePage<PageProps>().props;

    const { data, setData, post, put, processing, errors } = useForm({
        name: division?.name || "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "edit" && division) {
            put(route("admin.divisions.update", { division: division.id }), {
                onSuccess: () => toast.success("แก้ไขสายงานเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        } else {
            post(route("admin.divisions.store"), {
                onSuccess: () => toast.success("เพิ่มสายงานเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        }
    };

    return (
        <MainLayout
            title={mode === "edit" ? "แก้ไขสายงาน" : "เพิ่มสายงาน"}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการสายงาน", href: route("admin.divisions.index") },
                        { label: mode === "edit" ? "แก้ไข" : "เพิ่มใหม่", active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-2xl mx-auto px-2 sm:px-6 py-10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 space-y-6">
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25">
                                <Network className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">
                                {mode === "edit" ? "แก้ไขสายงาน" : "เพิ่มสายงานใหม่"}
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ชื่อสายงาน</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="กรอกชื่อสายงาน"
                                    className="rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-all"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                )}
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex justify-end gap-3">
                                <a
                                    href={route("admin.divisions.index")}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    ยกเลิก
                                </a>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2 gradient-primary text-white rounded-xl font-medium",
                                        "hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    <Save className="w-4 h-4" />
                                    {mode === "edit" ? "บันทึกการแก้ไข" : "บันทึก"}
                                </button>
                            </motion.div>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    );
}
