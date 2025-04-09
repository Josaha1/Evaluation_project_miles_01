import React from 'react';
import { usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Trash2, PlusCircle } from 'lucide-react';

import Breadcrumb from '@/Components/ui/breadcrumb'
export default function AdminEvaluationAssignmentManager() {
    const { assignments } = usePage().props as any;

    const handleDelete = (id: number) => {
        if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            router.delete(route('assignments.destroy', { assignment: id }));
        }
    };

    return (
        <MainLayout title="จัดการผู้ประเมิน-ผู้ถูกประเมิน" breadcrumb={
                    <Breadcrumb
                        items={[
                            { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                            // { label: 'จัดการสมาชิก', href: route('admin.users.index') },
                            { label: 'จัดการผู้ประเมิน-ผู้ถูกประเมิน', active: true },
                        ]}
                    />
                }>
            <div className="max-w-5xl mx-auto py-8">
                <div className="flex justify-between mb-6">
                    <h1 className="text-2xl font-bold">รายการผู้ประเมิน-ผู้ถูกประเมิน</h1>
                    <a
                        href={route('assignments.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        เพิ่มความสัมพันธ์
                    </a>
                </div>

                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-4 text-left">ผู้ประเมิน</th>
                                <th className="p-4 text-left">ผู้ถูกประเมิน</th>
                                <th className="p-4 text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.data.map((a: any) => (
                                <tr key={a.id} className="border-t">
                                    <td className="p-4">{a.evaluator.fname} {a.evaluator.lname}</td>
                                    <td className="p-4">{a.evaluatee.fname} {a.evaluatee.lname}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
