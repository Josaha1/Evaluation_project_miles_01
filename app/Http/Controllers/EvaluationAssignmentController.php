<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Services\EvaluationLookupService;

class EvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $userId     = $user->id;
        $defaultFiscalYear = EvaluationLookupService::currentFiscalYear();
        $fiscalYear = $request->input('fiscal_year', $defaultFiscalYear);

        // If no assignments in requested year, fall back to latest year with data for this user
        $hasData = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->where(function ($q) use ($userId) {
                $q->where('evaluator_id', $userId)->orWhere('evaluatee_id', $userId);
            })->exists();

        if (!$hasData && !$request->has('fiscal_year')) {
            $latestYear = EvaluationAssignment::where(function ($q) use ($userId) {
                $q->where('evaluator_id', $userId)->orWhere('evaluatee_id', $userId);
            })->max('fiscal_year');
            if ($latestYear) {
                $fiscalYear = $latestYear;
            }
        }

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getSelfEvaluationByGrade($user->grade, $fiscalYear);

        $parts = collect();
        if ($evaluation) {
            $evaluation->load([
                'parts.questions',
                'parts.aspects.questions',
                'parts.aspects.subaspects.questions',
            ]);
            $parts = $evaluation->parts->sortBy('order')->values();
        }

        $currentFiscalYear = EvaluationLookupService::currentFiscalYear();
        $fiscalYears = EvaluationAssignment::select('fiscal_year')->distinct()->pluck('fiscal_year')
            ->push($currentFiscalYear)->unique()->sortDesc()->values();

        // Pre-load all published evaluations with nested structure (only ~6 records)
        $allEvaluations = Evaluation::with([
            'parts.questions',
            'parts.aspects.questions',
            'parts.aspects.subaspects.questions',
        ])->where('status', 'published')->get()->keyBy('id');

        // Pre-compute question IDs per evaluation (cached in memory)
        // Exclude open_text — optional, doesn't count toward progress/completion
        $isRequired = fn($q) => $q->type !== 'open_text';
        $evalQuestionIds = [];
        $evalPartQuestionIds = [];
        foreach ($allEvaluations as $evalId => $eval) {
            $evalParts = $eval->parts->sortBy('order')->values();
            $allQIds = $evalParts->flatMap(function ($part) use ($isRequired) {
                return collect()
                    ->merge($part->questions->filter($isRequired)->pluck('id'))
                    ->merge($part->aspects->flatMap(fn($a) =>
                        collect()
                            ->merge($a->questions->filter($isRequired)->pluck('id'))
                            ->merge(optional($a->subaspects)->flatMap(fn($s) => $s->questions->filter($isRequired)->pluck('id')) ?? collect())
                    ));
            })->unique()->filter();
            $evalQuestionIds[$evalId] = $allQIds;

            $partQIds = [];
            foreach ($evalParts as $index => $part) {
                $partQIds[$index] = collect()
                    ->merge($part->questions->filter($isRequired)->pluck('id'))
                    ->merge($part->aspects->flatMap(fn($aspect) =>
                        collect()
                            ->merge($aspect->questions->filter($isRequired)->pluck('id'))
                            ->merge(optional($aspect->subaspects)->flatMap(fn($s) => $s->questions->filter($isRequired)->pluck('id')) ?? collect())
                    ));
            }
            $evalPartQuestionIds[$evalId] = $partQIds;
        }

        // Load assignments with eager-loaded relations
        // Exclude self-eval rows (evaluator==evaluatee) — they're rendered in the dedicated
        // "ประเมินตนเอง" card via $selfEvaluation, not in governor/executive/staff target groups.
        $rawAssignments = EvaluationAssignment::with([
            'evaluatee.position', 'evaluatee.department', 'evaluatee.division',
            'evaluation',
        ])
            ->where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->whereColumn('evaluator_id', '!=', 'evaluatee_id')
            ->whereHas('evaluatee')
            ->get();

        // Batch load all answers for this user in one query (filtered by fiscal year)
        $evaluateeIds = $rawAssignments->pluck('evaluatee_id')->unique();
        $answeredQuestions = Answer::where('user_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->whereIn('evaluatee_id', $evaluateeIds)
            ->select('evaluation_id', 'evaluatee_id', 'question_id')
            ->get()
            ->groupBy(fn($a) => $a->evaluation_id . '_' . $a->evaluatee_id)
            ->map(fn($group) => $group->pluck('question_id')->unique());

        $assignments = $rawAssignments->map(function ($a) use ($userId, $allEvaluations, $evalQuestionIds, $evalPartQuestionIds, $answeredQuestions) {
                $stepToResume = 1;
                $progress     = 0;

                // Resolve evaluation from pre-loaded cache
                $evaluation = $a->evaluation_id ? ($allEvaluations[$a->evaluation_id] ?? null) : null;

                // Fallback: find by grade
                if (!$evaluation && $a->evaluatee) {
                    $grade = $a->evaluatee->grade;
                    $evaluation = $allEvaluations->first(function ($eval) use ($grade) {
                        return $eval->user_type === 'internal'
                            && $eval->grade_min <= $grade
                            && $eval->grade_max >= $grade
                            && !str_contains($eval->title, 'ตนเอง');
                    });
                }

                if ($evaluation) {
                    $questionIds = $evalQuestionIds[$evaluation->id] ?? collect();
                    $cacheKey = $evaluation->id . '_' . $a->evaluatee_id;
                    $answered = $answeredQuestions[$cacheKey] ?? collect();
                    $answeredInEval = $answered->intersect($questionIds);

                    $totalQuestions = $questionIds->count();
                    $progress = $totalQuestions > 0 ? min(100, round(($answeredInEval->count() / $totalQuestions) * 100, 2)) : 0;

                    // Find step to resume from cached part question IDs
                    $partQIds = $evalPartQuestionIds[$evaluation->id] ?? [];
                    foreach ($partQIds as $index => $partQuestionIds) {
                        if ($partQuestionIds->diff($answered)->isNotEmpty()) {
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
                    'position'        => $a->evaluatee->position ? $a->evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                    'department'      => $a->evaluatee->department ? $a->evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                    'division'        => $a->evaluatee->division ? $a->evaluatee->division->name : 'ไม่ระบุสายงาน',
                    'grade'           => $a->evaluatee->grade ?? '-',
                    'progress'        => $progress,
                    'step_to_resume'  => $stepToResume,
                    'angle'           => $a->angle ?? 'unknown',
                    'is_submitted'    => !is_null($a->submitted_at),
                    'evaluation_id'   => $evaluation ? $evaluation->id : ($a->evaluation_id ?? null),
                    'evaluation_title'=> $evaluation ? $evaluation->title : ($a->evaluation ? $a->evaluation->title : 'ไม่ระบุ'),
                    'evaluation_grade_min' => $evaluation ? (int) $evaluation->grade_min : null,
                    'evaluation_grade_max' => $evaluation ? (int) $evaluation->grade_max : null,
                ];
            });

        // Group assignments by evaluation and angle for better dashboard display
        $groupedByEvaluation = $assignments->groupBy(['evaluation_id', 'angle'])->map(function ($evaluationGroup, $evaluationId) {
            $evaluationTitle = $evaluationGroup->first()->first()['evaluation_title'] ?? 'ไม่ระบุ';
            
            return $evaluationGroup->map(function ($angleGroup, $angle) use ($evaluationTitle, $evaluationId) {
                return [
                    'evaluation_id' => $evaluationId,
                    'evaluation_title' => $evaluationTitle,
                    'angle' => $angle,
                    'count' => $angleGroup->count(),
                    'evaluatees' => $angleGroup->values(),
                    'avg_progress' => round($angleGroup->avg('progress'), 1),
                    'completed_count' => $angleGroup->filter(fn($item) => $item['progress'] >= 100)->count(),
                ];
            });
        })->flatten(1);

        // Legacy grouping by angle only (for backward compatibility)
        $groupedAssignments = $assignments->groupBy('angle')->map(function ($group, $angle) {
            return [
                'angle' => $angle,
                'count' => $group->count(),
                'evaluatees' => $group->values(),
                'avg_progress' => round($group->avg('progress'), 1),
                'completed_count' => $group->filter(fn($item) => $item['progress'] >= 100)->count(),
            ];
        });

        // Self Evaluation — single query for all self-evaluation answers
        $selfProgress = 0;
        $selfStep     = 1;

        if ($evaluation) {
            $questionIds = $parts->flatMap(function ($part) use ($isRequired) {
                return collect()
                    ->merge($part->questions->filter($isRequired)->pluck('id'))
                    ->merge($part->aspects->flatMap(fn($a) =>
                        collect()
                            ->merge($a->questions->filter($isRequired)->pluck('id'))
                            ->merge(optional($a->subaspects)->flatMap(fn($s) => $s->questions->filter($isRequired)->pluck('id')) ?? collect())
                    ));
            })->unique()->filter();

            // Single query: load all self-evaluation answered question IDs (filtered by fiscal year)
            // Use unique() to deduplicate — answers may have multiple rows per question (multi-choice etc.)
            $selfAnsweredIds = Answer::where('evaluation_id', $evaluation->id)
                ->where('user_id', $userId)
                ->where('evaluatee_id', $userId)
                ->where('fiscal_year', $fiscalYear)
                ->whereIn('question_id', $questionIds)
                ->pluck('question_id')
                ->unique();

            $totalQuestions = $questionIds->count();
            $selfProgress   = $totalQuestions > 0 ? min(100, round(($selfAnsweredIds->count() / $totalQuestions) * 100, 2)) : 0;

            // Find step to resume using in-memory check (no extra queries)
            foreach ($parts as $i => $part) {
                $partQ = collect()
                    ->merge($part->questions->filter($isRequired)->pluck('id'))
                    ->merge($part->aspects->flatMap(fn($a) =>
                        collect()
                            ->merge($a->questions->filter($isRequired)->pluck('id'))
                            ->merge(optional($a->subaspects)->flatMap(fn($s) => $s->questions->filter($isRequired)->pluck('id')) ?? collect())
                    ));

                if ($partQ->diff($selfAnsweredIds)->isNotEmpty()) {
                    $selfStep = $i + 1;
                    break;
                }
            }
        }

        // Only show self-evaluation card if user has angle='self' assignment in this fiscal year
        $selfAssignment = EvaluationAssignment::where('evaluator_id', $userId)
            ->where('evaluatee_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->where('angle', 'self')
            ->first();

        $selfEvaluation = $selfAssignment
            ? collect([[
                'id'              => 0,
                'evaluatee_name'  => trim("{$user->prename} {$user->fname} {$user->lname}"),
                'evaluatee_photo' => $user->photo_url ?? '/images/default.jpg',
                'grade'           => $user->grade ?? '-',
                'progress'        => $selfProgress,
                'step_to_resume'  => $selfStep,
                'is_submitted'    => !is_null($selfAssignment->submitted_at),
            ]])
            : collect();

        // Group evaluations by evaluation_id for the new dashboard display
        $evaluationGroups = $assignments->groupBy('evaluation_id')->map(function ($group, $evaluationId) {
            $firstItem = $group->first();
            $evaluationTitle = $firstItem['evaluation_title'];
            
            // Group by angle within each evaluation
            $angleGroups = $group->groupBy('angle')->map(function ($angleGroup, $angle) {
                return [
                    'angle' => $angle,
                    'count' => $angleGroup->count(),
                    'evaluatees' => $angleGroup->values(),
                    'avg_progress' => round($angleGroup->avg('progress'), 1),
                    'completed_count' => $angleGroup->filter(fn($item) => $item['progress'] >= 100)->count(),
                ];
            });
            
            return [
                'evaluation_id' => $evaluationId,
                'evaluation_title' => $evaluationTitle,
                'total_evaluatees' => $group->count(),
                'total_progress' => round($group->avg('progress'), 1),
                'total_completed' => $group->filter(fn($item) => $item['progress'] >= 100)->count(),
                'angle_groups' => $angleGroups,
                'evaluatees' => $group->values(),
            ];
        });

        // Check if user should see satisfaction evaluation card
        $satisfactionEvaluation = $this->getSatisfactionEvaluationStatus($userId, $fiscalYear);

        return Inertia::render('Dashboard', [
            'evaluations'   => [
                'self'   => $selfEvaluation,
                'target' => $assignments->values(),
            ],
            'evaluation_groups' => $evaluationGroups,
            'grouped_by_evaluation' => $groupedByEvaluation,
            'grouped_assignments' => $groupedAssignments,
            'angle_summary' => [
                'top' => $groupedAssignments->get('top', ['count' => 0, 'avg_progress' => 0, 'completed_count' => 0]),
                'bottom' => $groupedAssignments->get('bottom', ['count' => 0, 'avg_progress' => 0, 'completed_count' => 0]),
                'left' => $groupedAssignments->get('left', ['count' => 0, 'avg_progress' => 0, 'completed_count' => 0]),
                'right' => $groupedAssignments->get('right', ['count' => 0, 'avg_progress' => 0, 'completed_count' => 0]),
            ],
            'satisfaction_evaluation' => $satisfactionEvaluation,
            'fiscal_years'  => $fiscalYears,
            'selected_year' => $fiscalYear,
        ]);
    }

    /**
     * Get self-evaluation form based on user grade
     */
    private function getSelfEvaluationByGrade($userGrade, ?int $fiscalYear = null)
    {
        return EvaluationLookupService::findSelfEvalByGrade((int) $userGrade, $fiscalYear);
    }

    public function create()
    {
        $users = User::orderBy('fname')->get(['id', 'fname', 'lname', 'position_id']);

        $currentFiscalYear = EvaluationLookupService::currentFiscalYear();
        $fiscalYears = EvaluationAssignment::select('fiscal_year')->distinct()->pluck('fiscal_year')
            ->push($currentFiscalYear)->unique()->sortDesc()->values();

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
    public function storeMulti(Request $request)
    {
        $data = $request->validate([
            'evaluator_id'    => 'required|exists:users,id',
            'angle'           => 'required|in:top,bottom,left,right',
            'evaluatee_ids'   => 'required|array|min:1',
            'evaluatee_ids.*' => 'exists:users,id|different:evaluator_id',
        ]);

        $fiscalYear = EvaluationLookupService::currentFiscalYear();
        $created    = 0;
        $notMatched = [];

        // Batch load: all evaluatees and published evaluations in 2 queries
        $evaluatees = User::whereIn('id', $data['evaluatee_ids'])->get()->keyBy('id');
        $publishedEvaluations = Evaluation::where('status', 'published')->get();

        // Batch check existing assignments in 1 query
        $existingPairs = EvaluationAssignment::where('evaluator_id', $data['evaluator_id'])
            ->whereIn('evaluatee_id', $data['evaluatee_ids'])
            ->where('fiscal_year', $fiscalYear)
            ->where('angle', $data['angle'])
            ->pluck('evaluatee_id')
            ->flip();

        foreach ($data['evaluatee_ids'] as $evaluateeId) {
            if ($existingPairs->has($evaluateeId)) {
                continue;
            }

            $evaluatee = $evaluatees[$evaluateeId] ?? null;
            if (!$evaluatee) continue;

            $userType = $evaluatee->user_type instanceof \BackedEnum
                ? $evaluatee->user_type->value
                : $evaluatee->user_type;

            $evaluation = $publishedEvaluations->first(function ($eval) use ($userType, $evaluatee) {
                return $eval->user_type === $userType
                    && $eval->grade_min <= $evaluatee->grade
                    && $eval->grade_max >= $evaluatee->grade;
            });

            if (!$evaluation) {
                $notMatched[] = "{$evaluatee->fname} {$evaluatee->lname}";
                continue;
            }

            EvaluationAssignment::create([
                'evaluation_id' => $evaluation->id,
                'evaluator_id'  => $data['evaluator_id'],
                'evaluatee_id'  => $evaluateeId,
                'fiscal_year'   => $fiscalYear,
                'angle'         => $data['angle'],
            ]);
            $created++;
        }

        if ($created > 0) {
            $message = "✅ เพิ่มความสัมพันธ์ $created รายการเรียบร้อยแล้ว 🎉";
            if (count($notMatched) > 0) {
                $message .= " แต่ไม่มีแบบประเมินสำหรับ: " . implode(', ', $notMatched);
            }
            return redirect()->back()->with('success', $message);
        } else {
            $message = '🚫 ไม่มีการเพิ่มข้อมูลใหม่';
            if (count($notMatched) > 0) {
                $message .= ' และไม่มีแบบประเมินสำหรับ: ' . implode(', ', $notMatched);
            }
            return redirect()->back()->with('error', $message);
        }
    }

    /**
     * Fix assignments with wrong evaluation_id by finding appropriate evaluation
     */
    private function fixEvaluationIds($evaluatorId, $fiscalYear)
    {
        // Fix ALL assignments (both missing and wrong evaluation_id)
        $assignments = EvaluationAssignment::with('evaluatee')
            ->where('evaluator_id', $evaluatorId)
            ->where('fiscal_year', $fiscalYear)
            ->get();

        foreach ($assignments as $assignment) {
            if (!$assignment->evaluatee) {
                continue;
            }

            $userType = $assignment->evaluatee->user_type instanceof \BackedEnum 
                ? $assignment->evaluatee->user_type->value 
                : $assignment->evaluatee->user_type;
            
            $grade = $assignment->evaluatee->grade;
            
            $evaluation = EvaluationLookupService::findByGrade((int) $grade, $userType, (int) $assignment->fiscal_year);

            if ($evaluation && $assignment->evaluation_id !== $evaluation->id) {
                $assignment->update(['evaluation_id' => $evaluation->id]);
            }
        }
    }

    /**
     * Get satisfaction evaluation status for dashboard
     */
    private function getSatisfactionEvaluationStatus($userId, $fiscalYear)
    {
        // Check if user has completed all assigned evaluations
        $allEvaluationsCompleted = $this->hasUserCompletedAllEvaluations($userId, $fiscalYear);

        if (!$allEvaluationsCompleted) {
            return null; // Don't show satisfaction card if main evaluations aren't complete
        }

        // Get evaluation ID for satisfaction evaluation (use the most recent published evaluation)
        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->latest()
            ->first();

        if (!$evaluation) {
            return null;
        }

        // Check if user has already completed satisfaction evaluation
        $hasCompletedSatisfaction = \App\Models\SatisfactionEvaluation::hasUserCompletedSatisfaction(
            $userId, 
            $evaluation->id, 
            $fiscalYear
        );

        $result = [
            'show_card' => true,
            'completed' => $hasCompletedSatisfaction,
            'evaluation_id' => $evaluation->id,
            'evaluation_title' => $evaluation->title,
            'fiscal_year' => $fiscalYear,
        ];

        return $result;
    }

    /**
     * Check if user has completed all assigned evaluations
     */
    private function hasUserCompletedAllEvaluations($userId, $fiscalYear)
    {
        // Single query: count assignments vs completed assignments using EXISTS subquery
        $assignments = EvaluationAssignment::where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->select('id', 'evaluatee_id', 'evaluation_id')
            ->get();

        if ($assignments->isEmpty()) {
            $currentYear = EvaluationLookupService::currentFiscalYear();
            $assignments = EvaluationAssignment::where('evaluator_id', $userId)
                ->whereIn('fiscal_year', [$currentYear, $currentYear - 1, $currentYear + 1])
                ->select('id', 'evaluatee_id', 'evaluation_id')
                ->get();
        }

        if ($assignments->isEmpty()) {
            return false;
        }

        // Single batch query: get all answered (evaluatee_id, evaluation_id) pairs for this fiscal year
        $answeredPairs = Answer::where('user_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->whereIn('evaluatee_id', $assignments->pluck('evaluatee_id')->unique())
            ->select('evaluatee_id', 'evaluation_id')
            ->distinct()
            ->get()
            ->map(fn($a) => $a->evaluation_id . '_' . $a->evaluatee_id)
            ->flip();

        $completedCount = $assignments->filter(function ($a) use ($answeredPairs) {
            return $answeredPairs->has($a->evaluation_id . '_' . $a->evaluatee_id);
        })->count();

        return $completedCount === $assignments->count();
    }

}
