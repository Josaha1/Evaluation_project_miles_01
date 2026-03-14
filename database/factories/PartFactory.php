<?php
namespace Database\Factories;
use App\Models\Evaluation;
use App\Models\Part;
use Illuminate\Database\Eloquent\Factories\Factory;

class PartFactory extends Factory
{
    protected $model = Part::class;
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'title' => $this->faker->sentence(3),
            'order' => $this->faker->numberBetween(1, 5),
        ];
    }
}
