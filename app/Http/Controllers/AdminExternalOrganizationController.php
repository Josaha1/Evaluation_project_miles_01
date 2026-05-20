<?php

namespace App\Http\Controllers;

use App\Models\ExternalOrganization;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminExternalOrganizationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = ExternalOrganization::withCount([
            'accessCodes',
            'accessCodes as completed_codes_count' => fn ($q) =>
                $q->whereHas('sessions', fn ($s) => $s->whereNotNull('completed_at')),
            'evaluationSessions',
            'evaluationSessions as completed_sessions_count' => fn ($q) =>
                $q->whereNotNull('completed_at'),
        ])
            ->withCount([
                // Aggregate stakeholders across all codes of this org
                'accessCodes as stakeholders_count' => function ($q) {
                    $q->join('external_stakeholders', 'external_stakeholders.external_access_code_id', '=', 'external_access_codes.id')
                      ->select(\Illuminate\Support\Facades\DB::raw('count(external_stakeholders.id)'));
                },
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('contact_email', 'like', "%{$search}%")
                  ->orWhere('org_code', 'like', "%{$search}%");
            });
        }

        $organizations = $query->orderBy('id', 'desc')->paginate(15)->withQueryString();

        // Summary stats
        $totals = [
            'groups'          => ExternalOrganization::count(),
            'active'          => ExternalOrganization::where('is_active', true)->count(),
            'codes_total'     => \App\Models\ExternalAccessCode::count(),
            'stakeholders'    => \App\Models\ExternalStakeholder::count(),
            'sessions_total'  => \App\Models\ExternalEvaluationSession::count(),
            'sessions_done'   => \App\Models\ExternalEvaluationSession::whereNotNull('completed_at')->count(),
        ];

        return Inertia::render('AdminExternalOrganizationIndex', [
            'organizations' => $organizations,
            'filters'       => ['search' => $search],
            'totals'        => $totals,
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminExternalOrganizationForm', [
            'mode' => 'create',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'org_code' => 'required|string|max:10|unique:external_organizations,org_code|alpha_num',
            'description' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $validated['org_code'] = strtoupper($validated['org_code']);

        ExternalOrganization::create($validated);

        return redirect()->route('admin.external-organizations.index')
            ->with('success', 'เพิ่มองค์กรภายนอกเรียบร้อยแล้ว');
    }

    public function edit(ExternalOrganization $external_organization)
    {
        return Inertia::render('AdminExternalOrganizationForm', [
            'mode' => 'edit',
            'organization' => $external_organization,
        ]);
    }

    public function update(Request $request, ExternalOrganization $external_organization)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'org_code' => 'required|string|max:10|alpha_num|unique:external_organizations,org_code,' . $external_organization->id,
            'description' => 'nullable|string',
            'contact_person' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]);

        $validated['org_code'] = strtoupper($validated['org_code']);

        $external_organization->update($validated);

        return redirect()->route('admin.external-organizations.index')
            ->with('success', 'แก้ไของค์กรภายนอกเรียบร้อยแล้ว');
    }

    public function destroy(ExternalOrganization $external_organization)
    {
        $activeCodesCount = $external_organization->accessCodes()
            ->where('is_used', false)
            ->count();

        if ($activeCodesCount > 0) {
            return redirect()->back()
                ->with('error', "ไม่สามารถลบได้ เนื่องจากยังมี Access Code ที่ยังไม่ได้ใช้ {$activeCodesCount} รายการ");
        }

        $external_organization->delete();

        return redirect()->route('admin.external-organizations.index')
            ->with('success', 'ลบองค์กรภายนอกเรียบร้อยแล้ว');
    }
}
