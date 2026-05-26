import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    ChevronDown,
    ChevronUp,
    Trophy,
    Target,
    BarChart3,
    TrendingUp,
    Award,
    Crown,
    CheckCircle,
    Clock,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeerData {
    id: number;
    name: string;
    position: string;
    department: string;
    division: string;
    grade: number;
    total_score: number;
    max_score: number;
    score_percentage: number;
    is_completed: boolean;
    angle: string;
}

interface PeerComparisonData {
    current_evaluatee: PeerData;
    peer_comparisons: PeerData[];
    angle: string;
    total_peers: number;
}

interface Props {
    peerComparison: PeerComparisonData;
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
        case 'top': return 'ผู้บังคับบัญชา';
        case 'bottom': return 'ผู้ใต้บังคับบัญชา';
        case 'left': return 'องศาซ้าย';
        case 'right': return 'องศาขวา';
        default: return 'องศาอื่นๆ';
    }
};

const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800';
    if (percentage >= 80) return 'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-900/20 dark:border-violet-800';
    if (percentage >= 70) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
    return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
};

const getScoreTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (percentage >= 80) return 'text-violet-600 dark:text-violet-400';
    if (percentage >= 70) return 'text-amber-600 dark:text-amber-400';
    if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
};

const getRankIcon = (index: number) => {
    switch (index) {
        case 0: return <Crown className="w-4 h-4 text-yellow-500" />;
        case 1: return <Award className="w-4 h-4 text-gray-400" />;
        case 2: return <Trophy className="w-4 h-4 text-amber-600" />;
        default: return <Target className="w-4 h-4 text-gray-400" />;
    }
};

export const PeerComparisonWidget: React.FC<Props> = ({ peerComparison, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    if (!peerComparison || peerComparison.total_peers === 0) {
        return (
            <div className={cn("glass-card rounded-lg p-4", className)}>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users className="w-5 h-5 mr-2" />
                    <span className="text-sm">ไม่มีข้อมูลเปรียบเทียบ</span>
                </div>
            </div>
        );
    }

    const { current_evaluatee, peer_comparisons, angle, total_peers } = peerComparison;

    const allEvaluatees = [current_evaluatee, ...peer_comparisons]
        .filter(p => p.is_completed)
        .sort((a, b) => b.score_percentage - a.score_percentage);

    const currentRank = allEvaluatees.findIndex(p => p.id === current_evaluatee.id) + 1;
    const completedCount = allEvaluatees.length;
    const avgScore = allEvaluatees.length > 0
        ? allEvaluatees.reduce((sum, p) => sum + p.score_percentage, 0) / allEvaluatees.length
        : 0;

    return (
        <div className={cn("glass-card rounded-xl overflow-hidden", className)}>
            {/* Header */}
            <div className="gradient-primary p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-xl">{getAngleIcon(angle)}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">การเปรียบเทียบคะแนน</h3>
                            <p className="text-violet-100 text-sm">{getAngleName(angle)} · รวม {total_peers + 1} คน</p>
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

            {/* Quick Stats */}
            <div className="p-4 bg-violet-50/50 dark:bg-violet-900/10 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                            {currentRank > 0 ? `#${currentRank}` : '-'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">อันดับ</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {current_evaluatee.score_percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">คะแนนปัจจุบัน</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {avgScore.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">คะแนนเฉลี่ย</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {completedCount}/{total_peers + 1}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">ประเมินแล้ว</div>
                    </div>
                </div>
            </div>

            {/* Current Evaluatee Highlight */}
            <div className="p-4">
                <div className="mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        ผู้ที่กำลังประเมิน
                    </h4>
                </div>
                <div className={cn("p-4 rounded-lg border-2 border-dashed", getScoreColor(current_evaluatee.score_percentage))}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center mr-3 shadow-md shadow-violet-500/25">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {current_evaluatee.name}
                                    <span className="ml-2 px-2 py-1 gradient-primary text-white text-xs rounded-full">
                                        กำลังประเมิน
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {current_evaluatee.position} · C{current_evaluatee.grade}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {current_evaluatee.department} · {current_evaluatee.division}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={cn("text-xl font-bold", getScoreTextColor(current_evaluatee.score_percentage))}>
                                {current_evaluatee.score_percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                                {current_evaluatee.total_score}/{current_evaluatee.max_score} คะแนน
                            </div>
                            <div className="flex items-center justify-end mt-1">
                                {current_evaluatee.is_completed ? (
                                    <div className="flex items-center text-emerald-500 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        ประเมินเสร็จแล้ว
                                    </div>
                                ) : (
                                    <div className="flex items-center text-amber-500 text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        กำลังประเมิน
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded View */}
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
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    รายการผู้ถูกประเมินทั้งหมด
                                </h4>
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 transition-colors"
                                >
                                    {showDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {allEvaluatees.map((peer, index) => (
                                    <motion.div
                                        key={peer.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all",
                                            peer.id === current_evaluatee.id
                                                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
                                                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex items-center mr-3">
                                                    {getRankIcon(index)}
                                                    <span className="ml-1 text-sm font-medium">#{index + 1}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium flex items-center">
                                                        {peer.name}
                                                        {peer.id === current_evaluatee.id && (
                                                            <span className="ml-2 px-2 py-1 gradient-primary text-white text-xs rounded-full">
                                                                กำลังประเมิน
                                                            </span>
                                                        )}
                                                        {peer.is_completed && (
                                                            <CheckCircle className="w-4 h-4 text-emerald-500 ml-2" />
                                                        )}
                                                    </div>
                                                    {showDetails && (
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            <div>{peer.position} · C{peer.grade}</div>
                                                            <div>{peer.department} · {peer.division}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn("text-lg font-bold", getScoreTextColor(peer.score_percentage))}>
                                                    {peer.score_percentage.toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {peer.total_score}/{peer.max_score}
                                                </div>
                                                {!peer.is_completed && (
                                                    <div className="flex items-center text-amber-500 text-xs mt-1">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        ยังไม่เสร็จ
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {peer_comparisons.filter(p => !p.is_completed).length > 0 && (
                                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center text-amber-700 dark:text-amber-300">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span className="text-sm">
                                            มี {peer_comparisons.filter(p => !p.is_completed).length} คนที่ยังประเมินไม่เสร็จ
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Performance Insights */}
            {isExpanded && completedCount > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-violet-500" />
                        ข้อมูลเชิงลึก
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {current_evaluatee.score_percentage > avgScore ? (
                            <div className="text-emerald-600 dark:text-emerald-400">
                                คะแนนสูงกว่าค่าเฉลี่ย {(current_evaluatee.score_percentage - avgScore).toFixed(1)} จุด
                            </div>
                        ) : current_evaluatee.score_percentage < avgScore ? (
                            <div className="text-amber-600 dark:text-amber-400">
                                คะแนนต่ำกว่าค่าเฉลี่ย {(avgScore - current_evaluatee.score_percentage).toFixed(1)} จุด
                            </div>
                        ) : (
                            <div className="text-violet-600 dark:text-violet-400">
                                คะแนนใกล้เคียงกับค่าเฉลี่ย
                            </div>
                        )}
                        <div>
                            อันดับ {currentRank} จาก {completedCount} คน
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeerComparisonWidget;
