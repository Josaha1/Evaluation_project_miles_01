import { PropsWithChildren, useState, useEffect } from 'react'
import { ReactNode } from 'react'
import { Link } from '@inertiajs/react'
import { Head } from '@inertiajs/react'
import Footer from '@/Components/Footer'

interface GuestLayoutProps {
    children: ReactNode
    title?: string
}
export default function GuestLayout({ children, title }: GuestLayoutProps) {

    const [_, setDarkMode] = useState(false)

    // เพิ่ม dark mode
    useEffect(() => {
        // ตรวจสอบ system preference
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
        const savedDarkMode = localStorage.getItem('darkMode')

        // ถ้ามีค่าใน localStorage ให้ใช้ค่านั้น ไม่งั้นใช้ค่า system preference
        const isDarkMode = savedDarkMode !== null ? savedDarkMode === 'true' : prefersDarkMode
        setDarkMode(isDarkMode)

        if (isDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    return (
        <>
            <Head title={title || 'หน้าหลัก'} />
            <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 dark:bg-black">
                <div className="w-full sm:max-w-sm mt-6 px-6 py-4 bg-white dark:bg-gray-800 shadow-md overflow-hidden sm:rounded-lg">
                    <div>
                        <Link href={route('home')} className="flex justify-center">
                            <img src="/static/miles_logo.png" alt="IMS-Thai" className='max-w-30' />
                        </Link>
                    </div>
                    {/* BEGIN: Content */}
                    {children}
                    {/* END: Content */}
                </div>

            </div>
            <Footer />
        </>
    )
} 