import MainLayout from '@/Layouts/MainLayout'
import { usePage, router } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { Pencil, Trash2, PlusCircle, AlignLeft, Layers, FolderOpen } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export default function AdminAspectIndex() {
  const { evaluation, part, aspects, flash } = usePage().props as any

  useEffect(() => {
    if (flash.success) toast.success(flash.success)
    if (flash.error) toast.error(flash.error)
  }, [flash])

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบด้านนี้?')) {
      router.delete(route('aspects.destroy', { evaluation: evaluation.id, part: part.id, aspect: id }))
    }
  }

  return (
    <MainLayout title={`ด้านใน ${part.title}`} breadcrumb={
      <Breadcrumb
        items={[
          { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
          { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
          { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
          { label: 'จัดการส่วน', href: route('parts.index', { evaluation: evaluation.id }) },
          { label: part.title, active: true },
        ]}
      />
    }>
      <div className="gradient-primary-soft min-h-screen">
        <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
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
                  ด้านใน <span className="text-gradient-primary">{part.title}</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  จัดการด้าน (Aspects) ของส่วนนี้
                </p>
              </div>
            </div>
            <a
              href={route('aspects.create', { evaluation: evaluation.id, part: part.id })}
              className="inline-flex items-center px-5 py-2.5 gradient-primary text-white rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.03] transition-all duration-200 font-medium"
            >
              <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มด้านใหม่
            </a>
          </motion.div>

          {/* Table Card */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/60 dark:divide-gray-700/60">
                <thead>
                  <tr className="bg-violet-50/80 dark:bg-violet-900/20">
                    <th className="p-4 text-left text-sm font-semibold text-violet-700 dark:text-violet-300">ชื่อด้าน</th>
                    <th className="p-4 text-left text-sm font-semibold text-violet-700 dark:text-violet-300">ด้านย่อย</th>
                    <th className="p-4 text-center text-sm font-semibold text-violet-700 dark:text-violet-300">การจัดการ</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                  {aspects.length > 0 ? aspects.map((a: any) => (
                    <motion.tr
                      key={a.id}
                      variants={rowVariants}
                      className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                            <AlignLeft className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">{a.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                        {a.has_subaspects ? (
                          <a
                            href={route('subaspects.index', {
                              evaluation: evaluation.id,
                              part: part.id,
                              aspect: a.id
                            })}
                            className="inline-flex items-center gap-1.5 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 text-xs font-medium underline underline-offset-2 transition-colors"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            จัดการด้านย่อย
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                            ไม่มีด้านย่อย
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2 flex-wrap">
                          {!a.has_subaspects && (
                            <a
                              href={route('questions.index.aspect', {
                                evaluation: evaluation.id,
                                part: part.id,
                                aspect: a.id,
                              })}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            >
                              คำถาม
                            </a>
                          )}
                          <a
                            href={route('aspects.edit', {
                              evaluation: evaluation.id,
                              part: part.id,
                              aspect: a.id,
                            })}
                            className="p-2 text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4.5 h-4.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="text-center text-gray-400 dark:text-gray-500 p-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700/50">
                            <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          </div>
                          <p className="text-sm">ยังไม่มีด้านในส่วนนี้</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </motion.tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
