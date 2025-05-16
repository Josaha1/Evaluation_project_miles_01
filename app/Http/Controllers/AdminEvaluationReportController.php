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

        $part1ScoreYearly = Answer::join('questions', 'answers.question_id', '=', 'questions.id')
            ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
            ->join('parts', 'questions.part_id', '=', 'parts.id')
            ->join('users', 'answers.user_id', '=', 'users.id')
            ->where('questions.part_id', 1)
            ->when($divisionId, fn($q) => $q->where('users.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('users.grade', $grade))
            ->whereBetween('answers.created_at', [$start, $end])
            ->select(
                'aspects.name as aspect',
                DB::raw("IF(MONTH(answers.created_at) >= 10, YEAR(answers.created_at) + 1, YEAR(answers.created_at)) as year"),
                DB::raw('AVG(CAST(answers.value AS DECIMAL(5,2))) as average_score')
            )
            ->groupBy('aspects.name', 'year')
            ->orderBy('year')
            ->orderBy('aspects.name')
            ->get();

        $angleScoresAssignment = DB::table('evaluation_assignments as ea')
            ->join('answers as a', fn($join) => $join
                    ->on('ea.evaluation_id', '=', 'a.evaluation_id')
                    ->on('ea.evaluator_id', '=', 'a.user_id')
                    ->on('ea.evaluatee_id', '=', 'a.evaluatee_id')
            )
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

        $part1AspectSummary = Answer::join('questions', 'answers.question_id', '=', 'questions.id')
            ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
            ->join('parts', 'questions.part_id', '=', 'parts.id')
            ->join('users', 'answers.user_id', '=', 'users.id')
            ->where('questions.part_id', 1)
            ->when($divisionId, fn($q) => $q->where('users.division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('users.grade', $grade))
            ->when($userId, fn($q) => $q->where('users.id', $userId))
            ->whereBetween('answers.created_at', [$start, $end])
            ->groupBy('aspects.name')
            ->orderBy('aspects.name')
            ->select(
                'aspects.name as aspect',
                DB::raw('AVG(CAST(answers.value AS DECIMAL(5,2))) as average_score')
            )
            ->get();

        $angleWeightsByLevel = [
            '5-8'  => [
                'self' => 0.20,
                'top'  => 0.50,
                'left' => 0.30,
            ],
            '9-12' => [
                'self'   => 0.10,
                'top'    => 0.25,
                'bottom' => 0.25,
                'left'   => 0.20,
                'right'  => 0.20,
            ],
        ];

        $part1Aspects = DB::table('aspects')
            ->where('part_id', 1)
            ->orderBy('id')
            ->pluck('name');

        $rawScores = $angleScores->groupBy('evaluatee_id')->map(function ($items, $evaluateeId) use ($angleWeightsByLevel) {
            $user = User::with(['division', 'position'])->find($evaluateeId);
            if (! $user) {
                return null;
            }

            $grade    = (int) $user->grade;
            $userType = $user->user_type;

            $level   = $grade >= 9 ? '9-12' : '5-8';
            $weights = $angleWeightsByLevel[$level];

            $scoreByAngle = collect($weights)->mapWithKeys(function ($w, $angle) use ($items) {
                $score = $items->firstWhere('angle', $angle)?->score ?? 0;
                return [$angle => round($score, 2)];
            });

            $weightedAverage = $scoreByAngle->reduce(
                fn($sum, $score, $angle) => $sum + $score * $weights[$angle],
                0
            );

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

        if ($request->has('export') && $request->get('export') === 'xlsx') {
            $spreadsheet = new Spreadsheet();
            $sheet1      = $spreadsheet->getActiveSheet();
            $sheet1->setTitle('Aspects Summary');
            $sheet1->fromArray([['ด้าน', 'คะแนนเฉลี่ย']], null, 'A1');
            $sheet1->fromArray($part1AspectSummary->map(fn($r) => [$r->aspect, $r->average_score])->toArray(), null, 'A2');

            $sheet2 = $spreadsheet->createSheet();
            $sheet2->setTitle('Weighted Scores');
            $sheet2->fromArray([
                ['ชื่อ', 'ตำแหน่ง', 'ระดับ', 'สายงาน', 'Self', 'Top', 'Bottom', 'Left', 'Right', 'รวม'],
            ], null, 'A1');
            $sheet2->fromArray($weightedSummary->map(fn($r) => [
                $r['name'], $r['position'], $r['grade'], $r['division'],
                $r['self'], $r['top'], $r['bottom'], $r['left'], $r['right'], $r['average'],
            ])->toArray(), null, 'A2');

            $writer   = new Xlsx($spreadsheet);
            $filename = 'evaluation_summary_' . $fiscalYear . '.xlsx';

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control' => 'max-age=0',
            ]);
        }

        return Inertia::render('AdminEvaluationReport', [
            'fiscalYear'         => $fiscalYear,
            'evaluatorSummary'   => $evaluatorSummary,
            'part1ScoreYearly'   => $part1ScoreYearly,
            'angleScores'        => $angleScores,
            'weightedSummary'    => $rawScores,
            'part1AspectSummary' => $part1AspectSummary,
            'availableYears'     => $availableYears,
            'part1Aspects'       => $part1Aspects,
            'availableDivisions' => $availableDivisions,
            'availableGrades'    => $availableGrades,
            'availableUsers'     => $availableUsers,
            'filters'            => [
                'fiscal_year' => $fiscalYear,
                'division'    => $divisionId,
                'grade'       => $grade,
            ],
        ]);
    }

    public function exportIndividualAspects(Request $request)
    {
        $fiscalYear = $request->query('fiscal_year');
        $divisionId = $request->query('division');
        $grade      = $request->query('grade');

        $start = Carbon::createFromDate($fiscalYear - 1, 10, 1)->startOfDay();
        $end   = Carbon::createFromDate($fiscalYear, 9, 30)->endOfDay();

        $evaluatees = User::query()
            ->when($divisionId, fn($q) => $q->where('division_id', $divisionId))
            ->when($grade, fn($q) => $q->where('grade', $grade))
            ->get();

        if ($evaluatees->isEmpty()) {
            return back()->withErrors(['ไม่พบข้อมูลผู้ใช้ที่ตรงกับเงื่อนไข']);
        }

        $userIds = $evaluatees->pluck('id')->toArray();

        // ✅ ดึงข้อมูลด้านทั้งหมด แยกตามระดับ
        $aspects58 = DB::table('aspects')->where('part_id', 1)->whereIn('name', [
            'IQ', 'EQ', 'AQTQ', 'Sustainability',
        ])->orderBy('id')->pluck('name', 'id');

        $aspects912 = DB::table('aspects')->where('part_id', 1)->whereIn('name', [
            'ความเป็นผู้นำ', 'วิสัยทัศน์', 'การสื่อสาร', 'นวัตกรรม', 'จริยธรรม', 'ความร่วมมือ',
        ])->orderBy('id')->pluck('name', 'id');

        // ✅ ดึงคะแนนจาก answers
        $scores = Answer::join('questions', 'answers.question_id', '=', 'questions.id')
            ->join('aspects', 'questions.aspect_id', '=', 'aspects.id')
            ->where('questions.part_id', 1)
            ->whereIn('answers.evaluatee_id', $userIds)
            ->whereBetween('answers.created_at', [$start, $end])
            ->groupBy('answers.evaluatee_id', 'aspects.id')
            ->select(
                'answers.evaluatee_id',
                'aspects.id as aspect_id',
                'aspects.name as aspect_name',
                DB::raw('AVG(CAST(answers.value AS DECIMAL(5,2))) as average')
            )
            ->get()
            ->groupBy('evaluatee_id');

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Individual Aspect Scores');

        // ✅ เตรียม Header
        $header         = ['ชื่อ', 'ตำแหน่ง', 'ระดับ', 'สายงาน', 'ประเภท'];
        $allAspectNames = $aspects58->merge($aspects912)->unique()->values();
        foreach ($allAspectNames as $aspectName) {
            $header[] = $aspectName;
        }
        $header[] = 'คะแนนเฉลี่ย';
        $sheet->fromArray([$header], null, 'A1');

        // ✅ เตรียม Row
        $rows = [];
        foreach ($evaluatees as $user) {
            $userScores    = $scores->get($user->id, collect());
            $userAspectSet = (int) $user->grade >= 9 ? $aspects912 : $aspects58;

            $aspectValues = [];
            $sum          = 0;
            $count        = 0;

            foreach ($allAspectNames as $aspectName) {
                if ($userAspectSet->contains($aspectName)) {
                    $score          = optional($userScores->firstWhere('aspect_name', $aspectName))->average;
                    $aspectValues[] = $score !== null ? round($score, 2) : '-';
                    if ($score !== null) {
                        $sum += $score;
                        $count++;
                    }
                } else {
                    $aspectValues[] = '-';
                }
            }

            $avg    = $count > 0 ? round($sum / $count, 2) : '-';
            $rows[] = [
                $user->fname . ' ' . $user->lname,
                $user->position->title ?? '-',
                $user->grade,
                $user->division->name ?? '-',
                $user->user_type === 'internal' ? 'ภายใน' : 'ภายนอก',
                ...$aspectValues,
                $avg,
            ];
        }

        $sheet->fromArray($rows, null, 'A2');

        $writer   = new Xlsx($spreadsheet);
        $filename = 'individual_aspect_scores_' . $fiscalYear . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
