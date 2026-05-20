import MainLayout from '@/Layouts/MainLayout'
import { router, usePage } from '@inertiajs/react'
import { Layers, PlusCircle, Pencil, Trash2, FolderOpen, GripVertical } from 'lucide-react'
import { useEffect } from 'react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function AdminPartIndex() {
    const { evaluation, flash } = usePage().props as any

    const handleDelete = (partId: number) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบส่วนนี้?')) {
            router.delete(route('parts.destroy', { evaluation: evaluation.id, part: partId }))
        }
    }

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])

    return (
        <MainLayout
            title={`จัดการส่วนของ: ${evaluation.title}`}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                        { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                        { label: 'จัดการส่วน', active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl gradient-primary text-white shadow-lg shadow-violet-500/25">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    รายการส่วนของแบบประเมิน
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    จัดการส่วน (Parts) ของ {evaluation.title}
                                </p>
                            </div>
                        </div>
                        <a
                            href={route('parts.create', { evaluation: evaluation.id })}
                            className="inline-flex items-center px-5 py-2.5 gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03] transition-all duration-200 font-medium"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มส่วนใหม่
                        </a>
                    </motion.div>

                    {/* Parts List */}
                    {evaluation.parts.length > 0 ? (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="space-y-3"
                        >
                            {evaluation.parts.map((part: any, index: number) => (
                                <motion.div
                                    key={part.id}
                                    variants={itemVariants}
                                    className="glass-card rounded-2xl p-5 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-200 group"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl gradient-primary text-white text-sm font-bold shadow-md shadow-violet-500/20">
                                                {part.order}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-800 dark:text-white text-lg truncate">
                                                    {part.title}
                                                </h3>
                                                {part.description && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                        {part.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <a
                                                href={route('aspects.index', { evaluation: evaluation.id, part: part.id })}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                                            >
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                จัดการด้าน
                                            </a>
                                            <a
                                                href={route('parts.edit', { evaluation: evaluation.id, part: part.id })}
                                                className="p-2 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4.5 h-4.5" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(part.id)}
                                                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="glass-card rounded-2xl p-12"
                        >
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700/50">
                                    <Layers className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="text-gray-400 dark:text-gray-500">ยังไม่มีส่วนของแบบประเมินในรายการนี้</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
