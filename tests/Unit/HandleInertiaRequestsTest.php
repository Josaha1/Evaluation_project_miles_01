<?php

use App\Http\Middleware\HandleInertiaRequests;

it('shares emid instead of email for authenticated user', function () {
    $reflection = new ReflectionClass(HandleInertiaRequests::class);
    $fileContent = file_get_contents($reflection->getFileName());

    // The middleware should share 'emid' not 'email' in the auth user data
    expect($fileContent)->toContain("'emid' => \$request->user()->emid");
    expect($fileContent)->not->toContain("'email' => \$request->user()->email");
});

it('shares null auth when no user authenticated', function () {
    // Verify the ternary pattern: $request->user() ? [...] : null
    $reflection = new ReflectionClass(HandleInertiaRequests::class);
    $fileContent = file_get_contents($reflection->getFileName());

    expect($fileContent)->toContain("\$request->user() ? [");
    expect($fileContent)->toContain('] : null,');
});
