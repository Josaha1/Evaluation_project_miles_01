<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\SurveyResponse;
use App\Models\SurveyType;
use App\Models\AdminUser;

class DashboardController extends Controller
{
    /**
     * แสดงหน้า Dashboard ของ Admin
     */
    public function index(): Response
    {
        // ตัวอย่างข้อมูลสรุป: จำนวน SurveyResponse ทั้งหมด, แบ่งตาม status
        $totalResponses    = SurveyResponse::count();
        $completedCount    = SurveyResponse::finished()->count(); // ✅ นับทั้ง completed และ terminated
        $pendingCount      = $totalResponses - $completedCount; // ✅ คิดจากทั้งหมด ลบที่เสร็จแล้ว
        $surveyTypes       = SurveyType::all()->map(fn($st) => [
            'id'   => $st->id,
            'name' => $st->name,
            'responsesCount' => SurveyResponse::where('survey_type_id', $st->id)->count(),
        ]);

        // ข้อมูลผู้ใช้งาน admin (optional)
        $adminCount = AdminUser::count();

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => [
                'total_responses'    => $totalResponses,
                'completed_responses'=> $completedCount,
                'pending_responses'  => $pendingCount,
                'survey_types'       => $surveyTypes,
                'admin_count'        => $adminCount,
            ],
        ]);
    }
}
