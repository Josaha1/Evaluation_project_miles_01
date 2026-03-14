<?php

use App\Services\EvaluationExportService;

it('comprehensive export route exists and is not 404 or 405', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $route = $routes->first(fn ($r) => $r->getName() === 'admin.evaluation-report.export-comprehensive');

    expect($route)->not->toBeNull()
        ->and(in_array('POST', $route->methods()))->toBeTrue();
});

it('executive export route exists and is not 404 or 405', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $route = $routes->first(fn ($r) => $r->getName() === 'admin.evaluation-report.export-executives');

    expect($route)->not->toBeNull()
        ->and(in_array('POST', $route->methods()))->toBeTrue();
});

it('employee export route exists and is not 404 or 405', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $route = $routes->first(fn ($r) => $r->getName() === 'admin.evaluation-report.export-employees');

    expect($route)->not->toBeNull()
        ->and(in_array('POST', $route->methods()))->toBeTrue();
});

it('governor export route exists and is not 404 or 405', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $route = $routes->first(fn ($r) => $r->getName() === 'admin.evaluation-report.export-governors');

    expect($route)->not->toBeNull()
        ->and(in_array('POST', $route->methods()))->toBeTrue();
});

it('external-org export route exists and is not 404 or 405', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $route = $routes->first(fn ($r) => $r->getName() === 'admin.evaluation-report.export-external-org');

    expect($route)->not->toBeNull()
        ->and(in_array('POST', $route->methods()))->toBeTrue();
});

it('self-evaluation export route exists and is not 404 or 405', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $route = $routes->first(fn ($r) => $r->getName() === 'admin.evaluation-report.export-self-evaluation');

    expect($route)->not->toBeNull()
        ->and(in_array('POST', $route->methods()))->toBeTrue();
});

it('EvaluationExportService has required export methods', function () {
    $reflection = new ReflectionClass(EvaluationExportService::class);

    $requiredMethods = [
        'exportComprehensiveEvaluationReport',
        'exportExternalOrgReport',
        'exportSelfEvaluationReport',
    ];

    foreach ($requiredMethods as $methodName) {
        expect($reflection->hasMethod($methodName))->toBeTrue("Missing method: {$methodName}");
    }
});
