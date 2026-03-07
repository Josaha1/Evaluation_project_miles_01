<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Controllers\AdminEvaluationReportController;
use App\Services\ScoreCalculationService;
use App\Services\WeightedScoringService;
use App\Services\EvaluationExportService;
use App\Services\EvaluationPdfExportService;
use Mockery;
use Carbon\Carbon;

class AdminEvaluationReportControllerTest extends TestCase
{
    protected $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $scoreCalc = new ScoreCalculationService();
        $weightedScoring = new WeightedScoringService();
        $exportService = new EvaluationExportService();
        $pdfExportService = new EvaluationPdfExportService($weightedScoring, $scoreCalc);
        $this->controller = new AdminEvaluationReportController(
            $scoreCalc,
            $weightedScoring,
            $exportService,
            $pdfExportService
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * Test translateAngle returns correct Thai translations
     */
    public function test_translateAngle_returns_correct_translations()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('translateAngle');
        $method->setAccessible(true);

        $this->assertEquals('ประเมินตนเอง', $method->invoke($this->controller, 'self'));
        $this->assertEquals('ผู้บังคับบัญชา', $method->invoke($this->controller, 'top'));
        $this->assertEquals('ผู้ใต้บังคับบัญชา', $method->invoke($this->controller, 'bottom'));
        $this->assertEquals('เพื่อนร่วมงาน (ซ้าย)', $method->invoke($this->controller, 'left'));
        $this->assertEquals('เพื่อนร่วมงาน (ขวา)', $method->invoke($this->controller, 'right'));
        // Unknown angle returns itself
        $this->assertEquals('unknown', $method->invoke($this->controller, 'unknown'));
    }

    /**
     * Test convertToBuddhistEra returns correct Buddhist Era year
     */
    public function test_convertToBuddhistEra_returns_correct_year()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('convertToBuddhistEra');
        $method->setAccessible(true);

        $this->assertEquals(2568, $method->invoke($this->controller, 2025));
        $this->assertEquals(2569, $method->invoke($this->controller, 2026));
        $this->assertEquals('', $method->invoke($this->controller, null));
        $this->assertEquals('', $method->invoke($this->controller, ''));
    }

    /**
     * Test getCompletedAnglesCount counts non-zero angles
     */
    public function test_getCompletedAnglesCount_counts_correctly()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getCompletedAnglesCount');
        $method->setAccessible(true);

        // All angles completed
        $allCompleted = ['self' => 4.0, 'top' => 3.5, 'bottom' => 4.0, 'left' => 3.0, 'right' => 4.5];
        $this->assertEquals(5, $method->invoke($this->controller, $allCompleted));

        // Only 3 angles completed (grade 5-8 pattern)
        $partial = ['self' => 4.0, 'top' => 3.5, 'bottom' => 0, 'left' => 3.0, 'right' => 0];
        $this->assertEquals(3, $method->invoke($this->controller, $partial));

        // No angles completed
        $none = ['self' => 0, 'top' => 0, 'bottom' => 0, 'left' => 0, 'right' => 0];
        $this->assertEquals(0, $method->invoke($this->controller, $none));

        // Missing keys treated as 0
        $missing = ['self' => 4.0];
        $this->assertEquals(1, $method->invoke($this->controller, $missing));
    }

    /**
     * Test getProgressStatus returns correct status strings
     */
    public function test_getProgressStatus_returns_correct_status()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('getProgressStatus');
        $method->setAccessible(true);

        // No assignments
        $this->assertEquals('no_assignments', $method->invoke($this->controller, 0.0, 0, 0));

        // All completed
        $this->assertEquals('completed', $method->invoke($this->controller, 100.0, 5, 5));

        // Nearly complete (>= 75%)
        $this->assertEquals('nearly_complete', $method->invoke($this->controller, 80.0, 4, 5));

        // In progress (> 0%)
        $this->assertEquals('in_progress', $method->invoke($this->controller, 50.0, 2, 5));

        // Not started (0%)
        $this->assertEquals('not_started', $method->invoke($this->controller, 0.0, 0, 5));
    }

    /**
     * Test translateQuestionType returns correct Thai translations
     */
    public function test_translateQuestionType_returns_correct_translations()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('translateQuestionType');
        $method->setAccessible(true);

        $this->assertEquals('คะแนน', $method->invoke($this->controller, 'rating'));
        $this->assertEquals('เลือกตอบ', $method->invoke($this->controller, 'choice'));
        $this->assertEquals('เลือกหลายคำตอบ', $method->invoke($this->controller, 'multiple_choice'));
        $this->assertEquals('ข้อความ', $method->invoke($this->controller, 'open_text'));
        // Unknown type returns itself
        $this->assertEquals('unknown_type', $method->invoke($this->controller, 'unknown_type'));
    }

    /**
     * Test validateRequest validates parameters correctly
     */
    public function test_validateRequest_accepts_valid_params()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('validateRequest');
        $method->setAccessible(true);

        $request = \Illuminate\Http\Request::create('/admin/evaluation-report', 'GET', [
            'fiscal_year' => 2025,
        ]);

        $result = $method->invoke($this->controller, $request);
        $this->assertEquals(2025, $result['fiscal_year']);
    }

    /**
     * Test validateRequest rejects invalid fiscal_year
     */
    public function test_validateRequest_rejects_invalid_fiscal_year()
    {
        $reflection = new \ReflectionClass($this->controller);
        $method = $reflection->getMethod('validateRequest');
        $method->setAccessible(true);

        $request = \Illuminate\Http\Request::create('/admin/evaluation-report', 'GET', [
            'fiscal_year' => 'invalid',
        ]);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $method->invoke($this->controller, $request);
    }

    /**
     * Test controller constructor properly injects dependencies
     */
    public function test_constructor_injects_all_services()
    {
        $reflection = new \ReflectionClass($this->controller);

        $properties = ['scoreCalculationService', 'weightedScoringService', 'evaluationExportService', 'evaluationPdfExportService'];

        foreach ($properties as $propName) {
            $prop = $reflection->getProperty($propName);
            $prop->setAccessible(true);
            $this->assertNotNull($prop->getValue($this->controller), "Property {$propName} should be initialized");
        }
    }
}
