# Admin Evaluation Report Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the 1422-line AdminEvaluationReport page into a clean, modular architecture with proper external org integration.

**Architecture:** Extract the monolithic page into an orchestrator (~200 lines) + 4 tab components + shared types + filter hook. External org data is surfaced in Dashboard (stat card), Analytics (chart), and Reports (table). Dead features (auto-refresh, per-page theme toggle, duplicate modals) are removed.

**Tech Stack:** React, TypeScript, Inertia.js, Tailwind CSS, framer-motion, lucide-react, Highcharts (lazy)

---

## File Structure

### Files to CREATE

| File | Lines (est.) | Responsibility |
|------|-------------|----------------|
| `resources/js/pages/AdminReport/types.ts` | ~100 | All TypeScript interfaces + adapter functions |
| `resources/js/pages/AdminReport/useReportFilters.ts` | ~60 | Filter state hook (search, division, grade, external org) |
| `resources/js/pages/AdminReport/DashboardTab.tsx` | ~180 | Tab 1: KPI stats + grade breakdown + external org summary |
| `resources/js/pages/AdminReport/AnalyticsTab.tsx` | ~220 | Tab 2: Charts (division, angle, trends, external org bar chart) |
| `resources/js/pages/AdminReport/ReportsTab.tsx` | ~180 | Tab 3: Evaluatee results table/cards + external org table |
| `resources/js/pages/AdminReport/ExportsTab.tsx` | ~140 | Tab 4: Export type grid + format options |

### Files to MODIFY

| File | Change |
|------|--------|
| `resources/js/pages/AdminEvaluationReport.tsx` | **Full rewrite** → ~200-line orchestrator |
| `resources/js/Components/Report/ReportCharts.tsx` | Add `LazyHighchartsReact` named export |

### Files NOT changed (reused as-is)

- `resources/js/Components/FiscalYearSelector.tsx`
- `resources/js/Components/IndividualDetailedReport.tsx`
- `resources/js/Components/Report/ReportTables.tsx`
- `resources/js/Components/Report/ReportExport.tsx`
- `resources/js/Components/Report/ReportStats.tsx`
- `app/Http/Controllers/AdminEvaluationReportController.php` (backend unchanged)

---

## Task 1: Shared Types + Utilities

**Files:**
- Create: `resources/js/pages/AdminReport/types.ts`

- [ ] **Step 1: Create types.ts with all interfaces**

Extract interfaces from current `AdminEvaluationReport.tsx` lines 83-212. Add adapter functions for `ReportTables` and `ReportStats` compatibility.

Key types: `PageProps`, `FilterState`, `TabId`, `LayoutMode`
Key adapters: `getGradeLabel()`, `getAngleLabel()`, `getScoreColor()`

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit resources/js/pages/AdminReport/types.ts`

---

## Task 2: Filter State Hook

**Files:**
- Create: `resources/js/pages/AdminReport/useReportFilters.ts`

- [ ] **Step 1: Create useReportFilters hook**

Consolidates search, division, grade, external org filter state. Returns `filteredResults` (memoized), `filters`, `setters`, `activeFilterCount`.

- [ ] **Step 2: Verify hook compiles**

---

## Task 3: DashboardTab Component

**Files:**
- Create: `resources/js/pages/AdminReport/DashboardTab.tsx`

- [ ] **Step 1: Create DashboardTab**

Sections:
1. **6 KPI stat cards** in 2x3 grid: ผู้เข้าร่วม, ทำแล้ว, รอดำเนินการ, อัตราสำเร็จ, คะแนนเฉลี่ย, ผู้ประเมิน
2. **External org summary card** (if data exists): จำนวนองค์กร, คะแนนเฉลี่ยรวม, จำนวนคำตอบ
3. **Grade breakdown cards**: 3 cards (ผู้ว่าการ/ผู้บริหาร/พนักงาน) with completion progress bars
4. **Recent evaluatees list**: top 10 from filteredResults with "ดูรายงาน" button

Props: `dashboardStats`, `evaluationMetrics`, `externalOrgMetrics`, `filteredResults`, `onViewIndividual`

---

## Task 4: AnalyticsTab Component

**Files:**
- Create: `resources/js/pages/AdminReport/AnalyticsTab.tsx`

- [ ] **Step 1: Create AnalyticsTab with charts**

Sections:
1. **Division chart** — Highcharts horizontal bar (completion rate by division)
2. **Angle cards** — 5 cards (self/top/bottom/left/right) with score + count
3. **Grade chart** — Highcharts column (avg score by grade group)
4. **Trends chart** — Dual-axis line+column (completions + avg score over 12 months)
5. **External org chart** — Highcharts bar (avg_score by organization, color-coded)
6. **External org table** — name, code, evaluatee count, avg score

Uses `LazyHighchartsReact` from `@/Components/Report/ReportCharts`.

Props: `evaluationMetrics`, `externalOrgMetrics`

---

## Task 5: ReportsTab Component

**Files:**
- Create: `resources/js/pages/AdminReport/ReportsTab.tsx`

- [ ] **Step 1: Create ReportsTab**

Sections:
1. **View mode toggle** (cards / table) — local state
2. **Cards view** — glass-card per evaluatee showing name, grade, division, angle scores, completion %
3. **Table view** — sortable table with columns: ชื่อ, ระดับ, หน่วยงาน, self, top, bottom, left, right, เฉลี่ย, สถานะ
4. **Pagination** — show 20 per page
5. Click row → trigger `onViewIndividual(id)`

Props: `filteredResults`, `externalOrgMetrics`, `onViewIndividual`

---

## Task 6: ExportsTab Component

**Files:**
- Create: `resources/js/pages/AdminReport/ExportsTab.tsx`

- [ ] **Step 1: Create ExportsTab**

Sections:
1. **Format selector**: Excel / PDF / CSV toggle
2. **8 export type cards** in grid:
   - สรุปผลรวม (summary)
   - เปรียบเทียบ (comparison)
   - ผู้บริหาร (executives)
   - พนักงาน (employees)
   - ผู้ว่าการ (governors)
   - องค์กรภายนอก (external-org)
   - รายงานรวม (comprehensive)
   - รายละเอียดครบ (detailed-data)
3. Each card: icon, title, description, download button
4. `handleExport(type)` — POST to `/admin/reports/evaluation/export/{type}` with fiscal_year + filters

Props: `fiscalYear`, `selectedDivision`, `selectedGrade`

---

## Task 7: Rewrite Orchestrator Page

**Files:**
- Modify: `resources/js/pages/AdminEvaluationReport.tsx` (full rewrite)
- Modify: `resources/js/Components/Report/ReportCharts.tsx` (add export)

- [ ] **Step 1: Add LazyHighchartsReact export to ReportCharts.tsx**

- [ ] **Step 2: Rewrite AdminEvaluationReport.tsx**

Structure (~200 lines):
```
MainLayout
├── Gradient Header
│   ├── Title + subtitle (ปีงบประมาณ พ.ศ.)
│   ├── FiscalYearSelector (variant="header")
│   └── Tab navigation (4 tabs)
├── Sticky Filter Bar (search + division + grade + external org)
├── Tab Content (switch on activeTab)
│   ├── DashboardTab
│   ├── AnalyticsTab
│   ├── ReportsTab
│   └── ExportsTab
└── IndividualDetailedReport modal
```

State: `activeTab`, `selectedUserId` + `useReportFilters` hook

**Removed:** DashboardConfig, autoRefresh, ExportModal, EvaluateeDetailsModal, duplicate LazyHighchartsReact, per-page theme toggle

- [ ] **Step 3: Build and verify**

Run: `npm run build`

---

## Task 8: Deploy + Verify

- [ ] **Step 1: Build frontend**
- [ ] **Step 2: Deploy to server**
- [ ] **Step 3: Test all 4 tabs render**
- [ ] **Step 4: Test fiscal year change**
- [ ] **Step 5: Test export downloads**
- [ ] **Step 6: Test individual report modal**
