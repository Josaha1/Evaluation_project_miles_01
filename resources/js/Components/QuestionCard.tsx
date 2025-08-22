import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";

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

export function QuestionCard({
    question,
    answer,
    onAnswerChange,
    questionNumber,
}: QuestionCardProps) {
    const [otherText, setOtherText] = useState<string>("");
    const [selectedOtherId, setSelectedOtherId] = useState<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

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
                  
                    answer.forEach((item, index) => {
                      
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

    const renderChoiceQuestion = () => (
        <div className="space-y-3">
            {question.options?.map((option) => (
                <div key={option.id} className="space-y-2">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${
                                isSelected(option.id)
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400"
                            }
                        `}
                        onClick={() => handleOptionSelect(option.id)}
                    >
                        <div className="flex items-center space-x-3">
                            <div
                                className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    ${
                                        isSelected(option.id)
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300 dark:border-gray-500"
                                    }
                                `}
                            >
                                {isSelected(option.id) && (
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                            </div>
                            <div className="flex-1">
                                <span
                                    className={`
                                    ${
                                        isSelected(option.id)
                                            ? "text-blue-700 dark:text-blue-300 font-medium"
                                            : "text-gray-700 dark:text-gray-300"
                                    }
                                `}
                                >
                                    {option.label}
                                </span>
                                {option.description && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {option.description}
                                    </div>
                                )}
                                {/* แสดงคะแนน */}
                                <div
                                    className={`text-xs mt-1 ${
                                        isSelected(option.id)
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-400 dark:text-gray-500"
                                    }`}
                                ></div>
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
                                className="ml-8 mt-2"
                            >
                                <Input
                                    placeholder="กรุณาระบุ..."
                                    value={otherText}
                                    onChange={(e) =>
                                        handleOtherTextChange(e.target.value)
                                    }
                                    className="w-full"
                                    autoFocus={!otherText} // ไม่ auto focus ถ้ามีข้อความอยู่แล้ว
                                />
                            </motion.div>
                        )}
                </div>
            ))}
        </div>
    );

    const renderMultipleChoiceQuestion = () => (
        <div className="space-y-3">
            {question.options?.map((option) => (
                <div key={option.id} className="space-y-2">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${
                                isSelected(option.id)
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400"
                            }
                        `}
                        onClick={() => handleOptionSelect(option.id)}
                    >
                        <div className="flex items-center space-x-3">
                            <div
                                className={`
                                    w-5 h-5 rounded border-2 flex items-center justify-center
                                    ${
                                        isSelected(option.id)
                                            ? "border-green-500 bg-green-500"
                                            : "border-gray-300 dark:border-gray-500"
                                    }
                                `}
                            >
                                {isSelected(option.id) && (
                                    <svg
                                        className="w-3 h-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <span
                                    className={`
                                    ${
                                        isSelected(option.id)
                                            ? "text-green-700 dark:text-green-300 font-medium"
                                            : "text-gray-700 dark:text-gray-300"
                                    }
                                `}
                                >
                                    {option.label}
                                </span>
                                {option.description && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {option.description}
                                    </div>
                                )}
                                {/* แสดงคะแนน */}
                                <div
                                    className={`text-xs mt-1 ${
                                        isSelected(option.id)
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-gray-400 dark:text-gray-500"
                                    }`}
                                ></div>
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
                                className="ml-8 mt-2"
                            >
                                <Input
                                    placeholder="กรุณาระบุ..."
                                    value={otherText}
                                    onChange={(e) =>
                                        handleOtherTextChange(e.target.value)
                                    }
                                    className="w-full"
                                    autoFocus={!otherText} // ไม่ auto focus ถ้ามีข้อความอยู่แล้ว
                                />
                            </motion.div>
                        )}
                </div>
            ))}
        </div>
    );

    // ฟังก์ชันสำหรับสร้างคำอธิบายคะแนนมาตรฐาน
    const getScoreDescription = (score: number): string => {
        switch (score) {
            case 5:
                return "ดีเยี่ยม  (แสดงพฤติกรรมที่สอดคล้องกับ Core Values ในการเป็นต้นแบบได้อย่างโดดเด่น)";
            case 4:
                return "ดีมาก  (แสดงพฤติกรรมในการดำเนินการประเด็นดังกล่าวเหนือกว่าความต้องการของท่าน)";
            case 3:
                return "ดี (แสดงพฤติกรรมที่สอดคล้องในระดับพื้นฐาน)";
            case 2:
                return "ต้องปรับปรุง (ควรพิจารณาเพื่อดำเนินการปรับปรุง/พัฒนาประเด็นดังกล่าวในระยะเวลาที่เหมาะสม)";
            case 1:
                return "ต้องปรับปรุงอย่างมาก ";
            default:
                return "";
        }
    };

    const renderRatingQuestion = () => (
        <div className="space-y-6">
            {/* ปุ่มเลือกคะแนน */}
            <div className="space-y-4">
                <div className="text-center">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        กรุณาเลือกระดับคะแนน
                    </h5>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 md:flex md:flex-wrap md:gap-4 md:justify-center max-w-lg sm:max-w-none mx-auto md:mx-0">
                    {question.options?.map((option) => (
                        <motion.button
                            key={option.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRatingSelect(option.score)}
                            className={`
                               relative group touch-manipulation md:min-w-[80px] px-2 py-3 sm:px-3 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl border sm:border-2 font-semibold transition-all duration-200 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex items-center justify-center
                                ${
                                    answer === option.score
                                        ? option.score === 5
                                            ? "border-green-500 bg-green-500 text-white shadow-lg"
                                            : option.score === 4
                                            ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                                            : option.score === 3
                                            ? "border-yellow-500 bg-yellow-500 text-white shadow-lg"
                                            : option.score === 2
                                            ? "border-orange-500 bg-orange-500 text-white shadow-lg"
                                            : "border-red-500 bg-red-500 text-white shadow-lg"
                                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                                }
                            `}
                        >
                            <div className="text-center w-full">
                                <div className="text-lg sm:text-xl md:text-xl font-bold mb-1">
                                    {option.score}
                                </div>
                                <div className="text-xs md:text-xs opacity-90 leading-tight px-1">
                                    {option.score === 5
                                        ? "ดีเยี่ยม"
                                        : option.score === 4
                                        ? "ดีมาก"
                                        : option.score === 3
                                        ? "ดี"
                                        : option.score === 2
                                        ? "ต้องปรับปรุง"
                                        : "ต้องปรับปรุงอย่างมาก"}
                                </div>
                            </div>

                            {/* Tooltip แสดงคำอธิบายเต็ม */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap max-w-xs text-center z-10">
                                {option.description ||
                                    getScoreDescription(option.score)}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                
            </div>
        </div>
    );

    const renderOpenTextQuestion = () => (
        <Textarea
            placeholder="กรุณาใส่คำตอบของคุณ..."
            value={answer || ""}
            onChange={(e) => handleTextChange(e.target.value)}
            className="min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base p-3 sm:p-4 rounded-lg sm:rounded-xl border sm:border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 touch-manipulation"
        />
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm"
        >
            <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {questionNumber}
                </div>
                <div className="flex-1 space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                        {question.title}
                    </h3>

                    <div className="mt-3 sm:mt-4">
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
