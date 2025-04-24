import MainLayout from '@/Layouts/MainLayout'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { useForm, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdminQuestionCreate() {
    const { evaluation, part, aspects, subaspects = [], selectedAspect, selectedSub, flash } = usePage().props as any


    const { data, setData, post, processing, errors } = useForm({
        aspect_id: selectedAspect ?? '', // 👈 ใช้ selectedAspect จาก props
        sub_aspect_id: selectedSub ?? '', // 👈 ใช้ selectedSub จาก props
        title: '',
        type: 'rating',
        options: [{ label: '', score: 5 }],
    })

    const [hasSubAspect, setHasSubAspect] = useState(false)

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
        if (data.type === 'open_text') {
            setData('options', []) // ไม่ต้องส่ง option มาเลย
        } else if (data.options.length === 0) {
            setData('options', [{ label: '', score: data.type === 'rating' ? 5 : null }])
        }
    }, [flash, data.type])

    useEffect(() => {
        const aspect = aspects.find((a: any) => a.id === Number(data.aspect_id))
        if (aspect?.has_subaspects) {
            setHasSubAspect(true)
        } else {
            setHasSubAspect(false)
            setData('sub_aspect_id', '')
        }
    }, [data.aspect_id])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const payload = { ...data }

        // หากเป็น open_text ไม่ต้องส่ง options
        if (data.type === 'open_text') {
            delete payload.options
        }

        post(route('questions.store', { evaluation: evaluation.id, part: part.id }), {
            preserveScroll: true,
            data: payload,
        })
    }


    return (
        <MainLayout title="เพิ่มคำถาม" breadcrumb={
            <Breadcrumb
                items={[
                    { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                    { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                    { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                    { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                    { label: 'เพิ่มคำถาม', active: true },
                ]}
            />
        }>
            <div className="max-w-3xl mx-auto py-10">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลือกด้าน</label>
                        <select
                            autoFocus
                            className="w-full border p-2 rounded  text-black  dark:text-white dark:bg-gray-700"
                            value={data.aspect_id}
                            onChange={e => setData('aspect_id', e.target.value)}
                            required
                        >

                            <option value="">-- เลือกด้าน --</option>
                            {aspects.map((aspect: any) => (
                                <option key={aspect.id} value={aspect.id}>
                                    {aspect.name} {aspect.has_subaspects ? '(มีด้านย่อย)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {hasSubAspect && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลือกด้านย่อย</label>
                            <select
                                className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
                                value={data.sub_aspect_id}
                                onChange={e => setData('sub_aspect_id', e.target.value)}
                                required
                            >
                                <option value="">-- เลือกด้านย่อย --</option>
                                {subaspects
                                    .filter((s: any) => s.aspect_id === Number(data.aspect_id))
                                    .map((sub: any) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">คำถาม</label>
                        <input
                            type="text"
                            className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทคำถาม</label>
                        <select
                            className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={data.type}
                            onChange={e => setData('type', e.target.value)}
                            required
                        >
                            <option value="rating">Rating</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="choice">Choice</option>
                            <option value="open_text">Open Text</option>
                        </select>
                    </div>

                    {data.type !== 'open_text' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ตัวเลือก</label>
                            {data.options.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={`ตัวเลือกที่ ${i + 1}`}
                                        value={opt.label}
                                        onChange={e => {
                                            const newOpts = [...data.options]
                                            newOpts[i].label = e.target.value
                                            setData('options', newOpts)
                                        }}
                                        className="flex-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
                                    />

                                    {data.type === 'rating' && (
                                        <input
                                            type="number"
                                            placeholder="คะแนน"
                                            value={opt.score ?? ''}
                                            onChange={e => {
                                                const newOpts = [...data.options]
                                                newOpts[i].score = parseInt(e.target.value)
                                                setData('options', newOpts)
                                            }}
                                            className="w-24 border p-2 rounded dark:bg-gray-700 dark:text-white"
                                        />
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() =>
                                    setData('options', [...data.options, { label: '', ...(data.type === 'rating' ? { score: 1 } : {}) }])
                                }
                                className="text-sm text-blue-600"
                            >
                                ➕ เพิ่มตัวเลือก
                            </button>
                        </div>
                    )}


                    <div className="text-right">
                        <button type="submit" disabled={processing} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                            บันทึกคำถาม
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
