<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Controllers\AdminEvaluationReportController;
use App\Models\Answer;
use App\Models\Divisions;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Mockery;
use Carbon\Carbon;

class AdminEvaluationReportControllerTest extends TestCase
{
    protected $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new AdminEvaluationReportController();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Test getCurrentFiscalYear helper method
     */
    public function test_getCurrentFiscalYear_returns_correct_fiscal_year()
    {
        // Mock Carbon to control the date
        Carbon::setTestNow(Carbon::create(2025, 5, 15)); // May 15, 2025
        
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getCurrentFiscalYear');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller);
        
        // May is before October, so fiscal year should be 2025
        $this->assertEquals(2025, $result);
        
        // Test with October
        Carbon::setTestNow(Carbon::create(2024, 10, 15)); // October 15, 2024
        $result = $method->invoke($this->controller);
        
        // October is start of new fiscal year, so should be 2025
        $this->assertEquals(2025, $result);
        
        Carbon::setTestNow(); // Reset
    }

    /**
     * Test getFiscalYearDateRange helper method
     */
    public function test_getFiscalYearDateRange_returns_correct_dates()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getFiscalYearDateRange');
        $method->setAccessible(true);
        
        [$start, $end] = $method->invoke($this->controller, 2025);
        
        $this->assertEquals('2024-10-01 00:00:00', $start->format('Y-m-d H:i:s'));
        $this->assertEquals('2025-09-30 23:59:59', $end->format('Y-m-d H:i:s'));
    }

    /**
     * Test getValidPartIds helper method
     */
    public function test_getValidPartIds_returns_correct_part_ids()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getValidPartIds');
        $method->setAccessible(true);
        
        // Test grade < 9
        $result = $method->invoke($this->controller, 8);
        $this->assertEquals([7], $result);
        
        // Test grade >= 9
        $result = $method->invoke($this->controller, 10);
        $this->assertEquals([1, 4], $result);
        
        // Test null grade (default)
        $result = $method->invoke($this->controller, null);
        $this->assertEquals([1, 4, 7], $result);
    }

    /**
     * Test getAvailableFiscalYears with caching
     */
    public function test_getAvailableFiscalYears_uses_cache()
    {
        Cache::shouldReceive('remember')
            ->once()
            ->with('available_fiscal_years', Mockery::any(), Mockery::type('Closure'))
            ->andReturn([2025, 2024, 2023]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getAvailableFiscalYears');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller);
        
        $this->assertEquals([2025, 2024, 2023], $result);
    }

    /**
     * Test getAvailableDivisions with caching
     */
    public function test_getAvailableDivisions_uses_cache()
    {
        $mockDivisions = collect([
            (object)['id' => 1, 'name' => 'สายงาน 1'],
            (object)['id' => 2, 'name' => 'สายงาน 2']
        ]);

        Cache::shouldReceive('remember')
            ->once()
            ->with('available_divisions', Mockery::any(), Mockery::type('Closure'))
            ->andReturn($mockDivisions);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getAvailableDivisions');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller);
        
        $this->assertEquals($mockDivisions, $result);
    }

    /**
     * Test getAvailableGrades with caching
     */
    public function test_getAvailableGrades_uses_cache()
    {
        Cache::shouldReceive('remember')
            ->once()
            ->with('available_grades', Mockery::any(), Mockery::type('Closure'))
            ->andReturn([12, 11, 10, 9, 8, 7, 6, 5]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getAvailableGrades');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller);
        
        $this->assertEquals([12, 11, 10, 9, 8, 7, 6, 5], $result);
    }

    /**
     * Test getAvailableUsers with caching
     */
    public function test_getAvailableUsers_uses_cache()
    {
        $mockUsers = collect([
            ['id' => 1, 'name' => 'สมชาย ใจดี'],
            ['id' => 2, 'name' => 'สมหญิง รักดี']
        ]);

        Cache::shouldReceive('remember')
            ->once()
            ->with('available_users', Mockery::any(), Mockery::type('Closure'))
            ->andReturn($mockUsers);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getAvailableUsers');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller);
        
        $this->assertEquals($mockUsers, $result);
    }

    /**
     * Test filterScoresForExport helper method
     */
    public function test_filterScoresForExport_filters_scores_correctly()
    {
        $rawScores = collect([
            ['id' => 1, 'name' => 'User 1', 'average' => 4.5],
            ['id' => 2, 'name' => 'User 2', 'average' => 0],
            ['id' => 3, 'name' => 'User 3', 'average' => 3.2],
            ['id' => 4, 'name' => 'User 4', 'average' => 0]
        ]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('filterScoresForExport');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller, $rawScores);
        
        $this->assertCount(2, $result);
        $this->assertEquals(4.5, $result[0]['average']);
        $this->assertEquals(3.2, $result[1]['average']);
    }

    /**
     * Test getDefaultSummaryStats helper method
     */
    public function test_getDefaultSummaryStats_returns_default_structure()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getDefaultSummaryStats');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller);
        
        $expectedKeys = [
            'total_evaluatees', 'total_completed', 'total_remaining',
            'completion_rate', 'score_distribution', 'avg_scores_by_group',
            'overall_avg_score', 'highest_score', 'lowest_score'
        ];
        
        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $result);
        }
        
        $this->assertEquals(0, $result['total_evaluatees']);
        $this->assertEquals(0, $result['completion_rate']);
        $this->assertIsArray($result['score_distribution']);
        $this->assertIsArray($result['avg_scores_by_group']);
    }

    /**
     * Test fetchCompleteRawScores with caching
     */
    public function test_fetchCompleteRawScores_uses_cache()
    {
        $mockScores = collect([
            ['id' => 1, 'name' => 'User 1', 'average' => 4.5]
        ]);

        Cache::shouldReceive('remember')
            ->once()
            ->with('evaluation_scores_2025__', Mockery::any(), Mockery::type('Closure'))
            ->andReturn($mockScores);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('fetchCompleteRawScores');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller, 2025, null, null);
        
        $this->assertEquals($mockScores, $result);
    }

    /**
     * Test calculateSummaryStats with error handling
     */
    public function test_calculateSummaryStats_handles_errors_gracefully()
    {
        // Mock collection that will throw exception
        $mockCollection = Mockery::mock();
        $mockCollection->shouldReceive('sum')
            ->with('total')
            ->andThrow(new \Exception('Database error'));

        Log::shouldReceive('error')
            ->once()
            ->with(Mockery::type('string'));

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('calculateSummaryStats');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller, $mockCollection, collect());
        
        // Should return default stats when error occurs
        $this->assertEquals(0, $result['total_evaluatees']);
        $this->assertEquals(0, $result['completion_rate']);
    }

    /**
     * Test calculateSummaryStats with valid data
     */
    public function test_calculateSummaryStats_calculates_correctly()
    {
        $evaluateeCountByGrade = collect([
            (object)['total' => 10, 'completed' => 8, 'remaining' => 2],
            (object)['total' => 15, 'completed' => 12, 'remaining' => 3]
        ]);

        $rawScores = collect([
            ['rating' => 5, 'average' => 4.8, 'grade' => 10, 'user_type' => 'internal'],
            ['rating' => 4, 'average' => 4.2, 'grade' => 9, 'user_type' => 'internal'],
            ['rating' => 3, 'average' => 3.5, 'grade' => 8, 'user_type' => 'internal'],
            ['rating' => 5, 'average' => 4.6, 'grade' => 11, 'user_type' => 'external']
        ]);

        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('calculateSummaryStats');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->controller, $evaluateeCountByGrade, $rawScores);
        
        $this->assertEquals(25, $result['total_evaluatees']);
        $this->assertEquals(20, $result['total_completed']);
        $this->assertEquals(5, $result['total_remaining']);
        $this->assertEquals(80.0, $result['completion_rate']);
        
        $this->assertEquals(2, $result['score_distribution']['excellent']);
        $this->assertEquals(1, $result['score_distribution']['very_good']);
        $this->assertEquals(1, $result['score_distribution']['good']);
        
        $this->assertGreaterThan(0, $result['overall_avg_score']);
        $this->assertEquals(4.8, $result['highest_score']);
        $this->assertEquals(3.5, $result['lowest_score']);
    }

    /**
     * Test index method validation
     */
    public function test_index_validates_request_parameters()
    {
        $request = Request::create('/admin/evaluation-report', 'GET', [
            'fiscal_year' => 'invalid',
            'division' => 999,
            'grade' => 25,
            'user_id' => 999
        ]);

        $this->expectException(ValidationException::class);
        
        $this->controller->index($request);
    }

    /**
     * Test exportIndividual validation
     */
    public function test_exportIndividual_validates_request_parameters()
    {
        $request = Request::create('/admin/evaluation-report/export', 'POST', [
            'fiscal_year' => 'invalid'
        ]);

        $this->expectException(ValidationException::class);
        
        $this->controller->exportIndividual($request);
    }

    /**
     * Test exportIndividual returns error for empty data
     */
    public function test_exportIndividual_returns_error_for_empty_data()
    {
        // Mock fetchEnhancedRawScores to return empty collection
        $controller = Mockery::mock(AdminEvaluationReportController::class)->makePartial();
        $controller->shouldReceive('fetchEnhancedRawScores')
            ->once()
            ->andReturn(collect());

        $request = Request::create('/admin/evaluation-report/export', 'POST', [
            'fiscal_year' => 2025
        ]);

        $response = $controller->exportIndividual($request);
        
        $this->assertEquals(404, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('ไม่พบข้อมูลการประเมิน', $data['error']);
    }

    /**
     * Test exportIndividual handles general exceptions
     */
    public function test_exportIndividual_handles_general_exceptions()
    {
        // Mock to throw exception
        $controller = Mockery::mock(AdminEvaluationReportController::class)->makePartial();
        $controller->shouldReceive('fetchEnhancedRawScores')
            ->once()
            ->andThrow(new \Exception('Database connection error'));

        Log::shouldReceive('error')
            ->once()
            ->with(Mockery::type('string'));

        $request = Request::create('/admin/evaluation-report/export', 'POST', [
            'fiscal_year' => 2025
        ]);

        $response = $controller->exportIndividual($request);
        
        $this->assertEquals(500, $response->getStatusCode());
        $data = json_decode($response->getContent(), true);
        $this->assertEquals('เกิดข้อผิดพลาดในการส่งออกข้อมูล', $data['error']);
    }
}