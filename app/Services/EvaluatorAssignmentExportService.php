<?php

namespace App\Services;

use App\Models\EvaluationAssignment;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class EvaluatorAssignmentExportService
{
    /** Internal grade groups → sheet name */
    public const SHEET_GROUPS = [
        'ระดับ 13 (ผวก.)' => [13],
        'ระดับ 12'        => [12],
        'ระดับ 11'        => [11],
        'ระดับ 10'        => [10],
        'ระดับ 9'         => [9],
        'ระดับ 5-8'       => [5, 6, 7, 8],
        'ระดับ 4'         => [4],
    ];

    public const EXTERNAL_SHEET = 'External Evaluators';

    public const HEADERS = [
        'A' => 'รหัสพนักงาน',
        'B' => 'คำนำหน้า',
        'C' => 'ชื่อ',
        'D' => 'นามสกุล',
        'E' => 'ตำแหน่ง',
        'F' => 'ระดับ',
        'G' => 'กอง',
        'H' => 'ฝ่าย',
        'I' => 'สายงาน',
        'J' => 'ประเมินตนเอง',
        'K' => 'ประเมินเป็นองศาบนของ',
        'L' => 'ประเมินเป็นองศาล่างของ',
        'M' => 'ประเมินเป็นองศาซ้ายของ',
        'N' => 'ประเมินเป็นองศาขวาของ',
    ];

    public function build(int $fiscalYear, array $filters = []): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $assignments = $this->queryAssignments($fiscalYear, $filters);
        $byEvaluator = $this->groupByEvaluator($assignments);
        $bySheet     = $this->bucketIntoSheets($byEvaluator);

        $sheetIndex = 0;
        foreach ($bySheet as $sheetName => $evaluators) {
            if (empty($evaluators)) continue;
            $this->writeSheet($spreadsheet, $sheetName, $evaluators, $sheetIndex++);
        }

        // Always have at least one sheet so xlsx is valid
        if ($spreadsheet->getSheetCount() === 0) {
            $this->writeSheet($spreadsheet, 'ระดับ 10', [], 0);
        }

        $spreadsheet->setActiveSheetIndex(0);
        return $spreadsheet;
    }

    protected function queryAssignments(int $fiscalYear, array $filters)
    {
        return EvaluationAssignment::with([
            'evaluator:id,emid,prename,fname,lname,grade,user_type,position_id,division_id,department_id,faction_id',
            'evaluator.position:id,title',
            'evaluator.division:id,name',
            'evaluator.department:id,name',
            'evaluator.faction:id,name',
            'evaluatee:id,emid,prename,fname,lname,grade,user_type,position_id',
            'evaluatee.position:id,title',
        ])
        ->where('fiscal_year', $fiscalYear)
        ->when(isset($filters['division_id']),   fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('division_id', $filters['division_id'])))
        ->when(isset($filters['department_id']), fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('department_id', $filters['department_id'])))
        ->when(isset($filters['faction_id']),    fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('faction_id', $filters['faction_id'])))
        ->when(isset($filters['grade']),         fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('grade', $filters['grade'])))
        ->when(isset($filters['user_type']),    fn($q) => $q->whereHas('evaluator', fn($e) => $e->where('user_type', $filters['user_type'])))
        ->when(isset($filters['angle']),         fn($q) => $q->where('angle', $filters['angle']))
        ->when(isset($filters['search']),        function ($q) use ($filters) {
            $s = $filters['search'];
            $q->whereHas('evaluator', function ($e) use ($s) {
                $e->where('fname', 'like', "%{$s}%")
                  ->orWhere('lname', 'like', "%{$s}%")
                  ->orWhere('emid', 'like', "%{$s}%");
            });
        })
        ->get();
    }

    protected function groupByEvaluator($assignments): array
    {
        $byEvaluator = [];
        foreach ($assignments as $a) {
            if (!$a->evaluator) continue;
            $eid = $a->evaluator_id;
            if (!isset($byEvaluator[$eid])) {
                $byEvaluator[$eid] = [
                    'user'         => $a->evaluator,
                    'self_eval'    => false,
                    'top'          => [],
                    'bottom'       => [],
                    'left'         => [],
                    'right'        => [],
                ];
            }
            if ($a->evaluator_id === $a->evaluatee_id) {
                $byEvaluator[$eid]['self_eval'] = true;
                continue;
            }
            $angle = $a->angle;
            if (in_array($angle, ['top','bottom','left','right'], true)) {
                $byEvaluator[$eid][$angle][] = $a->evaluatee;
            }
        }
        return $byEvaluator;
    }

    protected function bucketIntoSheets(array $byEvaluator): array
    {
        $buckets = array_fill_keys(array_keys(self::SHEET_GROUPS), []);
        $buckets[self::EXTERNAL_SHEET] = [];

        foreach ($byEvaluator as $row) {
            $user = $row['user'];
            $userType = $user->user_type instanceof \BackedEnum
                ? $user->user_type->value
                : $user->user_type;

            if ($userType === 'external') {
                $buckets[self::EXTERNAL_SHEET][] = $row;
                continue;
            }

            $grade = (int) $user->grade;
            foreach (self::SHEET_GROUPS as $sheet => $grades) {
                if (in_array($grade, $grades, true)) {
                    $buckets[$sheet][] = $row;
                    break;
                }
            }
        }
        return $buckets;
    }

    protected function writeSheet(Spreadsheet $spreadsheet, string $sheetName, array $evaluators, int $index): void
    {
        $sheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, $sheetName);
        $spreadsheet->addSheet($sheet, $index);

        // Title row
        $sheet->setCellValue('A1', 'ผู้ประเมิน — ' . $sheetName);
        $sheet->mergeCells('A1:N1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        // Header row
        foreach (self::HEADERS as $col => $label) {
            $sheet->setCellValue($col . '2', $label);
        }
        $sheet->getStyle('A2:N2')->getFont()->setBold(true);
        $sheet->freezePane('A3');

        $r = 3;
        foreach ($evaluators as $row) {
            $u = $row['user'];
            $sheet->setCellValueExplicit("A{$r}", (string) ($u->emid ?? ''), \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("B{$r}", $u->prename);
            $sheet->setCellValue("C{$r}", $u->fname);
            $sheet->setCellValue("D{$r}", $u->lname);
            $sheet->setCellValue("E{$r}", optional($u->position)->title ?? '');
            $sheet->setCellValue("F{$r}", (string) ($u->grade ?? ''));
            $sheet->setCellValue("G{$r}", optional($u->department)->name ?? '');
            $sheet->setCellValue("H{$r}", optional($u->division)->name ?? '');
            $sheet->setCellValue("I{$r}", optional($u->faction)->name ?? '');
            $sheet->setCellValue("J{$r}", $row['self_eval'] ? '/' : '');
            $sheet->setCellValue("K{$r}", $this->formatList($row['top']));
            $sheet->setCellValue("L{$r}", $this->formatList($row['bottom']));
            $sheet->setCellValue("M{$r}", $this->formatList($row['left']));
            $sheet->setCellValue("N{$r}", $this->formatList($row['right']));
            $sheet->getStyle("K{$r}:N{$r}")->getAlignment()->setWrapText(true)->setVertical('top');
            $r++;
        }

        foreach (range('A','N') as $c) {
            $sheet->getColumnDimension($c)->setAutoSize(true);
        }
    }

    protected function formatList(array $evaluatees): string
    {
        if (empty($evaluatees)) return '';
        $lines = [];
        foreach ($evaluatees as $e) {
            $title = optional($e->position)->title ?? '';
            $lines[] = sprintf('- %s %s %s %s',
                trim($e->prename ?? ''),
                trim($e->fname ?? ''),
                trim($e->lname ?? ''),
                trim($title)
            );
        }
        return implode("\n", $lines);
    }
}
