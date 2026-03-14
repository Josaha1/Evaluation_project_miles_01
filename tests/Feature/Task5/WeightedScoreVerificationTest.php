<?php

use App\Services\WeightedScoringService;

it('grade 4-8 stakeholder weights sum to 100%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('GRADE_5_8_STAKEHOLDER_WEIGHTS');

    expect(round(array_sum($weights), 2))->toBe(1.0);
});

it('grade 4-8 weights are self=50% top=20% left=30%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('GRADE_5_8_STAKEHOLDER_WEIGHTS');

    expect($weights['self'])->toBe(0.50)
        ->and($weights['top'])->toBe(0.20)
        ->and($weights['left'])->toBe(0.30);
});

it('grade 9-12 management stakeholder weights sum to 100%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('MANAGEMENT_STAKEHOLDER_WEIGHTS');

    expect(round(array_sum($weights), 2))->toBe(1.0);
});

it('grade 9-12 management weights are self=10% top=25% bottom=25% left=20% right=20%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('MANAGEMENT_STAKEHOLDER_WEIGHTS');

    expect($weights['self'])->toBe(0.10)
        ->and($weights['top'])->toBe(0.25)
        ->and($weights['bottom'])->toBe(0.25)
        ->and($weights['left'])->toBe(0.20)
        ->and($weights['right'])->toBe(0.20);
});

it('governor stakeholder weights sum to 100%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('GOVERNOR_STAKEHOLDER_WEIGHTS');

    expect(round(array_sum($weights), 2))->toBe(1.0);
});

it('governor weights are self=10% top=25% bottom=25% left=20% right=20%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $weights = $reflection->getConstant('GOVERNOR_STAKEHOLDER_WEIGHTS');

    expect($weights['self'])->toBe(0.10)
        ->and($weights['top'])->toBe(0.25)
        ->and($weights['bottom'])->toBe(0.25)
        ->and($weights['left'])->toBe(0.20)
        ->and($weights['right'])->toBe(0.20);
});

it('all criteria weight sets sum to 100%', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);

    $criteriaConstants = [
        'GRADE_5_8_CRITERIA_WEIGHTS',
        'GRADE_9_10_CRITERIA_WEIGHTS',
        'GRADE_11_12_CRITERIA_WEIGHTS',
        'GOVERNOR_CRITERIA_WEIGHTS',
    ];

    foreach ($criteriaConstants as $constant) {
        $weights = $reflection->getConstant($constant);
        expect(round(array_sum($weights), 2))->toBe(1.0, "Failed for {$constant}");
    }
});

it('determines correct evaluation level for each grade', function () {
    $service = new WeightedScoringService();
    $reflection = new ReflectionClass($service);
    $method = $reflection->getMethod('determineEvaluationLevel');
    $method->setAccessible(true);

    $expectations = [
        4  => '5-8',
        8  => '5-8',
        9  => '9-10',
        10 => '9-10',
        11 => '11-12',
        12 => '11-12',
        13 => 'governor',
    ];

    foreach ($expectations as $grade => $expectedLevel) {
        $result = $method->invoke($service, $grade);
        expect($result)->toBe($expectedLevel, "Grade {$grade} should map to '{$expectedLevel}', got '{$result}'");
    }
});
