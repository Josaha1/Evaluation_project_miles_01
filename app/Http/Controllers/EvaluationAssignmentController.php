<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
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

        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $user->grade)
            ->where('grade_max', '>=', $user->grade)
            ->latest()
            ->first();

        $parts = collect();
        if ($evaluation) {
            $evaluation->load([
                'parts.questions',
                'parts.aspects.questions',
                'parts.aspects.subaspects.questions',
            ]);
            $parts = $evaluation->parts->sortBy('order')->values();
        }

        $fiscalYears = EvaluationAssignment::select('fiscal_year')->distinct()->orderBy('fiscal_year', 'desc')->pluck('fiscal_year');

        // Assigned Evaluations
        $assignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->filter(fn($a) => $a->evaluatee !== null)
            ->map(function ($a) use ($userId) {
                $stepToResume = 1;
                $progress     = 0;

                $evaluation = Evaluation::with([
                    'parts.questions',
                    'parts.aspects.questions',
                    'parts.aspects.subaspects.questions',
                ])->find($a->evaluation_id);

                if ($evaluation) {
                    $parts = $evaluation->parts->sortBy('order')->values();

                    $questionIds = $parts->flatMap(function ($part) {
                        return collect()
                            ->merge($part->questions->pluck('id'))
                            ->merge($part->aspects->flatMap(fn($a) =>
                                collect()
                                    ->merge($a->questions->pluck('id'))
                                    ->merge(optional($a->subaspects)->flatMap(fn($s) => $s->questions->pluck('id')) ?? collect())
                            ));
                    })->unique()->filter();

                    $answeredCount = Answer::where('evaluation_id', $evaluation->id)
                        ->where('user_id', $userId)
                        ->where('evaluatee_id', $a->evaluatee_id)
                        ->whereIn('question_id', $questionIds)
                        ->count();

                    $totalQuestions = $questionIds->count();
                    $progress       = $totalQuestions > 0 ? round(($answeredCount / $totalQuestions) * 100, 2) : 0;

                    foreach ($parts as $index => $part) {
                        $partQuestionIds = collect()
                            ->merge($part->questions->pluck('id'))
                            ->merge($part->aspects->flatMap(fn($aspect) =>
                                collect()
                                    ->merge($aspect->questions->pluck('id'))
                                    ->merge(optional($aspect->subaspects)->flatMap(fn($s) => $s->questions->pluck('id')) ?? collect())
                            ));

                        $answeredInPart = Answer::where('evaluation_id', $evaluation->id)
                            ->where('user_id', $userId)
                            ->where('evaluatee_id', $a->evaluatee_id)
                            ->whereIn('question_id', $partQuestionIds)
                            ->pluck('question_id');

                        if ($partQuestionIds->diff($answeredInPart)->isNotEmpty()) {
                            $stepToResume = $index + 1;
                            break;
                        }
                    }
                }

                return [
                    'id'              => $a->id,
                    'evaluatee_id'    => $a->evaluatee_id,
                    'evaluatee_name'  => trim("{$a->evaluatee->prename} {$a->evaluatee->fname} {$a->evaluatee->lname}"),
                    'evaluatee_photo' => $a->evaluatee->photo_url ?? '/images/default.jpg',
                    'position'        => $a->evaluatee->position ?? '-',
                    'grade'           => $a->evaluatee->grade ?? '-',
                    'progress'        => $progress,
                    'step_to_resume'  => $stepToResume,
                ];
            });

        // Self Evaluation
        $selfProgress = 0;
        $selfStep     = 1;

        if ($evaluation) {
            $questionIds = $parts->flatMap(function ($part) {
                return collect()
                    ->merge($part->questions->pluck('id'))
                    ->merge($part->aspects->flatMap(fn($a) =>
                        collect()
                            ->merge($a->questions->pluck('id'))
                            ->merge(optional($a->subaspects)->flatMap(fn($s) => $s->questions->pluck('id')) ?? collect())
                    ));
            })->unique()->filter();

            $answeredCount = Answer::where('evaluation_id', $evaluation->id)
                ->where('user_id', $userId)
                ->where('evaluatee_id', $userId)
                ->whereIn('question_id', $questionIds)
                ->count();

            $totalQuestions = $questionIds->count();
            $selfProgress   = $totalQuestions > 0 ? round(($answeredCount / $totalQuestions) * 100, 2) : 0;

            foreach ($parts as $i => $part) {
                $partQ = collect()
                    ->merge($part->questions->pluck('id'))
                    ->merge($part->aspects->flatMap(fn($a) =>
                        collect()
                            ->merge($a->questions->pluck('id'))
                            ->merge(optional($a->subaspects)->flatMap(fn($s) => $s->questions->pluck('id')) ?? collect())
                    ));

                $ans = Answer::where('evaluation_id', $evaluation->id)
                    ->where('user_id', $userId)
                    ->where('evaluatee_id', $userId)
                    ->whereIn('question_id', $partQ)
                    ->pluck('question_id');

                if ($partQ->diff($ans)->isNotEmpty()) {
                    $selfStep = $i + 1;
                    break;
                }
            }
        }

        $selfEvaluation = collect([[
            'id'              => 0,
            'evaluatee_name'  => trim("{$user->prename} {$user->fname} {$user->lname}"),
            'evaluatee_photo' => $user->photo_url ?? '/images/default.jpg',
            'position'        => $user->position ?? '-',
            'grade'           => $user->grade ?? '-',
            'progress'        => $selfProgress,
            'step_to_resume'  => $selfStep,
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
        ]);

        return redirect()->back()->with('success', 'เพิ่มความสัมพันธ์เรียบร้อย');
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->back()->with('success', 'ลบการมอบหมายเรียบร้อย');
    }
}
