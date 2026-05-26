<?php

namespace App\Http\Controllers;

use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * CRUD for individual stakeholder rows imported from องศาขวา Excel.
 *
 * `external_organizations` holds GROUPS (e.g., "คู่ค้าหรือคู่ความร่วมมือ");
 * `external_stakeholders` holds the per-company rows under those groups.
 */
class AdminStakeholderController extends Controller
{
    public function index(Request $request)
    {
        $query = ExternalStakeholder::query()
            ->with([
                'evaluatee:id,fname,lname,prename,grade,emid',
                'accessCode:id,code,external_organization_id,fiscal_year',
                'accessCode.organization:id,name,org_code',
                'session:id,evaluator_name,evaluator_position,started_at,completed_at',
            ]);

        if ($request->filled('fiscal_year')) {
            $query->where('fiscal_year', $request->fiscal_year);
        }
        if ($request->filled('evaluatee_id')) {
            $query->where('evaluatee_id', $request->evaluatee_id);
        }
        if ($request->filled('group_label')) {
            $query->where('group_label', $request->group_label);
        }
        if ($request->filled('has_session')) {
            $request->has_session === 'yes'
                ? $query->whereNotNull('external_session_id')
                : $query->whereNull('external_session_id');
        }
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('organization_name', 'like', "%{$term}%")
                  ->orWhere('contact_person', 'like', "%{$term}%")
                  ->orWhere('contact_info', 'like', "%{$term}%")
                  ->orWhere('coordinator', 'like', "%{$term}%")
                  ->orWhereHas('evaluatee', function ($q2) use ($term) {
                      $q2->where('fname', 'like', "%{$term}%")
                         ->orWhere('lname', 'like', "%{$term}%")
                         ->orWhere('emid', 'like', "%{$term}%");
                  });
            });
        }

        $stakeholders = $query->orderByDesc('id')->paginate(25)->withQueryString();

        $fiscalYears = ExternalStakeholder::select('fiscal_year')
            ->distinct()
            ->orderByDesc('fiscal_year')
            ->pluck('fiscal_year')
            ->map(fn ($v) => (int) $v)
            ->all();

        $groupLabels = ExternalStakeholder::select('group_label')
            ->distinct()
            ->orderBy('group_label')
            ->pluck('group_label')
            ->all();

        return Inertia::render('AdminStakeholderList', [
            'stakeholders' => $stakeholders,
            'fiscal_years' => $fiscalYears,
            'group_labels' => $groupLabels,
            'filters'      => $request->only(['fiscal_year', 'evaluatee_id', 'group_label', 'has_session', 'search']),
        ]);
    }

    public function update(Request $request, ExternalStakeholder $stakeholder)
    {
        $validated = $request->validate([
            'organization_name' => 'required|string|max:500',
            'sub_group'         => 'nullable|string',
            'sequence_no'       => 'nullable|string|max:20',
            'contact_person'    => 'nullable|string|max:500',
            'contact_info'      => 'nullable|string|max:500',
            'coordinator'       => 'nullable|string|max:500',
        ]);

        $stakeholder->update($validated);

        return back()->with('success', 'อัปเดต Stakeholder เรียบร้อย');
    }

    public function destroy(ExternalStakeholder $stakeholder)
    {
        $stakeholder->delete();
        return back()->with('success', 'ลบ Stakeholder เรียบร้อย');
    }
}
