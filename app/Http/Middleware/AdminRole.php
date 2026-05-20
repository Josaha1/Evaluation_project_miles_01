<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = Auth::guard('admin')->user();

        if (! $user || ! $user->is_active) {
            abort(403, 'Access denied');
        }

        if (! empty($roles) && ! in_array($user->role, $roles)) {
            abort(403, 'Insufficient permissions');
        }

        return $next($request);
    }
}
