<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Services\EvaluationLookupService;

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
            Log::channel('stack')->warning('External login failed: invalid code', [
                'code' => $request->code,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
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

        Log::channel('stack')->info('External login successful', [
            'session_id' => $session->id,
            'code_id' => $accessCode->id,
            'org_id' => $accessCode->external_organization_id,
            'evaluatee_id' => $accessCode->evaluatee_id,
            'ip' => $request->ip(),
        ]);

        return redirect()->route('external.confirm');
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
     * Show confirmation page before starting evaluation.
     */
    public function showConfirm(Request $request)
    {
        $externalSession = $request->attributes->get('external_session');

        $evaluatee = $externalSession->evaluatee;
        $evaluation = $externalSession->evaluation;
        $organization = $externalSession->organization;

        return Inertia::render('ExternalConfirm', [
            'evaluatee' => [
                'id' => $evaluatee->id,
                'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'position' => $evaluatee->position ? $evaluatee->position->name : null,
            ],
            'evaluation' => [
                'id' => $evaluation->id,
                'title' => $evaluation->title,
            ],
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
        ]);
    }

    /**
     * Handle confirmation and redirect to dashboard.
     */
    public function confirm(Request $request)
    {
        return redirect()->route('external.dashboard');
    }

    /**
     * Show external evaluator dashboard with list of evaluatees.
     */
    public function showDashboard(Request $request)
    {
        $externalSession = $request->attributes->get('external_session');

        $organization = $externalSession->organization;
        $accessCode = $externalSession->accessCode;

        // Get all access codes for this organization to show all assigned evaluatees
        $accessCodes = ExternalAccessCode::with(['evaluatee', 'evaluation'])
            ->where('external_organization_id', $organization->id)
            ->where('fiscal_year', $accessCode->fiscal_year)
            ->get();

        $evaluatees = $accessCodes->map(function ($code) {
            $evaluatee = $code->evaluatee;
            if (!$evaluatee) return null;

            // Check if evaluation is completed (code is used)
            $isCompleted = $code->is_used;

            return [
                'id' => $evaluatee->id,
                'name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'position' => $evaluatee->position ? $evaluatee->position->name : null,
                'evaluation_title' => $code->evaluation ? $code->evaluation->title : null,
                'is_completed' => $isCompleted,
                'access_code_id' => $code->id,
            ];
        })->filter()->values()->toArray();

        return Inertia::render('ExternalDashboard', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'evaluatees' => $evaluatees,
            'currentEvaluateeId' => $externalSession->evaluatee_id,
            'fiscalYear' => $accessCode->fiscal_year,
        ]);
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
        $evaluatorId = $externalSession->accessCode?->evaluationAssignment?->evaluator_id;

        $existingAnswers = [];
        if ($evaluatorId) {
            $externalFiscalYear = $externalSession->accessCode->fiscal_year ?? EvaluationLookupService::currentFiscalYear();
            $existingAnswers = Answer::where('evaluation_id', $evaluation->id)
                ->where('user_id', $evaluatorId)
                ->where('evaluatee_id', $evaluatee->id)
                ->where('fiscal_year', $externalFiscalYear)
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
            'answers.*.question_id' => 'required|integer',
            'answers.*.value' => 'nullable',
            'answers.*.other_text' => 'nullable|string',
        ]);

        $accessCode = $externalSession->accessCode;
        $assignment = $accessCode->evaluationAssignment;

        // Use assignment data if available, otherwise fallback to session/accessCode data
        $evaluateeId = $externalSession->evaluatee_id ?? $accessCode->evaluatee_id;
        $evaluationId = $externalSession->evaluation_id ?? $accessCode->evaluation_id;

        if (!$evaluateeId || !$evaluationId) {
            return back()->withErrors(['error' => 'ไม่พบข้อมูลผู้ถูกประเมินหรือแบบประเมิน']);
        }

        // For external evaluators: use evaluator_id from assignment if available,
        // otherwise use evaluatee_id as user_id (distinguished by external_access_code_id)
        $evaluatorId = $assignment?->evaluator_id ?? $evaluateeId;

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
                    'fiscal_year' => $accessCode->fiscal_year ?? EvaluationLookupService::currentFiscalYear(),
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

        Log::channel('stack')->info('External evaluation submitted', [
            'session_id' => $externalSession->id,
            'code_id' => $accessCode->id,
            'evaluator_id' => $evaluatorId,
            'evaluatee_id' => $evaluateeId,
            'evaluation_id' => $evaluationId,
            'answer_count' => count($data['answers']),
            'ip' => $request->ip(),
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
