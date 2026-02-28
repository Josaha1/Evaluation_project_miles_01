import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Copy, Printer, Ban, ArrowLeft } from "lucide-react";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Card } from "@/Components/ui/card";
import { useEffect } from "react";

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
        if (accessCode.is_used && accessCode.session?.completed_at) return "text-green-600";
        if (accessCode.is_used) return "text-gray-600";
        if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) return "text-red-600";
        return "text-blue-600";
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
            <div className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-4">
                    <a
                        href={route("admin.access-codes.index")}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับ
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* QR Code Card */}
                    <Card className="p-6 text-center">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">QR Code</h2>
                        <div
                            className="mx-auto mb-4 flex justify-center"
                            dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                        />
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                            <p className="font-mono text-2xl font-bold text-indigo-600 tracking-widest">
                                {accessCode.code}
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={copyCode}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                <Copy className="w-4 h-4" />
                                คัดลอก Code
                            </button>
                            <button
                                onClick={copyUrl}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                <Copy className="w-4 h-4" />
                                คัดลอก URL
                            </button>
                        </div>
                    </Card>

                    {/* Details Card */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">รายละเอียด</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">สถานะ</dt>
                                <dd className={`font-semibold ${getStatusColor()}`}>{getStatusText()}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">องค์กร</dt>
                                <dd className="text-gray-800 dark:text-white">{accessCode.organization?.name || "-"}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">ผู้ถูกประเมิน</dt>
                                <dd className="text-gray-800 dark:text-white">
                                    {accessCode.evaluatee
                                        ? `${accessCode.evaluatee.fname} ${accessCode.evaluatee.lname}`
                                        : "-"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">แบบประเมิน</dt>
                                <dd className="text-gray-800 dark:text-white">{accessCode.evaluation?.title || "-"}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">ปีงบประมาณ</dt>
                                <dd className="text-gray-800 dark:text-white">{accessCode.fiscal_year}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">วันหมดอายุ</dt>
                                <dd className="text-gray-800 dark:text-white">
                                    {accessCode.expires_at
                                        ? new Date(accessCode.expires_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
                                        : "ไม่มีวันหมดอายุ"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 dark:text-gray-400">วันที่สร้าง</dt>
                                <dd className="text-gray-800 dark:text-white">
                                    {new Date(accessCode.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                                </dd>
                            </div>
                            {accessCode.session && (
                                <>
                                    <div>
                                        <dt className="text-gray-500 dark:text-gray-400">เริ่มทำ</dt>
                                        <dd className="text-gray-800 dark:text-white">
                                            {accessCode.session.started_at
                                                ? new Date(accessCode.session.started_at).toLocaleString("th-TH")
                                                : "-"}
                                        </dd>
                                    </div>
                                    {accessCode.session.completed_at && (
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">ส่งเสร็จ</dt>
                                            <dd className="text-gray-800 dark:text-white">
                                                {new Date(accessCode.session.completed_at).toLocaleString("th-TH")}
                                            </dd>
                                        </div>
                                    )}
                                    {accessCode.session.ip_address && (
                                        <div>
                                            <dt className="text-gray-500 dark:text-gray-400">IP Address</dt>
                                            <dd className="text-gray-800 dark:text-white font-mono text-xs">{accessCode.session.ip_address}</dd>
                                        </div>
                                    )}
                                </>
                            )}
                        </dl>

                        <div className="mt-6 pt-4 border-t dark:border-gray-700 flex flex-wrap gap-2">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                            >
                                <Printer className="w-4 h-4" />
                                พิมพ์ QR Card
                            </button>
                            {!accessCode.is_used && (
                                <button
                                    onClick={handleRevoke}
                                    className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                    <Ban className="w-4 h-4" />
                                    ยกเลิก Code
                                </button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
