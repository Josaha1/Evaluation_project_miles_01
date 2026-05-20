import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Star, CheckCircle, MessageCircle, User, FileText, Send, ArrowLeft } from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';
import { motion } from 'framer-motion';

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
            case 5: return 'text-emerald-500';
            case 4: return 'text-blue-500';
            case 3: return 'text-amber-500';
            case 2: return 'text-orange-500';
            case 1: return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    const getRatingBgColor = (rating: number, isSelected: boolean) => {
        if (!isSelected) return 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
        switch (rating) {
            case 5: return 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500';
            case 4: return 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500';
            case 3: return 'bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-500';
            case 2: return 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500';
            case 1: return 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500';
            default: return 'bg-gray-100 dark:bg-gray-700';
        }
    };

    const renderRatingButtons = (questionKey: string, currentScore: number) => {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {[5, 4, 3, 2, 1].map(rating => {
                    const isSelected = currentScore === rating;
                    return (
                        <motion.button
                            key={rating}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleScoreChange(questionKey, rating)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium text-sm transition-all ${getRatingBgColor(rating, isSelected)} ${
                                isSelected ? getRatingColor(rating) : 'text-gray-600 dark:text-gray-300'
                            }`}
                            disabled={loading}
                        >
                            <Star
                                className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`}
                            />
                            <span>{rating}</span>
                        </motion.button>
                    );
                })}
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title={`ประเมินความพึงพอใจ - ${evaluation.title}`} />

            <div className="gradient-primary-soft min-h-screen py-8">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-2xl p-6 mb-8"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.visit('/dashboard')}
                                className="p-2 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    แบบประเมินความพึงพอใจ
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {evaluation.title} - ปีงบประมาณ {fiscalYear}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">ความคืบหน้า</span>
                                <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                                    {getCompletionPercentage()}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <motion.div
                                    className="gradient-primary h-2 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getCompletionPercentage()}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-4 border border-violet-100 dark:border-violet-800/30">
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-violet-900 dark:text-violet-200 mb-1">
                                        คำแนะนำในการประเมิน
                                    </h3>
                                    <p className="text-violet-800 dark:text-violet-300 text-sm">
                                        กรุณาให้คะแนนความพึงพอใจในแต่ละข้อคำถาม โดยใช้เกณฑ์ 1-5
                                        (1 = พึงพอใจน้อยที่สุด, 5 = พึงพอใจมากที่สุด)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Questions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400" />
                                คำถามการประเมินความพึงพอใจ
                            </h2>

                            <div className="space-y-8">
                                {Object.entries(questions).map(([questionKey, questionText], index) => (
                                    <motion.div
                                        key={questionKey}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * index }}
                                        className="border-b border-gray-100 dark:border-gray-700/50 pb-6 last:border-b-0"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-white font-semibold text-sm">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                                                    {questionText}
                                                </h3>

                                                {/* Rating Buttons (5 to 1) */}
                                                <div className="flex items-center gap-4 flex-wrap">
                                                    {renderRatingButtons(questionKey, scores[questionKey] || 0)}
                                                    {scores[questionKey] && (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-semibold ${getRatingColor(scores[questionKey])}`}>
                                                                {scores[questionKey]}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                ({ratingScale[scores[questionKey]]})
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Additional Comments */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-emerald-500" />
                                ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
                            </h2>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="กรุณาแสดงความคิดเห็นเพิ่มเติมเกี่ยวกับระบบประเมิน..."
                                className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none transition-colors"
                                rows={4}
                                maxLength={1000}
                                disabled={loading}
                            />
                            <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {comments.length}/1000 ตัวอักษร
                            </div>
                        </motion.div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">!</span>
                                    </div>
                                    <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <User className="w-5 h-5" />
                                    <span>ผู้ประเมิน: {user.name}</span>
                                </div>
                                <motion.button
                                    type="submit"
                                    disabled={loading || getCompletionPercentage() < 100}
                                    whileHover={loading || getCompletionPercentage() < 100 ? {} : { scale: 1.05 }}
                                    whileTap={loading || getCompletionPercentage() < 100 ? {} : { scale: 0.95 }}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                        loading || getCompletionPercentage() < 100
                                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            : 'gradient-primary text-white shadow-lg hover:shadow-xl'
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
                                </motion.button>
                            </div>
                        </motion.div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
};

export default SatisfactionEvaluation;
