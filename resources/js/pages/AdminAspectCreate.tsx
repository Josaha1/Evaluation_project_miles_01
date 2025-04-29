import MainLayout from '@/Layouts/MainLayout'
import { router, useForm, usePage } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { useEffect } from 'react'

export default function AdminAspectCreate() {
    const { evaluation, part, flash } = usePage().props as any

    const { data, setData, post, processing, errors } = useForm({
        aspects: [
            { name: '', description: '', has_subaspects: false },
        ],
    })


    const handleAdd = () => {
        setData('aspects', [...data.aspects, { name: '', description: '', has_subaspects: false }])
    }

    const handleRemove = (index: number) => {
        if (data.aspects.length > 1) {
            setData('aspects', data.aspects.filter((_, i) => i !== index))
        }
    }

    const handleChange = (index: number, field: string, value: any) => {
        const updated = [...data.aspects]
        updated[index][field] = value
        setData('aspects', updated)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post(route('aspects.store', { evaluation: evaluation.id, part: part.id }), {
            onSuccess: () => toast.success('เพิ่มด้านสำเร็จ ✅'),
            onError: () => toast.error('เกิดข้อผิดพลาดในการเพิ่มด้าน ❌'),
        })
    }

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])

    return (
        <MainLayout title="เพิ่มด้าน (Aspect)" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                    { label: 'ส่วน', href: route('parts.index', { evaluation: evaluation.id }) },
                    { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                    { label: 'เพิ่มด้าน', active: true },
                ]}
            />
        }>
            <div className="max-w-3xl mx-auto py-10">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
                    {data.aspects.map((aspect, i) => (
                        <div key={i} className="border p-4 rounded bg-gray-50 dark:bg-gray-700 space-y-4 relative">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-700 dark:text-white">ด้านที่ {i + 1}</h3>
                                {data.aspects.length > 1 && (
                                    <button type="button" className="text-red-600 text-sm" onClick={() => handleRemove(i)}>ลบ</button>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 dark:text-gray-300">ชื่อด้าน</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded dark:bg-gray-800 dark:text-white"
                                    value={aspect.name}
                                    onChange={e => handleChange(i, 'name', e.target.value)}
                                    required
                                />
                            </div>                        
                            <div>
                                <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <input type="hidden" name={`aspects[${i}].has_subaspects`} value="false" />
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={aspect.has_subaspects}
                                        onChange={e => handleChange(i, 'has_subaspects', e.target.checked)}
                                    />

                                    มีด้านย่อย (Sub-Aspects)
                                </label>
                            </div>

                        </div>
                    ))}

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                            ➕ เพิ่มด้านใหม่
                        </button>

                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                            disabled={processing}
                        >
                            {processing ? 'กำลังบันทึก...' : 'บันทึกด้าน'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
