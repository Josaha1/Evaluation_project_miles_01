# Database Schema Overview

## System Architecture

This is a Laravel-based 360-degree evaluation system with the following main components:

### Core Business Tables

#### User Management
- **users** - Employee data with organizational hierarchy
- **divisions** - Top-level organizational units (สายงาน)
- **departments** - Functional departments (หน่วยงาน)
- **positions** - Job positions (ตำแหน่ง)
- **factions** - Cross-cutting teams/groups (ฝ่าย)

#### Evaluation System
- **evaluations** - Evaluation form templates
- **parts** - Evaluation sections
- **aspects** - Evaluation criteria
- **sub_aspects** - Sub-criteria (optional)
- **questions** - Individual questions
- **options** - Answer choices for questions

#### Evaluation Execution
- **evaluation_assignments** - Who evaluates whom
- **answers** - Evaluation responses
- **satisfaction_evaluations** - System satisfaction surveys

### Laravel Framework Tables

#### Authentication & Security
- **sessions** - User session data
- **password_reset_tokens** - Password reset functionality
- **personal_access_tokens** - API authentication tokens

#### System Operations
- **cache** - Application cache storage
- **cache_locks** - Cache locking mechanism
- **jobs** - Background job queue
- **failed_jobs** - Failed job tracking

## Key Relationships

### Organizational Hierarchy
```
users → divisions (สายงาน)
users → departments (หน่วยงาน) 
users → positions (ตำแหน่ง)
users → factions (ฝ่าย)
```

### Evaluation Structure
```
evaluations → parts → aspects → sub_aspects
                  ↓
              questions → options
```

### Evaluation Process
```
evaluation_assignments (who evaluates whom)
                ↓
            answers (responses)
                ↓
    satisfaction_evaluations (feedback)
```

## Data Flow

### 1. Setup Phase
1. Create organizational structure (divisions, departments, positions, factions)
2. Register users with organizational assignments
3. Design evaluation forms (evaluations, parts, aspects, questions, options)

### 2. Assignment Phase
1. Create evaluation assignments (evaluator → evaluatee pairs)
2. Specify evaluation angles (top, bottom, left, right, self)
3. Set fiscal year for evaluation cycle

### 3. Evaluation Phase
1. Evaluators complete assigned evaluations
2. Responses stored in answers table
3. System prevents duplicate submissions

### 4. Feedback Phase
1. Users complete satisfaction surveys
2. System collects usage feedback
3. Data used for system improvements

## Technical Features

### Data Integrity
- Foreign key constraints with cascading deletes
- Unique constraints prevent duplicate responses
- Enum fields ensure data consistency

### Flexibility
- Hierarchical evaluation structure (optional sub-aspects)
- Multiple question types (rating, text, choice, multiple choice)
- Flexible answer storage (text field accommodates various formats)

### Performance
- Strategic indexing for query optimization
- Caching system for frequently accessed data
- Background job processing for heavy operations

### Security
- Role-based access control
- Secure session management
- API token authentication
- Data encryption where appropriate

## Business Logic

### 360-Degree Evaluation
- **Top-down**: Supervisor evaluates subordinate
- **Bottom-up**: Subordinate evaluates supervisor  
- **Peer**: Same-level colleague evaluation
- **Cross-functional**: Inter-department evaluation
- **Self**: Employee self-evaluation

### Grade-Based Targeting
- Evaluations can target specific grade ranges
- Internal vs external personnel distinction
- Flexible organizational assignment

### Satisfaction Tracking
- 8-question satisfaction survey
- 1-5 rating scale
- Open-ended feedback collection
- System improvement insights

## Scalability Considerations

### Data Volume
- Partitioning by fiscal year
- Archival strategies for old evaluations
- Efficient indexing for large datasets

### Performance
- Caching frequently accessed organizational data
- Background processing for report generation
- Database connection pooling

### Extensibility
- Flexible question types allow new formats
- Organizational structure accommodates growth
- Evaluation templates support various assessment types