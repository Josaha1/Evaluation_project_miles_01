<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SurveyActive
{
    public function handle(Request $request, Closure $next)
    {
        $settings = DB::table('survey_settings')
            ->whereIn('key', ['survey_active', 'survey_start_date', 'survey_end_date'])
            ->pluck('value', 'key');

        // Check if survey is active
        if (($settings['survey_active'] ?? 'true') !== 'true') {
            return redirect()->route('survey.index')->with('error', 'แบบสำรวจยังไม่เปิดใช้งาน');
        }

        // Check survey dates
        $now = Carbon::now();
        
        if (!empty($settings['survey_start_date'])) {
            $startDate = Carbon::parse($settings['survey_start_date']);
            if ($now->lt($startDate)) {
                return redirect()->route('survey.index')->with('error', 'แบบสำรวจยังไม่เปิดให้ทำ');
            }
        }

        if (!empty($settings['survey_end_date'])) {
            $endDate = Carbon::parse($settings['survey_end_date'])->endOfDay();
            if ($now->gt($endDate)) {
                return redirect()->route('survey.index')->with('error', 'แบบสำรวจได้ปิดแล้ว');
            }
        }

        return $next($request);
    }
}