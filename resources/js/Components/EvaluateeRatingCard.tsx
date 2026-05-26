import React from "react";
import { motion } from "framer-motion";
import { User, CheckCircle } from "lucide-react";
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

interface EvaluateeRatingCardProps {
    question: Question;
    evaluatees: Evaluatee[];
    answers: { [evaluateeId: number]: any };
    onAnswerChange: (evaluateeId: number, value: any) => void;
    questionNumber: number;
}

const SCORE_COLORS: Record<number, { bg: string; border: string; selected: string; text: string }> = {
    5: {
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        selected: "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    4: {
        bg: "bg-blue-500",
        border: "border-blue-500",
        selected: "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30",
        text: "text-blue-600 dark:text-blue-400",
    },
    3: {
        bg: "bg-amber-500",
        border: "border-amber-500",
        selected: "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30",
        text: "text-amber-600 dark:text-amber-400",
    },
    2: {
        bg: "bg-orange-500",
        border: "border-orange-500",
        selected: "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30",
        text: "text-orange-600 dark:text-orange-400",
    },
    1: {
        bg: "bg-red-500",
        border: "border-red-500",
        selected: "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30",
        text: "text-red-600 dark:text-red-400",
    },
};

export function EvaluateeRatingCard({
    question,
    evaluatees,
    answers,
    onAnswerChange,
    questionNumber,
}: EvaluateeRatingCardProps) {
    const getSelectedOptionId = (evaluateeId: number) => {
        return answers[evaluateeId] || null;
    };

    const isRatingQuestion = question.type === "rating" && question.options;

    if (!isRatingQuestion) {
        return null;
    }

    // Sort options descending (5 -> 1)
    const sortedOptions = [...(question.options || [])].sort(
        (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6"
        >
            {/* Question Header */}
            <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-md">
                        <span className="text-sm font-bold text-white">
                            {questionNumber}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                            {question.title}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Evaluatees Rating */}
            <div className="space-y-4">
                {evaluatees.map((evaluatee, index) => {
                    const isAnswered = !!getSelectedOptionId(evaluatee.id);
                    return (
                        <motion.div
                            key={evaluatee.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                                isAnswered
                                    ? "bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800"
                                    : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600"
                            )}
                        >
                            {/* Evaluatee Info */}
                            <div className="flex items-center space-x-3 flex-1">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isAnswered
                                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                                        : "bg-violet-100 dark:bg-violet-900/30"
                                )}>
                                    {isAnswered ? (
                                        <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <User size={20} className="text-violet-600 dark:text-violet-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {evaluatee.name}
                                    </h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {evaluatee.position} | {evaluatee.department}
                                    </div>
                                </div>
                            </div>

                            {/* Rating Options - sorted 5 -> 1 */}
                            <div className="flex space-x-2">
                                {sortedOptions.map((option) => {
                                    const isSelected = getSelectedOptionId(evaluatee.id) === option.id;
                                    const colors = SCORE_COLORS[option.score] || SCORE_COLORS[3];
                                    return (
                                        <motion.button
                                            key={option.id}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => onAnswerChange(evaluatee.id, isSelected ? null : option.id)}
                                            className={cn(
                                                "w-12 h-12 rounded-full border-2 transition-all duration-200 font-semibold text-sm",
                                                isSelected
                                                    ? colors.selected
                                                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                            )}
                                        >
                                            {option.score}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Completion Indicator */}
            <div className="mt-4 flex items-center justify-end space-x-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {Object.keys(answers).length}/{evaluatees.length} คน
                </div>
                {Object.keys(answers).length === evaluatees.length && (
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse-soft" />
                )}
            </div>
        </motion.div>
    );
}
