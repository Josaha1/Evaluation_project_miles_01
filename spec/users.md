# Users Table Data Structure

## Table: `users`

### Description
Core user table storing employee information with organizational hierarchy and authentication data.

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| emid | varchar(255) | NO | UNI | | Employee ID (unique identifier like 350101 or E01001) |
| prename | varchar(255) | NO | | | Title/prefix (Mr., Ms., Dr., etc.) |
| fname | varchar(255) | NO | | | First name |
| lname | varchar(255) | NO | | | Last name |
| sex | varchar(255) | NO | | | Gender |
| division_id | bigint unsigned | NO | FK | | Foreign key to divisions table (สายงาน) |
| department_id | bigint unsigned | NO | FK | | Foreign key to departments table (หน่วยงาน) |
| position_id | bigint unsigned | NO | FK | | Foreign key to positions table (ตำแหน่ง) |
| faction_id | bigint unsigned | NO | FK | | Foreign key to factions table (ฝ่าย) |
| grade | varchar(255) | YES | | NULL | Employee grade/level |
| birthdate | date | NO | | | Date of birth |
| password | varchar(255) | NO | | | Hashed password |
| remember_token | varchar(100) | YES | | NULL | Remember me token |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |
| photo | varchar(255) | YES | | NULL | Profile photo path |
| role | varchar(255) | NO | | 'user' | User role (user or admin) |
| user_type | enum | NO | | 'internal' | Employee type (internal, external) |

### Foreign Key Constraints

- `division_id` → `divisions.id` ON DELETE CASCADE
- `department_id` → `departments.id` ON DELETE CASCADE  
- `position_id` → `positions.id` ON DELETE CASCADE
- `faction_id` → `factions.id` ON DELETE CASCADE

### Indexes

- Primary key on `id`
- Unique key on `emid`

### Notes

- Employee ID (`emid`) serves as unique business identifier
- Organizational hierarchy: Division → Department → Position
- Role-based access control through `role` field
- Support for both internal and external personnel
- Cascading deletes maintain referential integrity