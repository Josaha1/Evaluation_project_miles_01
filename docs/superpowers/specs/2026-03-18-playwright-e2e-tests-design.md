# Playwright E2E Tests Design — 360° Evaluation System

> **Date**: 2026-03-18
> **Scope**: Full functional E2E tests for all 5 Tasks from project_proposal.md
> **Environment**: Docker (localhost:8888)
> **Tool**: Playwright Test + TypeScript

---

## 1. Architecture

- **Test runner**: Playwright Test (TypeScript)
- **Target**: Docker environment at `http://localhost:8888`
- **DB**: MariaDB seeded from SQL dump (~400+ users, 207K answers)
- **Browser**: Chromium only
- **Auth**: Shared `storageState` per role (admin, user, external)
- **Screenshots**: On failure only

### File Structure

```
tests/e2e/
├── playwright.config.ts
├── setup/
│   └── global-setup.ts       # Verify Docker running
├── helpers/
│   └── auth.ts               # Login helpers per role
├── auth.spec.ts               # Login/Logout (~5 tests)
├── task1-governor.spec.ts     # Governor evaluation (~8 tests)
├── task3-external.spec.ts     # External org login + eval (~15 tests)
├── task4-workflow.spec.ts     # Dashboard workflow (~12 tests)
└── task5-admin.spec.ts        # Admin dashboard + exports (~12 tests)
```

---

## 2. Test Accounts

| Role | emid | Password | Purpose |
|------|------|----------|---------|
| Admin | `999999` | `01012568` or `13112541` | Admin panel, CRUD, reports |
| User | from DB | `01012568` or `password123` | Self-eval, assigned-eval |
| External | access code | N/A | External login flow |

Login field: `emid` (6-digit employee ID) + password.
Default password hint in UI: `01012568`.
Seeder users use: `13112541` or `password123`.

---

## 3. Test Coverage (~52 tests)

### Auth (5 tests)
- Login success (user) → redirect dashboard
- Login success (admin) → redirect admin dashboard
- Login failure (wrong password) → error message
- Logout → redirect login
- Protected page without auth → redirect login

### Task 1 — Governor Evaluation (8 tests)
- Admin sees governor evaluations in list
- Admin can preview governor evaluation (parts/aspects/questions)
- Admin creates assignment for grade 13 evaluatee
- Admin sees governor in assignment manager
- Governor evaluation has 6 aspects in Part 1
- Governor evaluation has internal + external + self forms
- Admin can access governor export route
- Assignment form dynamically finds grade 13 evaluation

### Task 3 — External Organization Login (15 tests)
- Admin creates External Organization
- Admin edits Organization
- Admin deletes Organization (no access codes)
- Admin generates Access Codes (bulk)
- Admin views Access Code detail + QR code
- Admin revokes Access Code
- Admin regenerates Access Code
- Admin exports Access Codes as CSV
- External login page renders
- External login with valid code → confirm page
- External sees dashboard with evaluatee list
- External completes evaluation → submit → answers saved
- External sees thank you page
- External login with invalid code → error
- External logout works

### Task 4 — Workflow (12 tests)
- Dashboard shows Step 1 (self) + Step 2 (others)
- User starts self-evaluation → sees questions
- User answers questions → save indicator shows
- User navigates between parts/groups
- User submits self-evaluation → completion modal
- Dashboard shows Step 1 completed after submit
- User starts assigned evaluation → sees evaluatee info
- User answers and submits assigned evaluation
- Progress tracker displays correctly
- Admin creates single assignment
- Admin creates bulk assignment
- Admin deletes assignment

### Task 5 — AdminDashboard (12 tests)
- Admin accesses Evaluation Report page
- KPI cards show data (participants, completion rate, avg score)
- Filter by fiscal year works
- Filter by division/grade works
- Charts render without error
- Individual report displays for user
- Export Comprehensive Excel downloads
- Export Executive Excel downloads
- Export Employee Excel downloads
- Export Governor Excel downloads
- Export External Org Excel downloads
- Export PDF downloads

---

## 4. Technical Configuration

### Playwright Config
- Base URL: `http://localhost:8888`
- Browser: Chromium
- Timeout: 30s per test, 60s navigation
- Screenshots: on failure
- Video: off
- Retries: 1
- Workers: 1 (serial to avoid DB conflicts)

### Auth Helper
```typescript
// loginAsAdmin(page) → navigate to /login, fill emid + password, submit
// loginAsUser(page) → login as regular user with assignments
// loginAsExternal(page, code) → navigate to /external/login, fill code, submit
```

### Global Setup
- Fetch `http://localhost:8888` to verify Docker running
- Throw descriptive error if not available

### Test Data Strategy
- Use existing DB dump data (read-mostly)
- External flow: create org + codes via Admin UI within the test
- Do not delete data after tests

---

## 5. Package Dependencies

```
@playwright/test (install via npx playwright install)
```

No additional npm packages needed — Playwright Test includes everything.
