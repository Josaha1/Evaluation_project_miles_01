import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import { Button } from "@/Components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    ArrowLeft,
    Send,
    User,
    CheckCircle,
    AlertCircle,
    Sparkles,
    BookOpen,
    Loader2,
    Save,
} from "lucide-react";
import axios from "axios";
import { ProgressIndicator } from "@/Components/ProgressIndicator";
import { QuestionCard } from "@/Components/QuestionCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Option {
    id: number;
    label: string;
    score: number;
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
    description?: string;
    questions: Question[];
}

interface Aspect {
    name: string;
    questions: Question[];
    subaspects?: SubAspect[];
}

interface Group {
    aspectName: string;
    subaspectName: string | null;
    subaspectDescription: string | null;
    questions: Question[];
}

export default function SelfEvaluationStep() {
    const {
        evaluation,
        current_part,
        step,
        total_steps,
        evaluatee_id,
        is_self,
        auth,
        group_index_to_resume,
        existingAnswers,
        fiscal_year,
    } = usePage<{
        evaluation: { id: number };
        current_part: { id: number; title: string; aspects: Aspect[] };
        step: number;
        total_steps: number;
        evaluatee_id: number | null;
        is_self: boolean;
        auth: { user: { id: number } };
        group_index_to_resume: number | null;
        existingAnswers?: { [questionId: number]: any };
        fiscal_year?: number;
    }>().props;

    const [answers, setAnswers] = useState<{ [questionId: number]: any }>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // Always reflects latest answers — used by autoSave so it never reads stale closure
    const answersRef = React.useRef(answers);
    React.useEffect(() => { answersRef.current = answers; }, [answers]);

    useEffect(() => {
        if (existingAnswers) {
            const formattedAnswers: { [questionId: number]: any } = {};
            Object.entries(existingAnswers).forEach(
                ([questionIdStr, answerValue]) => {
                    const questionId = parseInt(questionIdStr);
                    let processedValue = answerValue;
                    if (typeof answerValue === "string") {
                        try {
                            processedValue = JSON.parse(answerValue);
                        } catch (e) {
                            processedValue = answerValue;
                        }
                    }
                    formattedAnswers[questionId] = processedValue;
                }
            );
            setAnswers(formattedAnswers);
        } else {
            setAnswers({});
        }
    }, [existingAnswers]);

    const groupedQuestions: Group[] = current_part.aspects.flatMap((aspect) => {
        const seenQuestionIds = new Set<number>();
        const subGroups = (aspect.subaspects || []).map((sub) => {
            sub.questions.forEach((q) => seenQuestionIds.add(q.id));
            return {
                aspectName: aspect.name,
                subaspectName: sub.name,
                subaspectDescription: sub.description || null,
                questions: sub.questions,
            };
        });
        const uniqueAspectQuestions = aspect.questions.filter(
            (q) => !seenQuestionIds.has(q.id)
        );
        const aspectOnly =
            uniqueAspectQuestions.length > 0
                ? [
                      {
                          aspectName: aspect.name,
                          subaspectName: null,
                          subaspectDescription: null,
                          questions: uniqueAspectQuestions,
                      },
                  ]
                : [];
        return [...subGroups, ...aspectOnly];
    });

    const currentGroup = groupedQuestions[currentIndex];

    useEffect(() => {
        const shouldGoToLast =
            new URLSearchParams(window.location.search).get("goto_last") ===
            "1";
        if (shouldGoToLast && groupedQuestions.length > 0) {
            setCurrentIndex(groupedQuestions.length - 1);
            const url = new URL(window.location.href);
            url.searchParams.delete("goto_last");
            window.history.replaceState({}, "", url.toString());
        }
    }, [groupedQuestions.length]);

    const autoSave = React.useCallback(async () => {
        // Read latest answers via ref so we never use stale closure data
        const latest = answersRef.current;
        const currentAnswers = currentGroup?.questions.reduce((acc, q) => {
            if (Object.prototype.hasOwnProperty.call(latest, q.id)) {
                acc[q.id] = latest[q.id];
            }
            return acc;
        }, {} as Record<number, any>);

        if (!currentAnswers || Object.keys(currentAnswers).length === 0) return;

        setSaveStatus('saving');
        try {
            await axios.post(route("evaluations.self.step", { step }), {
                evaluation_id: evaluation.id,
                part_id: current_part.id,
                evaluatee_id: evaluatee_id ?? auth.user.id,
                answers: currentAnswers,
                fiscal_year: fiscal_year,
            });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
        }
    }, [currentGroup, step, evaluation.id, current_part.id, evaluatee_id, auth.user.id, fiscal_year]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const updateAnswer = (questionId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            autoSave();
        }, 2000);
    };

    const hasAnswerValue = (ans: any): boolean => {
        // Unwrap {value, other_text} envelope
        if (typeof ans === 'object' && ans !== null && !Array.isArray(ans) && 'value' in ans) {
            ans = (ans as any).value;
        }
        if (ans === undefined || ans === null || ans === "") return false;
        if (Array.isArray(ans) && ans.length === 0) return false;
        return true;
    };

    const isGroupComplete = currentGroup?.questions.every((q) => {
        // open_text is optional — never blocks completion
        if (q.type === "open_text") return true;
        return hasAnswerValue(answers[q.id]);
    });

    const answeredInGroup = currentGroup?.questions.filter((q) => {
        if (q.type === "open_text") return true;
        return hasAnswerValue(answers[q.id]);
    }).length ?? 0;

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            if (step > 1) {
                setIsLoading(true);
                router.visit(
                    route("evaluations.self.questions", {
                        step: step - 1,
                        goto_last: 1,
                    }),
                    {
                        method: "get",
                        preserveScroll: false,
                        preserveState: false,
                        onFinish: () => {
                            setIsLoading(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        },
                        onError: () => {
                            setIsLoading(false);
                            toast.error(
                                "เกิดข้อผิดพลาดในการโหลดขั้นตอนก่อนหน้า"
                            );
                        },
                    }
                );
            } else {
                router.visit(route("dashboard"));
            }
        }
    };

    const handleNextGroup = async () => {
        const currentAnswers = currentGroup.questions.reduce((acc, q) => {
            const val = answers[q.id];
            if (val !== undefined && val !== "") acc[q.id] = val;
            return acc;
        }, {} as Record<number, any>);

        if (Object.keys(currentAnswers).length > 0) {
            setIsLoading(true);
            try {
                await axios.post(route("evaluations.self.step", { step }), {
                    evaluation_id: evaluation.id,
                    part_id: current_part.id,
                    evaluatee_id: evaluatee_id ?? auth.user.id,
                    answers: currentAnswers,
                    fiscal_year: fiscal_year,
                });
                toast.success("บันทึกคำตอบเรียบร้อยแล้ว", {
                    icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
                });
            } catch (error) {
                console.error("Error saving answers:", error);
                toast.error("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่");
                setIsLoading(false);
                return;
            }
            setIsLoading(false);
        }

        if (currentIndex < groupedQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (step >= total_steps) {
            setShowCompletionModal(true);
            setIsLoading(false);
        } else {
            setIsLoading(true);
            router.visit(
                route("evaluations.self.questions", { step: step + 1 }) + (fiscal_year ? `?fiscal_year=${fiscal_year}` : ''),
                {
                    method: "get",
                    preserveScroll: false,
                    preserveState: false,
                }
            );
        }
    };

    useEffect(() => {
        if (typeof group_index_to_resume === "number") {
            setCurrentIndex(group_index_to_resume);
        }
    }, [group_index_to_resume]);

    const isLastGroup = currentIndex === groupedQuestions.length - 1;
    const isLastStep = step === total_steps;

    const overallProgress = Math.round(
        (((step - 1) * groupedQuestions.length + currentIndex + 1) /
            (total_steps * groupedQuestions.length)) *
            100
    );

    return (
        <MainLayout title="แบบประเมินตนเอง">
            <div className="min-h-screen gradient-primary-soft">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                    {/* Header Card */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="glass-card rounded-2xl p-6 sm:p-8">
                            {/* Title Row */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/25">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                            แบบประเมินตนเอง
                                        </h1>
                                        <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                                            {current_part.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    {saveStatus !== 'idle' && (
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                            saveStatus === 'saving' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                                            saveStatus === 'saved' && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                                            saveStatus === 'error' && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        )}>
                                            {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" />กำลังบันทึก...</>}
                                            {saveStatus === 'saved' && <><Save className="w-3 h-3" />บันทึกแล้ว</>}
                                            {saveStatus === 'error' && <><AlertCircle className="w-3 h-3" />บันทึกไม่สำเร็จ</>}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium">
                                        <Sparkles className="w-4 h-4" />
                                        {overallProgress}%
                                    </div>
                                </div>
                            </div>

                            {/* Step Progress */}
                            <div className="flex items-center gap-2 mb-4">
                                {Array.from(
                                    { length: total_steps },
                                    (_, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "h-2 flex-1 rounded-full transition-all duration-500",
                                                i + 1 < step
                                                    ? "bg-violet-500"
                                                    : i + 1 === step
                                                    ? "bg-gradient-to-r from-violet-500 to-purple-500"
                                                    : "bg-gray-200 dark:bg-gray-700"
                                            )}
                                        />
                                    )
                                )}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    ตอนที่ {step} / {total_steps}
                                </span>
                                <span>
                                    หัวข้อ {currentIndex + 1} /{" "}
                                    {groupedQuestions.length}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Aspect Header */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`header-${currentIndex}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6"
                        >
                            {currentGroup?.subaspectName ? (
                                <div className="glass-card rounded-2xl p-5 border-l-4 border-violet-500">
                                    <div className="flex items-start gap-3">
                                        <BookOpen className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">
                                                {currentGroup.aspectName}
                                            </p>
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                                {currentGroup.subaspectName}
                                            </h3>
                                            {currentGroup.subaspectDescription && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {
                                                        currentGroup.subaspectDescription
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                currentGroup?.aspectName && (
                                    <div className="rounded-2xl gradient-primary p-5 sm:p-6 text-white shadow-lg shadow-violet-500/20">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 flex-shrink-0" />
                                            <div>
                                                <h3 className="text-base sm:text-lg font-bold">
                                                    {currentGroup.aspectName}
                                                </h3>
                                                <p className="text-sm text-white/80 mt-1">
                                                    {
                                                        currentGroup.questions
                                                            .length
                                                    }{" "}
                                                    คำถาม
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Questions */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="space-y-5"
                        >
                            {currentGroup?.questions.map((question, index) => (
                                <motion.div
                                    key={question.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                >
                                    <QuestionCard
                                        question={question}
                                        answer={answers[question.id]}
                                        onAnswerChange={(value) =>
                                            updateAnswer(question.id, value)
                                        }
                                        questionNumber={index + 1}
                                        hideScoreDescription
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Completion Status */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                            "mt-6 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all",
                            isGroupComplete
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        )}
                    >
                        {isGroupComplete ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">
                                    ตอบครบทุกข้อแล้ว
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">
                                    ตอบแล้ว {answeredInGroup}/
                                    {currentGroup?.questions.length ?? 0} ข้อ
                                </span>
                            </>
                        )}
                    </motion.div>

                    {/* Navigation Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 glass-card rounded-2xl p-5 sm:p-6"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 hover:border-violet-300 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline font-medium">
                                    ย้อนกลับ
                                </span>
                            </Button>

                            {/* Center info */}
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {currentIndex + 1} /{" "}
                                    {groupedQuestions.length}
                                </div>
                                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1.5">
                                    <div
                                        className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${
                                                ((currentIndex + 1) /
                                                    groupedQuestions.length) *
                                                100
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleNextGroup}
                                disabled={!isGroupComplete || isLoading}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-xl font-medium shadow-lg transition-all",
                                    isLastGroup && isLastStep
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
                                        : "gradient-primary hover:opacity-90 shadow-violet-500/25"
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="hidden sm:inline">
                                            บันทึก...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">
                                            {isLastGroup
                                                ? isLastStep
                                                    ? "ส่งแบบประเมิน"
                                                    : "ตอนถัดไป"
                                                : "ถัดไป"}
                                        </span>
                                        {isLastGroup && isLastStep ? (
                                            <Send className="w-4 h-4" />
                                        ) : (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Completion Modal — explicit submit confirmation */}
            <Dialog
                open={showCompletionModal}
                onOpenChange={setShowCompletionModal}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold">
                            ยืนยันส่งแบบประเมิน?
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            หลังส่งแล้วจะไม่สามารถกลับมาแก้ไขได้อีก
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                        >
                            <CheckCircle className="w-10 h-10 text-white" />
                        </motion.div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowCompletionModal(false)}
                            disabled={isLoading}
                        >
                            กลับไปแก้ไข
                        </Button>
                        <Button
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    // Build all answers payload from current state
                                    const allAnswers = Object.entries(answersRef.current).map(([qId, val]) => ({
                                        question_id: Number(qId),
                                        value: val,
                                    }));
                                    await axios.post(route("evaluations.self.submit"), {
                                        evaluation_id: evaluation.id,
                                        evaluatee_id: evaluatee_id ?? auth.user.id,
                                        fiscal_year: fiscal_year,
                                        answers: allAnswers,
                                    });
                                    setShowCompletionModal(false);
                                    router.visit(route("dashboard"), {
                                        method: "get",
                                        preserveScroll: false,
                                        preserveState: false,
                                    });
                                } catch {
                                    toast.error("ส่งไม่สำเร็จ กรุณาลองอีกครั้ง");
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            className="gradient-primary text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-violet-500/25"
                        >
                            {isLoading ? "กำลังส่ง..." : "ยืนยันส่ง"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
