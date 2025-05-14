import MainLayout from "@/Layouts/MainLayout";


export default function Welcome() {
    return (
        <MainLayout title="Welcome">
            <div className="bg-white dark:bg-black text-gray-800 dark:text-gray-200 min-h-screen">
                {/* Main Content */}
                <div className="container mx-auto px-4 py-20 max-w-6xl mt-4">
                    <div className="text-center mb-16">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            โครงการประเมิน 360 องศา <br className="sm:hidden" />
                            กลุ่มผู้บริหารระดับ 5-12 และผู้มีส่วนเกี่ยวข้อง <br className="hidden sm:block" />
                        </h1>
                        <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            ประจำปีงบประมาณ 2568 ของการนิคมอุตสาหกรรมแห่งประเทศไทย (กนอ.) <br />
                            เครื่องมือเพื่อยกระดับศักยภาพและประสิทธิภาพองค์กร
                        </p>
                    </div>

                    {/* Evaluation Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'การประเมินแบบ 360°',
                                description: 'รวบรวมข้อมูลจากหัวหน้า เพื่อนร่วมงาน และลูกน้อง เพื่อสะท้อนภาพรวมศักยภาพ',
                                icon: (
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                ),
                                color: 'text-blue-500',
                            },
                            {
                                title: 'เครื่องมือสนับสนุนผู้บริหาร',
                                description: 'รายงานผลแบบ Interactive Dashboard เพื่อใช้วิเคราะห์และวางแผนเชิงกลยุทธ์',
                                icon: (
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M3 3h18v18H3V3z" />
                                        <path d="M3 9h18" />
                                        <path d="M9 21V9" />
                                    </svg>
                                ),
                                color: 'text-green-500',
                            },
                            {
                                title: 'ความมั่นคงและความเป็นส่วนตัว',
                                description: 'ระบบเก็บข้อมูลด้วยความปลอดภัยสูงตามมาตรฐาน ISO27001',
                                icon: (
                                    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                                    </svg>
                                ),
                                color: 'text-red-500',
                            },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center text-center shadow hover:shadow-xl transition-all hover:scale-[1.02]"
                            >
                                <div className={`w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${feature.color}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Features */}
                    <div className="mt-24">
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
                            คุณสมบัติเด่นของระบบ
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                {
                                    title: 'โปรไฟล์บุคลากร',
                                    desc: 'สามารถสร้างและแก้ไขข้อมูลส่วนตัว เพื่อการวิเคราะห์ที่แม่นยำ',
                                    iconColor: 'text-indigo-600 dark:text-indigo-400',
                                    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
                                    icon: (
                                        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                                            <path d="M4 20v-1c0-2.21 3.58-4 8-4s8 1.79 8 4v1" />
                                        </svg>
                                    ),
                                },
                                {
                                    title: 'ระบบติดตามผล',
                                    desc: 'สามารถดูประวัติการประเมินย้อนหลังและเปรียบเทียบคะแนนพัฒนา',
                                    iconColor: 'text-teal-600 dark:text-teal-400',
                                    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
                                    icon: (
                                        <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M4 6h16M4 12h8m-8 6h16" />
                                        </svg>
                                    ),
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 sm:p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex">
                                        <div className={`flex-shrink-0 ${item.bgColor} rounded-lg p-3`}>
                                            <div className={item.iconColor}>{item.icon}</div>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.title}</h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}