import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import { Button } from "@/Components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

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

export default function AssignedEvaluationStep() {
    const {
        evaluation,
        current_part,
        step,
        total_steps,
        evaluatee_id,
        auth,
        groupIndex,
    } = usePage<{
        evaluation: { id: number };
        current_part: { id: number; title: string; aspects: Aspect[] };
        step: number;
        total_steps: number;
        evaluatee_id: number;
        auth: { user: { id: number } };
        groupIndex: number;
    }>().props;

    const [answers, setAnswers] = useState<{ [questionId: number]: any }>({});

    const [currentIndex, setCurrentIndex] = useState(groupIndex || 0);
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
    const isGroupComplete = currentGroup.questions.every((q) => {
        const ans = answers[q.id];
        return (
            ans !== undefined &&
            ans !== "" &&
            !(Array.isArray(ans) && ans.length === 0)
        );
    });
    const updateAnswer = (questionId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleNextGroup = async () => {
        const currentAnswers = currentGroup.questions.reduce((acc, q) => {
            const val = answers[q.id];
            if (val !== undefined && val !== "") acc[q.id] = val;
            return acc;
        }, {} as Record<number, any>);

        if (Object.keys(currentAnswers).length > 0) {
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
                    }
                );
            } catch (error) {
                console.error("Error saving answers:", error);
                return alert("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่");
            }
        }

        if (currentIndex < groupedQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            router.visit(
                route("assigned-evaluations.show", {
                    evaluateeId: evaluatee_id,
                    step: step + 1,
                }),
                {
                    method: "get",
                    preserveScroll: true,
                    preserveState: false,
                }
            );
        }
    };

    const renderQuestion = (question: Question) => {
        const answer = answers[question.id] || "";
        const isSelected = (val: any) =>
            answer === val || answer?.includes?.(val);

        switch (question.type) {
            case "rating":
                return (
                    <div className="flex justify-center gap-2">
                        {[5, 4, 3, 2, 1].map((val) => (
                            <Button
                                key={val}
                                variant={
                                    isSelected(val) ? "default" : "outline"
                                }
                                className="w-12 h-12 rounded-full"
                                onClick={() => updateAnswer(question.id, val)}
                            >
                                {val}
                            </Button>
                        ))}
                    </div>
                );
            case "choice":
                return (
                    <div className="space-y-3 text-left">
                        {question.options?.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() =>
                                    updateAnswer(question.id, opt.id)
                                }
                                className={`w-full px-4 py-3 border rounded-lg shadow-sm transition-all
                  ${
                      isSelected(opt.id)
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:bg-gray-800"
                  }`}
                            >
                                <span className="block break-words text-sm md:text-base">
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>
                );
            case "multiple_choice":
                return (
                    <div className="space-y-2">
                        {question.options?.map((opt) => (
                            <Button
                                key={opt.id}
                                variant={
                                    isSelected(opt.id) ? "default" : "outline"
                                }
                                onClick={() => {
                                    const newAnswers = answer?.includes(opt.id)
                                        ? answer.filter(
                                              (id: number) => id !== opt.id
                                          )
                                        : [...(answer || []), opt.id];
                                    updateAnswer(question.id, newAnswers);
                                }}
                                className="w-full"
                            >
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                );
            case "open_text":
                return (
                    <textarea
                        value={answer}
                        onChange={(e) =>
                            updateAnswer(question.id, e.target.value)
                        }
                        rows={4}
                        className="w-full p-3 border rounded text-black dark:text-white bg-white dark:bg-gray-800"
                        placeholder="พิมพ์ความคิดเห็นของคุณ..."
                    />
                );
            default:
                return null;
        }
    };

    return (
        <MainLayout title="แบบประเมินผู้ได้รับมอบหมาย">
            <div className="max-w-2xl mx-auto py-12 px-6 space-y-6">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-xl font-bold text-indigo-700 text-center"
                >
                    ตอนที่ {step} / {total_steps}: {current_part.title}
                </motion.h2>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-md"
                    >
                        {currentGroup.subaspectName && (
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-blue-700">
                                    ด้านย่อย: {currentGroup.subaspectName}
                                </p>
                                {currentGroup.subaspectDescription && (
                                    <p className="text-sm text-gray-600">
                                        {currentGroup.subaspectDescription}
                                    </p>
                                )}
                            </div>
                        )}

                        {currentGroup.questions.map((q) => (
                            <div key={q.id} className="mb-6 text-left">
                                <h4 className="text-base font-semibold text-indigo-700 mb-2">
                                    {q.title}
                                </h4>
                                {renderQuestion(q)}
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                <div className="text-center">
                    <Button
                        size="lg"
                        onClick={handleNextGroup}
                        disabled={!isGroupComplete}
                        className="px-8 py-3 text-lg"
                    >
                        {currentIndex === groupedQuestions.length - 1
                            ? step === total_steps
                                ? "ส่งแบบประเมิน"
                                : "ไปยังตอนถัดไป"
                            : "ถัดไป"}
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}
