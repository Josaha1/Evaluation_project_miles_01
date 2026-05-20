import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    currentGroup?: number;
    totalGroups?: number;
    stepLabels?: string[];
}

/* ------------------------------------------------------------------ */
/*  Circular Progress Ring (SVG)                                      */
/* ------------------------------------------------------------------ */

function CircularProgress({
    percentage,
    size = 72,
    strokeWidth = 5,
    label,
}: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
}) {
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress arc */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <defs>
                    <linearGradient
                        id="progressGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                </defs>
            </svg>
            {/* Centre text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    key={Math.round(percentage)}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-none"
                >
                    {Math.round(percentage)}
                    <span className="text-[10px] font-semibold text-gray-400">%</span>
                </motion.span>
                {label && (
                    <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Step Pill                                                          */
/* ------------------------------------------------------------------ */

function StepPill({
    index,
    status,
    label,
    isLast,
}: {
    index: number;
    status: "completed" | "current" | "upcoming";
    label?: string;
    isLast: boolean;
}) {
    return (
        <div className="flex items-center">
            {/* Pill / dot */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    delay: index * 0.08,
                    type: "spring",
                    stiffness: 400,
                    damping: 22,
                }}
                className="flex flex-col items-center"
            >
                <div
                    className={cn(
                        "relative flex items-center justify-center rounded-full transition-all duration-300",
                        status === "completed"
                            ? "w-7 h-7 sm:w-8 sm:h-8 gradient-primary shadow-md shadow-violet-500/20"
                            : status === "current"
                            ? "w-8 h-8 sm:w-9 sm:h-9 gradient-primary shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/20"
                            : "w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700"
                    )}
                >
                    {status === "completed" ? (
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                        <span
                            className={cn(
                                "text-xs sm:text-sm font-bold",
                                status === "current"
                                    ? "text-white"
                                    : "text-gray-400 dark:text-gray-500"
                            )}
                        >
                            {index + 1}
                        </span>
                    )}

                    {/* Pulse ring for current step */}
                    {status === "current" && (
                        <motion.div
                            className="absolute inset-0 rounded-full gradient-primary opacity-30"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    )}
                </div>

                {/* Step label */}
                {label && (
                    <span
                        className={cn(
                            "mt-1.5 text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[60px] sm:max-w-[80px] line-clamp-2",
                            status === "current"
                                ? "text-violet-600 dark:text-violet-400 font-semibold"
                                : status === "completed"
                                ? "text-gray-600 dark:text-gray-400"
                                : "text-gray-400 dark:text-gray-500"
                        )}
                    >
                        {label}
                    </span>
                )}
            </motion.div>

            {/* Connector line */}
            {!isLast && (
                <div className="relative mx-1 sm:mx-1.5 flex-1 min-w-[16px] sm:min-w-[24px] h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden self-center mb-auto mt-3.5 sm:mt-4">
                    <motion.div
                        className="absolute inset-y-0 left-0 gradient-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{
                            width:
                                status === "completed"
                                    ? "100%"
                                    : status === "current"
                                    ? "50%"
                                    : "0%",
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ProgressIndicator({
    currentStep,
    totalSteps,
    currentGroup = 0,
    totalGroups = 1,
    stepLabels,
}: ProgressIndicatorProps) {
    const overallProgress = ((currentStep - 1) / totalSteps) * 100;
    const groupProgress = ((currentGroup + 1) / totalGroups) * 100;

    // Determine status for each step
    const getStepStatus = (
        stepIndex: number
    ): "completed" | "current" | "upcoming" => {
        if (stepIndex < currentStep - 1) return "completed";
        if (stepIndex === currentStep - 1) return "current";
        return "upcoming";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "glass-card rounded-2xl p-4 sm:p-5 space-y-4"
            )}
        >
            {/* Top row: Circular progress + text */}
            <div className="flex items-center gap-4">
                <CircularProgress
                    percentage={overallProgress}
                    size={68}
                    strokeWidth={5}
                    label="ความคืบหน้า"
                />

                <div className="flex-1 min-w-0 space-y-2">
                    {/* Step text */}
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            ตอนที่{" "}
                            <span className="text-gradient-primary font-extrabold">
                                {currentStep}
                            </span>{" "}
                            จาก {totalSteps}
                        </span>
                    </div>

                    {/* Group progress (within current step) */}
                    {totalGroups > 1 && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    หัวข้อที่ {currentGroup + 1} / {totalGroups}
                                </span>
                                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                    {Math.round(groupProgress)}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${groupProgress}%`,
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        ease: "easeOut",
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Step pills / dots */}
            {totalSteps > 1 && (
                <div className="flex items-start justify-center overflow-x-auto pb-1 scrollbar-none">
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <StepPill
                            key={i}
                            index={i}
                            status={getStepStatus(i)}
                            label={stepLabels?.[i]}
                            isLast={i === totalSteps - 1}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}
