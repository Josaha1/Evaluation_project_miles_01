<?php
namespace Database\Factories;
use App\Models\Aspect;
use App\Models\SubAspect;
use Illuminate\Database\Eloquent\Factories\Factory;

class SubAspectFactory extends Factory
{
    protected $model = SubAspect::class;
    public function definition(): array
    {
        return [
            'aspect_id' => Aspect::factory(),
            'name' => $this->faker->word(),
        ];
    }
}
