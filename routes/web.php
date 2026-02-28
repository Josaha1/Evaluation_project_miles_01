<?php

use App\Http\Controllers\AdminAccessCodeController;
use App\Http\Controllers\AdminDepartmentController;
use App\Http\Controllers\AdminDivisionController;
use App\Http\Controllers\AdminEvaluationAssignmentController;
use App\Http\Controllers\AdminEvaluationReportController;
use App\Http\Controllers\AdminExternalOrganizationController;
use App\Http\Controllers\AdminFactionController;
use App\Http\Controllers\AdminPositionController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ExternalEvaluatorController;
use App\Http\Controllers\AspectController;
use App\Http\Controllers\AssignedEvaluationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\EvaluationAssignmentController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\SelfEvaluationController;
use App\Http\Controllers\SubAspectController;
use App\Http\Controllers\SatisfactionEvaluationController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| เส้นทางสำหรับผู้ประเมินภายนอก (External Evaluator Routes)
|--------------------------------------------------------------------------
*/

// Guest external routes (ไม่ต้อง auth)
Route::prefix('external')->name('external.')->group(function () {
    Route::get('/login', [ExternalEvaluatorController::class, 'showLogin'])->name('login');
    Route::post('/login', [ExternalEvaluatorController::class, 'login'])->name('login.submit')->middleware('throttle:5,1');
    Route::post('/logout', [ExternalEvaluatorController::class, 'logout'])->name('logout');
    Route::get('/thank-you', [ExternalEvaluatorController::class, 'showThankYou'])->name('thank-you');
});

// External auth routes (ต้องมี external session)
Route::prefix('external')->name('external.')->middleware('external')->group(function () {
    Route::get('/evaluate', [ExternalEvaluatorController::class, 'showEvaluation'])->name('evaluate');
    Route::post('/evaluate', [ExternalEvaluatorController::class, 'submitEvaluation'])->name('evaluate.submit');
});

/*
|--------------------------------------------------------------------------
| เส้นทางสำหรับผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบ (Guest Routes)
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/', [HomeController::class, 'welcome'])->name('home');
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
Route::get('/cookie-policy', function () {
    return Inertia::render('CookiePolicy');
})->name('cookie.policy');

/*
|--------------------------------------------------------------------------
| เส้นทางสำหรับผู้ใช้ทั่วไป (User Profile Management)
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::get('/profile/edit', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Profile helper routes for creating new options
    Route::post('/profile/departments', [ProfileController::class, 'storeDepartment'])->name('profile.departments.store');
    Route::post('/profile/factions', [ProfileController::class, 'storeFaction'])->name('profile.factions.store');
    Route::post('/profile/positions', [ProfileController::class, 'storePosition'])->name('profile.positions.store');
});

/*
|--------------------------------------------------------------------------
| เส้นทางสำหรับผู้ใช้ role user (User Dashboard & Evaluations)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:user'])->group(function () {
    // แสดงหน้าเริ่มต้นประเมินตนเอง
    Route::get('/dashboard', [EvaluationAssignmentController::class, 'index'])->name('dashboard');
    Route::get('/evaluations/self', [SelfEvaluationController::class, 'index'])->name('evaluationsself.index');
    Route::post('/evaluations/self/questions/{step}', [SelfEvaluationController::class, 'step'])->name('evaluations.self.step');
    Route::get('/evaluations/self/questions/{step}', function () {
        return redirect()->route('dashboard')->with('error', 'ไม่สามารถเข้าถึงแบบประเมินผ่าน URL ตรงได้');
    });

    Route::post('/evaluations/self/save-answer', [SelfEvaluationController::class, 'saveAnswer'])->name('evaluations.self.saveAnswer');
    Route::get('/evaluations/self/questions/{step}', [SelfEvaluationController::class, 'showStep'])->name('evaluations.self.questions');
    Route::get('/evaluations/self/resume', [SelfEvaluationController::class, 'resume'])->name('evaluationsself.resume');
    Route::post('/evaluations/self/submit', [SelfEvaluationController::class, 'submit'])->name('evaluations.self.submit');

    Route::get('/assigned-evaluations/{evaluateeId}', [AssignedEvaluationController::class, 'show'])
        ->name('assigned-evaluations.show');
    Route::post('/assigned-evaluations/{evaluatee}/step/{step}', [AssignedEvaluationController::class, 'step'])
        ->name('assigned-evaluations.step');
    Route::get('/assigned-evaluations/{evaluatee}/step/{step}', [AssignedEvaluationController::class, 'showStep'])
        ->name('assigned-evaluations.questions');

    // API endpoint for peer comparison
    Route::get('/assigned-evaluations/{evaluatee}/peer-comparison', [AssignedEvaluationController::class, 'getPeerComparison'])
        ->name('assigned-evaluations.peer-comparison');

    // API endpoint for getting assigned evaluatees
    Route::get('/assigned-evaluations/evaluatees', [AssignedEvaluationController::class, 'getAssignedEvaluatees'])
        ->name('assigned-evaluations.evaluatees');

    // API endpoint for getting evaluatees in same angle
    Route::get('/assigned-evaluations/{evaluatee}/same-angle', [AssignedEvaluationController::class, 'getEvaluateesByAngle'])
        ->name('assigned-evaluations.same-angle');

    // Satisfaction Evaluation Routes
    Route::get('/satisfaction-evaluation/{evaluationId}', [SatisfactionEvaluationController::class, 'show'])
        ->name('satisfaction.show');
    Route::post('/satisfaction-evaluation/{evaluationId}', [SatisfactionEvaluationController::class, 'store'])
        ->name('satisfaction.store');
    Route::get('/satisfaction-evaluation/{evaluationId}/status', [SatisfactionEvaluationController::class, 'checkStatus'])
        ->name('satisfaction.status');

    // จัดการการมอบหมายการประเมิน (สำหรับ user ทั่วไป)
    Route::get('/assignments', [EvaluationAssignmentController::class, 'index'])->name('assignments.index');
    Route::get('/assignments/create', [EvaluationAssignmentController::class, 'create'])->name('assignments.create');
    Route::post('/assignments', [EvaluationAssignmentController::class, 'store'])->name('assignments.store');
    Route::delete('/assignments/{assignment}', [EvaluationAssignmentController::class, 'destroy'])->name('assignments.destroy');
});

/*
|--------------------------------------------------------------------------
| เส้นทางสำหรับผู้ดูแลระบบ role admin (Admin Management)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboardadmin', function () {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
        return app(HomeController::class)->admindashboard();
    })->name('admindashboard');

    /*
    |--------------------------------------------------------------------------
    | Admin User Management (จัดการสมาชิกทั้งหมด)
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin/users')->name('admin.users.')->group(function () {
        Route::get('/', [AdminUserController::class, 'index'])->name('index');
        Route::get('/create', [AdminUserController::class, 'create'])->name('create');
        Route::post('/', [AdminUserController::class, 'store'])->name('store');
        Route::get('/{user}/edit', [AdminUserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [AdminUserController::class, 'update'])->name('update');
        Route::delete('/{user}', [AdminUserController::class, 'destroy'])->name('destroy');
    });

    // Helper routes สำหรับสร้างข้อมูลใหม่ใน Admin Form (inline create)
    Route::post('/admin/departments/quick', [AdminUserController::class, 'storeDepartment'])->name('admin.departments.quick-store');
    Route::post('/admin/factions/quick', [AdminUserController::class, 'storeFaction'])->name('admin.factions.quick-store');
    Route::post('/admin/positions/quick', [AdminUserController::class, 'storePosition'])->name('admin.positions.quick-store');

    /*
    |--------------------------------------------------------------------------
    | Organizational Structure Management (CRUD)
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin/divisions')->name('admin.divisions.')->group(function () {
        Route::get('/', [AdminDivisionController::class, 'index'])->name('index');
        Route::get('/create', [AdminDivisionController::class, 'create'])->name('create');
        Route::post('/', [AdminDivisionController::class, 'store'])->name('store');
        Route::get('/{division}/edit', [AdminDivisionController::class, 'edit'])->name('edit');
        Route::put('/{division}', [AdminDivisionController::class, 'update'])->name('update');
        Route::delete('/{division}', [AdminDivisionController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('admin/departments')->name('admin.departments.')->group(function () {
        Route::get('/', [AdminDepartmentController::class, 'index'])->name('index');
        Route::get('/create', [AdminDepartmentController::class, 'create'])->name('create');
        Route::post('/', [AdminDepartmentController::class, 'store'])->name('store');
        Route::get('/{department}/edit', [AdminDepartmentController::class, 'edit'])->name('edit');
        Route::put('/{department}', [AdminDepartmentController::class, 'update'])->name('update');
        Route::delete('/{department}', [AdminDepartmentController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('admin/positions')->name('admin.positions.')->group(function () {
        Route::get('/', [AdminPositionController::class, 'index'])->name('index');
        Route::get('/create', [AdminPositionController::class, 'create'])->name('create');
        Route::post('/', [AdminPositionController::class, 'store'])->name('store');
        Route::get('/{position}/edit', [AdminPositionController::class, 'edit'])->name('edit');
        Route::put('/{position}', [AdminPositionController::class, 'update'])->name('update');
        Route::delete('/{position}', [AdminPositionController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('admin/factions')->name('admin.factions.')->group(function () {
        Route::get('/', [AdminFactionController::class, 'index'])->name('index');
        Route::get('/create', [AdminFactionController::class, 'create'])->name('create');
        Route::post('/', [AdminFactionController::class, 'store'])->name('store');
        Route::get('/{faction}/edit', [AdminFactionController::class, 'edit'])->name('edit');
        Route::put('/{faction}', [AdminFactionController::class, 'update'])->name('update');
        Route::delete('/{faction}', [AdminFactionController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Evaluation Assignment Management (แก้ไขแล้ว - ลบ routes ซ้ำ)
    |--------------------------------------------------------------------------
    */

    // Main assignment routes
    Route::prefix('admin/assignments')->name('assignments.')->group(function () {
        Route::get('/', [AdminEvaluationAssignmentController::class, 'index'])->name('index');
        Route::get('/create', [AdminEvaluationAssignmentController::class, 'create'])->name('create');
        Route::post('/', [AdminEvaluationAssignmentController::class, 'store'])->name('store');
        Route::get('/{evaluateeId}/edit', [AdminEvaluationAssignmentController::class, 'edit'])->name('edit');
        Route::put('/{evaluateeId}', [AdminEvaluationAssignmentController::class, 'update'])->name('update');
        Route::delete('/{assignment}', [AdminEvaluationAssignmentController::class, 'destroy'])->name('destroy');

        // Bulk operations (ใหม่)
        Route::post('/bulk-store', [AdminEvaluationAssignmentController::class, 'bulkStore'])->name('bulk-store');
        Route::delete('/bulk-delete', [AdminEvaluationAssignmentController::class, 'bulkDestroy'])->name('bulk-delete');

        // Analytics and export
        Route::get('/analytics', [AdminEvaluationAssignmentController::class, 'getAnalytics'])->name('analytics');
        Route::get('/export', [AdminEvaluationAssignmentController::class, 'export'])->name('export');
        Route::get('/stats', [AdminEvaluationAssignmentController::class, 'getOverallStats'])->name('stats');

        // API routes for AJAX calls
        Route::get('/evaluatee-info', [AdminEvaluationAssignmentController::class, 'getEvaluateeInfo'])->name('evaluatee-info');
        Route::get('/evaluators-by-angle', [AdminEvaluationAssignmentController::class, 'getEvaluatorsByAngle'])->name('evaluators-by-angle');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Question Management
    |--------------------------------------------------------------------------
    */
    Route::get('/evaluations/{evaluation}/parts/{part}/questions', [QuestionController::class, 'index'])
        ->name('questions.index');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/questions', [QuestionController::class, 'index'])
        ->name('questions.index.aspect');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}/questions', [QuestionController::class, 'index'])
        ->name('questions.index.subaspect');
    Route::get('/evaluations/{evaluation}/parts/{part}/questions/create', [QuestionController::class, 'create'])
        ->name('questions.create');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/questions/{question}/edit', [QuestionController::class, 'edit'])
        ->name('questions.aspect.edit');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}/questions/{question}/edit', [QuestionController::class, 'edit'])
        ->name('questions.subaspect.edit');
    Route::delete('/evaluations/{evaluation}/parts/{part}/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
    Route::post('/evaluations/{evaluation}/parts/{part}/questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::put('/evaluations/{evaluation}/parts/{part}/questions/{question}', [QuestionController::class, 'update'])
        ->name('questions.update');

    /*
    |--------------------------------------------------------------------------
    | Admin Parts Management
    |--------------------------------------------------------------------------
    */
    Route::get('/evaluations/{evaluation}/parts', [PartController::class, 'index'])->name('parts.index');
    Route::get('/evaluations/{evaluation}/parts/create', [PartController::class, 'create'])->name('parts.create');
    Route::get('/evaluations/{evaluation}/parts/{part}/edit', [PartController::class, 'edit'])->name('parts.edit');
    Route::post('/evaluations/{evaluation}/parts', [PartController::class, 'store'])->name('parts.store');
    Route::delete('/evaluations/{evaluation}/parts/{part}', [PartController::class, 'destroy'])->name('parts.destroy');
    Route::put('/evaluations/{evaluation}/parts/{part}', [PartController::class, 'update'])->name('parts.update');

    /*
    |--------------------------------------------------------------------------
    | Admin Aspects Management
    |--------------------------------------------------------------------------
    */
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects', [AspectController::class, 'index'])
        ->name('aspects.index');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/create', [AspectController::class, 'create'])->name('aspects.create');
    Route::post('/evaluations/{evaluation}/parts/{part}/aspects', [AspectController::class, 'store'])->name('aspects.store');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/edit', [AspectController::class, 'edit'])->name('aspects.edit');
    Route::put('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}', [AspectController::class, 'update'])->name('aspects.update');
    Route::delete('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}', [AspectController::class, 'destroy'])->name('aspects.destroy');
    /*
    |--------------------------------------------------------------------------
    | Admin SubAspects Management
    |--------------------------------------------------------------------------
    */
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects', [SubAspectController::class, 'index'])->name('subaspects.index');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/create', [SubAspectController::class, 'create'])->name('subaspects.create');
    Route::post('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects', [SubAspectController::class, 'store'])->name('subaspects.store');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}/edit', [SubAspectController::class, 'edit'])->name('subaspects.edit');
    Route::put('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}', [SubAspectController::class, 'update'])->name('subaspects.update');

    /*
    |--------------------------------------------------------------------------
    | Admin Evaluations Management
    |--------------------------------------------------------------------------
    */
    Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
    Route::get('/evaluations/create', [EvaluationController::class, 'create'])->name('evaluations.create');
    Route::post('/evaluations', [EvaluationController::class, 'store'])->name('evaluations.store');
    Route::get('/evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])->name('evaluations.edit');
    Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('evaluations.update');
    Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluations.destroy');
    Route::get('/evaluations/{evaluation}/preview', [EvaluationController::class, 'preview'])
        ->name('evaluations.preview');
    Route::patch('/evaluations/{evaluation}/publish', [EvaluationController::class, 'publish'])
        ->name('evaluations.publish');

    /*
    |--------------------------------------------------------------------------
    | Admin Reports - Evaluation 360 Report System
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin/reports/evaluation')->name('admin.evaluation-report.')->group(function () {
        // Main report dashboard
        Route::get('/', [AdminEvaluationReportController::class, 'index'])->name('index');

        // Export functionality
        Route::post('/export/individual', [AdminEvaluationReportController::class, 'exportIndividual'])
            ->name('export-individual');
        Route::post('/export/raw-data', [AdminEvaluationReportController::class, 'exportRawQuestionData'])
            ->name('export-raw-data');
        Route::post('/export/completion-data', [AdminEvaluationReportController::class, 'exportCompletionData'])
            ->name('export-completion-data');
        Route::post('/export/detailed', [AdminEvaluationReportController::class, 'exportDetailedEvaluationReport'])
            ->name('export-detailed');
        Route::post('/export/individual-detailed', [AdminEvaluationReportController::class, 'exportIndividualDetailed'])
            ->name('export-individual-detailed');
        
        // PDF export methods - text content only, no images
        Route::post('/export/individual-pdf', [AdminEvaluationReportController::class, 'exportIndividualPdf'])
            ->name('export-individual-pdf');
        Route::post('/export/comprehensive-pdf', [AdminEvaluationReportController::class, 'exportComprehensivePdf'])
            ->name('export-comprehensive-pdf');
        
        // New export methods for React component
        Route::post('/export/summary', [AdminEvaluationReportController::class, 'exportSummary'])
            ->name('export-summary');
        Route::post('/export/comparison', [AdminEvaluationReportController::class, 'exportComparison'])
            ->name('export-comparison');
        
        // Enhanced export methods with option mapping
        Route::post('/export/comprehensive', [AdminEvaluationReportController::class, 'exportComprehensiveReport'])
            ->name('export-comprehensive');
        Route::post('/export/executives', [AdminEvaluationReportController::class, 'exportExecutiveReport'])
            ->name('export-executives');  
        Route::post('/export/employees', [AdminEvaluationReportController::class, 'exportEmployeeReport'])
            ->name('export-employees');
        Route::post('/export/self-evaluation', [AdminEvaluationReportController::class, 'exportSelfEvaluationReport'])
            ->name('export-self-evaluation');
        Route::post('/export/governors', [AdminEvaluationReportController::class, 'exportGovernorReport'])
            ->name('export-governors');
        Route::post('/export/detailed-data', [AdminEvaluationReportController::class, 'exportDetailedEvaluationData'])
            ->name('export-detailed-data');

        // Data API endpoints
        Route::get('/api/dashboard-data', [AdminEvaluationReportController::class, 'getDashboardData'])
            ->name('api.dashboard-data');
        Route::get('/api/completion-stats', [AdminEvaluationReportController::class, 'getCompletionStats'])
            ->name('api.completion-stats');
        Route::get('/api/real-time-data', [AdminEvaluationReportController::class, 'getRealTimeData'])
            ->name('api.real-time-data');

        // System management API
        Route::post('/api/clear-cache', [AdminEvaluationReportController::class, 'clearCache'])
            ->name('api.clear-cache');
        Route::get('/api/system-health', [AdminEvaluationReportController::class, 'getSystemHealth'])
            ->name('api.system-health');
        
        // Individual angle report API
        Route::get('/api/individual-angle-report', [AdminEvaluationReportController::class, 'getIndividualAngleReport'])
            ->name('api.individual-angle-report');
        // User details API for individual modal
        Route::get('/api/user-details/{userId}', [AdminEvaluationReportController::class, 'getUserDetails'])
            ->name('user-details');
        
        // Evaluatee details API for evaluatee details modal
        Route::get('/api/evaluatee-details/{evaluateeId}', [AdminEvaluationReportController::class, 'getEvaluateeDetails'])
            ->name('evaluatee-details');

        // Legacy support routes
        Route::get('/list-evaluatees', [AdminEvaluationReportController::class, 'listEvaluatees'])
            ->name('list-evaluatees');
    });

    // Admin Satisfaction Evaluation Results
    Route::get('/admin/satisfaction-evaluation/{evaluationId}/results', [SatisfactionEvaluationController::class, 'results'])
        ->name('admin.satisfaction.results');

    /*
    |--------------------------------------------------------------------------
    | Admin External Organization Management
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin/external-organizations')->name('admin.external-organizations.')->group(function () {
        Route::get('/', [AdminExternalOrganizationController::class, 'index'])->name('index');
        Route::get('/create', [AdminExternalOrganizationController::class, 'create'])->name('create');
        Route::post('/', [AdminExternalOrganizationController::class, 'store'])->name('store');
        Route::get('/{external_organization}/edit', [AdminExternalOrganizationController::class, 'edit'])->name('edit');
        Route::put('/{external_organization}', [AdminExternalOrganizationController::class, 'update'])->name('update');
        Route::delete('/{external_organization}', [AdminExternalOrganizationController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Access Code Management
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin/access-codes')->name('admin.access-codes.')->group(function () {
        Route::get('/', [AdminAccessCodeController::class, 'index'])->name('index');
        Route::get('/create', [AdminAccessCodeController::class, 'create'])->name('create');
        Route::post('/generate', [AdminAccessCodeController::class, 'generate'])->name('generate');
        Route::get('/export', [AdminAccessCodeController::class, 'exportCodes'])->name('export');
        Route::post('/print-cards', [AdminAccessCodeController::class, 'printCards'])->name('print-cards');
        Route::get('/{accessCode}', [AdminAccessCodeController::class, 'show'])->name('show');
        Route::put('/{accessCode}/revoke', [AdminAccessCodeController::class, 'revoke'])->name('revoke');
        Route::delete('/{accessCode}', [AdminAccessCodeController::class, 'destroy'])->name('destroy');
    });

});
