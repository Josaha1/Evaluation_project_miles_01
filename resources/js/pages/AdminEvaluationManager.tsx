import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import { Pencil, Trash2, PlusCircle, Layers, AlignLeft, ListChecks } from 'lucide-react';
import clsx from 'clsx';
import Breadcrumb from '@/Components/ui/breadcrumb'
interface Evaluation {
    id: number;
    title: string;
    description?: string;
    user_type?: string;
    sections: { id: number; name: string }[];
    aspects: { id: number; name: string }[];
    questions: { id: number; title: string }[];
}

const userTypeLabels: Record<string, string> = {
    internal_9_12: 'ภายใน 9–12',
    external_9_12: 'ภายนอก 9–12',
    internal_5_8: 'ภายใน 5–8',
};
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

export default function AdminEvaluationManager() {
    const { evaluations, flash } = usePage<{ evaluations: Evaluation[]; flash: any }>().props;

    const handleDelete = (id: number) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบบประเมินนี้?')) {
            router.delete(route('evaluations.destroy', { evaluation: id }));
        }
    };

    return (
        <MainLayout title="จัดการแบบประเมิน" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', active: true }
                ]}
            />
        }>
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📋 รายการแบบประเมิน</h1>
                    <a
                        href={route('evaluations.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> สร้างแบบประเมินใหม่
                    </a>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-left">
                            <tr>
                                <th className="p-4">ชื่อแบบประเมิน</th>
                                <th className="p-4">ประเภท</th>
                                <th className="p-4">หมวด</th>
                                <th className="p-4">ด้าน</th>
                                <th className="p-4">คำถาม</th>
                                <th className="p-4 text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluations.length > 0 ? (
                                evaluations.map((evaluation) => (
                                    <tr
                                        key={evaluation.id}
                                        className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <td className="p-4 text-gray-800 dark:text-white font-medium">
                                            <span className="block truncate max-w-xs">{evaluation.title}</span>
                                            {evaluation.description && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{evaluation.description}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                                            {(() => {
                                                // รวม user_types จากทุก section
                                                const allUserTypes: { user_type: string; grade_min: number; grade_max: number }[] = []

                                                evaluation.sections?.forEach((s: any) => {
                                                    s.user_types?.forEach((ut: any) => {
                                                        allUserTypes.push(ut)
                                                    })
                                                })

                                                // ลบ user_types ที่ซ้ำกัน
                                                const uniqueTypes = allUserTypes.filter((ut, index, self) =>
                                                    index === self.findIndex(t =>
                                                        t.user_type === ut.user_type &&
                                                        t.grade_min === ut.grade_min &&
                                                        t.grade_max === ut.grade_max
                                                    )
                                                )

                                                return uniqueTypes.length > 0
                                                    ? formatUserTypes(uniqueTypes)
                                                    : <span className="text-gray-400">-</span>
                                            })()}
                                        </td>



                                        <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-sm">
                                            {evaluation.sections.length > 0 ? (
                                                <>
                                                    <div className="mb-1 font-semibold inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300">
                                                        <Layers className="w-4 h-4" /> {evaluation.sections.length} หมวด
                                                    </div>
                                                    {evaluation.sections.map((s) => (
                                                        <div key={s.id}>• {s.name}</div>
                                                    ))}
                                                </>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-sm">
                                            {evaluation.aspects.length > 0 ? (
                                                <>
                                                    <div className="mb-1 font-semibold inline-flex items-center gap-1 text-purple-600 dark:text-purple-300">
                                                        <AlignLeft className="w-4 h-4" /> {evaluation.aspects.length} ด้าน
                                                    </div>
                                                    {evaluation.aspects.map((a) => (
                                                        <div key={a.id}>• {a.name}</div>
                                                    ))}
                                                </>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                                            {evaluation.questions.length > 0 ? (
                                                <>
                                                    <div className="mb-1 font-semibold inline-flex items-center gap-1 text-green-600 dark:text-green-300">
                                                        <ListChecks className="w-4 h-4" /> {evaluation.questions.length} ข้อ
                                                    </div>
                                                    <div className="line-clamp-3 text-xs">
                                                        {evaluation.questions.map((q) => q.title).join(', ')}
                                                    </div>
                                                </>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-4 text-center space-x-2">
                                            <button
                                                onClick={() =>
                                                    router.visit(route('evaluations.edit', { evaluation: evaluation.id }))
                                                }
                                                className="text-indigo-600 hover:text-indigo-800"
                                                title="แก้ไข"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(evaluation.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="text-center text-gray-500 dark:text-gray-400 p-6"
                                    >
                                        ยังไม่มีแบบประเมินในระบบ
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
