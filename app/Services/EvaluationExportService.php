<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Evaluation;
use App\Models\EvaluationAssignment;
use App\Models\Part;
use App\Models\Question;
use App\Models\Option;
use App\Models\User;
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
     * Export comprehensive evaluation report for internal executives (levels 9-12) and employees (levels 5-8)
     */
    public function exportComprehensiveEvaluationReport(array $filters = []): string
    {
        try {
            $spreadsheet = new Spreadsheet();
            
            // Create sheets for different evaluation types
            $this->createExecutiveEvaluationSheet($spreadsheet, $filters);
            $this->createEmployeeEvaluationSheet($spreadsheet, $filters);
            $this->createGovernorEvaluationSheet($spreadsheet, $filters);
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
        $sheet->setTitle('ผู้บริหารระดับ 9-12');
        
        // Dynamic lookup: find 360 internal evaluation for grades 9-12
        $evaluation = Evaluation::where('user_type', 'internal')
            ->where('grade_min', 9)->where('grade_max', 12)
            ->where('title', 'like', '%360%')
            ->where('status', 'published')->first();
        $evaluationData = $evaluation
            ? $this->getEvaluationData($evaluation->id, [9, 10, 11, 12], $filters)
            : [];
        
        $this->setupSheetHeaders($sheet, 'รายงานการประเมิน 360 องซา สำหรับผู้บริหารระดับ 9-12');
        $this->populateEvaluationData($sheet, $evaluationData, 6);
        
        $this->applySheetStyling($sheet, count($evaluationData) + 10);
    }

    /**
     * Create employee evaluation sheet (levels 5-8)
     */
    private function createEmployeeEvaluationSheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $employeeSheet = $spreadsheet->createSheet();
        $employeeSheet->setTitle('พนักงานระดับ 5-8');
        
        // Dynamic lookup: find 360 internal evaluation for grades 5-8
        $evaluation = Evaluation::where('user_type', 'internal')
            ->where('grade_min', 5)->where('grade_max', 8)
            ->where('title', 'like', '%360%')
            ->where('status', 'published')->first();
        $evaluationData = $evaluation
            ? $this->getEvaluationData($evaluation->id, [5, 6, 7, 8], $filters)
            : [];
        
        $this->setupSheetHeaders($employeeSheet, 'รายงานการประเมิน 360 องซา สำหรับพนักงานระดับ 5-8');
        $this->populateEvaluationData($employeeSheet, $evaluationData, 6);
        
        $this->applySheetStyling($employeeSheet, count($evaluationData) + 10);
    }

    /**
     * Create governor evaluation sheet (level 13)
     */
    private function createGovernorEvaluationSheet(Spreadsheet $spreadsheet, array $filters): void
    {
        // Find the governor internal evaluation dynamically
        $governorEval = \App\Models\Evaluation::where('grade_min', 13)
            ->where('grade_max', 13)
            ->where('user_type', 'internal')
            ->where('status', 'published')
            ->first();

        if (!$governorEval) {
            return; // No governor evaluation configured yet
        }

        $governorSheet = $spreadsheet->createSheet();
        $governorSheet->setTitle('ผู้ว่าการ ระดับ 13');

        $evaluationData = $this->getEvaluationData($governorEval->id, [13], $filters);

        $this->setupSheetHeaders($governorSheet, 'รายงานการประเมิน 360 องศา สำหรับผู้ว่าการ กนอ.');
        $this->populateEvaluationData($governorSheet, $evaluationData, 6);

        $this->applySheetStyling($governorSheet, count($evaluationData) + 10);
    }

    /**
     * Create summary sheet
     */
    private function createSummarySheet(Spreadsheet $spreadsheet, array $filters): void
    {
        $summarySheet = $spreadsheet->createSheet();
        $summarySheet->setTitle('สรุปภาพรวม');

        // Dynamic lookup for summary sheet
        $execEval = Evaluation::where('user_type', 'internal')
            ->where('grade_min', 9)->where('grade_max', 12)
            ->where('title', 'like', '%360%')
            ->where('status', 'published')->first();
        $empEval = Evaluation::where('user_type', 'internal')
            ->where('grade_min', 5)->where('grade_max', 8)
            ->where('title', 'like', '%360%')
            ->where('status', 'published')->first();
        $govEval = Evaluation::where('user_type', 'internal')
            ->where('grade_min', 13)->where('grade_max', 13)
            ->where('title', 'like', '%360%')
            ->where('status', 'published')->first();
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
        $evaluators = DB::table('evaluation_assignments')
            ->where('fiscal_year', $fiscalYear)
            ->distinct('evaluator_id')
            ->pluck('evaluator_id');

        $completedEvaluatorIds = [];

        foreach ($evaluators as $evaluatorId) {
            $assignments = DB::table('evaluation_assignments')
                ->where('evaluator_id', $evaluatorId)
                ->where('fiscal_year', $fiscalYear)
                ->get(['evaluation_id', 'evaluatee_id']);

            $totalRequiredQuestions = 0;
            foreach ($assignments as $assignment) {
                $questionCount = DB::table('questions as q')
                    ->join('parts as p', 'q.part_id', '=', 'p.id')
                    ->where('p.evaluation_id', $assignment->evaluation_id)
                    ->count();
                $totalRequiredQuestions += $questionCount;
            }

            $actualAnswersCount = DB::table('answers as a')
                ->join('evaluation_assignments as ea', function($join) {
                    $join->on('a.evaluation_id', '=', 'ea.evaluation_id')
                         ->on('a.user_id', '=', 'ea.evaluator_id')
                         ->on('a.evaluatee_id', '=', 'ea.evaluatee_id');
                })
                ->where('ea.evaluator_id', $evaluatorId)
                ->where('ea.fiscal_year', $fiscalYear)
                ->count();

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
        $sheet->setCellValue('A' . $row, 'สรุปพนักงานระดับ 5-8');
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
            'self' => 'ประเมินตนเอง',
            'top' => 'องศาบน',
            'bottom' => 'องศาล่าง',
            'left' => 'องศาซ้าย',
            'right' => 'องศาขวา'
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
     * Export specific evaluation type
     */
    public function exportByEvaluationType(int $evaluationId, array $filters = []): string
    {
        try {
            $evaluation = Evaluation::findOrFail($evaluationId);
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('รายงานการประเมิน');
            
            // Determine grade range based on evaluation
            $grades = $this->getGradeRangeForEvaluation($evaluationId);
            $evaluationData = $this->getEvaluationData($evaluationId, $grades, $filters);
            
            $this->setupSheetHeaders($sheet, 'รายงานการประเมิน: ' . $evaluation->title);
            $this->populateEvaluationData($sheet, $evaluationData, 6);
            $this->applySheetStyling($sheet, count($evaluationData) + 10);
            
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
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('การประเมินตนเอง');
            
            // Get self-evaluation data for all parts
            $selfEvaluationData = $this->getSelfEvaluationData($filters);
            
           
            $this->setupSheetHeaders($sheet, 'รายงานการประเมินตนเอง (ทุกส่วน)');
            $this->populateEvaluationData($sheet, $selfEvaluationData, 6);
            $this->applySheetStyling($sheet, count($selfEvaluationData) + 10);
            
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
}