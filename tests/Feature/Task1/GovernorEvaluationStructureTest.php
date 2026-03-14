<?php

use App\Models\Evaluation;
use App\Models\Part;
use App\Models\Aspect;
use App\Models\Question;
use App\Models\Option;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

describe('Governor Evaluation Structure', function () {

    it('creates three governor evaluations (internal, external, self)', function () {
        $evaluations = Evaluation::where('grade_min', 13)->where('grade_max', 13)->get();
        expect($evaluations)->toHaveCount(3);
        $userTypes = $evaluations->pluck('user_type')->toArray();
        expect($userTypes)->toContain('internal');
        expect($userTypes)->toContain('external');
    });

    it('has published status for all governor evaluations', function () {
        $evaluations = Evaluation::where('grade_min', 13)->where('grade_max', 13)->get();
        $evaluations->each(function ($eval) {
            expect($eval->status)->toBe('published');
        });
    });

    it('internal evaluation has at least 2 parts', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('title', 'like', '%ภายใน%')
            ->first();
        expect($evaluation)->not->toBeNull();
        expect($evaluation->parts->count())->toBeGreaterThanOrEqual(2);
    });

    it('part 1 has 6 aspects for internal evaluation', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('title', 'like', '%ภายใน%')
            ->first();
        $part1 = $evaluation->parts()->where('order', 1)->first();
        expect($part1)->not->toBeNull();
        expect($part1->aspects)->toHaveCount(6);
    });

    it('every aspect in part 1 has at least one question', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('title', 'like', '%ภายใน%')
            ->first();
        $part1 = $evaluation->parts()->where('order', 1)->first();
        $part1->aspects->each(function ($aspect) {
            expect($aspect->questions->count())->toBeGreaterThanOrEqual(1);
        });
    });

    it('rating questions have options with scores', function () {
        $evaluation = Evaluation::where('grade_min', 13)->where('grade_max', 13)->where('user_type', 'internal')->first();
        $ratingQuestion = Question::whereHas('part', fn ($q) => $q->where('evaluation_id', $evaluation->id))
            ->where('type', 'rating')->first();
        if ($ratingQuestion) {
            expect($ratingQuestion->options->count())->toBeGreaterThanOrEqual(1);
            $ratingQuestion->options->each(function ($option) {
                expect($option->score)->not->toBeNull();
            });
        }
    });

    it('external evaluation also has correct structure', function () {
        $evaluation = Evaluation::where('grade_min', 13)->where('grade_max', 13)->where('user_type', 'external')->first();
        expect($evaluation)->not->toBeNull();
        expect($evaluation->parts->count())->toBeGreaterThanOrEqual(1);
    });
});
