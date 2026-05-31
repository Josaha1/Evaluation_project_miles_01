<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('user เข้า /dashboard ได้ปกติเมื่อ deadline เป็น null', function () {
    config(['evaluation.deadline' => null]);
    $user = User::factory()->create(['role' => 'user']);
    $res = $this->actingAs($user)->get('/dashboard');
    expect($res->status())->not->toBe(302);
});

it('user ถูก block ไป /login เมื่อ now >= deadline', function () {
    config(['evaluation.deadline' => now()->subHour()->toDateTimeString()]);
    $user = User::factory()->create(['role' => 'user']);
    $res = $this->actingAs($user)->get('/dashboard');
    $res->assertRedirect('/login');
    expect((string) session('error'))->toContain('ปิดให้บริการ');
});

it('admin ผ่าน middleware แม้เลย deadline', function () {
    config(['evaluation.deadline' => now()->subHour()->toDateTimeString()]);
    $admin = User::factory()->create(['role' => 'admin']);
    // admin ไปหน้า user dashboard (route:user group) — admin ไม่มี role:user ก็ block ก่อนถึง middleware
    // เช็คอีกเส้น: external login (guest route) ไม่ผ่าน middleware → ดูเฉพาะ external auth route
    // unit test ตรง middleware logic แทน
    $mw = new \App\Http\Middleware\EvaluationDeadlineMiddleware();
    $request = \Illuminate\Http\Request::create('/dashboard');
    $request->setUserResolver(fn () => $admin);
    $response = $mw->handle($request, fn ($r) => response('OK'));
    expect($response->getContent())->toBe('OK');
});

it('external request ถูก block ไป external.login เมื่อเลย deadline', function () {
    config(['evaluation.deadline' => now()->subHour()->toDateTimeString()]);
    $mw = new \App\Http\Middleware\EvaluationDeadlineMiddleware();
    $request = \Illuminate\Http\Request::create('/external/dashboard');
    $response = $mw->handle($request, fn ($r) => response('OK'));
    expect($response->getStatusCode())->toBe(302);
    expect($response->headers->get('Location'))->toContain('/external/login');
});
