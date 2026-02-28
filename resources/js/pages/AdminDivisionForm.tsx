import React, { useEffect, useState } from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";

interface PageProps {
    mode: "create" | "edit";
    division?: { id: number; name: string };
}

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
            <div className="max-w-2xl mx-auto px-6 py-10">
                <Card className="p-8 space-y-6">
                    <h1 className="text-2xl font-bold text-indigo-600">
                        {mode === "edit" ? "แก้ไขสายงาน" : "เพิ่มสายงานใหม่"}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>ชื่อสายงาน</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="กรอกชื่อสายงาน"
                                className="dark:bg-gray-800 dark:text-white"
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <a
                                href={route("admin.divisions.index")}
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
