import MainLayout from '@/Layouts/MainLayout'
import { useForm, router, usePage } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'
import { useEffect } from 'react'

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
      onSuccess: () => toast.success('อัปเดตด้านเรียบร้อยแล้ว ✅'),
      onError: () => toast.error('ไม่สามารถอัปเดตด้านได้ ❌')
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
      <div className="max-w-2xl mx-auto py-10">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300">ชื่อด้าน</label>
            <input
              type="text"
              className="w-full border p-2 rounded dark:bg-gray-800 dark:text-white"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              required
            />
          </div>

          

          <div>
            <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="mr-2"
                checked={data.has_subaspects}
                onChange={e => setData('has_subaspects', e.target.checked)}
              />
              มีด้านย่อย (Sub-Aspects)
            </label>
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={processing}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
