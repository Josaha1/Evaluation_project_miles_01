import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';

interface Option {
    id: number;
    label: string;
    score: number;
}

interface Question {
    id: number;
    title: string;
    type: 'open_text' | 'rating';
    options?: Option[]; // เฉพาะกรณี type = rating
}


interface Section {
    id: number;
    name: string;
    questions: Question[];
}

interface Evaluation {
    id: number;
    title: string;
    sections: Section[];
}

interface Assignment {
    id: number;
    evaluator_id: number;
    evaluatee_id: number;
    evaluation_id: number;
    status: string;
}

interface Props {
    evaluation: Evaluation;
    assignment: Assignment;
}

export default function EvaluationShow({ evaluation, assignment }: Props) {
    const [responses, setResponses] = useState<Record<number, string>>({});

    const handleChange = (questionId: number, value: string) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value,
        }));
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // ส่งคำตอบไปยังเซิร์ฟเวอร์ (คุณสามารถใช้ axios หรือ inertia.post ได้ที่นี่)
        console.log('Responses:', responses);
    };

    return (
        <MainLayout title={evaluation.title}>
            <div className="max-w-4xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                    {evaluation.title}
                </h1>

                <form onSubmit={handleSubmit}>
                    {evaluation.sections.map((section) => (
                        <div key={section.id} className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                {section.name}
                            </h2>

                            {section.questions.map((question) => (
                                <div key={question.id} className="mb-6">
                                    <label className="block text-gray-700 dark:text-gray-300 mb-1">
                                        {question.title}
                                    </label>

                                    {question.type === 'open_text' && (
                                        <textarea
                                            value={responses[question.id] || ''}
                                            onChange={(e) => handleChange(question.id, e.target.value)}
                                            rows={3}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 dark:bg-gray-900 dark:text-white"
                                            placeholder="กรอกคำตอบของคุณที่นี่"
                                        />
                                    )}

                                    {question.type === 'rating' && (
                                        <div className="space-y-2 mt-2">
                                            {question.options?.map((option) => (
                                                <label key={option.id} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.id}`}
                                                        value={option.score}
                                                        checked={responses[question.id] === String(option.score)}
                                                        onChange={(e) => handleChange(question.id, e.target.value)}
                                                    />
                                                    {option.label} ({option.score} คะแนน)
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            ส่งคำตอบ
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
