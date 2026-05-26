import { Head, useForm, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Eye,
    EyeOff,
    LogIn,
    Loader2,
    AlertCircle,
    User,
    Lock,
    Sparkles,
} from "lucide-react";
import { useState, FormEvent } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";

/* ------------------------------------------------------------------ */
/*  Floating hexagon SVG                                               */
/* ------------------------------------------------------------------ */
function Hexagon({
    size = 60,
    className,
}: {
    size?: number;
    className?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={className}
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
/*  Floating shapes background                                         */
/* ------------------------------------------------------------------ */
function FloatingShapes() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Gradient blobs */}
            <div className="absolute top-1/4 -left-24 w-80 h-80 bg-violet-500/20 dark:bg-violet-600/15 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-emerald-500/15 dark:bg-emerald-600/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-3xl" />

            {/* Hexagons */}
            <Hexagon
                size={100}
                className="absolute top-[8%] left-[8%] text-violet-300/20 dark:text-violet-400/10 animate-float"
            />
            <Hexagon
                size={70}
                className="absolute top-[15%] right-[12%] text-emerald-300/20 dark:text-emerald-400/10 animate-float-delayed"
            />
            <Hexagon
                size={50}
                className="absolute bottom-[20%] left-[15%] text-orange-300/15 dark:text-orange-400/10 animate-float"
            />
            <Hexagon
                size={80}
                className="absolute bottom-[10%] right-[8%] text-violet-300/15 dark:text-violet-400/10 animate-float-delayed"
            />
            <Hexagon
                size={40}
                className="absolute top-[50%] left-[5%] text-purple-200/15 dark:text-purple-400/10 animate-float"
            />
            <Hexagon
                size={60}
                className="absolute top-[35%] right-[5%] text-emerald-200/10 dark:text-emerald-400/10 animate-float-delayed"
            />

            {/* Small floating dots */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className={cn(
                        "absolute w-2 h-2 rounded-full",
                        i % 3 === 0
                            ? "bg-violet-400/30"
                            : i % 3 === 1
                              ? "bg-emerald-400/30"
                              : "bg-orange-400/30"
                    )}
                    style={{
                        top: `${15 + i * 14}%`,
                        left: `${10 + (i * 17) % 80}%`,
                    }}
                    animate={{
                        y: [0, -15, 0],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.4,
                    }}
                />
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page Props                                                         */
/* ------------------------------------------------------------------ */
interface LoginPageProps {
    errors?: Record<string, string>;
    flash?: { error?: string; success?: string };
    status?: string;
    system?: { fiscal_year_be?: number };
}

/* ================================================================== */
/*  LOGIN PAGE                                                         */
/* ================================================================== */
export default function Login() {
    const { errors: pageErrors, flash, status, system } =
        usePage<LoginPageProps>().props;
    const fiscalYearBE = system?.fiscal_year_be || (new Date().getFullYear() + 543);
    const { darkMode, toggleDarkMode } = useDarkMode();

    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        emid: "",
        password: "",
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route("login"));
    };

    return (
        <div
            className={cn(
                "min-h-screen flex flex-col items-center justify-center relative",
                "bg-gradient-to-br from-violet-50 via-white to-purple-50",
                "dark:from-gray-950 dark:via-gray-900 dark:to-violet-950/30"
            )}
        >
            <Head title="เข้าสู่ระบบ - กนอ." />

            {/* Background shapes */}
            <FloatingShapes />

            {/* Dark mode toggle */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={toggleDarkMode}
                className="fixed top-4 right-4 z-50 p-3 rounded-full glass-card hover:scale-105 transition-transform"
                aria-label={darkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
                {darkMode ? (
                    <Sparkles size={18} className="text-yellow-400" />
                ) : (
                    <Sparkles size={18} className="text-violet-600" />
                )}
            </motion.button>

            {/* Login card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Logo & Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8"
                >
                    {/* Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-xl shadow-violet-500/10 dark:shadow-violet-500/5 mb-5 overflow-hidden"
                    >
                        <img
                            src="/static/icon.png"
                            alt="กนอ."
                            className="w-14 h-14 object-contain"
                        />
                    </motion.div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                        ระบบประเมิน{" "}
                        <span className="text-gradient-primary">360 องศา</span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        การนิคมอุตสาหกรรมแห่งประเทศไทย
                    </p>
                </motion.div>

                {/* Glass card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-2xl p-8 sm:p-10"
                >
                    {/* Flash / status messages */}
                    <AnimatePresence>
                        {(flash?.error || status) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6"
                            >
                                {flash?.error && (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                                        <AlertCircle
                                            size={18}
                                            className="text-red-500 flex-shrink-0"
                                        />
                                        <p className="text-sm text-red-700 dark:text-red-400">
                                            {flash.error}
                                        </p>
                                    </div>
                                )}
                                {status && (
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                                        <Sparkles
                                            size={18}
                                            className="text-emerald-500 flex-shrink-0"
                                        />
                                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                            {status}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Employee ID field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="emid"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                รหัสพนักงาน
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <User
                                        size={18}
                                        className={cn(
                                            "transition-colors",
                                            errors.emid
                                                ? "text-red-400"
                                                : "text-gray-400 dark:text-gray-500"
                                        )}
                                    />
                                </div>
                                <input
                                    id="emid"
                                    type="text"
                                    value={data.emid}
                                    onChange={(e) =>
                                        setData("emid", e.target.value)
                                    }
                                    className={cn(
                                        "block w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        "bg-gray-50 dark:bg-gray-800/60 border",
                                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                        "text-gray-900 dark:text-white",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                                        errors.emid
                                            ? "border-red-300 dark:border-red-700 focus:ring-red-500/30 focus:border-red-500"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-violet-500/30 focus:border-violet-500 dark:focus:border-violet-400"
                                    )}
                                    placeholder="กรอกรหัสพนักงาน"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                            <AnimatePresence>
                                {errors.emid && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle size={12} />
                                        {errors.emid}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <Lock
                                        size={18}
                                        className={cn(
                                            "transition-colors",
                                            errors.password
                                                ? "text-red-400"
                                                : "text-gray-400 dark:text-gray-500"
                                        )}
                                    />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className={cn(
                                        "block w-full pl-12 pr-12 py-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                                        "bg-gray-50 dark:bg-gray-800/60 border",
                                        "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                        "text-gray-900 dark:text-white",
                                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                                        errors.password
                                            ? "border-red-300 dark:border-red-700 focus:ring-red-500/30 focus:border-red-500"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-violet-500/30 focus:border-violet-500 dark:focus:border-violet-400"
                                    )}
                                    placeholder="กรอกรหัสผ่าน"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    aria-label={
                                        showPassword
                                            ? "ซ่อนรหัสผ่าน"
                                            : "แสดงรหัสผ่าน"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            <AnimatePresence>
                                {errors.password && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
                                    >
                                        <AlertCircle size={12} />
                                        {errors.password}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            disabled={processing}
                            whileHover={processing ? {} : { scale: 1.01 }}
                            whileTap={processing ? {} : { scale: 0.98 }}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-base transition-all duration-300",
                                processing
                                    ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    : "gradient-primary text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
                            )}
                        >
                            {processing ? (
                                <>
                                    <Loader2
                                        size={20}
                                        className="animate-spin"
                                    />
                                    <span>กำลังตรวจสอบ...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span>เข้าสู่ระบบ</span>
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                            ระบบประเมินผล 360 องศา สำหรับผู้ว่าการ กลุ่มผู้บริหารและพนักงาน ระดับ
                            5-12
                            <br />
                            การนิคมอุตสาหกรรมแห่งประเทศไทย (กนอ.)
                            ประจำปีงบประมาณ {fiscalYearBE}
                        </p>
                    </div>
                </motion.div>

                {/* Footer link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500"
                >
                    พัฒนาโดย Miles Consult Group
                </motion.p>
            </motion.div>
        </div>
    );
}
