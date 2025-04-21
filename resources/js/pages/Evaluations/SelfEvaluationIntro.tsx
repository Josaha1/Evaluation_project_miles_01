import React from 'react'
import { router } from '@inertiajs/react'
import { motion } from 'framer-motion'
import MainLayout from '@/Layouts/MainLayout'
import { Button } from '@/Components/ui/button'
import { Sparkles } from 'lucide-react'

export default function SelfEvaluationIntro() {
    

    const handleStart = () => {
        router.visit('/evaluations/self/questions/1')
    }

    return (
        <MainLayout title="เริ่มต้นประเมินตนเอง">
            <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-8 justify-items-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl font-bold text-indigo-700 dark:text-indigo-400"
                >
                    👋 ยินดีต้อนรับสู่การประเมินตนเอง
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-gray-600 dark:text-gray-300 text-lg"
                >
                    การประเมินนี้จะช่วยให้คุณเข้าใจตัวเองมากขึ้น <br />และสะท้อนภาพรวมการทำงานของคุณในช่วงที่ผ่านมา
                </motion.p>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <Button
                        size="lg"
                        onClick={handleStart}
                        className="text-lg px-6 py-3 flex items-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" /> เริ่มการประเมินเลย
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 1, duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
                    className="text-sm text-gray-400 mt-4"
                >
                    ใช้เวลาประมาณ 3-5 นาทีเท่านั้น 🕒
                </motion.div>
            </div>
        </MainLayout>
    )
}
