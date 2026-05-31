import { Head, router, usePage } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Building2, User as UserIcon, CheckCircle, ArrowRight, LogOut, ClipboardList, Sparkles, AlertTriangle, Trophy, Clock, XCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

interface Evaluatee {
    id: number;
    name: string;
    position: string | null;
    grade: number;
    evaluation_title: string | null;
    evaluation_id: number;
    access_code_id: number;
    source_groups?: string[];
    is_completed: boolean;
    is_skipped?: boolean;
    skip_reason?: string | null;
    org_total_uses: number;
}

interface StakeholderIdentity {
    name: string;
    sub_group: string | null;
    contact_person: string | null;
}

interface PageProps {
    organization: { id: number; name: string };
    picked_org?: string | null;
    evaluator: { name: string; position: string | null };
    evaluatees: Evaluatee[];
    currentEvaluateeId: number;
    fiscalYear: number | string;
    totalCount: number;
    completedCount: number;
    mode?: "stakeholder" | "access_code";
    stakeholder_identity?: StakeholderIdentity;
    flash?: { success?: string; error?: string };
}

export default function ExternalDashboard() {
    const { organization, picked_org, evaluator, evaluatees, fiscalYear, totalCount, completedCount, mode, stakeholder_identity, flash } =
        usePage<PageProps>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const progress = activeEvaluatees.length > 0 ? (activeCompleted / activeEvaluatees.length) * 100 : 0;

    const handleSelect = (evaluateeId: number) => {
        router.post(route("external.select-evaluatee", { evaluateeId }));
    };

    const [skipModal, setSkipModal] = useState<{ evaluateeId: number; name: string } | null>(null);
    const [skipReason, setSkipReason] = useState("ไม่เคยร่วมงาน");

    const csrf = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || "";

    const submitSkip = async (evaluateeId: number, reason: string | null) => {
        const res = await fetch(route("external.skip-evaluatee"), {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf(), Accept: "application/json" },
            body: JSON.stringify({ evaluatee_id: evaluateeId, reason }),
        });
        if (res.ok) {
            setSkipModal(null);
            router.reload({ only: ["evaluatees", "totalCount", "completedCount"] });
        } else {
            toast.error("บันทึกไม่สำเร็จ");
        }
    };

    const activeEvaluatees = evaluatees.filter((e) => !e.is_skipped);
    const skippedEvaluatees = evaluatees.filter((e) => e.is_skipped);
    const activeCompleted = activeEvaluatees.filter((e) => e.is_completed).length;
    const remaining = activeEvaluatees.length - activeCompleted;
    const isAllDone = activeEvaluatees.length > 0 && remaining === 0;
    const nextPending = activeEvaluatees.find((e) => !e.is_completed);

    const handleLogout = () => {
        const msg = isAllDone
            ? "ออกจากระบบ?"
            : `ยังประเมินไม่ครบ — เหลืออีก ${remaining} คน\n\nถ้าออกตอนนี้สามารถกลับมาทำต่อได้ภายหลัง (ใช้รหัสเดิม)\n\nแน่ใจที่จะออกมั้ย?`;
        if (confirm(msg)) router.post(route("external.logout"));
    };

    return (
        <div className="min-h-screen gradient-primary-soft">
            <Head title="หน้าหลัก - ระบบประเมินภายนอก" />

            {/* Header — show TWO context layers: picked org (primary) + group (umbrella) */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-violet-200/50 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 gradient-primary rounded-xl text-white shadow-md flex-shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-gray-900 dark:text-white truncate text-base">
                                {picked_org || organization.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                                {picked_org && (
                                    <>
                                        <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px]">
                                            กลุ่ม: {organization.name.length > 25 ? organization.name.slice(0, 25) + "…" : organization.name}
                                        </span>
                                        <span>·</span>
                                    </>
                                )}
                                <span>ปีงบ พ.ศ. {Number(fiscalYear) + 543}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
                {/* Identity card — who you are + which group's QR */}
                {picked_org && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-4 bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <div className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide mb-0.5">ฉันคือ (หน่วยงาน/บริษัท)</div>
                                <div className="text-base font-bold text-gray-900">{picked_org}</div>
                            </div>
                            <div>
                                <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-0.5">เข้าใช้งานในกลุ่ม Stakeholder</div>
                                <div className="text-base font-bold text-gray-900">{organization.name}</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Greeting + progress (bigger, more prominent) */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5 border border-violet-200/50">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-violet-600" />
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">สวัสดี</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{evaluator.name}</div>
                                {evaluator.position && (
                                    <div className="text-xs text-gray-500">{evaluator.position}</div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] text-gray-500 uppercase tracking-wide">ความคืบหน้า</div>
                            <div className={cn("text-3xl font-bold", isAllDone ? "text-emerald-600" : "text-gradient-primary")}>
                                {completedCount}/{totalCount}
                            </div>
                        </div>
                    </div>
                    <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div
                            className={cn("h-full", isAllDone ? "bg-emerald-500" : "gradient-primary")}
                            initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                    <div className={cn("text-sm mt-2 font-medium", isAllDone ? "text-emerald-700" : "text-gray-600")}>
                        {isAllDone
                            ? "✨ ประเมินครบทุกคนแล้ว ขอบคุณครับ"
                            : `เหลืออีก ${remaining} คน — กรุณากดปุ่มด้านล่างเพื่อทำต่อ`}
                    </div>
                </motion.div>

                {/* HERO CTA — drives completion */}
                {isAllDone ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-2 border-emerald-300 p-6 text-center shadow-md"
                    >
                        <Trophy className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                        <div className="text-xl font-bold text-emerald-800 mb-1">เสร็จสิ้นครบทุกคน 🎉</div>
                        <div className="text-sm text-emerald-700 mb-4">
                            ขอบคุณที่สละเวลาประเมิน · คะแนนถูกบันทึกแล้ว
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow"
                        >
                            ออกจากระบบ
                        </button>
                    </motion.div>
                ) : nextPending ? (
                    <motion.div
                        initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="rounded-2xl gradient-primary p-5 text-white shadow-lg shadow-violet-500/25"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl font-bold">{nextPending.name?.charAt(0) || "?"}</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[11px] uppercase tracking-wide text-white/80">ลำดับถัดไป ({completedCount + 1}/{totalCount})</div>
                                    <div className="text-lg font-bold truncate">{nextPending.name}</div>
                                    <div className="text-xs text-white/80 truncate">
                                        {nextPending.position || "—"}
                                        {nextPending.grade && ` · เกรด C${nextPending.grade}`}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleSelect(nextPending.id)}
                                className="px-6 py-3 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 shadow-md flex items-center gap-2 whitespace-nowrap"
                            >
                                เริ่มประเมินเลย <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                ) : null}

                {/* Commitment notice — only when there's still work */}
                {!isAllDone && totalCount > 0 && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <b>กรุณาประเมินให้ครบทุกคน</b> · ใช้เวลาประมาณ
                            <Clock className="w-3.5 h-3.5 inline mx-1" />
                            5–10 นาที/คน · ระบบบันทึกอัตโนมัติทุกคำตอบ — ออกแล้วกลับมาทำต่อได้ด้วยรหัสเดิม
                        </div>
                    </div>
                )}

                {/* Stakeholder identity banner */}
                {mode === "stakeholder" && stakeholder_identity && (
                    <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-sm text-violet-900 flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <div><b>คุณเข้าใช้งานในนาม:</b> {stakeholder_identity.name}</div>
                            {stakeholder_identity.sub_group && (
                                <div className="text-xs text-violet-700 mt-0.5">[{stakeholder_identity.sub_group}]</div>
                            )}
                            {stakeholder_identity.contact_person && (
                                <div className="text-xs text-gray-600 mt-0.5">ผู้ติดต่อ: {stakeholder_identity.contact_person}</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Evaluatees list — pending first, completed below */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-violet-600" />
                        รายชื่อทั้งหมด ({totalCount})
                        <span className="text-xs font-normal text-gray-500 ml-auto">
                            ⏳ {remaining} ค้าง · ✓ {completedCount} เสร็จ
                        </span>
                    </h2>

                    {evaluatees.length === 0 ? (
                        <div className="glass-card rounded-2xl p-8 text-center text-gray-500">
                            ไม่พบรายชื่อผู้ที่ต้องประเมิน
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[...evaluatees].sort((a, b) => Number(a.is_completed) - Number(b.is_completed)).map((e, i) => (
                                <motion.div key={e.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={cn(
                                        "glass-card rounded-2xl p-4 transition-all",
                                        e.is_completed
                                            ? "ring-2 ring-emerald-300 bg-emerald-50/50"
                                            : "hover:ring-2 hover:ring-violet-300 hover:shadow-lg cursor-pointer"
                                    )}
                                    onClick={() => !e.is_completed && handleSelect(e.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0",
                                            e.is_completed ? "bg-emerald-500" : "gradient-primary"
                                        )}>
                                            {e.name?.charAt(0) || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 dark:text-white truncate">{e.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{e.position || "-"}</div>
                                            {e.grade && <div className="text-xs text-gray-400">เกรด C{e.grade}</div>}
                                            {e.source_groups && e.source_groups.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {e.source_groups.map((g, gi) => (
                                                        <span key={gi} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium whitespace-normal">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {e.evaluation_title && (
                                                <div className="text-[11px] text-violet-600 mt-1 truncate">
                                                    📋 {e.evaluation_title}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                                        {e.is_completed ? (
                                            <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                                <CheckCircle className="w-3.5 h-3.5" /> ประเมินแล้ว
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button onClick={(ev) => { ev.stopPropagation(); handleSelect(e.id); }}
                                                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all">
                                                    ประเมินเลย <ArrowRight className="w-4 h-4" />
                                                </button>
                                                <button onClick={(ev) => { ev.stopPropagation(); setSkipModal({ evaluateeId: e.id, name: e.name }); }}
                                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50">
                                                    <XCircle className="w-3.5 h-3.5" /> ไม่ประเมิน
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {skippedEvaluatees.length > 0 && (
                    <div className="glass-card rounded-2xl p-5">
                        <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-gray-500" /> ไม่ประเมิน ({skippedEvaluatees.length})
                        </div>
                        <div className="space-y-1.5">
                            {skippedEvaluatees.map((e) => (
                                <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-700 truncate">{e.name}</div>
                                        {e.skip_reason && <div className="text-[11px] text-gray-500">เหตุผล: {e.skip_reason}</div>}
                                    </div>
                                    <button onClick={() => submitSkip(e.id, null)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-violet-600 hover:bg-violet-50 font-medium">
                                        <RotateCcw className="w-3 h-3" /> กลับมาประเมิน
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-center text-xs text-gray-400 pt-4">
                    💡 ถ้าไม่เคยร่วมงานด้วย สามารถกด "ไม่ประเมิน" ได้ จะไม่ถูกนับในการคำนวณคะแนน
                </div>
            </div>

            {/* Skip reason modal */}
            {skipModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSkipModal(null)}>
                    <div className="glass-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">ไม่ประเมินคนนี้</h3>
                            <p className="text-sm text-gray-600 mt-1">{skipModal.name}</p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">เหตุผล (ไม่บังคับ)</label>
                                <select value={skipReason} onChange={(e) => setSkipReason(e.target.value)}
                                    className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 bg-white">
                                    <option value="ไม่เคยร่วมงาน">ไม่เคยร่วมงาน</option>
                                    <option value="ข้อมูลไม่เพียงพอ">ข้อมูลไม่เพียงพอ</option>
                                    <option value="ไม่อยู่ในขอบเขตงานที่ดูแล">ไม่อยู่ในขอบเขตงานที่ดูแล</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                ระบบจะไม่นำคนนี้มาคิดในตัวหารคะแนน
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSkipModal(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                                    ยกเลิก
                                </button>
                                <button onClick={() => submitSkip(skipModal.evaluateeId, skipReason)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold">
                                    ยืนยันไม่ประเมิน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
