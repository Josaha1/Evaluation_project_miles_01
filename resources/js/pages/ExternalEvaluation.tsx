import { useState, useEffect } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, Send, Loader2, User, Building2, AlertCircle } from 'lucide-react'

interface Option {
    id: number
    label: string
    value: string
    score?: number
}

interface Question {
    id: number
    title: string
    type: string // 'rating', 'choice', 'open_text', 'multiple_choice'
    options: Option[]
    is_required?: boolean
}

interface SubAspect {
    id: number
    name: string
    questions: Question[]
}

interface Aspect {
    id: number
    name: string
    questions: Question[]
    subaspects: SubAspect[]
}

interface Part {
    id: number
    name: string
    description?: string
    order: number
    aspects: Aspect[]
    questions: Question[]
}

interface Evaluatee {
    id: number
    name: string
    position?: string
    department?: string
}

interface PageProps {
    evaluation: { id: number; title: string; description?: string }
    evaluatee: Evaluatee
    organization: { id: number; name: string }
    parts: Part[]
    existingAnswers: Record<number, { value: string; other_text?: string }>
    sessionId: number
}

export default function ExternalEvaluation() {
    const { evaluation, evaluatee, organization, parts, existingAnswers } = usePage<PageProps>().props

    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<number, { value: string; other_text?: string }>>({})
    const [submitting, setSubmitting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Flatten all questions into groups per part
    const questionGroups = parts.map(part => {
        const questions: Question[] = []

        // Direct part questions
        if (part.questions) {
            questions.push(...part.questions)
        }

        // Aspect questions
        part.aspects?.forEach(aspect => {
            if (aspect.questions) {
                questions.push(...aspect.questions)
            }
            // Subaspect questions
            aspect.subaspects?.forEach(sub => {
                if (sub.questions) {
                    questions.push(...sub.questions)
                }
            })
        })

        return { part, questions }
    }).filter(g => g.questions.length > 0)

    // Initialize from existing answers
    useEffect(() => {
        if (existingAnswers && Object.keys(existingAnswers).length > 0) {
            const initial: Record<number, { value: string; other_text?: string }> = {}
            Object.entries(existingAnswers).forEach(([qId, ans]) => {
                initial[Number(qId)] = ans
            })
            setAnswers(initial)
        }
    }, [])

    const totalQuestions = questionGroups.reduce((sum, g) => sum + g.questions.length, 0)
    const answeredCount = Object.keys(answers).length

    const currentGroup = questionGroups[currentStep]
    const isLastStep = currentStep === questionGroups.length - 1

    const setAnswer = (questionId: number, value: string, otherText?: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { value, other_text: otherText },
        }))
    }

    const handleSubmit = () => {
        setSubmitting(true)

        const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
            question_id: Number(qId),
            value: ans.value,
            other_text: ans.other_text || null,
        }))

        router.post(route('external.evaluate.submit'), {
            answers: formattedAnswers,
        }, {
            onFinish: () => setSubmitting(false),
        })
    }

    const renderQuestion = (question: Question) => {
        const currentAnswer = answers[question.id]

        return (
            <div key={question.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-base font-medium text-gray-900 mb-4">
                    {question.title}
                </h3>

                {question.type === 'rating' && question.options.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {question.options.map(option => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setAnswer(question.id, String(option.value || option.score))}
                                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                    currentAnswer?.value === String(option.value || option.score)
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}

                {question.type === 'choice' && question.options.length > 0 && (
                    <div className="space-y-2">
                        {question.options.map(option => (
                            <label
                                key={option.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    currentAnswer?.value === String(option.value || option.id)
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={`q_${question.id}`}
                                    checked={currentAnswer?.value === String(option.value || option.id)}
                                    onChange={() => setAnswer(question.id, String(option.value || option.id))}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                        ))}
                    </div>
                )}

                {question.type === 'open_text' && (
                    <textarea
                        value={currentAnswer?.value || ''}
                        onChange={e => setAnswer(question.id, e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="กรุณากรอกคำตอบ..."
                    />
                )}

                {question.type === 'multiple_choice' && question.options.length > 0 && (
                    <div className="space-y-2">
                        {question.options.map(option => {
                            const selectedValues = currentAnswer?.value ? JSON.parse(currentAnswer.value) : []
                            const isChecked = selectedValues.includes(String(option.value || option.id))
                            return (
                                <label
                                    key={option.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        isChecked
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                            const val = String(option.value || option.id)
                                            const updated = isChecked
                                                ? selectedValues.filter((v: string) => v !== val)
                                                : [...selectedValues, val]
                                            setAnswer(question.id, JSON.stringify(updated))
                                        }}
                                        className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`ประเมิน - ${evaluation.title}`} />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-lg font-bold text-gray-900 truncate">{evaluation.title}</h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            <span>ผู้ถูกประเมิน: <strong className="text-gray-700">{evaluatee.name}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4" />
                            <span>{organization.name}</span>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>ตอบแล้ว {answeredCount}/{totalQuestions} ข้อ</span>
                            <span>หัวข้อ {currentStep + 1}/{questionGroups.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-6">
                {currentGroup && (
                    <>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {currentGroup.part.name}
                            </h2>
                            {currentGroup.part.description && (
                                <p className="text-sm text-gray-500 mt-1">{currentGroup.part.description}</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            {currentGroup.questions.map(renderQuestion)}
                        </div>
                    </>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pb-8">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium ${
                            currentStep === 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        ก่อนหน้า
                    </button>

                    {isLastStep ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            ส่งแบบประเมิน
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentStep(prev => Math.min(questionGroups.length - 1, prev + 1))}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                            ถัดไป
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
                                <Send className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">ยืนยันการส่งแบบประเมิน</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                คุณตอบคำถามแล้ว {answeredCount} จาก {totalQuestions} ข้อ
                            </p>
                            {answeredCount < totalQuestions && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <p className="text-xs text-amber-700">ยังมีคำถามที่ยังไม่ได้ตอบ</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                            >
                                กลับแก้ไข
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        กำลังส่ง...
                                    </>
                                ) : (
                                    'ยืนยันส่ง'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
