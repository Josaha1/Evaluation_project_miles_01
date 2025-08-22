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
        case 'top': return 'องศาบน';
        case 'bottom': return 'องศาล่าง';
        case 'left': return 'องศาซ้าย';
        case 'right': return 'องศาขวา';
        default: return 'องศาอื่นๆ';
    }
};

const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
            <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Users className="w-5 h-5 mr-2" />
                    <span className="text-sm">ไม่มีข้อมูลเปรียบเทียบ</span>
                </div>
            </div>
        );
    }

    const { current_evaluatee, peer_comparisons, angle, total_peers } = peerComparison;
    
    // รวมข้อมูลทั้งหมดและเรียงลำดับ
    const allEvaluatees = [current_evaluatee, ...peer_comparisons]
        .filter(p => p.is_completed)
        .sort((a, b) => b.score_percentage - a.score_percentage);
    
    const currentRank = allEvaluatees.findIndex(p => p.id === current_evaluatee.id) + 1;
    const completedCount = allEvaluatees.length;
    const avgScore = allEvaluatees.length > 0 
        ? allEvaluatees.reduce((sum, p) => sum + p.score_percentage, 0) / allEvaluatees.length 
        : 0;

    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-xl">{getAngleIcon(angle)}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">การเปรียบเทียบคะแนน</h3>
                            <p className="text-blue-100 text-sm">{getAngleName(angle)} • รวม {total_peers + 1} คน</p>
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
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {currentRank > 0 ? `#${currentRank}` : '-'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">อันดับ</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
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
                <div className={`p-4 rounded-lg border-2 border-dashed ${getScoreColor(current_evaluatee.score_percentage)}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {current_evaluatee.name} 
                                    <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                        กำลังประเมิน
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {current_evaluatee.position} • C{current_evaluatee.grade}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {current_evaluatee.department} • {current_evaluatee.division}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {current_evaluatee.score_percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                                {current_evaluatee.total_score}/{current_evaluatee.max_score} คะแนน
                            </div>
                            <div className="flex items-center justify-end mt-1">
                                {current_evaluatee.is_completed ? (
                                    <div className="flex items-center text-green-500 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        ประเมินเสร็จแล้ว
                                    </div>
                                ) : (
                                    <div className="flex items-center text-orange-500 text-xs">
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
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
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
                                        className={`p-3 rounded-lg border transition-all ${
                                            peer.id === current_evaluatee.id 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                                        }`}
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
                                                            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                                                                กำลังประเมิน
                                                            </span>
                                                        )}
                                                        {peer.is_completed && (
                                                            <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                                                        )}
                                                    </div>
                                                    {showDetails && (
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            <div>{peer.position} • C{peer.grade}</div>
                                                            <div>{peer.department} • {peer.division}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-lg font-bold ${
                                                    peer.score_percentage >= 90 ? 'text-green-600' :
                                                    peer.score_percentage >= 80 ? 'text-blue-600' :
                                                    peer.score_percentage >= 70 ? 'text-yellow-600' :
                                                    peer.score_percentage >= 60 ? 'text-orange-600' : 'text-red-600'
                                                }`}>
                                                    {peer.score_percentage.toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {peer.total_score}/{peer.max_score}
                                                </div>
                                                {!peer.is_completed && (
                                                    <div className="flex items-center text-orange-500 text-xs mt-1">
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
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <div className="flex items-center text-yellow-700 dark:text-yellow-300">
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
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        ข้อมูลเชิงลึก
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {current_evaluatee.score_percentage > avgScore ? (
                            <div className="text-green-600 dark:text-green-400">
                                📈 คะแนนสูงกว่าค่าเฉลี่ย {(current_evaluatee.score_percentage - avgScore).toFixed(1)} จุด
                            </div>
                        ) : current_evaluatee.score_percentage < avgScore ? (
                            <div className="text-orange-600 dark:text-orange-400">
                                📉 คะแนนต่ำกว่าค่าเฉลี่ย {(avgScore - current_evaluatee.score_percentage).toFixed(1)} จุด
                            </div>
                        ) : (
                            <div className="text-blue-600 dark:text-blue-400">
                                📊 คะแนนใกล้เคียงกับค่าเฉลี่ย
                            </div>
                        )}
                        <div>
                            🎯 อันดับ {currentRank} จาก {completedCount} คน
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeerComparisonWidget;