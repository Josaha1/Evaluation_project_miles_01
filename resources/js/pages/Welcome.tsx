import MainLayout from "@/Layouts/MainLayout";
import { cn } from "@/lib/utils";
import { Link, usePage } from "@inertiajs/react";
import { motion, useInView } from "framer-motion";
import {
    Shield,
    Users,
    BarChart3,
    Target,
    Lock,
    TrendingUp,
    ChevronRight,
    Sparkles,
    ArrowRight,
    CheckCircle,
    Zap,
    Eye,
} from "lucide-react";
import { useRef, useEffect, useState, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                              */
/* ------------------------------------------------------------------ */
function useCounter(end: number, duration = 2000, startOnView = true) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-50px" });

    useEffect(() => {
        if (!startOnView || !inView) return;
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration, inView, startOnView]);

    return { count, ref };
}

/* ------------------------------------------------------------------ */
/*  Scroll-reveal wrapper                                              */
/* ------------------------------------------------------------------ */
function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Floating hexagon SVG                                               */
/* ------------------------------------------------------------------ */
function Hexagon({
    size = 60,
    className,
    style,
}: {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
            style={style}
        >
            <polygon
                points="50,2 93,25 93,75 50,98 7,75 7,25"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  360 degree animated ring                                           */
/* ------------------------------------------------------------------ */
function AnimatedRing() {
    return (
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 mx-auto">
            {/* Outer rotating ring */}
            <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                        <linearGradient
                            id="ringGrad"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="#7C3AED" />
                            <stop offset="50%" stopColor="#10B981" />
                            <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="url(#ringGrad)"
                        strokeWidth="2"
                        strokeDasharray="8 6"
                        opacity="0.6"
                    />
                </svg>
            </motion.div>

            {/* Middle pulsing ring */}
            <motion.div
                className="absolute inset-4 sm:inset-6 lg:inset-8"
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        fill="none"
                        stroke="#7C3AED"
                        strokeWidth="1.5"
                        strokeDasharray="4 12"
                        opacity="0.3"
                    />
                </svg>
            </motion.div>

            {/* Inner glow circle */}
            <div className="absolute inset-10 sm:inset-14 lg:inset-16 rounded-full bg-gradient-to-br from-violet-600/10 via-purple-500/5 to-emerald-500/10 dark:from-violet-600/20 dark:via-purple-500/10 dark:to-emerald-500/20 backdrop-blur-sm" />

            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
                    className="text-center"
                >
                    <span className="text-5xl sm:text-6xl lg:text-7xl font-black text-gradient-primary leading-none">
                        360°
                    </span>
                    <div className="mt-2 text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                        Evaluation
                    </div>
                </motion.div>
            </div>

            {/* Orbiting dots */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                        background:
                            i % 3 === 0
                                ? "#7C3AED"
                                : i % 3 === 1
                                  ? "#10B981"
                                  : "#F97316",
                        top: "50%",
                        left: "50%",
                    }}
                    animate={{
                        x: [
                            Math.cos((i * Math.PI) / 3) * 120,
                            Math.cos((i * Math.PI) / 3 + Math.PI * 2) * 120,
                        ],
                        y: [
                            Math.sin((i * Math.PI) / 3) * 120,
                            Math.sin((i * Math.PI) / 3 + Math.PI * 2) * 120,
                        ],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.5,
                    }}
                />
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Feature card component                                             */
/* ------------------------------------------------------------------ */
function FeatureCard({
    icon,
    title,
    description,
    gradient,
    delay = 0,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    gradient: string;
    delay?: number;
}) {
    return (
        <Reveal delay={delay}>
            <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group relative glass-card rounded-2xl p-6 sm:p-8 overflow-hidden cursor-default h-full"
            >
                {/* Hover gradient overlay */}
                <div
                    className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl",
                        gradient
                    )}
                />

                {/* Content */}
                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                        {icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Corner decoration */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-violet-500/5 dark:bg-violet-500/10 group-hover:bg-violet-500/10 dark:group-hover:bg-violet-500/20 transition-colors duration-500" />
            </motion.div>
        </Reveal>
    );
}

/* ------------------------------------------------------------------ */
/*  Stat item                                                          */
/* ------------------------------------------------------------------ */
function StatItem({
    value,
    suffix,
    label,
    delay,
}: {
    value: number;
    suffix: string;
    label: string;
    delay: number;
}) {
    const { count, ref } = useCounter(value, 2000);

    return (
        <Reveal delay={delay}>
            <div className="text-center">
                <span
                    ref={ref}
                    className="text-4xl sm:text-5xl font-black text-gradient-primary"
                >
                    {count.toLocaleString()}
                    {suffix}
                </span>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                    {label}
                </p>
            </div>
        </Reveal>
    );
}

/* ================================================================== */
/*  MAIN PAGE                                                          */
/* ================================================================== */
export default function Welcome() {
    const { system } = usePage<{ system?: { fiscal_year_be?: number } }>().props;
    const fiscalYearBE = system?.fiscal_year_be || (new Date().getFullYear() + 543);

    return (
        <MainLayout title="ระบบประเมิน 360 องศา กนอ.">
            <div className="relative overflow-hidden">
                {/* ============================================= */}
                {/*  HERO SECTION                                  */}
                {/* ============================================= */}
                <section className="relative min-h-[90vh] flex items-center gradient-primary-soft overflow-hidden">
                    {/* Background floating hexagons */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <Hexagon
                            size={120}
                            className="absolute top-[10%] left-[5%] text-violet-300/20 dark:text-violet-500/10 animate-float"
                        />
                        <Hexagon
                            size={80}
                            className="absolute top-[60%] left-[15%] text-emerald-300/20 dark:text-emerald-500/10 animate-float-delayed"
                        />
                        <Hexagon
                            size={100}
                            className="absolute top-[20%] right-[8%] text-orange-300/20 dark:text-orange-500/10 animate-float"
                        />
                        <Hexagon
                            size={60}
                            className="absolute bottom-[15%] right-[20%] text-violet-300/15 dark:text-violet-500/10 animate-float-delayed"
                        />
                        <Hexagon
                            size={50}
                            className="absolute top-[40%] left-[45%] text-purple-200/15 dark:text-purple-500/10 animate-float"
                        />

                        {/* Gradient blobs */}
                        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-400/15 dark:bg-emerald-600/10 rounded-full blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/10 dark:bg-purple-600/5 rounded-full blur-3xl" />
                    </div>

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 py-16 sm:py-20 lg:py-24">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            {/* Left: Text content */}
                            <div className="text-center lg:text-left order-2 lg:order-1">
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.7 }}
                                >
                                    {/* Badge */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-violet-700 dark:text-violet-300 mb-6"
                                    >
                                        <Sparkles size={16} className="text-violet-500" />
                                        <span>การนิคมอุตสาหกรรมแห่งประเทศไทย</span>
                                    </motion.div>

                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-4xl font-extrabold text-gray-900 dark:text-white leading-snug lg:leading-normal">
                                        ระบบประเมินผล{" "}
                                        <span className="text-gradient-primary">
                                            360 องศา
                                        </span>
                                        <br />
                                        <span className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl text-gray-700 dark:text-gray-300">
                                            สำหรับผู้ว่าการ
                                        </span>
                                        <br />
                                        <span className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl text-gray-700 dark:text-gray-300">
                                            กลุ่มผู้บริหารและพนักงาน ระดับ 5-12
                                        </span>
                                    </h1>

                                    <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                        ระบบประเมินผลแบบรอบด้าน
                                        ที่รวบรวมข้อมูลจากทุกมุมมอง เพื่อสะท้อนภาพรวม
                                        ศักยภาพผู้บริหารอย่างครบถ้วน โปร่งใส
                                        และเป็นความลับ
                                    </p>

                                    {/* Key points */}
                                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle
                                                size={18}
                                                className="text-emerald-500 flex-shrink-0"
                                            />
                                            <span>ประเมินหลากมุมมอง</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle
                                                size={18}
                                                className="text-emerald-500 flex-shrink-0"
                                            />
                                            <span>ข้อมูลเป็นความลับ</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle
                                                size={18}
                                                className="text-emerald-500 flex-shrink-0"
                                            />
                                            <span>รายงานเชิงลึก</span>
                                        </div>
                                    </div>

                                    {/* CTA Buttons */}
                                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                        <Link
                                            href={route("login")}
                                            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-base shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5"
                                        >
                                            เข้าสู่ระบบ
                                            <ArrowRight
                                                size={18}
                                                className="group-hover:translate-x-1 transition-transform"
                                            />
                                        </Link>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right: Animated 360 ring */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.8,
                                    delay: 0.2,
                                    type: "spring",
                                }}
                                className="order-1 lg:order-2"
                            >
                                <AnimatedRing />
                            </motion.div>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2"
                        animate={{ y: [0, 8, 0] }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="w-6 h-10 rounded-full border-2 border-gray-400/50 dark:border-gray-500/50 flex justify-center pt-2">
                            <div className="w-1.5 h-2.5 rounded-full bg-violet-500/70" />
                        </div>
                    </motion.div>
                </section>

                {/* ============================================= */}
                {/*  STATS SECTION                                 */}
                {/* ============================================= */}
                <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
                            <StatItem
                                value={360}
                                suffix="°"
                                label="การประเมินรอบด้าน"
                                delay={0}
                            />
                            <StatItem
                                value={5}
                                suffix="+"
                                label="มุมมองการประเมิน"
                                delay={0.1}
                            />
                            <StatItem
                                value={100}
                                suffix="%"
                                label="ความเป็นส่วนตัว"
                                delay={0.2}
                            />
                            <StatItem
                                value={24}
                                suffix="/7"
                                label="เข้าถึงได้ตลอดเวลา"
                                delay={0.3}
                            />
                        </div>
                    </div>
                </section>

                {/* ============================================= */}
                {/*  FEATURES SECTION                               */}
                {/* ============================================= */}
                <section className="py-20 sm:py-28 gradient-primary-soft relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 pointer-events-none">
                        <Hexagon
                            size={200}
                            className="absolute -top-10 -right-10 text-violet-200/10 dark:text-violet-500/5"
                        />
                        <Hexagon
                            size={150}
                            className="absolute -bottom-10 -left-10 text-emerald-200/10 dark:text-emerald-500/5"
                        />
                    </div>

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative z-10">
                        <Reveal>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-4">
                                    คุณสมบัติเด่น
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                                    ออกแบบมาเพื่อ
                                    <span className="text-gradient-primary">
                                        {" "}
                                        ยกระดับองค์กร
                                    </span>
                                </h2>
                                <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                    เครื่องมือที่ครบครันสำหรับการประเมินผลแบบ 360 องศา
                                    ตั้งแต่การรวบรวมข้อมูลจนถึงการวิเคราะห์เชิงลึก
                                </p>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            <FeatureCard
                                icon={<Users size={28} />}
                                title="ประเมินแบบ 360 องศา"
                                description="รวบรวมข้อมูลจากหัวหน้างาน เพื่อนร่วมงาน ลูกน้อง และผู้ประเมินภายนอก เพื่อสะท้อนภาพรวมศักยภาพที่ครบถ้วน"
                                gradient="bg-gradient-to-br from-violet-500/5 to-transparent"
                                delay={0}
                            />
                            <FeatureCard
                                icon={<BarChart3 size={28} />}
                                title="รายงานเชิงวิเคราะห์"
                                description="Dashboard แบบ Interactive พร้อมกราฟ แผนภูมิ และตารางเปรียบเทียบ เพื่อการวิเคราะห์และวางแผนเชิงกลยุทธ์"
                                gradient="bg-gradient-to-br from-emerald-500/5 to-transparent"
                                delay={0.1}
                            />
                            <FeatureCard
                                icon={<Shield size={28} />}
                                title="ปลอดภัยและเป็นความลับ"
                                description="ระบบรักษาความปลอดภัยระดับสูง ข้อมูลการประเมินเป็นความลับ ไม่สามารถระบุตัวผู้ประเมินได้"
                                gradient="bg-gradient-to-br from-orange-500/5 to-transparent"
                                delay={0.2}
                            />
                            <FeatureCard
                                icon={<Target size={28} />}
                                title="แบบประเมินที่ยืดหยุ่น"
                                description="รองรับหลายรูปแบบคำถาม ทั้งเชิงปริมาณ (Rating) และเชิงคุณภาพ (Open-ended) ปรับแต่งได้ตามความต้องการ"
                                gradient="bg-gradient-to-br from-violet-500/5 to-transparent"
                                delay={0.1}
                            />
                            <FeatureCard
                                icon={<TrendingUp size={28} />}
                                title="ติดตามพัฒนาการ"
                                description="เปรียบเทียบผลประเมินย้อนหลัง ติดตามพัฒนาการของผู้บริหารแต่ละท่านอย่างเป็นระบบ"
                                gradient="bg-gradient-to-br from-emerald-500/5 to-transparent"
                                delay={0.2}
                            />
                            <FeatureCard
                                icon={<Zap size={28} />}
                                title="ใช้งานง่าย รวดเร็ว"
                                description="ออกแบบ UX/UI ให้ใช้งานง่าย ทำแบบประเมินได้สะดวกทั้งบนคอมพิวเตอร์และมือถือ"
                                gradient="bg-gradient-to-br from-orange-500/5 to-transparent"
                                delay={0.3}
                            />
                        </div>
                    </div>
                </section>

                {/* ============================================= */}
                {/*  HOW IT WORKS                                   */}
                {/* ============================================= */}
                <section className="py-20 sm:py-28 bg-white dark:bg-gray-900 relative overflow-hidden">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                        <Reveal>
                            <div className="text-center mb-16">
                                <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-4">
                                    ขั้นตอนการใช้งาน
                                </span>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                                    เริ่มต้นใช้งาน
                                    <span className="text-gradient-primary">
                                        {" "}
                                        เพียง 3 ขั้นตอน
                                    </span>
                                </h2>
                            </div>
                        </Reveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
                            {[
                                {
                                    step: "01",
                                    title: "เข้าสู่ระบบ",
                                    description:
                                        "ใช้รหัสพนักงานและรหัสผ่านเข้าสู่ระบบ หรือใช้ Access Code สำหรับผู้ประเมินภายนอก",
                                    icon: <Lock size={24} />,
                                    color: "from-violet-500 to-purple-600",
                                },
                                {
                                    step: "02",
                                    title: "ทำแบบประเมิน",
                                    description:
                                        "เลือกแบบประเมินที่ได้รับมอบหมาย ตอบคำถามตามความเป็นจริง ข้อมูลเป็นความลับ",
                                    icon: <Eye size={24} />,
                                    color: "from-emerald-500 to-teal-600",
                                },
                                {
                                    step: "03",
                                    title: "ดูผลรายงาน",
                                    description:
                                        "ผู้บริหารสามารถดูรายงานผลเชิงวิเคราะห์ Dashboard พร้อมกราฟเปรียบเทียบ",
                                    icon: <BarChart3 size={24} />,
                                    color: "from-orange-500 to-amber-600",
                                },
                            ].map((item, idx) => (
                                <Reveal key={idx} delay={idx * 0.15}>
                                    <div className="relative text-center group">
                                        {/* Connector line (hidden on mobile) */}
                                        {idx < 2 && (
                                            <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-gray-300 dark:from-gray-600 to-transparent" />
                                        )}

                                        {/* Step circle */}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className={cn(
                                                "w-24 h-24 rounded-2xl bg-gradient-to-br mx-auto flex items-center justify-center text-white shadow-lg mb-6",
                                                item.color
                                            )}
                                        >
                                            {item.icon}
                                        </motion.div>

                                        <div className="text-xs font-bold text-violet-500 dark:text-violet-400 tracking-widest mb-2">
                                            STEP {item.step}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                                            {item.description}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================= */}
                {/*  CTA SECTION                                    */}
                {/* ============================================= */}
                <section className="py-20 sm:py-28 relative overflow-hidden">
                    {/* Background */}
                    <div className="absolute inset-0 gradient-hero" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />

                    {/* Floating hexagons */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <Hexagon
                            size={100}
                            className="absolute top-[10%] left-[10%] text-white/10 animate-float"
                        />
                        <Hexagon
                            size={70}
                            className="absolute bottom-[20%] right-[10%] text-white/10 animate-float-delayed"
                        />
                    </div>

                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10 text-center">
                        <Reveal>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-6 leading-tight">
                                พร้อมเริ่มต้นการประเมิน
                                <br />
                                แบบ 360 องศาหรือยัง?
                            </h2>
                            <p className="text-lg text-violet-100 mb-10 max-w-2xl mx-auto">
                                เข้าสู่ระบบเพื่อเริ่มต้นการประเมินผล
                                พัฒนาศักยภาพผู้บริหาร
                                และยกระดับประสิทธิภาพองค์กร
                            </p>
                            <Link
                                href={route("login")}
                                className="group inline-flex items-center gap-3 px-10 py-4 bg-white text-violet-700 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                เข้าสู่ระบบประเมิน
                                <ChevronRight
                                    size={20}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </Link>
                        </Reveal>
                    </div>
                </section>

                {/* ============================================= */}
                {/*  FOOTER TRUST BAR                               */}
                {/* ============================================= */}
                <section className="py-10 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-violet-500" />
                                <span>ข้อมูลปลอดภัย เข้ารหัส</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Lock size={16} className="text-emerald-500" />
                                <span>ไม่เปิดเผยตัวผู้ประเมิน</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle
                                    size={16}
                                    className="text-orange-500"
                                />
                                <span>
                                    ประจำปีงบประมาณ {fiscalYearBE}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </MainLayout>
    );
}
