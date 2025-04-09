<?php
namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SectionController extends Controller
{
    public function index()
{
    $sections = Section::with('userTypes')->paginate(5);

    // ส่งข้อมูล userTypes ไปแบบ full object
    $sections->getCollection()->transform(function ($section) {
        $section->user_types = $section->userTypes->map(function ($u) {
            return [
                'user_type' => $u->user_type,
                'grade_min' => $u->grade_min,
                'grade_max' => $u->grade_max,
            ];
        })->toArray();

        unset($section->userTypes);
        return $section;
    });

    return Inertia::render('AdminSectionManager', [
        'sections' => $sections,
    ]);
}


    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'                   => 'required|string|max:255',
                'user_types'             => 'required|array|min:1',
                'user_types.*.user_type' => 'required|in:internal,external',
                'user_types.*.grade_min' => 'required|integer|min:1|max:12',
                'user_types.*.grade_max' => 'required|integer|min:1|max:12|gte:user_types.*.grade_min',
            ]);

            DB::transaction(function () use ($validated) {
                $section = Section::create(['name' => $validated['name']]);

                foreach ($validated['user_types'] as $type) {
                    $section->userTypes()->create([
                        'user_type' => $type['user_type'],
                        'grade_min' => $type['grade_min'],
                        'grade_max' => $type['grade_max'],
                    ]);
                }
            });

            return back()->with('success', 'เพิ่มหมวดเรียบร้อยแล้ว!');
        } catch (\Exception $e) {
            \Log::error('Section Store Error: ' . $e->getMessage());
            return back()->withErrors(['error' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()]);
        }

    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name'                   => 'required|string|max:255',
            'user_types'             => 'required|array|min:1',
            'user_types.*.user_type' => 'required|in:internal,external',
            'user_types.*.grade_min' => 'required|integer|min:1|max:12',
            'user_types.*.grade_max' => 'required|integer|min:1|max:12|gte:user_types.*.grade_min',
        ]);

        DB::transaction(function () use ($validated, $section) {
            $section->update(['name' => $validated['name']]);

            $section->userTypes()->delete();

            foreach ($validated['user_types'] as $type) {
                $section->userTypes()->create([
                    'user_type' => $type['user_type'],
                    'grade_min' => $type['grade_min'],
                    'grade_max' => $type['grade_max'],
                ]);
            }
        });

        return back()->with('success', 'อัปเดตหมวดเรียบร้อยแล้ว!');
    }

    public function destroy(Section $section)
    {
        $section->delete();

        return back()->with('success', 'ลบหมวดเรียบร้อยแล้ว!');
    }

}
