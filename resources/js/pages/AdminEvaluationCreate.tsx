import { router, useForm, usePage } from '@inertiajs/react'
import MainLayout from '@/Layouts/MainLayout'
import { useState } from 'react'
import Breadcrumb from '@/Components/ui/breadcrumb'

const userTypeOptions = [
    { label: 'บุคลากรภายใน', value: 'internal' },
    { label: 'บุคลากรภายนอก', value: 'external' },
]

export default function AdminEvaluationCreate() {
    const { sections, aspects, questions, userType } = usePage().props as any
    const [selectedUserType, setSelectedUserType] = useState(userType || '')
    const [gradeMin, setGradeMin] = useState(9)
    const [gradeMax, setGradeMax] = useState(12)

    const { data, setData, post } = useForm({
        title: '',
        description: '',
        user_type: selectedUserType,
        grade_min: gradeMin,
        grade_max: gradeMax,
        section_ids: [],
        aspect_ids: [],
        question_ids: [],
    })

    const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        setSelectedUserType(value)
        router.visit(route('evaluations.create', { user_type: value }))
    }

    return (
        <MainLayout title="สร้างแบบประเมินใหม่" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: 'สร้างแบบประเมิน', active: true },
                ]}
            />
        }>
            <div className="max-w-5xl mt-4 mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">สร้างแบบประเมิน</h1>

                    {/* ประเภทบุคคล */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประเภทบุคคล</label>
                    <select
                        value={selectedUserType}
                        onChange={handleUserTypeChange}
                        className="w-full border p-2 rounded text-sm dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">-- เลือกประเภท --</option>
                        {userTypeOptions.map(({ label, value }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>

                    {/* ช่วงระดับ */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับขั้นต่ำ (เช่น 9)</label>
                            <input
                                type="number"
                                value={gradeMin}
                                onChange={(e) => {
                                    setGradeMin(Number(e.target.value))
                                    setData('grade_min', Number(e.target.value))
                                }}
                                className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับสูงสุด (เช่น 12)</label>
                            <input
                                type="number"
                                value={gradeMax}
                                onChange={(e) => {
                                    setGradeMax(Number(e.target.value))
                                    setData('grade_max', Number(e.target.value))
                                }}
                                className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        post(route('evaluations.store'))
                    }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="ชื่อแบบประเมิน"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
                        />
                        <textarea
                            placeholder="คำอธิบาย"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white md:col-span-2"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* หมวด */}
                        <div className="border rounded p-4 dark:bg-gray-700 dark:text-white shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">📚 หมวด</h2>
                            <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
                                {sections.map((s: any) => (
                                    <label key={s.id} className="block">
                                        <input
                                            type="checkbox"
                                            value={s.id}
                                            checked={data.section_ids.includes(s.id)}
                                            onChange={(e) => {
                                                const updated = e.target.checked
                                                    ? [...data.section_ids, s.id]
                                                    : data.section_ids.filter((id) => id !== s.id)
                                                setData('section_ids', updated)
                                            }}
                                        />{' '}
                                        {s.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ด้าน */}
                        <div className="border rounded p-4 dark:bg-gray-700 dark:text-white shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">📌 ด้าน</h2>
                            <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
                                {aspects.map((a: any) => (
                                    <label key={a.id} className="block">
                                        <input
                                            type="checkbox"
                                            value={a.id}
                                            checked={data.aspect_ids.includes(a.id)}
                                            onChange={(e) => {
                                                const updated = e.target.checked
                                                    ? [...data.aspect_ids, a.id]
                                                    : data.aspect_ids.filter((id) => id !== a.id)
                                                setData('aspect_ids', updated)
                                            }}
                                        />{' '}
                                        {a.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* คำถาม */}
                        <div className="border rounded p-4 dark:bg-gray-700 dark:text-white shadow-sm">
                            <h2 className="text-lg font-semibold mb-2">❓ คำถาม</h2>
                            <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
                                {questions.map((q: any) => (
                                    <label key={q.id} className="block">
                                        <input
                                            type="checkbox"
                                            value={q.id}
                                            checked={data.question_ids.includes(q.id)}
                                            onChange={(e) => {
                                                const updated = e.target.checked
                                                    ? [...data.question_ids, q.id]
                                                    : data.question_ids.filter((id) => id !== q.id)
                                                setData('question_ids', updated)
                                            }}
                                        />{' '}
                                        {q.title}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
                        >
                            ✅ บันทึกแบบประเมิน
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
