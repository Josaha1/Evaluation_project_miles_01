# Evaluation Responses Data Model

## Overview
Tables handling evaluation assignments and response collection in a 360-degree feedback system.

## Table: `evaluation_assignments`

### Description
Assigns evaluators to evaluate specific individuals in particular evaluations

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| evaluation_id | bigint unsigned | NO | FK | | Foreign key to evaluations table |
| evaluator_id | bigint unsigned | NO | FK | | Foreign key to users table (person doing evaluation) |
| evaluatee_id | bigint unsigned | NO | FK | | Foreign key to users table (person being evaluated) |
| fiscal_year | varchar(255) | NO | | | Budget/evaluation year |
| angle | enum | NO | | | Evaluation perspective/relationship |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Enum Values

#### angle
- `top` - Superior evaluating subordinate (top-down)
- `bottom` - Subordinate evaluating superior (bottom-up)
- `left` - Peer evaluation (same level)
- `right` - Cross-functional evaluation
- Self-evaluation (when evaluator_id = evaluatee_id)

### Foreign Key Constraints
- `evaluation_id` → `evaluations.id` ON DELETE CASCADE
- `evaluator_id` → `users.id` ON DELETE CASCADE
- `evaluatee_id` → `users.id` ON DELETE CASCADE

---

## Table: `answers`

### Description
Stores individual responses to evaluation questions

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| evaluation_id | bigint unsigned | NO | FK | | Foreign key to evaluations table |
| question_id | bigint unsigned | NO | FK | | Foreign key to questions table |
| user_id | bigint unsigned | NO | FK | | Foreign key to users table (evaluator) |
| evaluatee_id | bigint unsigned | NO | FK | | Foreign key to users table (person being evaluated) |
| value | text | YES | | NULL | Answer value (flexible format) |
| other_text | text | YES | | NULL | Additional comments or "other" text |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Constraints
- Unique constraint on `[evaluation_id, user_id, evaluatee_id, question_id]` prevents duplicate responses

### Foreign Key Constraints
- `evaluation_id` → `evaluations.id` ON DELETE CASCADE
- `question_id` → `questions.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE
- `evaluatee_id` → `users.id` ON DELETE CASCADE

---

## Table: `satisfaction_evaluations`

### Description
Satisfaction survey responses about the evaluation system itself

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| user_id | bigint unsigned | NO | FK | | Foreign key to users table |
| evaluation_id | bigint unsigned | NO | FK | | Foreign key to evaluations table |
| fiscal_year | varchar(4) | NO | | | Budget/evaluation year |
| question_1 | tinyint | NO | | | System usage satisfaction (1-5) |
| question_2 | tinyint | NO | | | Ease of use satisfaction (1-5) |
| question_3 | tinyint | NO | | | System speed satisfaction (1-5) |
| question_4 | tinyint | NO | | | Data accuracy satisfaction (1-5) |
| question_5 | tinyint | NO | | | Accessibility satisfaction (1-5) |
| question_6 | tinyint | NO | | | Data completeness satisfaction (1-5) |
| question_7 | tinyint | NO | | | Content appropriateness satisfaction (1-5) |
| question_8 | tinyint | NO | | | Overall system satisfaction (1-5) |
| additional_comments | text | YES | | NULL | Additional feedback comments |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Satisfaction Questions (Thai)
1. ระดับความพึงพอใจต่อการใช้งานระบบประเมิน
2. ระดับความพึงพอใจต่อความง่ายในการใช้งาน
3. ระดับความพึงพอใจต่อความเร็วในการตอบสนองของระบบ
4. ระดับความพึงพอใจต่อความถูกต้องของข้อมูล
5. ระดับความพึงพอใจต่อความสะดวกในการเข้าถึง
6. ระดับความพึงพอใจต่อความครบถ้วนของข้อมูล
7. ระดับความพึงพอใจต่อความเหมาะสมของเนื้อหา
8. ระดับความพึงพอใจโดยรวมต่อระบบประเมิน

### Constraints
- Unique constraint on `[user_id, evaluation_id, fiscal_year]` prevents duplicate satisfaction evaluations

### Indexes
- Index on `[fiscal_year, evaluation_id]` for performance

### Foreign Key Constraints
- `user_id` → `users.id` ON DELETE CASCADE
- `evaluation_id` → `evaluations.id` ON DELETE CASCADE

---

## 360-Degree Evaluation Flow

### Assignment Process
1. Admin creates evaluation assignments using `evaluation_assignments`
2. Each assignment specifies:
   - Which evaluation form to use
   - Who evaluates whom (evaluator → evaluatee)
   - Evaluation angle/perspective
   - Fiscal year

### Response Collection
1. Evaluators complete assigned evaluations
2. Responses stored in `answers` table with flexible `value` field
3. System prevents duplicate responses via unique constraint
4. Supports various question types:
   - Rating scales (numeric values)
   - Text responses (string values)
   - Multiple choice (JSON arrays)

### Satisfaction Feedback
1. Users complete satisfaction surveys about the evaluation system
2. Fixed 8-question format with 1-5 scale
3. Additional comments for qualitative feedback
4. One survey per user per evaluation per fiscal year

## Data Integrity Features

### Flexible Value Storage
- `answers.value` field accommodates different response types
- `other_text` supports open-ended additions
- JSON compatibility for complex responses

### Duplicate Prevention
- Unique constraints prevent multiple responses to same question
- Separate satisfaction surveys per evaluation cycle

### Cascading Relationships
- Evaluation deletion removes all assignments and responses
- User deletion removes their evaluation participation
- Question deletion removes associated responses

## Usage Scenarios

### Self-Evaluation
- `evaluator_id` = `evaluatee_id` in assignments
- Users evaluate themselves

### Multi-Rater Feedback
- Multiple evaluators assigned to same evaluatee
- Different angles provide comprehensive feedback
- Aggregated scoring and reporting

### System Improvement
- Satisfaction surveys provide system usage feedback
- Identify areas for system enhancement
- Track user experience over time