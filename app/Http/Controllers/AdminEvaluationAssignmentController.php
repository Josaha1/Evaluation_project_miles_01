<?php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminEvaluationAssignmentController extends Controller
{
    public function index(Request $request)
    {
        // คำนวณปีงบประมาณปัจจุบัน (ตุลาคม - กันยายน)
        $currentFiscalYear = Carbon::now()->month >= 10
        ? Carbon::now()->addYear()->year
        : Carbon::now()->year;

        $year    = $request->get('fiscal_year', $currentFiscalYear);
        $search  = $request->get('search', '');
        $perPage = (int) $request->get('per_page', 15);
        $viewType = $request->get('view', 'card'); // card or table

        // Optimized base query with minimal required relationships
        $baseQuery = EvaluationAssignment::select([
            'id', 'evaluator_id', 'evaluatee_id', 'evaluation_id', 
            'fiscal_year', 'angle', 'created_at'
        ])
        ->with([
            'evaluator' => function($query) {
                $query->select('id', 'fname', 'lname', 'grade', 'user_type', 'position_id', 'department_id');
            },
            'evaluatee' => function($query) {
                $query->select('id', 'fname', 'lname', 'grade', 'user_type', 'position_id', 'department_id');
            },
            'evaluator.position:id,title',
            'evaluator.department:id,name',
            'evaluatee.position:id,title', 
            'evaluatee.department:id,name'
        ])
        ->where('fiscal_year', $year);

        // Search filter - ค้นหาเฉพาะผู้ประเมิน
        if (! empty($search)) {
            $baseQuery->whereHas('evaluator', function ($query) use ($search) {
                $query->where('fname', 'like', "%{$search}%")
                    ->orWhere('lname', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(fname, ' ', lname) LIKE ?", ["%{$search}%"]);
            });
        }

        $data = [];
        
        if ($viewType === 'card') {
            // For card view, get grouped data efficiently
            $cardData = $this->getOptimizedCardData($baseQuery);
            $data['card_data'] = $cardData;
        } else {
            // For table view, use pagination
            $assignments = (clone $baseQuery)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage)
                ->appends($request->only(['fiscal_year', 'search', 'per_page', 'view']));
            $data['assignments'] = $assignments;
        }

        // Cache fiscal years for better performance
        $fiscalYears = \Cache::remember('fiscal_years', 3600, function() {
            return EvaluationAssignment::select('fiscal_year')
                ->distinct()
                ->orderBy('fiscal_year', 'desc')
                ->pluck('fiscal_year');
        });

        // Simplified analytics - only basic stats
        $analytics = $this->getBasicAnalytics($year, $search);

        return Inertia::render('AdminEvaluationAssignmentManager', array_merge($data, [
            'fiscal_years'  => $fiscalYears,
            'selected_year' => $year,
            'analytics'     => $analytics,
            'view_type'     => $viewType,
            'filters'       => [
                'search'   => $search,
                'per_page' => $perPage,
                'view'     => $viewType,
            ],
        ]));
    }

    /**
     * จัดเตรียมข้อมูลสำหรับ Card View - จัดกลุ่มตามผู้ประเมิน
     */
    private function prepareCardViewData($assignments)
    {
        $grouped = [];

        foreach ($assignments as $assignment) {
            $evaluatorKey = $assignment->evaluator
                ? $assignment->evaluator->id
                : 'unknown_' . $assignment->id;

            if (! isset($grouped[$evaluatorKey])) {
                $grouped[$evaluatorKey] = [
                    'evaluator'       => $assignment->evaluator,
                    'assignments'     => [
                        'top'    => [],
                        'bottom' => [],
                        'left'   => [],
                        'right'  => [],
                    ],
                    'stats'           => [
                        'total_evaluatees' => 0,
                        'unique_angles'    => 0,
                        'assignments_count' => 0,
                    ],
                ];
            }

            $angle = $assignment->angle ?? 'unknown';
            if (isset($grouped[$evaluatorKey]['assignments'][$angle])) {
                $grouped[$evaluatorKey]['assignments'][$angle][] = [
                    'id'          => $assignment->id,
                    'evaluatee'   => $assignment->evaluatee,
                    'angle'       => $angle,
                    'created_at'  => $assignment->created_at,
                    'fiscal_year' => $assignment->fiscal_year,
                ];
            }
        }

        // คำนวณสถิติสำหรับแต่ละกลุ่ม
        foreach ($grouped as $key => &$group) {
            $totalEvaluatees = 0;
            $uniqueAngles = 0;
            $assignmentsCount = 0;
            $completedAngles = 0;

            foreach ($group['assignments'] as $angle => $angleAssignments) {
                $evaluateeCount = count($angleAssignments);
                if ($evaluateeCount > 0) {
                    $uniqueAngles++;
                    $completedAngles++;
                }
                $totalEvaluatees += $evaluateeCount;
                $assignmentsCount += $evaluateeCount;
            }

            // กำหนด required_angles และเงื่อนไขความครบถ้วนสำหรับผู้ประเมิน
            // ผู้ประเมินจะ "ครบถ้วน" เมื่อมีการมอบหมายให้ประเมินแล้ว (ไม่ว่าจะกี่องศา)
            $requiredAngles = ['top', 'bottom', 'left', 'right'];
            $requiredAnglesCount = count($requiredAngles);
            
            // คำนวณสถานะความสมบูรณ์ - ตรวจสอบว่า evaluator นี้มี answers แล้วหรือไม่
            $evaluatorId = $group['evaluator'] ? $group['evaluator']->id : null;
            $evaluatorHasAnswers = false;
            
            if ($evaluatorId) {
                $evaluatorHasAnswers = DB::table('answers as a')
                    ->join('evaluation_assignments as ea', function($join) {
                        $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                             ->on('a.user_id', '=', 'ea.evaluator_id') 
                             ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                    })
                    ->where('ea.evaluator_id', $evaluatorId)
                    ->where('ea.fiscal_year', $year)
                    ->exists();
            }
            
            $isComplete = $evaluatorHasAnswers; // มี answers = ครบถ้วน
            $completionRate = $evaluatorHasAnswers ? 100 : 0; // 100% หรือ 0%

            $group['required_angles'] = $requiredAngles;
            $group['stats'] = [
                'total_evaluatees'      => $totalEvaluatees,
                'unique_angles'         => $uniqueAngles,
                'assignments_count'     => $assignmentsCount,
                'completed_angles'      => $completedAngles,
                'required_angles_count' => $requiredAnglesCount,
                'is_complete'          => $isComplete,
                'completion_rate'      => $completionRate,
            ];
        }

        // เรียงลำดับตามชื่อผู้ประเมิน
        uasort($grouped, function ($a, $b) {
            $nameA = $a['evaluator'] ? $a['evaluator']->fname . ' ' . $a['evaluator']->lname : '';
            $nameB = $b['evaluator'] ? $b['evaluator']->fname . ' ' . $b['evaluator']->lname : '';
            return strcmp($nameA, $nameB);
        });

        return [
            'groups'  => array_values($grouped),
            'summary' => [
                'total_evaluators'    => count($grouped),
                'total_relationships' => array_sum(array_column(array_column($grouped, 'stats'), 'assignments_count')),
                'avg_evaluatees_per_evaluator' => count($grouped) > 0 
                    ? round(array_sum(array_column(array_column($grouped, 'stats'), 'total_evaluatees')) / count($grouped), 2) 
                    : 0,
            ],
        ];
    }

    public function create(Request $request)
    {
        try {
            // ดึงข้อมูล users ตามโครงสร้างฐานข้อมูลจริง
            $users = User::select([
                'id', 'emid', 'prename', 'fname', 'lname', 'grade', 'user_type',
                'position_id', 'division_id', 'department_id', 'faction_id', 'sex',
            ])
                ->with(['position', 'division', 'department', 'faction'])
                ->orderBy('fname')
                ->get()
                ->map(function ($user) {
                    // แปลง user_type เป็น string ถ้าเป็น Enum
                    $userType = $user->user_type instanceof \BackedEnum
                    ? $user->user_type->value
                    : $user->user_type;

                    $positionTitle = $user->position ?
                    trim($user->position->title) :
                    'ไม่ระบุตำแหน่ง';

                    $departmentName = $user->department ?
                    trim($user->department->name) :
                    'ไม่ระบุหน่วยงาน';

                    $divisionName = $user->division ?
                    trim($user->division->name) :
                    'ไม่ระบุสายงาน';

                    $factionName = $user->faction ?
                    trim($user->faction->name) :
                    'ไม่ระบุฝ่าย';

                    return [
                        'id'              => $user->id,
                        'emid'            => $user->emid,
                        'prename'         => $user->prename,
                        'fname'           => $user->fname,
                        'lname'           => $user->lname,
                        'grade'           => (int) $user->grade,
                        'user_type'       => $userType,
                        'sex'             => $user->sex,
                        // ส่งในโครงสร้างที่ frontend ต้องการ
                        'position'        => [
                            'id' => $user->position_id,
                            'title' => $positionTitle,
                        ],
                        'division'        => [
                            'name' => $divisionName,
                        ],
                        'department'      => [
                            'name' => $departmentName,
                        ],
                        'faction'         => [
                            'name' => $factionName,
                        ],
                        'division_id'     => $user->division_id,
                        'department_id'   => $user->department_id,
                        'position_id'     => $user->position_id,
                        'faction_id'      => $user->faction_id,
                        'position_title'  => $positionTitle,
                        'department_name' => $departmentName,
                        'division_name'   => $divisionName,
                        'faction_name'    => $factionName,
                    ];
                });

            // Get selected evaluatee data if provided
            $selectedEvaluatee = $request->input('selectedEvaluatee');

            return Inertia::render('AdminEvaluationAssignmentForm', [
                'users' => $users,
                'selectedEvaluatee' => $selectedEvaluatee,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in create method', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('assignments.index')
                ->withErrors(['error' => 'เกิดข้อผิดพลาดในการโหลดข้อมูล']);
        }
    }

    public function store(Request $request)
    {
        // Validation rules
        $validated = $request->validate([
            'evaluator_id' => 'required|exists:users,id',
            'evaluatee_id' => 'required|exists:users,id|different:evaluator_id',
            'angle'        => ['required', Rule::in(['top', 'bottom', 'left', 'right'])],
        ], [
            'evaluator_id.required'  => 'กรุณาเลือกผู้ประเมิน',
            'evaluator_id.exists'    => 'ผู้ประเมินที่เลือกไม่มีในระบบ',
            'evaluatee_id.required'  => 'กรุณาเลือกผู้ถูกประเมิน',
            'evaluatee_id.exists'    => 'ผู้ถูกประเมินที่เลือกไม่มีในระบบ',
            'evaluatee_id.different' => 'ผู้ประเมินและผู้ถูกประเมินต้องเป็นคนละคน',
            'angle.required'         => 'กรุณาเลือกองศาการประเมิน',
            'angle.in'               => 'องศาการประเมินไม่ถูกต้อง',
        ]);

        try {
            DB::beginTransaction();

            // ดึงข้อมูลผู้ถูกประเมิน
            $evaluatee = User::findOrFail($validated['evaluatee_id']);
            $evaluator = User::findOrFail($validated['evaluator_id']);

            // ตรวจสอบเกรดและประเภทผู้ใช้
            $grade    = (int) $evaluatee->grade;
            $userType = $evaluatee->user_type instanceof \BackedEnum
            ? $evaluatee->user_type->value
            : $evaluatee->user_type;

            // ตรวจสอบว่าองศาที่เลือกเหมาะสมกับเกรดหรือไม่
            if ($grade < 9 && in_array($validated['angle'], ['bottom', 'right'])) {
                return redirect()->back()->withErrors([
                    'angle' => 'ผู้ถูกประเมินเกรด C5-C8 สามารถประเมินได้เฉพาะองศาบนและซ้ายเท่านั้น',
                ])->withInput();
            }

            // ค้นหา evaluation ที่เหมาะสม
            $evaluation = Evaluation::where('user_type', $userType)
                ->where('grade_min', '<=', $grade)
                ->where('grade_max', '>=', $grade)
                ->where('status', 'published')
                ->latest()
                ->first();

            if (! $evaluation) {
                Log::error('ไม่พบ evaluation ที่ตรงกับเงื่อนไข', [
                    'user_type'    => $userType,
                    'grade'        => $grade,
                    'evaluatee_id' => $validated['evaluatee_id'],
                ]);

                return redirect()->back()->withErrors([
                    'evaluatee_id' => 'ไม่พบแบบประเมินที่ตรงกับประเภทและระดับของผู้ถูกประเมิน',
                ])->withInput();
            }

            // คำนวณปีงบประมาณ
            $fiscalYear = Carbon::now()->month >= 10
            ? Carbon::now()->addYear()->year
            : Carbon::now()->year;

            // ตรวจสอบการซ้ำ
            $exists = EvaluationAssignment::where('evaluator_id', $validated['evaluator_id'])
                ->where('evaluatee_id', $validated['evaluatee_id'])
                ->where('angle', $validated['angle'])
                ->where('fiscal_year', $fiscalYear)
                ->exists();

            if ($exists) {
                return redirect()->back()->withErrors([
                    'evaluator_id' => 'ผู้ประเมินนี้ได้ถูกกำหนดให้ประเมินบุคคลนี้ในองศานี้แล้วในปีงบประมาณนี้',
                ])->withInput();
            }

            // สร้างความสัมพันธ์ใหม่
            EvaluationAssignment::create([
                'evaluator_id'  => $validated['evaluator_id'],
                'evaluatee_id'  => $validated['evaluatee_id'],
                'evaluation_id' => $evaluation->id,
                'fiscal_year'   => $fiscalYear,
                'angle'         => $validated['angle'],
            ]);

            DB::commit();

            Log::info('สร้างความสัมพันธ์การประเมินสำเร็จ', [
                'evaluator'   => $evaluator->fname . ' ' . $evaluator->lname,
                'evaluatee'   => $evaluatee->fname . ' ' . $evaluatee->lname,
                'angle'       => $validated['angle'],
                'fiscal_year' => $fiscalYear,
            ]);

            return redirect()->route('assignments.create')
                ->with('success', '✅ เพิ่มความสัมพันธ์ผู้ประเมินสำเร็จ');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('เกิดข้อผิดพลาดในการสร้างความสัมพันธ์การประเมิน', [
                'error'        => $e->getMessage(),
                'request_data' => $validated,
                'trace'        => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->withErrors(['error' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง'])
                ->withInput();
        }
    }

    /**
     * ✨ Bulk Assignment - เพิ่มผู้ประเมินหลายคนพร้อมกัน (ปรับปรุงแล้ว)
     */
    public function bulkStore(Request $request)
    {
        Log::info('🚀 Bulk store request received', [
            'data' => $request->all(),
            'user' => auth()->user()->id ?? 'unknown',
        ]);

        // Enhanced Validation - Updated for new workflow (evaluator -> evaluatees)
        $validated = $request->validate([
            'evaluator_id'               => 'required|exists:users,id',
            'assignments'                => 'required|array|min:1|max:50',
            'assignments.*.evaluatee_id' => 'required|exists:users,id|different:evaluator_id',
            'assignments.*.angle'        => ['required', Rule::in(['top', 'bottom', 'left', 'right'])],
        ], [
            'evaluator_id.required'                => 'กรุณาเลือกผู้ประเมิน',
            'evaluator_id.exists'                  => 'ผู้ประเมินที่เลือกไม่มีในระบบ',
            'assignments.required'                 => 'กรุณาเลือกผู้ถูกประเมินอย่างน้อย 1 คน',
            'assignments.max'                      => 'สามารถเลือกผู้ถูกประเมินได้สูงสุด 50 คน',
            'assignments.*.evaluatee_id.required'  => 'กรุณาเลือกผู้ถูกประเมิน',
            'assignments.*.evaluatee_id.exists'    => 'ผู้ถูกประเมินที่เลือกไม่มีในระบบ',
            'assignments.*.evaluatee_id.different' => 'ผู้ประเมินและผู้ถูกประเมินต้องเป็นคนละคน',
            'assignments.*.angle.required'         => 'กรุณาเลือกองศาการประเมิน',
            'assignments.*.angle.in'               => 'องศาการประเมินไม่ถูกต้อง',
        ]);

        try {
            DB::beginTransaction();

            // ดึงข้อมูลผู้ประเมิน
            $evaluator = User::findOrFail($validated['evaluator_id']);
            
            Log::info('👤 Evaluator info', [
                'id'        => $evaluator->id,
                'name'      => $evaluator->fname . ' ' . $evaluator->lname,
                'grade'     => $evaluator->grade,
                'user_type' => $evaluator->user_type instanceof \BackedEnum ? $evaluator->user_type->value : $evaluator->user_type,
            ]);

            $fiscalYear = Carbon::now()->month >= 10
            ? Carbon::now()->addYear()->year
            : Carbon::now()->year;

            // Statistics tracking
            $createdCount     = 0;
            $duplicateCount   = 0;
            $invalidCount     = 0;
            $errorMessages    = [];
            $successDetails   = [];
            $duplicateDetails = [];

            // เก็บข้อมูลผู้ถูกประเมินเพื่อลดการ query
            $evaluateeIds = collect($validated['assignments'])->pluck('evaluatee_id')->unique();
            $evaluatees   = User::whereIn('id', $evaluateeIds)->get()->keyBy('id');

            Log::info('👥 Evaluatees loaded', [
                'total_requested' => $evaluateeIds->count(),
                'total_found'     => $evaluatees->count(),
            ]);

            // ตรวจสอบการซ้ำล่วงหน้า - Updated for new workflow
            $existingAssignments = EvaluationAssignment::where('evaluator_id', $validated['evaluator_id'])
                ->where('fiscal_year', $fiscalYear)
                ->whereIn('evaluatee_id', $evaluateeIds)
                ->select('evaluatee_id', 'angle')
                ->get()
                ->mapWithKeys(function ($item) {
                    return ["{$item->evaluatee_id}_{$item->angle}" => true];
                });

            Log::info('🔍 Existing assignments check', [
                'existing_count' => $existingAssignments->count(),
            ]);

            Log::info('🚀 Starting assignment processing', [
                'total_assignments_to_process' => count($validated['assignments']),
                'assignment_details' => collect($validated['assignments'])->map(function($a, $idx) use ($evaluatees) {
                    $evaluatee = $evaluatees->get($a['evaluatee_id']);
                    return [
                        'index' => $idx + 1,
                        'evaluatee_id' => $a['evaluatee_id'],
                        'evaluatee_name' => $evaluatee ? ($evaluatee->fname . ' ' . $evaluatee->lname) : 'NOT_FOUND',
                        'angle' => $a['angle'],
                    ];
                })->toArray(),
            ]);

            // Process each assignment - Updated for new workflow
            foreach ($validated['assignments'] as $index => $assignment) {
                $evaluateeId   = $assignment['evaluatee_id'];
                $angle         = $assignment['angle'];
                $assignmentKey = "{$evaluateeId}_{$angle}";

                $evaluatee = $evaluatees->get($evaluateeId);
                if (! $evaluatee) {
                    $invalidCount++;
                    $errorMessages[] = "ไม่พบข้อมูลผู้ถูกประเมิน ID: {$evaluateeId}";
                    Log::warning("❌ Evaluatee not found", [
                        'evaluatee_id' => $evaluateeId,
                        'index' => $index + 1,
                    ]);
                    continue;
                }

                $evaluateeGrade = (int) $evaluatee->grade;

                // ตรวจสอบการซ้ำ
                if (isset($existingAssignments[$assignmentKey])) {
                    $duplicateCount++;
                    $duplicateDetails[] = "{$evaluatee->fname} {$evaluatee->lname} (องศา{$this->translateAngleToThai($angle)})";
                    Log::warning("❌ Duplicate assignment detected", [
                        'index' => $index + 1,
                        'evaluatee' => $evaluatee->fname . ' ' . $evaluatee->lname,
                        'assignment_key' => $assignmentKey,
                    ]);
                    continue;
                }

                // ค้นหา evaluation ที่เหมาะสมสำหรับผู้ถูกประเมิน (ไม่จำกัดเกรด)
                $evaluateeUserType = $evaluatee->user_type instanceof \BackedEnum
                    ? $evaluatee->user_type->value
                    : $evaluatee->user_type;

                // ค้นหาแบบประเมินตาม user_type
                $evaluation = Evaluation::where('user_type', $evaluateeUserType)
                    ->where('status', 'published')
                    ->latest()
                    ->first();

                // หากไม่พบ ให้ใช้แบบประเมิน internal เป็น default
                if (! $evaluation) {
                    $evaluation = Evaluation::where('user_type', 'internal')
                        ->where('status', 'published')
                        ->latest()
                        ->first();
                }

                if (! $evaluation) {
                    $invalidCount++;
                    $errorMessages[] = "ไม่พบแบบประเมินในระบบสำหรับ: {$evaluatee->fname} {$evaluatee->lname}";
                    Log::warning("❌ No evaluation found at all", [
                        'index' => $index + 1,
                        'evaluatee' => $evaluatee->fname . ' ' . $evaluatee->lname,
                        'user_type' => $evaluateeUserType,
                        'grade' => $evaluateeGrade,
                    ]);
                    continue;
                }

                // สร้างความสัมพันธ์ใหม่
                try {
                    $newAssignment = EvaluationAssignment::create([
                        'evaluator_id'  => $validated['evaluator_id'],
                        'evaluatee_id'  => $evaluateeId,
                        'evaluation_id' => $evaluation->id,
                        'fiscal_year'   => $fiscalYear,
                        'angle'         => $angle,
                    ]);

                    $createdCount++;
                    $successDetails[] = "{$evaluatee->fname} {$evaluatee->lname} (องศา{$this->translateAngleToThai($angle)})";

                    // เพิ่ม assignment ใหม่ลงใน existing เพื่อป้องกันการซ้ำในลูปเดียวกัน
                    $existingAssignments[$assignmentKey] = true;

                    Log::info("✅ Created assignment #{$createdCount}", [
                        'index' => $index + 1,
                        'evaluator' => $evaluator->fname . ' ' . $evaluator->lname,
                        'evaluatee' => $evaluatee->fname . ' ' . $evaluatee->lname,
                        'angle' => $angle,
                        'assignment_id' => $newAssignment->id,
                    ]);

                } catch (\Exception $e) {
                    $invalidCount++;
                    $errorMessages[] = "เกิดข้อผิดพลาดในการบันทึก: {$evaluatee->fname} {$evaluatee->lname} - {$e->getMessage()}";
                    Log::error('❌ Error creating assignment', [
                        'evaluator_id' => $validated['evaluator_id'],
                        'evaluatee_id' => $evaluateeId,
                        'angle'        => $angle,
                        'error'        => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            // สร้างข้อความสรุปผลลัพธ์
            $summaryMessage = [];

            if ($createdCount > 0) {
                $summaryMessage[] = "✅ บันทึกสำเร็จ {$createdCount} รายการ";
            }

            if ($duplicateCount > 0) {
                $summaryMessage[] = "⚠️ มีการซ้ำ {$duplicateCount} รายการ";
            }

            if ($invalidCount > 0) {
                $summaryMessage[] = "❌ ไม่สำเร็จ {$invalidCount} รายการ";
            }

            $finalMessage = implode(' | ', $summaryMessage) ?: 'ไม่มีการเปลี่ยนแปลง';

            // สร้าง detailed response
            $responseData = [
                'success' => $createdCount > 0,
                'message' => $finalMessage,
                'details' => [
                    'created_count'     => $createdCount,
                    'duplicate_count'   => $duplicateCount,
                    'invalid_count'     => $invalidCount,
                    'total_processed'   => count($validated['assignments']),
                    'success_details'   => array_slice($successDetails, 0, 10),
                    'duplicate_details' => array_slice($duplicateDetails, 0, 5),
                    'error_details'     => array_slice($errorMessages, 0, 5),
                ],
            ];

            Log::info('📊 Bulk assignment completed', $responseData);

            if ($createdCount > 0) {
                return redirect()->route('assignments.create')
                    ->with('success', $finalMessage)
                    ->with('details', $responseData['details']);
            } else {
                return back()
                    ->withErrors([
                        'bulk_error' => 'ไม่สามารถบันทึกรายการใดได้',
                        'details'    => $errorMessages,
                    ])
                    ->with('details', $responseData['details'])
                    ->withInput();
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('⚠️ Validation error in bulk store', [
                'errors'       => $e->errors(),
                'request_data' => $request->all(),
            ]);

            return back()->withErrors($e->errors())->withInput();

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('💥 Critical error in bulk store', [
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return back()
                ->withErrors(['bulk_error' => 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Show the edit form for a specific evaluatee's assignments
     */
    public function edit($evaluateeId)
    {
        try {
            // Get the evaluatee
            $evaluatee = User::with(['position', 'department', 'division', 'faction'])
                ->findOrFail($evaluateeId);

            // Get all assignments for this evaluatee
            $assignments = EvaluationAssignment::with([
                'evaluator:id,fname,lname,grade,user_type,position_id,division_id,department_id,faction_id',
                'evaluator.position:id,title',
                'evaluator.division:id,name',
                'evaluator.department:id,name',
                'evaluator.faction:id,name',
            ])->where('evaluatee_id', $evaluateeId)->get();

            // Get all users for the form (potential evaluators)
            $users = User::with(['position', 'department', 'division', 'faction'])
                ->where('id', '!=', $evaluateeId)
                ->get()
                ->map(function ($user) {
                    $userType = $user->user_type instanceof \BackedEnum
                        ? $user->user_type->value
                        : $user->user_type;

                    $positionTitle = $user->position 
                        ? trim($user->position->title) 
                        : 'ไม่ระบุตำแหน่ง';

                    $departmentName = $user->department 
                        ? trim($user->department->name) 
                        : 'ไม่ระบุหน่วยงาน';

                    $divisionName = $user->division 
                        ? trim($user->division->name) 
                        : 'ไม่ระบุสายงาน';

                    $factionName = $user->faction 
                        ? trim($user->faction->name) 
                        : 'ไม่ระบุฝ่าย';

                    return [
                        'id'              => $user->id,
                        'emid'            => $user->emid,
                        'prename'         => $user->prename,
                        'fname'           => $user->fname,
                        'lname'           => $user->lname,
                        'grade'           => (int) $user->grade,
                        'user_type'       => $userType,
                        'sex'             => $user->sex,
                        'position'        => [
                            'id' => $user->position_id,
                            'title' => $positionTitle,
                        ],
                        'division'        => [
                            'name' => $divisionName,
                        ],
                        'department'      => [
                            'name' => $departmentName,
                        ],
                        'faction'         => [
                            'name' => $factionName,
                        ],
                        'division_id'     => $user->division_id,
                        'department_id'   => $user->department_id,
                        'position_id'     => $user->position_id,
                        'faction_id'      => $user->faction_id,
                        'position_title'  => $positionTitle,
                        'department_name' => $departmentName,
                        'division_name'   => $divisionName,
                        'faction_name'    => $factionName,
                    ];
                });

            return Inertia::render('AdminEvaluationAssignmentForm', [
                'users' => $users,
                'evaluatee' => [
                    'id'              => $evaluatee->id,
                    'emid'            => $evaluatee->emid,
                    'prename'         => $evaluatee->prename,
                    'fname'           => $evaluatee->fname,
                    'lname'           => $evaluatee->lname,
                    'grade'           => (int) $evaluatee->grade,
                    'user_type'       => $evaluatee->user_type instanceof \BackedEnum
                        ? $evaluatee->user_type->value
                        : $evaluatee->user_type,
                    'position'        => [
                        'title' => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง',
                    ],
                    'department'      => [
                        'name' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน',
                    ],
                    'division'        => [
                        'name' => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน',
                    ],
                    'faction'         => [
                        'name' => $evaluatee->faction ? $evaluatee->faction->name : 'ไม่ระบุฝ่าย',
                    ],
                ],
                'assignments' => $assignments->map(function ($assignment) {
                    return [
                        'id' => $assignment->id,
                        'evaluator_id' => $assignment->evaluator_id,
                        'angle' => $assignment->angle,
                        'evaluator' => [
                            'id' => $assignment->evaluator->id,
                            'fname' => $assignment->evaluator->fname,
                            'lname' => $assignment->evaluator->lname,
                            'grade' => $assignment->evaluator->grade,
                            'position' => [
                                'title' => $assignment->evaluator->position ? $assignment->evaluator->position->title : 'ไม่ระบุตำแหน่ง',
                            ],
                            'department' => [
                                'name' => $assignment->evaluator->department ? $assignment->evaluator->department->name : 'ไม่ระบุหน่วยงาน',
                            ],
                        ],
                    ];
                }),
                'editMode' => true,
            ]);

        } catch (\Exception $e) {
            Log::error('Error in edit method', [
                'evaluatee_id' => $evaluateeId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('assignments.index')
                ->withErrors(['error' => 'เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับแก้ไข']);
        }
    }

    /**
     * Update assignments for a specific evaluatee
     */
    public function update(Request $request, $evaluateeId)
    {
        $validated = $request->validate([
            'assignments' => 'required|array',
            'assignments.*.evaluator_id' => 'required|exists:users,id',
            'assignments.*.angle' => ['required', Rule::in(['top', 'bottom', 'left', 'right'])],
        ], [
            'assignments.required' => 'กรุณาระบุข้อมูลการมอบหมาย',
            'assignments.array' => 'ข้อมูลการมอบหมายไม่ถูกต้อง',
            'assignments.*.evaluator_id.required' => 'กรุณาเลือกผู้ประเมิน',
            'assignments.*.evaluator_id.exists' => 'ผู้ประเมินที่เลือกไม่มีในระบบ',
            'assignments.*.angle.required' => 'กรุณาเลือกองศาการประเมิน',
            'assignments.*.angle.in' => 'องศาการประเมินไม่ถูกต้อง',
        ]);

        try {
            DB::beginTransaction();

            // Get evaluatee
            $evaluatee = User::findOrFail($evaluateeId);

            // Find appropriate evaluation based on evaluatee's grade and user_type
            $grade = (int) $evaluatee->grade;
            $userType = $evaluatee->user_type instanceof \BackedEnum
                ? $evaluatee->user_type->value
                : $evaluatee->user_type;

            $evaluation = Evaluation::where('user_type', $userType)
                ->where('grade_min', '<=', $grade)
                ->where('grade_max', '>=', $grade)
                ->where('status', 'published')
                ->latest()
                ->first();

            if (!$evaluation) {
                DB::rollBack();
                return redirect()->back()->withErrors([
                    'error' => 'ไม่พบแบบประเมินที่ตรงกับประเภทและระดับของผู้ถูกประเมิน (ระดับ ' . $grade . ')',
                ]);
            }

            // Delete existing assignments for this evaluatee
            EvaluationAssignment::where('evaluatee_id', $evaluateeId)->delete();

            // Create new assignments
            $createdAssignments = [];
            foreach ($validated['assignments'] as $assignmentData) {
                // Validate that evaluator is not the same as evaluatee
                if ($assignmentData['evaluator_id'] == $evaluateeId) {
                    DB::rollBack();
                    return redirect()->back()->withErrors(['error' => 'ผู้ประเมินและผู้ถูกประเมินต้องเป็นคนละคน']);
                }

                // Check for duplicate assignments (same evaluator and angle)
                $duplicate = collect($createdAssignments)->first(function ($item) use ($assignmentData) {
                    return $item['evaluator_id'] == $assignmentData['evaluator_id']
                        && $item['angle'] == $assignmentData['angle'];
                });

                if ($duplicate) {
                    DB::rollBack();
                    return redirect()->back()->withErrors(['error' => 'พบการมอบหมายซ้ำ (ผู้ประเมินคนเดียวกันในองศาเดียวกัน)']);
                }

                // Get current fiscal year
                $currentFiscalYear = Carbon::now()->month >= 10
                    ? Carbon::now()->addYear()->year
                    : Carbon::now()->year;

                $assignment = EvaluationAssignment::create([
                    'evaluator_id' => $assignmentData['evaluator_id'],
                    'evaluatee_id' => $evaluateeId,
                    'evaluation_id' => $evaluation->id,
                    'angle' => $assignmentData['angle'],
                    'fiscal_year' => $currentFiscalYear,
                ]);

                $createdAssignments[] = $assignment->toArray();
            }

            DB::commit();

            Log::info('อัพเดทการมอบหมายการประเมินสำเร็จ', [
                'evaluatee_id' => $evaluateeId,
                'evaluatee_name' => $evaluatee->fname . ' ' . $evaluatee->lname,
                'assignments_count' => count($createdAssignments),
            ]);

            return redirect()->route('assignments.index')->with('success', 
                'อัพเดทการมอบหมายการประเมินสำหรับ ' . $evaluatee->fname . ' ' . $evaluatee->lname . ' เรียบร้อยแล้ว');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('เกิดข้อผิดพลาดในการอัพเดทการมอบหมายการประเมิน', [
                'evaluatee_id' => $evaluateeId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'เกิดข้อผิดพลาดในการอัพเดทการมอบหมาย กรุณาลองใหม่อีกครั้ง: ' . $e->getMessage(),
            ]);
        }
    }

    public function destroy(EvaluationAssignment $assignment)
    {
        try {
            $evaluatorName = $assignment->evaluator->fname . ' ' . $assignment->evaluator->lname;
            $evaluateeName = $assignment->evaluatee->fname . ' ' . $assignment->evaluatee->lname;
            $angle         = $assignment->angle;

            $assignment->delete();

            Log::info('ลบความสัมพันธ์การประเมินสำเร็จ', [
                'evaluator' => $evaluatorName,
                'evaluatee' => $evaluateeName,
                'angle'     => $angle,
            ]);

            return redirect()->back()->with('success', '✅ ลบความสัมพันธ์เรียบร้อยแล้ว');

        } catch (\Exception $e) {
            Log::error('เกิดข้อผิดพลาดในการลบความสัมพันธ์การประเมิน', [
                'assignment_id' => $assignment->id,
                'error'         => $e->getMessage(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'ไม่สามารถลบความสัมพันธ์ได้ กรุณาลองใหม่อีกครั้ง',
            ]);
        }
    }

    /**
     * Bulk Delete - ลบความสัมพันธ์หลายรายการพร้อมกัน
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'required|exists:evaluation_assignments,id',
        ]);

        try {
            $deletedCount = EvaluationAssignment::whereIn('id', $validated['ids'])->delete();

            Log::info('ลบความสัมพันธ์การประเมินแบบกลุ่มสำเร็จ', [
                'deleted_count' => $deletedCount,
                'ids'           => $validated['ids'],
            ]);

            return response()->json([
                'success'       => true,
                'message'       => "ลบความสัมพันธ์สำเร็จ {$deletedCount} รายการ",
                'deleted_count' => $deletedCount,
            ]);

        } catch (\Exception $e) {
            Log::error('เกิดข้อผิดพลาดในการลบความสัมพันธ์แบบกลุ่ม', [
                'error' => $e->getMessage(),
                'ids'   => $validated['ids'],
            ]);

            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการลบข้อมูล',
            ], 500);
        }
    }

    /**
     * Helper: Translate angle to Thai
     */
    private function translateAngleToThai($angle)
    {
        $translations = ['top' => 'บน', 'bottom' => 'ล่าง', 'left' => 'ซ้าย', 'right' => 'ขวา'];
        return $translations[$angle] ?? $angle;
    }

    /**
     * คำนวณสรุปการประเมินที่เสร็จสมบูรณ์
     */
    private function calculateCompletionSummary($fiscalYear)
    {
        // ดึง assignment ทั้งหมดของปีงบประมาณนั้น
        $assignments = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->select('id', 'evaluation_id', 'evaluator_id', 'evaluatee_id', 'angle')
            ->get();

        // ดึงคำตอบทั้งหมด
        $answers = DB::table('answers')
            ->whereIn('evaluation_id', $assignments->pluck('evaluation_id')->unique())
            ->whereIn('user_id', $assignments->pluck('evaluator_id')->unique())
            ->whereIn('evaluatee_id', $assignments->pluck('evaluatee_id')->unique())
            ->get();

        // จัดกลุ่ม assignment → unique key per evaluatee per angle
        $groupedAssignments = $assignments->groupBy(function ($a) {
            return "{$a->evaluatee_id}_{$a->angle}";
        });

        $completedAssignments = collect();

        foreach ($groupedAssignments as $key => $group) {
            foreach ($group as $assignment) {
                $hasAnswer = $answers->contains(function ($answer) use ($assignment) {
                    return $answer->user_id == $assignment->evaluator_id &&
                    $answer->evaluatee_id == $assignment->evaluatee_id &&
                    $answer->evaluation_id == $assignment->evaluation_id;
                });

                if ($hasAnswer) {
                    $completedAssignments->push($assignment->id);
                    break;
                }
            }
        }

        $totalAssignments = $groupedAssignments->count();
        $completedCount   = $completedAssignments->count();

        return [
            'completed_count' => $completedCount,
            'total_required'  => $totalAssignments,
            'completion_rate' => $totalAssignments > 0
            ? round(($completedCount / $totalAssignments) * 100, 2)
            : 0,
        ];
    }

    /**
     * คำนวณคะแนนสุขภาพระบบ (System Health Score)
     */
    private function calculateSystemHealthScore($fiscalYear)
    {
        $completion   = $this->calculateCompletionSummary($fiscalYear);
        $answersCount = DB::table('answers')
            ->whereYear('created_at', $fiscalYear)
            ->count();

                                                          // ปัจจัยที่นำมาคิดคะแนน
        $completionRate = $completion['completion_rate']; // 0-100
        $activityScore  = $answersCount > 0 ? 100 : 0;

        // รวมคะแนน (สามารถถ่วงน้ำหนักได้)
        $healthScore = round(($completionRate * 0.7) + ($activityScore * 0.3), 2);

        return min(100, $healthScore); // ไม่เกิน 100
    }

    /**
     * ดึงข้อมูลผู้ประเมินยอดเยี่ยม (Top Evaluators)
     * แก้ไขให้ส่งข้อมูลตรงกับที่ Frontend ต้องการ
     */
    private function getTopEvaluators($fiscalYear)
    {
        // นับเป็น 1 ครั้งต่อ 1 การประเมิน (evaluator-evaluatee-evaluation combination)
        $results = DB::table('evaluation_assignments')
            ->join('users', 'evaluation_assignments.evaluator_id', '=', 'users.id')
            ->leftJoin('positions', 'users.position_id', '=', 'positions.id')
            ->leftJoin('departments', 'users.department_id', '=', 'departments.id')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->leftJoin('factions', 'users.faction_id', '=', 'factions.id')
            ->where('evaluation_assignments.fiscal_year', $fiscalYear)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('answers')
                    ->whereColumn('answers.user_id', 'evaluation_assignments.evaluator_id')
                    ->whereColumn('answers.evaluatee_id', 'evaluation_assignments.evaluatee_id')
                    ->whereColumn('answers.evaluation_id', 'evaluation_assignments.evaluation_id');
            })
            ->select(
                'evaluation_assignments.evaluator_id as user_id',
                'users.fname',
                'users.lname',
                'users.grade',
                'positions.title as position_title',
                'departments.name as department_name',
                'divisions.name as division_name',
                'factions.name as faction_name',
                DB::raw('COUNT(DISTINCT evaluation_assignments.evaluatee_id) as unique_evaluatees'),
                DB::raw('COUNT(DISTINCT CONCAT(evaluation_assignments.evaluatee_id, "-", evaluation_assignments.evaluation_id)) as evaluation_count')
            )
            ->groupBy('evaluation_assignments.evaluator_id', 'users.fname', 'users.lname', 'users.grade',
                'positions.title', 'departments.name', 'divisions.name', 'factions.name')
            ->orderByDesc('evaluation_count')
            ->limit(10)
            ->get();

        return $results->map(function ($r) {
            return [
                'id'                => $r->user_id,
                'fname'             => $r->fname,
                'lname'             => $r->lname,
                'grade'             => $r->grade,
                'evaluation_count'  => $r->evaluation_count,
                'unique_evaluatees' => $r->unique_evaluatees,
                'position'          => ['title' => $r->position_title ?: 'ไม่ระบุตำแหน่ง'],
                'department'        => ['name' => $r->department_name ?: 'ไม่ระบุหน่วยงาน'],
                'division'          => ['name' => $r->division_name ?: 'ไม่ระบุสายงาน'],
                'faction'           => ['name' => $r->faction_name ?: 'ไม่ระบุฝ่าย'],
            ];
        });
    }

    /**
     * ดึงข้อมูลผู้ถูกประเมินมากที่สุด (Most Evaluated)
     * แก้ไขให้ส่งข้อมูลตรงกับที่ Frontend ต้องการ
     */
    private function getMostEvaluated($fiscalYear)
    {
        // นับจำนวนครั้งที่ถูกประเมิน (distinct evaluation sessions)
        $results = DB::table('evaluation_assignments')
            ->join('users', 'evaluation_assignments.evaluatee_id', '=', 'users.id')
            ->leftJoin('positions', 'users.position_id', '=', 'positions.id')
            ->leftJoin('departments', 'users.department_id', '=', 'departments.id')
            ->leftJoin('divisions', 'users.division_id', '=', 'divisions.id')
            ->leftJoin('factions', 'users.faction_id', '=', 'factions.id')
            ->where('evaluation_assignments.fiscal_year', $fiscalYear)
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('answers')
                    ->whereColumn('answers.user_id', 'evaluation_assignments.evaluator_id')
                    ->whereColumn('answers.evaluatee_id', 'evaluation_assignments.evaluatee_id')
                    ->whereColumn('answers.evaluation_id', 'evaluation_assignments.evaluation_id');
            })
            ->select(
                'evaluation_assignments.evaluatee_id as id',
                'users.fname',
                'users.lname',
                'users.grade',
                'positions.title as position_title',
                'departments.name as department_name',
                'divisions.name as division_name',
                'factions.name as faction_name',
                DB::raw('COUNT(DISTINCT CONCAT(evaluation_assignments.evaluator_id, "-", evaluation_assignments.evaluation_id)) as times_evaluated')
            )
            ->groupBy('evaluation_assignments.evaluatee_id', 'users.fname', 'users.lname', 'users.grade',
                'positions.title', 'departments.name', 'divisions.name', 'factions.name')
            ->orderByDesc('times_evaluated')
            ->limit(10)
            ->get();

        return $results->map(function ($item) {
            return [
                'id'              => $item->id,
                'fname'           => $item->fname,
                'lname'           => $item->lname,
                'grade'           => $item->grade,
                'times_evaluated' => $item->times_evaluated,
                'position'        => ['title' => $item->position_title ?: 'ไม่ระบุตำแหน่ง'],
                'department'      => ['name' => $item->department_name ?: 'ไม่ระบุหน่วยงาน'],
                'division'        => ['name' => $item->division_name ?: 'ไม่ระบุสายงาน'],
                'faction'         => ['name' => $item->faction_name ?: 'ไม่ระบุฝ่าย'],
            ];
        });
    }

    /**
     * Simplified Analytics Engine
     */
    private function getUltimateAnalytics($fiscalYear, $search = '')
    {
        return [
            'kpis'        => $this->calculateKPIs($fiscalYear, $search),
            'completion'  => [
                'summary' => $this->calculateCompletionSummary($fiscalYear),
            ],
            'performance' => [
                'system_health' => [
                    'health_score' => $this->calculateSystemHealthScore($fiscalYear),
                ],
            ],
            'visual_data' => $this->getVisualAnalytics($fiscalYear),
            'timeline'    => $this->getVisualAnalytics($fiscalYear), // ใช้ร่วมกัน
            'people'      => [
                'top_evaluators' => $this->getTopEvaluators($fiscalYear),
                'most_evaluated' => $this->getMostEvaluated($fiscalYear),
            ],
            'insights'    => [
                'insights' => [
                    [
                        'type'    => 'success',
                        'title'   => 'ระบบพร้อมใช้งาน',
                        'message' => 'มีข้อมูลคำตอบแล้วในระบบ',
                        'icon'    => '📊',
                    ],
                ],
                'alerts'   => [],
            ],
        ];
    }

    /**
     * Calculate Key Performance Indicators
     */
    private function calculateKPIs($fiscalYear, $search = '')
    {
        $baseQuery = EvaluationAssignment::where('fiscal_year', $fiscalYear);
        if (! empty($search)) {
            $baseQuery->where(function ($q) use ($search) {
                // ค้นหาผู้ประเมินเท่านั้น
                $q->whereHas('evaluator', function ($query) use ($search) {
                    $query->where('fname', 'like', "%{$search}%")
                        ->orWhere('lname', 'like', "%{$search}%")
                        ->orWhereRaw("CONCAT(fname, ' ', lname) LIKE ?", ["%{$search}%"]);
                });
            });
        }

        $totalEvaluators    = (clone $baseQuery)->distinct('evaluator_id')->count('evaluator_id');
        $totalRelationships = (clone $baseQuery)->count();
        $totalEvaluatees    = (clone $baseQuery)->distinct('evaluatee_id')->count('evaluatee_id');

        return [
            'total_evaluators'    => $totalEvaluators,
            'total_relationships' => $totalRelationships,
            'total_evaluatees'    => $totalEvaluatees,
            'efficiency_metrics'  => [
                'avg_evaluatees_per_evaluator' => $totalEvaluators > 0 ? round($totalRelationships / $totalEvaluators, 2) : 0,
                'avg_evaluators_per_evaluatee' => $totalEvaluatees > 0 ? round($totalRelationships / $totalEvaluatees, 2) : 0,
            ],
        ];
    }

    /**
     * API สำหรับดึงข้อมูล Analytics แบบ Real-time
     */
    public function getAnalytics(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', Carbon::now()->year);
        $search     = $request->get('search', '');

        return response()->json($this->getUltimateAnalytics($fiscalYear, $search));
    }

    /**
     * API สำหรับดึงข้อมูลสถิติรวม
     */
    public function getOverallStats(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', Carbon::now()->year);

        $stats = [
            'total_evaluatees'    => EvaluationAssignment::where('fiscal_year', $fiscalYear)
                ->distinct('evaluatee_id')->count('evaluatee_id'),
            'total_relationships' => EvaluationAssignment::where('fiscal_year', $fiscalYear)->count(),
            'total_evaluators'    => EvaluationAssignment::where('fiscal_year', $fiscalYear)
                ->distinct('evaluator_id')->count('evaluator_id'),
        ];

        return response()->json($stats);
    }

    /**
     * ส่งออกรายงาน
     */
    public function export(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', Carbon::now()->year);

        $assignments = EvaluationAssignment::with(['evaluator', 'evaluatee'])
            ->where('fiscal_year', $fiscalYear)
            ->orderBy('evaluatee_id')
            ->orderBy('angle')
            ->get();

        return response()->json([
            'message'    => 'ฟีเจอร์การส่งออกกำลังพัฒนา',
            'data_count' => $assignments->count(),
        ]);
    }

    /**
     * API สำหรับดึงข้อมูลผู้ถูกประเมินและองศาที่ต้องการ
     */
    public function getEvaluateeInfo(Request $request)
    {
        $evaluateeId = $request->get('evaluatee_id');
        
        if (!$evaluateeId) {
            return response()->json(['data' => null]);
        }

        $evaluatee = User::with(['position', 'division', 'department', 'faction'])
            ->find($evaluateeId);
            
        if (!$evaluatee) {
            return response()->json(['data' => null]);
        }

        $grade = (int) $evaluatee->grade;
        
        // กำหนดองศาที่ต้องการตามเกรด
        // ระดับ 9+: 4 องศา (บน, ล่าง, ซ้าย[ทุกระดับ internal], ขวา)
        // ระดับ 5-8: 2 องศา (บน, ซ้าย[ทุกระดับ internal])
        $requiredAngles = $grade >= 9 
            ? ['top', 'bottom', 'left', 'right']
            : ['top', 'left'];

        return response()->json([
            'data' => [
                'id' => $evaluatee->id,
                'fname' => $evaluatee->fname,
                'lname' => $evaluatee->lname,
                'grade' => $grade,
                'required_angles' => $requiredAngles,
                'position' => [
                    'id' => $evaluatee->position_id,
                    'title' => $evaluatee->position ? $evaluatee->position->title : 'ไม่ระบุตำแหน่ง'
                ],
                'division' => [
                    'id' => $evaluatee->division_id,
                    'name' => $evaluatee->division ? $evaluatee->division->name : 'ไม่ระบุสายงาน'
                ],
                'department' => [
                    'id' => $evaluatee->department_id,
                    'name' => $evaluatee->department ? $evaluatee->department->name : 'ไม่ระบุหน่วยงาน'
                ],
                'faction' => [
                    'id' => $evaluatee->faction_id,
                    'name' => $evaluatee->faction ? $evaluatee->faction->name : 'ไม่ระบุฝ่าย'
                ]
            ]
        ]);
    }

    /**
     * API สำหรับดึงข้อมูลผู้ประเมินที่เหมาะสมตามองศา - รวมสายงานอื่นด้วย
     */
    public function getEvaluatorsByAngle(Request $request)
    {
        $evaluateeId = $request->get('evaluatee_id');
        $angle       = $request->get('angle');

        if (! $evaluateeId || ! $angle) {
            return response()->json(['data' => []]);
        }

        $evaluatee = User::with(['position', 'division', 'department', 'faction'])
            ->find($evaluateeId);
            
        if (! $evaluatee) {
            return response()->json(['data' => []]);
        }

        // กรองผู้ใช้ทั้งหมด - ไม่จำกัดสายงาน
        $query = User::select([
            'id', 'emid', 'prename', 'fname', 'lname', 'grade', 'user_type',
            'position_id', 'division_id', 'department_id', 'faction_id', 'sex',
        ])
        ->with(['position', 'division', 'department', 'faction'])
        ->where('id', '!=', $evaluateeId);

        // กรองตามองศาและระดับของผู้ถูกประเมิน
        if ($angle === 'right') {
            $query->where('user_type', 'external');
        } elseif ($angle === 'left') {
            // องศาซ้าย: เห็น internal ทุกระดับได้ (ไม่จำกัดตามตำแหน่งหรือเกรด)
            $query->where('user_type', 'internal');
            // ไม่มีเงื่อนไขเพิ่มเติม - เห็นทุกคนในระบบ internal
        } else {
            // องศาอื่นๆ (top, bottom): internal ทั้งหมด
            $query->where('user_type', 'internal');
        }

        $evaluators = $query->orderBy('fname')
            ->get()
            ->map(function ($user) {
                $userType = $user->user_type instanceof \BackedEnum
                    ? $user->user_type->value
                    : $user->user_type;

                return [
                    'id'              => $user->id,
                    'emid'            => $user->emid,
                    'prename'         => $user->prename,
                    'fname'           => $user->fname,
                    'lname'           => $user->lname,
                    'grade'           => (int) $user->grade,
                    'user_type'       => $userType,
                    'sex'             => $user->sex,
                    'position'        => [
                        'id' => $user->position_id,
                        'title' => $user->position ? trim($user->position->title) : 'ไม่ระบุตำแหน่ง',
                    ],
                    'division'        => [
                        'id' => $user->division_id,
                        'name' => $user->division ? trim($user->division->name) : 'ไม่ระบุสายงาน',
                    ],
                    'department'      => [
                        'id' => $user->department_id,
                        'name' => $user->department ? trim($user->department->name) : 'ไม่ระบุหน่วยงาน',
                    ],
                    'faction'         => [
                        'id' => $user->faction_id,
                        'name' => $user->faction ? trim($user->faction->name) : 'ไม่ระบุฝ่าย',
                    ],
                    'division_id'     => $user->division_id,
                    'department_id'   => $user->department_id,
                    'position_id'     => $user->position_id,
                    'faction_id'      => $user->faction_id,
                    'position_title'  => $user->position ? trim($user->position->title) : 'ไม่ระบุตำแหน่ง',
                    'department_name' => $user->department ? trim($user->department->name) : 'ไม่ระบุหน่วยงาน',
                    'division_name'   => $user->division ? trim($user->division->name) : 'ไม่ระบุสายงาน',
                    'faction_name'    => $user->faction ? trim($user->faction->name) : 'ไม่ระบุฝ่าย',
                ];
            });

        return response()->json(['data' => $evaluators]);
    }

    /**
     * Helper: Extract position keyword for related position matching
     */
    private function extractPositionKeyword($positionTitle)
    {
        // ดึงคำสำคัญจากชื่อตำแหน่งเพื่อค้นหาตำแหน่งที่เกี่ยวข้อง
        $keywords = [
            'ผู้ช่วยผู้ว่าการ' => 'ผู้ช่วยผู้ว่าการ',
            'ผู้ว่าการ' => 'ผู้ว่าการ',
            'ผู้อำนวยการ' => 'ผู้อำนวยการ',
            'ผู้ช่วยผู้อำนวย' => 'ผู้ช่วยผู้อำนวย',
            'รองผู้อำนวยการ' => 'รองผู้อำนวยการ',
            'หัวหน้า' => 'หัวหน้า',
            'ผู้จัดการ' => 'ผู้จัดการ',
        ];

        foreach ($keywords as $keyword => $returnValue) {
            if (strpos($positionTitle, $keyword) !== false) {
                return $returnValue;
            }
        }

        // ถ้าไม่พบคำสำคัญที่กำหนด ให้ใช้คำแรกของตำแหน่ง
        $words = explode(' ', trim($positionTitle));
        return $words[0] ?? $positionTitle;
    }

    /**
     * ดึงข้อมูลการกระจายตามองศาและกิจกรรมรายวัน
     */
    private function getVisualAnalytics($fiscalYear)
    {
        // 1) Pull angle, date and evaluator ID
        $answers = DB::table('answers')
            ->join('evaluation_assignments', function ($join) {
                $join->on('answers.user_id', '=', 'evaluation_assignments.evaluator_id')
                    ->on('answers.evaluatee_id', '=', 'evaluation_assignments.evaluatee_id')
                    ->on('answers.evaluation_id', '=', 'evaluation_assignments.evaluation_id');
            })
            ->where('evaluation_assignments.fiscal_year', $fiscalYear)
            ->select(
                'evaluation_assignments.angle',
                DB::raw('DATE(answers.created_at) as date'),
                'answers.user_id'
            )
            ->get();

        // 2) Build angle distribution (unchanged)
        $angleCounts = $answers->groupBy('angle')->map(function ($group, $angle) {
            $angleInThai = $this->translateAngleToThai($angle);
            return [
                'count'      => $group->count(),
                'percentage' => 0,
            ];
        });
        $angleDistribution = [];
        foreach ($angleCounts as $angle => $data) {
            $angleDistribution[$this->translateAngleToThai($angle)] = $data;
        }

        // 3) Build timeline by counting *distinct* user_ids per day
        $timeline = $answers
            ->groupBy('date')
            ->map(function ($group, $date) {
                return [
                    'date'        => $date,
                    'daily_count' => $group->pluck('user_id')->unique()->count(),
                ];
            })
            ->values()
            ->sortBy('date')
            ->values();

        return [
            'angle_distribution' => $angleDistribution,
            'daily_activity'     => $timeline,
            'insights'           => [
                'total_active_days' => $timeline->count(),
            ],
        ];
    }

    /**
     * Optimized card data preparation - single query approach
     */
    private function getOptimizedCardData($baseQuery)
    {
        // Get all assignments with minimal data in single query
        $assignments = $baseQuery->get();
        
        // Group by evaluator more efficiently
        $grouped = $assignments->groupBy('evaluator_id')->map(function ($evaluatorAssignments, $evaluatorId) {
            $evaluator = $evaluatorAssignments->first()->evaluator;
            
            $angleGroups = [
                'top' => [],
                'bottom' => [],
                'left' => [],
                'right' => []
            ];
            
            $totalEvaluatees = 0;
            $uniqueAngles = 0;
            
            foreach ($evaluatorAssignments->groupBy('angle') as $angle => $angleAssignments) {
                if (isset($angleGroups[$angle])) {
                    $angleGroups[$angle] = $angleAssignments->map(function ($assignment) {
                        return [
                            'id' => $assignment->id,
                            'evaluatee' => $assignment->evaluatee,
                            'angle' => $assignment->angle,
                            'created_at' => $assignment->created_at,
                            'fiscal_year' => $assignment->fiscal_year,
                        ];
                    })->toArray();
                    
                    $totalEvaluatees += count($angleGroups[$angle]);
                    $uniqueAngles++;
                }
            }
            
            // ตรวจสอบว่า evaluator นี้ตอบคำถามแล้วหรือไม่
            $evaluatorHasAnswers = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id') 
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->where('ea.evaluator_id', $evaluatorId)
                ->exists();
            
            return [
                'evaluator' => $evaluator,
                'assignments' => $angleGroups,
                'stats' => [
                    'total_evaluatees' => $totalEvaluatees,
                    'unique_angles' => $uniqueAngles,
                    'assignments_count' => $totalEvaluatees,
                    'completed_angles' => $uniqueAngles,
                    'required_angles_count' => 4,
                    'is_complete' => $evaluatorHasAnswers, // ครบถ้วนเมื่อตอบคำถามแล้ว
                    'completion_rate' => $evaluatorHasAnswers ? 100 : 0, // 100% หรือ 0%
                ],
                'required_angles' => ['top', 'bottom', 'left', 'right'],
            ];
        });

        return [
            'groups' => $grouped->values()->toArray(),
            'summary' => [
                'total_evaluators' => $grouped->count(),
                'total_relationships' => $assignments->count(),
                'avg_evaluatees_per_evaluator' => $grouped->count() > 0 
                    ? round($assignments->count() / $grouped->count(), 2) 
                    : 0,
            ],
        ];
    }

    /**
     * Dashboard analytics matching AdminEvaluationReportController exactly
     */
    private function getBasicAnalytics($fiscalYear, $search = '')
    {
        // Use cache for expensive calculations  
        $cacheKey = "assignment_analytics_{$fiscalYear}_" . md5($search);
        
        return \Cache::remember($cacheKey, 300, function() use ($fiscalYear, $search) { // 5 min cache
            
            // ผู้เข้าร่วม: นับ unique evaluator_id จาก evaluation_assignments (เหมือน AdminEvaluationReportController)
            $totalParticipantsQuery = DB::table('evaluation_assignments')
                ->where('fiscal_year', $fiscalYear);
                
            if (!empty($search)) {
                $totalParticipantsQuery->join('users as evaluator', 'evaluation_assignments.evaluator_id', '=', 'evaluator.id')
                    ->where(function($q) use ($search) {
                        $q->where('evaluator.fname', 'like', "%{$search}%")
                          ->orWhere('evaluator.lname', 'like', "%{$search}%")
                          ->orWhereRaw("CONCAT(evaluator.fname, ' ', evaluator.lname) LIKE ?", ["%{$search}%"]);
                    });
            }
            
            $totalParticipants = $totalParticipantsQuery->distinct('evaluator_id')->count();
            
            // เสร็จสิ้น: นับ user_id จาก answers ที่ตอบคำถามครบทุกข้อแล้ว  
            $completedEvaluations = $this->getCompletedEvaluatorsCount($fiscalYear, $search);
            
            // รอดำเนินการ: ผู้เข้าร่วม - เสร็จสิ้น
            $pendingEvaluations = max(0, $totalParticipants - $completedEvaluations);
            $overallCompletionRate = $totalParticipants > 0 ? ($completedEvaluations / $totalParticipants) * 100 : 0;
            
            // Calculate weighted average score from actual answers
            $averageScoreQuery = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->leftJoin('options as o', function($join) {
                    $join->on(DB::raw('CAST(a.value AS UNSIGNED)'), '=', 'o.id');
                })
                ->where('ea.fiscal_year', $fiscalYear);
                
            if (!empty($search)) {
                $averageScoreQuery->join('users as evaluator', 'ea.evaluator_id', '=', 'evaluator.id')
                    ->where(function($q) use ($search) {
                        $q->where('evaluator.fname', 'like', "%{$search}%")
                          ->orWhere('evaluator.lname', 'like', "%{$search}%")
                          ->orWhereRaw("CONCAT(evaluator.fname, ' ', evaluator.lname) LIKE ?", ["%{$search}%"]);
                    });
            }
            
            $averageScore = $averageScoreQuery->avg(DB::raw('COALESCE(o.score, 
                CASE 
                    WHEN a.value REGEXP "^[0-9]+$" THEN CAST(a.value AS UNSIGNED)
                    ELSE 0 
                END)')) ?? 0;
            
            // Count unique evaluatees and assignments
            $uniqueEvaluateesQuery = DB::table('evaluation_assignments')
                ->where('fiscal_year', $fiscalYear);
                
            $totalAssignmentsQuery = DB::table('evaluation_assignments')
                ->where('fiscal_year', $fiscalYear);
                
            if (!empty($search)) {
                $uniqueEvaluateesQuery->join('users as evaluator', 'evaluation_assignments.evaluator_id', '=', 'evaluator.id')
                    ->where(function($q) use ($search) {
                        $q->where('evaluator.fname', 'like', "%{$search}%")
                          ->orWhere('evaluator.lname', 'like', "%{$search}%")
                          ->orWhereRaw("CONCAT(evaluator.fname, ' ', evaluator.lname) LIKE ?", ["%{$search}%"]);
                    });
                    
                $totalAssignmentsQuery->join('users as evaluator', 'evaluation_assignments.evaluator_id', '=', 'evaluator.id')
                    ->where(function($q) use ($search) {
                        $q->where('evaluator.fname', 'like', "%{$search}%")
                          ->orWhere('evaluator.lname', 'like', "%{$search}%")
                          ->orWhereRaw("CONCAT(evaluator.fname, ' ', evaluator.lname) LIKE ?", ["%{$search}%"]);
                    });
            }
            
            $uniqueEvaluatees = $uniqueEvaluateesQuery->distinct('evaluatee_id')->count();
            $totalAssignments = $totalAssignmentsQuery->count();
            
            // Total questions and answers  
            $totalQuestions = $this->getTotalQuestions();
            $totalAnswers = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->where('ea.fiscal_year', $fiscalYear)
                ->count();

            // Return data structure matching AdminEvaluationReportController
            return [
                'totalParticipants' => $totalParticipants, // นับ unique evaluator_id จาก evaluation_assignments
                'completedEvaluations' => $completedEvaluations, // นับ user_id ที่ตอบครบทุกข้อ
                'pendingEvaluations' => $pendingEvaluations, // ผู้เข้าร่วม - เสร็จสิ้น
                'overallCompletionRate' => round($overallCompletionRate, 1),
                'averageScore' => round($averageScore, 2),
                'totalQuestions' => $totalQuestions,
                'totalAnswers' => $totalAnswers,
                'uniqueEvaluators' => $totalParticipants, // Same as total participants
                'uniqueEvaluatees' => $uniqueEvaluatees,
                'totalAssignments' => $totalAssignments,
                'lastUpdated' => now()->toISOString()
            ];
        });
    }
    
    /**
     * Get total questions count (matching AdminEvaluationReportController)
     */
    private function getTotalQuestions(): int
    {
        return DB::table('questions as q')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->join('evaluations as e', 'p.evaluation_id', '=', 'e.id')
            ->where('e.status', 'published')
            ->count();
    }

    /**
     * Get count of evaluators who completed ALL their assigned evaluation questions
     * Based on AdminEvaluationReportController logic
     */
    private function getCompletedEvaluatorsCount($fiscalYear, $search = ''): int
    {
        // Get all unique evaluators who have assignments in this fiscal year
        $evaluatorsQuery = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear);
            
        if (!empty($search)) {
            $evaluatorsQuery->join('users as evaluator', 'evaluation_assignments.evaluator_id', '=', 'evaluator.id')
                ->where(function($q) use ($search) {
                    $q->where('evaluator.fname', 'like', "%{$search}%")
                      ->orWhere('evaluator.lname', 'like', "%{$search}%")
                      ->orWhereRaw("CONCAT(evaluator.fname, ' ', evaluator.lname) LIKE ?", ["%{$search}%"]);
                });
        }
        
        $evaluators = $evaluatorsQuery->distinct('evaluator_id')->pluck('evaluator_id');

        $completedCount = 0;

        foreach ($evaluators as $evaluatorId) {
            // Get all assignments for this evaluator in the fiscal year
            $assignments = DB::table('evaluation_assignments')
                ->where('evaluator_id', $evaluatorId)
                ->where('fiscal_year', $fiscalYear)
                ->get(['evaluation_id', 'evaluatee_id']);

            // Calculate total questions this evaluator needs to answer
            $totalRequiredQuestions = 0;
            foreach ($assignments as $assignment) {
                $questionCount = DB::table('questions as q')
                    ->join('parts as p', 'q.part_id', '=', 'p.id')
                    ->where('p.evaluation_id', $assignment->evaluation_id)
                    ->count();
                $totalRequiredQuestions += $questionCount;
            }

            // Count how many questions this evaluator actually answered
            $actualAnswersCount = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->where('ea.evaluator_id', $evaluatorId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->count();

            // If they answered all required questions, count as completed
            if ($actualAnswersCount >= $totalRequiredQuestions && $totalRequiredQuestions > 0) {
                $completedCount++;
            }
        }

        return $completedCount;
    }

}
