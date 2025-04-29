import MainLayout from '@/Layouts/MainLayout'
import { useForm, router, usePage } from '@inertiajs/react'
import { useEffect } from 'react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner'

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
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow space-y-6">
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">ชื่อส่วน</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData('title', e.target.value)}
            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          {errors.title && <div className="text-sm text-red-500 mt-1">{errors.title}</div>}
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">คำอธิบาย</label>
          <textarea
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        

        {/* ✅ แสดงลำดับแบบไม่ให้แก้ */}
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">ลำดับ</label>
          <input
            type="number"
            value={(evaluation.parts?.length || 0) + 1}
            readOnly
            className="w-full mt-1 p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
          />
        </div>


        <div className="text-right">
          <button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
            บันทึก
          </button>
        </div>
      </form>
    </MainLayout>
  )
}
