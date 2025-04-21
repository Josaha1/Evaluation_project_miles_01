import MainLayout from '@/Layouts/MainLayout'
import { useEffect, useState } from 'react'
import { usePage, router } from '@inertiajs/react'
import Select from 'react-select'
import { Progress } from '@/Components/ui/progress'
import { cn } from '@/lib/utils'

interface EvaluationCard {
    id: number
    evaluatee_name: string
    evaluatee_photo: string
    position: string
    grade: number
    status: string
    progress: number
}

interface EvaluationsData {
    self?: EvaluationCard[]
    target?: EvaluationCard[]
}

interface OptionType {
    value: string
    label: string
}

export default function Dashboard() {
    const { evaluations, fiscal_years = [], selected_year } = usePage<{
        evaluations: EvaluationsData
        fiscal_years: string[]
        selected_year: string
    }>().props

    const [selectedYear, setSelectedYear] = useState<OptionType>({
        value: selected_year,
        label: `ปีงบประมาณ ${parseInt(selected_year) + 543}`,
    })

    const yearOptions: OptionType[] = fiscal_years.map((year) => ({
        value: year,
        label: `ปีงบประมาณ ${parseInt(year) + 543}`,
    }))

    useEffect(() => {
        if (selectedYear?.value !== selected_year) {
            router.visit(route('dashboard'), {
                method: 'get',
                data: { fiscal_year: selectedYear.value },
                preserveScroll: true,
                preserveState: true,
            })
        }
    }, [selectedYear])

    const handleStart = (id: number, isSelf: boolean) => {
        if (isSelf && id === 0) {
            router.visit(route('evaluations.self.intro')) // 👈 เปลี่ยนเส้นทางไป intro ก่อน
        } else {
            router.visit(`/evaluations/assignment/${id}`)
        }
    }


    const renderCard = (evalItem: EvaluationCard, isSelf: boolean) => (
        <div
            key={`${isSelf ? 'self' : 'target'}-${evalItem.id}`}
            className="rounded-xl border shadow-sm p-5 bg-white dark:bg-gray-800 hover:shadow-md transition"
        >
            <div className="flex items-center gap-4 mb-4">
                <img
                    src={evalItem.evaluatee_photo || '/images/default.jpg'}
                    alt={evalItem.evaluatee_name}
                    className="w-14 h-14 rounded-full object-cover border"
                />
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {evalItem.evaluatee_name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                        {evalItem.position} | ระดับ {evalItem.grade}
                    </p>
                </div>
            </div>

            <div className="mb-2">
                <span
                    className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        isSelf ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                    )}
                >
                    {isSelf ? '🧍‍♂️ ประเมินตนเอง' : '🧑‍🤝‍🧑 ประเมินผู้รับมอบหมาย'}
                </span>
            </div>

            <div className="mb-2">
                <Progress value={evalItem.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">ความคืบหน้า: {evalItem.progress}%</p>
            </div>

            <div className="mt-3">
                {evalItem.progress < 100 ? (
                    <button
                        onClick={() => handleStart(evalItem.id, isSelf)}
                        className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-full"
                    >
                        {evalItem.progress === 0 ? 'เริ่มประเมิน' : 'ดำเนินการต่อ'}
                    </button>
                ) : (
                    <span className="block text-sm text-green-600 font-medium text-center">
                        ✅ เสร็จสิ้น
                    </span>
                )}
            </div>
        </div>
    )

    return (
        <MainLayout title="แดชบอร์ดแบบประเมิน">
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📊 รายการที่ต้องประเมิน</h1>
                    <div className="w-60">
                        <Select
                            options={yearOptions}
                            value={selectedYear}
                            onChange={(val) => val && setSelectedYear(val)}
                            classNamePrefix="react-select"
                            isSearchable={false}
                            styles={{
                                menu: (base) => ({
                                    ...base,
                                    color: 'black',
                                }),
                                option: (base, { isFocused }) => ({
                                    ...base,
                                    color: 'black',
                                    backgroundColor: isFocused ? '#e0e0e0' : 'white',
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: 'black',
                                }),
                                input: (base) => ({
                                    ...base,
                                    color: 'black',
                                }),
                            }}
                        />

                    </div>
                </div>

                {/* ประเมินตนเอง */}
                <div>
                    <h2 className="text-xl font-semibold text-blue-700 mb-3">🧍‍♂️ ประเมินตนเอง</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(evaluations?.self ?? []).map((item) => renderCard(item, true))}
                    </div>
                </div>

                {/* ประเมินผู้อื่น */}
                <div>
                    <h2 className="text-xl font-semibold text-indigo-700 mb-3">🧑‍🤝‍🧑 ประเมินผู้ที่ได้รับมอบหมาย</h2>
                    {evaluations?.target?.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {evaluations.target.map((item) => renderCard(item, false))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            — ยังไม่มีรายการที่ต้องประเมิน —
                        </p>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
