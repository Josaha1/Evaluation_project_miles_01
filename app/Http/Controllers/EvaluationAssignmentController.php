<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class EvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user       = auth()->user();
        $userId     = $user->id;
        $fiscalYear = $request->input('fiscal_year', now()->year);
        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $user->grade)
            ->where('grade_max', '>=', $user->grade)
            ->latest()
            ->first();
        $lastAnswer = Answer::where('evaluation_id', $evaluation->id)
            ->where('user_id', $user->id)
            ->where('evaluatee_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $stepToResume = 1;

        if ($lastAnswer && $evaluation) {
            $parts = $evaluation->parts->sortBy('order')->values();
            foreach ($parts as $index => $part) {
                $questionIds = collect([
                     ...$part->questions->pluck('id'),
                    ...$part->aspects->flatMap(fn($a) => $a->questions->pluck('id')),
                    ...$part->aspects->flatMap(fn($a) => $a->subaspects?->flatMap(fn($s) => $s->questions->pluck('id')) ?? collect()),
                ])->filter()->unique();

                if ($questionIds->contains($lastAnswer->question_id)) {
                    $stepToResume = $index + 1;
                    break;
                }
            }
        }
        $fiscalYears = EvaluationAssignment::select('fiscal_year')
            ->distinct()->orderBy('fiscal_year', 'desc')->pluck('fiscal_year');

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

        $progress = 0;

        if ($evaluation) {
            $questions = $evaluation->parts->flatMap(function ($part) {
                return $part->aspects->flatMap(function ($aspect) {
                    return $aspect->subaspects->flatMap(fn($sub) => $sub->questions)
                        ->merge($aspect->questions ?? []);
                })->merge($part->questions ?? []);
            });

            $totalQuestions = $questions->pluck('id')->unique()->count();

            $startOfFiscal = Carbon::create($fiscalYear - 1, 10, 1);
            $endOfFiscal   = Carbon::create($fiscalYear, 9, 30, 23, 59, 59);

            $answeredCount = Answer::where('evaluation_id', $evaluation->id)
                ->where('user_id', $user->id)
                ->where('evaluatee_id', $user->id)
                ->whereBetween('created_at', [$startOfFiscal, $endOfFiscal])
                ->count();

            $progress = $totalQuestions > 0
            ? round(($answeredCount / $totalQuestions) * 100, 2)
            : 0;
        }

        $selfEvaluation = collect([[
            'id'              => 0,
            'evaluatee_name'  => trim("{$user->prename} {$user->fname} {$user->lname}"),
            'evaluatee_photo' => $user->photo_url ?? '/images/default.jpg',
            'position'        => $user->position ?? '-',
            'grade'           => $user->grade ?? '-',
            'status'          => $progress === 100 ? 'completed' : ($progress > 0 ? 'in_progress' : 'not_started'),
            'progress'        => $progress,
            'step_to_resume'  => $stepToResume,
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

        $fiscalYears = EvaluationAssignment::select('fiscal_year')->distinct()->pluck('fiscal_year')->sortDesc()->values();

        if ($fiscalYears->isEmpty()) {
            $fiscalYears = collect(range(now()->year + 1, now()->year - 4))->values();
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
