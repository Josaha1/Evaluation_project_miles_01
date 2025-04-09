import { useEffect, useState } from "react"
import { BarChart, Users, FileText, ClipboardList, Download, ListChecks } from 'lucide-react'
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

    const stats = [
        {
            label: 'จำนวนแบบประเมิน',
            value: 128,
            icon: <ClipboardList className="h-6 w-6" />,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
        },
        {
            label: 'คำถามทั้งหมด',
            value: 45,
            icon: <FileText className="h-6 w-6" />,
            color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
        },
        {
            label: 'ผู้ใช้งานระบบ',
            value: 73,
            icon: <Users className="h-6 w-6" />,
            color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
        },
    ]

    const actions = [
        {
            title: 'จัดการคำถาม',
            description: 'เพิ่ม ลบ แก้ไขหมวดคำถามและคำถามย่อย',
            icon: <FileText className="w-6 h-6" />,
            href: route('adminquestionmanager'),
        },
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
            href: '/admin/export',
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

    const evaluationBySectionOptions: Highcharts.Options = {
        chart: {
            type: 'column',
            backgroundColor: 'transparent',
        },
        title: {
            text: 'จำนวนการประเมินแยกตามหมวด',
            style: { color: labelColor, fontSize: '18px' }
        },
        xAxis: {
            categories: ['สมรรถนะ', 'วัฒนธรรมองค์กร', 'ปลายเปิด'],
            labels: { style: { color: labelColor } },
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: { text: 'จำนวน (ครั้ง)' },
            labels: { style: { color: labelColor } }
        },
        legend: {
            itemStyle: { color: labelColor }
        },
        series: [
            {
                name: 'แบบประเมิน',
                type: 'column',
                data: [40, 28, 15],
                colorByPoint: true,
            }
        ],
        credits: { enabled: false }
    }

    const ratingPieChartOptions: Highcharts.Options = {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent'
        },
        title: {
            text: 'สัดส่วนระดับความคิดเห็น',
            style: { color: labelColor, fontSize: '18px' }
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    color: labelColor
                }
            }
        },
        series: [
            {
                name: 'ระดับความเห็น',
                type: 'pie',
                data: [
                    { name: 'มากที่สุด (5)', y: 35 },
                    { name: 'มาก (4)', y: 30 },
                    { name: 'ปานกลาง (3)', y: 20 },
                    { name: 'น้อย (2)', y: 10 },
                    { name: 'น้อยที่สุด (1)', y: 5 },
                ]
            }
        ],
        credits: { enabled: false }
    }

    return (
        <MainLayout title="Admin Dashboard">
            <div className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
                    แดชบอร์ดผู้ดูแลระบบ
                </h1>

                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">เมนูสำหรับผู้ดูแลระบบ</h2>
                    <div className="grid sm:grid-cols-3 gap-6">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div className="bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg shadow">
                        <HighchartsReact highcharts={Highcharts} options={evaluationBySectionOptions} />
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <HighchartsReact highcharts={Highcharts} options={ratingPieChartOptions} />
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
