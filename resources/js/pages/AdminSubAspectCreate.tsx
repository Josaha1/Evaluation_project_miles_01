import MainLayout from '@/Layouts/MainLayout'
import { router, useForm, usePage } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Layers3, PlusCircle, Trash2, Save } from 'lucide-react'

export default function AdminSubAspectCreate() {
    const { evaluation, part, aspect, flash } = usePage().props as any

    const { data, setData, post, processing, errors } = useForm({
        subaspects: [
            { name: '' },
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
            onSuccess: () => toast.success('เพิ่มด้านย่อยสำเร็จ'),
            onError: () => toast.error('เกิดข้อผิดพลาดในการเพิ่มด้านย่อย'),
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
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-3xl mx-auto py-10 px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="p-2.5 rounded-xl gradient-primary text-white shadow-lg shadow-violet-500/25">
                            <Layers3 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                เพิ่มด้านย่อย <span className="text-gradient-primary">(Sub-Aspect)</span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                เพิ่มด้านย่อยสำหรับ {aspect.name}
                            </p>
                        </div>
                    </motion.div>

                    {/* Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-5 glass-card rounded-2xl p-6">
                            {data.subaspects.map((sub, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-2 border-emerald-100 dark:border-emerald-900/30 p-5 rounded-xl bg-emerald-50/40 dark:bg-emerald-900/10 space-y-4 relative"
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            ด้านย่อยที่ {i + 1}
                                        </h3>
                                        {data.subaspects.length > 1 && (
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-colors"
                                                onClick={() => handleRemove(i)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                ลบ
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ชื่อด้านย่อย</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                            value={sub.name}
                                            onChange={e => handleChange(i, 'name', e.target.value)}
                                            placeholder="ระบุชื่อด้านย่อย..."
                                            required
                                        />
                                    </div>
                                </motion.div>
                            ))}

                            <div className="flex justify-between items-center pt-2">
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 px-3 py-2 rounded-xl transition-colors"
                                >
                                    <PlusCircle className="w-4.5 h-4.5" />
                                    เพิ่มด้านย่อยใหม่
                                </button>

                                <button
                                    type="submit"
                                    className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03] transition-all duration-200 font-medium",
                                        processing && "opacity-60 cursor-not-allowed"
                                    )}
                                    disabled={processing}
                                >
                                    <Save className="w-4.5 h-4.5" />
                                    {processing ? 'กำลังบันทึก...' : 'บันทึกด้านย่อย'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    )
}
