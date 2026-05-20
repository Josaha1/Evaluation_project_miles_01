<?php

namespace App\Http\Controllers;

use App\Models\SurveyType;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        // ดึงข้อมูล survey groups พร้อมสถิติ
        $groups = SurveyType::active()
            ->published()
            ->orderBy('order_index')
            ->withCount([
                'surveyResponses as total_responses' => function ($query) {
                    // ✅ นับทั้ง completed และ terminated เป็นผู้ตอบสำเร็จ
                    $query->where(function($q) {
                        $q->where('is_completed', true)
                          ->orWhere('status', 'terminated');
                    });
                },
                'surveyResponses as started_responses'
            ])
            ->get()
            ->map(function($survey) {
                $completionRate = $survey->started_responses > 0 
                    ? round(($survey->total_responses / $survey->started_responses) * 100, 1)
                    : 0;

                return [
                    'id' => $survey->id,
                    'name' => $survey->name,
                    'description' => $survey->description,
                    'target_group' => $survey->target_group,
                    'total_responses' => $survey->total_responses,
                    'started_responses' => $survey->started_responses,
                    'completion_rate' => $completionRate,
                ];
            });

        // สถิติรวม
        $totalCompleted = SurveyResponse::finished()->count(); // ✅ นับทั้ง completed และ terminated
        $totalStarted = SurveyResponse::count();
        
        $stats = [
            'total_responses' => $totalCompleted,
            'total_started' => $totalStarted,
            'completion_rate' => $this->calculateCompletionRate(),
            'groups_stats' => $groups->pluck('total_responses', 'name')->toArray(),
        ];

        // สถิติรายวัน (7 วันล่าสุด)
        $dailyStats = $this->getDailyStats();

        // การตั้งค่าแบบสอบถาม
        $settings = [
            'survey_title' => 'การสำรวจการรับรู้ข้อมูลข่าวสารของผู้มีส่วนได้ส่วนเสีย การประปานครหลวง ปีงบประมาณ 2568',
            'survey_description' => 'การสำรวจนี้มีวัตถุประสงค์เพื่อประเมินผลสัมฤทธิ์ของการดำเนินงานด้านการประชาสัมพันธ์ และนำผลสำรวจที่ได้ไปพัฒนาและปรับปรุงการดำเนินงาน',
            'privacy_notice' => 'ข้อมูลที่ได้รับจะถูกเก็บไว้เป็นความลับ และข้อมูลที่ได้รับจะนำไปใช้พัฒนาและปรับปรุงการดำเนินงานการประชาสัมพันธ์ของ กปน. เท่านั้น',
            'survey_active' => 'true',
        ];

        return Inertia::render('Welcome', [
            'groups' => $groups,
            'settings' => $settings,
            'stats' => $stats,
            'dailyStats' => $dailyStats,
        ]);
    }

    private function calculateCompletionRate()
    {
        $totalStarted = SurveyResponse::count();
        $totalCompleted = SurveyResponse::finished()->count(); // ✅ นับทั้ง completed และ terminated
        
        if ($totalStarted === 0) return 0;
        
        return round(($totalCompleted / $totalStarted) * 100, 1);
    }

    private function getDailyStats()
    {
        return SurveyResponse::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed')
            )
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'total' => $item->total,
                    'completed' => $item->completed,
                    'completion_rate' => $item->total > 0 ? round(($item->completed / $item->total) * 100, 1) : 0,
                ];
            });
    }
}