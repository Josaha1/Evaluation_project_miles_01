<?php

use App\Http\Controllers\AdminEvaluationAssignmentController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AspectController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PartController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\SubAspectController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

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

    // จัดการแบบประเมิน
    // แสดงรายการแบบประเมินทั้งหมด
    Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
    Route::get('/evaluations', [EvaluationController::class, 'index'])->name('evaluations.index');
    Route::get('/evaluations/create', [EvaluationController::class, 'create'])->name('evaluations.create');
    Route::post('/evaluations', [EvaluationController::class, 'store'])->name('evaluations.store');
    Route::get('/evaluations/{evaluation}/edit', [EvaluationController::class, 'edit'])->name('evaluations.edit');
    Route::put('/evaluations/{evaluation}', [EvaluationController::class, 'update'])->name('evaluations.update');
    Route::delete('/evaluations/{evaluation}', [EvaluationController::class, 'destroy'])->name('evaluations.destroy');

    // จัดการส่วนของแบบประเมิน
    Route::get('/evaluations/{evaluation}/parts', [PartController::class, 'index'])->name('parts.index');
    Route::get('/evaluations/{evaluation}/parts/create', [PartController::class, 'create'])->name('parts.create');
    Route::get('/evaluations/{evaluation}/parts/{part}/edit', [PartController::class, 'edit'])->name('parts.edit');
    Route::post('/evaluations/{evaluation}/parts', [PartController::class, 'store'])->name('parts.store');
    Route::delete('/evaluations/{evaluation}/parts/{part}', [PartController::class, 'destroy'])->name('parts.destroy');
    Route::put('/evaluations/{evaluation}/parts/{part}', [PartController::class, 'update'])->name('parts.update');
    // จัดการด้านของแบบประเมิน
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects', [AspectController::class, 'index'])
        ->name('aspects.index');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/create', [AspectController::class, 'create'])->name('aspects.create');
    Route::post('/evaluations/{evaluation}/parts/{part}/aspects', [AspectController::class, 'store'])->name('aspects.store');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/edit', [AspectController::class, 'edit'])->name('aspects.edit');
    Route::put('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}', [AspectController::class, 'update'])->name('aspects.update');

    // จัดการด้านนย่อย
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects', [SubAspectController::class, 'index'])->name('subaspects.index');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/create', [SubAspectController::class, 'create'])->name('subaspects.create');
    Route::post('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects', [SubAspectController::class, 'store'])->name('subaspects.store');
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}/edit', [SubAspectController::class, 'edit'])->name('subaspects.edit');
    Route::put('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}', [SubAspectController::class, 'update'])->name('subaspects.update');

    // จัดการคำถาม
    // แบบไม่ระบุ aspect/subaspect (แสดงคำถามทั้งหมดใน part)
    Route::get('/evaluations/{evaluation}/parts/{part}/questions', [QuestionController::class, 'index'])
        ->name('questions.index');

    // แบบมี aspect
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/questions', [QuestionController::class, 'index'])
        ->name('questions.index.aspect');

    // แบบมี subaspect
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}/questions', [QuestionController::class, 'index'])
        ->name('questions.index.subaspect');

    Route::get('/evaluations/{evaluation}/parts/{part}/questions/create', [QuestionController::class, 'create'])
        ->name('questions.create');
    // edit สำหรับคำถามในด้าน (aspect)
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/questions/{question}/edit', [QuestionController::class, 'edit'])
        ->name('questions.aspect.edit');

// edit สำหรับคำถามในด้านย่อย (subaspect)
    Route::get('/evaluations/{evaluation}/parts/{part}/aspects/{aspect}/subaspects/{subaspect}/questions/{question}/edit', [QuestionController::class, 'edit'])
        ->name('questions.subaspect.edit');

    Route::delete('/evaluations/{evaluation}/parts/{part}/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
    Route::post('/evaluations/{evaluation}/parts/{part}/questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::put('/evaluations/{evaluation}/parts/{part}/questions/{question}', [QuestionController::class, 'update'])
        ->name('questions.update');
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
