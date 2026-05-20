import React from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Building2, Save, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Organization {
    id: number;
    name: string;
    org_code: string | null;
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
        org_code: organization?.org_code || "",
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
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-2xl mx-auto px-6 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card rounded-2xl p-8 space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 gradient-primary rounded-xl">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">
                                {mode === "edit" ? "แก้ไของค์กรภายนอก" : "เพิ่มองค์กรภายนอกใหม่"}
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">ชื่อองค์กร *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="กรอกชื่อองค์กร"
                                    className="mt-1 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">รหัสองค์กร (org_code) *</Label>
                                <Input
                                    value={data.org_code}
                                    onChange={(e) => setData("org_code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    placeholder="เช่น BKKP, ABCL (ไม่เกิน 10 ตัวอักษร)"
                                    maxLength={10}
                                    className="mt-1 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1">ใช้สำหรับสร้าง Access Code รูปแบบ IEAT-[รหัส]-XXXXXX</p>
                                {errors.org_code && <p className="text-red-500 text-sm mt-1">{errors.org_code}</p>}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">รายละเอียด</Label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData("description", e.target.value)}
                                    placeholder="กรอกรายละเอียดองค์กร"
                                    rows={3}
                                    className="mt-1 w-full rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 px-3 py-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 transition-all"
                                />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">ชื่อผู้ติดต่อ</Label>
                                    <Input
                                        value={data.contact_person}
                                        onChange={(e) => setData("contact_person", e.target.value)}
                                        placeholder="ชื่อผู้ติดต่อ"
                                        className="mt-1 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                    />
                                    {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>}
                                </div>

                                <div>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">เบอร์โทรศัพท์</Label>
                                    <Input
                                        value={data.contact_phone}
                                        onChange={(e) => setData("contact_phone", e.target.value)}
                                        placeholder="เบอร์โทรศัพท์"
                                        className="mt-1 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                    />
                                    {errors.contact_phone && <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Label className="text-gray-700 dark:text-gray-300 font-medium">อีเมล</Label>
                                <Input
                                    type="email"
                                    value={data.contact_email}
                                    onChange={(e) => setData("contact_email", e.target.value)}
                                    placeholder="email@example.com"
                                    className="mt-1 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                />
                                {errors.contact_email && <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="flex items-center gap-3"
                            >
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                                />
                                <Label htmlFor="is_active" className="cursor-pointer text-gray-700 dark:text-gray-300">เปิดใช้งาน</Label>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex justify-end gap-3 pt-4"
                            >
                                <a
                                    href={route("admin.external-organizations.index")}
                                    className="inline-flex items-center px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    ยกเลิก
                                </a>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gradient-primary text-white rounded-xl px-6 py-2.5 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {mode === "edit" ? "บันทึกการแก้ไข" : "บันทึก"}
                                </Button>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
