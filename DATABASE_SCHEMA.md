# Database Schema Documentation - Evaluation Management System

## Overview
This document provides comprehensive documentation of the database schema for the 360-degree evaluation management system. The schema consists of 21 tables supporting organizational hierarchy, multi-type evaluations, satisfaction surveys, and detailed audit tracking.

**Current Scale**: 16,639+ evaluation responses, 1,051+ users, 582+ questions across multiple evaluation types.

---

## Core Business Logic Tables

### 1. **users** (Primary Entity)
**Purpose**: Central user management with organizational hierarchy
**Records**: 1,051+ users

```sql
CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `emid` varchar(255) DEFAULT NULL,          -- Employee ID
  `prename` varchar(255) DEFAULT NULL,       -- Title (Mr., Ms., Dr.)
  `fname` varchar(255) NOT NULL,             -- First name
  `lname` varchar(255) NOT NULL,             -- Last name
  `sex` varchar(255) DEFAULT NULL,           -- Gender
  `email` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'user', -- admin|user
  `user_type` varchar(255) NOT NULL DEFAULT 'internal', -- internal|external
  `grade` int(11) DEFAULT NULL,              -- Grade level for evaluation eligibility
  `division_id` bigint(20) UNSIGNED DEFAULT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `position_id` bigint(20) UNSIGNED DEFAULT NULL,
  `faction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
);
```

**Key Relationships**:
- → `divisions` (division_id)
- → `departments` (department_id) 
- → `positions` (position_id)
- → `factions` (faction_id)

**Business Logic**:
- `grade` determines evaluation form eligibility
- `user_type` controls internal vs external evaluation forms
- `role` provides admin access control

---

### 2. **evaluations** (Main Containers)
**Purpose**: Top-level evaluation forms with access controls
**Records**: 15+ active evaluations

```sql
CREATE TABLE `evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `user_type` varchar(255) NOT NULL DEFAULT 'internal', -- internal|external
  `grade_min` int(11) DEFAULT NULL,          -- Minimum grade eligibility
  `grade_max` int(11) DEFAULT NULL,          -- Maximum grade eligibility
  `status` varchar(255) NOT NULL DEFAULT 'draft', -- draft|published
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
);
```

**Business Logic**:
- `grade_min`/`grade_max` control user eligibility
- `user_type` separates internal vs external evaluations
- `status` controls form availability

---

### 3. **parts** (Evaluation Sections)
**Purpose**: Major sections within evaluations
**Records**: 69+ sections

```sql
CREATE TABLE `parts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `order` int(11) NOT NULL DEFAULT 0,        -- Display sequence
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `parts_evaluation_id_foreign` 
    FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE
);
```

---

### 4. **aspects** (Main Categories)
**Purpose**: Primary evaluation categories within parts
**Records**: 97+ aspects

```sql
CREATE TABLE `aspects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `part_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `has_subaspects` tinyint(1) NOT NULL DEFAULT 0, -- Boolean flag
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `aspects_part_id_foreign` 
    FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE
);
```

**Business Logic**:
- `has_subaspects` determines if sub-categorization is used

---

### 5. **sub_aspects** (Sub-Categories)
**Purpose**: Secondary categorization within aspects

```sql
CREATE TABLE `sub_aspects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `aspect_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `sub_aspects_aspect_id_foreign` 
    FOREIGN KEY (`aspect_id`) REFERENCES `aspects` (`id`) ON DELETE CASCADE
);
```

---

### 6. **questions** (Assessment Items)
**Purpose**: Individual evaluation questions
**Records**: 582+ questions

```sql
CREATE TABLE `questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `part_id` bigint(20) UNSIGNED NOT NULL,
  `aspect_id` bigint(20) UNSIGNED DEFAULT NULL,
  `sub_aspect_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` text NOT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'rating', -- rating|open_text|choice|multiple_choice
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `questions_part_id_foreign` 
    FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `questions_aspect_id_foreign` 
    FOREIGN KEY (`aspect_id`) REFERENCES `aspects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `questions_sub_aspect_id_foreign` 
    FOREIGN KEY (`sub_aspect_id`) REFERENCES `sub_aspects` (`id`) ON DELETE CASCADE
);
```

**Question Types**:
- `rating`: Likert scale questions (1-5)
- `open_text`: Free text responses
- `choice`: Single selection from options
- `multiple_choice`: Multiple selections allowed

---

### 7. **options** (Multiple Choice Options)
**Purpose**: Answer choices for choice/multiple_choice questions
**Records**: 4,933+ options

```sql
CREATE TABLE `options` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(255) NOT NULL,             -- Display text
  `score` int(11) DEFAULT NULL,              -- Weighted scoring value
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  CONSTRAINT `options_question_id_foreign` 
    FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
);
```

**Business Logic**:
- `score` enables weighted scoring for analytics

---

### 8. **answers** (User Responses)
**Purpose**: Actual evaluation responses
**Records**: 16,639+ responses

```sql
CREATE TABLE `answers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `question_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,    -- Evaluator
  `evaluatee_id` bigint(20) UNSIGNED NOT NULL, -- Person being evaluated
  `value` text DEFAULT NULL,                 -- JSON array for multiple choice
  `other_text` text DEFAULT NULL,            -- Additional comments
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`evaluatee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**Data Format Examples**:
- Rating questions: `"4"` (string number)
- Single choice: `"4774"` (option_id)
- Multiple choice: `"[4780,4781]"` (JSON array of option_ids)

---

### 9. **evaluation_assignments** (360-Degree Assignments)
**Purpose**: Manages evaluator-evaluatee relationships

```sql
CREATE TABLE `evaluation_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `evaluator_id` bigint(20) UNSIGNED NOT NULL,
  `evaluatee_id` bigint(20) UNSIGNED NOT NULL,
  `angle` varchar(255) DEFAULT NULL,         -- top|bottom|left|right (360-degree)
  `fiscal_year` varchar(4) DEFAULT NULL,     -- Evaluation period
  `completed_at` timestamp NULL DEFAULT NULL,
  `is_self_evaluation` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`evaluator_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`evaluatee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**360-Degree Angles**:
- `top`: Superior evaluation
- `bottom`: Subordinate evaluation  
- `left`/`right`: Peer evaluations
- Self-evaluation: `evaluator_id` = `evaluatee_id`

---

### 10. **satisfaction_evaluations** (System Feedback)
**Purpose**: Post-evaluation satisfaction surveys

```sql
CREATE TABLE `satisfaction_evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `fiscal_year` varchar(4) NOT NULL,
  `question_1` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อการใช้งานระบบประเมิน',
  `question_2` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อความง่ายในการใช้งาน',
  `question_3` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อความเร็วในการตอบสนองของระบบ',
  `question_4` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อความถูกต้องของข้อมูล',
  `question_5` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อความสะดวกในการเข้าถึง',
  `question_6` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อความครบถ้วนของข้อมูล',
  `question_7` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจต่อความเหมาะสมของเนื้อหา',
  `question_8` tinyint(4) NOT NULL COMMENT 'ระดับความพึงพอใจโดยรวมต่อระบบประเมิน',
  `additional_comments` text DEFAULT NULL COMMENT 'ความคิดเห็นเพิ่มเติม',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `satisfaction_eval_unique` (`user_id`,`evaluation_id`,`fiscal_year`),
  KEY `satisfaction_evaluations_fiscal_year_evaluation_id_index` (`fiscal_year`,`evaluation_id`),
  CONSTRAINT `satisfaction_evaluations_user_id_foreign` 
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `satisfaction_evaluations_evaluation_id_foreign` 
    FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE
);
```

**Rating Scale**: 1-5 (น้อยที่สุด to มากที่สุด)

---

## Organizational Structure Tables

### 11. **divisions** (Top-Level Units)
```sql
CREATE TABLE `divisions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
);
```

### 12. **departments** (Department Units)
```sql
CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `division_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  FOREIGN KEY (`division_id`) REFERENCES `divisions` (`id`) ON DELETE SET NULL
);
```

### 13. **positions** (Job Positions)
```sql
CREATE TABLE `positions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
);
```

### 14. **factions** (Additional Groupings)
```sql
CREATE TABLE `factions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
);
```

---

## Technical Infrastructure Tables

### 15-21. **Laravel Framework Tables**
- `cache` & `cache_locks`: Caching system
- `sessions`: User session management  
- `jobs`: Background job queue
- `migrations`: Database version control
- `password_reset_tokens`: Password reset functionality
- `personal_access_tokens`: API authentication (Laravel Sanctum)

---

## Key Relationships & Data Flow

### Evaluation Hierarchy
```
Evaluations
└── Parts (sections)
    └── Aspects (categories)
        └── Sub-Aspects (optional sub-categories)
            └── Questions
                └── Options (for choice questions)
```

### User Response Flow
```
Users (Organizational Structure)
└── evaluation_assignments (360-degree assignments)
    └── answers (actual responses)
        └── satisfaction_evaluations (post-evaluation feedback)
```

### Foreign Key Cascade Strategy
- **CASCADE DELETE**: Used throughout for referential integrity
- **SET NULL**: Used for optional organizational relationships
- **All business logic tables properly indexed** on foreign keys

---

## Current Data Scale Analysis

Based on AUTO_INCREMENT values:
- **16,639+** evaluation responses (answers table)
- **1,051+** users across organizational structure
- **582+** evaluation questions
- **4,933+** multiple choice options
- **97+** evaluation aspects
- **69+** evaluation parts/sections
- **15+** active evaluation forms

---

## Business Logic Implementation

### 1. **Multi-Type Evaluation Support**
- `user_type`: internal vs external evaluations
- `grade_min`/`grade_max`: Grade-based form eligibility

### 2. **360-Degree Evaluation Capability**
- Self-evaluation: `evaluator_id` = `evaluatee_id`
- Peer evaluation: Different angles (top/bottom/left/right)
- Cross-evaluation: Superior/subordinate relationships

### 3. **Flexible Question Framework**
- **Rating**: 1-5 scale questions
- **Open Text**: Free-form responses
- **Single Choice**: One option selection
- **Multiple Choice**: Multiple option selection with JSON storage

### 4. **Weighted Scoring System**
- Options table includes `score` values for analytics
- Enables sophisticated reporting and comparisons

### 5. **Organizational Alignment**
- Four-tier structure: Division → Department → Position → Faction
- Grade-based evaluation eligibility
- Role-based access control (admin/user)

### 6. **Audit & Tracking**
- Complete timestamp tracking (`created_at`/`updated_at`)
- Fiscal year tracking for evaluation periods
- Completion tracking with `completed_at` timestamps

### 7. **Satisfaction Measurement**
- Post-evaluation system satisfaction surveys
- 8-question standardized satisfaction assessment
- Unique constraint prevents duplicate submissions

---

## Performance & Indexing Strategy

### Primary Indexes
- All tables have proper primary key indexes
- Foreign key columns automatically indexed

### Composite Indexes
- `satisfaction_evaluations`: `(fiscal_year, evaluation_id)`
- `evaluation_assignments`: Implicit on FK combinations

### Unique Constraints
- `satisfaction_evaluations`: `(user_id, evaluation_id, fiscal_year)`
- `users`: `email` uniqueness

---

## Data Integrity Features

1. **Referential Integrity**: CASCADE DELETE maintains consistency
2. **Enum Constraints**: Controlled values for status, user_type, question types
3. **Required Fields**: NOT NULL constraints on critical business data
4. **Unique Constraints**: Prevent duplicate satisfaction evaluations
5. **Proper Data Types**: Appropriate column types for business logic

This schema represents a mature, production-ready evaluation management system capable of handling complex organizational assessment requirements with comprehensive audit trails and flexible evaluation structures.