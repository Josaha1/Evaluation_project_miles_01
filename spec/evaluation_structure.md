# Evaluation Structure Data Model

## Overview
Hierarchical evaluation structure: Evaluation → Parts → Aspects → Sub-aspects → Questions → Options

## Table: `parts`

### Description
Main sections/parts of an evaluation form

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| evaluation_id | bigint unsigned | NO | FK | | Foreign key to evaluations table |
| title | varchar(255) | NO | | | Part title/name |
| order | tinyint unsigned | NO | | | Display order within evaluation |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Foreign Key Constraints
- `evaluation_id` → `evaluations.id` ON DELETE CASCADE

---

## Table: `aspects`

### Description
Evaluation criteria/aspects within parts

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| part_id | bigint unsigned | NO | FK | | Foreign key to parts table |
| name | varchar(255) | NO | | | Aspect name |
| has_subaspects | boolean | NO | | false | Whether this aspect has sub-aspects |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Foreign Key Constraints
- `part_id` → `parts.id` ON DELETE CASCADE

---

## Table: `sub_aspects`

### Description
Sub-criteria under main aspects (optional level)

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| aspect_id | bigint unsigned | NO | FK | | Foreign key to aspects table |
| name | varchar(255) | NO | | | Sub-aspect name |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Foreign Key Constraints
- `aspect_id` → `aspects.id` ON DELETE CASCADE

---

## Table: `questions`

### Description
Individual questions within the evaluation structure

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| part_id | bigint unsigned | NO | FK | | Foreign key to parts table |
| aspect_id | bigint unsigned | YES | FK | NULL | Foreign key to aspects table (optional) |
| sub_aspect_id | bigint unsigned | YES | FK | NULL | Foreign key to sub_aspects table (optional) |
| title | varchar(255) | NO | | | Question text |
| type | enum | NO | | | Question type |
| order | tinyint unsigned | NO | | 1 | Display order within section |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Enum Values

#### type
- `rating` - Rating scale question
- `open_text` - Open text response
- `choice` - Single choice question
- `multiple_choice` - Multiple choice question

### Foreign Key Constraints
- `part_id` → `parts.id` ON DELETE CASCADE
- `aspect_id` → `aspects.id` ON DELETE CASCADE
- `sub_aspect_id` → `sub_aspects.id` ON DELETE CASCADE

---

## Table: `options`

### Description
Answer options for choice-based questions

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| question_id | bigint unsigned | NO | FK | | Foreign key to questions table |
| label | varchar(255) | NO | | | Option display text |
| score | int | YES | | NULL | Numeric score for this option (for rating questions) |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Foreign Key Constraints
- `question_id` → `questions.id` ON DELETE CASCADE

---

## Evaluation Structure Hierarchy

```
Evaluation
├── Part 1 (order: 1)
│   ├── Aspect A (has_subaspects: false)
│   │   ├── Question 1 (type: rating)
│   │   │   ├── Option: Excellent (score: 5)
│   │   │   ├── Option: Good (score: 4)
│   │   │   └── Option: Fair (score: 3)
│   │   └── Question 2 (type: open_text)
│   └── Aspect B (has_subaspects: true)
│       ├── Sub-aspect B1
│       │   └── Question 3 (type: choice)
│       └── Sub-aspect B2
│           └── Question 4 (type: multiple_choice)
└── Part 2 (order: 2)
    └── Aspect C
        └── Question 5
```

## Design Notes

### Flexible Structure
- Questions can be linked directly to parts, aspects, or sub-aspects
- Optional hierarchy levels allow for simple or complex evaluations
- `has_subaspects` flag indicates whether an aspect uses sub-aspects

### Question Types
- **Rating**: Numeric scale with scored options
- **Open Text**: Free-form text responses
- **Choice**: Single selection from options
- **Multiple Choice**: Multiple selections allowed

### Scoring System
- Options can have numeric scores for quantitative analysis
- Scores are nullable to support non-scored options
- Flexible scoring allows for weighted evaluations

### Data Integrity
- Cascading deletes maintain referential integrity
- All structural changes propagate down the hierarchy
- Order fields ensure consistent presentation