<?php

namespace App\Http\Controllers;

use App\Models\Departments;
use App\Models\Position;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminPositionController extends Controller
{
    public function index(Request $request)
    {
        $search       = $request->input('search');
        $departmentId = $request->input('department_id');

        $query = Position::with('department.division')->withCount('users');

        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $positions = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('AdminPositionIndex', [
            'positions'   => $positions,
            'departments' => Departments::with('division')->orderBy('name')->get(),
            'filters'     => [
                'search'        => $search,
                'department_id' => $departmentId,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminPositionForm', [
            'mode'        => 'create',
            'departments' => Departments::with('division')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        Position::create($validated);

        return redirect()->route('admin.positions.index')
            ->with('success', 'เพิ่มตำแหน่งเรียบร้อยแล้ว');
    }

    public function edit(Position $position)
    {
        $position->load('department.division');

        return Inertia::render('AdminPositionForm', [
            'mode'        => 'edit',
            'position'    => $position,
            'departments' => Departments::with('division')->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Position $position)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $position->update($validated);

        return redirect()->route('admin.positions.index')
            ->with('success', 'แก้ไขตำแหน่งเรียบร้อยแล้ว');
    }

    public function destroy(Position $position)
    {
        if ($position->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'ไม่สามารถลบได้ เนื่องจากมีสมาชิกอยู่ในตำแหน่งนี้');
        }

        $position->delete();

        return redirect()->route('admin.positions.index')
            ->with('success', 'ลบตำแหน่งเรียบร้อยแล้ว');
    }
}
