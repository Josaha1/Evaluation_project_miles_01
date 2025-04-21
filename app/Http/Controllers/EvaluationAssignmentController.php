<?php
namespace App\Http\Controllers;

use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user       = auth()->user();
        $userId     = $user->id;
        $fiscalYear = $request->input('fiscal_year', now()->year);

        // ดึงปีงบประมาณทั้งหมด
        $fiscalYears = EvaluationAssignment::select('fiscal_year')->distinct()->orderBy('fiscal_year', 'desc')->pluck('fiscal_year');

        // ดึงรายการ target
        $assignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->filter(fn($a) => $a->evaluatee !== null)
            ->map(function ($a) {
                return [
                    'id'              => $a->id,
                    'evaluatee_name'  => trim("{$a->evaluatee->prename} {$a->evaluatee->fname} {$a->evaluatee->lname}"),
                    'evaluatee_photo' => $a->evaluatee->photo_url ?? '/images/default.jpg',
                    'position'        => $a->evaluatee->position ?? '-',
                    'grade'           => $a->evaluatee->grade ?? '-',
                    'status'          => $a->status ?? 'not_started',
                    'progress'        => $a->progress ?? 0,
                ];
            });

        // สร้างข้อมูลประเมินตนเอง (self)
        $selfEvaluation = collect([[
            'id'              => 0,
            'evaluatee_name'  => trim("{$user->prename} {$user->fname} {$user->lname}"),
            'evaluatee_photo' => $user->photo_url ?? '/images/default.jpg',
            'position'        => $user->position ?? '-',
            'grade'           => $user->grade ?? '-',
            'status'          => 'not_started',
            'progress'        => 0,
        ]]);

        return Inertia::render('Dashboard', [
            'evaluations'   => [
                'self'   => $selfEvaluation,
                'target' => $assignments->values(),
            ],
            'fiscal_years'  => $fiscalYears,
            'selected_year' => $fiscalYear,
        ]);
    }

    public function create()
    {
        $users = User::orderBy('fname')->get(['id', 'fname', 'lname', 'position']);

        // ดึงปีงบจากรายการในระบบ หรือสร้างลิสต์ปีย้อนหลัง 5 ปี
        $fiscalYears = EvaluationAssignment::select('fiscal_year')->distinct()->pluck('fiscal_year')->sortDesc()->values();

        if ($fiscalYears->isEmpty()) {
            $fiscalYears = collect(range(now()->year + 1, now()->year - 4))->values(); // ปีปัจจุบัน + ย้อนหลัง
        }

        return Inertia::render('AdminEvaluationAssignmentForm', [
            'users'       => $users,
            'fiscalYears' => $fiscalYears,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'evaluator_id' => 'required|exists:users,id|different:evaluatee_id',
            'evaluatee_id' => 'required|exists:users,id',
            'fiscal_year'  => 'required|digits:4',
        ]);
        $exists = EvaluationAssignment::where('evaluator_id', $data['evaluator_id'])
            ->where('evaluatee_id', $data['evaluatee_id'])
            ->where('fiscal_year', $data['fiscal_year'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'evaluatee_id' => 'ผู้ประเมินนี้ได้ประเมินบุคคลนี้แล้วในปีงบประมาณนี้',
            ])->with('error', 'ไม่สามารถเพิ่มความสัมพันธ์ได้');
        }
        EvaluationAssignment::create([
            'evaluator_id' => $data['evaluator_id'],
            'evaluatee_id' => $data['evaluatee_id'],
            'fiscal_year'  => $data['fiscal_year'],
            'status'       => 'not_started',
            'progress'     => 0,
        ]);

        return redirect()->back()->with('success', 'เพิ่มความสัมพันธ์เรียบร้อย');
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->back()->with('success', 'ลบการมอบหมายเรียบร้อย');
    }
}
