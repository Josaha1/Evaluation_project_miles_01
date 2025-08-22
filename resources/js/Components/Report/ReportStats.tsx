import React from "react";
import { Users, TrendingUp, Award, Activity, Zap, Target } from "lucide-react";

interface SummaryStats {
    total_evaluatees: number;
    total_completed: number;
    total_remaining: number;
    completion_rate: number;
    score_distribution: {
        excellent: number;
        very_good: number;
        good: number;
        fair: number;
        poor: number;
    };
    avg_scores_by_group: {
        internal_5_8: number;
        internal_9_12: number;
        external_9_12: number;
    };
    overall_avg_score: number;
    highest_score: number;
    lowest_score: number;
}

interface PerformanceMetrics {
    total_evaluated: number;
    average_score: number;
    median_score: number;
    std_deviation: number;
    completion_rate: number;
    score_range: {
        min: number;
        max: number;
    };
}

interface ReportStatsProps {
    summaryStats: SummaryStats;
    performanceMetrics?: PerformanceMetrics;
}

const ReportStats: React.FC<ReportStatsProps> = ({ summaryStats, performanceMetrics }) => {
    const statCards = [
        {
            title: "ผู้เข้าร่วมทั้งหมด",
            value: summaryStats.total_evaluatees.toLocaleString(),
            subtitle: `เสร็จสิ้น ${summaryStats.total_completed} คน`,
            icon: Users,
            color: "blue",
            progress: summaryStats.completion_rate,
        },
        {
            title: "คะแนนเฉลี่ย",
            value: summaryStats.overall_avg_score.toFixed(2),
            subtitle: `สูงสุด ${summaryStats.highest_score.toFixed(2)}`,
            icon: TrendingUp,
            color: "green",
            progress: (summaryStats.overall_avg_score / 5) * 100,
        },
        {
            title: "อัตราความสำเร็จ",
            value: `${summaryStats.completion_rate.toFixed(1)}%`,
            subtitle: `คงเหลือ ${summaryStats.total_remaining} คน`,
            icon: Target,
            color: "purple",
            progress: summaryStats.completion_rate,
        },
      
    ];

    if (performanceMetrics) {
        statCards.push(
            {
                title: "ค่ามัธยฐาน",
                value: performanceMetrics.median_score.toFixed(2),
                subtitle: `ส่วนเบี่ยงเบน ${performanceMetrics.std_deviation.toFixed(2)}`,
                icon: Activity,
                color: "indigo",
                progress: (performanceMetrics.median_score / 5) * 100,
            },
           
        );
    }

    const getColorClasses = (color: string) => {
        const colors = {
            blue: "bg-blue-50 text-blue-600 border-blue-200",
            green: "bg-green-50 text-green-600 border-green-200",
            purple: "bg-purple-50 text-purple-600 border-purple-200",
            yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
            indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
            pink: "bg-pink-50 text-pink-600 border-pink-200",
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    const getProgressColor = (color: string) => {
        const colors = {
            blue: "bg-blue-500",
            green: "bg-green-500",
            purple: "bg-purple-500",
            yellow: "bg-yellow-500",
            indigo: "bg-indigo-500",
            pink: "bg-pink-500",
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg border ${getColorClasses(stat.color)}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {stat.subtitle}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                    {stat.title}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {stat.progress.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(stat.color)}`}
                                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ReportStats;