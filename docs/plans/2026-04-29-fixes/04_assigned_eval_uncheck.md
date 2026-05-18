# Assigned Evaluation — Uncheck (Toggle) Answer

## Requirement

ผู้ใช้ต้องสามารถ **คลิกเพื่อยกเลิก (uncheck)** คำตอบที่เลือกไว้ในแบบประเมินได้ — ปัจจุบันคลิก option ที่ selected อยู่ไม่มีผล

ครอบคลุม:
- Rating buttons (1-5)
- Single-choice options
- Both UI: ประเมินผู้อื่น (`/assigned-evaluations`) + ประเมินตนเอง

## Frontend

3 components:

### `MultiEvaluateeQuestionCard.tsx`
- **Rating** (line 104): `onClick={() => onAnswerChange(evaluatee.id, isSelected ? null : option.id)}`
- **Choice** (line 144-156): if isSelected → `onAnswerChange(evaluatee.id, null)` else เดิม

### `EvaluateeRatingCard.tsx`
- Rating (line 164): toggle null เมื่อกดซ้ำ

### `QuestionCard.tsx` (single-evaluatee version)
- `handleOptionSelect` (line 210): if `isSelected(optionId)` → `onAnswerChange(null)` + reset other text
- `handleRatingSelect` (line 284): toggle null เมื่อกด rating ซ้ำ

## Backend

`AssignedEvaluationController::step()` รองรับ null value → DELETE row (เพื่อไม่ให้นับว่าเป็น "answered"):

```php
// Multi-evaluatee format
if ($answerValue === null || $answerValue === '' || (is_array($answerValue) && count($answerValue) === 0)) {
    Answer::where(...)->delete();
    $savedAnswersCount++;
    continue;
}

// Single-evaluatee format
if ($finalValue === null || ...) {
    Answer::where(...)->delete();
} else {
    Answer::updateOrCreate(...);
}
```

**Note**: เปลี่ยน `isset($value['value'])` → `array_key_exists('value', $value)` เพราะ `isset` คืน false สำหรับ null → branch detection พลาด

## Tests

`tests/Feature/Evaluation/AssignedEvaluationTest.php` เพิ่ม 3 tests:
1. ✅ deletes answer row when single-evaluatee value is null (uncheck)
2. ✅ deletes answer row when multi-evaluatee value is null (uncheck)
3. ✅ handles uncheck on never-answered question without error

ผลรวม: 9/9 PASS

## Files

- `resources/js/components/MultiEvaluateeQuestionCard.tsx`
- `resources/js/components/EvaluateeRatingCard.tsx`
- `resources/js/components/QuestionCard.tsx`
- `app/Http/Controllers/AssignedEvaluationController.php`
- `tests/Feature/Evaluation/AssignedEvaluationTest.php`
