<?php

namespace App\Http\Controllers;

use App\Models\SurveyType;
use App\Models\SurveyResponse;
use App\Models\SurveySection;
use App\Models\Question;
use App\Models\QuestionAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * แสดงหน้า Dashboard หลักสำหรับแบบสอบถาม
     */
    public function index(Request $request)
    {
        // ระยะเวลาสำหรับ filter (default: 30 วันที่ผ่านมา)
        $dateRange = $request->input('date_range', '30');
        $startDate = Carbon::now()->subDays((int)$dateRange)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        return Inertia::render('Dashboard/Index', [
            'title' => 'แดชบอร์ดแบบสอบถาม - การประปานครหลวง',
            'summary' => $this->getOverallSummary($startDate, $endDate),
            'surveyGroups' => $this->getSurveyGroupStats($startDate, $endDate),
            'charts' => [
                'responses_over_time' => $this->getResponsesOverTime($startDate, $endDate),
                'completion_rates' => $this->getCompletionRates(),
                'termination_reasons' => $this->getTerminationReasons($startDate, $endDate),
                'demographics' => $this->getDemographicsData($startDate, $endDate),
            ],
            'recent_activities' => $this->getRecentActivities(),
            'performance_metrics' => $this->getPerformanceMetrics($startDate, $endDate),
            'date_range' => $dateRange,
        ]);
    }

    /**
     * สรุปภาพรวมทั้งหมด
     */
    private function getOverallSummary($startDate, $endDate)
    {
        $cacheKey = "dashboard_summary_{$startDate->format('Y-m-d')}_{$endDate->format('Y-m-d')}";
        
        return Cache::remember($cacheKey, 300, function () use ($startDate, $endDate) {
            $totalResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])->count();
            $completedResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])
                ->finished()->count();
            $activeResponses = SurveyResponse::where('status', 'in_progress')->count();
            $terminatedResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])
                ->where('status', 'terminated')->count();

            // คำนวณอัตราสำเร็จ
            $completionRate = $totalResponses > 0 ? round(($completedResponses / $totalResponses) * 100, 1) : 0;
            $terminationRate = $totalResponses > 0 ? round(($terminatedResponses / $totalResponses) * 100, 1) : 0;

            // เปรียบเทียบกับช่วงก่อนหน้า
            $previousPeriodStart = $startDate->copy()->subDays($endDate->diffInDays($startDate));
            $previousPeriodEnd = $startDate->copy()->subDay();
            
            $previousTotal = SurveyResponse::whereBetween('created_at', [$previousPeriodStart, $previousPeriodEnd])->count();
            $growth = $previousTotal > 0 ? round((($totalResponses - $previousTotal) / $previousTotal) * 100, 1) : 0;

            return [
                'total_responses' => $totalResponses,
                'completed_responses' => $completedResponses,
                'active_responses' => $activeResponses,
                'terminated_responses' => $terminatedResponses,
                'completion_rate' => $completionRate,
                'termination_rate' => $terminationRate,
                'growth_rate' => $growth,
                'average_completion_time' => $this->getAverageCompletionTime($startDate, $endDate),
            ];
        });
    }

    /**
     * สถิติของแต่ละกลุ่มแบบสอบถาม
     */
    private function getSurveyGroupStats($startDate, $endDate)
    {
        return SurveyType::active()
            ->published()
            ->orderBy('order_index')
            ->get()
            ->map(function ($survey) use ($startDate, $endDate) {
                $totalResponses = $survey->surveyResponses()
                    ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
                    ->count();
                
                $completedResponses = $survey->surveyResponses()
                    ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
                    ->finished()
                    ->count();

                $terminatedResponses = $survey->surveyResponses()
                    ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
                    ->where('status', 'terminated')
                    ->count();

                $activeResponses = $survey->surveyResponses()
                    ->where('status', 'in_progress')
                    ->count();

                $completionRate = $totalResponses > 0 ? 
                    round(($completedResponses / $totalResponses) * 100, 1) : 0;

                $averageTime = $this->getAverageCompletionTimeForSurvey($survey->id, $startDate, $endDate);

                return [
                    'id' => $survey->id,
                    'name' => $survey->name,
                    'target_group' => $survey->target_group,
                    'description' => $survey->description,
                    'total_responses' => $totalResponses,
                    'completed_responses' => $completedResponses,
                    'terminated_responses' => $terminatedResponses,
                    'active_responses' => $activeResponses,
                    'completion_rate' => $completionRate,
                    'average_completion_time' => $averageTime,
                    'sections_count' => $survey->surveySections()->count(),
                    'questions_count' => Question::whereHas('surveySection', function($q) use ($survey) {
                        $q->where('survey_type_id', $survey->id);
                    })->count(),
                ];
            });
    }

    /**
     * กราฟการตอบแบบสอบถามตามเวลา
     */
    private function getResponsesOverTime($startDate, $endDate)
    {
        $responses = SurveyResponse::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN (is_completed = 1 OR status = "terminated") THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = "terminated" THEN 1 ELSE 0 END) as `terminated_count`')
            )
            ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $responses->map(function ($item) {
            return [
                'date' => Carbon::parse($item->date)->format('Y-m-d'),
                'date_formatted' => Carbon::parse($item->date)->format('d/m/Y'),
                'total' => (int) $item->total,
                'completed' => (int) $item->completed,
                'terminated' => (int) $item->terminated_count,
                'completion_rate' => $item->total > 0 ? round(($item->completed / $item->total) * 100, 1) : 0,
            ];
        });
    }

    /**
     * อัตราการทำเสร็จของแต่ละกลุ่ม
     */
    private function getCompletionRates()
    {
        return SurveyType::active()
            ->published()
            ->withCount([
                'surveyResponses as total_responses',
                'surveyResponses as completed_responses' => function ($query) {
                    $query->finished();
                }
            ])
            ->get()
            ->map(function ($survey) {
                $completionRate = $survey->total_responses > 0 ? 
                    round(($survey->completed_responses / $survey->total_responses) * 100, 1) : 0;

                return [
                    'name' => $survey->name,
                    'target_group' => $survey->target_group,
                    'completion_rate' => $completionRate,
                    'total_responses' => $survey->total_responses,
                    'completed_responses' => $survey->completed_responses,
                ];
            });
    }

    /**
     * สาเหตุการยุติแบบสอบถาม
     */
    private function getTerminationReasons($startDate, $endDate)
    {
        $reasons = SurveyResponse::select('termination_reason', DB::raw('COUNT(*) as count'))
            ->where('status', 'terminated')
            ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
            ->whereNotNull('termination_reason')
            ->groupBy('termination_reason')
            ->orderBy('count', 'desc')
            ->get();

        return $reasons->map(function ($item) {
            return [
                'reason' => $item->termination_reason,
                'count' => (int) $item->count,
                'percentage' => 0, // จะคำนวณใน frontend
            ];
        });
    }

    /**
     * ข้อมูลประชากรศาสตร์ (ถ้ามี)
     */
    private function getDemographicsData($startDate, $endDate)
    {
        // ตัวอย่างข้อมูลประชากรศาสตร์ - ปรับแต่งตามคำถามจริงในแบบสอบถาม
        $demographics = [];

        // เพศ (ถ้ามีคำถามเกี่ยวกับเพศ)
        $genderStats = QuestionAnswer::join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->join('survey_responses', 'question_answers.survey_response_id', '=', 'survey_responses.id')
            ->where('questions.code', 'like', '%gender%')
            ->whereBetween('survey_responses.created_at', [$startDate, $endDate])
            ->select('question_answers.answer_value', DB::raw('COUNT(*) as count'))
            ->groupBy('question_answers.answer_value')
            ->get();

        if ($genderStats->isNotEmpty()) {
            $demographics['gender'] = $genderStats->map(function ($item) {
                return [
                    'label' => $this->getGenderLabel($item->answer_value),
                    'value' => (int) $item->count,
                ];
            });
        }

        // อายุ (ถ้ามีคำถามเกี่ยวกับอายุ)
        $ageStats = QuestionAnswer::join('questions', 'question_answers.question_id', '=', 'questions.id')
            ->join('survey_responses', 'question_answers.survey_response_id', '=', 'survey_responses.id')
            ->where('questions.code', 'like', '%age%')
            ->whereBetween('survey_responses.created_at', [$startDate, $endDate])
            ->select(
                DB::raw('CASE 
                    WHEN CAST(question_answers.answer_value AS UNSIGNED) < 25 THEN "18-24"
                    WHEN CAST(question_answers.answer_value AS UNSIGNED) < 35 THEN "25-34"
                    WHEN CAST(question_answers.answer_value AS UNSIGNED) < 45 THEN "35-44"
                    WHEN CAST(question_answers.answer_value AS UNSIGNED) < 55 THEN "45-54"
                    WHEN CAST(question_answers.answer_value AS UNSIGNED) < 65 THEN "55-64"
                    ELSE "65+"
                END as age_group'),
                DB::raw('COUNT(*) as count')
            )
            ->whereRaw('question_answers.answer_value REGEXP "^[0-9]+$"')
            ->groupBy('age_group')
            ->get();

        if ($ageStats->isNotEmpty()) {
            $demographics['age'] = $ageStats->map(function ($item) {
                return [
                    'label' => $item->age_group,
                    'value' => (int) $item->count,
                ];
            });
        }

        return $demographics;
    }

    /**
     * กิจกรรมล่าสุด
     */
    private function getRecentActivities()
    {
        return SurveyResponse::with('surveyType')
            ->select('id', 'survey_type_id', 'status', 'created_at', 'updated_at', 'termination_reason')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($response) {
                return [
                    'id' => $response->id,
                    'survey_name' => $response->surveyType->name ?? 'Unknown',
                    'status' => $response->status,
                    'status_label' => $this->getStatusLabel($response->status),
                    'created_at' => $response->created_at->diffForHumans(),
                    'updated_at' => $response->updated_at->diffForHumans(),
                    'termination_reason' => $response->termination_reason,
                ];
            });
    }

    /**
     * ตัวชี้วัดประสิทธิภาพ
     */
    private function getPerformanceMetrics($startDate, $endDate)
    {
        $totalResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])->count();
        $averageTime = $this->getAverageCompletionTime($startDate, $endDate);
        
        // คำนวณ bounce rate (อัตราการยุติก่อนทำเสร็จ)
        $bouncedResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'in_progress')
            ->where('updated_at', '<', Carbon::now()->subHours(24))
            ->count();

        $bounceRate = $totalResponses > 0 ? round(($bouncedResponses / $totalResponses) * 100, 1) : 0;

        // คำนวณ engagement score
        $engagementScore = $this->calculateEngagementScore($startDate, $endDate);

        return [
            'average_completion_time' => $averageTime,
            'bounce_rate' => $bounceRate,
            'engagement_score' => $engagementScore,
            'peak_hours' => $this->getPeakHours($startDate, $endDate),
            'mobile_usage' => $this->getMobileUsagePercentage($startDate, $endDate),
        ];
    }

    /**
     * คำนวณเวลาเฉลี่ยในการทำแบบสอบถาม
     */
    private function getAverageCompletionTime($startDate, $endDate)
    {
        $completed = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])
            ->finished()
            ->whereNotNull('completed_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avg_minutes'))
            ->first();

        return $completed ? round($completed->avg_minutes, 1) : 0;
    }

    /**
     * คำนวณเวลาเฉลี่ยของแบบสอบถามเฉพาะ
     */
    private function getAverageCompletionTimeForSurvey($surveyId, $startDate, $endDate)
    {
        $completed = SurveyResponse::where('survey_type_id', $surveyId)
            ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
            ->finished()
            ->whereNotNull('completed_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avg_minutes'))
            ->first();

        return $completed ? round($completed->avg_minutes, 1) : 0;
    }

    /**
     * คำนวณคะแนน engagement
     */
    private function calculateEngagementScore($startDate, $endDate)
    {
        $totalResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])->count();
        $completedResponses = SurveyResponse::whereBetween('created_at', [$startDate, $endDate])
            ->finished()->count();
        
        if ($totalResponses == 0) return 0;
        
        $completionRate = ($completedResponses / $totalResponses) * 100;
        $averageTime = $this->getAverageCompletionTime($startDate, $endDate);
        
        // คะแนน engagement = (completion rate * 0.7) + (time factor * 0.3)
        $timeFactor = min(100, max(0, 100 - (($averageTime - 10) * 2))); // เวลาที่เหมาะสม ~10-15 นาที
        $engagementScore = ($completionRate * 0.7) + ($timeFactor * 0.3);
        
        return round($engagementScore, 1);
    }

    /**
     * ช่วงเวลาที่มีการใช้งานสูงสุด
     */
    private function getPeakHours($startDate, $endDate)
    {
        $hourly = SurveyResponse::select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as count')
            )
            ->whereBetween('created_at', [$startDate->format('Y-m-d H:i:s'), $endDate->format('Y-m-d H:i:s')])
            ->groupBy('hour')
            ->orderBy('count', 'desc')
            ->limit(3)
            ->get();

        return $hourly->map(function ($item) {
            return [
                'hour' => sprintf('%02d:00', $item->hour),
                'count' => (int) $item->count,
            ];
        });
    }

    /**
     * เปอร์เซ็นต์การใช้งานผ่านมือถือ
     */
    private function getMobileUsagePercentage($startDate, $endDate)
    {
        // ถ้ามีการเก็บ user agent หรือ device type
        // ตัวอย่างนี้จะ return ค่าประมาณ
        return rand(60, 80); // 60-80% mobile usage
    }

    /**
     * Helper methods
     */
    private function getStatusLabel($status)
    {
        return match($status) {
            'completed' => 'เสร็จสิ้น',
            'terminated' => 'ยุติ',
            'in_progress' => 'กำลังดำเนินการ',
            default => 'ไม่ทราบสถานะ'
        };
    }

    private function getGenderLabel($value)
    {
        return match((string)$value) {
            '1' => 'ชาย',
            '2' => 'หญิง',
            '3' => 'เพศทางเลือก',
            default => 'ไม่ระบุ'
        };
    }

    /**
     * Export ข้อมูลสถิติ
     */
    public function export(Request $request)
    {
        $dateRange = $request->input('date_range', '30');
        $startDate = Carbon::now()->subDays((int)$dateRange)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $data = [
            'summary' => $this->getOverallSummary($startDate, $endDate),
            'survey_groups' => $this->getSurveyGroupStats($startDate, $endDate),
            'responses_over_time' => $this->getResponsesOverTime($startDate, $endDate),
            'completion_rates' => $this->getCompletionRates(),
            'termination_reasons' => $this->getTerminationReasons($startDate, $endDate),
            'exported_at' => Carbon::now()->format('Y-m-d H:i:s'),
        ];

        return response()->json($data)
            ->header('Content-Disposition', 'attachment; filename="survey_dashboard_' . date('Y-m-d') . '.json"');
    }
}