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

interface Division {
    id: number;
    name: string;
}

interface PageProps {
    mode: "create" | "edit";
    department?: { id: number; name: string; division_id: number };
    divisions: Division[];
}

const isDarkMode = () => document.documentElement.classList.contains("dark");

export default function AdminDepartmentForm() {
    const { mode, department, divisions } = usePage<PageProps>().props;
    const [darkMode, setDarkMode] = useState(isDarkMode());

    const { data, setData, post, put, processing, errors } = useForm({
        name: department?.name || "",
        division_id: department?.division_id?.toString() || "",
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
    };

    const divisionOptions = divisions.map((d) => ({
        value: d.id.toString(),
        label: d.name,
    }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "edit" && department) {
            put(route("admin.departments.update", { department: department.id }), {
                onSuccess: () => toast.success("แก้ไขหน่วยงานเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        } else {
            post(route("admin.departments.store"), {
                onSuccess: () => toast.success("เพิ่มหน่วยงานเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        }
    };

    return (
        <MainLayout
            title={mode === "edit" ? "แก้ไขหน่วยงาน" : "เพิ่มหน่วยงาน"}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการหน่วยงาน", href: route("admin.departments.index") },
                        { label: mode === "edit" ? "แก้ไข" : "เพิ่มใหม่", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-2xl mx-auto px-6 py-10">
                <Card className="p-8 space-y-6">
                    <h1 className="text-2xl font-bold text-indigo-600">
                        {mode === "edit" ? "แก้ไขหน่วยงาน" : "เพิ่มหน่วยงานใหม่"}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>ชื่อหน่วยงาน</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="กรอกชื่อหน่วยงาน"
                                className="dark:bg-gray-800 dark:text-white"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <Label>สายงาน (Division)</Label>
                            <Select
                                options={divisionOptions}
                                value={divisionOptions.find((o) => o.value === data.division_id) || null}
                                onChange={(opt) => setData("division_id", opt?.value || "")}
                                isClearable
                                placeholder="เลือกสายงาน..."
                                theme={selectTheme}
                                styles={selectStyles}
                            />
                            {errors.division_id && (
                                <p className="text-red-500 text-sm mt-1">{errors.division_id}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <a
                                href={route("admin.departments.index")}
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
