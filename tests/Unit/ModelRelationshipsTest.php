<?php

use App\Models\Evaluation;
use App\Models\User;

it('defines satisfactionEvaluations relationship on Evaluation model', function () {
    $reflection = new ReflectionClass(Evaluation::class);
    expect($reflection->hasMethod('satisfactionEvaluations'))->toBeTrue(
        'Evaluation model should define satisfactionEvaluations() relationship'
    );

    $fileContent = file_get_contents($reflection->getFileName());
    expect($fileContent)->toContain('SatisfactionEvaluation::class');
});

it('defines satisfactionEvaluations relationship on User model', function () {
    $reflection = new ReflectionClass(User::class);
    expect($reflection->hasMethod('satisfactionEvaluations'))->toBeTrue(
        'User model should define satisfactionEvaluations() relationship'
    );

    $fileContent = file_get_contents($reflection->getFileName());
    expect($fileContent)->toContain('SatisfactionEvaluation::class');
});
