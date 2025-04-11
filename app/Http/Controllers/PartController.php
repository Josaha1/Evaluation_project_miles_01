<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\Part;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartController extends Controller
{
    public function index(Evaluation $evaluation)
    {
        return Inertia::render('AdminPartIndex', [
            'evaluation' => $evaluation->load('parts'),
        ]);
    }

    public function create(Evaluation $evaluation)
    {
        return Inertia::render('AdminPartCreate', [
            'evaluation' => $evaluation,
        ]);
    }

    public function store(Request $request, Evaluation $evaluation)
    {
        $validated = $request->validate([
            'title'       => ['required', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        // ✅ คำนวณลำดับล่าสุด
        $lastOrder          = $evaluation->parts()->max('order') ?? 0;
        $validated['order'] = $lastOrder + 1;

        $evaluation->parts()->create($validated);

        return redirect()
            ->route('parts.index', $evaluation)
            ->with('success', 'เพิ่มส่วนของแบบประเมินเรียบร้อยแล้ว');
    }

    public function edit(Evaluation $evaluation, Part $part)
    {
        return Inertia::render('AdminPartEdit', [
            'evaluation' => $evaluation,
            'part'       => $part,
        ]);
    }

    public function update(Request $request, Evaluation $evaluation, Part $part)
    {
        $validated = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order'       => ['required', 'integer', 'min:1'],
        ]);

        $part->update($validated);

        return redirect()
            ->route('parts.index', $evaluation->id)
            ->with('success', 'อัปเดตส่วนของแบบประเมินเรียบร้อยแล้ว ✅');
    }

    public function destroy(Evaluation $evaluation, Part $part)
    {
        // ตรวจสอบว่า Part นั้นอยู่ใน Evaluation เดียวกัน
        if ($part->evaluation_id !== $evaluation->id) {
            abort(403, 'คุณไม่มีสิทธิ์ลบข้อมูลส่วนนี้');
        }

        // ทำการลบ Part
        $part->delete();

        return redirect()
            ->route('parts.index', $evaluation->id)
            ->with('success', 'ลบส่วนของแบบประเมินเรียบร้อยแล้ว ✅');
    }
}
