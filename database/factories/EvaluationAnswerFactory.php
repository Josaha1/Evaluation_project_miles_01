<?php
namespace Database\Factories;

use App\Models\EvaluationAnswer;
use App\Models\Evaluation;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationAnswerFactory extends Factory
{
    protected $model = EvaluationAnswer::class;

    public function definition(): array
    {
        $question = Question::inRandomOrder()->first();

        return [
            'evaluation_id' => Evaluation::factory(),
            'question_id' => $question->id,
            'score' => $question->type === 'rating' ? $this->faker->numberBetween(1, 5) : null,
            'answer_text' => $question->type === 'open_text' ? $this->faker->paragraph() : null,
        ];
    }
}

