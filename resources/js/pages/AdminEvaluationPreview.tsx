import MainLayout from '@/Layouts/MainLayout';
import { usePage, router } from '@inertiajs/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/Components/ui/accordion';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import Breadcrumb from '@/Components/ui/breadcrumb';
import { toast } from 'sonner';
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
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    👁️ Preview แบบประเมิน: {evaluation.title}
                </h1>

                {evaluation.parts.map((part, index) => (
                    <Card key={part.id}>
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
                ))}

                {/* Summary */}
                <div className="rounded-xl border p-4 shadow-sm bg-muted">
                    <p className="text-gray-800 dark:text-white">
                        📊 <strong>สรุป:</strong> Part: {evaluation.parts.length} | ด้าน: {evaluation.aspects_count} | หัวข้อย่อย: {evaluation.subaspects_count} | คำถาม: {evaluation.questions_count} | ตัวเลือก: {evaluation.options_count}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleBack}>🔙 แก้ไขแบบประเมิน</Button>
                    <Button variant="default" onClick={handlePublish}>🚀 เผยแพร่</Button>
                </div>
            </div>
        </MainLayout>
    );
}
