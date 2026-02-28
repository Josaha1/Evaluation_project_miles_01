-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 22, 2025 at 09:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `milesconsultdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `user_type` enum('internal','external') NOT NULL,
  `grade_min` tinyint(3) UNSIGNED NOT NULL,
  `grade_max` tinyint(3) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `evaluations`
--

INSERT INTO `evaluations` (`id`, `title`, `description`, `status`, `user_type`, `grade_min`, `grade_max`, `created_at`, `updated_at`) VALUES
(1, 'แบบประเมิน 360 องศา สำหรับกลุ่มผู้บริหารระดับ 9-12 สำหรับบุคลากรภายใน', NULL, 'published', 'internal', 9, 12, '2025-04-11 01:38:22', '2025-04-22 06:13:18'),
(2, 'แบบประเมิน 360 องศา สำหรับกลุ่มผู้บริหารระดับ 9-12 สำหรับบุคลากรภายนอก', NULL, 'published', 'external', 9, 12, '2025-04-20 21:12:27', '2025-04-22 06:13:25'),
(3, 'แบบประเมิน 360 องศา สำหรับพนักงานระดับ 5-8 สำหรับพนักงาน', NULL, 'published', 'internal', 5, 8, '2025-04-20 23:20:04', '2025-04-22 06:14:41'),
(4, 'แบบประเมิน 360 องศา สำหรับประเมินตนเองระดับ 9-12 ', NULL, 'published', 'internal', 9, 12, '2025-04-11 01:38:22', '2025-04-22 06:13:18'),
(5, 'แบบประเมิน 360 องศา สำหรับประเมินตนเองระดับ 5-8', NULL, 'published', 'internal', 5, 8, '2025-04-20 23:20:04', '2025-04-22 06:14:41'),
(14, 'แบบประเมินความพึงพอใจ', NULL, 'draft', 'internal', 5, 12, '2025-07-17 16:48:20', '2025-07-17 16:48:20');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `evaluations`
--
ALTER TABLE `evaluations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
