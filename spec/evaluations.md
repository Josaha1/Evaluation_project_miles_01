# Evaluations Table Data Structure

## Table: `evaluations`

### Description
Main evaluation form template table defining evaluation criteria and target groups.

### Fields

| Field | Type | Null | Key | Default | Description |
|-------|------|------|-----|---------|-------------|
| id | bigint unsigned | NO | PRI | auto_increment | Primary key |
| title | varchar(255) | NO | | | Evaluation form title |
| description | text | YES | | NULL | Detailed description of evaluation |
| status | varchar(255) | NO | | 'draft' | Evaluation status (draft, active, inactive) |
| user_type | enum | NO | | | Target user type (internal, external) |
| grade_min | tinyint unsigned | NO | | | Minimum grade level for evaluation |
| grade_max | tinyint unsigned | NO | | | Maximum grade level for evaluation |
| created_at | timestamp | YES | | NULL | Record creation timestamp |
| updated_at | timestamp | YES | | NULL | Record update timestamp |

### Enum Values

#### user_type
- `internal` - For internal employees
- `external` - For external personnel

#### status (added via migration)
- `draft` - Draft evaluation form
- `active` - Active evaluation form  
- `inactive` - Inactive evaluation form

### Indexes

- Primary key on `id`

### Relationships

#### One-to-Many
- `parts` - Evaluation sections/parts
- `evaluation_assignments` - Assigned evaluations
- `answers` - Evaluation responses
- `satisfaction_evaluations` - Satisfaction survey responses

### Notes

- Serves as template for evaluation forms
- Grade range (grade_min, grade_max) defines eligible participants
- Status controls evaluation availability
- user_type determines target audience (internal vs external staff)
- Forms can have multiple parts with different evaluation criteria