<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Divisions;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AdminEvaluationReportController extends Controller
{
    public function index(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year', now()->month >= 10 ? now()->addYear()->year : now()->year);
        $divisionId = $request->get('division');
        $grade      = $request->get('grade');
        $userId     = $request->get('user_id');

        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

        $validPartIds = match (true) {
            $grade && $grade < 9 => [7],
            $grade && $grade >= 9 => [1, 4],
            default => [1, 4, 7],
        };

        $availableYears = Answer::selectRaw("DISTINCT IF(MONTH(created_at) >= 10, YEAR(created_at) + 1, YEAR(created_at)) as fiscal_year")
            ->orderByDesc('fiscal_year')
            ->pluck('fiscal_year')
            ->toArray();

        $availableDivisions = Divisions::orderBy('id')->get(['id', 'name']);
        $availableGrades    = User::distinct()->orderByDesc('grade')->pluck('grade')->filter()->values()->toArray();
        $availableUsers     = User::orderBy('fname')->get()->map(fn($u) => [
            'id'   => $u->id,
            'name' => $u->fname . ' ' . $u->lname,
        ]);

        $evaluatorSummary = User::select('grade', 'user_type', DB::raw('count(*) as total'))
            ->when($divisionId, fn($q) => $q->where('division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('grade', $grade))
            ->whereHas('assignmentsAsEvaluator', fn($q) => $q->where('fiscal_year', $fiscalYear))
            ->groupBy('grade', 'user_type')
            ->orderBy('grade')
            ->get();

        // 📊 กลับไปใช้แบบเดิม - นับทุกคนที่ควรได้รับการประเมิน
        $evaluateeCountByGrade = DB::table('users as u')
            ->leftJoin('answers as a', function ($join) use ($start, $end) {
                $join->on('a.evaluatee_id', '=', 'u.id')
                    ->whereBetween('a.created_at', [$start, $end])
                    ->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('questions as q')
                            ->join('parts as p', 'q.part_id', '=', 'p.id')
                            ->whereColumn('q.id', 'a.question_id')
                            ->where('p.title', 'like', 'ส่วนที่ 1%');
                    });
            })
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->select(
                'u.grade',
                'u.user_type',
                DB::raw('COUNT(DISTINCT u.id) as total'),
                DB::raw('COUNT(DISTINCT a.evaluatee_id) as completed'),
                DB::raw('(COUNT(DISTINCT u.id) - COUNT(DISTINCT a.evaluatee_id)) as remaining')
            )
            ->groupBy('u.grade', 'u.user_type')
            ->orderByDesc('u.grade')
            ->orderBy('u.user_type')
            ->get();

        // 📈 Enhanced Part 1 Score Analysis
        $part1ScoreYearly = Answer::join('questions', 'answers.question_id', '=', 'questions.id')
            ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
            ->join('users as evaluatees', 'answers.evaluatee_id', '=', 'evaluatees.id')
            ->join('users as evaluators', 'answers.user_id', '=', 'evaluators.id')
            ->whereBetween('answers.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('evaluatees.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('evaluatees.grade', $grade))
            ->when($userId, fn($q) => $q->where('evaluatees.id', $userId))
            ->whereIn('questions.part_id', $validPartIds)
            ->select(
                'aspects.name as aspect',
                'questions.part_id',
                'evaluatees.user_type as evaluatee_type',
                'evaluatees.grade as evaluatee_grade',
                DB::raw("IF(MONTH(answers.created_at) >= 10, YEAR(answers.created_at) + 1, YEAR(answers.created_at)) as year"),
                DB::raw('AVG(CAST(answers.value AS DECIMAL(5,2))) as average_score')
            )
            ->groupBy('aspects.name', 'questions.part_id', 'evaluatees.user_type', 'evaluatees.grade', 'year')
            ->orderBy('year')
            ->orderBy('aspects.name')
            ->get();

        // 🎯 Enhanced Aspect Summary with detailed grouping
        $part1AspectSummary = Answer::join('questions', 'answers.question_id', '=', 'questions.id')
            ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
            ->join('users', 'answers.user_id', '=', 'users.id')
            ->whereBetween('answers.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('users.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('users.grade', $grade))
            ->when($userId, fn($q) => $q->where('users.id', $userId))
            ->whereIn('questions.part_id', $validPartIds)
            ->select(
                'aspects.name as aspect',
                'questions.part_id',
                DB::raw('AVG(CAST(answers.value AS DECIMAL(5,2))) as average_score')
            )
            ->groupBy('aspects.name', 'questions.part_id')
            ->orderBy('questions.part_id')
            ->orderBy('aspects.name')
            ->get()
            ->map(function ($row) {
                return [
                    'aspect'        => $row->aspect,
                    'average_score' => (float) $row->average_score,
                    'part_id'       => (int) $row->part_id,
                    'group'         => match ((int) $row->part_id) {
                        1               => '9-12:internal',
                        4               => '9-12:external',
                        7               => '5-8',
                        default         => 'unknown'
                    },
                ];
            });

        // 💯 แก้ไข: weightedSummary ให้รวมทุกคนที่ควรได้รับการประเมิน
        $rawScores = $this->fetchCompleteRawScores($fiscalYear, $divisionId, $grade);

        // 🎯 กรองเฉพาะคนที่มีคะแนนจริงสำหรับการส่งออก (ให้ตรงกับ Excel)
        $rawScoresForExport = $rawScores->filter(function ($item) {
            return $item['average'] > 0; // เฉพาะคนที่มีคะแนนจริง
        })->values();

        return Inertia::render('AdminEvaluationReport', [
            'fiscalYear'               => $fiscalYear,
            'evaluateeCountByGrade'    => $evaluateeCountByGrade,
            'evaluatorSummary'         => $evaluatorSummary,
            'part1ScoreYearly'         => $part1ScoreYearly,
            'part1AspectSummary'       => $part1AspectSummary,
            'weightedSummary'          => $rawScores,          // ทุกคน (สำหรับแสดงในตาราง)
            'weightedSummaryForExport' => $rawScoresForExport, // เฉพาะคนที่มีคะแนน (สำหรับส่งออก)
            'availableYears'           => $availableYears,
            'availableDivisions'       => $availableDivisions,
            'availableGrades'          => $availableGrades,
            'availableUsers'           => $availableUsers,
            'filters'                  => [
                'fiscal_year' => $fiscalYear,
                'division'    => $divisionId,
                'grade'       => $grade,
            ],
            'summaryStats'             => $this->calculateSummaryStats($evaluateeCountByGrade, $rawScoresForExport),
        ]);
    }
    protected function fetchCompleteRawScores($fiscalYear, $divisionId = null, $grade = null)
    {
        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

        // 📊 ขั้นที่ 1: หาทุกคนที่ควรได้รับการประเมิน
        $allEvaluatees = User::query()
            ->when($divisionId, fn($q) => $q->where('division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('grade', $grade))
            ->with(['division', 'position'])
            ->get();

        // 📊 ขั้นที่ 2: หาคนที่มี answers ใน Part 1
        $evaluateesWithAnswers = DB::table('answers as a')
            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->distinct()
            ->pluck('a.evaluatee_id');

        // 📊 ขั้นที่ 3: ดึง angle scores สำหรับคนที่มี answers
        $angleScoresAssignment = DB::table('evaluation_assignments as ea')
            ->join('answers as a', function ($join) {
                $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                    ->on('ea.evaluator_id', '=', 'a.user_id')
                    ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
            })
            ->join('users as u', 'ea.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->whereIn('ea.evaluatee_id', $evaluateesWithAnswers)
            ->select(
                'ea.evaluatee_id',
                'ea.angle',
                DB::raw('AVG(a.value) as score'),
                DB::raw('COUNT(a.id) as answer_count')
            )
            ->groupBy('ea.evaluatee_id', 'ea.angle');

        $angleScoresSelf = DB::table('answers as a')
            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->whereColumn('a.user_id', 'a.evaluatee_id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->whereIn('a.evaluatee_id', $evaluateesWithAnswers)
            ->select(
                'a.evaluatee_id',
                DB::raw("'self' as angle"),
                DB::raw('AVG(a.value) as score'),
                DB::raw('COUNT(a.id) as answer_count')
            )
            ->groupBy('a.evaluatee_id');

        $angleScores = $angleScoresAssignment->unionAll($angleScoresSelf)->get();
        $grouped     = $angleScores->groupBy('evaluatee_id');

        // ⚖️ Enhanced weight system
        $angleWeightsByLevel = [
            '5-8'  => ['self' => 0.2, 'top' => 0.5, 'left' => 0.3],
            '9-12' => ['self' => 0.1, 'top' => 0.25, 'bottom' => 0.25, 'left' => 0.2, 'right' => 0.2],
        ];

        $allResults = collect();

        // 📊 ขั้นที่ 4: ประมวลผลทุกคน
        foreach ($allEvaluatees as $user) {
            $evaluateeId = $user->id;
            $grade       = (int) $user->grade;
            $userType    = $user->user_type ?? 'internal';
            $level       = $grade >= 9 ? '9-12' : '5-8';
            $weights     = $angleWeightsByLevel[$level];

            // ตรวจสอบว่าคนนี้มี angle scores หรือไม่
            if ($grouped->has($evaluateeId)) {
                // คนที่มี angle scores
                $scores = $grouped->get($evaluateeId);
                $result = $this->calculateUserScore($evaluateeId, $scores, $angleWeightsByLevel);
                if ($result) {
                    $allResults->push($result);
                }
            } else {
                // คนที่ไม่มี angle scores - ใส่คะแนน 0
                $allResults->push([
                    'id'               => $user->id,
                    'name'             => $user->fname . ' ' . $user->lname,
                    'position'         => $user->position->title ?? '-',
                    'grade'            => $grade,
                    'division'         => $user->division->name ?? '-',
                    'user_type'        => $userType,
                    'division_id'      => $user->division_id,
                    'position_id'      => $user->position_id,

                    // 🎯 Angle scores - ทุกอันเป็น 0
                    'self'             => 0,
                    'top'              => 0,
                    'bottom'           => $grade >= 9 ? 0 : null,
                    'left'             => 0,
                    'right'            => $grade >= 9 ? 0 : null,

                    // 💯 Summary metrics
                    'average'          => 0,
                    'total_answers'    => 0,
                    'completed_angles' => 0,
                    'expected_angles'  => count($weights),
                    'completion_rate'  => 0,

                    // 🏆 Performance rating
                    'rating'           => 1,
                    'rating_text'      => 'ไม่ได้ประเมิน',
                ]);
            }
        }

        return $allResults->values();
    }
    private function getEvaluateeCountByGradeFixed($fiscalYear, $divisionId = null, $grade = null)
    {
        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

        // 📊 หาคนที่มี answers ใน Part 1 ก่อน
        $usersWithPart1Answers = DB::table('users as u')
            ->join('answers as a', 'a.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->select('u.id', 'u.grade', 'u.user_type')
            ->distinct()
            ->get();

        // 📊 จัดกลุ่มและนับ
        $evaluateeCountByGrade = $usersWithPart1Answers
            ->groupBy(['grade', 'user_type'])
            ->map(function ($users, $grade) {
                return $users->map(function ($typeUsers, $userType) use ($grade) {
                    $total = $typeUsers->count();
                    return [
                        'grade'     => (int) $grade,
                        'user_type' => $userType,
                        'total'     => $total,
                        'completed' => $total, // ทุกคนที่มี answers ถือว่า completed
                        'remaining' => 0,      // เนื่องจากเรา filter แค่คนที่มี answers แล้ว
                    ];
                });
            })
            ->flatten(1)
            ->sortByDesc('grade')
            ->sortBy('user_type')
            ->values();

        return $evaluateeCountByGrade;
    }
    /**
     * 🎯 Enhanced method to determine grouping logic
     */
    private function determineGroup($grade, $userType, $partId)
    {
        if ($grade >= 5 && $grade <= 8) {
            return '5-8';
        }

        if ($grade >= 9 && $grade <= 12) {
            if ($userType === 'internal') {
                return '9-12:internal';
            } else {
                return '9-12:external';
            }
        }

        return 'other';
    }

    /**
     * 💯 Enhanced method to fetch raw scores with complete user information
     */
    protected function fetchEnhancedRawScores($fiscalYear, $divisionId = null, $grade = null)
    {
        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

        // 📊 ดึงรายชื่อทุกคนที่มี answers ในช่วงเวลาที่กำหนด
        $evaluateeIds = DB::table('answers as a')
            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->distinct()
            ->pluck('a.evaluatee_id');

        // 📊 Assignment-based scores (from other evaluators)
        $angleScoresAssignment = DB::table('evaluation_assignments as ea')
            ->join('answers as a', function ($join) {
                $join->on('ea.evaluation_id', '=', 'a.evaluation_id')
                    ->on('ea.evaluator_id', '=', 'a.user_id')
                    ->on('ea.evaluatee_id', '=', 'a.evaluatee_id');
            })
            ->join('users as u', 'ea.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->whereIn('ea.evaluatee_id', $evaluateeIds) // เฉพาะคนที่มี answers
            ->select(
                'ea.evaluatee_id',
                'ea.angle',
                DB::raw('AVG(a.value) as score'),
                DB::raw('COUNT(a.id) as answer_count')
            )
            ->groupBy('ea.evaluatee_id', 'ea.angle');

        // 👤 Self-assessment scores - ดึงทุกคนที่มี answers
        $angleScoresSelf = DB::table('answers as a')
            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->whereColumn('a.user_id', 'a.evaluatee_id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->whereIn('a.evaluatee_id', $evaluateeIds) // เฉพาะคนที่มี answers
            ->select(
                'a.evaluatee_id',
                DB::raw("'self' as angle"),
                DB::raw('AVG(a.value) as score'),
                DB::raw('COUNT(a.id) as answer_count')
            )
            ->groupBy('a.evaluatee_id');

        $angleScores = $angleScoresAssignment->unionAll($angleScoresSelf)->get();

        // ⚖️ Enhanced weight system
        $angleWeightsByLevel = [
            '5-8'  => ['self' => 0.2, 'top' => 0.5, 'left' => 0.3],
            '9-12' => ['self' => 0.1, 'top' => 0.25, 'bottom' => 0.25, 'left' => 0.2, 'right' => 0.2],
        ];

        $grouped = $angleScores->groupBy('evaluatee_id');

        // 🔍 สำหรับคนที่ไม่มี angle scores แต่มี answers ให้เพิ่มเข้าไปด้วย
        $missingEvaluatees = $evaluateeIds->diff($grouped->keys());

        $allResults = collect();

        // ประมวลผลคนที่มี angle scores
        foreach ($grouped as $evaluateeId => $scores) {
            $result = $this->calculateUserScore($evaluateeId, $scores, $angleWeightsByLevel);
            if ($result) {
                $allResults->push($result);
            }
        }

        // ประมวลผลคนที่ไม่มี angle scores แต่มี answers
        foreach ($missingEvaluatees as $evaluateeId) {
            $user = User::with(['division', 'position'])->find($evaluateeId);
            if ($user) {
                // หาคะแนนเฉลี่ยจาก self-assessment
                $selfScore = DB::table('answers as a')
                    ->join('questions as q', 'a.question_id', '=', 'q.id')
                    ->join('parts as p', 'q.part_id', '=', 'p.id')
                    ->where('a.evaluatee_id', $evaluateeId)
                    ->whereColumn('a.user_id', 'a.evaluatee_id')
                    ->where('p.title', 'like', 'ส่วนที่ 1%')
                    ->whereBetween('a.created_at', [$start, $end])
                    ->avg('a.value') ?: 0;

                $grade    = (int) $user->grade;
                $userType = $user->user_type ?? 'internal';

                $allResults->push([
                    'id'               => $user->id,
                    'name'             => $user->fname . ' ' . $user->lname,
                    'position'         => $user->position->title ?? '-',
                    'grade'            => $grade,
                    'division'         => $user->division->name ?? '-',
                    'user_type'        => $userType,
                    'division_id'      => $user->division_id,
                    'position_id'      => $user->position_id,

                    // 🎯 Angle scores - ใส่เฉพาะ self
                    'self'             => round((float) $selfScore, 2),
                    'top'              => 0,
                    'bottom'           => $grade >= 9 ? 0 : null,
                    'left'             => 0,
                    'right'            => $grade >= 9 ? 0 : null,

                    // 💯 Summary metrics
                    'average'          => round((float) $selfScore, 2),
                    'total_answers'    => DB::table('answers as a')
                        ->join('questions as q', 'a.question_id', '=', 'q.id')
                        ->join('parts as p', 'q.part_id', '=', 'p.id')
                        ->where('a.evaluatee_id', $evaluateeId)
                        ->where('p.title', 'like', 'ส่วนที่ 1%')
                        ->whereBetween('a.created_at', [$start, $end])
                        ->count(),
                    'completed_angles' => 1, // มีแค่ self
                    'expected_angles'  => $grade >= 9 ? 5 : 3,
                    'completion_rate'  => $grade >= 9 ? 20.0 : 33.3, // 1/5 or 1/3

                    // 🏆 Performance rating
                    'rating'           => $this->getPerformanceRating($selfScore),
                    'rating_text'      => $this->getPerformanceText($selfScore),
                ]);
            }
        }

        return $allResults->filter()->values();
    }
    private function calculateUserScore($evaluateeId, $scores, $angleWeightsByLevel)
    {
        $user = User::with(['division', 'position'])->find($evaluateeId);
        if (! $user) {
            return null;
        }

        $grade    = (int) $user->grade;
        $userType = $user->user_type ?? 'internal';
        $level    = $grade >= 9 ? '9-12' : '5-8';
        $weights  = $angleWeightsByLevel[$level];

        // 🎯 Calculate scores for each angle
        $scoreByAngle = collect($weights)->mapWithKeys(function ($weight, $angle) use ($scores) {
            $angleData = $scores->firstWhere('angle', $angle);
            $score     = $angleData ? (float) $angleData->score : 0;
            return [$angle => round($score, 2)];
        });

        // 💯 Calculate weighted average
        $weightedAverage = $scoreByAngle->reduce(function ($sum, $score, $angle) use ($weights) {
            return $sum + ($score * $weights[$angle]);
        }, 0);

        // 📊 Additional analytics
        $totalAnswers    = $scores->sum('answer_count');
        $completedAngles = $scores->where('score', '>', 0)->count();
        $expectedAngles  = count($weights);
        $completionRate  = $expectedAngles > 0 ? ($completedAngles / $expectedAngles) * 100 : 0;

        return [
            'id'               => $user->id,
            'name'             => $user->fname . ' ' . $user->lname,
            'position'         => $user->position->title ?? '-',
            'grade'            => $grade,
            'division'         => $user->division->name ?? '-',
            'user_type'        => $userType,
            'division_id'      => $user->division_id,
            'position_id'      => $user->position_id,

            // 🎯 Angle scores
             ...$scoreByAngle->toArray(),

            // 💯 Summary metrics
            'average'          => round($weightedAverage, 2),
            'total_answers'    => $totalAnswers,
            'completed_angles' => $completedAngles,
            'expected_angles'  => $expectedAngles,
            'completion_rate'  => round($completionRate, 2),

            // 🏆 Performance rating
            'rating'           => $this->getPerformanceRating($weightedAverage),
            'rating_text'      => $this->getPerformanceText($weightedAverage),
        ];
    }
    /**
     * 🏆 Get performance rating based on score
     */
    private function getPerformanceRating($score)
    {
        if ($score > 4.50) {
            return 5;
        }

        if ($score >= 4.00) {
            return 4;
        }

        if ($score >= 3.00) {
            return 3;
        }

        if ($score >= 2.00) {
            return 2;
        }

        return 1;
    }

    /**
     * 📝 Get performance text based on score
     */
    private function getPerformanceText($score)
    {
        if ($score > 4.50) {
            return 'ดีเยี่ยม';
        }

        if ($score >= 4.00) {
            return 'ดีมาก';
        }

        if ($score >= 3.00) {
            return 'ดี';
        }

        if ($score >= 2.00) {
            return 'ควรปรับปรุง';
        }

        return 'ต้องปรับปรุงมาก';
    }

    /**
     * 📊 Calculate comprehensive summary statistics
     */
    private function calculateSummaryStats($evaluateeCountByGrade, $rawScores)
    {
        $totalEvaluatees = $evaluateeCountByGrade->sum('total');
        $totalCompleted  = $evaluateeCountByGrade->sum('completed');
        $totalRemaining  = $evaluateeCountByGrade->sum('remaining');

        $completionRate = $totalEvaluatees > 0 ? ($totalCompleted / $totalEvaluatees) * 100 : 0;

        // 🎯 Score distribution
        $scoreDistribution = [
            'excellent' => $rawScores->where('rating', 5)->count(),
            'very_good' => $rawScores->where('rating', 4)->count(),
            'good'      => $rawScores->where('rating', 3)->count(),
            'fair'      => $rawScores->where('rating', 2)->count(),
            'poor'      => $rawScores->where('rating', 1)->count(),
        ];

        // 📈 Average scores by group
        $avgScoresByGroup = [
            'internal_5_8'  => $rawScores->where('grade', '>=', 5)->where('grade', '<=', 8)->avg('average') ?: 0,
            'internal_9_12' => $rawScores->where('grade', '>=', 9)->where('user_type', 'internal')->avg('average') ?: 0,
            'external_9_12' => $rawScores->where('grade', '>=', 9)->where('user_type', 'external')->avg('average') ?: 0,
        ];

        return [
            'total_evaluatees'    => $totalEvaluatees,
            'total_completed'     => $totalCompleted,
            'total_remaining'     => $totalRemaining,
            'completion_rate'     => round($completionRate, 2),
            'score_distribution'  => $scoreDistribution,
            'avg_scores_by_group' => $avgScoresByGroup,
            'overall_avg_score'   => round($rawScores->avg('average') ?: 0, 2),
            'highest_score'       => round($rawScores->max('average') ?: 0, 2),
            'lowest_score'        => round($rawScores->min('average') ?: 0, 2),
        ];
    }
    private function debugExportData($rawScores, $fiscalYear, $divisionId)
    {
        $internal_5_8  = $rawScores->filter(fn($u) => $u['grade'] >= 5 && $u['grade'] <= 8);
        $internal_9_12 = $rawScores->filter(fn($u) => $u['grade'] >= 9 && $u['grade'] <= 12 && $u['user_type'] === 'internal');
        $external_9_12 = $rawScores->filter(fn($u) => $u['grade'] >= 9 && $u['grade'] <= 12 && $u['user_type'] === 'external');
        $all_9_12      = $rawScores->filter(fn($u) => $u['grade'] >= 9 && $u['grade'] <= 12);

        \Log::info('Export Data Debug', [
            'fiscal_year'         => $fiscalYear,
            'division_id'         => $divisionId,
            'total_records'       => $rawScores->count(),
            'internal_5_8_count'  => $internal_5_8->count(),
            'internal_9_12_count' => $internal_9_12->count(),
            'external_9_12_count' => $external_9_12->count(),
            'all_9_12_count'      => $all_9_12->count(),
            'total_calculated'    => $internal_5_8->count() + $all_9_12->count(),
        ]);

        return [
            'internal_5_8'  => $internal_5_8->count(),
            'internal_9_12' => $internal_9_12->count(),
            'external_9_12' => $external_9_12->count(),
            'all_9_12'      => $all_9_12->count(),
            'total'         => $rawScores->count(),
        ];
    }
    /**
     * 🎨 ✨ ENHANCED EXPORT SYSTEM ✨ 🎨
     * รองรับการส่งออกแบบครีเอทีฟและยืดหยุ่น
     */
    public function exportIndividual(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year');
        $divisionId = $request->get('division');

        // 📊 ดึงข้อมูลดิบ
        $rawScores = $this->fetchEnhancedRawScores($fiscalYear, $divisionId);

        if ($rawScores->isEmpty()) {
            return response()->json(['error' => 'ไม่พบข้อมูลการประเมิน'], 404);
        }

        // 🔍 Debug ข้อมูลก่อนส่งออก
        $debugInfo = $this->debugExportData($rawScores, $fiscalYear, $divisionId);

        // 🎨 สร้าง Spreadsheet พร้อม Metadata
        $spreadsheet = new Spreadsheet();
        $this->setSpreadsheetMetadata($spreadsheet, $fiscalYear, $divisionId);
        $spreadsheet->removeSheetByIndex(0);

        // ✅ ส่งออกครบถ้วนทุกกลุ่ม (แยกชีต: 5-8, 9-12 internal, 9-12 external, 9-12 combined)
        $this->createComprehensiveExport($spreadsheet, $rawScores, $fiscalYear, $divisionId);

        $filename = $this->generateSmartFilename($fiscalYear, $divisionId, null);

        return $this->streamExcelDownload($spreadsheet, $filename);
    }

    /**
     * 🌟 ส่งออกเฉพาะกลุ่มที่เลือก - ระบบอัจฉริยะ
     */
    private function createSpecificGroupExport($spreadsheet, $rawScores, $groupFilter, $fiscalYear, $divisionId)
    {
        switch ($groupFilter) {
            case '5-8':
                $data  = $rawScores->filter(fn($u) => $u['grade'] >= 5 && $u['grade'] <= 8);
                $title = '🏢 พนักงานภายใน ระดับ 5-8';
                $level = '5-8';
                break;

            case '9-12':
                $data  = $rawScores->filter(fn($u) => $u['grade'] >= 9 && $u['grade'] <= 12);
                $title = '👨‍💼 ผู้บริหาร ระดับ 9-12';
                $level = '9-12';
                break;

            default:
                throw new \InvalidArgumentException('Invalid group filter');
        }

        if ($data->count() > 0) {
            $this->addMasterSheet($spreadsheet, $title, $data, $level);
            $this->addDetailedAnalysisSheet($spreadsheet, $data, $groupFilter);
        } else {
            $this->addNoDataSheet($spreadsheet, $title);
        }

        // เพิ่ม summary sheet สำหรับกลุ่มเฉพาะ
        $this->addGroupSummarySheet($spreadsheet, $data, $groupFilter, $fiscalYear);
    }

    /**
     * 🎨 ส่งออกครบถ้วน - ทุกกลุ่มแยก Sheet
     */
    private function createComprehensiveExport($spreadsheet, $rawScores, $fiscalYear, $divisionId)
    {
        $groups = [
            '5-8'  => [
                'data'  => $rawScores->filter(fn($u) => $u['grade'] >= 5 && $u['grade'] <= 8),
                'title' => 'พนักงานภายใน (C5-C8)',
                'level' => '5-8',
            ],
            // รวมทั้ง internal/external
            '9-12' => [
                'data'  => $rawScores->filter(fn($u) => $u['grade'] >= 9 && $u['grade'] <= 12),
                'title' => 'ผู้บริหาร (C9-C12)',
                'level' => '9-12',
            ],
        ];

        foreach ($groups as $groupKey => $group) {
            if ($group['data']->count() > 0) {
                $this->addMasterSheet($spreadsheet, $group['title'], $group['data'], $group['level']);
            }
        }

        $this->addExecutiveSummarySheet($spreadsheet, $rawScores, $groups, $fiscalYear);
        $this->addComparativeAnalysisSheet($spreadsheet, $groups);
    }

    private function makeUniqueSheetTitle($spreadsheet, $title)
    {
        $used = [];
        foreach ($spreadsheet->getSheetNames() as $sheetName) {
            $used[$sheetName] = true;
        }
        $base = $title;
        $i    = 1;
        while (isset($used[$title])) {
            $title = $base . '-' . $i;
            $i++;
            if (mb_strlen($title) > 28) {
                $title = mb_substr($title, 0, 28 - strlen((string) $i)) . '-' . $i;
            }

        }
        return $title;
    }
    /**
     * 🎨 สร้าง Master Sheet หลักสำหรับแต่ละกลุ่ม
     */
    private function addMasterSheet($spreadsheet, $title, $data, $level)
    {
        $sheet = $spreadsheet->createSheet();

        // ปรับชื่อ sheet ให้ปลอดภัยและไม่ซ้ำ
        $sheet->setTitle($this->makeUniqueSheetTitle($spreadsheet, $this->sanitizeSheetTitle($title)));

        $is58    = $level === '5-8';
        $headers = $is58
        ? ['#', 'ชื่อ-สกุล', 'ตำแหน่ง', 'ระดับ', 'สายงาน', 'Self', 'Top', 'Left', 'คะแนนรวม', 'ระดับผลงาน', 'ความครบถ้วน (%)']
        : ['#', 'ชื่อ-สกุล', 'ตำแหน่ง', 'ระดับ', 'สายงาน', 'Self', 'Top', 'Bottom', 'Left', 'Right', 'คะแนนรวม', 'ระดับผลงาน', 'ความครบถ้วน (%)'];

        $sheet->fromArray($headers, null, 'A1');
        $colCount    = count($headers);
        $lastCol     = Coordinate::stringFromColumnIndex($colCount);
        $headerRange = "A1:{$lastCol}1";
        $this->styleHeader($sheet, $headerRange);

        $row = 2;
        foreach ($data as $index => $record) {
            $rowData = $this->buildRowData($record, $index + 1, $is58);
            $sheet->fromArray($rowData, null, "A{$row}");

            $this->styleDataRow($sheet, $row, $record, $is58, $colCount);

            $row++;
        }

        $this->autoSizeColumns($sheet, $colCount);
        $this->addSheetSummaryStats($sheet, $data, $row + 1);
    }

    /**
     * 🎨 สร้างข้อมูลแถว
     */
    private function buildRowData($record, $index, $is58)
    {
        $score          = $record['average'] ?? 0;
        $resultText     = $this->getPerformanceText($score);
        $completionRate = $record['completion_rate'] ?? 0;

        $rowData = [
            $index,
            $record['name'],
            $record['position'],
            'C' . $record['grade'],
            $record['division'],
            $record['self'] ?? 0,
            $record['top'] ?? 0,
        ];

        if (! $is58) {
            $rowData[] = $record['bottom'] ?? 0;
        }

        $rowData[] = $record['left'] ?? 0;

        if (! $is58) {
            $rowData[] = $record['right'] ?? 0;
        }

        $rowData[] = $score;
        $rowData[] = $resultText;
        $rowData[] = $completionRate;

        return $rowData;
    }

    /**
     * 🎨 จัดสไตล์ Header
     */
    private function styleHeader($sheet, $headerRange)
    {
        $sheet->getStyle($headerRange)->applyFromArray([
            'font'      => [
                'bold'  => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size'  => 12,
            ],
            'fill'      => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF4472C4'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'borders'   => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color'       => ['argb' => 'FF000000'],
                ],
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(25);
    }

    /**
     * 🎨 จัดสไตล์แถวข้อมูล
     */
    private function styleDataRow($sheet, $row, $record, $is58, $colCount)
    {
        $score        = $record['average'] ?? 0;
        $scoreColumn  = $is58 ? 9 : 11;  // index of 'คะแนนรวม' (1-based)
        $resultColumn = $is58 ? 10 : 12; // index of 'ระดับผลงาน' (1-based)

        $scoreColLetter  = Coordinate::stringFromColumnIndex($scoreColumn);
        $resultColLetter = Coordinate::stringFromColumnIndex($resultColumn);

        $scoreColor = $this->getScoreColorARGB($score);

        $sheet->getStyle("{$scoreColLetter}{$row}:{$resultColLetter}{$row}")->applyFromArray([
            'fill'      => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => $scoreColor],
            ],
            'font'      => ['bold' => true],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $lastColLetter = Coordinate::stringFromColumnIndex($colCount);
        $sheet->getStyle("A{$row}:{$lastColLetter}{$row}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color'       => ['argb' => 'FFD1D5DB'],
                ],
            ],
        ]);

        if ($row % 2 == 0) {
            $sheet->getStyle("A{$row}:{$lastColLetter}{$row}")->applyFromArray([
                'fill' => [
                    'fillType'   => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFF9FAFB'],
                ],
            ]);
        }
    }

    /**
     * 📊 เพิ่มสถิติสรุปใน Sheet
     */
    private function addSheetSummaryStats($sheet, $data, $startRow)
    {
        $totalRecords = $data->count();
        $avgScore     = $data->avg('average');
        $maxScore     = $data->max('average');
        $minScore     = $data->min('average');

        // เพิ่มช่องว่าง
        $row = $startRow + 1;

        // หัวข้อสถิติ
        $sheet->setCellValue("A{$row}", '📊 สถิติสรุป');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFE3F2FD'],
            ],
        ]);

        $row += 2;

        // สถิติต่างๆ
        $stats = [
            'จำนวนผู้ประเมินทั้งหมด:' => $totalRecords . ' คน',
            'คะแนนเฉลี่ย:'            => number_format($avgScore, 2),
            'คะแนนสูงสุด:'            => number_format($maxScore, 2),
            'คะแนนต่ำสุด:'            => number_format($minScore, 2),
        ];

        foreach ($stats as $label => $value) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $value);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }
    }

    /**
     * 📈 Executive Summary Sheet
     */
    private function addExecutiveSummarySheet($spreadsheet, $rawScores, $groups, $fiscalYear)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('📈 Executive Summary');

        $row = 1;

        // หัวข้อหลัก
        $sheet->setCellValue('A1', '📊 รายงานสรุปผู้บริหาร: การประเมิน 360 องศา');
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 18, 'color' => ['argb' => 'FF1F2937']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->mergeCells('A1:F1');

        $row = 3;
        $sheet->setCellValue("A{$row}", 'ปีงบประมาณ: ' . ($fiscalYear + 543));
        $sheet->setCellValue("A" . ($row + 1), 'วันที่สร้างรายงาน: ' . now()->format('d/m/Y H:i:s'));

        $row += 3;

        // สถิติภาพรวม
        $sheet->setCellValue("A{$row}", '🎯 สถิติภาพรวม');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFE3F2FD']],
        ]);

        $row += 2;

        foreach ($groups as $groupKey => $group) {
            if ($group['data']->count() > 0) {
                $avgScore = $group['data']->avg('average');
                $count    = $group['data']->count();

                $sheet->setCellValue("A{$row}", $group['title']);
                $sheet->setCellValue("B{$row}", "{$count} คน");
                $sheet->setCellValue("C{$row}", number_format($avgScore, 2));
                $sheet->setCellValue("D{$row}", $this->getPerformanceText($avgScore));

                $row++;
            }
        }

        // จัดสไตล์ตาราง
        $this->styleTableRange($sheet, 'A' . ($row - count($groups)) . ':D' . ($row - 1));
    }

    /**
     * 📊 Comparative Analysis Sheet
     */
    private function addComparativeAnalysisSheet($spreadsheet, $groups)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('📊 Comparative Analysis');

        // เพิ่มการวิเคราะห์เปรียบเทียบ
        $row = 1;
        $sheet->setCellValue('A1', '📈 การวิเคราะห์เปรียบเทียบระหว่างกลุ่ม');
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 16],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->mergeCells('A1:E1');

        $row = 3;

        // ตารางเปรียบเทียบ
        $headers = ['กลุ่ม', 'จำนวนคน', 'คะแนนเฉลี่ย', 'คะแนนสูงสุด', 'คะแนนต่ำสุด'];
        $sheet->fromArray($headers, null, "A{$row}");
        $this->styleHeader($sheet, "A{$row}:E{$row}");

        $row++;

        foreach ($groups as $groupKey => $group) {
            if ($group['data']->count() > 0) {
                $data    = $group['data'];
                $rowData = [
                    $group['title'],
                    $data->count(),
                    number_format($data->avg('average'), 2),
                    number_format($data->max('average'), 2),
                    number_format($data->min('average'), 2),
                ];

                $sheet->fromArray($rowData, null, "A{$row}");
                $row++;
            }
        }

        $this->autoSizeColumns($sheet, 5);
    }

    /**
     * 🎯 Group Summary Sheet สำหรับกลุ่มเฉพาะ
     */
    private function addGroupSummarySheet($spreadsheet, $data, $groupFilter, $fiscalYear)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('📋 Group Summary');

        $groupName = match ($groupFilter) {
            '5-8' => 'พนักงานภายใน (C5-C8)',
            '9-12' => 'ผู้บริหาร (C9-C12)',
            default => 'ไม่ระบุกลุ่ม'
        };

        $row = 1;
        $sheet->setCellValue('A1', "📊 สรุปกลุ่ม: {$groupName}");
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 16],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->mergeCells('A1:D1');

        $row = 3;

        // สถิติของกลุ่ม
        $stats = [
            'จำนวนผู้ประเมิน:'      => $data->count() . ' คน',
            'คะแนนเฉลี่ย:'          => number_format($data->avg('average'), 2),
            'คะแนนสูงสุด:'          => number_format($data->max('average'), 2),
            'คะแนนต่ำสุด:'          => number_format($data->min('average'), 2),
            'ส่วนเบี่ยงเบนมาตรฐาน:' => number_format($this->calculateStandardDeviation($data->pluck('average')->toArray()), 2),
        ];

        foreach ($stats as $label => $value) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $value);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }

        // การกระจายผลการประเมิน
        $row += 2;
        $sheet->setCellValue("A{$row}", '🏆 การกระจายผลการประเมิน');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 14],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF3E5F5']],
        ]);

        $row += 2;

        $distribution = [
            'ดีเยี่ยม (>4.50)'        => $data->where('rating', 5)->count(),
            'ดีมาก (4.00-4.50)'       => $data->where('rating', 4)->count(),
            'ดี (3.00-3.99)'          => $data->where('rating', 3)->count(),
            'ควรปรับปรุง (2.00-2.99)' => $data->where('rating', 2)->count(),
            'ต้องปรับปรุงมาก (<2.00)' => $data->where('rating', 1)->count(),
        ];

        foreach ($distribution as $level => $count) {
            $percentage = $data->count() > 0 ? ($count / $data->count()) * 100 : 0;
            $sheet->setCellValue("A{$row}", $level);
            $sheet->setCellValue("B{$row}", $count . ' คน');
            $sheet->setCellValue("C{$row}", number_format($percentage, 1) . '%');
            $row++;
        }

        $this->autoSizeColumns($sheet, 3);
    }

    /**
     * ❌ No Data Sheet
     */
    private function addNoDataSheet($spreadsheet, $title)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($this->sanitizeSheetTitle($title));

        $sheet->setCellValue('A1', 'ไม่พบข้อมูลการประเมิน');
        $sheet->setCellValue('A2', 'กลุ่มนี้ไม่มีข้อมูลในช่วงเวลาที่เลือก');

        $sheet->getStyle('A1:A2')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 14],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
    }

    /**
     * 🏷️ ตั้งค่า Metadata สำหรับ Spreadsheet
     */
    private function setSpreadsheetMetadata($spreadsheet, $fiscalYear, $divisionId)
    {
        $properties   = $spreadsheet->getProperties();
        $divisionName = $divisionId ? Divisions::find($divisionId)?->name ?? 'ทุกสายงาน' : 'ทุกสายงาน';

        $properties
            ->setCreator('ระบบประเมินผลการปฏิบัติงาน 360°')
            ->setLastModifiedBy('System Auto-Generated')
            ->setTitle('รายงานผลการประเมิน 360° - ปีงบประมาณ ' . ($fiscalYear + 543))
            ->setSubject('รายงานการประเมินผลการปฏิบัติงานแบบ 360 องศา')
            ->setDescription("รายงานผลการประเมิน 360° สำหรับปีงบประมาณ " . ($fiscalYear + 543) . " สายงาน: {$divisionName}")
            ->setKeywords('การประเมิน, 360 องศา, ผลการปฏิบัติงาน, รายงาน')
            ->setCategory('รายงานการประเมิน')
            ->setCompany('องค์กร');
    }

    /**
     * 🎯 สร้างชื่อไฟล์อัจฉริยะ
     */
    private function generateSmartFilename($fiscalYear, $divisionId, $groupFilter)
    {
        $parts = ['รายงานการประเมิน360องศา'];

        // ปีงบประมาณ
        $parts[] = 'ปีงบ' . ($fiscalYear + 543);

        // สายงาน
        if ($divisionId) {
            $division = Divisions::find($divisionId);
            if ($division) {
                $parts[] = preg_replace('/[^a-zA-Z0-9ก-๙]/u', '', $division->name);
            }
        }

        // กลุ่มเฉพาะ
        if ($groupFilter && $groupFilter !== 'all') {
            $groupName = match ($groupFilter) {
                '5-8' => 'พนักงานภายใน5-8',
                '9-12' => 'ผู้บริหาร9-12',

                default => 'กลุ่มเฉพาะ'
            };
            $parts[] = $groupName;
        } else {
            $parts[] = 'ทุกกลุ่ม';
        }

        // วันที่และเวลา
        $parts[] = now()->format('Ymd_His');

        return implode('_', $parts) . '.xlsx';
    }

    /**
     * 🎨 ฟังก์ชันช่วยเหลือต่างๆ
     */
    private function getScoreColorARGB($score)
    {
        if ($score > 4.50) {
            return 'FF90EE90';
        }
        // Light Green
        if ($score >= 4.00) {
            return 'FF87CEEB';
        }
        // Sky Blue
        if ($score >= 3.00) {
            return 'FFFFFF99';
        }
        // Light Yellow
        if ($score >= 2.00) {
            return 'FFFFA500';
        }
                           // Orange
        return 'FFFF6B6B'; // Light Red
    }

    private function sanitizeSheetTitle($title)
    {
        $title = preg_replace('/[\x{1F600}-\x{1F64F}]|[\x{1F300}-\x{1F5FF}]|[\x{1F680}-\x{1F6FF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]/u', '', $title);
        $title = preg_replace('/[:\\\\\\/\\?\\*\\[\\]]/', '', $title); // remove disallowed chars
        $title = trim($title);
        return mb_substr($title, 0, 28); // <= 31 chars for Excel safety
    }

    private function autoSizeColumns($sheet, $columnCount)
    {
        for ($i = 1; $i <= $columnCount; $i++) {
            $column = Coordinate::stringFromColumnIndex($i);
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
    }

    private function styleTableRange($sheet, $range)
    {
        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color'       => ['argb' => 'FF000000'],
                ],
            ],
        ]);
    }

    private function calculateStandardDeviation($values)
    {
        if (count($values) <= 1) {
            return 0;
        }

        $mean     = array_sum($values) / count($values);
        $variance = array_sum(array_map(fn($x) => pow($x - $mean, 2), $values)) / count($values);

        return sqrt($variance);
    }

    private function streamExcelDownload($spreadsheet, $filename)
    {
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
            'Expires'       => 'Mon, 26 Jul 1997 05:00:00 GMT',
            'Last-Modified' => gmdate('D, d M Y H:i:s') . ' GMT',
            'Pragma'        => 'public',
        ]);
    }

    // 📊 Legacy methods for backward compatibility
    protected function fetchRawScores($fiscalYear, $divisionId = null, $grade = null)
    {
        return $this->fetchEnhancedRawScores($fiscalYear, $divisionId, $grade);
    }

    protected function addSheet(Spreadsheet $spreadsheet, string $title, $data)
    {
        $level = str_contains($title, '5-8') ? '5-8' : '9-12';
        $this->addMasterSheet($spreadsheet, $title, $data, $level);
    }

    protected function addEnhancedSheet(Spreadsheet $spreadsheet, string $title, $data, string $level)
    {
        $this->addMasterSheet($spreadsheet, $title, $data, $level);
    }

    protected function addSummarySheet(Spreadsheet $spreadsheet, $data)
    {
        $this->addExecutiveSummarySheet($spreadsheet, $data, [], now()->year);
    }

    // 🎯 API Endpoint สำหรับดึงรายชื่อผู้ถูกประเมิน
    public function listEvaluatees(Request $request)
    {
        $fiscalYear = $request->query('fiscal_year');
        $grade      = $request->query('grade');
        $userType   = $request->query('user_type');
        $status     = $request->query('status');
        $divisionId = $request->query('division');

        $query = User::query();

        if ($grade) {
            $query->where('grade', $grade);
        }

        if ($userType) {
            $query->where('user_type', $userType);
        }

        if (! empty($divisionId)) {
            $query->where('division_id', $divisionId);
        }

        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

        if ($status === 'completed') {
            $query->whereHas('answersReceived', function ($q) use ($start, $end) {
                $q->whereBetween('created_at', [$start, $end]);
            });
        } elseif ($status === 'incomplete') {
            $query->whereDoesntHave('answersReceived', function ($q) use ($start, $end) {
                $q->whereBetween('created_at', [$start, $end]);
            });
        }

        $users = $query->get()->map(function ($u) {
            return [
                'id'            => $u->id,
                'fname'         => $u->fname,
                'lname'         => $u->lname,
                'position_name' => $u->position->name ?? null,
                'division_name' => $u->division->name ?? null,
            ];
        });

        return response()->json(['users' => $users]);
    }
}
