<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SatisfactionEvaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'evaluation_id',
        'fiscal_year',
        'question_1',
        'question_2',
        'question_3',
        'question_4',
        'question_5',
        'question_6',
        'question_7',
        'question_8',
        'additional_comments',
    ];

    protected $casts = [
        'question_1' => 'integer',
        'question_2' => 'integer',
        'question_3' => 'integer',
        'question_4' => 'integer',
        'question_5' => 'integer',
        'question_6' => 'integer',
        'question_7' => 'integer',
        'question_8' => 'integer',
    ];

    /**
     * Get the user that submitted the satisfaction evaluation
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the evaluation that was evaluated
     */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    /**
     * Get satisfaction questions with their text
     */
    public static function getQuestions(): array
    {
        return [
            'question_1' => 'ระดับความพึงพอใจต่อการใช้งานระบบประเมิน',
            'question_2' => 'ระดับความพึงพอใจต่อความง่ายในการใช้งาน',
            'question_3' => 'ระดับความพึงพอใจต่อความเร็วในการตอบสนองของระบบ',
            'question_4' => 'ระดับความพึงพอใจต่อความถูกต้องของข้อมูล',
            'question_5' => 'ระดับความพึงพอใจต่อความสะดวกในการเข้าถึง',
            'question_6' => 'ระดับความพึงพอใจต่อความครบถ้วนของข้อมูล',
            'question_7' => 'ระดับความพึงพอใจต่อความเหมาะสมของเนื้อหา',
            'question_8' => 'ระดับความพึงพอใจโดยรวมต่อระบบประเมิน',
        ];
    }

    /**
     * Get rating scale with text
     */
    public static function getRatingScale(): array
    {
        return [
            5 => 'พึงพอใจมากที่สุด',
            4 => 'พึงพอใจมาก',
            3 => 'พึงพอใจปานกลาง',
            2 => 'พึงพอใจน้อย',
            1 => 'พึงพอใจน้อยที่สุด',
        ];
    }

    /**
     * Calculate average satisfaction score
     */
    public function getAverageScore(): float
    {
        $questions = ['question_1', 'question_2', 'question_3', 'question_4', 'question_5', 'question_6', 'question_7', 'question_8'];
        $total = 0;
        $count = 0;

        foreach ($questions as $question) {
            if ($this->$question > 0) {
                $total += $this->$question;
                $count++;
            }
        }

        return $count > 0 ? round($total / $count, 2) : 0;
    }

    /**
     * Get satisfaction level text based on average score
     */
    public function getSatisfactionLevel(): string
    {
        $average = $this->getAverageScore();
        
        if ($average >= 4.5) return 'พึงพอใจมากที่สุด';
        if ($average >= 3.5) return 'พึงพอใจมาก';
        if ($average >= 2.5) return 'พึงพอใจปานกลาง';
        if ($average >= 1.5) return 'พึงพอใจน้อย';
        return 'พึงพอใจน้อยที่สุด';
    }

    /**
     * Get satisfaction level color
     */
    public function getSatisfactionColor(): string
    {
        $average = $this->getAverageScore();
        
        if ($average >= 4.5) return 'text-green-600';
        if ($average >= 3.5) return 'text-blue-600';
        if ($average >= 2.5) return 'text-yellow-600';
        if ($average >= 1.5) return 'text-orange-600';
        return 'text-red-600';
    }

    /**
     * Check if user has completed satisfaction evaluation
     */
    public static function hasUserCompletedSatisfaction(int $userId, int $evaluationId, string $fiscalYear): bool
    {
        return self::where('user_id', $userId)
            ->where('evaluation_id', $evaluationId)
            ->where('fiscal_year', $fiscalYear)
            ->exists();
    }

    /**
     * Get satisfaction statistics
     */
    public static function getSatisfactionStats(int $evaluationId, string $fiscalYear): array
    {
        $evaluations = self::where('evaluation_id', $evaluationId)
            ->where('fiscal_year', $fiscalYear)
            ->get();

        if ($evaluations->isEmpty()) {
            return [
                'total_responses' => 0,
                'average_score' => 0,
                'satisfaction_level' => 'ไม่มีข้อมูล',
                'question_averages' => [],
            ];
        }

        $questions = ['question_1', 'question_2', 'question_3', 'question_4', 'question_5', 'question_6', 'question_7', 'question_8'];
        $questionAverages = [];
        $totalScore = 0;
        $totalQuestions = 0;

        foreach ($questions as $question) {
            $sum = $evaluations->sum($question);
            $count = $evaluations->count();
            $average = $count > 0 ? round($sum / $count, 2) : 0;
            $questionAverages[$question] = $average;
            $totalScore += $average;
            $totalQuestions++;
        }

        $overallAverage = $totalQuestions > 0 ? round($totalScore / $totalQuestions, 2) : 0;

        return [
            'total_responses' => $evaluations->count(),
            'average_score' => $overallAverage,
            'satisfaction_level' => self::getSatisfactionLevelFromScore($overallAverage),
            'question_averages' => $questionAverages,
        ];
    }

    /**
     * Get satisfaction level from score
     */
    private static function getSatisfactionLevelFromScore(float $score): string
    {
        if ($score >= 4.5) return 'พึงพอใจมากที่สุด';
        if ($score >= 3.5) return 'พึงพอใจมาก';
        if ($score >= 2.5) return 'พึงพอใจปานกลาง';
        if ($score >= 1.5) return 'พึงพอใจน้อย';
        return 'พึงพอใจน้อยที่สุด';
    }
}