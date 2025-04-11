import MainLayout from '@/Layouts/MainLayout'
import { router, usePage } from '@inertiajs/react'
import { Layers, PlusCircle, Pencil, Trash2 } from 'lucide-react'
import { useEffect } from 'react';
import Breadcrumb from '@/Components/ui/breadcrumb'
import { toast } from 'sonner';
import { BookOpenCheck } from 'lucide-react'
export default function AdminPartIndex() {
    const { evaluation, flash } = usePage().props as any

    const handleDelete = (partId: number) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบส่วนนี้?')) {
            router.delete(route('parts.destroy', { evaluation: evaluation.id, part: partId }))
        }
    }
    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);
    return (
        <MainLayout
            title={`จัดการส่วนของ: ${evaluation.title}`}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                        { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                        { label: 'จัดการส่วน', active: true },
                    ]}
                />
            }
        >
            <div className="max-w-4xl mx-auto py-10 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                        🧩 รายการส่วนของแบบประเมิน
                    </h1>
                    <a
                        href={route('parts.create', { evaluation: evaluation.id })}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มส่วนใหม่
                    </a>
                </div>

                {evaluation.parts.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded shadow divide-y divide-gray-200 dark:divide-gray-700">
                        {evaluation.parts.map((part: any) => (
                            <div key={part.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-800 dark:text-white">
                                        {part.title} <span className="text-sm text-gray-500">(ลำดับ {part.order})</span>
                                    </div>
                                    {part.description && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{part.description}</div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <a
                                        href={route('aspects.index', { evaluation: evaluation.id, part: part.id })}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        จัดการด้าน
                                    </a>

                                    <a
                                        href={route('parts.edit', { evaluation: evaluation.id, part: part.id })}
                                        className="text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(part.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">ยังไม่มีส่วนของแบบประเมินในรายการนี้</p>
                )}

            </div>
        </MainLayout>
    )
}
