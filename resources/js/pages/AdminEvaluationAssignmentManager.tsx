import React, { useState, useEffect } from 'react'
import MainLayout from '@/Layouts/MainLayout'
import { useForm, usePage, router } from '@inertiajs/react'
import { Trash2, PlusCircle } from 'lucide-react'
import Select from 'react-select'
import Breadcrumb from '@/Components/ui/breadcrumb'

export default function AdminEvaluationAssignmentManager() {
    const { assignments, fiscal_years = [], selected_year } = usePage().props as any;

    const yearOptions = fiscal_years.map((y: string) => ({
        value: y,
        label: `ปีงบประมาณ ${parseInt(y) + 543}`
    }));

    const [selectedYear, setSelectedYear] = useState({
        value: selected_year,
        label: `ปีงบประมาณ ${parseInt(selected_year) + 543}`
    });

    useEffect(() => {
        router.visit(route('assignments.index'), {
            method: 'get',
            data: { fiscal_year: selectedYear.value },
            preserveState: true,
            preserveScroll: true,
        });
    }, [selectedYear]);

    const handleDelete = (id: number) => {
        if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            router.delete(route('assignments.destroy', { assignment: id }))
        }
    }

    return (
        <MainLayout title="จัดการผู้ประเมิน-ผู้ถูกประเมิน" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'จัดการผู้ประเมิน-ผู้ถูกประเมิน', active: true },
                ]}
            />
        }>
            <div className="max-w-5xl mx-auto py-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold">รายการผู้ประเมิน-ผู้ถูกประเมิน</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Select
                            className="w-60"
                            options={yearOptions}
                            value={selectedYear}
                            onChange={(v) => v && setSelectedYear(v)}
                            classNamePrefix="react-select"
                            isSearchable={false}
                        />
                        <a
                            href={route('assignments.create')}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            เพิ่มความสัมพันธ์
                        </a>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
                    <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="p-4 text-left">ผู้ประเมิน</th>
                                <th className="p-4 text-left">ผู้ถูกประเมิน</th>
                                <th className="p-4 text-center">ปีงบ</th>
                                <th className="p-4 text-center">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.data.map((a: any) => (
                                <tr key={a.id} className="border-t">
                                    <td className="p-4">{a.evaluator.fname} {a.evaluator.lname}</td>
                                    <td className="p-4">{a.evaluatee.fname} {a.evaluatee.lname}</td>
                                    <td className="p-4 text-center">{parseInt(a.fiscal_year) + 543}</td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => handleDelete(a.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
                <div className="mt-6">
                    {assignments?.links && assignments.links.length > 3 && (
                        <div className="flex justify-center mt-6 gap-2 flex-wrap text-sm">
                            {assignments.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url &&
                                        router.visit(link.url, {
                                            preserveScroll: true,
                                            preserveState: true,
                                            data: { fiscal_year: selectedYear.value }, // ⭐ สำคัญสุดตรงนี้
                                        })
                                    }
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 border rounded text-sm ${link.active
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-white'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </MainLayout>
    )
}
