import { Head } from "@inertiajs/react";
import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Components/Navbar";
import Footer from "@/Components/Footer";
import Breadcrumb from "@/Components/ui/breadcrumb";
import { Toaster } from "sonner";
import CookieConsentBanner from "@/Components/CookieConsentBanner";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumb?: ReactNode;
    showSidebar?: boolean;
    maxWidth?: "full" | "7xl" | "6xl" | "5xl";
}

// Page transition variants
const pageVariants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.15,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.1,
            ease: "easeIn",
        },
    },
};

const breadcrumbVariants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.15, delay: 0.05 },
    },
};

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
        <div className="gradient-primary-soft text-gray-800 dark:text-gray-200 min-h-screen flex flex-col relative overflow-x-hidden">
            <Head title={title || "หน้าหลัก"} />

            {/* Subtle decorative background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-400/5 dark:bg-violet-600/5 blur-3xl animate-float" />
                <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-emerald-400/5 dark:bg-emerald-600/5 blur-3xl animate-float-delayed" />
                <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-orange-400/3 dark:bg-orange-600/3 blur-3xl animate-float" />
            </div>

            {/* Navbar */}
            <header className="sticky top-0 z-40">
                <Navbar />
            </header>

            {/* Breadcrumb */}
            <AnimatePresence mode="wait">
                {breadcrumb && (
                    <motion.div
                        variants={breadcrumbVariants}
                        initial="initial"
                        animate="animate"
                        className="glass border-b border-gray-200/30 dark:border-gray-700/30 px-4 sm:px-6 lg:px-8 py-3"
                    >
                        <div className={cn(maxWidthClasses[maxWidth], "mx-auto")}>
                            {breadcrumb}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Sidebar (optional) */}
                {showSidebar && (
                    <>
                        {/* Mobile Sidebar Overlay */}
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                                    onClick={() => setSidebarOpen(false)}
                                />
                            )}
                        </AnimatePresence>

                        {/* Sidebar */}
                        <aside
                            className={cn(
                                "fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out",
                                "lg:translate-x-0 glass border-r border-gray-200/30 dark:border-gray-700/30",
                                sidebarOpen
                                    ? "translate-x-0"
                                    : "-translate-x-full"
                            )}
                        >
                            <div className="h-full p-4">
                                <nav className="space-y-2">
                                    {/* Sidebar navigation items */}
                                </nav>
                            </div>
                        </aside>
                    </>
                )}

                {/* Main Content Area */}
                <AnimatePresence mode="wait">
                    <motion.main
                        key={title || "page"}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="flex-1 overflow-hidden"
                    >
                        <div
                            className={cn(
                                maxWidthClasses[maxWidth],
                                "mx-auto py-6",
                                maxWidth !== "full" && "px-4 sm:px-6 lg:px-8"
                            )}
                        >
                            <Toaster
                                position="top-right"
                                richColors
                                theme={darkMode ? "dark" : "light"}
                                toastOptions={{
                                    className:
                                        "glass-card !border-white/20 dark:!border-white/10",
                                }}
                            />
                            {children}
                        </div>
                    </motion.main>
                </AnimatePresence>
            </div>

            <Footer />
            <CookieConsentBanner />
        </div>
    );
}
