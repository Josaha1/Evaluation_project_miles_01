import React, { useMemo } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { useForm, usePage } from '@inertiajs/react';
import Select from 'react-select';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { Card } from '@/Components/ui/card';
import { User } from '@/types';

interface OptionType {
    value: number;
    label: string;
}

export default function AdminEvaluationAssignmentForm() {
    const { users } = usePage<{ users: User[] }>().props;

    const evaluatorOptions: OptionType[] = useMemo(
        () =>
            users.map((u) => ({
                value: u.id,
                label: `${u.fname} ${u.lname} (${u.position || 'ไม่ระบุตำแหน่ง'})`,
            })),
        [users]
    );

    const { data, setData, post, processing, reset, errors } = useForm({
        evaluator_id: '',
        evaluatee_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.evaluator_id === data.evaluatee_id) {
            toast.error('❌ ผู้ประเมินและผู้ถูกประเมินต้องไม่ใช่คนเดียวกัน');
            return;
        }

        post(route('assignments.store'), {
            onSuccess: () => {
                toast.success('✅ เพิ่มความสัมพันธ์สำเร็จแล้ว');
                reset();
            },
            onError: () => toast.error('🚫 ไม่สามารถเพิ่มความสัมพันธ์ได้'),
        });
    };

    return (
        <MainLayout
            title="เพิ่มความสัมพันธ์ผู้ประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'จัดการผู้ประเมิน-ผู้ถูกประเมิน', href: route('assignments.index') },
                        { label: 'เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน', active: true },
                    ]}
                />
            }
        >
            <div className="max-w-4xl mx-auto px-6 py-10">
                <Card className="p-8 shadow-xl bg-white dark:bg-gray-900">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                        ✨ เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:text-black">
                            {/* Evaluator */}
                            <div>
                                <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    👨‍🏫 เลือกผู้ประเมิน
                                </label>
                                <Select
                                    options={evaluatorOptions}
                                    value={evaluatorOptions.find((opt) => opt.value === data.evaluator_id)}
                                    onChange={(selected) => setData('evaluator_id', selected?.value || '')}
                                    placeholder="ค้นหาผู้ประเมิน..."
                                    isClearable
                                    classNamePrefix="react-select"
                                />
                                {errors.evaluator_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.evaluator_id}</p>
                                )}
                            </div>

                            {/* Evaluatee */}
                            <div>
                                <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    🎯 เลือกผู้ถูกประเมิน
                                </label>
                                <Select
                                    options={evaluatorOptions}
                                    value={evaluatorOptions.find((opt) => opt.value === data.evaluatee_id)}
                                    onChange={(selected) => setData('evaluatee_id', selected?.value || '')}
                                    placeholder="ค้นหาผู้ถูกประเมิน..."
                                    isClearable
                                    classNamePrefix="react-select"
                                />
                                {errors.evaluatee_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.evaluatee_id}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing} className="px-6">
                                ➕ บันทึกความสัมพันธ์
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </MainLayout>
    );
}