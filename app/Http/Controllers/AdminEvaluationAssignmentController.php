<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminEvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->get('year', Carbon::now()->month >= 10 ? Carbon::now()->addYear()->year : Carbon::now()->year);

        $assignments = EvaluationAssignment::with(['evaluator', 'evaluatee'])
            ->where('fiscal_year', $year)
            ->paginate(10);

        return Inertia::render('AdminEvaluationAssignmentManager', [
            'assignments'   => $assignments,
            'selected_year' => $year,
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminEvaluationAssignmentForm', [
            'users' => User::orderBy('fname')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'evaluator_id' => 'required|exists:users,id',
            'evaluatee_id' => 'required|exists:users,id|different:evaluator_id',
        ]);

        $evaluatee = User::findOrFail($validated['evaluatee_id']);

        // สร้าง key สำหรับค้นหา evaluation เช่น internal_11
        $evaluationUserType = $evaluatee->user_type->value . '_' . $evaluatee->grade;

        // ค้นหา evaluation
        $evaluation = Evaluation::where('user_type', $evaluatee->user_type->value)
            ->where('grade_min', '<=', $evaluatee->grade)
            ->where('grade_max', '>=', $evaluatee->grade)
            ->first();

        if (! $evaluation) {
            return redirect()->back()->withErrors([
                'evaluatee_id' => '❌ ไม่พบแบบประเมินที่ตรงกับประเภทบุคคลและระดับของผู้ถูกประเมิน',
            ]);
        }

        // คำนวณปีงบ
        $fiscalYear = now()->month >= 10 ? now()->addYear()->year : now()->year;

        // ป้องกันการเพิ่มซ้ำ
        $exists = EvaluationAssignment::where('evaluator_id', $validated['evaluator_id'])
            ->where('evaluatee_id', $validated['evaluatee_id'])
            ->where('fiscal_year', $fiscalYear)
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors([
                'evaluatee_id' => 'ผู้ประเมินนี้ได้ประเมินบุคคลนี้แล้วในปีงบประมาณนี้',
            ]);
        }

        EvaluationAssignment::create([
            'evaluator_id'  => $validated['evaluator_id'],
            'evaluatee_id'  => $validated['evaluatee_id'],
            'evaluation_id' => $evaluation->id,
            'fiscal_year'   => $fiscalYear,
        ]);

        return redirect()->route('assignments.index')->with('success', '✅ เพิ่มความสัมพันธ์ผู้ประเมินสำเร็จ');
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->back()->with('success', 'ลบความสัมพันธ์เรียบร้อยแล้ว');
    }
}
