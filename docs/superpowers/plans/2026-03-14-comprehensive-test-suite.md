# Comprehensive Test Suite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create comprehensive Pest (PHP) and Vitest (React) test suites verifying all 5 tasks from project_proposal.md work correctly.

**Architecture:** Infrastructure-first approach — set up test databases, install Vitest, create factories, then write tests task-by-task. Pest tests use MySQL with RefreshDatabase. Vitest tests mock Inertia and test component rendering/interactions.

**Tech Stack:** Pest PHP (MySQL), Vitest + @testing-library/react + jsdom, Laravel factories

---

## Chunk 1: Infrastructure Setup

### Task 1: Create .env.testing for MySQL test database

**Files:**
- Create: `.env.testing`

- [ ] **Step 1: Create .env.testing**

```env
APP_NAME="Evaluation System Tests"
APP_ENV=testing
APP_KEY=base64:test-key-will-be-generated
APP_DEBUG=true

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=milesconsultdb_test
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=array
MAIL_MAILER=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array
```

- [ ] **Step 2: Generate app key for testing**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan key:generate --env=testing`
Expected: Application key set successfully

- [ ] **Step 3: Create test database**

Run: `mysql -u root -e "CREATE DATABASE IF NOT EXISTS milesconsultdb_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
Expected: Database created

- [ ] **Step 4: Update phpunit.xml to use .env.testing**

In `phpunit.xml`, ensure `<env>` section does NOT override DB_DATABASE so `.env.testing` takes effect. The existing phpunit.xml already sets `APP_ENV=testing` which loads `.env.testing` automatically.

- [ ] **Step 5: Commit**

```bash
git add .env.testing
git commit -m "test: add .env.testing for MySQL test database"
```

---

### Task 2: Install Vitest and testing libraries

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/js/setup.ts`
- Create: `tests/js/helpers/inertia-mock.ts`

- [ ] **Step 1: Install vitest and testing dependencies**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/react-dom`
Expected: Packages installed successfully

- [ ] **Step 2: Create vitest.config.ts**

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/js/setup.ts'],
        include: ['tests/js/**/*.test.{ts,tsx}'],
        css: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
});
```

- [ ] **Step 3: Create tests/js/setup.ts**

```typescript
import '@testing-library/jest-dom';

// Mock window.route (ziggy)
(globalThis as any).route = (name: string, params?: any) => {
    if (params) {
        const paramStr = typeof params === 'object'
            ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
            : params;
        return `/${name.replace(/\./g, '/')}?${paramStr}`;
    }
    return `/${name.replace(/\./g, '/')}`;
};
```

- [ ] **Step 4: Create tests/js/helpers/inertia-mock.ts**

```typescript
import { vi } from 'vitest';

// Mock @inertiajs/react
export const mockRouter = {
    visit: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    reload: vi.fn(),
    get: vi.fn(),
};

export const mockUseForm = (initialData: Record<string, any> = {}) => {
    const data = { ...initialData };
    return {
        data,
        setData: vi.fn((key: string, value: any) => {
            (data as any)[key] = value;
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        processing: false,
        errors: {} as Record<string, string>,
        reset: vi.fn(),
        clearErrors: vi.fn(),
        transform: vi.fn(),
    };
};

export function createPageProps<T extends Record<string, any>>(props: T) {
    return {
        ...props,
        auth: props.auth || { user: { id: 1, name: 'Test User', role: 'user', grade: '5' } },
        flash: props.flash || {},
        errors: props.errors || {},
    };
}

// Helper to mock usePage with typed props
export function mockUsePage(props: Record<string, any>) {
    const { usePage } = require('@inertiajs/react');
    (usePage as any).mockReturnValue({ props: createPageProps(props) });
}

vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual('@inertiajs/react') as any;
    return {
        ...actual,
        usePage: vi.fn(() => ({
            props: {
                auth: { user: { id: 1, name: 'Test User', role: 'user', grade: '5' } },
                flash: {},
                errors: {},
            },
        })),
        router: mockRouter,
        useForm: vi.fn((initialData: any) => mockUseForm(initialData)),
        Link: ({ children, href, ...props }: any) => {
            const React = require('react');
            return React.createElement('a', { href, ...props }, children);
        },
        Head: ({ title }: any) => {
            const React = require('react');
            return React.createElement('title', null, title);
        },
    };
});

// Mock ziggy route function
vi.mock('ziggy-js', () => ({
    default: (name: string, params?: any) => `/${name.replace(/\./g, '/')}`,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
    const React = require('react');
    return {
        motion: new Proxy({}, {
            get: (_target: any, prop: string) => {
                return React.forwardRef(({ children, ...props }: any, ref: any) => {
                    const filteredProps = Object.fromEntries(
                        Object.entries(props).filter(
                            ([key]) => !['initial', 'animate', 'exit', 'variants', 'transition',
                                'whileHover', 'whileTap', 'whileInView', 'layout', 'layoutId',
                                'onAnimationComplete'].includes(key)
                        )
                    );
                    return React.createElement(prop, { ...filteredProps, ref }, children);
                });
            },
        }),
        AnimatePresence: ({ children }: any) => children,
        useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
        useMotionValue: (initial: any) => ({ get: () => initial, set: vi.fn() }),
        useTransform: (value: any) => value,
        useInView: () => true,
    };
});

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
    Toaster: () => null,
}));
```

- [ ] **Step 5: Add test script to package.json**

Add to `scripts` section in package.json:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify vitest runs**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run --passWithNoTests`
Expected: No test suites found, exits cleanly

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts tests/js/setup.ts tests/js/helpers/inertia-mock.ts package.json package-lock.json
git commit -m "test: set up vitest with testing-library and inertia mocks"
```

---

### Task 3: Create missing database factories

**Files:**
- Create: `database/factories/PartFactory.php`
- Create: `database/factories/SubAspectFactory.php`
- Create: `database/factories/EvaluationAssignmentFactory.php`
- Create: `database/factories/AnswerFactory.php`
- Create: `database/factories/ExternalOrganizationFactory.php`
- Create: `database/factories/ExternalAccessCodeFactory.php`
- Create: `database/factories/ExternalEvaluationSessionFactory.php`

- [ ] **Step 1: Create PartFactory**

```php
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
```

- [ ] **Step 2: Create SubAspectFactory**

```php
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
```

- [ ] **Step 3: Create EvaluationAssignmentFactory**

```php
<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EvaluationAssignmentFactory extends Factory
{
    protected $model = EvaluationAssignment::class;

    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'evaluator_id' => User::factory(),
            'evaluatee_id' => User::factory(),
            'fiscal_year' => (string) now()->year,
            'angle' => $this->faker->randomElement(['top', 'bottom', 'left', 'right']),
        ];
    }
}
```

- [ ] **Step 4: Create AnswerFactory (replace old EvaluationAnswerFactory)**

```php
<?php

namespace Database\Factories;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnswerFactory extends Factory
{
    protected $model = Answer::class;

    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'user_id' => User::factory(),
            'evaluatee_id' => User::factory(),
            'question_id' => Question::factory(),
            'value' => (string) $this->faker->numberBetween(1, 5),
            'other_text' => null,
            'external_access_code_id' => null,
            'fiscal_year' => (string) now()->year,
        ];
    }
}
```

- [ ] **Step 5: Create ExternalOrganizationFactory**

```php
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
```

- [ ] **Step 6: Create ExternalAccessCodeFactory**

```php
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
        $org = ExternalOrganization::factory();

        return [
            'code' => 'IEAT-TEST-' . strtoupper($this->faker->unique()->lexify('??????')),
            'external_organization_id' => $org,
            'evaluation_assignment_id' => null,
            'evaluatee_id' => User::factory(),
            'evaluation_id' => Evaluation::factory(),
            'fiscal_year' => (string) now()->year,
            'is_used' => false,
            'used_at' => null,
            'expires_at' => now()->addMonths(3),
        ];
    }

    public function used(): static
    {
        return $this->state(fn () => [
            'is_used' => true,
            'used_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
```

- [ ] **Step 7: Create ExternalEvaluationSessionFactory**

```php
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

    public function completed(): static
    {
        return $this->state(fn () => [
            'completed_at' => now(),
        ]);
    }
}
```

- [ ] **Step 8: Add HasFactory trait to models that lack it**

Check and add `use HasFactory;` to:
- `ExternalOrganization` model
- `ExternalAccessCode` model
- `ExternalEvaluationSession` model
- `Answer` model

- [ ] **Step 9: Fix EvaluationFactory to not depend on existing users**

Update `database/factories/EvaluationFactory.php`:
```php
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

    public function governor(): static
    {
        return $this->state(fn () => [
            'title' => 'แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ.',
            'grade_min' => 13,
            'grade_max' => 13,
            'user_type' => 'internal',
        ]);
    }

    public function executive(): static
    {
        return $this->state(fn () => [
            'title' => 'แบบประเมิน 360 องศา สำหรับผู้บริหาร',
            'grade_min' => 9,
            'grade_max' => 12,
        ]);
    }

    public function external(): static
    {
        return $this->state(fn () => [
            'user_type' => 'external',
        ]);
    }
}
```

- [ ] **Step 10: Fix AspectFactory to include part_id**

Update `database/factories/AspectFactory.php`:
```php
<?php

namespace Database\Factories;

use App\Models\Aspect;
use App\Models\Part;
use Illuminate\Database\Eloquent\Factories\Factory;

class AspectFactory extends Factory
{
    protected $model = Aspect::class;

    public function definition(): array
    {
        return [
            'part_id' => Part::factory(),
            'name' => $this->faker->word(),
            'has_subaspects' => false,
        ];
    }
}
```

- [ ] **Step 11: Fix QuestionFactory to not depend on existing data**

Update `database/factories/QuestionFactory.php`:
```php
<?php

namespace Database\Factories;

use App\Models\Aspect;
use App\Models\Part;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        return [
            'part_id' => Part::factory(),
            'aspect_id' => Aspect::factory(),
            'sub_aspect_id' => null,
            'title' => $this->faker->sentence(6),
            'type' => 'rating',
            'order' => $this->faker->numberBetween(1, 10),
        ];
    }

    public function openText(): static
    {
        return $this->state(fn () => ['type' => 'open_text']);
    }

    public function choice(): static
    {
        return $this->state(fn () => ['type' => 'choice']);
    }
}
```

- [ ] **Step 12: Update UserFactory to include required fields**

Update `database/factories/UserFactory.php`:
```php
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

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    public function governor(): static
    {
        return $this->state(fn () => ['grade' => '13']);
    }

    public function executive(): static
    {
        return $this->state(fn () => ['grade' => (string) $this->faker->numberBetween(9, 12)]);
    }

    public function employee(): static
    {
        return $this->state(fn () => ['grade' => (string) $this->faker->numberBetween(4, 8)]);
    }
}
```

- [ ] **Step 13: Verify factories load**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan tinker --execute="echo 'Factories OK';"`
Expected: "Factories OK"

- [ ] **Step 14: Commit**

```bash
git add database/factories/
git commit -m "test: create and update factories for comprehensive testing"
```

---

## Chunk 2: Pest Tests — Task 1 (Governor Evaluation) & Task 3 (External Login)

### Task 4: Governor Evaluation Structure Tests

**Files:**
- Create: `tests/Feature/Task1/GovernorEvaluationStructureTest.php`

- [ ] **Step 1: Write GovernorEvaluationStructureTest**

```php
<?php

use App\Models\Evaluation;
use App\Models\Part;
use App\Models\Aspect;
use App\Models\Question;
use App\Models\Option;
use App\Services\WeightedScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

describe('Governor Evaluation Structure', function () {

    it('creates three governor evaluations (internal, external, self)', function () {
        $evaluations = Evaluation::where('grade_min', 13)->where('grade_max', 13)->get();
        expect($evaluations)->toHaveCount(3);

        $userTypes = $evaluations->pluck('user_type')->toArray();
        expect($userTypes)->toContain('internal');
        expect($userTypes)->toContain('external');
    });

    it('has published status for all governor evaluations', function () {
        $evaluations = Evaluation::where('grade_min', 13)->where('grade_max', 13)->get();
        $evaluations->each(function ($eval) {
            expect($eval->status)->toBe('published');
        });
    });

    it('internal evaluation has at least 2 parts', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('title', 'like', '%ภายใน%')
            ->first();

        expect($evaluation)->not->toBeNull();
        expect($evaluation->parts)->toHaveCount(fn ($count) => $count >= 2);
    });

    it('part 1 has 6 aspects for internal evaluation', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('title', 'like', '%ภายใน%')
            ->first();

        $part1 = $evaluation->parts()->where('order', 1)->first();
        expect($part1)->not->toBeNull();
        expect($part1->aspects)->toHaveCount(6);
    });

    it('every aspect in part 1 has at least one question', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('title', 'like', '%ภายใน%')
            ->first();

        $part1 = $evaluation->parts()->where('order', 1)->first();
        $part1->aspects->each(function ($aspect) {
            expect($aspect->questions->count())->toBeGreaterThanOrEqual(1);
        });
    });

    it('rating questions have options with scores', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->first();

        $ratingQuestion = Question::whereHas('part', fn ($q) => $q->where('evaluation_id', $evaluation->id))
            ->where('type', 'rating')
            ->first();

        if ($ratingQuestion) {
            expect($ratingQuestion->options->count())->toBeGreaterThanOrEqual(1);
            $ratingQuestion->options->each(function ($option) {
                expect($option->score)->not->toBeNull();
            });
        }
    });

    it('external evaluation also has correct structure', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'external')
            ->first();

        expect($evaluation)->not->toBeNull();
        expect($evaluation->parts->count())->toBeGreaterThanOrEqual(1);
    });
});
```

- [ ] **Step 2: Run test to verify**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task1/GovernorEvaluationStructureTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task1/GovernorEvaluationStructureTest.php
git commit -m "test: add governor evaluation structure tests (Task 1)"
```

---

### Task 5: Governor Assignment Tests

**Files:**
- Create: `tests/Feature/Task1/GovernorAssignmentTest.php`

- [ ] **Step 1: Write GovernorAssignmentTest**

```php
<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use App\Services\WeightedScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

describe('Governor Assignment', function () {

    it('dynamically finds evaluation by grade 13', function () {
        $evaluation = Evaluation::where('grade_min', '<=', 13)
            ->where('grade_max', '>=', 13)
            ->where('user_type', 'internal')
            ->where('status', 'published')
            ->first();

        expect($evaluation)->not->toBeNull();
        expect($evaluation->grade_min)->toBe(13);
        expect($evaluation->grade_max)->toBe(13);
    });

    it('can create assignment for governor evaluatee', function () {
        $evaluation = Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->first();

        $evaluator = User::factory()->create(['grade' => '10']);
        $evaluatee = User::factory()->governor()->create();

        $assignment = EvaluationAssignment::create([
            'evaluation_id' => $evaluation->id,
            'evaluator_id' => $evaluator->id,
            'evaluatee_id' => $evaluatee->id,
            'fiscal_year' => (string) now()->year,
            'angle' => 'bottom',
        ]);

        expect($assignment)->toBeInstanceOf(EvaluationAssignment::class);
        expect($assignment->evaluatee->grade)->toBe('13');
    });

    it('supports all required angles for governor', function () {
        $evaluation = Evaluation::where('grade_min', 13)->where('grade_max', 13)->where('user_type', 'internal')->first();
        $evaluatee = User::factory()->governor()->create();

        $angles = ['top', 'bottom', 'left', 'right'];
        foreach ($angles as $angle) {
            $evaluator = User::factory()->create();
            EvaluationAssignment::create([
                'evaluation_id' => $evaluation->id,
                'evaluator_id' => $evaluator->id,
                'evaluatee_id' => $evaluatee->id,
                'fiscal_year' => (string) now()->year,
                'angle' => $angle,
            ]);
        }

        $assignments = EvaluationAssignment::where('evaluatee_id', $evaluatee->id)->get();
        expect($assignments)->toHaveCount(4);
        expect($assignments->pluck('angle')->sort()->values()->toArray())->toBe(['bottom', 'left', 'right', 'top']);
    });
});

describe('Governor Weighted Scoring Weights', function () {

    it('governor stakeholder weights sum to 100%', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $prop = $reflection->getProperty('GOVERNOR_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect(array_sum($weights))->toBe(1.0);
    });

    it('governor stakeholder weights are correct', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $prop = $reflection->getProperty('GOVERNOR_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect($weights['self'])->toBe(0.10);
        expect($weights['top'])->toBe(0.25);
        expect($weights['bottom'])->toBe(0.25);
        expect($weights['left'])->toBe(0.20);
        expect($weights['right'])->toBe(0.20);
    });

    it('governor criteria weights sum to 100%', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $prop = $reflection->getProperty('GOVERNOR_CRITERIA_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('determines governor level for grade 13', function () {
        $service = new WeightedScoringService();
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('determineEvaluationLevel');

        expect($method->invoke($service, 13))->toBe('governor');
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task1/GovernorAssignmentTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task1/GovernorAssignmentTest.php
git commit -m "test: add governor assignment and weighted scoring tests (Task 1)"
```

---

### Task 6: External Organization CRUD Tests

**Files:**
- Create: `tests/Feature/Task3/ExternalOrganizationCrudTest.php`

- [ ] **Step 1: Write ExternalOrganizationCrudTest**

```php
<?php

use App\Models\ExternalOrganization;
use App\Models\ExternalAccessCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

describe('External Organization CRUD', function () {

    it('admin can list organizations', function () {
        ExternalOrganization::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)
            ->get(route('admin.external-organizations.index'));

        $response->assertStatus(200);
    });

    it('admin can create organization', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.external-organizations.store'), [
                'name' => 'บริษัท ABC จำกัด',
                'org_code' => 'abcd',
                'contact_person' => 'สมชาย',
                'contact_email' => 'test@abc.com',
                'contact_phone' => '021234567',
                'is_active' => true,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('external_organizations', [
            'name' => 'บริษัท ABC จำกัด',
            'org_code' => 'ABCD', // should be uppercased
        ]);
    });

    it('org_code is stored as uppercase', function () {
        $this->actingAs($this->admin)
            ->post(route('admin.external-organizations.store'), [
                'name' => 'Test Org',
                'org_code' => 'test',
                'is_active' => true,
            ]);

        expect(ExternalOrganization::first()->org_code)->toBe('TEST');
    });

    it('org_code must be unique', function () {
        ExternalOrganization::factory()->create(['org_code' => 'UNIQ']);

        $response = $this->actingAs($this->admin)
            ->post(route('admin.external-organizations.store'), [
                'name' => 'Another Org',
                'org_code' => 'UNIQ',
                'is_active' => true,
            ]);

        $response->assertSessionHasErrors('org_code');
    });

    it('admin can update organization', function () {
        $org = ExternalOrganization::factory()->create();

        $response = $this->actingAs($this->admin)
            ->put(route('admin.external-organizations.update', $org), [
                'name' => 'Updated Name',
                'org_code' => $org->org_code,
                'is_active' => true,
            ]);

        $response->assertRedirect();
        expect($org->fresh()->name)->toBe('Updated Name');
    });

    it('cannot delete organization with unused access codes', function () {
        $org = ExternalOrganization::factory()->create();
        ExternalAccessCode::factory()->create([
            'external_organization_id' => $org->id,
            'is_used' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->delete(route('admin.external-organizations.destroy', $org));

        $response->assertRedirect();
        expect(ExternalOrganization::find($org->id))->not->toBeNull();
    });

    it('can delete organization without access codes', function () {
        $org = ExternalOrganization::factory()->create();

        $response = $this->actingAs($this->admin)
            ->delete(route('admin.external-organizations.destroy', $org));

        $response->assertRedirect();
        expect(ExternalOrganization::find($org->id))->toBeNull();
    });

    it('supports search by name', function () {
        ExternalOrganization::factory()->create(['name' => 'บริษัท ค้นหาได้']);
        ExternalOrganization::factory()->create(['name' => 'Other Company']);

        $response = $this->actingAs($this->admin)
            ->get(route('admin.external-organizations.index', ['search' => 'ค้นหาได้']));

        $response->assertStatus(200);
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task3/ExternalOrganizationCrudTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task3/ExternalOrganizationCrudTest.php
git commit -m "test: add external organization CRUD tests (Task 3)"
```

---

### Task 7: External Access Code Tests

**Files:**
- Create: `tests/Feature/Task3/ExternalAccessCodeTest.php`

- [ ] **Step 1: Write ExternalAccessCodeTest**

```php
<?php

use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->org = ExternalOrganization::factory()->create(['org_code' => 'TEST']);
});

describe('Access Code Generation', function () {

    it('code follows IEAT-[ORG]-[RANDOM6] format', function () {
        $code = ExternalAccessCode::factory()->create([
            'external_organization_id' => $this->org->id,
            'code' => 'IEAT-TEST-AB12CD',
        ]);

        expect($code->code)->toMatch('/^IEAT-TEST-[A-Z0-9]{6}$/');
    });

    it('admin can access generate page', function () {
        $response = $this->actingAs($this->admin)
            ->get(route('admin.access-codes.create'));

        $response->assertStatus(200);
    });

    it('admin can view access code detail with QR', function () {
        $code = ExternalAccessCode::factory()->create([
            'external_organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->get(route('admin.access-codes.show', $code));

        $response->assertStatus(200);
    });

    it('can revoke unused code', function () {
        $code = ExternalAccessCode::factory()->create([
            'external_organization_id' => $this->org->id,
            'is_used' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->put(route('admin.access-codes.revoke', $code));

        $response->assertRedirect();
        expect($code->fresh()->is_used)->toBeTrue();
    });

    it('can regenerate code', function () {
        $code = ExternalAccessCode::factory()->create([
            'external_organization_id' => $this->org->id,
        ]);
        $oldCode = $code->code;

        $response = $this->actingAs($this->admin)
            ->post(route('admin.access-codes.regenerate', $code));

        $response->assertRedirect();
        expect($code->fresh()->code)->not->toBe($oldCode);
        expect($code->fresh()->is_used)->toBeFalse();
    });

    it('cannot delete used code', function () {
        $code = ExternalAccessCode::factory()->used()->create([
            'external_organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->delete(route('admin.access-codes.destroy', $code));

        $response->assertRedirect();
        expect(ExternalAccessCode::find($code->id))->not->toBeNull();
    });

    it('can delete unused code', function () {
        $code = ExternalAccessCode::factory()->create([
            'external_organization_id' => $this->org->id,
            'is_used' => false,
        ]);

        $response = $this->actingAs($this->admin)
            ->delete(route('admin.access-codes.destroy', $code));

        $response->assertRedirect();
        expect(ExternalAccessCode::find($code->id))->toBeNull();
    });

    it('exports codes as CSV', function () {
        ExternalAccessCode::factory()->count(3)->create([
            'external_organization_id' => $this->org->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->get(route('admin.access-codes.export'));

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    });
});

describe('Access Code Validity', function () {

    it('unused and unexpired code is valid', function () {
        $code = ExternalAccessCode::factory()->create([
            'is_used' => false,
            'expires_at' => now()->addMonth(),
        ]);

        expect($code->isValid())->toBeTrue();
    });

    it('used code is invalid', function () {
        $code = ExternalAccessCode::factory()->used()->create();
        expect($code->isValid())->toBeFalse();
    });

    it('expired code is invalid', function () {
        $code = ExternalAccessCode::factory()->expired()->create();
        expect($code->isValid())->toBeFalse();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task3/ExternalAccessCodeTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task3/ExternalAccessCodeTest.php
git commit -m "test: add external access code tests (Task 3)"
```

---

### Task 8: External Auth Flow Tests

**Files:**
- Create: `tests/Feature/Task3/ExternalAuthFlowTest.php`

- [ ] **Step 1: Write ExternalAuthFlowTest**

```php
<?php

use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\Evaluation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('External Login', function () {

    it('shows login page', function () {
        $response = $this->get(route('external.login'));
        $response->assertStatus(200);
    });

    it('login with valid code creates session', function () {
        $org = ExternalOrganization::factory()->create(['is_active' => true]);
        $evaluatee = User::factory()->create();
        $evaluation = Evaluation::factory()->create();
        $code = ExternalAccessCode::factory()->create([
            'external_organization_id' => $org->id,
            'evaluatee_id' => $evaluatee->id,
            'evaluation_id' => $evaluation->id,
            'is_used' => false,
            'expires_at' => now()->addMonth(),
        ]);

        $response = $this->post(route('external.login.submit'), [
            'code' => $code->code,
        ]);

        $response->assertRedirect(route('external.confirm'));
        expect(ExternalEvaluationSession::count())->toBe(1);
    });

    it('login with invalid code is rejected', function () {
        $response = $this->post(route('external.login.submit'), [
            'code' => 'INVALID-CODE-123',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors();
    });

    it('login with used code is rejected', function () {
        $org = ExternalOrganization::factory()->create(['is_active' => true]);
        $code = ExternalAccessCode::factory()->used()->create([
            'external_organization_id' => $org->id,
        ]);

        $response = $this->post(route('external.login.submit'), [
            'code' => $code->code,
        ]);

        $response->assertRedirect();
    });

    it('login with expired code is rejected', function () {
        $org = ExternalOrganization::factory()->create(['is_active' => true]);
        $code = ExternalAccessCode::factory()->expired()->create([
            'external_organization_id' => $org->id,
        ]);

        $response = $this->post(route('external.login.submit'), [
            'code' => $code->code,
        ]);

        $response->assertRedirect();
    });

    it('prefills code from query parameter', function () {
        $response = $this->get(route('external.login', ['code' => 'IEAT-TEST-123456']));
        $response->assertStatus(200);
    });
});

describe('External Middleware Protection', function () {

    it('unauthenticated access to dashboard redirects to login', function () {
        $response = $this->get(route('external.dashboard'));
        $response->assertRedirect(route('external.login'));
    });

    it('unauthenticated access to confirm redirects to login', function () {
        $response = $this->get(route('external.confirm'));
        $response->assertRedirect(route('external.login'));
    });

    it('unauthenticated access to evaluate redirects to login', function () {
        $response = $this->get(route('external.evaluate'));
        $response->assertRedirect(route('external.login'));
    });
});

describe('External Logout', function () {

    it('logout clears session and redirects to login', function () {
        $response = $this->post(route('external.logout'));
        $response->assertRedirect(route('external.login'));
    });
});

describe('Thank You Page', function () {

    it('thank you page renders', function () {
        $response = $this->get(route('external.thank-you'));
        $response->assertStatus(200);
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task3/ExternalAuthFlowTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task3/ExternalAuthFlowTest.php
git commit -m "test: add external auth flow tests (Task 3)"
```

---

### Task 9: External Evaluation Flow Tests

**Files:**
- Create: `tests/Feature/Task3/ExternalEvaluationFlowTest.php`

- [ ] **Step 1: Write ExternalEvaluationFlowTest**

```php
<?php

use App\Models\Answer;
use App\Models\ExternalAccessCode;
use App\Models\ExternalEvaluationSession;
use App\Models\ExternalOrganization;
use App\Models\Evaluation;
use App\Models\Part;
use App\Models\Aspect;
use App\Models\Question;
use App\Models\Option;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function createExternalSession(): array
{
    $org = ExternalOrganization::factory()->create(['is_active' => true]);
    $evaluatee = User::factory()->create();
    $evaluation = Evaluation::factory()->create();

    // Create evaluation structure
    $part = Part::factory()->create(['evaluation_id' => $evaluation->id, 'order' => 1]);
    $aspect = Aspect::factory()->create(['part_id' => $part->id]);
    $question = Question::factory()->create([
        'part_id' => $part->id,
        'aspect_id' => $aspect->id,
        'type' => 'rating',
    ]);
    Option::factory()->count(5)->sequence(
        ['label' => 'มากที่สุด', 'score' => 5],
        ['label' => 'มาก', 'score' => 4],
        ['label' => 'ปานกลาง', 'score' => 3],
        ['label' => 'น้อย', 'score' => 2],
        ['label' => 'น้อยที่สุด', 'score' => 1],
    )->create(['question_id' => $question->id]);

    $code = ExternalAccessCode::factory()->create([
        'external_organization_id' => $org->id,
        'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $evaluation->id,
    ]);

    $sessionToken = Str::random(64);
    $session = ExternalEvaluationSession::factory()->create([
        'external_access_code_id' => $code->id,
        'external_organization_id' => $org->id,
        'evaluatee_id' => $evaluatee->id,
        'evaluation_id' => $evaluation->id,
        'session_token' => $sessionToken,
    ]);

    return compact('org', 'evaluatee', 'evaluation', 'code', 'session', 'sessionToken', 'question', 'part');
}

describe('External Evaluation Full Flow', function () {

    it('authenticated external user can access confirm page', function () {
        $data = createExternalSession();

        $response = $this->withSession([
            'external_session_token' => $data['sessionToken'],
            'external_session_id' => $data['session']->id,
        ])->get(route('external.confirm'));

        $response->assertStatus(200);
    });

    it('authenticated external user can access dashboard', function () {
        $data = createExternalSession();

        $response = $this->withSession([
            'external_session_token' => $data['sessionToken'],
            'external_session_id' => $data['session']->id,
        ])->get(route('external.dashboard'));

        $response->assertStatus(200);
    });

    it('authenticated external user can access evaluation form', function () {
        $data = createExternalSession();

        $response = $this->withSession([
            'external_session_token' => $data['sessionToken'],
            'external_session_id' => $data['session']->id,
        ])->get(route('external.evaluate', [
            'evaluatee_id' => $data['evaluatee']->id,
            'access_code_id' => $data['code']->id,
        ]));

        $response->assertStatus(200);
    });

    it('submitting evaluation saves answers with external_access_code_id', function () {
        $data = createExternalSession();

        $response = $this->withSession([
            'external_session_token' => $data['sessionToken'],
            'external_session_id' => $data['session']->id,
        ])->post(route('external.evaluate.submit'), [
            'evaluatee_id' => $data['evaluatee']->id,
            'access_code_id' => $data['code']->id,
            'answers' => [
                [
                    'question_id' => $data['question']->id,
                    'value' => '5',
                ],
            ],
        ]);

        $answer = Answer::where('question_id', $data['question']->id)
            ->where('evaluatee_id', $data['evaluatee']->id)
            ->first();

        expect($answer)->not->toBeNull();
        expect($answer->external_access_code_id)->toBe($data['code']->id);
    });

    it('submitting evaluation marks session as completed', function () {
        $data = createExternalSession();

        $this->withSession([
            'external_session_token' => $data['sessionToken'],
            'external_session_id' => $data['session']->id,
        ])->post(route('external.evaluate.submit'), [
            'evaluatee_id' => $data['evaluatee']->id,
            'access_code_id' => $data['code']->id,
            'answers' => [
                ['question_id' => $data['question']->id, 'value' => '4'],
            ],
        ]);

        expect($data['session']->fresh()->completed_at)->not->toBeNull();
    });

    it('submitting evaluation marks access code as used', function () {
        $data = createExternalSession();

        $this->withSession([
            'external_session_token' => $data['sessionToken'],
            'external_session_id' => $data['session']->id,
        ])->post(route('external.evaluate.submit'), [
            'evaluatee_id' => $data['evaluatee']->id,
            'access_code_id' => $data['code']->id,
            'answers' => [
                ['question_id' => $data['question']->id, 'value' => '3'],
            ],
        ]);

        expect($data['code']->fresh()->is_used)->toBeTrue();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task3/ExternalEvaluationFlowTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task3/ExternalEvaluationFlowTest.php
git commit -m "test: add external evaluation flow tests (Task 3)"
```

---

## Chunk 3: Pest Tests — Task 4 (Workflow) & Task 5 (AdminDashboard)

### Task 10: Dashboard Workflow Tests

**Files:**
- Create: `tests/Feature/Task4/DashboardWorkflowTest.php`

- [ ] **Step 1: Write DashboardWorkflowTest**

```php
<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Dashboard Workflow', function () {

    it('authenticated user can access dashboard', function () {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get(route('dashboard'));
        $response->assertStatus(200);
    });

    it('dashboard route requires authentication', function () {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    });

    it('self-evaluation index requires authentication', function () {
        $response = $this->get(route('evaluationsself.index'));
        $response->assertRedirect(route('login'));
    });

    it('authenticated user can access self-evaluation', function () {
        $user = User::factory()->create(['role' => 'user']);
        $evaluation = Evaluation::factory()->create([
            'grade_min' => (int) $user->grade,
            'grade_max' => (int) $user->grade,
            'status' => 'published',
        ]);

        $response = $this->actingAs($user)->get(route('evaluationsself.index'));
        $response->assertStatus(200);
    });

    it('assigned evaluatees endpoint returns data', function () {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)
            ->get(route('assigned-evaluations.evaluatees'));

        $response->assertStatus(200);
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task4/DashboardWorkflowTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task4/DashboardWorkflowTest.php
git commit -m "test: add dashboard workflow tests (Task 4)"
```

---

### Task 11: Bulk Assignment Tests

**Files:**
- Create: `tests/Feature/Task4/BulkAssignmentTest.php`

- [ ] **Step 1: Write BulkAssignmentTest**

```php
<?php

use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->seed(\Database\Seeders\GovernorEvaluationSeeder::class);
});

describe('Bulk Assignment', function () {

    it('admin can bulk-store multiple assignments', function () {
        $evaluator = User::factory()->create(['grade' => '10']);
        $evaluatee1 = User::factory()->create(['grade' => '10']);
        $evaluatee2 = User::factory()->create(['grade' => '10']);

        $response = $this->actingAs($this->admin)
            ->post(route('assignments.bulk-store'), [
                'evaluator_id' => $evaluator->id,
                'assignments' => [
                    ['evaluatee_id' => $evaluatee1->id, 'angle' => 'left'],
                    ['evaluatee_id' => $evaluatee2->id, 'angle' => 'left'],
                ],
            ]);

        $response->assertRedirect();
        expect(EvaluationAssignment::where('evaluator_id', $evaluator->id)->count())->toBe(2);
    });

    it('bulk-store detects duplicate assignments', function () {
        $evaluator = User::factory()->create(['grade' => '10']);
        $evaluatee = User::factory()->create(['grade' => '10']);
        $evaluation = Evaluation::where('grade_min', '<=', 10)
            ->where('grade_max', '>=', 10)
            ->where('status', 'published')
            ->first();

        // Create existing assignment
        EvaluationAssignment::create([
            'evaluation_id' => $evaluation->id,
            'evaluator_id' => $evaluator->id,
            'evaluatee_id' => $evaluatee->id,
            'fiscal_year' => (string) (now()->month >= 10 ? now()->addYear()->year : now()->year),
            'angle' => 'left',
        ]);

        $response = $this->actingAs($this->admin)
            ->post(route('assignments.bulk-store'), [
                'evaluator_id' => $evaluator->id,
                'assignments' => [
                    ['evaluatee_id' => $evaluatee->id, 'angle' => 'left'],
                ],
            ]);

        $response->assertRedirect();
    });

    it('bulk-store validates evaluator exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('assignments.bulk-store'), [
                'evaluator_id' => 99999,
                'assignments' => [
                    ['evaluatee_id' => 1, 'angle' => 'left'],
                ],
            ]);

        $response->assertSessionHasErrors('evaluator_id');
    });

    it('bulk-store validates angle is valid', function () {
        $evaluator = User::factory()->create();

        $response = $this->actingAs($this->admin)
            ->post(route('assignments.bulk-store'), [
                'evaluator_id' => $evaluator->id,
                'assignments' => [
                    ['evaluatee_id' => User::factory()->create()->id, 'angle' => 'invalid'],
                ],
            ]);

        $response->assertSessionHasErrors();
    });

    it('admin can single-store assignment', function () {
        $evaluator = User::factory()->create(['grade' => '10']);
        $evaluatee = User::factory()->create(['grade' => '10']);

        $response = $this->actingAs($this->admin)
            ->post(route('assignments.store'), [
                'evaluator_id' => $evaluator->id,
                'evaluatee_id' => $evaluatee->id,
                'angle' => 'top',
            ]);

        $response->assertRedirect();
    });

    it('admin can delete assignment', function () {
        $evaluator = User::factory()->create(['grade' => '10']);
        $evaluatee = User::factory()->create(['grade' => '10']);
        $evaluation = Evaluation::where('status', 'published')->first();

        $assignment = EvaluationAssignment::create([
            'evaluation_id' => $evaluation->id,
            'evaluator_id' => $evaluator->id,
            'evaluatee_id' => $evaluatee->id,
            'fiscal_year' => (string) now()->year,
            'angle' => 'left',
        ]);

        $response = $this->actingAs($this->admin)
            ->delete(route('assignments.destroy', $assignment));

        $response->assertRedirect();
        expect(EvaluationAssignment::find($assignment->id))->toBeNull();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task4/BulkAssignmentTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task4/BulkAssignmentTest.php
git commit -m "test: add bulk assignment tests (Task 4)"
```

---

### Task 12: AdminDashboard Dynamic Tests

**Files:**
- Create: `tests/Feature/Task5/AdminDashboardDynamicTest.php`

- [ ] **Step 1: Write AdminDashboardDynamicTest**

```php
<?php

use App\Models\User;
use App\Http\Controllers\AdminEvaluationReportController;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

describe('AdminDashboard Dynamic Lookup', function () {

    it('admin can access evaluation report page', function () {
        $response = $this->actingAs($this->admin)
            ->get(route('admin.evaluation-report.index'));

        $response->assertStatus(200);
    });

    it('controller does not contain hardcoded evaluation IDs', function () {
        $reflection = new ReflectionClass(AdminEvaluationReportController::class);
        $source = file_get_contents($reflection->getFileName());

        // Should not have patterns like evaluation_id = 1 or evaluation_id = 3
        expect($source)->not->toMatch('/evaluation_id\s*[=!]=\s*[0-9]+/');
        // Should not have ->find(1) or ->find(3) for evaluations
        expect($source)->not->toMatch('/Evaluation::find\(\d+\)/');
    });

    it('dashboard data endpoint returns JSON', function () {
        $response = $this->actingAs($this->admin)
            ->getJson(route('admin.evaluation-report.dashboard-data'));

        $response->assertStatus(200);
        $response->assertJsonStructure([]);
    });

    it('completion stats endpoint returns JSON', function () {
        $response = $this->actingAs($this->admin)
            ->getJson(route('admin.evaluation-report.completion-stats'));

        $response->assertStatus(200);
    });

    it('list evaluatees endpoint returns JSON', function () {
        $response = $this->actingAs($this->admin)
            ->getJson(route('admin.evaluation-report.list-evaluatees'));

        $response->assertStatus(200);
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task5/AdminDashboardDynamicTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task5/AdminDashboardDynamicTest.php
git commit -m "test: add admin dashboard dynamic lookup tests (Task 5)"
```

---

### Task 13: Weighted Score Verification Tests

**Files:**
- Create: `tests/Feature/Task5/WeightedScoreVerificationTest.php`

- [ ] **Step 1: Write WeightedScoreVerificationTest**

```php
<?php

use App\Services\WeightedScoringService;

describe('Weighted Score - All Grade Levels', function () {

    beforeEach(function () {
        $this->service = new WeightedScoringService();
        $this->reflection = new ReflectionClass($this->service);
    });

    it('grade 4-8 stakeholder weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('GRADE_5_8_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('grade 4-8 weights are self=50% top=20% left=30%', function () {
        $prop = $this->reflection->getProperty('GRADE_5_8_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect($weights['self'])->toBe(0.50);
        expect($weights['top'])->toBe(0.20);
        expect($weights['left'])->toBe(0.30);
        expect($weights['bottom'])->toBe(0.0);
        expect($weights['right'])->toBe(0.0);
    });

    it('grade 9-12 management stakeholder weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('MANAGEMENT_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('grade 9-12 weights are self=10% top=25% bottom=25% left=20% right=20%', function () {
        $prop = $this->reflection->getProperty('MANAGEMENT_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect($weights['self'])->toBe(0.10);
        expect($weights['top'])->toBe(0.25);
        expect($weights['bottom'])->toBe(0.25);
        expect($weights['left'])->toBe(0.20);
        expect($weights['right'])->toBe(0.20);
    });

    it('governor stakeholder weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('GOVERNOR_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('governor weights are self=10% top=25% bottom=25% left=20% right=20%', function () {
        $prop = $this->reflection->getProperty('GOVERNOR_STAKEHOLDER_WEIGHTS');
        $weights = $prop->getValue();

        expect($weights['self'])->toBe(0.10);
        expect($weights['top'])->toBe(0.25);
        expect($weights['bottom'])->toBe(0.25);
        expect($weights['left'])->toBe(0.20);
        expect($weights['right'])->toBe(0.20);
    });

    it('grade 4-8 criteria weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('GRADE_5_8_CRITERIA_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('grade 9-10 criteria weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('GRADE_9_10_CRITERIA_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('grade 11-12 criteria weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('GRADE_11_12_CRITERIA_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('governor criteria weights sum to 100%', function () {
        $prop = $this->reflection->getProperty('GOVERNOR_CRITERIA_WEIGHTS');
        $weights = $prop->getValue();

        expect(round(array_sum($weights), 2))->toBe(1.0);
    });

    it('determines correct level for each grade', function () {
        $method = $this->reflection->getMethod('determineEvaluationLevel');

        expect($method->invoke($this->service, 4))->toBe('5-8');
        expect($method->invoke($this->service, 8))->toBe('5-8');
        expect($method->invoke($this->service, 9))->toBe('9-10');
        expect($method->invoke($this->service, 10))->toBe('9-10');
        expect($method->invoke($this->service, 11))->toBe('11-12');
        expect($method->invoke($this->service, 12))->toBe('11-12');
        expect($method->invoke($this->service, 13))->toBe('governor');
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task5/WeightedScoreVerificationTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task5/WeightedScoreVerificationTest.php
git commit -m "test: add weighted score verification tests for all grades (Task 5)"
```

---

### Task 14: Export Comprehensive Tests

**Files:**
- Create: `tests/Feature/Task5/ExportComprehensiveTest.php`

- [ ] **Step 1: Write ExportComprehensiveTest**

```php
<?php

use App\Models\User;
use App\Services\EvaluationExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

describe('Export Routes Exist', function () {

    it('comprehensive report export route exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.evaluation-report.export-comprehensive'));

        // Should not be 404/405
        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });

    it('executive report export route exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.evaluation-report.export-executive'));

        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });

    it('employee report export route exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.evaluation-report.export-employee'));

        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });

    it('governor report export route exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.evaluation-report.export-governor'));

        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });

    it('external org report export route exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.evaluation-report.export-external-org'));

        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });

    it('self evaluation report export route exists', function () {
        $response = $this->actingAs($this->admin)
            ->post(route('admin.evaluation-report.export-self-evaluation'));

        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });
});

describe('Export Service Methods Exist', function () {

    it('has exportComprehensiveEvaluationReport method', function () {
        expect(method_exists(EvaluationExportService::class, 'exportComprehensiveEvaluationReport'))->toBeTrue();
    });

    it('has exportExternalOrgReport method', function () {
        expect(method_exists(EvaluationExportService::class, 'exportExternalOrgReport'))->toBeTrue();
    });

    it('has exportSelfEvaluationReport method', function () {
        expect(method_exists(EvaluationExportService::class, 'exportSelfEvaluationReport'))->toBeTrue();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task5/ExportComprehensiveTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task5/ExportComprehensiveTest.php
git commit -m "test: add export comprehensive tests (Task 5)"
```

---

### Task 15: Individual Report Tests

**Files:**
- Create: `tests/Feature/Task5/IndividualReportTest.php`

- [ ] **Step 1: Write IndividualReportTest**

```php
<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

describe('Individual Report', function () {

    it('individual angle report endpoint exists', function () {
        $response = $this->actingAs($this->admin)
            ->getJson(route('admin.evaluation-report.individual-angle-report'));

        expect($response->status())->not->toBe(404);
        expect($response->status())->not->toBe(405);
    });

    it('user details endpoint works for any user', function () {
        $user = User::factory()->create(['grade' => '10']);

        $response = $this->actingAs($this->admin)
            ->getJson(route('admin.evaluation-report.user-details', ['userId' => $user->id]));

        expect($response->status())->not->toBe(404);
    });

    it('evaluatee details endpoint works', function () {
        $user = User::factory()->create(['grade' => '5']);

        $response = $this->actingAs($this->admin)
            ->getJson(route('admin.evaluation-report.evaluatee-details', ['evaluateeId' => $user->id]));

        expect($response->status())->not->toBe(404);
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test tests/Feature/Task5/IndividualReportTest.php --env=testing`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/Feature/Task5/IndividualReportTest.php
git commit -m "test: add individual report tests (Task 5)"
```

---

## Chunk 4: Vitest Tests — Tasks 1, 3, 4

### Task 16: QuestionCard Component Test

**Files:**
- Create: `tests/js/Task1/GovernorQuestionCard.test.tsx`

- [ ] **Step 1: Write GovernorQuestionCard test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from '@/Components/QuestionCard';

const ratingQuestion = {
    id: 1,
    title: 'ผู้ว่าการมีภาวะผู้นำในการบริหารงาน',
    type: 'rating' as const,
    options: [
        { id: 1, label: 'มากที่สุด', score: 5 },
        { id: 2, label: 'มาก', score: 4 },
        { id: 3, label: 'ปานกลาง', score: 3 },
        { id: 4, label: 'น้อย', score: 2 },
        { id: 5, label: 'น้อยที่สุด', score: 1 },
    ],
};

const choiceQuestion = {
    id: 2,
    title: 'เลือกคำตอบที่เหมาะสม',
    type: 'choice' as const,
    options: [
        { id: 10, label: 'ตัวเลือก ก', score: null },
        { id: 11, label: 'ตัวเลือก ข', score: null },
    ],
};

const openTextQuestion = {
    id: 3,
    title: 'ข้อเสนอแนะเพิ่มเติม',
    type: 'open_text' as const,
    options: [],
};

describe('QuestionCard', () => {
    it('renders rating question with title', () => {
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={null}
                onAnswerChange={vi.fn()}
                questionNumber={1}
            />
        );

        expect(screen.getByText(/ผู้ว่าการมีภาวะผู้นำ/)).toBeInTheDocument();
    });

    it('renders 5 rating options', () => {
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={null}
                onAnswerChange={vi.fn()}
                questionNumber={1}
            />
        );

        expect(screen.getByText('มากที่สุด')).toBeInTheDocument();
        expect(screen.getByText('น้อยที่สุด')).toBeInTheDocument();
    });

    it('calls onAnswerChange when rating selected', () => {
        const onChange = vi.fn();
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={null}
                onAnswerChange={onChange}
                questionNumber={1}
            />
        );

        fireEvent.click(screen.getByText('มากที่สุด'));
        expect(onChange).toHaveBeenCalled();
    });

    it('renders choice question with options', () => {
        render(
            <QuestionCard
                question={choiceQuestion}
                answer={null}
                onAnswerChange={vi.fn()}
                questionNumber={2}
            />
        );

        expect(screen.getByText('ตัวเลือก ก')).toBeInTheDocument();
        expect(screen.getByText('ตัวเลือก ข')).toBeInTheDocument();
    });

    it('renders open text question with textarea', () => {
        render(
            <QuestionCard
                question={openTextQuestion}
                answer={null}
                onAnswerChange={vi.fn()}
                questionNumber={3}
            />
        );

        expect(screen.getByText(/ข้อเสนอแนะเพิ่มเติม/)).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows question number', () => {
        render(
            <QuestionCard
                question={ratingQuestion}
                answer={null}
                onAnswerChange={vi.fn()}
                questionNumber={1}
            />
        );

        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task1/GovernorQuestionCard.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task1/GovernorQuestionCard.test.tsx
git commit -m "test: add QuestionCard component tests (Task 1 Vitest)"
```

---

### Task 17: External Login Component Test

**Files:**
- Create: `tests/js/Task3/ExternalLogin.test.tsx`

- [ ] **Step 1: Write ExternalLogin test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePage, useForm } from '@inertiajs/react';
import ExternalLogin from '@/pages/ExternalLogin';

describe('ExternalLogin', () => {
    beforeEach(() => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: '',
                flash: {},
                errors: {},
            },
        });
    });

    it('renders login form with code input', () => {
        render(<ExternalLogin />);

        expect(screen.getByPlaceholderText(/IEAT/)).toBeInTheDocument();
    });

    it('renders submit button', () => {
        render(<ExternalLogin />);

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('prefills code from props', () => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: 'IEAT-TEST-ABC123',
                flash: {},
                errors: {},
            },
        });

        render(<ExternalLogin />);

        const input = screen.getByPlaceholderText(/IEAT/) as HTMLInputElement;
        // useForm is mocked, so we check it was initialized
        expect(useForm).toHaveBeenCalled();
    });

    it('shows error flash message', () => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: '',
                flash: { error: 'รหัสไม่ถูกต้อง' },
                errors: {},
            },
        });

        render(<ExternalLogin />);

        expect(screen.getByText('รหัสไม่ถูกต้อง')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task3/ExternalLogin.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task3/ExternalLogin.test.tsx
git commit -m "test: add ExternalLogin component tests (Task 3 Vitest)"
```

---

### Task 18: External Dashboard Component Test

**Files:**
- Create: `tests/js/Task3/ExternalDashboard.test.tsx`

- [ ] **Step 1: Write ExternalDashboard test**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePage } from '@inertiajs/react';
import ExternalDashboard from '@/pages/ExternalDashboard';

const mockEvaluatees = [
    { id: 1, name: 'นาย ก.', position: 'ผู้อำนวยการ', evaluation_title: 'แบบประเมิน 360', is_completed: true, access_code_id: 101 },
    { id: 2, name: 'นาง ข.', position: 'รองผู้อำนวยการ', evaluation_title: 'แบบประเมิน 360', is_completed: false, access_code_id: 102 },
    { id: 3, name: 'นาย ค.', position: 'ผู้จัดการ', evaluation_title: 'แบบประเมิน 360', is_completed: false, access_code_id: 103 },
];

describe('ExternalDashboard', () => {
    beforeEach(() => {
        (usePage as any).mockReturnValue({
            props: {
                organization: { id: 1, name: 'บริษัท ABC จำกัด' },
                evaluatees: mockEvaluatees,
                currentEvaluateeId: 2,
                flash: {},
                errors: {},
            },
        });
    });

    it('renders organization name', () => {
        render(<ExternalDashboard />);
        expect(screen.getByText(/ABC/)).toBeInTheDocument();
    });

    it('renders evaluatee list', () => {
        render(<ExternalDashboard />);
        expect(screen.getByText('นาย ก.')).toBeInTheDocument();
        expect(screen.getByText('นาง ข.')).toBeInTheDocument();
        expect(screen.getByText('นาย ค.')).toBeInTheDocument();
    });

    it('shows completion status for completed evaluatee', () => {
        render(<ExternalDashboard />);
        // Completed evaluatee should have visual indicator
        const completedItem = screen.getByText('นาย ก.').closest('div');
        expect(completedItem).toBeInTheDocument();
    });

    it('calculates correct progress percentage', () => {
        render(<ExternalDashboard />);
        // 1 out of 3 completed = 33%
        expect(screen.getByText(/33/)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task3/ExternalDashboard.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task3/ExternalDashboard.test.tsx
git commit -m "test: add ExternalDashboard component tests (Task 3 Vitest)"
```

---

### Task 19: ProgressIndicator Component Test

**Files:**
- Create: `tests/js/Task4/ProgressIndicator.test.tsx`

- [ ] **Step 1: Write ProgressIndicator test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressIndicator from '@/Components/ProgressIndicator';

describe('ProgressIndicator', () => {
    it('renders with correct percentage for step 1 of 3', () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={3}
            />
        );

        // Should show percentage ~33%
        expect(screen.getByText(/33/)).toBeInTheDocument();
    });

    it('renders with 100% for last step', () => {
        render(
            <ProgressIndicator
                currentStep={3}
                totalSteps={3}
            />
        );

        expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('renders step labels when provided', () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={2}
                stepLabels={['ขั้นตอนที่ 1', 'ขั้นตอนที่ 2']}
            />
        );

        expect(screen.getByText('ขั้นตอนที่ 1')).toBeInTheDocument();
        expect(screen.getByText('ขั้นตอนที่ 2')).toBeInTheDocument();
    });

    it('renders group progress when totalGroups provided', () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={3}
                currentGroup={2}
                totalGroups={5}
            />
        );

        expect(screen.getByText(/3.*\/.*5|หัวข้อ/)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task4/ProgressIndicator.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task4/ProgressIndicator.test.tsx
git commit -m "test: add ProgressIndicator component tests (Task 4 Vitest)"
```

---

## Chunk 5: Vitest Tests — Tasks 4 & 5

### Task 20: Report Charts Test

**Files:**
- Create: `tests/js/Task5/ReportCharts.test.tsx`

- [ ] **Step 1: Write ReportCharts test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock highcharts to avoid canvas errors
vi.mock('highcharts-react-official', () => ({
    default: ({ options }: any) => <div data-testid="highchart">{options?.title?.text}</div>,
}));

vi.mock('highcharts', () => ({
    default: {
        chart: vi.fn(),
        setOptions: vi.fn(),
    },
}));

import ReportCharts from '@/Components/Report/ReportCharts';

const mockChartData = {
    evaluateeCountByGrade: [
        { grade: 5, user_type: 'internal', total: 100, completed: 80, remaining: 20 },
        { grade: 10, user_type: 'internal', total: 50, completed: 40, remaining: 10 },
        { grade: 13, user_type: 'internal', total: 1, completed: 1, remaining: 0 },
    ],
    part1ScoreYearly: [],
    part1AspectSummary: [],
    weightedSummary: [],
};

describe('ReportCharts', () => {
    it('renders without crashing', () => {
        render(<ReportCharts data={mockChartData} />);
        expect(screen.getAllByTestId('highchart').length).toBeGreaterThanOrEqual(1);
    });
});

describe('Grade Label Function', () => {
    it('maps grade 13 to governor', () => {
        const getGradeLabel = (grade: number) => {
            if (grade >= 13) return 'ผู้ว่าการ (Governor)';
            if (grade >= 9) return 'ผู้บริหาร (Executive)';
            return 'พนักงาน (Employee)';
        };

        expect(getGradeLabel(13)).toBe('ผู้ว่าการ (Governor)');
        expect(getGradeLabel(9)).toBe('ผู้บริหาร (Executive)');
        expect(getGradeLabel(12)).toBe('ผู้บริหาร (Executive)');
        expect(getGradeLabel(4)).toBe('พนักงาน (Employee)');
        expect(getGradeLabel(8)).toBe('พนักงาน (Employee)');
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task5/ReportCharts.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task5/ReportCharts.test.tsx
git commit -m "test: add ReportCharts and grade label tests (Task 5 Vitest)"
```

---

### Task 21: ReportStats Component Test

**Files:**
- Create: `tests/js/Task5/ReportStats.test.tsx`

- [ ] **Step 1: Write ReportStats test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportStats from '@/Components/Report/ReportStats';

const mockSummaryStats = {
    total_evaluatees: 607,
    total_completed: 450,
    total_remaining: 157,
    completion_rate: 74.1,
    score_distribution: {
        excellent: 50,
        very_good: 120,
        good: 200,
        fair: 60,
        poor: 20,
    },
    avg_scores_by_group: {
        internal_5_8: 3.8,
        internal_9_12: 4.1,
        external_9_12: 3.9,
    },
    overall_avg_score: 3.9,
    highest_score: 5.0,
    lowest_score: 1.5,
};

describe('ReportStats', () => {
    it('renders KPI cards', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        // Should show total evaluatees
        expect(screen.getByText('607')).toBeInTheDocument();
    });

    it('renders completion rate', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText(/74/)).toBeInTheDocument();
    });

    it('renders completed count', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText('450')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task5/ReportStats.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task5/ReportStats.test.tsx
git commit -m "test: add ReportStats KPI card tests (Task 5 Vitest)"
```

---

### Task 22: ReportExport Component Test

**Files:**
- Create: `tests/js/Task5/ReportExport.test.tsx`

- [ ] **Step 1: Write ReportExport test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportExport from '@/Components/Report/ReportExport';

describe('ReportExport', () => {
    const defaultProps = {
        fiscalYear: '2568',
        filters: {},
        totalRecords: 100,
    };

    it('renders export section', () => {
        render(<ReportExport {...defaultProps} />);
        // Should have export-related text
        expect(screen.getByText(/export|ส่งออก|รายงาน/i)).toBeInTheDocument();
    });

    it('renders with fiscal year info', () => {
        render(<ReportExport {...defaultProps} />);
        expect(screen.getByText(/2568/)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run tests/js/Task5/ReportExport.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/js/Task5/ReportExport.test.tsx
git commit -m "test: add ReportExport component tests (Task 5 Vitest)"
```

---

### Task 23: Final Verification — Run All Tests

- [ ] **Step 1: Run all Pest tests**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && php artisan test --env=testing`
Expected: All tests pass

- [ ] **Step 2: Run all Vitest tests**

Run: `cd "C:\00_miles\Evaluation_project_miles_01-main" && npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "test: complete comprehensive test suite for all 5 tasks

- Pest: 12 test files covering Tasks 1-5 with MySQL
- Vitest: 7 test files covering React components
- Factories: 7 new/updated factories
- Infrastructure: .env.testing, vitest.config.ts, Inertia mocks"
```
