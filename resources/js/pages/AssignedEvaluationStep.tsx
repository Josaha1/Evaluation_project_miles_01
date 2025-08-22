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
} from "lucide-react";
import axios from "axios";
import { ProgressIndicator } from "@/Components/ProgressIndicator";
import { QuestionCard } from "@/Components/QuestionCard";
import { EvaluateeRatingCard } from "@/Components/EvaluateeRatingCard";
import { MultiEvaluateeQuestionCard } from "@/Components/MultiEvaluateeQuestionCard";
import EvaluateeSelector from "@/Components/EvaluateeSelector";

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

    // โหลดคำตอบที่มีอยู่แล้วเมื่อเริ่มต้น
    useEffect(() => {
        if (existingAnswers) {
         
            
            // Convert existing answers to new format - รองรับการโหลดข้อมูลทุกคน
            const convertedAnswers: { [questionId: number]: { [evaluateeId: number]: any } } = {};
            
            Object.entries(existingAnswers).forEach(([questionId, answersByEvaluatee]) => {
             
                
                // Initialize question answers if not exists
                const questionIdNum = parseInt(questionId);
                if (!convertedAnswers[questionIdNum]) {
                    convertedAnswers[questionIdNum] = {};
                }
                
                // answersByEvaluatee ควรจะเป็น object ที่มี key เป็น evaluatee_id และ value เป็นคำตอบ
                if (typeof answersByEvaluatee === "object" && answersByEvaluatee !== null) {
                    Object.entries(answersByEvaluatee).forEach(([evaluateeIdStr, answer]) => {
                        const evaluateeIdNum = parseInt(evaluateeIdStr);
                        
                        // Validate that this evaluatee is in our current evaluatees list
                        const isValidEvaluatee = evaluateesForRating.some(e => e.id === evaluateeIdNum);
                        
                        if (isValidEvaluatee) {
                            convertedAnswers[questionIdNum][evaluateeIdNum] = answer;
                         
                        } else {
                          
                        }
                    });
                } else {
                    // Fallback: if the data is not in the expected format, assign to current evaluatee
                
                    convertedAnswers[questionIdNum][evaluatee_id] = answersByEvaluatee;
                }
            });
          
            // นับจำนวนคำตอบต่อคนเพื่อให้เห็นสถานะการโหลดข้อมูล
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
         
            // ถ้าไม่มีข้อมูลเก่า ให้ตั้งค่าโครงสร้างว่าง
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
            // Remove the parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('goto_last');
            window.history.replaceState({}, '', url.toString());
        }
    }, [groupedQuestions.length]);
    
    // Check if all questions are answered for all evaluatees in the angle
    const isGroupComplete = currentGroup.questions.every((q) => {
        const questionAnswers = answers[q.id] || {};
        
        // For multi-evaluatee mode (any question type)
        if (evaluateesForRating && evaluateesForRating.length > 1) {
            return evaluateesForRating.every(evaluatee => {
                const ans = questionAnswers[evaluatee.id];
                
                // Check based on question type
                switch (q.type) {
                    case "rating":
                        return ans !== undefined && ans !== "" && ans !== null;
                    case "choice":
                        // Handle both simple value and object with other_text
                        if (typeof ans === 'object' && ans !== null) {
                            return ans.value !== undefined && ans.value !== "" && ans.value !== null;
                        } else {
                            return ans !== undefined && ans !== "" && ans !== null;
                        }
                    case "multiple_choice":
                        // Handle both simple array and object with other_text
                        if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                            return Array.isArray(ans.value) && ans.value.length > 0;
                        } else {
                            return Array.isArray(ans) && ans.length > 0;
                        }
                    case "open_text":
                        return typeof ans === "string" && ans.trim() !== "";
                    default:
                        return ans !== undefined && ans !== "" && ans !== null;
                }
            });
        }
        
        // For single evaluatee mode
        const ans = questionAnswers[evaluatee_id];
        switch (q.type) {
            case "rating":
                return ans !== undefined && ans !== "" && ans !== null;
            case "choice":
                // Handle both simple value and object with other_text
                if (typeof ans === 'object' && ans !== null) {
                    return ans.value !== undefined && ans.value !== "" && ans.value !== null;
                } else {
                    return ans !== undefined && ans !== "" && ans !== null;
                }
            case "multiple_choice":
                // Handle both simple array and object with other_text
                if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                    return Array.isArray(ans.value) && ans.value.length > 0;
                } else {
                    return Array.isArray(ans) && ans.length > 0;
                }
            case "open_text":
                return typeof ans === "string" && ans.trim() !== "";
            default:
                return ans !== undefined && ans !== "" && ans !== null;
        }
    });

    const updateAnswer = (questionId: number, evaluateeId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [evaluateeId]: value
            }
        }));
    };
    
    // Legacy updateAnswer for backward compatibility with single evaluatee questions
    const updateSingleAnswer = (questionId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [evaluatee_id]: value
            }
        }));
    };

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
                    route("assigned-evaluations.questions", {
                        evaluatee: evaluatee_id,
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
        const currentAnswers: Record<number, any> = {};
        
        // Scroll to top when moving to next group within the same step
        if (currentIndex < groupedQuestions.length - 1) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
        
        currentGroup.questions.forEach((q) => {
            const questionAnswers = answers[q.id];
            if (questionAnswers) {
                // For multi-evaluatee mode (any question type)
                if (evaluateesForRating && evaluateesForRating.length > 1) {
                    evaluateesForRating.forEach(evaluatee => {
                        const val = questionAnswers[evaluatee.id];
                        
                        // Validate answer based on question type
                        let isValidAnswer = false;
                        switch (q.type) {
                            case "rating":
                                isValidAnswer = val !== undefined && val !== "" && val !== null;
                                break;
                            case "choice":
                                // Handle both simple value and object with other_text
                                if (typeof val === 'object' && val !== null) {
                                    isValidAnswer = val.value !== undefined && val.value !== "" && val.value !== null;
                                } else {
                                    isValidAnswer = val !== undefined && val !== "" && val !== null;
                                }
                                break;
                            case "multiple_choice":
                                // Handle both simple array and object with other_text
                                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                                    isValidAnswer = Array.isArray(val.value) && val.value.length > 0;
                                } else {
                                    isValidAnswer = Array.isArray(val) && val.length > 0;
                                }
                                break;
                            case "open_text":
                                isValidAnswer = typeof val === "string" && val.trim() !== "";
                                break;
                            default:
                                isValidAnswer = val !== undefined && val !== "" && val !== null;
                        }
                        
                        if (isValidAnswer) {
                            // Create a unique key for each question-evaluatee combination
                            const key = `${q.id}_${evaluatee.id}`;
                            
                            // Handle other_text for choice and multiple_choice questions
                            let answerData = {
                                question_id: q.id,
                                evaluatee_id: evaluatee.id,
                                value: val
                            };
                            
                            if (typeof val === 'object' && val !== null && val.other_text) {
                                answerData.other_text = val.other_text;
                                answerData.value = val.value;
                            }
                            
                            currentAnswers[key] = answerData;
                        }
                    });
                } else {
                    // For single evaluatee mode
                    const val = questionAnswers[evaluatee_id];
                    
                    // Validate answer based on question type
                    let isValidAnswer = false;
                    switch (q.type) {
                        case "rating":
                        case "choice":
                            isValidAnswer = val !== undefined && val !== "" && val !== null;
                            break;
                        case "multiple_choice":
                            isValidAnswer = Array.isArray(val) && val.length > 0;
                            break;
                        case "open_text":
                            isValidAnswer = typeof val === "string" && val.trim() !== "";
                            break;
                        default:
                            isValidAnswer = val !== undefined && val !== "" && val !== null;
                    }
                    
                    if (isValidAnswer) {
                        currentAnswers[q.id] = val;
                    }
                }
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
                    }
                );
            
                
             
                
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
            // Current group completed, determine next action
            setIsLoading(true);
            
            // Check if this is the last group in the last step
            if (step >= total_steps && currentIndex >= groupedQuestions.length - 1) {
                // Complete evaluation, show success message and go back to dashboard
                alert("การประเมินเสร็จสมบูรณ์แล้ว! 🎉");
                router.visit(route("dashboard"), {
                    method: "get",
                    preserveScroll: false,
                    preserveState: false,
                });
                return;
            }
            
            // Check if this is the last group in current step but not last step
            if (currentIndex >= groupedQuestions.length - 1 && step < total_steps) {
                // Go to next step
                router.visit(
                    route("assigned-evaluations.questions", {
                        evaluatee: evaluatee_id,
                        step: step + 1,
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
                            alert("เกิดข้อผิดพลาดในการโหลดขั้นตอนถัดไป");
                        }
                    }
                );
            } else {
                // Stay in current step, but refresh to go to next appropriate group
                router.visit(
                    route("assigned-evaluations.questions", {
                        evaluatee: evaluatee_id,
                        step: step,
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
                            alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-8"
                    >
                        <div className="flex items-center justify-center space-x-2 mb-4">
                            <Users
                                className="text-indigo-600 dark:text-indigo-400"
                                size={24}
                            />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                แบบประเมินผู้ได้รับมอบหมาย
                            </h1>
                        </div>

                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">
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

                    {/* Evaluatees Info Card - แสดงเมื่อมีหลายคน */}
                    {evaluateesForRating.length > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 mb-6"
                        >
                            <div className="flex items-center space-x-2 mb-4">
                                <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    รายชื่อผู้ถูกประเมินทั้งหมด
                                </h3>
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {evaluateesForRating.length} คน
                                </span>
                            </div>
                            
                            {/* Group by angle */}
                            <div className="space-y-4">
                                {['top', 'bottom', 'left', 'right'].map((angle) => {
                                    const angleEvaluatees = evaluateesForRating.filter(e => e.angle === angle);
                                    if (angleEvaluatees.length === 0) return null;
                                    
                                    const angleConfig = {
                                        top: { 
                                            label: 'องศาบน', 
                                            icon: '⬆️', 
                                            color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                            bgColor: 'bg-blue-50 dark:bg-blue-900/10'
                                        },
                                        bottom: { 
                                            label: 'องศาล่าง', 
                                            icon: '⬇️', 
                                            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                            bgColor: 'bg-green-50 dark:bg-green-900/10'
                                        },
                                        left: { 
                                            label: 'องศาซ้าย', 
                                            icon: '⬅️', 
                                            color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                                            bgColor: 'bg-yellow-50 dark:bg-yellow-900/10'
                                        },
                                        right: { 
                                            label: 'องศาขวา', 
                                            icon: '➡️', 
                                            color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                                            bgColor: 'bg-purple-50 dark:bg-purple-900/10'
                                        }
                                    };
                                    
                                    const config = angleConfig[angle];
                                    
                                    return (
                                        <div key={angle} className={`rounded-lg p-3 ${config.bgColor} border border-gray-200/50 dark:border-gray-700/50`}>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                                                    {config.icon} {config.label}
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
                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white"
                                >
                                    <h3 className="text-xl font-bold mb-2">
                                        📋 {currentGroup.subaspectName}
                                    </h3>
                                    {currentGroup.subaspectDescription && (
                                        <p className="text-indigo-100 leading-relaxed">
                                            {currentGroup.subaspectDescription}
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* Questions */}
                            <div className="space-y-6">
                                {currentGroup.questions.map(
                                    (question, index) => {
                                        // Use MultiEvaluateeQuestionCard for all questions when there are multiple evaluatees
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
                                        
                                        // Use regular QuestionCard for single evaluatee
                                        return (
                                            <QuestionCard
                                                key={question.id}
                                                question={question}
                                                answer={answers[question.id]?.[evaluatee_id]}
                                                onAnswerChange={(value) =>
                                                    updateSingleAnswer(question.id, value)
                                                }
                                                questionNumber={index + 1}
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
                                                        
                                                        // For multi-evaluatee mode
                                                        if (evaluateesForRating && evaluateesForRating.length > 1) {
                                                            return evaluateesForRating.every(evaluatee => {
                                                                const ans = questionAnswers[evaluatee.id];
                                                                
                                                                switch (q.type) {
                                                                    case "rating":
                                                                        return ans !== undefined && ans !== "" && ans !== null;
                                                                    case "choice":
                                                                        // Handle both simple value and object with other_text
                                                                        if (typeof ans === 'object' && ans !== null) {
                                                                            return ans.value !== undefined && ans.value !== "" && ans.value !== null;
                                                                        } else {
                                                                            return ans !== undefined && ans !== "" && ans !== null;
                                                                        }
                                                                    case "multiple_choice":
                                                                        // Handle both simple array and object with other_text
                                                                        if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                                                                            return Array.isArray(ans.value) && ans.value.length > 0;
                                                                        } else {
                                                                            return Array.isArray(ans) && ans.length > 0;
                                                                        }
                                                                    case "open_text":
                                                                        return typeof ans === "string" && ans.trim() !== "";
                                                                    default:
                                                                        return ans !== undefined && ans !== "" && ans !== null;
                                                                }
                                                            });
                                                        }
                                                        
                                                        // For single evaluatee mode
                                                        const ans = questionAnswers[evaluatee_id];
                                                        switch (q.type) {
                                                            case "rating":
                                                                return ans !== undefined && ans !== "" && ans !== null;
                                                            case "choice":
                                                                // Handle both simple value and object with other_text
                                                                if (typeof ans === 'object' && ans !== null) {
                                                                    return ans.value !== undefined && ans.value !== "" && ans.value !== null;
                                                                } else {
                                                                    return ans !== undefined && ans !== "" && ans !== null;
                                                                }
                                                            case "multiple_choice":
                                                                // Handle both simple array and object with other_text
                                                                if (typeof ans === 'object' && ans !== null && !Array.isArray(ans)) {
                                                                    return Array.isArray(ans.value) && ans.value.length > 0;
                                                                } else {
                                                                    return Array.isArray(ans) && ans.length > 0;
                                                                }
                                                            case "open_text":
                                                                return typeof ans === "string" && ans.trim() !== "";
                                                            default:
                                                                return ans !== undefined && ans !== "" && ans !== null;
                                                        }
                                                    }
                                                ).length
                                            }
                                            /{currentGroup.questions.length}
                                            {evaluateesForRating.length > 1 && ` • ${evaluateesForRating.length} คน`})
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
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
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
                                    className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 w-auto min-w-[140px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg"
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
