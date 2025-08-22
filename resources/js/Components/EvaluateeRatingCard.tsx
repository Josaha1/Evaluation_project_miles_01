import React from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
            {/* Question Header */}
            <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
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
                {evaluatees.map((evaluatee) => (
                    <motion.div
                        key={evaluatee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                        {/* Evaluatee Info */}
                        <div className="flex items-center space-x-3 flex-1">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <User size={20} className="text-indigo-600 dark:text-indigo-400" />
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

                        {/* Rating Options */}
                        {question.options && (
                            <div className="flex space-x-2">
                                {question.options.map((option) => {
                                    const isSelected = getSelectedOptionId(evaluatee.id) === option.id;
                                    return (
                                        <motion.button
                                            key={option.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onAnswerChange(evaluatee.id, option.id)}
                                            className={`
                                                w-12 h-12 rounded-full border-2 transition-all duration-200 font-semibold text-sm
                                                ${isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                                }
                                            `}
                                        >
                                            {option.score}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Completion Indicator */}
            <div className="mt-4 flex items-center justify-end space-x-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    ประเมินแล้ว: {Object.keys(answers).length}/{evaluatees.length} คน
                </div>
                {Object.keys(answers).length === evaluatees.length && (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
            </div>
        </motion.div>
    );
}