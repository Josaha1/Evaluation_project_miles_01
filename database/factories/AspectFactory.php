<?php
namespace Database\Factories;

use App\Models\Aspect;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

class AspectFactory extends Factory
{
    protected $model = Aspect::class;

    public function definition(): array
    {
        return [
           
            'name' => $this->faker->word(),
            'description' => $this->faker->sentence(),
        ];
    }
}
