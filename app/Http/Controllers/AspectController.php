<?php
namespace App\Http\Controllers;

use App\Models\Aspect;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AspectController extends Controller
{
    public function index()
    {
        $aspects = Aspect::with('sections.userTypes')->paginate(5);
    
        // แปลง userTypes เพื่อให้แสดงได้ใน View
        $sections = Section::with('userTypes')->get()->map(function ($section) {
            $section->user_types = $section->userTypes->map(function ($ut) {
                return [
                    'user_type'  => $ut->user_type,
                    'grade_min'  => $ut->grade_min,
                    'grade_max'  => $ut->grade_max,
                ];
            });
            unset($section->userTypes);
            return $section;
        });
    
        return Inertia::render('AdminAspectManager', [
            'aspects'  => $aspects,
            'sections' => $sections,
        ]);
    }
    

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string|max:500',
            'section_ids'   => 'required|array|min:1',
            'section_ids.*' => 'exists:sections,id',
        ]);

        $duplicate = Aspect::where('name', $validated['name'])
            ->whereHas('sections', function ($q) use ($validated) {
                $q->whereIn('sections.id', $validated['section_ids']);
            })->exists();

        if ($duplicate) {
            return redirect()->back()->withErrors([
                'name' => 'มีด้านนี้อยู่แล้วในหมวดที่เลือก',
            ]);
        }

        $aspect = Aspect::create([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $aspect->sections()->sync($validated['section_ids']);

        return redirect()->back()->with('success', 'เพิ่มด้านเรียบร้อยแล้ว!');
    }

    public function update(Request $request, Aspect $aspect)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string|max:500',
            'section_ids'   => 'required|array|min:1',
            'section_ids.*' => 'exists:sections,id',
        ]);

        $duplicate = Aspect::where('id', '!=', $aspect->id)
            ->where('name', $validated['name'])
            ->whereHas('sections', function ($q) use ($validated) {
                $q->whereIn('sections.id', $validated['section_ids']);
            })->exists();

        if ($duplicate) {
            return redirect()->back()->withErrors([
                'name' => 'มีด้านนี้อยู่แล้วในหมวดที่เลือก',
            ]);
        }

        $aspect->update([
            'name'        => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $aspect->sections()->sync($validated['section_ids']);

        return redirect()->back()->with('success', 'อัปเดตด้านเรียบร้อยแล้ว!');
    }

    public function destroy(Aspect $aspect)
    {
        $aspect->sections()->detach();
        $aspect->delete();

        return redirect()->back()->with('success', 'ลบด้านเรียบร้อยแล้ว!');
    }
}
