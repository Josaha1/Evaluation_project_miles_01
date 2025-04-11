import MainLayout from '@/Layouts/MainLayout'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { router, useForm, usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function AdminSubAspectEdit() {
    const { evaluation, part, aspect, subaspect, flash } = usePage().props as any

    const { data, setData, put, processing, errors } = useForm({
        name: subaspect.name || '',
        description: subaspect.description || ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        put(
            route('subaspects.update', {
                evaluation: evaluation.id,
                part: part.id,
                aspect: aspect.id,
                subaspect: subaspect.id
            }),
            {
                onSuccess: () => toast.success('บันทึกการแก้ไขด้านย่อยเรียบร้อยแล้ว ✅'),
                onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก ❌')
            }
        )
    }

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])

    return (
        <MainLayout
            title="แก้ไขด้านย่อย"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                        { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                        { label: 'จัดการส่วน', href: route('parts.index', { evaluation: evaluation.id }) },
                        { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                        { label: aspect.name, href: route('subaspects.index', { evaluation: evaluation.id, part: part.id, aspect: aspect.id }) },
                        { label: 'แก้ไขด้านย่อย', active: true }
                    ]}
                />
            }
        >
            <div className="max-w-xl mx-auto py-10">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อด้านย่อย</label>
                        <input
                            type="text"
                            className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            required
                        />
                        {errors.name && <div className="text-sm text-red-500 mt-1">{errors.name}</div>}
                    </div>

                

                    <div className="text-right">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            บันทึกการแก้ไข
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
