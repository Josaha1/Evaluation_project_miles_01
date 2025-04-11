import MainLayout from '@/Layouts/MainLayout'
import { router, useForm, usePage } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { useEffect } from 'react'

export default function AdminSubAspectCreate() {
    const { evaluation, part, aspect, flash } = usePage().props as any

    const { data, setData, post, processing, errors } = useForm({
        subaspects: [
            { name: ''},
        ]
    })

    const handleAdd = () => {
        setData('subaspects', [...data.subaspects, { name: '', description: '' }])
    }

    const handleRemove = (index: number) => {
        if (data.subaspects.length > 1) {
            setData('subaspects', data.subaspects.filter((_, i) => i !== index))
        }
    }

    const handleChange = (index: number, field: string, value: string) => {
        const updated = [...data.subaspects]
        updated[index][field] = value
        setData('subaspects', updated)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('subaspects.store', { evaluation: evaluation.id, part: part.id, aspect: aspect.id }), {
            onSuccess: () => toast.success('เพิ่มด้านย่อยสำเร็จ ✅'),
            onError: () => toast.error('เกิดข้อผิดพลาดในการเพิ่มด้านย่อย ❌'),
        })
    }

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])

    return (
        <MainLayout title="เพิ่มด้านย่อย (Sub-Aspect)" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                    { label: 'ส่วน', href: route('parts.index', { evaluation: evaluation.id }) },
                    { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                    { label: aspect.name, href: route('subaspects.index', { evaluation: evaluation.id, part: part.id, aspect: aspect.id }) },
                    { label: 'เพิ่มด้านย่อย', active: true }
                ]}
            />
        }>
            <div className="max-w-3xl mx-auto py-10">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
                    {data.subaspects.map((sub, i) => (
                        <div key={i} className="border p-4 rounded bg-gray-50 dark:bg-gray-700 space-y-4 relative">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700 dark:text-white">ด้านย่อยที่ {i + 1}</h3>
                                {data.subaspects.length > 1 && (
                                    <button type="button" className="text-red-600 text-sm" onClick={() => handleRemove(i)}>ลบ</button>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300">ชื่อด้านย่อย</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded dark:bg-gray-800 dark:text-white"
                                    value={sub.name}
                                    onChange={e => handleChange(i, 'name', e.target.value)}
                                    required
                                />
                            </div>
                            
                        </div>
                    ))}

                    <div className="flex justify-between items-center">
                        <button type="button" onClick={handleAdd} className="text-blue-600 hover:text-blue-800 text-sm">
                            ➕ เพิ่มด้านย่อยใหม่
                        </button>

                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                            disabled={processing}
                        >
                            {processing ? 'กำลังบันทึก...' : 'บันทึกด้านย่อย'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
