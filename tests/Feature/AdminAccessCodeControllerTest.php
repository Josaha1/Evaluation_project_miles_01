<?php

use App\Http\Controllers\AdminAccessCodeController;

it('does not hardcode right angle when querying evaluatees in create()', function () {
    $reflection = new ReflectionClass(AdminAccessCodeController::class);
    $method = $reflection->getMethod('create');

    $startLine = $method->getStartLine();
    $endLine = $method->getEndLine();
    $fileContent = file($reflection->getFileName());
    $methodSource = implode('', array_slice($fileContent, $startLine - 1, $endLine - $startLine + 1));

    // create() should NOT hardcode angle='right' for evaluatees
    expect($methodSource)->not->toContain("->where('angle', 'right')");
});

it('does not hardcode right angle when finding assignment in generate()', function () {
    $reflection = new ReflectionClass(AdminAccessCodeController::class);
    $method = $reflection->getMethod('generate');

    $startLine = $method->getStartLine();
    $endLine = $method->getEndLine();
    $fileContent = file($reflection->getFileName());
    $methodSource = implode('', array_slice($fileContent, $startLine - 1, $endLine - $startLine + 1));

    // generate() should NOT hardcode angle='right' for finding assignments
    expect($methodSource)->not->toContain("->where('angle', 'right')");
});

it('finds assignment by evaluatee_id and fiscal_year in generate()', function () {
    $reflection = new ReflectionClass(AdminAccessCodeController::class);
    $method = $reflection->getMethod('generate');

    $startLine = $method->getStartLine();
    $endLine = $method->getEndLine();
    $fileContent = file($reflection->getFileName());
    $methodSource = implode('', array_slice($fileContent, $startLine - 1, $endLine - $startLine + 1));

    // generate() should look up by evaluatee_id and fiscal_year
    expect($methodSource)->toContain("'evaluatee_id'");
    expect($methodSource)->toContain("'fiscal_year'");
});
