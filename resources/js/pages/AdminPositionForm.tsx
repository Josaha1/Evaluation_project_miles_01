import React, { useEffect, useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import Select from "react-select";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Briefcase, Save, ArrowLeft } from "lucide-react";

interface Department {
    id: number;
    name: string;
    division?: { id: number; name: string };
}

interface PageProps {
    mode: "create" | "edit";
    position?: { id: number; title: string; department_id: number };
    departments: Department[];
}

const isDarkMode = () => document.documentElement.classList.contains("dark");

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

export default function AdminPositionForm() {
    const { mode, position, departments } = usePage<PageProps>().props;
    const [darkMode, setDarkMode] = useState(isDarkMode());

    const { data, setData, post, put, processing, errors } = useForm({
        title: position?.title || "",
        department_id: position?.department_id?.toString() || "",
    });

    useEffect(() => {
        const observer = new MutationObserver(() => setDarkMode(isDarkMode()));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const selectTheme = (theme: any) => ({
        ...theme,
        borderRadius: 12,
        colors: {
            ...theme.colors,
            primary: "#7c3aed",
            primary25: "#ede9fe",
            neutral0: darkMode ? "#1f2937" : "#fff",
            neutral5: darkMode ? "#374151" : "#f3f4f6",
            neutral10: darkMode ? "#4b5563" : "#e5e7eb",
            neutral20: darkMode ? "#6b7280" : "#e5e7eb",
            neutral30: darkMode ? "#9ca3af" : "#9ca3af",
            neutral80: darkMode ? "#f9fafb" : "#111827",
        },
    });

    const selectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            borderColor: state.isFocused ? "#7c3aed" : darkMode ? "#4b5563" : "#e5e7eb",
            borderWidth: "2px",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            boxShadow: state.isFocused ? "0 0 0 2px rgba(124, 58, 237, 0.2)" : "none",
            "&:hover": { borderColor: "#7c3aed" },
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            borderRadius: "0.75rem",
            border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: darkMode ? "#f9fafb" : "#111827",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? "#7c3aed" : state.isFocused ? (darkMode ? "#374151" : "#f5f3ff") : "transparent",
            color: state.isSelected ? "#fff" : darkMode ? "#f9fafb" : "#111827",
            cursor: "pointer",
            borderRadius: "0.5rem",
            margin: "2px 4px",
            width: "calc(100% - 8px)",
        }),
        group: (base: any) => ({
            ...base,
            paddingTop: 0,
            paddingBottom: 0,
        }),
        groupHeading: (base: any) => ({
            ...base,
            color: darkMode ? "#9ca3af" : "#6b7280",
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "none" as const,
        }),
    };

    // Group departments by division
    const groupedOptions: { label: string; options: { value: string; label: string }[] }[] = [];
    const grouped: { [key: string]: { value: string; label: string }[] } = {};
    departments.forEach((dept) => {
        const divName = dept.division?.name || "ไม่ระบุสายงาน";
        if (!grouped[divName]) grouped[divName] = [];
        grouped[divName].push({ value: dept.id.toString(), label: dept.name });
    });
    Object.entries(grouped).forEach(([label, options]) => {
        groupedOptions.push({ label, options });
    });

    const allOptions = departments.map((d) => ({ value: d.id.toString(), label: d.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "edit" && position) {
            put(route("admin.positions.update", { position: position.id }), {
                onSuccess: () => toast.success("แก้ไขตำแหน่งเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        } else {
            post(route("admin.positions.store"), {
                onSuccess: () => toast.success("เพิ่มตำแหน่งเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        }
    };

    return (
        <MainLayout
            title={mode === "edit" ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่ง"}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการตำแหน่ง", href: route("admin.positions.index") },
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
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">
                                {mode === "edit" ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ชื่อตำแหน่ง</Label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => setData("title", e.target.value)}
                                    placeholder="กรอกชื่อตำแหน่ง"
                                    className="rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-all"
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                )}
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">หน่วยงาน (Department)</Label>
                                <Select
                                    options={groupedOptions}
                                    value={allOptions.find((o) => o.value === data.department_id) || null}
                                    onChange={(opt) => setData("department_id", opt?.value || "")}
                                    isClearable
                                    placeholder="เลือกหน่วยงาน..."
                                    theme={selectTheme}
                                    styles={selectStyles}
                                />
                                {errors.department_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.department_id}</p>
                                )}
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex justify-end gap-3">
                                <a
                                    href={route("admin.positions.index")}
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
