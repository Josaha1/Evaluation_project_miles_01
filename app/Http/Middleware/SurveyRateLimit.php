<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class SurveyRateLimit
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = 'survey_submit:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'error' => 'Too many survey submissions. Please try again in ' . $seconds . ' seconds.',
            ], 429);
        }

        RateLimiter::hit($key, 300); // 5 minutes

        return $next($request);
    }
}
