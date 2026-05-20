import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CheckCircle2, Info, AlertCircle } from "lucide-react";
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

interface Evaluatee {
    id: number;
    name: string;
    position: string;
    department: string;
    division: string;
    grade: number;
}

interface MultiEvaluateeQuestionCardProps {
    question: Question;
    evaluatees: Evaluatee[];
    answers: { [evaluateeId: number]: any };
    onAnswerChange: (evaluateeId: number, value: any, otherText?: string) => void;
    questionNumber: number;
}

const SCORE_META: Record<number, { label: string; bg: string; selectedBg: string; text: string }> = {
    5: { label: "ดีเยี่ยม", bg: "bg-emerald-100 text-emerald-700", selectedBg: "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30", text: "text-emerald-600" },
    4: { label: "ดีมาก", bg: "bg-blue-100 text-blue-700", selectedBg: "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/30", text: "text-blue-600" },
    3: { label: "ดี", bg: "bg-amber-100 text-amber-700", selectedBg: "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/30", text: "text-amber-600" },
    2: { label: "ต้องปรับปรุง", bg: "bg-orange-100 text-orange-700", selectedBg: "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/30", text: "text-orange-600" },
    1: { label: "ต้องปรับปรุงอย่างมาก", bg: "bg-red-100 text-red-700", selectedBg: "border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/30", text: "text-red-600" },
};

export function MultiEvaluateeQuestionCard({
    question,
    evaluatees,
    answers,
    onAnswerChange,
    questionNumber,
}: MultiEvaluateeQuestionCardProps) {
    const [showGuide, setShowGuide] = useState(false);

    React.useEffect(() => {
        evaluatees.forEach(evaluatee => {
            const hasAnswer = answers[evaluatee.id] !== undefined;
        });
    }, [answers, evaluatees, question.id]);

    const getSelectedValue = (evaluateeId: number) => {
        const answer = answers[evaluateeId];
        if (!answer) return null;
        if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            if (answer.value !== undefined) return answer.value;
            return answer;
        }
        return answer;
    };

    const getOtherText = (evaluateeId: number) => {
        const answer = answers[evaluateeId];
        if (!answer) return '';
        if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            return answer.other_text || '';
        }
        return '';
    };

    const renderAnswerOptions = (evaluatee: Evaluatee) => {
        const selectedValue = getSelectedValue(evaluatee.id);

        switch (question.type) {
            case "rating":
                // Sort options descending (5 -> 1)
                const sortedOptions = [...(question.options || [])].sort(
                    (a, b) => (b.score ?? 0) - (a.score ?? 0)
                );
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                กรุณาเลือกระดับคะแนน
                            </h5>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 md:flex md:flex-wrap md:gap-4 md:justify-center max-w-lg sm:max-w-none mx-auto md:mx-0">
                            {sortedOptions.map((option) => {
                                const isSelected = selectedValue === option.id;
                                const meta = SCORE_META[option.score] || SCORE_META[3];
                                return (
                                    <motion.button
                                        key={option.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onAnswerChange(evaluatee.id, isSelected ? null : option.id)}
                                        className={cn(
                                            "relative group touch-manipulation md:min-w-[80px] px-2 py-3 sm:px-3 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl border sm:border-2 font-semibold transition-all duration-200 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex items-center justify-center",
                                            isSelected
                                                ? meta.selectedBg
                                                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400"
                                        )}
                                    >
                                        <div className="text-center w-full">
                                            <div className="text-lg sm:text-xl md:text-xl font-bold mb-1">
                                                {option.score}
                                            </div>
                                            <div className="text-xs md:text-xs opacity-90 leading-tight px-1">
                                                {meta.label}
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                );

            case "choice":
                return (
                    <div className="space-y-2">
                        {question.options?.map((option) => {
                            const isSelected = selectedValue === option.id ||
                                              (typeof selectedValue === 'object' && selectedValue?.value === option.id);
                            const isOtherOption = option.label.includes('อื่นๆ') ||
                                                 option.label.includes('อื่น ๆ') ||
                                                 option.label.includes('อื่น') ||
                                                 option.label.toLowerCase().includes('other') ||
                                                 option.label.toLowerCase().includes('others');

                            return (
                                <div key={option.id}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isSelected) {
                                                // Uncheck — also clear other_text whether or not it was the Other option
                                                onAnswerChange(evaluatee.id, null);
                                            } else if (isOtherOption) {
                                                onAnswerChange(evaluatee.id, {
                                                    value: option.id,
                                                    other_text: getOtherText(evaluatee.id) || null
                                                });
                                            } else {
                                                onAnswerChange(evaluatee.id, {
                                                    value: option.id,
                                                    other_text: null
                                                });
                                            }
                                        }}
                                        className={cn(
                                            "w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border sm:border-2 transition-all duration-200 text-left text-sm sm:text-base touch-manipulation",
                                            isSelected
                                                ? "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-500 text-violet-700 dark:from-violet-900/20 dark:to-purple-900/20 dark:border-violet-500 dark:text-violet-300 shadow-lg shadow-violet-500/10"
                                                : "bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-violet-400 dark:hover:bg-violet-900/10 hover:shadow-md active:scale-95"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1 leading-relaxed">{option.label}</span>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>

                                    {(isOtherOption && isSelected) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 ml-4"
                                        >
                                            <div className={cn(
                                                "flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200",
                                                getOtherText(evaluatee.id)
                                                    ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
                                                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                            )}>
                                                <span className={cn(
                                                    "text-sm font-medium whitespace-nowrap",
                                                    getOtherText(evaluatee.id)
                                                        ? "text-violet-800 dark:text-violet-300"
                                                        : "text-amber-800 dark:text-amber-300"
                                                )}>
                                                    {getOtherText(evaluatee.id) ? 'รายละเอียด:' : 'ระบุรายละเอียด:'}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={getOtherText(evaluatee.id)}
                                                    onChange={(e) => {
                                                        const currentAnswer = answers[evaluatee.id];
                                                        let newAnswer;
                                                        if (typeof currentAnswer === 'object' && currentAnswer !== null && !Array.isArray(currentAnswer)) {
                                                            newAnswer = { ...currentAnswer, other_text: e.target.value || null };
                                                        } else {
                                                            newAnswer = {
                                                                value: currentAnswer || null,
                                                                other_text: e.target.value || null
                                                            };
                                                        }
                                                        onAnswerChange(evaluatee.id, newAnswer);
                                                    }}
                                                    placeholder="กรุณาระบุรายละเอียดเพิ่มเติม..."
                                                    className="flex-1 p-2 border border-violet-300 dark:border-violet-600 rounded-lg
                                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                                             focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                                    autoFocus
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );

            case "multiple_choice":
                return (
                    <div className="space-y-2">
                        {question.options?.map((option) => {
                            let selectedArray: any[] = [];
                            if (typeof selectedValue === 'object' && selectedValue !== null && !Array.isArray(selectedValue)) {
                                if (Array.isArray(selectedValue.value)) {
                                    selectedArray = selectedValue.value;
                                }
                            } else if (Array.isArray(selectedValue)) {
                                selectedArray = selectedValue;
                            }

                            const isSelected = selectedArray.includes(option.id);
                            const isOtherOption = option.label.includes('อื่นๆ') ||
                                                 option.label.includes('อื่น ๆ') ||
                                                 option.label.includes('อื่น') ||
                                                 option.label.toLowerCase().includes('other') ||
                                                 option.label.toLowerCase().includes('others');

                            return (
                                <div key={option.id}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            let newSelectedArray;
                                            if (isSelected) {
                                                newSelectedArray = selectedArray.filter((id: any) => id !== option.id);
                                            } else {
                                                newSelectedArray = [...selectedArray, option.id];
                                            }
                                            // When un-checking the "อื่นๆ" option, also clear other_text
                                            const isUncheckingOther = isSelected && isOtherOption;
                                            const newAnswer = {
                                                value: newSelectedArray,
                                                other_text: isUncheckingOther ? null : (getOtherText(evaluatee.id) || null)
                                            };
                                            onAnswerChange(evaluatee.id, newAnswer);
                                        }}
                                        className={cn(
                                            "w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border sm:border-2 transition-all duration-200 text-left text-sm sm:text-base touch-manipulation",
                                            isSelected
                                                ? "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-500 text-violet-700 dark:from-violet-900/20 dark:to-purple-900/20 dark:border-violet-500 dark:text-violet-300 shadow-lg shadow-violet-500/10"
                                                : "bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-violet-400 dark:hover:bg-violet-900/10 hover:shadow-md active:scale-95"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1 leading-relaxed">{option.label}</span>
                                            {isSelected && (
                                                <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>

                                    {(isOtherOption && isSelected) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 ml-4"
                                        >
                                            <div className={cn(
                                                "flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200",
                                                getOtherText(evaluatee.id)
                                                    ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
                                                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                            )}>
                                                <span className={cn(
                                                    "text-sm font-medium whitespace-nowrap",
                                                    getOtherText(evaluatee.id)
                                                        ? "text-violet-800 dark:text-violet-300"
                                                        : "text-amber-800 dark:text-amber-300"
                                                )}>
                                                    {getOtherText(evaluatee.id) ? 'รายละเอียด:' : 'ระบุรายละเอียด:'}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={getOtherText(evaluatee.id)}
                                                    onChange={(e) => {
                                                        const newAnswer = {
                                                            value: selectedArray,
                                                            other_text: e.target.value || null
                                                        };
                                                        onAnswerChange(evaluatee.id, newAnswer);
                                                    }}
                                                    placeholder="กรุณาระบุรายละเอียดเพิ่มเติม..."
                                                    className="flex-1 p-2 border border-violet-300 dark:border-violet-600 rounded-lg
                                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                                             focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                                    autoFocus
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );

            case "open_text":
                return (
                    <textarea
                        value={selectedValue || ""}
                        onChange={(e) => onAnswerChange(evaluatee.id, e.target.value)}
                        placeholder="กรุณาพิมพ์คำตอบของคุณ..."
                        className="w-full p-3 sm:p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-violet-500 focus:border-violet-500
                                 resize-none text-sm sm:text-base touch-manipulation min-h-[100px] sm:min-h-[120px]"
                        rows={3}
                    />
                );

            default:
                return null;
        }
    };

    // Count how many evaluatees have answered with validation
    const answeredCount = evaluatees.filter(evaluatee => {
        const answer = answers[evaluatee.id];
        return answer !== undefined && answer !== null;
    }).length;
    const allAnswered = answeredCount === evaluatees.length;

    React.useEffect(() => {
        if (answeredCount !== evaluatees.length) {
            const missingAnswers = evaluatees.filter(e => !answers[e.id]);
        }
    }, [answeredCount, evaluatees.length, question.id, answers, evaluatees]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6"
        >
            {/* Question Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-full flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <span className="text-xs sm:text-sm font-bold text-white">
                            {questionNumber}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed pr-4">
                                {question.title}
                            </h3>
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                                {question.type === "rating" ? "คะแนน" :
                                 question.type === "choice" ? "เลือกตอบ" :
                                 question.type === "multiple_choice" ? "เลือกหลายข้อ" :
                                 "ข้อความ"}
                            </span>
                            <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                allAnswered
                                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            )}>
                                {answeredCount}/{evaluatees.length} คน
                            </span>
                            {allAnswered && (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating Guide */}
                <AnimatePresence>
                    {showGuide && question.type === "rating" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800"
                        >
                            <h4 className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-3 flex items-center">
                                <Info size={16} className="mr-2" />
                                เกณฑ์การให้คะแนน
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {[5, 4, 3, 2, 1].map(score => {
                                    const meta = SCORE_META[score];
                                    return (
                                        <div key={score} className={cn("flex items-start space-x-2", score === 1 && "md:col-span-2")}>
                                            <span className={cn("font-semibold min-w-[50px]", meta.text)}>
                                                {score} =
                                            </span>
                                            <span className="font-medium text-violet-800 dark:text-violet-200">
                                                {meta.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Evaluatees Answers */}
            <div className="space-y-4">
                {evaluatees.map((evaluatee, index) => {
                    const hasAnswer = getSelectedValue(evaluatee.id) !== null;
                    return (
                        <motion.div
                            key={evaluatee.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "p-4 rounded-xl border transition-all duration-200",
                                hasAnswer
                                    ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-700"
                                    : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600"
                            )}
                        >
                            {/* Evaluatee Info */}
                            <div className="flex items-center space-x-3 mb-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                                    hasAnswer
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-300 dark:ring-emerald-600"
                                        : "bg-violet-100 dark:bg-violet-900/30"
                                )}>
                                    {hasAnswer ? (
                                        <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <User size={20} className="text-violet-600 dark:text-violet-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {evaluatee.name}
                                        </h4>
                                        {hasAnswer && (
                                            <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium">
                                                ตอบแล้ว
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {evaluatee.position} | {evaluatee.department}
                                    </div>
                                    {evaluatee.division && (
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                            {evaluatee.division}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded-full">
                                        G{evaluatee.grade}
                                    </span>
                                </div>
                            </div>

                            {/* Answer Options */}
                            <div className="ml-13">
                                {renderAnswerOptions(evaluatee)}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Completion Indicator & Summary */}
            <div className="mt-6 space-y-4">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                        className="gradient-primary h-2 rounded-full transition-all duration-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(answeredCount / evaluatees.length) * 100}%` }}
                    />
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg",
                        allAnswered
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    )}>
                        {allAnswered ? (
                            <>
                                <CheckCircle2 size={16} />
                                <span className="text-sm font-medium">ประเมินครบทุกคนแล้ว!</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={16} />
                                <span className="text-sm font-medium">
                                    ประเมินแล้ว {answeredCount} จาก {evaluatees.length} คน
                                </span>
                            </>
                        )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round((answeredCount / evaluatees.length) * 100)}% เสร็จสิ้น
                    </div>
                </div>

                {/* Quick summary for rating questions */}
                {question.type === "rating" && answeredCount > 0 && (
                    <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-800">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">สรุปคะแนน</h5>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {evaluatees.map(evaluatee => {
                                const value = getSelectedValue(evaluatee.id);
                                const score = value ? question.options?.find(opt => opt.id === value)?.score : null;
                                const meta = score ? SCORE_META[score] : null;
                                return score && meta ? (
                                    <span key={evaluatee.id} className={cn("px-2 py-1 rounded-full font-medium", meta.bg)}>
                                        {evaluatee.name.split(' ')[0]}: {score}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
