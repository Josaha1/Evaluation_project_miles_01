<?php
namespace App\Http\Controllers;

use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubAspectController extends Controller
{
    public function index(Evaluation $evaluation, Part $part, Aspect $aspect)
    {
        $aspect->load('subAspects');

        return Inertia::render('AdminSubAspectIndex', [
            'evaluation' => $evaluation,
            'part'       => $part,
            'aspect'     => $aspect,
            'subaspects' => $aspect->subAspects,
        ]);
    }

    public function create(Evaluation $evaluation, Part $part, Aspect $aspect)
    {
        return Inertia::render('AdminSubAspectCreate', [
            'evaluation' => $evaluation,
            'part'       => $part,
            'aspect'     => $aspect,
        ]);
    }

    public function store(Request $request, Evaluation $evaluation, Part $part, Aspect $aspect)
    {
        $validated = $request->validate([
            'subaspects'               => ['required', 'array', 'min:1'],
            'subaspects.*.name'        => ['required', 'string'],
           
        ]);

        foreach ($validated['subaspects'] as $sub) {
            $aspect->subAspects()->create([
                'name'        => $sub['name'],
                
            ]);
        }

        return redirect()
            ->route('subaspects.index', [$evaluation, $part, $aspect])
            ->with('success', 'เพิ่มด้านย่อยเรียบร้อยแล้ว');
    }

    public function destroy(Evaluation $evaluation, Part $part, Aspect $aspect, $subaspectId)
    {
        $aspect->subAspects()->where('id', $subaspectId)->delete();

        return redirect()
            ->route('subaspects.index', [$evaluation, $part, $aspect])
            ->with('success', 'ลบด้านย่อยเรียบร้อยแล้ว');
    }
    public function edit(Evaluation $evaluation, Part $part, Aspect $aspect, $subaspectId)
    {
        $subaspect = $aspect->subAspects()->findOrFail($subaspectId);

        return Inertia::render('AdminSubAspectEdit', [
            'evaluation' => $evaluation,
            'part'       => $part,
            'aspect'     => $aspect,
            'subaspect'  => $subaspect,
        ]);
    }

    public function update(Request $request, Evaluation $evaluation, Part $part, Aspect $aspect, $subaspectId)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string'],

        ]);

        $subaspect = $aspect->subAspects()->findOrFail($subaspectId);

        $subaspect->update($validated);

        return redirect()
            ->route('subaspects.index', [$evaluation, $part, $aspect])
            ->with('success', 'อัปเดตด้านย่อยเรียบร้อยแล้ว');
    }

}
