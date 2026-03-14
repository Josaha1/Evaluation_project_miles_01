<?php
namespace Database\Factories;
use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExternalAccessCodeFactory extends Factory
{
    protected $model = ExternalAccessCode::class;
    public function definition(): array
    {
        return [
            'code' => 'IEAT-TEST-' . strtoupper($this->faker->unique()->lexify('??????')),
            'external_organization_id' => ExternalOrganization::factory(),
            'evaluation_assignment_id' => null,
            'evaluatee_id' => User::factory(),
            'evaluation_id' => Evaluation::factory(),
            'fiscal_year' => (string) now()->year,
            'is_used' => false,
            'used_at' => null,
            'expires_at' => now()->addMonths(3),
        ];
    }
    public function used(): static { return $this->state(fn () => ['is_used' => true, 'used_at' => now()]); }
    public function expired(): static { return $this->state(fn () => ['expires_at' => now()->subDay()]); }
}
