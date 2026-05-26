import { Head, router, usePage } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { CheckCircle, User, Building2, FileText, ArrowRight, Shield, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PageProps {
    evaluatee: {
        id: number
        name: string
        position: string | null
    }
    evaluation: {
        id: number
        title: string
    }
    organization: {
        id: number
        name: string
    }
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
}

export default function ExternalConfirm() {
    const { evaluatee, evaluation, organization } = usePage<PageProps>().props
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = () => {
        setIsSubmitting(true)
        router.post(route('external.confirm.submit'))
    }

    return (
        <div className="min-h-screen gradient-primary-soft relative overflow-hidden">
            <Head title="ยืนยันตัวตน - ระบบประเมิน 360 องศา" />

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute -top-24 -right-24 w-96 h-96 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.2, 0.4] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                />
            </div>

            <div className="relative flex items-center justify-center min-h-screen p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="inline-block mb-4"
                        >
                            <img
                                src="/static/icon.png"
                                alt="กนอ."
                                className="w-16 h-16 mx-auto"
                            />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            ยืนยันตัวตน
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            กรุณาตรวจสอบข้อมูลก่อนเริ่มการประเมิน
                        </p>
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            ผู้ประเมินภายนอก
                        </div>
                    </div>

                    {/* Confirm Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card rounded-2xl p-8"
                    >
                        {/* Icon header */}
                        <div className="text-center mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 180, delay: 0.4 }}
                                className="w-14 h-14 mx-auto mb-3 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/25"
                            >
                                <CheckCircle className="w-7 h-7 text-white" />
                            </motion.div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                ข้อมูลการประเมิน
                            </h2>
                        </div>

                        {/* Info items with stagger */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-3 mb-8"
                        >
                            <motion.div
                                variants={itemVariants}
                                className="flex items-start gap-3 p-4 bg-violet-50/60 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-xl"
                            >
                                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-800/40 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium">องค์กร</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{organization.name}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="flex items-start gap-3 p-4 bg-violet-50/60 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-xl"
                            >
                                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-800/40 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium">ผู้ถูกประเมิน</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{evaluatee.name}</p>
                                    {evaluatee.position && (
                                        <p className="text-xs text-muted-foreground">{evaluatee.position}</p>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="flex items-start gap-3 p-4 bg-violet-50/60 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/30 rounded-xl"
                            >
                                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-800/40 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground font-medium">แบบประเมิน</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{evaluation.title}</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Submit button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                        >
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className={cn(
                                    'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all duration-300',
                                    isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'gradient-primary hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/25 transform hover:-translate-y-0.5'
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>กำลังดำเนินการ...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>เริ่มประเมิน</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
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
