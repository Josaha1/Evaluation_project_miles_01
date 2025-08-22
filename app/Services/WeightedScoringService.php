<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class WeightedScoringService
{
    /**
     * Grade 5-8 Evaluation Criteria Weights (น้ำหนักการคะแนนการประเมิน)
     * 1. ด้านเก่งคิด (Intelligence Quotient: IQ) - 25%
     * 2. ด้านเก่งคน (Emotional Quotient: EQ) - 25%
     * 3. ด้านเก่งงาน (Adversity Quotient: AQ และ Technology Quotient: TQ) - 30%
     * 4. ด้านการปฏิบัติงานบนฐานความยั่งยืน (Sustainability) - 20%
     */
    private const GRADE_5_8_CRITERIA_WEIGHTS = [
        'iq' => 0.25,      // ด้านเก่งคิด
        'eq' => 0.25,      // ด้านเก่งคน
        'aq_tq' => 0.30,   // ด้านเก่งงาน
        'sustainability' => 0.20, // ด้านการปฏิบัติงานบนฐานความยั่งยืน
    ];

    /**
     * Grade 9-10 Management Evaluation Criteria Weights
     * 1. ด้านความเป็นผู้นำ/ความสามารถในการบริหารจัดการ - 25%
     * 2. ด้านวิสัยทัศนและกลยุทธ - 15%
     * 3. ด้านความสามารถในการสื่อสาร - 15%
     * 4. ด้านกรอบความคิด ความคิด สร้างสรรค์และนวัตกรรม - 15%
     * 5. ด้านจริยธรรมในการปฏิบัติงาน - 10%
     * 6. ด้านความสัมพันธ์และการทำงานร่วมกับผูอื่น - 20%
     */
    private const GRADE_9_10_CRITERIA_WEIGHTS = [
        'leadership_management' => 0.25,    // ความเป็นผู้นำ/ความสามารถในการบริหารจัดการ
        'vision_strategy' => 0.15,          // วิสัยทัศนและกลยุทธ
        'communication' => 0.15,            // ความสามารถในการสื่อสาร
        'creativity_innovation' => 0.15,    // กรอบความคิด ความคิด สร้างสรรค์และนวัตกรรม
        'ethics' => 0.10,                   // จริยธรรมในการปฏิบัติงาน
        'relationships_teamwork' => 0.20,   // ความสัมพันธ์และการทำงานร่วมกับผูอื่น
    ];

    /**
     * Grade 11-12 Executive Evaluation Criteria Weights
     * 1. ด้านความเป็นผู้นำ/ความสามารถในการบริหารจัดการ - 25%
     * 2. ด้านวิสัยทัศนและกลยุทธ - 25%
     * 3. ด้านความสามารถในการสื่อสาร - 20%
     * 4. ด้านกรอบความคิด ความคิด สร้างสรรค์และนวัตกรรม - 15%
     * 5. ด้านจริยธรรมในการปฏิบัติงาน - 10%
     * 6. ด้านความสัมพันธ์และการทำงานร่วมกับผูอื่น - 15%
     */
    private const GRADE_11_12_CRITERIA_WEIGHTS = [
        'leadership_management' => 0.25,    // ความเป็นผู้นำ/ความสามารถในการบริหารจัดการ
        'vision_strategy' => 0.25,          // วิสัยทัศนและกลยุทธ
        'communication' => 0.20,            // ความสามารถในการสื่อสาร
        'creativity_innovation' => 0.15,    // กรอบความคิด ความคิด สร้างสรรค์และนวัตกรรม
        'ethics' => 0.10,                   // จริยธรรมในการปฏิบัติงาน
        'relationships_teamwork' => 0.15,   // ความสัมพันธ์และการทำงานร่วมกับผูอื่น
    ];

    /**
     * Stakeholder Group Weights (น้ำหนักคะแนนการประเมินจากกลุ่มผู้มีส่วนในการประเมิน)
     * 1. ประเมินตนเอง - 20%
     * 2. ประเมินโดยผู้บังคับบังชา - 50%
     * 3. ประเมินโดยผู้ร่วมงาน - 30%
     */
    private const STAKEHOLDER_WEIGHTS = [
        'self' => 0.20,    // ประเมินตนเอง
        'top' => 0.50,     // ประเมินโดยผู้บังคับบังชา (Superior)
        'left' => 0.30,    // ประเมินโดยผู้ร่วมงาน (Peer)
        'bottom' => 0.0,   // Not used for grades 5-8
        'right' => 0.0,    // External stakeholders (if applicable)
    ];

    /**
     * Enhanced Stakeholder Weights for Management Levels (9-12)
     * Including additional evaluation angles
     */
    private const MANAGEMENT_STAKEHOLDER_WEIGHTS = [
        'self' => 0.15,    // ประเมินตนเอง
        'top' => 0.35,     // ประเมินโดยผู้บังคับบังชา
        'bottom' => 0.25,  // ประเมินโดยผู้ใต้บังคับบัญชา
        'left' => 0.20,    // ประเมินโดยผู้ร่วมงาน
        'right' => 0.05,   // ประเมินโดยผู้มีส่วนได้ส่วนเสียภายนอก
    ];

    /**
     * Calculate weighted score for a user based on their grade and evaluation data
     *
     * @param array $userScores Array containing scores from different evaluation angles
     * @param int $grade User's grade level
     * @param string|\App\Enums\UserType $userType User type (internal/external)
     * @return array Calculated weighted scores and breakdown
     */
    public function calculateWeightedScore(array $userScores, int $grade, $userType = 'internal'): array
    {
        try {
            // Convert enum to string if needed
            $userTypeString = $userType instanceof \BackedEnum ? $userType->value : (string)$userType;
            
            // Determine evaluation level and weights
            $level = $this->determineEvaluationLevel($grade);
            $criteriaWeights = $this->getCriteriaWeights($level, $grade);
            $stakeholderWeights = $this->getStakeholderWeights($level);

            // Calculate stakeholder-weighted scores
            $stakeholderScore = $this->calculateStakeholderWeightedScore($userScores, $stakeholderWeights);

            // Calculate criteria-weighted scores (if aspect-level data is available)
            $criteriaScore = $this->calculateCriteriaWeightedScore($userScores, $criteriaWeights);

            // Final composite score
            $finalScore = $this->calculateFinalCompositeScore($stakeholderScore, $criteriaScore, $level);

            return [
                'final_score' => round($finalScore, 2),
                'stakeholder_score' => round($stakeholderScore, 2),
                'criteria_score' => round($criteriaScore, 2),
                'level' => $level,
                'grade' => $grade,
                'user_type' => $userTypeString,
                'weights_used' => [
                    'stakeholder' => $stakeholderWeights,
                    'criteria' => $criteriaWeights,
                ],
                'breakdown' => $this->generateScoreBreakdown($userScores, $stakeholderWeights, $criteriaWeights),
                'performance_level' => $this->getPerformanceLevel($finalScore),
                'performance_text' => $this->getPerformanceText($finalScore),
            ];
        } catch (\Exception $e) {
            Log::error('Error calculating weighted score', [
                'user_scores' => $userScores,
                'grade' => $grade,
                'user_type' => $userType instanceof \BackedEnum ? $userType->value : (string)$userType,
                'error' => $e->getMessage(),
            ]);

            $userTypeString = $userType instanceof \BackedEnum ? $userType->value : (string)$userType;
            return $this->getDefaultWeightedScore($grade, $userTypeString);
        }
    }

    /**
     * Batch calculate weighted scores for multiple users
     *
     * @param Collection $users Collection of users with their scores
     * @return Collection Results with weighted scores
     */
    public function batchCalculateWeightedScores(Collection $users): Collection
    {
        return $users->map(function ($user) {
            $userScores = [
                'self' => $user['self'] ?? 0,
                'top' => $user['top'] ?? 0,
                'bottom' => $user['bottom'] ?? 0,
                'left' => $user['left'] ?? 0,
                'right' => $user['right'] ?? 0,
            ];

            // Convert user_type to string if it's an enum
            $userType = $user['user_type'] ?? 'internal';
            $userTypeString = $userType instanceof \BackedEnum ? $userType->value : (string)$userType;

            $weightedResult = $this->calculateWeightedScore(
                $userScores,
                $user['grade'],
                $userTypeString
            );

            return array_merge($user, [
                'weighted_score' => $weightedResult['final_score'],
                'stakeholder_score' => $weightedResult['stakeholder_score'],
                'criteria_score' => $weightedResult['criteria_score'],
                'weighted_performance_level' => $weightedResult['performance_level'],
                'weighted_performance_text' => $weightedResult['performance_text'],
                'scoring_breakdown' => $weightedResult['breakdown'],
                'weights_applied' => $weightedResult['weights_used'],
            ]);
        });
    }

    /**
     * Determine evaluation level based on grade
     */
    private function determineEvaluationLevel(int $grade): string
    {
        return match (true) {
            $grade >= 5 && $grade <= 8 => '5-8',
            $grade >= 9 && $grade <= 10 => '9-10',
            $grade >= 11 && $grade <= 12 => '11-12',
            default => 'other',
        };
    }

    /**
     * Get criteria weights based on evaluation level
     */
    private function getCriteriaWeights(string $level, int $grade): array
    {
        return match ($level) {
            '5-8' => self::GRADE_5_8_CRITERIA_WEIGHTS,
            '9-10' => self::GRADE_9_10_CRITERIA_WEIGHTS,
            '11-12' => self::GRADE_11_12_CRITERIA_WEIGHTS,
            default => self::GRADE_5_8_CRITERIA_WEIGHTS, // fallback
        };
    }

    /**
     * Get stakeholder weights based on evaluation level
     */
    private function getStakeholderWeights(string $level): array
    {
        return match ($level) {
            '5-8' => self::STAKEHOLDER_WEIGHTS,
            '9-10', '11-12' => self::MANAGEMENT_STAKEHOLDER_WEIGHTS,
            default => self::STAKEHOLDER_WEIGHTS, // fallback
        };
    }

    /**
     * Calculate stakeholder-weighted score
     */
    private function calculateStakeholderWeightedScore(array $userScores, array $weights): float
    {
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($weights as $angle => $weight) {
            if (isset($userScores[$angle]) && $userScores[$angle] > 0) {
                $weightedSum += $userScores[$angle] * $weight;
                $totalWeight += $weight;
            }
        }

        return $totalWeight > 0 ? $weightedSum / $totalWeight : 0;
    }

    /**
     * Calculate criteria-weighted score (placeholder for future implementation)
     * This would require aspect-level scoring data
     */
    private function calculateCriteriaWeightedScore(array $userScores, array $criteriaWeights): float
    {
        // For now, return the stakeholder average as criteria score
        // TODO: Implement when aspect-level data becomes available
        $availableScores = array_filter($userScores, fn($score) => $score > 0);
        return count($availableScores) > 0 ? array_sum($availableScores) / count($availableScores) : 0;
    }

    /**
     * Calculate final composite score
     */
    private function calculateFinalCompositeScore(float $stakeholderScore, float $criteriaScore, string $level): float
    {
        // Currently using stakeholder score as primary
        // Future enhancement: combine stakeholder and criteria scores
        return $stakeholderScore;
    }

    /**
     * Generate detailed score breakdown
     */
    private function generateScoreBreakdown(array $userScores, array $stakeholderWeights, array $criteriaWeights): array
    {
        $breakdown = [
            'stakeholder_breakdown' => [],
            'criteria_breakdown' => [],
            'total_weighted_contribution' => 0,
        ];

        // Stakeholder breakdown
        $totalContribution = 0;
        foreach ($stakeholderWeights as $angle => $weight) {
            if (isset($userScores[$angle]) && $userScores[$angle] > 0) {
                $contribution = $userScores[$angle] * $weight;
                $breakdown['stakeholder_breakdown'][$angle] = [
                    'raw_score' => $userScores[$angle],
                    'weight' => $weight,
                    'weighted_contribution' => round($contribution, 2),
                    'angle_name' => $this->getAngleName($angle),
                ];
                $totalContribution += $contribution;
            }
        }

        $breakdown['total_weighted_contribution'] = round($totalContribution, 2);

        // Criteria breakdown (placeholder)
        foreach ($criteriaWeights as $criteria => $weight) {
            $breakdown['criteria_breakdown'][$criteria] = [
                'weight' => $weight,
                'criteria_name' => $this->getCriteriaName($criteria),
                'score' => 0, // TODO: Implement when aspect data is available
            ];
        }

        return $breakdown;
    }

    /**
     * Get human-readable angle name
     */
    private function getAngleName(string $angle): string
    {
        return match ($angle) {
            'self' => 'ประเมินตนเอง',
            'top' => 'ประเมินโดยผู้บังคับบัญชา',
            'bottom' => 'ประเมินโดยผู้ใต้บังคับบัญชา',
            'left' => 'ประเมินโดยผู้ร่วมงาน',
            'right' => 'ประเมินโดยผู้มีส่วนได้ส่วนเสียภายนอก',
            default => $angle,
        };
    }

    /**
     * Get human-readable criteria name
     */
    private function getCriteriaName(string $criteria): string
    {
        return match ($criteria) {
            // Grade 5-8 criteria
            'iq' => 'ด้านเก่งคิด (Intelligence Quotient)',
            'eq' => 'ด้านเก่งคน (Emotional Quotient)',
            'aq_tq' => 'ด้านเก่งงาน (Adversity & Technology Quotient)',
            'sustainability' => 'ด้านการปฏิบัติงานบนฐานความยั่งยืน',
            
            // Management criteria (9-12)
            'leadership_management' => 'ด้านความเป็นผู้นำ/ความสามารถในการบริหารจัดการ',
            'vision_strategy' => 'ด้านวิสัยทัศนและกลยุทธ',
            'communication' => 'ด้านความสามารถในการสื่อสาร',
            'creativity_innovation' => 'ด้านกรอบความคิด ความคิด สร้างสรรค์และนวัตกรรม',
            'ethics' => 'ด้านจริยธรรมในการปฏิบัติงาน',
            'relationships_teamwork' => 'ด้านความสัมพันธ์และการทำงานร่วมกับผูอื่น',
            
            default => $criteria,
        };
    }

    /**
     * Get performance level based on score
     */
    private function getPerformanceLevel(float $score): string
    {
        return match (true) {
            $score >= 4.50 => 'excellent',
            $score >= 4.00 => 'very_good',
            $score >= 3.00 => 'good',
            $score >= 2.00 => 'fair',
            default => 'poor',
        };
    }

    /**
     * Get performance text based on score
     */
    private function getPerformanceText(float $score): string
    {
        return match (true) {
            $score >= 4.50 => 'ดีเยี่ยม',
            $score >= 4.00 => 'ดีมาก',
            $score >= 3.00 => 'ดี',
            $score >= 2.00 => 'ควรปรับปรุง',
            default => 'ต้องปรับปรุงมาก',
        };
    }

    /**
     * Get default weighted score for error cases
     */
    private function getDefaultWeightedScore(int $grade, string $userType = 'internal'): array
    {
        $level = $this->determineEvaluationLevel($grade);
        
        return [
            'final_score' => 0,
            'stakeholder_score' => 0,
            'criteria_score' => 0,
            'level' => $level,
            'grade' => $grade,
            'user_type' => $userType,
            'weights_used' => [
                'stakeholder' => $this->getStakeholderWeights($level),
                'criteria' => $this->getCriteriaWeights($level, $grade),
            ],
            'breakdown' => [
                'stakeholder_breakdown' => [],
                'criteria_breakdown' => [],
                'total_weighted_contribution' => 0,
            ],
            'performance_level' => 'poor',
            'performance_text' => 'ไม่มีข้อมูล',
        ];
    }

    /**
     * Generate detailed report for a specific grade group
     */
    public function generateGroupReport(Collection $users, string $gradeGroup): array
    {
        $weightedResults = $this->batchCalculateWeightedScores($users);
        
        return [
            'group' => $gradeGroup,
            'total_users' => $weightedResults->count(),
            'average_weighted_score' => round($weightedResults->avg('weighted_score'), 2),
            'median_weighted_score' => $this->calculateMedian($weightedResults->pluck('weighted_score')->toArray()),
            'score_distribution' => [
                'excellent' => $weightedResults->where('weighted_performance_level', 'excellent')->count(),
                'very_good' => $weightedResults->where('weighted_performance_level', 'very_good')->count(),
                'good' => $weightedResults->where('weighted_performance_level', 'good')->count(),
                'fair' => $weightedResults->where('weighted_performance_level', 'fair')->count(),
                'poor' => $weightedResults->where('weighted_performance_level', 'poor')->count(),
            ],
            'stakeholder_analysis' => $this->analyzeStakeholderScores($weightedResults),
            'improvement_areas' => $this->identifyImprovementAreas($weightedResults),
        ];
    }

    /**
     * Analyze stakeholder score patterns
     */
    private function analyzeStakeholderScores(Collection $results): array
    {
        return [
            'avg_self_score' => round($results->avg('self'), 2),
            'avg_superior_score' => round($results->avg('top'), 2),
            'avg_peer_score' => round($results->avg('left'), 2),
            'avg_subordinate_score' => round($results->avg('bottom'), 2),
            'self_vs_others_gap' => round($results->avg('self') - $results->avg('top'), 2),
        ];
    }

    /**
     * Identify improvement areas based on scoring patterns
     */
    private function identifyImprovementAreas(Collection $results): array
    {
        $areas = [];
        
        // Find users with significant gaps between self and supervisor scores
        $largeGaps = $results->filter(function ($user) {
            return abs(($user['self'] ?? 0) - ($user['top'] ?? 0)) > 1.0;
        });
        
        if ($largeGaps->count() > 0) {
            $areas[] = [
                'area' => 'self_awareness',
                'description' => 'มีความแตกต่างระหว่างการประเมินตนเองกับผู้บังคับบัญชา',
                'affected_users' => $largeGaps->count(),
                'percentage' => round(($largeGaps->count() / $results->count()) * 100, 1),
            ];
        }
        
        // Find low-scoring areas
        $lowScorers = $results->filter(fn($user) => $user['weighted_score'] < 3.0);
        
        if ($lowScorers->count() > 0) {
            $areas[] = [
                'area' => 'overall_performance',
                'description' => 'ผลการปฏิบัติงานโดยรวมต่ำกว่าเกณฑ์',
                'affected_users' => $lowScorers->count(),
                'percentage' => round(($lowScorers->count() / $results->count()) * 100, 1),
            ];
        }
        
        return $areas;
    }

    /**
     * Calculate median value
     */
    private function calculateMedian(array $values): float
    {
        // Filter out null values and ensure we have numbers
        $values = array_filter($values, function($value) {
            return is_numeric($value) && $value !== null;
        });

        if (empty($values)) {
            return 0.0;
        }
        
        sort($values);
        $count = count($values);
        $middle = floor($count / 2);
        
        if ($count % 2 === 0) {
            return (float)(($values[$middle - 1] + $values[$middle]) / 2);
        }
        
        return (float)$values[$middle];
    }
    
    /**
     * Get individual angle report for detailed table format
     */
    public function getIndividualAngleReport($userId, $fiscalYear)
    {
        try {
            $user = \App\Models\User::with(['position', 'department', 'division', 'faction'])
                ->findOrFail($userId);
            
            // Get evaluation assignments
            $assignments = \App\Models\EvaluationAssignment::with(['evaluation.parts.aspects'])
                ->where('evaluatee_id', $userId)
                ->where('fiscal_year', $fiscalYear)
                ->get();
            
            if ($assignments->isEmpty()) {
                return null;
            }
            
            // Initialize weight criteria based on grade
            $weightCriteria = $this->getAngleWeights($user->grade);
            
            // Get answers for this user
            $answers = \App\Models\Answer::with(['question.aspect', 'question.subAspect', 'user', 'evaluatee'])
                ->where('evaluatee_id', $userId)
                ->whereHas('evaluation', function($query) use ($fiscalYear) {
                    $query->whereHas('assignments', function($subQuery) use ($fiscalYear) {
                        $subQuery->where('fiscal_year', $fiscalYear);
                    });
                })
                ->get();
            
            // Group answers by aspect and angle
            $aspectData = [];
            $angleData = ['top' => [], 'bottom' => [], 'self' => [], 'left' => [], 'right' => []];
            
            foreach ($answers as $answer) {
                $aspectName = $answer->question->aspect->name ?? 'Unknown';
                
                // Determine angle based on evaluator and evaluatee relationship
                $angle = $this->determineAngle($answer->user_id, $answer->evaluatee_id, $fiscalYear);
                $score = $answer->value ?? 0;
                
                if (!isset($aspectData[$aspectName])) {
                    $aspectData[$aspectName] = [
                        'aspect_id' => $answer->question->aspect->id ?? 0,
                        'aspect_name' => $aspectName,
                        'angles' => [
                            'top' => ['scores' => [], 'average' => 0, 'weight_percentage' => 0, 'count' => 0],
                            'bottom' => ['scores' => [], 'average' => 0, 'weight_percentage' => 0, 'count' => 0],
                            'self' => ['scores' => [], 'average' => 0, 'weight_percentage' => 0, 'count' => 0],
                            'left' => ['scores' => [], 'average' => 0, 'weight_percentage' => 0, 'count' => 0],
                            'right' => ['scores' => [], 'average' => 0, 'weight_percentage' => 0, 'count' => 0],
                        ]
                    ];
                }
                
                if (isset($aspectData[$aspectName]['angles'][$angle])) {
                    $aspectData[$aspectName]['angles'][$angle]['scores'][] = $score;
                    $angleData[$angle][] = $score;
                }
            }
            
            // Calculate averages and weights for each aspect and angle
            foreach ($aspectData as &$aspect) {
                foreach ($aspect['angles'] as $angle => &$angleInfo) {
                    if (!empty($angleInfo['scores'])) {
                        $angleInfo['average'] = array_sum($angleInfo['scores']) / count($angleInfo['scores']);
                        $angleInfo['count'] = count($angleInfo['scores']);
                        
                        // Calculate weight percentage based on aspect weight and angle criteria
                        $aspectWeight = $this->getAspectWeight($aspect['aspect_name'], $user->grade);
                        $angleWeight = $weightCriteria[$angle] ?? 1;
                        $angleInfo['weight_percentage'] = $angleInfo['average'] * ($aspectWeight * $angleWeight / 100);
                    }
                }
            }
            
            // Calculate totals for each angle
            $angleTotals = [];
            foreach (['top', 'bottom', 'self', 'left', 'right'] as $angle) {
                $totalScores = $angleData[$angle];
                $avgScore = !empty($totalScores) ? array_sum($totalScores) / count($totalScores) : 0;
                $totalWeight = 0;
                
                foreach ($aspectData as $aspect) {
                    $totalWeight += $aspect['angles'][$angle]['weight_percentage'] ?? 0;
                }
                
                $criteriaWeight = $weightCriteria[$angle] ?? 0;
                $actualWeight = ($avgScore * $criteriaWeight) / 100 * $criteriaWeight;
                
                $angleTotals[$angle] = [
                    'final_average' => $avgScore,
                    'final_weight' => $totalWeight,
                    'criteria_weight' => $criteriaWeight,
                    'actual_weight' => $actualWeight
                ];
            }
            
            // Calculate final score
            $finalScore = array_sum(array_column($angleTotals, 'actual_weight'));
            
            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->fname . ' ' . $user->lname,
                    'grade' => $user->grade,
                    'position' => $user->position->title ?? 'ไม่ระบุ',
                    'department' => $user->department->name ?? 'ไม่ระบุ',
                ],
                'fiscal_year' => $fiscalYear,
                'aspects' => array_values($aspectData),
                'totals' => [
                    'angle_totals' => $angleTotals,
                    'final_weighted_score' => $finalScore,
                    'weight_criteria' => $weightCriteria
                ],
                'weight_criteria' => $weightCriteria,
                'final_score' => $finalScore
            ];
            
        } catch (\Exception $e) {
            Log::error('Individual angle report error: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Get angle weights based on grade
     */
    private function getAngleWeights($grade)
    {
        // Default weights for 360-degree evaluation
        return [
            'top' => 25,     // องศาบน
            'bottom' => 25,  // องศาล่าง  
            'self' => 10,    // ประเมินตนเอง
            'left' => 20,    // องศาซ้าย
            'right' => 20    // องศาขวา
        ];
    }
    
    /**
     * Determine angle based on evaluator and evaluatee relationship
     */
    private function determineAngle($evaluatorId, $evaluateeId, $fiscalYear)
    {
        // If evaluator is the same as evaluatee, it's self-evaluation
        if ($evaluatorId == $evaluateeId) {
            return 'self';
        }
        
        // Look up the angle from evaluation assignments
        $assignment = \App\Models\EvaluationAssignment::where('evaluator_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $fiscalYear)
            ->first();
            
        return $assignment ? $assignment->angle : 'unknown';
    }
    
    /**
     * Get aspect weight based on aspect name and grade
     */
    private function getAspectWeight($aspectName, $grade)
    {
        // This would typically come from your aspect configuration
        // For now, return equal weight for all aspects
        $baseWeight = $grade >= 9 ? 16.67 : 25; // 6 aspects for grade 9+ vs 4 for grade 5-8
        
        // You can customize weights per aspect here
        $aspectWeights = [
            'ด้านความเป็นผู้นำ' => 25,
            'ด้านการมีวิสัยทัศน์' => 15, 
            'ด้านการติดต่อสื่อสาร' => 15,
            'ด้านความสามารถในการคิดและนวัตกรรม' => 15,
            'ด้านจริยธรรมในการปฏิบัติงาน' => 10,
            'ด้านทักษะระหว่างบุคคลและความร่วมมือ' => 20
        ];
        
        return $aspectWeights[$aspectName] ?? $baseWeight;
    }
}