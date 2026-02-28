import { Head } from '@inertiajs/react'
import { CheckCircle, ArrowLeft } from 'lucide-react'

export default function ExternalThankYou() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
            <Head title="ขอบคุณ - ระบบประเมิน 360 องศา" />

            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    ขอบคุณครับ/ค่ะ
                </h1>

                <p className="text-lg text-gray-600 mb-2">
                    การประเมินของท่านสำเร็จเรียบร้อยแล้ว
                </p>

                <p className="text-sm text-gray-500 mb-8">
                    ข้อมูลการประเมินของท่านจะถูกเก็บเป็นความลับ
                    และนำไปใช้ในการพัฒนาบุคลากรต่อไป
                </p>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
                    <p className="text-sm text-gray-600">
                        ท่านสามารถปิดหน้าต่างนี้ได้เลย หรือคลิกปุ่มด้านล่างเพื่อกลับหน้าหลัก
                    </p>
                </div>

                <a
                    href={route('external.login')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    กลับหน้าหลัก
                </a>
            </div>
        </div>
    )
}
