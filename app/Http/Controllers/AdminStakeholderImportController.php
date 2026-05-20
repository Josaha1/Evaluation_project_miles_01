<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Models\User;
use App\Services\EvaluationLookupService;
use App\Services\StakeholderImportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Bulk-import "องศาขวา" (right-angle) access codes from Excel.
 * Mirrors AdminEvaluationAssignmentController import wizard pattern.
 */
class AdminStakeholderImportController extends Controller
{
    public function __construct(private StakeholderImportService $service) {}

    public function showImport()
    {
        $fiscalYears = Evaluation::query()
            ->whereNotNull('fiscal_year')
            ->distinct()
            ->orderByDesc('fiscal_year')
            ->pluck('fiscal_year')
            ->map(fn ($v) => (int) $v)
            ->values()
            ->all();

        if (empty($fiscalYears)) {
            $fiscalYears = [EvaluationLookupService::currentFiscalYear()];
        }

        // Users for autocomplete on rows where fuzzy match failed.
        // Limit to grade ≥ 9 + governor (external evals only target executives).
        $users = User::where('grade', '>=', 9)
            ->orderByDesc('grade')->orderBy('fname')
            ->get(['id', 'emid', 'prename', 'fname', 'lname', 'grade'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'emid' => (string) $u->emid,
                'label' => trim(($u->prename ?? '') . ($u->fname ?? '') . ' ' . ($u->lname ?? ''))
                    . " (g{$u->grade}, {$u->emid})",
            ])
            ->values();

        return Inertia::render('AdminStakeholderImport', [
            'fiscal_years'  => $fiscalYears,
            'selected_year' => $fiscalYears[0],
            'users'         => $users,
        ]);
    }

    public function previewImport(Request $request)
    {
        $request->validate([
            'file'                  => 'required|file|mimes:xlsx,xls',
            'fiscal_year'           => 'required|integer|min:2020|max:2100',
            'default_evaluatee_id'  => 'nullable|integer|exists:users,id',
        ]);

        try {
            $sourceFile = $request->file('file')->getClientOriginalName();
            $parsed = $this->service->parseFile($request->file('file')->getRealPath());
            $preview = $this->service->buildPreview(
                $parsed,
                (int) $request->input('fiscal_year'),
                $request->input('default_evaluatee_id') ? (int) $request->input('default_evaluatee_id') : null
            );
            // Tag every row with the source filename so admin can trace issues
            // back to the originating Excel file (helpful when uploading 9+ files).
            $preview['source_file'] = $sourceFile;
            $preview['rows'] = array_map(
                fn ($r) => array_merge($r, ['source_file' => $sourceFile]),
                $preview['rows']
            );
            return response()->json($preview);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'อ่านไฟล์ไม่สำเร็จ: ' . $e->getMessage()], 422);
        }
    }

    /**
     * Export unmatched / problem rows from a preview as Excel.
     * Admin uses this to review/fix offline before re-uploading.
     */
    public function exportUnmatched(Request $request)
    {
        $request->validate([
            'rows' => 'required|array',
        ]);

        // Include any row that has a problem OR has at least one empty group
        $unmatched = collect($request->input('rows'))->filter(function ($r) {
            if (in_array($r['status'] ?? null, ['evaluatee_not_found', 'no_evaluation', 'all_empty'], true)) {
                return true;
            }
            // Has any empty groups → still worth reporting
            foreach (($r['groups'] ?? []) as $g) {
                if (!empty($g['empty'])) return true;
            }
            return false;
        })->values();

        $sp = new Spreadsheet();
        $ws = $sp->getActiveSheet();
        $ws->setTitle('รายการต้องแก้');

        // Status → Thai label + color
        $statusLabels = [
            'evaluatee_not_found' => ['label' => '❌ ไม่พบผู้ถูกประเมิน', 'color' => 'FFE4E4'],
            'no_evaluation'       => ['label' => '❌ ไม่พบแบบประเมิน',    'color' => 'FFE4E4'],
            'all_empty'           => ['label' => '⊘ ทุกกลุ่มไม่มีรายชื่อ', 'color' => 'FFF4D4'],
            'partial_empty'       => ['label' => '⚠ บางกลุ่มไม่มีรายชื่อ',  'color' => 'FFF4D4'],
        ];

        // Headers — 7 essential columns only
        $headers = ['ไฟล์ต้นทาง', 'ชื่อชีต', 'ผู้ถูกประเมิน', 'ปัญหา', 'กลุ่มที่ skip', 'รายชื่อที่กรอก', 'สิ่งที่ต้องทำ'];
        foreach ($headers as $i => $label) {
            $ws->setCellValue([$i + 1, 1], $label);
        }
        // Header style: bold white on violet
        $headerRange = 'A1:G1';
        $ws->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $ws->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('7C3AED');
        $ws->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
        $ws->getRowDimension(1)->setRowHeight(28);
        $ws->freezePane('A2');

        $row = 2;
        foreach ($unmatched as $r) {
            $emptyGroupNames = [];
            $filledStakeholderCount = 0;
            foreach (($r['groups'] ?? []) as $g) {
                $filledInGroup = 0;
                foreach (($g['stakeholders'] ?? []) as $s) {
                    if (!empty(trim((string) ($s['organization_name'] ?? '')))) $filledInGroup++;
                }
                $filledStakeholderCount += $filledInGroup;
                if ($filledInGroup === 0) {
                    $emptyGroupNames[] = $g['label'] ?? '?';
                }
            }

            // Effective status — promote partial empty
            $rawStatus = $r['status'] ?? '';
            if ($rawStatus === 'ok' && count($emptyGroupNames) > 0) $rawStatus = 'partial_empty';
            $statusInfo = $statusLabels[$rawStatus] ?? ['label' => $rawStatus, 'color' => 'F0F0F0'];

            // Evaluatee column — name if matched, else emid, else "(หาไม่เจอ)"
            $evaluateeDisplay = $r['evaluatee_name']
                ?: ($r['emid'] ? 'emid=' . $r['emid'] : '(หาไม่เจอ)');

            // Action — clear plain Thai
            $action = match ($rawStatus) {
                'evaluatee_not_found' => $r['emid']
                    ? "ตรวจสอบ emid {$r['emid']} ในระบบ users (อาจสะกดผิด/ไม่มี user)"
                    : 'ระบุ emid ในไฟล์ หรือ map manually ในหน้า preview',
                'no_evaluation'  => 'สร้างแบบประเมิน user_type=external ที่ admin/evaluations ก่อน',
                'all_empty'      => 'กรอก "ชื่อหน่วยงาน/บริษัท" ในไฟล์ Excel แล้ว re-import',
                'partial_empty'  => 'กรอกชื่อหน่วยงานในกลุ่มที่ skip แล้ว re-import (ไม่ทับซ้อน)',
                default          => '-',
            };

            $ws->setCellValue('A' . $row, $r['source_file'] ?? '(ไม่ระบุ)');
            $ws->setCellValue('B' . $row, $r['sheet'] ?? '');
            $ws->setCellValue('C' . $row, $evaluateeDisplay);
            $ws->setCellValue('D' . $row, $statusInfo['label']);
            $ws->setCellValue('E' . $row, implode(', ', $emptyGroupNames) ?: '—');
            $ws->setCellValue('F' . $row, $filledStakeholderCount);
            $ws->setCellValue('G' . $row, $action);

            // Color the status cell based on severity
            $ws->getStyle("D{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($statusInfo['color']);
            // Wrap action text
            $ws->getStyle("G{$row}")->getAlignment()->setWrapText(true);
            $row++;
        }

        // Column widths — set explicitly for predictable, readable output
        $widths = ['A' => 38, 'B' => 32, 'C' => 28, 'D' => 26, 'E' => 32, 'F' => 14, 'G' => 60];
        foreach ($widths as $col => $w) {
            $ws->getColumnDimension($col)->setAutoSize(false)->setWidth($w);
        }

        // Auto-filter — admin can sort/filter by file, problem type, etc.
        $lastRow = max(1, $row - 1);
        $ws->setAutoFilter("A1:G{$lastRow}");
        $ws->getStyle("A2:G{$lastRow}")->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
        $ws->getStyle("F2:F{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Summary footer (bonus): top-of-report counts as a 2nd worksheet
        $sum = $sp->createSheet();
        $sum->setTitle('สรุป');
        $byStatus = $unmatched->countBy(function ($r) {
            $s = $r['status'] ?? '';
            $emptyCount = 0;
            foreach (($r['groups'] ?? []) as $g) {
                $filled = array_filter(($g['stakeholders'] ?? []), fn ($x) => !empty(trim((string) ($x['organization_name'] ?? ''))));
                if (count($filled) === 0) $emptyCount++;
            }
            if ($s === 'ok' && $emptyCount > 0) return 'partial_empty';
            return $s;
        });
        $sum->setCellValue('A1', 'สถานะ');
        $sum->setCellValue('B1', 'จำนวน sheet');
        $sum->getStyle('A1:B1')->getFont()->setBold(true);
        $sum->getStyle('A1:B1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('7C3AED');
        $sum->getStyle('A1:B1')->getFont()->getColor()->setRGB('FFFFFF');
        $sumRow = 2;
        foreach ($byStatus as $st => $cnt) {
            $info = $statusLabels[$st] ?? ['label' => $st, 'color' => 'F0F0F0'];
            $sum->setCellValue("A{$sumRow}", $info['label']);
            $sum->setCellValue("B{$sumRow}", $cnt);
            $sum->getStyle("A{$sumRow}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($info['color']);
            $sumRow++;
        }
        $sum->setCellValue("A{$sumRow}", 'รวม');
        $sum->setCellValue("B{$sumRow}", $unmatched->count());
        $sum->getStyle("A{$sumRow}:B{$sumRow}")->getFont()->setBold(true);
        $sum->getColumnDimension('A')->setWidth(32);
        $sum->getColumnDimension('B')->setWidth(14);

        // Activate the main sheet by default (PhpSpreadsheet adds new sheets last)
        $sp->setActiveSheetIndex(0);

        $filename = 'stakeholder-unmatched-' . now()->format('Y-m-d_His') . '.xlsx';
        $tmp = tempnam(sys_get_temp_dir(), 'stkh_');
        (new Xlsx($sp))->save($tmp);

        return response()->download($tmp, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function executeImport(Request $request)
    {
        $request->validate([
            'rows'        => 'required|array',
            'fiscal_year' => 'required|integer|min:2020|max:2100',
            'mappings'    => 'sometimes|array',  // {sheet_title => user_id | "skip"}
        ]);

        try {
            $result = $this->service->execute(
                $request->input('rows'),
                (int) $request->input('fiscal_year'),
                $request->input('mappings', [])
            );
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'นำเข้าไม่สำเร็จ: ' . $e->getMessage()], 500);
        }
    }
}
