-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 22, 2025 at 11:22 AM
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
-- Table structure for table `aspects`
--

CREATE TABLE `aspects` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `part_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `has_subaspects` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `aspects`
--

INSERT INTO `aspects` (`id`, `part_id`, `name`, `has_subaspects`, `created_at`, `updated_at`) VALUES
(1, 1, 'ด้านความเป็นผู้นำ (Leadership)', 0, '2025-04-11 01:41:16', '2025-04-11 01:41:16'),
(2, 1, 'ด้านการมีวิสัยทัศน์ (Vision)', 0, '2025-04-11 01:41:16', '2025-04-11 01:41:16'),
(3, 1, 'ด้านการติดต่อสื่อสาร (Communication)', 0, '2025-04-11 01:41:16', '2025-04-11 01:41:16'),
(4, 1, 'ด้านความสามารถในการคิดและนวัตกรรม (Thinking and Innovation)', 0, '2025-04-11 01:41:16', '2025-04-11 01:41:16'),
(5, 1, 'ด้านจริยธรรมในการปฏิบัติงาน (Ethics)', 0, '2025-04-11 01:41:16', '2025-04-11 01:41:16'),
(6, 1, 'ด้านทักษะระหว่างบุคคลและความร่วมมือ (Interpersonal Skills and Collaboration)', 0, '2025-04-11 01:41:16', '2025-04-11 01:41:16'),
(10, 2, '2.1 การยอมรับพฤติกรรมตามค่านิยม “I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน”', 0, '2025-04-11 01:44:06', '2025-07-09 19:49:30'),
(13, 4, 'ความสามารถในการเป็นผู้นำและการบริหารจัดการ', 0, '2025-04-20 21:14:33', '2025-04-20 21:14:33'),
(14, 4, 'การส่งเสริมความยั่งยืน(Sustainability)', 0, '2025-04-20 21:15:19', '2025-04-20 21:15:19'),
(15, 4, 'ทักษะการติดต่อสื่อสารและการสร้างความสัมพันธ์', 0, '2025-04-20 21:15:19', '2025-04-20 21:15:19'),
(16, 4, 'ความสามารถในการคิดและนวัตกรรม', 0, '2025-04-20 21:15:19', '2025-04-20 21:15:19'),
(17, 4, 'ด้านจริยธรรมในการปฏิบัติงาน', 0, '2025-04-20 21:15:19', '2025-04-20 21:15:19'),
(18, 4, 'ด้านทักษะระหว่างบุคคลและความร่วมมือ', 0, '2025-04-20 21:15:19', '2025-04-20 21:15:19'),
(46, 7, 'ด้านเก่งคิด (Intelligence Quotient: IQ)', 0, '2025-04-20 23:29:53', '2025-04-20 23:29:53'),
(47, 7, 'ด้านเก่งคน (Emotional Quotient: EQ)', 0, '2025-04-20 23:30:29', '2025-04-20 23:30:29'),
(48, 7, 'ด้านเก่งงาน (Adversity Quotient: AQ และ Technology Quotient: TQ)', 0, '2025-04-20 23:30:29', '2025-04-20 23:30:29'),
(49, 7, 'ด้านการปฏิบัติงานบนฐานความยั่งยืน (Sustainability)', 0, '2025-04-20 23:30:29', '2025-04-20 23:30:29'),
(53, 8, '2.1 การยอมรับถึงความสำคัญตามค่านิยม  “ I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน ”', 0, '2025-04-20 23:35:14', '2025-07-09 19:50:06'),
(58, 2, '2.2 การแสดงพฤติกรรมตามค่านิยม  “ I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน ”', 0, '2025-07-07 15:42:13', '2025-07-09 19:49:36'),
(59, 8, '2.2 การแสดงพฤติกรรมตามค่านิยม  “ I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน ”', 0, '2025-07-07 16:16:51', '2025-07-09 19:50:12'),
(60, 5, '2.1 การยอมรับถึงความสำคัญตามค่านิยม  “ I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน ”', 0, '2025-07-09 19:51:56', '2025-07-09 19:52:02'),
(61, 5, '2.2 การแสดงพฤติกรรมตามค่านิยม  “ I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน ”', 0, '2025-07-09 19:52:16', '2025-07-09 19:52:16'),
(66, 11, '2.1 การรับรู้ค่านิยม “I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน”', 0, '2025-04-11 01:44:06', '2025-04-11 01:44:06'),
(67, 11, '2.2 ความเข้าใจค่านิยม “I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน”', 0, '2025-04-11 01:44:06', '2025-04-11 01:44:06'),
(68, 11, '2.3 ความเข้าใจเกี่ยวกับพฤติกรรมพึงประสงค์ของค่านิยม \"I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน\"', 0, '2025-04-11 01:44:06', '2025-04-11 01:44:06'),
(72, 65, 'ความคิดเห็นและข้อแสนอแนะ', 0, '2025-04-20 23:28:26', '2025-04-20 23:28:26'),
(77, 64, '2.1 การรับรู้ค่านิยม “ I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน ”', 0, '2025-04-20 23:35:14', '2025-07-07 16:02:04'),
(78, 64, '2.2 ความเข้าใจค่านิยม “I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน”', 0, '2025-04-20 23:35:14', '2025-04-20 23:35:14'),
(79, 64, '2.3 ความเข้าใจเกี่ยวกับพฤติกรรมพึงประสงค์ของค่านิยม \" I-EA-T for Sustainability กนอ. เก่งคิด เก่งคน เก่งงาน บนฐานความยั่งยืน \"', 0, '2025-04-20 23:35:14', '2025-07-07 16:09:55'),
(82, 63, 'ด้านเก่งคิด (Intelligence Quotient: IQ)', 0, '2025-04-20 23:29:53', '2025-04-20 23:29:53'),
(84, 63, 'ด้านเก่งคน (Emotional Quotient: EQ)', 0, '2025-04-20 23:30:29', '2025-04-20 23:30:29'),
(85, 63, 'ด้านเก่งงาน (Adversity Quotient: AQ และ Technology Quotient: TQ)', 0, '2025-04-20 23:30:29', '2025-04-20 23:30:29'),
(86, 63, 'ด้านการปฏิบัติงานบนฐานความยั่งยืน (Sustainability)', 0, '2025-04-20 23:30:29', '2025-04-20 23:30:29'),
(90, 12, 'ประเด็นคำถามปลายเปิด', 0, '2025-07-09 20:09:44', '2025-07-09 20:09:44'),
(91, 10, 'ด้านความเป็นผู้นำ (Leadership)', 0, '2025-07-09 20:28:59', '2025-07-09 20:28:59'),
(92, 10, 'ด้านการมีวิสัยทัศน์ (Vision)', 0, '2025-07-09 20:29:05', '2025-07-09 20:29:05'),
(93, 10, 'ด้านการติดต่อสื่อสาร (Communication)', 0, '2025-07-09 20:29:12', '2025-07-09 20:29:12'),
(94, 10, 'ด้านความสามารถในการคิดและนวัตกรรม (Thinking and Innovation)', 0, '2025-07-09 20:29:19', '2025-07-09 20:29:19'),
(95, 10, 'ด้านจริยธรรมในการปฏิบัติงาน (Ethics)', 0, '2025-07-09 20:29:26', '2025-07-09 20:29:26'),
(96, 10, 'ด้านทักษะระหว่างบุคคลและความร่วมมือ (Interpersonal Skills and Collaboration)', 0, '2025-07-09 20:29:31', '2025-07-09 20:29:31');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `aspects`
--
ALTER TABLE `aspects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aspects_section_id_foreign` (`part_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `aspects`
--
ALTER TABLE `aspects`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aspects`
--
ALTER TABLE `aspects`
  ADD CONSTRAINT `aspects_section_id_foreign` FOREIGN KEY (`part_id`) REFERENCES `parts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
