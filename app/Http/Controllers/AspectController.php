<?php
namespace App\Http\Controllers;

use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AspectController extends Controller
{
    public function index(Evaluation $evaluation, Part $part)
    {
        // โหลด aspects ที่เกี่ยวข้องกับ part นี้ พร้อม sub-aspects
        $aspects = $part->aspects()->with('subAspects')->get();

        return Inertia::render('AdminAspectIndex', [
            'evaluation' => $evaluation,
            'part'       => $part,
            'aspects'    => $aspects,
        ]);
    }

    public function create(Evaluation $evaluation, Part $part)
    {
        return Inertia::render('AdminAspectCreate', [
            'evaluation' => $evaluation,
            'part'       => $part,
        ]);
    }

    public function store(Request $request, Evaluation $evaluation, Part $part)
    {
        $validated = $request->validate([
            'aspects'                  => ['required', 'array', 'min:1'],
            'aspects.*.name'           => ['required', 'string'],
            'aspects.*.has_subaspects' => ['sometimes'],
        ]);

        foreach ($validated['aspects'] as $aspectData) {
            $part->aspects()->create([
                'name'           => $aspectData['name'],
                'has_subaspects' => filter_var($aspectData['has_subaspects'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        return redirect()->route('aspects.index', [$evaluation, $part])
            ->with('success', 'เพิ่มด้านเรียบร้อยแล้ว');
    }

    public function edit(Evaluation $evaluation, Part $part, Aspect $aspect)
    {
        return Inertia::render('AdminAspectEdit', [
            'evaluation' => $evaluation,
            'part'       => $part,
            'aspect'     => $aspect,
        ]);
    }

    public function update(Request $request, Evaluation $evaluation, Part $part, Aspect $aspect)
    {
        $validated = $request->validate([
            'name'           => ['required', 'string'],
            'has_subaspects' => ['boolean'],
        ]);

        $aspect->update($validated);

        return redirect()->route('aspects.index', [$evaluation, $part])
            ->with('success', 'อัปเดตด้านเรียบร้อยแล้ว');
    }

    public function destroy(Evaluation $evaluation, Part $part, Aspect $aspect)
    {
        $aspect->delete();

        return back()->with('success', 'ลบด้านเรียบร้อยแล้ว');
    }
}
