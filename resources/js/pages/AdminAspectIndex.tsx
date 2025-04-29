import MainLayout from '@/Layouts/MainLayout'
import { usePage, router } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { Pencil, Trash2, PlusCircle, AlignLeft } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

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
      <div className="max-w-5xl mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🧩 ด้านใน {part.title}</h1>
          <a
            href={route('aspects.create', { evaluation: evaluation.id, part: part.id })}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มด้านใหม่
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left">
              <tr>
                <th className="p-4">ชื่อด้าน</th>
                <th className="p-4">ด้านย่อย</th>
                <th className="p-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {aspects.length > 0 ? aspects.map((a: any) => (
                <tr key={a.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4 text-gray-800 dark:text-white font-medium inline-flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-purple-500" /> {a.name}

                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                    {a.has_subaspects ? (
                      <a
                        href={route('subaspects.index', {
                          evaluation: evaluation.id,
                          part: part.id,
                          aspect: a.id
                        })}
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        จัดการด้านย่อย
                      </a>
                    ) : '❌ ไม่มีด้านย่อย'}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-3 flex-wrap">
                      {!a.has_subaspects && (
                        <a
                          href={route('questions.index.aspect', {
                            evaluation: evaluation.id,
                            part: part.id,
                            aspect: a.id,
                          })}
                          className="text-green-600 hover:text-green-800 text-xs underline"
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
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Pencil className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 dark:text-gray-400 p-6">
                    ยังไม่มีด้านในส่วนนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  )
}
