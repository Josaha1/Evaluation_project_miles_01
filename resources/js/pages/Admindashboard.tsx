import { useEffect, useState } from "react"
import { BarChart, Users, FileText, ClipboardList, Download, ListChecks, Building2, Briefcase, UserCog, Shield, KeyRound, Globe } from 'lucide-react'
import MainLayout from "@/Layouts/MainLayout"
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

export default function AdminDashboard() {
    const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null)

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark')
            setIsDarkMode(isDark)
        })

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        })

        return () => observer.disconnect()
    }, [])

    const labelColor = isDarkMode ? '#ffffff' : '#000000'

    const actions = [
        
        {
            title: 'สร้างแบบประเมินใหม่',
            description: 'กำหนดแบบประเมินจากหมวด ด้าน และคำถาม',
            icon: <ListChecks className="w-6 h-6 text-purple-600 dark:text-purple-300" />,
            href: route('evaluations.index'),
        },
        {
            title: 'รายงาน & ส่งออกข้อมูล',
            description: 'ดูผลประเมินและดาวน์โหลดข้อมูล',
            icon: <Download className="w-6 h-6" />,
            href: route('admin.evaluation-report.index'),
        },
        {
            title: 'จัดการสมาชิก',
            description: 'เพิ่ม ลบ แก้ไขสมาชิกในระบบ',
            icon: <Users className="w-6 h-6" />,
            href: route('admin.users.index'),
        },
        {
            title: 'จัดการผู้ประเมิน/ผู้ถูกประเมิน',
            description: 'บริหารความสัมพันธ์การประเมิน',
            icon: <Users className="w-6 h-6" />,
            href: route('assignments.index'),
        },
    ]

    const orgActions = [
        {
            title: 'จัดการสายงาน',
            description: 'เพิ่ม แก้ไข ลบสายงาน (Division)',
            icon: <Building2 className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />,
            href: route('admin.divisions.index'),
        },
        {
            title: 'จัดการหน่วยงาน',
            description: 'เพิ่ม แก้ไข ลบหน่วยงาน (Department)',
            icon: <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-300" />,
            href: route('admin.departments.index'),
        },
        {
            title: 'จัดการตำแหน่ง',
            description: 'เพิ่ม แก้ไข ลบตำแหน่ง (Position)',
            icon: <UserCog className="w-6 h-6 text-amber-600 dark:text-amber-300" />,
            href: route('admin.positions.index'),
        },
        {
            title: 'จัดการฝ่าย',
            description: 'เพิ่ม แก้ไข ลบฝ่าย (Faction)',
            icon: <Shield className="w-6 h-6 text-rose-600 dark:text-rose-300" />,
            href: route('admin.factions.index'),
        },
    ]

    const externalActions = [
        {
            title: 'จัดการองค์กรภายนอก',
            description: 'เพิ่ม แก้ไข ลบ องค์กรภายนอกสำหรับประเมิน',
            icon: <Globe className="w-6 h-6 text-teal-600 dark:text-teal-300" />,
            href: route('admin.external-organizations.index'),
        },
        {
            title: 'จัดการ Access Codes',
            description: 'สร้าง QR Code และ Access Code สำหรับผู้ประเมินภายนอก',
            icon: <KeyRound className="w-6 h-6 text-orange-600 dark:text-orange-300" />,
            href: route('admin.access-codes.index'),
        },
    ]

    return (
        <MainLayout title="Admin Dashboard">
            <div className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
                    แดชบอร์ดผู้ดูแลระบบ
                </h1>

                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">เมนูสำหรับผู้ดูแลระบบ</h2>
                    <div className="grid sm:grid-cols-4 gap-6">
                        {actions.map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className="group block bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-indigo-600 dark:text-indigo-400">
                                        {action.icon}
                                    </div>
                                    <BarChart className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800 dark:text-white">{action.title}</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                            </a>
                        ))}
                    </div>
                </div>

                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">การจัดการโครงสร้างองค์กร</h2>
                    <div className="grid sm:grid-cols-4 gap-6">
                        {orgActions.map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className="group block bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        {action.icon}
                                    </div>
                                    <BarChart className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800 dark:text-white">{action.title}</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                            </a>
                        ))}
                    </div>
                </div>

                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">ระบบประเมินภายนอก</h2>
                    <div className="grid sm:grid-cols-4 gap-6">
                        {externalActions.map((action, index) => (
                            <a
                                key={index}
                                href={action.href}
                                className="group block bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        {action.icon}
                                    </div>
                                    <BarChart className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800 dark:text-white">{action.title}</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
