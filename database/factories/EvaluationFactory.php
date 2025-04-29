<?php
namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationFactory extends Factory
{
    protected $model = Evaluation::class;

    public function definition(): array
    {
        $evaluator = User::inRandomOrder()->first();
        $evaluatee = User::where('id', '!=', $evaluator->id)->inRandomOrder()->first();

        return [
            'evaluator_id' => $evaluator->id,
            'evaluatee_id' => $evaluatee->id,
            'submitted_at' => now(),
        ];
    }
}
