import React, { useEffect, useState } from 'react'
import { useForm, usePage } from '@inertiajs/react'
import MainLayout from '@/Layouts/MainLayout'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Breadcrumb from '@/Components/ui/breadcrumb'
const prenameOptions = ['นาย', 'นางสาว', 'นาง']
const sexOptions = ['ชาย', 'หญิง']
const roleOptions = ['admin', 'user']
const userTypeOptions = ['internal', 'external']

export default function AdminUserForm() {
    const { user, flash } = usePage().props as any

    const [showMessage, setShowMessage] = useState(true)

    const { data, setData, post, put, processing, errors } = useForm({
        emid: user?.emid || '',
        prename: user?.prename || '',
        fname: user?.fname || '',
        lname: user?.lname || '',
        sex: user?.sex || '',
        position: user?.position || '',
        grade: user?.grade || '',
        organize: user?.organize || '',
        birthdate: user?.birthdate || '',
        password: '',
        role: user?.role || 'user',
        user_type: user?.user_type || 'internal'
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (user) {
            put(route('admin.users.update', user.emid), {
                onSuccess: () => toast.success('บันทึกเรียบร้อยแล้ว ✅'),
                onError: () => toast.error('เกิดข้อผิดพลาดในการบันทึก ❌')
            })
        } else {
            post(route('admin.users.store'), {
                onSuccess: () => toast.success('เพิ่มผู้ใช้เรียบร้อยแล้ว ✅'),
                onError: () => toast.error('ไม่สามารถเพิ่มผู้ใช้ได้ ❌')
            })
        }
    }

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success)
        } else if (flash.error) {
            toast.error(flash.error)
        }
    }, [flash])

    return (
        <MainLayout title={user ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'} breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'จัดการสมาชิก', href: route('admin.users.index') },
                    { label: 'เพิ่ม - แก้ไขสมาชิก', active: true },
                ]}
            />
        }>
            <div className="max-w-3xl mt-4 mx-auto px-6 py-10">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
                        {user ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                    </h1>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รหัสพนักงาน (EMID)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                disabled={!!user}
                                value={data.emid}
                                onChange={e => setData('emid', e.target.value.replace(/\D/g, ''))}
                                autoFocus
                                className="mt-1 w-full border p-2 rounded"
                            />
                            {errors.emid && <div className="text-sm text-red-500 mt-1">{errors.emid}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">คำนำหน้า</label>
                            <select value={data.prename} onChange={e => setData('prename', e.target.value)}  className="mt-1 w-full border p-2 rounded  text-black  dark:text-white dark:bg-gray-700">
                                <option value="">-- เลือก --</option>
                                {prenameOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {errors.prename && <div className="text-sm text-red-500 mt-1">{errors.prename}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ</label>
                            <input type="text" value={data.fname} onChange={e => setData('fname', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                            {errors.fname && <div className="text-sm text-red-500 mt-1">{errors.fname}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">นามสกุล</label>
                            <input type="text" value={data.lname} onChange={e => setData('lname', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                            {errors.lname && <div className="text-sm text-red-500 mt-1">{errors.lname}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เพศ</label>
                            <select value={data.sex} onChange={e => setData('sex', e.target.value)} className="mt-1 w-full border p-2 rounded  text-black  dark:text-white dark:bg-gray-700">
                                <option value="">-- เลือก --</option>
                                {sexOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {errors.sex && <div className="text-sm text-red-500 mt-1">{errors.sex}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ตำแหน่ง</label>
                            <input type="text" value={data.position} onChange={e => setData('position', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                            {errors.position && <div className="text-sm text-red-500 mt-1">{errors.position}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ระดับ</label>
                            <input type="text" value={data.grade} onChange={e => setData('grade', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                            {errors.grade && <div className="text-sm text-red-500 mt-1">{errors.grade}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สังกัด</label>
                            <input type="text" value={data.organize} onChange={e => setData('organize', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                            {errors.organize && <div className="text-sm text-red-500 mt-1">{errors.organize}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันเกิด</label>
                            <input type="date" value={data.birthdate} onChange={e => setData('birthdate', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                            {errors.birthdate && <div className="text-sm text-red-500 mt-1">{errors.birthdate}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">บทบาท</label>
                            <select value={data.role} onChange={e => setData('role', e.target.value)} className="mt-1 w-full border p-2 rounded  text-black  dark:text-white dark:bg-gray-700">
                                {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            {errors.role && <div className="text-sm text-red-500 mt-1">{errors.role}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทบุคคล</label>
                            <select value={data.user_type} onChange={e => setData('user_type', e.target.value)} className="mt-1 w-full border p-2 rounded  text-black  dark:text-white dark:bg-gray-700">
                                {userTypeOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt === 'internal' ? 'ภายใน' : 'ภายนอก'}</option>
                                ))}
                            </select>
                            {errors.user_type && <div className="text-sm text-red-500 mt-1">{errors.user_type}</div>}
                        </div>

                        {!user && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รหัสผ่าน</label>
                                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="mt-1 w-full border p-2 rounded" />
                                {errors.password && <div className="text-sm text-red-500 mt-1">{errors.password}</div>}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            className={cn("px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold", {
                                'opacity-50 cursor-not-allowed': processing
                            })}
                            disabled={processing}
                        >
                            {user ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มผู้ใช้'}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
