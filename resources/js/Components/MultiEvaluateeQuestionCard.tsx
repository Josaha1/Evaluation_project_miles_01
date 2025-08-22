import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CheckCircle2, Info, AlertCircle, Trash2 } from "lucide-react";

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

export function MultiEvaluateeQuestionCard({
    question,
    evaluatees,
    answers,
    onAnswerChange,
    questionNumber,
}: MultiEvaluateeQuestionCardProps) {
    const [showGuide, setShowGuide] = useState(false);
    
    // Debug: Log when answers change
    React.useEffect(() => {
      
        
        // Check if all evaluatees have answers
        evaluatees.forEach(evaluatee => {
            const hasAnswer = answers[evaluatee.id] !== undefined;
        
        });
    }, [answers, evaluatees, question.id]);
    
    const getSelectedValue = (evaluateeId: number) => {
        const answer = answers[evaluateeId];
        
        // Handle null/undefined answers
        if (!answer) {
            return null;
        }
        
        // Handle object format (with other_text or complex structure)
        if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            // ถ้ามี value property ให้ใช้ value นั้น
            if (answer.value !== undefined) {
                return answer.value;
            }
            // ถ้าไม่มี value property แต่เป็น object ให้คืนค่า object ทั้งหมด
            return answer;
        }
        
        // Handle direct value (number, string, array)
        return answer;
    };

    const getOtherText = (evaluateeId: number) => {
        const answer = answers[evaluateeId];
        
        // Handle null/undefined answers
        if (!answer) {
            return '';
        }
        
        // Handle object format with other_text
        if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) {
            return answer.other_text || '';
        }
        
        // No other_text available for non-object answers
        return '';
    };

    const renderAnswerOptions = (evaluatee: Evaluatee) => {
        const selectedValue = getSelectedValue(evaluatee.id);

        switch (question.type) {
            case "rating":
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                กรุณาเลือกระดับคะแนน
                            </h5>
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 md:flex md:flex-wrap md:gap-4 md:justify-center max-w-lg sm:max-w-none mx-auto md:mx-0">
                            {question.options?.map((option) => {
                                const isSelected = selectedValue === option.id;
                                return (
                                    <motion.button
                                        key={option.id}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onAnswerChange(evaluatee.id, option.id)}
                                        className={`
                                            relative group touch-manipulation md:min-w-[80px] px-2 py-3 sm:px-3 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl border sm:border-2 font-semibold transition-all duration-200 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex items-center justify-center
                                            ${
                                                isSelected
                                                    ? option.score === 5 ? "border-green-500 bg-green-500 text-white shadow-lg" :
                                                      option.score === 4 ? "border-blue-500 bg-blue-500 text-white shadow-lg" :
                                                      option.score === 3 ? "border-yellow-500 bg-yellow-500 text-white shadow-lg" :
                                                      option.score === 2 ? "border-orange-500 bg-orange-500 text-white shadow-lg" :
                                                      "border-red-500 bg-red-500 text-white shadow-lg"
                                                    : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                                            }
                                        `}
                                    >
                                        <div className="text-center w-full">
                                            <div className="text-lg sm:text-xl md:text-xl font-bold mb-1">
                                                {option.score}
                                            </div>
                                            <div className="text-xs md:text-xs opacity-90 leading-tight px-1">
                                                {option.score === 5 ? 'ดีเยี่ยม' :
                                                 option.score === 4 ? 'ดีมาก' :
                                                 option.score === 3 ? 'ดี' :
                                                 option.score === 2 ? 'ต้องปรับปรุง' :
                                                 'ต้องปรับปรุงอย่างมาก'}
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
                            // ตรวจสอบการเลือกทั้งในรูปแบบเดิมและใหม่
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
                                        onClick={() => {
                                            if (isOtherOption) {
                                                // ส่งเป็น object format เสมอสำหรับตัวเลือก "อื่นๆ"
                                                onAnswerChange(evaluatee.id, {
                                                    value: option.id,
                                                    other_text: getOtherText(evaluatee.id) || null
                                                });
                                            } else {
                                                // ส่งเป็น object format เสมอแม้ไม่มี other_text
                                                onAnswerChange(evaluatee.id, {
                                                    value: option.id,
                                                    other_text: null
                                                });
                                            }
                                        }}
                                        className={`
                                            w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border sm:border-2 transition-all duration-200 text-left text-sm sm:text-base touch-manipulation
                                            ${isSelected
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 text-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-500 dark:text-blue-300 shadow-lg shadow-blue-500/10'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:bg-blue-900/10 hover:shadow-md active:scale-95'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1 leading-relaxed">{option.label}</span>
                                            {isSelected && (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle2 size={12} className="text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                    
                                    {/* Input text สำหรับตัวเลือก "อื่นๆ" - แสดงเมื่อเป็นตัวเลือก "อื่นๆ" และถูกเลือก */}
                                    {(isOtherOption && isSelected) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 ml-4"
                                        >
                                            <div className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                                                getOtherText(evaluatee.id) 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                            }`}>
                                                <span className={`text-sm font-medium whitespace-nowrap ${
                                                    getOtherText(evaluatee.id) 
                                                        ? 'text-blue-800 dark:text-blue-300' 
                                                        : 'text-yellow-800 dark:text-yellow-300'
                                                }`}>
                                                    {getOtherText(evaluatee.id) ? '📝 รายละเอียด:' : 'ระบุรายละเอียด:'}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={getOtherText(evaluatee.id)}
                                                    onChange={(e) => {
                                                        const currentAnswer = answers[evaluatee.id];
                                                        let newAnswer;
                                                        
                                                        // สร้าง object format เสมอสำหรับ choice questions
                                                        if (typeof currentAnswer === 'object' && currentAnswer !== null && !Array.isArray(currentAnswer)) {
                                                            // Already an object with value and other_text
                                                            newAnswer = { ...currentAnswer, other_text: e.target.value || null };
                                                        } else {
                                                            // Simple value, convert to object structure
                                                            newAnswer = { 
                                                                value: currentAnswer || null, 
                                                                other_text: e.target.value || null
                                                            };
                                                        }
                                                        
                                                        onAnswerChange(evaluatee.id, newAnswer);
                                                    }}
                                                    placeholder="กรุณาระบุรายละเอียดเพิ่มเติม..."
                                                    className="flex-1 p-2 border border-yellow-300 dark:border-yellow-600 rounded-lg 
                                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                                             focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                            // Handle both object and array formats for multiple choice - ปรับให้รองรับ object format เสมอ
                            let selectedArray = [];
                            
                            // ตรวจสอบรูปแบบ object format ก่อน
                            if (typeof selectedValue === 'object' && selectedValue !== null && !Array.isArray(selectedValue)) {
                                // Object format: { value: [...], other_text: "..." }
                                if (Array.isArray(selectedValue.value)) {
                                    selectedArray = selectedValue.value;
                                }
                            } else if (Array.isArray(selectedValue)) {
                                // Legacy array format: [...] - แปลงเป็น object format
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
                                        onClick={() => {
                                            let newSelectedArray;
                                            if (isSelected) {
                                                newSelectedArray = selectedArray.filter(id => id !== option.id);
                                            } else {
                                                newSelectedArray = [...selectedArray, option.id];
                                            }
                                            
                                            // ส่งเป็น object format เสมอ
                                            const newAnswer = {
                                                value: newSelectedArray,
                                                other_text: getOtherText(evaluatee.id) || null
                                            };
                                            onAnswerChange(evaluatee.id, newAnswer);
                                        }}
                                        className={`
                                            w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border sm:border-2 transition-all duration-200 text-left text-sm sm:text-base touch-manipulation
                                            ${isSelected
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 text-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-500 dark:text-blue-300 shadow-lg shadow-blue-500/10'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:bg-blue-900/10 hover:shadow-md active:scale-95'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1 leading-relaxed">{option.label}</span>
                                            {isSelected && (
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle2 size={12} className="text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                    
                                    {/* Input text สำหรับตัวเลือก "อื่นๆ" - แสดงเมื่อเป็นตัวเลือก "อื่นๆ" และถูกเลือก */}
                                    {(isOtherOption && isSelected) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 ml-4"
                                        >
                                            <div className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                                                getOtherText(evaluatee.id) 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                            }`}>
                                                <span className={`text-sm font-medium whitespace-nowrap ${
                                                    getOtherText(evaluatee.id) 
                                                        ? 'text-blue-800 dark:text-blue-300' 
                                                        : 'text-yellow-800 dark:text-yellow-300'
                                                }`}>
                                                    {getOtherText(evaluatee.id) ? '📝 รายละเอียด:' : 'ระบุรายละเอียด:'}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={getOtherText(evaluatee.id)}
                                                    onChange={(e) => {
                                                      
                                                        // ส่งเป็น object format เสมอ
                                                        const newAnswer = {
                                                            value: selectedArray,
                                                            other_text: e.target.value || null
                                                        };
                                                        
                                                        onAnswerChange(evaluatee.id, newAnswer);
                                                    }}
                                                    placeholder="กรุณาระบุรายละเอียดเพิ่มเติม..."
                                                    className="flex-1 p-2 border border-yellow-300 dark:border-yellow-600 rounded-lg 
                                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                                                             focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                        className="w-full p-3 sm:p-4 border sm:border-2 border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
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
    
    // Enhanced logging for answer completion status
    React.useEffect(() => {
        if (answeredCount !== evaluatees.length) {
          
            const missingAnswers = evaluatees.filter(e => !answers[e.id]);
          
        }
    }, [answeredCount, evaluatees.length, question.id, answers, evaluatees]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
            {/* Question Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-xs sm:text-sm font-bold text-white">
                            {questionNumber}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed pr-4">
                                {question.title}
                            </h3>
                            {question.type === "rating" && (
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title="แสดงเกณฑ์การให้คะแนน"
                                >
                                    <Info size={18} />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                                {question.type === "rating" ? "📊 คะแนน" : 
                                 question.type === "choice" ? "☑️ เลือกตอบ" :
                                 question.type === "multiple_choice" ? "☑️ เลือกหลายข้อ" :
                                 "📝 ข้อความ"}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                allAnswered
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            }`}>
                                {answeredCount}/{evaluatees.length} คน
                            </span>
                            {allAnswered && (
                                <CheckCircle2 size={16} className="text-green-500" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating Guide - แสดงเมื่อกดปุ่ม Info */}
                <AnimatePresence>
                    {showGuide && question.type === "rating" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                        >
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                                <Info size={16} className="mr-2" />
                                เกณฑ์การให้คะแนน
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-start space-x-2">
                                    <span className="font-semibold text-green-700 dark:text-green-300 min-w-[50px]">⭐ 5 =</span>
                                    <div>
                                        <span className="font-medium text-blue-800 dark:text-blue-200">ดีเยี่ยม</span>
                                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                                            แสดงพฤติกรรมที่สอดคล้องกับ Core Values ในการเป็นต้นแบบได้อย่างโดดเด่น
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="font-semibold text-blue-700 dark:text-blue-300 min-w-[50px]">⭐ 4 =</span>
                                    <div>
                                        <span className="font-medium text-blue-800 dark:text-blue-200">ดีมาก</span>
                                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                                            แสดงพฤติกรรมในการดำเนินการประเด็นดังกล่าวเหนือกว่าความต้องการ
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="font-semibold text-yellow-700 dark:text-yellow-300 min-w-[50px]">⭐ 3 =</span>
                                    <div>
                                        <span className="font-medium text-blue-800 dark:text-blue-200">ดี</span>
                                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                                            แสดงพฤติกรรมที่สอดคล้องในระดับพื้นฐาน
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="font-semibold text-orange-700 dark:text-orange-300 min-w-[50px]">⭐ 2 =</span>
                                    <div>
                                        <span className="font-medium text-blue-800 dark:text-blue-200">ต้องปรับปรุง</span>
                                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                                            ควรพิจารณาเพื่อดำเนินการปรับปรุง/พัฒนาประเด็นดังกล่าวในระยะเวลาที่เหมาะสม
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-2 md:col-span-2">
                                    <span className="font-semibold text-red-700 dark:text-red-300 min-w-[50px]">⭐ 1 =</span>
                                    <div>
                                        <span className="font-medium text-blue-800 dark:text-blue-200">ต้องปรับปรุงอย่างมาก</span>
                                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                                            ต้องปรับปรุงและพัฒนาอย่างเร่งด่วน
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* Evaluatees Answers */}
            <div className="space-y-4">
                {evaluatees.map((evaluatee, index) => {
                    return (
                    <motion.div
                        key={evaluatee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                        {/* Evaluatee Info */}
                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                                getSelectedValue(evaluatee.id) 
                                    ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-300 dark:ring-green-600' 
                                    : 'bg-indigo-100 dark:bg-indigo-900/30'
                            }`}>
                                {getSelectedValue(evaluatee.id) ? (
                                    <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                                ) : (
                                    <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {evaluatee.name}
                                    </h4>
                                    {getSelectedValue(evaluatee.id) && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-medium">
                                            ✓ ตอบแล้ว
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {evaluatee.position} • {evaluatee.department}
                                </div>
                                {evaluatee.division && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                        {evaluatee.division}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
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
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(answeredCount / evaluatees.length) * 100}%` }}
                    />
                </div>
                
                {/* Status */}
                <div className="flex items-center justify-between">
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        allAnswered
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    }`}>
                        {allAnswered ? (
                            <>
                                <CheckCircle2 size={16} />
                                <span className="text-sm font-medium">🎉 ประเมินครบทุกคนแล้ว!</span>
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
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">📊 สรุปคะแนน</h5>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {evaluatees.map(evaluatee => {
                                const value = getSelectedValue(evaluatee.id);
                                const score = value ? question.options?.find(opt => opt.id === value)?.score : null;
                                return score ? (
                                    <span key={evaluatee.id} className={`px-2 py-1 rounded-full font-medium ${
                                        score === 5 ? 'bg-green-100 text-green-700' :
                                        score === 4 ? 'bg-blue-100 text-blue-700' :
                                        score === 3 ? 'bg-yellow-100 text-yellow-700' :
                                        score === 2 ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
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