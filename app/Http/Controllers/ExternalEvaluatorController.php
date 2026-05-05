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
     * Verify an access code without creating a session — returns code context
     * for the 2-step external login UX. Includes pre-listed stakeholders so
     * the user can search & select which company they're from.
     */
    public function verify(Request $request)
    {
        $request->validate(['code' => 'required|string|max:20']);
        $code = trim($request->code);

        $accessCode = ExternalAccessCode::with([
            'organization:id,name,is_active',
            'evaluation:id,title',
        ])->where('code', $code)->first();

        if (!$accessCode) {
            return response()->json(['error' => 'รหัสเข้าใช้งานไม่ถูกต้อง'], 404);
        }
        if (!$accessCode->isValid()) {
            $reason = $accessCode->is_used
                ? 'รหัสนี้ถูกระงับแล้ว'
                : ($accessCode->expires_at && $accessCode->expires_at->isPast() ? 'รหัสนี้หมดอายุแล้ว' : 'รหัสนี้ใช้ครบโควตาแล้ว');
            return response()->json(['error' => $reason], 422);
        }
        if (!$accessCode->organization || !$accessCode->organization->is_active) {
            return response()->json(['error' => 'กลุ่ม Stakeholder ที่เชื่อมโยงกับรหัสนี้ปิดใช้งาน'], 422);
        }

        // Evaluatees this code covers (via pivot)
        $evaluatees = \DB::table('external_code_evaluatees as p')
            ->join('users as u', 'u.id', '=', 'p.evaluatee_id')
            ->leftJoin('positions as pos', 'pos.id', '=', 'u.position_id')
            ->where('p.external_access_code_id', $accessCode->id)
            ->select('u.id', 'u.fname', 'u.lname', 'u.prename', 'u.grade', 'pos.title as position_title')
            ->orderByDesc('u.grade')->orderBy('u.fname')
            ->get()
            ->map(fn ($u) => [
                'id'       => $u->id,
                'name'     => trim(($u->prename ?? '') . ($u->fname ?? '') . ' ' . ($u->lname ?? '')),
                'grade'    => $u->grade,
                'position' => $u->position_title,
            ])
            ->values();

        // Stakeholders deduped by org_name (so user search-picks unique organizations)
        $allStakeholders = \App\Models\ExternalStakeholder::where('external_access_code_id', $accessCode->id)
            ->orderBy('sequence_no')->orderBy('organization_name')
            ->get();

        // Cross-group consolidation preview — for each unique org_name in this code,
        // ALSO query the same org_name across ALL codes in this fy so the confirmation
        // step can show "you'll evaluate N people across X groups".
        $fy = (int) $accessCode->fiscal_year;
        $stakeholders = $allStakeholders
            ->groupBy(fn ($s) => \App\Models\ExternalStakeholder::normalizeName($s->organization_name))
            ->map(function ($group) use ($fy) {
                $first = $group->first();
                $orgNorm = \App\Models\ExternalStakeholder::normalizeName($first->organization_name);

                // Cross-group lookup: same org name in any code for this fy.
                // Match ignores all whitespace (Excel files often differ in spacing
                // before parentheses, e.g. "จำกัด(มหาชน)" vs "จำกัด (มหาชน)").
                $allRelated = \App\Models\ExternalStakeholder::query()
                    ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$orgNorm])
                    ->where('fiscal_year', $fy)
                    ->with([
                        'evaluatee:id,fname,lname,prename,grade',
                        'accessCode:id,external_organization_id',
                        'accessCode.organization:id,name',
                    ])
                    ->get();

                $relatedCodeIds = $allRelated->pluck('external_access_code_id')->unique()->values();
                $relatedGroups = $allRelated->pluck('accessCode.organization.name')->filter()->unique()->values();

                // Preview list of evaluatees across all related codes (deduped, with source group tag)
                $previewEvaluatees = $allRelated
                    ->groupBy('evaluatee_id')
                    ->map(function ($rows) {
                        $r = $rows->first();
                        $u = $r->evaluatee;
                        $sourceGroups = $rows->pluck('accessCode.organization.name')->filter()->unique()->values();
                        $hasSubmitted = $rows->whereNotNull('external_session_id')->isNotEmpty();
                        return [
                            'id'             => $r->evaluatee_id,
                            'name'           => $u ? trim(($u->prename ?? '') . ($u->fname ?? '') . ' ' . ($u->lname ?? '')) : '(ไม่พบ)',
                            'grade'          => $u?->grade,
                            'source_groups'  => $sourceGroups,
                            'submitted'      => $hasSubmitted,
                        ];
                    })
                    ->values();

                $submittedEvaluatees = $allRelated
                    ->whereNotNull('external_session_id')
                    ->pluck('evaluatee_id')->unique()->count();

                return [
                    'id'                       => $first->id,
                    'organization_name'        => $first->organization_name,
                    'sub_group'                => $first->sub_group,
                    'contact_person'           => $first->contact_person,
                    'evaluatees_count'         => $previewEvaluatees->count(),  // CROSS-GROUP total
                    'submitted_count'          => $submittedEvaluatees,
                    'related_code_ids'         => $relatedCodeIds,
                    'related_groups'           => $relatedGroups,
                    'preview_evaluatees'       => $previewEvaluatees,
                ];
            })
            ->values();

        return response()->json([
            'code'         => $accessCode->code,
            'fiscal_year'  => (int) $accessCode->fiscal_year,
            'organization' => [
                'id'   => $accessCode->organization->id,
                'name' => $accessCode->organization->name,
            ],
            'evaluation'   => $accessCode->evaluation ? [
                'id'    => $accessCode->evaluation->id,
                'title' => $accessCode->evaluation->title,
            ] : null,
            'evaluatees'   => $evaluatees,
            'stakeholders' => $stakeholders,
            'use_count'    => $accessCode->use_count,
            'max_uses'     => $accessCode->max_uses,
        ]);
    }

    /**
     * Validate access code and create session.
     */
    public function login(Request $request)
    {
        $request->validate([
            'code'                => 'required|string|max:20',
            'evaluator_name'      => 'required|string|max:255',
            'evaluator_position'  => 'nullable|string|max:255',
            'stakeholder_id'      => 'nullable|integer|exists:external_stakeholders,id',
            'evaluatee_id'        => 'nullable|integer',  // stakeholder mode: which evaluatee to start with
        ]);

        $code = trim($request->code);

        $accessCode = ExternalAccessCode::with(['organization', 'evaluatee', 'evaluation', 'evaluationAssignment'])
            ->where('code', $code)
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

        // ─── Cross-group consolidation ────────────────────────────────────────
        // When a stakeholder picks their org, find ALL codes (across any group)
        // where the same org name appears in this fy. Login session will track
        // related_code_ids so dashboard + selectEvaluatee can span groups.
        $pickedOrgName = null;
        $relatedCodeIds = [$accessCode->id];

        if ($stakeholderId = $request->input('stakeholder_id')) {
            $picked = \App\Models\ExternalStakeholder::where('id', $stakeholderId)->first();
            if ($picked) {
                $pickedOrgName = $picked->organization_name;
                $orgNorm = \App\Models\ExternalStakeholder::normalizeName($pickedOrgName);
                $relatedCodeIds = \App\Models\ExternalStakeholder::query()
                    ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$orgNorm])
                    ->where('fiscal_year', $accessCode->fiscal_year)
                    ->pluck('external_access_code_id')
                    ->unique()
                    ->values()
                    ->all();
                if (empty($relatedCodeIds)) $relatedCodeIds = [$accessCode->id];
            }
        }

        // Pick which evaluatee to start with — priority order:
        //   1. Explicit `evaluatee_id` from request
        //   2. The picked stakeholder row's own evaluatee_id
        //   3. First un-submitted evaluatee across all related codes
        //   4. First evaluatee in any related code's pivot
        $startingEvaluateeId = $request->input('evaluatee_id');
        $startingEvalId = null;
        $startingAccessCodeId = $accessCode->id;

        if (!$startingEvaluateeId && $stakeholderId = $request->input('stakeholder_id')) {
            $picked = \App\Models\ExternalStakeholder::find($stakeholderId);
            if ($picked) {
                $startingEvaluateeId = $picked->evaluatee_id;
                $startingAccessCodeId = $picked->external_access_code_id;
            }
        }

        if (!$startingEvaluateeId && $pickedOrgName) {
            $orgNorm = \App\Models\ExternalStakeholder::normalizeName($pickedOrgName);
            $unsubmitted = \App\Models\ExternalStakeholder::query()
                ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$orgNorm])
                ->where('fiscal_year', $accessCode->fiscal_year)
                ->whereNull('external_session_id')
                ->orderBy('id')
                ->first();
            if ($unsubmitted) {
                $startingEvaluateeId = $unsubmitted->evaluatee_id;
                $startingAccessCodeId = $unsubmitted->external_access_code_id;
            }
        }

        if (!$startingEvaluateeId) {
            $pivot = \DB::table('external_code_evaluatees')
                ->whereIn('external_access_code_id', $relatedCodeIds)
                ->orderBy('id')->first();
            if ($pivot) {
                $startingEvaluateeId = $pivot->evaluatee_id;
                $startingEvalId = $pivot->evaluation_id;
                $startingAccessCodeId = $pivot->external_access_code_id;
            }
        }

        if (!$startingEvalId && $startingEvaluateeId) {
            $startingEvalId = \DB::table('external_code_evaluatees')
                ->where('external_access_code_id', $startingAccessCodeId)
                ->where('evaluatee_id', $startingEvaluateeId)
                ->value('evaluation_id');
        }

        // Legacy fallback: if access_code itself has evaluatee_id, use that
        if (!$startingEvaluateeId && $accessCode->evaluatee_id) {
            $startingEvaluateeId = $accessCode->evaluatee_id;
            $startingEvalId = $accessCode->evaluation_id;
        }

        if (!$startingEvaluateeId) {
            return back()->withErrors(['code' => 'รหัสนี้ยังไม่มีผู้ถูกประเมินที่ผูกไว้']);
        }

        // Use the access_code that actually pairs with this evaluatee (might be different
        // from the one user entered if cross-group)
        $sessionAccessCode = ExternalAccessCode::find($startingAccessCodeId) ?? $accessCode;

        $sessionToken = Str::random(64);
        $session = ExternalEvaluationSession::create([
            'external_access_code_id'  => $sessionAccessCode->id,
            'external_organization_id' => $sessionAccessCode->external_organization_id,
            'evaluatee_id'             => $startingEvaluateeId,
            'evaluation_id'            => $startingEvalId,
            'session_token'            => $sessionToken,
            'ip_address'               => $request->ip(),
            'user_agent'               => $request->userAgent(),
            'evaluator_name'           => $request->input('evaluator_name'),
            'evaluator_position'       => $request->input('evaluator_position'),
            'started_at'               => now(),
        ]);

        // Link picked stakeholder row (for THIS evaluatee) to the session.
        // Match by normalized name so spacing variants of the same org also link.
        if ($pickedOrgName) {
            $pickedNorm = \App\Models\ExternalStakeholder::normalizeName($pickedOrgName);
            \App\Models\ExternalStakeholder::whereIn('external_access_code_id', $relatedCodeIds)
                ->where('evaluatee_id', $startingEvaluateeId)
                ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$pickedNorm])
                ->whereNull('external_session_id')
                ->update(['external_session_id' => $session->id]);

            $request->session()->put('picked_org_name', $pickedOrgName);
        }

        // Cross-group: remember which codes are eligible for this stakeholder identity
        $request->session()->put('related_code_ids', $relatedCodeIds);
        $request->session()->put('external_session_token', $sessionToken);
        $request->session()->put('external_session_id', $session->id);

        Log::channel('stack')->info('External login (cross-group)', [
            'session_id'    => $session->id,
            'starting_code' => $sessionAccessCode->id,
            'related_codes' => $relatedCodeIds,
            'picked_org'    => $pickedOrgName,
            'evaluatee_id'  => $startingEvaluateeId,
            'ip'            => $request->ip(),
        ]);

        return redirect()->route('external.dashboard');
    }

    /**
     * @deprecated kept for binary compat in case external code references it; not called.
     */
    private function loginAsStakeholder(Request $request, $stakeholderRows, string $code)
    {
        $first = $stakeholderRows->first();

        // Pick which evaluatee to start with
        $targetEvalId = $request->input('evaluatee_id');
        $targetRow = null;
        if ($targetEvalId) {
            $targetRow = $stakeholderRows->firstWhere('evaluatee_id', (int) $targetEvalId);
        }
        if (!$targetRow) {
            // First row that hasn't been submitted yet (else first overall)
            $targetRow = $stakeholderRows->whereNull('external_session_id')->first()
                ?? $stakeholderRows->first();
        }

        // Resolve access_code that pairs this stakeholder's org×evaluatee×fy
        $accessCode = ExternalAccessCode::with(['organization', 'evaluation'])
            ->where('id', $targetRow->external_access_code_id)
            ->first();

        if (!$accessCode || !$accessCode->isValid() || !$accessCode->organization?->is_active) {
            return back()->withErrors(['code' => 'รหัสนี้ใช้งานไม่ได้ในขณะนี้']);
        }

        $sessionToken = Str::random(64);
        $session = ExternalEvaluationSession::create([
            'external_access_code_id'  => $accessCode->id,
            'external_organization_id' => $accessCode->external_organization_id,
            'evaluatee_id'             => $targetRow->evaluatee_id,
            'evaluation_id'            => $accessCode->evaluation_id,
            'session_token'            => $sessionToken,
            'ip_address'               => $request->ip(),
            'user_agent'               => $request->userAgent(),
            'evaluator_name'           => $request->input('evaluator_name'),
            'evaluator_position'       => $request->input('evaluator_position'),
            'started_at'               => now(),
        ]);

        // Link this stakeholder row to the session (so dashboard can mark it done)
        \App\Models\ExternalStakeholder::where('id', $targetRow->id)
            ->whereNull('external_session_id')
            ->update(['external_session_id' => $session->id]);

        $request->session()->put('external_session_token', $sessionToken);
        $request->session()->put('external_session_id', $session->id);
        $request->session()->put('stakeholder_code', $code);

        Log::channel('stack')->info('External login (stakeholder mode)', [
            'session_id' => $session->id,
            'stakeholder_code' => $code,
            'evaluatee_id' => $targetRow->evaluatee_id,
            'ip' => $request->ip(),
        ]);

        return redirect()->route('external.dashboard');
    }

    /**
     * Clear session and redirect to login.
     */
    public function logout(Request $request)
    {
        $request->session()->forget(['external_session_token', 'external_session_id', 'picked_org_name', 'related_code_ids']);

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
     * One external evaluator (session) can evaluate multiple evaluatees from the same org.
     */
    public function showDashboard(Request $request)
    {
        $externalSession = $request->attributes->get('external_session');
        $organization = $externalSession->organization;
        $accessCode = $externalSession->accessCode;

        // Cross-group: list evaluatees from ALL related codes (same org_name across groups in this fy)
        $relatedCodeIds = $request->session()->get('related_code_ids', [$accessCode->id]);
        $pickedOrg = $request->session()->get('picked_org_name');

        $pivotQuery = \DB::table('external_code_evaluatees as p')
            ->join('users as u', 'u.id', '=', 'p.evaluatee_id')
            ->leftJoin('evaluations as e', 'e.id', '=', 'p.evaluation_id')
            ->leftJoin('positions as pos', 'pos.id', '=', 'u.position_id')
            ->leftJoin('external_access_codes as ac', 'ac.id', '=', 'p.external_access_code_id')
            ->leftJoin('external_organizations as eo', 'eo.id', '=', 'ac.external_organization_id')
            ->whereIn('p.external_access_code_id', $relatedCodeIds);

        // When picked_org is set, restrict to (access_code, evaluatee) pairs that exist
        // in external_stakeholders for THIS org_name (case-insensitive). Otherwise pivot
        // returns ALL evaluatees in the related codes — i.e. other companies too.
        if ($pickedOrg) {
            $orgNorm = \App\Models\ExternalStakeholder::normalizeName($pickedOrg);
            $pivotQuery->whereExists(function ($q) use ($orgNorm) {
                $q->select(\DB::raw(1))
                    ->from('external_stakeholders as es')
                    ->whereColumn('es.external_access_code_id', 'p.external_access_code_id')
                    ->whereColumn('es.evaluatee_id', 'p.evaluatee_id')
                    ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(es.organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$orgNorm]);
            });
        }

        $pivotEvaluatees = $pivotQuery
            ->select(
                'u.id as user_id', 'u.prename', 'u.fname', 'u.lname', 'u.grade',
                'pos.title as position_title',
                'e.title as evaluation_title', 'e.id as evaluation_id',
                'p.external_access_code_id as access_code_id',
                'eo.name as source_group'
            )
            ->orderByDesc('u.grade')->orderBy('u.fname')
            ->get();

        // Mark completed via answers (across all related sessions of this evaluator? or just current session)
        // For now: completion = ANY answer for this evaluatee from sessions linked to picked org
        $pickedOrgNorm = $pickedOrg ? \App\Models\ExternalStakeholder::normalizeName($pickedOrg) : null;
        $sessionsForOrg = $pickedOrgNorm
            ? \App\Models\ExternalStakeholder::query()
                ->whereIn('external_access_code_id', $relatedCodeIds)
                ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$pickedOrgNorm])
                ->whereNotNull('external_session_id')
                ->pluck('external_session_id')->unique()->toArray()
            : [$externalSession->id];

        $completedEvaluateeIds = \App\Models\Answer::whereIn('external_session_id', $sessionsForOrg)
            ->pluck('evaluatee_id')->unique()->toArray();
        $completedSet = array_flip($completedEvaluateeIds);

        // Group rows by evaluatee_id (dedup) — collect source_groups for each
        $evaluatees = $pivotEvaluatees
            ->groupBy('user_id')
            ->map(function ($rows) use ($completedSet, $accessCode) {
                $r = $rows->first();
                $sourceGroups = $rows->pluck('source_group')->filter()->unique()->values()->all();
                return [
                    'id'                => $r->user_id,
                    'name'              => trim($r->prename . $r->fname . ' ' . $r->lname),
                    'position'          => $r->position_title,
                    'grade'             => $r->grade,
                    'evaluation_title'  => $r->evaluation_title,
                    'evaluation_id'     => $r->evaluation_id,
                    'access_code_id'    => (int) $r->access_code_id,
                    'source_groups'     => $sourceGroups,
                    'is_completed'      => isset($completedSet[$r->user_id]),
                    'org_total_uses'    => $accessCode->use_count,
                ];
            })
            ->values()
            ->toArray();

        return Inertia::render('ExternalDashboard', [
            'organization' => [
                'id'   => $organization->id,
                'name' => $organization->name,    // GROUP label (e.g. "คู่ค้าหรือคู่ความร่วมมือ")
            ],
            'picked_org' => $pickedOrg,           // SPECIFIC company picked at login (e.g. "WHA")
            'evaluator' => [
                'name'     => $externalSession->evaluator_name,
                'position' => $externalSession->evaluator_position,
            ],
            'evaluatees'         => $evaluatees,
            'currentEvaluateeId' => $externalSession->evaluatee_id,
            'fiscalYear'         => $accessCode->fiscal_year,
            'totalCount'         => count($evaluatees),
            'completedCount'     => count(array_filter($evaluatees, fn($e) => $e['is_completed'])),
        ]);
    }

    /**
     * Stakeholder-centric dashboard: list all evaluatees this stakeholder identity
     * (identified by the shared `code` on `external_stakeholders`) needs to evaluate.
     */
    private function showStakeholderDashboard(Request $request, $externalSession, string $stakeholderCode)
    {
        $rows = \App\Models\ExternalStakeholder::with([
            'evaluatee:id,fname,lname,prename,grade,position_id',
            'evaluatee.position:id,title',
            'accessCode:id,fiscal_year,evaluation_id,external_organization_id',
            'accessCode.evaluation:id,title',
        ])
            ->where('code', $stakeholderCode)
            ->get();

        if ($rows->isEmpty()) {
            return redirect()->route('external.login')
                ->withErrors(['code' => 'รหัสนี้ใช้งานไม่ได้']);
        }

        $first = $rows->first();

        // Sessions submitted by THIS evaluator (matched on session token group via stakeholder.external_session_id)
        // For UI simplicity: an evaluatee is "done" if ANY stakeholder row sharing this code has external_session_id
        // pointing to a completed session, OR if there exist completed answers for (this evaluatee, any session linked
        // to a stakeholder of this code).
        $linkedSessionIds = $rows->pluck('external_session_id')->filter()->unique();
        $completedEvalIds = $linkedSessionIds->isEmpty() ? collect() :
            \App\Models\Answer::whereIn('external_session_id', $linkedSessionIds)
                ->pluck('evaluatee_id')->unique();

        $evaluatees = $rows->groupBy('evaluatee_id')->map(function ($group) use ($completedEvalIds) {
            $r = $group->first();
            $u = $r->evaluatee;
            return [
                'id'                  => $r->evaluatee_id,
                'name'                => $u ? trim(($u->prename ?? '') . ($u->fname ?? '') . ' ' . ($u->lname ?? '')) : '(ไม่พบ)',
                'position'            => $u?->position?->title,
                'grade'               => $u?->grade,
                'evaluation_title'    => $r->accessCode?->evaluation?->title,
                'evaluation_id'       => $r->accessCode?->evaluation_id,
                'access_code_id'      => $r->external_access_code_id,
                'is_completed'        => $completedEvalIds->contains($r->evaluatee_id),
                'org_total_uses'      => 0,
            ];
        })->values()->toArray();

        return Inertia::render('ExternalDashboard', [
            'organization' => [
                'id'   => $externalSession->external_organization_id,
                'name' => $first->group_label,
            ],
            'evaluator' => [
                'name'     => $externalSession->evaluator_name,
                'position' => $externalSession->evaluator_position,
            ],
            'stakeholder_identity' => [
                'name'           => $first->organization_name,
                'sub_group'      => $first->sub_group,
                'contact_person' => $first->contact_person,
            ],
            'evaluatees'         => $evaluatees,
            'currentEvaluateeId' => $externalSession->evaluatee_id,
            'fiscalYear'         => (int) $first->fiscal_year,
            'totalCount'         => count($evaluatees),
            'completedCount'     => count(array_filter($evaluatees, fn ($e) => $e['is_completed'])),
            'mode'               => 'stakeholder',
        ]);
    }

    /**
     * Switch the current evaluatee within the same session.
     * Looks up via pivot table — code covers many evaluatees.
     */
    public function selectEvaluatee(Request $request, $evaluateeId)
    {
        $externalSession = $request->attributes->get('external_session');

        // Cross-group: search pivot in ANY of the related codes (not just current one)
        $relatedCodeIds = $request->session()->get('related_code_ids', [$externalSession->external_access_code_id]);

        $pivot = \DB::table('external_code_evaluatees')
            ->whereIn('external_access_code_id', $relatedCodeIds)
            ->where('evaluatee_id', $evaluateeId)
            ->first();

        if (!$pivot) {
            return back()->withErrors(['error' => 'ผู้ถูกประเมินคนนี้ไม่อยู่ในรหัสของคุณ']);
        }

        $newAccessCode = ExternalAccessCode::find($pivot->external_access_code_id);
        if (!$newAccessCode || !$newAccessCode->isValid()) {
            return back()->withErrors(['error' => 'รหัสไม่พร้อมใช้งานหรือถูกระงับ']);
        }

        // Switch session to point at the correct (evaluatee, access_code) pair
        $externalSession->update([
            'external_access_code_id'  => $newAccessCode->id,
            'external_organization_id' => $newAccessCode->external_organization_id,
            'evaluatee_id'             => $pivot->evaluatee_id,
            'evaluation_id'            => $pivot->evaluation_id,
        ]);

        // Link the matching stakeholder row for the new evaluatee
        if ($pickedOrgName = $request->session()->get('picked_org_name')) {
            $pickedNorm = \App\Models\ExternalStakeholder::normalizeName($pickedOrgName);
            \App\Models\ExternalStakeholder::whereIn('external_access_code_id', $relatedCodeIds)
                ->where('evaluatee_id', $pivot->evaluatee_id)
                ->whereRaw('LOWER(REPLACE(REPLACE(REPLACE(organization_name, " ", ""), CHAR(9), ""), CHAR(10), "")) = ?', [$pickedNorm])
                ->whereNull('external_session_id')
                ->update(['external_session_id' => $externalSession->id]);
        }

        return redirect()->route('external.evaluate');
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

        // Save answers — DELETE+INSERT keyed by external_session_id (no stale columns leak)
        foreach ($data['answers'] as $answerData) {
            ['value' => $finalValue, 'other_text' => $otherText] = \App\Support\AnswerNormalizer::normalize($answerData['value']);
            // Frontend may also pass other_text alongside value; honor it as override
            if (!empty($answerData['other_text'])) {
                $otherText = $answerData['other_text'];
            }

            Answer::where('evaluation_id', $evaluationId)
                ->where('user_id', $evaluatorId)
                ->where('evaluatee_id', $evaluateeId)
                ->where('question_id', $answerData['question_id'])
                ->where('external_session_id', $externalSession->id)
                ->delete();

            if ($finalValue === null || $finalValue === ''
                || (is_array($finalValue) && count($finalValue) === 0)) {
                continue;
            }

            Answer::create([
                'evaluation_id'           => $evaluationId,
                'user_id'                 => $evaluatorId,
                'evaluatee_id'            => $evaluateeId,
                'question_id'             => $answerData['question_id'],
                'external_session_id'     => $externalSession->id,
                'value'                   => is_array($finalValue) ? json_encode($finalValue) : $finalValue,
                'other_text'              => $otherText,
                'external_access_code_id' => $accessCode->id,
                'fiscal_year'             => $accessCode->fiscal_year ?? EvaluationLookupService::currentFiscalYear(),
            ]);
        }

        // Mark session as completed
        $externalSession->update(['completed_at' => now()]);

        // Increment use count (don't auto-mark is_used — code stays valid for next person)
        $accessCode->increment('use_count');
        $accessCode->update(['used_at' => now()]);

        // Refresh session.completed_at so it doesn't lock — user may evaluate more people
        $externalSession->update(['completed_at' => null]);

        Log::channel('stack')->info('External evaluation submitted', [
            'session_id' => $externalSession->id,
            'code_id' => $accessCode->id,
            'evaluator_id' => $evaluatorId,
            'evaluatee_id' => $evaluateeId,
            'evaluation_id' => $evaluationId,
            'answer_count' => count($data['answers']),
            'ip' => $request->ip(),
        ]);

        // DO NOT clear session — allow evaluator to do more evaluations from dashboard
        // User explicitly logs out via /external/logout when done

        // Check if there are more evaluatees to evaluate
        $orgId = $accessCode->external_organization_id;
        $remaining = ExternalAccessCode::where('external_organization_id', $orgId)
            ->where('fiscal_year', $accessCode->fiscal_year)
            ->where('evaluatee_id', '!=', $evaluateeId)
            ->whereDoesntHave('sessions', function ($q) use ($externalSession) {
                $q->where('id', $externalSession->id);
            })
            ->count();

        return redirect()->route('external.dashboard')->with('success',
            'บันทึกผลประเมินเรียบร้อยแล้ว' . ($remaining > 0 ? ' — สามารถประเมินคนถัดไปได้' : ' — ประเมินครบทุกคนแล้ว'));
    }

    /**
     * Show thank you page.
     */
    public function showThankYou()
    {
        return Inertia::render('ExternalThankYou');
    }
}
