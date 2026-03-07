import { Head, router, usePage } from '@inertiajs/react'
import { Building2, User, CheckCircle, Clock, ArrowRight, LogOut } from 'lucide-react'

interface Evaluatee {
    id: number
    name: string
    position: string | null
    evaluation_title: string | null
    is_completed: boolean
    access_code_id: number
}

interface PageProps {
    organization: {
        id: number
        name: string
    }
    evaluatees: Evaluatee[]
    currentEvaluateeId: number
}

export default function ExternalDashboard() {
    const { organization, evaluatees, currentEvaluateeId } = usePage<PageProps>().props

    const completedCount = evaluatees.filter(e => e.is_completed).length
    const totalCount = evaluatees.length

    const handleEvaluate = (evaluateeId: number) => {
        router.visit(route('external.evaluate'))
    }

    const handleLogout = () => {
        router.post(route('external.logout'))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <Head title="หน้าหลัก - ระบบประเมินภายนอก" />

            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">{organization.name}</h1>
                            <p className="text-xs text-gray-500">ระบบประเมิน 360 องศา</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">ออกจากระบบ</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress Overview */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">ภาพรวมการประเมิน</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">ความคืบหน้า</span>
                                <span className="font-semibold text-gray-900">
                                    {completedCount}/{totalCount} รายการ
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evaluatee List */}
                <h3 className="text-lg font-bold text-gray-900 mb-4">รายชื่อผู้ถูกประเมิน</h3>
                <div className="space-y-3">
                    {evaluatees.map((evaluatee) => {
                        const isCurrent = evaluatee.id === currentEvaluateeId;

                        return (
                            <div
                                key={evaluatee.access_code_id}
                                className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
                                    evaluatee.is_completed
                                        ? 'border-green-200 bg-green-50/50'
                                        : isCurrent
                                        ? 'border-indigo-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'
                                        : 'border-gray-200 opacity-70'
                                }`}
                                onClick={() => {
                                    if (!evaluatee.is_completed && isCurrent) {
                                        handleEvaluate(evaluatee.id)
                                    }
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            evaluatee.is_completed
                                                ? 'bg-green-100'
                                                : 'bg-indigo-100'
                                        }`}>
                                            {evaluatee.is_completed ? (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <User className="w-5 h-5 text-indigo-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{evaluatee.name}</p>
                                            {evaluatee.position && (
                                                <p className="text-xs text-gray-500">{evaluatee.position}</p>
                                            )}
                                            {evaluatee.evaluation_title && (
                                                <p className="text-xs text-gray-400 mt-0.5">{evaluatee.evaluation_title}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {evaluatee.is_completed ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                เสร็จสิ้น
                                            </span>
                                        ) : isCurrent ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                                <ArrowRight className="w-3.5 h-3.5" />
                                                เริ่มประเมิน
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                รอดำเนินการ
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {evaluatees.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>ไม่พบรายชื่อผู้ถูกประเมิน</p>
                    </div>
                )}
            </div>
        </div>
    )
}
