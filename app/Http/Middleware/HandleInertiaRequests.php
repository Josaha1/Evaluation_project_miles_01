<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->fname . ' ' . $request->user()->lname,
                    'fname' => $request->user()->fname,
                    'lname' => $request->user()->lname,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'grade' => $request->user()->grade,
                    'user_type' => $request->user()->user_type,
                    'photo' =>$request->user()->photo,
                ] : null,
            ],

            // ✨ Enhanced Flash Messages
            'flash' => function () use ($request) {
                return [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'), 
                    'warning' => $request->session()->get('warning'),
                    'info' => $request->session()->get('info'),
                    'details' => $request->session()->get('details'), // สำหรับ bulk operations
                ];
            },

            // ✨ Enhanced Errors with better structure
            'errors' => function () use ($request) {
                $errors = $request->session()->get('errors');
                if (!$errors) {
                    return (object) [];
                }

                $errorBag = $errors->getBag('default');
                $formattedErrors = [];

                foreach ($errorBag->getMessages() as $field => $messages) {
                    $formattedErrors[$field] = $messages;
                }

                return (object) $formattedErrors;
            },

            // ✨ App Configuration
            'app' => [
                'name' => config('app.name'),
                'environment' => config('app.env'),
                'debug' => config('app.debug'),
                'locale' => app()->getLocale(),
                'timezone' => config('app.timezone'),
            ],

            // ✨ Routes Helper - ให้ frontend ใช้ได้
            'routes' => function () {
                return [
                    'current' => request()->route() ? request()->route()->getName() : null,
                    'previous' => url()->previous(),
                ];
            },

            // ✨ Permissions (if using role-based system)
            'permissions' => function () use ($request) {
                if (!$request->user()) {
                    return [];
                }

                return [
                    'can_manage_users' => $request->user()->role === 'admin',
                    'can_manage_evaluations' => $request->user()->role === 'admin',
                    'can_view_reports' => in_array($request->user()->role, ['admin', 'supervisor']),
                    'can_assign_evaluations' => $request->user()->role === 'admin',
                ];
            },

            // ✨ System Status
            'system' => function () {
                return [
                    'maintenance_mode' => app()->isDownForMaintenance(),
                    'version' => config('app.version', '1.0.0'),
                    'last_updated' => cache()->remember('last_updated', 3600, function () {
                        return now()->toDateTimeString();
                    }),
                ];
            },

            // External session info (for external evaluators)
            'externalSession' => function () use ($request) {
                if ($request->session()->has('external_session_token')) {
                    return [
                        'active' => true,
                        'session_id' => $request->session()->get('external_session_id'),
                    ];
                }
                return null;
            },
        ]);
    }
}