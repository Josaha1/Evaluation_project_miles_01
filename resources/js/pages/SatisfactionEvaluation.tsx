import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Star, CheckCircle, MessageCircle, User, FileText, Send, ArrowLeft } from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';

interface SatisfactionEvaluationProps {
    evaluation: {
        id: number;
        title: string;
        description: string;
    };
    questions: Record<string, string>;
    ratingScale: Record<number, string>;
    fiscalYear: string;
    user: {
        id: number;
        name: string;
    };
}

const SatisfactionEvaluation: React.FC<SatisfactionEvaluationProps> = ({
    evaluation,
    questions,
    ratingScale,
    fiscalYear,
    user
}) => {
    const { errors, flash } = usePage<any>().props;
    const [scores, setScores] = useState<Record<string, number>>({});
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle Inertia errors
    useEffect(() => {
        if (flash?.error) {
            setError(flash.error);
        }
        if (Object.keys(errors || {}).length > 0) {
            setError('กรุณาตรวจสอบข้อมูลที่กรอก');
        }
    }, [errors, flash]);

    const handleScoreChange = (questionKey: string, score: number) => {
        setScores(prev => ({
            ...prev,
            [questionKey]: score
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate all questions are answered
        const questionKeys = Object.keys(questions);
        const missingQuestions = questionKeys.filter(key => !scores[key]);

        if (missingQuestions.length > 0) {
            setError('กรุณาให้คะแนนทุกข้อคำถาม');
            setLoading(false);
            return;
        }

        // Use Inertia router for proper CSRF handling
        router.post(`/satisfaction-evaluation/${evaluation.id}`, {
            ...scores,
            additional_comments: comments,
            fiscal_year: fiscalYear,
        }, {
            onSuccess: () => {
                // Success - will be redirected by backend
            },
            onError: (errors: any) => {
                console.log('Submission errors:', errors);
                if (typeof errors === 'object' && errors.message) {
                    setError(errors.message);
                } else if (typeof errors === 'string') {
                    setError(errors);
                } else {
                    setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                }
            },
            onFinish: () => {
                setLoading(false);
            }
        });
    };

    const getCompletionPercentage = () => {
        const totalQuestions = Object.keys(questions).length;
        const completedQuestions = Object.keys(scores).length;
        return Math.round((completedQuestions / totalQuestions) * 100);
    };

    const getRatingColor = (rating: number) => {
        switch (rating) {
            case 5: return 'text-green-500';
            case 4: return 'text-blue-500';
            case 3: return 'text-yellow-500';
            case 2: return 'text-orange-500';
            case 1: return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    const renderStars = (questionKey: string, currentScore: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleScoreChange(questionKey, star)}
                        className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
                            star <= currentScore ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        disabled={loading}
                    >
                        <Star
                            className={`w-8 h-8 ${
                                star <= currentScore ? 'fill-current' : ''
                            }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title={`ประเมินความพึงพอใจ - ${evaluation.title}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.visit('/dashboard')}
                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    แบบประเมินความพึงพอใจ
                                </h1>
                                <p className="text-gray-600">
                                    {evaluation.title} - ปีงบประมาณ {fiscalYear}
                                </p>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">ความคืบหน้า</span>
                                <span className="text-sm font-semibold text-blue-600">
                                    {getCompletionPercentage()}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${getCompletionPercentage()}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-900 mb-1">
                                        คำแนะนำในการประเมิน
                                    </h3>
                                    <p className="text-blue-800 text-sm">
                                        กรุณาให้คะแนนความพึงพอใจในแต่ละข้อคำถาม โดยใช้เกณฑ์ 1-5 ดาว 
                                        (1 = พึงพอใจน้อยที่สุด, 5 = พึงพอใจมากที่สุด)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Questions */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400" />
                                คำถามการประเมินความพึงพอใจ
                            </h2>
                            
                            <div className="space-y-8">
                                {Object.entries(questions).map(([questionKey, questionText], index) => (
                                    <div key={questionKey} className="border-b border-gray-100 pb-6 last:border-b-0">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold text-sm">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 mb-4">
                                                    {questionText}
                                                </h3>
                                                
                                                {/* Rating Stars */}
                                                <div className="flex items-center gap-4">
                                                    {renderStars(questionKey, scores[questionKey] || 0)}
                                                    {scores[questionKey] && (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-semibold ${getRatingColor(scores[questionKey])}`}>
                                                                {scores[questionKey]}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                ({ratingScale[scores[questionKey]]})
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Additional Comments */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-green-500" />
                                ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
                            </h2>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="กรุณาแสดงความคิดเห็นเพิ่มเติมเกี่ยวกับระบบประเมิน..."
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={4}
                                maxLength={1000}
                                disabled={loading}
                            />
                            <div className="text-right text-sm text-gray-500 mt-2">
                                {comments.length}/1000 ตัวอักษร
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">!</span>
                                    </div>
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <User className="w-5 h-5" />
                                    <span>ผู้ประเมิน: {user.name}</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || getCompletionPercentage() < 100}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                                        loading || getCompletionPercentage() < 100
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-105'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            ส่งการประเมิน
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default SatisfactionEvaluation;