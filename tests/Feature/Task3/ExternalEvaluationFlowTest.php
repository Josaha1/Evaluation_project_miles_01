<?php

use App\Models\Answer;
use App\Models\Aspect;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\Option;
use App\Models\Part;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Create a complete external session with all dependencies:
 * org, evaluatee, evaluation structure (part, aspect, question, options),
 * assignment, access code, and session.
 */
function createExternalSession(): array
{
    $org = ExternalOrganization::factory()->create(['is_active' => true]);
    $evaluatee = User::factory()->create();
    $evaluator = User::factory()->create();
    $evaluation = Evaluation::factory()->create(['status' => 'published']);

    $part = Part::factory()->create([
        'evaluation_id' => $evaluation->id,
        'order' => 1,
    ]);

    $aspect = Aspect::factory()->create([
        'part_id' => $part->id,
    ]);

    $question = Question::factory()->create([
        'part_id' => $part->id,
        'aspect_id' => $aspect->id,
        'type' => 'rating',
        'order' => 1,
    ]);

    $options = [];
    for ($score = 1; $score <= 5; $score++) {
        $options[] = Option::factory()->create([
            'question_id' => $question->id,
            'label' => "Level {$score}",
            'score' => $score,
        ]);
    }

    $assignment = EvaluationAssignment::factory()->create([
        'evaluation_id' => $evaluation->id,
        'evaluator_id' => $evaluator->id,
        'evaluatee_id' => $evaluatee->id,
        'fiscal_year' => (string) now()->year,
        'angle' => 'right',
    ]);

    $accessCode = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id,
        'evaluation_assignment_id' => $assignment->id,
        'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $evaluation->id,
        'fiscal_year' => (string) now()->year,
        'is_used' => false,
        'expires_at' => now()->addMonth(),
    ]);

    $sessionToken = Str::random(64);
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $accessCode->id,
        'external_organization_id' => $org->id,
        'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $evaluation->id,
        'session_token' => $sessionToken,
        'started_at' => now(),
        'completed_at' => null,
    ]);

    return [
        'org' => $org,
        'evaluatee' => $evaluatee,
        'evaluator' => $evaluator,
        'evaluation' => $evaluation,
        'part' => $part,
        'aspect' => $aspect,
        'question' => $question,
        'options' => $options,
        'assignment' => $assignment,
        'accessCode' => $accessCode,
        'session' => $session,
        'sessionToken' => $sessionToken,
    ];
}

it('authenticated external user can access confirm page', function () {
    $data = createExternalSession();

    $response = $this->withSession([
        'external_session_token' => $data['sessionToken'],
        'external_session_id' => $data['session']->id,
    ])->get(route('external.confirm'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('ExternalConfirm')
            ->has('evaluatee')
            ->has('evaluation')
            ->has('organization')
    );
});

it('authenticated external user can access dashboard', function () {
    $data = createExternalSession();

    $response = $this->withSession([
        'external_session_token' => $data['sessionToken'],
        'external_session_id' => $data['session']->id,
    ])->get(route('external.dashboard'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('ExternalDashboard')
            ->has('organization')
            ->has('evaluatees')
    );
});

it('authenticated external user can access evaluation form', function () {
    $data = createExternalSession();

    $response = $this->withSession([
        'external_session_token' => $data['sessionToken'],
        'external_session_id' => $data['session']->id,
    ])->get(route('external.evaluate'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('ExternalEvaluation')
            ->has('evaluation')
            ->has('evaluatee')
            ->has('organization')
            ->has('parts')
    );
});

it('submitting evaluation saves answers with external_access_code_id', function () {
    $data = createExternalSession();

    $response = $this->withSession([
        'external_session_token' => $data['sessionToken'],
        'external_session_id' => $data['session']->id,
    ])->post(route('external.evaluate.submit'), [
        'answers' => [
            [
                'question_id' => $data['question']->id,
                'value' => '4',
                'other_text' => null,
            ],
        ],
    ]);

    $response->assertRedirect(route('external.thank-you'));

    // Verify answer was saved with external_access_code_id
    $this->assertDatabaseHas('answers', [
        'evaluation_id' => $data['evaluation']->id,
        'user_id' => $data['evaluator']->id,
        'evaluatee_id' => $data['evaluatee']->id,
        'question_id' => $data['question']->id,
        'value' => '4',
        'external_access_code_id' => $data['accessCode']->id,
    ]);
});

it('submitting evaluation marks session as completed', function () {
    $data = createExternalSession();

    $this->withSession([
        'external_session_token' => $data['sessionToken'],
        'external_session_id' => $data['session']->id,
    ])->post(route('external.evaluate.submit'), [
        'answers' => [
            [
                'question_id' => $data['question']->id,
                'value' => '3',
                'other_text' => null,
            ],
        ],
    ]);

    $data['session']->refresh();
    expect($data['session']->completed_at)->not->toBeNull();
});

it('submitting evaluation marks access code as used', function () {
    $data = createExternalSession();

    $this->withSession([
        'external_session_token' => $data['sessionToken'],
        'external_session_id' => $data['session']->id,
    ])->post(route('external.evaluate.submit'), [
        'answers' => [
            [
                'question_id' => $data['question']->id,
                'value' => '5',
                'other_text' => null,
            ],
        ],
    ]);

    $data['accessCode']->refresh();
    expect($data['accessCode']->is_used)->toBeTrue();
    expect($data['accessCode']->used_at)->not->toBeNull();
});
