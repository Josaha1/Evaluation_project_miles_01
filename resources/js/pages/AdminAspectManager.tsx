import { useEffect, useState } from 'react'
import MainLayout from '@/Layouts/MainLayout'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { Pencil, Trash2, PlusCircle, Save, XCircle } from 'lucide-react'
import { router, usePage } from '@inertiajs/react'
import { toast } from 'sonner'
import MultiSelect from '@/Components/ui/MultiSelect'

interface Aspect {
  id: number
  name: string
  description?: string
  sections: { id: number; name: string; user_types: string[] }[]
}

interface Section {
  id: number
  name: string
  user_types: {
    user_type: string
    grade_min: number
    grade_max: number
  }[]
}


interface PageProps {
  flash?: { success?: string; error?: string }
  aspects: {
    data: Aspect[]
    current_page: number
    last_page: number
    links: { url: string | null; label: string; active: boolean }[]
  }
  sections: Section[]
  errors?: Record<string, string>
}

const sectionTargetOptions = [
  { value: 'internal', label: 'บุคลากรภายใน' },
  { value: 'external', label: 'บุคลากรภายนอก' },
]
const formatUserTypes = (types: { user_type: string; grade_min: number; grade_max: number }[]) => {
  return types.map((t) => {
    const label = sectionTargetOptions.find(opt => opt.value === t.user_type)?.label || t.user_type
    return `${label} (${t.grade_min}–${t.grade_max})`
  }).join(', ')
}
export default function AdminAspectManager() {
  const { flash, aspects, sections, errors } = usePage<PageProps>().props

  const getTypeLabels = (types: any[]) => {
    return types.map(t => typeof t === 'string' ? userTypeLabels[t] || t : userTypeLabels[t.user_type] || t.user_type).join(', ')
  }


  const sectionOptions = sections.map(section => ({
    value: section.id,
    label: `${section.name} (${formatUserTypes(section.user_types)})`
  }))



  const [newAspect, setNewAspect] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSectionIds, setNewSectionIds] = useState<number[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingDesc, setEditingDesc] = useState('')
  const [editingSectionIds, setEditingSectionIds] = useState<number[]>([])

  useEffect(() => {
    if (flash?.success) toast.success(flash.success)
    if (flash?.error) toast.error(flash.error)
  }, [flash])

  const handleAdd = () => {
    if (!newAspect.trim() || newSectionIds.length === 0) return
    router.post(route('aspects.store'), {
      name: newAspect,
      description: newDesc,
      section_ids: newSectionIds,
    }, {
      onSuccess: () => {
        setNewAspect('')
        setNewDesc('')
        setNewSectionIds([])
      }
    })

  }

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบด้านนี้?')) {
      router.delete(route('aspects.destroy', id))
    }
  }

  const startEdit = (aspect: Aspect) => {
    setEditingId(aspect.id)
    setEditingName(aspect.name)
    setEditingDesc(aspect.description || '')
    setEditingSectionIds(aspect.sections.map(s => s.id))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingDesc('')
    setEditingSectionIds([])
  }

  const saveEdit = () => {
    if (!editingId || !editingName.trim() || editingSectionIds.length === 0) return
    router.put(route('aspects.update', editingId), {
      name: editingName,
      description: editingDesc,
      section_ids: editingSectionIds,
    }, {
      onSuccess: cancelEdit
    })
  }

  return (
    <MainLayout
      title="จัดการด้าน"
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
            { label: 'จัดการคำถาม', href: route('adminquestionmanager') },
            { label: 'จัดการด้าน', active: true },
          ]}
        />
      }
    >
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">จัดการด้าน</h1>

        {/* เพิ่มด้านใหม่ */}
        <div className="mb-6 grid gap-4">
          <input
            type="text"
            placeholder="ชื่อด้านใหม่"
            value={newAspect}
            onChange={(e) => setNewAspect(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 dark:text-white"
          />
          {errors?.name && <div className="text-red-500 text-sm">{errors.name}</div>}
          <textarea
            placeholder="คำอธิบาย (ถ้ามี)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="border p-2 rounded dark:bg-gray-800 dark:text-white"
          />
          <MultiSelect
            options={sectionOptions}
            selected={newSectionIds}
            onChange={(vals) => setNewSectionIds(vals.map(Number))}
            placeholder="เลือกหมวด (หลายหมวด)"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition w-fit"
          >
            <PlusCircle className="w-5 h-5" /> เพิ่มด้าน
          </button>
        </div>

        {/* รายการด้าน */}
        <div className="overflow-x-auto rounded shadow">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700 text-left text-sm text-gray-600 dark:text-gray-300">
              <tr>
                <th className="p-4">ชื่อด้าน</th>
                <th className="p-4">หมวด</th>
                <th className="p-4">คำอธิบาย</th>
                <th className="p-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {aspects.data.map(aspect => (
                <tr key={aspect.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4 text-gray-800 dark:text-white">
                    {editingId === aspect.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border p-1 rounded dark:bg-gray-700 dark:text-white"
                      />
                    ) : aspect.name}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {editingId === aspect.id ? (
                      <div className="flex gap-2 flex-wrap">
                        {sections.map(section => (
                          <label key={section.id} className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={editingSectionIds.includes(section.id)}
                              onChange={() =>
                                setEditingSectionIds((prev) =>
                                  prev.includes(section.id)
                                    ? prev.filter((id) => id !== section.id)
                                    : [...prev, section.id]
                                )
                              }
                            />
                            {section.name} ({formatUserTypes(section.user_types)})
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {aspect.sections.map((s: any, idx: number) => (
                          <div key={idx} className="flex flex-wrap gap-2">
                            {s.user_types.map((ut: any, i: number) => {
                              const label = sectionTargetOptions.find(opt => opt.value === ut.user_type)?.label || ut.user_type
                              const color = ut.user_type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                              return (
                                <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                                  {s.name} – {label} ({ut.grade_min}–{ut.grade_max})
                                </span>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>


                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {editingId === aspect.id ? (
                      <textarea
                        value={editingDesc}
                        onChange={(e) => setEditingDesc(e.target.value)}
                        className="border p-1 rounded dark:bg-gray-700 dark:text-white w-full"
                      />
                    ) : aspect.description || '-'}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === aspect.id ? (
                      <>
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-800 mr-2">
                          <Save className="w-5 h-5" />
                        </button>
                        <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(aspect)}
                          className="text-indigo-600 hover:text-indigo-800 mr-3"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(aspect.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {aspects.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    ยังไม่มีด้านในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-6 space-x-1">
          {aspects.links.map((link, index) => (
            <button
              key={index}
              disabled={!link.url}
              onClick={() => link.url && router.visit(link.url)}
              className={`px-3 py-1 border rounded text-sm ${link.active
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-white'}`}
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
