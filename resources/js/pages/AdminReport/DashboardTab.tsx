import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, Clock, Target, Star, Globe, TrendingUp } from 'lucide-react';
import { getGradeLabel, getAngleLabel, getScoreColor } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardTabProps {
    dashboardStats: {
        totalParticipants: number;
        completedEvaluations: number;
        pendingEvaluations: number;
        overallCompletionRate: number;
        averageScore: number;
        uniqueEvaluators: number;
        uniqueEvaluatees: number;
    };
    evaluationMetrics: {
        byGrade: Array<{
            grade: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byAngle: Array<{
            angle: string;
            total: number;
            completed: number;
            averageScore: number;
        }>;
    };
    externalOrgMetrics: Array<{
        org_id: number;
        org_name: string;
        total_responses: number;
        avg_score: number;
        evaluatee_count: number;
        evaluator_count?: number;
    }>;
    filteredResults: Array<{
        id: number;
        evaluateeName: string;
        evaluateeGrade: number;
        evaluateeDivision: string;
        scores: {
            self: number;
            top: number;
            bottom: number;
            left: number;
            right: number;
            average: number;
        };
        completionStatus: {
            completionRate: number;
            completedAngles: number;
            totalAngles: number;
        };
    }>;
    onViewIndividual: (userId: number) => void;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function aggregateGrades(
    byGrade: DashboardTabProps['evaluationMetrics']['byGrade'],
) {
    const buckets = [
        {
            label: 'ผู้ว่าการ (ระดับ 13)',
            sublabel: 'ผู้บริหารระดับสูงสุด',
            bgGradient: 'from-rose-500 to-pink-500',
            ringColor: 'ring-rose-200 dark:ring-rose-800',
            total: 0,
            completed: 0,
            scoreSum: 0,
            count: 0,
        },
        {
            label: 'ผู้บริหาร (ระดับ 9-12)',
            sublabel: 'ผู้บริหารระดับกลาง-สูง',
            bgGradient: 'from-amber-500 to-orange-500',
            ringColor: 'ring-amber-200 dark:ring-amber-800',
            total: 0,
            completed: 0,
            scoreSum: 0,
            count: 0,
        },
        {
            label: 'พนักงาน (ระดับ 4-8)',
            sublabel: 'พนักงานทั่วไป',
            bgGradient: 'from-cyan-500 to-teal-500',
            ringColor: 'ring-cyan-200 dark:ring-cyan-800',
            total: 0,
            completed: 0,
            scoreSum: 0,
            count: 0,
        },
    ];

    byGrade.forEach((g) => {
        let idx: number;
        if (g.grade >= 13) idx = 0;
        else if (g.grade >= 9) idx = 1;
        else idx = 2;

        buckets[idx].total += g.total;
        buckets[idx].completed += g.completed;
        buckets[idx].scoreSum += g.averageScore * g.total;
        buckets[idx].count += g.total;
    });

    return buckets.map((b) => ({
        ...b,
        avgScore: b.count > 0 ? b.scoreSum / b.count : 0,
        completionRate: b.total > 0 ? (b.completed / b.total) * 100 : 0,
    }));
}

const angleGradients: Record<string, string> = {
    self: 'from-violet-500 to-purple-500',
    top: 'from-blue-500 to-indigo-500',
    bottom: 'from-emerald-500 to-green-500',
    left: 'from-amber-500 to-orange-500',
    right: 'from-teal-500 to-cyan-500',
};

const angleBgColors: Record<string, string> = {
    self: 'bg-violet-100 dark:bg-violet-900/30',
    top: 'bg-blue-100 dark:bg-blue-900/30',
    bottom: 'bg-emerald-100 dark:bg-emerald-900/30',
    left: 'bg-amber-100 dark:bg-amber-900/30',
    right: 'bg-teal-100 dark:bg-teal-900/30',
};

const angleTextColors: Record<string, string> = {
    self: 'text-violet-700 dark:text-violet-300',
    top: 'text-blue-700 dark:text-blue-300',
    bottom: 'text-emerald-700 dark:text-emerald-300',
    left: 'text-amber-700 dark:text-amber-300',
    right: 'text-teal-700 dark:text-teal-300',
};

/** Score color for badges (bg-based) */
function scoreBadgeColor(score: number): string {
    if (score >= 4.5) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (score >= 3.5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    if (score >= 2.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
}

/** Score color for the KPI card gradient */
function scoreGradient(score: number): string {
    if (score >= 4.5) return 'from-emerald-500 to-green-500';
    if (score >= 3.5) return 'from-blue-500 to-indigo-500';
    if (score >= 2.5) return 'from-yellow-500 to-amber-500';
    return 'from-red-500 to-rose-500';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DashboardTab: React.FC<DashboardTabProps> = ({
    dashboardStats,
    evaluationMetrics,
    externalOrgMetrics,
    filteredResults,
    onViewIndividual,
}) => {
    const gradeGroups = useMemo(
        () => aggregateGrades(evaluationMetrics.byGrade),
        [evaluationMetrics.byGrade],
    );

    const top5 = useMemo(
        () => filteredResults.slice(0, 5),
        [filteredResults],
    );

    // Ensure angles are in a fixed order
    const orderedAngles = useMemo(() => {
        const order = ['self', 'top', 'bottom', 'left', 'right'];
        return order
            .map((key) => evaluationMetrics.byAngle.find((a) => a.angle === key))
            .filter(Boolean) as DashboardTabProps['evaluationMetrics']['byAngle'];
    }, [evaluationMetrics.byAngle]);

    const completionRate = dashboardStats.overallCompletionRate;
    const circumference = 2 * Math.PI * 36; // r=36
    const strokeOffset = circumference - (circumference * Math.min(completionRate, 100)) / 100;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* ============================================================= */}
            {/* Section 1: KPI Cards — 4 cards in a row                       */}
            {/* ============================================================= */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                variants={itemVariants}
            >
                {/* Card 1: ผู้ถูกประเมินทั้งหมด */}
                <motion.div
                    className="glass-card rounded-2xl p-5 flex flex-col gap-2"
                    variants={itemVariants}
                >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboardStats.uniqueEvaluatees}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ผู้ถูกประเมินทั้งหมด
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">คน</div>
                </motion.div>

                {/* Card 2: ประเมินครบแล้ว */}
                <motion.div
                    className="glass-card rounded-2xl p-5 flex flex-col gap-2"
                    variants={itemVariants}
                >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {dashboardStats.completedEvaluations}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ประเมินครบแล้ว
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">รายการ</div>
                </motion.div>

                {/* Card 3: อัตราสำเร็จ with circular progress */}
                <motion.div
                    className="glass-card rounded-2xl p-5 flex flex-col gap-2"
                    variants={itemVariants}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg">
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {completionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                อัตราสำเร็จ
                            </div>
                        </div>
                        {/* Circular progress */}
                        <div className="relative w-16 h-16 flex-shrink-0">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 80 80">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-gray-200 dark:text-gray-700"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    fill="none"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    className="text-sky-500"
                                    stroke="currentColor"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeOffset}
                                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {completionRate.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 4: คะแนนเฉลี่ย */}
                <motion.div
                    className="glass-card rounded-2xl p-5 flex flex-col gap-2"
                    variants={itemVariants}
                >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${scoreGradient(dashboardStats.averageScore)} flex items-center justify-center shadow-lg`}>
                        <Star className="w-5 h-5 text-white" />
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(dashboardStats.averageScore)}`}>
                        {dashboardStats.averageScore.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        คะแนนเฉลี่ย
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">จาก 5.00 คะแนน</div>
                    {/* Score bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${scoreGradient(dashboardStats.averageScore)} transition-all duration-700`}
                            style={{ width: `${Math.min((dashboardStats.averageScore / 5) * 100, 100)}%` }}
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* ============================================================= */}
            {/* Section 2: กลุ่มระดับผู้ถูกประเมิน (3 cards)                    */}
            {/* ============================================================= */}
            <motion.div variants={itemVariants}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    กลุ่มระดับผู้ถูกประเมิน
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {gradeGroups.map((group, idx) => (
                        <motion.div
                            key={group.label}
                            className="glass-card rounded-2xl p-5 space-y-4"
                            variants={itemVariants}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${group.bgGradient} flex items-center justify-center shadow-lg`}
                                >
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 dark:text-white text-sm">
                                        {group.label}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                        {group.sublabel}
                                    </div>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-gray-800 dark:text-white">
                                        {group.total}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        จำนวนผู้ถูกประเมิน
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {group.completed}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        ประเมินครบ
                                    </div>
                                </div>
                            </div>

                            {/* Average score */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    คะแนนเฉลี่ย
                                </span>
                                <span className={`text-lg font-bold ${getScoreColor(group.avgScore)}`}>
                                    {group.avgScore > 0 ? group.avgScore.toFixed(2) : '-'}
                                </span>
                            </div>

                            {/* Completion progress bar */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    <span>อัตราสำเร็จ</span>
                                    <span>{group.completionRate.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full bg-gradient-to-r ${group.bgGradient} transition-all duration-700`}
                                        style={{ width: `${Math.min(group.completionRate, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ============================================================= */}
            {/* Section 3: คะแนนเฉลี่ยตามมุมประเมิน (5 horizontal bars)        */}
            {/* ============================================================= */}
            <motion.div variants={itemVariants}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    คะแนนเฉลี่ยตามมุมประเมิน
                </h3>
                <div className="glass-card rounded-2xl p-6 space-y-4">
                    {orderedAngles.map((angle) => {
                        const gradient = angleGradients[angle.angle] ?? 'from-gray-500 to-gray-600';
                        const bgColor = angleBgColors[angle.angle] ?? 'bg-gray-100 dark:bg-gray-800';
                        const textColor = angleTextColors[angle.angle] ?? 'text-gray-700 dark:text-gray-300';
                        const barWidth = angle.averageScore > 0
                            ? Math.min((angle.averageScore / 5) * 100, 100)
                            : 0;

                        return (
                            <motion.div
                                key={angle.angle}
                                className="flex items-center gap-4"
                                variants={itemVariants}
                            >
                                {/* Label */}
                                <div className="w-36 flex-shrink-0">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor}`}>
                                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${gradient}`} />
                                        <span className={`text-sm font-medium ${textColor}`}>
                                            {getAngleLabel(angle.angle)}
                                        </span>
                                    </div>
                                </div>

                                {/* Score number */}
                                <div className={`w-14 text-right text-lg font-bold flex-shrink-0 ${getScoreColor(angle.averageScore)}`}>
                                    {angle.averageScore > 0 ? angle.averageScore.toFixed(2) : '-'}
                                </div>

                                {/* Bar */}
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                                    <motion.div
                                        className={`h-4 rounded-full bg-gradient-to-r ${gradient}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${barWidth}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                </div>

                                {/* Count */}
                                <div className="w-20 text-right text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {angle.total} รายการ
                                </div>
                            </motion.div>
                        );
                    })}

                    {orderedAngles.length === 0 && (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-6">
                            ไม่พบข้อมูลมุมประเมิน
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ============================================================= */}
            {/* Section 4: ผู้ถูกประเมินล่าสุด (top 5)                          */}
            {/* ============================================================= */}
            <motion.div variants={itemVariants}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    ผู้ถูกประเมินล่าสุด
                </h3>
                <div className="space-y-3">
                    {top5.map((item, idx) => {
                        const isComplete =
                            item.completionStatus.completedAngles >=
                            item.completionStatus.totalAngles &&
                            item.completionStatus.totalAngles > 0;

                        const angleKeys = ['self', 'top', 'bottom', 'left', 'right'] as const;

                        return (
                            <motion.div
                                key={item.id}
                                className="glass-card rounded-2xl p-5"
                                variants={itemVariants}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Left: Name & Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-800 dark:text-white truncate">
                                                    {item.evaluateeName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {getGradeLabel(item.evaluateeGrade)}
                                                    {item.evaluateeDivision && ` • ${item.evaluateeDivision}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: 5 angle score badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {angleKeys.map((key) => {
                                            const score = item.scores[key];
                                            const label = getAngleLabel(key);
                                            const hasScore = score > 0;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg text-xs ${
                                                        hasScore
                                                            ? scoreBadgeColor(score)
                                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                                                    }`}
                                                    title={label}
                                                >
                                                    <span className="font-medium text-[10px] leading-tight">
                                                        {label.substring(0, 4)}
                                                    </span>
                                                    <span className="font-bold">
                                                        {hasScore ? score.toFixed(1) : '-'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Right: Overall average + completion + button */}
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {/* Overall average */}
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${getScoreColor(item.scores.average)}`}>
                                                {item.scores.average > 0
                                                    ? item.scores.average.toFixed(2)
                                                    : '-'}
                                            </div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                                                เฉลี่ย
                                            </div>
                                        </div>

                                        {/* Completion badge */}
                                        <div className="text-center">
                                            {isComplete ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    ครบ
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {item.completionStatus.completedAngles}/{item.completionStatus.totalAngles}
                                                </span>
                                            )}
                                        </div>

                                        {/* View detail button */}
                                        <button
                                            onClick={() => onViewIndividual(item.id)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50 transition-colors"
                                        >
                                            ดูรายละเอียด
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {top5.length === 0 && (
                        <div className="glass-card rounded-2xl p-8 text-center text-gray-400 dark:text-gray-500">
                            ไม่พบข้อมูลผู้ถูกประเมิน
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DashboardTab;
