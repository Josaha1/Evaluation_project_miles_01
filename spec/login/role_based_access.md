# Role-Based Access Control Specification - ระบบประเมิน 360 องศา

## Overview / ภาพรวม

This document details the role-based access control (RBAC) system that manages user permissions and authorization throughout the 360-degree evaluation system.

เอกสารนี้รายละเอียดระบบควบคุมการเข้าถึงแบบบทบาท (RBAC) ที่จัดการสิทธิ์ผู้ใช้และการอนุญาตทั่วทั้งระบบประเมิน 360 องศา

## Role System Overview / ภาพรวมระบบบทบาท

### User Roles / บทบาทผู้ใช้

| Role | Thai Name | Description | Database Value |
|------|-----------|-------------|----------------|
| Admin | ผู้ดูแลระบบ | System administrator with full access | `admin` |
| User | ผู้ใช้ทั่วไป | Regular user with evaluation access | `user` |

### Role Storage / การเก็บข้อมูลบทบาท

```php
// Database schema in users table
Schema::table('users', function (Blueprint $table) {
    $table->string('role')->default('user');
    $table->index('role'); // For efficient role-based queries
});

// User model
class User extends Authenticatable
{
    protected $fillable = [
        'emid', 'fname', 'lname', 'role', // ... other fields
    ];
}
```

## Permission Matrix / เมทริกซ์สิทธิ์

### Admin Permissions / สิทธิ์ผู้ดูแลระบบ

| Feature Area | Permissions | Routes |
|--------------|-------------|---------|
| **User Management** | Create, Read, Update, Delete users | `/admin/users/*` |
| **Evaluation Management** | Manage all evaluations and assignments | `/evaluations/*`, `/admin/assignments/*` |
| **Reports** | Access all reports and analytics | `/admin/reports/*` |
| **System Configuration** | Configure system settings | Admin-only settings |
| **Assignment Management** | Bulk operations, analytics, export | `/admin/assignments/*` |
| **Data Export** | Export all system data | Export endpoints |

### User Permissions / สิทธิ์ผู้ใช้ทั่วไป

| Feature Area | Permissions | Routes |
|--------------|-------------|---------|
| **Profile Management** | Update own profile information | `/profile/*` |
| **Self Evaluation** | Complete self-evaluation forms | `/evaluations/self/*` |
| **Assigned Evaluations** | Complete assigned evaluations of others | `/assigned-evaluations/*` |
| **Dashboard** | View own dashboard and progress | `/dashboard` |
| **Satisfaction Survey** | Complete satisfaction evaluations | `/satisfaction-evaluation/*` |

## Role-Based Routing / การกำหนดเส้นทางตามบทบาท

### Route Structure / โครงสร้างเส้นทาง

```php
// routes/web.php

// Guest routes (no authentication required)
Route::middleware('guest')->group(function () {
    Route::get('/', [HomeController::class, 'welcome'])->name('home');
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// General authenticated routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

// User role specific routes
Route::middleware(['auth', 'role:user'])->group(function () {
    Route::get('/dashboard', [EvaluationAssignmentController::class, 'index'])->name('dashboard');
    Route::get('/evaluations/self', [SelfEvaluationController::class, 'index'])->name('evaluationsself.index');
    Route::post('/evaluations/self/questions/{step}', [SelfEvaluationController::class, 'step'])->name('evaluations.self.step');
    Route::get('/assigned-evaluations/{evaluateeId}', [AssignedEvaluationController::class, 'show'])->name('assigned-evaluations.show');
});

// Admin role specific routes
Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboardadmin', function () {
        return app(HomeController::class)->admindashboard();
    })->name('admindashboard');
    
    // User management
    Route::prefix('admin/users')->name('admin.users.')->group(function () {
        Route::get('/', [AdminUserController::class, 'index'])->name('index');
        Route::get('/create', [AdminUserController::class, 'create'])->name('create');
        Route::post('/', [AdminUserController::class, 'store'])->name('store');
        Route::get('/{user}/edit', [AdminUserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [AdminUserController::class, 'update'])->name('update');
        Route::delete('/{user}', [AdminUserController::class, 'destroy'])->name('destroy');
    });
});
```

## Role Middleware Implementation / การดำเนินการ Role Middleware

### RoleMiddleware Class / คลาส RoleMiddleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * จัดการคำขอที่เข้ามา
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check authentication
        if (!Auth::check()) {
            return $this->unauthorizedResponse($request, 'Authentication required.');
        }

        // Check role authorization
        $userRole = Auth::user()->role;
        if (!in_array($userRole, $roles)) {
            return $this->unauthorizedResponse($request, 'Insufficient permissions.');
        }

        return $next($request);
    }

    /**
     * Return unauthorized response
     * ส่งกลับการตอบสนองไม่ได้รับอนุญาต
     */
    private function unauthorizedResponse($request, $message)
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 403);
        }

        return Inertia::render('errors/unauthorized', [
            'message' => $message,
        ])->toResponse($request)->setStatusCode(403);
    }
}
```

### Middleware Registration / การลงทะเบียน Middleware

```php
// app/Http/Kernel.php or bootstrap/app.php
protected $routeMiddleware = [
    // ... other middleware
    'role' => \App\Http\Middleware\RoleMiddleware::class,
];
```

## Dashboard Redirection Logic / ตรรกะการเปลี่ยนเส้นทางแดชบอร์ด

### Login Controller Redirection / การเปลี่ยนเส้นทางใน Login Controller

```php
// LoginController@login
if (Auth::attempt($credentials, $remember)) {
    // ... security measures ...
    
    // Role-based dashboard redirection
    if (Auth::user()->role === 'admin') {
        return redirect()->route('admindashboard')
                       ->with('success', 'ยินดีต้อนรับกลับ Admin!');
    }

    return redirect()->route('dashboard')
                   ->with('success', 'ยินดีต้อนรับกลับ!');
}
```

### Dashboard Access Control / การควบคุมการเข้าถึงแดชบอร์ด

```php
// Admin dashboard controller
Route::get('/dashboardadmin', function () {
    // Double-check authorization
    if (Auth::user()->role !== 'admin') {
        abort(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    }
    return app(HomeController::class)->admindashboard();
})->name('admindashboard');
```

## Permission Sharing with Frontend / การแชร์สิทธิ์กับ Frontend

### Inertia Middleware Integration / การเชื่อมต่อ Inertia Middleware

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        // User authentication state
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->fname . ' ' . $request->user()->lname,
                'role' => $request->user()->role,
                'grade' => $request->user()->grade,
                'user_type' => $request->user()->user_type,
                // ... other user data
            ] : null,
        ],

        // Role-based permissions
        'permissions' => function () use ($request) {
            if (!$request->user()) {
                return [];
            }

            return [
                'can_manage_users' => $request->user()->role === 'admin',
                'can_manage_evaluations' => $request->user()->role === 'admin',
                'can_view_reports' => in_array($request->user()->role, ['admin', 'supervisor']),
                'can_assign_evaluations' => $request->user()->role === 'admin',
                'can_export_data' => $request->user()->role === 'admin',
            ];
        },
    ]);
}
```

### Frontend Permission Usage / การใช้สิทธิ์ใน Frontend

```typescript
// React component example
import { usePage } from '@inertiajs/react';

interface PageProps {
    auth: {
        user: User | null;
    };
    permissions: {
        can_manage_users: boolean;
        can_manage_evaluations: boolean;
        can_view_reports: boolean;
        can_assign_evaluations: boolean;
        can_export_data: boolean;
    };
}

export default function NavigationComponent() {
    const { auth, permissions } = usePage<PageProps>().props;

    return (
        <nav>
            {auth.user && (
                <>
                    <Link href="/dashboard">Dashboard</Link>
                    
                    {permissions.can_manage_users && (
                        <Link href="/admin/users">Manage Users</Link>
                    )}
                    
                    {permissions.can_view_reports && (
                        <Link href="/admin/reports">Reports</Link>
                    )}
                    
                    {auth.user.role === 'admin' && (
                        <Link href="/dashboardadmin">Admin Dashboard</Link>
                    )}
                </>
            )}
        </nav>
    );
}
```

## Evaluation-Specific Authorization / การอนุญาตเฉพาะการประเมิน

### User Model Authorization Methods / เมธอดการอนุญาตใน User Model

```php
// app/Models/User.php
class User extends Authenticatable
{
    /**
     * Get required evaluation angles based on user grade
     * ได้รับมุมการประเมินที่จำเป็นตามเกรดผู้ใช้
     */
    public function getRequiredEvaluationAngles()
    {
        $grade = (int) $this->grade;
        return $grade >= 9 ? ['บน', 'ล่าง', 'ซ้าย', 'ขวา'] : ['บน', 'ซ้าย'];
    }

    /**
     * Check if user can evaluate another user from specific angle
     * ตรวจสอบว่าผู้ใช้สามารถประเมินผู้ใช้อื่นจากมุมที่ระบุได้หรือไม่
     */
    public function canEvaluateUser($userId, $angle)
    {
        $targetUser = self::find($userId);
        if (!$targetUser) {
            return false;
        }

        $myGrade = (int) $this->grade;
        $targetGrade = (int) $targetUser->grade;

        switch ($angle) {
            case 'บน':  // Superior evaluation
                return $myGrade > $targetGrade;
            case 'ล่าง': // Subordinate evaluation
                return $myGrade < $targetGrade;
            case 'ซ้าย': // Peer evaluation (same level)
                return $myGrade === $targetGrade;
            case 'ขวา': // External evaluation
                return $this->user_type === 'external';
            default:
                return false;
        }
    }

    /**
     * Check if evaluation is complete for fiscal year
     * ตรวจสอบว่าการประเมินเสร็จสมบูรณ์สำหรับปีงบประมาณหรือไม่
     */
    public function isEvaluationComplete($fiscalYear)
    {
        $requiredAngles = $this->getRequiredEvaluationAngles();
        $assignedAngles = $this->assignmentsAsEvaluatee()
            ->where('fiscal_year', $fiscalYear)
            ->distinct('angle')
            ->pluck('angle')
            ->toArray();

        return count(array_intersect($requiredAngles, $assignedAngles)) === count($requiredAngles);
    }
}
```

### Assignment Authorization / การอนุญาตการมอบหมาย

```php
// Controller authorization example
class AssignedEvaluationController extends Controller
{
    public function show($evaluateeId)
    {
        $evaluatee = User::findOrFail($evaluateeId);
        $evaluator = Auth::user();
        
        // Check if user has assignment to evaluate this person
        $assignment = EvaluationAssignment::where('evaluator_id', $evaluator->id)
            ->where('evaluatee_id', $evaluatee->id)
            ->first();
            
        if (!$assignment) {
            abort(403, 'คุณไม่ได้รับมอบหมายให้ประเมินบุคคลนี้');
        }
        
        // Additional authorization check
        if (!$evaluator->canEvaluateUser($evaluateeId, $assignment->angle)) {
            abort(403, 'คุณไม่มีสิทธิ์ประเมินบุคคลนี้ในมุมที่ระบุ');
        }
        
        return Inertia::render('AssignedEvaluationStep', [
            'evaluatee' => $evaluatee,
            'assignment' => $assignment,
        ]);
    }
}
```

## Administrative Controls / การควบคุมการดูแลระบบ

### Admin-Only Features / คุณสมบัติเฉพาะผู้ดูแลระบบ

```php
// Example admin controller with authorization
class AdminUserController extends Controller
{
    public function __construct()
    {
        // Ensure all methods require admin role
        $this->middleware(['auth', 'role:admin']);
    }

    public function index()
    {
        // Additional check for paranoid security
        $this->authorize('viewAny', User::class);
        
        return Inertia::render('AdminUserManager', [
            'users' => User::with(['position', 'division', 'department', 'faction'])
                          ->paginate(20),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', User::class);
        
        $validated = $request->validate([
            'emid' => 'required|digits:6|unique:users',
            'fname' => 'required|string|max:255',
            'lname' => 'required|string|max:255',
            'role' => 'required|in:admin,user',
            // ... other validation rules
        ]);

        User::create($validated);
        
        return redirect()->route('admin.users.index')
                       ->with('success', 'สร้างผู้ใช้เรียบร้อยแล้ว');
    }
}
```

### Policy-Based Authorization / การอนุญาตแบบนโยบาย

```php
// app/Policies/UserPolicy.php
class UserPolicy
{
    /**
     * Determine if user can view any users
     */
    public function viewAny(User $user)
    {
        return $user->role === 'admin';
    }

    /**
     * Determine if user can view specific user
     */
    public function view(User $user, User $model)
    {
        // Admin can view all, users can view themselves
        return $user->role === 'admin' || $user->id === $model->id;
    }

    /**
     * Determine if user can create users
     */
    public function create(User $user)
    {
        return $user->role === 'admin';
    }

    /**
     * Determine if user can update users
     */
    public function update(User $user, User $model)
    {
        // Admin can update all, users can update themselves (limited fields)
        return $user->role === 'admin' || $user->id === $model->id;
    }

    /**
     * Determine if user can delete users
     */
    public function delete(User $user, User $model)
    {
        return $user->role === 'admin' && $user->id !== $model->id; // Can't delete self
    }
}
```

## Error Handling and Unauthorized Access / การจัดการข้อผิดพลาดและการเข้าถึงที่ไม่ได้รับอนุญาต

### Unauthorized Error Page / หน้าแสดงข้อผิดพลาดไม่ได้รับอนุญาต

```typescript
// resources/js/pages/errors/unauthorized.tsx
import { Head } from '@inertiajs/react';

interface Props {
    message?: string;
}

export default function Unauthorized({ message = 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้' }: Props) {
    return (
        <>
            <Head title="ไม่ได้รับอนุญาต" />
            
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            ไม่ได้รับอนุญาต
                        </h1>
                        
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => window.history.back()}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                กลับไปหน้าก่อนหน้า
                            </button>
                            
                            <a
                                href="/"
                                className="block w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-center"
                            >
                                กลับหน้าแรก
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
```

### Exception Handling / การจัดการข้อยกเว้น

```php
// app/Exceptions/Handler.php
public function render($request, Throwable $exception)
{
    // Handle authorization exceptions
    if ($exception instanceof AuthorizationException) {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'ไม่ได้รับอนุญาต',
                'error' => $exception->getMessage(),
            ], 403);
        }

        return Inertia::render('errors/unauthorized', [
            'message' => $exception->getMessage() ?: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
        ])->toResponse($request)->setStatusCode(403);
    }

    return parent::render($request, $exception);
}
```

## Role-Based Testing / การทดสอบแบบบทบาท

### Unit Tests for Authorization / การทดสอบหน่วยสำหรับการอนุญาต

```php
// tests/Unit/RoleAuthorizationTest.php
class RoleAuthorizationTest extends TestCase
{
    public function test_admin_can_access_admin_dashboard()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)->get('/dashboardadmin');
        
        $response->assertOk();
    }

    public function test_user_cannot_access_admin_dashboard()
    {
        $user = User::factory()->create(['role' => 'user']);
        
        $response = $this->actingAs($user)->get('/dashboardadmin');
        
        $response->assertStatus(403);
    }

    public function test_user_can_access_user_dashboard()
    {
        $user = User::factory()->create(['role' => 'user']);
        
        $response = $this->actingAs($user)->get('/dashboard');
        
        $response->assertOk();
    }

    public function test_guest_redirected_to_login()
    {
        $response = $this->get('/dashboard');
        
        $response->assertRedirect('/login');
    }
}
```

### Feature Tests for Role-Based Features / การทดสอบฟีเจอร์สำหรับคุณสมบัติแบบบทบาท

```php
// tests/Feature/AdminUserManagementTest.php
class AdminUserManagementTest extends TestCase
{
    public function test_admin_can_create_users()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)->post('/admin/users', [
            'emid' => '123456',
            'fname' => 'Test',
            'lname' => 'User',
            'role' => 'user',
            'password' => '01012568',
        ]);
        
        $response->assertRedirect('/admin/users');
        $this->assertDatabaseHas('users', ['emid' => '123456']);
    }

    public function test_regular_user_cannot_create_users()
    {
        $user = User::factory()->create(['role' => 'user']);
        
        $response = $this->actingAs($user)->post('/admin/users', [
            'emid' => '123456',
            'fname' => 'Test',
            'lname' => 'User',
        ]);
        
        $response->assertStatus(403);
    }
}
```

## Security Considerations / ข้อพิจารณาด้านความปลอดภัย

### 1. Defense in Depth / การป้องกันแบบหลายชั้น

```php
// Multiple authorization layers
// 1. Route middleware
Route::middleware(['auth', 'role:admin'])->group(function () {
    // 2. Controller middleware
    $this->middleware('role:admin');
    
    // 3. Policy authorization
    $this->authorize('create', User::class);
    
    // 4. Manual checks
    if (Auth::user()->role !== 'admin') {
        abort(403);
    }
});
```

### 2. Privilege Escalation Prevention / การป้องกันการเพิ่มสิทธิ์

```php
// Prevent users from modifying their own roles
public function update(Request $request, User $user)
{
    $validated = $request->validate([
        'fname' => 'required|string',
        'lname' => 'required|string',
        // Role can only be changed by admin, and not for self
    ]);

    // Prevent role modification unless admin changing other user
    if ($request->has('role')) {
        if (Auth::user()->role !== 'admin' || Auth::id() === $user->id) {
            throw new AuthorizationException('Cannot modify role');
        }
        $validated['role'] = $request->role;
    }

    $user->update($validated);
}
```

### 3. Session Role Validation / การตรวจสอบบทบาทในเซสชัน

```php
// Ensure role hasn't changed during session
public function handle($request, Closure $next, ...$roles)
{
    if (!Auth::check()) {
        return redirect()->route('login');
    }

    // Refresh user from database to get latest role
    $user = Auth::user()->fresh();
    if (!$user || !in_array($user->role, $roles)) {
        Auth::logout();
        return redirect()->route('login')->with('error', 'Session expired due to role change');
    }

    return $next($request);
}
```

## Future Enhancements / การปรับปรุงในอนาคต

### 1. Advanced Permission System / ระบบสิทธิ์ขั้นสูง

```php
// Potential enhancement: granular permissions
// Instead of just roles, implement specific permissions
class Permission extends Model
{
    protected $fillable = ['name', 'description'];
}

class Role extends Model
{
    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }
}

// User can have multiple roles
class User extends Authenticatable
{
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasPermission($permission)
    {
        return $this->roles->pluck('permissions')->flatten()->contains('name', $permission);
    }
}
```

### 2. Department-Based Authorization / การอนุญาตแบบหน่วยงาน

```php
// Enhanced authorization based on organizational structure
public function canManageDepartment($departmentId)
{
    return $this->role === 'admin' || 
           ($this->role === 'supervisor' && $this->department_id === $departmentId);
}

public function canViewReports($departmentId = null)
{
    if ($this->role === 'admin') {
        return true;
    }
    
    if ($this->role === 'supervisor') {
        return !$departmentId || $this->department_id === $departmentId;
    }
    
    return false;
}
```

### 3. Time-Based Access Control / การควบคุมการเข้าถึงแบบเวลา

```php
// Evaluation period restrictions
public function canCompleteEvaluation($evaluationId)
{
    $evaluation = Evaluation::find($evaluationId);
    
    if (!$evaluation) {
        return false;
    }
    
    $now = now();
    return $now->between($evaluation->start_date, $evaluation->end_date);
}
```