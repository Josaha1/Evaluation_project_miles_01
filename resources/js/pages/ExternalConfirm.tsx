import { Head, router, usePage } from '@inertiajs/react'
import { CheckCircle, User, Building2, FileText, ArrowRight } from 'lucide-react'
import { useState } from 'react'

interface PageProps {
    evaluatee: {
        id: number
        name: string
        position: string | null
    }
    evaluation: {
        id: number
        title: string
    }
    organization: {
        id: number
        name: string
    }
}

export default function ExternalConfirm() {
    const { evaluatee, evaluation, organization } = usePage<PageProps>().props
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = () => {
        setIsSubmitting(true)
        router.post(route('external.confirm.submit'))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <Head title="ยืนยันตัวตน - ระบบประเมิน 360 องศา" />

            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">ยืนยันตัวตน</h1>
                        <p className="text-sm text-gray-500 mt-2">กรุณาตรวจสอบข้อมูลก่อนเริ่มการประเมิน</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">องค์กร</p>
                                <p className="text-sm font-semibold text-gray-900">{organization.name}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">ผู้ถูกประเมิน</p>
                                <p className="text-sm font-semibold text-gray-900">{evaluatee.name}</p>
                                {evaluatee.position && (
                                    <p className="text-xs text-gray-500">{evaluatee.position}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium">แบบประเมิน</p>
                                <p className="text-sm font-semibold text-gray-900">{evaluation.title}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span>กำลังดำเนินการ...</span>
                        ) : (
                            <>
                                <span>เริ่มประเมิน</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
