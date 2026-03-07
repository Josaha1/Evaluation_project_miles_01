<?php

use App\Services\ScoreCalculationService;
use App\Services\WeightedScoringService;

it('produces consistent grade 5-8 weights between ScoreCalculationService and WeightedScoringService', function () {
    $scoreCalc = new ScoreCalculationService();
    $weightedScoring = new WeightedScoringService();

    // Get ScoreCalculationService weights via reflection
    $reflection = new ReflectionClass($scoreCalc);
    $prop = $reflection->getProperty('defaultWeights');
    $prop->setAccessible(true);
    $calcWeights = $prop->getValue($scoreCalc)['5-8'];

    // Get WeightedScoringService weights via reflection
    $reflection2 = new ReflectionClass($weightedScoring);
    $prop2 = $reflection2->getConstant('GRADE_5_8_STAKEHOLDER_WEIGHTS');

    // Compare — only the angles that have non-zero weights
    $nonZeroWeightedWeights = array_filter($prop2, fn($w) => $w > 0);

    expect($calcWeights)->toBe($nonZeroWeightedWeights);
});

it('produces consistent grade 9-12 weights between ScoreCalculationService and WeightedScoringService', function () {
    $scoreCalc = new ScoreCalculationService();
    $weightedScoring = new WeightedScoringService();

    // Get ScoreCalculationService weights via reflection
    $reflection = new ReflectionClass($scoreCalc);
    $prop = $reflection->getProperty('defaultWeights');
    $prop->setAccessible(true);
    $calcWeights = $prop->getValue($scoreCalc)['9-12'];

    // Get WeightedScoringService weights via reflection
    $reflection2 = new ReflectionClass($weightedScoring);
    $prop2 = $reflection2->getConstant('MANAGEMENT_STAKEHOLDER_WEIGHTS');

    expect($calcWeights)->toBe($prop2);
});

it('calculates correct weighted scores for grade 5-8', function () {
    $service = new WeightedScoringService();

    $scores = [
        'self' => 4.0,
        'top' => 4.5,
        'left' => 3.5,
        'bottom' => 0,
        'right' => 0,
    ];

    $result = $service->calculateWeightedScore($scores, 6);

    // Grade 5-8: self=50%, top=20%, left=30%
    // Expected: (4.0*0.50 + 4.5*0.20 + 3.5*0.30) / (0.50+0.20+0.30) = 3.95
    expect($result['final_score'])->toBe(3.95);
    expect($result['level'])->toBe('5-8');
    expect($result['performance_level'])->toBe('good');
});

it('calculates correct weighted scores for grade 9-10 management', function () {
    $service = new WeightedScoringService();

    $scores = [
        'self' => 4.0,
        'top' => 4.5,
        'bottom' => 4.0,
        'left' => 3.5,
        'right' => 4.0,
    ];

    $result = $service->calculateWeightedScore($scores, 9);

    // Grade 9-10: self=10%, top=25%, bottom=25%, left=20%, right=20%
    // Expected: (4.0*0.10 + 4.5*0.25 + 4.0*0.25 + 3.5*0.20 + 4.0*0.20) / 1.0 = 4.025
    expect($result['final_score'])->toBe(4.03); // rounded to 2 dp
    expect($result['level'])->toBe('9-10');
    expect($result['performance_level'])->toBe('very_good');
});

it('calculates correct weighted scores for governor (grade 13)', function () {
    $service = new WeightedScoringService();

    $scores = [
        'self' => 4.0,
        'top' => 4.5,
        'bottom' => 4.0,
        'left' => 4.0,
        'right' => 3.5,
    ];

    $result = $service->calculateWeightedScore($scores, 13);

    // Governor: self=10%, top=25%, bottom=25%, left=20%, right=20%
    // Expected: (4.0*0.10 + 4.5*0.25 + 4.0*0.25 + 4.0*0.20 + 3.5*0.20) / 1.0 = 4.025
    expect($result['final_score'])->toBe(4.03); // rounded to 2 dp
    expect($result['level'])->toBe('governor');
    expect($result['performance_level'])->toBe('very_good');
});
