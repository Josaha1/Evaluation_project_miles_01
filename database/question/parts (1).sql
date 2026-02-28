-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 22, 2025 at 11:23 AM
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
-- Table structure for table `parts`
--

CREATE TABLE `parts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `evaluation_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `order` tinyint(3) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parts`
--

INSERT INTO `parts` (`id`, `evaluation_id`, `title`, `order`, `created_at`, `updated_at`) VALUES
(1, 1, 'ส่วนที่ 1 การประเมินตามเกณฑ์การประเมิน 360 องศา', 1, NULL, '2025-04-11 01:38:44'),
(2, 1, 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร', 2, NULL, '2025-04-11 01:39:02'),
(4, 2, 'ส่วนที่ 1 แบบประเมิน 360 องศา สำหรับกลุ่มผู้บริหารระดับ 9-12 สำหรับบุคลากรภายนอก', 1, NULL, '2025-04-20 21:13:45'),
(5, 2, 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร', 2, NULL, '2025-04-20 21:13:52'),
(7, 3, 'ส่วนที่ 1 ข้อมูลหลักเกณฑ์การประเมินตามค่านิยมของ กนอ. และสมรรถนะในการปฏิบัติงานของบุคลากร', 1, NULL, '2025-04-20 23:20:28'),
(8, 3, 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร', 2, NULL, '2025-04-20 23:20:36'),
(10, 4, 'ส่วนที่ 1 การประเมินตามเกณฑ์การประเมิน 360 องศา', 1, NULL, '2025-04-11 01:38:44'),
(11, 4, 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร', 2, NULL, '2025-04-11 01:39:02'),
(12, 4, 'ส่วนที่ 3 ประเด็นคำถามปลายเปิด', 3, NULL, '2025-04-11 01:39:15'),
(63, 5, 'ส่วนที่ 1 ข้อมูลหลักเกณฑ์การประเมินตามค่านิยมของ กนอ. และสมรรถนะในการปฏิบัติงานของบุคลากร', 1, NULL, '2025-04-20 23:20:28'),
(64, 5, 'ส่วนที่ 2 การประเมินวัฒนธรรมองค์กร', 2, NULL, '2025-04-20 23:20:36'),
(65, 5, 'ส่วนที่ 3 ความคิดเห็นและข้อแสนอแนะ', 3, NULL, '2025-04-20 23:20:44'),
(66, 14, 'ส่วนที่ 1', 1, NULL, NULL),
(67, 14, 'ส่วนที่ 2', 2, NULL, NULL),
(68, 14, 'ส่วนที่ 3', 3, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `parts`
--
ALTER TABLE `parts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parts_evaluation_id_foreign` (`evaluation_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `parts`
--
ALTER TABLE `parts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `parts`
--
ALTER TABLE `parts`
  ADD CONSTRAINT `parts_evaluation_id_foreign` FOREIGN KEY (`evaluation_id`) REFERENCES `evaluations` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
