import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Copy, Printer, Ban, ArrowLeft, KeyRound, ExternalLink } from "lucide-react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AccessCodeData {
    id: number;
    code: string;
    fiscal_year: number;
    is_used: boolean;
    used_at: string | null;
    expires_at: string | null;
    created_at: string;
    organization: { id: number; name: string } | null;
    evaluatee: { id: number; fname: string; lname: string } | null;
    evaluation: { id: number; title: string } | null;
    session: { id: number; completed_at: string | null; started_at: string | null; ip_address: string | null } | null;
}

interface PageProps {
    accessCode: AccessCodeData;
    qrCodeSvg: string;
    qrCodeUrl: string;
}

export default function AdminAccessCodeShow() {
    const { accessCode, qrCodeSvg, qrCodeUrl } = usePage<PageProps>().props;
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const copyCode = () => {
        navigator.clipboard.writeText(accessCode.code);
        toast.success("คัดลอก Access Code แล้ว");
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(qrCodeUrl);
        toast.success("คัดลอก URL แล้ว");
    };

    const handlePrint = () => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = route("admin.access-codes.print-cards");

        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
            const csrfInput = document.createElement("input");
            csrfInput.type = "hidden";
            csrfInput.name = "_token";
            csrfInput.value = csrfMeta.getAttribute("content") || "";
            form.appendChild(csrfInput);
        }

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "code_ids[]";
        input.value = String(accessCode.id);
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleRevoke = () => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิก Access Code นี้?")) {
            router.put(route("admin.access-codes.revoke", { accessCode: accessCode.id }));
        }
    };

    const getStatusText = () => {
        if (accessCode.is_used && accessCode.session?.completed_at) return "ประเมินเสร็จสิ้น";
        if (accessCode.is_used) return "ถูกยกเลิก";
        if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) return "หมดอายุ";
        return "พร้อมใช้งาน";
    };

    const getStatusColor = () => {
        if (accessCode.is_used && accessCode.session?.completed_at) return "text-emerald-600 dark:text-emerald-400";
        if (accessCode.is_used) return "text-gray-600 dark:text-gray-400";
        if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) return "text-red-600 dark:text-red-400";
        return "text-violet-600 dark:text-violet-400";
    };

    return (
        <MainLayout
            title={`Access Code: ${accessCode.code}`}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการ Access Codes", href: route("admin.access-codes.index") },
                        { label: accessCode.code, active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-3xl mx-auto px-6 py-10">
                    {/* Back link */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6"
                    >
                        <a
                            href={route("admin.access-codes.index")}
                            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            กลับ
                        </a>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* QR Code Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-6 text-center"
                        >
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <KeyRound className="w-5 h-5 text-violet-600" />
                                <h2 className="text-lg font-bold text-gradient-primary">QR Code</h2>
                            </div>
                            <div
                                className="mx-auto mb-4 flex justify-center"
                                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                            />
                            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 mb-4 border border-violet-200 dark:border-violet-800">
                                <p className="font-mono text-2xl font-bold text-violet-600 dark:text-violet-400 tracking-widest">
                                    {accessCode.code}
                                </p>
                            </div>
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={copyCode}
                                    className="inline-flex items-center gap-1 px-4 py-2 text-sm glass-card rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    คัดลอก Code
                                </button>
                                <button
                                    onClick={copyUrl}
                                    className="inline-flex items-center gap-1 px-4 py-2 text-sm glass-card rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    คัดลอก URL
                                </button>
                            </div>
                        </motion.div>

                        {/* Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-bold text-gradient-primary mb-4">รายละเอียด</h2>
                            <dl className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">สถานะ</dt>
                                    <dd className={cn("font-semibold", getStatusColor())}>{getStatusText()}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">องค์กร</dt>
                                    <dd className="text-gray-800 dark:text-white">{accessCode.organization?.name || "-"}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">ผู้ถูกประเมิน</dt>
                                    <dd className="text-gray-800 dark:text-white">
                                        {accessCode.evaluatee
                                            ? `${accessCode.evaluatee.fname} ${accessCode.evaluatee.lname}`
                                            : "-"}
                                    </dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">แบบประเมิน</dt>
                                    <dd className="text-gray-800 dark:text-white">{accessCode.evaluation?.title || "-"}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">ปีงบประมาณ</dt>
                                    <dd className="text-gray-800 dark:text-white">{accessCode.fiscal_year}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">วันหมดอายุ</dt>
                                    <dd className="text-gray-800 dark:text-white">
                                        {accessCode.expires_at
                                            ? new Date(accessCode.expires_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
                                            : "ไม่มีวันหมดอายุ"}
                                    </dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                    <dt className="text-gray-500 dark:text-gray-400">วันที่สร้าง</dt>
                                    <dd className="text-gray-800 dark:text-white">
                                        {new Date(accessCode.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                                    </dd>
                                </div>
                                {accessCode.session && (
                                    <>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                            <dt className="text-gray-500 dark:text-gray-400">เริ่มทำ</dt>
                                            <dd className="text-gray-800 dark:text-white">
                                                {accessCode.session.started_at
                                                    ? new Date(accessCode.session.started_at).toLocaleString("th-TH")
                                                    : "-"}
                                            </dd>
                                        </div>
                                        {accessCode.session.completed_at && (
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                                <dt className="text-gray-500 dark:text-gray-400">ส่งเสร็จ</dt>
                                                <dd className="text-gray-800 dark:text-white">
                                                    {new Date(accessCode.session.completed_at).toLocaleString("th-TH")}
                                                </dd>
                                            </div>
                                        )}
                                        {accessCode.session.ip_address && (
                                            <div className="flex justify-between items-center py-2">
                                                <dt className="text-gray-500 dark:text-gray-400">IP Address</dt>
                                                <dd className="text-gray-800 dark:text-white font-mono text-xs">{accessCode.session.ip_address}</dd>
                                            </div>
                                        )}
                                    </>
                                )}
                            </dl>

                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-xl text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                                >
                                    <Printer className="w-4 h-4" />
                                    พิมพ์ QR Card
                                </button>
                                {!accessCode.is_used && (
                                    <button
                                        onClick={handleRevoke}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 hover:shadow-lg transition-all"
                                    >
                                        <Ban className="w-4 h-4" />
                                        ยกเลิก Code
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
