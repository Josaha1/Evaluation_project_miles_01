import MainLayout from '@/Layouts/MainLayout'
import { useState, useEffect } from 'react'
import { Pencil, Trash2, PlusCircle } from 'lucide-react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { router, usePage } from '@inertiajs/react'
import { toast } from 'sonner'

import MultiSelect from '@/Components/ui/MultiSelect'

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
    errors?: Record<string, string>
    sections: {
        data: Section[];
        current_page: number;
        last_page: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

const sectionTargetOptions = [
    { value: 'internal', label: 'บุคลากรภายใน' },
    { value: 'external', label: 'บุคลากรภายนอก' },
]

export default function AdminSectionManager() {
    const { flash, sections, errors = {} } = usePage<PageProps>().props

    const [newSection, setNewSection] = useState('')
    const [newUserType, setNewUserType] = useState('')
    const [newGradeMin, setNewGradeMin] = useState(9)
    const [newGradeMax, setNewGradeMax] = useState(12)

    const [editingSectionId, setEditingSectionId] = useState<number | null>(null)
    const [editingName, setEditingName] = useState('')
    const [editingUserType, setEditingUserType] = useState('')
    const [editingGradeMin, setEditingGradeMin] = useState(9)
    const [editingGradeMax, setEditingGradeMax] = useState(12)

    useEffect(() => {
        if (flash?.success) toast.success(flash.success)
        if (flash?.error) toast.error(flash.error)
    }, [flash])

    const handleAdd = () => {
        if (!newSection.trim() || !newUserType || !newGradeMin || !newGradeMax) return
        router.post(route('sections.store'), {
            name: newSection,
            user_types: [
                {
                    user_type: newUserType,
                    grade_min: newGradeMin,
                    grade_max: newGradeMax,
                }
            ],
        })

        setNewSection('')
        setNewUserType('')
        setNewGradeMin(9)
        setNewGradeMax(12)
    }

    return (
        <MainLayout
            title="จัดการหมวด"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'จัดการคำถาม', href: route('adminquestionmanager') },
                        { label: 'จัดการหมวด', active: true },
                    ]}
                />
            }
        >
            <div className="max-w-4xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">จัดการหมวด</h1>

                <div className="mb-6">
                    <div className="flex flex-wrap gap-4 mb-2">
                        <input
                            type="text"
                            placeholder="ชื่อหมวดใหม่"
                            value={newSection}
                            onChange={(e) => setNewSection(e.target.value)}
                            className="flex-grow border p-2 rounded dark:bg-gray-800 dark:text-white"
                        />
                        <select
                            value={newUserType}
                            onChange={(e) => setNewUserType(e.target.value)}
                            className="border p-2 rounded dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">-- เลือกประเภทบุคคล --</option>
                            {sectionTargetOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="ระดับต่ำสุด"
                            min={1}
                            max={12}
                            value={newGradeMin}
                            onChange={(e) => setNewGradeMin(Number(e.target.value))}
                            className="w-24 border p-2 rounded dark:bg-gray-800 dark:text-white"
                        />
                        <input
                            type="number"
                            placeholder="ระดับสูงสุด"
                            min={1}
                            max={12}
                            value={newGradeMax}
                            onChange={(e) => setNewGradeMax(Number(e.target.value))}
                            className="w-24 border p-2 rounded dark:bg-gray-800 dark:text-white"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newSection || !newUserType}
                            className={`flex items-center gap-2 px-4 py-2 rounded transition ${!newSection || !newUserType
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            <PlusCircle className="w-5 h-5" /> เพิ่มหมวด
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded shadow">
                    <table className="min-w-full bg-white dark:bg-gray-800">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-left text-sm text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="p-4">ชื่อหมวด</th>
                                <th className="p-4">ประเภท + ระดับ</th>
                                <th className="p-4 text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sections.data.map((section) => (
                                <tr
                                    key={section.id}
                                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <td className="p-4 text-gray-800 dark:text-white">{section.name}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {section.user_types.map((u, i) => {
                                                const label = sectionTargetOptions.find(opt => opt.value === u.user_type)?.label || u.user_type
                                                return (
                                                    <span
                                                        key={i}
                                                        className="inline-block text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 font-semibold px-2 py-1 rounded"
                                                    >
                                                        {label} ({u.grade_min}–{u.grade_max})
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </td>



                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => {
                                                if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวด "${section.name}" นี้?`)) {
                                                    router.delete(route('sections.destroy', section.id))
                                                }
                                            }}
                                            className="flex items-center gap-1 text-red-600 hover:text-red-800"
                                            title="ลบหมวดนี้"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-sm hidden sm:inline">ลบ</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-6 space-x-1">
                    {sections.links.map((link, index) => (
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
