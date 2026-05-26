import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ChevronDown,
    ChevronUp,
    User,
    Building,
    CheckCircle,
    Clock,
    ArrowRight,
    Target,
    Award,
    Filter,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface Evaluatee {
    id: number;
    name: string;
    position: string;
    department: string;
    division: string;
    grade: number;
    angles: string[];
    user_type: string;
    is_completed?: boolean;
}

interface Props {
    currentEvaluatee: {
        id: number;
        name: string;
        position: string;
        department: string;
        division: string;
        grade: number;
    };
    assignedEvaluatees: Evaluatee[];
    sameAngleEvaluatees?: Evaluatee[];
    currentAngle?: string;
    currentStep: number;
    className?: string;
}

const getAngleIcon = (angle: string) => {
    switch (angle) {
        case 'top': return '⬆️';
        case 'bottom': return '⬇️';
        case 'left': return '⬅️';
        case 'right': return '➡️';
        default: return '🎯';
    }
};

const getAngleName = (angle: string) => {
    switch (angle) {
        case 'top': return 'ผู้ใต้บังคับบัญชา';
        case 'bottom': return 'ผู้บังคับบัญชา';
        case 'left': return 'องศาซ้าย';
        case 'right': return 'องศาขวา';
        default: return 'องศาอื่นๆ';
    }
};

const getAngleColor = (angle: string) => {
    switch (angle) {
        case 'top': return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700';
        case 'bottom': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
        case 'left': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
        case 'right': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
        default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
};

export const EvaluateeSelector: React.FC<Props> = ({
    currentEvaluatee,
    assignedEvaluatees,
    sameAngleEvaluatees = [],
    currentAngle,
    currentStep,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSameAngleOnly, setShowSameAngleOnly] = useState(true);

    const handleEvaluateeChange = (evaluateeId: number) => {
        if (evaluateeId !== currentEvaluatee.id) {
            router.visit(route('assigned-evaluations.show', {
                evaluateeId: evaluateeId
            }), {
                method: 'get',
                preserveScroll: false,
                preserveState: false,
            });
        }
        setIsExpanded(false);
    };

    const displayEvaluatees = showSameAngleOnly ? sameAngleEvaluatees : assignedEvaluatees;

    return (
        <div className={cn("glass-card rounded-xl overflow-hidden", className)}>
            {/* Header */}
            <div className="gradient-primary p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">เลือกผู้ถูกประเมิน</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-violet-100 text-sm">
                                    {showSameAngleOnly ? sameAngleEvaluatees.length : assignedEvaluatees.length} คน
                                </p>
                                {currentAngle && (
                                    <span className="px-2 py-1 bg-white/20 rounded-md text-xs font-medium">
                                        {getAngleIcon(currentAngle)} {getAngleName(currentAngle)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Current Evaluatee Display */}
            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center mr-4 shadow-md shadow-violet-500/25">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {currentEvaluatee.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {currentEvaluatee.position} · C{currentEvaluatee.grade}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                            {currentEvaluatee.department} · {currentEvaluatee.division}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                            กำลังประเมิน
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Evaluatee List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="p-4">
                            {/* Filter Toggle */}
                            {sameAngleEvaluatees.length > 0 && (
                                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            แสดงเฉพาะองศาเดียวกัน
                                        </span>
                                        {currentAngle && (
                                            <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border", getAngleColor(currentAngle))}>
                                                {getAngleIcon(currentAngle)} {getAngleName(currentAngle)}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowSameAngleOnly(!showSameAngleOnly)}
                                        className="flex items-center gap-2 text-violet-600 hover:text-violet-700 dark:text-violet-400 transition-colors"
                                    >
                                        {showSameAngleOnly ? (
                                            <ToggleRight className="w-5 h-5" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5" />
                                        )}
                                        <span className="text-sm">
                                            {showSameAngleOnly ? 'เปิด' : 'ปิด'}
                                        </span>
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {showSameAngleOnly ? `องศา${getAngleName(currentAngle || '')}` : 'ผู้ถูกประเมินทั้งหมด'}
                                </h4>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {displayEvaluatees.length} คน
                                </div>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {displayEvaluatees.map((evaluatee, index) => (
                                    <motion.button
                                        key={evaluatee.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleEvaluateeChange(evaluatee.id)}
                                        className={cn(
                                            "w-full p-4 rounded-lg border transition-all text-left hover:shadow-md",
                                            evaluatee.id === currentEvaluatee.id
                                                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 ring-2 ring-violet-500/20"
                                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center flex-1">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center mr-4",
                                                    evaluatee.id === currentEvaluatee.id
                                                        ? "gradient-primary shadow-md shadow-violet-500/25"
                                                        : "bg-gray-400 dark:bg-gray-600"
                                                )}>
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {evaluatee.name}
                                                        </div>
                                                        {evaluatee.id === currentEvaluatee.id && (
                                                            <span className="px-2 py-1 gradient-primary text-white text-xs rounded-full font-medium">
                                                                กำลังประเมิน
                                                            </span>
                                                        )}
                                                        {evaluatee.is_completed && (
                                                            <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded-full font-medium flex items-center gap-1">
                                                                <CheckCircle className="w-3 h-3" />
                                                                เสร็จแล้ว
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                        {evaluatee.position} · ระดับ C{evaluatee.grade}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                                                        {evaluatee.department} · {evaluatee.division}
                                                    </div>

                                                    {/* Angles */}
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                        {evaluatee.angles.map((angle) => (
                                                            <span
                                                                key={angle}
                                                                className={cn(
                                                                    "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
                                                                    angle === currentAngle
                                                                        ? getAngleColor(angle)
                                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                                                                )}
                                                                title={getAngleName(angle)}
                                                            >
                                                                <span className="mr-1">{getAngleIcon(angle)}</span>
                                                                {getAngleName(angle)}
                                                                {angle === currentAngle && (
                                                                    <Target className="w-3 h-3 ml-1" />
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center ml-4">
                                                {evaluatee.id !== currentEvaluatee.id ? (
                                                    <div className="flex items-center text-gray-400 hover:text-violet-500 transition-colors">
                                                        <span className="text-sm mr-1">เลือก</span>
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-violet-500">
                                                        <Target className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Stats */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Building className="w-4 h-4 mr-1" />
                        <span>รวม {assignedEvaluatees.length} คน</span>
                    </div>
                    <div className="text-violet-600 dark:text-violet-400">
                        ขั้นตอนที่ {currentStep}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluateeSelector;
