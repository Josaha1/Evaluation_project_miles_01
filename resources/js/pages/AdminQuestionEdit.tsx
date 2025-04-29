import MainLayout from '@/Layouts/MainLayout'
import Breadcrumb from '@/Components/ui/breadcrumb'
import { useForm, usePage } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdminQuestionEdit() {
    const { evaluation, part, aspects, subaspects = [], question, flash } = usePage().props as any

    const { data, setData, put, processing, errors } = useForm({
        aspect_id: question.aspect_id ?? '',
        sub_aspect_id: question.sub_aspect_id ?? '',
        title: question.title ?? '',
        type: question.type ?? 'rating',
        options: question.options ?? [],
    })

    const [hasSubAspect, setHasSubAspect] = useState(!!question.sub_aspect_id)

    useEffect(() => {
        if (flash.success) toast.success(flash.success)
        if (flash.error) toast.error(flash.error)
    }, [flash])

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
        put(route('questions.update', {
            evaluation: evaluation.id,
            part: part.id,
            question: question.id
        }))
    }

    return (
        <MainLayout title="แก้ไขคำถาม" breadcrumb={
            <Breadcrumb items={[
                { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                { label: evaluation.title, href: route('evaluations.edit', { evaluation: evaluation.id }) },
                { label: part.title, href: route('aspects.index', { evaluation: evaluation.id, part: part.id }) },
                { label: 'แก้ไขคำถาม', active: true }
            ]} />
        }>
            <div className="max-w-3xl mx-auto py-10">
                <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลือกด้าน</label>
                        <select
                            className="w-full mt-1 border p-2 rounded dark:bg-gray-700 dark:text-white"
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
                            {data.options.map((opt: any, i: number) => (
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
                            บันทึกการเปลี่ยนแปลง
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
