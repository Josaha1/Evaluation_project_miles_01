import MainLayout from '@/Layouts/MainLayout'
import { router, useForm, usePage } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { PlusCircle, Trash2, Layers, Save } from 'lucide-react'

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
            onSuccess: () => toast.success('เพิ่มด้านสำเร็จ'),
            onError: () => toast.error('เกิดข้อผิดพลาดในการเพิ่มด้าน'),
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
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                เพิ่มด้าน <span className="text-gradient-primary">(Aspect)</span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                เพิ่มด้านใหม่สำหรับ {part.title}
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
                            {data.aspects.map((aspect, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-2 border-violet-100 dark:border-violet-900/30 p-5 rounded-xl bg-violet-50/40 dark:bg-violet-900/10 space-y-4 relative"
                                >
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg gradient-primary text-white text-xs font-bold">
                                                {i + 1}
                                            </span>
                                            ด้านที่ {i + 1}
                                        </h3>
                                        {data.aspects.length > 1 && (
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ชื่อด้าน</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                            value={aspect.name}
                                            onChange={e => handleChange(i, 'name', e.target.value)}
                                            placeholder="ระบุชื่อด้าน..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="inline-flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer group">
                                            <input type="hidden" name={`aspects[${i}].has_subaspects`} value="false" />
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={aspect.has_subaspects}
                                                    onChange={e => handleChange(i, 'has_subaspects', e.target.checked)}
                                                />
                                                <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-violet-600 transition-colors"></div>
                                                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                                            </div>
                                            <span className="font-medium">มีด้านย่อย (Sub-Aspects)</span>
                                        </label>
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
                                    เพิ่มด้านใหม่
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
                                    {processing ? 'กำลังบันทึก...' : 'บันทึกด้าน'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    )
}
