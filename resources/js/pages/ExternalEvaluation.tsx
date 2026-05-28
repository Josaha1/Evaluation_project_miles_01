import React, { useState, useEffect, useMemo, useRef } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, ChevronRight, Send, Loader2, User, Users, Building2,
    AlertCircle, CheckCircle, Sparkles, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiEvaluateeQuestionCard } from "@/Components/MultiEvaluateeQuestionCard";

interface Option {
    id: number;
    label: string;
    score?: number;
    value?: string | number;
}

interface Question {
    id: number;
    title: string;
    type: "rating" | "choice" | "multiple_choice" | "open_text";
    options?: Option[];
}

interface SubAspect {
    id: number;
    name: string;
    description?: string | null;
    questions: Question[];
}

interface Aspect {
    id: number;
    name: string;
    description?: string | null;
    questions: Question[];
    subaspects: SubAspect[];
}

interface Part {
    id: number;
    name: string;
    title?: string;
    description?: string | null;
    questions: Question[];
    aspects: Aspect[];
}

interface Evaluatee {
    id: number;
    name: string;
    position?: string | null;
    department?: string | null;
    division?: string | null;
    grade?: number | string | null;
    source_groups?: string[];
}

interface PageProps {
    evaluation: { id: number; title: string; description?: string };
    evaluatee: Evaluatee;
    evaluatees?: Evaluatee[];
    organization: { id: number; name: string };
    pickedOrg?: string | null;
    parts: Part[];
    existingAnswers: Record<string, { value: string; other_text?: string }>;
    sessionId: number;
}

interface Group {
    partId: number;
    partName: string;
    partDescription?: string | null;
    aspectName: string | null;
    subaspectName: string | null;
    subaspectDescription: string | null;
    questions: Question[];
}

export default function ExternalEvaluation() {
    const { evaluation, evaluatee, evaluatees: evaluateesProp, organization, pickedOrg, parts, existingAnswers } =
        usePage<PageProps>().props;

    const evaluatees: Evaluatee[] = (evaluateesProp && evaluateesProp.length > 0)
        ? evaluateesProp
        : [evaluatee];

    // Flatten parts → groups (1 page = 1 group, like internal AssignedEvaluationStep)
    const groups: Group[] = useMemo(() => {
        const out: Group[] = [];
        parts.forEach((part) => {
            const seenIds = new Set<number>();

            part.aspects?.forEach((aspect) => {
                if (aspect.subaspects?.length) {
                    aspect.subaspects.forEach((sub) => {
                        if (sub.questions?.length) {
                            sub.questions.forEach((q) => seenIds.add(q.id));
                            out.push({
                                partId: part.id,
                                partName: part.name || part.title || "",
                                partDescription: part.description,
                                aspectName: aspect.name,
                                subaspectName: sub.name,
                                subaspectDescription: sub.description ?? null,
                                questions: sub.questions,
                            });
                        }
                    });
                }
                const aspectOnly = (aspect.questions || []).filter((q) => !seenIds.has(q.id));
                if (aspectOnly.length) {
                    aspectOnly.forEach((q) => seenIds.add(q.id));
                    out.push({
                        partId: part.id,
                        partName: part.name || part.title || "",
                        partDescription: part.description,
                        aspectName: aspect.name,
                        subaspectName: null,
                        subaspectDescription: aspect.description ?? null,
                        questions: aspectOnly,
                    });
                }
            });

            const partOnly = (part.questions || []).filter((q) => !seenIds.has(q.id));
            if (partOnly.length) {
                out.push({
                    partId: part.id,
                    partName: part.name || part.title || "",
                    partDescription: part.description,
                    aspectName: null,
                    subaspectName: null,
                    subaspectDescription: null,
                    questions: partOnly,
                });
            }
        });
        return out;
    }, [parts]);

    const [currentIndex, setCurrentIndex] = useState(0);
    // Answer shape: { [questionId]: { [evaluateeId]: value | {value, other_text} } }
    const [answers, setAnswers] = useState<{ [questionId: number]: { [evaluateeId: number]: any } }>({});
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Hydrate from existingAnswers (keyed `${evid}_${qid}`)
    useEffect(() => {
        if (!existingAnswers) return;
        const conv: { [qid: number]: { [evid: number]: any } } = {};
        Object.entries(existingAnswers).forEach(([key, ans]) => {
            const [evIdStr, qIdStr] = String(key).split("_");
            const evid = Number(evIdStr);
            const qid = Number(qIdStr);
            if (!evid || !qid) return;
            conv[qid] ??= {};
            conv[qid][evid] = ans;
        });
        setAnswers(conv);
    }, []);

    const currentGroup = groups[currentIndex];
    const isLastStep = currentIndex === groups.length - 1;
    const totalQuestionCells = groups.reduce((s, g) => s + g.questions.length * evaluatees.length, 0);

    const answeredCellsCount = useMemo(() => {
        let n = 0;
        groups.forEach((g) => {
            g.questions.forEach((q) => {
                evaluatees.forEach((ev) => {
                    const a = answers[q.id]?.[ev.id];
                    if (a === undefined || a === null) return;
                    const v = typeof a === "object" && "value" in a ? a.value : a;
                    if (v === undefined || v === null || v === "") return;
                    if (Array.isArray(v) && v.length === 0) return;
                    n++;
                });
            });
        });
        return n;
    }, [groups, answers, evaluatees]);

    const progressPercent = totalQuestionCells > 0
        ? Math.round((answeredCellsCount / totalQuestionCells) * 100)
        : 0;

    // ต้องตอบครบทุก (question × evaluatee) ใน group ปัจจุบัน ถึงจะกดถัดไปได้
    const currentGroupComplete = useMemo(() => {
        if (!currentGroup) return false;
        const required = currentGroup.questions.filter((q) => q.type !== "open_text");
        for (const q of required) {
            for (const ev of evaluatees) {
                const a = answers[q.id]?.[ev.id];
                if (a === undefined || a === null) return false;
                const v = typeof a === "object" && a !== null && "value" in a ? (a as any).value : a;
                if (v === undefined || v === null || v === "") return false;
                if (Array.isArray(v) && v.length === 0) return false;
            }
        }
        return true;
    }, [currentGroup, answers, evaluatees]);

    const allRequiredComplete = useMemo(() => {
        for (const g of groups) {
            const required = g.questions.filter((q) => q.type !== "open_text");
            for (const q of required) {
                for (const ev of evaluatees) {
                    const a = answers[q.id]?.[ev.id];
                    if (a === undefined || a === null) return false;
                    const v = typeof a === "object" && a !== null && "value" in a ? (a as any).value : a;
                    if (v === undefined || v === null || v === "") return false;
                    if (Array.isArray(v) && v.length === 0) return false;
                }
            }
        }
        return true;
    }, [groups, answers, evaluatees]);

    const updateAnswer = (questionId: number, evaluateeId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: { ...(prev[questionId] || {}), [evaluateeId]: value },
        }));
    };

    const handleSubmit = () => {
        setSubmitting(true);
        const formatted: any[] = [];
        Object.entries(answers).forEach(([qIdStr, byEv]) => {
            Object.entries(byEv).forEach(([evIdStr, ans]) => {
                let value: any = ans;
                let other_text: string | null = null;
                if (typeof ans === "object" && ans !== null && "value" in ans) {
                    value = (ans as any).value;
                    other_text = (ans as any).other_text ?? null;
                }
                if (value === undefined || value === null || value === "") return;
                if (Array.isArray(value) && value.length === 0) return;
                formatted.push({
                    question_id: Number(qIdStr),
                    evaluatee_id: Number(evIdStr),
                    value,
                    other_text,
                });
            });
        });

        if (formatted.length === 0) {
            setSubmitting(false);
            return;
        }
        router.post(
            route("external.evaluate.submit"),
            { answers: formatted },
            {
                onFinish: () => setSubmitting(false),
                onError: (errors) => console.error("Submit errors:", errors),
            }
        );
    };

    return (
        <div className="min-h-screen gradient-primary-soft pb-12">
            <Head title={`ประเมิน - ${evaluation.title}`} />

            {/* Sticky Header */}
            <div className="glass-navbar sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <img src="/static/icon.png" alt="กนอ." className="w-8 h-8 flex-shrink-0" />
                            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                                {evaluation.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium flex-shrink-0">
                            <Sparkles className="w-3 h-3" />
                            {progressPercent}%
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground mb-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                                ผู้ถูกประเมิน:{" "}
                                <strong className="text-foreground">
                                    {evaluatees.length > 1 ? `${evaluatees.length} คน` : evaluatees[0]?.name}
                                </strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{pickedOrg || organization.name}</span>
                        </div>
                    </div>

                    {/* Group progress indicators */}
                    <div className="flex items-center gap-1">
                        {groups.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                                    i < currentIndex
                                        ? "bg-violet-500"
                                        : i === currentIndex
                                        ? "bg-gradient-to-r from-violet-500 to-purple-500"
                                        : "bg-gray-200 dark:bg-gray-700"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Evaluatees Info Card (only when multi) */}
                {evaluatees.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-4 mb-6"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Users size={16} className="text-violet-600 dark:text-violet-400" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                รายชื่อผู้ถูกประเมิน
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                {evaluatees.length} คน
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {evaluatees.map((ev, idx) => (
                                <div
                                    key={ev.id}
                                    className="flex items-center space-x-2 p-2 bg-white/60 dark:bg-gray-700/60 rounded-lg"
                                >
                                    <div className="w-6 h-6 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-500 flex-shrink-0">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                            {idx + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                            {ev.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {ev.position || ev.division || ""}
                                        </p>
                                    </div>
                                    {ev.grade && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                            G{ev.grade}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {currentGroup && (
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Section header (gradient card like internal) */}
                            <div className="gradient-primary rounded-2xl p-5 text-white shadow-lg">
                                {currentGroup.partName && (
                                    <p className="text-violet-100 text-xs uppercase tracking-wide mb-1">
                                        ส่วนที่ {groups.slice(0, currentIndex + 1).filter((g, i, arr) =>
                                            i === 0 || g.partId !== arr[i - 1]?.partId
                                        ).length}: {currentGroup.partName}
                                    </p>
                                )}
                                <h3 className="text-xl font-bold">
                                    {currentGroup.subaspectName || currentGroup.aspectName || currentGroup.partName}
                                </h3>
                                {currentGroup.subaspectDescription && (
                                    <p className="text-violet-100 leading-relaxed mt-2 text-sm">
                                        {currentGroup.subaspectDescription}
                                    </p>
                                )}
                            </div>

                            {/* Questions */}
                            <div className="space-y-6">
                                {currentGroup.questions.map((question, index) => {
                                    const evaluateesAsCardEvaluatees = evaluatees.map((e) => ({
                                        id: e.id,
                                        name: e.name,
                                        position: e.position || "",
                                        department: e.department || "",
                                        division: e.division || "",
                                        grade: typeof e.grade === "number" ? e.grade : Number(e.grade) || 0,
                                    }));
                                    const questionAnswers = answers[question.id] || {};
                                    return (
                                        <MultiEvaluateeQuestionCard
                                            key={question.id}
                                            question={question as any}
                                            evaluatees={evaluateesAsCardEvaluatees as any}
                                            answers={questionAnswers}
                                            onAnswerChange={(evaluateeId: number, value: any) =>
                                                updateAnswer(question.id, evaluateeId, value)
                                            }
                                            questionNumber={index + 1}
                                        />
                                    );
                                })}
                            </div>

                            {/* Validation warning */}
                            {!currentGroupComplete && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        กรุณาตอบคำถามทุกข้อให้ครบทุกผู้ถูกประเมิน ({evaluatees.length} คน) ก่อนไปขั้นถัดไป
                                    </p>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between pt-4">
                                <button
                                    onClick={() => {
                                        setCurrentIndex((p) => Math.max(0, p - 1));
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    disabled={currentIndex === 0}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                                        currentIndex === 0
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "glass-card hover:shadow-md"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
                                </button>
                                {isLastStep ? (
                                    <button
                                        onClick={() => setShowConfirm(true)}
                                        disabled={!allRequiredComplete}
                                        title={!allRequiredComplete ? "กรุณาตอบคำถามให้ครบทุกคนก่อนส่งแบบประเมิน" : ""}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all",
                                            allRequiredComplete
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
                                                : "bg-gray-400 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        <Send className="w-4 h-4" /> ส่งแบบประเมิน
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setCurrentIndex((p) => Math.min(groups.length - 1, p + 1));
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        disabled={!currentGroupComplete}
                                        title={!currentGroupComplete ? "กรุณาตอบคำถามในหน้านี้ให้ครบทุกคนก่อน" : ""}
                                        className={cn(
                                            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-white shadow-lg transition-all",
                                            currentGroupComplete
                                                ? "gradient-primary hover:opacity-90 shadow-violet-500/25"
                                                : "bg-gray-400 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        ถัดไป <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Confirm Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card rounded-2xl max-w-md w-full p-6"
                        >
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4 shadow-lg shadow-emerald-500/30">
                                    <Send className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    ยืนยันการส่งแบบประเมิน
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    ตอบแล้ว {answeredCellsCount} จาก {totalQuestionCells} จุด
                                    {evaluatees.length > 1 && ` (${evaluatees.length} คน)`}
                                </p>
                                {answeredCellsCount < totalQuestionCells && (
                                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 justify-center">
                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            ยังมีคำถามที่ยังไม่ได้ตอบครบ
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    กลับแก้ไข
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> กำลังส่ง...
                                        </>
                                    ) : (
                                        "ยืนยันส่ง"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
