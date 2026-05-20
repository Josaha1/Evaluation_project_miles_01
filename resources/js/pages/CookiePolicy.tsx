import MainLayout from "@/Layouts/MainLayout";
import React from "react";
import { Head, Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Shield, Cookie, Settings, Info } from "lucide-react";

export default function CookiePolicy() {
    return (
        <MainLayout>
            <Head title="นโยบายการใช้คุกกี้" />
            <div className="gradient-primary-soft min-h-screen py-10">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card rounded-2xl p-8"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    นโยบายการใช้คุกกี้
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Cookie Policy
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 text-gray-700 dark:text-gray-300">
                            <p className="leading-relaxed">
                                เว็บไซต์ของเราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ
                                คุกกี้คือไฟล์ขนาดเล็กที่เก็บไว้ในอุปกรณ์ของคุณ
                                เพื่อช่วยให้เว็บไซต์จดจำข้อมูลเกี่ยวกับการเยี่ยมชมของคุณในครั้งถัดไป
                            </p>

                            {/* Section: Types */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    ประเภทของคุกกี้ที่เราใช้
                                </h2>
                                <div className="space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="p-4 rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30"
                                    >
                                        <h3 className="font-semibold text-violet-800 dark:text-violet-300 mb-1">
                                            คุกกี้ที่จำเป็น (Strictly Necessary Cookies)
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            จำเป็นต่อการทำงานของเว็บไซต์
                                        </p>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30"
                                    >
                                        <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">
                                            คุกกี้เพื่อการวิเคราะห์ (Analytics Cookies)
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            ใช้เพื่อวิเคราะห์การใช้งานเว็บไซต์และปรับปรุงเนื้อหา
                                        </p>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Section: Management */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    การจัดการคุกกี้
                                </h2>
                                <p className="leading-relaxed">
                                    คุณสามารถจัดการหรือลบคุกกี้ได้ตามต้องการผ่านการตั้งค่าในเบราว์เซอร์ของคุณ
                                    หากคุณเลือกที่จะปฏิเสธคุกกี้บางประเภท
                                    อาจทำให้การทำงานของเว็บไซต์ไม่สมบูรณ์
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}
