import { useEffect, useMemo, useState } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    KeyRound, CheckCircle, AlertCircle, Loader2, Shield,
    User as UserIcon, Building2, ArrowRight, ArrowLeft, ChevronRight, Search, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
    prefillCode: string;
    flash?: { success?: string; error?: string };
    errors?: { code?: string[]; evaluator_name?: string[]; evaluator_position?: string[] };
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
}

interface VerifyResponse {
    code: string;
    fiscal_year: number;
    organization: { id: number; name: string };
    evaluation: { id: number; title: string } | null;
    stakeholders: VerifyStakeholder[];
    use_count: number;
    max_uses: number | null;
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
    1: "กรอกรหัส",
    2: "เลือกหน่วยงาน",
    3: "เลือกผู้ประเมิน",
    4: "ยืนยัน",
};

export default function ExternalLogin() {
    const { prefillCode, flash } = usePage<PageProps>().props;

    const [step, setStep] = useState<Step>(1);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [verified, setVerified] = useState<VerifyResponse | null>(null);
    const [orgSearch, setOrgSearch] = useState("");
    const [pickedOrg, setPickedOrg] = useState<string>("");

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

    // unique orgs จาก stakeholders → step 2 dropdown
    const uniqueOrgs = useMemo(() => {
        if (!verified) return [] as string[];
        const set = new Set<string>();
        verified.stakeholders.forEach((s) => set.add(s.organization_name));
        return Array.from(set).sort();
    }, [verified]);

    const filteredOrgs = useMemo(() => {
        const term = orgSearch.trim().toLowerCase();
        if (!term) return uniqueOrgs;
        return uniqueOrgs.filter((o) => o.toLowerCase().includes(term));
    }, [uniqueOrgs, orgSearch]);

    // stakeholders ใน picked org → step 3
    const orgStakeholders = useMemo(() => {
        if (!verified || !pickedOrg) return [] as VerifyStakeholder[];
        return verified.stakeholders.filter((s) => s.organization_name === pickedOrg);
    }, [verified, pickedOrg]);

    // รวม contact_persons ทั้งหมดใน org (จากทุก stakeholder row)
    const orgContactPersons = useMemo(() => {
        const names = new Set<string>();
        orgStakeholders.forEach((s) => {
            (s.contact_persons || []).forEach((p) => p && names.add(p));
            if (s.contact_person) names.add(s.contact_person);
        });
        return Array.from(names);
    }, [orgStakeholders]);

    const orgHasNamedContacts = orgContactPersons.length > 0;

    const pickOrg = (org: string) => {
        setPickedOrg(org);
        setData("evaluator_position", org);
        setData("evaluator_name", "");
        setData("stakeholder_id", "");
        setStep(3);
    };

    const pickPerson = (stakeholderId: number | "", name: string) => {
        setData("stakeholder_id", stakeholderId);
        setData("evaluator_name", name);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("external.login.submit"));
    };

    const canProceedStep3 = data.evaluator_name.trim().length > 0;

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
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
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
                    <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
                        {([1, 2, 3, 4] as Step[]).map((s, i) => (
                            <div key={s} className="flex items-center gap-1.5">
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                    step === s ? "gradient-primary text-white shadow-md scale-110" :
                                    step > s ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                                )}>
                                    {step > s ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                                </div>
                                <span className={cn(
                                    "text-[11px] font-medium",
                                    step === s ? "text-violet-700" : step > s ? "text-emerald-700" : "text-gray-500"
                                )}>
                                    {STEP_LABELS[s]}
                                </span>
                                {i < 3 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                            </div>
                        ))}
                    </div>

                    {/* Flash messages */}
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
                        {/* ─── STEP 1 — กรอก Access Code ─────────────────────────── */}
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

                        {/* ─── STEP 2 — เลือกหน่วยงาน ─────────────────────────── */}
                        {step === 2 && verified && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-4">
                                <div className="glass-card rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">รหัส</span>
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
                                </div>

                                <div className="glass-card rounded-2xl p-5 space-y-3">
                                    <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-violet-600" /> เลือกหน่วยงาน / องค์กร
                                    </div>

                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={orgSearch}
                                            onChange={(e) => setOrgSearch(e.target.value)}
                                            placeholder="ค้นหาชื่อหน่วยงาน..."
                                            className="w-full text-sm border-2 border-gray-200 rounded-lg pl-8 pr-3 py-2"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                        {filteredOrgs.length === 0 && (
                                            <div className="text-xs text-center text-gray-400 py-3">
                                                ไม่พบหน่วยงานตามที่ค้นหา
                                            </div>
                                        )}
                                        {filteredOrgs.map((org) => (
                                            <button
                                                key={org}
                                                type="button"
                                                onClick={() => pickOrg(org)}
                                                className="w-full text-left p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-violet-400 hover:bg-violet-50/50 transition-all"
                                            >
                                                <div className="text-sm font-medium text-gray-800">{org}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setStep(1)}
                                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
                                        <ArrowLeft className="w-4 h-4" /> ย้อน
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STEP 3 — เลือกผู้ประเมิน ─────────────────────────── */}
                        {step === 3 && verified && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-4">
                                <div className="glass-card rounded-2xl p-5">
                                    <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-violet-600 shrink-0" />
                                        <div className="text-sm">
                                            <span className="text-gray-600">หน่วยงาน:</span>{" "}
                                            <span className="font-bold text-gray-900">{pickedOrg}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card rounded-2xl p-5 space-y-3">
                                    <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                                        <UserIcon className="w-4 h-4 text-violet-600" />
                                        {orgHasNamedContacts ? "เลือกชื่อของคุณ" : "กรอกชื่อ-นามสกุล"}
                                    </div>

                                    {orgHasNamedContacts ? (
                                        <>
                                            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                                {orgStakeholders.map((s) => {
                                                    const persons = (s.contact_persons && s.contact_persons.length > 0)
                                                        ? s.contact_persons
                                                        : (s.contact_person ? [s.contact_person] : []);
                                                    return persons.map((p, i) => {
                                                        const isSelected = data.stakeholder_id === s.id && data.evaluator_name === p;
                                                        return (
                                                            <button
                                                                key={`${s.id}-${i}`}
                                                                type="button"
                                                                onClick={() => pickPerson(s.id, p)}
                                                                className={cn(
                                                                    "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-2",
                                                                    isSelected
                                                                        ? "bg-violet-50 border-violet-400 ring-2 ring-violet-200"
                                                                        : "bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50/30"
                                                                )}
                                                            >
                                                                <UserIcon className="w-4 h-4 text-violet-600 shrink-0" />
                                                                <span className="text-sm font-medium text-gray-800 flex-1">{p}</span>
                                                                {isSelected && <CheckCircle className="w-4 h-4 text-violet-600 shrink-0" />}
                                                            </button>
                                                        );
                                                    });
                                                })}
                                            </div>
                                            <div className="border-t border-gray-200 pt-3 mt-2">
                                                <div className="text-[11px] text-gray-500 mb-1.5">ถ้าไม่อยู่ในรายการ — กรอกชื่อเอง:</div>
                                                <input
                                                    type="text"
                                                    value={data.stakeholder_id === "" ? data.evaluator_name : ""}
                                                    onChange={(e) => pickPerson("", e.target.value)}
                                                    placeholder="เช่น นายสมชาย ใจดี"
                                                    className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="text-[11px] text-gray-500">
                                                ระบบยังไม่มีรายชื่อสำหรับหน่วยงานนี้ — กรุณากรอกชื่อของคุณเอง
                                            </div>
                                            <input
                                                type="text"
                                                value={data.evaluator_name}
                                                onChange={(e) => pickPerson("", e.target.value)}
                                                placeholder="เช่น นายสมชาย ใจดี"
                                                className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 justify-between">
                                    <button type="button" onClick={() => { setStep(2); setPickedOrg(""); }}
                                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
                                        <ArrowLeft className="w-4 h-4" /> ย้อน
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        disabled={!canProceedStep3}
                                        className={cn(
                                            "flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold text-white transition-all",
                                            canProceedStep3 ? "gradient-primary hover:shadow-lg" : "bg-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        ถัดไป <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── STEP 4 — ยืนยัน + Submit ─────────────────────────── */}
                        {step === 4 && verified && (
                            <motion.form
                                key="step4"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                <div className="glass-card rounded-2xl p-6 space-y-4">
                                    <div className="text-center mb-2">
                                        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold">ยืนยันข้อมูลก่อนเข้าระบบ</h2>
                                    </div>

                                    <div className="space-y-2.5">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
                                            <Building2 className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide">หน่วยงาน</div>
                                                <div className="text-sm font-bold text-gray-800 break-words">{pickedOrg}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                            <UserIcon className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">ผู้ประเมิน</div>
                                                <div className="text-sm font-bold text-gray-800 break-words">{data.evaluator_name}</div>
                                                {data.stakeholder_id !== "" && (
                                                    <div className="text-[10px] text-emerald-600 mt-0.5">✓ ตรวจสอบรายชื่อในระบบแล้ว</div>
                                                )}
                                                {data.stakeholder_id === "" && (
                                                    <div className="text-[10px] text-amber-600 mt-0.5">⚠ กรอกชื่อเอง — ระบบจะบันทึกเป็นผู้ประเมินใหม่</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {errors.evaluator_name && <p className="text-sm text-red-600">{errors.evaluator_name}</p>}
                                    {errors.evaluator_position && <p className="text-sm text-red-600">{errors.evaluator_position}</p>}
                                </div>

                                <div className="flex gap-2 justify-between">
                                    <button type="button" onClick={() => setStep(3)}
                                        className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
                                        <ArrowLeft className="w-4 h-4" /> ย้อน
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={cn(
                                            "flex items-center gap-1.5 px-6 py-3 rounded-xl font-bold text-white transition-all",
                                            processing ? "bg-gray-400 cursor-not-allowed" :
                                            "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                                        )}
                                    >
                                        {processing ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าระบบ...</>
                                        ) : (
                                            <><Send className="w-4 h-4" /> เข้าสู่ระบบประเมิน</>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}
