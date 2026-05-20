import MainLayout from '@/Layouts/MainLayout'
import { useForm, router, usePage } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Pencil, Save } from 'lucide-react'

export default function AdminAspectEdit() {
  const { evaluation, part, aspect, flash } = usePage().props as any

  const { data, setData, put, processing, errors } = useForm({
    name: aspect.name || '',
    description: aspect.description || '',
    has_subaspects: aspect.has_subaspects || false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    put(route('aspects.update', { evaluation: evaluation.id, part: part.id, aspect: aspect.id }), {
      onSuccess: () => toast.success('อัปเดตด้านเรียบร้อยแล้ว'),
      onError: () => toast.error('ไม่สามารถอัปเดตด้านได้')
    })
  }

  useEffect(() => {
    if (flash.success) toast.success(flash.success)
    if (flash.error) toast.error(flash.error)
  }, [flash])

  return (
    <MainLayout
      title="แก้ไขด้าน (Aspect)"
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
            { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
            { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
            { label: 'ส่วน', href: route('parts.index', { evaluation: evaluation.id }) },
            { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
            { label: 'แก้ไขด้าน', active: true },
          ]}
        />
      }
    >
      <div className="gradient-primary-soft min-h-screen">
        <div className="max-w-2xl mx-auto py-10 px-4">
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
                แก้ไขด้าน <span className="text-gradient-primary">(Aspect)</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                แก้ไขด้าน: {aspect.name}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ชื่อด้าน</label>
                <input
                  type="text"
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 p-2.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-800 dark:text-white transition-all"
                  value={data.name}
                  onChange={e => setData('name', e.target.value)}
                  required
                />
                {errors.name && <p className="text-sm text-red-500 mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label className="inline-flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={data.has_subaspects}
                      onChange={e => setData('has_subaspects', e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-violet-600 transition-colors"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <span className="font-medium">มีด้านย่อย (Sub-Aspects)</span>
                </label>
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
