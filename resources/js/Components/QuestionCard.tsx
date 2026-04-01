import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { CheckCircle, MessageSquare } from "lucide-react";

interface Option {
    id: number;
    label: string;
    score: number;
    description?: string;
}

interface Question {
    id: number;
    title: string;
    type: "rating" | "choice" | "multiple_choice" | "open_text";
    options?: Option[];
}

interface QuestionCardProps {
    question: Question;
    answer: any;
    onAnswerChange: (value: any) => void;
    questionNumber: number;
}

/* ------------------------------------------------------------------ */
/*  Score metadata (Thai labels, descriptions, colors)                */
/* ------------------------------------------------------------------ */

const SCORE_META: Record<
    number,
    {
        label: string;
        description: string;
        bg: string;
        border: string;
        text: string;
        ring: string;
        hoverBorder: string;
        shadow: string;
    }
> = {
    5: {
        label: "ดีเยี่ยม",
        description:
            "แสดงพฤติกรรมที่สอดคล้องกับ Core Values ในการเป็นต้นแบบได้อย่างโดดเด่น",
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
        ring: "ring-emerald-500/30",
        hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
        shadow: "shadow-emerald-500/40",
    },
    4: {
        label: "ดีมาก",
        description:
            "แสดงพฤติกรรมในการดำเนินการประเด็นดังกล่าวเหนือกว่าความต้องการ",
        bg: "bg-blue-500",
        border: "border-blue-500",
        text: "text-blue-600 dark:text-blue-400",
        ring: "ring-blue-500/30",
        hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
        shadow: "shadow-blue-500/40",
    },
    3: {
        label: "ดี",
        description: "แสดงพฤติกรรมที่สอดคล้องในระดับพื้นฐาน",
        bg: "bg-amber-500",
        border: "border-amber-500",
        text: "text-amber-600 dark:text-amber-400",
        ring: "ring-amber-500/30",
        hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500",
        shadow: "shadow-amber-500/40",
    },
    2: {
        label: "ต้องปรับปรุง",
        description:
            "ควรพิจารณาเพื่อดำเนินการปรับปรุง/พัฒนาประเด็นดังกล่าวในระยะเวลาที่เหมาะสม",
        bg: "bg-orange-500",
        border: "border-orange-500",
        text: "text-orange-600 dark:text-orange-400",
        ring: "ring-orange-500/30",
        hoverBorder: "hover:border-orange-400 dark:hover:border-orange-500",
        shadow: "shadow-orange-500/40",
    },
    1: {
        label: "ต้องปรับปรุงอย่างมาก",
        description: "ต้องปรับปรุงอย่างมาก",
        bg: "bg-red-500",
        border: "border-red-500",
        text: "text-red-600 dark:text-red-400",
        ring: "ring-red-500/30",
        hoverBorder: "hover:border-red-400 dark:hover:border-red-500",
        shadow: "shadow-red-500/40",
    },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function QuestionCard({
    question,
    answer,
    onAnswerChange,
    questionNumber,
}: QuestionCardProps) {
    const [otherText, setOtherText] = useState<string>("");
    const [selectedOtherId, setSelectedOtherId] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hoveredScore, setHoveredScore] = useState<number | null>(null);

    // ตรวจสอบว่าตัวเลือกไหนเป็น "อื่นๆ" (ตามข้อความหรือ label)
    const otherOption = question.options?.find(
        (opt) =>
            opt.label.includes("อื่น") ||
            opt.label.toLowerCase().includes("other") ||
            opt.label.includes("อื่นๆ")
    );

    // โหลดคำตอบเก่าเมื่อเริ่มต้น
    useEffect(() => {
        if (!isInitialized && answer !== undefined) {
            if (otherOption) {
                // ถ้า answer เป็น object ที่มี other_text
                if (
                    typeof answer === "object" &&
                    answer !== null &&
                    !Array.isArray(answer)
                ) {
                    if (answer.other_text) {
                        // ใช้ batch update เพื่อให้ state อัปเดตพร้อมกัน
                        setOtherText(answer.other_text);
                        setSelectedOtherId(answer.option_id || otherOption.id);
                    }
                }
                // ถ้า answer เป็น string และไม่ใช่ตัวเลือกที่มีอยู่ ถือว่าเป็น other text
                else if (
                    typeof answer === "string" &&
                    !question.options?.some(
                        (opt) =>
                            opt.id.toString() === answer ||
                            opt.score.toString() === answer
                    )
                ) {
                    setOtherText(answer);
                    setSelectedOtherId(otherOption.id);
                }
                // ถ้า answer เป็น array และมีการเลือก other option
                else if (Array.isArray(answer)) {
                    answer.forEach((item) => {
                        if (
                            typeof item === "object" &&
                            item !== null &&
                            item.option_id === otherOption.id
                        ) {
                            setOtherText(item.other_text || "");
                            setSelectedOtherId(otherOption.id);
                        } else if (item === otherOption.id) {
                            setSelectedOtherId(otherOption.id);
                        }
                    });
                }
            }

            setIsInitialized(true);
        }
    }, [answer, otherOption?.id, question.id, isInitialized]);

    // ฟังก์ชันตรวจสอบว่า answer ปัจจุบันเป็นการเลือก other option หรือไม่
    const isOtherAnswerSelected = () => {
        if (!answer || !otherOption) return false;

        if (
            typeof answer === "object" &&
            answer !== null &&
            !Array.isArray(answer) &&
            answer.option_id === otherOption.id
        ) {
            return true;
        }

        if (
            typeof answer === "string" &&
            !question.options?.some(
                (opt) =>
                    opt.id.toString() === answer ||
                    opt.score.toString() === answer
            )
        ) {
            return true;
        }

        if (Array.isArray(answer)) {
            return answer.some(
                (item) =>
                    (typeof item === "object" &&
                        item !== null &&
                        item.option_id === otherOption.id) ||
                    item === otherOption.id
            );
        }

        return answer === otherOption.id;
    };

    const handleOptionSelect = (optionId: number) => {
        if (question.type === "choice") {
            if (optionId === otherOption?.id) {
                setSelectedOtherId(optionId);
                // ถ้ามี text อยู่แล้ว ให้ส่งไปเลย ถ้าไม่มีให้รอ input
                if (otherText.trim()) {
                    onAnswerChange({
                        option_id: optionId,
                        other_text: otherText.trim(),
                    });
                } else {
                    onAnswerChange(optionId);
                }
            } else {
                setSelectedOtherId(null);
                setOtherText("");
                onAnswerChange(optionId);
            }
        } else if (question.type === "multiple_choice") {
            const currentAnswers = Array.isArray(answer) ? answer : [];
            let newAnswers;

            if (currentAnswers.includes(optionId)) {
                newAnswers = currentAnswers.filter((id) => id !== optionId);
                if (optionId === otherOption?.id) {
                    setSelectedOtherId(null);
                    setOtherText("");
                }
            } else {
                newAnswers = [...currentAnswers, optionId];
                if (optionId === otherOption?.id) {
                    setSelectedOtherId(optionId);
                }
            }

            onAnswerChange(newAnswers);
        }
    };

    const handleOtherTextChange = (text: string) => {
        setOtherText(text);

        if (question.type === "choice" && selectedOtherId === otherOption?.id) {
            if (text.trim()) {
                onAnswerChange({
                    option_id: otherOption.id,
                    other_text: text.trim(),
                });
            } else {
                onAnswerChange(otherOption.id);
            }
        } else if (
            question.type === "multiple_choice" &&
            selectedOtherId === otherOption?.id
        ) {
            const currentAnswers = Array.isArray(answer) ? answer : [];
            const otherAnswers = currentAnswers.filter(
                (id) => id !== otherOption?.id
            );

            if (text.trim()) {
                onAnswerChange([
                    ...otherAnswers,
                    {
                        option_id: otherOption.id,
                        other_text: text.trim(),
                    },
                ]);
            } else {
                onAnswerChange([...otherAnswers, otherOption.id]);
            }
        }
    };

    const handleRatingSelect = (rating: number) => {
        onAnswerChange(rating);
    };

    const handleTextChange = (text: string) => {
        onAnswerChange(text);
    };

    const isSelected = (optionId: number) => {
        if (question.type === "choice") {
            if (
                typeof answer === "object" &&
                answer !== null &&
                !Array.isArray(answer)
            ) {
                return answer.option_id === optionId;
            }
            // ตรวจสอบทั้ง id และ score
            return (
                answer === optionId ||
                question.options?.find((opt) => opt.id === optionId)?.score ===
                    answer
            );
        } else if (question.type === "multiple_choice") {
            if (Array.isArray(answer)) {
                return answer.some((item) => {
                    if (typeof item === "object" && item !== null) {
                        return item.option_id === optionId;
                    }
                    return (
                        item === optionId ||
                        question.options?.find((opt) => opt.id === optionId)
                            ?.score === item
                    );
                });
            }
        } else if (question.type === "rating") {
            // สำหรับคำถามแบบ rating ให้เช็คจาก score
            const option = question.options?.find((opt) => opt.id === optionId);
            return option && answer === option.score;
        }
        return false;
    };

    const shouldShowOtherInput = (optionId: number) => {
        if (!otherOption || optionId !== otherOption.id) return false;

        // แสดง input ถ้าเลือก other option หรือถ้ามี answer ที่เป็น other text อยู่แล้ว
        return (
            isSelected(optionId) ||
            selectedOtherId === optionId ||
            (typeof answer === "object" &&
                answer !== null &&
                !Array.isArray(answer) &&
                answer.option_id === optionId) ||
            (typeof answer === "string" &&
                !question.options?.some(
                    (opt) =>
                        opt.id.toString() === answer ||
                        opt.score.toString() === answer
                ))
        );
    };

    // ฟังก์ชันสำหรับสร้างคำอธิบายคะแนนมาตรฐาน
    const getScoreDescription = (score: number): string => {
        return SCORE_META[score]?.description ?? "";
    };

    /* ============================================================== */
    /*  RATING QUESTION                                               */
    /* ============================================================== */

    const renderRatingQuestion = () => {
        // Sort options descending by score (5 -> 1)
        const sortedOptions = [...(question.options || [])].sort(
            (a, b) => b.score - a.score
        );

        // Determine which description to show beneath the buttons
        const activeScore: number | null =
            hoveredScore ?? (typeof answer === "number" ? answer : null);
        const activeMeta = activeScore ? SCORE_META[activeScore] : null;

        return (
            <div className="space-y-5">
                {/* Rating buttons row */}
                <div className="flex flex-row items-stretch justify-center gap-2 sm:gap-3 md:gap-4">
                    {sortedOptions.map((option, idx) => {
                        const meta = SCORE_META[option.score] || SCORE_META[3];
                        const selected = answer === option.score;

                        return (
                            <motion.button
                                key={option.id}
                                type="button"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: idx * 0.06,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 24,
                                }}
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.93 }}
                                onClick={() =>
                                    handleRatingSelect(option.score)
                                }
                                onMouseEnter={() =>
                                    setHoveredScore(option.score)
                                }
                                onMouseLeave={() => setHoveredScore(null)}
                                className={cn(
                                    "relative flex-1 min-w-0 max-w-[5.5rem] sm:max-w-[6.5rem] touch-manipulation",
                                    "flex flex-col items-center justify-center",
                                    "rounded-xl sm:rounded-2xl border-2 transition-all duration-200",
                                    "py-3 sm:py-4 px-1 sm:px-2",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                                    selected
                                        ? cn(
                                              meta.bg,
                                              meta.border,
                                              "text-white shadow-lg",
                                              meta.shadow,
                                              meta.ring,
                                              "ring-4"
                                          )
                                        : cn(
                                              "border-gray-200 dark:border-gray-600",
                                              "bg-white/60 dark:bg-gray-800/60",
                                              "text-gray-500 dark:text-gray-400",
                                              meta.hoverBorder,
                                              "hover:bg-gray-50 dark:hover:bg-gray-700/60",
                                              "hover:shadow-md"
                                          )
                                )}
                            >
                                {/* Score number */}
                                <span
                                    className={cn(
                                        "text-2xl sm:text-3xl font-extrabold leading-none",
                                        selected
                                            ? "text-white drop-shadow-sm"
                                            : meta.text
                                    )}
                                >
                                    {option.score}
                                </span>

                                {/* Thai label */}
                                <span
                                    className={cn(
                                        "mt-1.5 text-[10px] sm:text-xs font-semibold leading-tight text-center",
                                        "line-clamp-2 px-0.5",
                                        selected
                                            ? "text-white/90"
                                            : "text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    {meta.label}
                                </span>

                                {/* Selected checkmark */}
                                <AnimatePresence>
                                    {selected && (
                                        <motion.div
                                            initial={{
                                                scale: 0,
                                                opacity: 0,
                                            }}
                                            animate={{
                                                scale: 1,
                                                opacity: 1,
                                            }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                                        >
                                            <CheckCircle
                                                className={cn(
                                                    "w-4 h-4 sm:w-5 sm:h-5",
                                                    meta.text
                                                )}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Description area below buttons */}
                <AnimatePresence mode="wait">
                    {activeMeta && (
                        <motion.div
                            key={activeScore}
                            initial={{ opacity: 0, y: -6, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -6, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                                "rounded-xl px-4 py-3 text-center text-sm leading-relaxed",
                                "bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm",
                                "border border-gray-200/60 dark:border-gray-600/40"
                            )}
                        >
                            <span
                                className={cn(
                                    "font-bold mr-1.5",
                                    activeMeta.text
                                )}
                            >
                                {activeScore} - {activeMeta.label}:
                            </span>
                            <span className="text-gray-600 dark:text-gray-300">
                                {activeMeta.description}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    /* ============================================================== */
    /*  CHOICE QUESTION                                               */
    /* ============================================================== */

    const renderChoiceQuestion = () => (
        <div className="space-y-2.5">
            {question.options?.map((option, idx) => (
                <div key={option.id} className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                            "group relative p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer",
                            "transition-all duration-200",
                            isSelected(option.id)
                                ? "border-violet-500 bg-violet-50/80 dark:bg-violet-900/20 shadow-sm shadow-violet-500/10"
                                : "border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-500/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                        )}
                        onClick={() => handleOptionSelect(option.id)}
                    >
                        <div className="flex items-center gap-3">
                            {/* Custom radio */}
                            <div
                                className={cn(
                                    "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                                    isSelected(option.id)
                                        ? "border-violet-500 bg-violet-500 shadow-sm shadow-violet-500/30"
                                        : "border-gray-300 dark:border-gray-500 group-hover:border-violet-400"
                                )}
                            >
                                <AnimatePresence>
                                    {isSelected(option.id) && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="w-2 h-2 bg-white rounded-full"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex-1 min-w-0">
                                <span
                                    className={cn(
                                        "text-sm sm:text-base transition-colors duration-200",
                                        isSelected(option.id)
                                            ? "text-violet-700 dark:text-violet-300 font-semibold"
                                            : "text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    {option.label}
                                </span>
                                {option.description && (
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                        {option.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Input สำหรับ "อื่นๆ" */}
                    {option.id === otherOption?.id &&
                        shouldShowOtherInput(option.id) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-8 sm:ml-10"
                            >
                                <Input
                                    placeholder="กรุณาระบุ..."
                                    value={otherText}
                                    onChange={(e) =>
                                        handleOtherTextChange(e.target.value)
                                    }
                                    className="w-full rounded-lg border-violet-200 dark:border-violet-700 focus-visible:border-violet-500 focus-visible:ring-violet-500/30"
                                    autoFocus={!otherText}
                                />
                            </motion.div>
                        )}
                </div>
            ))}
        </div>
    );

    /* ============================================================== */
    /*  MULTIPLE CHOICE QUESTION                                      */
    /* ============================================================== */

    const renderMultipleChoiceQuestion = () => (
        <div className="space-y-2.5">
            {question.options?.map((option, idx) => (
                <div key={option.id} className="space-y-2">
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                            "group relative p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer",
                            "transition-all duration-200",
                            isSelected(option.id)
                                ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 shadow-sm shadow-emerald-500/10"
                                : "border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
                        )}
                        onClick={() => handleOptionSelect(option.id)}
                    >
                        <div className="flex items-center gap-3">
                            {/* Custom checkbox */}
                            <div
                                className={cn(
                                    "flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                                    isSelected(option.id)
                                        ? "border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/30"
                                        : "border-gray-300 dark:border-gray-500 group-hover:border-emerald-400"
                                )}
                            >
                                <AnimatePresence>
                                    {isSelected(option.id) && (
                                        <motion.svg
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="w-3 h-3 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </motion.svg>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex-1 min-w-0">
                                <span
                                    className={cn(
                                        "text-sm sm:text-base transition-colors duration-200",
                                        isSelected(option.id)
                                            ? "text-emerald-700 dark:text-emerald-300 font-semibold"
                                            : "text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    {option.label}
                                </span>
                                {option.description && (
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                        {option.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Input สำหรับ "อื่นๆ" */}
                    {option.id === otherOption?.id &&
                        shouldShowOtherInput(option.id) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="ml-8 sm:ml-10"
                            >
                                <Input
                                    placeholder="กรุณาระบุ..."
                                    value={otherText}
                                    onChange={(e) =>
                                        handleOtherTextChange(e.target.value)
                                    }
                                    className="w-full rounded-lg border-emerald-200 dark:border-emerald-700 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                                    autoFocus={!otherText}
                                />
                            </motion.div>
                        )}
                </div>
            ))}
        </div>
    );

    /* ============================================================== */
    /*  OPEN TEXT QUESTION                                             */
    /* ============================================================== */

    const renderOpenTextQuestion = () => {
        const charCount = typeof answer === "string" ? answer.length : 0;
        const MAX_CHARS = 2000;

        return (
            <div className="space-y-2">
                <div className="relative">
                    <Textarea
                        placeholder="กรุณาใส่คำตอบของคุณ..."
                        value={answer || ""}
                        onChange={(e) => handleTextChange(e.target.value)}
                        maxLength={MAX_CHARS}
                        className={cn(
                            "min-h-[120px] sm:min-h-[140px] resize-none",
                            "text-sm sm:text-base p-4 sm:p-5",
                            "rounded-xl border-2 border-gray-200 dark:border-gray-600",
                            "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
                            "focus-visible:border-violet-500 focus-visible:ring-violet-500/20",
                            "transition-all duration-200",
                            "touch-manipulation"
                        )}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        <span
                            className={cn(
                                "text-xs tabular-nums",
                                charCount > MAX_CHARS * 0.9
                                    ? "text-red-500 font-medium"
                                    : "text-gray-400"
                            )}
                        >
                            {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    /* ============================================================== */
    /*  MAIN RENDER                                                   */
    /* ============================================================== */

    const hasAnswer =
        answer !== undefined && answer !== null && answer !== "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn(
                "glass-card rounded-2xl sm:rounded-3xl",
                "p-5 sm:p-7",
                "transition-all duration-300",
                hasAnswer
                    ? "border-violet-200/60 dark:border-violet-700/30"
                    : ""
            )}
        >
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Question number badge */}
                <div
                    className={cn(
                        "flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9",
                        "rounded-xl flex items-center justify-center",
                        "text-sm sm:text-base font-bold text-white",
                        "shadow-md",
                        hasAnswer
                            ? "gradient-primary shadow-violet-500/25"
                            : "bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600"
                    )}
                >
                    {hasAnswer ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                        >
                            <CheckCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        </motion.div>
                    ) : (
                        questionNumber
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                        {question.title}
                    </h3>

                    <div>
                        {question.type === "choice" && renderChoiceQuestion()}
                        {question.type === "multiple_choice" &&
                            renderMultipleChoiceQuestion()}
                        {question.type === "rating" && renderRatingQuestion()}
                        {question.type === "open_text" &&
                            renderOpenTextQuestion()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
