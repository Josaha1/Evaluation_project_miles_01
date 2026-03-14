<?php
namespace Database\Factories;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ExternalEvaluationSessionFactory extends Factory
{
    protected $model = ExternalEvaluationSession::class;
    public function definition(): array
    {
        return [
            'external_access_code_id' => ExternalAccessCode::factory(),
            'external_organization_id' => ExternalOrganization::factory(),
            'evaluatee_id' => User::factory(),
            'evaluation_id' => Evaluation::factory(),
            'session_token' => Str::random(64),
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'started_at' => now(),
            'completed_at' => null,
        ];
    }
    public function completed(): static { return $this->state(fn () => ['completed_at' => now()]); }
}
