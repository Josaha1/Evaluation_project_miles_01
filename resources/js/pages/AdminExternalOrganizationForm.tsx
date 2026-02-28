import React from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";

interface Organization {
    id: number;
    name: string;
    description: string | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    is_active: boolean;
}

interface PageProps {
    mode: "create" | "edit";
    organization?: Organization;
}

export default function AdminExternalOrganizationForm() {
    const { mode, organization } = usePage<PageProps>().props;

    const { data, setData, post, put, processing, errors } = useForm({
        name: organization?.name || "",
        description: organization?.description || "",
        contact_person: organization?.contact_person || "",
        contact_email: organization?.contact_email || "",
        contact_phone: organization?.contact_phone || "",
        is_active: organization?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "edit" && organization) {
            put(route("admin.external-organizations.update", { external_organization: organization.id }), {
                onSuccess: () => toast.success("แก้ไของค์กรเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        } else {
            post(route("admin.external-organizations.store"), {
                onSuccess: () => toast.success("เพิ่มองค์กรเรียบร้อยแล้ว"),
                onError: () => toast.error("ไม่สามารถบันทึกได้"),
            });
        }
    };

    return (
        <MainLayout
            title={mode === "edit" ? "แก้ไของค์กรภายนอก" : "เพิ่มองค์กรภายนอก"}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการองค์กรภายนอก", href: route("admin.external-organizations.index") },
                        { label: mode === "edit" ? "แก้ไข" : "เพิ่มใหม่", active: true },
                    ]}
                />
            }
        >
            <div className="max-w-2xl mx-auto px-6 py-10">
                <Card className="p-8 space-y-6">
                    <h1 className="text-2xl font-bold text-indigo-600">
                        {mode === "edit" ? "แก้ไของค์กรภายนอก" : "เพิ่มองค์กรภายนอกใหม่"}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label>ชื่อองค์กร *</Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="กรอกชื่อองค์กร"
                                className="dark:bg-gray-800 dark:text-white"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label>รายละเอียด</Label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                placeholder="กรอกรายละเอียดองค์กร"
                                rows={3}
                                className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>ชื่อผู้ติดต่อ</Label>
                                <Input
                                    value={data.contact_person}
                                    onChange={(e) => setData("contact_person", e.target.value)}
                                    placeholder="ชื่อผู้ติดต่อ"
                                    className="dark:bg-gray-800 dark:text-white"
                                />
                                {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>}
                            </div>

                            <div>
                                <Label>เบอร์โทรศัพท์</Label>
                                <Input
                                    value={data.contact_phone}
                                    onChange={(e) => setData("contact_phone", e.target.value)}
                                    placeholder="เบอร์โทรศัพท์"
                                    className="dark:bg-gray-800 dark:text-white"
                                />
                                {errors.contact_phone && <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>}
                            </div>
                        </div>

                        <div>
                            <Label>อีเมล</Label>
                            <Input
                                type="email"
                                value={data.contact_email}
                                onChange={(e) => setData("contact_email", e.target.value)}
                                placeholder="email@example.com"
                                className="dark:bg-gray-800 dark:text-white"
                            />
                            {errors.contact_email && <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600"
                            />
                            <Label htmlFor="is_active" className="cursor-pointer">เปิดใช้งาน</Label>
                        </div>

                        <div className="flex justify-end gap-3">
                            <a
                                href={route("admin.external-organizations.index")}
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
