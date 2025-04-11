import MainLayout from '@/Layouts/MainLayout'
import { usePage, router } from '@inertiajs/react'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { Pencil, Trash2, PlusCircle, FileText } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function AdminQuestionIndex() {
    const { evaluation, part, aspect, subaspect, questions, flash } = usePage().props as any


    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])
    const typeLabels: Record<'rating' | 'open_text' | 'choice' | 'multiple_choice', string> = {
        rating: 'Rating (ให้คะแนน)',
        open_text: 'Open Text (ตอบแบบเปิด)',
        choice: 'Choice (เลือก 1 ข้อ)',
        multiple_choice: 'Multiple Choice (เลือกได้หลายข้อ)'
    }

    const handleDelete = (id: number) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำถามนี้?')) {
            router.delete(route(
                subaspect
                    ? 'questions.subaspect.destroy'
                    : 'questions.destroy',
                {
                    evaluation: evaluation.id,
                    part: part.id,
                    aspect: aspect.id,
                    ...(subaspect ? { subaspect: subaspect.id } : {}),
                    question: id
                }
            ))

        }
    }

    return (
        <MainLayout title={`คำถามใน ${subaspect ? `ด้านย่อย: ${subaspect.name}` : `ด้าน: ${aspect.name}`}`} breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                    { label: 'จัดการส่วน', href: route('parts.index', { evaluation: evaluation.id }) },
                    { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                    {
                        label: aspect.name,
                        href: subaspect
                            ? route('subaspects.index', {
                                evaluation: evaluation.id,
                                part: part.id,
                                aspect: aspect.id
                            })
                            : route('questions.index.aspect', { // ✅ ใช้ route ที่ถูกต้อง
                                evaluation: evaluation.id,
                                part: part.id,
                                aspect: aspect.id
                            })
                    },
                    ...(subaspect ? [{ label: subaspect.name, active: true }] : [{ label: 'คำถาม', active: true }])
                ]}
            />
        }>

            <div className="max-w-6xl mx-auto py-10 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📝 คำถามใน {part.title}</h1>
                    <a
                        href={route('questions.create', {
                            evaluation: evaluation.id,
                            part: part.id,
                            aspect: aspect.id,
                            ...(subaspect && { subaspect: subaspect.id }),
                        })}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มคำถามใหม่
                    </a>

                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left">
                            <tr>
                                <th className="p-4">คำถาม</th>
                                <th className="p-4">ประเภท</th>
                                <th className="p-4 text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.length > 0 ? questions.map((q: any) => (
                                <tr key={q.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-4 text-gray-800 dark:text-white whitespace-pre-wrap">{q.title}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                        {typeLabels[q.type as keyof typeof typeLabels] ?? q.type}
                                    </td>


                                    <td className="p-4 text-center">
                                        <div className="flex justify-center items-center gap-3">
                                            <a
                                                href={route(
                                                    subaspect
                                                        ? 'questions.subaspect.edit'
                                                        : aspect
                                                            ? 'questions.aspect.edit'
                                                            : 'questions.edit',
                                                    {
                                                        evaluation: evaluation.id,
                                                        part: part.id,
                                                        aspect: aspect?.id,
                                                        subaspect: subaspect?.id,
                                                        question: q.id,
                                                    }
                                                )}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </a>

                                            <button
                                                onClick={() => handleDelete(q.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center text-gray-500 dark:text-gray-400 p-6">
                                        ยังไม่มีคำถามในส่วนนี้
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
