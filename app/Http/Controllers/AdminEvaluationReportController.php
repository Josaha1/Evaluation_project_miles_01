<?php
namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\Divisions;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
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

        $evaluateeCountByGrade = DB::table('users as u')
            ->leftJoin('answers as a', function ($join) use ($start, $end) {
                $join->on('a.evaluatee_id', '=', 'u.id')->whereBetween('a.created_at', [$start, $end]);
            })
            ->select(
                'u.grade',
                'u.user_type',
                DB::raw('COUNT(DISTINCT u.id) as total'),
                DB::raw('COUNT(DISTINCT a.evaluatee_id) as completed'),
                DB::raw('(COUNT(DISTINCT u.id) - COUNT(DISTINCT a.evaluatee_id)) as remaining')
            )
            ->groupBy('u.grade', 'u.user_type')
            ->orderByDesc('u.grade')
            ->get();

        // ⬇️ ส่วนนี้สำหรับกราฟรายปี Part 1
        $part1ScoreYearly = Answer::join('questions', 'answers.question_id', '=', 'questions.id')
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
                DB::raw("IF(MONTH(answers.created_at) >= 10, YEAR(answers.created_at) + 1, YEAR(answers.created_at)) as year"),
                DB::raw('AVG(CAST(answers.value AS DECIMAL(5,2))) as average_score')
            )
            ->groupBy('aspects.name', 'questions.part_id', 'year')
            ->orderBy('year')
            ->orderBy('aspects.name')
            ->get();

        // ⬇️ เฉลี่ยตามด้าน (summary table)
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
                    'average_score' => $row->average_score,
                    'part_id'       => (int) $row->part_id,
                    'group'         => match ((int) $row->part_id) {
                        1               => '9-12:internal',
                        4               => '9-12:external',
                        7               => '5-8',
                        default         => 'unknown',
                    },
                ];
            });

        // ⬇️ กราฟน้ำหนักเฉลี่ยแต่ละมุม
        $angleScoresAssignment = DB::table('evaluation_assignments as ea')
            ->join('answers as a', fn($join) => $join
                    ->on('ea.evaluation_id', '=', 'a.evaluation_id')
                    ->on('ea.evaluator_id', '=', 'a.user_id')
                    ->on('ea.evaluatee_id', '=', 'a.evaluatee_id'))
            ->join('users as u', 'ea.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->groupBy('ea.evaluatee_id', 'ea.angle', 'u.fname', 'u.lname')
            ->select(
                'ea.evaluatee_id',
                DB::raw("CONCAT(u.fname, ' ', u.lname) as name"),
                'ea.angle',
                DB::raw('AVG(a.value) as score')
            );

        $angleScoresSelf = DB::table('answers as a')
            ->join('users as u', 'a.evaluatee_id', '=', 'u.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->whereColumn('a.user_id', 'a.evaluatee_id')
            ->where('p.title', 'like', 'ส่วนที่ 1%')
            ->whereBetween('a.created_at', [$start, $end])
            ->when($divisionId, fn($q) => $q->where('u.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('u.grade', $grade))
            ->groupBy('a.evaluatee_id', 'u.fname', 'u.lname')
            ->select(
                'a.evaluatee_id',
                DB::raw("CONCAT(u.fname, ' ', u.lname) as name"),
                DB::raw("'self' as angle"),
                DB::raw('AVG(a.value) as score')
            );

        $angleScores = $angleScoresAssignment->unionAll($angleScoresSelf)->get();

        $angleWeightsByLevel = [
            '5-8'  => ['self' => 0.2, 'top' => 0.5, 'left' => 0.3],
            '9-12' => ['self' => 0.1, 'top' => 0.25, 'bottom' => 0.25, 'left' => 0.2, 'right' => 0.2],
        ];

        $rawScores = $angleScores->groupBy('evaluatee_id')->map(function ($items, $evaluateeId) use ($angleWeightsByLevel) {
            $user = User::with(['division', 'position'])->find($evaluateeId);
            if (! $user) {
                return null;
            }

            $grade   = (int) $user->grade;
            $level   = $grade >= 9 ? '9-12' : '5-8';
            $weights = $angleWeightsByLevel[$level];

            $scoreByAngle = collect($weights)->mapWithKeys(function ($w, $angle) use ($items) {
                $score = $items->firstWhere('angle', $angle)?->score ?? 0;
                return [$angle => round($score, 2)];
            });

            $weightedAverage = $scoreByAngle->reduce(fn($sum, $score, $angle) => $sum + $score * $weights[$angle], 0);

            return [
                'id'       => $user->id,
                'name'     => $user->fname . ' ' . $user->lname,
                'position' => $user->position->title ?? '-',
                'grade'    => $grade,
                'division' => $user->division->name ?? '-',
                ...$scoreByAngle,
                'average'  => round($weightedAverage, 2),
            ];
        })->filter()->values();

        return Inertia::render('AdminEvaluationReport', [
            'fiscalYear'            => $fiscalYear,
            'evaluateeCountByGrade' => $evaluateeCountByGrade,
            'evaluatorSummary'      => $evaluatorSummary,
            'part1ScoreYearly'      => $part1ScoreYearly,
            'part1AspectSummary'    => $part1AspectSummary,
            'weightedSummary'       => $rawScores,
            'availableYears'        => $availableYears,
            'availableDivisions'    => $availableDivisions,
            'availableGrades'       => $availableGrades,
            'availableUsers'        => $availableUsers,
            'filters'               => [
                'fiscal_year' => $fiscalYear,
                'division'    => $divisionId,
                'grade'       => $grade,
            ],
        ]);
    }
    public function exportIndividual(Request $request)
    {
        $fiscalYear = $request->get('fiscal_year');
        $divisionId = $request->get('division');
        $grade      = $request->get('grade');

        $rawScores = $this->fetchRawScores($fiscalYear, $divisionId, $grade);

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0); // ลบ default sheet

        $group5to8  = $rawScores->filter(fn($u) => $u['grade'] < 9);
        $group9to12 = $rawScores->filter(fn($u) => $u['grade'] >= 9);

        $this->addSheet($spreadsheet, 'ระดับ 5-8', $group5to8);
        $this->addSheet($spreadsheet, 'ระดับ 9-12', $group9to12);

        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, 'รายงานผลการประเมิน_' . now()->format('Ymd_His') . '.xlsx');
    }

    protected function fetchRawScores($fiscalYear, $divisionId = null, $grade = null)
    {
        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

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
            ->select(
                'ea.evaluatee_id',
                'ea.angle',
                DB::raw('AVG(a.value) as score')
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
            ->select(
                'a.evaluatee_id',
                DB::raw("'self' as angle"),
                DB::raw('AVG(a.value) as score')
            )
            ->groupBy('a.evaluatee_id');

        $angleScores = $angleScoresAssignment->unionAll($angleScoresSelf)->get();

        // ⚖️ น้ำหนักแต่ละมุม
        $angleWeightsByLevel = [
            '5-8'  => ['self' => 0.2, 'top' => 0.5, 'left' => 0.3],
            '9-12' => ['self' => 0.1, 'top' => 0.25, 'bottom' => 0.25, 'left' => 0.2, 'right' => 0.2],
        ];

        $grouped = $angleScores->groupBy('evaluatee_id');

        return $grouped->map(function ($scores, $evaluateeId) use ($angleWeightsByLevel) {
            $user = User::with(['division', 'position'])->find($evaluateeId);
            if (! $user) {
                return null;
            }

            $grade    = (int) $user->grade;
            $userType = $user->user_type ?? 'internal'; // default fallback
            $level    = $grade >= 9 ? '9-12' : '5-8';
            $weights  = $angleWeightsByLevel[$level];

            $scoreByAngle = collect($weights)->mapWithKeys(function ($w, $angle) use ($scores) {
                $score = $scores->firstWhere('angle', $angle)?->score ?? 0;
                return [$angle => round($score, 2)];
            });

            $weightedAverage = $scoreByAngle->reduce(fn($sum, $score, $angle) => $sum + $score * $weights[$angle], 0);

            return [
                'id'        => $user->id,
                'name'      => $user->fname . ' ' . $user->lname,
                'position'  => $user->position->title ?? '-',
                'grade'     => $grade,
                'division'  => $user->division->name ?? '-',
                'user_type' => $userType,
                ...$scoreByAngle,
                'average'   => round($weightedAverage, 2),
            ];
        })->filter()->values();
    }

    protected function addSheet(Spreadsheet $spreadsheet, string $title, $data)
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle($title);

        $is58    = str_contains($title, '5-8');
        $headers = $is58
        ? ['ชื่อ', 'ตำแหน่ง', 'ระดับ', 'สายงาน', 'Self', 'Top', 'Left', 'รวม', 'ผลลัพธ์']
        : ['ชื่อ', 'ตำแหน่ง', 'ระดับ', 'สายงาน', 'Self', 'Top', 'Bottom', 'Left', 'Right', 'รวม', 'ผลลัพธ์'];

        $sheet->fromArray($headers, null, 'A1');

        $row = 2;
        foreach ($data as $record) {
            $score      = $record['average'] ?? 0;
            $resultText = match (true) {
                $score > 4.50 => 'ดีเยี่ยม',
                $score >= 4.00 => 'ดีมาก',
                $score >= 3.00 => 'ดี',
                $score >= 2.00 => 'ควรปรับปรุง',
                default => 'ต้องปรับปรุงมาก',
            };

            $rowData = [
                $record['name'],
                $record['position'],
                $record['grade'],
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

            $sheet->fromArray($rowData, null, "A{$row}");
            $row++;
        }
    }
}
