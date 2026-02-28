<?php

namespace App\Http\Middleware;

use App\Models\ExternalEvaluationSession;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExternalAuthMiddleware
{
    private const SESSION_LIFETIME_HOURS = 8;

    public function handle(Request $request, Closure $next): Response
    {
        $sessionToken = $request->session()->get('external_session_token');
        $sessionId = $request->session()->get('external_session_id');

        if (!$sessionToken || !$sessionId) {
            return redirect()->route('external.login')
                ->with('error', 'กรุณาเข้าสู่ระบบด้วย Access Code');
        }

        $externalSession = ExternalEvaluationSession::with(['organization', 'evaluatee', 'evaluation', 'accessCode'])
            ->where('id', $sessionId)
            ->where('session_token', $sessionToken)
            ->whereNull('completed_at')
            ->first();

        if (!$externalSession) {
            $request->session()->forget(['external_session_token', 'external_session_id']);
            return redirect()->route('external.login')
                ->with('error', 'Session หมดอายุหรือการประเมินเสร็จสิ้นแล้ว');
        }

        // Check session time expiry (8 hours from creation)
        if (Carbon::parse($externalSession->created_at)->addHours(self::SESSION_LIFETIME_HOURS)->isPast()) {
            $request->session()->forget(['external_session_token', 'external_session_id']);
            return redirect()->route('external.login')
                ->with('error', 'Session หมดอายุแล้ว (เกิน 8 ชั่วโมง) กรุณาเข้าสู่ระบบใหม่');
        }

        // Share session data via request attributes for controller access
        $request->attributes->set('external_session', $externalSession);

        return $next($request);
    }
}
