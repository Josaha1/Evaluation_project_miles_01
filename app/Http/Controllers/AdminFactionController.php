<?php

namespace App\Http\Controllers;

use App\Models\Factions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminFactionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Factions::withCount('users');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $factions = $query->orderBy('id', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('AdminFactionIndex', [
            'factions' => $factions,
            'filters'  => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminFactionForm', [
            'mode' => 'create',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:factions,name',
        ]);

        Factions::create($validated);

        return redirect()->route('admin.factions.index')
            ->with('success', 'เพิ่มฝ่ายเรียบร้อยแล้ว');
    }

    public function edit(Factions $faction)
    {
        return Inertia::render('AdminFactionForm', [
            'mode'    => 'edit',
            'faction' => $faction,
        ]);
    }

    public function update(Request $request, Factions $faction)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:factions,name,' . $faction->id,
        ]);

        $faction->update($validated);

        return redirect()->route('admin.factions.index')
            ->with('success', 'แก้ไขฝ่ายเรียบร้อยแล้ว');
    }

    public function destroy(Factions $faction)
    {
        if ($faction->users()->count() > 0) {
            return redirect()->back()
                ->with('error', 'ไม่สามารถลบได้ เนื่องจากมีสมาชิกอยู่ในฝ่ายนี้');
        }

        $faction->delete();

        return redirect()->route('admin.factions.index')
            ->with('success', 'ลบฝ่ายเรียบร้อยแล้ว');
    }
}
