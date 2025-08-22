import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
    currentGroup?: number;
    totalGroups?: number;
}

export function ProgressIndicator({
    currentStep,
    totalSteps,
    currentGroup = 0,
    totalGroups = 1,
}: ProgressIndicatorProps) {
    const overallProgress = ((currentStep - 1) / totalSteps) * 100;
    const groupProgress = ((currentGroup + 1) / totalGroups) * 100;

    return (
        <div className="space-y-4">
            {/* Overall Progress */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ตอนที่ {currentStep} จาก {totalSteps}
                </span>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {Math.round(overallProgress)}%
                </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* Group Progress (within current step) */}
            {totalGroups > 1 && (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            หัวข้อที่ {currentGroup + 1} จาก {totalGroups}
                        </span>
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                            {Math.round(groupProgress)}%
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <motion.div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${groupProgress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                    </div>
                </>
            )}

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2 mt-4">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <motion.div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all ${
                            i < currentStep - 1
                                ? "bg-green-500"
                                : i === currentStep - 1
                                ? "bg-indigo-500"
                                : "bg-gray-300 dark:bg-gray-600"
                        }`}
                        whileHover={{ scale: 1.2 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    />
                ))}
            </div>
        </div>
    );
}
