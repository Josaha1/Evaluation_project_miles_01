<?php

namespace App\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EvaluationDeadlineMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $deadline = config('evaluation.deadline');
        if (!$deadline) {
            return $next($request);
        }

        // admin ข้ามเสมอ
        $user = $request->user();
        if ($user && $user->role === 'admin') {
            return $next($request);
        }

        if (Carbon::now()->lt(Carbon::parse($deadline))) {
            return $next($request);
        }

        // เลย deadline → block
        $message = 'ระบบประเมินปิดให้บริการแล้ว';
        if ($request->is('external/*')) {
            // external route → ส่งกลับหน้า login พร้อม flash
            $request->session()->forget(['external_session_token', 'external_session_id']);
            return redirect()->route('external.login')->with('error', $message);
        }

        // internal user → ออกจากหน้าประเมิน กลับ login
        if ($user) {
            auth()->logout();
        }
        return redirect()->route('login')->with('error', $message);
    }
}
