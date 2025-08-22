# Organizational Structure Data Model

## Overview
Four-tier organizational hierarchy: Division → Department → Position + Faction

## Table: `divisions`

### Description
Top-level organizational structure (สายงาน)

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| name | varchar(255) | NO | UNI | | Division name (e.g., สายงานผู้ว่าการ) |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Indexes
- Primary key on `id`
- Unique key on `name`

---

## Table: `departments`

### Description
Second-level organizational units under divisions (หน่วยงาน)

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| division_id | bigint unsigned | NO | FK | | Foreign key to divisions table |
| name | varchar(255) | NO | | | Department name |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Foreign Key Constraints
- `division_id` → `divisions.id` ON DELETE CASCADE

### Indexes
- Primary key on `id`

---

## Table: `positions`

### Description
Job positions within departments (ตำแหน่ง)

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| department_id | bigint unsigned | NO | FK | | Foreign key to departments table |
| title | varchar(255) | NO | | | Position title (e.g., ผู้ช่วยผู้ว่าการ, เลขานุการ) |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Foreign Key Constraints
- `department_id` → `departments.id` ON DELETE CASCADE

### Indexes
- Primary key on `id`

---

## Table: `factions`

### Description
Cross-cutting organizational groups/teams (ฝ่าย)

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| name | varchar(255) | NO | | | Faction/team name |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Indexes
- Primary key on `id`

---

## Organizational Hierarchy

```
Division (สายงาน)
├── Department (หน่วยงาน)
    ├── Position (ตำแหน่ง)
    └── Position (ตำแหน่ง)
└── Department (หน่วยงาน)
    └── Position (ตำแหน่ง)

Faction (ฝ่าย) - Cross-cutting groups
```

## Relationships

### Users Connection
Each user belongs to:
- One Division
- One Department (within that division)
- One Position (within that department)
- One Faction (independent of hierarchy)

### Data Integrity
- Cascading deletes maintain referential integrity
- Division deletion removes all departments and positions
- Department deletion removes all positions
- Faction deletion affects user assignments

## Usage Notes

- **Division**: Highest organizational level (e.g., Executive branch)
- **Department**: Functional units within divisions
- **Position**: Specific job roles within departments
- **Faction**: Special teams or working groups that cut across the hierarchy
- All organizational changes cascade to maintain data consistency