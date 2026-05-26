<?php
namespace Database\Factories;
use App\Models\Departments;
use App\Models\Divisions;
use App\Models\Factions;
use App\Models\Position;
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
            'birthdate' => $this->faker->dateTimeBetween('-50 years', '-20 years')->format('Y-m-d'),
            'division_id' => function () {
                static $div = null;
                if (!$div) $div = Divisions::firstOrCreate(['name' => 'Test Division'])->id;
                return $div;
            },
            'department_id' => function () {
                static $dept = null;
                if (!$dept) {
                    $div = Divisions::firstOrCreate(['name' => 'Test Division'])->id;
                    $dept = Departments::firstOrCreate(['name' => 'Test Department'], ['division_id' => $div])->id;
                }
                return $dept;
            },
            'faction_id' => fn() => Factions::firstOrCreate(['name' => 'Test Faction ' . Str::random(4)])->id,
            'position_id' => function () {
                static $pos = null;
                if (!$pos) {
                    $div = Divisions::firstOrCreate(['name' => 'Test Division'])->id;
                    $dept = Departments::firstOrCreate(['name' => 'Test Department'], ['division_id' => $div])->id;
                    $pos = Position::firstOrCreate(['title' => 'Test Position'], ['department_id' => $dept])->id;
                }
                return $pos;
            },
        ];
    }
    public function admin(): static { return $this->state(fn () => ['role' => 'admin']); }
    public function governor(): static { return $this->state(fn () => ['grade' => '13']); }
    public function executive(): static { return $this->state(fn () => ['grade' => (string) $this->faker->numberBetween(9, 12)]); }
    public function employee(): static { return $this->state(fn () => ['grade' => (string) $this->faker->numberBetween(4, 8)]); }
}
