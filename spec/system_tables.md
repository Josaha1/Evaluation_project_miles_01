# System Tables Data Model

## Overview
Laravel framework and system support tables for authentication, caching, and job processing.

## Authentication Tables

### Table: `password_reset_tokens`
Laravel's password reset functionality

| Field | Type | Description |
|-------|------|-------------|
| email | varchar(255) | User email address |
| token | varchar(255) | Reset token |
| created_at | timestamp | Token creation time |

### Table: `personal_access_tokens`
Laravel Sanctum personal access tokens

| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary key |
| tokenable_type | varchar(255) | Model type |
| tokenable_id | bigint unsigned | Model ID |
| name | varchar(255) | Token name |
| token | varchar(64) | Hashed token |
| abilities | text | Token abilities |
| last_used_at | timestamp | Last usage time |
| expires_at | timestamp | Expiration time |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Update time |

---

## Session & Cache Tables

### Table: `sessions`
Laravel session storage

| Field | Type | Description |
|-------|------|-------------|
| id | varchar(255) | Session ID |
| user_id | bigint unsigned | Associated user ID |
| ip_address | varchar(45) | IP address |
| user_agent | text | Browser user agent |
| payload | longtext | Session data |
| last_activity | int | Last activity timestamp |

### Table: `cache`
Laravel cache storage

| Field | Type | Description |
|-------|------|-------------|
| key | varchar(255) | Cache key |
| value | mediumtext | Cached value |
| expiration | int | Expiration timestamp |

### Table: `cache_locks`
Laravel cache locking mechanism

| Field | Type | Description |
|-------|------|-------------|
| key | varchar(255) | Lock key |
| owner | varchar(255) | Lock owner |
| expiration | int | Lock expiration |

---

## Job Queue Tables

### Table: `jobs`
Laravel job queue for background processing

| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary key |
| queue | varchar(255) | Queue name |
| payload | longtext | Job data |
| attempts | tinyint unsigned | Attempt count |
| reserved_at | int unsigned | Reserved timestamp |
| available_at | int unsigned | Available timestamp |
| created_at | int unsigned | Creation timestamp |

### Table: `failed_jobs`
Failed job tracking

| Field | Type | Description |
|-------|------|-------------|
| id | bigint unsigned | Primary key |
| uuid | varchar(255) | Unique job identifier |
| connection | text | Queue connection |
| queue | text | Queue name |
| payload | longtext | Job payload |
| exception | longtext | Exception details |
| failed_at | timestamp | Failure timestamp |

---

## System Table Usage

### Authentication Flow
1. **Login**: Session stored in `sessions` table
2. **Password Reset**: Tokens in `password_reset_tokens`
3. **API Access**: Personal access tokens for API authentication

### Performance Optimization
1. **Caching**: Frequently accessed data cached in `cache` table
2. **Cache Locking**: Prevents cache stampedes using `cache_locks`
3. **Background Jobs**: Heavy operations queued in `jobs` table

### Error Handling
1. **Failed Jobs**: Automatic retry and failure tracking
2. **Exception Logging**: Detailed error information preserved
3. **Job Monitoring**: Queue health and performance tracking

## Security Considerations

### Token Management
- Personal access tokens use secure hashing
- Automatic token expiration
- Ability-based access control

### Session Security
- IP address tracking
- User agent validation
- Automatic session cleanup

### Data Protection
- Sensitive data encrypted in cache
- Secure token generation
- Audit trail preservation

## Maintenance Operations

### Cleanup Tasks
- Expired session removal
- Old cache entry purging
- Failed job archival
- Password reset token cleanup

### Monitoring
- Job queue health checks
- Cache hit rate analysis
- Session activity tracking
- Failed job investigation

### Performance Tuning
- Cache optimization
- Queue worker scaling
- Session storage optimization
- Database index maintenance