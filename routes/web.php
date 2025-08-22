<?php

use App\Http\Controllers\AdminEvaluationAssignmentController;
use App\Http\Controllers\AdminEvaluationReportController;
use App\Http\Controllers\AdminUserController;
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
    // Debug routes for Cross-Angle Evaluation - REMOVE AFTER DEBUGGING
    Route::get('/debug/evaluation-assignments/{evaluatorId}', function ($evaluatorId) {
        $assignments = \App\Models\EvaluationAssignment::with(['evaluatee'])
            ->where('evaluator_id', $evaluatorId)
            ->get();

        $result = [
            'total_assignments' => $assignments->count(),
            'by_angle'          => $assignments->groupBy('angle')->map(function ($group) {
                return [
                    'count'          => $group->count(),
                    'evaluatee_ids'  => $group->pluck('evaluatee_id')->toArray(),
                    'evaluation_ids' => $group->pluck('evaluation_id')->unique()->toArray(),
                    'details'        => $group->map(function ($assignment) {
                        return [
                            'id'             => $assignment->id,
                            'evaluatee_id'   => $assignment->evaluatee_id,
                            'evaluation_id'  => $assignment->evaluation_id,
                            'evaluatee_name' => $assignment->evaluatee ?
                            $assignment->evaluatee->fname . ' ' . $assignment->evaluatee->lname : 'NOT_FOUND',
                        ];
                    })->toArray(),
                ];
            }),
            'by_evaluation'     => $assignments->groupBy('evaluation_id')->map(function ($group, $evalId) {
                return [
                    'evaluation_id' => $evalId,
                    'count'         => $group->count(),
                    'angles'        => $group->groupBy('angle')->map(function ($angleGroup) {
                        return [
                            'count'         => $angleGroup->count(),
                            'evaluatee_ids' => $angleGroup->pluck('evaluatee_id')->toArray(),
                        ];
                    }),
                ];
            }),
        ];

        return response()->json($result, 200, [], JSON_PRETTY_PRINT);
    });

    Route::get('/debug/cross-angle-evaluation/{evaluatorId}', [AssignedEvaluationController::class, 'debugCrossAngleEvaluation']);

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

    // Helper routes สำหรับสร้างข้อมูลใหม่ใน Admin Form
    Route::post('/admin/departments', [AdminUserController::class, 'storeDepartment'])->name('admin.departments.store');
    Route::post('/admin/factions/store', [AdminUserController::class, 'storeFaction'])->name('admin.factions.store');
    Route::post('/admin/positions', [AdminUserController::class, 'storePosition'])->name('admin.positions.store');

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
        Route::post('/export/weighted', [AdminEvaluationReportController::class, 'exportWeightedReport'])
            ->name('export-weighted');
        Route::post('/export/raw-data', [AdminEvaluationReportController::class, 'exportRawQuestionData'])
            ->name('export-raw-data');
        Route::post('/export/complete', [AdminEvaluationReportController::class, 'exportCompleteEvaluationData'])
            ->name('export-complete');
        Route::post('/export/completion-data', [AdminEvaluationReportController::class, 'exportCompletionData'])
            ->name('export-completion-data');
        Route::post('/export/detailed', [AdminEvaluationReportController::class, 'exportDetailedEvaluationReport'])
            ->name('export-detailed');
        Route::post('/export/individual-detailed', [AdminEvaluationReportController::class, 'exportIndividualDetailed'])
            ->name('export-individual-detailed');
        Route::post('/export/master-report', [AdminEvaluationReportController::class, 'exportMasterEvaluationReport'])
            ->name('export-master-report');
        Route::post('/export-advanced', [AdminEvaluationReportController::class, 'exportAdvanced'])
            ->name('export-advanced');
        
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
        
        // Debug API
        Route::get('/api/debug-completion', [AdminEvaluationReportController::class, 'debugCompletionData'])
            ->name('api.debug-completion');
        Route::get('/api/debug-data', [AdminEvaluationReportController::class, 'debugDataAvailability'])
            ->name('api.debug-data');
        Route::get('/api/quick-debug', [AdminEvaluationReportController::class, 'quickDebug'])
            ->name('api.quick-debug');
        Route::get('/api/debug-participant-count', [AdminEvaluationReportController::class, 'debugParticipantCount'])
            ->name('api.debug-participant-count');
        
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

});
