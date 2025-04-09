<?php

use App\Http\Controllers\AspectController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\SectionController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminEvaluationAssignmentController;
/*
|--------------------------------------------------------------------------
| เส้นทางสำหรับผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบ (Guest Routes)
|--------------------------------------------------------------------------
|
| เส้นทางในกลุ่มนี้จะใช้ middleware 'guest' ซึ่งจะอนุญาตให้เข้าถึงได้
| เฉพาะผู้ใช้ที่ยังไม่ได้เข้าสู่ระบบเท่านั้น หากผู้ใช้เข้าสู่ระบบแล้ว
| จะถูกเปลี่ยนเส้นทางไปยังหน้าหลัก
|
*/

Route::middleware('guest')->group(function () {
    Route::get('/', [HomeController::class, 'welcome'])->name('home');
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboardadmin', function () {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
        return app(HomeController::class)->admindashboard();
    })->name('admindashboard');

    Route::middleware(['auth'])->prefix('admin')->group(function () {
        Route::get('/questions', [QuestionController::class, 'index'])->name('adminquestionmanager');
        Route::post('/questions', [QuestionController::class, 'store'])->name('questions.store');
        Route::put('/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
        Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
    });

    Route::get('/addquestionpage', function () {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
        return app(HomeController::class)->addquestionpage();
    })->name('addquestionpage');

    // จัดการด้าน
    Route::get('/adminaspectmanager', function () {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
        return app(AspectController::class)->index();
    })->name('adminaspectmanager');
    // RESTful Routes สำหรับ Aspect

    Route::post('/admin/sections', [AspectController::class, 'store'])->name('aspects.store');
    Route::put('/admin/sections/{aspect}', [AspectController::class, 'update'])->name('aspects.update');
    Route::delete('/admin/sections/{aspect}', [AspectController::class, 'destroy'])->name('aspects.destroy');

    // จัดการหมวดหมู่
    Route::get('/sections', [SectionController::class, 'index'])->name('adminsectionmanager');
    Route::post('/sections', [SectionController::class, 'store'])->name('sections.store');
    Route::put('/sections/{section}', [SectionController::class, 'update'])->name('sections.update');
    Route::delete('/sections/{section}', [SectionController::class, 'destroy'])->name('sections.destroy');

    // จัดการแบบประเมิน
    // แสดงรายการแบบประเมินทั้งหมด
    Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');

    // หน้าแบบฟอร์มสร้างแบบประเมิน พร้อมเลือกประเภทบุคคล
    Route::get('/evaluations/create', [EvaluationController::class, 'create'])->name('evaluations.create');

    // บันทึกแบบประเมินใหม่
    Route::post('/evaluations', [EvaluationController::class, 'store'])->name('evaluations.store');

    // เพิ่มในอนาคต (แนะนำ) สำหรับจัดการแบบประเมินเพิ่มเติม
    Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
    Route::get('/evaluations/create', [EvaluationController::class, 'create'])->name('evaluations.create');
    Route::post('/evaluations', [EvaluationController::class, 'store'])->name('evaluations.store');
    Route::get('/evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])->name('evaluations.edit');
    Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('evaluations.update');
    Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluations.destroy');
    Route::get('/evaluations/{assignment}', [EvaluationController::class, 'show'])->name('evaluations.show');


    // จัดการการมอบหมายการประเมิน
    Route::get('/assignments', [EvaluationAssignmentController::class, 'index'])->name('assignments.index');
    Route::get('/assignments/create', [EvaluationAssignmentController::class, 'create'])->name('assignments.create');
    Route::post('/assignments', [EvaluationAssignmentController::class, 'store'])->name('assignments.store');
    Route::delete('/assignments/{assignment}', [EvaluationAssignmentController::class, 'destroy'])->name('assignments.destroy');


    // จัดการ adminuser
    Route::get('/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/create', [AdminUserController::class, 'create'])->name('admin.users.create');
    Route::post('/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('admin.users.edit');

    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');

    // จัดการการประเมิน
    Route::get('/assignments', [AdminEvaluationAssignmentController::class, 'index'])->name('assignments.index');
    Route::get('/assignments/create', [AdminEvaluationAssignmentController::class, 'create'])->name('assignments.create');
    Route::post('/assignments', [AdminEvaluationAssignmentController::class, 'store'])->name('assignments.store');
    Route::delete('/assignments/{assignment}', [AdminEvaluationAssignmentController::class, 'destroy'])->name('assignments.destroy');

    Route::get('/dashboard', function () {
        if (Auth::user()->role !== 'user') {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        }
        return app(HomeController::class)->dashboard();
    })->name('dashboard');
});

// Route::get('/register', function () {
//     return Inertia::render('Auth/Register');
// })->name("register");

// Route::get('/forgotpassword', function () {
//     return Inertia::render('Auth/ForgotPassword');
// })->name("forgotpassword");

// Route::get('/resetpassword', function () {
//     return Inertia::render('Auth/ResetPassword');
// })->name("resetpassword");
