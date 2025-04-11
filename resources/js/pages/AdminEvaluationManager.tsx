import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';
interface Evaluation {
    id: number;
    title: string;
    description?: string;
    user_type: string;
    parts_count?: number;
    created_at: string;
}

export default function AdminEvaluationManager() {
    const { evaluations, flash } = usePage<{ evaluations: Evaluation[]; flash: any }>().props;
    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);
    const handleDelete = (id: number) => {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบบประเมินนี้?')) {
            router.delete(route('evaluations.destroy', { evaluation: id }));
        }
    };

    return (
        <MainLayout
            title="จัดการแบบประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', active: true },
                    ]}
                />
            }
        >
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📋 รายการแบบประเมิน</h1>
                    <a
                        href={route('evaluations.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" /> สร้างแบบประเมินใหม่
                    </a>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
                    <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="p-4 text-left">ชื่อแบบประเมิน</th>
                                <th className="p-4 text-left">ประเภท</th>
                                <th className="p-4 text-left">จำนวนส่วน</th>
                                <th className="p-4 text-left">วันที่สร้าง</th>
                                <th className="p-4 text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {evaluations.map((evalItem) => (
                                <tr key={evalItem.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-4 text-gray-800 dark:text-white font-medium">{evalItem.title}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{evalItem.user_type}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{evalItem.parts_count ?? '-'}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{new Date(evalItem.created_at).toLocaleDateString('th-TH')}</td>
                                    <td className="p-4 text-center space-x-2">
                                        <button
                                            onClick={() => router.visit(route('evaluations.edit', { evaluation: evalItem.id }))}
                                            className="text-indigo-600 hover:text-indigo-800"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(evalItem.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {evaluations.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-4 text-gray-500 dark:text-gray-400">
                                        ไม่มีรายการแบบประเมิน
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
