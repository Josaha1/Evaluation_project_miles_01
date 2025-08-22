<?php

namespace Tests\Unit;

use App\Services\WeightedScoringService;
use Illuminate\Support\Collection;
use PHPUnit\Framework\TestCase;

class WeightedScoringServiceTest extends TestCase
{
    private WeightedScoringService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new WeightedScoringService();
    }

    /**
     * Test weighted score calculation for Grade 5-8 employee
     */
    public function test_grade_5_8_weighted_calculation()
    {
        $userScores = [
            'self' => 4.0,  // 20% weight
            'top' => 4.5,   // 50% weight  
            'left' => 3.5,  // 30% weight
            'bottom' => 0,  // Not used for 5-8
            'right' => 0,   // Not used for 5-8
        ];

        $result = $this->service->calculateWeightedScore($userScores, 6);

        // Expected: (4.0 * 0.2 + 4.5 * 0.5 + 3.5 * 0.3) / (0.2 + 0.5 + 0.3) = 4.05
        $this->assertEquals('5-8', $result['level']);
        $this->assertEquals(6, $result['grade']);
        $this->assertEqualsWithDelta(4.05, $result['final_score'], 0.01);
        $this->assertEquals('very_good', $result['performance_level']);
        $this->assertEquals('ดีมาก', $result['performance_text']);
    }

    /**
     * Test weighted score calculation for Grade 9-10 management
     */
    public function test_grade_9_10_weighted_calculation()
    {
        $userScores = [
            'self' => 4.2,    // 15% weight
            'top' => 4.8,     // 35% weight
            'bottom' => 3.8,  // 25% weight
            'left' => 4.0,    // 20% weight
            'right' => 3.5,   // 5% weight
        ];

        $result = $this->service->calculateWeightedScore($userScores, 9);

        // Expected weighted calculation for management level
        $this->assertEquals('9-10', $result['level']);
        $this->assertEquals(9, $result['grade']);
        $this->assertGreaterThan(4.0, $result['final_score']);
        $this->assertArrayHasKey('breakdown', $result);
    }

    /**
     * Test weighted score calculation for Grade 11-12 executive
     */
    public function test_grade_11_12_weighted_calculation()
    {
        $userScores = [
            'self' => 4.5,
            'top' => 4.9,
            'bottom' => 4.2,
            'left' => 4.3,
            'right' => 4.0,
        ];

        $result = $this->service->calculateWeightedScore($userScores, 12);

        $this->assertEquals('11-12', $result['level']);
        $this->assertEquals(12, $result['grade']);
        $this->assertGreaterThan(4.0, $result['final_score']);
        $this->assertEquals('excellent', $result['performance_level']);
    }

    /**
     * Test batch calculation with multiple users
     */
    public function test_batch_weighted_calculation()
    {
        $users = collect([
            [
                'id' => 1,
                'name' => 'Test User 1',
                'grade' => 6,
                'user_type' => 'internal',
                'self' => 4.0,
                'top' => 4.2,
                'left' => 3.8,
                'bottom' => 0,
                'right' => 0,
                'average' => 4.0,
            ],
            [
                'id' => 2,
                'name' => 'Test User 2',
                'grade' => 10,
                'user_type' => 'internal',
                'self' => 4.5,
                'top' => 4.8,
                'bottom' => 4.2,
                'left' => 4.3,
                'right' => 4.0,
                'average' => 4.36,
            ],
        ]);

        $results = $this->service->batchCalculateWeightedScores($users);

        $this->assertCount(2, $results);
        
        // Check first user (Grade 5-8)
        $user1 = $results->first();
        $this->assertArrayHasKey('weighted_score', $user1);
        $this->assertArrayHasKey('stakeholder_score', $user1);
        $this->assertArrayHasKey('weighted_performance_level', $user1);
        
        // Check second user (Grade 9-10)
        $user2 = $results->last();
        $this->assertArrayHasKey('weighted_score', $user2);
        $this->assertArrayHasKey('scoring_breakdown', $user2);
    }

    /**
     * Test group report generation
     */
    public function test_generate_group_report()
    {
        $users = collect([
            [
                'id' => 1,
                'grade' => 6,
                'user_type' => 'internal',
                'self' => 3.8,
                'top' => 4.0,
                'left' => 3.5,
                'average' => 3.77,
                'weighted_score' => 3.85,
                'weighted_performance_level' => 'good',
            ],
            [
                'id' => 2,
                'grade' => 7,
                'user_type' => 'internal',
                'self' => 4.2,
                'top' => 4.5,
                'left' => 4.0,
                'average' => 4.23,
                'weighted_score' => 4.25,
                'weighted_performance_level' => 'very_good',
            ],
        ]);

        $report = $this->service->generateGroupReport($users, '5-8');

        $this->assertEquals('5-8', $report['group']);
        $this->assertEquals(2, $report['total_users']);
        $this->assertArrayHasKey('average_weighted_score', $report);
        $this->assertArrayHasKey('score_distribution', $report);
        $this->assertArrayHasKey('stakeholder_analysis', $report);
        $this->assertArrayHasKey('improvement_areas', $report);
    }

    /**
     * Test edge cases and error handling
     */
    public function test_edge_cases()
    {
        // Test with no scores
        $emptyScores = [
            'self' => 0,
            'top' => 0,
            'left' => 0,
            'bottom' => 0,
            'right' => 0,
        ];

        $result = $this->service->calculateWeightedScore($emptyScores, 6);
        
        $this->assertEquals(0, $result['final_score']);
        $this->assertEquals('poor', $result['performance_level']);
        $this->assertEquals('ไม่มีข้อมูล', $result['performance_text']);

        // Test with partial scores
        $partialScores = [
            'self' => 4.0,
            'top' => 0,    // Missing score
            'left' => 3.5,
            'bottom' => 0,
            'right' => 0,
        ];

        $partialResult = $this->service->calculateWeightedScore($partialScores, 6);
        $this->assertGreaterThan(0, $partialResult['final_score']);
    }

    /**
     * Test performance level thresholds
     */
    public function test_performance_level_thresholds()
    {
        $testCases = [
            ['score' => 4.8, 'expected_level' => 'excellent', 'expected_text' => 'ดีเยี่ยม'],
            ['score' => 4.2, 'expected_level' => 'very_good', 'expected_text' => 'ดีมาก'],
            ['score' => 3.5, 'expected_level' => 'good', 'expected_text' => 'ดี'],
            ['score' => 2.5, 'expected_level' => 'fair', 'expected_text' => 'ควรปรับปรุง'],
            ['score' => 1.5, 'expected_level' => 'poor', 'expected_text' => 'ต้องปรับปรุงมาก'],
        ];

        foreach ($testCases as $case) {
            $userScores = [
                'self' => $case['score'],
                'top' => $case['score'],
                'left' => $case['score'],
                'bottom' => 0,
                'right' => 0,
            ];

            $result = $this->service->calculateWeightedScore($userScores, 6);
            
            $this->assertEquals(
                $case['expected_level'], 
                $result['performance_level'],
                "Failed for score {$case['score']}"
            );
            $this->assertEquals(
                $case['expected_text'], 
                $result['performance_text'],
                "Failed for score {$case['score']}"
            );
        }
    }

    /**
     * Test stakeholder weights are correctly applied
     */
    public function test_stakeholder_weights_application()
    {
        // Grade 5-8: Self 20%, Top 50%, Left 30%
        $userScores = [
            'self' => 3.0,  // Low self score
            'top' => 5.0,   // High superior score (should have most weight)
            'left' => 4.0,  // Medium peer score
            'bottom' => 0,
            'right' => 0,
        ];

        $result = $this->service->calculateWeightedScore($userScores, 6);
        
        // With 50% weight on 'top' score of 5.0, final should be closer to 5.0 than 3.0
        $this->assertGreaterThan(4.0, $result['final_score']);
        $this->assertLessThan(5.0, $result['final_score']);
        
        // Check breakdown includes weight information
        $breakdown = $result['breakdown'];
        $this->assertArrayHasKey('stakeholder_breakdown', $breakdown);
        $this->assertArrayHasKey('top', $breakdown['stakeholder_breakdown']);
        $this->assertEquals(0.5, $breakdown['stakeholder_breakdown']['top']['weight']);
    }
}