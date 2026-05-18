# Comprehensive Testing Suite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้าง test suite ครบถ้วนทุก route, ทุก function — Pest (backend), Vitest (frontend), Playwright (E2E), Load Test (1000 concurrent users)

**Architecture:** แบ่งเป็น 3 phases: Phase A = Pest backend tests (unit + feature ครบทุก controller/service/route), Phase B = Playwright E2E (จำลอง user flows ทั้งหมด), Phase C = Load Test (k6 จำลอง 1000 คนพร้อมกัน)

**Tech Stack:** Pest PHP, Playwright, k6 (load testing), Docker

---

## Phase A: Pest Backend Tests

### ข้อมูลที่ต้องรู้

- 165 routes ใน `routes/web.php`
- Controllers: 15 ตัว ใน `app/Http/Controllers/`
- Services: 3 ตัว (ScoreCalculation, WeightedScoring, EvaluationExport)
- Models: 12 ตัว
- รันด้วย: `docker-compose exec php php artisan test`

---

### Task A1: Test Setup + Auth Tests

**Files:**
- Create: `tests/Feature/Auth/LoginTest.php`
- Create: `tests/Feature/Auth/RoleMiddlewareTest.php`

- [ ] **Step 1: สร้าง LoginTest**

```php
<?php
// tests/Feature/Auth/LoginTest.php
namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_page_loads(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create(['role' => 'user', 'password' => bcrypt('password')]);
        $response = $this->post('/login', ['emid' => $user->emid, 'password' => 'password']);
        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_admin_redirects_to_admin_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'password' => bcrypt('password')]);
        $response = $this->post('/login', ['emid' => $user->emid, 'password' => 'password']);
        $response->assertRedirect('/dashboardadmin');
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create();
        $response = $this->post('/login', ['emid' => $user->emid, 'password' => 'wrong']);
        $response->assertSessionHasErrors();
        $this->assertGuest();
    }

    public function test_logout_works(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post('/logout');
        $this->assertGuest();
    }

    public function test_guest_cannot_access_dashboard(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }
}
```

- [ ] **Step 2: สร้าง RoleMiddlewareTest**

```php
<?php
// tests/Feature/Auth/RoleMiddlewareTest.php
namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $this->actingAs($user)->get('/dashboardadmin')->assertStatus(403);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/dashboardadmin')->assertStatus(200);
    }

    public function test_admin_can_access_user_routes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/dashboard')->assertStatus(200);
    }
}
```

- [ ] **Step 3: รัน tests**
```bash
docker-compose exec php php artisan test tests/Feature/Auth/
```

---

### Task A2: Admin CRUD Tests (Org Structure)

**Files:**
- Create: `tests/Feature/Admin/DivisionCrudTest.php`
- Create: `tests/Feature/Admin/DepartmentCrudTest.php`
- Create: `tests/Feature/Admin/PositionCrudTest.php`
- Create: `tests/Feature/Admin/FactionCrudTest.php`

ทดสอบ CRUD ครบ (index, create, store, edit, update, destroy) สำหรับทุก entity

---

### Task A3: Admin User Management Tests

**Files:**
- Create: `tests/Feature/Admin/UserManagementTest.php`

ทดสอบ: list users, create user, update user, delete user, search, filter by role/grade/division

---

### Task A4: Evaluation Management Tests

**Files:**
- Create: `tests/Feature/Admin/EvaluationCrudTest.php`
- Create: `tests/Feature/Admin/PartAspectQuestionTest.php`

ทดสอบ: CRUD evaluations, parts, aspects, sub-aspects, questions, options, publish/unpublish, preview

---

### Task A5: Assignment System Tests

**Files:**
- Create: `tests/Feature/Admin/AssignmentTest.php`

ทดสอบ: create assignment, bulk assign, filter by fiscal year/grade/division, delete, analytics

---

### Task A6: Self-Evaluation Tests

**Files:**
- Create: `tests/Feature/Evaluation/SelfEvaluationTest.php`

ทดสอบ: load form, save answers (upsert), submit, resume, fiscal year filter, score calculation

---

### Task A7: Assigned Evaluation Tests

**Files:**
- Create: `tests/Feature/Evaluation/AssignedEvaluationTest.php`

ทดสอบ: load assignments, answer questions per evaluatee, auto-save, submit, multi-evaluatee

---

### Task A8: External Evaluation Tests

**Files:**
- Create: `tests/Feature/External/ExternalFlowTest.php`
- Create: `tests/Feature/External/AccessCodeTest.php`

ทดสอบ: login with code, confirm identity, dashboard, evaluate, submit, QR code generation, code revoke

---

### Task A9: Report & Export Tests

**Files:**
- Create: `tests/Feature/Admin/ReportTest.php`
- Create: `tests/Feature/Admin/ExportTest.php`

ทดสอบ: report page loads, filter by fiscal year, detailedResults has data, all 9 export endpoints return Excel files

---

### Task A10: Service Unit Tests

**Files:**
- Modify: `tests/Unit/ScoreCalculationServiceTest.php`
- Modify: `tests/Unit/WeightedScoringServiceTest.php`
- Create: `tests/Unit/EvaluationExportServiceTest.php`

ทดสอบ: score calculation ถูกต้อง, weighted scores ตาม grade, option ID vs direct score resolution, external org score

---

### Task A11: Satisfaction Evaluation Tests

**Files:**
- Create: `tests/Feature/SatisfactionEvaluationTest.php`

ทดสอบ: show form, submit, duplicate prevention (unique constraint), results page, fiscal year filter

---

## Phase B: Playwright E2E Tests

### Task B1: Auth E2E

**Files:**
- Modify: `tests/e2e/auth.spec.ts`

ทดสอบ: login flow, redirect by role, logout, session expiry, wrong password

---

### Task B2: Admin Dashboard E2E

**Files:**
- Modify: `tests/e2e/task5-admin.spec.ts`

ทดสอบ: KPI cards show data, fiscal year selector works, grade stats show, angle breakdown shows, external org results show

---

### Task B3: User Dashboard E2E

**Files:**
- Create: `tests/e2e/user-dashboard.spec.ts`

ทดสอบ: assignments list, fiscal year change, self-evaluation link, assigned evaluation link, progress tracking

---

### Task B4: Self-Evaluation E2E

**Files:**
- Create: `tests/e2e/self-evaluation.spec.ts`

ทดสอบ: load questions, select answers, navigate parts, auto-save, submit confirmation

---

### Task B5: Report & Export E2E

**Files:**
- Create: `tests/e2e/report.spec.ts`

ทดสอบ: 4 tabs render, fiscal year change, evaluatee table shows data, export buttons download files, individual report modal opens

---

### Task B6: External Evaluation E2E

**Files:**
- Modify: `tests/e2e/task3-external.spec.ts`

ทดสอบ: login with access code, confirm identity, evaluate (select scores per question), submit, thank you page

---

### Task B7: Admin CRUD E2E

**Files:**
- Modify: `tests/e2e/admin-crud.spec.ts`

ทดสอบ: create/edit/delete division, department, position, faction, user, evaluation, assignment

---

## Phase C: Load Test (k6)

### Task C1: Setup k6

**Files:**
- Create: `tests/load/k6-config.js`
- Create: `tests/load/scenarios/login.js`
- Create: `tests/load/scenarios/dashboard.js`
- Create: `tests/load/scenarios/self-evaluation.js`
- Create: `tests/load/scenarios/report.js`
- Create: `tests/load/run-load-test.sh`

---

### Task C2: Login Scenario (1000 concurrent)

```javascript
// tests/load/scenarios/login.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 100 },   // ramp up
        { duration: '1m', target: 1000 },    // peak
        { duration: '30s', target: 0 },      // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'],   // 95% under 3s
        http_req_failed: ['rate<0.05'],       // <5% errors
    },
};

export default function () {
    const loginRes = http.post(`${__ENV.BASE_URL}/login`, {
        emid: `user_${__VU}`,
        password: 'password',
    });
    check(loginRes, { 'login status 200/302': (r) => [200, 302].includes(r.status) });
    sleep(1);
}
```

---

### Task C3: Dashboard + Report Scenario

```javascript
// tests/load/scenarios/dashboard.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 500 },
        { duration: '2m', target: 1000 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000'],
        http_req_failed: ['rate<0.05'],
    },
};

export default function () {
    // Login first
    const jar = http.cookieJar();
    const loginRes = http.post(`${__ENV.BASE_URL}/login`, { emid: 'testuser', password: 'password' });

    // Dashboard
    const dashRes = http.get(`${__ENV.BASE_URL}/dashboard`);
    check(dashRes, { 'dashboard 200': (r) => r.status === 200 });

    // Report page
    const reportRes = http.get(`${__ENV.BASE_URL}/admin/reports/evaluation?fiscal_year=2025`);
    check(reportRes, { 'report 200': (r) => r.status === 200 });

    sleep(Math.random() * 3);
}
```

---

### Task C4: Self-Evaluation Load Scenario

จำลอง 1000 คนทำแบบประเมินพร้อมกัน — POST answers ทุก 2 วินาที

---

### Task C5: Run & Analyze

```bash
# Install k6
# Run load test
k6 run --env BASE_URL=https://evaluation.milesconsult.com tests/load/scenarios/login.js
k6 run --env BASE_URL=https://evaluation.milesconsult.com tests/load/scenarios/dashboard.js

# Expected output:
# ✓ http_req_duration p(95) < 3000ms
# ✓ http_req_failed rate < 5%
# ✓ iterations > 1000
```

---

## Execution Order

```
Phase A (Pest) → รัน: docker-compose exec php php artisan test
    A1 Auth → A2 CRUD → A3 Users → A4 Eval → A5 Assign
    A6 Self → A7 Assigned → A8 External → A9 Report → A10 Services → A11 Satisfaction

Phase B (Playwright) → รัน: npx playwright test
    B1 Auth → B2 Admin Dashboard → B3 User Dashboard
    B4 Self-Eval → B5 Report → B6 External → B7 CRUD

Phase C (k6 Load Test) → รัน: k6 run
    C1 Setup → C2 Login 1000 → C3 Dashboard 1000 → C4 Self-Eval 1000 → C5 Analyze
```
