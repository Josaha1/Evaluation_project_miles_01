<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ExternalEvaluatorController extends Controller
{
    /**
     * Show external login page.
     */
    public function showLogin(Request $request)
    {
        return Inertia::render('ExternalLogin', [
            'prefillCode' => $request->query('code', ''),
        ]);
    }

    /**
     * Validate access code and create session.
     */
    public function login(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20',
        ]);

        $accessCode = ExternalAccessCode::with(['organization', 'evaluatee', 'evaluation', 'evaluationAssignment'])
            ->where('code', $request->code)
            ->first();

        if (!$accessCode) {
            return back()->withErrors(['code' => 'รหัสเข้าใช้งานไม่ถูกต้อง']);
        }

        if (!$accessCode->isValid()) {
            if ($accessCode->is_used) {
                return back()->withErrors(['code' => 'รหัสนี้ถูกใช้งานแล้ว']);
            }
            return back()->withErrors(['code' => 'รหัสนี้หมดอายุแล้ว']);
        }

        if (!$accessCode->organization || !$accessCode->organization->is_active) {
            return back()->withErrors(['code' => 'องค์กรที่เชื่อมโยงกับรหัสนี้ไม่ได้เปิดใช้งาน']);
        }

        // Create evaluation session
        $sessionToken = Str::random(64);

        $session = ExternalEvaluationSession::create([
            'external_access_code_id' => $accessCode->id,
            'external_organization_id' => $accessCode->external_organization_id,
            'evaluatee_id' => $accessCode->evaluatee_id,
            'evaluation_id' => $accessCode->evaluation_id,
            'session_token' => $sessionToken,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'started_at' => now(),
        ]);

        // Store session info in Laravel session
        $request->session()->put('external_session_token', $sessionToken);
        $request->session()->put('external_session_id', $session->id);

        return redirect()->route('external.evaluate');
    }

    /**
     * Clear session and redirect to login.
     */
    public function logout(Request $request)
    {
        $request->session()->forget(['external_session_token', 'external_session_id']);

        return redirect()->route('external.login')
            ->with('success', 'ออกจากระบบเรียบร้อยแล้ว');
    }

    /**
     * Show evaluation form for the external evaluator.
     */
    public function showEvaluation(Request $request)
    {
        $externalSession = $request->attributes->get('external_session');

        $evaluation = $externalSession->evaluation;
        $evaluatee = $externalSession->evaluatee;
        $organization = $externalSession->organization;

        // Load evaluation structure
        $parts = $evaluation->parts()->with([
            'aspects.questions.options',
            'aspects.subaspects.questions.options',
            'questions.options',
        ])->orderBy('order')->get();

        // Get existing answers if any (for resume capability)
        $evaluatorId = $externalSession->accessCode->evaluationAssignment
            ? $externalSession->accessCode->evaluationAssignment->evaluator_id
            : null;

        $existingAnswers = [];
        if ($evaluatorId) {
            $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
                ->where('user_id', $evaluatorId)
                ->where('evaluatee_id', $evaluatee->id)
                ->get()
                ->keyBy('question_id')
                ->map(fn($a) => [
                    'value' => $a->value,
                    'other_text' => $a->other_text,
                ])
                ->toArray();
        }

        return Inertia::render('ExternalEvaluation', [
            'evaluation' => $evaluation,
            'evaluatee' => [
                'id' => $evaluatee->id,
                'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'position' => $evaluatee->position ? $evaluatee->position->name : null,
                'department' => $evaluatee->department ? $evaluatee->department->name : null,
            ],
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'parts' => $parts,
            'existingAnswers' => $existingAnswers,
            'sessionId' => $externalSession->id,
        ]);
    }

    /**
     * Save external evaluation answers.
     */
    public function submitEvaluation(Request $request)
    {
        $externalSession = $request->attributes->get('external_session');

        $data = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.value' => 'nullable',
            'answers.*.other_text' => 'nullable|string',
        ]);

        $accessCode = $externalSession->accessCode;
        $assignment = $accessCode->evaluationAssignment;

        if (!$assignment) {
            return back()->withErrors(['error' => 'ไม่พบข้อมูลการมอบหมายประเมิน']);
        }

        $evaluatorId = $assignment->evaluator_id;
        $evaluateeId = $externalSession->evaluatee_id;
        $evaluationId = $externalSession->evaluation_id;

        // Save answers
        foreach ($data['answers'] as $answerData) {
            $finalValue = $answerData['value'];
            if (is_array($finalValue)) {
                $finalValue = json_encode($finalValue);
            }

            Answer::updateOrCreate(
                [
                    'evaluation_id' => $evaluationId,
                    'user_id' => $evaluatorId,
                    'evaluatee_id' => $evaluateeId,
                    'question_id' => $answerData['question_id'],
                ],
                [
                    'value' => $finalValue,
                    'other_text' => $answerData['other_text'] ?? null,
                    'external_access_code_id' => $accessCode->id,
                ]
            );
        }

        // Mark session as completed
        $externalSession->update(['completed_at' => now()]);

        // Mark access code as used
        $accessCode->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        // Clear the session
        $request->session()->forget(['external_session_token', 'external_session_id']);

        return redirect()->route('external.thank-you');
    }

    /**
     * Show thank you page.
     */
    public function showThankYou()
    {
        return Inertia::render('ExternalThankYou');
    }
}
