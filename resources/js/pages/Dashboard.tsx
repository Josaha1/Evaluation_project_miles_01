import React, { useEffect, useState, useMemo } from "react";
import MainLayout from "@/Layouts/MainLayout";
import { usePage, router } from "@inertiajs/react";
import { Progress } from "@/Components/ui/progress";
import { cn } from "@/lib/utils";
import {
    User as UserIcon,
    Trophy,
    Target,
    Clock,
    CheckCircle,
    ArrowRight,
    TrendingUp,
    Users,
    Calendar,
    Filter,
    Search,
    BarChart3,
    PieChart,
    Award,
    Zap,
    Crown,
    ChevronDown,
    ChevronUp,
    Eye,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    MapPin,
} from "lucide-react";

interface EvaluationCard {
    id: number;
    evaluatee_id?: number;
    evaluatee_name: string;
    evaluatee_photo: string;
    grade: number;
    step_to_resume?: number;
    progress?: number;
    angle?: "top" | "bottom" | "left" | "right" | "self" | "unknown";
}

interface EvaluationGroup {
    evaluation_id: number;
    evaluation_title: string;
    total_evaluatees: number;
    total_progress: number;
    total_completed: number;
    angle_groups: Record<
        string,
        {
            angle: string;
            count: number;
            evaluatees: EvaluationCard[];
            avg_progress: number;
            completed_count: number;
        }
    >;
    evaluatees: EvaluationCard[];
}

interface EvaluationsData {
    self?: EvaluationCard[];
    target?: EvaluationCard[];
}

interface EvaluationCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    hoverColor: string;
    evaluatees: EvaluationCard[];
    progress: number;
    completed: number;
    total: number;
    show: boolean;
    evaluationType: "self" | "governor" | "executive" | "staff";
}

export default function Dashboard() {
    const {
        evaluations,
        evaluation_groups = {},
        fiscal_years = [],
        selected_year,
        satisfaction_evaluation,
    } = usePage<{
        evaluations: EvaluationsData;
        evaluation_groups: Record<string, EvaluationGroup>;
        fiscal_years: string[];
        selected_year: string;
        satisfaction_evaluation?: {
            show_card: boolean;
            completed: boolean;
            evaluation_id: number;
            evaluation_title: string;
            fiscal_year: string;
        };
    }>().props;



    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<
        "all" | "pending" | "completed"
    >("all");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    // Group evaluations by grade range and type
    const evaluationCategories = useMemo(() => {
        const categories: EvaluationCategory[] = [];

        // 1. ประเมินตนเอง (Self evaluation)
        const selfEvaluations = evaluations.self || [];
        if (selfEvaluations.length > 0) {
            const selfEval = selfEvaluations[0];
            categories.push({
                id: "self",
                title: "ประเมินตนเอง",
                description: "ประเมินตนเองตามระดับตำแหน่งของคุณ",
                icon: <UserIcon size={24} className="text-indigo-600" />,
                color: "text-indigo-700 dark:text-indigo-400",
                bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
                borderColor: "border-indigo-200 dark:border-indigo-800",
                hoverColor: "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
                evaluatees: selfEvaluations,
                progress: selfEval.progress || 0,
                completed: (selfEval.progress || 0) >= 100 ? 1 : 0,
                total: 1,
                show: true,
                evaluationType: "self",
            });
        }

        // 2. ประเมินผู้ว่าการ (Governor evaluation - grade 13+)
        const governorEvaluations = (evaluations.target || []).filter(
            (item) => {
                const grade = typeof item.grade === 'string' ? parseInt(item.grade) : item.grade;
                return grade >= 13;
            }
        );
        if (governorEvaluations.length > 0) {
            const avgProgress =
                governorEvaluations.reduce(
                    (sum, item) => sum + (item.progress || 0),
                    0
                ) / governorEvaluations.length;
            const completed = governorEvaluations.filter(
                (item) => (item.progress || 0) >= 100
            ).length;

            categories.push({
                id: "governor",
                title: "ประเมินผู้ว่าการ",
                description: "ประเมินผู้บริหารระดับสูง (ระดับ 13 ขึ้นไป)",
                icon: <Crown size={24} className="text-yellow-600" />,
                color: "text-yellow-700 dark:text-yellow-400",
                bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
                borderColor: "border-yellow-200 dark:border-yellow-800",
                hoverColor: "hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
                evaluatees: governorEvaluations,
                progress: Math.round(avgProgress),
                completed,
                total: governorEvaluations.length,
                show: true,
                evaluationType: "governor",
            });
        }

        // 3. ประเมินผู้บริหารระดับ 9-12 (Executive level 9-12)
        const executiveEvaluations = (evaluations.target || []).filter(
            (item) => {
                const grade = typeof item.grade === 'string' ? parseInt(item.grade) : item.grade;
                return grade >= 9 && grade <= 12;
            }
        );
        if (executiveEvaluations.length > 0) {
            const avgProgress =
                executiveEvaluations.reduce(
                    (sum, item) => sum + (item.progress || 0),
                    0
                ) / executiveEvaluations.length;
            const completed = executiveEvaluations.filter(
                (item) => (item.progress || 0) >= 100
            ).length;

            categories.push({
                id: "executive",
                title: "ประเมินผู้บริหารระดับ 9-12",
                description: "ประเมินผู้บริหารระดับกลาง (ระดับ 9-12)",
                icon: <Trophy size={24} className="text-green-600" />,
                color: "text-green-700 dark:text-green-400",
                bgColor: "bg-green-50 dark:bg-green-900/20",
                borderColor: "border-green-200 dark:border-green-800",
                hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
                evaluatees: executiveEvaluations,
                progress: Math.round(avgProgress),
                completed,
                total: executiveEvaluations.length,
                show: true,
                evaluationType: "executive",
            });
        }

        // 4. ประเมินพนักงานระดับ 5-8 (Staff level 5-8)
        const staffEvaluations = (evaluations.target || []).filter(
            (item) => {
                const grade = typeof item.grade === 'string' ? parseInt(item.grade) : item.grade;
                return grade >= 5 && grade <= 8;
            }
        );
        if (staffEvaluations.length > 0) {
            const avgProgress =
                staffEvaluations.reduce(
                    (sum, item) => sum + (item.progress || 0),
                    0
                ) / staffEvaluations.length;
            const completed = staffEvaluations.filter(
                (item) => (item.progress || 0) >= 100
            ).length;

            categories.push({
                id: "staff",
                title: "ประเมินพนักงานระดับ 5-8",
                description: "ประเมินพนักงานระดับปฏิบัติการ (ระดับ 5-8)",
                icon: <Users size={24} className="text-blue-600" />,
                color: "text-blue-700 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                borderColor: "border-blue-200 dark:border-blue-800",
                hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                evaluatees: staffEvaluations,
                progress: Math.round(avgProgress),
                completed,
                total: staffEvaluations.length,
                show: true,
                evaluationType: "staff",
            });
        }

        return categories;
    }, [evaluations]);

    // Filter categories based on search and filter
    const filteredCategories = useMemo(() => {
        return evaluationCategories
            .map((category) => {
                const filteredEvaluatees = category.evaluatees.filter(
                    (item) => {
                        const matchesSearch = item.evaluatee_name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                        const matchesFilter =
                            filterStatus === "all" ||
                            (filterStatus === "completed" &&
                                (item.progress ?? 0) >= 100) ||
                            (filterStatus === "pending" &&
                                (item.progress ?? 0) < 100);
                        return matchesSearch && matchesFilter;
                    }
                );

                return {
                    ...category,
                    evaluatees: filteredEvaluatees,
                    show:
                        filteredEvaluatees.length > 0 ||
                        category.evaluationType === "self",
                };
            })
            .filter((category) => category.show);
    }, [evaluationCategories, searchTerm, filterStatus]);

    // Calculate statistics
    const stats = useMemo(() => {
        const allEvaluations = [
            ...(evaluations.self ?? []),
            ...(evaluations.target ?? []),
        ];
        const completed = allEvaluations.filter(
            (e) => (e.progress ?? 0) >= 100
        ).length;
        const pending = allEvaluations.filter(
            (e) => (e.progress ?? 0) < 100
        ).length;
        const avgProgress =
            allEvaluations.length > 0
                ? allEvaluations.reduce(
                      (sum, e) => sum + (e.progress ?? 0),
                      0
                  ) / allEvaluations.length
                : 0;

        return {
            total: allEvaluations.length,
            completed,
            pending,
            avgProgress: Math.round(avgProgress),
        };
    }, [evaluations]);

    const handleCategoryClick = (category: EvaluationCategory) => {
        if (category.evaluationType === "self") {
            const selfEval = category.evaluatees[0];
            if (selfEval) {
                router.visit(
                    route(
                        selfEval.progress === 0
                            ? "evaluationsself.index"
                            : "evaluationsself.resume"
                    )
                );
            }
        } else {
            // For assigned evaluations, find the best candidate to resume
            const sortedEvaluatees = [...category.evaluatees].sort((a, b) => {
                // First priority: incomplete evaluations with some progress
                const aProgress = a.progress ?? 0;
                const bProgress = b.progress ?? 0;
                const aIncomplete = aProgress > 0 && aProgress < 100;
                const bIncomplete = bProgress > 0 && bProgress < 100;
                
                if (aIncomplete && !bIncomplete) return -1;
                if (!aIncomplete && bIncomplete) return 1;
                
                // Second priority: higher progress first (within incomplete)
                if (aIncomplete && bIncomplete) {
                    return bProgress - aProgress;
                }
                
                // Third priority: not started evaluations (0% progress)
                const aNotStarted = aProgress === 0;
                const bNotStarted = bProgress === 0;
                
                if (aNotStarted && !bNotStarted) return -1;
                if (!aNotStarted && bNotStarted) return 1;
                
                // Last: order by step_to_resume or evaluatee_id
                return (a.step_to_resume ?? 1) - (b.step_to_resume ?? 1);
            });
            
            const evaluateeToResume = sortedEvaluatees[0];
            
            if (evaluateeToResume && evaluateeToResume.evaluatee_id) {
                // Always use show route which handles resume logic automatically
                router.visit(
                    route("assigned-evaluations.show", {
                        evaluateeId: evaluateeToResume.evaluatee_id,
                    })
                );
            }
        }
    };

    const toggleCategoryExpansion = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    // Get angle icon and label
    const getAngleDisplay = (angle?: string) => {
        switch (angle) {
            case "top":
                return {
                    icon: <ArrowUp size={14} className="text-blue-500" />,
                    label: "องศาบน",
                    bgColor: "bg-blue-100 dark:bg-blue-900/30",
                    textColor: "text-blue-700 dark:text-blue-300"
                };
            case "bottom":
                return {
                    icon: <ArrowDown size={14} className="text-green-500" />,
                    label: "องศาล่าง",
                    bgColor: "bg-green-100 dark:bg-green-900/30",
                    textColor: "text-green-700 dark:text-green-300"
                };
            case "left":
                return {
                    icon: <ArrowLeft size={14} className="text-orange-500" />,
                    label: "องศาซ้าย",
                    bgColor: "bg-orange-100 dark:bg-orange-900/30",
                    textColor: "text-orange-700 dark:text-orange-300"
                };
            case "right":
                return {
                    icon: <ArrowRight size={14} className="text-purple-500" />,
                    label: "เพื่อนร่วมงาน",
                    bgColor: "bg-purple-100 dark:bg-purple-900/30",
                    textColor: "text-purple-700 dark:text-purple-300"
                };
            case "self":
                return {
                    icon: <UserIcon size={14} className="text-indigo-500" />,
                    label: "ตนเอง",
                    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
                    textColor: "text-indigo-700 dark:text-indigo-300"
                };
            default:
                return {
                    icon: <MapPin size={14} className="text-gray-500" />,
                    label: "ไม่ระบุ",
                    bgColor: "bg-gray-100 dark:bg-gray-900/30",
                    textColor: "text-gray-700 dark:text-gray-300"
                };
        }
    };

    const handleEvaluateeClick = (
        evaluatee: EvaluationCard,
        evaluationType: string
    ) => {
        if (evaluationType === "self") {
            router.visit(
                route(
                    evaluatee.progress === 0
                        ? "evaluationsself.index"
                        : "evaluationsself.resume"
                )
            );
        } else {
            if (evaluatee.evaluatee_id) {
                router.visit(
                    route("assigned-evaluations.show", {
                        evaluateeId: evaluatee.evaluatee_id,
                    })
                );
            }
        }
    };

    const renderStatCard = (
        title: string,
        value: number | string,
        icon: React.ReactNode,
        color: string,
        trend?: number,
        subtitle?: string
    ) => (
        <div
            className={`rounded-2xl p-4 sm:p-6 ${color} border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                        {title}
                    </p>

                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                        {typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                    {trend !== undefined && (
                        <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm">
                            <TrendingUp
                                size={14}
                                className="text-green-500 mr-1 flex-shrink-0"
                            />
                            <span className="text-green-600 dark:text-green-400">
                                +{trend}%
                            </span>
                            <span className="text-gray-500 ml-1 hidden sm:inline">
                                จากเดือนที่แล้ว
                            </span>
                        </div>
                    )}
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:scale-110 transition-transform flex-shrink-0 ml-2 sm:ml-0">
                    {React.cloneElement(icon as React.ReactElement, {
                        size:
                            typeof window !== "undefined" &&
                            window.innerWidth < 640
                                ? 20
                                : 24,
                    })}
                </div>
            </div>
        </div>
    );

    const renderCategoryCard = (category: EvaluationCategory) => {
        const isCompleted = category.progress >= 100;
        const statusColor = isCompleted
            ? "text-green-600 dark:text-green-400"
            : "text-orange-600 dark:text-orange-400";
        const statusText = isCompleted ? "เสร็จสิ้น" : "รอดำเนินการ";
        const isExpanded = expandedCategories.has(category.id);

        return (
            <div
                key={category.id}
                className={cn(
                    "rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg group",
                    "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
                    category.bgColor,
                    category.borderColor,
                    category.hoverColor,
                    isCompleted ? "ring-2 ring-green-500/20" : "",
                    isExpanded ? "hover:shadow-xl" : "hover:-translate-y-1"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 group-hover:scale-110 transition-transform">
                            {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3
                                className={cn(
                                    "text-lg font-bold group-hover:text-opacity-80 transition-colors",
                                    category.color
                                )}
                            >
                                {category.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {category.description}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={cn("text-2xl font-bold", statusColor)}>
                            {category.progress}%
                        </div>
                        <div className={cn("text-sm font-medium", statusColor)}>
                            {statusText}
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ความคืบหน้า
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {category.completed}/{category.total} รายการ
                        </span>
                    </div>
                    <Progress
                        value={category.progress}
                        className={cn(
                            "h-3 rounded-full",
                            isCompleted
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-gray-100 dark:bg-gray-700"
                        )}
                    />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {category.total}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            ทั้งหมด
                        </div>
                    </div>
                    <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {category.completed}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            เสร็จแล้ว
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock size={16} />
                        <span>
                            {category.evaluationType === "self"
                                ? category.evaluatees[0]?.progress === 0
                                    ? "พร้อมเริ่มประเมิน"
                                    : `ขั้นตอนที่ ${
                                          category.evaluatees[0]?.step_to_resume || 1
                                      }`
                                : (() => {
                                      const inProgress = category.evaluatees.filter(
                                          (e) => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100
                                      );
                                      const notStarted = category.evaluatees.filter(
                                          (e) => (e.progress ?? 0) === 0
                                      );
                                      
                                      if (inProgress.length > 0) {
                                          return `${inProgress.length} รายการกำลังทำ`;
                                      } else if (notStarted.length > 0) {
                                          return `${notStarted.length} รายการยังไม่เริ่ม`;
                                      } else {
                                          return "ทุกรายการเสร็จสิ้น";
                                      }
                                  })()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View List Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleCategoryExpansion(category.id);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105",
                                "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                        >
                            <Eye size={16} />
                            <span className="hidden sm:inline">
                                {isExpanded ? "ซ่อนรายชื่อ" : "ดูรายชื่อ"}
                            </span>
                            {isExpanded ? (
                                <ChevronUp size={16} />
                            ) : (
                                <ChevronDown size={16} />
                            )}
                        </button>

                        {/* Start Evaluation Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryClick(category);
                            }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105",
                                "bg-gradient-to-r text-white shadow-lg hover:shadow-xl",
                                category.evaluationType === "self"
                                    ? "from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                                    : category.evaluationType === "governor"
                                    ? "from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800"
                                    : category.evaluationType === "executive"
                                    ? "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                    : "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            )}
                            disabled={
                                category.evaluationType !== "self" &&
                                category.completed >= category.total
                            }
                        >
                            <Zap size={16} />
                            {category.progress === 0
                                ? "เริ่มประเมิน"
                                : category.progress >= 100
                                ? "ประเมินเสร็จสิ้น"
                                : "ประเมินต่อ"}
                        </button>
                    </div>
                </div>

                {/* Expandable Evaluatee List */}
                {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                            รายชื่อผู้ถูกประเมิน ({category.evaluatees.length}{" "}
                            คน)
                        </h4>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {/* Group by angle for non-self evaluations */}
                            {category.evaluationType !== "self" ? (
                                // Group evaluatees by angle
                                Object.entries(
                                    category.evaluatees.reduce((groups, evaluatee) => {
                                        const angle = evaluatee.angle || "unknown";
                                        if (!groups[angle]) groups[angle] = [];
                                        groups[angle].push(evaluatee);
                                        return groups;
                                    }, {} as Record<string, typeof category.evaluatees>)
                                ).map(([angle, evaluateesInAngle]) => {
                                    const angleDisplay = getAngleDisplay(angle);
                                    return (
                                        <div key={`${category.id}-angle-${angle}`} className="space-y-2">
                                            {/* Angle Group Header */}
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg",
                                                angleDisplay.bgColor
                                            )}>
                                                {angleDisplay.icon}
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    angleDisplay.textColor
                                                )}>
                                                    {angleDisplay.label} ({evaluateesInAngle.length} คน)
                                                </span>
                                            </div>
                                            
                                            {/* Evaluatees in this angle */}
                                            <div className="space-y-2 ml-4">
                                                {evaluateesInAngle.map((evaluatee, index) => (
                                                    <div
                                                        key={`${category.id}-${evaluatee.id}-${index}`}
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group"
                                                        onClick={() =>
                                                            handleEvaluateeClick(
                                                                evaluatee,
                                                                category.evaluationType
                                                            )
                                                        }
                                                    >
                                                        {/* Avatar */}
                                                        <div className="flex-shrink-0">
                                                            {evaluatee.evaluatee_photo ? (
                                                                <img
                                                                    src={evaluatee.evaluatee_photo}
                                                                    alt={`${evaluatee.evaluatee_name} avatar`}
                                                                    onError={(e) => {
                                                                        (
                                                                            e.currentTarget as HTMLImageElement
                                                                        ).src =
                                                                            "/images/default.png";
                                                                    }}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-indigo-500 transition-colors"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                                    {evaluatee.evaluatee_name
                                                                        .charAt(0)
                                                                        .toUpperCase()}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Name and Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                                    {evaluatee.evaluatee_name}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    ระดับ {evaluatee.grade}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Progress */}
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <div className="text-right">
                                                                <div
                                                                    className={cn(
                                                                        "text-sm font-bold",
                                                                        (evaluatee.progress ?? 0) >=
                                                                            100
                                                                            ? "text-green-600 dark:text-green-400"
                                                                            : "text-orange-600 dark:text-orange-400"
                                                                    )}
                                                                >
                                                                    {evaluatee.progress ?? 0}%
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {(evaluatee.progress ?? 0) >=
                                                                    100
                                                                        ? "เสร็จสิ้น"
                                                                        : "รอดำเนินการ"}
                                                                </div>
                                                            </div>
                                                            <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full transition-all duration-300",
                                                                        (evaluatee.progress ?? 0) >=
                                                                            100
                                                                            ? "bg-green-500"
                                                                            : "bg-orange-500"
                                                                    )}
                                                                    style={{
                                                                        width: `${
                                                                            evaluatee.progress ?? 0
                                                                        }%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <ArrowRight
                                                                size={16}
                                                                className="text-gray-400 group-hover:text-indigo-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // Self evaluation - show directly without grouping
                                <div className="space-y-2">
                                    {category.evaluatees.map((evaluatee, index) => (
                                        <div
                                            key={`${category.id}-${evaluatee.id}-${index}`}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 cursor-pointer group"
                                            onClick={() =>
                                                handleEvaluateeClick(
                                                    evaluatee,
                                                    category.evaluationType
                                                )
                                            }
                                        >
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {evaluatee.evaluatee_photo ? (
                                                    <img
                                                        src={evaluatee.evaluatee_photo}
                                                        alt={`${evaluatee.evaluatee_name} avatar`}
                                                        onError={(e) => {
                                                            (
                                                                e.currentTarget as HTMLImageElement
                                                            ).src =
                                                                "/images/default.png";
                                                        }}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-indigo-500 transition-colors"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {evaluatee.evaluatee_name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Name and Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                        {evaluatee.evaluatee_name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        ระดับ {evaluatee.grade}
                                                    </span>
                                                    {/* Self evaluation badge */}
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                                        getAngleDisplay("self").bgColor,
                                                        getAngleDisplay("self").textColor
                                                    )}>
                                                        {getAngleDisplay("self").icon}
                                                        ตนเอง
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <div className="text-right">
                                                    <div
                                                        className={cn(
                                                            "text-sm font-bold",
                                                            (evaluatee.progress ?? 0) >=
                                                                100
                                                                ? "text-green-600 dark:text-green-400"
                                                                : "text-orange-600 dark:text-orange-400"
                                                        )}
                                                    >
                                                        {evaluatee.progress ?? 0}%
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {(evaluatee.progress ?? 0) >=
                                                        100
                                                            ? "เสร็จสิ้น"
                                                            : "รอดำเนินการ"}
                                                    </div>
                                                </div>
                                                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-300",
                                                            (evaluatee.progress ?? 0) >=
                                                                100
                                                                ? "bg-green-500"
                                                                : "bg-orange-500"
                                                        )}
                                                        style={{
                                                            width: `${
                                                                evaluatee.progress ?? 0
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                                <ArrowRight
                                                    size={16}
                                                    className="text-gray-400 group-hover:text-indigo-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <MainLayout title="แดชบอร์ดแบบประเมิน">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                                    📊 แดชบอร์ดการประเมิน
                                </h1>
                                <p className="text-white/80 text-sm sm:text-base lg:text-lg">
                                    ติดตามความคืบหน้าการประเมินของคุณ
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Background decorations */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                </div>

                {/* Satisfaction Evaluation Card */}
                {satisfaction_evaluation?.show_card && (() => {
                    const evalData = satisfaction_evaluation;
                    
                    return (
                        <div className="bg-white border-2 border-amber-400 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 opacity-60"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full -translate-y-8 translate-x-8"></div>
                            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-amber-300/30 to-orange-300/30 rounded-full translate-y-4 -translate-x-4"></div>
                            
                            {/* Content */}
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                                        evalData.completed 
                                            ? 'bg-green-100 border-green-300' 
                                            : 'bg-amber-100 border-amber-300'
                                    }`}>
                                        {evalData.completed ? (
                                            <CheckCircle className="w-7 h-7 text-green-600" />
                                        ) : (
                                            <Award className="w-7 h-7 text-amber-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold mb-1 ${
                                            evalData.completed ? 'text-green-700' : 'text-amber-700'
                                        }`}>
                                            {evalData.completed ? 
                                                '✅ ประเมินความพึงพอใจเสร็จสิ้น' : 
                                                '⭐ ประเมินความพึงพอใจ'
                                            }
                                        </h3>
                                        <p className="text-gray-600 text-sm font-medium">
                                            {evalData.completed ? 
                                                'ขอบคุณสำหรับการประเมินความพึงพอใจ' :
                                                'กรุณาประเมินความพึงพอใจต่อระบบประเมิน'
                                            }
                                        </p>
                                        {!evalData.completed && (
                                            <p className="text-amber-600 text-xs font-semibold mt-1 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                                รอการประเมิน
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {!evalData.completed && (
                                    <button
                                        onClick={() => router.visit(`/satisfaction-evaluation/${evalData.evaluation_id}?fiscal_year=${evalData.fiscal_year}`)}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        <Award className="w-5 h-5" />
                                        <span>เริ่มประเมิน</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                                {evalData.completed && (
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>เสร็จสิ้น</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                    {renderStatCard(
                        "จำนวนผู้ถูกประเมิน",
                        stats.total,
                        <BarChart3 size={24} className="text-indigo-600" />,
                        "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
                        undefined,
                        "รวมตนเอง"
                    )}
                    {renderStatCard(
                        "เสร็จสิ้น",
                        stats.completed,
                        <CheckCircle size={24} className="text-green-600" />,
                        "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
                        15
                    )}
                    {renderStatCard(
                        "รอดำเนินการ",
                        stats.pending,
                        <Clock size={24} className="text-orange-600" />,
                        "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
                    )}
                    {renderStatCard(
                        "ความคืบหน้าเฉลี่ย",
                        `${stats.avgProgress}%`,
                        <PieChart size={24} className="text-purple-600" />,
                        "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
                        8
                    )}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อผู้ถูกประเมิน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Filter
                                size={18}
                                className="text-gray-400 hidden sm:block"
                            />
                            <select
                                value={filterStatus}
                                onChange={(e) =>
                                    setFilterStatus(e.target.value as any)
                                }
                                className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base min-w-[120px]"
                            >
                                <option value="all">ทั้งหมด</option>
                                <option value="pending">รอดำเนินการ</option>
                                <option value="completed">เสร็จสิ้น</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Evaluation Categories */}
                <div className="space-y-6 lg:space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                            <Target
                                size={20}
                                className="sm:size-6 text-white"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                                📋 รายการประเมิน
                            </h2>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                เลือกประเภทการประเมินที่ต้องการดำเนินการ
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredCategories.map((category) =>
                            renderCategoryCard(category)
                        )}
                    </div>
                </div>

                {/* Empty State */}
                {filteredCategories.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Search size={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            ไม่พบรายการที่ค้นหา
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูรายการอื่น
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setFilterStatus("all");
                            }}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            รีเซ็ตตัวกรอง
                        </button>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
