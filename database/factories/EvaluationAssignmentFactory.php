<?php
namespace Database\Factories;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationAssignmentFactory extends Factory
{
    protected $model = EvaluationAssignment::class;
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'evaluator_id' => User::factory(),
            'evaluatee_id' => User::factory(),
            'fiscal_year' => (string) now()->year,
            'angle' => $this->faker->randomElement(['top', 'bottom', 'left', 'right']),
        ];
    }
}
