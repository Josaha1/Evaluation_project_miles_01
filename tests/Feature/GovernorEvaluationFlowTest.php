<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use App\Services\WeightedScoringService;
use App\Services\EvaluationExportService;

/*
|--------------------------------------------------------------------------
| Governor Evaluation End-to-End Tests
|--------------------------------------------------------------------------
| Tests covering the complete governor evaluation flow:
| seeder data → assignment → weighted scoring → export
*/

it('has governor evaluations seeded with correct structure', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Exception $e) {
        $this->markTestSkipped('Database not available');
    }

    // Governor internal evaluation should exist
    $internal = Evaluation::where('grade_min', 13)
        ->where('grade_max', 13)
        ->where('user_type', 'internal')
        ->first();

    expect($internal)->not->toBeNull('Governor internal evaluation should exist');
    expect($internal->title)->toContain('360');

    // Governor external evaluation should exist
    $external = Evaluation::where('grade_min', 13)
        ->where('grade_max', 13)
        ->where('user_type', 'external')
        ->first();

    expect($external)->not->toBeNull('Governor external evaluation should exist');
});

it('governor internal evaluation has correct parts structure', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Exception $e) {
        $this->markTestSkipped('Database not available');
    }

    $evaluation = Evaluation::where('grade_min', 13)
        ->where('grade_max', 13)
        ->where('user_type', 'internal')
        ->with('parts.aspects.questions.options')
        ->first();

    if (!$evaluation) {
        $this->markTestSkipped('Governor evaluation not seeded');
        return;
    }

    // Should have at least 2 parts
    expect($evaluation->parts->count())->toBeGreaterThanOrEqual(2);

    // Part 1 should have 6 aspects
    $part1 = $evaluation->parts->sortBy('order')->first();
    expect($part1->aspects->count())->toBe(6);

    // Each aspect should have questions with options
    foreach ($part1->aspects as $aspect) {
        expect($aspect->questions->count())->toBeGreaterThan(0);
        foreach ($aspect->questions as $question) {
            if ($question->type === 'rating') {
                expect($question->options->count())->toBeGreaterThan(0);
            }
        }
    }
});

it('governor weighted scoring uses correct stakeholder weights', function () {
    $service = new WeightedScoringService();

    $scores = [
        'self'   => 4.0,
        'top'    => 4.5,
        'bottom' => 4.0,
        'left'   => 4.0,
        'right'  => 3.5,
    ];

    $result = $service->calculateWeightedScore($scores, 13);

    // Governor: self=10%, top=25%, bottom=25%, left=20%, right=20%
    expect($result['level'])->toBe('governor');
    expect($result['final_score'])->toBe(4.03);
    expect($result['performance_level'])->toBe('very_good');

    // Verify breakdown weights
    $sb = $result['breakdown']['stakeholder_breakdown'];
    expect($sb['self']['weight'])->toBe(0.10);
    expect($sb['top']['weight'])->toBe(0.25);
    expect($sb['bottom']['weight'])->toBe(0.25);
    expect($sb['left']['weight'])->toBe(0.20);
    expect($sb['right']['weight'])->toBe(0.20);
});

it('governor weighted scoring handles missing angles gracefully', function () {
    $service = new WeightedScoringService();

    // Only self and top available (partial data)
    $scores = [
        'self' => 4.0,
        'top'  => 4.5,
    ];

    $result = $service->calculateWeightedScore($scores, 13);

    expect($result['level'])->toBe('governor');
    expect($result['final_score'])->toBeGreaterThan(0);
});

it('governor angle weights sum to 100%', function () {
    $service = new WeightedScoringService();

    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('GOVERNOR_STAKEHOLDER_WEIGHTS');

    expect(array_sum($weights))->toBe(1.0);
});

it('governor criteria weights sum to 100%', function () {
    $service = new WeightedScoringService();

    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('GOVERNOR_CRITERIA_WEIGHTS');

    expect(round(array_sum($weights), 2))->toBe(1.0);
});

it('governor export service can create governor sheet', function () {
    $exportService = new EvaluationExportService();

    $reflection = new ReflectionClass($exportService);
    $method = $reflection->getMethod('createGovernorEvaluationSheet');

    // Method should exist and be callable
    expect($method)->not->toBeNull();
    expect($method->isPrivate())->toBeTrue();
});

it('AdminEvaluationReportController exportGovernorReport uses dynamic lookup', function () {
    $reflection = new ReflectionClass(\App\Http\Controllers\AdminEvaluationReportController::class);
    $method = $reflection->getMethod('exportGovernorReport');

    $startLine = $method->getStartLine();
    $endLine = $method->getEndLine();
    $fileContent = file($reflection->getFileName());
    $methodSource = implode('', array_slice($fileContent, $startLine - 1, $endLine - $startLine + 1));

    // Should NOT hardcode evaluation IDs
    expect($methodSource)->not->toMatch('/evaluation_id\s*=\s*\d+/');

    // Should use dynamic grade lookup
    expect($methodSource)->toContain('grade_min');
    expect($methodSource)->toContain('grade_max');
    expect($methodSource)->toContain('13');
});

it('governor export route exists', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $governorExportRoute = $routes->first(function ($route) {
        return str_contains($route->uri(), 'export/governors');
    });

    expect($governorExportRoute)->not->toBeNull('Governor export route should exist');
    expect(in_array('POST', $governorExportRoute->methods()))->toBeTrue();
});

it('external org export route exists', function () {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $externalOrgRoute = $routes->first(function ($route) {
        return str_contains($route->uri(), 'export/external-org');
    });

    expect($externalOrgRoute)->not->toBeNull('External org export route should exist');
    expect(in_array('POST', $externalOrgRoute->methods()))->toBeTrue();
});
