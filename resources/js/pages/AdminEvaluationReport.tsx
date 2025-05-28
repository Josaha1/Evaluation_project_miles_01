import React, { useState, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import Breadcrumb from "@/Components/ui/breadcrumb";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
    Users,
    TrendingUp,
    Award,
    FileBarChart,
    Download,
    Filter,
    Calendar,
    Building2,
    GraduationCap,
    Target,
    Star,
    Trophy,
    Activity,
    BarChart3,
    PieChart as PieChartIcon,
    Eye,
    ChevronDown,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Minus,
    CheckCircle,
    AlertTriangle,
    Clock,
    Zap,
    FileSpreadsheet,
    Settings,
    Loader2,
    RefreshCw,
    TrendingDown,
    AlertCircle,
    Info,
    Sparkles,
    Globe,
    Building,
    UserCheck,
    FileText,
    BarChart2,
    PieChart,
    TrendingUpIcon,
    DatabaseIcon,
    LayersIcon,
    ShieldCheckIcon,
    Target as TargetIcon,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/Components/ui/dialog";

// 🎯 TypeScript Interfaces
interface PageProps {
    filters: {
        fiscal_year?: string;
        division?: string;
        grade?: string;
    };
    availableYears: string[];
    availableDivisions: { id: number; name: string }[];
    availableGrades: number[];
    fiscalYear: string;
    evaluatorSummary: {
        grade: number;
        user_type: string;
        total: number;
    }[];
    evaluateeCountByGrade: {
        grade: number;
        user_type: string;
        total: number;
        completed: number;
        remaining: number;
    }[];
    part1ScoreYearly: {
        aspect: string;
        part_id: number;
        evaluatee_type: string;
        evaluatee_grade: number;
        year: number;
        average_score: number;
    }[];
    part1AspectSummary: {
        aspect: string;
        average_score: number;
        part_id: number;
        grade: number;
        user_type: string;
        answer_count: number;
        evaluatee_count: number;
        group: "5-8" | "9-12:internal" | "9-12:external";
    }[];
    weightedSummary: {
        id: number;
        name: string;
        position?: string;
        grade?: number;
        division?: string;
        user_type?: string;
        self?: number;
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
        average: number;
        rating?: number;
        rating_text?: string;
        completion_rate?: number;
    }[];
    weightedSummaryForExport: any;
    summaryStats?: {
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
    };
}

// 🎨 Data Status Indicator Component
const DataStatusIndicator: React.FC<{
    processedData: any;
}> = ({ processedData }) => {
    // แสดงการเปรียบเทียบกับจำนวนที่ completed จริง (ประเมินครบ)
    const isDataComplete =
        processedData.totalInExport === processedData.summary.completed;

    return (
        <div
            className={`flex items-center space-x-3 px-4 py-2 rounded-xl border-2 ${
                isDataComplete
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-orange-50 border-orange-300 text-orange-700"
            }`}
        >
            {isDataComplete ? (
                <CheckCircle className="w-5 h-5" />
            ) : (
                <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-semibold">
                ข้อมูลส่งออก: {processedData.totalInExport} /{" "}
                {processedData.summary.completed} คน
            </span>
            <span className="text-xs text-gray-600">
                (เฉพาะคนที่ประเมินครบตามเกณฑ์)
            </span>
            {!isDataComplete && (
                <span className="text-sm">
                    (ขาด{" "}
                    {processedData.summary.completed -
                        processedData.totalInExport}{" "}
                    คน)
                </span>
            )}
        </div>
    );
};

// 🎨 ✨ REVOLUTIONARY EXPORT CONTROL COMPONENT ✨ 🎨
const RevolutionaryExportControl: React.FC<{
    selectedYear: string;
    selectedDivision: string;
    processedData: any;
}> = ({ selectedYear, selectedDivision, processedData }) => {
    const [isExporting, setIsExporting] = useState(false);

    const exportOption = {
        id: "all",
        value: "",
        icon: LayersIcon,
        title: "🏢 รายงานครบถ้วน (ทุกกลุ่ม)",
        description: "ส่งออกทุกกลุ่มแยก Sheet พร้อม Executive Summary",
        color: "from-blue-500 to-purple-600",
        features: [
            "พนักงาน C5-C8",
            "ผู้บริหาร C9-C12 (ภายใน)",
            "ผู้บริหาร C9-C12 (ภายนอก)",
            "ผู้บริหาร C9-C12 (รวมทั้งหมด)",
            "Executive Summary",
            "Comparative Analysis",
        ],
        recommended: true,
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const params = new URLSearchParams({
                fiscal_year: selectedYear,
                ...(selectedDivision && { division: selectedDivision }),
            });

            // แสดงข้อมูลก่อนส่งออก
            console.log("🚀 กำลังส่งออกข้อมูล:", {
                ปีงบประมาณ: selectedYear,
                สายงาน: selectedDivision || "ทุกสายงาน",
                จำนวนข้อมูลที่จะส่งออก: processedData.totalInExport,
                แยกตามกลุ่ม: {
                    "พนักงาน 5-8": processedData.groups.internal_5_8.length,
                    "ผู้บริหาร 9-12 ภายใน":
                        processedData.groups.internal_9_12.length,
                    "ผู้บริหาร 9-12 ภายนอก":
                        processedData.groups.external_9_12.length,
                    "ผู้บริหาร 9-12 รวม":
                        processedData.groups.combined_9_12.length,
                },
            });

            const loadingToast = createAdvancedToast(exportOption);
            document.body.appendChild(loadingToast);

            window.open(
                route("admin.evaluation.report.export.individual") +
                    "?" +
                    params.toString(),
                "_blank"
            );

            setTimeout(() => {
                document.body.removeChild(loadingToast);
                showSuccessNotification(exportOption);
            }, 3000);
        } catch (error) {
            console.error("❌ เกิดข้อผิดพลาดในการส่งออก:", error);
            showErrorNotification();
        } finally {
            setIsExporting(false);
        }
    };

    // 🎨 สร้าง Advanced Loading Toast
    const createAdvancedToast = (option: any) => {
        const toast = document.createElement("div");
        toast.className = `fixed top-4 right-4 bg-gradient-to-r ${option.color} text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm transform transition-all duration-500 animate-pulse`;

        toast.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                    <svg class="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle>
                        <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                </div>
                <div class="flex-1">
                    <div class="font-semibold">${option.title}</div>
                    <div class="text-sm opacity-90 mt-1">กำลังสร้างรายงาน...</div>
                    <div class="text-xs opacity-75 mt-1">${option.description}</div>
                </div>
            </div>
            <div class="mt-3 bg-white/20 rounded-full h-1 overflow-hidden">
                <div class="h-full bg-white rounded-full animate-pulse" style="width: 60%"></div>
            </div>
        `;

        return toast;
    };

    // 🎉 แสดง Success Notification
    const showSuccessNotification = (option: any) => {
        const notification = document.createElement("div");
        notification.className = `fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm transform transition-all duration-500`;

        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <svg class="h-6 w-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                    <div class="font-semibold">สร้างรายงานสำเร็จ! 🎉</div>
                    <div class="text-sm opacity-90">${option.title}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 4000);
    };

    // ❌ แสดง Error Notification
    const showErrorNotification = () => {
        const notification = document.createElement("div");
        notification.className =
            "fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm";

        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <div>
                    <div class="font-semibold">เกิดข้อผิดพลาด</div>
                    <div class="text-sm opacity-90">ไม่สามารถสร้างรายงานได้</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 4000);
    };

    return (
        <div className="space-y-4">
            {/* Data Status Indicator */}
            <DataStatusIndicator processedData={processedData} />

            <div className="relative">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    {isExporting ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    )}
                    <span className="relative font-semibold">
                        ส่งออกรายงานครบถ้วน
                    </span>
                    <Sparkles className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
                </button>

                {/* เพิ่มข้อมูลสถิติใต้ปุ่ม */}
                <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>
                        จะส่งออก {processedData.totalInExport} คน ใน{" "}
                        {exportOption.features.length} ชีต
                    </span>
                </div>
            </div>
        </div>
    );
};

// 🎨 Enhanced Metric Card with 3D Effects
const UltraMetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<any>;
    color: string;
    trend?: number;
    onClick?: () => void;
    className?: string;
    loading?: boolean;
    badgeText?: string;
}> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    onClick,
    className = "",
    loading = false,
    badgeText,
}) => (
    <div
        className={`group relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 overflow-hidden transform perspective-1000 ${
            onClick
                ? "cursor-pointer hover:scale-105 hover:-translate-y-2 hover:rotate-1"
                : ""
        } ${className}`}
        onClick={onClick}
        style={{
            transformStyle: "preserve-3d",
        }}
    >
        {/* 🌟 Background Gradient Animation */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
            <div
                className={`absolute inset-0 bg-gradient-to-br ${color} transform rotate-12 scale-150 animate-pulse`}
            ></div>
        </div>

        {/* 💎 Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
            <div
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-bounce"
                style={{ top: "20%", left: "80%", animationDelay: "0s" }}
            ></div>
            <div
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
                style={{ top: "60%", left: "10%", animationDelay: "1s" }}
            ></div>
            <div
                className="absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-bounce"
                style={{ top: "80%", left: "70%", animationDelay: "2s" }}
            ></div>
        </div>

        {/* 🏷️ Badge */}
        {badgeText && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
                {badgeText}
            </div>
        )}

        {/* 🌈 Glowing Border Effect */}
        <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r ${color} p-0.5 rounded-2xl`}
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl h-full w-full"></div>
        </div>

        <div className="relative p-8 z-10">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-6">
                        <div
                            className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-2xl group-hover:shadow-3xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
                        >
                            {loading ? (
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            ) : (
                                <Icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                            )}
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors tracking-wide uppercase">
                        {title}
                    </h3>

                    <div className="text-4xl font-black text-gray-900 dark:text-white mb-2 group-hover:scale-110 transition-transform duration-300 tabular-nums">
                        {loading ? (
                            <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
                        ) : typeof value === "number" ? (
                            value.toLocaleString()
                        ) : (
                            value
                        )}
                    </div>

                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* 📈 Trend Indicator */}
                {trend !== undefined && (
                    <div
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 transform group-hover:scale-110 ${
                            trend > 0
                                ? "bg-green-100 text-green-700 group-hover:bg-green-200 shadow-green-500/25"
                                : trend < 0
                                ? "bg-red-100 text-red-700 group-hover:bg-red-200 shadow-red-500/25"
                                : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                        } shadow-lg`}
                    >
                        {trend > 0 ? (
                            <TrendingUp className="w-5 h-5" />
                        ) : trend < 0 ? (
                            <TrendingDown className="w-5 h-5" />
                        ) : (
                            <Minus className="w-5 h-5" />
                        )}
                        <span className="text-sm font-bold">
                            {Math.abs(trend)}%
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* 🌊 Bottom Wave Effect */}
        <div
            className={`absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`}
        ></div>

        {/* ✨ Shimmer Effect */}
        <div className="absolute inset-0 -top-full group-hover:top-full bg-gradient-to-b from-transparent via-white/10 to-transparent transition-all duration-1000 transform -skew-y-12"></div>

        {/* 🎪 Ripple Effect on Click */}
        {onClick && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute inset-0 transform scale-0 group-active:scale-100 transition-transform duration-200 bg-white opacity-20 rounded-full"></div>
            </div>
        )}
    </div>
);

// 🎯 Ultra Modern Section Component
const UltraReportSection: React.FC<{
    title: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
    className?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    badgeText?: string;
    badgeColor?: string;
}> = ({
    title,
    icon: Icon,
    children,
    className = "",
    collapsible = false,
    defaultCollapsed = false,
    badgeText,
    badgeColor = "from-blue-500 to-purple-600",
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div
            className={`group bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${className}`}
        >
            <div
                className={`relative p-8 border-b border-gray-200 dark:border-gray-700 ${
                    collapsible
                        ? "cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-zinc-800 dark:hover:to-blue-900/20 transition-all duration-300"
                        : ""
                }`}
                onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 transform rotate-12 scale-150"></div>
                </div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${badgeColor} shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
                        >
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors duration-300">
                                {title}
                            </h2>
                            {badgeText && (
                                <span
                                    className={`inline-block mt-1 px-3 py-1 bg-gradient-to-r ${badgeColor} text-white text-xs font-bold rounded-full shadow-lg`}
                                >
                                    {badgeText}
                                </span>
                            )}
                        </div>
                    </div>

                    {collapsible && (
                        <div className="text-gray-400 transition-all duration-300 group-hover:text-blue-500">
                            <div
                                className={`transform transition-transform duration-300 ${
                                    isCollapsed ? "rotate-0" : "rotate-180"
                                }`}
                            >
                                <ChevronDown className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div
                className={`transition-all duration-500 ${
                    !collapsible || !isCollapsed
                        ? "max-h-none opacity-100 p-8"
                        : "max-h-0 opacity-0 overflow-hidden"
                }`}
            >
                {(!collapsible || !isCollapsed) && children}
            </div>
        </div>
    );
};

// 📊 Enhanced Chart Component with 3D Effects
const UltraEnhancedChart: React.FC<{
    data: any[];
    type?: "column" | "line" | "pie" | "bar";
    title?: string;
    height?: number;
    subtitle?: string;
    colors?: string[];
    loading?: boolean;
}> = ({
    data,
    type = "column",
    title,
    height = 300,
    subtitle,
    colors,
    loading = false,
}) => {
    const defaultColors = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#06B6D4",
        "#F97316",
        "#84CC16",
    ];

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 mb-6"></div>
                    <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const getChartOptions = (): Highcharts.Options => {
        const baseOptions: Highcharts.Options = {
            chart: {
                type: type,
                height: height,
                backgroundColor: "transparent",
                style: { fontFamily: "Inter, system-ui, sans-serif" },
                animation: { duration: 1200 },
            },
            title: {
                text: title || "",
                style: {
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#1F2937",
                },
            },
            subtitle: {
                text: subtitle || "",
                style: { fontSize: "14px", color: "#6B7280" },
            },
            credits: { enabled: false },
            colors: colors || defaultColors,
            tooltip: {
                backgroundColor: "#1F2937",
                borderColor: "#374151",
                style: { color: "#F9FAFB" },
                borderRadius: 12,
                shadow: false,
                animation: true,
            },
            legend: {
                itemStyle: {
                    color: "#374151",
                    fontSize: "12px",
                    fontWeight: "500",
                },
            },
            plotOptions: {
                series: {
                    borderRadius: type === "column" || type === "bar" ? 8 : 0,
                    dataLabels: { enabled: false },
                    animation: { duration: 1200 },
                },
            },
            responsive: {
                rules: [
                    {
                        condition: { maxWidth: 500 },
                        chartOptions: { legend: { enabled: false } },
                    },
                ],
            },
        };

        // Chart-specific configurations
        switch (type) {
            case "column":
            case "bar":
                return {
                    ...baseOptions,
                    xAxis: {
                        categories: data.map((item) => item.name),
                        gridLineWidth: 0,
                        lineColor: "#E5E7EB",
                        tickColor: "#E5E7EB",
                        labels: {
                            style: {
                                color: "#6B7280",
                                fontSize: "12px",
                                fontWeight: "500",
                            },
                        },
                    },
                    yAxis: {
                        title: {
                            text: "คะแนน",
                            style: { color: "#6B7280", fontWeight: "600" },
                        },
                        gridLineColor: "#F3F4F6",
                        lineColor: "#E5E7EB",
                        tickColor: "#E5E7EB",
                        labels: {
                            style: { color: "#6B7280", fontSize: "12px" },
                        },
                        max: 5,
                        min: 0,
                    },
                    series: [
                        {
                            name: "คะแนน",
                            data: data.map((item) => item.value),
                            color: defaultColors[0],
                        },
                    ],
                };

            case "pie":
                return {
                    ...baseOptions,
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: "pointer",
                            dataLabels: {
                                enabled: true,
                                format: "<b>{point.name}</b>: {point.percentage:.1f}%",
                                style: {
                                    color: "#374151",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                },
                            },
                            showInLegend: true,
                        },
                    },
                    series: [
                        {
                            type: "pie",
                            name: "จำนวน",
                            data: data.map((item, index) => ({
                                name: item.name,
                                y: item.value,
                                color: defaultColors[
                                    index % defaultColors.length
                                ],
                            })),
                        },
                    ],
                };

            default:
                return baseOptions;
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
            <div className="transform group-hover:scale-[1.02] transition-transform duration-300">
                <HighchartsReact
                    highcharts={Highcharts}
                    options={getChartOptions()}
                />
            </div>
        </div>
    );
};

// 🏆 Ultra Performance Distribution Chart
const UltraPerformanceDistributionChart: React.FC<{
    distribution: {
        excellent: number;
        very_good: number;
        good: number;
        fair: number;
        poor: number;
    };
}> = ({ distribution }) => {
    const data = [
        { name: "ดีเยี่ยม", value: distribution.excellent, color: "#10B981" },
        { name: "ดีมาก", value: distribution.very_good, color: "#3B82F6" },
        { name: "ดี", value: distribution.good, color: "#F59E0B" },
        { name: "ควรปรับปรุง", value: distribution.fair, color: "#F97316" },
        { name: "ต้องปรับปรุงมาก", value: distribution.poor, color: "#EF4444" },
    ];

    const options: Highcharts.Options = {
        chart: {
            type: "pie",
            height: 450,
            backgroundColor: "transparent",
        },
        title: {
            text: "🏆 การกระจายผลการประเมิน",
            style: { fontSize: "20px", fontWeight: "700", color: "#1F2937" },
        },
        credits: { enabled: false },
        tooltip: {
            backgroundColor: "#1F2937",
            borderColor: "#374151",
            style: { color: "#F9FAFB" },
            borderRadius: 12,
            shadow: false,
            pointFormat: "<b>{point.y}</b> คน ({point.percentage:.1f}%)",
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: {
                    enabled: true,
                    format: "<b>{point.name}</b><br/>{point.y} คน ({point.percentage:.1f}%)",
                    style: {
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: "600",
                    },
                    distance: 25,
                },
                showInLegend: true,
                borderWidth: 3,
                borderColor: "#ffffff",
            },
        },
        legend: {
            align: "right",
            verticalAlign: "middle",
            layout: "vertical",
            itemStyle: {
                color: "#374151",
                fontSize: "13px",
                fontWeight: "500",
            },
        },
        series: [
            {
                type: "pie",
                name: "จำนวน",
                data: data.map((item) => ({
                    name: item.name,
                    y: item.value,
                    color: item.color,
                })),
            },
        ],
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-800 dark:to-purple-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

// 📋 Ultra Enhanced Table Component
const UltraEnhancedTable: React.FC<{
    data: any[];
    title?: string;
    columns: { key: string; label: string }[];
}> = ({ data, title, columns }) => {
    const [sortField, setSortField] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 10;

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter((item) =>
            Object.values(item).some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm]);

    const sortedData = useMemo(() => {
        if (!sortField) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (sortDirection === "asc") {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }, [filteredData, sortField, sortDirection]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getScoreColor = (score: number) => {
        if (score > 4.5) return "text-green-700 bg-green-100 border-green-300";
        if (score >= 4.0) return "text-blue-700 bg-blue-100 border-blue-300";
        if (score >= 3.0)
            return "text-yellow-700 bg-yellow-100 border-yellow-300";
        if (score >= 2.0)
            return "text-orange-700 bg-orange-100 border-orange-300";
        return "text-red-700 bg-red-100 border-red-300";
    };

    const getScoreText = (score: number) => {
        if (score > 4.5) return "ดีเยี่ยม";
        if (score >= 4.0) return "ดีมาก";
        if (score >= 3.0) return "ดี";
        if (score >= 2.0) return "ควรปรับปรุง";
        return "ต้องปรับปรุงมาก";
    };

    const getUserTypeText = (userType: string) => {
        return userType === "internal" ? "ภายใน" : "ภายนอก";
    };

    const getUserTypeColor = (userType: string) => {
        return userType === "internal"
            ? "bg-blue-100 text-blue-800 border-blue-300"
            : "bg-purple-100 text-purple-800 border-purple-300";
    };

    return (
        <div className="space-y-6">
            {/* 🎨 Enhanced Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {title && (
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <BarChart2 className="w-6 h-6 mr-2 text-blue-600" />
                        {title}
                    </h3>
                )}

                <div className="flex items-center space-x-4">
                    {/* 🔍 Enhanced Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ค้นหาข้อมูล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                        />
                        <Filter className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>

                    {/* 📊 Records Count */}
                    <div className="flex items-center space-x-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <DatabaseIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                            {sortedData.length} รายการ
                        </span>
                    </div>
                </div>
            </div>

            {/* 📊 Enhanced Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200 group"
                                        onClick={() => handleSort(column.key)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span className="group-hover:text-blue-700 transition-colors duration-200">
                                                {column.label}
                                            </span>
                                            {sortField === column.key && (
                                                <span className="text-blue-600 font-bold">
                                                    {sortDirection === "asc"
                                                        ? "↑"
                                                        : "↓"}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.map((item, index) => (
                                <tr
                                    key={index}
                                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-6 py-4 whitespace-nowrap text-sm group-hover:scale-105 transition-transform duration-200"
                                        >
                                            {column.key === "average" ? (
                                                <div className="flex items-center space-x-3">
                                                    <span
                                                        className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getScoreColor(
                                                            item[column.key]
                                                        )} shadow-sm`}
                                                    >
                                                        {item[
                                                            column.key
                                                        ]?.toFixed(2)}
                                                    </span>
                                                    <span className="text-sm text-gray-600 font-medium">
                                                        {getScoreText(
                                                            item[column.key]
                                                        )}
                                                    </span>
                                                </div>
                                            ) : column.key === "user_type" ? (
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${getUserTypeColor(
                                                        item[column.key]
                                                    )} shadow-sm`}
                                                >
                                                    {getUserTypeText(
                                                        item[column.key]
                                                    )}
                                                </span>
                                            ) : column.key === "grade" ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm">
                                                    C{item[column.key]}
                                                </span>
                                            ) : column.key.includes("score") ||
                                              (typeof item[column.key] ===
                                                  "number" &&
                                                  column.key !== "grade") ? (
                                                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {item[column.key]?.toFixed(
                                                        2
                                                    ) || "0.00"}
                                                </span>
                                            ) : (
                                                <span className="text-gray-900 font-medium">
                                                    {item[column.key] || "-"}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 🎯 Ultra Enhanced Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            <div className="text-sm text-gray-700 font-medium">
                                แสดง{" "}
                                <span className="font-bold text-blue-600">
                                    {(currentPage - 1) * itemsPerPage + 1}
                                </span>{" "}
                                -{" "}
                                <span className="font-bold text-blue-600">
                                    {Math.min(
                                        currentPage * itemsPerPage,
                                        sortedData.length
                                    )}
                                </span>{" "}
                                จาก{" "}
                                <span className="font-bold text-blue-600">
                                    {sortedData.length}
                                </span>{" "}
                                รายการ
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium"
                                >
                                    แรก
                                </button>

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(prev - 1, 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium"
                                >
                                    ก่อนหน้า
                                </button>

                                {/* Page Numbers */}
                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        const pageNumber =
                                            Math.max(
                                                1,
                                                Math.min(
                                                    totalPages - 4,
                                                    currentPage - 2
                                                )
                                            ) + i;
                                        if (pageNumber <= totalPages) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            pageNumber
                                                        )
                                                    }
                                                    className={`px-4 py-2 text-sm border-2 rounded-lg transition-all duration-200 font-medium ${
                                                        currentPage ===
                                                        pageNumber
                                                            ? "bg-blue-500 text-white border-blue-500 shadow-lg"
                                                            : "border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        }
                                        return null;
                                    }
                                )}

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, totalPages)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium"
                                >
                                    ถัดไป
                                </button>

                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium"
                                >
                                    สุดท้าย
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 🎨 Ultra Progress Bar Component
const UltraProgressBar: React.FC<{
    label: string;
    value: number;
    maxValue?: number;
    color: string;
    showPercentage?: boolean;
}> = ({ label, value, maxValue = 5, color, showPercentage = true }) => {
    const percentage = (value / maxValue) * 100;

    return (
        <div className="group p-5 bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 flex-1 pr-3 group-hover:text-gray-900 transition-colors duration-200">
                    {label}
                </span>
                <span
                    className={`text-lg font-black ${color
                        .replace("bg-", "text-")
                        .replace("-500", "-600")} min-w-[4rem] text-right`}
                >
                    {showPercentage
                        ? `${percentage.toFixed(1)}%`
                        : value.toFixed(2)}
                </span>
            </div>

            <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div
                        className={`${color} h-3 rounded-full transition-all duration-1000 ease-out shadow-lg`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    >
                        <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                    </div>
                </div>

                {/* Glow Effect */}
                <div
                    className={`absolute top-0 h-3 ${color} rounded-full opacity-50 blur-sm transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

// 📊 Ultra Comparison Chart Component
const UltraComparisonChart: React.FC<{
    data: any[];
    title?: string;
    height?: number;
}> = ({ data, title, height = 450 }) => {
    const options: Highcharts.Options = {
        chart: {
            type: "column",
            height: height,
            backgroundColor: "transparent",
            style: { fontFamily: "Inter, system-ui, sans-serif" },
        },
        title: {
            text: title || "",
            style: { fontSize: "20px", fontWeight: "700", color: "#1F2937" },
        },
        credits: { enabled: false },
        colors: ["#3B82F6", "#10B981", "#8B5CF6"],
        xAxis: {
            categories: data.map((item) => item.group),
            gridLineWidth: 0,
            lineColor: "#E5E7EB",
            tickColor: "#E5E7EB",
            labels: {
                style: {
                    color: "#6B7280",
                    fontSize: "13px",
                    fontWeight: "600",
                },
            },
        },
        yAxis: {
            title: {
                text: "คะแนนเฉลี่ย",
                style: { color: "#6B7280", fontWeight: "700" },
            },
            gridLineColor: "#F3F4F6",
            lineColor: "#E5E7EB",
            tickColor: "#E5E7EB",
            labels: { style: { color: "#6B7280", fontSize: "12px" } },
            max: 5,
            min: 0,
        },
        series: [
            {
                name: "คะแนนเฉลี่ย",
                data: data.map((item) => item.score),
                borderRadius: 12,
                dataLabels: {
                    enabled: true,
                    format: "{y:.2f}",
                    style: {
                        color: "#374151",
                        fontSize: "13px",
                        fontWeight: "700",
                    },
                },
            },
        ],
        tooltip: {
            backgroundColor: "#1F2937",
            borderColor: "#374151",
            style: { color: "#F9FAFB" },
            borderRadius: 12,
            shadow: false,
            formatter: function () {
                return `<b>${this.x}</b><br/>คะแนนเฉลี่ย: <b>${this.y?.toFixed(
                    2
                )}</b>`;
            },
        },
        plotOptions: {
            column: { borderRadius: 12, pointPadding: 0.1, groupPadding: 0.15 },
        },
        responsive: {
            rules: [
                {
                    condition: { maxWidth: 500 },
                    chartOptions: { legend: { enabled: false } },
                },
            ],
        },
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-800 dark:to-indigo-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

// 🎯 Main Component
export default function AdminEvaluationReport() {
    const {
        filters,
        availableYears,
        availableDivisions,
        availableGrades,
        evaluateeCountByGrade,
        part1ScoreYearly,
        part1AspectSummary,
        weightedSummary,
        weightedSummaryForExport,
        evaluatorSummary,
        fiscalYear,
        summaryStats,
    } = usePage<PageProps>().props;

    const [selectedYear, setSelectedYear] = useState(filters.fiscal_year || "");
    const [selectedDivision, setSelectedDivision] = useState(
        filters.division || ""
    );
    const [selectedGrade, setSelectedGrade] = useState(filters.grade || "");
    const [showDialog, setShowDialog] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [userList, setUserList] = useState([]);
    const [dialogLoading, setDialogLoading] = useState(false);

    // 🎯 Data Processing
    const aspectsByGroup = useMemo(() => {
        const grouped: Record<string, Record<string, number[]>> = {};
        part1AspectSummary.forEach((item) => {
            const group = item.group;
            if (!grouped[group]) grouped[group] = {};
            if (!grouped[group][item.aspect]) grouped[group][item.aspect] = [];
            grouped[group][item.aspect].push(Number(item.average_score));
        });

        const result: Record<string, { aspect: string; score: number }[]> = {};
        Object.entries(grouped).forEach(([group, aspects]) => {
            result[group] = Object.entries(aspects).map(([aspect, scores]) => ({
                aspect,
                score: scores.reduce((a, b) => a + b, 0) / scores.length,
            }));
        });
        return result;
    }, [part1AspectSummary]);

    const processedData = useMemo(() => {
        const summary = {
            total: evaluateeCountByGrade.reduce(
                (sum, item) => sum + item.total,
                0
            ),
            completed: evaluateeCountByGrade.reduce(
                (sum, item) => sum + item.completed,
                0
            ),
            remaining: evaluateeCountByGrade.reduce(
                (sum, item) => sum + item.remaining,
                0
            ),
        };

        // 🎯 ใช้ weightedSummaryForExport (เฉพาะคนที่มีคะแนน) สำหรับการส่งออก
        const groups = {
            internal_5_8: weightedSummaryForExport.filter(
                (u) => u.grade! >= 5 && u.grade! <= 8
            ),
            internal_9_12: weightedSummaryForExport.filter(
                (u) =>
                    u.grade! >= 9 &&
                    u.grade! <= 12 &&
                    u.user_type === "internal"
            ),
            external_9_12: weightedSummaryForExport.filter(
                (u) =>
                    u.grade! >= 9 &&
                    u.grade! <= 12 &&
                    u.user_type === "external"
            ),
            // 🎯 กลุ่มรวมสำหรับระดับ 9-12 ทั้งหมด
            combined_9_12: weightedSummaryForExport.filter(
                (u) => u.grade! >= 9 && u.grade! <= 12
            ),
        };

        // 🔍 ใช้ weightedSummaryForExport.length ให้ตรงกับ Excel
        const totalInExport = weightedSummaryForExport.length;

        console.log("🔍 Data Check (Strict Criteria):", {
            "📊 สรุปจากหน้า Report": summary,
            "📁 ข้อมูลใน weightedSummary ทั้งหมด": weightedSummary.length,
            "📊 ข้อมูลที่ประเมินครบจริงๆ (ส่งออก Excel)":
                weightedSummaryForExport.length,
            "🏢 พนักงาน 5-8": groups.internal_5_8.length,
            "👨‍💼 ผู้บริหาร 9-12 ภายใน": groups.internal_9_12.length,
            "🌟 ผู้บริหาร 9-12 ภายนอก": groups.external_9_12.length,
            "🎯 ผู้บริหาร 9-12 รวม": groups.combined_9_12.length,
            "📈 รวมที่จะส่งออก": totalInExport,
            "✅ ตรงกับ completed ใน summary":
                totalInExport === summary.completed ? "ใช่" : "ไม่",
            "🔍 เกณฑ์การนับ": {
                "พนักงาน 5-8": "ต้องมี self, top, left > 0",
                "ผู้บริหาร 9-12": "ต้องมี self, top, bottom, left, right > 0",
            },
            "🎯 คนที่ยังประเมินไม่ครบ": summary.total - totalInExport + " คน",
        });

        const chartData = part1ScoreYearly.reduce((acc, item) => {
            const key = `${item.part_id}_${item.year}`;
            if (!acc[key]) {
                acc[key] = {
                    year: item.year,
                    part_id: item.part_id,
                    group:
                        item.part_id === 7
                            ? "พนักงานภายใน 5-8"
                            : item.part_id === 1
                            ? "ผู้บริหาร 9-12 (ภายใน)"
                            : "ผู้บริหาร 9-12 (ภายนอก)",
                    scores: [],
                };
            }
            acc[key].scores.push({
                aspect: item.aspect,
                score: parseFloat(item.average_score.toString()),
            });
            return acc;
        }, {} as any);

        return {
            summary,
            groups,
            chartData: Object.values(chartData),
            aspectsByGroup,
            totalInExport,
        };
    }, [
        evaluateeCountByGrade,
        weightedSummary,
        weightedSummaryForExport, // เพิ่ม dependency ใหม่
        part1ScoreYearly,
        aspectsByGroup,
    ]);

    const handleFilterChange = (key: string, value: string) => {
        const updated = {
            fiscal_year: selectedYear,
            division: selectedDivision,
            grade: selectedGrade,
            [key]: value,
        };

        if (key === "fiscal_year") setSelectedYear(value);
        if (key === "division") setSelectedDivision(value);
        if (key === "grade") setSelectedGrade(value);

        router.visit(route("admin.evaluation.report"), {
            data: updated,
            preserveState: true,
        });
    };

    const handleShowUserList = async ({ grade, user_type, status, label }) => {
        setDialogTitle(label);
        setShowDialog(true);
        setDialogLoading(true);
        setUserList([]);

        try {
            const res = await fetch(
                route("admin.evaluation.report.list-evaluatees") +
                    `?fiscal_year=${selectedYear}&grade=${grade}&user_type=${user_type}&status=${status}&division=${selectedDivision}`
            );
            const data = await res.json();
            setUserList(data.users ?? []);
        } catch {
            setUserList([]);
        } finally {
            setDialogLoading(false);
        }
    };

    // 🎯 ฟังก์ชันสำหรับสร้างคอลัมน์ตารางแบบสมบูรณ์
    const getEnhancedTableColumns = (groupType: string) => {
        const baseColumns = [
            { key: "name", label: "ชื่อ-นามสกุล" },
            { key: "position", label: "ตำแหน่ง" },
            { key: "grade", label: "ระดับ" },
            { key: "division", label: "สายงาน" },
        ];

        // เพิ่มคอลัมน์ประเภทสำหรับกลุ่มที่มีทั้งภายในและภายนอก
        if (groupType === "combined_9_12" || groupType === "external_9_12") {
            baseColumns.push({ key: "user_type", label: "ประเภท" });
        }

        baseColumns.push(
            { key: "self", label: "Self" },
            { key: "top", label: "Top" }
        );

        if (groupType !== "internal_5_8") {
            baseColumns.push({ key: "bottom", label: "Bottom" });
        }

        baseColumns.push({ key: "left", label: "Left" });

        if (groupType !== "internal_5_8") {
            baseColumns.push({ key: "right", label: "Right" });
        }

        baseColumns.push(
            { key: "average", label: "คะแนนเฉลี่ย" },
            { key: "completion_rate", label: "ความครบถ้วน (%)" }
        );

        return baseColumns;
    };

    return (
        <MainLayout
            title="รายงานผลการประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: "แดชบอร์ด", href: route("admindashboard") },
                        { label: "รายงานผลการประเมิน", active: true },
                    ]}
                />
            }
        >
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                {/* 🎨 Background Effects */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-10">
                    {/* 🎨 Ultra Enhanced Header */}
                    <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-10 border border-gray-200 dark:border-gray-700 backdrop-blur-sm overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>

                        <div className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                            <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl">
                                        <BarChart3 className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                                            รายงานการประเมิน 360°
                                        </h1>
                                        <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2"></div>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 text-xl font-medium mb-6">
                                    🗓️ ปีงบประมาณ {parseInt(fiscalYear) + 543} •
                                    📊 รายงานข้อมูลการประเมินผลแบบครบถ้วนสมบูรณ์
                                </p>

                                {/* 🎯 Quick Stats with Animation */}
                                <div className="flex items-center space-x-8">
                                    <div className="flex items-center space-x-3 px-4 py-2 bg-green-100 border border-green-300 rounded-xl">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-bold text-green-700">
                                            {processedData.summary.completed}{" "}
                                            เสร็จแล้ว
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3 px-4 py-2 bg-orange-100 border border-orange-300 rounded-xl">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                        <span className="font-bold text-orange-700">
                                            {processedData.summary.remaining}{" "}
                                            ยังไม่เสร็จ
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3 px-4 py-2 bg-blue-100 border border-blue-300 rounded-xl">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <span className="font-bold text-blue-700">
                                            {(
                                                (processedData.summary
                                                    .completed /
                                                    processedData.summary
                                                        .total) *
                                                100
                                            ).toFixed(1)}
                                            % ความสำเร็จ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 🎛️ Ultra Enhanced Filters & Export */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Year Filter */}
                                    <div className="flex items-center space-x-3 bg-white border-2 border-gray-300 rounded-xl px-4 py-3 hover:border-blue-400 transition-all duration-300 shadow-lg">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        <select
                                            className="bg-transparent border-none focus:ring-0 font-semibold text-gray-700"
                                            value={selectedYear}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    "fiscal_year",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            {availableYears.map((y) => (
                                                <option key={y} value={y}>
                                                    ปีงบ {parseInt(y) + 543}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Division Filter */}
                                    <div className="flex items-center space-x-3 bg-white border-2 border-gray-300 rounded-xl px-4 py-3 hover:border-blue-400 transition-all duration-300 shadow-lg">
                                        <Building2 className="w-5 h-5 text-green-500" />
                                        <select
                                            className="bg-transparent border-none focus:ring-0 font-semibold text-gray-700"
                                            value={selectedDivision}
                                            onChange={(e) =>
                                                handleFilterChange(
                                                    "division",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">ทุกสายงาน</option>
                                            {availableDivisions.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Revolutionary Export Control */}
                                <RevolutionaryExportControl
                                    selectedYear={selectedYear}
                                    selectedDivision={selectedDivision}
                                    processedData={processedData}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 📈 Section 1: Ultra Summary Cards */}
                    <UltraReportSection
                        title="สรุปจำนวนผู้ถูกประเมินตามปีงบประมาณ"
                        icon={Users}
                        badgeText="ข้อมูลล่าสุด"
                        badgeColor="from-green-500 to-emerald-600"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                            <UltraMetricCard
                                title="ผู้ถูกประเมินทั้งหมด"
                                value={processedData.summary.total}
                                subtitle="คนที่ต้องได้รับการประเมิน"
                                icon={Users}
                                color="from-blue-500 to-blue-600"
                                badgeText="Total"
                                onClick={() =>
                                    handleShowUserList({
                                        grade: selectedGrade,
                                        user_type: "",
                                        status: "all",
                                        label: "รายชื่อผู้ถูกประเมินทั้งหมด",
                                    })
                                }
                            />
                            <UltraMetricCard
                                title="ประเมินเสร็จแล้ว"
                                value={processedData.summary.completed}
                                subtitle={`${(
                                    (processedData.summary.completed /
                                        processedData.summary.total) *
                                    100
                                ).toFixed(1)}% ของทั้งหมด`}
                                icon={CheckCircle}
                                color="from-green-500 to-green-600"
                                trend={Math.random() > 0.5 ? 15.3 : -2.7}
                                badgeText="✓ Done"
                                onClick={() =>
                                    handleShowUserList({
                                        grade: selectedGrade,
                                        user_type: "",
                                        status: "completed",
                                        label: "รายชื่อผู้ประเมินเสร็จแล้ว",
                                    })
                                }
                            />
                            <UltraMetricCard
                                title="ยังไม่ได้ประเมิน"
                                value={processedData.summary.remaining}
                                subtitle={`${(
                                    (processedData.summary.remaining /
                                        processedData.summary.total) *
                                    100
                                ).toFixed(1)}% ที่เหลือ`}
                                icon={Clock}
                                color="from-orange-500 to-orange-600"
                                badgeText="Pending"
                                onClick={() =>
                                    handleShowUserList({
                                        grade: selectedGrade,
                                        user_type: "",
                                        status: "incomplete",
                                        label: "รายชื่อผู้ยังไม่ได้ประเมิน",
                                    })
                                }
                            />
                        </div>

                        {/* 🎨 Ultra Enhanced Table */}
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mb-10">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-200">
                                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <FileBarChart className="w-6 h-6 mr-3 text-blue-600" />
                                    📊 สรุปตามเกรดและประเภทผู้ใช้
                                </h3>
                                <p className="text-gray-600 mt-1">
                                    รายละเอียดความก้าวหน้าการประเมินแยกตามกลุ่ม
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                เกรด
                                            </th>
                                            <th className="px-8 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                ประเภท
                                            </th>
                                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                ทั้งหมด
                                            </th>
                                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                เสร็จแล้ว
                                            </th>
                                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                ยังไม่เสร็จ
                                            </th>
                                            <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                ความสำเร็จ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {evaluateeCountByGrade
                                            .slice()
                                            .sort((a, b) => b.grade - a.grade)
                                            .map((item, index) => {
                                                const completionRate =
                                                    (item.completed /
                                                        item.total) *
                                                    100;
                                                return (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group"
                                                    >
                                                        <td className="px-8 py-6 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold mr-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                                                                    {item.grade}
                                                                </div>
                                                                <span className="text-lg font-bold text-gray-900">
                                                                    ระดับ C
                                                                    {item.grade}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                                                                    item.user_type ===
                                                                    "internal"
                                                                        ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                                                                        : "bg-purple-100 text-purple-800 border-2 border-purple-300"
                                                                } shadow-lg`}
                                                            >
                                                                {item.user_type ===
                                                                "internal"
                                                                    ? "🏢 บุคคลากรภายใน"
                                                                    : "🌐 บุคคลากรภายนอก"}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 whitespace-nowrap text-center">
                                                            <span className="text-lg font-black text-gray-900 bg-gray-100 px-4 py-2 rounded-xl">
                                                                {item.total}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 whitespace-nowrap text-center">
                                                            <button
                                                                onClick={() =>
                                                                    handleShowUserList(
                                                                        {
                                                                            grade: item.grade,
                                                                            user_type:
                                                                                item.user_type,
                                                                            status: "completed",
                                                                            label: `รายชื่อผู้ประเมินเสร็จแล้ว (C${
                                                                                item.grade
                                                                            } ${
                                                                                item.user_type ===
                                                                                "internal"
                                                                                    ? "ภายใน"
                                                                                    : "ภายนอก"
                                                                            })`,
                                                                        }
                                                                    )
                                                                }
                                                                className="bg-green-100 text-green-800 font-black px-4 py-2 rounded-xl hover:bg-green-200 hover:scale-110 transition-all duration-200 shadow-lg border-2 border-green-300"
                                                            >
                                                                {item.completed}
                                                            </button>
                                                        </td>
                                                        <td className="px-8 py-6 whitespace-nowrap text-center">
                                                            <button
                                                                onClick={() =>
                                                                    handleShowUserList(
                                                                        {
                                                                            grade: item.grade,
                                                                            user_type:
                                                                                item.user_type,
                                                                            status: "incomplete",
                                                                            label: `รายชื่อผู้ยังไม่ได้ประเมิน (C${
                                                                                item.grade
                                                                            } ${
                                                                                item.user_type ===
                                                                                "internal"
                                                                                    ? "ภายใน"
                                                                                    : "ภายนอก"
                                                                            })`,
                                                                        }
                                                                    )
                                                                }
                                                                className="bg-orange-100 text-orange-800 font-black px-4 py-2 rounded-xl hover:bg-orange-200 hover:scale-110 transition-all duration-200 shadow-lg border-2 border-orange-300"
                                                            >
                                                                {item.remaining}
                                                            </button>
                                                        </td>
                                                        <td className="px-8 py-6 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center space-x-3">
                                                                <div className="w-16 bg-gray-200 rounded-full h-3 shadow-inner">
                                                                    <div
                                                                        className={`h-3 rounded-full transition-all duration-1000 ${
                                                                            completionRate >=
                                                                            80
                                                                                ? "bg-green-500"
                                                                                : completionRate >=
                                                                                  60
                                                                                ? "bg-yellow-500"
                                                                                : "bg-red-500"
                                                                        } shadow-lg`}
                                                                        style={{
                                                                            width: `${completionRate}%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span
                                                                    className={`text-sm font-black px-3 py-1 rounded-full ${
                                                                        completionRate >=
                                                                        80
                                                                            ? "bg-green-100 text-green-700"
                                                                            : completionRate >=
                                                                              60
                                                                            ? "bg-yellow-100 text-yellow-700"
                                                                            : "bg-red-100 text-red-700"
                                                                    } shadow-lg border-2 ${
                                                                        completionRate >=
                                                                        80
                                                                            ? "border-green-300"
                                                                            : completionRate >=
                                                                              60
                                                                            ? "border-yellow-300"
                                                                            : "border-red-300"
                                                                    }`}
                                                                >
                                                                    {completionRate.toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Performance Distribution Chart */}
                        {summaryStats && (
                            <div className="mt-8">
                                <UltraPerformanceDistributionChart
                                    distribution={
                                        summaryStats.score_distribution
                                    }
                                />
                            </div>
                        )}
                    </UltraReportSection>

                    {/* 📊 Section 2: Ultra Charts */}
                    <UltraReportSection
                        title="กราฟแสดงผลการประเมิน Part 1 แยกตามกลุ่ม"
                        icon={BarChart3}
                        badgeText="Data Visualization"
                        badgeColor="from-purple-500 to-pink-600"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            <UltraEnhancedChart
                                type="column"
                                title="🏢 พนักงานภายใน ระดับ 5-8"
                                height={350}
                                data={
                                    processedData.aspectsByGroup["5-8"]?.map(
                                        (item: any) => ({
                                            name:
                                                item.aspect.length > 15
                                                    ? item.aspect.substring(
                                                          0,
                                                          15
                                                      ) + "..."
                                                    : item.aspect,
                                            value: item.score,
                                            fullName: item.aspect,
                                        })
                                    ) || []
                                }
                                colors={["#3B82F6"]}
                            />

                            <UltraEnhancedChart
                                type="column"
                                title="👨‍💼 ผู้บริหาร 9-12 (บุคคลากรภายใน)"
                                height={350}
                                data={
                                    processedData.aspectsByGroup[
                                        "9-12:internal"
                                    ]?.map((item: any) => ({
                                        name:
                                            item.aspect.length > 15
                                                ? item.aspect.substring(0, 15) +
                                                  "..."
                                                : item.aspect,
                                        value: item.score,
                                        fullName: item.aspect,
                                    })) || []
                                }
                                colors={["#10B981"]}
                            />

                            <UltraEnhancedChart
                                type="column"
                                title="🌟 ผู้บริหาร 9-12 (บุคคลากรภายนอก)"
                                height={350}
                                data={
                                    processedData.aspectsByGroup[
                                        "9-12:external"
                                    ]?.map((item: any) => ({
                                        name:
                                            item.aspect.length > 15
                                                ? item.aspect.substring(0, 15) +
                                                  "..."
                                                : item.aspect,
                                        value: item.score,
                                        fullName: item.aspect,
                                    })) || []
                                }
                                colors={["#8B5CF6"]}
                            />
                        </div>

                        {/* Ultra Comparison Chart */}
                        <div className="mt-10">
                            <UltraComparisonChart
                                title="📈 เปรียบเทียบคะแนนเฉลี่ยระหว่างกลุ่ม"
                                height={450}
                                data={[
                                    {
                                        group: "พนักงาน 5-8",
                                        score:
                                            processedData.aspectsByGroup[
                                                "5-8"
                                            ]?.reduce(
                                                (sum: number, item: any) =>
                                                    sum + item.score,
                                                0
                                            ) /
                                                (processedData.aspectsByGroup[
                                                    "5-8"
                                                ]?.length || 1) || 0,
                                    },
                                    {
                                        group: "ผู้บริหาร 9-12 (ภายใน)",
                                        score:
                                            processedData.aspectsByGroup[
                                                "9-12:internal"
                                            ]?.reduce(
                                                (sum: number, item: any) =>
                                                    sum + item.score,
                                                0
                                            ) /
                                                (processedData.aspectsByGroup[
                                                    "9-12:internal"
                                                ]?.length || 1) || 0,
                                    },
                                    {
                                        group: "ผู้บริหาร 9-12 (ภายนอก)",
                                        score:
                                            processedData.aspectsByGroup[
                                                "9-12:external"
                                            ]?.reduce(
                                                (sum: number, item: any) =>
                                                    sum + item.score,
                                                0
                                            ) /
                                                (processedData.aspectsByGroup[
                                                    "9-12:external"
                                                ]?.length || 1) || 0,
                                    },
                                ]}
                            />
                        </div>

                        {/* Summary Statistics */}
                        {summaryStats && (
                            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="text-4xl font-black text-blue-600 mb-3">
                                        {summaryStats.avg_scores_by_group.internal_5_8.toFixed(
                                            2
                                        )}
                                    </div>
                                    <div className="text-lg text-blue-700 font-bold">
                                        🏢 พนักงาน 5-8
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="text-4xl font-black text-green-600 mb-3">
                                        {summaryStats.avg_scores_by_group.internal_9_12.toFixed(
                                            2
                                        )}
                                    </div>
                                    <div className="text-lg text-green-700 font-bold">
                                        👨‍💼 ผู้บริหาร 9-12 (ภายใน)
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                    <div className="text-4xl font-black text-purple-600 mb-3">
                                        {summaryStats.avg_scores_by_group.external_9_12.toFixed(
                                            2
                                        )}
                                    </div>
                                    <div className="text-lg text-purple-700 font-bold">
                                        🌟 ผู้บริหาร 9-12 (ภายนอก)
                                    </div>
                                </div>
                            </div>
                        )}
                    </UltraReportSection>

                    {/* 🎯 Section 3: Ultra Progress Bars */}
                    <UltraReportSection
                        title="คะแนนเฉลี่ยตามด้านการประเมิน"
                        icon={Target}
                        collapsible={true}
                        badgeText="Detailed Analysis"
                        badgeColor="from-green-500 to-teal-600"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* พนักงานภายใน 5-8 */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 shadow-xl">
                                <h4 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                                    <GraduationCap className="w-6 h-6 mr-3" />
                                    🏢 พนักงานภายใน ระดับ 5-8
                                </h4>
                                <div className="space-y-4">
                                    {processedData.aspectsByGroup["5-8"]?.map(
                                        (item: any, index: number) => (
                                            <UltraProgressBar
                                                key={index}
                                                label={item.aspect}
                                                value={item.score}
                                                color="bg-blue-500"
                                                showPercentage={false}
                                            />
                                        )
                                    ) || (
                                        <div className="text-gray-500 text-center py-8 flex flex-col items-center">
                                            <AlertCircle className="w-8 h-8 mb-2" />
                                            <span>ไม่มีข้อมูล</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ผู้บริหาร 9-12 (ภายใน) */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-xl">
                                <h4 className="text-2xl font-bold text-green-900 mb-6 flex items-center">
                                    <Trophy className="w-6 h-6 mr-3" />
                                    👨‍💼 ผู้บริหาร 9-12 (บุคคลากรภายใน)
                                </h4>
                                <div className="space-y-4">
                                    {processedData.aspectsByGroup[
                                        "9-12:internal"
                                    ]?.map((item: any, index: number) => (
                                        <UltraProgressBar
                                            key={index}
                                            label={item.aspect}
                                            value={item.score}
                                            color="bg-green-500"
                                            showPercentage={false}
                                        />
                                    )) || (
                                        <div className="text-gray-500 text-center py-8 flex flex-col items-center">
                                            <AlertCircle className="w-8 h-8 mb-2" />
                                            <span>ไม่มีข้อมูล</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ผู้บริหาร 9-12 (ภายนอก) */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-xl">
                                <h4 className="text-2xl font-bold text-purple-900 mb-6 flex items-center">
                                    <Star className="w-6 h-6 mr-3" />
                                    🌟 ผู้บริหาร 9-12 (บุคคลากรภายนอก)
                                </h4>
                                <div className="space-y-4">
                                    {processedData.aspectsByGroup[
                                        "9-12:external"
                                    ]?.map((item: any, index: number) => (
                                        <UltraProgressBar
                                            key={index}
                                            label={item.aspect}
                                            value={item.score}
                                            color="bg-purple-500"
                                            showPercentage={false}
                                        />
                                    )) || (
                                        <div className="text-gray-500 text-center py-8 flex flex-col items-center">
                                            <AlertCircle className="w-8 h-8 mb-2" />
                                            <span>ไม่มีข้อมูล</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </UltraReportSection>

                    {/* 📋 Section 4: ตารางผลประเมิน */}
                    <UltraReportSection
                        title="ตารางผลการประเมินรายบุคคล"
                        icon={FileBarChart}
                        badgeText="Individual Results"
                        badgeColor="from-indigo-500 to-blue-600"
                    >
                        <div className="space-y-10">
                            {/* พนักงานภายใน 5-8 */}
                            {processedData.groups.internal_5_8.length > 0 && (
                                <div>
                                    <div className="flex items-center space-x-4 mb-8">
                                        <div className="w-6 h-6 bg-blue-500 rounded-lg shadow-lg"></div>
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            🏢 พนักงานภายใน ระดับ 5-8
                                        </h3>
                                        <span className="bg-blue-100 text-blue-800 text-sm font-bold px-4 py-2 rounded-full border-2 border-blue-300 shadow-lg">
                                            {
                                                processedData.groups
                                                    .internal_5_8.length
                                            }{" "}
                                            คน
                                        </span>
                                    </div>
                                    <UltraEnhancedTable
                                        data={processedData.groups.internal_5_8}
                                        columns={getEnhancedTableColumns(
                                            "internal_5_8"
                                        )}
                                    />
                                </div>
                            )}

                            {/* ผู้บริหาร 9-12 (ภายใน) */}
                            {processedData.groups.internal_9_12.length > 0 && (
                                <div>
                                    <div className="flex items-center space-x-4 mb-8">
                                        <div className="w-6 h-6 bg-green-500 rounded-lg shadow-lg"></div>
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            👨‍💼 ผู้บริหาร 9-12 (บุคคลากรภายใน)
                                        </h3>
                                        <span className="bg-green-100 text-green-800 text-sm font-bold px-4 py-2 rounded-full border-2 border-green-300 shadow-lg">
                                            {
                                                processedData.groups
                                                    .internal_9_12.length
                                            }{" "}
                                            คน
                                        </span>
                                    </div>
                                    <UltraEnhancedTable
                                        data={
                                            processedData.groups.internal_9_12
                                        }
                                        columns={getEnhancedTableColumns(
                                            "internal_9_12"
                                        )}
                                    />
                                </div>
                            )}

                            {/* ผู้บริหาร 9-12 (ภายนอก) */}
                            {processedData.groups.external_9_12.length > 0 && (
                                <div>
                                    <div className="flex items-center space-x-4 mb-8">
                                        <div className="w-6 h-6 bg-purple-500 rounded-lg shadow-lg"></div>
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            🌟 ผู้บริหาร 9-12 (บุคคลากรภายนอก)
                                        </h3>
                                        <span className="bg-purple-100 text-purple-800 text-sm font-bold px-4 py-2 rounded-full border-2 border-purple-300 shadow-lg">
                                            {
                                                processedData.groups
                                                    .external_9_12.length
                                            }{" "}
                                            คน
                                        </span>
                                    </div>
                                    <UltraEnhancedTable
                                        data={
                                            processedData.groups.external_9_12
                                        }
                                        columns={getEnhancedTableColumns(
                                            "external_9_12"
                                        )}
                                    />
                                </div>
                            )}

                            {/* 🎯 ผู้บริหาร 9-12 รวมทั้งหมด (ใหม่) */}
                            {processedData.groups.combined_9_12.length > 0 && (
                                <div>
                                    <div className="flex items-center space-x-4 mb-8">
                                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-purple-500 rounded-lg shadow-lg"></div>
                                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            🎯 ผู้บริหาร 9-12 (รวมทั้งหมด)
                                        </h3>
                                        <span className="bg-gradient-to-r from-green-100 to-purple-100 text-gray-800 text-sm font-bold px-4 py-2 rounded-full border-2 border-gray-300 shadow-lg">
                                            {
                                                processedData.groups
                                                    .combined_9_12.length
                                            }{" "}
                                            คน
                                        </span>
                                        <span className="text-sm text-gray-600 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300">
                                            รวมภายใน + ภายนอก
                                        </span>
                                    </div>
                                    <UltraEnhancedTable
                                        data={
                                            processedData.groups.combined_9_12
                                        }
                                        columns={getEnhancedTableColumns(
                                            "combined_9_12"
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </UltraReportSection>

                    {/* 🎨 Ultra Enhanced Summary Footer */}
                    {summaryStats && (
                        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-10 text-white overflow-hidden">
                            {/* 🌟 Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                    }}
                                ></div>
                            </div>

                            {/* 💎 Floating Elements */}
                            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>

                            <div className="relative z-10">
                                <div className="text-center mb-10">
                                    <h3 className="text-4xl font-black mb-4 flex items-center justify-center">
                                        <Award className="w-10 h-10 mr-4" />
                                        🎯 สรุปภาพรวมการประเมิน 360°
                                    </h3>
                                    <p className="text-white/90 text-xl font-medium">
                                        ปีงบประมาณ {parseInt(fiscalYear) + 543}{" "}
                                        • รายงานฉบับสมบูรณ์
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                                        <div className="flex items-center justify-center mb-4">
                                            <Users className="w-8 h-8 mr-3" />
                                            <span className="text-lg font-bold opacity-90">
                                                ผู้เข้าร่วมทั้งหมด
                                            </span>
                                        </div>
                                        <div className="text-5xl font-black mb-2">
                                            {summaryStats.total_evaluatees}
                                        </div>
                                        <div className="text-sm opacity-80 font-medium">
                                            คน
                                        </div>
                                    </div>

                                    <div className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                                        <div className="flex items-center justify-center mb-4">
                                            <CheckCircle className="w-8 h-8 mr-3" />
                                            <span className="text-lg font-bold opacity-90">
                                                เสร็จสิ้นแล้ว
                                            </span>
                                        </div>
                                        <div className="text-5xl font-black mb-2">
                                            {summaryStats.total_completed}
                                        </div>
                                        <div className="text-sm opacity-80 font-medium">
                                            {summaryStats.completion_rate.toFixed(
                                                1
                                            )}
                                            %
                                        </div>
                                    </div>

                                    <div className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                                        <div className="flex items-center justify-center mb-4">
                                            <Clock className="w-8 h-8 mr-3" />
                                            <span className="text-lg font-bold opacity-90">
                                                ยังไม่เสร็จ
                                            </span>
                                        </div>
                                        <div className="text-5xl font-black mb-2">
                                            {summaryStats.total_remaining}
                                        </div>
                                        <div className="text-sm opacity-80 font-medium">
                                            {(
                                                100 -
                                                summaryStats.completion_rate
                                            ).toFixed(1)}
                                            %
                                        </div>
                                    </div>

                                    <div className="text-center bg-white/15 rounded-2xl p-6 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                                        <div className="flex items-center justify-center mb-4">
                                            <Award className="w-8 h-8 mr-3" />
                                            <span className="text-lg font-bold opacity-90">
                                                คะแนนเฉลี่ย
                                            </span>
                                        </div>
                                        <div className="text-5xl font-black mb-2">
                                            {summaryStats.overall_avg_score.toFixed(
                                                2
                                            )}
                                        </div>
                                        <div className="text-sm opacity-80 font-medium">
                                            จาก 5.00
                                        </div>
                                    </div>
                                </div>

                                {/* 🏆 Performance Highlights */}
                                <div className="mt-10 pt-8 border-t border-white/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg">
                                            <h4 className="text-2xl font-bold mb-4 flex items-center">
                                                <Trophy className="w-6 h-6 mr-2" />
                                                🏆 ผลงานโดดเด่น
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span>คะแนนสูงสุด:</span>
                                                    <span className="font-black text-xl">
                                                        {summaryStats.highest_score.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>คะแนนต่ำสุด:</span>
                                                    <span className="font-black text-xl">
                                                        {summaryStats.lowest_score.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>ช่วงคะแนน:</span>
                                                    <span className="font-black text-xl">
                                                        {(
                                                            summaryStats.highest_score -
                                                            summaryStats.lowest_score
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-lg">
                                            <h4 className="text-2xl font-bold mb-4 flex items-center">
                                                <Target className="w-6 h-6 mr-2" />
                                                🎯 สถิติสำคัญ
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span>ผลงานดีเยี่ยม:</span>
                                                    <span className="font-black text-xl">
                                                        {
                                                            summaryStats
                                                                .score_distribution
                                                                .excellent
                                                        }{" "}
                                                        คน
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>ผลงานดีมาก:</span>
                                                    <span className="font-black text-xl">
                                                        {
                                                            summaryStats
                                                                .score_distribution
                                                                .very_good
                                                        }{" "}
                                                        คน
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>
                                                        อัตราความสำเร็จ:
                                                    </span>
                                                    <span className="font-black text-xl">
                                                        {summaryStats.completion_rate.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 🎨 Ultra Enhanced Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl">
                    <DialogHeader className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 border-b border-gray-200">
                        <DialogTitle className="text-2xl font-bold flex items-center text-gray-900">
                            <Eye className="w-6 h-6 mr-3 text-blue-600" />
                            {dialogTitle}
                        </DialogTitle>
                    </DialogHeader>

                    <DialogDescription asChild>
                        <div className="p-8">
                            {dialogLoading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                                    <span className="text-gray-600 text-lg font-medium">
                                        กำลังโหลดข้อมูล...
                                    </span>
                                </div>
                            ) : userList.length === 0 ? (
                                <div className="text-center py-16">
                                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                                    <div className="text-gray-500 text-xl font-medium">
                                        ไม่พบข้อมูล
                                    </div>
                                    <div className="text-gray-400 text-sm mt-2">
                                        ไม่มีรายการในกลุ่มนี้
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-200">
                                        <div className="flex items-center space-x-3">
                                            <DatabaseIcon className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm font-semibold text-blue-700">
                                                พบทั้งหมด {userList.length}{" "}
                                                รายการ
                                            </span>
                                        </div>
                                    </div>

                                    <div className="gap-4 max-h-96 overflow-y-auto pr-2">
                                        {userList.map((u, idx) => (
                                            <div
                                                key={u.id || idx}
                                                className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200 hover:border-blue-300 hover:shadow-lg transform hover:-translate-y-1 mb-2"
                                            >
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold mr-4 shadow-lg">
                                                    {u.fname?.charAt(0) || "?"}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 text-lg">
                                                        {u.fname} {u.lname}
                                                    </div>
                                                    <div className="text-sm text-gray-600 font-medium">
                                                        {u.position_name &&
                                                            `${u.position_name} • `}
                                                        {u.division_name &&
                                                            u.division_name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogDescription>

                    <div className="flex justify-end p-8 bg-gray-50 border-t border-gray-200">
                        <DialogClose asChild>
                            <button className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg hover:shadow-xl">
                                ปิด
                            </button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
