<?php
namespace Database\Factories;
use App\Models\Aspect;
use App\Models\Part;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    protected $model = Question::class;
    public function definition(): array
    {
        return [
            'part_id' => Part::factory(),
            'aspect_id' => Aspect::factory(),
            'sub_aspect_id' => null,
            'title' => $this->faker->sentence(6),
            'type' => 'rating',
            'order' => $this->faker->numberBetween(1, 10),
        ];
    }
    public function openText(): static { return $this->state(fn () => ['type' => 'open_text']); }
    public function choice(): static { return $this->state(fn () => ['type' => 'choice']); }
}
