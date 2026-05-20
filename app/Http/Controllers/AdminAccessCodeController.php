<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AdminAccessCodeController extends Controller
{
    /**
     * List access codes — 1 row = 1 access_code (1 group × 1 evaluatee × fy).
     * Each code lists its pre-listed stakeholders (from external_stakeholders)
     * + completed sessions in an expand panel.
     */
    public function index(Request $request)
    {
        $query = ExternalAccessCode::with([
                'organization',
                'evaluatee:id,fname,lname,grade,prename',  // null for group-shared codes
                'evaluation:id,title',
                'sessions' => function ($q) {
                    $q->whereNotNull('completed_at')
                      ->select('id', 'external_access_code_id', 'evaluator_name', 'evaluator_position', 'evaluatee_id', 'completed_at')
                      ->orderBy('completed_at', 'desc');
                },
                'stakeholders:id,external_access_code_id,evaluatee_id,sequence_no,organization_name,sub_group,contact_person,external_session_id',
                'codeEvaluatees.evaluatee:id,fname,lname,grade,prename',
            ])
            ->withCount('stakeholders')
            ->withCount('codeEvaluatees as evaluatees_count');

        if ($request->filled('organization_id')) {
            $query->where('external_organization_id', $request->organization_id);
        }
        if ($request->filled('fiscal_year')) {
            $query->where('fiscal_year', $request->fiscal_year);
        }
        if ($request->filled('status')) {
            switch ($request->status) {
                case 'active':
                    $query->where('is_used', false)
                          ->where(function ($q) { $q->whereNull('expires_at')->orWhere('expires_at', '>=', now()); });
                    break;
                case 'used': $query->where('use_count', '>', 0); break;
                case 'unused': $query->where('use_count', 0); break;
                case 'expired': $query->where('expires_at', '<', now()); break;
                case 'revoked': $query->where('is_used', true); break;
                case 'limit_reached':
                    $query->whereNotNull('max_uses')->whereColumn('use_count', '>=', 'max_uses');
                    break;
            }
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('code', 'like', "%{$term}%")
                  ->orWhereHas('evaluatee', fn ($e) => $e->where('fname', 'like', "%{$term}%")->orWhere('lname', 'like', "%{$term}%"))
                  ->orWhereHas('organization', fn ($o) => $o->where('name', 'like', "%{$term}%"));
            });
        }

        $codes = $query->orderByDesc('id')->paginate(15)->withQueryString();

        $fiscalYears = cache()->remember('access_code_fiscal_years', 3600, function () {
            return ExternalAccessCode::select('fiscal_year')->distinct()->orderByDesc('fiscal_year')->pluck('fiscal_year')->toArray();
        });

        $organizations = ExternalOrganization::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('AdminAccessCodeIndex', [
            'codes'         => $codes,
            'organizations' => $organizations,
            'fiscalYears'   => $fiscalYears,
            'filters'       => $request->only(['search', 'organization_id', 'status', 'fiscal_year']),
        ]);
    }

    /**
     * @deprecated unused — kept temporarily for reference. Will be removed.
     */
    private function buildStakeholderCodesView(Request $request)
    {
        $q = \App\Models\ExternalStakeholder::query()
            ->whereNotNull('code')
            ->with([
                'evaluatee:id,fname,lname,prename,grade',
                'session:id,evaluator_name,evaluator_position,completed_at,evaluatee_id',
            ]);

        if ($request->filled('fiscal_year')) {
            $q->where('fiscal_year', $request->fiscal_year);
        }
        if ($request->filled('organization_id')) {
            $orgName = ExternalOrganization::where('id', $request->organization_id)->value('name');
            if ($orgName) $q->where('group_label', $orgName);
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $q->where(function ($w) use ($term) {
                $w->where('code', 'like', "%{$term}%")
                  ->orWhere('organization_name', 'like', "%{$term}%")
                  ->orWhere('contact_person', 'like', "%{$term}%")
                  ->orWhere('group_label', 'like', "%{$term}%")
                  ->orWhereHas('evaluatee', function ($e) use ($term) {
                      $e->where('fname', 'like', "%{$term}%")
                        ->orWhere('lname', 'like', "%{$term}%");
                  });
            });
        }

        // Get distinct codes for pagination
        $allRows = $q->orderByDesc('id')->get();
        $grouped = $allRows->groupBy('code');

        // Apply status filter on aggregated data
        $status = $request->input('status');
        if ($status) {
            $grouped = $grouped->filter(function ($group) use ($status) {
                $total = $group->count();
                $submitted = $group->whereNotNull('external_session_id')->count();
                return match ($status) {
                    'unused'        => $submitted === 0,
                    'used'          => $submitted > 0 && $submitted < $total,
                    'limit_reached' => $submitted >= $total,
                    default         => true,
                };
            });
        }

        // Manual paginate
        $perPage = 15;
        $page = max(1, (int) $request->input('page', 1));
        $total = $grouped->count();
        $items = $grouped->slice(($page - 1) * $perPage, $perPage)->map(function ($group, $code) {
            $first = $group->first();
            $byEvaluatee = $group->groupBy('evaluatee_id');

            $evaluatees = $byEvaluatee->map(function ($rows, $evId) {
                $r = $rows->first();
                $u = $r->evaluatee;
                $session = $rows->first(fn ($x) => $x->session && $x->session->completed_at);
                return [
                    'id'           => $evId,
                    'name'         => $u ? trim(($u->prename ?? '') . ($u->fname ?? '') . ' ' . ($u->lname ?? '')) : '(ไม่พบ)',
                    'grade'        => $u?->grade,
                    'submitted'    => $session !== null,
                    'session_at'   => $session?->session?->completed_at,
                ];
            })->values();

            return [
                'code'              => $code,
                'fiscal_year'       => (int) $first->fiscal_year,
                'organization_name' => $first->organization_name,
                'group_label'       => $first->group_label,
                'sub_group'         => $first->sub_group,
                'contact_person'    => $first->contact_person,
                'contact_info'      => $first->contact_info,
                'evaluatees'        => $evaluatees,
                'total'             => $evaluatees->count(),
                'submitted'         => $evaluatees->where('submitted', true)->count(),
                'first_id'          => $first->id,
            ];
        })->values()->all();

        return [
            'data'         => $items,
            'current_page' => $page,
            'last_page'    => max(1, (int) ceil($total / $perPage)),
            'total'        => $total,
            'links'        => $this->buildPaginationLinks($page, max(1, (int) ceil($total / $perPage)), $request),
        ];
    }

    private function buildLegacyCodesQuery(Request $request)
    {
        $query = ExternalAccessCode::with([
                'organization',
                'evaluatee:id,fname,lname,grade,prename',
                'evaluation:id,title',
                'sessions' => function ($q) {
                    $q->whereNotNull('completed_at')
                      ->select('id', 'external_access_code_id', 'evaluator_name', 'evaluator_position', 'evaluatee_id', 'completed_at')
                      ->orderBy('completed_at', 'desc');
                },
            ])
            ->whereNotIn('id', \App\Models\ExternalStakeholder::select('external_access_code_id')->whereNotNull('external_access_code_id'));

        if ($request->filled('organization_id')) {
            $query->where('external_organization_id', $request->organization_id);
        }
        if ($request->filled('fiscal_year')) {
            $query->where('fiscal_year', $request->fiscal_year);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('evaluatee', fn ($q2) => $q2->where('fname', 'like', "%{$search}%")->orWhere('lname', 'like', "%{$search}%"))
                  ->orWhereHas('organization', fn ($q2) => $q2->where('name', 'like', "%{$search}%"));
            });
        }

        return $query->orderByDesc('id')->paginate(15)->withQueryString();
    }

    private function buildPaginationLinks(int $current, int $last, Request $request): array
    {
        $url = fn ($p) => $request->fullUrlWithQuery(['page' => $p]);
        $links = [
            ['url' => $current > 1 ? $url($current - 1) : null, 'label' => '&laquo; Previous', 'active' => false],
        ];
        for ($p = 1; $p <= $last; $p++) {
            $links[] = ['url' => $url($p), 'label' => (string) $p, 'active' => $p === $current];
        }
        $links[] = ['url' => $current < $last ? $url($current + 1) : null, 'label' => 'Next &raquo;', 'active' => false];
        return $links;
    }

    /**
     * Show generate form.
     */
    public function create(Request $request)
    {
        $organizations = ExternalOrganization::where('is_active', true)
            ->orderBy('name')->get(['id', 'name']);

        $evaluations = Evaluation::where('status', 'published')
            ->orderBy('title')->get(['id', 'title', 'user_type', 'grade_min', 'grade_max', 'fiscal_year']);

        // Build list of grades that have an external evaluation form available, by fiscal year
        $externalEvals = Evaluation::where('status', 'published')
            ->where('user_type', 'external')
            ->get(['grade_min', 'grade_max', 'fiscal_year']);

        $supportedGradesByFy = [];  // [fy => [grade => true]]
        foreach ($externalEvals as $e) {
            $fy = (int) ($e->fiscal_year ?? 0);
            for ($g = $e->grade_min; $g <= $e->grade_max; $g++) {
                $supportedGradesByFy[$fy][$g] = true;
            }
        }

        // Only show evaluatees with grade >= 9 (executives + governor — external evals only cover these)
        $evaluateeIds = EvaluationAssignment::select('evaluatee_id')
            ->distinct()
            ->pluck('evaluatee_id');

        $evaluatees = User::whereIn('id', $evaluateeIds)
            ->where('grade', '>=', 9)
            ->orderByDesc('grade')
            ->orderBy('fname')
            ->get(['id', 'fname', 'lname', 'grade', 'emid']);

        // Convert to simpler shape for frontend
        $supportedFlat = [];
        foreach ($supportedGradesByFy as $fy => $grades) {
            foreach (array_keys($grades) as $g) {
                $supportedFlat[] = ['fiscal_year' => $fy, 'grade' => $g];
            }
        }

        return Inertia::render('AdminAccessCodeGenerate', [
            'organizations'         => $organizations,
            'evaluations'           => $evaluations,
            'evaluatees'            => $evaluatees,
            'supported_eval_grades' => $supportedFlat,  // [{fiscal_year, grade}]
        ]);
    }

    /**
     * Bulk generate access codes.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:external_organizations,id',
            'evaluatee_ids'   => 'required|array|min:1',
            'evaluatee_ids.*' => 'integer',
            'fiscal_year'     => 'required|integer|min:2020|max:2100',
            'expires_at'      => 'nullable|date|after:today',
            'max_uses'        => 'nullable|integer|min:1',  // null = unlimited
        ]);

        // Load evaluatees with grade — needed for auto-pick evaluation form
        $evaluatees = User::whereIn('id', $validated['evaluatee_ids'])
            ->select('id', 'grade', 'fname', 'lname')->get()->keyBy('id');

        if ($evaluatees->count() !== count($validated['evaluatee_ids'])) {
            return back()->withErrors(['evaluatee_ids' => 'มีผู้ถูกประเมินที่ไม่พบในระบบ'])->withInput();
        }

        $organization = ExternalOrganization::findOrFail($validated['organization_id']);
        $fiscalYear = (int) $validated['fiscal_year'];

        // Auto-pick evaluation form per evaluatee based on grade (external user_type)
        $skipped = [];
        $evalAssignmentMap = []; // [evaluatee_id => ['eval_id'=>X, 'assignment_id'=>Y]]
        foreach ($evaluatees as $evaluatee) {
            $grade = (int) $evaluatee->grade;
            $eval = \App\Services\EvaluationLookupService::findByGrade($grade, 'external', $fiscalYear);
            if (!$eval) {
                $skipped[] = "{$evaluatee->fname} {$evaluatee->lname} (g{$grade})";
                continue;
            }
            // Find existing right-angle assignment if any
            $assignment = EvaluationAssignment::where('evaluation_id', $eval->id)
                ->where('fiscal_year', $fiscalYear)
                ->where('evaluatee_id', $evaluatee->id)
                ->where('angle', 'right')
                ->first();
            $evalAssignmentMap[$evaluatee->id] = [
                'eval_id'       => $eval->id,
                'assignment_id' => $assignment?->id,
            ];
        }

        if (empty($evalAssignmentMap)) {
            return back()->withErrors([
                'evaluatee_ids' => 'ไม่พบแบบประเมินภายนอก (external) สำหรับเกรดของผู้ถูกประเมิน — กรุณาสร้างแบบประเมิน external ก่อน',
            ])->withInput();
        }

        // Generate 1 code per (org + fiscal_year) — covers ALL selected evaluatees via pivot
        // Pick first evaluatee+evaluation as primary (legacy field for backward compat)
        $firstEvaluateeId = array_key_first($evalAssignmentMap);
        $firstEval = $evalAssignmentMap[$firstEvaluateeId];

        $code = $this->generateUniqueCodes($organization->org_code, 1)[0];

        $accessCode = ExternalAccessCode::create([
            'code'                     => $code,
            'external_organization_id' => $validated['organization_id'],
            'evaluation_assignment_id' => $firstEval['assignment_id'],
            'evaluatee_id'             => $firstEvaluateeId,                  // primary (default landing)
            'evaluation_id'            => $firstEval['eval_id'],
            'fiscal_year'              => $fiscalYear,
            'max_uses'                 => $validated['max_uses'] ?? null,
            'expires_at'               => $validated['expires_at'] ?? null,
        ]);

        // Insert pivot rows for ALL evaluatees this code covers
        $now = now();
        $pivotData = [];
        foreach ($evalAssignmentMap as $evaluateeId => $info) {
            $pivotData[] = [
                'external_access_code_id' => $accessCode->id,
                'evaluatee_id'            => $evaluateeId,
                'evaluation_id'           => $info['eval_id'],
                'created_at'              => $now,
                'updated_at'              => $now,
            ];
        }
        DB::table('external_code_evaluatees')->insert($pivotData);

        cache()->forget('access_code_fiscal_years');

        $msg = "สร้าง Access Code สำเร็จ — รหัสเดียวครอบ " . count($pivotData) . " ผู้ถูกประเมิน";
        $redirect = redirect()->route('admin.access-codes.index')->with('success', $msg);

        if (!empty($skipped)) {
            $skipMsg = "ข้าม " . count($skipped) . " ราย: " . implode(', ', $skipped);
            $skipMsg .= " — เนื่องจากไม่พบแบบประเมินภายนอก (external) สำหรับเกรดของผู้ถูกประเมินในปี งบประมาณนี้";
            $redirect->with('warning', $skipMsg);
        }

        return $redirect;
    }

    /**
     * Show single access code detail with QR code.
     */
    public function show(ExternalAccessCode $accessCode)
    {
        $accessCode->load(['organization', 'evaluatee', 'evaluation', 'session']);

        $qrCodeUrl = url('/external/login?code=' . $accessCode->code);
        $qrCodeSvg = QrCode::size(250)->generate($qrCodeUrl);

        return Inertia::render('AdminAccessCodeShow', [
            'accessCode' => $accessCode,
            'qrCodeSvg' => (string) $qrCodeSvg,
            'qrCodeUrl' => $qrCodeUrl,
        ]);
    }

    /**
     * Generate PDF with QR code cards.
     */
    public function printCards(Request $request)
    {
        $validated = $request->validate([
            'code_ids' => 'required|array|min:1',
            'code_ids.*' => 'exists:external_access_codes,id',
        ]);

        $codes = ExternalAccessCode::with(['organization', 'evaluatee', 'evaluation'])
            ->whereIn('id', $validated['code_ids'])
            ->get();

        $cards = [];
        foreach ($codes as $code) {
            $qrCodeUrl = url('/external/login?code=' . $code->code);
            $qrCodeSvg = (string) QrCode::size(200)->generate($qrCodeUrl);

            // Encode SVG as base64 data URI for DomPDF compatibility
            $qrCodeBase64 = base64_encode($qrCodeSvg);

            $cards[] = [
                'code' => $code->code,
                'organization' => $code->organization->name ?? '-',
                'evaluatee' => $code->evaluatee
                    ? $code->evaluatee->fname . ' ' . $code->evaluatee->lname
                    : '-',
                'evaluation' => $code->evaluation->title ?? '-',
                'expires_at' => $code->expires_at
                    ? $code->expires_at->format('d/m/Y')
                    : 'ไม่มีวันหมดอายุ',
                'qr_svg' => $qrCodeSvg,
            ];
        }

        $pdf = Pdf::loadView('pdf.access-code-cards', ['cards' => $cards]);
        $pdf->setPaper('a4', 'portrait');

        return $pdf->download('access-code-cards.pdf');
    }

    /**
     * Revoke (disable) an access code.
     */
    public function revoke(ExternalAccessCode $accessCode)
    {
        if ($accessCode->is_used) {
            return redirect()->back()
                ->with('error', 'ไม่สามารถยกเลิกรหัสที่ใช้งานแล้ว');
        }

        $accessCode->update([
            'is_used' => true,
            'used_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'ยกเลิก Access Code เรียบร้อยแล้ว');
    }

    /**
     * Regenerate an expired or used access code with a new code.
     */
    public function regenerate(ExternalAccessCode $accessCode)
    {
        // Look up the organization to get org_code for the code format
        $organization = $accessCode->organization;
        $orgCode = $organization ? $organization->org_code : null;

        // Generate a new unique code
        $newCode = $this->generateUniqueCode($orgCode);

        $accessCode->update([
            'code'    => $newCode,
            'is_used' => false,
            'used_at' => null,
        ]);

        return redirect()->back()
            ->with('success', 'สร้าง Access Code ใหม่เรียบร้อยแล้ว: ' . $newCode);
    }

    /**
     * Delete unused access code.
     */
    public function destroy(ExternalAccessCode $accessCode)
    {
        if ($accessCode->is_used) {
            return redirect()->back()
                ->with('error', 'ไม่สามารถลบรหัสที่ใช้งานแล้ว');
        }

        $accessCode->delete();

        return redirect()->back()
            ->with('success', 'ลบ Access Code เรียบร้อยแล้ว');
    }

    /**
     * Export codes as CSV.
     */
    public function exportCodes(Request $request)
    {
        $query = ExternalAccessCode::with(['organization', 'evaluatee', 'evaluation']);

        if ($request->filled('organization_id')) {
            $query->where('external_organization_id', $request->organization_id);
        }

        $codes = $query->orderBy('id', 'desc')->get();

        $filename = 'access-codes-' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($codes) {
            $file = fopen('php://output', 'w');
            // BOM for Excel UTF-8
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, [
                'Access Code',
                'องค์กร',
                'ผู้ถูกประเมิน',
                'แบบประเมิน',
                'ปีงบประมาณ',
                'สถานะ',
                'วันหมดอายุ',
                'URL',
            ]);

            foreach ($codes as $code) {
                fputcsv($file, [
                    $code->code,
                    $code->organization->name ?? '-',
                    $code->evaluatee ? $code->evaluatee->fname . ' ' . $code->evaluatee->lname : '-',
                    $code->evaluation->title ?? '-',
                    $code->fiscal_year,
                    $code->is_used ? 'ใช้แล้ว' : 'ยังไม่ได้ใช้',
                    $code->expires_at ? $code->expires_at->format('d/m/Y') : '-',
                    url('/external/login?code=' . $code->code),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Generate a unique access code in format IEAT-[ORG_CODE]-[RANDOM6].
     */
    /**
     * Generate multiple unique codes in batch (1 query instead of N).
     */
    private function generateUniqueCodes(?string $orgCode, int $count): array
    {
        $prefix = $orgCode ? "IEAT-{$orgCode}-" : 'IEAT-';
        $codes = [];

        // Generate candidates
        while (count($codes) < $count) {
            $candidate = $prefix . strtoupper(Str::random(6));
            $codes[$candidate] = $candidate; // use key to deduplicate
        }

        // Check all at once against DB
        $existing = ExternalAccessCode::whereIn('code', array_values($codes))->pluck('code')->toArray();
        $codes = array_values(array_diff($codes, $existing));

        // If some collided, generate more
        while (count($codes) < $count) {
            $candidate = $prefix . strtoupper(Str::random(6));
            if (!in_array($candidate, $codes) && !in_array($candidate, $existing)) {
                $codes[] = $candidate;
            }
        }

        return array_slice($codes, 0, $count);
    }
}
