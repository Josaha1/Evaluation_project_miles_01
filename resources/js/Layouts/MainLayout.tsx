
import { Head } from '@inertiajs/react'
import { ReactNode } from 'react'
import Navbar from '../Components/Navbar'
import Footer from '@/Components/Footer'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { Toaster } from 'sonner'
// Interface สำหรับรับค่า props
interface MainLayoutProps {
    children: ReactNode
    title?: string
    breadcrumb?: ReactNode
}

export default function MainLayout({ children, title, breadcrumb }: MainLayoutProps) {
    return (
        <div className="bg-white dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen">

            <Head title={title || 'หน้าหลัก'} />

            <Navbar />
            {breadcrumb && (
                <div className="mt-4">
                    {breadcrumb}
                </div>
            )}
            <main className="flex-grow">
                <Toaster position="top-right" richColors />
                {children}
            </main>

            <Footer />

        </div>
    )
}