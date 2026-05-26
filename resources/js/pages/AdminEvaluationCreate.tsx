import MainLayout from '@/Layouts/MainLayout';
import { router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';
import { FilePlus, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AdminEvaluationCreate() {
    const { flash } = usePage().props as any;
    const [form, setForm] = useState({
        title: '',
        description: '',
        user_type: 'internal',
        grade_min: 9,
        grade_max: 12,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('evaluations.store'), form);
    };

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        } else if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const inputClass = "w-full mt-1 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 p-2.5 dark:bg-gray-800 dark:text-white transition-all";

    return (
        <MainLayout
            title="สร้างแบบประเมินใหม่"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                        { label: 'สร้างแบบประเมินใหม่', active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-3xl mx-auto px-6 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 gradient-primary rounded-xl">
                                <FilePlus className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gradient-primary">
                                สร้างแบบประเมินใหม่
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแบบประเมิน</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className={inputClass}
                                    required
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">คำอธิบายเพิ่มเติม</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className={inputClass}
                                    rows={3}
                                ></textarea>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ประเภทบุคคล</label>
                                <select
                                    value={form.user_type}
                                    onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="internal">บุคลากรภายใน</option>
                                    <option value="external">บุคลากรภายนอก</option>
                                </select>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับขั้นต่ำ</label>
                                    <input
                                        type="number"
                                        value={form.grade_min}
                                        onChange={(e) => setForm({ ...form, grade_min: parseInt(e.target.value) })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ระดับขั้นสูง</label>
                                    <input
                                        type="number"
                                        value={form.grade_max}
                                        onChange={(e) => setForm({ ...form, grade_max: parseInt(e.target.value) })}
                                        className={inputClass}
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-right pt-4"
                            >
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-6 py-2.5 gradient-primary text-white rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all font-medium"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    สร้างแบบประเมิน
                                </button>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
