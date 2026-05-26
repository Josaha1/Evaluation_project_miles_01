import MainLayout from '@/Layouts/MainLayout'
import { useForm, router, usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { PlusCircle, Save } from 'lucide-react'

export default function AdminPartCreate() {
  const { evaluation, flash } = usePage().props as any

  const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('parts.store', { evaluation: evaluation.id }))
  }

  useEffect(() => {
    if (flash.success) toast.success(flash.success)
    if (flash.error) toast.error(flash.error)
  }, [flash])

  return (
    <MainLayout title="เพิ่มส่วนใหม่" breadcrumb={
      <Breadcrumb
        items={[
          { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
          { label: 'แบบประเมิน', href: route('evaluations.index') },
          { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
          { label: 'เพิ่มส่วน', active: true },
        ]}
      />
    }>
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
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                เพิ่มส่วนใหม่
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                สร้างส่วนใหม่สำหรับ {evaluation.title}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ชื่อส่วน</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                  placeholder="ระบุชื่อส่วน..."
                  required
                />
                {errors.title && <p className="text-sm text-red-500 mt-1.5">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">คำอธิบาย</label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all min-h-[100px]"
                  placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)..."
                />
              </div>

              {/* Auto-order display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ลำดับ</label>
                <input
                  type="number"
                  value={(evaluation.parts?.length || 0) + 1}
                  readOnly
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ลำดับจะถูกกำหนดโดยอัตโนมัติ</p>
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
                  {processing ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  )
}
