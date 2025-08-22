<?php

namespace App\Services;

use App\Models\User;
use App\Models\EvaluationWeight;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Enhanced Score Calculation Service
 * 
 * ปรับปรุงระบบการคิดคะแนนให้มีความยืดหยุ่น ถูกต้อง และครอบคลุม
 */
class ScoreCalculationService
{
    // Constants for score calculation
    private const SCORE_MIN = 0.0;
    private const SCORE_MAX = 5.0;
    private const WEIGHT_TOLERANCE = 0.001; // ความคลาดเคลื่อนที่ยอมรับได้สำหรับน้ำหนัก
    
    /**
     * ระบบน้ำหนักที่ปรับปรุงแล้ว - สามารถกำหนดค่าได้
     */
    private array $defaultWeights = [
        '5-8' => [
            'self' => 0.20,
            'top' => 0.50,
            'left' => 0.30
        ],
        '9-12' => [
            'self' => 0.10,
            'top' => 0.25,
            'bottom' => 0.25,
            'left' => 0.20,
            'right' => 0.20
        ]
    ];
    
    /**
     * คำนวณคะแนนสำหรับผู้ใช้รายคน พร้อมการตรวจสอบความถูกต้อง
     */
    public function calculateUserScore(
        int $evaluateeId, 
        Collection $angleScores, 
        ?array $customWeights = null,
        int $fiscalYear = null
    ): ?array {
        try {
            $user = $this->getUserWithRelations($evaluateeId);
            if (!$user) {
                Log::warning("User not found for score calculation: {$evaluateeId}");
                return null;
            }
            
            $grade = (int) $user->grade;
            $userType = $user->user_type ?? 'internal';
            $level = $this->determineLevel($grade);
            
            // ดึงน้ำหนักที่เหมาะสม
            $weights = $customWeights ?? $this->getWeightsForLevel($level, $fiscalYear);
            
            // ตรวจสอบความถูกต้องของน้ำหนัก
            $weightValidation = $this->validateWeights($weights);
            if (!$weightValidation['is_valid']) {
                Log::error("Invalid weights for user {$evaluateeId}: " . implode(', ', $weightValidation['errors']));
                return null;
            }
            
            // คำนวณคะแนนแต่ละมุมมอง
            $scoreByAngle = $this->calculateAngleScores($angleScores, $weights);
            
            // ตรวจสอบความถูกต้องของคะแนน
            $scoreValidation = $this->validateScores($scoreByAngle);
            if (!$scoreValidation['is_valid']) {
                Log::warning("Invalid scores for user {$evaluateeId}: " . implode(', ', $scoreValidation['warnings']));
            }
            
            // คำนวณคะแนนถ่วงน้ำหนัก
            $weightedAverage = $this->calculateWeightedAverage($scoreByAngle, $weights);
            
            // คำนวณสถิติเพิ่มเติม
            $analytics = $this->calculateAnalytics($angleScores, $scoreByAngle, $weights);
            
            // สร้างผลลัพธ์
            return $this->buildUserScoreResult($user, $scoreByAngle, $weightedAverage, $analytics);
            
        } catch (\Exception $e) {
            Log::error("Error calculating score for user {$evaluateeId}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
    
    /**
     * คำนวณคะแนนรวมสำหรับกลุ่ม
     */
    public function calculateBatchScores(
        Collection $users,
        Collection $allAngleScores,
        ?array $customWeights = null,
        int $fiscalYear = null
    ): Collection {
        $results = collect();
        $groupedScores = $allAngleScores->groupBy('evaluatee_id');
        
        foreach ($users as $user) {
            $userScores = $groupedScores->get($user->id, collect());
            $result = $this->calculateUserScore($user->id, $userScores, $customWeights, $fiscalYear);
            
            if ($result) {
                $results->push($result);
            } else {
                // สร้างข้อมูลเปล่าสำหรับผู้ที่ไม่มีคะแนน
                $results->push($this->createEmptyScoreRecord($user));
            }
        }
        
        return $results;
    }
    
    /**
     * ตรวจสอบความถูกต้องของน้ำหนัก
     */
    private function validateWeights(array $weights): array
    {
        $errors = [];
        
        // ตรวจสอบว่าน้ำหนักรวมเป็น 1.0
        $totalWeight = array_sum($weights);
        if (abs($totalWeight - 1.0) > self::WEIGHT_TOLERANCE) {
            $errors[] = "Total weights ({$totalWeight}) must equal 1.0";
        }
        
        // ตรวจสอบว่าแต่ละน้ำหนักอยู่ในช่วงที่ถูกต้อง
        foreach ($weights as $angle => $weight) {
            if ($weight < 0 || $weight > 1) {
                $errors[] = "Weight for {$angle} ({$weight}) must be between 0 and 1";
            }
        }
        
        // ตรวจสอบว่ามีน้ำหนักที่จำเป็น
        $requiredAngles = $this->getRequiredAngles($weights);
        foreach ($requiredAngles as $angle) {
            if (!isset($weights[$angle])) {
                $errors[] = "Missing required weight for {$angle}";
            }
        }
        
        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
            'total_weight' => $totalWeight
        ];
    }
    
    /**
     * ตรวจสอบความถูกต้องของคะแนน
     */
    private function validateScores(array $scores): array
    {
        $warnings = [];
        
        foreach ($scores as $angle => $score) {
            if ($score < self::SCORE_MIN || $score > self::SCORE_MAX) {
                $warnings[] = "Score for {$angle} ({$score}) is outside valid range [".self::SCORE_MIN."-".self::SCORE_MAX."]";
            }
            
            if ($score === 0) {
                $warnings[] = "No score data available for {$angle}";
            }
        }
        
        return [
            'is_valid' => empty($warnings),
            'warnings' => $warnings
        ];
    }
    
    /**
     * คำนวณคะแนนแต่ละมุมมอง
     */
    private function calculateAngleScores(Collection $angleScores, array $weights): array
    {
        $scoreByAngle = [];
        
        foreach (array_keys($weights) as $angle) {
            $angleData = $angleScores->firstWhere('angle', $angle);
            $score = $angleData ? (float) $angleData->score : 0.0;
            
            // ปรับคะแนนให้อยู่ในช่วงที่ถูกต้อง
            $scoreByAngle[$angle] = $this->normalizeScore($score);
        }
        
        return $scoreByAngle;
    }
    
    /**
     * คำนวณคะแนนถ่วงน้ำหนัก
     */
    private function calculateWeightedAverage(array $scores, array $weights): float
    {
        $weightedSum = 0.0;
        $totalWeight = 0.0;
        
        foreach ($scores as $angle => $score) {
            if (isset($weights[$angle])) {
                $weightedSum += $score * $weights[$angle];
                $totalWeight += $weights[$angle];
            }
        }
        
        return $totalWeight > 0 ? $weightedSum / $totalWeight : 0.0;
    }
    
    /**
     * คำนวณสถิติเพิ่มเติม
     */
    private function calculateAnalytics(Collection $angleScores, array $scoreByAngle, array $weights): array
    {
        $totalAnswers = $angleScores->sum('answer_count');
        $completedAngles = collect($scoreByAngle)->filter(fn($score) => $score > 0)->count();
        $expectedAngles = count($weights);
        $completionRate = $expectedAngles > 0 ? ($completedAngles / $expectedAngles) * 100 : 0;
        
        // คำนวณความแปรปรวนของคะแนน
        $scores = array_values($scoreByAngle);
        $variance = $this->calculateVariance($scores);
        $standardDeviation = sqrt($variance);
        
        // คำนวณ confidence interval
        $confidenceInterval = $this->calculateConfidenceInterval($scores);
        
        return [
            'total_answers' => $totalAnswers,
            'completed_angles' => $completedAngles,
            'expected_angles' => $expectedAngles,
            'completion_rate' => round($completionRate, 2),
            'score_variance' => round($variance, 4),
            'score_std_dev' => round($standardDeviation, 4),
            'confidence_interval' => $confidenceInterval,
            'data_quality_score' => $this->calculateDataQualityScore($completionRate, $totalAnswers, $variance)
        ];
    }
    
    /**
     * สร้างผลลัพธ์สำหรับผู้ใช้
     */
    private function buildUserScoreResult(User $user, array $scoreByAngle, float $weightedAverage, array $analytics): array
    {
        $grade = (int) $user->grade;
        $performanceRating = $this->getPerformanceRating($weightedAverage);
        
        return [
            'id' => $user->id,
            'name' => trim($user->fname . ' ' . $user->lname),
            'position' => $user->position->title ?? '-',
            'grade' => $grade,
            'division' => $user->division->name ?? '-',
            'user_type' => $user->user_type ?? 'internal',
            'division_id' => $user->division_id,
            'position_id' => $user->position_id,
            
            // คะแนนแต่ละมุมมอง
            'self' => $scoreByAngle['self'] ?? 0,
            'top' => $scoreByAngle['top'] ?? 0,
            'bottom' => $grade >= 9 ? ($scoreByAngle['bottom'] ?? 0) : null,
            'left' => $scoreByAngle['left'] ?? 0,
            'right' => $grade >= 9 ? ($scoreByAngle['right'] ?? 0) : null,
            
            // คะแนนสรุป
            'average' => round($weightedAverage, 2),
            'raw_average' => round(array_sum($scoreByAngle) / count($scoreByAngle), 2),
            
            // ข้อมูลวิเคราะห์
            'total_answers' => $analytics['total_answers'],
            'completed_angles' => $analytics['completed_angles'],
            'expected_angles' => $analytics['expected_angles'],
            'completion_rate' => $analytics['completion_rate'],
            'data_quality_score' => $analytics['data_quality_score'],
            'score_variance' => $analytics['score_variance'],
            'confidence_interval' => $analytics['confidence_interval'],
            
            // การจัดระดับผลงาน
            'rating' => $performanceRating['level'],
            'rating_text' => $performanceRating['text'],
            'rating_color' => $performanceRating['color'],
            
            // ข้อมูลเพิ่มเติม
            'last_updated' => now()->toISOString(),
            'calculation_method' => 'weighted_average_v2',
        ];
    }
    
    /**
     * สร้างข้อมูลเปล่าสำหรับผู้ที่ไม่มีคะแนน
     */
    private function createEmptyScoreRecord(User $user): array
    {
        $grade = (int) $user->grade;
        $level = $this->determineLevel($grade);
        $weights = $this->getWeightsForLevel($level);
        
        return [
            'id' => $user->id,
            'name' => trim($user->fname . ' ' . $user->lname),
            'position' => $user->position->title ?? '-',
            'grade' => $grade,
            'division' => $user->division->name ?? '-',
            'user_type' => $user->user_type ?? 'internal',
            'division_id' => $user->division_id,
            'position_id' => $user->position_id,
            
            // คะแนนแต่ละมุมมอง - ทั้งหมดเป็น 0
            'self' => 0,
            'top' => 0,
            'bottom' => $grade >= 9 ? 0 : null,
            'left' => 0,
            'right' => $grade >= 9 ? 0 : null,
            
            // คะแนนสรุป
            'average' => 0,
            'raw_average' => 0,
            
            // ข้อมูลวิเคราะห์
            'total_answers' => 0,
            'completed_angles' => 0,
            'expected_angles' => count($weights),
            'completion_rate' => 0,
            'data_quality_score' => 0,
            'score_variance' => 0,
            'confidence_interval' => ['lower' => 0, 'upper' => 0],
            
            // การจัดระดับผลงาน
            'rating' => 1,
            'rating_text' => 'ไม่ได้ประเมิน',
            'rating_color' => 'text-gray-500',
            
            // ข้อมูลเพิ่มเติม
            'last_updated' => now()->toISOString(),
            'calculation_method' => 'empty_record',
            'status' => 'no_data',
        ];
    }
    
    /**
     * ดึงน้ำหนักสำหรับระดับที่กำหนด
     */
    private function getWeightsForLevel(string $level, ?int $fiscalYear = null): array
    {
        // ในอนาคตสามารถดึงจาก database ได้
        // $weights = EvaluationWeight::getWeightsForLevel($level, $fiscalYear);
        
        return $this->defaultWeights[$level] ?? $this->defaultWeights['5-8'];
    }
    
    /**
     * กำหนดระดับตามเกรด
     */
    private function determineLevel(int $grade): string
    {
        return $grade >= 9 ? '9-12' : '5-8';
    }
    
    /**
     * ปรับคะแนนให้อยู่ในช่วงที่ถูกต้อง
     */
    private function normalizeScore(float $score): float
    {
        return max(self::SCORE_MIN, min(self::SCORE_MAX, round($score, 2)));
    }
    
    /**
     * คำนวณความแปรปรวน
     */
    private function calculateVariance(array $scores): float
    {
        if (count($scores) <= 1) return 0.0;
        
        $mean = array_sum($scores) / count($scores);
        $sumSquaredDiff = array_sum(array_map(fn($score) => pow($score - $mean, 2), $scores));
        
        return $sumSquaredDiff / count($scores);
    }
    
    /**
     * คำนวณ confidence interval
     */
    private function calculateConfidenceInterval(array $scores, float $confidence = 0.95): array
    {
        if (count($scores) <= 1) {
            return ['lower' => 0, 'upper' => 0];
        }
        
        $mean = array_sum($scores) / count($scores);
        $variance = $this->calculateVariance($scores);
        $stdDev = sqrt($variance);
        $standardError = $stdDev / sqrt(count($scores));
        
        // ใช้ t-distribution สำหรับ sample size เล็ก
        $tValue = 1.96; // ประมาณค่าสำหรับ 95% confidence
        $margin = $tValue * $standardError;
        
        return [
            'lower' => round(max(self::SCORE_MIN, $mean - $margin), 2),
            'upper' => round(min(self::SCORE_MAX, $mean + $margin), 2)
        ];
    }
    
    /**
     * คำนวณคะแนนคุณภาพข้อมูล
     */
    private function calculateDataQualityScore(float $completionRate, int $totalAnswers, float $variance): float
    {
        // คะแนนคุณภาพขึ้นอยู่กับ completion rate, จำนวนคำตอบ, และความสม่ำเสมอของคะแนน
        $completionWeight = 0.4;
        $volumeWeight = 0.3;
        $consistencyWeight = 0.3;
        
        $completionScore = $completionRate / 100;
        $volumeScore = min(1.0, $totalAnswers / 50); // สมมติว่า 50 คำตอบคือเกณฑ์ที่ดี
        $consistencyScore = max(0, 1 - ($variance / 2)); // ความแปรปรวนต่ำ = ความสม่ำเสมอสูง
        
        $qualityScore = (
            $completionScore * $completionWeight +
            $volumeScore * $volumeWeight +
            $consistencyScore * $consistencyWeight
        ) * 100;
        
        return round($qualityScore, 2);
    }
    
    /**
     * จัดระดับผลงาน
     */
    private function getPerformanceRating(float $score): array
    {
        if ($score >= 4.50) {
            return ['level' => 5, 'text' => 'ดีเยี่ยม', 'color' => 'text-green-800'];
        } elseif ($score >= 4.00) {
            return ['level' => 4, 'text' => 'ดีมาก', 'color' => 'text-blue-800'];
        } elseif ($score >= 3.00) {
            return ['level' => 3, 'text' => 'ดี', 'color' => 'text-yellow-800'];
        } elseif ($score >= 2.00) {
            return ['level' => 2, 'text' => 'ควรปรับปรุง', 'color' => 'text-orange-800'];
        } else {
            return ['level' => 1, 'text' => 'ต้องปรับปรุงมาก', 'color' => 'text-red-800'];
        }
    }
    
    /**
     * ดึงข้อมูลผู้ใช้พร้อม relations
     */
    private function getUserWithRelations(int $userId): ?User
    {
        return Cache::remember("user_with_relations_{$userId}", 3600, function () use ($userId) {
            return User::with(['division:id,name', 'position:id,title'])->find($userId);
        });
    }
    
    /**
     * ดึงมุมมองที่จำเป็นตามน้ำหนัก
     */
    private function getRequiredAngles(array $weights): array
    {
        return array_keys(array_filter($weights, fn($weight) => $weight > 0));
    }
    
    /**
     * สร้างรายงานการวิเคราะห์คะแนน
     */
    public function generateScoreAnalysisReport(Collection $scores): array
    {
        $allScores = $scores->pluck('average')->filter(fn($score) => $score > 0);
        
        if ($allScores->isEmpty()) {
            return [
                'total_evaluated' => 0,
                'analysis' => 'ไม่มีข้อมูลคะแนนสำหรับการวิเคราะห์'
            ];
        }
        
        return [
            'total_evaluated' => $allScores->count(),
            'mean' => round($allScores->avg(), 2),
            'median' => round($allScores->median(), 2),
            'mode' => $allScores->mode()->first() ?? 0,
            'std_deviation' => round($this->calculateVariance($allScores->toArray()), 2),
            'min' => round($allScores->min(), 2),
            'max' => round($allScores->max(), 2),
            'quartiles' => [
                'q1' => round($allScores->percentile(25), 2),
                'q2' => round($allScores->percentile(50), 2),
                'q3' => round($allScores->percentile(75), 2),
            ],
            'distribution' => [
                'excellent' => $scores->where('rating', 5)->count(),
                'very_good' => $scores->where('rating', 4)->count(),
                'good' => $scores->where('rating', 3)->count(),
                'fair' => $scores->where('rating', 2)->count(),
                'poor' => $scores->where('rating', 1)->count(),
            ],
            'data_quality' => [
                'avg_completion_rate' => round($scores->avg('completion_rate'), 2),
                'avg_data_quality_score' => round($scores->avg('data_quality_score'), 2),
                'users_with_complete_data' => $scores->where('completion_rate', 100)->count(),
            ]
        ];
    }
}