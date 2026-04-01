<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AdminAccessCodeController extends Controller
{
    public function index(Request $request)
    {
        $query = ExternalAccessCode::with(['organization', 'evaluatee', 'evaluation', 'session']);

        if ($request->filled('organization_id')) {
            $query->where('external_organization_id', $request->organization_id);
        }

        // Filter by fiscal_year first (indexed, reduces result set early)
        if ($request->filled('fiscal_year')) {
            $query->where('fiscal_year', $request->fiscal_year);
        }

        if ($request->filled('status')) {
            switch ($request->status) {
                case 'unused':
                    $query->where('is_used', false);
                    break;
                case 'used':
                    $query->where('is_used', true);
                    break;
                case 'expired':
                    $query->where('is_used', false)
                          ->where('expires_at', '<', now());
                    break;
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('evaluatee', function ($q2) use ($search) {
                      $q2->where('fname', 'like', "%{$search}%")
                         ->orWhere('lname', 'like', "%{$search}%");
                  })
                  ->orWhereHas('organization', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $codes = $query->orderBy('id', 'desc')->paginate(15)->withQueryString();

        $fiscalYears = cache()->remember('access_code_fiscal_years', 3600, function () {
            return ExternalAccessCode::select('fiscal_year')
                ->distinct()
                ->orderBy('fiscal_year', 'desc')
                ->pluck('fiscal_year')
                ->toArray();
        });

        $organizations = ExternalOrganization::where('is_active', true)
            ->orderBy('name')->get(['id', 'name']);

        return Inertia::render('AdminAccessCodeIndex', [
            'codes' => $codes,
            'organizations' => $organizations,
            'fiscalYears' => $fiscalYears,
            'filters' => $request->only(['search', 'organization_id', 'status', 'fiscal_year']),
        ]);
    }

    /**
     * Show generate form.
     */
    public function create(Request $request)
    {
        $organizations = ExternalOrganization::where('is_active', true)
            ->orderBy('name')->get(['id', 'name']);

        $evaluations = Evaluation::where('status', 'published')
            ->orderBy('title')->get(['id', 'title', 'user_type', 'grade_min', 'grade_max']);

        // Get evaluatee IDs via a single subquery (faster than whereHas)
        $evaluateeIds = EvaluationAssignment::select('evaluatee_id')
            ->distinct()
            ->pluck('evaluatee_id');

        $evaluatees = User::whereIn('id', $evaluateeIds)
            ->get(['id', 'fname', 'lname', 'grade', 'emid']);

        return Inertia::render('AdminAccessCodeGenerate', [
            'organizations' => $organizations,
            'evaluations' => $evaluations,
            'evaluatees' => $evaluatees,
        ]);
    }

    /**
     * Bulk generate access codes.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:external_organizations,id',
            'evaluation_id' => 'required|exists:evaluations,id',
            'evaluatee_ids' => 'required|array|min:1',
            'evaluatee_ids.*' => 'integer',
            'fiscal_year' => 'required|integer|min:2020|max:2100',
            'expires_at' => 'nullable|date|after:today',
        ]);

        // Validate evaluatee IDs in a single query (instead of N queries)
        $validIds = User::whereIn('id', $validated['evaluatee_ids'])->pluck('id')->toArray();
        if (count($validIds) !== count($validated['evaluatee_ids'])) {
            return back()->withErrors(['evaluatee_ids' => 'มีผู้ถูกประเมินที่ไม่พบในระบบ'])->withInput();
        }

        // Batch load all relevant assignments in 1 query
        $allAssignments = EvaluationAssignment::where('evaluation_id', $validated['evaluation_id'])
            ->where('fiscal_year', $validated['fiscal_year'])
            ->whereIn('evaluatee_id', $validated['evaluatee_ids'])
            ->get()
            ->groupBy('evaluatee_id');

        // Load organization once
        $organization = ExternalOrganization::findOrFail($validated['organization_id']);

        // Pre-generate all unique codes at once (avoid N exists() queries)
        $codes = $this->generateUniqueCodes($organization->org_code, count($validated['evaluatee_ids']));

        // Prepare bulk insert data
        $now = now();
        $insertData = [];
        foreach ($validated['evaluatee_ids'] as $i => $evaluateeId) {
            $evaluateeAssignments = $allAssignments->get($evaluateeId, collect());
            $assignment = $evaluateeAssignments->firstWhere('angle', 'right')
                ?? $evaluateeAssignments->first();

            $insertData[] = [
                'code' => $codes[$i],
                'external_organization_id' => $validated['organization_id'],
                'evaluation_assignment_id' => $assignment?->id,
                'evaluatee_id' => $evaluateeId,
                'evaluation_id' => $validated['evaluation_id'],
                'fiscal_year' => $validated['fiscal_year'],
                'expires_at' => $validated['expires_at'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Bulk insert in a single query
        ExternalAccessCode::insert($insertData);

        // Clear fiscal years cache
        cache()->forget('access_code_fiscal_years');

        return redirect()->route('admin.access-codes.index')
            ->with('success', "สร้าง Access Code สำเร็จ " . count($insertData) . " รายการ");
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
