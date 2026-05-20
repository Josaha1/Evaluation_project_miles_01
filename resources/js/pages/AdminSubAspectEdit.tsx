import MainLayout from '@/Layouts/MainLayout'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { router, useForm, usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Pencil, Save } from 'lucide-react'

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
                onSuccess: () => toast.success('บันทึกการแก้ไขด้านย่อยเรียบร้อยแล้ว'),
                onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก')
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
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-xl mx-auto py-10 px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="p-2.5 rounded-xl gradient-primary text-white shadow-lg shadow-violet-500/25">
                            <Pencil className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                แก้ไขด้านย่อย
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                แก้ไข: <span className="text-gradient-primary font-medium">{subaspect.name}</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6 glass-card rounded-2xl p-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ชื่อด้านย่อย</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1.5">{errors.name}</p>}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03] transition-all duration-200 font-medium",
                                        processing && "opacity-60 cursor-not-allowed"
                                    )}
                                >
                                    <Save className="w-4.5 h-4.5" />
                                    {processing ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    )
}
