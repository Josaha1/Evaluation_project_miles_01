# Comprehensive Gap Analysis & Updated Plan
**Date**: 2026-02-28
**Project**: ระบบประเมิน 360 องศา กนอ. (Phase 3)
**Based on**: Full analysis of all spec/, docs/, and codebase

---

## Status Overview

### Project Timeline (from project_proposal.md)
- **Sprint 0** (23 ก.พ. – 6 มี.ค.): ผู้ว่าการ eval + deploy
- **Sprint 1** (7 มี.ค. – 6 เม.ย.): External login + workflow
- **Sprint 2** (7 เม.ย. – 30 เม.ย.): AdminDashboard complete
- **Sprint 3** (1 พ.ค. – 31 พ.ค.): Live evaluation + MA
- **Sprint 4** (1–14 มิ.ย.): Report delivery

### Current Date: 28 ก.พ. 2569 → Sprint 0 (due 6 มี.ค.)

---

## SECTION A: Completed Work (สิ่งที่ทำเสร็จแล้ว)

### Sprint 0 Tasks — DONE
| Item | Status | Commits |
|------|--------|---------|
| Governor evaluations (seeder, 3 evals, 6 aspects) | ✅ | be7382f |
| GovernorEvaluationSeeder in DatabaseSeeder | ✅ | b51b585 |
| WeightedScoringService — Governor weights correct | ✅ | be7382f |
| Governor export (Excel) | ✅ | 305262a |
| Dynamic evaluation ID lookup (remove hardcoded 1,3) | ✅ | b51b585 |
| Admin dashboard real KPIs (not mock data) | ✅ | 305262a |
| Thai grade labels (C5-C13) | ✅ | 305262a |

### Infrastructure — DONE
| Item | Status | Commits |
|------|--------|---------|
| Organizational Structure CRUD (4 entities) | ✅ | baseline |
| External Organizations CRUD | ✅ | baseline |
| Access Code management (generate, revoke, print cards) | ✅ | baseline |
| External login flow (code-based, session middleware) | ✅ | baseline |
| External evaluation form + submission | ✅ | baseline |
| ExternalAuthMiddleware with 8-hour session expiry | ✅ | baseline |
| Rate limiting on external login (throttle:5,1) | ✅ | baseline |
| Assignment management (CRUD, bulk, analytics) | ✅ | baseline |

### Report/Export — DONE
| Item | Status | Commits |
|------|--------|---------|
| 15 export methods in AdminEvaluationReportController | ✅ | c42570f |
| Excel: Comprehensive, Executive, Employee, Governor, Self, Detailed, Individual, Raw Data, Completion | ✅ | c42570f |
| PDF: Individual, Comprehensive | ✅ | 2ad2385 |
| All routes mapped to controller methods (25 routes) | ✅ | c42570f |

### Code Quality — DONE
| Item | Status | Commits |
|------|--------|---------|
| Debug logs removed (4 controllers, 1 service) | ✅ | 2ad2385 |
| Cache key collision fixed (md5 hash) | ✅ | 2ad2385 |
| Null safety in ExternalEvaluatorController | ✅ | c42570f |
| Unused routes removed (4 dead routes) | ✅ | c42570f |

---

## SECTION B: Gaps Found (สิ่งที่ยังขาด)

### Priority 1 — CRITICAL (ต้องแก้ก่อน Live)

#### B1. ScoreCalculationService มีน้ำหนักผิด
**File**: `app/Services/ScoreCalculationService.php` line 26-31
**Problem**: น้ำหนักสำหรับ grade 5-8 ผิด
- ScoreCalculationService: `self=20%, top=50%, left=30%` ← **ผิด**
- WeightedScoringService: `self=50%, top=20%, left=30%` ← **ถูก** (ตาม spec)
**Impact**: ถ้าระบบเรียกใช้ ScoreCalculationService แทน WeightedScoringService คะแนนจะคำนวณผิด
**Fix**: แก้ค่า defaultWeights ให้ตรงกับ WeightedScoringService หรือลบ dead import EvaluationWeight

#### B2. Dead import `EvaluationWeight` model ที่ไม่มีจริง
**File**: `app/Services/ScoreCalculationService.php` line 6
**Problem**: `use App\Models\EvaluationWeight;` แต่ไม่มีไฟล์ Model นี้ และไม่มี migration `evaluation_weights`
**Impact**: PHP autoloader จะ fail ถ้ามีการ reference ถึง class นี้ (ปัจจุบัน commented out ที่ line 354)
**Fix**: ลบ dead import

#### B3. HandleInertiaRequests shares `email` field ที่ไม่มีใน DB
**File**: `app/Http/Middleware/HandleInertiaRequests.php` line 39
**Problem**: `'email' => $request->user()->email` แต่ users table ไม่มี column `email` (ใช้ `emid` เป็น login)
**Impact**: Frontend ได้ค่า `email: null` ทุกครั้ง — ไม่ crash แต่เป็นข้อมูลผิด
**Fix**: ลบ `email` field หรือเปลี่ยนเป็น `emid`

#### B4. External evaluator flow assumes 'right' angle only
**File**: `app/Http/Controllers/AdminAccessCodeController.php` lines 78-109
**Problem**: เมื่อ generate access code จะหาเฉพาะ assignment ที่ `angle = 'right'`
ถ้า evaluatee ไม่มี right-angle assignment → `evaluation_assignment_id = null` → ตอน submit จะ error "ไม่พบข้อมูลการมอบหมายประเมิน"
**Impact**: External evaluators อาจกรอกแบบประเมินไม่ได้ถ้า assignment ไม่ใช่ right angle
**Fix**: ควร accept angle parameter เมื่อ generate code หรือ auto-detect

### Priority 2 — IMPORTANT (ควรทำก่อน Sprint 1 จบ)

#### B5. Orphaned legacy models ไม่มี migration
**Files**:
- `app/Models/Evaluatee.php` — references `evaluatees` table ที่ไม่มี
- `app/Models/Evaluation_answer.php` — references `evaluation_answers` table ที่ไม่มี
**Impact**: ไม่มี code ที่ใช้ models เหล่านี้ (grep ไม่พบ) แต่มันทำให้ codebase สับสน
**Fix**: ลบทั้ง 2 files

#### B6. AdminSectionIndex.tsx เป็น dead page
**File**: `resources/js/pages/AdminSectionIndex.tsx`
**Problem**: Reference routes `sections.destroy`, `sections.create` ฯลฯ ที่ไม่มีใน web.php
"Sections" ถูกเปลี่ยนเป็น "Parts" แล้วในระบบปัจจุบัน
**Impact**: ถ้ามีคนเข้าหน้านี้จะ error (แต่ไม่มี route ชี้มาที่นี่)
**Fix**: ลบไฟล์นี้

#### B7. EvaluationShow.tsx เป็น dead page
**File**: `resources/js/pages/EvaluationShow.tsx`
**Problem**: ไม่มี route ที่ render หน้านี้, ใช้ `sections` interface ที่ไม่ตรงกับ data model ปัจจุบัน
**Fix**: ลบไฟล์นี้ หรือ refactor ถ้าต้องใช้จริง

#### B8. ProfileEditPage.tsx.backup ไฟล์เหลือ
**File**: `resources/js/pages/ProfileEditPage.tsx.backup`
**Fix**: ลบ

#### B9. `debug_missing_parts.php` ไฟล์ debug ที่ root
**File**: `debug_missing_parts.php`
**Fix**: ลบ

### Priority 3 — NICE TO HAVE (ปรับปรุงคุณภาพ)

#### B10. Missing migration sequence `2025_04_04_000003`
**Problem**: Migration numbering jumps from _000002 → _000004 (เดิมน่าจะเป็น sections table ที่ถูกลบ)
**Impact**: ไม่กระทบการทำงาน — แค่ numbering gap
**Fix**: ไม่ต้องทำอะไร

#### B11. `evaluation_assignments` ENUM ไม่มี 'self' value
**Problem**: `angle ENUM('top','bottom','left','right')` — ไม่มี 'self'
**Impact**: ไม่กระทบจริงเพราะ self-evaluation ใช้ `user_id = evaluatee_id` ใน answers table แทน (ไม่ผ่าน assignment)
**Fix**: ไม่ต้องทำอะไร — design เป็นแบบนี้โดยตั้งใจ

---

## SECTION C: Remaining Work per Task (ตาม Project Proposal)

### Task 1 — แบบประเมินผู้ว่าการ → **95% DONE**
| รายการ | สถานะ |
|--------|--------|
| Database Migration + Seeder | ✅ GovernorEvaluationSeeder |
| Admin UI: จัดการแบบประเมิน | ✅ EvaluationController CRUD |
| Assignment System | ✅ AdminEvaluationAssignmentController |
| Weighted Scoring | ✅ WeightedScoringService |
| Export | ✅ exportGovernorReport |
| **Remaining**: Run seeder on production | ⏳ ต้อง deploy |

### Task 2 — MA ระบบรายเดือน → **Ongoing**
ไม่มีงาน dev เพิ่ม — เป็น operational task

### Task 3 — External Organization Login → **90% DONE**
| รายการ | สถานะ |
|--------|--------|
| Database Migration (3 tables + ALTER answers) | ✅ migrations exist |
| ExternalAuth Middleware | ✅ with session expiry |
| ExternalEvaluatorController | ✅ full flow |
| Admin: External Organizations | ✅ CRUD |
| Admin: Access Codes | ✅ generate + revoke + print |
| React Pages (External) | ✅ 3 pages |
| React Pages (Admin) | ✅ 5 pages |
| Print Card PDF | ✅ blade template |
| Report Integration | ⚠️ **Partial** — export มีแล้ว แต่ dashboard ยังไม่แสดงคะแนนแยกตามองค์กรภายนอก |
| **Fix B4**: Access code angle assumption | ⚠️ ต้องแก้ |
| Run migrations on production | ⏳ |

### Task 4 — Adjust Workflow → **70% DONE**
| รายการ | สถานะ |
|--------|--------|
| Step-based User Dashboard | ✅ Dashboard.tsx มี Step 1 (self) + Step 2 (others) |
| Save indicator | ✅ ProgressIndicator component |
| Modal confirmation + summary | ✅ EvaluationShow flow |
| Bulk assignment | ✅ AdminEvaluationAssignmentController.bulkStore |
| Progress tracker | ✅ Dashboard มี progress bar |
| Clean layout | ✅ Inertia + Tailwind |
| **Remaining**: UX polish, edge case testing | ⏳ |

### Task 5 — AdminDashboard ครบทุกระบบ → **85% DONE**
| รายการ | สถานะ |
|--------|--------|
| Refactor Controller: dynamic IDs | ✅ no more hardcoded |
| KPI Cards ทุก eval type | ✅ real data from DB |
| Charts: แยก view ตาม grade group | ✅ ChartSection component |
| Weighted Score: ถูกต้องทุก grade | ⚠️ **Fix B1**: ScoreCalculationService weights wrong |
| External Org section in Report | ⚠️ ยังไม่แสดงคะแนนแยกตามองค์กรภายนอก |
| Export: ครบทุก eval type | ✅ 15 export methods |
| Individual Report: ทุก grade | ✅ IndividualDetailedReport component |
| UI Polish + Filter UX | ✅ filters, search, pagination |
| **Remaining**: External org analysis section, ScoreCalc fix | ⏳ |

---

## SECTION D: Action Plan (แผนดำเนินการ)

### Phase 1 — Quick Fixes (ทำได้เลย, ไม่ต้อง deploy)

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 1 | Fix ScoreCalculationService weights (B1) + remove dead EvaluationWeight import (B2) | `ScoreCalculationService.php` | 10 min |
| 2 | Fix HandleInertiaRequests email→emid (B3) | `HandleInertiaRequests.php` | 5 min |
| 3 | Delete orphaned models (B5) | `Evaluatee.php`, `Evaluation_answer.php` | 2 min |
| 4 | Delete dead pages (B6, B7, B8) | `AdminSectionIndex.tsx`, `EvaluationShow.tsx`, `ProfileEditPage.tsx.backup` | 2 min |
| 5 | Delete debug file (B9) | `debug_missing_parts.php` | 1 min |
| **Total** | | | **~20 min** |

### Phase 2 — Access Code Angle Fix (B4)

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 1 | Allow AdminAccessCodeController to accept angle parameter or auto-detect from assignment | `AdminAccessCodeController.php` | 30 min |
| 2 | Update AdminAccessCodeGenerate.tsx to pass angle if needed | `AdminAccessCodeGenerate.tsx` | 20 min |
| **Total** | | | **~50 min** |

### Phase 3 — External Org Analysis in Dashboard (Task 3 + Task 5 remaining)

| # | Task | Files | Est. Time |
|---|------|-------|-----------|
| 1 | Add external org score breakdown in AdminEvaluationReportController | `AdminEvaluationReportController.php` | 1 hr |
| 2 | Add ExternalOrgAnalysis section in AdminEvaluationReport.tsx | `AdminEvaluationReport.tsx` | 2 hr |
| 3 | Add external org export (Excel with org breakdown) | `AdminEvaluationReportController.php` | 1 hr |
| **Total** | | | **~4 hr** |

### Phase 4 — Production Deployment

| # | Task | Details |
|---|------|---------|
| 1 | Run migrations on production | 3 external tables + ALTER answers |
| 2 | Run GovernorEvaluationSeeder | Seeds governor evaluation structure |
| 3 | Verify data integrity | Check existing data not affected |
| 4 | Build + deploy frontend | `npx vite build` + upload |

---

## SECTION E: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ScoreCalculationService ถูกใช้แทน WeightedScoringService | Low (controller ใช้ WeightedScoringService เป็นหลัก) | High (คะแนนผิด) | Fix B1 ทันที |
| External evaluator submit fail (B4) | Medium (ถ้า admin generate code สำหรับ evaluatee ที่ไม่มี right assignment) | High (ประเมินไม่ได้) | Fix B4 ก่อน Live |
| Migration fail on production | Low | High | Backup DB ก่อน run |
| Performance issue กับข้อมูล 207K+ rows | Medium | Medium | ใช้ cache + streamDownload |

---

## SECTION F: Summary Priority Matrix

```
MUST DO (ก่อน Live 1 เม.ย.):
├── B1: Fix ScoreCalculationService weights
├── B2: Remove dead EvaluationWeight import
├── B3: Fix email→emid in HandleInertiaRequests
├── B4: Fix access code angle assumption
├── B5: Delete orphaned models
├── Deploy: Run migrations + seeder on production
│
SHOULD DO (Sprint 1-2):
├── B6-B9: Delete dead files (cleanup)
├── External org analysis in dashboard
├── UX polish for user dashboard
│
NICE TO HAVE (Sprint 2+):
├── Performance optimization
└── Additional report formats
```
