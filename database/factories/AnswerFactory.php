<?php
namespace Database\Factories;
use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnswerFactory extends Factory
{
    protected $model = Answer::class;
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'user_id' => User::factory(),
            'evaluatee_id' => User::factory(),
            'question_id' => Question::factory(),
            'value' => (string) $this->faker->numberBetween(1, 5),
            'other_text' => null,
            'external_access_code_id' => null,
            'fiscal_year' => (string) now()->year,
        ];
    }
}
