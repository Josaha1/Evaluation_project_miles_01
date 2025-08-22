import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { BarChart3, Users, Star, MessageCircle, TrendingUp, Award, FileText, Download } from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';

interface SatisfactionEvaluationResultsProps {
    evaluation: {
        id: number;
        title: string;
        description: string;
    };
    fiscalYear: string;
    stats: {
        total_responses: number;
        average_score: number;
        satisfaction_level: string;
        question_averages: Record<string, number>;
    };
    questions: Record<string, string>;
    ratingScale: Record<number, string>;
    satisfactionEvaluations: Array<{
        id: number;
        user: {
            name: string;
            position: string;
            division: string;
        };
        average_score: number;
        satisfaction_level: string;
        satisfaction_color: string;
        additional_comments: string;
        created_at: string;
        scores: Record<string, number>;
    }>;
}

const SatisfactionEvaluationResults: React.FC<SatisfactionEvaluationResultsProps> = ({
    evaluation,
    fiscalYear,
    stats,
    questions,
    ratingScale,
    satisfactionEvaluations
}) => {
    const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'comments'>('overview');

    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'text-green-600';
        if (score >= 3.5) return 'text-blue-600';
        if (score >= 2.5) return 'text-yellow-600';
        if (score >= 1.5) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBackground = (score: number) => {
        if (score >= 4.5) return 'bg-green-50 border-green-200';
        if (score >= 3.5) return 'bg-blue-50 border-blue-200';
        if (score >= 2.5) return 'bg-yellow-50 border-yellow-200';
        if (score >= 1.5) return 'bg-orange-50 border-orange-200';
        return 'bg-red-50 border-red-200';
    };

    const renderStars = (score: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= score ? 'text-gray-600 fill-current' : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const exportResults = () => {
        // Create CSV content
        const csvContent = [
            ['ผลการประเมินความพึงพอใจ'],
            ['การประเมิน:', evaluation.title],
            ['ปีงบประมาณ:', fiscalYear],
            ['วันที่ส่งออก:', new Date().toLocaleDateString('th-TH')],
            [''],
            ['สรุปผลการประเมิน'],
            ['จำนวนผู้ประเมิน:', stats.total_responses.toString()],
            ['คะแนนเฉลี่ย:', stats.average_score.toFixed(2)],
            ['ระดับความพึงพอใจ:', stats.satisfaction_level],
            [''],
            ['คะแนนเฉลี่ยแต่ละคำถาม'],
            ...Object.entries(questions).map(([key, question]) => [
                question,
                stats.question_averages[key]?.toFixed(2) || '0.00'
            ]),
            [''],
            ['รายละเอียดการประเมิน'],
            ['ชื่อผู้ประเมิน', 'ตำแหน่ง', 'หน่วยงาน', 'คะแนนเฉลี่ย', 'ระดับความพึงพอใจ', 'วันที่ประเมิน', 'ความคิดเห็น'],
            ...satisfactionEvaluations.map(item => [
                item.user.name,
                item.user.position,
                item.user.division,
                item.average_score.toFixed(2),
                item.satisfaction_level,
                item.created_at,
                item.additional_comments || '-'
            ])
        ];

        const csvString = csvContent.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ผลการประเมินความพึงพอใจ_${evaluation.title}_${fiscalYear}.csv`;
        link.click();
    };

    return (
        <MainLayout>
            <Head title={`ผลการประเมินความพึงพอใจ - ${evaluation.title}`} />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-gray-300" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        ผลการประเมินความพึงพอใจ
                                    </h1>
                                    <p className="text-gray-600">
                                        {evaluation.title} - ปีงบประมาณ {fiscalYear}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={exportResults}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Download className="w-4 h-4 text-gray-300" />
                                ส่งออกรายงาน
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-gray-600" />
                                <div>
                                    <p className="text-sm text-gray-600">จำนวนผู้ประเมิน</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.total_responses}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3">
                                <Star className="w-8 h-8 text-gray-600" />
                                <div>
                                    <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.average_score.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-8 h-8 text-gray-600" />
                                <div>
                                    <p className="text-sm text-gray-600">ระดับความพึงพอใจ</p>
                                    <p className={`text-lg font-bold ${getScoreColor(stats.average_score)}`}>
                                        {stats.satisfaction_level}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-3">
                                <Award className="w-8 h-8 text-gray-600" />
                                <div>
                                    <p className="text-sm text-gray-600">เปอร์เซ็นต์</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {((stats.average_score / 5) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-xl shadow-lg mb-8">
                        <div className="border-b border-gray-200">
                            <div className="flex space-x-8 px-6">
                                {[
                                    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
                                    { id: 'details', label: 'รายละเอียด', icon: FileText },
                                    { id: 'comments', label: 'ความคิดเห็น', icon: MessageCircle },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedTab(tab.id as any)}
                                            className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                                selectedTab === tab.id
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4 text-gray-600" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6">
                            {selectedTab === 'overview' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        คะแนนเฉลี่ยแต่ละคำถาม
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {Object.entries(questions).map(([key, question], index) => {
                                            const score = stats.question_averages[key] || 0;
                                            return (
                                                <div key={key} className={`p-4 rounded-lg border ${getScoreBackground(score)}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-semibold">
                                                                {index + 1}
                                                            </span>
                                                            <p className="font-medium text-gray-900">{question}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {renderStars(Math.round(score))}
                                                            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                                                                {score.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${(score / 5) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedTab === 'details' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        รายละเอียดการประเมิน ({satisfactionEvaluations.length} คน)
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {satisfactionEvaluations.map((item) => (
                                            <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {item.user.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            {item.user.position} • {item.user.division}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2">
                                                            {renderStars(Math.round(item.average_score))}
                                                            <span className={`text-lg font-bold ${item.satisfaction_color}`}>
                                                                {item.average_score.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm font-medium ${item.satisfaction_color}`}>
                                                            {item.satisfaction_level}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                    {Object.entries(item.scores).map(([key, score]) => (
                                                        <div key={key} className="flex justify-between">
                                                            <span className="text-gray-600">Q{key.split('_')[1]}:</span>
                                                            <span className="font-medium">{score}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    ประเมินเมื่อ: {new Date(String(item.created_at)).toLocaleDateString('th-TH')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedTab === 'comments' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        ความคิดเห็นเพิ่มเติม
                                    </h3>
                                    <div className="space-y-4">
                                        {satisfactionEvaluations
                                            .filter(item => item.additional_comments)
                                            .map((item) => (
                                                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                {item.user.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {item.user.position} • {item.user.division}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {renderStars(Math.round(item.average_score))}
                                                            <span className={`text-sm font-medium ${item.satisfaction_color}`}>
                                                                {item.average_score.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                        <p className="text-gray-700">{item.additional_comments}</p>
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        {new Date(String(item.created_at)).toLocaleDateString('th-TH')}
                                                    </div>
                                                </div>
                                            ))}
                                        {satisfactionEvaluations.filter(item => item.additional_comments).length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                ไม่มีความคิดเห็นเพิ่มเติม
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SatisfactionEvaluationResults;