-- ======================================================
-- ADD PART 3 (open-ended questions) to evaluations
-- ======================================================

-- EVAL 35: Internal 9-12 - Add Part 3 (4 open-text)
INSERT INTO parts (evaluation_id, title, `order`, created_at, updated_at) VALUES (35, 'ส่วนที่ 3 ประเด็นคำถามปลายเปิด', 3, NOW(), NOW());
SET @part3_35 = LAST_INSERT_ID();
INSERT INTO aspects (part_id, name, has_subaspects, created_at, updated_at) VALUES (@part3_35, 'ประเด็นคำถามปลายเปิด', 0, NOW(), NOW());
SET @aspect_p3_35 = LAST_INSERT_ID();
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_35, @aspect_p3_35, NULL, 'กรุณายกตัวอย่างการทำงานของผู้บริหารที่สร้างความประทับใจในด้านสิ่งแวดล้อมหรือสังคมจากโครงการที่เกี่ยวข้อง', 'open_text', 1, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_35, @aspect_p3_35, NULL, 'ท่านเห็นว่าผู้บริหารมีวิธีการสร้างเครือข่ายที่ช่วยส่งเสริมความร่วมมือระหว่างหน่วยงานอย่างไร', 'open_text', 2, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_35, @aspect_p3_35, NULL, 'กรุณาอธิบายสถานการณ์ที่ผู้บริหารได้ใช้แนวคิดนวัตกรรมเพื่อแก้ไขปัญหาหรือปรับปรุงการทำงานขององค์กร', 'open_text', 3, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_35, @aspect_p3_35, NULL, 'ความคิดเห็นอื่น ๆ (ถ้ามี)', 'open_text', 4, NOW(), NOW());

-- EVAL 36: External 9-12 - Add Part 3 (4 open-text)
INSERT INTO parts (evaluation_id, title, `order`, created_at, updated_at) VALUES (36, 'ส่วนที่ 3 ประเด็นคำถามปลายเปิด', 3, NOW(), NOW());
SET @part3_36 = LAST_INSERT_ID();
INSERT INTO aspects (part_id, name, has_subaspects, created_at, updated_at) VALUES (@part3_36, 'ประเด็นคำถามปลายเปิด', 0, NOW(), NOW());
SET @aspect_p3_36 = LAST_INSERT_ID();
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_36, @aspect_p3_36, NULL, 'ท่านกรุณาอธิบาย โดยยกตัวอย่างที่ผู้บริหารใช้แนวทางการทำงานที่คำนึงถึงผลกระทบต่อสิ่งแวดล้อมและสังคม', 'open_text', 1, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_36, @aspect_p3_36, NULL, 'ท่านคิดว่าผู้บริหารมีแนวทางการแก้ไขปัญหาที่ซับซ้อนในสถานการณ์ที่มีข้อจำกัดอย่างไร', 'open_text', 2, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_36, @aspect_p3_36, NULL, 'ผู้บริหารส่งเสริมให้ทีมสร้างนวัตกรรมหรือการปรับปรุงกระบวนการทำงานใหม่ ๆ อย่างไร', 'open_text', 3, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (@part3_36, @aspect_p3_36, NULL, 'ความคิดเห็นอื่น ๆ (ถ้ามี)', 'open_text', 4, NOW(), NOW());

-- EVAL 37: Internal 4-8 - No Part 3 needed (same as year 68)

-- EVAL 38: Self Governor - Fix Part 3 (1 wrong -> 3 correct)
UPDATE questions SET title = 'ท่านคิดว่า ผวก. กนอ. มีจุดแข็งเรื่องใดที่เป็นจุดเด่นมากที่สุดในการปฏิบัติงานที่ผ่านมา' WHERE id = 1489;
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (132, 308, NULL, 'ท่านคิดว่ามีเรื่องใดที่ ผวก. กนอ. ควรได้รับการพัฒนาปรับปรุงเพิ่มเติม', 'open_text', 2, NOW(), NOW());
INSERT INTO questions (part_id, aspect_id, sub_aspect_id, title, type, `order`, created_at, updated_at) VALUES (132, 308, NULL, 'ความคิดเห็นอื่น ๆ (ถ้ามี)', 'open_text', 3, NOW(), NOW());

-- DONE!