<?php

// Resolve project root from tests/Unit directory
$projectRoot = dirname(__DIR__, 2);

it('has no orphaned model files without migrations', function () use ($projectRoot) {
    expect(file_exists($projectRoot . '/app/Models/Evaluatee.php'))->toBeFalse(
        'Evaluatee.php should be deleted — orphaned model without migration'
    );
    expect(file_exists($projectRoot . '/app/Models/Evaluation_answer.php'))->toBeFalse(
        'Evaluation_answer.php should be deleted — orphaned model without migration'
    );
});

it('has no dead page components', function () use ($projectRoot) {
    expect(file_exists($projectRoot . '/resources/js/pages/AdminSectionIndex.tsx'))->toBeFalse(
        'AdminSectionIndex.tsx should be deleted — dead page not referenced in routes'
    );
    expect(file_exists($projectRoot . '/resources/js/pages/EvaluationShow.tsx'))->toBeFalse(
        'EvaluationShow.tsx should be deleted — dead page not referenced in routes'
    );
});

it('has no backup or debug files', function () use ($projectRoot) {
    expect(file_exists($projectRoot . '/resources/js/pages/ProfileEditPage.tsx.backup'))->toBeFalse(
        'ProfileEditPage.tsx.backup should be deleted — backup file'
    );
    expect(file_exists($projectRoot . '/debug_missing_parts.php'))->toBeFalse(
        'debug_missing_parts.php should be deleted — debug file'
    );
});
