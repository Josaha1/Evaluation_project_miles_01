import { Link, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    Settings,
    LogOut,
    Moon,
    Sun,
    Palette,
    Menu,
    X,
    LayoutDashboard,
} from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";

interface User {
    id: number;
    emid: string;
    prename?: string;
    fname: string;
    lname: string;
    sex?: string;
    division_id?: string;
    department_id?: string;
    faction_id?: string;
    position_id?: string;
    grade?: number;
    birthdate?: string;
    photo?: string;
    role: string;
    user_type: string;
    position?: string;
}

interface PageProps {
    auth: {
        user?: User;
    };
}

export default function Navbar() {
    const { auth } = usePage<PageProps>().props;
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Track scroll for navbar shadow enhancement
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    // Close mobile menu on route change (resize)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 640) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const avatarSrc =
        auth?.user?.photo && typeof auth.user.photo === "string"
            ? `/storage/${auth.user.photo}`
            : null;

    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

    // Dropdown animation variants
    const dropdownVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: -8,
            transition: { duration: 0.15, ease: "easeIn" },
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.2, ease: "easeOut" },
        },
    };

    // Mobile panel variants
    const mobileOverlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.25 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
    };

    const mobilePanelVariants = {
        hidden: { x: "100%" },
        visible: {
            x: 0,
            transition: { type: "spring", damping: 30, stiffness: 300 },
        },
        exit: {
            x: "100%",
            transition: { duration: 0.25, ease: "easeIn" },
        },
    };

    const menuItemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: { delay: 0.05 * i + 0.15, duration: 0.25, ease: "easeOut" },
        }),
    };

    // Avatar component (reusable)
    const Avatar = ({
        size = "md",
        className = "",
    }: {
        size?: "sm" | "md" | "lg";
        className?: string;
    }) => {
        const sizeClasses = {
            sm: "w-8 h-8 text-xs",
            md: "w-10 h-10 text-sm",
            lg: "w-14 h-14 text-lg",
        };

        if (avatarSrc) {
            return (
                <img
                    src={avatarSrc}
                    alt="User avatar"
                    onError={(e) => {
                        e.currentTarget.src = "/images/default.png";
                    }}
                    className={cn(
                        "rounded-full object-cover border-2 border-white/30",
                        sizeClasses[size],
                        className
                    )}
                />
            );
        }

        return (
            <div
                className={cn(
                    "rounded-full gradient-primary flex items-center justify-center text-white font-semibold",
                    sizeClasses[size],
                    className
                )}
            >
                {auth?.user?.fname?.charAt(0)?.toUpperCase() || "U"}
            </div>
        );
    };

    return (
        <nav
            className={cn(
                "glass-navbar sticky top-0 z-50 transition-all duration-300",
                scrolled && "shadow-lg shadow-black/5 dark:shadow-black/20"
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link
                            href={route("home")}
                            className="flex items-center gap-3 group"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-10 h-10 flex-shrink-0"
                            >
                                <img
                                    src="/static/icon.png"
                                    alt="IMS-Thai"
                                    className="w-full h-full object-contain drop-shadow-md"
                                />
                            </motion.div>

                            {/* Full name for desktop */}
                            <span className="hidden lg:block text-lg font-bold text-gradient-primary leading-tight">
                                การนิคมอุตสาหกรรมแห่งประเทศไทย
                            </span>
                            {/* Short name for tablet */}
                            <span className="hidden sm:block lg:hidden text-lg font-bold text-gradient-primary">
                                กนอ.
                            </span>
                        </Link>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Dark Mode Toggle - Desktop */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleDarkMode}
                            className="hidden sm:flex relative w-9 h-9 items-center justify-center rounded-full bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                            aria-label={
                                darkMode
                                    ? "เปลี่ยนเป็นโหมดสว่าง"
                                    : "เปลี่ยนเป็นโหมดมืด"
                            }
                        >
                            <AnimatePresence mode="wait">
                                {darkMode ? (
                                    <motion.div
                                        key="sun"
                                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <Sun size={18} className="text-amber-400" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="moon"
                                        initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                        exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <Moon size={18} className="text-violet-600" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {!auth?.user ? (
                            /* ====== Guest State ====== */
                            <div className="flex items-center gap-2">
                                {/* Mobile hamburger */}
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="sm:hidden p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="เปิดเมนู"
                                >
                                    <Menu size={20} />
                                </button>

                                <Link
                                    href={route("login")}
                                    className="px-5 py-2 rounded-full gradient-primary text-white font-medium text-sm hover:opacity-90 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                                >
                                    เข้าสู่ระบบ
                                </Link>
                            </div>
                        ) : (
                            /* ====== Authenticated State ====== */
                            <div className="flex items-center gap-2">
                                {/* Mobile hamburger */}
                                <button
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="sm:hidden p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="เปิดเมนู"
                                >
                                    <Menu size={20} />
                                </button>

                                {/* User Menu - Desktop */}
                                <div className="hidden sm:block relative" ref={menuRef}>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setMenuOpen(!menuOpen)}
                                        className="flex items-center gap-3 py-1.5 px-2 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all duration-200 group"
                                        aria-label="เมนูผู้ใช้"
                                    >
                                        <div className="text-right hidden md:block">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-white leading-tight">
                                                {auth.user.prename}
                                                {auth.user.fname}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                                {auth.user.position}
                                            </p>
                                        </div>

                                        <div className="relative">
                                            <Avatar
                                                size="md"
                                                className="group-hover:border-violet-400 dark:group-hover:border-violet-500 transition-colors duration-200"
                                            />
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full" />
                                        </div>

                                        <ChevronDown
                                            size={16}
                                            className={cn(
                                                "text-gray-400 transition-transform duration-300",
                                                menuOpen && "rotate-180"
                                            )}
                                        />
                                    </motion.button>

                                    {/* Desktop Dropdown */}
                                    <AnimatePresence>
                                        {menuOpen && (
                                            <motion.div
                                                variants={dropdownVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden z-50 shadow-xl border border-gray-200 dark:border-gray-700"
                                            >
                                                {/* User Info Header */}
                                                <div className="p-5 bg-gradient-to-r from-violet-600 to-purple-700 text-white">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar size="lg" className="border-white/30" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-base truncate">
                                                                {auth.user.fname}{" "}
                                                                {auth.user.lname}
                                                            </p>
                                                            <p className="text-sm text-white/75 truncate">
                                                                {auth.user.position}
                                                            </p>
                                                            {auth.user.grade && (
                                                                <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/90">
                                                                    ระดับ {auth.user.grade}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="p-2">
                                                    <Link
                                                        href={route(
                                                            auth.user.role === "admin"
                                                                ? "admindashboard"
                                                                : "dashboard"
                                                        )}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group/item"
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover/item:bg-violet-200 dark:group-hover/item:bg-violet-900/50 transition-colors">
                                                            <LayoutDashboard
                                                                size={16}
                                                                className="text-violet-600 dark:text-violet-400"
                                                            />
                                                        </div>
                                                        <span>แดชบอร์ด</span>
                                                    </Link>

                                                    <Link
                                                        href={route("profile.edit")}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors group/item"
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover/item:bg-emerald-200 dark:group-hover/item:bg-emerald-900/50 transition-colors">
                                                            <Settings
                                                                size={16}
                                                                className="text-emerald-600 dark:text-emerald-400"
                                                            />
                                                        </div>
                                                        <span>แก้ไขโปรไฟล์</span>
                                                    </Link>

                                                    {/* Dark Mode Toggle Row */}
                                                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                                                <Palette
                                                                    size={16}
                                                                    className="text-amber-600 dark:text-amber-400"
                                                                />
                                                            </div>
                                                            <span className="text-sm text-gray-700 dark:text-gray-200">
                                                                โหมดมืด
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={toggleDarkMode}
                                                            className={cn(
                                                                "relative w-11 h-6 rounded-full transition-colors duration-300",
                                                                darkMode
                                                                    ? "bg-violet-600"
                                                                    : "bg-gray-300 dark:bg-gray-600"
                                                            )}
                                                        >
                                                            <motion.div
                                                                layout
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 500,
                                                                    damping: 30,
                                                                }}
                                                                className={cn(
                                                                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm",
                                                                    darkMode
                                                                        ? "left-6"
                                                                        : "left-1"
                                                                )}
                                                            />
                                                        </button>
                                                    </div>

                                                    <hr className="my-2 border-gray-200/80 dark:border-gray-700/80" />

                                                    <Link
                                                        href={route("logout")}
                                                        method="post"
                                                        as="button"
                                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/item"
                                                        onClick={() => setMenuOpen(false)}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover/item:bg-red-200 dark:group-hover/item:bg-red-900/50 transition-colors">
                                                            <LogOut size={16} />
                                                        </div>
                                                        <span>ออกจากระบบ</span>
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ====== Mobile Slide-in Panel (Portal to body) ====== */}
            {createPortal(
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            variants={mobileOverlayVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm sm:hidden"
                            onClick={closeMobileMenu}
                        />

                        {/* Slide-in panel */}
                        <motion.div
                            variants={mobilePanelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-y-0 right-0 z-[60] w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl sm:hidden flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200/50 dark:border-gray-700/50">
                                <span className="text-base font-semibold text-gray-800 dark:text-white">
                                    เมนู
                                </span>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={closeMobileMenu}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="ปิดเมนู"
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            {/* Panel Body */}
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                {auth?.user ? (
                                    <>
                                        {/* User Info Card */}
                                        <motion.div
                                            custom={0}
                                            variants={menuItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="p-4 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl text-white mb-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    size="lg"
                                                    className="border-white/30"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold truncate">
                                                        {auth.user.fname}{" "}
                                                        {auth.user.lname}
                                                    </p>
                                                    <p className="text-sm text-white/75 truncate">
                                                        {auth.user.position}
                                                    </p>
                                                    {auth.user.grade && (
                                                        <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/90">
                                                            ระดับ {auth.user.grade}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Menu Items */}
                                        <div className="space-y-1">
                                            <motion.div custom={1} variants={menuItemVariants} initial="hidden" animate="visible">
                                                <Link
                                                    href={route(
                                                        auth.user.role === "admin"
                                                            ? "admindashboard"
                                                            : "dashboard"
                                                    )}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                                    onClick={closeMobileMenu}
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                                        <LayoutDashboard
                                                            size={18}
                                                            className="text-violet-600 dark:text-violet-400"
                                                        />
                                                    </div>
                                                    <span className="font-medium">แดชบอร์ด</span>
                                                </Link>
                                            </motion.div>

                                            <motion.div custom={2} variants={menuItemVariants} initial="hidden" animate="visible">
                                                <Link
                                                    href={route("profile.edit")}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                                    onClick={closeMobileMenu}
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                        <Settings
                                                            size={18}
                                                            className="text-emerald-600 dark:text-emerald-400"
                                                        />
                                                    </div>
                                                    <span className="font-medium">แก้ไขโปรไฟล์</span>
                                                </Link>
                                            </motion.div>

                                            {/* Dark Mode Toggle */}
                                            <motion.div
                                                custom={3}
                                                variants={menuItemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                                        {darkMode ? (
                                                            <Sun
                                                                size={18}
                                                                className="text-amber-500"
                                                            />
                                                        ) : (
                                                            <Moon
                                                                size={18}
                                                                className="text-amber-600"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                                        โหมดมืด
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={toggleDarkMode}
                                                    className={cn(
                                                        "relative w-12 h-7 rounded-full transition-colors duration-300",
                                                        darkMode
                                                            ? "bg-violet-600"
                                                            : "bg-gray-300 dark:bg-gray-600"
                                                    )}
                                                >
                                                    <motion.div
                                                        layout
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 500,
                                                            damping: 30,
                                                        }}
                                                        className={cn(
                                                            "absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm",
                                                            darkMode
                                                                ? "left-6"
                                                                : "left-1"
                                                        )}
                                                    />
                                                </button>
                                            </motion.div>

                                            <motion.div
                                                custom={4}
                                                variants={menuItemVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                <hr className="my-3 border-gray-200 dark:border-gray-700" />
                                            </motion.div>

                                            <motion.div custom={5} variants={menuItemVariants} initial="hidden" animate="visible">
                                                <Link
                                                    href={route("logout")}
                                                    method="post"
                                                    as="button"
                                                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    onClick={closeMobileMenu}
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                        <LogOut size={18} />
                                                    </div>
                                                    <span className="font-medium">
                                                        ออกจากระบบ
                                                    </span>
                                                </Link>
                                            </motion.div>
                                        </div>
                                    </>
                                ) : (
                                    /* Guest Mobile Menu */
                                    <div className="space-y-3">
                                        {/* Dark Mode Toggle */}
                                        <motion.div
                                            custom={0}
                                            variants={menuItemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                                    {darkMode ? (
                                                        <Sun
                                                            size={18}
                                                            className="text-amber-500"
                                                        />
                                                    ) : (
                                                        <Moon
                                                            size={18}
                                                            className="text-amber-600"
                                                        />
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-700 dark:text-gray-200">
                                                    โหมดมืด
                                                </span>
                                            </div>
                                            <button
                                                onClick={toggleDarkMode}
                                                className={cn(
                                                    "relative w-12 h-7 rounded-full transition-colors duration-300",
                                                    darkMode
                                                        ? "bg-violet-600"
                                                        : "bg-gray-300 dark:bg-gray-600"
                                                )}
                                            >
                                                <motion.div
                                                    layout
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 30,
                                                    }}
                                                    className={cn(
                                                        "absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm",
                                                        darkMode
                                                            ? "left-6"
                                                            : "left-1"
                                                    )}
                                                />
                                            </button>
                                        </motion.div>

                                        <motion.div custom={1} variants={menuItemVariants} initial="hidden" animate="visible">
                                            <Link
                                                href={route("login")}
                                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-violet-500/25 hover:opacity-90 transition-all"
                                                onClick={closeMobileMenu}
                                            >
                                                <LogOut size={18} className="rotate-180" />
                                                เข้าสู่ระบบ
                                            </Link>
                                        </motion.div>
                                    </div>
                                )}
                            </div>

                            {/* Panel Footer branding */}
                            <div className="px-5 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="/static/icon.png"
                                        alt="กนอ."
                                        className="w-6 h-6 object-contain opacity-60"
                                    />
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        การนิคมอุตสาหกรรมแห่งประเทศไทย
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
            )}
        </nav>
    );
}
