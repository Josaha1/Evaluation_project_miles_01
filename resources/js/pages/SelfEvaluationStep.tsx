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
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import axios from "axios";
import { ProgressIndicator } from "@/Components/ProgressIndicator";
import { QuestionCard } from "@/Components/QuestionCard";

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
    }>().props;

    const [answers, setAnswers] = useState<{ [questionId: number]: any }>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    // โหลดคำตอบที่มีอยู่แล้วเมื่อเริ่มต้น
    useEffect(() => {
        if (existingAnswers) {
           
            
            // Convert existing answers format to match our state structure
            const formattedAnswers: { [questionId: number]: any } = {};
            
            Object.entries(existingAnswers).forEach(([questionIdStr, answerValue]) => {
                const questionId = parseInt(questionIdStr);
                
                // Handle different answer formats
                let processedValue = answerValue;
                
                // If it's a JSON string, try to parse it
                if (typeof answerValue === 'string') {
                    try {
                        // Try to parse as JSON (for array/object answers)
                        const parsed = JSON.parse(answerValue);
                        processedValue = parsed;
                    } catch (e) {
                        // If not JSON, keep as string
                        processedValue = answerValue;
                    }
                }
                
                formattedAnswers[questionId] = processedValue;
     
            });
            
           
            setAnswers(formattedAnswers);
        } else {
   
            setAnswers({});
        }
    }, [existingAnswers]);

    // แยกคำถามเป็นกลุ่มตามด้านย่อยหรือแอสเปกหลัก
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
    
    // Check if we should go to last group (when coming from previous step navigation)
    useEffect(() => {
        const shouldGoToLast = new URLSearchParams(window.location.search).get('goto_last') === '1';
        if (shouldGoToLast && groupedQuestions.length > 0) {
            setCurrentIndex(groupedQuestions.length - 1);
            // Remove the parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('goto_last');
            window.history.replaceState({}, '', url.toString());
        }
    }, [groupedQuestions.length]);

    const updateAnswer = (questionId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const isGroupComplete = currentGroup.questions.every((q) => {
        const ans = answers[q.id];
        return (
            ans !== undefined &&
            ans !== "" &&
            !(Array.isArray(ans) && ans.length === 0)
        );
    });

    const handlePrevious = () => {
        if (currentIndex > 0) {
            // Go to previous group within current step
            setCurrentIndex(currentIndex - 1);
        } else {
            // Go to previous step if we're at the first group of current step
            if (step > 1) {
                setIsLoading(true);
                // Add parameter to indicate we want to go to the last group of previous step
                router.visit(
                    route("evaluations.self.questions", { 
                        step: step - 1,
                        goto_last: 1  // Flag to indicate going to last group
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
                            alert("เกิดข้อผิดพลาดในการโหลดขั้นตอนก่อนหน้า");
                        }
                    }
                );
            } else {
                // If we're at step 1, go back to dashboard
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
                });
            } catch (error) {
                console.error("Error saving answers:", error);
                alert("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่");
                setIsLoading(false);
                return;
            }
            setIsLoading(false);
        }

        if (currentIndex < groupedQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsLoading(true);
            router.visit(
                route("evaluations.self.questions", { step: step + 1 }),
                {
                    method: "get",
                    preserveScroll: true,
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

    return (
        <MainLayout title="แบบประเมินตนเอง">
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-violet-900/20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <User
                                className="text-violet-600 dark:text-violet-400"
                                size={20}
                            />
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                                แบบประเมินตนเอง
                            </h1>
                        </div>

                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-violet-700 dark:text-violet-400 mb-4">
                                {current_part.title}
                            </h2>

                            <ProgressIndicator
                                currentStep={step}
                                totalSteps={total_steps}
                                currentGroup={currentIndex}
                                totalGroups={groupedQuestions.length}
                            />
                        </div>
                    </motion.div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="space-y-4 sm:space-y-6"
                        >
                           
                            
                            {/* Aspect-only Header - เมื่อไม่มีด้านย่อย */}
                            {!currentGroup.subaspectName && currentGroup.aspectName && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white"
                                >
                                    <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2">
                                        📋 {currentGroup.aspectName}
                                    </h3>
                                    <p className="text-sm sm:text-base text-violet-100 leading-relaxed">
                                        คำถามในด้านนี้ ({currentGroup.questions.length} ข้อ)
                                    </p>
                                </motion.div>
                            )}

                            {/* Questions */}
                            <div className="space-y-4 sm:space-y-6">
                                {currentGroup.questions.map(
                                    (question, index) => (
                                        <QuestionCard
                                            key={question.id}
                                            question={question}
                                            answer={answers[question.id]}
                                            onAnswerChange={(value) =>
                                                updateAnswer(question.id, value)
                                            }
                                            questionNumber={index + 1}
                                        />
                                    )
                                )}
                            </div>

                            {/* Completion Status */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`flex items-center justify-center space-x-2 p-4 rounded-xl ${
                                    isGroupComplete
                                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                        : "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                                }`}
                            >
                                {isGroupComplete ? (
                                    <>
                                        <CheckCircle size={20} />
                                        <span className="font-medium">
                                            ตอบครบทุกข้อแล้ว
                                        </span>
                                        {currentGroup.aspectName && (
                                            <span className="text-xs bg-green-100 dark:bg-green-800/30 px-2 py-1 rounded">
                                                ด้าน: {currentGroup.aspectName}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={20} />
                                        <span className="font-medium">
                                            กรุณาตอบให้ครบทุกข้อ (
                                            {
                                                currentGroup.questions.filter(
                                                    (q) => {
                                                        const ans =
                                                            answers[q.id];
                                                        return (
                                                            ans !== undefined &&
                                                            ans !== "" &&
                                                            !(
                                                                Array.isArray(
                                                                    ans
                                                                ) &&
                                                                ans.length === 0
                                                            )
                                                        );
                                                    }
                                                ).length
                                            }
                                            /{currentGroup.questions.length})
                                        </span>
                                        {currentGroup.aspectName && (
                                            <span className="text-xs bg-orange-100 dark:bg-orange-800/30 px-2 py-1 rounded">
                                                ด้าน: {currentGroup.aspectName}
                                            </span>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 sm:mt-8 p-4 sm:p-6 lg:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
                    >
                        {/* Mobile-first layout */}
                        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:items-center">
                            {/* Left: Previous Button */}
                            <div className="flex justify-start">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 w-auto min-w-[120px] transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
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
                                            className="bg-gradient-to-r from-violet-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
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
                                    className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 w-auto min-w-[140px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg"
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
        </MainLayout>
    );
}
