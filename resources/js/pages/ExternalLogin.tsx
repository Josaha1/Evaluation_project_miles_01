import { useState, useEffect } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import { KeyRound, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface PageProps {
    prefillCode: string
    flash?: { success?: string; error?: string }
    errors?: { code?: string[] }
}

export default function ExternalLogin() {
    const { prefillCode, flash, errors: pageErrors } = usePage<PageProps>().props

    const { data, setData, post, processing, errors } = useForm({
        code: prefillCode || '',
    })

    useEffect(() => {
        if (prefillCode) {
            setData('code', prefillCode)
        }
    }, [prefillCode])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('external.login.submit'))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <Head title="เข้าสู่ระบบประเมินภายนอก" />

            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full mb-4 shadow-lg">
                        <KeyRound className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        ระบบประเมิน 360 องศา
                    </h1>
                    <p className="text-gray-600">
                        สำหรับผู้ประเมินภายนอก
                    </p>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-sm text-green-700">{flash.success}</p>
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700">{flash.error}</p>
                    </div>
                )}

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">เข้าสู่ระบบ</h2>
                        <p className="text-gray-500 text-sm">
                            กรุณากรอก Access Code ที่ได้รับเพื่อเข้าทำแบบประเมิน
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="code" className="block text-sm font-semibold text-gray-700">
                                Access Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value.toUpperCase())}
                                className="block w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-mono tracking-widest uppercase"
                                placeholder="XXXXXXXX"
                                maxLength={20}
                                autoFocus
                            />
                            {errors.code && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{errors.code}</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing || !data.code}
                            className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-3 ${
                                processing || !data.code
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>กำลังตรวจสอบ...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>เข้าสู่ระบบ</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-center text-gray-500">
                            หากไม่มี Access Code กรุณาติดต่อเจ้าหน้าที่ผู้ดูแลระบบ
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
