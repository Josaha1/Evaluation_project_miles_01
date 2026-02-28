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

        $organizations = ExternalOrganization::where('is_active', true)
            ->orderBy('name')->get(['id', 'name']);

        return Inertia::render('AdminAccessCodeIndex', [
            'codes' => $codes,
            'organizations' => $organizations,
            'filters' => $request->only(['search', 'organization_id', 'status']),
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

        // Get evaluatees who have right-angle assignments
        $evaluatees = User::whereHas('assignmentsAsEvaluatee', function ($q) {
            $q->where('angle', 'right');
        })->get(['id', 'fname', 'lname', 'grade', 'emid']);

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
            'evaluatee_ids.*' => 'exists:users,id',
            'fiscal_year' => 'required|integer|min:2500',
            'expires_at' => 'nullable|date|after:today',
        ]);

        $generatedCodes = [];

        foreach ($validated['evaluatee_ids'] as $evaluateeId) {
            // Find the right-angle assignment for this evaluatee
            $assignment = EvaluationAssignment::where('evaluatee_id', $evaluateeId)
                ->where('angle', 'right')
                ->where('fiscal_year', $validated['fiscal_year'])
                ->first();

            $code = $this->generateUniqueCode();

            $accessCode = ExternalAccessCode::create([
                'code' => $code,
                'external_organization_id' => $validated['organization_id'],
                'evaluation_assignment_id' => $assignment ? $assignment->id : null,
                'evaluatee_id' => $evaluateeId,
                'evaluation_id' => $validated['evaluation_id'],
                'fiscal_year' => $validated['fiscal_year'],
                'expires_at' => $validated['expires_at'] ?? null,
            ]);

            $generatedCodes[] = $accessCode;
        }

        return redirect()->route('admin.access-codes.index')
            ->with('success', "สร้าง Access Code สำเร็จ " . count($generatedCodes) . " รายการ");
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
     * Generate a unique 8-character alphanumeric code.
     */
    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (ExternalAccessCode::where('code', $code)->exists());

        return $code;
    }
}
