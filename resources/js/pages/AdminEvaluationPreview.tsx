import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/Components/ui/accordion';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';
import { Printer, Eye, ArrowLeft, Send, ClipboardList, Layers, FileText, HelpCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Interfaces
interface Option {
    id: number;
    label: string;
    score: number;
}

interface Question {
    id: number;
    title: string;
    type?: string;
    options: Option[];
}

interface SubAspect {
    id: number;
    title: string | null;
    questions: Question[];
}

interface Aspect {
    id: number;
    title: string | number | null;
    has_subaspects: boolean;
    subaspects?: SubAspect[];
    sub_aspects?: SubAspect[];
    questions?: Question[];
}

interface Part {
    id: number;
    title: string;
    aspects: Aspect[];
}

interface Evaluation {
    id: number;
    title: string;
    parts: Part[];
    aspects_count: number;
    subaspects_count: number;
    questions_count: number;
    options_count: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Default rating labels when no explicit options exist
const DEFAULT_RATING_OPTIONS = [
    { label: 'ดีเยี่ยม', score: 5 },
    { label: 'ดีมาก', score: 4 },
    { label: 'ดี', score: 3 },
    { label: 'ต้องปรับปรุง', score: 2 },
    { label: 'ต้องปรับปรุงอย่างมาก', score: 1 },
];

// Badge for question type
function QuestionTypeBadge({ type }: { type?: string }) {
    const config: Record<string, { label: string; color: string }> = {
        rating: { label: 'Rating 1-5', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
        choice: { label: 'ตัวเลือก', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
        multiple_choice: { label: 'เลือกหลายข้อ', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        open_text: { label: 'ข้อความเปิด', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    };
    const c = config[type ?? 'rating'] ?? config.rating;
    return <span className={cn('ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium', c.color)}>{c.label}</span>;
}

// Helper: render questions
function renderQuestions(questions: Question[]) {
    return (
        <ul className="ml-6 mt-2 list-decimal space-y-2 text-sm">
            {questions.map((q, qIdx) => (
                <li key={q.id}>
                    <strong className="text-violet-700 dark:text-violet-300">Q{qIdx + 1}:</strong>{' '}
                    <span className="text-gray-700 dark:text-gray-300">{q.title}</span>
                    <ul className="ml-4 list-disc mt-1">
                        {(q.options ?? []).map((opt) => (
                            <li key={opt.id} className="text-gray-600 dark:text-gray-400">
                                {opt.label}{' '}
                                <span className="text-violet-600 dark:text-violet-400 font-medium">({opt.score})</span>
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    );
}

export default function AdminEvaluationPreview() {
    const { evaluation } = usePage<{ evaluation: Evaluation }>().props;

    const handleBack = () => {
        router.visit(route('evaluations.edit', { evaluation: evaluation.id }));
    };

    const handlePublish = () => {
        if (confirm('ยืนยันเผยแพร่แบบประเมินนี้หรือไม่?')) {
            router.patch(route('evaluations.publish', { evaluation: evaluation.id }), {}, {
                onSuccess: () => {
                    toast.success('เผยแพร่แบบประเมินเรียบร้อยแล้ว');
                    router.visit(route('evaluations.index'));
                },
                onError: () => {
                    toast.error('ไม่สามารถเผยแพร่แบบประเมินได้');
                },
            });
        }
    };

    const handlePrint = () => {
        const printStyles = `
            @page {
                size: A4;
                margin: 15mm;
            }

            @media print {
                html, body {
                    font-family: 'Sarabun', sans-serif !important;
                    font-size: 13px !important;
                    line-height: 1.6 !important;
                    color: #000 !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    overflow: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }

                /* Hide screen-only elements */
                .no-print {
                    display: none !important;
                }

                /* Show print-only elements */
                .print-only-element {
                    display: block !important;
                }

                /* Print area takes full page */
                .print-area {
                    position: static !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                /* Document Header */
                .print-document-header {
                    text-align: center;
                    border-bottom: 3px double #000;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                    page-break-after: avoid;
                }
                .print-main-title {
                    font-size: 22px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-bottom: 6px;
                }
                .print-subtitle {
                    font-size: 18px;
                    color: #000 !important;
                }

                /* Document Info */
                .print-document-info {
                    border: 1px solid #000;
                    padding: 10px 15px;
                    margin-bottom: 20px;
                    font-size: 12px;
                    page-break-after: avoid;
                }
                .print-summary { color: #000 !important; font-weight: bold; }
                .print-date { color: #000 !important; text-align: right; font-size: 11px; margin-top: 5px; }

                /* TOC hidden */
                .print-toc { display: none !important; }

                /* Content flows naturally */
                .print-continuous-content {
                    width: 100%;
                    overflow: visible;
                }

                /* Part - allow page break inside (important for large parts!) */
                .print-part {
                    margin-bottom: 15px;
                    page-break-inside: auto;
                }
                .print-part-header {
                    color: #000 !important;
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    margin: 15px 0 10px;
                    padding: 8px 0;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    page-break-after: avoid;
                }

                /* Aspect */
                .print-aspect {
                    margin: 10px 0;
                    page-break-inside: auto;
                }
                .print-aspect-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000 !important;
                    margin: 8px 0 5px;
                    text-decoration: underline;
                    page-break-after: avoid;
                }

                /* Sub-aspect */
                .print-subaspect {
                    margin: 8px 0 8px 10px;
                    page-break-inside: auto;
                }
                .print-subaspect-title {
                    font-size: 13px;
                    font-weight: bold;
                    font-style: italic;
                    color: #000 !important;
                    margin: 6px 0 4px;
                    padding-bottom: 2px;
                    border-bottom: 1px solid #666;
                    page-break-after: avoid;
                }

                /* Question - avoid break inside each question */
                .print-question {
                    margin: 5px 0 8px 5px;
                    page-break-inside: avoid;
                }
                .print-question-line {
                    margin-bottom: 3px;
                    line-height: 1.5;
                }
                .print-question-number {
                    font-weight: bold;
                    color: #000 !important;
                    margin-right: 8px;
                    display: inline-block;
                    min-width: 25px;
                }
                .print-question-title {
                    color: #000 !important;
                    display: inline;
                }

                /* Options inline */
                .print-options {
                    margin: 3px 0 6px 25px;
                    font-size: 11px;
                    color: #000 !important;
                }
                .print-option {
                    display: inline-block;
                    margin-right: 10px;
                    color: #000 !important;
                }
                .print-option-score {
                    font-weight: bold;
                }
                .print-option-score:before { content: " ("; font-weight: normal; }
                .print-option-score:after { content: ")"; font-weight: normal; }

                /* Footer */
                .print-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 10px;
                    color: #666 !important;
                    border-top: 1px solid #ccc;
                    padding-top: 5px;
                }
            }
        `;

        const existingStyle = document.getElementById('print-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'print-styles';
        styleElement.type = 'text/css';
        styleElement.innerHTML = printStyles;
        document.head.appendChild(styleElement);

        setTimeout(() => {
            window.print();
        }, 100);
    };

    const summaryItems = [
        { label: 'Part', value: evaluation.parts.length, icon: Layers, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
        { label: 'ด้าน', value: evaluation.aspects_count, icon: BarChart3, color: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300' },
        { label: 'หัวข้อย่อย', value: evaluation.subaspects_count, icon: FileText, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
        { label: 'คำถาม', value: evaluation.questions_count, icon: HelpCircle, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
    ];

    return (
        <MainLayout
            title="Preview แบบประเมิน"
            breadcrumb={
                <Breadcrumb
                    items={[
                        { label: 'แดชบอร์ดผู้ดูแลระบบ', href: route('admindashboard') },
                        { label: 'รายการแบบประเมิน', href: route('evaluations.index') },
                        { label: 'Preview แบบประเมิน', active: true },
                    ]}
                />
            }
        >
            <style dangerouslySetInnerHTML={{ __html: `.print-only-element { display: none !important; } @media print { .print-only-element { display: block !important; } }` }} />
            <div className="gradient-primary-soft min-h-screen -my-6 px-4 sm:px-6 lg:px-8 py-6">
                <motion.div
                    className="max-w-6xl mx-auto px-2 sm:px-6 py-10 space-y-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-8 no-print">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 gradient-primary rounded-xl text-white shadow-lg shadow-violet-500/25">
                                    <Eye className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl lg:text-3xl font-bold text-gradient-primary">
                                        Preview แบบประเมิน
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">{evaluation.title}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Summary Stats */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
                        {summaryItems.map((item) => (
                            <div key={item.label} className="glass-card rounded-2xl p-5">
                                <div className="flex items-center gap-3">
                                    <div className={cn('p-2 rounded-xl', item.color)}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Print Area */}
                    <div className="print-area">
                        {/* Document Header */}
                        <div className="print-document-header print-only-element">
                            <div className="print-main-title">รายงานแบบประเมิน 360 องศา</div>
                            <div className="print-subtitle">{evaluation.title}</div>
                        </div>

                        {/* Document Info */}
                        <div className="print-document-info print-only-element">
                            <div className="print-summary">
                                <strong>สรุปเอกสาร:</strong> {evaluation.parts.length} ส่วน | {evaluation.aspects_count} ด้าน | {evaluation.subaspects_count} หัวข้อย่อย | {evaluation.questions_count} คำถาม | {evaluation.options_count} ตัวเลือก
                            </div>
                            <div className="print-date">
                                วันที่พิมพ์: {new Date().toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>

                        {/* Table of Contents */}
                        <div className="print-toc print-only-element">
                            <div className="print-toc-title">สารบัญ</div>
                            {evaluation.parts.map((part, index) => (
                                <div key={part.id} className="print-toc-item">
                                    <span>ส่วนที่ {index + 1}: {part.title}</span>
                                    <span>{part.aspects.length} ด้าน</span>
                                </div>
                            ))}
                        </div>

                        {/* Parts - Screen View */}
                        {(() => {
                            let globalQ = 0;
                            return evaluation.parts.map((part, partIndex) => (
                                <motion.div key={part.id} variants={itemVariants}>
                                    <div className="glass-card rounded-2xl overflow-hidden no-print mb-6">
                                        {/* Part Header */}
                                        <div className="gradient-primary p-5">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
                                                    {partIndex + 1}
                                                </div>
                                                <div>
                                                    <span>{part.title}</span>
                                                    <p className="text-sm text-white/70 font-normal mt-0.5">
                                                        {part.aspects.length} ด้าน | {part.aspects.reduce((sum, a) => sum + (a.questions?.length || 0) + (a.subaspects?.reduce((s, sub) => s + sub.questions.length, 0) || 0), 0)} คำถาม
                                                    </p>
                                                </div>
                                            </h2>
                                        </div>

                                        <div className="p-6 space-y-6">
                                            {part.aspects.map((aspect, aspectIndex) => (
                                                <div key={aspect.id}>
                                                    {/* Aspect Header */}
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-1.5 h-8 rounded-full bg-violet-500" />
                                                        <div>
                                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                                                ด้านที่ {aspectIndex + 1}: {String(aspect.title ?? '').trim() !== '' ? aspect.title : <span className="text-muted-foreground italic">ไม่มีชื่อด้าน</span>}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    {/* Sub-aspects or Questions */}
                                                    {aspect.has_subaspects && (aspect.subaspects?.length || aspect.sub_aspects?.length) ? (
                                                        <div className="space-y-5 ml-4">
                                                            {(aspect.subaspects ?? aspect.sub_aspects ?? []).map((sub) => (
                                                                <div key={sub.id}>
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="w-1 h-5 rounded-full bg-fuchsia-400" />
                                                                        <h4 className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                                                                            {String(sub.title ?? '').trim() !== '' ? sub.title : <span className="italic opacity-60">ไม่มีชื่อหัวข้อย่อย</span>}
                                                                        </h4>
                                                                        <span className="text-xs text-gray-400">({(sub.questions ?? []).length} ข้อ)</span>
                                                                    </div>
                                                                    <div className="space-y-3 ml-3">
                                                                        {(sub.questions ?? []).map((q) => {
                                                                            globalQ++;
                                                                            const opts = (q.options ?? []).length > 0 ? q.options : (q.type === 'rating' ? DEFAULT_RATING_OPTIONS.map((o, i) => ({ ...o, id: -i })) : []);
                                                                            return (
                                                                                <div key={q.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <span className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                                            {globalQ}
                                                                                        </span>
                                                                                        <div className="flex-1">
                                                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                                                {q.title}
                                                                                                <QuestionTypeBadge type={q.type} />
                                                                                            </p>
                                                                                            {q.type === 'open_text' ? (
                                                                                                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400">
                                                                                                    พื้นที่สำหรับพิมพ์ข้อความ...
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                                                    {opts.map((opt) => (
                                                                                                        <span key={opt.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                                                                                            {opt.label} <span className="font-bold">({opt.score})</span>
                                                                                                        </span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3 ml-4">
                                                            {(aspect.questions ?? []).map((q) => {
                                                                globalQ++;
                                                                const opts = (q.options ?? []).length > 0 ? q.options : (q.type === 'rating' ? DEFAULT_RATING_OPTIONS.map((o, i) => ({ ...o, id: -i })) : []);
                                                                return (
                                                                    <div key={q.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                                                        <div className="flex items-start gap-3">
                                                                            <span className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                                {globalQ}
                                                                            </span>
                                                                            <div className="flex-1">
                                                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                                                    {q.title}
                                                                                    <QuestionTypeBadge type={q.type} />
                                                                                </p>
                                                                                {q.type === 'open_text' ? (
                                                                                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400">
                                                                                        พื้นที่สำหรับพิมพ์ข้อความ...
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                                                        {opts.map((opt) => (
                                                                                            <span key={opt.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                                                                                {opt.label} <span className="font-bold">({opt.score})</span>
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Divider between aspects */}
                                                    {aspectIndex < part.aspects.length - 1 && (
                                                        <hr className="my-6 border-gray-200 dark:border-gray-700" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ));
                        })()}

                        {/* Print Version - Continuous Beautiful Flow */}
                        <div className="print-only print-content print-only-element">
                            {(() => {
                                let globalQuestionCounter = 0;
                                return (
                                    <div className="print-continuous-content">
                                        {evaluation.parts.map((part, partIndex) => (
                                            <div key={part.id} className="print-part">
                                                <div className="print-part-header">
                                                    ส่วนที่ {partIndex + 1}: {part.title}
                                                </div>
                                                <div className="print-part-content">
                                                    {part.aspects.map((aspect) => (
                                                        <div key={aspect.id} className="print-aspect">
                                                            <div className="print-aspect-title">
                                                                {String(aspect.title ?? '').trim() !== ''
                                                                    ? aspect.title
                                                                    : 'ไม่มีชื่อด้าน'}
                                                            </div>
                                                            {aspect.has_subaspects && aspect.subaspects?.length ? (
                                                                <>
                                                                    {aspect.subaspects.map((sub) => (
                                                                        <div key={sub.id} className="print-subaspect">
                                                                            <div className="print-subaspect-title">
                                                                                {String(sub.title ?? '').trim() !== ''
                                                                                    ? sub.title
                                                                                    : 'ไม่มีชื่อหัวข้อย่อย'}
                                                                            </div>
                                                                            {sub.questions.map((q) => {
                                                                                globalQuestionCounter++;
                                                                                return (
                                                                                    <div key={q.id} className="print-question">
                                                                                        <div className="print-question-line">
                                                                                            <span className="print-question-number">{globalQuestionCounter}.</span>
                                                                                            <span className="print-question-title">{q.title}</span>
                                                                                        </div>
                                                                                        <div className="print-options">
                                                                                            {q.options.map((opt, optIndex) => (
                                                                                                <span key={opt.id} className="print-option">
                                                                                                    <span className="print-option-text">{opt.label}</span>
                                                                                                    <span className="print-option-score">{opt.score}</span>
                                                                                                    {optIndex < q.options.length - 1 ? ' | ' : ''}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {(aspect.questions ?? []).map((q) => {
                                                                        globalQuestionCounter++;
                                                                        return (
                                                                            <div key={q.id} className="print-question">
                                                                                <div className="print-question-line">
                                                                                    <span className="print-question-number">{globalQuestionCounter}.</span>
                                                                                    <span className="print-question-title">{q.title}</span>
                                                                                </div>
                                                                                <div className="print-options">
                                                                                    {q.options.map((opt, optIndex) => (
                                                                                        <span key={opt.id} className="print-option">
                                                                                            <span className="print-option-text">{opt.label}</span>
                                                                                            <span className="print-option-score">{opt.score}</span>
                                                                                            {optIndex < q.options.length - 1 ? ' | ' : ''}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Print Footer */}
                        <div className="print-footer print-only-element">
                            <div>รายงานแบบประเมิน 360 องศา | สร้างโดยระบบประเมินการปฏิบัติงาน | หน้า <span className="print-page-number"></span></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-end gap-3 no-print">
                        <button
                            onClick={handlePrint}
                            className={cn(
                                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200",
                                "bg-violet-100 hover:bg-violet-200 text-violet-700 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 dark:text-violet-300",
                                "border border-violet-200 dark:border-violet-700"
                            )}
                        >
                            <Printer className="w-4 h-4" />
                            พิมพ์รายงานแบบประเมิน
                        </button>
                        <button
                            onClick={handleBack}
                            className={cn(
                                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200",
                                "bg-white/80 hover:bg-gray-50 text-gray-700 border border-gray-200",
                                "dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700"
                            )}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            แก้ไขแบบประเมิน
                        </button>
                        <button
                            onClick={handlePublish}
                            className={cn(
                                "inline-flex items-center gap-2 px-6 py-2.5 gradient-primary text-white rounded-xl font-medium",
                                "hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
                            )}
                        >
                            <Send className="w-4 h-4" />
                            เผยแพร่
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </MainLayout>
    );
}
