import React, { useState, useMemo } from "react";
import { useForm, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { toast } from "sonner";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { KeyRound, Search, ArrowLeft, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Organization {
    id: number;
    name: string;
}

interface Evaluation {
    id: number;
    title: string;
    user_type: string;
    grade_min: number;
    grade_max: number;
}

interface Evaluatee {
    id: number;
    fname: string;
    lname: string;
    grade: number;
    emid: string;
}

interface SupportedEvalGrade {
    fiscal_year: number;
    grade: number;
}

interface PageProps {
    organizations: Organization[];
    evaluations: Evaluation[];
    evaluatees: Evaluatee[];
    supported_eval_grades: SupportedEvalGrade[];
}

export default function AdminAccessCodeGenerate() {
    const { organizations, evaluations, evaluatees, supported_eval_grades = [] } = usePage<PageProps>().props;

    // Build lookup: fy → set of supported grades
    const supportedSet = useMemo(() => {
        const m: Record<number, Set<number>> = {};
        supported_eval_grades.forEach(({ fiscal_year, grade }) => {
            if (!m[fiscal_year]) m[fiscal_year] = new Set();
            m[fiscal_year].add(grade);
        });
        return m;
    }, [supported_eval_grades]);

    const isGradeSupported = (grade: number, fy: string) =>
        supportedSet[Number(fy)]?.has(Number(grade)) ?? false;

    const currentFiscalYear = new Date().getMonth() >= 9
        ? new Date().getFullYear() + 1
        : new Date().getFullYear();

    const { data, setData, post, processing, errors } = useForm({
        organization_id: "",
        evaluatee_ids: [] as number[],
        fiscal_year: String(currentFiscalYear),
        expires_at: "",
        max_uses: "",  // empty = unlimited
    });

    const [searchEvaluatee, setSearchEvaluatee] = useState("");

    // Deduplicate evaluatees by id (in case backend returns duplicates)
    const uniqueEvaluatees = useMemo(() => {
        const seen = new Set<number>();
        return evaluatees.filter((e) => {
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        });
    }, [evaluatees]);

    const filteredEvaluatees = uniqueEvaluatees.filter((e) => {
        const name = `${e.fname} ${e.lname} ${e.emid}`.toLowerCase();
        return name.includes(searchEvaluatee.toLowerCase());
    });

    const toggleEvaluatee = (id: number) => {
        setData(
            "evaluatee_ids",
            data.evaluatee_ids.includes(id)
                ? data.evaluatee_ids.filter((i) => i !== id)
                : [...data.evaluatee_ids, id]
        );
    };

    const selectAllFiltered = () => {
        const allIds = filteredEvaluatees.map((e) => e.id);
        const newIds = [...new Set([...data.evaluatee_ids, ...allIds])];
        setData("evaluatee_ids", newIds);
    };

    const clearSelection = () => {
        setData("evaluatee_ids", []);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("admin.access-codes.generate"), {
            onSuccess: () => toast.success("สร้าง Access Code เรียบร้อยแล้ว"),
            onError: () => toast.error("ไม่สามารถสร้าง Access Code ได้"),
        });
    };

    const selectClass = "w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 px-3 py-2.5 dark:bg-gray-800 dark:text-white transition-all";

    return (
        <MainLayout
            title="สร้าง Access Code"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ดผู้ดูแลระบบ", href: route("admindashboard") },
                        { label: "จัดการ Access Codes", href: route("admin.access-codes.index") },
                        { label: "สร้าง Code ใหม่", active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-4xl mx-auto px-6 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card rounded-2xl p-8 space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="p-2 gradient-primary rounded-xl">
                                <KeyRound className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">
                                สร้าง Access Code สำหรับผู้ประเมินภายนอก
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Organization */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">องค์กรภายนอก *</Label>
                                    <select
                                        value={data.organization_id}
                                        onChange={(e) => setData("organization_id", e.target.value)}
                                        className={cn("mt-1", selectClass)}
                                    >
                                        <option value="">-- เลือกองค์กร --</option>
                                        {organizations.map((org) => (
                                            <option key={org.id} value={org.id}>{org.name}</option>
                                        ))}
                                    </select>
                                    {errors.organization_id && <p className="text-red-500 text-sm mt-1">{errors.organization_id}</p>}
                                </motion.div>

                                {/* Max uses */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">จำนวนครั้งใช้ได้ (Max Uses)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={data.max_uses}
                                        onChange={(e) => setData("max_uses", e.target.value)}
                                        placeholder="ไม่จำกัด — เว้นว่างไว้"
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 รหัสเดียว ใช้ได้หลายคนจาก org เดียวกัน — กรอกเลขเพื่อ limit หรือเว้นว่าง = ไม่จำกัด
                                    </p>
                                    {errors.max_uses && <p className="text-red-500 text-sm mt-1">{errors.max_uses}</p>}
                                </motion.div>

                                {/* Fiscal Year */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">ปีงบประมาณ *</Label>
                                    <select
                                        value={data.fiscal_year}
                                        onChange={(e) => setData("fiscal_year", e.target.value)}
                                        className="mt-1 w-full rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2"
                                    >
                                        {[currentFiscalYear, currentFiscalYear - 1, currentFiscalYear + 1].sort((a, b) => b - a).map((year) => (
                                            <option key={year} value={year}>
                                                พ.ศ. {year + 543} ({year})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.fiscal_year && <p className="text-red-500 text-sm mt-1">{errors.fiscal_year}</p>}
                                </motion.div>

                                {/* Expiry */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">วันหมดอายุ (ไม่บังคับ)</Label>
                                    <Input
                                        type="date"
                                        value={data.expires_at}
                                        onChange={(e) => setData("expires_at", e.target.value)}
                                        className="mt-1 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                                    />
                                    {errors.expires_at && <p className="text-red-500 text-sm mt-1">{errors.expires_at}</p>}
                                </motion.div>
                            </div>

                            {/* Evaluatee Selection */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-gray-700 dark:text-gray-300 font-medium">
                                        เลือกผู้ถูกประเมิน * (เลือกแล้ว {data.evaluatee_ids.length} คน)
                                    </Label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={selectAllFiltered}
                                            className="text-xs text-violet-600 hover:underline font-medium"
                                        >
                                            เลือกทั้งหมด
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearSelection}
                                            className="text-xs text-red-600 hover:underline font-medium"
                                        >
                                            ล้างการเลือก
                                        </button>
                                    </div>
                                </div>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchEvaluatee}
                                        onChange={(e) => setSearchEvaluatee(e.target.value)}
                                        placeholder="ค้นหาผู้ถูกประเมิน..."
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                    />
                                </div>
                                {errors.evaluatee_ids && <p className="text-red-500 text-sm mb-2">{errors.evaluatee_ids}</p>}

                                <div className="rounded-xl border-2 border-gray-200 dark:border-gray-600 max-h-64 overflow-y-auto">
                                    {filteredEvaluatees.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            ไม่พบผู้ถูกประเมินที่มีการมอบหมายองศาขวา
                                        </div>
                                    ) : (
                                        filteredEvaluatees.map((evaluatee) => {
                                            const supported = isGradeSupported(evaluatee.grade, data.fiscal_year);
                                            const selected = data.evaluatee_ids.includes(evaluatee.id);
                                            return (
                                                <div
                                                    key={evaluatee.id}
                                                    onClick={() => supported && toggleEvaluatee(evaluatee.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-2.5 border-b dark:border-gray-700 last:border-b-0 transition-colors select-none",
                                                        !supported
                                                            ? "bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60"
                                                            : "cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/10",
                                                        selected && supported && "bg-violet-50 dark:bg-violet-900/20"
                                                    )}
                                                >
                                                    <input type="checkbox" checked={selected}
                                                        disabled={!supported}
                                                        onChange={() => {}}
                                                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 pointer-events-none disabled:opacity-40"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                                            {evaluatee.fname} {evaluatee.lname}
                                                        </span>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            ({evaluatee.emid}) C{evaluatee.grade}
                                                        </span>
                                                    </div>
                                                    {supported ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                                            ✓ มีแบบประเมิน
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 whitespace-nowrap"
                                                            title={`ไม่พบแบบประเมิน external สำหรับเกรด ${evaluatee.grade} ปีงบ ${Number(data.fiscal_year)+543}`}>
                                                            ✗ ไม่มีแบบประเมิน
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="flex justify-end gap-3 pt-4"
                            >
                                <a
                                    href={route("admin.access-codes.index")}
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
                                    <Zap className="w-4 h-4 mr-2" />
                                    {processing ? "กำลังสร้าง..." : `สร้าง Access Code (${data.evaluatee_ids.length} รายการ)`}
                                </Button>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
