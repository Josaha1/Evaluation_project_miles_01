import { Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function NavBar() {
    const { auth } = usePage().props as any;
    const [darkMode, setDarkMode] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("darkMode");
        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;
        const isDark = saved !== null ? saved === "true" : prefersDark;
        setDarkMode(isDark);
        document.documentElement.classList.toggle("dark", isDark);
    }, []);

    const toggleDark = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem("darkMode", String(newMode));
        document.documentElement.classList.toggle("dark", newMode);
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <nav className="bg-white dark:bg-zinc-900 shadow-md py-1 sticky top-0 z-50">
            <div className="container max-w-7xl mx-auto px-4  sm:px-6 sm:py-2 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 text-xl font-bold text-indigo-600">
                        <Link
                            href={route(
                                auth?.user?.role === "admin"
                                    ? "admindashboard"
                                    : "dashboard"
                            )}
                        >
                            Laravel React
                        </Link>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {!auth?.user ? (
                            // 🔓 ถ้ายังไม่ได้ login
                            <Link
                                href={route("login")}
                                className="px-4 py-2 rounded bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition"
                            >
                                เข้าสู่ระบบ
                            </Link>
                        ) : (
                            // ✅ แสดง dropdown ถ้า login แล้ว
                            <>
                                <button
                                    onClick={toggleMenu}
                                    className="text-sm font-medium dark:text-white hidden sm:block"
                                >
                                    เมนู
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={toggleMenu}
                                        className="flex items-center gap-2 focus:outline-none"
                                    >
                                        <span className="text-sm font-semibold text-gray-700 dark:text-white hidden sm:inline">
                                            สวัสดี, {auth.user.prename}
                                            {auth.user.fname} :{" "}
                                            {auth.user.position} ระดับ{" "}
                                            {auth.user.grade}
                                        </span>
                                        <img
                                            src={
                                                auth.user.photo &&
                                                typeof auth.user.photo ===
                                                    "string"
                                                    ? `/storage/${auth.user.photo}`
                                                    : "/images/default.png"
                                            }
                                            alt="User"
                                            className="w-8 h-8 rounded-full border"
                                        />
                                    </button>

                                    {menuOpen && (
                                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-md z-50">
                                            <div className="p-4 text-sm text-gray-700 dark:text-gray-200">
                                                👤 {auth.user.fname}{" "}
                                                {auth.user.lname}
                                                <br />
                                                🏷️ {auth.user.position} | ระดับ{" "}
                                                {auth.user.grade}
                                            </div>
                                            <hr className="dark:border-gray-600" />

                                            {/* 👇 เมนูโปรไฟล์ */}
                                            <Link
                                                href={route("profile.edit")} // ต้องมี route นี้ใน web.php หรือ Inertia controller
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                            >
                                                ✏️ แก้ไขโปรไฟล์
                                            </Link>

                                            <div className="flex justify-between items-center px-4 py-2">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    โหมดแสง
                                                </span>
                                                <button
                                                    onClick={toggleDark}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
                                                >
                                                    {darkMode ? "🌙" : "🌞"}
                                                </button>
                                            </div>

                                            <Link
                                                href={route("logout")}
                                                method="post"
                                                as="button"
                                                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-b-md"
                                            >
                                                🚪 ออกจากระบบ
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
