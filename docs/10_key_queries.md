# Key SQL Queries — Query สำคัญในระบบ

## 1. ดึงคำตอบของผู้ถูกประเมินคนหนึ่ง

```sql
-- ดึงคะแนน rating ทั้งหมดของ evaluatee_id=412 จาก eval_id=1
SELECT
    a.id,
    a.evaluator_id AS user_id,
    a.evaluatee_id,
    ea.angle,
    q.title AS question,
    asp.name AS aspect,
    a.value,
    CAST(a.value AS UNSIGNED) AS score
FROM answers a
JOIN questions q ON a.question_id = q.id
JOIN aspects asp ON q.aspect_id = asp.id
JOIN evaluation_assignments ea
    ON ea.evaluation_id = a.evaluation_id
    AND ea.evaluator_id = a.user_id
    AND ea.evaluatee_id = a.evaluatee_id
WHERE a.evaluation_id = 1
  AND a.evaluatee_id = 412
  AND q.type = 'rating'
ORDER BY asp.id, q.order;
```

---

## 2. คำนวณคะแนนเฉลี่ยต่อ Aspect ต่อ Evaluatee

```sql
SELECT
    a.evaluatee_id,
    u.fname,
    u.lname,
    asp.name AS aspect,
    ea.angle,
    ROUND(AVG(CAST(a.value AS DECIMAL(5,2))), 2) AS avg_score,
    COUNT(DISTINCT a.user_id) AS evaluator_count
FROM answers a
JOIN questions q ON a.question_id = q.id
JOIN aspects asp ON q.aspect_id = asp.id
JOIN users u ON a.evaluatee_id = u.id
JOIN evaluation_assignments ea
    ON ea.evaluation_id = a.evaluation_id
    AND ea.evaluator_id = a.user_id
    AND ea.evaluatee_id = a.evaluatee_id
WHERE a.evaluation_id = 1
  AND q.type = 'rating'
GROUP BY a.evaluatee_id, asp.id, ea.angle
ORDER BY a.evaluatee_id, asp.id;
```

---

## 3. ตรวจสอบ Completion Rate ต่อ Evaluatee

```sql
-- จำนวน questions ที่ต้องตอบในแต่ละ evaluation
SELECT
    e.id AS evaluation_id,
    COUNT(q.id) AS total_questions
FROM evaluations e
JOIN parts p ON p.evaluation_id = e.id
JOIN questions q ON q.part_id = p.id
GROUP BY e.id;

-- จำนวนที่ตอบแล้วต่อ evaluatee ต่อ evaluator
SELECT
    a.evaluatee_id,
    a.user_id AS evaluator_id,
    a.evaluation_id,
    COUNT(DISTINCT a.question_id) AS answered_count
FROM answers a
GROUP BY a.evaluatee_id, a.user_id, a.evaluation_id;
```

---

## 4. ดึงรายชื่อที่ยังไม่ส่งการประเมิน

```sql
SELECT
    ea.evaluator_id,
    eval.fname AS evaluator_fname,
    eval.lname AS evaluator_lname,
    ea.evaluatee_id,
    evee.fname AS evaluatee_fname,
    evee.lname AS evaluatee_lname,
    ea.evaluation_id,
    ea.angle,
    ea.fiscal_year
FROM evaluation_assignments ea
JOIN users eval ON ea.evaluator_id = eval.id
JOIN users evee ON ea.evaluatee_id = evee.id
WHERE ea.fiscal_year = '2025'
  AND NOT EXISTS (
    SELECT 1 FROM answers a
    WHERE a.evaluation_id = ea.evaluation_id
      AND a.user_id = ea.evaluator_id
      AND a.evaluatee_id = ea.evaluatee_id
    LIMIT 1
  )
ORDER BY ea.evaluatee_id;
```

---

## 5. คะแนนรวม Weighted Score ต่อ Evaluatee

```sql
-- สมมติ weight: top=0.30, bottom=0.20, left=0.25, right=0.25
SELECT
    a.evaluatee_id,
    u.fname,
    u.lname,
    SUM(
        CASE ea.angle
            WHEN 'top'    THEN AVG_SCORE.avg * 0.30
            WHEN 'bottom' THEN AVG_SCORE.avg * 0.20
            WHEN 'left'   THEN AVG_SCORE.avg * 0.25
            WHEN 'right'  THEN AVG_SCORE.avg * 0.25
            ELSE 0
        END
    ) AS weighted_score
FROM (
    SELECT
        a.evaluatee_id,
        ea.angle,
        AVG(CAST(a.value AS DECIMAL(5,2))) AS avg
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN evaluation_assignments ea
        ON ea.evaluation_id = a.evaluation_id
        AND ea.evaluator_id = a.user_id
        AND ea.evaluatee_id = a.evaluatee_id
    WHERE a.evaluation_id = 1
      AND q.type = 'rating'
    GROUP BY a.evaluatee_id, ea.angle
) AS AVG_SCORE
JOIN users u ON AVG_SCORE.evaluatee_id = u.id
GROUP BY AVG_SCORE.evaluatee_id
ORDER BY weighted_score DESC;
```

---

## 6. ดึง Self-evaluation answers

```sql
-- Self = user_id = evaluatee_id
SELECT
    a.user_id,
    u.fname,
    u.lname,
    q.title AS question,
    asp.name AS aspect,
    a.value
FROM answers a
JOIN users u ON a.user_id = u.id
JOIN questions q ON a.question_id = q.id
JOIN aspects asp ON q.aspect_id = asp.id
WHERE a.evaluation_id IN (4, 5)   -- self-eval IDs
  AND a.user_id = a.evaluatee_id
  AND q.type = 'rating'
ORDER BY u.id, asp.id;
```

---

## 7. Option Mapping สำหรับ Choice Questions

```sql
-- decode ค่า choice เป็น label
SELECT
    a.evaluatee_id,
    a.user_id,
    q.title AS question,
    o.label AS selected_option,
    o.score
FROM answers a
JOIN questions q ON a.question_id = q.id
JOIN options o ON o.id = CAST(a.value AS UNSIGNED)
WHERE q.type = 'choice'
  AND a.evaluation_id = 4
ORDER BY a.evaluatee_id;
```

---

## 8. สถิติ Satisfaction Survey

```sql
SELECT
    fiscal_year,
    evaluation_id,
    COUNT(*) AS total_responses,
    ROUND(AVG(question_1), 2) AS avg_q1_usability,
    ROUND(AVG(question_2), 2) AS avg_q2_ease,
    ROUND(AVG(question_3), 2) AS avg_q3_speed,
    ROUND(AVG(question_4), 2) AS avg_q4_accuracy,
    ROUND(AVG(question_5), 2) AS avg_q5_accessibility,
    ROUND(AVG(question_6), 2) AS avg_q6_completeness,
    ROUND(AVG(question_7), 2) AS avg_q7_content,
    ROUND(AVG(question_8), 2) AS avg_q8_overall
FROM satisfaction_evaluations
GROUP BY fiscal_year, evaluation_id;
```

---

## 9. ดึง Answers พร้อมข้อมูลครบสำหรับ Export

```sql
SELECT
    evee.emid AS evaluatee_emid,
    CONCAT(evee.prename, evee.fname, ' ', evee.lname) AS evaluatee_name,
    d.name AS division,
    dep.name AS department,
    p.title AS position,
    evee.grade,
    eval.fname AS evaluator_fname,
    eval.lname AS evaluator_lname,
    ea.angle,
    asp.name AS aspect,
    q.title AS question,
    a.value,
    CASE q.type
        WHEN 'rating' THEN CAST(a.value AS CHAR)
        WHEN 'choice' THEN (SELECT o.label FROM options o WHERE o.id = CAST(a.value AS UNSIGNED))
        WHEN 'open_text' THEN a.other_text
        ELSE a.value
    END AS answer_display,
    a.created_at
FROM answers a
JOIN users evee ON a.evaluatee_id = evee.id
JOIN users eval ON a.user_id = eval.id
JOIN divisions d ON evee.division_id = d.id
JOIN departments dep ON evee.department_id = dep.id
JOIN positions p ON evee.position_id = p.id
JOIN questions q ON a.question_id = q.id
JOIN aspects asp ON q.aspect_id = asp.id
LEFT JOIN evaluation_assignments ea
    ON ea.evaluation_id = a.evaluation_id
    AND ea.evaluator_id = a.user_id
    AND ea.evaluatee_id = a.evaluatee_id
WHERE a.evaluation_id = 1
ORDER BY evee.id, asp.id, q.order;
```

---

## 10. นับจำนวนผู้เข้าร่วมต่อสายงาน

```sql
SELECT
    d.name AS division,
    COUNT(DISTINCT ea.evaluatee_id) AS total_evaluatees,
    COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN ea.evaluatee_id END) AS completed,
    ROUND(
        COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN ea.evaluatee_id END) * 100.0
        / COUNT(DISTINCT ea.evaluatee_id), 1
    ) AS completion_rate
FROM evaluation_assignments ea
JOIN users u ON ea.evaluatee_id = u.id
JOIN divisions d ON u.division_id = d.id
LEFT JOIN answers a
    ON a.evaluation_id = ea.evaluation_id
    AND a.evaluatee_id = ea.evaluatee_id
WHERE ea.fiscal_year = '2025'
GROUP BY d.id, d.name
ORDER BY d.id;
```
