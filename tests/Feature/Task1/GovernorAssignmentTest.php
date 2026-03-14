<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use App\Services\WeightedScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

describe('Governor Assignment', function () {

    it('dynamically finds evaluation by grade 13', function () {
        $evaluation = Evaluation::where('grade_min', '<=', 13)
            ->where('grade_max', '>=', 13)
            ->where('user_type', 'internal')
            ->where('status', 'published')
            ->first();
        expect($evaluation)->not->toBeNull();
        expect($evaluation->grade_min)->toBe(13);
        expect($evaluation->grade_max)->toBe(13);
    });

    it('can create assignment for governor evaluatee', function () {
        $evaluation = Evaluation::where('grade_min', 13)->where('grade_max', 13)->where('user_type', 'internal')->first();
        $evaluator = User::factory()->create(['grade' => '10']);
        $evaluatee = User::factory()->governor()->create();
        $assignment = EvaluationAssignment::create([
            'evaluation_id' => $evaluation->id,
            'evaluator_id' => $evaluator->id,
            'evaluatee_id' => $evaluatee->id,
            'fiscal_year' => (string) now()->year,
            'angle' => 'bottom',
        ]);
        expect($assignment)->toBeInstanceOf(EvaluationAssignment::class);
        expect($assignment->evaluatee->grade)->toBe('13');
    });

    it('supports all required angles for governor', function () {
        $evaluation = Evaluation::where('grade_min', 13)->where('grade_max', 13)->where('user_type', 'internal')->first();
        $evaluatee = User::factory()->governor()->create();
        foreach (['top', 'bottom', 'left', 'right'] as $angle) {
            EvaluationAssignment::create([
                'evaluation_id' => $evaluation->id,
                'evaluator_id' => User::factory()->create()->id,
                'evaluatee_id' => $evaluatee->id,
                'fiscal_year' => (string) now()->year,
                'angle' => $angle,
            ]);
        }
        $assignments = EvaluationAssignment::where('evaluatee_id', $evaluatee->id)->get();
        expect($assignments)->toHaveCount(4);
        expect($assignments->pluck('angle')->sort()->values()->toArray())->toBe(['bottom', 'left', 'right', 'top']);
    });
});

describe('Governor Weighted Scoring Weights', function () {

    it('governor stakeholder weights sum to 100%', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $prop = $reflection->getProperty('GOVERNOR_STAKEHOLDER_WEIGHTS');
        expect(array_sum($prop->getValue()))->toBe(1.0);
    });

    it('governor stakeholder weights are correct', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $weights = $reflection->getProperty('GOVERNOR_STAKEHOLDER_WEIGHTS')->getValue();
        expect($weights['self'])->toBe(0.10);
        expect($weights['top'])->toBe(0.25);
        expect($weights['bottom'])->toBe(0.25);
        expect($weights['left'])->toBe(0.20);
        expect($weights['right'])->toBe(0.20);
    });

    it('governor criteria weights sum to 100%', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        expect(round(array_sum($reflection->getProperty('GOVERNOR_CRITERIA_WEIGHTS')->getValue()), 2))->toBe(1.0);
    });

    it('determines governor level for grade 13', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('determineEvaluationLevel');
        expect($method->invoke($service, 13))->toBe('governor');
    });
});
