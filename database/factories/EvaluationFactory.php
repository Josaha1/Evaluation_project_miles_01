<?php
namespace Database\Factories;
use App\Models\Evaluation;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationFactory extends Factory
{
    protected $model = Evaluation::class;
    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraph(),
            'user_type' => 'internal',
            'grade_min' => 4,
            'grade_max' => 8,
            'status' => 'published',
        ];
    }
    public function governor(): static { return $this->state(fn () => ['title' => 'แบบประเมิน 360 สำหรับผู้ว่าการ', 'grade_min' => 13, 'grade_max' => 13, 'user_type' => 'internal']); }
    public function executive(): static { return $this->state(fn () => ['title' => 'แบบประเมิน 360 สำหรับผู้บริหาร', 'grade_min' => 9, 'grade_max' => 12]); }
    public function external(): static { return $this->state(fn () => ['user_type' => 'external']); }
}
