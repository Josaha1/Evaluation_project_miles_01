import { Link, usePage } from '@inertiajs/react'
import { useState, useEffect, use } from "react";
// import { PageProps } from '@/types'

// Interface สำหรับ props ที่รับมาจาก Controller
interface User {
    id: number
    prename: string
    fname: string
    lname: string
    grade: string
    email: string
    position?: string
    role?: string
    photo?: string
    bio?: string | null
}

interface PageProps {
    auth: {
        user: User | null
    }
    [key: string]: string | number | boolean | object | null
}

export default function NavBar() {
    // Darkmode
    const [darkMode, setDarkMode] = useState(false);
    useEffect(() => {
        const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const savedDarkMode = localStorage.getItem("darkMode");

        const isDarkMode = savedDarkMode !== null ? savedDarkMode === 'true' : prefersDarkMode;
        setDarkMode(isDarkMode);

        if (isDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    });


    // function to toggle dark mode
    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem("darkMode", newDarkMode.toString());

        if (newDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }
    const { auth } = usePage<PageProps>().props

    return (
        
        <nav className="bg-white dark:bg-black shadow-md py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <div className="text-xl font-bold text-indigo-600">
                    {auth.user ? (
                        auth.user.role === 'admin' ? (
                            <Link href={route('admindashboard')}>Laravel React</Link>
                        ) : (
                            <Link href={route('dashboard')}>Laravel React</Link>
                        )
                    ) : (
                        <Link href={route('home')}>Laravel React</Link>
                    )}
                </div>

                <div className="flex items-center">
                    {auth.user ? (
                        <div className="flex items-center space-x-4 gap-4">
                            <span className="text-sm text-gray-700 font-bold dark:text-white">สวัสดี, {auth.user.prename}{auth.user.fname} {auth.user.lname} : {auth.user.position} ระดับ {auth.user.grade}</span>
                            <button
                                onClick={toggleDarkMode}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                                aria-label={darkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
                            >
                                {darkMode ? (
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="px-3 py-1.5 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                            >
                                ออกจากระบบ
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3 gap-4">
                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                                aria-label={darkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
                            >
                                {darkMode ? (
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            <Link
                                href={route('login')}
                                className="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                            >
                                เข้าสู่ระบบ
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
} 