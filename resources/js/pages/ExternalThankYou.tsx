import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft, Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ExternalThankYou() {
    return (
        <div className="min-h-screen gradient-primary-soft relative overflow-hidden">
            <Head title="ขอบคุณ - ระบบประเมิน 360 องศา" />

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -top-20 -right-20 w-96 h-96 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                />
                <motion.div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-200/20 dark:bg-emerald-800/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.15, 0.3] }}
                    transition={{ duration: 7, repeat: Infinity, delay: 1 }}
                />
            </div>

            <div className="relative flex items-center justify-center min-h-screen p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="inline-block mb-3"
                        >
                            <img
                                src="/static/icon.png"
                                alt="กนอ."
                                className="w-16 h-16 mx-auto"
                            />
                        </motion.div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            ผู้ประเมินภายนอก
                        </div>
                    </div>

                    {/* Success Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="glass-card rounded-2xl p-8 text-center"
                    >
                        {/* Animated success icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                            className="relative inline-block mb-6"
                        >
                            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            {/* Sparkle decorations */}
                            <motion.div
                                className="absolute -top-1 -right-1"
                                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Sparkles className="w-6 h-6 text-violet-500 dark:text-violet-400" />
                            </motion.div>
                            <motion.div
                                className="absolute -bottom-1 -left-2"
                                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                            >
                                <Sparkles className="w-4 h-4 text-purple-400 dark:text-purple-300" />
                            </motion.div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
                        >
                            ขอบคุณครับ/ค่ะ
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-lg text-gray-600 dark:text-gray-300 mb-2"
                        >
                            การประเมินของท่านสำเร็จเรียบร้อยแล้ว
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-sm text-muted-foreground mb-8"
                        >
                            ข้อมูลการประเมินของท่านจะถูกเก็บเป็นความลับ
                            และนำไปใช้ในการพัฒนาบุคลากรต่อไป
                        </motion.p>

                        {/* Info box */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="bg-violet-50/60 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-xl p-5 mb-8"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                ท่านสามารถปิดหน้าต่างนี้ได้เลย หรือคลิกปุ่มด้านล่างเพื่อกลับหน้าหลัก
                            </p>
                        </motion.div>

                        {/* Back button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                        >
                            <a
                                href={route('external.login')}
                                className={cn(
                                    'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all duration-300',
                                    'gradient-primary hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/25 transform hover:-translate-y-0.5'
                                )}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                กลับหน้าหลัก
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* Footer */}
                    <div className="text-center mt-6">
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} Miles Consult Group
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
