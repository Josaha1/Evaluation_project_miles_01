import MainLayout from '@/Layouts/MainLayout';
import { router, usePage } from '@inertiajs/react';
import { useState,useEffect } from 'react';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';
export default function AdminEvaluationCreate() {
     const { flash } = usePage().props as any
    const [form, setForm] = useState({
        title: '',
        description: '',
        user_type: 'internal', // default
        grade_min: 9,
        grade_max: 12,
    })


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        router.post(route('evaluations.store'), form)
    }
    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success)
        } else if (flash.error) {
            toast.error(flash.error)
        }
    }, [flash])
    return (
        <MainLayout title="สร้างแบบประเมินใหม่" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: 'สร้างแบบประเมินใหม่', active: true },
                ]}
            />
        }>
            <div className="max-w-3xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📝 สร้างแบบประเมินใหม่</h1>
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 shadow rounded p-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแบบประเมิน</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full mt-1 border rounded p-2 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">คำอธิบายเพิ่มเติม</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full mt-1 border rounded p-2 dark:bg-gray-700 dark:text-white"
                            rows={3}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">ประเภทบุคคล</label>
                        <select
                            value={form.user_type}
                            onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                            className="w-full border p-2 rounded"
                        >
                            <option value="internal">บุคลากรภายใน</option>
                            <option value="external">บุคลากรภายนอก</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">ระดับขั้นต่ำ</label>
                            <input
                                type="number"
                                value={form.grade_min}
                                onChange={(e) => setForm({ ...form, grade_min: parseInt(e.target.value) })}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">ระดับขั้นสูง</label>
                            <input
                                type="number"
                                value={form.grade_max}
                                onChange={(e) => setForm({ ...form, grade_max: parseInt(e.target.value) })}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                    </div>


                    <div className="text-right">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            ➕ สร้างแบบประเมิน
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
