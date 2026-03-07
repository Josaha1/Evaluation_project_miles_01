<?php

use App\Services\ScoreCalculationService;

it('has correct grade 5-8 weights matching spec: self=0.50, top=0.20, left=0.30', function () {
    $service = new ScoreCalculationService();
    $reflection = new ReflectionClass($service);
    $prop = $reflection->getProperty('defaultWeights');
    $prop->setAccessible(true);
    $weights = $prop->getValue($service);

    expect($weights['5-8'])->toBe([
        'self' => 0.50,
        'top' => 0.20,
        'left' => 0.30,
    ]);
});

it('has correct grade 9-12 weights matching spec: self=0.10, top=0.25, bottom=0.25, left=0.20, right=0.20', function () {
    $service = new ScoreCalculationService();
    $reflection = new ReflectionClass($service);
    $prop = $reflection->getProperty('defaultWeights');
    $prop->setAccessible(true);
    $weights = $prop->getValue($service);

    expect($weights['9-12'])->toBe([
        'self' => 0.10,
        'top' => 0.25,
        'bottom' => 0.25,
        'left' => 0.20,
        'right' => 0.20,
    ]);
});

it('does not import nonexistent EvaluationWeight model', function () {
    $reflection = new ReflectionClass(ScoreCalculationService::class);
    $fileContent = file_get_contents($reflection->getFileName());

    expect($fileContent)->not->toContain('use App\\Models\\EvaluationWeight;');
});
