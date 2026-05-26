import { ReactNode } from 'react'
import { Link } from '@inertiajs/react'
import { Head } from '@inertiajs/react'
import Footer from '@/Components/Footer'
import { DarkModeToggle } from '@/Components/DarkModeToggle'
import { useDarkMode } from '@/hooks/useDarkMode'

interface GuestLayoutProps {
    children: ReactNode
    title?: string
    showLogo?: boolean
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function GuestLayout({
    children,
    title,
    showLogo = true,
    maxWidth = 'lg'
}: GuestLayoutProps) {
    const { darkMode, toggleDarkMode } = useDarkMode()

    const maxWidthClasses = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl'
    }

    return (
        <>
            <Head title={title || 'หน้าหลัก'} />
            <div className="min-h-screen flex flex-col justify-center items-center relative gradient-primary-soft">

                {/* Dark Mode Toggle - Fixed Position */}
                <div className="fixed top-4 right-4 z-50">
                    <DarkModeToggle
                        darkMode={darkMode}
                        onToggle={toggleDarkMode}
                        className="shadow-lg"
                    />
                </div>

                {/* Main Content */}
                <div className={`
                    w-full ${maxWidthClasses[maxWidth]} mx-6 px-6 py-8
                    glass-card rounded-2xl transition-all duration-300
                    hover:shadow-2xl
                `}>
                    {/* Logo Section */}
                    {showLogo && (
                        <div className="text-center mb-8">
                            <Link
                                href={route('home')}
                                className="inline-block transition-transform hover:scale-105"
                            >
                                <img
                                    src="/static/icon.png"
                                    alt="กนอ."
                                    className="h-32 w-auto mx-auto"
                                />
                            </Link>
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-6">
                        {children}
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-300/20 dark:bg-violet-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
                </div>
            </div>

            <Footer />
        </>
    )
}
