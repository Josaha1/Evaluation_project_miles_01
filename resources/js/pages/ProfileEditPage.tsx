import MainLayout from '@/Layouts/MainLayout'
import { useForm, usePage } from '@inertiajs/react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { router } from '@inertiajs/react'

export default function ProfileEditPage() {
    const { auth, flash } = usePage().props as any
    const { data, setData, post, put, processing, errors } = useForm({
        prename: auth.user.prename || '',
        fname: auth.user.fname || '',
        lname: auth.user.lname || '',
        position: auth.user.position || '',
        grade: auth.user.grade || '',
        photo: null,
    })

    const [preview, setPreview] = useState<string | null>(auth.user.photo || null)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setData('photo', file)
            setPreview(URL.createObjectURL(file))
        }
    }
    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        post(route('profile.update'), {
            _method: 'PUT', // จำลองเป็น PUT
            ...data,
        }, {
            forceFormData: true, // ทำให้ส่ง multipart/form-data ได้
            onSuccess: () => toast.success('อัปเดตโปรไฟล์สำเร็จจ้า'),
            onError: () => toast.error('มีบางอย่างผิดพลาด กรุณาตรวจสอบ'),
        })
    }




    return (
        <MainLayout title="แก้ไขโปรไฟล์">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl mx-auto py-12 px-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg"
            >
                <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                    👤 แก้ไขข้อมูลส่วนตัว
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center">
                        <img
                            src={preview || '/images/default.png'}
                            className="w-24 h-24 rounded-full mx-auto border mb-2 object-cover"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-full file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">คำนำหน้า</label>
                        <select
                            value={data.prename}
                            onChange={e => setData('prename', e.target.value)}
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:text-white"
                        >
                            <option value="">-- เลือก --</option>
                            <option value="นาย">นาย</option>
                            <option value="นาง">นาง</option>
                            <option value="นางสาว">นางสาว</option>
                        </select>
                        {errors.prename && <p className="text-red-500 text-xs mt-1">{errors.prename}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ชื่อ</label>
                        <input
                            type="text"
                            value={data.fname}
                            onChange={e => setData('fname', e.target.value)}
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:text-white"
                        />
                        {errors.fname && <p className="text-red-500 text-xs mt-1">{errors.fname}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">นามสกุล</label>
                        <input
                            type="text"
                            value={data.lname}
                            onChange={e => setData('lname', e.target.value)}
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:text-white"
                        />
                        {errors.lname && <p className="text-red-500 text-xs mt-1">{errors.lname}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ตำแหน่ง</label>
                        <input
                            type="text"
                            value={data.position}
                            onChange={e => setData('position', e.target.value)}
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:text-white"
                        />
                        {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">ระดับ</label>
                        <input
                            type="number"
                            value={data.grade}
                            onChange={e => setData('grade', parseInt(e.target.value) || 0)}
                            className="w-full p-2 rounded border dark:bg-zinc-800 dark:text-white"
                        />
                        {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
                    </div>

                    <div className="text-center pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full shadow"
                        >
                            💾 บันทึกการเปลี่ยนแปลง
                        </button>
                    </div>
                </form>
            </motion.div>
        </MainLayout>
    )
}
