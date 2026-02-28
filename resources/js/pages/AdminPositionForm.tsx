import React, { useEffect, useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import Select from "react-select";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";

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
        colors: {
            ...theme.colors,
            primary: "#6366f1",
            primary25: "#e0e7ff",
            neutral0: darkMode ? "#1f2937" : "#fff",
            neutral5: darkMode ? "#374151" : "#f3f4f6",
            neutral10: darkMode ? "#4b5563" : "#e5e7eb",
            neutral20: darkMode ? "#6b7280" : "#d1d5db",
            neutral30: darkMode ? "#9ca3af" : "#9ca3af",
            neutral80: darkMode ? "#f9fafb" : "#111827",
        },
    });

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            borderColor: darkMode ? "#4b5563" : "#d1d5db",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            borderRadius: "0.5rem",
        }),
        singleValue: (base: any) => ({
            ...base,
            color: darkMode ? "#f9fafb" : "#111827",
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? (darkMode ? "#374151" : "#f3f4f6") : "transparent",
            color: state.isSelected ? "#fff" : darkMode ? "#f9fafb" : "#111827",
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
            <div className="max-w-2xl mx-auto px-6 py-10">
                <Card className="p-8 space-y-6">
                    <h1 className="text-2xl font-bold text-indigo-600">
                        {mode === "edit" ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>ชื่อตำแหน่ง</Label>
                            <Input
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                placeholder="กรอกชื่อตำแหน่ง"
                                className="dark:bg-gray-800 dark:text-white"
                            />
                            {errors.title && (
                                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                            )}
                        </div>

                        <div>
                            <Label>หน่วยงาน (Department)</Label>
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
                        </div>

                        <div className="flex justify-end gap-3">
                            <a
                                href={route("admin.positions.index")}
                                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                ยกเลิก
                            </a>
                            <Button type="submit" disabled={processing}>
                                {mode === "edit" ? "บันทึกการแก้ไข" : "บันทึก"}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}
