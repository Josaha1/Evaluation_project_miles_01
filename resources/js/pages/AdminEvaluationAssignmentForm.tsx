import React, { useMemo, useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { useForm, usePage } from '@inertiajs/react';
import Select from 'react-select';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { User } from '@/types';

interface OptionType {
    value: number;
    label: string;
    grade: number;
}

const allAngleOptions = [
    { value: 'top', label: 'องศาบน (เจ้านาย)' },
    { value: 'bottom', label: 'องศาล่าง (ลูกน้อง)' },
    { value: 'left', label: 'องศาซ้าย (เพื่อนสายงานเดียวกัน)' },
    { value: 'right', label: 'องศาขวา (สายงานอื่นเกี่ยวข้อง)' },
];

export default function AdminEvaluationAssignmentForm() {
    const { users } = usePage<{ users: User[] }>().props;

    const userOptions: OptionType[] = useMemo(
        () =>
            users.map((u) => ({
                value: u.id,
                label: `${u.fname} ${u.lname} (${u.position || 'ไม่ระบุตำแหน่ง'})`,
                grade: parseInt(u.grade),
            })),
        [users]
    );

    const [selectedEvaluator, setSelectedEvaluator] = useState<OptionType | null>(null);
    const [availableAngles, setAvailableAngles] = useState<{ value: string; label: string }[]>([]);
    const [selectedAngle, setSelectedAngle] = useState<{ value: string; label: string } | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        evaluator_id: '',
        angle: '',
        evaluatee_ids: [] as number[],
    });

    const handleEvaluatorChange = (selected: OptionType | null) => {
        setSelectedEvaluator(selected);
        setData('evaluator_id', selected?.value || '');
        setSelectedAngle(null);
        setData('angle', '');

        if (!selected) {
            setAvailableAngles([]);
            return;
        }

        if (selected.grade >= 9) {
            setAvailableAngles(allAngleOptions); // ระดับ 9–12 เลือกได้ทุกองศา
        } else {
            setAvailableAngles(allAngleOptions.filter((opt) => opt.value === 'top' || opt.value === 'left')); // ระดับ 5–8 เลือกได้แค่ บน/ซ้าย
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedEvaluator || !selectedAngle || data.evaluatee_ids.length === 0) {
            toast.error('กรุณาเลือกข้อมูลให้ครบถ้วน');
            return;
        }

        post(route('assignments.store-multi'), {
            onSuccess: () => {
                toast.success('✅ เพิ่มความสัมพันธ์สำเร็จแล้ว');
                reset();
                setSelectedEvaluator(null);
                setSelectedAngle(null);
                setAvailableAngles([]);
            },
            onError: () => toast.error('🚫 ไม่สามารถเพิ่มความสัมพันธ์ได้'),
        });
    };

    const filteredEvaluateeOptions = useMemo(() => {
        if (!selectedEvaluator || !selectedAngle) return [];

        const evaluatorGrade = selectedEvaluator.grade;

        if (selectedAngle.value === 'top') {
            return userOptions.filter((u) => u.grade > evaluatorGrade); // เจ้านาย
        }
        if (selectedAngle.value === 'bottom') {
            return userOptions.filter((u) => u.grade < evaluatorGrade); // ลูกน้อง
        }
        return userOptions.filter((u) => Math.abs(u.grade - evaluatorGrade) <= 1); // ซ้าย/ขวา
    }, [selectedEvaluator, selectedAngle, userOptions]);

    const previewEvaluatees = useMemo(
        () => userOptions.filter((u) => data.evaluatee_ids.includes(u.value)),
        [data.evaluatee_ids, userOptions]
    );

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
            <div className="max-w-5xl mx-auto px-6 py-10">
                <Card className="p-8 shadow-xl bg-white dark:bg-zinc-900">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
                        ✨ เพิ่มความสัมพันธ์ผู้ประเมิน - ผู้ถูกประเมิน
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Evaluator */}
                        <div>
                            <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                                👨‍🏫 เลือกผู้ประเมิน
                            </label>
                            <Select
                                options={userOptions}
                                value={selectedEvaluator}
                                onChange={handleEvaluatorChange}
                                placeholder="เลือกผู้ประเมิน"
                                isClearable
                                classNamePrefix="react-select"
                                styles={{
                                    menu: (base) => ({ ...base, color: 'black' }),
                                    option: (base, { isFocused }) => ({
                                        ...base,
                                        color: 'black',
                                        backgroundColor: isFocused ? '#e0e0e0' : 'white',
                                    }),
                                    singleValue: (base) => ({ ...base, color: 'black' }),
                                    input: (base) => ({ ...base, color: 'black' }),
                                }}
                            />
                        </div>

                        {/* Angle */}
                        {availableAngles.length > 0 && (
                            <div>
                                <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                                    🎯 เลือกองศา
                                </label>
                                <Select
                                    options={availableAngles}
                                    value={selectedAngle}
                                    onChange={(selected) => {
                                        setSelectedAngle(selected);
                                        setData('angle', selected?.value || '');
                                    }}
                                    placeholder="เลือกองศา"
                                    isClearable
                                    classNamePrefix="react-select"
                                    styles={{
                                        menu: (base) => ({ ...base, color: 'black' }),
                                        option: (base, { isFocused }) => ({
                                            ...base,
                                            color: 'black',
                                            backgroundColor: isFocused ? '#e0e0e0' : 'white',
                                        }),
                                        singleValue: (base) => ({ ...base, color: 'black' }),
                                        input: (base) => ({ ...base, color: 'black' }),
                                    }}
                                />
                            </div>
                        )}

                        {/* Evaluatees */}
                        {selectedAngle && (
                            <div>
                                <label className="block mb-2 text-sm font-semibold dark:text-gray-300">
                                    📋 เลือกผู้ถูกประเมิน (หลายคน)
                                </label>
                                <Select
                                    options={filteredEvaluateeOptions}
                                    value={filteredEvaluateeOptions.filter((opt) =>
                                        data.evaluatee_ids.includes(opt.value)
                                    )}
                                    onChange={(selected) =>
                                        setData(
                                            'evaluatee_ids',
                                            selected ? selected.map((s) => s.value) : []
                                        )
                                    }
                                    placeholder="เลือกผู้ถูกประเมิน"
                                    isMulti
                                    isClearable
                                    classNamePrefix="react-select"
                                    styles={{
                                        menu: (base) => ({ ...base, color: 'black' }),
                                        option: (base, { isFocused }) => ({
                                            ...base,
                                            color: 'black',
                                            backgroundColor: isFocused ? '#e0e0e0' : 'white',
                                        }),
                                        singleValue: (base) => ({ ...base, color: 'black' }),
                                        input: (base) => ({ ...base, color: 'black' }),
                                    }}
                                />
                            </div>
                        )}

                        {/* Preview Table */}
                        {previewEvaluatees.length > 0 && (
                            <div className="mt-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                    👀 รายชื่อผู้ถูกประเมินที่เลือก
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white dark:bg-zinc-800 rounded-lg overflow-hidden text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 dark:bg-zinc-700">
                                                <th className="p-3 text-left">ชื่อผู้ถูกประเมิน</th>
                                                <th className="p-3 text-left">ตำแหน่ง</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewEvaluatees.map((u) => (
                                                <tr key={u.value} className="border-b dark:border-zinc-700">
                                                    <td className="p-3">{u.label}</td>
                                                    <td className="p-3">{selectedAngle?.label}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex justify-end pt-6">
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
