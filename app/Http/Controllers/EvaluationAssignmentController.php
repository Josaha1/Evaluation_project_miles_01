<?php
namespace App\Http\Controllers;

use App\Models\EvaluationAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EvaluationAssignmentController extends Controller
{
    public function index()
    {
        return Inertia::render('EvaluationAssignments/Index', [
            'assignments' => EvaluationAssignment::with(['evaluation', 'evaluator', 'evaluatee'])->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'evaluation_id' => 'required|exists:evaluations,id',
            'evaluator_id'  => 'required|exists:users,id',
            'evaluatee_id'  => 'required|exists:users,id',
        ]);

        EvaluationAssignment::create($data);

        return redirect()->back()->with('success', 'เพิ่มการมอบหมายเรียบร้อย');
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->back()->with('success', 'ลบการมอบหมายเรียบร้อย');
    }
}
