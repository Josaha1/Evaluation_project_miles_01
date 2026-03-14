<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'emid' => $this->faker->unique()->numerify('######'),
            'prename' => $this->faker->randomElement(['นาย', 'นาง', 'นางสาว']),
            'fname' => $this->faker->firstName(),
            'lname' => $this->faker->lastName(),
            'sex' => $this->faker->randomElement(['M', 'F']),
            'grade' => (string) $this->faker->numberBetween(4, 12),
            'role' => 'user',
            'password' => bcrypt('password'),
            'user_type' => 'internal',
        ];
    }
    public function admin(): static { return $this->state(fn () => ['role' => 'admin']); }
    public function governor(): static { return $this->state(fn () => ['grade' => '13']); }
    public function executive(): static { return $this->state(fn () => ['grade' => (string) $this->faker->numberBetween(9, 12)]); }
    public function employee(): static { return $this->state(fn () => ['grade' => (string) $this->faker->numberBetween(4, 8)]); }
}
