<?php

namespace App\Services;

use App\Models\Evaluation;

/**
 * Centralized service for evaluation form lookup by grade.
 * Replaces hardcoded grade ranges and title matching scattered across controllers.
 */
class EvaluationLookupService
{
    /**
     * Get current fiscal year (CE). Thai fiscal year: Oct-Sep.
     */
    public static function currentFiscalYear(): int
    {
        return now()->month >= 10 ? now()->addYear()->year : now()->year;
    }

    /**
     * Find evaluation form for a given grade (for evaluating others, not self).
     * Uses fiscal_year column first, then falls back to oldest/latest by created_at.
     */
    public static function findByGrade(int $grade, string $userType = 'internal', ?int $fiscalYear = null): ?Evaluation
    {
        $query = Evaluation::where('status', 'published')
            ->where('user_type', $userType)
            ->where('grade_min', '<=', $grade)
            ->where('grade_max', '>=', $grade)
            ->where('title', 'NOT LIKE', '%ประเมินตนเอง%');

        // Primary: match by fiscal_year column directly
        if ($fiscalYear) {
            $match = (clone $query)->where('fiscal_year', $fiscalYear)->first();
            if ($match) {
                return $match;
            }
        }

        // Fallback: oldest for old years, latest for current/future
        if ($fiscalYear && $fiscalYear < self::currentFiscalYear()) {
            return $query->oldest()->first();
        }

        return $query->latest()->first();
    }

    /**
     * Find self-evaluation form for a given grade.
     * Uses fiscal_year column first, then falls back to oldest/latest by created_at.
     * Falls back to the regular internal form if no dedicated self-eval form exists.
     */
    public static function findSelfEvalByGrade(int $grade, ?int $fiscalYear = null): ?Evaluation
    {
        $query = Evaluation::where('status', 'published')
            ->where('user_type', 'internal')
            ->where('grade_min', '<=', $grade)
            ->where('grade_max', '>=', $grade)
            ->where('title', 'LIKE', '%ประเมินตนเอง%');

        // Primary: match by fiscal_year column directly
        if ($fiscalYear) {
            $match = (clone $query)->where('fiscal_year', $fiscalYear)->first();
            if ($match) {
                return $match;
            }
        }

        // Fallback: oldest for old years, latest for current/future
        if ($fiscalYear && $fiscalYear < self::currentFiscalYear()) {
            $eval = $query->oldest()->first();
        } else {
            $eval = $query->latest()->first();
        }

        // Fall back to regular internal form if no self-eval form exists
        if (!$eval) {
            $eval = self::findByGrade($grade, 'internal', $fiscalYear);
        }

        return $eval;
    }

    /**
     * Check if a grade supports a given evaluation angle.
     * Grade 4-8: only self, top, left
     * Grade 9+: all angles (self, top, bottom, left, right)
     */
    public static function supportsAngle(int $grade, string $angle): bool
    {
        if ($grade >= 9) {
            return true; // All angles supported
        }

        // Grade 4-8: no bottom/right
        return in_array($angle, ['self', 'top', 'left']);
    }

    /**
     * Determine the weight level key for a given grade.
     * Consistent across ScoreCalculationService and WeightedScoringService.
     */
    public static function determineWeightLevel(int $grade): string
    {
        if ($grade >= 13) return '13';
        if ($grade >= 9) return '9-12';
        return '4-8';
    }

    /**
     * Check if two grades belong to the same evaluation group.
     */
    public static function isSameGradeGroup(int $grade1, int $grade2): bool
    {
        return self::determineWeightLevel($grade1) === self::determineWeightLevel($grade2);
    }
}
