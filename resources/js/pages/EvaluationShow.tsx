import React, { useState } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { motion } from "framer-motion";
import { Send, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { QuestionCard } from "@/Components/QuestionCard";
import PeerComparisonWidget from "@/Components/PeerComparisonWidget";

interface Option {
    id: number;
    label: string;
    score: number;
}

interface Question {
    id: number;
    title: string;
    type: "open_text" | "rating";
    options?: Option[];
}

interface Section {
    id: number;
    name: string;
    questions: Question[];
}

interface Evaluation {
    id: number;
    title: string;
    sections: Section[];
}

interface Assignment {
    id: number;
    evaluator_id: number;
    evaluatee_id: number;
    evaluation_id: number;
    status: string;
}

interface Props {
    evaluation: Evaluation;
    assignment: Assignment;
    peerComparison?: any;
}

export default function EvaluationShow({ evaluation, assignment, peerComparison }: Props) {
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (questionId: number, value: string) => {
        setResponses((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // ส่งคำตอบไปยังเซิร์ฟเวอร์
          

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            alert("ส่งแบบประเมินเรียบร้อยแล้ว");
        } catch (error) {
            console.error("Error submitting evaluation:", error);
            alert("เกิดข้อผิดพลาดในการส่งแบบประเมิน");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalQuestions = evaluation.sections.reduce(
        (total, section) => total + section.questions.length,
        0
    );
    const answeredQuestions = Object.keys(responses).filter(
        (key) => responses[parseInt(key)] !== ""
    ).length;
    const completionPercentage =
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    const isComplete = answeredQuestions === totalQuestions;

    return (
        <MainLayout title={evaluation.title}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <FileText
                                className="text-blue-600 dark:text-blue-400"
                                size={24}
                            />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {evaluation.title}
                            </h1>
                        </div>

                        {/* Progress Overview */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ความคืบหน้า
                                </span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    {Math.round(completionPercentage)}%
                                </span>
                            </div>

                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                                <motion.div
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${completionPercentage}%`,
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        ease: "easeOut",
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                    <CheckCircle2
                                        size={16}
                                        className="text-green-500"
                                    />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        ตอบแล้ว {answeredQuestions} ข้อ
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Clock
                                        size={16}
                                        className="text-orange-500"
                                    />
                                    <span className="text-gray-600 dark:text-gray-400">
                                        เหลือ{" "}
                                        {totalQuestions - answeredQuestions} ข้อ
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Peer Comparison Widget */}
                    {peerComparison && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <PeerComparisonWidget 
                                peerComparison={peerComparison}
                                className="mx-auto"
                            />
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {evaluation.sections.map((section, sectionIndex) => (
                            <motion.div
                                key={section.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: sectionIndex * 0.1 }}
                                className="space-y-6"
                            >
                                {/* Section Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                                    <h2 className="text-xl font-bold mb-2">
                                        📋 {section.name}
                                    </h2>
                                    <p className="text-blue-100">
                                        {section.questions.length} คำถาม
                                    </p>
                                </div>

                                {/* Questions */}
                                <div className="space-y-6">
                                    {section.questions.map(
                                        (question, questionIndex) => (
                                            <QuestionCard
                                                key={question.id}
                                                question={question}
                                                answer={responses[question.id]}
                                                onAnswerChange={(value) =>
                                                    handleChange(
                                                        question.id,
                                                        value
                                                    )
                                                }
                                                questionNumber={
                                                    questionIndex + 1
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </motion.div>
                        ))}

                        {/* Submit Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sticky bottom-6 z-10"
                        >
                            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                                {/* Completion Status */}
                                <div
                                    className={`flex items-center justify-center space-x-2 p-4 rounded-xl mb-4 ${
                                        isComplete
                                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                            : "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                                    }`}
                                >
                                    {isComplete ? (
                                        <>
                                            <CheckCircle2 size={20} />
                                            <span className="font-medium">
                                                ตอบครบทุกข้อแล้ว
                                                พร้อมส่งแบบประเมิน
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={20} />
                                            <span className="font-medium">
                                                กรุณาตอบให้ครบทุกข้อก่อนส่งแบบประเมิน
                                                ({answeredQuestions}/
                                                {totalQuestions})
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center">
                                    <button
                                        type="submit"
                                        disabled={!isComplete || isSubmitting}
                                        className={`
                                            flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200
                                            ${
                                                isComplete && !isSubmitting
                                                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                                                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                            }
                                        `}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{
                                                        duration: 1,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    }}
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                                <span>กำลังส่ง...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={20} />
                                                <span>ส่งแบบประเมิน</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
