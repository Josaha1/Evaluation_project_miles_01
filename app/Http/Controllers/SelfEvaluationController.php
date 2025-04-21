<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SelfEvaluationController extends Controller
{
    public function intro()
    {
        return Inertia::render('Evaluations/SelfEvaluationIntro');
    }

    public function start(Request $request)
    {
        $user = auth()->user();
        $year = $request->get('fiscal_year', now()->year);

        $evaluation = Evaluation::where('type', 'self')
            ->where('fiscal_year', $year)
            ->firstOrFail();

        $evaluation->load([
            'parts.aspects.subaspects.questions.options',
            'parts.aspects.questions.options',
            'parts.questions.options',
        ]);

        return Inertia::render('Evaluations/SelfEvaluationForm', [
            'evaluation' => $evaluation,
        ]);
    }

    public function submit(Request $request)
    {
        $userId = auth()->id();
        $data   = $request->validate([
            'answers'               => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.value'       => 'nullable',
        ]);

        foreach ($data['answers'] as $answerData) {
            Answer::updateOrCreate(
                [
                    'user_id'     => $userId,
                    'question_id' => $answerData['question_id'],
                ],
                [
                    'value' => $answerData['value'],
                ]
            );
        }

        return redirect()->route('dashboard')->with('success', 'บันทึกการประเมินตนเองเรียบร้อยแล้ว');
    }
    public function step($step, Request $request)
    {
        $user = auth()->user();

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal') // เปลี่ยนเป็น 'external' หากเป็นของภายนอก
            ->where('grade_min', '<=', $user->grade)
            ->where('grade_max', '>=', $user->grade)
            ->latest()
            ->firstOrFail();

        // ดึงข้อมูล part ตามลำดับ step
        $parts = $evaluation->parts()->with([
            'questions.options',
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
        ])->orderBy('order')->get();

        $currentPart = $parts->get($step - 1);

        if (! $currentPart) {
            return redirect()->route('dashboard')->with('error', 'ไม่พบส่วนที่คุณกำลังประเมิน');
        }

        return Inertia::render('Evaluations/SelfEvaluationStep', [
            'evaluation'   => $evaluation,
            'current_part' => $currentPart,
            'step'         => (int) $step,
            'total_steps'  => $parts->count(),
        ]);
    }

}
