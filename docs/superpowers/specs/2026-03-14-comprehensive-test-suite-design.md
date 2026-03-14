# Comprehensive Test Suite Design — 360° Evaluation System

> **Date**: 2026-03-14
> **Scope**: All 5 Tasks from project_proposal.md
> **Tools**: Pest (PHP/MySQL), Vitest (React/jsdom)
> **Approach**: TDD comprehensive verification against proposal spec

---

## 1. Infrastructure Setup

### 1.1 Pest (PHP)

- Create `.env.testing` pointing to a separate MySQL test database
- Update `phpunit.xml` to load `.env.testing`
- Use `RefreshDatabase` trait for clean state per test
- Create 7 missing factories: `EvaluationAssignment`, `ExternalOrganization`, `ExternalAccessCode`, `ExternalEvaluationSession`, `Answer`, `Part`, `SubAspect`

### 1.2 Vitest (React)

- Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
- Create `vitest.config.ts` extending `vite.config.js` with jsdom test environment
- Create `tests/js/setup.ts` for global mocks (Inertia usePage, router, Link)
- Create `tests/js/helpers/inertia-mock.ts` for reusable Inertia mocks

---

## 2. Pest Test Plan (~12 files, ~80-100 test cases)

### Task 1 — Governor Evaluation

**GovernorEvaluationStructureTest.php**
- Migration creates evaluations supporting grade 13
- GovernorEvaluationSeeder creates 3 evaluations (internal/external/self)
- Internal evaluation has 2+ parts, Part 1 has 6 aspects
- Each aspect has questions with options
- Aspect weights sum to 100%
- Questions have correct type (rating/choice/text)

**GovernorAssignmentTest.php**
- Dynamic lookup finds evaluation by grade 13
- Assignment CRUD for governor evaluatees
- Angle weights: top 25%, bottom 25%, self 10%, left 20%, right 20%
- Weights sum to 100%
- Fiscal year calculation correct

### Task 3 — External Organization Login

**ExternalOrganizationCrudTest.php**
- Admin can create organization with name + org_code
- org_code stored uppercase, unique
- Admin can update organization
- Cannot delete org with existing access codes
- Can delete org without access codes
- Index with search and pagination

**ExternalAccessCodeTest.php**
- Code format: IEAT-[ORG_CODE]-[RANDOM6]
- Bulk generate multiple codes for one org
- Revoke marks code as used
- Regenerate creates new code preserving org/evaluatee
- QR code generation (SVG)
- Print cards returns PDF
- Export codes returns CSV
- Cannot delete used codes

**ExternalAuthFlowTest.php**
- Login with valid access code creates session
- Login with invalid/expired/used code rejected
- Middleware blocks unauthenticated access to protected routes
- Middleware allows authenticated access
- Session expires after 8 hours
- Rate limiting: 5 attempts/minute on login
- Logout clears session

**ExternalEvaluationFlowTest.php**
- Full flow: login → confirm → dashboard → evaluate → submit → thank you
- Dashboard shows all evaluatees with completion status
- Answers saved with external_access_code_id
- Submit marks session as completed and code as used
- Cannot re-evaluate after submission

### Task 4 — Workflow Adjustment

**DashboardWorkflowTest.php**
- Dashboard endpoint returns self-evaluation assignments (step 1)
- Dashboard endpoint returns other-evaluation assignments (step 2)
- Progress calculation: completed/total correct
- Step 2 data includes evaluatee info and status

**BulkAssignmentTest.php**
- Bulk-store accepts array of evaluatee assignments
- Creates all assignments in one request
- Detects and reports duplicates
- Validates evaluator and evaluatee exist
- Returns created_count, duplicate_count, invalid_count

### Task 5 — AdminDashboard

**AdminDashboardDynamicTest.php**
- Controller uses dynamic evaluation lookup (no hardcoded IDs)
- Dashboard stats include all grade groups
- Stats filter by fiscal year
- External org metrics included
- Available fiscal years returned

**WeightedScoreVerificationTest.php**
- Grade 4-8: self 50%, top 20%, left 30%
- Grade 9-12: self 10%, top 25%, bottom 25%, left 20%, right 20%
- Grade 13: self 10%, top 25%, bottom 25%, left 20%, right 20%
- All weight sets sum to 100%
- Criteria weights per level sum to 100%
- Missing angles handled gracefully (redistributed)

**ExportComprehensiveTest.php**
- Export employee evaluation sheet (grade 4-8)
- Export executive evaluation sheet (grade 9-12)
- Export governor evaluation sheet (grade 13)
- Export external org report
- Comprehensive report includes all three sheets
- Export filters by fiscal year

**IndividualReportTest.php**
- Individual report works for grade 4-8 user
- Individual report works for grade 9-12 user
- Individual report works for grade 13 user
- Report includes angle-specific scores
- Weighted score calculated correctly per grade

---

## 3. Vitest Test Plan (~13 files, ~60-80 test cases)

### Task 1 — Governor Evaluation

**GovernorQuestionCard.test.tsx**
- Renders rating question with 1-5 options
- Renders choice question with options
- Renders text question with textarea
- Calls onChange when answer selected
- Shows selected state correctly

### Task 3 — External Flow

**ExternalLogin.test.tsx**
- Renders access code input form
- Shows validation error on empty submit
- Prefills code from query parameter
- Submit button calls POST with code

**ExternalDashboard.test.tsx**
- Renders evaluatee list
- Shows completion status icons per evaluatee
- Displays progress bar with percentage
- Renders logout button
- Shows organization name

**ExternalEvaluation.test.tsx**
- Renders evaluation form with questions
- Navigation between question groups
- Displays evaluatee info header

### Task 4 — Workflow

**Dashboard.test.tsx**
- Renders Step 1 (self-evaluation) section
- Renders Step 2 (evaluate others) section
- Step 2 shows lock message when Step 1 incomplete
- Step 2 unlocked when Step 1 complete
- Progress percentage displays correctly
- Evaluatee cards show correct status (completed/pending/not started)
- Welcome header with user name

**SelfEvaluationStep.test.tsx**
- Save indicator shows correct state (idle/saving/saved/error)
- Completion modal appears after final submit
- Modal has return-to-dashboard button
- Renders questions for current part

**AssignedEvaluationStep.test.tsx**
- Completion modal shows evaluatee name
- Renders evaluatee info card

**ProgressIndicator.test.tsx**
- Circular progress ring renders with correct percentage
- Step pills show completion state
- Connector between steps shows progress

**AdminEvaluationAssignmentForm.test.tsx**
- Renders 3-step form (evaluator → angle → evaluatees)
- Step 1: evaluator selection
- Step 2: angle selection
- Step 3: multiple evaluatee selection
- Add all filtered evaluatees button works
- Clear all button works
- Submit sends bulk payload

### Task 5 — AdminDashboard

**AdminEvaluationReport.test.tsx**
- Renders tab navigation (Overview/Analytics/Reports/Exports)
- Filter controls render (grade, division, search)
- Tab switching works

**ReportCharts.test.tsx**
- Grade label: 13 → "ผู้ว่าการ (Governor)"
- Grade label: 9-12 → "ผู้บริหาร (Executive)"
- Grade label: 4-8 → "พนักงาน (Employee)"

**ReportExport.test.tsx**
- Export modal renders with options
- Export type selection works

**ReportStats.test.tsx**
- KPI cards render with data values
- Shows participant count, completion rate

---

## 4. File Structure

```
tests/
├── Feature/
│   ├── Task1/
│   │   ├── GovernorEvaluationStructureTest.php
│   │   └── GovernorAssignmentTest.php
│   ├── Task3/
│   │   ├── ExternalOrganizationCrudTest.php
│   │   ├── ExternalAccessCodeTest.php
│   │   ├── ExternalAuthFlowTest.php
│   │   └── ExternalEvaluationFlowTest.php
│   ├── Task4/
│   │   ├── DashboardWorkflowTest.php
│   │   └── BulkAssignmentTest.php
│   └── Task5/
│       ├── AdminDashboardDynamicTest.php
│       ├── WeightedScoreVerificationTest.php
│       ├── ExportComprehensiveTest.php
│       └── IndividualReportTest.php
├── js/
│   ├── setup.ts
│   ├── helpers/
│   │   └── inertia-mock.ts
│   ├── Task1/
│   │   └── GovernorQuestionCard.test.tsx
│   ├── Task3/
│   │   ├── ExternalLogin.test.tsx
│   │   ├── ExternalDashboard.test.tsx
│   │   └── ExternalEvaluation.test.tsx
│   ├── Task4/
│   │   ├── Dashboard.test.tsx
│   │   ├── SelfEvaluationStep.test.tsx
│   │   ├── AssignedEvaluationStep.test.tsx
│   │   ├── ProgressIndicator.test.tsx
│   │   └── AdminEvaluationAssignmentForm.test.tsx
│   └── Task5/
│       ├── AdminEvaluationReport.test.tsx
│       ├── ReportCharts.test.tsx
│       ├── ReportExport.test.tsx
│       └── ReportStats.test.tsx

database/factories/
├── EvaluationAssignmentFactory.php  (new)
├── ExternalOrganizationFactory.php  (new)
├── ExternalAccessCodeFactory.php    (new)
├── ExternalEvaluationSessionFactory.php (new)
├── AnswerFactory.php                (update)
├── PartFactory.php                  (new)
└── SubAspectFactory.php             (new)
```

---

## 5. Conventions

- **Pest**: `it('description')` syntax, `describe()` for grouping
- **Vitest**: `describe()`/`it()` blocks, `@testing-library/react` for rendering
- **Factories**: Follow Laravel convention with `HasFactory` trait
- **Assertions**: Pest `expect()` + Laravel assertions; Vitest `expect()` + jest-dom matchers
- **Mocking**: Inertia pages mock `usePage()` with typed props matching controller output
