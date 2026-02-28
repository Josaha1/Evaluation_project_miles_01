-- Governor Evaluations Seed Data
-- ผู้ว่าการ กนอ. — Grade 13
-- Run with: php artisan db:seed --class=GovernorEvaluationSeeder
--
-- This file is the SQL equivalent of GovernorEvaluationSeeder.php
-- Use either the Laravel seeder OR this SQL file, not both.
--
-- Evaluations created:
--   - Internal 360 for Governor (grade_min=13, grade_max=13, user_type=internal)
--   - External 360 for Governor (grade_min=13, grade_max=13, user_type=external)
--   - Self-evaluation for Governor (grade_min=13, grade_max=13, user_type=internal)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- =============================================================================
-- Evaluations
-- =============================================================================

INSERT INTO `evaluations` (`title`, `description`, `status`, `user_type`, `grade_min`, `grade_max`, `created_at`, `updated_at`) VALUES
('แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายใน', 'แบบประเมินผู้ว่าการการนิคมอุตสาหกรรมแห่งประเทศไทย โดยบุคลากรภายในองค์กร', 'published', 'internal', 13, 13, NOW(), NOW()),
('แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายนอก', 'แบบประเมินผู้ว่าการการนิคมอุตสาหกรรมแห่งประเทศไทย โดยบุคลากรภายนอกองค์กร', 'published', 'external', 13, 13, NOW(), NOW()),
('แบบประเมิน 360 องศา สำหรับประเมินตนเอง ผู้ว่าการ กนอ.', 'แบบประเมินตนเองสำหรับผู้ว่าการการนิคมอุตสาหกรรมแห่งประเทศไทย', 'published', 'internal', 13, 13, NOW(), NOW());

-- Get the IDs (using variables for the rest of the inserts)
SET @gov_internal_id = (SELECT id FROM evaluations WHERE title = 'แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายใน' LIMIT 1);
SET @gov_external_id = (SELECT id FROM evaluations WHERE title = 'แบบประเมิน 360 องศา สำหรับผู้ว่าการ กนอ. สำหรับบุคลากรภายนอก' LIMIT 1);
SET @gov_self_id = (SELECT id FROM evaluations WHERE title = 'แบบประเมิน 360 องศา สำหรับประเมินตนเอง ผู้ว่าการ กนอ.' LIMIT 1);

-- NOTE: For full data seeding with parts, aspects, questions, and options,
-- please use the Laravel seeder:
--   php artisan db:seed --class=GovernorEvaluationSeeder
--
-- The seeder automatically creates all related data in a single transaction.

COMMIT;
