<?php
namespace Database\Factories;

use App\Models\Question;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        $section = Section::inRandomOrder()->first();
        $aspect  = $section->id === 3 ? null : \App\Models\Aspect::where('section_id', $section->id)->inRandomOrder()->first();

        return [
            'section_id' => $section->id,
            'aspect_id'  => $aspect?->id,
            'title'      => $this->faker->sentence(6),
            'type'       => $this->faker->randomElement(['rating', 'open_text']),
        ];
    }

}
