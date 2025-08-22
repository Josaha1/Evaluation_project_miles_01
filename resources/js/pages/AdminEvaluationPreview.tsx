import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/Components/ui/accordion';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
// ✅ Interfaces
interface Option {
    id: number;
    label: string;
    score: number;
}

interface Question {
    id: number;
    title: string;
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

// ✅ ฟังก์ชันช่วย render คำถาม
function renderQuestions(questions: Question[]) {
    return (
        <ul className="ml-6 mt-2 list-decimal space-y-2 text-sm">
            {questions.map((q, qIdx) => (
                <li key={q.id}>
                    <strong>Q{qIdx + 1}:</strong> {q.title}
                    <ul className="ml-4 list-disc mt-1">
                        {q.options.map((opt) => (
                            <li key={opt.id}>{opt.label} ({opt.score})</li>
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
        // Perfect print functionality with proper page margins and breaks
        const printStyles = `
            /* Hide print-only content on screen */
            .print-only {
                display: none !important;
            }
            
            @page {
                size: A4;
                margin: 20mm 15mm 20mm 15mm;
                counter-increment: page;
            }
            
            @media print {
                /* Reset everything for print */
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                /* Hide everything except print area */
                body * {
                    visibility: hidden;
                }
                
                /* Show only print area content */
                .print-area,
                .print-area * {
                    visibility: visible !important;
                }
                
                /* Position print area */
                .print-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 210mm !important;
                    margin: 0 !important;
                    padding: 20mm 15mm !important;
                }
                
                /* Body styles */
                body {
                    font-family: 'THSarabunNew', 'Sarabun', 'Arial Unicode MS', sans-serif !important;
                    font-size: 14px !important;
                    line-height: 1.5 !important;
                    color: #000 !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: visible !important;
                }
                
                /* Hide non-print elements */
                .no-print {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                /* Show print-only content during printing */
                .print-only {
                    display: block !important;
                    visibility: visible !important;
                }
                
                /* Document Header */
                .print-document-header {
                    text-align: center;
                    border-bottom: 3px double #000;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                    page-break-after: avoid;
                }
                
                .print-main-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-bottom: 10px;
                    letter-spacing: 1px;
                    line-height: 1.3;
                }
                
                .print-subtitle {
                    font-size: 20px;
                    font-weight: normal;
                    color: #000 !important;
                    margin-bottom: 0;
                    line-height: 1.3;
                }
                
                /* Document Info */
                .print-document-info {
                    border: 2px solid #000;
                    padding: 15px;
                    margin-bottom: 30px;
                    background: white;
                    font-size: 12px;
                    display: block;
                    page-break-after: avoid;
                    border-radius: 3px;
                }
                
                .print-summary {
                    color: #000 !important;
                    margin-bottom: 10px;
                    font-weight: bold;
                    line-height: 1.4;
                }
                
                .print-date {
                    color: #000 !important;
                    font-style: italic;
                    text-align: right;
                    font-size: 11px;
                    margin-top: 8px;
                }
                
                /* Hide TOC */
                .print-toc {
                    display: none !important;
                }
                
                /* Continuous Content */
                .print-continuous-content {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: visible;
                }
                
                /* Parts - Smart page breaks */
                .print-part {
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                    orphans: 3;
                    widows: 3;
                }
                
                .print-part:not(:first-child) {
                    page-break-before: auto;
                    margin-top: 25px;
                }
                
                .print-part-header {
                    background: white !important;
                    color: #000 !important;
                    font-size: 18px;
                    font-weight: bold;
                    text-align: center;
                    margin: 20px 0 15px 0;
                    padding: 10px 0;
                    border-top: 3px solid #000;
                    border-bottom: 3px solid #000;
                    letter-spacing: 0.8px;
                    page-break-after: avoid;
                    line-height: 1.3;
                }
                
                .print-part-content {
                    margin: 0;
                    padding: 0;
                }
                
                /* Aspects */
                .print-aspect {
                    margin: 15px 0;
                    page-break-inside: avoid;
                    orphans: 2;
                    widows: 2;
                }
                
                .print-aspect-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #000 !important;
                    margin: 12px 0 8px 0;
                    text-decoration: underline;
                    text-underline-offset: 4px;
                    text-decoration-thickness: 2px;
                    page-break-after: avoid;
                    line-height: 1.3;
                }
                
                /* Sub Aspects */
                .print-subaspect {
                    margin: 12px 0;
                    page-break-inside: avoid;
                    orphans: 2;
                    widows: 2;
                }
                
                .print-subaspect-title {
                    font-size: 15px;
                    font-weight: bold;
                    color: #000 !important;
                    margin: 10px 0 6px 0;
                    padding-bottom: 3px;
                    border-bottom: 2px solid #000;
                    font-style: italic;
                    page-break-after: avoid;
                    line-height: 1.3;
                }
                
                /* Questions - Better spacing and breaks */
                .print-question {
                    margin: 8px 0 12px 0;
                    page-break-inside: avoid;
                    padding-bottom: 4px;
                    orphans: 2;
                    widows: 2;
                }
                
                .print-question-line {
                    margin-bottom: 6px;
                    line-height: 1.5;
                    page-break-after: avoid;
                }
                
                .print-question-number {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000 !important;
                    margin-right: 10px;
                    display: inline-block;
                    min-width: 30px;
                }
                
                .print-question-title {
                    font-size: 14px;
                    font-weight: normal;
                    color: #000 !important;
                    display: inline;
                    line-height: 1.5;
                }
                
                /* Options - Better horizontal layout */
                .print-options {
                    margin: 6px 0 10px 30px;
                    font-size: 12px;
                    line-height: 1.4;
                    border-left: 3px solid #e0e0e0;
                    padding-left: 12px;
                }
                
                .print-option {
                    display: inline-block;
                    color: #000 !important;
                    margin-right: 12px;
                    white-space: nowrap;
                }
                
                .print-option-text {
                    color: #000 !important;
                    font-weight: normal;
                }
                
                .print-option-score {
                    color: #000 !important;
                    font-weight: bold;
                }
                
                .print-option-score:before {
                    content: " (";
                    font-weight: normal;
                }
                
                .print-option-score:after {
                    content: ")";
                    font-weight: normal;
                }
                
                /* Footer */
                .print-footer {
                    position: fixed;
                    bottom: 15mm;
                    left: 15mm;
                    right: 15mm;
                    text-align: center;
                    font-size: 11px;
                    color: #000 !important;
                    border-top: 2px solid #000;
                    padding-top: 8px;
                    background: white;
                    z-index: 1000;
                }
                
                /* Intelligent page break control */
                .print-part-header,
                .print-aspect-title,
                .print-subaspect-title {
                    page-break-after: avoid !important;
                }
                
                .print-question {
                    page-break-inside: avoid !important;
                }
                
                /* Prevent awkward breaks */
                .print-aspect:has(.print-subaspect) {
                    page-break-inside: avoid;
                }
                
                /* Ensure content flows naturally */
                .print-continuous-content > * {
                    page-break-before: auto;
                    page-break-after: auto;
                }
                
                /* Better widow/orphan control */
                p, div, .print-question, .print-aspect, .print-subaspect {
                    orphans: 2;
                    widows: 2;
                }
            }
        `;
        
        // Remove existing print styles
        const existingStyle = document.getElementById('print-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Add new print styles
        const styleElement = document.createElement('style');
        styleElement.id = 'print-styles';
        styleElement.type = 'text/css';
        styleElement.innerHTML = printStyles;
        document.head.appendChild(styleElement);
        
        // Trigger print
        setTimeout(() => {
            window.print();
        }, 100);
    };

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
            <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white no-print">
                    👁️ Preview แบบประเมิน: {evaluation.title}
                </h1>
                
                {/* Print Area */}
                <div className="print-area">
                    {/* Document Header */}
                    <div className="print-document-header">
                        <div className="print-main-title">รายงานแบบประเมิน 360 องศา</div>
                        <div className="print-subtitle">{evaluation.title}</div>
                    </div>
                    
                    {/* Document Info */}
                    <div className="print-document-info">
                        <div className="print-summary">
                            <strong>สรุปเอกสาร:</strong> {evaluation.parts.length} ส่วน • {evaluation.aspects_count} ด้าน • {evaluation.subaspects_count} หัวข้อย่อย • {evaluation.questions_count} คำถาม • {evaluation.options_count} ตัวเลือก
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
                    <div className="print-toc">
                        <div className="print-toc-title">สารบัญ</div>
                        {evaluation.parts.map((part, index) => (
                            <div key={part.id} className="print-toc-item">
                                <span>ส่วนที่ {index + 1}: {part.title}</span>
                                <span>{part.aspects.length} ด้าน</span>
                            </div>
                        ))}
                    </div>

                    {evaluation.parts.map((part, index) => (
                        <div key={part.id} className="print-card">
                            <Card className="no-print">
                                <CardHeader className="text-xl font-semibold">
                                    Part {index + 1}: {part.title}
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="multiple" className="w-full">
                                        {part.aspects.map((aspect) => (
                                            <AccordionItem key={aspect.id} value={`aspect-${aspect.id}`}>
                                                <AccordionTrigger>
                                                    {String(aspect.title ?? '').trim() !== ''
                                                        ? aspect.title
                                                        : <span className="text-muted-foreground italic">*ไม่มีชื่อด้าน*</span>}
                                                </AccordionTrigger>

                                                <AccordionContent>
                                                    {aspect.has_subaspects && aspect.subaspects?.length ? (
                                                        <div className="space-y-4 mt-2">
                                                            {aspect.subaspects.map((sub) => (
                                                                <div key={sub.id}>
                                                                    <h4 className="text-base font-medium">
                                                                        {String(sub.title ?? '').trim() !== ''
                                                                            ? sub.title
                                                                            : <span className="text-muted-foreground italic">*ไม่มีชื่อหัวข้อย่อย*</span>}
                                                                    </h4>
                                                                    {renderQuestions(sub.questions)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        renderQuestions(aspect.questions ?? [])
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                    
                    {/* Print Version - Continuous Beautiful Flow */}
                    <div className="print-only print-content">
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
                    <div className="print-footer">
                        <div>รายงานแบบประเมิน 360 องศา | สร้างโดยระบบประเมินการปฏิบัติงาน | หน้า <span className="print-page-number"></span></div>
                    </div>
                </div>
                
                {/* Summary */}
                <div className="rounded-xl border p-4 shadow-sm bg-muted no-print">
                    <p className="text-gray-800 dark:text-white">
                        📊 <strong>สรุป:</strong> Part: {evaluation.parts.length} | ด้าน: {evaluation.aspects_count} | หัวข้อย่อย: {evaluation.subaspects_count} | คำถาม: {evaluation.questions_count} | ตัวเลือก: {evaluation.options_count}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 no-print">
                    <Button 
                        variant="outline" 
                        onClick={handlePrint}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        พิมพ์รายงานแบบประเมิน
                    </Button>
                    <Button variant="outline" onClick={handleBack}>
                        🔙 แก้ไขแบบประเมิน
                    </Button>
                    <Button variant="default" onClick={handlePublish}>
                        🚀 เผยแพร่
                    </Button>
                </div>
            </div>
        </MainLayout>
    );
}
