import MainLayout from '@/Layouts/MainLayout'
import { usePage, router } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { PlusCircle, Pencil, Trash2, Layers } from 'lucide-react'

export default function AdminSectionIndex() {
  const { evaluation, sections } = usePage().props as any

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดนี้?')) {
      router.delete(route('sections.destroy', { evaluation: evaluation.id, section: id }))
    }
  }

  return (
    <MainLayout title="จัดการหมวด" breadcrumb={
      <Breadcrumb
        items={[
          { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
          { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
          { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
          { label: 'หมวด', active: true },
        ]}
      />
    }>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">📂 หมวดใน {evaluation.title}</h1>
          <a
            href={route('sections.create', { evaluation: evaluation.id })}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มหมวดใหม่
          </a>
        </div>

        {sections.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">ยังไม่มีหมวดในแบบประเมินนี้</p>
        ) : (
          <div className="space-y-4">
            {sections.map((section: any) => (
              <div key={section.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{section.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{section.description}</p>
                    {section.user_types?.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ประเภท: {section.user_types.map((ut: any) => `${ut.user_type} (${ut.grade_min}–${ut.grade_max})`).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => router.visit(route('sections.edit', { evaluation: evaluation.id, section: section.id }))} className="text-indigo-600 hover:text-indigo-800">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(section.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
