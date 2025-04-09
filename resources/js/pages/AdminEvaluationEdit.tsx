import MainLayout from '@/Layouts/MainLayout'
import { useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import Breadcrumb from '@/Components/ui/breadcrumb'

const userTypeLabels: Record<string, string> = {
  internal: 'บุคลากรภายใน',
  external: 'บุคลากรภายนอก',
}

export default function AdminEvaluationEdit() {
  const { evaluation, sections, aspects, questions } = usePage().props as any

  const { data, setData, put, processing, errors } = useForm({
    title: evaluation.title,
    description: evaluation.description,
    grade_min: evaluation.grade_min,
    grade_max: evaluation.grade_max,
    section_ids: evaluation.sections.map((s: any) => s.id),
    aspect_ids: evaluation.aspects.map((a: any) => a.id),
    question_ids: evaluation.questions.map((q: any) => q.id),
  })

  return (
    <MainLayout
      title="แก้ไขแบบประเมิน"
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
            { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
            { label: 'แก้ไขแบบประเมิน', active: true },
          ]}
        />
      }
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          put(route('evaluations.update', { evaluation: evaluation.id }))
        }}
        className="max-w-4xl mt-4 mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow space-y-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">แก้ไขแบบประเมิน</h1>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแบบประเมิน</label>
          <input
            type="text"
            value={data.title}
            onChange={e => setData('title', e.target.value)}
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">คำอธิบาย</label>
          <textarea
            value={data.description}
            onChange={e => setData('description', e.target.value)}
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทบุคคล</label>
            <input
              type="text"
              value={userTypeLabels[evaluation.user_type] || evaluation.user_type}
              disabled
              className="w-full border p-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">ระดับขั้นต่ำ</label>
            <input
              type="number"
              value={data.grade_min}
              onChange={e => setData('grade_min', parseInt(e.target.value))}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
              min={1}
            />
            {errors.grade_min && <div className="text-sm text-red-500 mt-1">{errors.grade_min}</div>}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">ระดับสูงสุด</label>
            <input
              type="number"
              value={data.grade_max}
              onChange={e => setData('grade_max', parseInt(e.target.value))}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
              min={data.grade_min}
            />
            {errors.grade_max && <div className="text-sm text-red-500 mt-1">{errors.grade_max}</div>}
          </div>
        </div>

        {/* หมวด */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-white mt-6 mb-2">📚 หมวด</h2>
          <div className="space-y-1 text-sm">
            {sections.map((s: any) => (
              <label key={s.id} className="block">
                <input
                  type="checkbox"
                  checked={data.section_ids.includes(s.id)}
                  onChange={e => {
                    const updated = e.target.checked
                      ? [...data.section_ids, s.id]
                      : data.section_ids.filter(id => id !== s.id)
                    setData('section_ids', updated)
                  }}
                />{' '}
                {s.name}
              </label>
            ))}
          </div>
        </div>

        {/* ด้าน */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-white mt-6 mb-2">📌 ด้าน</h2>
          <div className="space-y-1 text-sm">
            {aspects.map((a: any) => (
              <label key={a.id} className="block">
                <input
                  type="checkbox"
                  checked={data.aspect_ids.includes(a.id)}
                  onChange={e => {
                    const updated = e.target.checked
                      ? [...data.aspect_ids, a.id]
                      : data.aspect_ids.filter(id => id !== a.id)
                    setData('aspect_ids', updated)
                  }}
                />{' '}
                {a.name}
              </label>
            ))}
          </div>
        </div>

        {/* คำถาม */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-white mt-6 mb-2">❓ คำถาม</h2>
          <div className="space-y-1 text-sm">
            {questions.map((q: any) => (
              <label key={q.id} className="block">
                <input
                  type="checkbox"
                  checked={data.question_ids.includes(q.id)}
                  onChange={e => {
                    const updated = e.target.checked
                      ? [...data.question_ids, q.id]
                      : data.question_ids.filter(id => id !== q.id)
                    setData('question_ids', updated)
                  }}
                />{' '}
                {q.title}
              </label>
            ))}
          </div>
        </div>

        <div className="text-right mt-6">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
            disabled={processing}
          >
            💾 บันทึกการแก้ไข
          </button>
        </div>
      </form>
    </MainLayout>
  )
}
