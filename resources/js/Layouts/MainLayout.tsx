import { Head } from "@inertiajs/react";
import { ReactNode, useState } from "react";
import Navbar from "../Components/Navbar";
import Footer from "@/Components/Footer";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { Toaster } from "sonner";
import CookieConsentBanner from "@/Components/CookieConsentBanner";
import { DarkModeToggle } from "@/Components/DarkModeToggle";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Menu, X } from "lucide-react";

interface MainLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: ReactNode;
    showSidebar?: boolean;
    maxWidth?: "full" | "7xl" | "6xl" | "5xl";
}

export default function MainLayout({
    children,
    title,
    breadcrumb,
    showSidebar = false,
    maxWidth = "full",
}: MainLayoutProps) {
    const { darkMode, toggleDarkMode } = useDarkMode();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const maxWidthClasses = {
        full: "max-w-full",
        "7xl": "max-w-7xl",
        "6xl": "max-w-6xl",
        "5xl": "max-w-5xl",
    };

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen flex flex-col">
            <Head title={title || "หน้าหลัก"} />

            {/* Enhanced Navbar with Dark Mode Toggle */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
               
                    <Navbar />

                
            </header>

            {/* Breadcrumb */}
            {breadcrumb && (
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
                        {breadcrumb}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Sidebar (optional) */}
                {showSidebar && (
                    <>
                        {/* Mobile Sidebar Overlay */}
                        {sidebarOpen && (
                            <div
                                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            />
                        )}

                        {/* Sidebar */}
                        <aside
                            className={`
                            fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
                            lg:translate-x-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
                            ${
                                sidebarOpen
                                    ? "translate-x-0"
                                    : "-translate-x-full"
                            }
                        `}
                        >
                            <div className="h-full p-4">
                                {/* Sidebar Content Here */}
                                <nav className="space-y-2">
                                    {/* Add your sidebar navigation items */}
                                </nav>
                            </div>
                        </aside>
                    </>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden">
                    <div
                        className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-6`}
                    >
                        <Toaster
                            position="top-right"
                            richColors
                            theme={darkMode ? "dark" : "light"}
                        />
                        {children}
                    </div>
                </main>
            </div>

            <Footer />
            <CookieConsentBanner />
        </div>
    );
}
