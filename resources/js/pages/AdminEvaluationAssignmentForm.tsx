import React from 'react'
import MainLayout from '@/Layouts/MainLayout'
import { useForm, usePage } from '@inertiajs/react'
import Select from 'react-select'
import { toast } from 'sonner'
import Breadcrumb from '@/Components/ui/breadcrumb'
interface User {
    id: number
    fname: string
    lname: string
    position?: string
}

export default function AdminEvaluationAssignmentForm() {
    const { users } = usePage<{ users: User[] }>().props

    const { data, setData, post, processing, reset, errors } = useForm({
        evaluator_id: '',
        evaluatee_id: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (data.evaluator_id === data.evaluatee_id) {
            toast.error('❌ ผู้ประเมินและผู้ถูกประเมินต้องไม่ใช่คนเดียวกัน')
            return
        }

        post(route('assignments.store'), {
            onSuccess: () => {
                toast.success('✅ เพิ่มความสัมพันธ์สำเร็จแล้ว')
                reset()
            },
            onError: () => toast.error('🚫 ไม่สามารถเพิ่มความสัมพันธ์ได้'),
        })
    }

    const userOptions = users.map(user => ({
        value: user.id,
        label: `${user.fname} ${user.lname}${user.position ? ` (${user.position})` : ''}`
    }))

    return (
        <MainLayout title="เพิ่มความสัมพันธ์ผู้ประเมิน" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'จัดการผู้ประเมิน-ผู้ถูกประเมิน', href: route('assignments.index') },
                    { label: 'เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน', active: true },
                ]}
            />
        }>
            <div className="max-w-3xl mx-auto px-6 py-10">
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
                >
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                        เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Evaluator */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                👨‍🏫 ผู้ประเมิน
                            </label>
                            <Select
                                options={userOptions}
                                value={userOptions.find(opt => opt.value === data.evaluator_id)}
                                onChange={(selected) => setData('evaluator_id', selected?.value || '')}
                                placeholder="ค้นหาหรือเลือกผู้ประเมิน..."
                                isClearable
                                classNamePrefix="react-select"
                            />
                            {errors.evaluator_id && (
                                <div className="text-sm text-red-500 mt-1">{errors.evaluator_id}</div>
                            )}
                        </div>

                        {/* Evaluatee */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                🎯 ผู้ถูกประเมิน
                            </label>
                            <Select
                                options={userOptions}
                                value={userOptions.find(opt => opt.value === data.evaluatee_id)}
                                onChange={(selected) => setData('evaluatee_id', selected?.value || '')}
                                placeholder="ค้นหาหรือเลือกผู้ถูกประเมิน..."
                                isClearable
                                classNamePrefix="react-select"
                            />
                            {errors.evaluatee_id && (
                                <div className="text-sm text-red-500 mt-1">{errors.evaluatee_id}</div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end mt-8">
                        <button
                            type="submit"
                            disabled={processing}
                            className={`px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold shadow ${processing ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            ➕ เพิ่มความสัมพันธ์
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
