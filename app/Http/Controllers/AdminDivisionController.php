<?php

namespace App\Http\Controllers;

use App\Models\Divisions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDivisionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Divisions::withCount(['departments', 'users']);

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $divisions = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('AdminDivisionIndex', [
            'divisions' => $divisions,
            'filters'   => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminDivisionForm', [
            'mode' => 'create',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:divisions,name',
        ]);

        Divisions::create($validated);

        return redirect()->route('admin.divisions.index')
            ->with('success', 'เพิ่มสายงานเรียบร้อยแล้ว');
    }

    public function edit(Divisions $division)
    {
        return Inertia::render('AdminDivisionForm', [
            'mode'     => 'edit',
            'division' => $division,
        ]);
    }

    public function update(Request $request, Divisions $division)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:divisions,name,' . $division->id,
        ]);

        $division->update($validated);

        return redirect()->route('admin.divisions.index')
            ->with('success', 'แก้ไขสายงานเรียบร้อยแล้ว');
    }

    public function destroy(Divisions $division)
    {
        if ($division->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'ไม่สามารถลบได้ เนื่องจากมีสมาชิกอยู่ในสายงานนี้');
        }

        $division->delete();

        return redirect()->route('admin.divisions.index')
            ->with('success', 'ลบสายงานเรียบร้อยแล้ว');
    }
}
