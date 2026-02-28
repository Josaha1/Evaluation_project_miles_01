<?php

namespace App\Http\Controllers;

use App\Models\Departments;
use App\Models\Divisions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDepartmentController extends Controller
{
    public function index(Request $request)
    {
        $search     = $request->input('search');
        $divisionId = $request->input('division_id');

        $query = Departments::with('division')->withCount(['positions', 'users']);

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($divisionId) {
            $query->where('division_id', $divisionId);
        }

        $departments = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('AdminDepartmentIndex', [
            'departments' => $departments,
            'divisions'   => Divisions::orderBy('name')->get(),
            'filters'     => [
                'search'      => $search,
                'division_id' => $divisionId,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminDepartmentForm', [
            'mode'      => 'create',
            'divisions' => Divisions::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
        ]);

        Departments::create($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', 'เพิ่มหน่วยงานเรียบร้อยแล้ว');
    }

    public function edit(Departments $department)
    {
        $department->load('division');

        return Inertia::render('AdminDepartmentForm', [
            'mode'       => 'edit',
            'department' => $department,
            'divisions'  => Divisions::orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Departments $department)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'division_id' => 'required|exists:divisions,id',
        ]);

        $department->update($validated);

        return redirect()->route('admin.departments.index')
            ->with('success', 'แก้ไขหน่วยงานเรียบร้อยแล้ว');
    }

    public function destroy(Departments $department)
    {
        if ($department->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'ไม่สามารถลบได้ เนื่องจากมีสมาชิกอยู่ในหน่วยงานนี้');
        }

        $department->delete();

        return redirect()->route('admin.departments.index')
            ->with('success', 'ลบหน่วยงานเรียบร้อยแล้ว');
    }
}
