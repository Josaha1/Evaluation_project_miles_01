import { useEffect, useMemo, useState } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    KeyRound, CheckCircle, AlertCircle, Loader2, Shield,
    User as UserIcon, Building2, ClipboardCheck, ArrowRight, ArrowLeft, ChevronRight, UserCheck, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
    prefillCode: string;
    flash?: { success?: string; error?: string };
    errors?: { code?: string[]; evaluator_name?: string[]; evaluator_position?: string[] };
}

interface VerifyEvaluatee {
    id: number;
    name: string;
    grade: number | null;
    position: string | null;
}

interface VerifyStakeholderEvaluatee {
    id: number;
    name: string;
    grade: number | null;
    source_groups: string[];
    submitted: boolean;
}

interface VerifyStakeholder {
    id: number;
    organization_name: string;
    sub_group: string | null;
    contact_person: string | null;
    contact_persons?: string[];
    evaluatees_count: number;
    submitted_count: number;
    related_code_ids?: number[];
    related_groups?: string[];
    preview_evaluatees?: VerifyStakeholderEvaluatee[];
}

interface VerifyResponse {
    code: string;
    fiscal_year: number;
    organization: { id: number; name: string };
    evaluation: { id: number; title: string } | null;
    evaluatees: VerifyEvaluatee[];
    stakeholders: VerifyStakeholder[];
    use_count: number;
    max_uses: number | null;
}

export default function ExternalLogin() {
    const { prefillCode, flash } = usePage<PageProps>().props;

    const [step, setStep] = useState<1 | 2 | 3>(1);   // 3 = confirmation
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [verified, setVerified] = useState<VerifyResponse | null>(null);
    const [stakeholderSearch, setStakeholderSearch] = useState("");
    const [customMode, setCustomMode] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: prefillCode || "",
        evaluator_name: "",
        evaluator_position: "",
        stakeholder_id: "" as string | number | "",
    });

    useEffect(() => {
        if (prefillCode) setData("code", prefillCode);
    }, [prefillCode]);

    const csrf = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

    const handleVerify = async () => {
        if (!data.code) return;
        setVerifying(true);
        setVerifyError(null);
        try {
            const res = await fetch(route("external.verify"), {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf(), Accept: "application/json" },
                body: JSON.stringify({ code: data.code }),
            });
            const body = await res.json();
            if (!res.ok) {
                setVerifyError(body.error || "ตรวจสอบรหัสไม่สำเร็จ");
                return;
            }
            setVerified(body);
            setStep(2);
        } catch (e: any) {
            setVerifyError(e.message);
        } finally {
            setVerifying(false);
        }
    };

    const filteredStakeholders = useMemo(() => {
        if (!verified) return [];
        const term = stakeholderSearch.trim().toLowerCase();
        if (!term) return verified.stakeholders;
        return verified.stakeholders.filter((s) =>
            s.organization_name.toLowerCase().includes(term) ||
            (s.contact_person ?? "").toLowerCase().includes(term) ||
            (s.contact_persons ?? []).some((p) => p.toLowerCase().includes(term)) ||
            (s.sub_group ?? "").toLowerCase().includes(term)
        );
    }, [verified, stakeholderSearch]);

    const pickStakeholder = (s: VerifyStakeholder, contactName?: string) => {
        setData((prev) => ({
            ...prev,
            stakeholder_id: s.id,
            evaluator_name: contactName || s.contact_person || prev.evaluator_name,
            evaluator_position: s.organization_name,
        }));
        setCustomMode(false);
    };

    const enableCustomMode = () => {
        setData((prev) => ({ ...prev, stakeholder_id: "", evaluator_name: "", evaluator_position: "" }));
        setCustomMode(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("external.login.submit"));
    };

    const selectedStakeholder = verified?.stakeholders.find((s) => s.id === data.stakeholder_id);

    return (
        <div className="min-h-screen gradient-primary-soft relative overflow-hidden">
            <Head title="เข้าสู่ระบบประเมินภายนอก" />

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -top-20 -right-20 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                />
            </div>

            <div className="relative flex items-center justify-center min-h-screen p-4 py-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                            className="inline-block mb-3"
                        >
                            <img src="/static/icon.png" alt="กนอ." className="w-16 h-16 mx-auto" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900">ระบบประเมิน 360 องศา</h1>
                        <p className="text-sm text-muted-foreground">การนิคมอุตสาหกรรมแห่งประเทศไทย</p>
                        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                            <Shield className="w-3 h-3" /> สำหรับผู้ประเมินภายนอก
                        </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-3 mb-5">
                        {([1, 2, 3] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                                        step === s ? "gradient-primary text-white shadow-md" :
                                        step > s ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                                    )}
                                >
                                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                                </div>
                                <span className={cn("text-xs font-medium", step === s ? "text-violet-700" : "text-gray-500")}>
                                    {s === 1 ? "กรอกรหัส" : s === 2 ? "เลือกหน่วยงาน" : "ยืนยัน"}
                                </span>
                                {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                            </div>
                        ))}
                    </div>

                    {flash?.success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <p className="text-sm text-emerald-700">{flash.success}</p>
                        </motion.div>
                    )}
                    {flash?.error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-700">{flash.error}</p>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* ─── STEP 1 — Enter code ────────────────────────────── */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="glass-card rounded-2xl p-7">
                                <div className="text-center mb-5">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/25">
                                        <KeyRound className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold">กรอก Access Code</h2>
                                    <p className="text-sm text-muted-foreground">รหัสที่ได้รับจากเจ้าหน้าที่</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Access Code</label>
                                        <input
                                            type="text"
                                            value={data.code}
                                            onChange={(e) => { setData("code", e.target.value.toUpperCase()); setVerifyError(null); }}
                                            onKeyDown={(e) => e.key === "Enter" && data.code && handleVerify()}
                                            className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-center text-xl font-mono tracking-widest uppercase"
                                            placeholder="IEAT-XXX-XXXXXX" maxLength={20} autoFocus
                                        />
                                        {verifyError && (
                                            <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                <p className="text-sm text-red-600">{verifyError}</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleVerify}
                                        disabled={verifying || !data.code || data.code.length < 8}
                                        className={cn(
                                            "w-full py-3 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                                            verifying || !data.code ? "bg-gray-400 cursor-not-allowed" : "gradient-primary hover:shadow-lg hover:shadow-violet-500/25"
                                        )}
                                    >
                                        {verifying ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบ...</>
                                        ) : (
                                            <>ถัดไป <ArrowRight className="w-5 h-5" /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STEP 2 — Pick organization + name ──────────────── */}
                        {step === 2 && verified && (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                onSubmit={(e) => { e.preventDefault(); setStep(3); }}
                                className="space-y-4"
                            >
                                {/* Code summary */}
                                <div className="glass-card rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">รายละเอียดรหัส</span>
                                        <span className="font-mono text-xs text-violet-600">{verified.code}</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 mb-1">
                                            <Building2 className="w-3 h-3" /> กลุ่ม Stakeholder
                                        </div>
                                        <div className="text-base font-bold text-gray-800">{verified.organization.name}</div>
                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                            ปีงบประมาณ พ.ศ. {verified.fiscal_year + 543}
                                        </div>
                                    </div>

                                    {verified.evaluatees.length > 0 && (
                                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 mb-2">
                                                <UserIcon className="w-3 h-3" /> ผู้ถูกประเมินที่รหัสนี้ครอบคลุม ({verified.evaluatees.length} คน)
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {verified.evaluatees.map((e) => (
                                                    <span key={e.id} className="text-xs bg-white/80 rounded px-2 py-1 border border-emerald-100">
                                                        {e.name}
                                                        {e.grade && <span className="text-gray-400 ml-1">C{e.grade}</span>}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-[11px] text-emerald-700 mt-2 italic">
                                                หลังเข้าระบบจะเห็น dashboard ให้เลือกประเมินทีละคน
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stakeholder picker with search */}
                                <div className="glass-card rounded-2xl p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                            <UserCheck className="w-4 h-4 text-violet-600" />
                                            ฉันคือบริษัท/หน่วยงาน...
                                        </div>
                                        {!customMode && verified.stakeholders.length > 0 && (
                                            <button type="button" onClick={enableCustomMode}
                                                className="text-[11px] text-violet-600 hover:underline">
                                                ไม่อยู่ในรายการ — กรอกเอง
                                            </button>
                                        )}
                                    </div>

                                    {!customMode && verified.stakeholders.length > 0 ? (
                                        <>
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={stakeholderSearch}
                                                    onChange={(e) => setStakeholderSearch(e.target.value)}
                                                    placeholder="ค้นหาชื่อบริษัท / ผู้ติดต่อ..."
                                                    className="w-full text-sm border-2 border-gray-200 rounded-lg pl-8 pr-3 py-2"
                                                />
                                            </div>
                                            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                                {filteredStakeholders.length === 0 && (
                                                    <div className="text-xs text-center text-gray-400 py-3">
                                                        ไม่พบ — ลอง <button type="button" onClick={enableCustomMode} className="text-violet-600 underline">กรอกชื่อเอง</button>
                                                    </div>
                                                )}
                                                {filteredStakeholders.map((s) => {
                                                    const isSelected = data.stakeholder_id === s.id;
                                                    const persons = (s.contact_persons && s.contact_persons.length > 0) ? s.contact_persons : (s.contact_person ? [s.contact_person] : []);
                                                    const hasMultiple = persons.length > 1;

                                                    const header = (
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-800 truncate">{s.organization_name}</div>
                                                                <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                                                                    {!hasMultiple && persons[0] && <span>👤 {persons[0]}</span>}
                                                                    {hasMultiple && <span>👥 {persons.length} คน</span>}
                                                                    {s.sub_group && <span className="text-violet-600">[{s.sub_group}]</span>}
                                                                    <span className="text-emerald-700">
                                                                        ✓ {s.submitted_count}/{s.evaluatees_count} ประเมิน
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {isSelected && <CheckCircle className="w-5 h-5 text-violet-600 shrink-0" />}
                                                        </div>
                                                    );

                                                    const baseClass = cn(
                                                        "w-full text-left p-2.5 rounded-lg border transition-all",
                                                        isSelected ? "bg-violet-50 border-violet-400 ring-2 ring-violet-200" :
                                                            "bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50/30"
                                                    );

                                                    if (!hasMultiple) {
                                                        return (
                                                            <button type="button" key={s.id} onClick={() => pickStakeholder(s)} className={baseClass}>
                                                                {header}
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <div key={s.id} className={baseClass}>
                                                            {header}
                                                            <div className="mt-1.5 space-y-1 pl-1">
                                                                {persons.map((p, i) => (
                                                                    <button type="button" key={i}
                                                                        onClick={() => pickStakeholder(s, p)}
                                                                        className={cn(
                                                                            "w-full text-left text-xs px-2 py-1.5 rounded-md border transition-all",
                                                                            isSelected && data.evaluator_name === p
                                                                                ? "bg-violet-100 border-violet-300 font-medium"
                                                                                : "bg-gray-50 border-gray-200 hover:bg-violet-50 hover:border-violet-200"
                                                                        )}>
                                                                        👤 {p}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-800">
                                            💡 {verified.stakeholders.length === 0
                                                ? "ระบบยังไม่มีรายชื่อหน่วยงาน — กรอกชื่อด้านล่างได้เลย"
                                                : "กำลังกรอกชื่อเอง — กดปุ่ม \"เลือกจากรายการ\" ด้านบนเพื่อกลับ"}
                                        </div>
                                    )}

                                    {customMode && verified.stakeholders.length > 0 && (
                                        <button type="button" onClick={() => setCustomMode(false)}
                                            className="text-[11px] text-violet-600 hover:underline">
                                            ← เลือกจากรายการ
                                        </button>
                                    )}
                                </div>

                                {/* Name + position */}
                                <div className="glass-card rounded-2xl p-5 space-y-3">
                                    <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                        <UserIcon className="w-4 h-4 text-violet-600" /> ข้อมูลผู้ประเมิน
                                    </div>
                                    {selectedStakeholder && (
                                        <div className="text-xs bg-violet-50 border border-violet-200 rounded-lg p-2 text-violet-800 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 shrink-0" />
                                            <span>เข้าใช้งานในนาม <b>{selectedStakeholder.organization_name}</b></span>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.evaluator_name}
                                            onChange={(e) => setData("evaluator_name", e.target.value)}
                                            className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                            placeholder="เช่น นายสมชาย ใจดี"
                                            required
                                        />
                                        {errors.evaluator_name && <p className="text-sm text-red-600 mt-1">{errors.evaluator_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            ตำแหน่ง / องค์กร <span className="text-gray-400 text-xs">(ไม่บังคับ)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.evaluator_position}
                                            onChange={(e) => setData("evaluator_position", e.target.value)}
                                            className="block w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                            placeholder="เช่น ผู้จัดการ บริษัท ABC"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button type="button" onClick={() => { setStep(1); setVerified(null); }}
                                        className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
                                        <ArrowLeft className="w-4 h-4" /> ย้อน
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!data.evaluator_name}
                                        className={cn(
                                            "flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                                            !data.evaluator_name ? "bg-gray-400 cursor-not-allowed" : "gradient-primary hover:shadow-lg hover:shadow-violet-500/25"
                                        )}
                                    >
                                        ถัดไป (ยืนยัน) <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* ─── STEP 3 — Confirmation card ──────────────────────── */}
                        {step === 3 && verified && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="glass-card rounded-2xl p-6 border-2 border-violet-300">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">ยืนยันก่อนเริ่ม</div>
                                            <div className="text-base font-bold text-gray-800">กรุณาตรวจสอบรายละเอียด</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {selectedStakeholder ? (
                                            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
                                                <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide mb-1">✓ คุณคือ</div>
                                                <div className="text-base font-bold">{selectedStakeholder.organization_name}</div>
                                                {selectedStakeholder.related_groups && selectedStakeholder.related_groups.length > 0 && (
                                                    <div className="text-[11px] text-violet-600 mt-1">
                                                        ในกลุ่ม: {selectedStakeholder.related_groups.join(" + ")}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
                                                ⚠ ไม่ได้เลือกหน่วยงาน — กรอกชื่อเอง
                                            </div>
                                        )}

                                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-1">✓ ผู้ประเมิน</div>
                                            <div className="text-base font-bold">{data.evaluator_name}</div>
                                            {data.evaluator_position && (
                                                <div className="text-xs text-gray-600 mt-0.5">{data.evaluator_position}</div>
                                            )}
                                        </div>

                                        {selectedStakeholder?.preview_evaluatees && selectedStakeholder.preview_evaluatees.length > 0 && (
                                            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                                                        ✓ คุณจะประเมิน {selectedStakeholder.preview_evaluatees.length} คน
                                                    </div>
                                                    {(selectedStakeholder.submitted_count ?? 0) > 0 && (
                                                        <span className="text-[10px] text-emerald-700">
                                                            (ทำไปแล้ว {selectedStakeholder.submitted_count})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                                    {selectedStakeholder.preview_evaluatees.map((e, idx) => (
                                                        <div key={e.id} className="flex items-start gap-2 text-xs bg-white/60 rounded p-1.5">
                                                            <span className="text-gray-400 font-mono w-5 shrink-0 mt-0.5">{idx + 1}.</span>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-medium text-gray-800">{e.name}</span>
                                                                    {e.grade && <span className="text-gray-400 text-[11px]">C{e.grade}</span>}
                                                                    {e.submitted && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                                                                </div>
                                                                {e.source_groups && e.source_groups.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {e.source_groups.map((g, gi) => (
                                                                            <span key={gi} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 whitespace-normal">
                                                                                {g}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-[11px] text-blue-700 mt-2 italic">
                                                    ⏱ ใช้เวลาประมาณ 5–10 นาที/คน · บันทึกอัตโนมัติทุกคำตอบ
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-5">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                                        >
                                            <ArrowLeft className="w-4 h-4" /> เปลี่ยนตัวเลือก
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmit as any}
                                            disabled={processing}
                                            className={cn(
                                                "flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                                                processing ? "bg-gray-400 cursor-not-allowed" : "gradient-primary hover:shadow-lg hover:shadow-violet-500/25"
                                            )}
                                        >
                                            {processing ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> กำลังเข้าสู่ระบบ...</>
                                            ) : (
                                                <><CheckCircle className="w-5 h-5" /> ใช่ เริ่มประเมิน</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="text-center mt-5">
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} Miles Consult Group
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
