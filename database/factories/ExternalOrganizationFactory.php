<?php
namespace Database\Factories;
use App\Models\ExternalOrganization;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExternalOrganizationFactory extends Factory
{
    protected $model = ExternalOrganization::class;
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'org_code' => strtoupper($this->faker->unique()->lexify('????')),
            'description' => $this->faker->sentence(),
            'contact_person' => $this->faker->name(),
            'contact_email' => $this->faker->safeEmail(),
            'contact_phone' => $this->faker->phoneNumber(),
            'is_active' => true,
        ];
    }
}
