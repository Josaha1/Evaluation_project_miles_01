import { usePage, router } from "@inertiajs/react";
import {
    Users,
    Download,
    ListChecks,
    Building2,
    Briefcase,
    UserCog,
    Shield,
    KeyRound,
    Globe,
    CheckCircle,
    ClipboardList,
    FileText,
    TrendingUp,
    Calendar,
    ChevronRight,
    Sparkles,
    LayoutDashboard,
    Activity,
    Target,
    Zap,
    BarChart3,
    Upload,
    RotateCcw,
} from "lucide-react";
import MainLayout from "@/Layouts/MainLayout";
import FiscalYearSelector from "@/Components/FiscalYearSelector";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type Highcharts from "highcharts";

const LazyHighchartsReact = lazy(() =>
    Promise.all([
        import("highcharts"),
        import("highcharts-react-official"),
    ]).then(([hc, hcReact]) => ({
        default: (props: any) => <hcReact.default highcharts={hc.default} {...props} />,
    }))
);

// ---------------------------------------------------------------------------
// Types – kept identical to the original
// ---------------------------------------------------------------------------
interface GradeStat {
    label: string;
    color: string;
    evaluatees: number;
}

interface Stats {
    totalUsers: number;
    totalAdmins: number;
    totalAssignments: number;
    uniqueEvaluators: number;
    uniqueEvaluatees: number;
    completedEvaluators: number;
    completionRate: number;
    publishedEvaluations: number;
    gradeStats: GradeStat[];
    angleBreakdown: Record<string, number>;
    externalCodeCount: number;
    externalUsedCount: number;
    externalOrgCount: number;
    externalOrgResults: {
        org_id: number;
        org_name: string;
        org_code: string;
        evaluatee_count: number;
        evaluator_count: number;
        total_answers: number;
        avg_score: number | null;
    }[];
    fiscalYear: number;
    fiscalYearBE: number;
    availableFiscalYears: number[];
}

interface PageProps {
    stats: Stats;
    [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Angle labels (Thai)
// ---------------------------------------------------------------------------
const angleLabels: Record<string, string> = {
    top: "ผู้บังคับบัญชา (บน)",
    bottom: "ผู้ใต้บังคับบัญชา (ล่าง)",
    left: "เพื่อนร่วมงาน (ซ้าย)",
    right: "องค์กรภายนอก (ขวา)",
    self: "ตนเอง",
};

const angleColors: Record<string, string> = {
    top: "#7C3AED",
    bottom: "#10B981",
    left: "#3B82F6",
    right: "#F97316",
    self: "#EC4899",
};

// ---------------------------------------------------------------------------
// Grade color mapping for left-border style cards
// ---------------------------------------------------------------------------
const gradeColorMap: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    rose: {
        border: "border-l-rose-500",
        bg: "bg-rose-50/60 dark:bg-rose-900/15",
        text: "text-rose-700 dark:text-rose-300",
        icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
    amber: {
        border: "border-l-amber-500",
        bg: "bg-amber-50/60 dark:bg-amber-900/15",
        text: "text-amber-700 dark:text-amber-300",
        icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    cyan: {
        border: "border-l-cyan-500",
        bg: "bg-cyan-50/60 dark:bg-cyan-900/15",
        text: "text-cyan-700 dark:text-cyan-300",
        icon: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    },
};

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function useCountUp(target: number, duration = 1200) {
    const [value, setValue] = useState(0);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const startTime = performance.now();
        const startVal = 0;

        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(startVal + (target - startVal) * eased));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            }
        }

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target, duration]);

    return value;
}

// ---------------------------------------------------------------------------
// Circular Progress Ring (SVG)
// ---------------------------------------------------------------------------
function CircularProgress({
    value,
    size = 80,
    strokeWidth = 7,
}: {
    value: number;
    size?: number;
    strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-gray-200 dark:text-gray-700"
            />
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
            />
            <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Stagger animation variants
// ---------------------------------------------------------------------------
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const cardHover = {
    y: -4,
    transition: { duration: 0.25, ease: "easeOut" },
};

// ---------------------------------------------------------------------------
// Section header component
// ---------------------------------------------------------------------------
function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    gradient,
}: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    gradient: string;
}) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2.5 rounded-xl", gradient)}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// KPI Card component
// ---------------------------------------------------------------------------
function KpiCard({
    icon: Icon,
    label,
    value,
    subtitle,
    gradientFrom,
    gradientTo,
    index,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
    subtitle: string;
    gradientFrom: string;
    gradientTo: string;
    index: number;
}) {
    const animatedValue = useCountUp(value);

    return (
        <motion.div
            variants={itemVariants}
            whileHover={cardHover}
            className="glass-card rounded-2xl p-5 relative overflow-hidden group cursor-default"
        >
            {/* Gradient blob background */}
            <div
                className={cn(
                    "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-30",
                    `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
                )}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div
                        className={cn(
                            "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                            gradientFrom,
                            gradientTo
                        )}
                    >
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                        <Activity className="w-3 h-3" />
                        Live
                    </div>
                </div>

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {animatedValue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{subtitle}</p>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Completion Rate Card (with circular ring)
// ---------------------------------------------------------------------------
function CompletionRateCard({
    completionRate,
    completed,
    total,
}: {
    completionRate: number;
    completed: number;
    total: number;
}) {
    const animatedRate = useCountUp(completionRate);

    return (
        <motion.div
            variants={itemVariants}
            whileHover={cardHover}
            className="glass-card rounded-2xl p-5 relative overflow-hidden group cursor-default"
        >
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl bg-gradient-to-br from-emerald-400 to-teal-500 transition-opacity duration-500 group-hover:opacity-30" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Rate
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <CircularProgress value={completionRate} size={72} strokeWidth={6} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-base font-bold text-gray-800 dark:text-white">
                                {animatedRate}%
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            อัตราการทำแบบประเมิน
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {completed}/{total} คน
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Action card component
// ---------------------------------------------------------------------------
function ActionCard({
    title,
    description,
    icon,
    href,
    gradient,
    badge,
}: {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    gradient: string;
    badge?: string;
}) {
    return (
        <motion.a
            href={href}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.25 } }}
            className="group glass-card rounded-2xl p-5 block relative overflow-hidden"
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10" />

            {badge && (
                <span className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-[11px] font-bold ring-1 ring-violet-200 dark:ring-violet-700/50">
                    {badge}
                </span>
            )}

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl", gradient)}>{icon}</div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-violet-500 dark:group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    {title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {description}
                </p>
            </div>
        </motion.a>
    );
}

// ---------------------------------------------------------------------------
// Angle Breakdown Chart (Highcharts donut)
// ---------------------------------------------------------------------------
function AngleBreakdownChart({
    angleBreakdown,
    totalAssignments,
}: {
    angleBreakdown: Record<string, number>;
    totalAssignments: number;
}) {
    const [isDark, setIsDark] = useState(
        document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => observer.disconnect();
    }, []);

    const chartData = Object.entries(angleBreakdown).map(([angle, count]) => ({
        name: angleLabels[angle] || angle,
        y: count,
        color: angleColors[angle] || "#6B7280",
    }));

    const options: Highcharts.Options = {
        chart: {
            type: "pie",
            backgroundColor: "transparent",
            height: 260,
            style: { fontFamily: "inherit" },
        },
        title: { text: undefined },
        credits: { enabled: false },
        tooltip: {
            pointFormat: "<b>{point.y}</b> รายการ ({point.percentage:.1f}%)",
            style: {
                fontSize: "13px",
                fontFamily: "inherit",
            },
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
        },
        plotOptions: {
            pie: {
                innerSize: "62%",
                borderWidth: 3,
                borderColor: isDark ? "#1f2937" : "#ffffff",
                dataLabels: {
                    enabled: true,
                    format: '<span style="font-size:11px;font-weight:600">{point.name}</span><br/><span style="font-size:13px;font-weight:700;color:{point.color}">{point.y}</span>',
                    distance: 15,
                    style: {
                        color: isDark ? "#d1d5db" : "#374151",
                        textOutline: "none",
                        fontFamily: "inherit",
                    },
                },
                states: {
                    hover: {
                        halo: { size: 8, opacity: 0.25 },
                        brightness: 0.05,
                    },
                },
                animation: { duration: 1200 },
            },
        },
        series: [
            {
                type: "pie",
                name: "มุมประเมิน",
                data: chartData,
            },
        ],
    };

    return (
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl" />}>
            <LazyHighchartsReact options={options} />
        </Suspense>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdminDashboard() {
    const { stats } = usePage<PageProps>().props;

    const handleFiscalYearChange = (year: number) => {
        router.get(
            route("admindashboard"),
            { fiscal_year: year },
            { preserveState: true, preserveScroll: true }
        );
    };

    // ---- Action definitions (unchanged routes) ----
    const actions = [
        {
            title: "สร้างแบบประเมินใหม่",
            description: "กำหนดแบบประเมินจากหมวด ด้าน และคำถาม",
            icon: <ListChecks className="w-5 h-5 text-white" />,
            href: route("evaluations.index"),
            gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
        },
        {
            title: "รายงาน & ส่งออกข้อมูล",
            description: "ดูผลประเมินและดาวน์โหลดข้อมูล",
            icon: <Download className="w-5 h-5 text-white" />,
            href: route("admin.evaluation-report.index"),
            gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
        },
        {
            title: "จัดการสมาชิก",
            description: "เพิ่ม ลบ แก้ไขสมาชิกในระบบ",
            icon: <Users className="w-5 h-5 text-white" />,
            href: route("admin.users.index"),
            gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
        },
        {
            title: "จัดการผู้ประเมิน/ผู้ถูกประเมิน",
            description: "บริหารความสัมพันธ์การประเมิน",
            icon: <Target className="w-5 h-5 text-white" />,
            href: route("assignments.index"),
            gradient: "bg-gradient-to-br from-orange-500 to-amber-600",
        },
        {
            title: "ระบบ Logs และข้อมูลระบบ",
            description: "ดู error log, recent activity, system info",
            icon: <FileText className="w-5 h-5 text-white" />,
            href: route("admin.logs.index"),
            gradient: "bg-gradient-to-br from-slate-600 to-gray-700",
        },
        {
            title: "รีเซ็ตการประเมิน",
            description: "ล้างคำตอบ + ปลดล็อกแบบประเมินรายบุคคล (มี audit log)",
            icon: <RotateCcw className="w-5 h-5 text-white" />,
            href: route("admin.reset-evaluations.index"),
            gradient: "bg-gradient-to-br from-rose-500 to-red-600",
        },
    ];

    const orgActions = [
        {
            title: "จัดการสายงาน",
            description: "เพิ่ม แก้ไข ลบสายงาน (Division)",
            icon: <Building2 className="w-5 h-5 text-white" />,
            href: route("admin.divisions.index"),
            gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
        },
        {
            title: "จัดการหน่วยงาน",
            description: "เพิ่ม แก้ไข ลบหน่วยงาน (Department)",
            icon: <Briefcase className="w-5 h-5 text-white" />,
            href: route("admin.departments.index"),
            gradient: "bg-gradient-to-br from-violet-500 to-purple-600",
        },
        {
            title: "จัดการตำแหน่ง",
            description: "เพิ่ม แก้ไข ลบตำแหน่ง (Position)",
            icon: <UserCog className="w-5 h-5 text-white" />,
            href: route("admin.positions.index"),
            gradient: "bg-gradient-to-br from-amber-500 to-yellow-600",
        },
        {
            title: "จัดการฝ่าย",
            description: "เพิ่ม แก้ไข ลบฝ่าย (Faction)",
            icon: <Shield className="w-5 h-5 text-white" />,
            href: route("admin.factions.index"),
            gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
        },
    ];

    // ─── External evaluation flow (1 → 2 → 3 → 4) ─────────────────────────────
    // Workflow: setup groups → bulk-import → view stakeholder details → manage codes
    const externalActions = [
        {
            title: "จัดการกลุ่ม Stakeholder",
            description: "กลุ่มผู้ประเมินภายนอก (เช่น คู่ค้า, ลูกค้า) — metadata ระดับกลุ่ม",
            icon: <Globe className="w-5 h-5 text-white" />,
            href: route("admin.external-organizations.index"),
            gradient: "bg-gradient-to-br from-teal-500 to-cyan-600",
            badge: "1",
        },
        {
            title: "นำเข้า Stakeholder Excel",
            description: "Bulk-สร้าง Access Code องศาขวา จากไฟล์ template",
            icon: <Upload className="w-5 h-5 text-white" />,
            href: route("admin.stakeholders.import"),
            gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
            badge: "2",
        },
        {
            title: "รายชื่อ Stakeholders",
            description: "ดู/แก้/ลบรายบริษัท · ติดต่อ · เชื่อม session",
            icon: <Users className="w-5 h-5 text-white" />,
            href: route("admin.stakeholders.index"),
            gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
            badge: "3",
        },
        {
            title: "จัดการ Access Codes",
            description: "ดู/แก้/พิมพ์ QR Code · Access Code ทั้งหมด",
            icon: <KeyRound className="w-5 h-5 text-white" />,
            href: route("admin.access-codes.index"),
            gradient: "bg-gradient-to-br from-orange-500 to-red-500",
            badge: "4",
        },
    ];

    // Total evaluatees for grade progress bars
    const totalEvaluatees = stats?.gradeStats?.reduce((s, g) => s + g.evaluatees, 0) || 1;

    return (
        <MainLayout title="Admin Dashboard">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* ============================================================
                    PREMIUM HEADER
                ============================================================ */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative rounded-2xl gradient-hero p-6 sm:p-8"
                >
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl">
                                <LayoutDashboard className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                                        แดชบอร์ดผู้ดูแลระบบ
                                    </h1>
                                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                                        <Sparkles className="w-3 h-3" />
                                        Admin
                                    </span>
                                </div>
                                <p className="text-violet-200 text-sm">
                                    ระบบประเมินผลการปฏิบัติงาน 360 องศา - กนอ.
                                </p>
                            </div>
                        </div>

                        {/* Fiscal Year Selector */}
                        <FiscalYearSelector
                            value={stats?.fiscalYear ?? ""}
                            years={stats?.availableFiscalYears || []}
                            onChange={(year) => handleFiscalYearChange(Number(year))}
                            variant="header"
                        />
                    </div>
                </motion.div>

                {stats && (
                    <>
                        {/* ============================================================
                            KPI CARDS
                        ============================================================ */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            <KpiCard
                                icon={Users}
                                label="ผู้ใช้ทั้งหมด"
                                value={stats.totalUsers}
                                subtitle={`ผู้ดูแล ${stats.totalAdmins} คน`}
                                gradientFrom="from-violet-500"
                                gradientTo="to-purple-600"
                                index={0}
                            />
                            <KpiCard
                                icon={ClipboardList}
                                label="การมอบหมาย"
                                value={stats.totalAssignments}
                                subtitle={`ผู้ประเมิน ${stats.uniqueEvaluators} คน`}
                                gradientFrom="from-violet-500"
                                gradientTo="to-purple-600"
                                index={1}
                            />
                            <CompletionRateCard
                                completionRate={stats.completionRate}
                                completed={stats.completedEvaluators}
                                total={stats.uniqueEvaluators}
                            />
                            <KpiCard
                                icon={FileText}
                                label="แบบประเมินที่เผยแพร่"
                                value={stats.publishedEvaluations}
                                subtitle={`ผู้ถูกประเมิน ${stats.uniqueEvaluatees} คน`}
                                gradientFrom="from-purple-500"
                                gradientTo="to-fuchsia-600"
                                index={3}
                            />
                        </motion.div>

                        {/* ============================================================
                            GRADE BREAKDOWN + ANGLE CHART
                        ============================================================ */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                        >
                            {/* Grade Breakdown */}
                            <motion.div
                                variants={itemVariants}
                                className="glass-card rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                            ผู้ถูกประเมินตามกลุ่มระดับ
                                        </h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            จำแนกตามระดับตำแหน่ง
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {stats.gradeStats.map((g, i) => {
                                        const colors = gradeColorMap[g.color] || gradeColorMap.cyan;
                                        const pct =
                                            totalEvaluatees > 0
                                                ? Math.round(
                                                      (g.evaluatees / totalEvaluatees) * 100
                                                  )
                                                : 0;

                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    delay: 0.4 + i * 0.12,
                                                    duration: 0.5,
                                                }}
                                                className={cn(
                                                    "rounded-xl p-4 border-l-4",
                                                    colors.border,
                                                    colors.bg
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span
                                                        className={cn(
                                                            "text-sm font-semibold",
                                                            colors.text
                                                        )}
                                                    >
                                                        {g.label}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-lg font-bold",
                                                            colors.text
                                                        )}
                                                    >
                                                        {g.evaluatees}{" "}
                                                        <span className="text-xs font-medium opacity-70">
                                                            คน
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200/60 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                                    <motion.div
                                                        className={cn(
                                                            "h-2 rounded-full",
                                                            g.color === "rose"
                                                                ? "bg-gradient-to-r from-rose-400 to-rose-500"
                                                                : g.color === "amber"
                                                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                                                : "bg-gradient-to-r from-cyan-400 to-cyan-500"
                                                        )}
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${pct}%`,
                                                        }}
                                                        transition={{
                                                            delay: 0.6 + i * 0.15,
                                                            duration: 0.8,
                                                            ease: "easeOut",
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                                    {pct}% ของทั้งหมด
                                                </p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* Angle Breakdown (Highcharts Donut) */}
                            <motion.div
                                variants={itemVariants}
                                className="glass-card rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl gradient-primary">
                                        <Activity className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                            การมอบหมายตามมุมประเมิน
                                        </h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            สัดส่วนมุมมองการประเมิน 360 องศา
                                        </p>
                                    </div>
                                </div>

                                <AngleBreakdownChart
                                    angleBreakdown={stats.angleBreakdown}
                                    totalAssignments={stats.totalAssignments}
                                />

                                {/* External stats footer */}
                                {stats.externalOrgCount > 0 && (
                                    <div className="mt-2 pt-3 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-teal-500" />
                                            <span>
                                                องค์กรภายนอก{" "}
                                                <strong className="text-gray-700 dark:text-gray-300">
                                                    {stats.externalOrgCount}
                                                </strong>{" "}
                                                แห่ง
                                            </span>
                                        </div>
                                        <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                                        <div className="flex items-center gap-1.5">
                                            <KeyRound className="w-3.5 h-3.5 text-orange-500" />
                                            <span>
                                                Access Codes{" "}
                                                <strong className="text-gray-700 dark:text-gray-300">
                                                    {stats.externalUsedCount}/
                                                    {stats.externalCodeCount}
                                                </strong>{" "}
                                                ใช้แล้ว
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>

                        {/* ============================================================
                            ADMIN QUICK ACTIONS
                        ============================================================ */}
                        <div>
                            <SectionHeader
                                icon={Zap}
                                title="เมนูสำหรับผู้ดูแลระบบ"
                                subtitle="เครื่องมือหลักในการจัดการระบบประเมิน"
                                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                            />
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {actions.map((action, i) => (
                                    <ActionCard key={i} {...action} />
                                ))}
                            </motion.div>
                        </div>

                        {/* ============================================================
                            ORGANIZATION STRUCTURE
                        ============================================================ */}
                        <div>
                            <SectionHeader
                                icon={Building2}
                                title="การจัดการโครงสร้างองค์กร"
                                subtitle="จัดการสายงาน หน่วยงาน ตำแหน่ง และฝ่าย"
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                            />
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {orgActions.map((action, i) => (
                                    <ActionCard key={i} {...action} />
                                ))}
                            </motion.div>
                        </div>

                        {/* ============================================================
                            EXTERNAL SYSTEM
                        ============================================================ */}
                        <div>
                            <SectionHeader
                                icon={Globe}
                                title="ระบบประเมินภายนอก (องศาขวา)"
                                subtitle="ตั้งค่าองค์กร → นำเข้า Stakeholder จาก Excel → จัดการ QR/Access Codes"
                                gradient="bg-gradient-to-br from-orange-500 to-amber-600"
                            />
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                            >
                                {externalActions.map((action, i) => (
                                    <ActionCard key={i} {...action} />
                                ))}

                                {/* External Stats Summary Cards */}
                                <motion.div
                                    variants={itemVariants}
                                    className="glass-card rounded-2xl p-5 flex flex-col justify-center"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            สถานะระบบภายนอก
                                        </span>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                องค์กรภายนอก
                                            </span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                                                {stats.externalOrgCount}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Codes ที่ใช้แล้ว
                                            </span>
                                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                                                {stats.externalUsedCount}/
                                                {stats.externalCodeCount}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200/60 dark:bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                                            <motion.div
                                                className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-500"
                                                initial={{ width: 0 }}
                                                whileInView={{
                                                    width: `${
                                                        stats.externalCodeCount > 0
                                                            ? Math.round(
                                                                  (stats.externalUsedCount /
                                                                      stats.externalCodeCount) *
                                                                      100
                                                              )
                                                            : 0
                                                    }%`,
                                                }}
                                                viewport={{ once: true }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: 0.3,
                                                    ease: "easeOut",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    className="glass-card rounded-2xl p-5 flex items-center justify-center"
                                >
                                    <div className="text-center">
                                        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 mb-3">
                                            <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            ปีงบประมาณ พ.ศ.{" "}
                                            <span className="font-bold text-violet-600 dark:text-violet-400">
                                                {Number(stats.fiscalYear) + 543}
                                            </span>
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* ============================================================
                            EXTERNAL ORG EVALUATION RESULTS
                        ============================================================ */}
                        {stats.externalOrgResults && stats.externalOrgResults.length > 0 && (
                            <div>
                                <SectionHeader
                                    icon={BarChart3}
                                    title="ผลการประเมินจากองค์กรภายนอก (องศาขวา)"
                                    subtitle={`คะแนนเฉลี่ยแยกตามองค์กร — ปีงบประมาณ พ.ศ. ${Number(stats.fiscalYear) + 543}`}
                                    gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
                                />
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.2 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                >
                                    {stats.externalOrgResults.map((org, i) => (
                                        <motion.div key={org.org_id} variants={itemVariants} className="glass-card rounded-2xl p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                                                        <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{org.org_name}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">รหัส: {org.org_code}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                                                        {org.avg_score ? Number(org.avg_score).toFixed(2) : '-'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">คะแนนเฉลี่ย</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg py-2">
                                                    <div className="text-sm font-bold text-gray-800 dark:text-white">{org.evaluator_count}</div>
                                                    <div className="text-[10px] text-gray-500">ผู้ประเมิน</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg py-2">
                                                    <div className="text-sm font-bold text-gray-800 dark:text-white">{org.evaluatee_count}</div>
                                                    <div className="text-[10px] text-gray-500">ผู้ถูกประเมิน</div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg py-2">
                                                    <div className="text-sm font-bold text-gray-800 dark:text-white">{org.total_answers}</div>
                                                    <div className="text-[10px] text-gray-500">คำตอบ</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </MainLayout>
    );
}
