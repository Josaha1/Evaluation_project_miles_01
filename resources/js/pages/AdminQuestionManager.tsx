import MainLayout from "@/Layouts/MainLayout"
import { useEffect, useState } from "react"
import { Pencil, Trash2, PlusCircle, BookOpenCheck, MessageSquare, Save, XCircle } from "lucide-react"
import { router, usePage } from "@inertiajs/react"
import Breadcrumb from '@/Components/ui/breadcrumb'
import MultiSelect from '@/Components/ui/MultiSelect'

const userTypeLabels: Record<string, string> = {
  internal_9_12: 'ภายใน 9–12',
  external_9_12: 'ภายนอก 9–12',
  internal_5_8: 'ภายใน 5–8',
}
const sectionTargetOptions = [
  { value: 'internal', label: 'บุคลากรภายใน' },
  { value: 'external', label: 'บุคลากรภายนอก' },
]
const formatUserTypes = (
  types: { user_type: string; grade_min: number; grade_max: number }[]
) => {
  return types.map((t) => {
    const label = sectionTargetOptions.find(opt => opt.value === t.user_type)?.label || t.user_type
    return `${label} (${t.grade_min}–${t.grade_max})`
  }).join(', ')
}

export default function AdminQuestionManager() {
  const { questions, sections, aspects, flash, errors } = usePage().props as any
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<number | "all">("all")
  const [form, setForm] = useState({
    title: '',
    type: 'rating',
    aspect_ids: [] as number[],
    options: [
      { label: '', score: 5 },
      { label: '', score: 4 },
      { label: '', score: 3 },
      { label: '', score: 2 },
      { label: '', score: 1 },
    ],
  })

  const filteredQuestions = selectedSection === "all"
    ? questions
    : questions.filter((q: any) => q.aspects?.some((a: any) => a.sections?.some((s: any) => s.id === selectedSection)))

  const handleDelete = (id: number) => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?")) {
      router.delete(route('questions.destroy', { question: id }))
    }
  }

  const startEdit = (q: any) => {
    setEditingId(q.id)
    setForm({
      title: q.title,
      type: q.type,
      aspect_ids: q.aspects?.map((a: any) => a.id) || [],
      options: q.options?.length ? q.options : getDefaultOptions(q.type)
    })
  }
  const getDefaultOptions = (type: string) => {
    if (type === 'rating') {
      return [
        { label: '', score: 5 },
        { label: '', score: 4 },
        { label: '', score: 3 },
        { label: '', score: 2 },
        { label: '', score: 1 },
      ]
    }
    return [{ label: '', score: null }]
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({
      title: '',
      type: 'rating',
      aspect_ids: [],
      options: getDefaultOptions('rating')
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const routePath = editingId
      ? route('questions.update', { question: editingId })
      : route('questions.store')

    const method = editingId ? 'put' : 'post'

    router.visit(routePath, {
      method,
      data: form,
      onSuccess: () => cancelEdit(),
    })
  }


  return (
    <MainLayout title="จัดการคำถาม" breadcrumb={
      <Breadcrumb
        items={[
          { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
          { label: 'จัดการคำถาม', active: true }
        ]}
      />
    }>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <a href={route('adminsectionmanager')} className="bg-white dark:bg-gray-800 border rounded p-4 text-center shadow hover:shadow-md">
            <h2 className="text-lg font-semibold dark:text-white">จัดการหมวด</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">เพิ่ม/แก้ไขหมวดหลัก</p>
          </a>
          <a href={route('adminaspectmanager')} className="bg-white dark:bg-gray-800 border rounded p-4 text-center shadow hover:shadow-md">
            <h2 className="text-lg font-semibold dark:text-white">จัดการด้าน</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">เพิ่ม/แก้ไขด้านภายในหมวด</p>
          </a>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border rounded shadow p-6 space-y-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {editingId ? 'แก้ไขคำถาม' : 'เพิ่มคำถามใหม่'}
          </h2>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">คำถาม</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border p-2 rounded dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">เลือกด้าน</label>
            <MultiSelect
              options={aspects.map((a: any) => {
                const descriptionLines = a.sections.map((s: any) => {
                  const userTypes = s.user_types.map((ut: any) => {
                    const type = typeof ut === 'string' ? ut : ut.user_type
                    const gradeMin = ut.grade_min ?? '-'
                    const gradeMax = ut.grade_max ?? '-'
                    const label = sectionTargetOptions.find(opt => opt.value === type)?.label || type
                    return `${label} (${gradeMin}–${gradeMax})`
                  }).join(', ')

                  return `• ${s.name} → ${userTypes}`
                }).join('\n')

                return {
                  value: a.id,
                  label: `${a.name}`,
                  description: descriptionLines, // ใช้ใน MultiSelect renderer
                }
              })}
              selected={form.aspect_ids}
              onChange={(ids) => setForm({ ...form, aspect_ids: ids.map(Number) })}
              placeholder="เลือกด้าน (หลายด้าน)"
              className="whitespace-pre-line"
            />

          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">ประเภทคำถาม</label>
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value
                setForm({ ...form, type, options: getDefaultOptions(type) })
              }}
              className="w-full border p-2 rounded dark:bg-gray-800 dark:text-white"
            >
              <option value="rating">Rating</option>
              <option value="open_text">Open Text</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="choice">Choice (ตัวเลือกเดียว)</option> {/* ✅ เพิ่มตรงนี้ */}
            </select>


          </div>

          {form.type === 'rating' && (
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">ระดับคะแนน</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`ตัวเลือก ${i + 1}`}
                    value={opt.label}
                    onChange={(e) => {
                      const updated = [...form.options]
                      updated[i].label = e.target.value
                      setForm({ ...form, options: updated })
                    }}
                    className="flex-1 border p-2 rounded dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="number"
                    value={opt.score}
                    onChange={(e) => {
                      const updated = [...form.options]
                      updated[i].score = parseInt(e.target.value)
                      setForm({ ...form, options: updated })
                    }}
                    className="w-20 border p-2 rounded dark:bg-gray-800 dark:text-white"
                  />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => {
                      setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })
                    }} className="text-red-500 text-sm">ลบ</button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, options: [...form.options, { label: '', score: 1 }] })}
                className="text-blue-600 text-sm mt-1"
              >➕ เพิ่มตัวเลือก</button>
            </div>
          )}
          {form.type === 'choice' && (
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">ตัวเลือกคำตอบ (เลือกได้เพียง 1 ข้อ)</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`ตัวเลือก ${i + 1}`}
                    value={opt.label}
                    onChange={(e) => {
                      const updated = [...form.options]
                      updated[i].label = e.target.value
                      setForm({ ...form, options: updated })
                    }}
                    className="flex-1 border p-2 rounded dark:bg-gray-800 dark:text-white"
                  />
                  {form.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })
                      }}
                      className="text-red-500 text-sm"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, options: [...form.options, { label: '', score: null }] })}
                className="text-blue-600 text-sm mt-1"
              >
                ➕ เพิ่มตัวเลือก
              </button>
            </div>
          )}

          {form.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">ตัวเลือกคำตอบ</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={`ตัวเลือก ${i + 1}`}
                    value={opt.label}
                    onChange={(e) => {
                      const updated = [...form.options]
                      updated[i].label = e.target.value
                      setForm({ ...form, options: updated })
                    }}
                    className="flex-1 border p-2 rounded dark:bg-gray-800 dark:text-white"
                  />
                  {form.options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })
                      }}
                      className="text-red-500 text-sm"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, options: [...form.options, { label: '', score: null }] })}
                className="text-blue-600 text-sm mt-1"
              >
                ➕ เพิ่มตัวเลือก
              </button>
            </div>
          )}

          <div className="text-right">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-flex items-center gap-2">
              {editingId ? <Save className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
              {editingId ? 'อัปเดตคำถาม' : 'บันทึกคำถาม'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="ml-3 text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                <XCircle className="w-5 h-5" /> ยกเลิก
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">รายการคำถาม</h1>
          <select
            className="block border p-2 rounded dark:bg-gray-800 dark:text-white"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value === "all" ? "all" : parseInt(e.target.value))}
          >
            <option value="all">กรองตามหมวด: ทั้งหมด</option>
            {sections.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded shadow">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left text-sm text-gray-600 dark:text-gray-300">
                <th className="p-4">คำถาม</th>
                <th className="p-4">หมวด</th>
                <th className="p-4">ด้าน</th>
                <th className="p-4">ประเภท</th>
                <th className="p-4 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q: any) => (
                <tr key={q.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4 text-gray-800 dark:text-white">{q.title}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <div className="flex flex-wrap gap-2">
                      {q.aspects?.flatMap((a: any) =>
                        a.sections.map((s: any, idx: number) =>
                          s.user_types?.map((ut: any, i: number) => {
                            const typeKey = typeof ut === 'string' ? ut : ut.user_type
                            const gradeMin = ut.grade_min ?? '-'
                            const gradeMax = ut.grade_max ?? '-'
                            const label = userTypeLabels[typeKey] || typeKey
                            const color = typeKey === 'internal_9_12'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : typeKey === 'external_9_12'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            return (
                              <span
                                key={`${s.id}-${i}`}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
                              >
                                {s.name} – {label} ({gradeMin}–{gradeMax})
                              </span>
                            )
                          })
                        )
                      ) || (
                          <span className="text-sm text-gray-400">–</span>
                        )}
                    </div>
                  </td>

                  <td className="p-4 text-gray-700 dark:text-gray-300">
                    {q.aspects?.map((a: any) => a.name).join(', ') || '-'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${q.type === "rating"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : q.type === "open_text"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : q.type === "multiple_choice"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                        }`}
                    >
                      {q.type === "rating" && <BookOpenCheck className="w-4 h-4" />}
                      {q.type === "open_text" && <MessageSquare className="w-4 h-4" />}
                      {q.type === "multiple_choice" && <PlusCircle className="w-4 h-4" />}
                      {q.type === "choice" && <PlusCircle className="w-4 h-4" />} {/* ✅ reuse icon */}

                      {{
                        rating: "Rating",
                        open_text: "Open Text",
                        multiple_choice: "Multiple Choice",
                        choice: "Choice (เลือก 1)",
                      }[q.type]}
                    </span>
                  </td>


                  <td className="p-4 text-center">
                    {editingId === q.id ? (
                      <>
                        <button onClick={handleSubmit} className="text-green-600 hover:text-green-800 mr-2"><Save className="w-5 h-5" /></button>
                        <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700"><XCircle className="w-5 h-5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(q)} className="text-indigo-600 hover:text-indigo-800 mr-3">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredQuestions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500 dark:text-gray-400">
                    ไม่พบคำถามในหมวดนี้
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
