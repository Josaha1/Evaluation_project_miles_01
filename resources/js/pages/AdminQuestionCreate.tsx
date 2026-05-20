import MainLayout from '@/Layouts/MainLayout'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { useForm, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { PlusCircle, Save, Trash2, FileText } from 'lucide-react'

// Score color mapping: 5=emerald, 4=blue, 3=amber, 2=orange, 1=red
const scoreColors: Record<number, string> = {
    5: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
    4: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
    3: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
    2: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
    1: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
}

export default function AdminQuestionCreate() {
    const { evaluation, part, aspects, subaspects = [], selectedAspect, selectedSub, flash } = usePage().props as any

    const { data, setData, post, processing, errors } = useForm({
        aspect_id: selectedAspect ?? '',
        sub_aspect_id: selectedSub ?? '',
        title: '',
        type: 'rating',
        options: [{ label: '', score: 5 }],
    })

    const [hasSubAspect, setHasSubAspect] = useState(false)

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
        if (data.type === 'open_text') {
            setData('options', [])
        } else if (data.options.length === 0) {
            setData('options', [{ label: '', score: data.type === 'rating' ? 5 : null }])
        }
    }, [flash, data.type])

    useEffect(() => {
        const aspect = aspects.find((a: any) => a.id === Number(data.aspect_id))
        if (aspect?.has_subaspects) {
            setHasSubAspect(true)
        } else {
            setHasSubAspect(false)
            setData('sub_aspect_id', '')
        }
    }, [data.aspect_id])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const payload = { ...data }

        // If open_text, don't send options
        if (data.type === 'open_text') {
            delete payload.options
        }

        post(route('questions.store', { evaluation: evaluation.id, part: part.id }), {
            preserveScroll: true,
            data: payload,
        })
    }

    return (
        <MainLayout title="เพิ่มคำถาม" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                    { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                    { label: 'เพิ่มคำถาม', active: true },
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
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                เพิ่มคำถาม
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                สร้างคำถามใหม่สำหรับ {part.title}
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
                            {/* Aspect select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">เลือกด้าน</label>
                                <select
                                    autoFocus
                                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                    value={data.aspect_id}
                                    onChange={e => setData('aspect_id', e.target.value)}
                                    required
                                >
                                    <option value="">-- เลือกด้าน --</option>
                                    {aspects.map((aspect: any) => (
                                        <option key={aspect.id} value={aspect.id}>
                                            {aspect.name} {aspect.has_subaspects ? '(มีด้านย่อย)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub-aspect select */}
                            {hasSubAspect && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">เลือกด้านย่อย</label>
                                    <select
                                        className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                        value={data.sub_aspect_id}
                                        onChange={e => setData('sub_aspect_id', e.target.value)}
                                        required
                                    >
                                        <option value="">-- เลือกด้านย่อย --</option>
                                        {subaspects
                                            .filter((s: any) => s.aspect_id === Number(data.aspect_id))
                                            .map((sub: any) => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                    </select>
                                </motion.div>
                            )}

                            {/* Question title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">คำถาม</label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    placeholder="ระบุคำถาม..."
                                    required
                                />
                            </div>

                            {/* Question type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ประเภทคำถาม</label>
                                <select
                                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                    required
                                >
                                    <option value="rating">Rating</option>
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="choice">Choice</option>
                                    <option value="open_text">Open Text</option>
                                </select>
                            </div>

                            {/* Options (not for open_text) */}
                            {data.type !== 'open_text' && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ตัวเลือก</label>

                                    {/* Display options in reverse order (5→1) for rating type */}
                                    {(data.type === 'rating'
                                        ? [...data.options].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                                        : data.options
                                    ).map((opt, displayIdx) => {
                                        // Find actual index in data.options for state updates
                                        const actualIdx = data.type === 'rating'
                                            ? data.options.indexOf(opt)
                                            : displayIdx

                                        return (
                                            <motion.div
                                                key={actualIdx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex gap-2 items-center"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder={`ตัวเลือกที่ ${displayIdx + 1}`}
                                                    value={opt.label}
                                                    onChange={e => {
                                                        const newOpts = [...data.options]
                                                        newOpts[actualIdx].label = e.target.value
                                                        setData('options', newOpts)
                                                    }}
                                                    className="flex-1 rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                                                />

                                                {data.type === 'rating' && (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="คะแนน"
                                                            value={opt.score ?? ''}
                                                            onChange={e => {
                                                                const newOpts = [...data.options]
                                                                newOpts[actualIdx].score = parseInt(e.target.value)
                                                                setData('options', newOpts)
                                                            }}
                                                            className={cn(
                                                                "w-24 rounded-xl border-2 p-2.5 text-center font-semibold transition-all focus:ring-2 focus:ring-violet-500",
                                                                scoreColors[opt.score] || "border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                                            )}
                                                        />
                                                    </div>
                                                )}

                                                {data.options.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newOpts = data.options.filter((_, idx) => idx !== actualIdx)
                                                            setData('options', newOpts)
                                                        }}
                                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        )
                                    })}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('options', [...data.options, { label: '', ...(data.type === 'rating' ? { score: 1 } : {}) }])
                                        }
                                        className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 text-sm font-medium hover:bg-violet-50 dark:hover:bg-violet-900/20 px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        เพิ่มตัวเลือก
                                    </button>
                                </div>
                            )}

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
                                    {processing ? 'กำลังบันทึก...' : 'บันทึกคำถาม'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    )
}
