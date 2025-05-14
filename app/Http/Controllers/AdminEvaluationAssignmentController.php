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
        $year = $request->get('fiscal_year', Carbon::now()->month >= 10 ? Carbon::now()->addYear()->year : Carbon::now()->year);

        $assignments = EvaluationAssignment::with(['evaluator', 'evaluatee'])
            ->where('fiscal_year', $year)
            ->paginate(5);

        $fiscalYears = EvaluationAssignment::select('fiscal_year')
            ->distinct()
            ->orderBy('fiscal_year', 'desc')
            ->pluck('fiscal_year');

        return Inertia::render('AdminEvaluationAssignmentManager', [
            'assignments'   => $assignments,
            'fiscal_years'  => $fiscalYears,
            'selected_year' => $year,
        ]);
    }

    public function create()
    {
        return Inertia::render('AdminEvaluationAssignmentForm', [
            'users' => User::with([
                'position',   // -> title
                'department', // -> name
                'division',   // -> name
            ])->orderBy('fname')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'evaluator_id' => 'required|exists:users,id',
            'evaluatee_id' => 'required|exists:users,id|different:evaluator_id',
            'angle'        => 'required|in:top,bottom,left,right',
        ]);
        $evaluatee = User::findOrFail($validated['evaluatee_id']);

        $grade    = $evaluatee->grade;
        $userType = $evaluatee->user_type instanceof \BackedEnum
        ? $evaluatee->user_type->value
        : $evaluatee->user_type;

        $evaluation = Evaluation::where('user_type', $userType)
            ->where('grade_min', '<=', $grade)
            ->where('grade_max', '>=', $grade)
            ->where('status', 'published')
            ->latest()
            ->first();

        // ค้นหา evaluation
        $evaluation = Evaluation::where('user_type', $userType)
            ->where('grade_min', '<=', $grade)
            ->where('grade_max', '>=', $grade)
            ->where('status', 'published')
            ->latest()
            ->first();

        if (! $evaluation) {
            \Log::error('❌ ไม่พบ evaluation ที่ตรงกับ user_type และ grade', [
                'user_type' => $userType,
                'grade'     => $grade,
            ]);
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
            'angle'         => $validated['angle'],
        ]);

        return redirect()->route('assignments.index')->with('success', '✅ เพิ่มความสัมพันธ์ผู้ประเมินสำเร็จ');
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->back()->with('success', 'ลบความสัมพันธ์เรียบร้อยแล้ว');
    }
}
