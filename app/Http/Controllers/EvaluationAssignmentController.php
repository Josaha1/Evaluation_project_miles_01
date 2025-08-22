<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $userId     = $user->id;
        $fiscalYear = $request->input('fiscal_year', now()->month >= 10 ? now()->addYear()->year : now()->year);

        // Use grade-based evaluation selection for self-evaluation
        $evaluation = $this->getSelfEvaluationByGrade($user->grade);

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

        // Fix assignments with wrong evaluation_id for C9-12
        $this->fixEvaluationIds($userId, $fiscalYear);

        // Assigned Evaluations with evaluation_id information
        $assignments = EvaluationAssignment::with([
            'evaluatee.position.department.division', // ✅ preload
            'evaluation' // ✅ load evaluation details
        ])
            ->where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->filter(fn($a) => $a->evaluatee !== null)
            ->map(function ($a) use ($userId) {
                $stepToResume = 1;
                $progress     = 0;

                // Find evaluation by evaluatee's user type and grade if evaluation_id is missing
                $evaluation = null;
                if ($a->evaluation_id) {
                    $evaluation = Evaluation::with([
                        'parts.questions',
                        'parts.aspects.questions',
                        'parts.aspects.subaspects.questions',
                    ])->find($a->evaluation_id);
                }
                
                // Fallback: find appropriate evaluation by evaluatee's grade and user_type
                if (!$evaluation && $a->evaluatee) {
                    $userType = $a->evaluatee->user_type instanceof \BackedEnum 
                        ? $a->evaluatee->user_type->value 
                        : $a->evaluatee->user_type;
                    
                    $grade = $a->evaluatee->grade;
                    
                    // Priority search: Find evaluation specifically for this grade range
                    $evaluation = Evaluation::with([
                        'parts.questions',
                        'parts.aspects.questions',
                        'parts.aspects.subaspects.questions',
                    ])
                    ->where('user_type', $userType)
                    ->where('grade_min', '<=', $grade)
                    ->where('grade_max', '>=', $grade)
                    ->where('status', 'published')
                    // For C9-12, prefer evaluations that have title containing "9-12" or "ผู้บริหาร"
                    ->when($grade >= 9 && $grade <= 12, function($query) {
                        return $query->where(function($q) {
                            $q->where('title', 'LIKE', '%9-12%')
                              ->orWhere('title', 'LIKE', '%ผู้บริหาร%')
                              ->orWhere('title', 'LIKE', '%บริหาร%')
                              ->orWhere('id', 1); // Force include evaluation_id = 1 for C9-12
                        });
                    })
                    ->orderByRaw('
                        CASE 
                            WHEN id = 1 THEN 1
                            WHEN title LIKE "%9-12%" THEN 2
                            WHEN title LIKE "%ผู้บริหาร%" THEN 3  
                            WHEN title LIKE "%บริหาร%" THEN 4
                            ELSE 5 
                        END
                    ')
                    ->latest()
                    ->first();
                }

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

                $result = [
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
                    'evaluation_id'   => $evaluation ? $evaluation->id : ($a->evaluation_id ?? null),
                    'evaluation_title'=> $evaluation ? $evaluation->title : ($a->evaluation ? $a->evaluation->title : 'ไม่ระบุ'),
                ];


                // Debug log for C9-12 to verify correct evaluation_id
                if ($a->evaluatee && $a->evaluatee->grade >= 9 && $a->evaluatee->grade <= 12) {
                    \Log::info('C9-12 Final Assignment Data', [
                        'evaluatee_name' => $result['evaluatee_name'],
                        'grade' => $result['grade'],
                        'progress' => $progress,
                        'evaluation_id' => $result['evaluation_id'],
                        'evaluation_title' => $result['evaluation_title'],
                    ]);
                }

                return $result;
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

            'grade'           => $user->grade ?? '-',
            'progress'        => $selfProgress,
            'step_to_resume'  => $selfStep,
        ]]);

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
     * Uses specific evaluation forms for self-evaluation with 'ประเมินตนเอง' in title
     */
    private function getSelfEvaluationByGrade($userGrade)
    {
        $evaluationQuery = Evaluation::where('status', 'published')
            ->where('user_type', 'internal');
        
        if ($userGrade >= 9 && $userGrade <= 12) {
            // Executive level (grades 9-12) - use specific self-evaluation form
            $evaluation = $evaluationQuery->where('grade_min', '<=', 12)
                ->where('grade_max', '>=', 9)
                ->where('title', 'LIKE', '%ประเมินตนเอง%')
                ->first();
        } elseif ($userGrade >= 5 && $userGrade <= 8) {
            // Staff level (grades 5-8) - use specific self-evaluation form
            $evaluation = $evaluationQuery->where('grade_min', '<=', 8)
                ->where('grade_max', '>=', 5)
                ->where('title', 'LIKE', '%ประเมินตนเอง%')
                ->first();
        } else {
            // Fallback to original logic for other grades
            $evaluation = $evaluationQuery->where('grade_min', '<=', $userGrade)
                ->where('grade_max', '>=', $userGrade)
                ->where('title', 'LIKE', '%ประเมินตนเอง%')
                ->first();
        }

        return $evaluation;
    }

    public function create()
    {
        $users = User::orderBy('fname')->get(['id', 'fname', 'lname', 'position_id']);

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
    public function storeMulti(Request $request)
    {
        $data = $request->validate([
            'evaluator_id'    => 'required|exists:users,id',
            'angle'           => 'required|in:top,bottom,left,right',
            'evaluatee_ids'   => 'required|array|min:1',
            'evaluatee_ids.*' => 'exists:users,id|different:evaluator_id',
        ]);

        $fiscalYear = now()->month >= 10 ? now()->addYear()->year : now()->year;
        $created    = 0;
        $notMatched = [];

        foreach ($data['evaluatee_ids'] as $evaluateeId) {
            $evaluatee = User::findOrFail($evaluateeId);

            $userType = $evaluatee->user_type instanceof \BackedEnum
            ? $evaluatee->user_type->value
            : $evaluatee->user_type;

            $grade = $evaluatee->grade;

            $evaluation = Evaluation::where('user_type', $userType)
                ->where('grade_min', '<=', $grade)
                ->where('grade_max', '>=', $grade)
                ->where('status', 'published')
                ->latest()
                ->first();

            if (! $evaluation) {
                $notMatched[] = "{$evaluatee->fname} {$evaluatee->lname}";
               
            }

            $alreadyExists = EvaluationAssignment::where('evaluator_id', $data['evaluator_id'])
                ->where('evaluatee_id', $evaluateeId)
                ->where('fiscal_year', $fiscalYear)
                ->where('angle', $data['angle'])
                ->exists();

            if (! $alreadyExists) {
                EvaluationAssignment::create([
                    'evaluation_id' => $evaluation->id,
                    'evaluator_id'  => $data['evaluator_id'],
                    'evaluatee_id'  => $evaluateeId,
                    'fiscal_year'   => $fiscalYear,
                    'angle'         => $data['angle'],
                ]);
                $created++;
            }
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
            
            $evaluation = Evaluation::where('user_type', $userType)
                ->where('grade_min', '<=', $grade)
                ->where('grade_max', '>=', $grade)
                ->where('status', 'published')
                // For C9-12, prefer evaluations that have title containing "9-12" or "ผู้บริหาร"
                ->when($grade >= 9 && $grade <= 12, function($query) {
                    return $query->where(function($q) {
                        $q->where('title', 'LIKE', '%9-12%')
                          ->orWhere('title', 'LIKE', '%ผู้บริหาร%')
                          ->orWhere('title', 'LIKE', '%บริหาร%')
                          ->orWhere('id', 1); // Force include evaluation_id = 1 for C9-12
                    });
                })
                ->orderByRaw('
                    CASE 
                        WHEN id = 1 THEN 1
                        WHEN title LIKE "%9-12%" THEN 2
                        WHEN title LIKE "%ผู้บริหาร%" THEN 3  
                        WHEN title LIKE "%บริหาร%" THEN 4
                        ELSE 5 
                    END
                ')
                ->latest()
                ->first();

            if ($evaluation && $assignment->evaluation_id !== $evaluation->id) {
                $assignment->update(['evaluation_id' => $evaluation->id]);
                \Log::info('Fixed evaluation_id for assignment', [
                    'assignment_id' => $assignment->id,
                    'evaluatee_name' => $assignment->evaluatee->fname . ' ' . $assignment->evaluatee->lname,
                    'evaluatee_grade' => $grade,
                    'old_evaluation_id' => $assignment->evaluation_id,
                    'new_evaluation_id' => $evaluation->id,
                    'evaluation_title' => $evaluation->title
                ]);
            }
        }
    }

    /**
     * Get satisfaction evaluation status for dashboard
     */
    private function getSatisfactionEvaluationStatus($userId, $fiscalYear)
    {
        \Log::info('=== Checking satisfaction evaluation status ===', [
            'user_id' => $userId,
            'fiscal_year' => $fiscalYear
        ]);

        // Check if user has completed all assigned evaluations
        $allEvaluationsCompleted = $this->hasUserCompletedAllEvaluations($userId, $fiscalYear);
        
        \Log::info('All evaluations completed check:', [
            'result' => $allEvaluationsCompleted
        ]);
        
        if (!$allEvaluationsCompleted) {
            \Log::info('Not all evaluations completed - hiding satisfaction card');
            return null; // Don't show satisfaction card if main evaluations aren't complete
        }

        // Get evaluation ID for satisfaction evaluation (use the most recent published evaluation)
        $evaluation = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->latest()
            ->first();

        \Log::info('Found evaluation for satisfaction:', [
            'evaluation' => $evaluation ? ['id' => $evaluation->id, 'title' => $evaluation->title] : null
        ]);

        if (!$evaluation) {
            \Log::info('No published evaluation found - hiding satisfaction card');
            return null;
        }

        // Check if user has already completed satisfaction evaluation
        $hasCompletedSatisfaction = \App\Models\SatisfactionEvaluation::hasUserCompletedSatisfaction(
            $userId, 
            $evaluation->id, 
            $fiscalYear
        );

        \Log::info('Satisfaction evaluation completion check:', [
            'completed' => $hasCompletedSatisfaction
        ]);

        $result = [
            'show_card' => true,
            'completed' => $hasCompletedSatisfaction,
            'evaluation_id' => $evaluation->id,
            'evaluation_title' => $evaluation->title,
            'fiscal_year' => $fiscalYear,
        ];

        \Log::info('Satisfaction evaluation status result:', $result);

        return $result;
    }

    /**
     * Check if user has completed all assigned evaluations
     */
    private function hasUserCompletedAllEvaluations($userId, $fiscalYear)
    {
        // Check assigned evaluations completion - ประเมินครบทุกคนที่ได้รับมอบหมาย
        // First check the specified fiscal year
        $assignments = EvaluationAssignment::where('evaluator_id', $userId)
            ->where('fiscal_year', $fiscalYear)
            ->get();

        // If no assignments in specified year, check current/recent fiscal years
        if ($assignments->isEmpty()) {
            $currentYear = now()->month >= 10 ? now()->addYear()->year : now()->year;
            $assignments = EvaluationAssignment::where('evaluator_id', $userId)
                ->whereIn('fiscal_year', [$currentYear, $currentYear - 1, $currentYear + 1])
                ->get();
        }

        \Log::info('Found assignments for user:', [
            'user_id' => $userId,
            'search_fiscal_year' => $fiscalYear,
            'assignment_count' => $assignments->count(),
            'assignments' => $assignments->map(function($a) {
                return [
                    'id' => $a->id,
                    'evaluatee_id' => $a->evaluatee_id,
                    'evaluation_id' => $a->evaluation_id,
                    'angle' => $a->angle,
                    'fiscal_year' => $a->fiscal_year
                ];
            })->toArray()
        ]);

        if ($assignments->isEmpty()) {
            \Log::info('No assignments found in any year - cannot show satisfaction evaluation');
            return false; // No assignments means can't show satisfaction evaluation
        }

        $completedCount = 0;
        foreach ($assignments as $assignment) {
            $hasAnsweredForThisAssignment = Answer::where('user_id', $userId)
                ->where('evaluatee_id', $assignment->evaluatee_id)
                ->where('evaluation_id', $assignment->evaluation_id)
                ->exists();

            \Log::info('Checking assignment completion:', [
                'assignment_id' => $assignment->id,
                'evaluatee_id' => $assignment->evaluatee_id,
                'evaluation_id' => $assignment->evaluation_id,
                'fiscal_year' => $assignment->fiscal_year,
                'has_answered' => $hasAnsweredForThisAssignment
            ]);

            if ($hasAnsweredForThisAssignment) {
                $completedCount++;
            }
        }

        $allCompleted = $completedCount === $assignments->count();
        
        \Log::info('Assignment completion summary:', [
            'total_assignments' => $assignments->count(),
            'completed_assignments' => $completedCount,
            'all_completed' => $allCompleted
        ]);

        return $allCompleted;
    }

}
