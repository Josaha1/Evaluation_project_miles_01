import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import { Button } from "@/Components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    ArrowLeft,
    Send,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Save,
} from "lucide-react";
import axios from "axios";
import { ProgressIndicator } from "@/Components/ProgressIndicator";
import { QuestionCard } from "@/Components/QuestionCard";
import { EvaluateeRatingCard } from "@/Components/EvaluateeRatingCard";
import { MultiEvaluateeQuestionCard } from "@/Components/MultiEvaluateeQuestionCard";
import EvaluateeSelector from "@/Components/EvaluateeSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/Components/ui/dialog";
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
    subaspectName: string | null;
    subaspectDescription: string | null;
    questions: Question[];
}

interface Evaluatee {
    id: number;
    name: string;
    position: string;
    department: string;
    division: string;
    grade: number;
    user_type: string;
    is_completed?: boolean;
    angle?: string;
    angle_label?: string;
}

export default function AssignedEvaluationStep() {
    const {
        evaluation,
        current_part,
        step,
        total_steps,
        evaluatee_id,
        current_evaluatee,
        assigned_evaluatees,
        current_angle,
        same_angle_evaluatees,
        all_evaluatees_in_angle,
        auth,
        groupIndex,
        totalGroups,
        existingAnswers,
        fiscal_year,
    } = usePage<{
        evaluation: { id: number };
        current_part: { id: number; title: string; aspects: Aspect[] };
        step: number;
        total_steps: number;
        evaluatee_id: number;
        current_evaluatee: {
            id: number;
            name: string;
            position: string;
            department: string;
            division: string;
            grade: number;
        };
        assigned_evaluatees: any[];
        current_angle?: string;
        same_angle_evaluatees?: any[];
        all_evaluatees_in_angle?: Evaluatee[];
        auth: { user: { id: number } };
        groupIndex: number;
        totalGroups: number;
        existingAnswers?: { [questionId: number]: any };
        fiscal_year?: number;
    }>().props;

    // Get evaluatees for this angle (fallback to current evaluatee if no others)
    const evaluateesForRating = all_evaluatees_in_angle && all_evaluatees_in_angle.length > 0
        ? all_evaluatees_in_angle
        : [{
            id: evaluatee_id,
            name: current_evaluatee.name,
            position: current_evaluatee.position,
            department: current_evaluatee.department,
            division: current_evaluatee.division,
            grade: current_evaluatee.grade,
            user_type: 'employee'
        }];

    // Log evaluatees info for debugging
    React.useEffect(() => {

    }, [current_angle, all_evaluatees_in_angle, evaluateesForRating]);

    const [answers, setAnswers] = useState<{ [questionId: number]: { [evaluateeId: number]: any } }>({});
    const [currentIndex, setCurrentIndex] = useState(groupIndex || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    // Always reflects latest answers — used by autoSave so it never reads stale closure
    const answersRef = React.useRef(answers);
    React.useEffect(() => { answersRef.current = answers; }, [answers]);

    // Load existing answers
    useEffect(() => {
        if (existingAnswers) {
            const convertedAnswers: { [questionId: number]: { [evaluateeId: number]: any } } = {};

            Object.entries(existingAnswers).forEach(([questionId, answersByEvaluatee]) => {
                const questionIdNum = parseInt(questionId);
                if (!convertedAnswers[questionIdNum]) {
                    convertedAnswers[questionIdNum] = {};
                }

                if (typeof answersByEvaluatee === "object" && answersByEvaluatee !== null) {
                    Object.entries(answersByEvaluatee).forEach(([evaluateeIdStr, answer]) => {
                        const evaluateeIdNum = parseInt(evaluateeIdStr);
                        const isValidEvaluatee = evaluateesForRating.some(e => e.id === evaluateeIdNum);

                        if (isValidEvaluatee) {
                            convertedAnswers[questionIdNum][evaluateeIdNum] = answer;
                        }
                    });
                } else {
                    convertedAnswers[questionIdNum][evaluatee_id] = answersByEvaluatee;
                }
            });

            const answerCount: { [evaluateeId: number]: number } = {};
            Object.entries(convertedAnswers).forEach(([questionId, questionAnswers]) => {
                Object.keys(questionAnswers).forEach(evaluateeIdStr => {
                    const evaluateeId = parseInt(evaluateeIdStr);
                    answerCount[evaluateeId] = (answerCount[evaluateeId] || 0) + 1;
                });
            });

            evaluateesForRating.forEach(evaluatee => {
                const count = answerCount[evaluatee.id] || 0;
            });

            setAnswers(convertedAnswers);
        } else {
            setAnswers({});
        }
    }, [existingAnswers, evaluatee_id, evaluateesForRating, all_evaluatees_in_angle]);

    const groupedQuestions: Group[] = current_part.aspects.flatMap((aspect) => {
        const hasSubaspects = (aspect.subaspects || []).length > 0;
        const subGroups = hasSubaspects
            ? (aspect.subaspects || []).map((sub) => ({
                  subaspectName: sub.name,
                  subaspectDescription: sub.description || null,
                  questions: sub.questions,
              }))
            : [];

        const aspectOnly =
            !hasSubaspects && aspect.questions.length > 0
                ? [
                      {
                          subaspectName: aspect.name,
                          subaspectDescription: null,
                          questions: aspect.questions,
                      },
                  ]
                : [];
        return [...subGroups, ...aspectOnly];
    });

    const currentGroup = groupedQuestions[currentIndex];

    // Check if we should go to last group (when coming from previous step navigation)
    useEffect(() => {
        const shouldGoToLast = new URLSearchParams(window.location.search).get('goto_last') === '1';
        if (shouldGoToLast && groupedQuestions.length > 0) {
            setCurrentIndex(groupedQuestions.length - 1);
            const url = new URL(window.location.href);
            url.searchParams.delete('goto_last');
            window.history.replaceState({}, '', url.toString());
        }
    }, [groupedQuestions.length]);

    // Unwrap {value, other_text} envelope and check if real answer is present
    const hasAnswerValue = (ans: any, qType: string): boolean => {
        if (qType === "open_text") return true;
        if (typeof ans === 'object' && ans !== null && !Array.isArray(ans) && 'value' in ans) {
            ans = (ans as any).value;
        }
        if (ans === undefined || ans === null || ans === "") return false;
        if (Array.isArray(ans) && ans.length === 0) return false;
        return true;
    };

    // Check if all questions are answered for all evaluatees in the angle
    const isGroupComplete = currentGroup.questions.every((q) => {
        const questionAnswers = answers[q.id] || {};
        if (evaluateesForRating && evaluateesForRating.length > 1) {
            return evaluateesForRating.every(evaluatee => hasAnswerValue(questionAnswers[evaluatee.id], q.type));
        }
        return hasAnswerValue(questionAnswers[evaluatee_id], q.type);
    });

    const autoSave = React.useCallback(async () => {
        if (!currentGroup) return;
        const latest = answersRef.current;

        const currentAnswers: Record<string, any> = {};
        currentGroup.questions.forEach((q) => {
            const questionAnswers = latest[q.id];
            if (questionAnswers === undefined) return;

            if (evaluateesForRating && evaluateesForRating.length > 1) {
                evaluateesForRating.forEach(evaluatee => {
                    if (!Object.prototype.hasOwnProperty.call(questionAnswers, evaluatee.id)) return;
                    const val = questionAnswers[evaluatee.id];

                    const key = `${q.id}_${evaluatee.id}`;
                    const answerData: any = {
                        question_id: q.id,
                        evaluatee_id: evaluatee.id,
                        value: val,
                    };
                    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                        answerData.value = val.value ?? null;
                        answerData.other_text = val.other_text ?? null;
                    }
                    currentAnswers[key] = answerData;
                });
            } else {
                if (!Object.prototype.hasOwnProperty.call(questionAnswers, evaluatee_id)) return;
                const val = questionAnswers[evaluatee_id];
                currentAnswers[q.id] = val;
            }
        });

        if (Object.keys(currentAnswers).length === 0) return;

        setSaveStatus('saving');
        try {
            await axios.post(
                route("assigned-evaluations.step", {
                    evaluatee: evaluatee_id,
                    step,
                }),
                {
                    evaluation_id: evaluation.id,
                    part_id: current_part.id,
                    evaluatee_id,
                    answers: currentAnswers,
                    fiscal_year: fiscal_year,
                }
            );
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 5000);
        }
    }, [currentGroup, step, evaluation.id, current_part.id, evaluatee_id, evaluateesForRating, fiscal_year]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const triggerAutoSave = () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            autoSave();
        }, 2000);
    };

    const updateAnswer = (questionId: number, evaluateeId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [evaluateeId]: value
            }
        }));
        triggerAutoSave();
    };

    const updateSingleAnswer = (questionId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [evaluatee_id]: value
            }
        }));
        triggerAutoSave();
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            if (step > 1) {
                setIsLoading(true);
                router.visit(
                    route("assigned-evaluations.questions", {
                        evaluatee: evaluatee_id,
                        step: step - 1,
                        goto_last: 1
                    }),
                    {
                        method: "get",
                        preserveScroll: false,
                        preserveState: false,
                        onFinish: () => {
                            setIsLoading(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                        onError: () => {
                            setIsLoading(false);
                            toast.error("เกิดข้อผิดพลาดในการโหลดขั้นตอนก่อนหน้า");
                        }
                    }
                );
            } else {
                router.visit(route("dashboard"));
            }
        }
    };

    const handleNextGroup = async () => {
        const currentAnswers: Record<string, any> = {};

        if (currentIndex < groupedQuestions.length - 1) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }

        currentGroup.questions.forEach((q) => {
            const questionAnswers = answers[q.id];
            if (questionAnswers === undefined) return;

            if (evaluateesForRating && evaluateesForRating.length > 1) {
                evaluateesForRating.forEach(evaluatee => {
                    if (!Object.prototype.hasOwnProperty.call(questionAnswers, evaluatee.id)) return;
                    const val = questionAnswers[evaluatee.id];

                    // INCLUDE null/empty values so backend can delete row (uncheck flow)
                    const key = `${q.id}_${evaluatee.id}`;
                    const answerData: any = {
                        question_id: q.id,
                        evaluatee_id: evaluatee.id,
                        value: val,
                    };
                    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                        answerData.value = val.value ?? null;
                        answerData.other_text = val.other_text ?? null;
                    }
                    currentAnswers[key] = answerData;
                });
            } else {
                if (!Object.prototype.hasOwnProperty.call(questionAnswers, evaluatee_id)) return;
                const val = questionAnswers[evaluatee_id];
                currentAnswers[q.id] = val;
            }
        });

        if (Object.keys(currentAnswers).length > 0) {
            setIsLoading(true);
            try {
                const response = await axios.post(
                    route("assigned-evaluations.step", {
                        evaluatee: evaluatee_id,
                        step,
                    }),
                    {
                        evaluation_id: evaluation.id,
                        part_id: current_part.id,
                        evaluatee_id,
                        answers: currentAnswers,
                        fiscal_year: fiscal_year,
                    }
                );
                toast.success("บันทึกคำตอบเรียบร้อยแล้ว");
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
        } else {
            setIsLoading(true);

            if (step >= total_steps && currentIndex >= groupedQuestions.length - 1) {
                setShowCompletionModal(true);
                setIsLoading(false);
                return;
            }

            if (currentIndex >= groupedQuestions.length - 1 && step < total_steps) {
                const nextUrl = route("assigned-evaluations.questions", {
                    evaluatee: evaluatee_id,
                    step: step + 1,
                }) + (fiscal_year ? `?fiscal_year=${fiscal_year}` : '');
                router.visit(nextUrl, {
                        method: "get",
                        preserveScroll: false,
                        preserveState: false,
                        onFinish: () => {
                            setIsLoading(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                        onError: () => {
                            setIsLoading(false);
                            toast.error("เกิดข้อผิดพลาดในการโหลดขั้นตอนถัดไป");
                        }
                    }
                );
            } else {
                const sameStepUrl = route("assigned-evaluations.questions", {
                    evaluatee: evaluatee_id,
                    step: step,
                }) + (fiscal_year ? `?fiscal_year=${fiscal_year}` : '');
                router.visit(sameStepUrl, {
                        method: "get",
                        preserveScroll: false,
                        preserveState: false,
                        onFinish: () => {
                            setIsLoading(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
                        onError: () => {
                            setIsLoading(false);
                            toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
                        }
                    }
                );
            }
        }
    };

    const isLastGroup = currentIndex === groupedQuestions.length - 1;
    const isLastStep = step === total_steps;

    return (
        <MainLayout title="แบบประเมินผู้ได้รับมอบหมาย">
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <Users
                                className="text-violet-600 dark:text-violet-400"
                                size={24}
                            />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                แบบประเมินผู้ได้รับมอบหมาย
                            </h1>
                        </div>

                        <div className="glass-card rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-violet-700 dark:text-violet-400">
                                    {current_part.title}
                                </h2>
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
                            </div>

                            <ProgressIndicator
                                currentStep={step}
                                totalSteps={total_steps}
                                currentGroup={currentIndex}
                                totalGroups={groupedQuestions.length}
                            />
                        </div>
                    </motion.div>

                    {/* Evaluatees Info Card */}
                    {evaluateesForRating.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card rounded-2xl p-4 mb-6"
                        >
                            <div className="flex items-center space-x-2 mb-4">
                                <Users size={16} className="text-violet-600 dark:text-violet-400" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    รายชื่อผู้ถูกประเมินทั้งหมด
                                </h3>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                    {evaluateesForRating.length} คน
                                </span>
                            </div>

                            <div className="space-y-4">
                                {['top', 'bottom', 'left', 'right'].map((angle) => {
                                    const angleEvaluatees = evaluateesForRating.filter(e => e.angle === angle);
                                    if (angleEvaluatees.length === 0) return null;

                                    const angleConfig = {
                                        top: {
                                            label: 'ผู้ใต้บังคับบัญชา',
                                            color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
                                            bgColor: 'bg-violet-50 dark:bg-violet-900/10'
                                        },
                                        bottom: {
                                            label: 'ผู้บังคับบัญชา',
                                            color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                                            bgColor: 'bg-emerald-50 dark:bg-emerald-900/10'
                                        },
                                        left: {
                                            label: 'องศาซ้าย',
                                            color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                            bgColor: 'bg-amber-50 dark:bg-amber-900/10'
                                        },
                                        right: {
                                            label: 'องศาขวา',
                                            color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                                            bgColor: 'bg-purple-50 dark:bg-purple-900/10'
                                        }
                                    };

                                    const config = angleConfig[angle];

                                    return (
                                        <div key={angle} className={`rounded-xl p-3 ${config.bgColor} border border-gray-200/50 dark:border-gray-700/50`}>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {angleEvaluatees.length} คน
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {angleEvaluatees.map((evaluatee, index) => (
                                                    <div
                                                        key={evaluatee.id}
                                                        className="flex items-center space-x-2 p-2 bg-white/60 dark:bg-gray-700/60 rounded-lg"
                                                    >
                                                        <div className="w-5 h-5 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center border border-gray-300 dark:border-gray-500">
                                                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                                {index + 1}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                                {evaluatee.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {evaluatee.position}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                                            G{evaluatee.grade}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="space-y-6"
                        >
                            {/* Section Header */}
                            {currentGroup.subaspectName && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="gradient-primary rounded-2xl p-6 text-white shadow-lg"
                                >
                                    <h3 className="text-xl font-bold mb-2">
                                        {currentGroup.subaspectName}
                                    </h3>
                                    {currentGroup.subaspectDescription && (
                                        <p className="text-violet-100 leading-relaxed">
                                            {currentGroup.subaspectDescription}
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* Questions */}
                            <div className="space-y-6">
                                {currentGroup.questions.map(
                                    (question, index) => {
                                        if (evaluateesForRating.length > 1) {
                                            const questionAnswers = answers[question.id] || {};

                                            return (
                                                <MultiEvaluateeQuestionCard
                                                    key={question.id}
                                                    question={question}
                                                    evaluatees={evaluateesForRating}
                                                    answers={questionAnswers}
                                                    onAnswerChange={(evaluateeId, value) =>
                                                        updateAnswer(question.id, evaluateeId, value)
                                                    }
                                                    questionNumber={index + 1}
                                                />
                                            );
                                        }

                                        return (
                                            <QuestionCard
                                                key={question.id}
                                                question={question}
                                                answer={answers[question.id]?.[evaluatee_id]}
                                                onAnswerChange={(value) =>
                                                    updateSingleAnswer(question.id, value)
                                                }
                                                questionNumber={index + 1}
                                                hideScoreDescription
                                            />
                                        );
                                    }
                                )}
                            </div>

                            {/* Completion Status */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`flex items-center justify-center space-x-2 p-4 rounded-xl ${
                                    isGroupComplete
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                }`}
                            >
                                {isGroupComplete ? (
                                    <>
                                        <CheckCircle size={20} />
                                        <span className="font-medium">
                                            ตอบครบทุกข้อแล้ว
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={20} />
                                        <span className="font-medium">
                                            กรุณาตอบให้ครบทุกข้อ (
                                            {
                                                currentGroup.questions.filter(
                                                    (q) => {
                                                        const questionAnswers = answers[q.id] || {};

                                                        if (evaluateesForRating && evaluateesForRating.length > 1) {
                                                            return evaluateesForRating.every(evaluatee => {
                                                                const ans = questionAnswers[evaluatee.id];

                                                                switch (q.type) {
                                                                    case "rating":
                                                                        return ans !== undefined && ans !== "" && ans !== null;
                                                                    case "choice":
                                                                        if (typeof ans === 'object' && ans !== null) {
                                                                            return ans.value !== undefined && ans.value !== "" && ans.value !== null;
                                                                        } else {
                                                                            return ans !== undefined && ans !== "" && ans !== null;
                                                                        }
                                                                    case "multiple_choice":
                                                                        if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                                                                            return Array.isArray(ans.value) && ans.value.length > 0;
                                                                        } else {
                                                                            return Array.isArray(ans) && ans.length > 0;
                                                                        }
                                                                    case "open_text":
                                                                        return true;  // optional
                                                                    default:
                                                                        return ans !== undefined && ans !== "" && ans !== null;
                                                                }
                                                            });
                                                        }

                                                        const ans = questionAnswers[evaluatee_id];
                                                        switch (q.type) {
                                                            case "rating":
                                                                return ans !== undefined && ans !== "" && ans !== null;
                                                            case "choice":
                                                                if (typeof ans === 'object' && ans !== null) {
                                                                    return ans.value !== undefined && ans.value !== "" && ans.value !== null;
                                                                } else {
                                                                    return ans !== undefined && ans !== "" && ans !== null;
                                                                }
                                                            case "multiple_choice":
                                                                if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                                                                    return Array.isArray(ans.value) && ans.value.length > 0;
                                                                } else {
                                                                    return Array.isArray(ans) && ans.length > 0;
                                                                }
                                                            case "open_text":
                                                                return true;  // optional
                                                            default:
                                                                return ans !== undefined && ans !== "" && ans !== null;
                                                        }
                                                    }
                                                ).length
                                            }
                                            /{currentGroup.questions.length}
                                            {evaluateesForRating.length > 1 && ` | ${evaluateesForRating.length} คน`})
                                        </span>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 sm:mt-8 glass-card rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg"
                    >
                        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-center">
                            {/* Left: Previous Button */}
                            <div className="flex justify-start">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 w-auto min-w-[120px] rounded-xl border-2 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                                >
                                    <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
                                    <span className="font-medium">ย้อนกลับ</span>
                                </Button>
                            </div>

                            {/* Center: Progress Info */}
                            <div className="text-center space-y-2 lg:space-y-3">
                                <div className="space-y-1">
                                    <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">
                                        หัวข้อที่ {currentIndex + 1} จาก {groupedQuestions.length}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        ขั้นตอนที่ {step} จาก {total_steps}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full max-w-xs mx-auto">
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        <span>ความคืบหน้า</span>
                                        <span>{Math.round(((currentIndex + 1) / groupedQuestions.length) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="gradient-primary h-2 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${((currentIndex + 1) / groupedQuestions.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Next Button */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleNextGroup}
                                    disabled={!isGroupComplete || isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 w-auto min-w-[140px] gradient-primary text-white rounded-xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                }}
                                                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            <span className="font-medium">กำลังบันทึก...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-medium">
                                                {isLastGroup
                                                    ? isLastStep
                                                        ? "ส่งแบบประเมิน"
                                                        : "ไปยังตอนถัดไป"
                                                    : "ถัดไป"}
                                            </span>
                                            {isLastGroup && isLastStep ? (
                                                <Send size={16} className="sm:w-5 sm:h-5" />
                                            ) : (
                                                <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                                            )}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            {/* Completion Modal — explicit submit confirmation */}
            <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
                <DialogContent className="sm:max-w-md glass-card rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl text-gray-900 dark:text-white">
                            ยืนยันส่งแบบประเมิน?
                        </DialogTitle>
                        <DialogDescription className="text-center space-y-2">
                            <p>หลังส่งแล้วจะไม่สามารถกลับมาแก้ไขได้อีก</p>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center py-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                        <button
                            onClick={() => setShowCompletionModal(false)}
                            disabled={isLoading}
                            className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                        >
                            กลับไปแก้ไข
                        </button>
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    await axios.post(
                                        route("assigned-evaluations.submit", { evaluatee: evaluatee_id }),
                                        { fiscal_year: fiscal_year, evaluation_id: evaluation.id }
                                    );
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
                            className="px-6 py-2.5 gradient-primary text-white rounded-xl hover:opacity-90 transition-opacity font-medium shadow-lg"
                        >
                            {isLoading ? "กำลังส่ง..." : "ยืนยันส่ง"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
