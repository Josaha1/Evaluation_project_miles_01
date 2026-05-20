<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\SurveyResponse;
use App\Models\Question;
use App\Models\UserAnswer;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel; // ถ้าต้องการใช้งาน Export (Maatwebsite\Excel)

class ReportController extends Controller
{
    /**
     * หน้ารายงานหลัก
     */
    public function index(): Response
    {
        // อาจจะเป็นหน้าที่มีลิงก์ไปยัง sub-reports ต่างๆ
        return Inertia::render('Admin/Reports/Index');
    }

    /**
     * รายงาน Responses ทั้งหมด (ตาราง, pagination)
     */
    public function responses(Request $request): Response
    {
        $perPage = $request->input('perpage', 20);
        $query = SurveyResponse::with('surveyType')
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $responses = $query->paginate($perPage)
            ->through(function($r) {
                return [
                    'id'              => $r->id,
                    'survey_type'     => $r->surveyType->name,
                    'respondent_name' => $r->respondent_name,
                    'respondent_email'=> $r->respondent_email,
                    'status'          => $r->status,
                    'is_completed'    => $r->is_completed,
                    'progress'        => $r->progress_percentage,
                    'created_at'      => $r->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('Admin/Reports/Responses', [
            'responses' => $responses,
            'filters'   => $request->only(['status', 'perpage']),
        ]);
    }

    /**
     * รายงาน Analytics เบื้องต้น (สรุปกราฟต่างๆ)
     */
    public function analytics(): Response
    {
        // ตัวอย่าง: สรุปจำนวน responses แยกตาม SurveyType
        $bySurveyType = SurveyResponse::select('survey_type_id', DB::raw('count(*) as total'))
            ->groupBy('survey_type_id')
            ->with('surveyType')
            ->get()
            ->map(function($item) {
                return [
                    'survey_type' => $item->surveyType->name,
                    'total'       => $item->total,
                ];
            });

        // ตัวอย่าง: สรุปคะแนนเฉลี่ยของคำถาม Rating Type (assume QuestionType = 'rating')
        $ratingQuestions = Question::whereHas('type', function($q) {
                $q->where('code', 'rating');
            })
            ->get();

        $avgRatings = [];
        foreach ($ratingQuestions as $qObj) {
            $avg = UserAnswer::where('question_id', $qObj->id)
                ->avg('answer_value');

            $avgRatings[] = [
                'question' => $qObj->text,
                'average'  => round($avg, 2),
            ];
        }

        return Inertia::render('Admin/Reports/Analytics', [
            'bySurveyType' => $bySurveyType,
            'avgRatings'   => $avgRatings,
        ]);
    }

    /**
     * รายงานวิเคราะห์คำถามเฉพาะข้อ (questionAnalysis)
     */
    public function questionAnalysis(int $questionId): Response
    {
        $question = Question::with(['options', 'ratingScales'])
            ->findOrFail($questionId);

        // ถ้าเป็น single_choice / multiple_choice
        if ($question->type->code === 'single_choice' || $question->type->code === 'multiple_choice') {
            // นับจำนวนแต่ละ Option
            $counts = UserAnswer::where('question_id', $question->id)
                ->select('option_id', DB::raw('count(*) as total'))
                ->groupBy('option_id')
                ->get()
                ->mapWithKeys(function($row) {
                    return [ $row->option_id => $row->total ];
                });

            $data = $question->options->map(function($opt) use ($counts) {
                return [
                    'label' => $opt->label,
                    'count' => $counts->get($opt->id, 0),
                ];
            });
        }
        // ถ้าเป็น rating
        elseif ($question->type->code === 'rating') {
            $avg = UserAnswer::where('question_id', $question->id)
                ->avg('answer_value');

            $data = [
                'average' => round($avg, 2),
                'scale'   => $question->ratingScales->map(function($rs) {
                    return [
                        'min' => $rs->min_value,
                        'max' => $rs->max_value,
                    ];
                }),
            ];
        }
        // ถ้าเป็น text / open_text
        else {
            $samples = UserAnswer::where('question_id', $question->id)
                ->pluck('answer_text')
                ->filter()
                ->take(10);

            $data = [
                'samples' => $samples,
            ];
        }

        return Inertia::render('Admin/Reports/QuestionAnalysis', [
            'question' => [
                'id'   => $question->id,
                'text' => $question->text,
                'type' => $question->type->code,
            ],
            'data' => $data,
        ]);
    }

    /**
     * Export Responses เป็น CSV หรือ Excel
     */
    public function exportResponses(Request $request)
    {
        // รับ filter จาก request (เช่น status, survey_type_id)
        $filters = $request->only(['status', 'survey_type_id']);

        $query = SurveyResponse::with('surveyType');

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['survey_type_id'])) {
            $query->where('survey_type_id', $filters['survey_type_id']);
        }

        $responses = $query->get();

        // สร้างไฟล์ CSV เบื้องต้น
        $filename = 'responses_' . now()->format('Ymd_His') . '.csv';
        $columns = [
            'ID', 'Survey Type', 'Respondent Name', 'Email', 'Status', 'Progress', 'Created At',
        ];
        $callback = function() use ($responses, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($responses as $r) {
                fputcsv($file, [
                    $r->id,
                    $r->surveyType->name,
                    $r->respondent_name,
                    $r->respondent_email,
                    $r->status,
                    $r->progress_percentage,
                    $r->created_at->format('Y-m-d H:i'),
                ]);
            }

            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Export Analytics (ตัวอย่าง: average rating per question)
     */
    public function exportAnalytics(Request $request)
    {
        // สมมติเราส่ง question_ids มาวิเคราะห์
        $questionIds = $request->input('question_ids', []);
        $results = [];

        foreach ($questionIds as $qid) {
            $qObj = Question::find($qid);
            if (!$qObj) {
                continue;
            }

            if ($qObj->type->code === 'rating') {
                $avg = UserAnswer::where('question_id', $qid)
                    ->avg('answer_value');

                $results[] = [
                    'question_id' => $qid,
                    'question'    => $qObj->text,
                    'average'     => round($avg, 2),
                ];
            }
        }

        // สร้าง CSV เช่นเดียวกับ exportResponses
        $filename = 'analytics_' . now()->format('Ymd_His') . '.csv';
        $columns = ['Question ID', 'Question', 'Average'];

        $callback = function() use ($results, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($results as $row) {
                fputcsv($file, [
                    $row['question_id'],
                    $row['question'],
                    $row['average'],
                ]);
            }

            fclose($file);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
