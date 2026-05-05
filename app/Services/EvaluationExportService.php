<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\Part;
use App\Models\Question;
use App\Models\Option;
use App\Models\User;
use App\Services\EvaluationLookupService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class EvaluationExportService
{
    /**
     * Ensure enough memory and time for large exports.
     */
    private function boostLimits(): void
    {
        ini_set('memory_limit', '1G');
        set_time_limit(300);
    }
    /**
     * Export comprehensive evaluation report for internal executives (levels 9-12) and employees (levels 5-8)
     */
    public function exportComprehensiveEvaluationReport(array $filters = []): string
    {
        try {
            $this->boostLimits();
            $spreadsheet = new Spreadsheet();
            
            // Create sheets for different evaluation types
            $this->createExecutiveEvaluationSheet($spreadsheet, $filters);
            $this->createEmployeeEvaluationSheet($spreadsheet, $filters);
            $this->createGovernorEvaluationSheet($spreadsheet, $filters);
            $this->createExternalOrgSummarySheet($spreadsheet, $filters);
            $this->createSummarySheet($spreadsheet, $filters);
            $this->createQuestionMappingSheet($spreadsheet);
            
            $filename = 'รายงานการประเมิน_360_องศา_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($filePath);
            
            return $filePath;
        } catch (\Exception $e) {
            Log::error('Export comprehensive evaluation report error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create executive evaluation sheet (levels 9-12)
     */
    private function createExecutiveEvaluationSheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('ผู้บริหาร 9-12');

        $fy = !empty($filters['fiscal_year']) ? (int) $filters['fiscal_year'] : null;
        $evaluation = EvaluationLookupService::findByGrade(9, 'internal', $fy);
        if ($evaluation) {
            $this->buildPivotSheet($sheet, $evaluation->id, $filters, 'รายงานการประเมิน 360 องศา สำหรับผู้บริหารระดับ 9-12');
        }
    }

    /**
     * Create employee evaluation sheet (levels 4-8)
     */
    private function createEmployeeEvaluationSheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('พนักงาน 4-8');

        $fy = !empty($filters['fiscal_year']) ? (int) $filters['fiscal_year'] : null;
        $evaluation = EvaluationLookupService::findByGrade(5, 'internal', $fy);
        if ($evaluation) {
            $this->buildPivotSheet($sheet, $evaluation->id, $filters, 'รายงานการประเมิน 360 องศา สำหรับพนักงานระดับ 4-8');
        }
    }

    /**
     * Create governor evaluation sheet (level 13)
     */
    private function createGovernorEvaluationSheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $fy = !empty($filters['fiscal_year']) ? (int) $filters['fiscal_year'] : null;
        $governorEval = EvaluationLookupService::findByGrade(13, 'internal', $fy);
        if (!$governorEval) return;

        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('ผู้ว่าการ 13');

        $this->buildPivotSheet($sheet, $governorEval->id, $filters, 'รายงานการประเมิน 360 องศา สำหรับผู้ว่าการ กนอ.');

        $this->applySheetStyling($governorSheet, count($evaluationData) + 10);
    }

    /**
     * Create summary sheet
     */
    private function createSummarySheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $summarySheet = $spreadsheet->createSheet();
        $summarySheet->setTitle('สรุปภาพรวม');

        // Dynamic lookup for summary sheet — respect fiscal_year filter
        $fy = !empty($filters['fiscal_year']) ? (int) $filters['fiscal_year'] : null;
        $execEval = EvaluationLookupService::findByGrade(10, 'internal', $fy);
        $empEval  = EvaluationLookupService::findByGrade(6,  'internal', $fy);
        $govEval  = EvaluationLookupService::findByGrade(13, 'internal', $fy);
        $executiveData = $execEval ? $this->getEvaluationData($execEval->id, [9, 10, 11, 12], $filters) : [];
        $employeeData = $empEval ? $this->getEvaluationData($empEval->id, [5, 6, 7, 8], $filters) : [];
        $governorData = $govEval ? $this->getEvaluationData($govEval->id, [13], $filters) : [];

        $this->createSummaryContent($summarySheet, $executiveData, $employeeData, $governorData);
        $this->applySheetStyling($summarySheet, 30);
    }

    /**
     * Create question mapping sheet
     */
    private function createQuestionMappingSheet(Spreadsheet $spreadsheet): void
    {
        $mappingSheet = $spreadsheet->createSheet();
        $mappingSheet->setTitle('รายการคำถามและตัวเลือก');
        
        $questionData = $this->getQuestionMappingData();
        $this->populateQuestionMapping($mappingSheet, $questionData);
        
        $this->applySheetStyling($mappingSheet, count($questionData) + 10);
    }

    /**
     * Get completed evaluator IDs for a given fiscal year
     */
    private function getCompletedEvaluatorIds(string $fiscalYear): array
    {
        // Batch load all assignments for this fiscal year
        $allAssignments = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->get(['evaluator_id', 'evaluation_id', 'evaluatee_id']);

        if ($allAssignments->isEmpty()) {
            return [];
        }

        // Batch load question counts per evaluation_id (1 query instead of N)
        $evaluationIds = $allAssignments->pluck('evaluation_id')->unique();
        $questionCounts = DB::table('questions as q')
            ->join('parts as p', 'q.part_id', '=', 'p.id')
            ->whereIn('p.evaluation_id', $evaluationIds)
            ->groupBy('p.evaluation_id')
            ->pluck(DB::raw('COUNT(*)'), 'p.evaluation_id')
            ->toArray();

        // Batch load answer counts per evaluator (1 query instead of N)
        $answerCounts = DB::table('answers as a')
            ->join('evaluation_assignments as ea', function($join) {
                $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                     ->on('a.user_id', '=', 'ea.evaluator_id')
                     ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
            })
            ->where('ea.fiscal_year', $fiscalYear)
            ->groupBy('ea.evaluator_id')
            ->pluck(DB::raw('COUNT(*)'), 'ea.evaluator_id')
            ->toArray();

        // Calculate in-memory
        $grouped = $allAssignments->groupBy('evaluator_id');
        $completedEvaluatorIds = [];

        foreach ($grouped as $evaluatorId => $assignments) {
            $totalRequiredQuestions = 0;
            foreach ($assignments as $assignment) {
                $totalRequiredQuestions += $questionCounts[$assignment->evaluation_id] ?? 0;
            }

            $actualAnswersCount = $answerCounts[$evaluatorId] ?? 0;

            if ($actualAnswersCount >= $totalRequiredQuestions && $totalRequiredQuestions > 0) {
                $completedEvaluatorIds[] = $evaluatorId;
            }
        }

        return $completedEvaluatorIds;
    }

    /**
     * Get evaluation data with answers and option mapping
     */
    private function getEvaluationData(int $evaluationId, array $grades, array $filters = []): array
    {
        try {
           

            $query = DB::table('answers as a')
                ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
                ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                ->join('questions as q', 'a.question_id', '=', 'q.id')
                ->join('options as o', 'a.value', '=', 'o.id')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
                ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->leftJoin('sub_aspects as sub_asp', 'q.sub_aspect_id', '=', 'sub_asp.id')
                ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
                ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
                ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
                ->where('a.evaluation_id', $evaluationId)
                ->whereIn('evaluatee.grade', $grades)
                ->select([
                    'evaluatee.id as evaluatee_id',
                    'evaluatee.emid as evaluatee_emid',
                    'evaluatee.fname as evaluatee_fname',
                    'evaluatee.lname as evaluatee_lname',
                    'evaluatee.grade as evaluatee_grade',
                    'div.name as evaluatee_division',
                    'dept.name as evaluatee_department',
                    'pos.title as evaluatee_position',
                    'evaluator.emid as evaluator_emid',
                    'evaluator.fname as evaluator_fname',
                    'evaluator.lname as evaluator_lname',
                    'ea.angle as evaluation_angle',
                    'ea.fiscal_year',
                    'q.id as question_id',
                    'q.title as question_title',
                    'q.type as question_type',
                    'p.title as part_title',
                    'p.order as part_order',
                    'asp.name as aspect_name',
                    'sub_asp.name as sub_aspect_name',
                    'o.id as option_id',
                    'o.label as option_label',
                    'o.score as option_score',
                    'a.other_text',
                    'a.created_at as answer_date'
                ]);

            // Apply filters
            if (!empty($filters['fiscal_year'])) {
                // Filter by fiscal year - check both answer date and evaluation creation year
                $query->where(function($q) use ($filters) {
                    $q->whereYear('a.created_at', $filters['fiscal_year'])
                      ->orWhereExists(function($subq) use ($filters) {
                          $subq->select(DB::raw(1))
                               ->from('evaluations as eval')
                               ->whereColumn('eval.id', 'a.evaluation_id')
                               ->whereYear('eval.created_at', $filters['fiscal_year']);
                      });
                });
            }
            
            if (!empty($filters['division_id'])) {
                $query->where('evaluatee.division_id', $filters['division_id']);
            }

            if (!empty($filters['user_id'])) {
                $query->where('evaluatee.id', $filters['user_id']);
            }

            if (!empty($filters['angle'])) {
                $query->where('ea.angle', $filters['angle']);
            }

            if (!empty($filters['department_id'])) {
                $query->where('evaluatee.department_id', $filters['department_id']);
            }

            if (!empty($filters['position_id'])) {
                $query->where('evaluatee.position_id', $filters['position_id']);
            }

            if (!empty($filters['grade'])) {
                $query->where('evaluatee.grade', $filters['grade']);
            }

            if (!empty($filters['only_completed']) && $filters['only_completed'] === 'true') {
                $fiscalYear = $filters['fiscal_year'] ?? date('Y');
                $completedEvaluatorIds = $this->getCompletedEvaluatorIds($fiscalYear);
                if (!empty($completedEvaluatorIds)) {
                    $query->whereIn('evaluator.id', $completedEvaluatorIds);
                } else {
                    return [];
                }
            }

            $results = $query->orderBy('evaluatee.id')
                            ->orderBy('p.order')
                            ->orderBy('q.id')
                            ->get();

            // Debug: Log query results
           
            if ($results->isNotEmpty()) {
                $partInfo = $results->groupBy('part_id')->map(function($items, $partId) {
                    $first = $items->first();
                    return [
                        'part_id' => $partId,
                        'part_order' => $first->part_order ?? 'N/A',
                        'part_title' => $first->part_title ?? 'N/A',
                        'evaluation_id' => $first->evaluation_id ?? 'N/A',
                        'question_count' => $items->count()
                    ];
                });
               
            }
            
            if ($results->isEmpty()) {
                Log::warning('No self-evaluation data found for parts 10,11,12,63,64,65');
                return [];
            }

            return $this->processEvaluationResults($results);
            
        } catch (\Exception $e) {
            Log::error('Error getting evaluation data: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Process evaluation results into structured format
     */
    private function processEvaluationResults(Collection $results): array
    {
        $processedData = [];
        
        foreach ($results as $result) {
            $evaluateeKey = $result->evaluatee_id;
            
            if (!isset($processedData[$evaluateeKey])) {
                $processedData[$evaluateeKey] = [
                    'evaluatee_id' => $result->evaluatee_id,
                    'evaluatee_emid' => $result->evaluatee_emid ?? '',
                    'evaluatee_name' => trim($result->evaluatee_fname . ' ' . $result->evaluatee_lname),
                    'evaluatee_grade' => $result->evaluatee_grade,
                    'evaluatee_division' => $result->evaluatee_division ?? 'ไม่ระบุ',
                    'evaluatee_department' => $result->evaluatee_department ?? 'ไม่ระบุ',
                    'evaluatee_position' => $result->evaluatee_position ?? 'ไม่ระบุ',
                    'evaluations' => []
                ];
            }
            
            $evaluationKey = $result->evaluator_emid . '_' . $result->evaluation_angle . '_' . $result->question_id;
            
            $processedData[$evaluateeKey]['evaluations'][$evaluationKey] = [
                'evaluator_emid' => $result->evaluator_emid ?? '',
                'evaluator_name' => trim($result->evaluator_fname . ' ' . $result->evaluator_lname),
                'angle' => $result->evaluation_angle,
                'question_id' => $result->question_id,
                'question_title' => $result->question_title,
                'question_type' => $result->question_type,
                'part_title' => $result->part_title,
                'part_order' => $result->part_order,
                'aspect_name' => $result->aspect_name,
                'sub_aspect_name' => $result->sub_aspect_name,
                'option_id' => $result->option_id,
                'option_label' => $result->option_label,
                'option_score' => $result->option_score,
                'other_text' => $result->other_text,
                'answer_date' => $result->answer_date,
                'fiscal_year' => $result->fiscal_year
            ];
        }
        
        return array_values($processedData);
    }

    /**
     * Setup sheet headers
     */
    private function setupSheetHeaders($sheet, string $title): void
    {
        // Main title
        $sheet->setCellValue('A1', $title);
        $sheet->mergeCells('A1:R1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Report generation info
        $sheet->setCellValue('A2', 'วันที่สร้างรายงาน: ' . now()->format('d/m/Y H:i:s'));
        $sheet->mergeCells('A2:R2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        // Column headers
        $headers = [
            'A5' => 'ลำดับ',
            'B5' => 'รหัสพนักงานผู้ถูกประเมิน',
            'C5' => 'ชื่อผู้ถูกประเมิน',
            'D5' => 'ระดับ',
            'E5' => 'หน่วยงาน',
            'F5' => 'แผนก',
            'G5' => 'ตำแหน่ง',
            'H5' => 'รหัสพันักงานผู้ประเมิน',
            'I5' => 'ชื่อผู้ประเมิน',
            'J5' => 'มุมการประเมิน',
            'K5' => 'ส่วนที่',
            'L5' => 'หมวดหมู่',
            'M5' => 'คำถาม',
            'N5' => 'คำตอบ',
            'O5' => 'คะแนน',
            'P5' => 'ข้อความเพิ่มเติม',
            'Q5' => 'วันที่ตอบ',
            'R5' => 'ปีงบประมาณ'
        ];
        
        foreach ($headers as $cell => $header) {
            $sheet->setCellValue($cell, $header);
        }
        
        // Style headers
        $headerRange = 'A5:R5';
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFill()
              ->setFillType(Fill::FILL_SOLID)
              ->getStartColor()->setRGB('4F46E5');
        $sheet->getStyle($headerRange)->getFont()->getColor()->setRGB('FFFFFF');
        $sheet->getStyle($headerRange)->getBorders()->getAllBorders()
              ->setBorderStyle(Border::BORDER_THIN);
    }

    /**
     * Populate evaluation data
     */
    private function populateEvaluationData($sheet, array $evaluationData, int $startRow): void
    {
        $row = $startRow;
        $counter = 1;
        
        foreach ($evaluationData as $evaluatee) {
            foreach ($evaluatee['evaluations'] as $evaluation) {
                $sheet->setCellValue('A' . $row, $counter);
                $sheet->setCellValue('B' . $row, $evaluatee['evaluatee_emid']);
                $sheet->setCellValue('C' . $row, $evaluatee['evaluatee_name']);
                $sheet->setCellValue('D' . $row, $evaluatee['evaluatee_grade']);
                $sheet->setCellValue('E' . $row, $evaluatee['evaluatee_division']);
                $sheet->setCellValue('F' . $row, $evaluatee['evaluatee_department']);
                $sheet->setCellValue('G' . $row, $evaluatee['evaluatee_position']);
                $sheet->setCellValue('H' . $row, $evaluation['evaluator_emid']);
                $sheet->setCellValue('I' . $row, $evaluation['evaluator_name']);
                $sheet->setCellValue('J' . $row, $this->translateAngle($evaluation['angle']));
                $sheet->setCellValue('K' . $row, $evaluation['part_title']);
                $sheet->setCellValue('L' . $row, $evaluation['aspect_name']);
                $sheet->setCellValue('M' . $row, $evaluation['question_title']);
                $sheet->setCellValue('N' . $row, $evaluation['option_label']);
                $sheet->setCellValue('O' . $row, $evaluation['option_score']);
                $sheet->setCellValue('P' . $row, $evaluation['other_text']);
                $sheet->setCellValue('Q' . $row, $evaluation['answer_date'] ? 
                    date('d/m/Y H:i', strtotime($evaluation['answer_date'])) : '');
                $sheet->setCellValue('R' . $row, $this->convertToBuddhistEra($evaluation['fiscal_year']));
                
                $row++;
                $counter++;
            }
        }
    }

    /**
     * Create summary content
     */
    private function createSummaryContent($sheet, array $executiveData, array $employeeData, array $governorData = []): void
    {
        $sheet->setCellValue('A1', 'สรุปภาพรวมการประเมิน 360 องศา');
        $sheet->mergeCells('A1:D1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $row = 3;

        // Governor summary
        $governorStats = $this->calculateSummaryStats($governorData);
        if ($governorStats['total_evaluatees'] > 0) {
            $sheet->setCellValue('A' . $row, 'สรุปผู้ว่าการ กนอ. ระดับ 13');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);
            $row++;
            $sheet->setCellValue('A' . $row, 'จำนวนผู้ถูกประเมิน:');
            $sheet->setCellValue('B' . $row, $governorStats['total_evaluatees']);
            $row++;
            $sheet->setCellValue('A' . $row, 'คะแนนเฉลี่ยรวม:');
            $sheet->setCellValue('B' . $row, number_format($governorStats['average_score'], 2));
            $row++;
            $sheet->setCellValue('A' . $row, 'จำนวนคำตอบทั้งหมด:');
            $sheet->setCellValue('B' . $row, $governorStats['total_answers']);
            $row += 2;
        }

        // Executive summary
        $sheet->setCellValue('A' . $row, 'สรุปผู้บริหารระดับ 9-12');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $executiveStats = $this->calculateSummaryStats($executiveData);
        $sheet->setCellValue('A' . $row, 'จำนวนผู้ถูกประเมิน:');
        $sheet->setCellValue('B' . $row, $executiveStats['total_evaluatees']);
        $row++;

        $sheet->setCellValue('A' . $row, 'คะแนนเฉลี่ยรวม:');
        $sheet->setCellValue('B' . $row, number_format($executiveStats['average_score'], 2));
        $row++;

        $sheet->setCellValue('A' . $row, 'จำนวนคำตอบทั้งหมด:');
        $sheet->setCellValue('B' . $row, $executiveStats['total_answers']);
        $row += 2;

        // Employee summary
        $sheet->setCellValue('A' . $row, 'สรุปพนักงานระดับ 4-8');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $employeeStats = $this->calculateSummaryStats($employeeData);
        $sheet->setCellValue('A' . $row, 'จำนวนผู้ถูกประเมิน:');
        $sheet->setCellValue('B' . $row, $employeeStats['total_evaluatees']);
        $row++;

        $sheet->setCellValue('A' . $row, 'คะแนนเฉลี่ยรวม:');
        $sheet->setCellValue('B' . $row, number_format($employeeStats['average_score'], 2));
        $row++;

        $sheet->setCellValue('A' . $row, 'จำนวนคำตอบทั้งหมด:');
        $sheet->setCellValue('B' . $row, $employeeStats['total_answers']);
        $row += 2;

        // Overall summary
        $sheet->setCellValue('A' . $row, 'สรุปรวมทั้งระบบ');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $totalEvaluatees = $governorStats['total_evaluatees'] + $executiveStats['total_evaluatees'] + $employeeStats['total_evaluatees'];
        $totalAnswers = $governorStats['total_answers'] + $executiveStats['total_answers'] + $employeeStats['total_answers'];
        $scoreCount = ($governorStats['total_evaluatees'] > 0 ? 1 : 0) + ($executiveStats['total_evaluatees'] > 0 ? 1 : 0) + ($employeeStats['total_evaluatees'] > 0 ? 1 : 0);
        $overallAverage = $scoreCount > 0 ? ($governorStats['average_score'] + $executiveStats['average_score'] + $employeeStats['average_score']) / $scoreCount : 0;
        
        $sheet->setCellValue('A' . $row, 'จำนวนผู้ถูกประเมินรวม:');
        $sheet->setCellValue('B' . $row, $totalEvaluatees);
        $row++;
        
        $sheet->setCellValue('A' . $row, 'คะแนนเฉลี่ยรวมทั้งระบบ:');
        $sheet->setCellValue('B' . $row, number_format($overallAverage, 2));
        $row++;
        
        $sheet->setCellValue('A' . $row, 'จำนวนคำตอบรวมทั้งระบบ:');
        $sheet->setCellValue('B' . $row, $totalAnswers);
    }

    /**
     * Get question mapping data
     */
    private function getQuestionMappingData(): array
    {
        return DB::table('questions as q')
            ->join('options as o', 'q.id', '=', 'o.question_id')
            ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
            ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
            ->select([
                'q.id as question_id',
                'q.title as question_title',
                'q.type as question_type',
                'p.title as part_title',
                'asp.name as aspect_name',
                'o.id as option_id',
                'o.label as option_label',
                'o.score as option_score'
            ])
            ->orderBy('q.id')
            ->orderBy('o.score', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Populate question mapping
     */
    private function populateQuestionMapping($sheet, array $questionData): void
    {
        $sheet->setCellValue('A1', 'รายการคำถามและตัวเลือกคำตอบ');
        $sheet->mergeCells('A1:E1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        
        // Headers
        $headers = [
            'A3' => 'ส่วนของแบบประเมีน',
            'B3' => 'หมวดหมู่',
            'C3' => 'คำถาม',
            'D3' => 'ตัวเลือกคำตอบ',
            'E3' => 'คะแนน'
        ];
        
        foreach ($headers as $cell => $header) {
            $sheet->setCellValue($cell, $header);
        }
        
        $sheet->getStyle('A3:E3')->getFont()->setBold(true);
        $sheet->getStyle('A3:E3')->getFill()
              ->setFillType(Fill::FILL_SOLID)
              ->getStartColor()->setRGB('E2E8F0');
        
        $row = 4;
        foreach ($questionData as $item) {
            $sheet->setCellValue('A' . $row, $item->part_title);
            $sheet->setCellValue('B' . $row, $item->aspect_name);
            $sheet->setCellValue('C' . $row, $item->question_title);
            $sheet->setCellValue('D' . $row, $item->option_label);
            $sheet->setCellValue('E' . $row, $item->option_score);
            $row++;
        }
    }

    /**
     * Apply sheet styling
     */
    private function applySheetStyling($sheet, int $maxRows): void
    {
        // Auto-size columns
        foreach (range('A', 'R') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        // Add borders to data range
        if ($maxRows > 5) {
            $range = 'A5:R' . $maxRows;
            $sheet->getStyle($range)->getBorders()->getAllBorders()
                  ->setBorderStyle(Border::BORDER_THIN);
        }
        
        // Set row height for header
        $sheet->getRowDimension(5)->setRowHeight(25);
        
        // Set column widths for better readability
        $sheet->getColumnDimension('B')->setWidth(15); // รหัสพนักงานผู้ถูกประเมิน
        $sheet->getColumnDimension('C')->setWidth(25); // ชื่อผู้ถูกประเมิน
        $sheet->getColumnDimension('H')->setWidth(15); // รหัสพนักงานผู้ประเมิน
        $sheet->getColumnDimension('I')->setWidth(25); // ชื่อผู้ประเมิน
        $sheet->getColumnDimension('M')->setWidth(50); // คำถาม
        $sheet->getColumnDimension('N')->setWidth(15); // คำตอบ
        $sheet->getColumnDimension('P')->setWidth(30); // ข้อความเพิ่มเติม
    }

    /**
     * Calculate summary statistics
     */
    private function calculateSummaryStats(array $evaluationData): array
    {
        $totalEvaluatees = count($evaluationData);
        $totalAnswers = 0;
        $totalScore = 0;
        $scoreCount = 0;
        
        foreach ($evaluationData as $evaluatee) {
            foreach ($evaluatee['evaluations'] as $evaluation) {
                $totalAnswers++;
                if (is_numeric($evaluation['option_score'])) {
                    $totalScore += $evaluation['option_score'];
                    $scoreCount++;
                }
            }
        }
        
        return [
            'total_evaluatees' => $totalEvaluatees,
            'total_answers' => $totalAnswers,
            'average_score' => $scoreCount > 0 ? $totalScore / $scoreCount : 0
        ];
    }

    /**
     * Translate evaluation angle to Thai
     */
    private function translateAngle(string $angle): string
    {
        $translations = [
            'self' => 'ตนเอง',
            'top' => 'บน',
            'bottom' => 'ล่าง',
            'left' => 'ซ้าย',
            'right' => 'ขวา',
        ];

        return $translations[$angle] ?? $angle;
    }

    /**
     * Translate question type to Thai
     */
    private function translateQuestionType(string $type): string
    {
        $translations = [
            'rating' => 'คะแนน',
            'choice' => 'เลือกตอบ',
            'multiple_choice' => 'เลือกหลายคำตอบ',
            'open_text' => 'ข้อความ'
        ];
        
        return $translations[$type] ?? $type;
    }

    /**
     * Convert Christian Era year to Buddhist Era year
     */
    private function convertToBuddhistEra($year): string
    {
        if (empty($year) || !is_numeric($year)) {
            return '';
        }
        
        return (int)$year + 543;
    }

    /**
     * Create external org summary sheet for comprehensive export
     */
    private function createExternalOrgSummarySheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('องค์กรภายนอก (องศาขวา)');

        $fiscalYear = $filters['fiscal_year'] ?? date('Y');

        // Header
        $sheet->setCellValue('A1', 'รายงานคะแนนองค์กรภายนอก (องศาขวา)');
        $sheet->mergeCells('A1:G1');
        $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
        $sheet->setCellValue('A2', 'ปีงบประมาณ: พ.ศ. ' . ($fiscalYear + 543));
        $sheet->mergeCells('A2:G2');

        // Column headers
        $headers = ['A4' => 'องค์กร', 'B4' => 'รหัส', 'C4' => 'ผู้ถูกประเมิน', 'D4' => 'ระดับ', 'E4' => 'จำนวนคำตอบ', 'F4' => 'คะแนนเฉลี่ย', 'G4' => 'วันที่ประเมิน'];
        foreach ($headers as $cell => $header) {
            $sheet->setCellValue($cell, $header);
        }
        $sheet->getStyle('A4:G4')->getFont()->setBold(true);
        $sheet->getStyle('A4:G4')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('7C3AED');
        $sheet->getStyle('A4:G4')->getFont()->getColor()->setRGB('FFFFFF');

        // Data: group by org + evaluatee
        $results = DB::table('answers as a')
            ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
            ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
            ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
            ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
            ->where('eac.fiscal_year', $fiscalYear)
            ->whereNotNull('a.external_access_code_id')
            ->groupBy('eo.id', 'eo.name', 'eo.org_code', 'evaluatee.id', 'evaluatee.fname', 'evaluatee.lname', 'evaluatee.grade')
            ->select([
                'eo.name as org_name',
                DB::raw("COALESCE(eo.org_code, '') as org_code"),
                DB::raw("CONCAT(evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"),
                'evaluatee.grade',
                DB::raw('COUNT(a.id) as answer_count'),
                DB::raw('ROUND(AVG(CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[0-9]+(\\\\.?[0-9]*)$" THEN CAST(a.value AS DECIMAL(5,2)) ELSE NULL END), 2) as avg_score'),
                DB::raw('MAX(a.created_at) as last_answer'),
            ])
            ->orderBy('eo.name')
            ->orderBy('evaluatee.fname')
            ->get();

        $row = 5;
        foreach ($results as $r) {
            $sheet->setCellValue('A' . $row, $r->org_name);
            $sheet->setCellValue('B' . $row, $r->org_code);
            $sheet->setCellValue('C' . $row, $r->evaluatee_name);
            $sheet->setCellValue('D' . $row, $r->grade);
            $sheet->setCellValue('E' . $row, $r->answer_count);
            $sheet->setCellValue('F' . $row, $r->avg_score);
            $sheet->setCellValue('G' . $row, $r->last_answer ? date('d/m/Y', strtotime($r->last_answer)) : '-');
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Alternating row colors
        for ($i = 5; $i < $row; $i++) {
            if ($i % 2 === 0) {
                $sheet->getStyle("A{$i}:G{$i}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F5F3FF');
            }
        }
    }

    /**
     * Export external organization evaluation report
     */
    public function exportExternalOrgReport(array $filters = []): string
    {
        try {
            $this->boostLimits();
            $spreadsheet = new Spreadsheet();

            $fiscalYear = (int) ($filters['fiscal_year'] ?? date('Y'));

            // Find which evaluations have external org answers — typically the executive 9-12 external form
            $evaluationIds = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->where('eac.fiscal_year', $fiscalYear)
                ->whereNotNull('a.external_access_code_id')
                ->distinct()
                ->pluck('a.evaluation_id')
                ->toArray();

            if (empty($evaluationIds)) {
                // No data — write a stub sheet
                $sheet = $spreadsheet->getActiveSheet();
                $sheet->setTitle('องค์กรภายนอก');
                $sheet->setCellValue('A1', 'รายงานการประเมินองค์กรภายนอก (องศาขวา)');
                $sheet->mergeCells('A1:I1');
                $sheet->setCellValue('A2', 'ปีงบประมาณ พ.ศ. ' . ($fiscalYear + 543) . ' — ไม่มีข้อมูล');
            } else {
                $first = true;
                foreach ($evaluationIds as $evalId) {
                    $eval = Evaluation::find($evalId);
                    $sheet = $first ? $spreadsheet->getActiveSheet() : $spreadsheet->createSheet();
                    $first = false;
                    $title = $eval ? mb_substr($eval->title, 0, 28) : 'Eval ' . $evalId;
                    $sheet->setTitle($title);
                    $this->buildPivotSheet(
                        $sheet,
                        $evalId,
                        $filters,
                        'รายงานการประเมินองค์กรภายนอก (องศาขวา) — ' . ($eval ? $eval->title : "Evaluation {$evalId}"),
                        false,  // selfEvalOnly
                        true    // externalOrgMode
                    );
                }
            }

            $filename = 'รายงาน_องค์กรภายนอก_พศ' . ($fiscalYear + 543) . '_' . now()->format('Ymd_His') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            if (!file_exists(dirname($filePath))) mkdir(dirname($filePath), 0755, true);
            (new Xlsx($spreadsheet))->save($filePath);
            return $filePath;
        } catch (\Exception $e) {
            Log::error('Export external org report error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * @deprecated Old long-format implementation kept for reference
     */
    private function exportExternalOrgReportLegacy(array $filters = []): string
    {
        try {
            $this->boostLimits();
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('องค์กรภายนอก');

            $fiscalYear = $filters['fiscal_year'] ?? date('Y');

            $results = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
                ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
                ->join('questions as q', 'a.question_id', '=', 'q.id')
                ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
                ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
                ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
                ->where('eac.fiscal_year', $fiscalYear)
                ->whereNotNull('a.external_access_code_id')
                ->when(!empty($filters['external_org_id']), function ($q) use ($filters) {
                    $q->where('eo.id', $filters['external_org_id']);
                })
                ->select([
                    'eo.name as org_name',
                    DB::raw("COALESCE(eo.org_code, '') as org_code"),
                    'evaluatee.emid as evaluatee_emid',
                    'evaluatee.fname as evaluatee_fname',
                    'evaluatee.lname as evaluatee_lname',
                    'evaluatee.grade as evaluatee_grade',
                    'div.name as evaluatee_division',
                    'pos.title as evaluatee_position',
                    'eac.code as access_code',
                    'p.title as part_title',
                    'asp.name as aspect_name',
                    'q.title as question_title',
                    'o.label as option_label',
                    'o.score as option_score',
                    'a.other_text',
                    'a.created_at as answer_date',
                ])
                ->orderBy('eo.name')
                ->orderBy('evaluatee.id')
                ->orderBy('q.id')
                ->get();

            // Title
            $sheet->setCellValue('A1', 'รายงานการประเมินองค์กรภายนอก (องศาขวา)');
            $sheet->mergeCells('A1:L1');
            $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->setCellValue('A2', 'ปีงบประมาณ: ' . ($fiscalYear + 543) . ' | วันที่สร้าง: ' . now()->format('d/m/Y H:i'));
            $sheet->mergeCells('A2:L2');

            // Headers
            $headers = [
                'A4' => 'ลำดับ', 'B4' => 'องค์กร', 'C4' => 'รหัสองค์กร',
                'D4' => 'ผู้ถูกประเมิน', 'E4' => 'ระดับ', 'F4' => 'หน่วยงาน',
                'G4' => 'ส่วนที่', 'H4' => 'หมวดหมู่', 'I4' => 'คำถาม',
                'J4' => 'คำตอบ', 'K4' => 'คะแนน', 'L4' => 'วันที่ตอบ',
            ];
            foreach ($headers as $cell => $header) {
                $sheet->setCellValue($cell, $header);
            }
            $sheet->getStyle('A4:L4')->getFont()->setBold(true);
            $sheet->getStyle('A4:L4')->getFill()
                  ->setFillType(Fill::FILL_SOLID)
                  ->getStartColor()->setRGB('7C3AED');
            $sheet->getStyle('A4:L4')->getFont()->getColor()->setRGB('FFFFFF');

            // Data
            $row = 5;
            $counter = 1;
            foreach ($results as $r) {
                $sheet->setCellValue('A' . $row, $counter);
                $sheet->setCellValue('B' . $row, $r->org_name);
                $sheet->setCellValue('C' . $row, $r->org_code);
                $sheet->setCellValue('D' . $row, trim($r->evaluatee_fname . ' ' . $r->evaluatee_lname));
                $sheet->setCellValue('E' . $row, $r->evaluatee_grade);
                $sheet->setCellValue('F' . $row, $r->evaluatee_division ?? '-');
                $sheet->setCellValue('G' . $row, $r->part_title ?? '-');
                $sheet->setCellValue('H' . $row, $r->aspect_name ?? '-');
                $sheet->setCellValue('I' . $row, $r->question_title);
                $sheet->setCellValue('J' . $row, $r->option_label ?? $r->other_text ?? '-');
                $sheet->setCellValue('K' . $row, $r->option_score);
                $sheet->setCellValue('L' . $row, $r->answer_date ? date('d/m/Y', strtotime($r->answer_date)) : '-');
                $row++;
                $counter++;
            }

            // Summary sheet
            $summarySheet = $spreadsheet->createSheet();
            $summarySheet->setTitle('สรุปตามองค์กร');
            $summarySheet->setCellValue('A1', 'สรุปคะแนนองค์กรภายนอกแยกตามองค์กร');
            $summarySheet->mergeCells('A1:E1');
            $summarySheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);

            $orgHeaders = ['A3' => 'องค์กร', 'B3' => 'รหัส', 'C3' => 'จำนวนคำตอบ', 'D3' => 'คะแนนเฉลี่ย', 'E3' => 'จำนวนผู้ถูกประเมิน'];
            foreach ($orgHeaders as $cell => $header) {
                $summarySheet->setCellValue($cell, $header);
            }
            $summarySheet->getStyle('A3:E3')->getFont()->setBold(true);
            $summarySheet->getStyle('A3:E3')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E2E8F0');

            $orgSummary = DB::table('answers as a')
                ->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
                ->leftJoin('options as o', 'a.value', '=', DB::raw('CAST(o.id AS CHAR)'))
                ->where('eac.fiscal_year', $fiscalYear)
                ->whereNotNull('a.external_access_code_id')
                ->when(!empty($filters['external_org_id']), function ($q) use ($filters) {
                    $q->where('eo.id', $filters['external_org_id']);
                })
                ->groupBy('eo.id', 'eo.name', 'eo.org_code')
                ->select([
                    'eo.name as org_name',
                    DB::raw("COALESCE(eo.org_code, '') as org_code"),
                    DB::raw('COUNT(DISTINCT a.id) as total_responses'),
                    DB::raw('ROUND(AVG(CASE WHEN o.score IS NOT NULL THEN o.score WHEN a.value REGEXP "^[0-9]+(\\\\.?[0-9]*)$" THEN CAST(a.value AS DECIMAL(5,2)) ELSE NULL END), 2) as avg_score'),
                    DB::raw('COUNT(DISTINCT a.evaluatee_id) as evaluatee_count'),
                ])
                ->orderBy('eo.name')
                ->get();

            $sRow = 4;
            foreach ($orgSummary as $org) {
                $summarySheet->setCellValue('A' . $sRow, $org->org_name);
                $summarySheet->setCellValue('B' . $sRow, $org->org_code);
                $summarySheet->setCellValue('C' . $sRow, $org->total_responses);
                $summarySheet->setCellValue('D' . $sRow, $org->avg_score);
                $summarySheet->setCellValue('E' . $sRow, $org->evaluatee_count);
                $sRow++;
            }

            foreach (range('A', 'L') as $col) { $sheet->getColumnDimension($col)->setAutoSize(true); }
            foreach (range('A', 'E') as $col) { $summarySheet->getColumnDimension($col)->setAutoSize(true); }

            $filename = 'รายงานองค์กรภายนอก_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);

            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save($filePath);

            return $filePath;
        } catch (\Exception $e) {
            Log::error('Export external org report error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Export specific evaluation type — pivot format (questions as columns)
     */
    public function exportByEvaluationType(int $evaluationId, array $filters = []): string
    {
        try {
            $this->boostLimits();
            $evaluation = Evaluation::findOrFail($evaluationId);

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('รายงานการประเมิน');

            // Use shared pivot helper
            $this->buildPivotSheet($sheet, $evaluationId, $filters);

            // Question title sheet
            $questions = DB::table('questions as q')
                ->join('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->join('parts as p', 'asp.part_id', '=', 'p.id')
                ->where('p.evaluation_id', $evaluationId)
                ->where('q.type', 'rating')
                ->orderBy('p.order')->orderBy('asp.id')->orderBy('q.order')
                ->select('q.id', 'q.title', 'asp.name as aspect')
                ->get();

            $qSheet = $spreadsheet->createSheet();
            $qSheet->setTitle('รายการคำถาม');
            $qSheet->setCellValue('A1', 'ข้อที่');
            $qSheet->setCellValue('B1', 'หมวดหมู่');
            $qSheet->setCellValue('C1', 'คำถาม');
            $qSheet->getStyle('A1:C1')->getFont()->setBold(true);
            foreach ($questions as $i => $q) {
                $qSheet->setCellValue('A' . ($i + 2), 'ข้อ ' . ($i + 1));
                $qSheet->setCellValue('B' . ($i + 2), $q->aspect);
                $qSheet->setCellValue('C' . ($i + 2), $q->title);
            }
            $qSheet->getColumnDimension('A')->setAutoSize(true);
            $qSheet->getColumnDimension('B')->setAutoSize(true);
            $qSheet->getColumnDimension('C')->setWidth(60);

            $filename = 'รายงานการประเมิน_' . $evaluation->id . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);

            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save($filePath);

            return $filePath;
        } catch (\Exception $e) {
            Log::error('Export by evaluation type error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * OLD exportByEvaluationType (replaced by buildPivotSheet) - kept for reference
     * @deprecated
     */
    private function _oldExportByEvaluationType(int $evaluationId, array $filters = []): string
    {
        try {
            $evaluation = Evaluation::findOrFail($evaluationId);
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('รายงานการประเมิน');

            // 1. Get ordered questions for this evaluation
            $questions = DB::table('questions as q')
                ->join('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->join('parts as p', 'asp.part_id', '=', 'p.id')
                ->where('p.evaluation_id', $evaluationId)
                ->where('q.type', 'rating')
                ->orderBy('p.order')->orderBy('asp.id')->orderBy('q.order')
                ->select('q.id', 'q.title', 'asp.name as aspect', 'p.title as part')
                ->get();

            $questionIds = $questions->pluck('id')->toArray();
            $questionIndex = array_flip($questionIds); // q_id => col_index

            // 2. Build query: answers grouped by evaluator + evaluatee pair
            $query = DB::table('answers as a')
                ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
                ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                ->join('evaluation_assignments as ea', function ($j) {
                    $j->on('a.evaluation_id', '=', 'ea.evaluation_id')
                      ->on('a.user_id', '=', 'ea.evaluator_id')
                      ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->leftJoin('options as o', 'a.value', '=', 'o.id')
                ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
                ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
                ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
                ->where('a.evaluation_id', $evaluationId)
                ->whereIn('a.question_id', $questionIds)
                ->select([
                    'evaluatee.emid as evaluatee_emid',
                    DB::raw("CONCAT(evaluatee.prename, evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"),
                    'evaluatee.grade as evaluatee_grade',
                    'div.name as division', 'dept.name as department', 'pos.title as position',
                    'evaluator.emid as evaluator_emid',
                    DB::raw("CONCAT(evaluator.prename, evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
                    'ea.angle',
                    'a.question_id',
                    DB::raw('COALESCE(o.score, CAST(a.value AS UNSIGNED)) as score'),
                ]);

            // Apply filters
            if (!empty($filters['fiscal_year'])) {
                $query->where('a.fiscal_year', $filters['fiscal_year']);
            }
            if (!empty($filters['division_id'])) $query->where('evaluatee.division_id', $filters['division_id']);
            if (!empty($filters['user_id'])) $query->where('evaluatee.id', $filters['user_id']);
            if (!empty($filters['angle'])) $query->where('ea.angle', $filters['angle']);
            if (!empty($filters['department_id'])) $query->where('evaluatee.department_id', $filters['department_id']);
            if (!empty($filters['position_id'])) $query->where('evaluatee.position_id', $filters['position_id']);
            if (!empty($filters['grade'])) $query->where('evaluatee.grade', $filters['grade']);

            $results = $query->orderBy('evaluatee.fname')->orderBy('evaluator.fname')->get();

            // 3. Pivot: group by evaluator+evaluatee pair
            $rows = [];
            foreach ($results as $r) {
                $key = $r->evaluator_emid . '|' . $r->evaluatee_emid . '|' . $r->angle;
                if (!isset($rows[$key])) {
                    $rows[$key] = [
                        'evaluatee_emid' => $r->evaluatee_emid,
                        'evaluatee_name' => $r->evaluatee_name,
                        'evaluatee_grade' => $r->evaluatee_grade,
                        'division' => $r->division ?? '',
                        'department' => $r->department ?? '',
                        'position' => $r->position ?? '',
                        'evaluator_emid' => $r->evaluator_emid,
                        'evaluator_name' => $r->evaluator_name,
                        'angle' => $r->angle,
                        'scores' => array_fill(0, count($questionIds), ''),
                    ];
                }
                $qIdx = $questionIndex[$r->question_id] ?? null;
                if ($qIdx !== null) {
                    $rows[$key]['scores'][$qIdx] = $r->score;
                }
            }

            // 4. Write to spreadsheet
            // Title
            $sheet->setCellValue('A1', 'รายงานการประเมิน: ' . $evaluation->title);
            $sheet->mergeCells('A1:I1');
            $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
            $sheet->setCellValue('A2', 'วันที่สร้าง: ' . now()->format('d/m/Y H:i') . ' | จำนวน ' . count($rows) . ' รายการ');
            $sheet->mergeCells('A2:I2');

            // Build column layout: each aspect has its questions + 1 avg column
            // Map: column_index => ['type' => 'q'|'avg', 'q_index' => int, 'aspect' => string, 'q_indices' => [..]]
            $colLayout = [];
            $col = 10; // J onwards
            $currentCol = $col;
            $aspectQIndices = []; // aspect_name => [list of q_indices]
            $aspectAvgCol = []; // aspect_name => column letter for avg

            // First pass: group questions by aspect
            foreach ($questions as $i => $q) {
                $aspectQIndices[$q->aspect][] = $i;
            }

            // Second pass: assign columns - questions then avg per aspect
            $aspectRanges = []; // aspect => ['start' => letter, 'end' => letter]
            foreach ($aspectQIndices as $aspectName => $qIndices) {
                $startCol = $currentCol;
                foreach ($qIndices as $qIdx) {
                    $colLayout[$currentCol] = ['type' => 'q', 'q_index' => $qIdx];
                    $currentCol++;
                }
                // Avg column for this aspect
                $colLayout[$currentCol] = ['type' => 'avg', 'aspect' => $aspectName, 'q_indices' => $qIndices];
                $aspectAvgCol[$aspectName] = $currentCol;
                $endCol = $currentCol;
                $currentCol++;

                $aspectRanges[$aspectName] = [
                    'start' => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startCol),
                    'end' => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($endCol),
                ];
            }
            $lastDataCol = $currentCol - 1;

            // Aspect header row (row 4)
            foreach ($aspectRanges as $aspectName => $range) {
                $sheet->setCellValue($range['start'] . '4', $aspectName);
                if ($range['start'] !== $range['end']) {
                    $sheet->mergeCells($range['start'] . '4:' . $range['end'] . '4');
                }
                $style = $sheet->getStyle($range['start'] . '4');
                $style->getFont()->setBold(true)->setSize(9);
                $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E8E0FF');
                $style->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                    ->setVertical(Alignment::VERTICAL_CENTER)
                    ->setWrapText(true);
            }
            $sheet->getRowDimension(4)->setRowHeight(40);

            // Column headers (row 5)
            $fixedHeaders = ['A5'=>'ลำดับ','B5'=>'รหัสผู้ถูกประเมิน','C5'=>'ชื่อผู้ถูกประเมิน','D5'=>'ระดับ','E5'=>'สายงาน','F5'=>'ฝ่าย','G5'=>'ตำแหน่ง','H5'=>'ผู้ประเมิน','I5'=>'องศาการประเมิน'];
            foreach ($fixedHeaders as $cell => $h) $sheet->setCellValue($cell, $h);
            $sheet->getColumnDimension('I')->setWidth(20);

            // Question + avg headers
            $qCounter = 1;
            foreach ($colLayout as $colIdx => $info) {
                $c = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
                if ($info['type'] === 'q') {
                    $sheet->setCellValue($c . '5', 'ข้อ ' . ($info['q_index'] + 1));
                    $sheet->getComment($c . '5')->getText()->createTextRun($questions[$info['q_index']]->title);
                    $sheet->getColumnDimension($c)->setWidth(6);
                    $qCounter++;
                } else {
                    $sheet->setCellValue($c . '5', 'เฉลี่ย');
                    $sheet->getColumnDimension($c)->setWidth(8);
                    // Highlight avg columns
                    $sheet->getStyle($c . '5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FBBF24');
                }
            }

            // Style headers (row 5)
            $lastColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($lastDataCol);
            $sheet->getStyle("A5:{$lastColLetter}5")->getFont()->setBold(true)->setSize(9);
            $sheet->getStyle("A5:I5")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
            $sheet->getStyle("A5:I5")->getFont()->getColor()->setRGB('FFFFFF');
            // Question columns: violet
            foreach ($colLayout as $colIdx => $info) {
                if ($info['type'] === 'q') {
                    $c = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
                    $sheet->getStyle($c . '5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
                    $sheet->getStyle($c . '5')->getFont()->getColor()->setRGB('FFFFFF');
                }
            }
            $sheet->getStyle("A5:{$lastColLetter}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Data rows
            $rowNum = 6;
            $counter = 1;
            foreach ($rows as $r) {
                $sheet->setCellValue('A' . $rowNum, $counter);
                $sheet->setCellValue('B' . $rowNum, $r['evaluatee_emid']);
                $sheet->setCellValue('C' . $rowNum, $r['evaluatee_name']);
                $sheet->setCellValue('D' . $rowNum, $r['evaluatee_grade']);
                $sheet->setCellValue('E' . $rowNum, $r['division']);
                $sheet->setCellValue('F' . $rowNum, $r['department']);
                $sheet->setCellValue('G' . $rowNum, $r['position']);
                $sheet->setCellValue('H' . $rowNum, $r['evaluator_name']);
                $sheet->setCellValue('I' . $rowNum, $this->translateAngle($r['angle']));

                foreach ($colLayout as $colIdx => $info) {
                    $c = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
                    if ($info['type'] === 'q') {
                        $score = $r['scores'][$info['q_index']] ?? '';
                        if ($score !== '') {
                            $sheet->setCellValue($c . $rowNum, $score);
                        }
                    } else {
                        // Aspect average
                        $sum = 0; $cnt = 0;
                        foreach ($info['q_indices'] as $qi) {
                            $s = $r['scores'][$qi] ?? '';
                            if ($s !== '') { $sum += $s; $cnt++; }
                        }
                        if ($cnt > 0) {
                            $sheet->setCellValue($c . $rowNum, round($sum / $cnt, 2));
                            $sheet->getStyle($c . $rowNum)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FEF3C7');
                            $sheet->getStyle($c . $rowNum)->getFont()->setBold(true);
                        }
                    }
                }

                $rowNum++;
                $counter++;
            }

            // Auto-width for fixed columns
            foreach (['A','B','C','D','E','F','G','H','I'] as $c) {
                $sheet->getColumnDimension($c)->setAutoSize(true);
            }

            // Question title sheet
            $qSheet = $spreadsheet->createSheet();
            $qSheet->setTitle('รายการคำถาม');
            $qSheet->setCellValue('A1', 'ข้อที่');
            $qSheet->setCellValue('B1', 'หมวดหมู่');
            $qSheet->setCellValue('C1', 'คำถาม');
            $qSheet->getStyle('A1:C1')->getFont()->setBold(true);
            foreach ($questions as $i => $q) {
                $qSheet->setCellValue('A' . ($i + 2), 'ข้อ ' . ($i + 1));
                $qSheet->setCellValue('B' . ($i + 2), $q->aspect);
                $qSheet->setCellValue('C' . ($i + 2), $q->title);
            }
            $qSheet->getColumnDimension('A')->setAutoSize(true);
            $qSheet->getColumnDimension('B')->setAutoSize(true);
            $qSheet->getColumnDimension('C')->setWidth(60);
            
            $filename = 'รายงานการประเมิน_' . $evaluation->id . '_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($filePath);
            
            return $filePath;
        } catch (\Exception $e) {
            Log::error('Export by evaluation type error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Build a pivot sheet for an evaluation — questions as columns, per-aspect averages.
     * Reusable across all export types.
     *
     * @param \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet
     * @param int $evaluationId
     * @param array $filters
     * @param string|null $customTitle
     * @param bool $selfEvalOnly  If true, only include self-evaluations (user_id = evaluatee_id)
     */
    private function buildPivotSheet($sheet, int $evaluationId, array $filters = [], ?string $customTitle = null, bool $selfEvalOnly = false, bool $externalOrgMode = false): void
    {
        $evaluation = Evaluation::find($evaluationId);
        if (!$evaluation) return;

        // 1. Get ordered questions
        //    rating         → numeric score (1-5)
        //    choice         → option score (0/1 for quiz) or option label fallback
        //    multiple_choice → comma-joined option labels (survey-style)
        $questions = DB::table('questions as q')
            ->join('aspects as asp', 'q.aspect_id', '=', 'asp.id')
            ->join('parts as p', 'asp.part_id', '=', 'p.id')
            ->where('p.evaluation_id', $evaluationId)
            ->whereIn('q.type', ['rating', 'choice', 'multiple_choice'])
            ->orderBy('p.order')->orderBy('asp.id')->orderBy('q.order')
            ->select('q.id', 'q.title', 'q.type', 'asp.name as aspect', 'p.title as part')
            ->get();

        if ($questions->isEmpty()) return;

        $questionIds = $questions->pluck('id')->toArray();
        $questionIndex = array_flip($questionIds);
        $questionTypeMap = $questions->pluck('type', 'id')->toArray();

        // Per-part display number (reset at each part boundary) so columns read "ข้อ 1..N" inside each part,
        // matching the form layout instead of a global continuous count.
        $questionDisplayNum = [];
        $currentPart = null;
        $partCounter = 0;
        foreach ($questions as $i => $q) {
            if ($q->part !== $currentPart) {
                $currentPart = $q->part;
                $partCounter = 0;
            }
            $partCounter++;
            $questionDisplayNum[$i] = $partCounter;
        }

        // Preload all options keyed by id → label (for multi_choice label resolution)
        $optionLabelMap = DB::table('options')
            ->whereIn('question_id', $questionIds)
            ->pluck('label', 'id')
            ->toArray();

        // 2. Build query — different join for self / external / regular
        $query = DB::table('answers as a')
            ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
            ->join('questions as q', 'a.question_id', '=', 'q.id')
            ->leftJoin('options as o', 'a.value', '=', 'o.id')
            ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
            ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
            ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
            ->where('a.evaluation_id', $evaluationId)
            ->whereIn('a.question_id', $questionIds);

        if ($externalOrgMode) {
            // External org: join via external_access_codes → external_organizations + session
            // Each SESSION = 1 evaluator submission (multiple people from same org → multiple sessions)
            // Use session.id as unique evaluator key so they don't collapse
            $query->join('external_access_codes as eac', 'a.external_access_code_id', '=', 'eac.id')
                  ->join('external_organizations as eo', 'eac.external_organization_id', '=', 'eo.id')
                  ->leftJoin('external_evaluation_sessions as ses', 'a.external_session_id', '=', 'ses.id')
                  ->whereNotNull('a.external_access_code_id');
            $query->addSelect([
                DB::raw("'right' as angle"),
                // Use session id as unique key — each session = separate row in pivot
                DB::raw("CONCAT('SESS-', COALESCE(ses.id, 0)) as evaluator_emid"),
                // Show person's name + org in parentheses
                DB::raw("CONCAT(COALESCE(ses.evaluator_name, '(ไม่ระบุชื่อ)'), ' [', eo.name, ']') as evaluator_name"),
            ]);
            if (!empty($filters['external_org_id'])) $query->where('eo.id', $filters['external_org_id']);
        } elseif ($selfEvalOnly) {
            $query->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                  ->whereColumn('a.user_id', 'a.evaluatee_id');
            $query->addSelect(DB::raw("'self' as angle"));
            $query->addSelect([
                'evaluator.emid as evaluator_emid',
                DB::raw("CONCAT(evaluator.prename, evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
            ]);
        } else {
            $query->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                  ->join('evaluation_assignments as ea', function ($j) {
                      $j->on('a.evaluation_id', '=', 'ea.evaluation_id')
                        ->on('a.user_id', '=', 'ea.evaluator_id')
                        ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                  });
            $query->addSelect('ea.angle');
            $query->addSelect([
                'evaluator.emid as evaluator_emid',
                DB::raw("CONCAT(evaluator.prename, evaluator.fname, ' ', evaluator.lname) as evaluator_name"),
            ]);
        }

        $query->addSelect([
            'evaluatee.emid as evaluatee_emid',
            DB::raw("CONCAT(evaluatee.prename, evaluatee.fname, ' ', evaluatee.lname) as evaluatee_name"),
            'evaluatee.grade as evaluatee_grade',
            'div.name as division', 'dept.name as department', 'pos.title as position',
            'a.question_id',
            'q.type as question_type',
            'a.value as raw_value',
            DB::raw("CASE WHEN q.type = 'rating' THEN COALESCE(o.score, CAST(a.value AS UNSIGNED)) WHEN q.type = 'choice' THEN o.score ELSE NULL END as score"),
        ]);

        // Apply filters
        if (!empty($filters['fiscal_year'])) $query->where('a.fiscal_year', $filters['fiscal_year']);
        if (!empty($filters['division_id'])) $query->where('evaluatee.division_id', $filters['division_id']);
        if (!empty($filters['user_id'])) $query->where('evaluatee.id', $filters['user_id']);
        if (!empty($filters['department_id'])) $query->where('evaluatee.department_id', $filters['department_id']);
        if (!empty($filters['position_id'])) $query->where('evaluatee.position_id', $filters['position_id']);
        if (!empty($filters['grade'])) $query->where('evaluatee.grade', $filters['grade']);
        if (!$selfEvalOnly && !$externalOrgMode && !empty($filters['angle'])) $query->where('ea.angle', $filters['angle']);

        if ($externalOrgMode) {
            $results = $query->orderBy('eo.name')->orderBy('evaluatee.fname')->get();
        } else {
            $results = $query->orderBy('evaluatee.fname')->orderBy('evaluator.fname')->get();
        }

        // 3. Pivot: group by evaluator+evaluatee+angle
        $rows = [];
        foreach ($results as $r) {
            $key = $r->evaluator_emid . '|' . $r->evaluatee_emid . '|' . $r->angle;
            if (!isset($rows[$key])) {
                $rows[$key] = [
                    'evaluatee_emid' => $r->evaluatee_emid,
                    'evaluatee_name' => $r->evaluatee_name,
                    'evaluatee_grade' => $r->evaluatee_grade,
                    'division' => $r->division ?? '',
                    'department' => $r->department ?? '',
                    'position' => $r->position ?? '',
                    'evaluator_emid' => $r->evaluator_emid,
                    'evaluator_name' => $r->evaluator_name,
                    'angle' => $r->angle,
                    'scores' => array_fill(0, count($questionIds), ''),
                ];
            }
            $qIdx = $questionIndex[$r->question_id] ?? null;
            if ($qIdx !== null) {
                $qType = $questionTypeMap[$r->question_id] ?? 'rating';
                if ($qType === 'multiple_choice') {
                    // a.value may be JSON array of option IDs, e.g. "[1,2,3]"
                    // OR mixed array with objects, e.g. [1, {"option_id":2,"other_text":"..."}]
                    $raw = is_string($r->raw_value ?? null) ? $r->raw_value : '';
                    $ids = json_decode($raw, true);
                    if (!is_array($ids)) {
                        $clean = trim($raw, '[]"');
                        $ids = $clean !== '' ? array_map('trim', explode(',', $clean)) : [];
                    }
                    // Dedupe per option_id — legacy data has keystroke-by-keystroke duplicates for "อื่นๆ",
                    // each saved as a separate entry with progressively longer other_text. Keep longest.
                    $chosen = []; // option_id => ['other_text' => string, 'order' => int]
                    $order = 0;
                    foreach ($ids as $id) {
                        if ($id === null || $id === '') continue;
                        $optId = null;
                        $otherText = '';
                        if (is_array($id)) {
                            $optId = $id['option_id'] ?? null;
                            $otherText = is_string($id['other_text'] ?? null) ? $id['other_text'] : '';
                        } elseif (is_scalar($id)) {
                            $optId = $id;
                        }
                        if ($optId === null || $optId === '') continue;
                        $optId = (int) $optId;
                        if (!isset($chosen[$optId])) {
                            $chosen[$optId] = ['other_text' => $otherText, 'order' => $order++];
                        } else {
                            // Keep the longest other_text (final keystroke version)
                            if (mb_strlen($otherText) > mb_strlen($chosen[$optId]['other_text'])) {
                                $chosen[$optId]['other_text'] = $otherText;
                            }
                        }
                    }
                    // Preserve original selection order
                    uasort($chosen, fn($a, $b) => $a['order'] <=> $b['order']);
                    $labels = [];
                    foreach ($chosen as $optId => $info) {
                        $label = $optionLabelMap[$optId] ?? (string) $optId;
                        if ($info['other_text'] !== '') {
                            $label .= ' (' . $info['other_text'] . ')';
                        }
                        $labels[] = $label;
                    }
                    $rows[$key]['scores'][$qIdx] = implode(', ', $labels);
                } else {
                    $rows[$key]['scores'][$qIdx] = $r->score;
                }
            }
        }

        // 4. Write header
        $title = $customTitle ?? ('รายงานการประเมิน: ' . $evaluation->title);
        $sheet->setCellValue('A1', $title);
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setSize(14)->setBold(true);
        $sheet->setCellValue('A2', 'วันที่สร้าง: ' . now()->format('d/m/Y H:i') . ' | จำนวน ' . count($rows) . ' รายการ');
        $sheet->mergeCells('A2:I2');

        // Build column layout: questions + per-aspect avg
        $colLayout = [];
        $currentCol = 10;
        $aspectQIndices = [];
        foreach ($questions as $i => $q) {
            $aspectQIndices[$q->aspect][] = $i;
        }
        $aspectRanges = [];
        foreach ($aspectQIndices as $aspectName => $qIndices) {
            $startCol = $currentCol;
            foreach ($qIndices as $qIdx) {
                $colLayout[$currentCol++] = ['type' => 'q', 'q_index' => $qIdx];
            }
            $colLayout[$currentCol] = ['type' => 'avg', 'aspect' => $aspectName, 'q_indices' => $qIndices];
            $endCol = $currentCol++;
            $aspectRanges[$aspectName] = [
                'start' => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($startCol),
                'end' => \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($endCol),
            ];
        }
        $lastDataCol = $currentCol - 1;

        // Aspect headers (row 4)
        foreach ($aspectRanges as $aspectName => $range) {
            $sheet->setCellValue($range['start'] . '4', $aspectName);
            if ($range['start'] !== $range['end']) {
                $sheet->mergeCells($range['start'] . '4:' . $range['end'] . '4');
            }
            $style = $sheet->getStyle($range['start'] . '4');
            $style->getFont()->setBold(true)->setSize(9);
            $style->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E8E0FF');
            $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER)->setWrapText(true);
        }
        $sheet->getRowDimension(4)->setRowHeight(40);

        // Fixed headers (row 5)
        $evaluatorHeader = $externalOrgMode ? 'องค์กรภายนอก' : 'ผู้ประเมิน';
        $fixedHeaders = ['A5'=>'ลำดับ','B5'=>'รหัสผู้ถูกประเมิน','C5'=>'ชื่อผู้ถูกประเมิน','D5'=>'ระดับ','E5'=>'สายงาน','F5'=>'ฝ่าย','G5'=>'ตำแหน่ง','H5'=>$evaluatorHeader,'I5'=>'องศาการประเมิน'];
        foreach ($fixedHeaders as $cell => $h) $sheet->setCellValue($cell, $h);
        $sheet->getColumnDimension('I')->setWidth(15);

        // Question + avg headers
        foreach ($colLayout as $colIdx => $info) {
            $c = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
            if ($info['type'] === 'q') {
                $q = $questions[$info['q_index']];
                $displayNum = $questionDisplayNum[$info['q_index']] ?? ($info['q_index'] + 1);
                $sheet->setCellValue($c . '5', 'ข้อ ' . $displayNum);
                $sheet->getComment($c . '5')->getText()->createTextRun($q->title);
                // Multi-choice columns hold comma-joined labels, so make them wider + wrap
                $sheet->getColumnDimension($c)->setWidth($q->type === 'multiple_choice' ? 40 : 6);
            } else {
                $sheet->setCellValue($c . '5', 'เฉลี่ย');
                $sheet->getColumnDimension($c)->setWidth(8);
            }
        }

        // Header styling
        $lastColLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($lastDataCol);
        $sheet->getStyle("A5:{$lastColLetter}5")->getFont()->setBold(true)->setSize(9);
        $sheet->getStyle("A5:I5")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
        $sheet->getStyle("A5:I5")->getFont()->getColor()->setRGB('FFFFFF');
        foreach ($colLayout as $colIdx => $info) {
            $c = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
            if ($info['type'] === 'q') {
                $sheet->getStyle($c . '5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
                $sheet->getStyle($c . '5')->getFont()->getColor()->setRGB('FFFFFF');
            } else {
                $sheet->getStyle($c . '5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FBBF24');
            }
        }
        $sheet->getStyle("A5:{$lastColLetter}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Data rows
        $rowNum = 6;
        $counter = 1;
        foreach ($rows as $r) {
            $sheet->setCellValue('A' . $rowNum, $counter);
            $sheet->setCellValue('B' . $rowNum, $r['evaluatee_emid']);
            $sheet->setCellValue('C' . $rowNum, $r['evaluatee_name']);
            $sheet->setCellValue('D' . $rowNum, $r['evaluatee_grade']);
            $sheet->setCellValue('E' . $rowNum, $r['division']);
            $sheet->setCellValue('F' . $rowNum, $r['department']);
            $sheet->setCellValue('G' . $rowNum, $r['position']);
            $sheet->setCellValue('H' . $rowNum, $r['evaluator_name']);
            $sheet->setCellValue('I' . $rowNum, $this->translateAngle($r['angle']));

            foreach ($colLayout as $colIdx => $info) {
                $c = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
                if ($info['type'] === 'q') {
                    $score = $r['scores'][$info['q_index']] ?? '';
                    if ($score !== '' && $score !== null) {
                        $sheet->setCellValueExplicit(
                            $c . $rowNum,
                            $score,
                            is_numeric($score)
                                ? \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC
                                : \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING
                        );
                        // Wrap text for multi_choice cells (long labels)
                        if (!is_numeric($score)) {
                            $sheet->getStyle($c . $rowNum)->getAlignment()->setWrapText(true);
                        }
                    }
                } else {
                    // Average only numeric values (skip text from multi_choice)
                    $sum = 0; $cnt = 0;
                    foreach ($info['q_indices'] as $qi) {
                        $s = $r['scores'][$qi] ?? '';
                        if ($s !== '' && $s !== null && is_numeric($s)) { $sum += (float) $s; $cnt++; }
                    }
                    if ($cnt > 0) {
                        $sheet->setCellValue($c . $rowNum, round($sum / $cnt, 2));
                        $sheet->getStyle($c . $rowNum)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FEF3C7');
                        $sheet->getStyle($c . $rowNum)->getFont()->setBold(true);
                    }
                }
            }
            $rowNum++;
            $counter++;
        }

        // Auto-width fixed columns
        foreach (['A','B','C','D','E','F','G','H'] as $c) {
            $sheet->getColumnDimension($c)->setAutoSize(true);
        }
    }

    /**
     * Get grade range for specific evaluation
     */
    private function getGradeRangeForEvaluation(int $evaluationId): array
    {
        $evaluation = Evaluation::find($evaluationId);
        if (!$evaluation) {
            return [];
        }
        
        return range($evaluation->grade_min, $evaluation->grade_max);
    }

    /**
     * Export self-evaluation report
     */
    public function exportSelfEvaluationReport(array $filters = []): string
    {
        try {
            $this->boostLimits();
            $spreadsheet = new Spreadsheet();

            // Find all self-evaluation forms (by title)
            $selfEvals = Evaluation::where('title', 'like', '%ประเมินตนเอง%')
                ->where('status', 'published')
                ->get();

            if (!empty($filters['fiscal_year'])) {
                $selfEvals = $selfEvals->filter(function ($e) use ($filters) {
                    return $e->fiscal_year == $filters['fiscal_year'] || is_null($e->fiscal_year);
                });
            }

            $first = true;
            foreach ($selfEvals as $eval) {
                if ($first) {
                    $sheet = $spreadsheet->getActiveSheet();
                    $first = false;
                } else {
                    $sheet = $spreadsheet->createSheet();
                }
                // Sheet name max 31 chars
                $shortTitle = mb_substr($eval->title, 0, 28);
                $sheet->setTitle($shortTitle);

                $this->buildPivotSheet($sheet, $eval->id, $filters, 'รายงานการประเมินตนเอง: ' . $eval->title, true);
            }

            if ($first) {
                // No sheets created - add empty
                $sheet = $spreadsheet->getActiveSheet();
                $sheet->setTitle('การประเมินตนเอง');
                $sheet->setCellValue('A1', 'ไม่พบข้อมูลการประเมินตนเอง');
            }
            
            $filename = 'รายงานการประเมินตนเอง_' . now()->format('Y-m-d_H-i-s') . '.xlsx';
            $filePath = storage_path('app/exports/' . $filename);
            
            if (!file_exists(dirname($filePath))) {
                mkdir(dirname($filePath), 0755, true);
            }
            
            $writer = new Xlsx($spreadsheet);
            $writer->save($filePath);
            
            return $filePath;
        } catch (\Exception $e) {
            Log::error('Export self-evaluation report error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get self-evaluation data
     */
    private function getSelfEvaluationData(array $filters = []): array
    {
        try {
           

            $query = DB::table('answers as a')
                ->join('users as evaluatee', 'a.evaluatee_id', '=', 'evaluatee.id')
                ->join('users as evaluator', 'a.user_id', '=', 'evaluator.id')
                ->join('questions as q', 'a.question_id', '=', 'q.id')
                // ไม่ join options ที่นี่ เพราะมีหลายประเภท จะจัดการใน processEvaluationResults
                ->join('evaluations as eval', 'a.evaluation_id', '=', 'eval.id')
                ->leftJoin('parts as p', 'q.part_id', '=', 'p.id')
                ->leftJoin('aspects as asp', 'q.aspect_id', '=', 'asp.id')
                ->leftJoin('sub_aspects as sub_asp', 'q.sub_aspect_id', '=', 'sub_asp.id')
                ->leftJoin('divisions as div', 'evaluatee.division_id', '=', 'div.id')
                ->leftJoin('positions as pos', 'evaluatee.position_id', '=', 'pos.id')
                ->leftJoin('departments as dept', 'evaluatee.department_id', '=', 'dept.id')
                ->where('a.user_id', '=', DB::raw('a.evaluatee_id')) // Self-evaluation condition (user evaluates themselves)
                ->whereIn('a.evaluation_id', function ($query) {
                    // Dynamic lookup: find self-evaluation forms by title pattern
                    $query->select('id')->from('evaluations')
                        ->where('user_type', 'internal')
                        ->where('title', 'like', '%ประเมินตนเอง%')
                        ->where('status', 'published');
                })
                ->whereIn('p.id', function ($query) {
                    // Dynamic lookup: get part IDs belonging to self-evaluation forms
                    $query->select('parts.id')->from('parts')
                        ->join('evaluations', 'parts.evaluation_id', '=', 'evaluations.id')
                        ->where('evaluations.user_type', 'internal')
                        ->where('evaluations.title', 'like', '%ประเมินตนเอง%')
                        ->where('evaluations.status', 'published');
                })
                ->select([
                    'evaluatee.id as evaluatee_id',
                    'evaluatee.emid as evaluatee_emid',
                    'evaluatee.fname as evaluatee_fname',
                    'evaluatee.lname as evaluatee_lname',
                    'evaluatee.grade as evaluatee_grade',
                    'div.name as evaluatee_division',
                    'dept.name as evaluatee_department',
                    'pos.title as evaluatee_position',
                    'evaluator.emid as evaluator_emid',
                    'evaluator.fname as evaluator_fname',
                    'evaluator.lname as evaluator_lname',
                    DB::raw("'self' as evaluation_angle"), // Add 'self' as angle since this is self-evaluation
                    DB::raw("YEAR(a.created_at) as fiscal_year"), // Use answer year as fiscal year
                    'a.evaluation_id',
                    'eval.title as evaluation_title',
                    'q.id as question_id',
                    'q.title as question_title',
                    'q.type as question_type',
                    'p.id as part_id',
                    'p.title as part_title',
                    'p.order as part_order',
                    'asp.name as aspect_name',
                    'sub_asp.name as sub_aspect_name',
                    DB::raw('NULL as option_id'),          // จะ resolve ทีหลัง
                    DB::raw('NULL as option_label'),       // จะ resolve ทีหลัง  
                    DB::raw('NULL as option_score'),       // จะ resolve ทีหลัง
                    'a.value as raw_value',                // เก็บค่าดิบไว้
                    'a.other_text',
                    'a.created_at as answer_date'
                ]);

            // Apply filters
            if (!empty($filters['fiscal_year'])) {
                // Filter by fiscal year - check both answer date and evaluation creation year
                $query->where(function($q) use ($filters) {
                    $q->whereYear('a.created_at', $filters['fiscal_year'])
                      ->orWhereExists(function($subq) use ($filters) {
                          $subq->select(DB::raw(1))
                               ->from('evaluations as eval')
                               ->whereColumn('eval.id', 'a.evaluation_id')
                               ->whereYear('eval.created_at', $filters['fiscal_year']);
                      });
                });
            }
            
            if (!empty($filters['division_id'])) {
                $query->where('evaluatee.division_id', $filters['division_id']);
            }

            if (!empty($filters['grade'])) {
                $query->where('evaluatee.grade', $filters['grade']);
            }

            if (!empty($filters['user_id'])) {
                $query->where('evaluatee.id', $filters['user_id']);
            }

            if (!empty($filters['department_id'])) {
                $query->where('evaluatee.department_id', $filters['department_id']);
            }

            if (!empty($filters['position_id'])) {
                $query->where('evaluatee.position_id', $filters['position_id']);
            }

            if (!empty($filters['only_completed']) && $filters['only_completed'] === 'true') {
                $fiscalYear = $filters['fiscal_year'] ?? date('Y');
                $completedEvaluatorIds = $this->getCompletedEvaluatorIds($fiscalYear);
                if (!empty($completedEvaluatorIds)) {
                    $query->whereIn('evaluator.id', $completedEvaluatorIds);
                } else {
                    return [];
                }
            }

            // Export all parts (no filtering by part_order)

            $results = $query->orderBy('evaluatee.id')
                            ->orderBy('p.order')
                            ->orderBy('q.id')
                            ->get();

            
            
            // Debug: Log part information (all parts)
            if ($results->isNotEmpty()) {
                $partInfo = $results->groupBy('part_id')->map(function($items, $partId) {
                    $first = $items->first();
                    return [
                        'part_id' => $partId,
                        'part_order' => $first->part_order ?? 'N/A',
                        'part_title' => $first->part_title ?? 'N/A',
                        'evaluation_id' => $first->evaluation_id ?? 'N/A',
                        'question_count' => $items->count()
                    ];
                });
                
                $evaluationInfo = $results->groupBy('evaluation_id')->map(function($items, $evalId) {
                    return [
                        'evaluation_id' => $evalId,
                        'evaluation_title' => $items->first()->evaluation_title ?? 'N/A',
                        'question_count' => $items->count()
                    ];
                });
                
               
                
              
            }

            if ($results->isEmpty()) {
                Log::warning('No self-evaluation data found with filters: ' . json_encode($filters));
                return [];
            }

            // Process results และ resolve option values
            return $this->processEvaluationResultsWithOptions($results);
            
        } catch (\Exception $e) {
            Log::error('Error getting self-evaluation data: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Process evaluation results and resolve option values
     */
    private function processEvaluationResultsWithOptions(Collection $results): array
    {
        try {
            Log::info('Processing ' . $results->count() . ' evaluation results with options');
            
            // แปลง results และจัดการ option mapping
            $processedResults = $results->map(function($result) {
                return $this->resolveOptionValue($result);
            });

            // ใช้ processEvaluationResults เดิม
            return $this->processEvaluationResults($processedResults);
        } catch (\Exception $e) {
            Log::error('Error in processEvaluationResultsWithOptions: ' . $e->getMessage());
            Log::error('Error trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Resolve option value based on question type
     */
    private function resolveOptionValue($result)
    {
        try {
            $questionType = $result->question_type;
            $rawValue = $result->raw_value;
            $questionId = $result->question_id;
            
            switch ($questionType) {
                case 'rating':
                    // สำหรับ rating: value เป็น score โดยตรง
                    $result->option_label = $rawValue;
                    $result->option_score = $rawValue;
                    $result->option_id = null;
                    break;

                case 'choice':
                    // สำหรับ choice: value เป็น option_id ต้องหา label
                    $option = $this->getOptionById($rawValue, $questionId);
                    $result->option_label = $option ? $option->label : $rawValue;
                    $result->option_score = $option ? $option->score : null;
                    $result->option_id = $rawValue;
                    break;

                case 'multiple_choice':
                    // สำหรับ multiple choice: value เป็น JSON array ของ option_ids
                    try {
                        $optionIds = json_decode($rawValue, true);
                        
                        // ถ้า json_decode ไม่สำเร็จ หรือผลลัพธ์ไม่ใช่ array
                        if (json_last_error() !== JSON_ERROR_NONE || !is_array($optionIds)) {
                            // ลองแปลงด้วยวิธีอื่น: ลบ brackets แล้วแยกด้วย comma
                            $cleanValue = trim($rawValue, '[]"');
                            if (strpos($cleanValue, ',') !== false) {
                                $optionIds = array_map('trim', explode(',', $cleanValue));
                            } else {
                                $optionIds = [$cleanValue]; // single value
                            }
                        }
                    
                    $labels = [];
                    $scores = [];
                    foreach ($optionIds as $optionId) {
                        // ตรวจสอบและแปลง optionId ให้เป็น string
                        if (is_array($optionId)) {
                            $optionId = implode(',', $optionId);
                        } elseif ($optionId === null) {
                            continue; // skip null values
                        }
                        
                        // แปลงเป็น string และทำความสะอาด (ป้องกัน error)
                        try {
                            $optionId = (string) $optionId;
                            $optionId = trim(str_replace(['[', ']', '"', ' '], '', $optionId));
                        } catch (\Exception $e) {
                            Log::error("Error processing optionId: " . var_export($optionId, true) . " - " . $e->getMessage());
                            continue;
                        }
                        if (!empty($optionId) && is_numeric($optionId)) {
                            $option = $this->getOptionById($optionId, $questionId);
                            $labels[] = $option ? $option->label : $optionId;
                            if ($option && $option->score) {
                                $scores[] = $option->score;
                            }
                        }
                    }
                    
                    $result->option_label = !empty($labels) ? implode(', ', $labels) : $rawValue;
                    $result->option_score = !empty($scores) ? array_sum($scores) / count($scores) : null;
                    $result->option_id = $rawValue;
                    } catch (\Exception $e) {
                        // ถ้า error ให้ใช้ raw value
                        $result->option_label = $rawValue;
                        $result->option_score = null;
                        $result->option_id = $rawValue;
                    }
                    break;

                case 'open_text':
                    // สำหรับ open text: ใช้ raw value โดยตรง
                    $result->option_label = $rawValue;
                    $result->option_score = null;
                    $result->option_id = null;
                    break;

                default:
                    $result->option_label = $rawValue;
                    $result->option_score = null;
                    $result->option_id = null;
            }

        return $result;
        
        } catch (\Exception $e) {
            Log::error("Error resolving option value for question $questionId: " . $e->getMessage());
            // Fallback to raw values
            $result->option_label = is_array($result->raw_value) ? json_encode($result->raw_value) : $result->raw_value;
            $result->option_score = null;
            $result->option_id = null;
            return $result;
        }
    }

    /**
     * Get option by ID and question ID
     */
    private function getOptionById($optionId, $questionId)
    {
        static $optionsCache = [];
        
        // แปลงเป็น string เพื่อป้องกัน array to string conversion
        $optionId = is_array($optionId) ? implode(',', $optionId) : $optionId;
        $questionId = is_array($questionId) ? implode(',', $questionId) : $questionId;
        
        $cacheKey = $questionId . '_' . $optionId;
        
        if (!isset($optionsCache[$cacheKey])) {
            try {
                $optionsCache[$cacheKey] = DB::table('options')
                    ->where('question_id', $questionId)
                    ->where('id', $optionId)
                    ->first();
            } catch (\Exception $e) {
                Log::error('Error getting option: ' . $e->getMessage() . " for option_id: $optionId, question_id: $questionId");
                $optionsCache[$cacheKey] = null;
            }
        }

        return $optionsCache[$cacheKey];
    }

    /**
     * Export evaluation assignments — 1 row per evaluator with one column per
     * evaluation form. Each evaluation column lists the evaluatees that the
     * evaluator evaluates within that form (with grade + division for context).
     *
     * Layout:
     *   ลำดับ | รหัส | ชื่อ | ตำแหน่ง | ระดับ | สายงาน | ตนเอง | <eval 1> | <eval 2> | ...
     *
     * Stakeholder synthetic right-angle entries are bucketed under the evaluation
     * referenced by their access code if include_stakeholders=true.
     */
    public function exportAssignmentsByEvaluator(array $filters = []): string
    {
        $this->boostLimits();
        $fiscalYear = (int) ($filters['fiscal_year'] ?? date('Y'));
        $includeStakeholders = (bool) ($filters['include_stakeholders'] ?? true);

        $assignments = DB::table('evaluation_assignments as ea')
            ->join('users as evaluator', 'evaluator.id', '=', 'ea.evaluator_id')
            ->join('users as evaluatee', 'evaluatee.id', '=', 'ea.evaluatee_id')
            ->leftJoin('evaluations as e', 'e.id', '=', 'ea.evaluation_id')
            ->leftJoin('positions as evpos', 'evpos.id', '=', 'evaluator.position_id')
            ->leftJoin('divisions as ev_divi', 'ev_divi.id', '=', 'evaluator.division_id')
            ->leftJoin('positions as eepos', 'eepos.id', '=', 'evaluatee.position_id')
            ->leftJoin('divisions as ee_divi', 'ee_divi.id', '=', 'evaluatee.division_id')
            ->where('ea.fiscal_year', $fiscalYear)
            ->select(
                'ea.angle', 'ea.evaluation_id',
                'e.title as evaluation_title',
                'evaluator.id as evaluator_id',
                'evaluator.emid as ev_emid', 'evaluator.prename as ev_prename',
                'evaluator.fname as ev_fname', 'evaluator.lname as ev_lname',
                'evaluator.grade as ev_grade', 'evpos.title as ev_position',
                'ev_divi.name as ev_division',
                'evaluatee.id as evaluatee_id', 'evaluatee.emid as ee_emid',
                'evaluatee.prename as ee_prename', 'evaluatee.fname as ee_fname',
                'evaluatee.lname as ee_lname', 'evaluatee.grade as ee_grade',
                'eepos.title as ee_position', 'ee_divi.name as ee_division'
            )
            ->orderBy('evaluator.grade', 'desc')
            ->orderBy('evaluator.fname')
            ->get();

        // Pivot: per evaluator → per evaluation → list of evaluatees
        $byEvaluator = [];           // key => [evaluator info, has_self bool, by_eval => [evalId => [evaluatees]]]
        $evaluations = [];           // evalId => 'title'
        $hasSelfByEvalId = [];       // (not used but kept for clarity)

        foreach ($assignments as $a) {
            $key = (string) $a->evaluator_id;
            if (!isset($byEvaluator[$key])) {
                $byEvaluator[$key] = [
                    'evaluator' => [
                        'emid'     => $a->ev_emid,
                        'prename'  => $a->ev_prename,
                        'fname'    => $a->ev_fname,
                        'lname'    => $a->ev_lname,
                        'position' => $a->ev_position,
                        'grade'    => $a->ev_grade,
                        'division' => $a->ev_division,
                        'is_external' => false,
                    ],
                    'has_self' => false,
                    'by_eval'  => [], // [evalId => [evaluatees]]
                ];
            }
            $eid = (int) ($a->evaluation_id ?? 0);

            // Self assignments → mark on evaluator (don't create eval column —
            // covered by the ตนเอง check column. Skip registering the self
            // evaluation form as a column too).
            if ($a->angle === 'self' || $a->evaluator_id === $a->evaluatee_id) {
                $byEvaluator[$key]['has_self'] = true;
                continue;
            }

            if ($eid && !isset($evaluations[$eid])) {
                $evaluations[$eid] = $a->evaluation_title ?: ('แบบประเมิน ' . $eid);
            }

            $byEvaluator[$key]['by_eval'][$eid] ??= [];
            $byEvaluator[$key]['by_eval'][$eid][] = [
                'emid'     => $a->ee_emid,
                'name'     => trim(($a->ee_prename ?? '') . ($a->ee_fname ?? '') . ' ' . ($a->ee_lname ?? '')),
                'grade'    => $a->ee_grade ?? '',
                'division' => $a->ee_division ?? '',
            ];
        }

        // Stakeholder right-angle entries
        if ($includeStakeholders) {
            $stakeholders = DB::table('external_stakeholders as es')
                ->join('users as evaluatee', 'evaluatee.id', '=', 'es.evaluatee_id')
                ->leftJoin('external_access_codes as eac', 'eac.id', '=', 'es.external_access_code_id')
                ->leftJoin('evaluations as e', 'e.id', '=', 'eac.evaluation_id')
                ->leftJoin('positions as eepos', 'eepos.id', '=', 'evaluatee.position_id')
                ->leftJoin('divisions as divi', 'divi.id', '=', 'evaluatee.division_id')
                ->where('es.fiscal_year', $fiscalYear)
                ->select(
                    'es.organization_name', 'es.contact_person', 'es.sub_group',
                    'eac.evaluation_id', 'e.title as evaluation_title',
                    'evaluatee.emid as ee_emid', 'evaluatee.prename', 'evaluatee.fname', 'evaluatee.lname',
                    'evaluatee.grade as ee_grade', 'eepos.title as ee_position', 'divi.name as ee_division'
                )
                ->get();

            foreach ($stakeholders as $s) {
                $eid = (int) ($s->evaluation_id ?? 0);
                if ($eid && !isset($evaluations[$eid])) {
                    $evaluations[$eid] = $s->evaluation_title ?: 'แบบประเมินภายนอก';
                }
                $key = 'ext:' . trim(mb_strtolower($s->organization_name));
                if (!isset($byEvaluator[$key])) {
                    $byEvaluator[$key] = [
                        'evaluator' => [
                            'emid'     => '',
                            'prename'  => '',
                            'fname'    => $s->organization_name,
                            'lname'    => $s->contact_person ?? '',
                            'position' => $s->sub_group ?? '',
                            'grade'    => '',
                            'division' => '',
                            'is_external' => true,
                        ],
                        'has_self' => false,
                        'by_eval'  => [],
                    ];
                }
                $byEvaluator[$key]['by_eval'][$eid] ??= [];
                $byEvaluator[$key]['by_eval'][$eid][] = [
                    'emid'     => $s->ee_emid,
                    'name'     => trim(($s->prename ?? '') . ($s->fname ?? '') . ' ' . ($s->lname ?? '')),
                    'grade'    => $s->ee_grade ?? '',
                    'division' => $s->ee_division ?? '',
                ];
            }
        }

        // Build spreadsheet — single sheet, dynamic columns per evaluation
        $thaiYear = $fiscalYear + 543;
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('รายชื่อผู้ประเมิน');
        $this->buildEvaluatorPivotSheet($sheet, $byEvaluator, $evaluations, $thaiYear);

        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'รายชื่อผู้ประเมิน_พศ' . $thaiYear . '_' . now()->format('Ymd_His') . '.xlsx';
        $filePath = storage_path('app/exports/' . $filename);
        if (!file_exists(dirname($filePath))) mkdir(dirname($filePath), 0755, true);
        (new Xlsx($spreadsheet))->save($filePath);
        return $filePath;
    }

    /** Friendly column label for an evaluation form (compact). */
    private function evaluationColumnLabel(string $title): string
    {
        // Strip common prefixes for readability
        $t = preg_replace('/^แบบประเมิน\s*360\s*องศา\s*/u', '', $title);
        $t = preg_replace('/\s*สำหรับ\s*/u', ' · ', $t);
        return trim($t) ?: $title;
    }

    /**
     * Single sheet: 1 row per evaluator with dynamic columns per evaluation form.
     */
    private function buildEvaluatorPivotSheet($sheet, array $byEvaluator, array $evaluations, int $thaiYear): void
    {
        // Drop self-evaluation forms (covered by ตนเอง check column)
        $evaluations = array_filter($evaluations, fn($title) => mb_strpos($title, 'ประเมินตนเอง') === false);
        // Order evaluations: by id ascending (matches creation order)
        ksort($evaluations);
        $evalIds = array_keys($evaluations);

        // Layout: A=ลำดับ, B=รหัส, C=ชื่อ, D=ตำแหน่ง, E=ระดับ, F=สายงาน, G=ตนเอง, H+=evaluations
        $fixedCols = ['A' => 'ลำดับ', 'B' => 'รหัส', 'C' => 'ชื่อผู้ประเมิน', 'D' => 'ตำแหน่ง', 'E' => 'ระดับ', 'F' => 'สายงาน', 'G' => 'ตนเอง'];
        $startEvalCol = 'H';

        $sheet->setCellValue('A1', "รายชื่อผู้ประเมิน — แยกตามแบบประเมิน — ปีงบประมาณ พ.ศ. {$thaiYear}");
        $lastCol = chr(ord($startEvalCol) + count($evalIds) - 1);
        if (count($evalIds) === 0) $lastCol = 'G';
        $sheet->mergeCells('A1:' . $lastCol . '1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header row 2
        foreach ($fixedCols as $col => $label) $sheet->setCellValue($col . '2', $label);
        $col = $startEvalCol;
        foreach ($evalIds as $eid) {
            $sheet->setCellValue($col . '2', $this->evaluationColumnLabel($evaluations[$eid]));
            $sheet->getColumnDimension($col)->setWidth(38);
            $col = chr(ord($col) + 1);
        }

        $sheet->getStyle("A2:{$lastCol}2")->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $sheet->getStyle("A2:{$lastCol}2")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('5B6FBC');
        $sheet->getStyle("A2:{$lastCol}2")->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER)
            ->setWrapText(true);
        $sheet->getRowDimension(2)->setRowHeight(48);

        // Fixed col widths
        $widths = ['A' => 6, 'B' => 12, 'C' => 26, 'D' => 26, 'E' => 7, 'F' => 24, 'G' => 8];
        foreach ($widths as $c => $w) $sheet->getColumnDimension($c)->setWidth($w);

        $row = 3;
        $idx = 1;
        foreach ($byEvaluator as $g) {
            $ev = $g['evaluator'];
            $name = trim(($ev['prename'] ?? '') . ($ev['fname'] ?? '') . ' ' . ($ev['lname'] ?? ''));

            $sheet->setCellValue('A' . $row, $idx);
            $sheet->setCellValue('B' . $row, $ev['emid'] ?: '—');
            $sheet->setCellValue('C' . $row, $name);
            $sheet->setCellValue('D' . $row, $ev['position'] ?? '');
            $sheet->setCellValue('E' . $row, $ev['grade'] ?: '');
            $sheet->setCellValue('F' . $row, $ev['division'] ?? '');
            $sheet->setCellValue('G' . $row, $g['has_self'] ? '✓' : '');

            $maxLines = 1;
            $col = $startEvalCol;
            foreach ($evalIds as $eid) {
                $list = $g['by_eval'][$eid] ?? [];
                $sheet->setCellValue($col . $row, $this->formatEvaluateePivotList($list));
                if (count($list) > 0) $maxLines = max($maxLines, count($list) + 1);
                $col = chr(ord($col) + 1);
            }

            // Style row: top-aligned, wrap on lists, center small cols
            $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getAlignment()
                ->setVertical(Alignment::VERTICAL_TOP)
                ->setWrapText(true);
            $sheet->getStyle("A{$row}:B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("E{$row}:G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("{$startEvalCol}{$row}:{$lastCol}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Zebra
            if ($idx % 2 === 0) {
                $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('F8F9FE');
            }
            // External stakeholder
            if (!empty($ev['is_external'])) {
                $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getFill()->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('FFF7E6');
            }

            $sheet->getRowDimension($row)->setRowHeight(min(max(20, $maxLines * 16), 400));
            $row++;
            $idx++;
        }

        if ($row > 3) {
            $sheet->getStyle("A2:{$lastCol}" . ($row - 1))->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('D5DAE8');
        }
        $sheet->freezePane('C3');
    }

    /** Format evaluatee list for pivot cell: name + grade + division. */
    private function formatEvaluateePivotList(array $items): string
    {
        if (empty($items)) return '-';
        $lines = ['[' . count($items) . ' ราย]'];
        foreach ($items as $i => $r) {
            $line = ($i + 1) . '. ' . $r['name'];
            if (!empty($r['grade'])) $line .= " · ระดับ {$r['grade']}";
            if (!empty($r['division'])) $line .= " · " . mb_substr($r['division'], 0, 30);
            $lines[] = $line;
        }
        return implode("\n", $lines);
    }

    /** @deprecated kept for now in case other callers reference it. */
    private function safeSheetTitle(string $name): string
    {
        $name = preg_replace('/[\\\\\\/\\?\\*\\[\\]:]/u', '_', $name);
        return mb_substr($name, 0, 31);
    }

}
