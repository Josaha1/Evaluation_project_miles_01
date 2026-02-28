import { usePage } from "@inertiajs/react"
import { BarChart, Users, Download, ListChecks, Building2, Briefcase, UserCog, Shield, KeyRound, Globe, CheckCircle, ClipboardList, FileText, TrendingUp } from 'lucide-react'
import MainLayout from "@/Layouts/MainLayout"

interface GradeStat {
    label: string;
    color: string;
    evaluatees: number;
}

interface Stats {
    totalUsers: number;
    totalAdmins: number;
    totalAssignments: number;
    uniqueEvaluators: number;
    uniqueEvaluatees: number;
    completedEvaluators: number;
    completionRate: number;
    publishedEvaluations: number;
    gradeStats: GradeStat[];
    angleBreakdown: Record<string, number>;
    externalCodeCount: number;
    externalUsedCount: number;
    externalOrgCount: number;
    fiscalYear: string;
}

interface PageProps {
    stats: Stats;
    [key: string]: unknown;
}

const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
};

const angleLabels: Record<string, string> = {
    top: 'บนลงล่าง',
    bottom: 'ล่างขึ้นบน',
    left: 'ซ้าย',
    right: 'ขวา',
    self: 'ตนเอง',
};

export default function AdminDashboard() {
    const { stats } = usePage<PageProps>().props;

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
    ];

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
    ];

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
    ];

    const renderActionCard = (action: { title: string; description: string; icon: React.ReactNode; href: string }, index: number) => (
        <a
            key={index}
            href={action.href}
            className="group block bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition hover:scale-[1.02]"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="text-indigo-600 dark:text-indigo-400">{action.icon}</div>
                <BarChart className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">{action.title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
        </a>
    );

    return (
        <MainLayout title="Admin Dashboard">
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        แดชบอร์ดผู้ดูแลระบบ
                    </h1>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        ปีงบประมาณ พ.ศ. {stats?.fiscalYear ? Number(stats.fiscalYear) + 543 : ''}
                    </span>
                </div>

                {/* KPI Cards */}
                {stats && (
                    <div className="mb-10">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">ผู้ใช้ทั้งหมด</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalUsers}</p>
                                <p className="text-xs text-gray-400 mt-1">ผู้ดูแล {stats.totalAdmins} คน</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <ClipboardList className="w-5 h-5 text-blue-500" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">การมอบหมาย</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalAssignments}</p>
                                <p className="text-xs text-gray-400 mt-1">ผู้ประเมิน {stats.uniqueEvaluators} คน</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">อัตราการทำแบบประเมิน</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completionRate}%</p>
                                <p className="text-xs text-gray-400 mt-1">{stats.completedEvaluators}/{stats.uniqueEvaluators} คน</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">แบบประเมินที่เผยแพร่</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.publishedEvaluations}</p>
                                <p className="text-xs text-gray-400 mt-1">ผู้ถูกประเมิน {stats.uniqueEvaluatees} คน</p>
                            </div>
                        </div>

                        {/* Grade Group Breakdown + Angle Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> ผู้ถูกประเมินตามกลุ่มระดับ
                                </h3>
                                <div className="space-y-3">
                                    {stats.gradeStats.map((g, i) => (
                                        <div key={i} className={`flex items-center justify-between px-3 py-2 rounded border ${colorMap[g.color] || ''}`}>
                                            <span className="text-sm font-medium">{g.label}</span>
                                            <span className="text-lg font-bold">{g.evaluatees} คน</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <BarChart className="w-4 h-4" /> การมอบหมายตามมุมประเมิน
                                </h3>
                                <div className="space-y-2">
                                    {Object.entries(stats.angleBreakdown).map(([angle, count]) => {
                                        const pct = stats.totalAssignments > 0 ? Math.round((count / stats.totalAssignments) * 100) : 0;
                                        return (
                                            <div key={angle}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">{angleLabels[angle] || angle}</span>
                                                    <span className="font-medium text-gray-800 dark:text-white">{count} ({pct}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* External stats */}
                                {stats.externalOrgCount > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            องค์กรภายนอก {stats.externalOrgCount} แห่ง | Access Codes {stats.externalUsedCount}/{stats.externalCodeCount} ใช้แล้ว
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin Actions */}
                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">เมนูสำหรับผู้ดูแลระบบ</h2>
                    <div className="grid sm:grid-cols-4 gap-6">
                        {actions.map(renderActionCard)}
                    </div>
                </div>

                {/* Org Structure */}
                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">การจัดการโครงสร้างองค์กร</h2>
                    <div className="grid sm:grid-cols-4 gap-6">
                        {orgActions.map(renderActionCard)}
                    </div>
                </div>

                {/* External System */}
                <div className='mb-10'>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">ระบบประเมินภายนอก</h2>
                    <div className="grid sm:grid-cols-4 gap-6">
                        {externalActions.map(renderActionCard)}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
