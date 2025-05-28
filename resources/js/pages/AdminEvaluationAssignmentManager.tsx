import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { useForm, usePage, router } from "@inertiajs/react";
import {
    Trash2,
    PlusCircle,
    Search,
    Users,
    AlertTriangle,
    CheckCircle,
    User,
    TrendingUp,
    TrendingDown,
    Calendar,
    Award,
    BarChart3,
    Target,
    Activity,
    Gauge,
    Crown,
    Clock,
    Brain,
    Shield,
    Info,
    Database,
    RefreshCw,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Plus,
    X,
    Star,
    Zap,
    Timer,
    Heart,
    FlameKindling,
} from "lucide-react";
import Select from "react-select";
import Breadcrumb from "@/Components/ui/breadcrumb";

// ฟังก์ชันแปลงภาษา
const translateAngleToThai = (angle) => {
    const translations = {
        top: "บน",
        bottom: "ล่าง",
        left: "ซ้าย",
        right: "ขวา",
    };
    return translations[angle] || angle;
};

const translateAngleToEnglish = (angle) => {
    const translations = {
        บน: "top",
        ล่าง: "bottom",
        ซ้าย: "left",
        ขวา: "right",
    };
    return translations[angle] || angle;
};

// 🎨 Advanced UI Components
const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    growth,
    trend = "up",
    onClick,
    className = "",
    badge,
    isLoading = false,
}) => (
    <div
        className={`group relative bg-white dark:bg-zinc-900 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden ${
            onClick ? "cursor-pointer hover:scale-105" : ""
        } ${className}`}
        onClick={onClick}
    >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 transform rotate-12 scale-150"></div>
        </div>

        {/* Content */}
        <div className="relative p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                        <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}
                        >
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        {badge && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                {badge}
                            </span>
                        )}
                    </div>

                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {title}
                    </h3>

                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                {typeof value === "number"
                                    ? value.toLocaleString()
                                    : value}
                            </div>
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {subtitle}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {growth !== undefined && (
                    <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                            trend === "up"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {trend === "up" ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                            {Math.abs(growth)}%
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
);

const ProgressRing = ({
    percentage,
    size = 120,
    strokeWidth = 8,
    color = "#10B981",
    label,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(percentage)}%
                </span>
                {label && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
};

const InsightCard = ({ insight, className = "" }) => {
    const typeStyles = {
        success: "border-green-200 bg-green-50 dark:bg-green-900/20",
        warning: "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20",
        danger: "border-red-200 bg-red-50 dark:bg-red-900/20",
        info: "border-blue-200 bg-blue-50 dark:bg-blue-900/20",
    };

    const iconStyles = {
        success: "text-green-600",
        warning: "text-yellow-600",
        danger: "text-red-600",
        info: "text-blue-600",
    };

    return (
        <div
            className={`p-4 rounded-lg border-2 ${
                typeStyles[insight.type]
            } ${className}`}
        >
            <div className="flex items-start space-x-3">
                <div className="text-2xl">{insight.icon}</div>
                <div className="flex-1">
                    <h4
                        className={`font-medium ${
                            iconStyles[insight.type]
                        } mb-1`}
                    >
                        {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {insight.message}
                    </p>
                </div>
            </div>
        </div>
    );
};

const AngleChart = ({ data, className = "" }) => {
    const angles = ["บน", "ล่าง", "ซ้าย", "ขวา"];
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];
    const icons = ["⬆️", "⬇️", "⬅️", "➡️"];

    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            {angles.map((angle, index) => {
                const item = data[angle] || { count: 0, percentage: 0 };
                const count = item.count || 0;
                const percentage = item.percentage || 0;

                return (
                    <div
                        key={angle}
                        className="group relative overflow-hidden bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity"
                            style={{
                                background: `linear-gradient(135deg, ${colors[index]}, ${colors[index]}80)`,
                            }}
                        ></div>

                        <div className="relative z-10">
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                                {icons[index]}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                องศา{angle}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                {count.toLocaleString()}
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: colors[index],
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TimelineChart = ({ data, className = "" }) => {
    if (!data || data.length === 0)
        return (
            <div className="text-center text-gray-500">ไม่มีข้อมูลกิจกรรม</div>
        );

    const maxCount = Math.max(...data.map((d) => d.daily_count));

    return (
        <div className={`space-y-3 ${className}`}>
            {data.slice(-10).map((day, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-all"
                >
                    <div className="text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
                        {new Date(day.date).toLocaleDateString("th-TH", {
                            month: "short",
                            day: "numeric",
                        })}
                    </div>
                    <div className="flex items-center space-x-3 flex-1 ml-4">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${
                                        maxCount > 0
                                            ? (day.daily_count / maxCount) * 100
                                            : 0
                                    }%`,
                                }}
                            ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-0 flex-shrink-0">
                            {day.daily_count}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TopPerformerCard = ({ performer, rank, type = "evaluator" }) => {
    const rankColors = {
        1: "from-yellow-400 to-yellow-600",
        2: "from-gray-300 to-gray-500",
        3: "from-orange-400 to-orange-600",
    };

    const bgColor =
        rank <= 3
            ? rankColors[rank]
            : "from-blue-400 to-blue-600";

    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border hover:shadow-md transition-all group">
            <div className="flex items-center space-x-3">
                <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgColor} flex items-center justify-center text-white font-bold shadow-lg`}
                >
                    {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
                </div>
                <div>
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {performer.fname} {performer.lname}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        เกรด C{performer.grade}
                        {type === "evaluator" &&
                            performer.unique_evaluatees && (
                                <span className="ml-2">
                                    • ประเมิน {performer.unique_evaluatees} คน
                                </span>
                            )}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {type === "evaluator"
                        ? performer.evaluation_count
                        : performer.times_evaluated}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {type === "evaluator" ? "ครั้ง" : "ครั้งที่ถูกประเมิน"}
                </div>
            </div>
        </div>
    );
};

// Main Component
export default function AdminEvaluationAssignmentManager() {
    const {
        assignments, // <- ใช้กับ Table view (มี pagination)
        card_data, // <- ใหม่! ใช้กับ Card View (แทน Analysis)
        fiscal_years,
        selected_year,
        analytics,
    } = usePage().props;

    const yearOptions = fiscal_years.map((y) => ({
        value: y,
        label: `ปีงบประมาณ ${parseInt(y) + 543}`,
    }));

    const [selectedYear, setSelectedYear] = useState({
        value: selected_year,
        label: `ปีงบประมาณ ${parseInt(selected_year) + 543}`,
    });

    const [dashboardView, setDashboardView] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterGrade, setFilterGrade] = useState("all");

    // Pagination states for card view
    const [cardPage, setCardPage] = useState(1);
    const [cardPerPage, setCardPerPage] = useState(8);

    useEffect(() => {
        router.visit(route("assignments.index"), {
            method: "get",
            data: { fiscal_year: selectedYear.value },
            preserveState: true,
            preserveScroll: true,
        });
    }, [selectedYear]);

    // Global summary stats from card_data
    const globalStats = useMemo(() => {
        if (!card_data?.summary) {
            return { total: 0, complete: 0, incomplete: 0, completionRateAll: 0 };
        }
        return {
            total: card_data.summary.total_evaluatees,
            complete: card_data.summary.complete_count,
            incomplete: card_data.summary.incomplete_count,
            completionRateAll: card_data.summary.total_evaluatees > 0 
                ? Math.round((card_data.summary.complete_count / card_data.summary.total_evaluatees) * 100) 
                : 0,
        };
    }, [card_data]);

    // Filter card data
    const filteredCardData = useMemo(() => {
        if (!card_data?.groups) return [];

        return card_data.groups.filter((group) => {
            const nameMatch =
                searchTerm === "" ||
                (group.evaluatee &&
                    `${group.evaluatee.fname} ${group.evaluatee.lname}`
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()));

            const statusMatch =
                filterStatus === "all" ||
                (filterStatus === "complete" && group.stats.is_complete) ||
                (filterStatus === "incomplete" && !group.stats.is_complete);

            const gradeMatch =
                filterGrade === "all" ||
                (filterGrade === "5-8" && group.grade >= 5 && group.grade <= 8) ||
                (filterGrade === "9-12" && group.grade >= 9 && group.grade <= 12);

            return nameMatch && statusMatch && gradeMatch;
        });
    }, [card_data, searchTerm, filterStatus, filterGrade]);

    // Pagination for card view
    const paginatedCardData = useMemo(() => {
        const startIndex = (cardPage - 1) * cardPerPage;
        const endIndex = startIndex + cardPerPage;
        const paginatedData = filteredCardData.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            currentPage: cardPage,
            totalPages: Math.ceil(filteredCardData.length / cardPerPage),
            totalItems: filteredCardData.length,
            hasNextPage: endIndex < filteredCardData.length,
            hasPrevPage: cardPage > 1,
        };
    }, [filteredCardData, cardPage, cardPerPage]);

    const handleDelete = (id) => {
        if (confirm("คุณต้องการลบรายการนี้หรือไม่?")) {
            router.delete(route("assignments.destroy", { assignment: id }));
        }
    };

    const getAngleColor = (angle) => {
        const angleInThai = translateAngleToThai(angle);
        const colors = {
            บน: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200",
            ล่าง: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200",
            ซ้าย: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200",
            ขวา: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200",
        };
        return (
            colors[angleInThai] ||
            "bg-gray-100 text-gray-800"
        );
    };

    const getAngleIcon = (angle) => {
        const angleInThai = translateAngleToThai(angle);
        const icons = { บน: "⬆️", ล่าง: "⬇️", ซ้าย: "⬅️", ขวา: "➡️" };
        return icons[angleInThai] || "❓";
    };

    // 1. GlobalSummaryBar ใช้ globalStats
    const GlobalSummaryBar = () => (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center rounded-xl py-6 bg-blue-50 dark:bg-blue-900/20">
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {globalStats.total}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ผู้ถูกประเมิน (ทั้งหมด)
                </p>
            </div>
            <div className="text-center rounded-xl py-6 bg-green-50 dark:bg-green-900/20">
                <h2 className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {globalStats.complete}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ประเมินครบถ้วน
                </p>
            </div>
            <div className="text-center rounded-xl py-6 bg-amber-50 dark:bg-amber-900/20">
                <h2 className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {globalStats.incomplete}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ยังไม่ครบถ้วน
                </p>
            </div>
            <div className="text-center rounded-xl py-6 bg-violet-50 dark:bg-violet-900/20">
                <h2 className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                    {globalStats.completionRateAll}%
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    อัตราความครบถ้วน (ทั้งหมด)
                </p>
            </div>
        </div>
    );

    // 🎯 Dashboard Overview
    const renderOverview = () => (
        <div className="space-y-8">
            {/* Hero KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="ผู้ถูกประเมินทั้งหมด"
                    value={analytics?.kpis?.total_evaluatees || 0}
                    subtitle="คนที่ต้องได้รับการประเมิน"
                    icon={Users}
                    color="from-blue-500 to-blue-600"
                    growth={analytics?.kpis?.growth_rates?.evaluatees}
                    trend={
                        analytics?.kpis?.growth_rates?.evaluatees >= 0
                            ? "up"
                            : "down"
                    }
                    badge={
                        analytics?.kpis?.growth_rates?.evaluatees > 20
                            ? "เติบโตสูง"
                            : undefined
                    }
                />
                <MetricCard
                    title="ความสัมพันธ์ทั้งหมด"
                    value={analytics?.kpis?.total_relationships || 0}
                    subtitle="การเชื่อมโยงการประเมิน"
                    icon={Activity}
                    color="from-green-500 to-green-600"
                    growth={analytics?.kpis?.growth_rates?.relationships}
                    trend={
                        analytics?.kpis?.growth_rates?.relationships >= 0
                            ? "up"
                            : "down"
                    }
                />
                <MetricCard
                    title="ผู้ประเมินทั้งหมด"
                    value={analytics?.kpis?.total_evaluators || 0}
                    subtitle="คนที่ทำการประเมิน"
                    icon={Award}
                    color="from-purple-500 to-purple-600"
                    growth={analytics?.kpis?.growth_rates?.evaluators}
                    trend={
                        analytics?.kpis?.growth_rates?.evaluators >= 0
                            ? "up"
                            : "down"
                    }
                />
                <MetricCard
                    title="ประสิทธิภาพระบบ"
                    value={`${
                        analytics?.performance?.system_health?.health_score || 0
                    }%`}
                    subtitle="คะแนนรวมของระบบ"
                    icon={Gauge}
                    color="from-emerald-500 to-emerald-600"
                    badge={
                        analytics?.performance?.system_health?.health_score >=
                        85
                            ? "ยอดเยี่ยม"
                            : undefined
                    }
                />
            </div>

            {/* Insights & Alerts */}
            {analytics?.insights && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Insights */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                                💡 ข้อมูลเชิงลึก
                            </h3>
                            <div className="space-y-4">
                                {analytics.insights.insights?.map(
                                    (insight, index) => (
                                        <InsightCard
                                            key={index}
                                            insight={insight}
                                        />
                                    )
                                )}
                                {analytics.insights.alerts?.map(
                                    (alert, index) => (
                                        <InsightCard
                                            key={`alert-${index}`}
                                            insight={alert}
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-6 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-green-600" />
                            🏥 สุขภาพระบบ
                        </h3>
                        <div className="flex flex-col items-center">
                            <ProgressRing
                                percentage={
                                    analytics?.performance?.system_health
                                        ?.health_score || 0
                                }
                                color="#10B981"
                                label="คะแนนรวม"
                            />
                            <div className="mt-4 w-full space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        ความครบถ้วน
                                    </span>
                                    <span className="font-medium">
                                        {analytics?.completion?.summary
                                            ?.completion_rate || 0}
                                        %
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        การใช้งาน
                                    </span>
                                    <span className="font-medium">
                                        {analytics?.kpis?.efficiency_metrics
                                            ?.system_utilization || 0}
                                        %
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        การเติบโต
                                    </span>
                                    <span className="font-medium">
                                        {analytics?.kpis?.growth_rates
                                            ?.relationships || 0}
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Angle Distribution */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                        📊 การกระจายตามองศา
                    </h3>
                    <AngleChart
                        data={analytics?.visual_data?.angle_distribution || {}}
                    />
                </div>

                {/* Timeline Activity */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                        📅 กิจกรรมล่าสุด
                    </h3>
                    <TimelineChart
                        data={analytics?.timeline?.daily_activity || []}
                    />
                </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Evaluators */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                        🏆 ผู้ประเมินยอดเยี่ยม
                    </h3>
                    <div className="space-y-3">
                        {analytics?.people?.top_evaluators
                            ?.slice(0, 8)
                            .map((evaluator, index) => (
                                <TopPerformerCard
                                    key={index}
                                    performer={evaluator}
                                    rank={index + 1}
                                    type="evaluator"
                                />
                            ))}
                    </div>
                </div>

                {/* Most Evaluated */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-green-600" />
                        🎯 ผู้ถูกประเมินมากที่สุด
                    </h3>
                    <div className="space-y-3">
                        {analytics?.people?.most_evaluated
                            ?.slice(0, 8)
                            .map((evaluatee, index) => (
                                <TopPerformerCard
                                    key={index}
                                    performer={evaluatee}
                                    rank={index + 1}
                                    type="evaluatee"
                                />
                            ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">
                        {analytics?.kpis?.efficiency_metrics
                            ?.avg_evaluators_per_evaluatee || 0}
                    </div>
                    <div className="text-sm opacity-90">
                        ผู้ประเมินเฉลี่ยต่อคน
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">
                        {analytics?.completion?.summary?.complete_count || 0}
                    </div>
                    <div className="text-sm opacity-90">ประเมินครบถ้วน</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">
                        {analytics?.kpis?.unique_angles || 0}
                    </div>
                    <div className="text-sm opacity-90">องศาที่ใช้งาน</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white text-center">
                    <div className="text-2xl font-bold">
                        {analytics?.timeline?.insights?.total_active_days || 0}
                    </div>
                    <div className="text-sm opacity-90">วันที่มีกิจกรรม</div>
                </div>
            </div>
        </div>
    );

    // 📊 Enhanced Card View (แทน Analysis View)
    const renderCardView = () => (
        <div className="space-y-6">
            {/* Card View Header with Statistics */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <GlobalSummaryBar />

                {/* แสดงสถิติเปรียบเทียบ */}
                {(searchTerm ||
                    filterStatus !== "all" ||
                    filterGrade !== "all") && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center text-blue-700 dark:text-blue-300">
                            <Info className="w-5 h-5 mr-2" />
                            <span className="font-medium">
                                ข้อมูลที่แสดงถูกกรองตามเงื่อนไข:
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 space-y-1">
                            {searchTerm && <div>• ค้นหา: "{searchTerm}"</div>}
                            {filterStatus !== "all" && (
                                <div>
                                    • สถานะ:{" "}
                                    {filterStatus === "complete"
                                        ? "ครบถ้วน"
                                        : "ยังไม่ครบ"}
                                </div>
                            )}
                            {filterGrade !== "all" && (
                                <div>• เกรด: {filterGrade}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {paginatedCardData.totalPages > 1 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                แสดง {(cardPage - 1) * cardPerPage + 1}{" "}
                                -{" "}
                                {Math.min(
                                    cardPage * cardPerPage,
                                    filteredCardData.length
                                )}
                                จากทั้งหมด {filteredCardData.length} คน
                            </span>
                            <select
                                value={cardPerPage}
                                onChange={(e) => {
                                    setCardPerPage(Number(e.target.value));
                                    setCardPage(1);
                                }}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white"
                            >
                                <option value={4}>4 รายการ</option>
                                <option value={8}>8 รายการ</option>
                                <option value={12}>12 รายการ</option>
                                <option value={20}>20 รายการ</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCardPage(1)}
                                disabled={!paginatedCardData.hasPrevPage}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                แรก
                            </button>
                            <button
                                onClick={() =>
                                    setCardPage(cardPage - 1)
                                }
                                disabled={!paginatedCardData.hasPrevPage}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                ก่อนหน้า
                            </button>

                            <span className="px-4 py-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg">
                                หน้า {cardPage} จาก{" "}
                                {paginatedCardData.totalPages}
                            </span>

                            <button
                                onClick={() =>
                                    setCardPage(cardPage + 1)
                                }
                                disabled={!paginatedCardData.hasNextPage}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                ถัดไป
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                            <button
                                onClick={() =>
                                    setCardPage(
                                        paginatedCardData.totalPages
                                    )
                                }
                                disabled={!paginatedCardData.hasNextPage}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                                สุดท้าย
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedCardData.data.map((group, index) => {
                    const isComplete = group.stats.is_complete;
                    const completionRate = group.stats.completion_rate;

                    return (
                        <div
                            key={`${group.evaluatee?.id || index}-${index}`}
                            className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                        >
                            {/* Enhanced Header */}
                            <div
                                className={`px-6 py-4 ${
                                    isComplete
                                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                        : "bg-gradient-to-r from-orange-500 to-red-600"
                                } text-white relative overflow-hidden`}
                            >
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transform rotate-12 scale-150"></div>
                                </div>

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className={`p-3 rounded-full ${
                                                isComplete
                                                    ? "bg-green-600"
                                                    : "bg-red-600"
                                            } shadow-lg backdrop-blur-sm`}
                                        >
                                            {isComplete ? (
                                                <CheckCircle className="w-6 h-6" />
                                            ) : (
                                                <AlertTriangle className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center">
                                                🎯{" "}
                                                {group.evaluatee
                                                    ? `${group.evaluatee.fname} ${group.evaluatee.lname}`
                                                    : "ไม่พบข้อมูล"}
                                            </h3>
                                            <div className="flex items-center space-x-4 text-sm opacity-90 mt-1">
                                                <span className="flex items-center">
                                                    <Star className="w-4 h-4 mr-1" />
                                                    เกรด C{group.grade}
                                                </span>
                                                <span className="flex items-center">
                                                    <Users className="w-4 h-4 mr-1" />
                                                    {group.stats.total_evaluators} ผู้ประเมิน
                                                </span>
                                                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                                                    #{(cardPage - 1) * cardPerPage + index + 1}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Progress Circle */}
                                    <div className="text-center">
                                        <div className="relative inline-flex items-center justify-center w-16 h-16">
                                            <svg className="w-16 h-16 transform -rotate-90">
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    className="text-white/30"
                                                />
                                                <circle
                                                    cx="32"
                                                    cy="32"
                                                    r="28"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="transparent"
                                                    strokeDasharray={`${2 * Math.PI * 28}`}
                                                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionRate / 100)}`}
                                                    strokeLinecap="round"
                                                    className="text-white transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-lg font-bold">
                                                    {Math.round(completionRate)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-xs mt-1">
                                            {group.stats.completed_angles}/{group.stats.required_angles_count} องศา
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Content */}
                            <div className="p-6">
                                {/* Status Summary */}
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                            <Gauge className="w-4 h-4 mr-2" />
                                            สรุปสถานะการประเมิน
                                        </h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            isComplete 
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        }`}>
                                            {isComplete ? "🎉 ครบถ้วน" : "⚠️ ไม่ครบ"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                {group.stats.completed_angles}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400">องศาที่มี</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                                                {group.stats.required_angles_count}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400">องศาที่ต้องการ</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                {group.stats.total_evaluators}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400">ผู้ประเมินรวม</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Angle Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {group.required_angles.map((angle) => {
                                        const angleAssignments = group.assignments[angle] || [];
                                        const hasEvaluators = angleAssignments.length > 0;
                                        const angleInThai = translateAngleToThai(angle);

                                        return (
                                            <div
                                                key={angle}
                                                className={`border-2 border-dashed rounded-lg p-4 transition-all duration-300 ${
                                                    hasEvaluators
                                                        ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600 shadow-sm"
                                                        : "border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getAngleColor(
                                                            angle
                                                        )}`}
                                                    >
                                                        {getAngleIcon(angle)} องศา{angleInThai}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                        <Users className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                            {angleAssignments.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {hasEvaluators ? (
                                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                                        {angleAssignments.map((assignment, idx) => (
                                                            <div
                                                                key={assignment.id}
                                                                className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded border group hover:shadow-sm transition-all"
                                                            >
                                                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                        {assignment.evaluator?.fname?.charAt(0) || "?"}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                                            {assignment.evaluator
                                                                                ? `${assignment.evaluator.fname} ${assignment.evaluator.lname}`
                                                                                : "ไม่พบข้อมูล"}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            เกรด C{assignment.evaluator?.grade || "-"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDelete(assignment.id)}
                                                                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100"
                                                                    title="ลบความสัมพันธ์"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                                                        <div className="text-4xl mb-2 opacity-50">👤</div>
                                                        <div className="text-sm font-medium">ยังไม่มีผู้ประเมิน</div>
                                                        <div className="text-xs mt-1">คลิกเพื่อเพิ่มผู้ประเมิน</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Enhanced Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-3 text-sm">
                                            <span className="flex items-center text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                ครบ: {group.stats.completed_angles}/{group.stats.required_angles_count}
                                            </span>
                                            <span className="flex items-center text-blue-600 dark:text-blue-400">
                                                <Users className="w-4 h-4 mr-1" />
                                                รวม: {group.stats.total_evaluators} คน
                                            </span>
                                            {!isComplete && (
                                                <span className="flex items-center text-red-600 dark:text-red-400">
                                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                                    ขาด: {group.stats.required_angles_count - group.stats.completed_angles} องศา
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                completionRate >= 100 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                completionRate >= 75 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                                completionRate >= 50 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            }`}>
                                                {completionRate >= 100 ? "🎉 สมบูรณ์" :
                                                completionRate >= 75 ? "🔥 ใกล้เสร็จ" :
                                                completionRate >= 50 ? "⚡ กำลังดำเนิน" :
                                                "🚀 เริ่มต้น"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Pagination */}
            {paginatedCardData.totalPages > 1 && (
                <div className="flex justify-center">
                    <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                        {/* Show page numbers */}
                        {Array.from(
                            {
                                length: Math.min(7, paginatedCardData.totalPages),
                            },
                            (_, i) => {
                                let pageNum;
                                if (paginatedCardData.totalPages <= 7) {
                                    pageNum = i + 1;
                                } else if (cardPage <= 4) {
                                    pageNum = i + 1;
                                } else if (cardPage >= paginatedCardData.totalPages - 3) {
                                    pageNum = paginatedCardData.totalPages - 6 + i;
                                } else {
                                    pageNum = cardPage - 3 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCardPage(pageNum)}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                            cardPage === pageNum
                                                ? "bg-indigo-600 text-white shadow-lg"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }
                        )}

                        {paginatedCardData.totalPages > 7 && cardPage < paginatedCardData.totalPages - 3 && (
                            <>
                                <span className="px-2 text-gray-500">
                                    <MoreHorizontal className="w-4 h-4" />
                                </span>
                                <button
                                    onClick={() => setCardPage(paginatedCardData.totalPages)}
                                    className="px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    {paginatedCardData.totalPages}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // 📋 Table View
    const renderTable = () => (
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white dark:bg-zinc-900">
            <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-700">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            👨‍🏫 ผู้ประเมิน
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            🎯 ผู้ถูกประเมิน
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            📊 เกรด
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            🧭 องศา
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            📅 ปีงบ
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            ⚙️ การจัดการ
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {assignments.data.map((assignment, index) => (
                        <tr
                            key={assignment.id}
                            className={`hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors ${
                                index % 2 === 0
                                    ? "bg-white dark:bg-zinc-900"
                                    : "bg-gray-50/50 dark:bg-zinc-800/50"
                            }`}
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                            {assignment.evaluator?.fname?.charAt(0) || "?"}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {assignment.evaluator
                                                ? `${assignment.evaluator.fname} ${assignment.evaluator.lname}`
                                                : "ไม่พบข้อมูล"}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            เกรด C{assignment.evaluator?.grade || "-"}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-medium">
                                            {assignment.evaluatee?.fname?.charAt(0) || "?"}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {assignment.evaluatee
                                                ? `${assignment.evaluatee.fname} ${assignment.evaluatee.lname}`
                                                : "ไม่พบข้อมูล"}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                    C{assignment.evaluatee?.grade || "-"}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAngleColor(
                                        assignment.angle
                                    )}`}
                                >
                                    {getAngleIcon(assignment.angle)}{" "}
                                    {translateAngleToThai(assignment.angle) || "-"}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                                {parseInt(assignment.fiscal_year) + 543}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                    onClick={() => handleDelete(assignment.id)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors duration-200"
                                    title="ลบความสัมพันธ์"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <MainLayout
            title="จัดการผู้ประเมิน-ผู้ถูกประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        {
                            label: "แดชบอร์ดผู้ดูแลระบบ",
                            href: route("admindashboard"),
                        },
                        {
                            label: "จัดการผู้ประเมิน-ผู้ถูกประเมิน",
                            active: true,
                        },
                    ]}
                />
            }
        >
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-zinc-900 dark:to-zinc-800">
                <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Enhanced Header */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                    🚀 Ultimate Analytics Dashboard
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 text-lg">
                                    ระบบวิเคราะห์ครบครันสำหรับการจัดการประเมินผลแบบ 360 องศา
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                {/* Year Selector */}
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <Select
                                        className="w-60"
                                        options={yearOptions}
                                        value={selectedYear}
                                        onChange={(v) => v && setSelectedYear(v)}
                                        classNamePrefix="react-select"
                                        isSearchable={false}
                                    />
                                </div>

                                {/* View Toggles */}
                                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setDashboardView("overview")}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            dashboardView === "overview"
                                                ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                    >
                                        <BarChart3 className="w-4 h-4 mr-2 inline" />
                                        ภาพรวม
                                    </button>
                                    <button
                                        onClick={() => setDashboardView("cards")}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            dashboardView === "cards"
                                                ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                    >
                                        <Target className="w-4 h-4 mr-2 inline" />
                                        การ์ด
                                    </button>
                                    <button
                                        onClick={() => setDashboardView("table")}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            dashboardView === "table"
                                                ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-sm"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                    >
                                        <Database className="w-4 h-4 mr-2 inline" />
                                        ตาราง
                                    </button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <button className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        รีเฟรช
                                    </button>
                                    <a
                                        href={route("assignments.create")}
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        เพิ่มความสัมพันธ์
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filters for Card View */}
                    {dashboardView === "cards" && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        🔍 ค้นหาผู้ถูกประเมิน
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="ชื่อ-นามสกุลผู้ถูกประเมิน"
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:text-white transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="lg:w-48">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        📊 สถานะ
                                    </label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) =>
                                            setFilterStatus(e.target.value)
                                        }
                                        className="w-full py-3 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:text-white transition-colors"
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        <option value="complete">ครบถ้วน</option>
                                        <option value="incomplete">ไม่ครบถ้วน</option>
                                    </select>
                                </div>
                                <div className="lg:w-48">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        🎯 เกรด
                                    </label>
                                    <select
                                        value={filterGrade}
                                        onChange={(e) =>
                                            setFilterGrade(e.target.value)
                                        }
                                        className="w-full py-3 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-800 dark:text-white transition-colors"
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        <option value="5-8">C5-C8</option>
                                        <option value="9-12">C9-C12</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    {dashboardView === "overview" && renderOverview()}
                    {dashboardView === "cards" && renderCardView()}
                    {dashboardView === "table" && renderTable()}

                    {/* Pagination for Table View */}
                    {dashboardView === "table" &&
                        assignments?.links &&
                        assignments.links.length > 3 && (
                            <div className="flex justify-center mt-8">
                                <div className="flex gap-2 flex-wrap">
                                    {assignments.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url &&
                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                    data: {
                                                        fiscal_year: selectedYear.value,
                                                    },
                                                })
                                            }
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                                                link.active
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-zinc-800 dark:text-white dark:border-gray-600 dark:hover:bg-zinc-700"
                                            } ${
                                                !link.url
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:shadow-md"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* Empty State */}
                    {dashboardView === "cards" &&
                        filteredCardData.length === 0 && (
                            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl shadow-lg">
                                <div className="text-8xl mb-6">🔍</div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    ไม่พบข้อมูลที่ค้นหา
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                    ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มความสัมพันธ์ใหม่เพื่อเริ่มต้นการวิเคราะห์
                                </p>
                                <a
                                    href={route("assignments.create")}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <PlusCircle className="w-5 h-5 mr-2" />
                                    เพิ่มความสัมพันธ์แรก
                                </a>
                            </div>
                        )}

                    {/* Enhanced Statistics Summary */}
                    {(dashboardView === "cards" || dashboardView === "table") && (
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <FlameKindling className="w-6 h-6 mr-2" />
                                        <span className="text-sm font-medium opacity-90">ความสัมพันธ์รวม</span>
                                    </div>
                                    <div className="text-3xl font-bold">
                                        {card_data?.summary?.total_relationships || 0}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Users className="w-6 h-6 mr-2" />
                                        <span className="text-sm font-medium opacity-90">ผู้ถูกประเมิน</span>
                                    </div>
                                    <div className="text-3xl font-bold">
                                        {card_data?.summary?.total_evaluatees || 0}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <CheckCircle className="w-6 h-6 mr-2" />
                                        <span className="text-sm font-medium opacity-90">ครบถ้วน</span>
                                    </div>
                                    <div className="text-3xl font-bold">
                                        {card_data?.summary?.complete_count || 0}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-2">
                                        <Timer className="w-6 h-6 mr-2" />
                                        <span className="text-sm font-medium opacity-90">ความสำเร็จ</span>
                                    </div>
                                    <div className="text-3xl font-bold">
                                        {globalStats.completionRateAll}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}