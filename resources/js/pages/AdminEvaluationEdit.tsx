import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { Pencil, Layers, FileText, LayoutList, HelpCircle, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AdminEvaluationEdit() {
    const { evaluation, stats, flash } = usePage().props as any;

    useEffect(() => {
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
    }, [flash]);

    const statItems = [
        { icon: Layers, label: 'จำนวนส่วน (Part)', value: stats.parts, color: 'from-violet-500 to-purple-600' },
        { icon: LayoutList, label: 'จำนวนด้าน (Aspect)', value: stats.aspects, color: 'from-emerald-500 to-green-600' },
        { icon: ListChecks, label: 'จำนวนด้านย่อย (SubAspect)', value: stats.subaspects, color: 'from-amber-500 to-orange-600' },
        { icon: HelpCircle, label: 'จำนวนคำถาม', value: stats.questions, color: 'from-sky-500 to-violet-600' },
        { icon: FileText, label: 'จำนวนตัวเลือก', value: stats.options, color: 'from-pink-500 to-rose-600' },
    ];

    return (
        <MainLayout
            title={`แก้ไขแบบประเมิน: ${evaluation.title}`}
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                        { label: `แก้ไข: ${evaluation.title}`, active: true },
                    ]}
                />
            }
        >
            <div className="gradient-primary-soft min-h-screen">
                <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                    {/* Evaluation Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card rounded-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 gradient-primary rounded-xl">
                                <Pencil className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gradient-primary">ข้อมูลแบบประเมิน</h2>
                        </div>

                        <div className="space-y-2 text-gray-700 dark:text-gray-300">
                            <p><strong className="text-gray-800 dark:text-white">ชื่อ:</strong> {evaluation.title}</p>
                            <p><strong className="text-gray-800 dark:text-white">คำอธิบาย:</strong> {evaluation.description || '-'}</p>
                            <p><strong className="text-gray-800 dark:text-white">ประเภท:</strong> {evaluation.user_type === 'internal' ? 'บุคลากรภายใน' : 'บุคลากรภายนอก'} ({evaluation.grade_min} - {evaluation.grade_max})</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4">
                            {statItems.map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    className="text-center p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/30 dark:border-gray-700"
                                >
                                    <div className={cn("w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br flex items-center justify-center", item.color)}>
                                        <item.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{item.value}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Action Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        <a
                            href={route('parts.index', { evaluation: evaluation.id })}
                            className="group glass-card rounded-2xl p-6 border-2 border-violet-200/50 dark:border-violet-800/30 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-white">จัดการส่วน (Part)</h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">เพิ่ม แก้ไข หรือลำดับส่วนของแบบประเมิน</p>
                        </a>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
