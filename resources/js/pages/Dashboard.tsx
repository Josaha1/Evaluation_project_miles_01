import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import MainLayout from "@/Layouts/MainLayout";
import FiscalYearSelector from "@/Components/FiscalYearSelector";
import { usePage, router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
    User as UserIcon,
    Trophy,
    Clock,
    CheckCircle,
    ArrowRight,
    Users,
    Filter,
    Search,
    Award,
    Zap,
    Crown,
    ChevronDown,
    ChevronUp,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    Lock,
    Sparkles,
    ClipboardCheck,
    ListChecks,
    CalendarDays,
    CircleDot,
    Star,
} from "lucide-react";
import { toast } from "sonner";

// ─── Data Interfaces (unchanged) ────────────────────────────────────────────

interface EvaluationCard {
    id: number;
    evaluatee_id?: number;
    evaluatee_name: string;
    evaluatee_photo: string;
    grade: number;
    step_to_resume?: number;
    progress?: number;
    angle?: "top" | "bottom" | "left" | "right" | "self" | "unknown";
    is_submitted?: boolean;
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

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 24 },
    },
};

const cardHover = {
    scale: 1.015,
    y: -4,
    transition: { type: "spring", stiffness: 400, damping: 25 },
};

const evaluateeItemVariants = {
    hidden: { opacity: 0, x: -12 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 },
    }),
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
    },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 20 },
    },
};

// ─── Animated Counter ───────────────────────────────────────────────────────

function AnimatedCounter({
    value,
    duration = 1.2,
    className,
}: {
    value: number | string;
    duration?: number;
    className?: string;
}) {
    const numericValue = typeof value === "string" ? parseInt(value) || 0 : value;
    const isPercentage = typeof value === "string" && value.includes("%");
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const startTime = Date.now();
        const endTime = startTime + duration * 1000;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.round(eased * numericValue));

            if (now < endTime) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isInView, numericValue, duration]);

    return (
        <span ref={ref} className={className}>
            {displayValue}
            {isPercentage ? "%" : ""}
        </span>
    );
}

// ─── SVG Circular Progress Ring ─────────────────────────────────────────────

function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    className,
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const center = size / 2;

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg width={size} height={size} className="-rotate-90">
                {/* Track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    className="text-white/15"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#A78BFA" />
                        <stop offset="50%" stopColor="#C084FC" />
                        <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-2xl sm:text-3xl font-bold text-white"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                    {progress}%
                </motion.span>
                <span className="text-[10px] sm:text-xs text-white/60 font-medium mt-0.5">
                    ความคืบหน้ารวม
                </span>
            </div>
        </div>
    );
}

// ─── Mini Progress Ring (for stat cards) ────────────────────────────────────

function MiniRing({
    progress,
    size = 44,
    strokeWidth = 4,
    color = "#7C3AED",
}: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const center = size / 2;

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
                strokeWidth={strokeWidth}
            />
            <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
        </svg>
    );
}

// ─── Angle Display Helper ───────────────────────────────────────────────────

const ANGLE_DISPLAY: Record<
    string,
    {
        icon: React.ReactNode;
        label: string;
        sublabel: string;
        bgColor: string;
        textColor: string;
        dotColor: string;
    }
> = {
    top: {
        icon: <ArrowDown size={13} />,
        label: "ผู้ใต้บังคับบัญชา",
        sublabel: "ประเมินจากบนลงล่าง",
        bgColor: "bg-violet-100/80 dark:bg-violet-900/30",
        textColor: "text-violet-700 dark:text-violet-300",
        dotColor: "bg-violet-500",
    },
    bottom: {
        icon: <ArrowUp size={13} />,
        label: "ผู้บังคับบัญชา",
        sublabel: "ประเมินจากล่างขึ้นบน",
        bgColor: "bg-emerald-100/80 dark:bg-emerald-900/30",
        textColor: "text-emerald-700 dark:text-emerald-300",
        dotColor: "bg-emerald-500",
    },
    left: {
        icon: <ArrowLeft size={13} />,
        label: "เพื่อนร่วมงาน",
        sublabel: "ระดับเดียวกัน",
        bgColor: "bg-orange-100/80 dark:bg-orange-900/30",
        textColor: "text-orange-700 dark:text-orange-300",
        dotColor: "bg-orange-500",
    },
    right: {
        icon: <ArrowRight size={13} />,
        label: "องค์กรภายนอก",
        sublabel: "ผู้ประเมินภายนอก",
        bgColor: "bg-purple-100/80 dark:bg-purple-900/30",
        textColor: "text-purple-700 dark:text-purple-300",
        dotColor: "bg-purple-500",
    },
    self: {
        icon: <UserIcon size={13} />,
        label: "ตนเอง",
        sublabel: "ประเมินตนเอง",
        bgColor: "bg-violet-100/80 dark:bg-violet-900/30",
        textColor: "text-violet-700 dark:text-violet-300",
        dotColor: "bg-violet-500",
    },
    unknown: {
        icon: <CircleDot size={13} />,
        label: "ไม่ระบุ",
        sublabel: "",
        bgColor: "bg-gray-100/80 dark:bg-gray-800/50",
        textColor: "text-gray-600 dark:text-gray-400",
        dotColor: "bg-gray-400",
    },
};

function getAngleDisplay(angle?: string) {
    return ANGLE_DISPLAY[angle || "unknown"] || ANGLE_DISPLAY.unknown;
}

// ─── Main Dashboard Component ───────────────────────────────────────────────

export default function Dashboard() {
    // ── Data from backend (unchanged) ────────────────────────────────────
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

    const auth = usePage<{
        auth: {
            user: {
                id: number;
                name: string;
                fname: string;
                lname: string;
                role: string;
                grade: number;
                photo: string;
                user_type: string;
            } | null;
        };
    }>().props.auth;

    // ── Local State ──────────────────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    // ── Evaluation Categories (unchanged logic) ─────────────────────────
    const evaluationCategories = useMemo(() => {
        const categories: EvaluationCategory[] = [];

        // 1. Self evaluation
        const selfEvaluations = evaluations.self || [];
        if (selfEvaluations.length > 0) {
            const selfEval = selfEvaluations[0];
            categories.push({
                id: "self",
                title: "ประเมินตนเอง",
                description: "ประเมินตนเองตามระดับตำแหน่งของคุณ",
                icon: <UserIcon size={24} className="text-violet-600" />,
                color: "text-violet-700 dark:text-violet-400",
                bgColor: "bg-violet-50/50 dark:bg-violet-900/10",
                borderColor: "border-violet-200/60 dark:border-violet-800/40",
                hoverColor: "hover:bg-violet-50/80 dark:hover:bg-violet-900/20",
                evaluatees: selfEvaluations,
                progress: selfEval.progress || 0,
                // self category นับ completed จาก is_submitted เท่านั้น
                completed: (selfEval.is_submitted ?? false) ? 1 : 0,
                total: 1,
                show: true,
                evaluationType: "self",
            });
        }

        // Categorization helper: prefer the form's grade range (so users with grade
        // overrides — e.g. grade 9 user assigned to a 4-8 form — group by the form,
        // not by their personal grade). Fall back to evaluatee.grade if form metadata absent.
        const formMaxGrade = (item: any): number => {
            const fmax = (item as any).evaluation_grade_max;
            if (typeof fmax === 'number' && fmax > 0) return fmax;
            return typeof item.grade === 'string' ? parseInt(item.grade) : (item.grade ?? 0);
        };
        const formMinGrade = (item: any): number => {
            const fmin = (item as any).evaluation_grade_min;
            if (typeof fmin === 'number' && fmin > 0) return fmin;
            return typeof item.grade === 'string' ? parseInt(item.grade) : (item.grade ?? 0);
        };

        // 2. Governor evaluation (form covers grade 13+)
        const governorEvaluations = (evaluations.target || []).filter((item) => formMaxGrade(item) >= 13);
        if (governorEvaluations.length > 0) {
            const avgProgress =
                governorEvaluations.reduce((sum, item) => sum + (item.progress || 0), 0) /
                governorEvaluations.length;
            const completed = governorEvaluations.filter((item) => item.is_submitted ?? false).length;
            categories.push({
                id: "governor",
                title: "ประเมินผู้ว่าการ",
                description: "ประเมินผู้บริหารระดับสูง (ระดับ 13 ขึ้นไป)",
                icon: <Crown size={24} className="text-amber-500" />,
                color: "text-amber-700 dark:text-amber-400",
                bgColor: "bg-amber-50/50 dark:bg-amber-900/10",
                borderColor: "border-amber-200/60 dark:border-amber-800/40",
                hoverColor: "hover:bg-amber-50/80 dark:hover:bg-amber-900/20",
                evaluatees: governorEvaluations,
                progress: Math.round(avgProgress),
                completed,
                total: governorEvaluations.length,
                show: true,
                evaluationType: "governor",
            });
        }

        // 3. Executive evaluation (form for grade 9-12)
        const executiveEvaluations = (evaluations.target || []).filter((item) => {
            const min = formMinGrade(item);
            const max = formMaxGrade(item);
            return min >= 9 && max <= 12;
        });
        if (executiveEvaluations.length > 0) {
            const avgProgress =
                executiveEvaluations.reduce((sum, item) => sum + (item.progress || 0), 0) /
                executiveEvaluations.length;
            const completed = executiveEvaluations.filter((item) => item.is_submitted ?? false).length;
            categories.push({
                id: "executive",
                title: "ประเมินผู้บริหารระดับ 9-12",
                description: "ประเมินผู้บริหารระดับกลาง (ระดับ 9-12)",
                icon: <Trophy size={24} className="text-emerald-500" />,
                color: "text-emerald-700 dark:text-emerald-400",
                bgColor: "bg-emerald-50/50 dark:bg-emerald-900/10",
                borderColor: "border-emerald-200/60 dark:border-emerald-800/40",
                hoverColor: "hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20",
                evaluatees: executiveEvaluations,
                progress: Math.round(avgProgress),
                completed,
                total: executiveEvaluations.length,
                show: true,
                evaluationType: "executive",
            });
        }

        // 4. Staff evaluation (form for grade 4-8)
        const staffEvaluations = (evaluations.target || []).filter((item) => {
            const min = formMinGrade(item);
            const max = formMaxGrade(item);
            return min >= 4 && max <= 8;
        });
        if (staffEvaluations.length > 0) {
            const avgProgress =
                staffEvaluations.reduce((sum, item) => sum + (item.progress || 0), 0) /
                staffEvaluations.length;
            const completed = staffEvaluations.filter((item) => item.is_submitted ?? false).length;
            categories.push({
                id: "staff",
                title: "ประเมินพนักงานระดับ 4-8",
                description: "ประเมินพนักงานระดับปฏิบัติการ (ระดับ 4-8)",
                icon: <Users size={24} className="text-sky-500" />,
                color: "text-sky-700 dark:text-sky-400",
                bgColor: "bg-sky-50/50 dark:bg-sky-900/10",
                borderColor: "border-sky-200/60 dark:border-sky-800/40",
                hoverColor: "hover:bg-sky-50/80 dark:hover:bg-sky-900/20",
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

    // Self-evaluation completion check — ต้องกดส่งแล้วเท่านั้น
    const selfCompleted = useMemo(() => {
        const selfCategory = evaluationCategories.find((c) => c.evaluationType === "self");
        if (!selfCategory) return true;
        return (selfCategory.evaluatees[0]?.is_submitted ?? false);
    }, [evaluationCategories]);

    // Filter categories
    const filteredCategories = useMemo(() => {
        return evaluationCategories
            .map((category) => {
                const filteredEvaluatees = category.evaluatees.filter((item) => {
                    const matchesSearch = item.evaluatee_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase());
                    // เสร็จ = ผู้ใช้กดส่งคำตอบแล้ว (is_submitted) — ตอบครบไม่ถือว่าเสร็จ
                    const matchesFilter =
                        filterStatus === "all" ||
                        (filterStatus === "completed" && (item.is_submitted ?? false)) ||
                        (filterStatus === "pending" && !(item.is_submitted ?? false));
                    return matchesSearch && matchesFilter;
                });
                return {
                    ...category,
                    evaluatees: filteredEvaluatees,
                    show: filteredEvaluatees.length > 0 || category.evaluationType === "self",
                };
            })
            .filter((category) => category.show);
    }, [evaluationCategories, searchTerm, filterStatus]);

    // Step grouping
    const step1Categories = useMemo(
        () => filteredCategories.filter((c) => c.evaluationType === "self"),
        [filteredCategories]
    );
    const step2Categories = useMemo(
        () => filteredCategories.filter((c) => c.evaluationType !== "self"),
        [filteredCategories]
    );

    // Step 2 stats
    const step2Stats = useMemo(() => {
        const allTargetEvaluatees = step2Categories.flatMap((c) => c.evaluatees);
        const total = allTargetEvaluatees.length;
        const completed = allTargetEvaluatees.filter((e) => e.is_submitted ?? false).length;
        return { total, completed };
    }, [step2Categories]);

    // Overall statistics
    const stats = useMemo(() => {
        const allEvaluations = [...(evaluations.self ?? []), ...(evaluations.target ?? [])];
        const completed = allEvaluations.filter((e) => e.is_submitted ?? false).length;
        const pending = allEvaluations.filter((e) => !(e.is_submitted ?? false)).length;
        const avgProgress =
            allEvaluations.length > 0
                ? allEvaluations.reduce((sum, e) => sum + (e.progress ?? 0), 0) / allEvaluations.length
                : 0;
        return {
            total: allEvaluations.length,
            completed,
            pending,
            avgProgress: Math.round(avgProgress),
        };
    }, [evaluations]);

    // ── Navigation handlers (unchanged logic) ───────────────────────────

    const handleCategoryClick = useCallback(
        (category: EvaluationCategory) => {
            if (category.evaluationType === "self") {
                const selfEval = category.evaluatees[0];
                if (selfEval) {
                    // Lock only when explicitly submitted (not just 100%)
                    if (selfEval.is_submitted) return;
                    const routeName = (selfEval.progress ?? 0) === 0
                        ? "evaluationsself.index"
                        : "evaluationsself.resume";
                    router.visit(
                        route(routeName) + `?fiscal_year=${selected_year}`
                    );
                }
            } else {
                // Pick first non-submitted evaluatee
                const sortedEvaluatees = [...category.evaluatees]
                    .filter(e => !e.is_submitted)
                    .sort((a, b) => {
                        const aProgress = a.progress ?? 0;
                        const bProgress = b.progress ?? 0;
                        const aIncomplete = aProgress > 0 && aProgress < 100;
                        const bIncomplete = bProgress > 0 && bProgress < 100;
                        if (aIncomplete && !bIncomplete) return -1;
                        if (!aIncomplete && bIncomplete) return 1;
                        if (aIncomplete && bIncomplete) return bProgress - aProgress;
                        return (a.step_to_resume ?? 1) - (b.step_to_resume ?? 1);
                    });
                const evaluateeToResume = sortedEvaluatees[0];
                if (evaluateeToResume && evaluateeToResume.evaluatee_id) {
                    router.visit(
                        route("assigned-evaluations.show", {
                            evaluateeId: evaluateeToResume.evaluatee_id,
                        }) + `?fiscal_year=${selected_year}`
                    );
                }
            }
        },
        [selfCompleted, selected_year]
    );

    const handleEvaluateeClick = useCallback(
        (evaluatee: EvaluationCard, evaluationType: string) => {
            // Lock only when explicitly submitted
            if (evaluatee.is_submitted) return;
            if (evaluationType === "self") {
                const routeName = (evaluatee.progress ?? 0) === 0
                    ? "evaluationsself.index"
                    : "evaluationsself.resume";
                router.visit(
                    route(routeName) + `?fiscal_year=${selected_year}`
                );
            } else {
                if (evaluatee.evaluatee_id) {
                    router.visit(
                        route("assigned-evaluations.show", {
                            evaluateeId: evaluatee.evaluatee_id,
                        }) + `?fiscal_year=${selected_year}`
                    );
                }
            }
        },
        [selfCompleted, selected_year]
    );

    const toggleCategoryExpansion = useCallback((categoryId: string) => {
        setExpandedCategories((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    }, []);

    const handleFiscalYearChange = useCallback((year: string) => {
        router.get(route("dashboard"), { fiscal_year: year }, { preserveState: true, preserveScroll: true });
    }, []);

    // ── Role label helper ────────────────────────────────────────────────
    const getRoleLabel = (role?: string) => {
        switch (role) {
            case "admin":
                return "ผู้ดูแลระบบ";
            case "user":
                return "ผู้ใช้งาน";
            case "supervisor":
                return "หัวหน้างาน";
            default:
                return role || "ผู้ใช้งาน";
        }
    };

    // ── Category gradient for action buttons ─────────────────────────────
    const getCategoryGradient = (type: string) => {
        switch (type) {
            case "self":
                return "from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800";
            case "governor":
                return "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700";
            case "executive":
                return "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700";
            case "staff":
                return "from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700";
            default:
                return "from-violet-600 to-purple-700";
        }
    };

    const getCategoryAccent = (type: string) => {
        switch (type) {
            case "self": return "violet";
            case "governor": return "amber";
            case "executive": return "emerald";
            case "staff": return "sky";
            default: return "violet";
        }
    };

    // ── Status info for evaluatee ────────────────────────────────────────
    // 4 สถานะ: ส่งแล้ว / ตอบครบรอส่ง / กำลังดำเนินการ / ยังไม่เริ่ม
    const getEvaluateeStatus = (progress: number, isSubmitted?: boolean) => {
        if (isSubmitted) return { label: "ส่งคำตอบแล้ว", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30", ring: "ring-emerald-500/20" };
        if (progress >= 100) return { label: "ตอบครบ รอกดส่ง", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", ring: "ring-orange-500/20" };
        if (progress > 0) return { label: "กำลังดำเนินการ", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", ring: "ring-amber-500/20" };
        return { label: "ยังไม่เริ่ม", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800", ring: "ring-gray-400/20" };
    };

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <MainLayout title="แดชบอร์ดการประเมิน">
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-7xl mx-auto space-y-6 lg:space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* ━━━ Hero Welcome Header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <motion.div variants={itemVariants}>
                        <div className="gradient-hero rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl shadow-violet-600/20">
                            {/* Decorative orbs */}
                            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
                            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/8 rounded-full blur-2xl animate-float-delayed" />
                            <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl" />
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-500/5 to-transparent rounded-full blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    {/* Left: Greeting */}
                                    <div className="flex items-center gap-4 sm:gap-5">
                                        {/* Avatar */}
                                        <motion.div
                                            className="relative flex-shrink-0"
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        >
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl backdrop-blur-sm">
                                                {auth.user?.photo ? (
                                                    <img
                                                        src={auth.user.photo.startsWith("http") || auth.user.photo.startsWith("/") ? auth.user.photo : `/storage/${auth.user.photo}`}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLImageElement).src = "/images/default.png";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl font-bold">
                                                        {auth.user?.fname?.charAt(0) || "U"}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Online dot */}
                                            <motion.div
                                                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full ring-2 ring-white shadow-lg flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5, type: "spring", stiffness: 500 }}
                                            >
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </motion.div>
                                        </motion.div>

                                        <div>
                                            <motion.p
                                                className="text-white/70 text-sm sm:text-base font-medium"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                สวัสดี,
                                            </motion.p>
                                            <motion.h1
                                                className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 }}
                                            >
                                                {auth.user?.name || "ผู้ใช้งาน"}
                                            </motion.h1>
                                            <motion.div
                                                className="flex items-center gap-2 mt-1.5"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm border border-white/10">
                                                    <Sparkles size={11} />
                                                    {getRoleLabel(auth.user?.role)}
                                                </span>
                                                {auth.user?.grade && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm border border-white/10">
                                                        <Star size={11} />
                                                        ระดับ {auth.user.grade}
                                                    </span>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Right: Progress Ring + Fiscal Year */}
                                    <div className="flex items-center gap-5 sm:gap-8">
                                        {/* Overall Progress Ring */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4, type: "spring" }}
                                            className="hidden sm:block"
                                        >
                                            <ProgressRing progress={stats.avgProgress} size={110} strokeWidth={7} />
                                        </motion.div>

                                        {/* Fiscal Year Selector */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <FiscalYearSelector
                                                value={selected_year || ""}
                                                years={fiscal_years}
                                                onChange={(year) => handleFiscalYearChange(year)}
                                                variant="header"
                                            />
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Mobile Progress Ring */}
                                <div className="sm:hidden mt-6 flex justify-center">
                                    <ProgressRing progress={stats.avgProgress} size={100} strokeWidth={6} />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ━━━ Quick Stats Row ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <motion.div variants={itemVariants}>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {[
                                {
                                    label: "ทั้งหมด",
                                    value: stats.total,
                                    suffix: "รายการ",
                                    icon: <ListChecks size={20} />,
                                    color: "text-violet-600 dark:text-violet-400",
                                    bgIcon: "bg-violet-100 dark:bg-violet-900/30",
                                    ring: 100,
                                    ringColor: "#7C3AED",
                                    accentBorder: "border-t-violet-500",
                                },
                                {
                                    label: "เสร็จสิ้น",
                                    value: stats.completed,
                                    suffix: "รายการ",
                                    icon: <CheckCircle size={20} />,
                                    color: "text-emerald-600 dark:text-emerald-400",
                                    bgIcon: "bg-emerald-100 dark:bg-emerald-900/30",
                                    ring: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
                                    ringColor: "#10B981",
                                    accentBorder: "border-t-emerald-500",
                                },
                                {
                                    label: "รอดำเนินการ",
                                    value: stats.pending,
                                    suffix: "รายการ",
                                    icon: <Clock size={20} />,
                                    color: "text-orange-600 dark:text-orange-400",
                                    bgIcon: "bg-orange-100 dark:bg-orange-900/30",
                                    ring: stats.total > 0 ? (stats.pending / stats.total) * 100 : 0,
                                    ringColor: "#F97316",
                                    accentBorder: "border-t-orange-500",
                                },
                                {
                                    label: "ความคืบหน้า",
                                    value: `${stats.avgProgress}%`,
                                    suffix: "เฉลี่ย",
                                    icon: <Zap size={20} />,
                                    color: "text-purple-600 dark:text-purple-400",
                                    bgIcon: "bg-purple-100 dark:bg-purple-900/30",
                                    ring: stats.avgProgress,
                                    ringColor: "#9333EA",
                                    accentBorder: "border-t-purple-500",
                                },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={stat.label}
                                    className={cn(
                                        "glass-card rounded-2xl p-4 sm:p-5 group hover:shadow-xl transition-all duration-300 border-t-2",
                                        stat.accentBorder
                                    )}
                                    variants={itemVariants}
                                    whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                                {stat.label}
                                            </p>
                                            <div className={cn("text-xl sm:text-2xl lg:text-3xl font-bold mt-1", stat.color)}>
                                                {typeof stat.value === "number" ? (
                                                    <AnimatedCounter value={stat.value} className={stat.color} />
                                                ) : (
                                                    <AnimatedCounter value={stat.value} className={stat.color} />
                                                )}
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                {stat.suffix}
                                            </p>
                                        </div>
                                        <motion.div
                                            className={cn("p-2.5 rounded-xl transition-transform flex-shrink-0", stat.bgIcon)}
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                        >
                                            <span className={stat.color}>{stat.icon}</span>
                                        </motion.div>
                                    </div>
                                    {/* Mini progress bar at bottom */}
                                    <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn("h-full rounded-full")}
                                            style={{ background: stat.ringColor }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(stat.ring, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.5 + idx * 0.1 }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ━━━ Satisfaction Evaluation Banner ━━━━━━━━━━━━━━━━━━ */}
                    {satisfaction_evaluation?.show_card && (
                        <motion.div variants={itemVariants}>
                            <div
                                className={cn(
                                    "glass-card rounded-2xl p-5 sm:p-6 relative overflow-hidden border-2",
                                    satisfaction_evaluation.completed
                                        ? "border-emerald-300/50 dark:border-emerald-700/50"
                                        : "border-amber-300/50 dark:border-amber-700/50"
                                )}
                            >
                                {/* BG decoration */}
                                <div className={cn(
                                    "absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-12 translate-x-12 blur-3xl",
                                    satisfaction_evaluation.completed
                                        ? "bg-gradient-to-br from-emerald-200/30 to-teal-200/20 dark:from-emerald-800/15 dark:to-teal-800/10"
                                        : "bg-gradient-to-br from-amber-200/30 to-orange-200/20 dark:from-amber-800/15 dark:to-orange-800/10"
                                )} />

                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            className={cn(
                                                "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                                satisfaction_evaluation.completed
                                                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                                    : "bg-gradient-to-br from-amber-400 to-orange-500"
                                            )}
                                            whileHover={{ rotate: [0, -10, 10, 0] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {satisfaction_evaluation.completed ? (
                                                <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                            ) : (
                                                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                            )}
                                        </motion.div>
                                        <div>
                                            <h3
                                                className={cn(
                                                    "text-base sm:text-lg font-bold",
                                                    satisfaction_evaluation.completed
                                                        ? "text-emerald-700 dark:text-emerald-400"
                                                        : "text-amber-700 dark:text-amber-400"
                                                )}
                                            >
                                                {satisfaction_evaluation.completed
                                                    ? "ประเมินความพึงพอใจเสร็จสิ้น"
                                                    : "ประเมินความพึงพอใจ"}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                                {satisfaction_evaluation.completed
                                                    ? "ขอบคุณสำหรับการประเมินความพึงพอใจ"
                                                    : "กรุณาประเมินความพึงพอใจต่อระบบประเมิน"}
                                            </p>
                                            {!satisfaction_evaluation.completed && (
                                                <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold mt-1 flex items-center gap-1.5">
                                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-soft" />
                                                    รอการประเมิน
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {!satisfaction_evaluation.completed ? (
                                        <motion.button
                                            onClick={() =>
                                                router.visit(
                                                    `/satisfaction-evaluation/${satisfaction_evaluation.evaluation_id}?fiscal_year=${satisfaction_evaluation.fiscal_year}`
                                                )
                                            }
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto justify-center"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                                            เริ่มประเมิน
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    ) : (
                                        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            เสร็จสิ้น
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ━━━ Search & Filter Bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {(evaluations.target?.length ?? 0) > 0 && (
                        <motion.div variants={itemVariants}>
                            <div className="glass-card rounded-2xl p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <div className="flex-1 relative group">
                                        <Search
                                            size={16}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-500 transition-colors"
                                        />
                                        <input
                                            type="text"
                                            placeholder="ค้นหาชื่อผู้ถูกประเมิน..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all text-sm"
                                        />
                                    </div>

                                    {/* Filter */}
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-gray-400 hidden sm:block flex-shrink-0" />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value as any)}
                                            className="px-4 py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-600/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-400 transition-all text-sm min-w-[130px] cursor-pointer"
                                        >
                                            <option value="all">ทั้งหมด</option>
                                            <option value="pending">รอดำเนินการ</option>
                                            <option value="completed">เสร็จสิ้น</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ━━━ Step-Based Workflow ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <div className="space-y-8">
                        {/* ════ Step 1: Self-Evaluation ════════════════════ */}
                        {step1Categories.length > 0 && (
                            <motion.div variants={itemVariants} className="space-y-4">
                                {/* Step 1 Header */}
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <motion.div
                                        className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl gradient-primary text-white font-bold text-lg sm:text-xl shadow-lg shadow-violet-500/25 flex-shrink-0"
                                        whileHover={{ rotate: [0, -5, 5, 0] }}
                                    >
                                        1
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                                                ประเมินตนเอง
                                            </h2>
                                            {(() => {
                                                const selfCat = step1Categories[0];
                                                const isComplete = selfCat?.evaluatees[0]?.is_submitted ?? false;
                                                return (
                                                    <motion.span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold w-fit",
                                                            isComplete
                                                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                                        )}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
                                                    >
                                                        {isComplete ? <CheckCircle size={13} /> : <Clock size={13} />}
                                                        {isComplete ? "เสร็จแล้ว" : `${selfCat?.progress ?? 0}%`}
                                                    </motion.span>
                                                );
                                            })()}
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            ประเมินตนเองให้เสร็จก่อนเริ่มประเมินผู้อื่น
                                        </p>
                                    </div>
                                </div>

                                {/* Step 1 Card */}
                                <div className="ml-5 sm:ml-6 pl-5 sm:pl-6 border-l-2 border-violet-200 dark:border-violet-800/40">
                                    {step1Categories.map((category) => {
                                        const selfEval = category.evaluatees[0];
                                        const progress = selfEval?.progress ?? 0;
                                        const isComplete = selfEval?.is_submitted ?? false;

                                        return (
                                            <motion.div
                                                key={category.id}
                                                className={cn(
                                                    "glass-card rounded-2xl p-5 sm:p-6 lg:p-8 relative overflow-hidden group",
                                                    isComplete ? "ring-2 ring-emerald-400/30" : "ring-1 ring-violet-200/30 dark:ring-violet-800/20"
                                                )}
                                                whileHover={!isComplete ? cardHover : { scale: 1.005 }}
                                            >
                                                {/* Subtle accent bar */}
                                                <div
                                                    className={cn(
                                                        "absolute top-0 left-0 right-0 h-1 rounded-t-2xl",
                                                        isComplete
                                                            ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                                            : "gradient-primary"
                                                    )}
                                                />

                                                {/* Decorative background glow */}
                                                <div className={cn(
                                                    "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30",
                                                    isComplete
                                                        ? "bg-emerald-300 dark:bg-emerald-700"
                                                        : "bg-violet-300 dark:bg-violet-700"
                                                )} />

                                                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                                                    {/* Icon */}
                                                    <motion.div
                                                        className={cn(
                                                            "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform group-hover:scale-105",
                                                            isComplete
                                                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                                                : "bg-gradient-to-br from-violet-500 to-purple-700"
                                                        )}
                                                        whileHover={{ rotate: [0, -5, 5, 0] }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        {isComplete ? (
                                                            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                                        ) : (
                                                            <ClipboardCheck className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                                        )}
                                                    </motion.div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 w-full">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                                    {category.title}
                                                                </h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    {category.description}
                                                                </p>
                                                            </div>
                                                            <motion.span
                                                                className={cn(
                                                                    "text-2xl sm:text-3xl font-bold flex-shrink-0",
                                                                    isComplete
                                                                        ? "text-emerald-500"
                                                                        : "text-gradient-primary"
                                                                )}
                                                                initial={{ opacity: 0, scale: 0.5 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                transition={{ delay: 0.4, type: "spring" }}
                                                            >
                                                                {progress}%
                                                            </motion.span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="mb-4">
                                                            <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        isComplete
                                                                            ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                                            : "gradient-primary"
                                                                    )}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Action Row */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                                <Clock size={14} />
                                                                <span>
                                                                    {progress === 0
                                                                        ? "พร้อมเริ่มประเมิน"
                                                                        : isComplete
                                                                          ? "ประเมินเสร็จสมบูรณ์"
                                                                          : `ขั้นตอนที่ ${selfEval?.step_to_resume || 1}`}
                                                                </span>
                                                            </div>

                                                            <motion.button
                                                                onClick={() => handleCategoryClick(category)}
                                                                className={cn(
                                                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl",
                                                                    isComplete
                                                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-none hover:shadow-md"
                                                                        : "gradient-primary text-white shadow-violet-500/25"
                                                                )}
                                                                whileHover={{ scale: 1.04 }}
                                                                whileTap={{ scale: 0.97 }}
                                                            >
                                                                {isComplete ? (
                                                                    <>
                                                                        <CheckCircle size={16} />
                                                                        ประเมินเสร็จสิ้น
                                                                    </>
                                                                ) : progress > 0 ? (
                                                                    <>
                                                                        <Zap size={16} />
                                                                        ทำต่อ
                                                                        <ArrowRight size={14} />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles size={16} />
                                                                        เริ่มประเมิน
                                                                        <ArrowRight size={14} />
                                                                    </>
                                                                )}
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ════ Step Connector ════════════════════════════ */}
                        {step1Categories.length > 0 && step2Categories.length > 0 && (
                            <motion.div variants={itemVariants} className="flex items-center justify-center py-1">
                                <motion.div
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium shadow-sm",
                                        selfCompleted
                                            ? "glass-card text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30"
                                            : "glass-card text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30"
                                    )}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.6, type: "spring" }}
                                >
                                    {selfCompleted ? (
                                        <>
                                            <CheckCircle size={15} />
                                            <span>ประเมินตนเองเสร็จแล้ว &mdash; พร้อมประเมินผู้อื่น</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={15} />
                                            <span>กรุณาทำแบบประเมินตนเองให้เสร็จก่อน</span>
                                        </>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}

                        {/* ════ Step 2: Evaluate Others ═══════════════════ */}
                        {step2Categories.length > 0 && (
                            <motion.div
                                variants={itemVariants}
                                className="space-y-4 transition-opacity duration-500"
                            >
                                {/* Step 2 Header */}
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <motion.div
                                        className={cn(
                                            "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-bold text-lg sm:text-xl shadow-lg flex-shrink-0",
                                            selfCompleted || step1Categories.length === 0
                                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25"
                                                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shadow-none"
                                        )}
                                        whileHover={selfCompleted ? { rotate: [0, -5, 5, 0] } : {}}
                                    >
                                        {step1Categories.length > 0 ? 2 : 1}
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                                                ประเมินผู้อื่น
                                            </h2>
                                            <motion.span
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold w-fit",
                                                    step2Stats.completed === step2Stats.total && step2Stats.total > 0
                                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                                                        : "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                                )}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.4, type: "spring", stiffness: 500 }}
                                            >
                                                {step2Stats.completed === step2Stats.total && step2Stats.total > 0 ? (
                                                    <CheckCircle size={13} />
                                                ) : (
                                                    <Users size={13} />
                                                )}
                                                {step2Stats.completed}/{step2Stats.total} เสร็จแล้ว
                                            </motion.span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            ประเมินผู้อื่นที่ได้รับมอบหมาย แยกตามกลุ่มระดับตำแหน่ง
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 Category Cards */}
                                <div className="ml-5 sm:ml-6 pl-5 sm:pl-6 border-l-2 border-emerald-200/60 dark:border-emerald-800/30">
                                    <motion.div
                                        className="grid grid-cols-1 xl:grid-cols-2 gap-5"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {step2Categories.map((category) => {
                                            // Allow clicking even if self is not completed — user can view evaluatee list
                                            const isLocked = false;
                                            // ทั้งหมวด complete = ผู้ถูกประเมินทุกคนถูกกดส่งแล้ว
                                            const isAllComplete = category.total > 0 && category.completed >= category.total;
                                            const isExpanded = expandedCategories.has(category.id);
                                            const accent = getCategoryAccent(category.evaluationType);

                                            // Group evaluatees by angle
                                            const angleGroups = category.evaluatees.reduce(
                                                (groups, evaluatee) => {
                                                    const angle = evaluatee.angle || "unknown";
                                                    if (!groups[angle]) groups[angle] = [];
                                                    groups[angle].push(evaluatee);
                                                    return groups;
                                                },
                                                {} as Record<string, typeof category.evaluatees>
                                            );

                                            return (
                                                <motion.div
                                                    key={category.id}
                                                    variants={itemVariants}
                                                    className={cn(
                                                        "glass-card rounded-2xl relative overflow-hidden group",
                                                        isAllComplete ? "ring-2 ring-emerald-400/20" : "ring-1 ring-gray-200/50 dark:ring-gray-700/30",
                                                        isLocked ? "opacity-60 cursor-not-allowed" : ""
                                                    )}
                                                    whileHover={!isLocked && !isExpanded ? cardHover : {}}
                                                    layout
                                                >
                                                    {/* Top accent bar */}
                                                    <div
                                                        className={cn(
                                                            "h-1 w-full",
                                                            isAllComplete
                                                                ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                                                : `bg-gradient-to-r ${getCategoryGradient(category.evaluationType)}`
                                                        )}
                                                    />

                                                    <div className="p-5 sm:p-6">
                                                        {/* Category Header */}
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <motion.div
                                                                    className={cn(
                                                                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                                                                        category.bgColor
                                                                    )}
                                                                    whileHover={{ rotate: 5 }}
                                                                >
                                                                    {category.icon}
                                                                </motion.div>
                                                                <div className="min-w-0">
                                                                    <h3 className={cn("font-bold text-base", category.color)}>
                                                                        {category.title}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                                                        {category.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {isLocked ? (
                                                                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 flex-shrink-0 ml-2">
                                                                    <Lock size={16} />
                                                                </div>
                                                            ) : (
                                                                <div className="flex-shrink-0 ml-2">
                                                                    <motion.span
                                                                        className={cn(
                                                                            "text-2xl font-bold",
                                                                            isAllComplete
                                                                                ? "text-emerald-500"
                                                                                : category.color
                                                                        )}
                                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        transition={{ delay: 0.3, type: "spring" }}
                                                                    >
                                                                        {category.progress}%
                                                                    </motion.span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="mb-4">
                                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                                <span className="text-gray-500 dark:text-gray-400 font-medium">
                                                                    ความคืบหน้า
                                                                </span>
                                                                <span className="text-gray-600 dark:text-gray-300 font-semibold">
                                                                    {category.completed}/{category.total} รายการ
                                                                </span>
                                                            </div>
                                                            <div className="h-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        isAllComplete
                                                                            ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                                            : `bg-gradient-to-r ${getCategoryGradient(category.evaluationType)}`
                                                                    )}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${category.progress}%` }}
                                                                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Quick Info Row */}
                                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                                            <div className="text-center p-2 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl backdrop-blur-sm">
                                                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                                    {category.total}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">ทั้งหมด</div>
                                                            </div>
                                                            <div className="text-center p-2 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl backdrop-blur-sm">
                                                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                                    {category.completed}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">เสร็จแล้ว</div>
                                                            </div>
                                                            <div className="text-center p-2 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl backdrop-blur-sm">
                                                                <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                                                    {category.total - category.completed}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">เหลือ</div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-2">
                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCategoryExpansion(category.id);
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-gray-100/80 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-700/60 transition-all border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-sm"
                                                                whileTap={{ scale: 0.97 }}
                                                            >
                                                                <motion.span
                                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                >
                                                                    <ChevronDown size={15} />
                                                                </motion.span>
                                                                {isExpanded ? "ซ่อนรายชื่อ" : "ดูรายชื่อ"}
                                                            </motion.button>

                                                            <motion.button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCategoryClick(category);
                                                                }}
                                                                className={cn(
                                                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg",
                                                                    isAllComplete
                                                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-none"
                                                                        : `bg-gradient-to-r ${getCategoryGradient(category.evaluationType)} text-white`
                                                                )}
                                                                disabled={isLocked || (category.completed >= category.total)}
                                                                whileHover={!isLocked && !isAllComplete ? { scale: 1.03 } : {}}
                                                                whileTap={!isLocked && !isAllComplete ? { scale: 0.97 } : {}}
                                                            >
                                                                {isAllComplete ? (
                                                                    <>
                                                                        <CheckCircle size={15} />
                                                                        เสร็จสิ้น
                                                                    </>
                                                                ) : category.progress > 0 ? (
                                                                    <>
                                                                        <Zap size={15} />
                                                                        ประเมินต่อ
                                                                        <ArrowRight size={13} />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Sparkles size={15} />
                                                                        เริ่มประเมิน
                                                                    </>
                                                                )}
                                                            </motion.button>
                                                        </div>

                                                        {/* ── Expandable Evaluatee List ────────── */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-gray-700/40">
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                                                รายชื่อผู้ถูกประเมิน ({category.evaluatees.length} คน)
                                                                            </h4>
                                                                        </div>

                                                                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                                                                            {(() => {
                                                                                const ANGLE_ORDER: Record<string, number> = {
                                                                                    self: 0, top: 1, bottom: 2, left: 3, right: 4, unknown: 5,
                                                                                };
                                                                                const sortedEntries = Object.entries(angleGroups)
                                                                                    .sort(([a], [b]) => (ANGLE_ORDER[a] ?? 99) - (ANGLE_ORDER[b] ?? 99));
                                                                                return sortedEntries;
                                                                            })().map(([angle, evaluateesInAngle]) => {
                                                                                const ad = getAngleDisplay(angle);
                                                                                const angleCompleted = evaluateesInAngle.filter(
                                                                                    (e) => e.is_submitted ?? false
                                                                                ).length;

                                                                                return (
                                                                                    <div key={`${category.id}-angle-${angle}`} className="space-y-2">
                                                                                        {/* Angle Group Header */}
                                                                                        <div
                                                                                            className={cn(
                                                                                                "flex items-center justify-between px-3 py-2 rounded-xl backdrop-blur-sm",
                                                                                                ad.bgColor
                                                                                            )}
                                                                                        >
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={cn("w-1.5 h-1.5 rounded-full", ad.dotColor)} />
                                                                                                <span className={cn(ad.textColor)}>{ad.icon}</span>
                                                                                                <span className={cn("text-xs font-semibold", ad.textColor)}>
                                                                                                    {ad.label}
                                                                                                </span>
                                                                                                {ad.sublabel && (
                                                                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                                                        ({ad.sublabel})
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <span
                                                                                                className={cn(
                                                                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                                                                    angleCompleted === evaluateesInAngle.length
                                                                                                        ? "bg-emerald-200/80 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                                                                                                        : "bg-gray-200/80 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400"
                                                                                                )}
                                                                                            >
                                                                                                {angleCompleted}/{evaluateesInAngle.length}
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Evaluatees */}
                                                                                        <div className="space-y-1.5 ml-2">
                                                                                            {evaluateesInAngle.map((evaluatee, index) => {
                                                                                                const p = evaluatee.progress ?? 0;
                                                                                                const submitted = evaluatee.is_submitted ?? false;
                                                                                                const isDone = submitted;
                                                                                                const st = getEvaluateeStatus(p, submitted);

                                                                                                return (
                                                                                                    <motion.div
                                                                                                        key={`${category.id}-${evaluatee.id}-${index}`}
                                                                                                        custom={index}
                                                                                                        variants={evaluateeItemVariants}
                                                                                                        initial="hidden"
                                                                                                        animate="visible"
                                                                                                        className={cn(
                                                                                                            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group/item backdrop-blur-sm",
                                                                                                            isDone
                                                                                                                ? "bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                                                                                : "bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/70",
                                                                                                            "hover:shadow-sm"
                                                                                                        )}
                                                                                                        onClick={() =>
                                                                                                            handleEvaluateeClick(evaluatee, category.evaluationType)
                                                                                                        }
                                                                                                        whileHover={{ x: 2 }}
                                                                                                    >
                                                                                                        {/* Avatar */}
                                                                                                        <div className="flex-shrink-0 relative">
                                                                                                            {evaluatee.evaluatee_photo ? (
                                                                                                                <img
                                                                                                                    src={evaluatee.evaluatee_photo}
                                                                                                                    alt={evaluatee.evaluatee_name}
                                                                                                                    onError={(e) => {
                                                                                                                        (e.currentTarget as HTMLImageElement).src =
                                                                                                                            "/images/default.png";
                                                                                                                    }}
                                                                                                                    className={cn(
                                                                                                                        "w-9 h-9 rounded-xl object-cover border-2 transition-colors",
                                                                                                                        isDone
                                                                                                                            ? "border-emerald-300 dark:border-emerald-600"
                                                                                                                            : "border-gray-200 dark:border-gray-600 group-hover/item:border-violet-400"
                                                                                                                    )}
                                                                                                                />
                                                                                                            ) : (
                                                                                                                <div
                                                                                                                    className={cn(
                                                                                                                        "w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs",
                                                                                                                        isDone
                                                                                                                            ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                                                                                                            : "bg-gradient-to-br from-violet-500 to-purple-600"
                                                                                                                    )}
                                                                                                                >
                                                                                                                    {evaluatee.evaluatee_name.charAt(0).toUpperCase()}
                                                                                                                </div>
                                                                                                            )}
                                                                                                            {isDone && (
                                                                                                                <motion.div
                                                                                                                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800"
                                                                                                                    initial={{ scale: 0 }}
                                                                                                                    animate={{ scale: 1 }}
                                                                                                                    transition={{ type: "spring", stiffness: 500, delay: index * 0.05 }}
                                                                                                                >
                                                                                                                    <CheckCircle size={10} className="text-white" />
                                                                                                                </motion.div>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {/* Name & Info */}
                                                                                                        <div className="flex-1 min-w-0">
                                                                                                            <div className="flex items-center gap-1.5">
                                                                                                                <span
                                                                                                                    className={cn(
                                                                                                                        "font-medium text-sm truncate transition-colors",
                                                                                                                        isDone
                                                                                                                            ? "text-gray-500 dark:text-gray-400"
                                                                                                                            : "text-gray-900 dark:text-white group-hover/item:text-violet-600 dark:group-hover/item:text-violet-400"
                                                                                                                    )}
                                                                                                                >
                                                                                                                    {evaluatee.evaluatee_name}
                                                                                                                </span>
                                                                                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                                                                                                    ระดับ {evaluatee.grade}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        </div>

                                                                                                        {/* Progress + Action */}
                                                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                                                            {/* Mini progress indicator */}
                                                                                                            <div className="hidden sm:flex items-center gap-1.5">
                                                                                                                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                                                                    <motion.div
                                                                                                                        className={cn(
                                                                                                                            "h-full rounded-full",
                                                                                                                            isDone
                                                                                                                                ? "bg-emerald-400"
                                                                                                                                : p > 0
                                                                                                                                  ? "bg-amber-400"
                                                                                                                                  : "bg-gray-300"
                                                                                                                        )}
                                                                                                                        initial={{ width: 0 }}
                                                                                                                        animate={{ width: `${p}%` }}
                                                                                                                        transition={{ duration: 0.6, delay: index * 0.05 }}
                                                                                                                    />
                                                                                                                </div>
                                                                                                                <span
                                                                                                                    className={cn(
                                                                                                                        "text-xs font-bold tabular-nums w-8 text-right",
                                                                                                                        isDone
                                                                                                                            ? "text-emerald-500"
                                                                                                                            : p > 0
                                                                                                                              ? "text-amber-500"
                                                                                                                              : "text-gray-400"
                                                                                                                    )}
                                                                                                                >
                                                                                                                    {p}%
                                                                                                                </span>
                                                                                                            </div>

                                                                                                            {/* Action indicator */}
                                                                                                            {isDone ? (
                                                                                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:hidden">
                                                                                                                    {p}%
                                                                                                                </span>
                                                                                                            ) : p > 0 ? (
                                                                                                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 sm:hidden flex items-center gap-0.5">
                                                                                                                    <Zap size={10} />
                                                                                                                    {p}%
                                                                                                                </span>
                                                                                                            ) : (
                                                                                                                <span className="text-[10px] text-gray-400 sm:hidden">
                                                                                                                    เริ่ม
                                                                                                                </span>
                                                                                                            )}

                                                                                                            <ArrowRight
                                                                                                                size={14}
                                                                                                                className={cn(
                                                                                                                    "transition-all",
                                                                                                                    isDone
                                                                                                                        ? "text-emerald-400"
                                                                                                                        : "text-gray-300 dark:text-gray-600 group-hover/item:text-violet-500 group-hover/item:translate-x-0.5"
                                                                                                                )}
                                                                                                            />
                                                                                                        </div>
                                                                                                    </motion.div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* ━━━ Empty State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {filteredCategories.length === 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="glass-card rounded-2xl p-12 sm:p-16 text-center"
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto mb-6 bg-violet-100 dark:bg-violet-900/30 rounded-3xl flex items-center justify-center"
                                animate={{ rotate: [0, -5, 5, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                            >
                                <Search size={40} className="text-violet-400" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                ไม่พบรายการที่ค้นหา
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-md mx-auto">
                                ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูรายการอื่น
                            </p>
                            <motion.button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterStatus("all");
                                }}
                                className="gradient-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-violet-500/25 hover:shadow-xl transition-shadow"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                รีเซ็ตตัวกรอง
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ━━━ No Evaluations At All (initial empty) ━━━━━━━━━━ */}
                    {stats.total === 0 && filteredCategories.length === 0 && searchTerm === "" && filterStatus === "all" && (
                        <motion.div
                            variants={itemVariants}
                            className="glass-card rounded-2xl p-12 sm:p-16 text-center"
                        >
                            <motion.div
                                className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ClipboardCheck size={48} className="text-violet-400" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                ยังไม่มีแบบประเมิน
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                                ยังไม่มีแบบประเมินที่ได้รับมอบหมายในปีงบประมาณนี้ กรุณาติดต่อผู้ดูแลระบบ
                            </p>
                        </motion.div>
                    )}

                    {/* ━━━ Footer Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {stats.total > 0 && (
                        <motion.div variants={itemVariants}>
                            <div className="glass-card rounded-2xl p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                                        <span className="flex items-center gap-1.5">
                                            <motion.div
                                                className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                            />
                                            เสร็จสิ้น {stats.completed} รายการ
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <motion.div
                                                className="w-2.5 h-2.5 rounded-full bg-amber-500"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 0.5 }}
                                            />
                                            รอดำเนินการ {stats.pending} รายการ
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <motion.div
                                                className="w-2.5 h-2.5 rounded-full bg-violet-500"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 1 }}
                                            />
                                            ทั้งหมด {stats.total} รายการ
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                        <CalendarDays size={12} />
                                        ปีงบประมาณ {Number(selected_year) + 543}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </MainLayout>
    );
}
