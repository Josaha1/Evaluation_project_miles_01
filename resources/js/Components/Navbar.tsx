import { Link, usePage, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    User as UserIcon,
    Settings,
    LogOut,
    Moon,
    Sun,
    Palette,
    Bell,
    Search,
    Menu,
    X,
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
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target as Node)
            ) {
                setNotificationOpen(false);
            }
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node)
            ) {
                setMobileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ Fixed: Build avatar src with correct type checking
    const avatarSrc =
        auth?.user?.photo && typeof auth.user.photo === "string"
            ? `/storage/${auth.user.photo}`
            : null;

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleNotification = () => setNotificationOpen(!notificationOpen);
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

    return (
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-8">
                        <div className="flex-shrink-0">
                            <Link
                                href={route(
                                    auth?.user?.role === "admin"
                                        ? "admindashboard"
                                        : "dashboard"
                                )}
                                className="flex items-center space-x-2 group"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Link
                                        href={route("home")}
                                        className="inline-block transition-transform hover:scale-105"
                                    >
                                        <img
                                            src="/static/icon.png"
                                            alt="IMS-Thai"
                                        />
                                    </Link>
                                </div>
                                {/* Full name for desktop, short name for mobile */}
                                <span className="hidden lg:block text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    การนิคมอุตสาหกรรมแห่งประเทศไทย
                                </span>
                                <span className="lg:hidden text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    กนอ.
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        {/* Dark Mode Toggle - Hidden on mobile, shown in mobile menu */}
                        <button
                            onClick={toggleDarkMode}
                            className="hidden sm:flex p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                            aria-label={
                                darkMode
                                    ? "เปลี่ยนเป็นโหมดสว่าง"
                                    : "เปลี่ยนเป็นโหมดมืด"
                            }
                        >
                            {darkMode ? (
                                <Sun size={18} className="text-yellow-500" />
                            ) : (
                                <Moon size={18} className="text-indigo-600" />
                            )}
                        </button>

                        {!auth?.user ? (
                            /* Guest State */
                            <div className="flex items-center space-x-3">
                                {/* Mobile hamburger menu for dark mode when not logged in */}
                                <button
                                    onClick={toggleMobileMenu}
                                    className="sm:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                                    aria-label="เปิดเมนู"
                                >
                                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                                
                                <Link
                                    href={route("login")}
                                    className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    เข้าสู่ระบบ
                                </Link>
                            </div>
                        ) : (
                            /* Authenticated State */
                            <div className="flex items-center space-x-3">
                                {/* Mobile hamburger menu */}
                                <button
                                    onClick={toggleMobileMenu}
                                    className="sm:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                                    aria-label="เปิดเมนู"
                                >
                                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                                {/* User Menu - Desktop only */}
                                <div className="hidden sm:block relative" ref={menuRef}>
                                    <button
                                        onClick={toggleMenu}
                                        className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                                        aria-label="เมนูผู้ใช้"
                                    >
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-white">
                                                {auth.user.prename}
                                                {auth.user.fname}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {auth.user.position}
                                            </p>
                                        </div>

                                        <div className="relative">
                                            {avatarSrc ? (
                                                <img
                                                    src={avatarSrc}
                                                    alt="User avatar"
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 group-hover:border-indigo-500 transition-colors"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    {auth.user.fname
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || "U"}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                        </div>

                                        <ChevronDown
                                            size={16}
                                            className={cn(
                                                "text-gray-400 transition-transform duration-200",
                                                menuOpen && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {menuOpen && (
                                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                            {/* User Info Header */}
                                            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                                                <div className="flex items-center space-x-3">
                                                    {avatarSrc ? (
                                                        <img
                                                            src={avatarSrc}
                                                            alt="User avatar"
                                                            onError={(e) => {
                                                                e.currentTarget.src =
                                                                    "/images/default.png";
                                                            }}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                                                            {auth.user.fname
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "U"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">
                                                            {auth.user.fname}{" "}
                                                            {auth.user.lname}
                                                        </p>
                                                        <p className="text-sm text-white/80">
                                                            {auth.user.position}{" "}
                                                            {auth.user.grade &&
                                                                `| ระดับ ${auth.user.grade}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="p-2">
                                                <Link
                                                    href={route("profile.edit")}
                                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    onClick={() =>
                                                        setMenuOpen(false)
                                                    }
                                                >
                                                    <Settings
                                                        size={16}
                                                        className="text-gray-400"
                                                    />
                                                    <span>แก้ไขโปรไฟล์</span>
                                                </Link>

                                                <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                    <div className="flex items-center space-x-3">
                                                        <Palette
                                                            size={16}
                                                            className="text-gray-400"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-200">
                                                            โหมดมืด
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={toggleDarkMode}
                                                        className={cn(
                                                            "w-10 h-6 rounded-full transition-colors relative",
                                                            darkMode
                                                                ? "bg-indigo-600"
                                                                : "bg-gray-300"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-4 h-4 bg-white rounded-full transition-transform absolute top-1",
                                                                darkMode
                                                                    ? "translate-x-5"
                                                                    : "translate-x-1"
                                                            )}
                                                        />
                                                    </button>
                                                </div>

                                                <hr className="my-2 border-gray-200 dark:border-gray-600" />

                                                <Link
                                                    href={route("logout")}
                                                    method="post"
                                                    as="button"
                                                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    onClick={() =>
                                                        setMenuOpen(false)
                                                    }
                                                >
                                                    <LogOut size={16} />
                                                    <span>ออกจากระบบ</span>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div 
                    ref={mobileMenuRef}
                    className="sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg"
                >
                    <div className="px-4 py-3 space-y-3">
                        {!auth?.user ? (
                            /* Guest Mobile Menu */
                            <div className="space-y-3">
                                {/* Dark Mode Toggle for Guest */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <div className="flex items-center space-x-3">
                                        <Palette size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-700 dark:text-gray-200">
                                            โหมดมืด
                                        </span>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-colors relative",
                                            darkMode ? "bg-indigo-600" : "bg-gray-300"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5",
                                                darkMode ? "translate-x-6" : "translate-x-0.5"
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Authenticated Mobile Menu */
                            <div className="space-y-3">
                                {/* User Info */}
                                <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt="User avatar"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/images/default.png";
                                                }}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                                                {auth.user.fname?.charAt(0)?.toUpperCase() || "U"}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">
                                                {auth.user.fname} {auth.user.lname}
                                            </p>
                                            <p className="text-sm text-white/80">
                                                {auth.user.position} {auth.user.grade && `| ระดับ ${auth.user.grade}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="space-y-1">
                                    <Link
                                        href={route("profile.edit")}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <Settings size={18} className="text-gray-400" />
                                        <span>แก้ไขโปรไฟล์</span>
                                    </Link>

                                    <div className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <Palette size={18} className="text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-200">
                                                โหมดมืด
                                            </span>
                                        </div>
                                        <button
                                            onClick={toggleDarkMode}
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-colors relative",
                                                darkMode ? "bg-indigo-600" : "bg-gray-300"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5",
                                                    darkMode ? "translate-x-6" : "translate-x-0.5"
                                                )}
                                            />
                                        </button>
                                    </div>

                                    <hr className="my-2 border-gray-200 dark:border-gray-600" />

                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <LogOut size={18} />
                                        <span>ออกจากระบบ</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
