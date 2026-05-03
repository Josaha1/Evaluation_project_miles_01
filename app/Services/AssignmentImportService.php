<?php

namespace App\Services;

use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AssignmentImportService
{
    /** Header keywords (Thai) — auto-detect column position */
    private const HEADER_KEYS = [
        'emid'      => ['รหัสพนักงาน', 'รหัส'],
        'fname'     => ['ชื่อ'],
        'lname'     => ['นามสกุล'],
        'fullname'  => ['ชื่อ-นามสกุล', 'ชื่อ - นามสกุล'],
        'grade'     => ['ระดับ'],
        'self'      => ['ประเมินตนเอง'],
        'top'       => ['องศาบน'],
        'bottom'    => ['องศาล่าง'],
        'left'      => ['องศาซ้าย'],
        // 'right' header is detected only as a boundary marker for left-angle range —
        // right-angle assignments are NOT imported (use external access-code flow)
        'right'     => ['องศาขวา'],
    ];

    /**
     * Parse all sheets in workbook → return flat array of rows.
     * Each row: {sheet, row_no, emid, self_marker, top_cell, bottom_cell, left_cell}
     */
    public function parseFile(string $path): array
    {
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($path);

        $allRows = [];
        $sheetSummary = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $headerRow = $this->findHeaderRow($sheet);
            if (!$headerRow) {
                $sheetSummary[] = ['sheet' => $sheet->getTitle(), 'rows' => 0, 'skipped' => true];
                continue;
            }

            $cols = $this->detectColumns($sheet, $headerRow);
            if (!isset($cols['emid'])) {
                $sheetSummary[] = ['sheet' => $sheet->getTitle(), 'rows' => 0, 'skipped' => true];
                continue;
            }

            $highest = $sheet->getHighestRow();
            $rowCount = 0;
            for ($r = $headerRow + 1; $r <= $highest; $r++) {
                $emid = trim((string) $sheet->getCell("{$cols['emid']}{$r}")->getValue());
                $fname = isset($cols['fname']) ? trim((string) $sheet->getCell("{$cols['fname']}{$r}")->getValue()) : '';
                $lname = isset($cols['lname']) ? trim((string) $sheet->getCell("{$cols['lname']}{$r}")->getValue()) : '';
                $fullname = isset($cols['fullname']) ? trim((string) $sheet->getCell("{$cols['fullname']}{$r}")->getValue()) : '';

                // Skip totally empty rows (no emid AND no name)
                if (!$emid && !$fname && !$lname && !$fullname) continue;

                $allRows[] = [
                    'sheet'        => $sheet->getTitle(),
                    'row_no'       => $r,
                    'emid'         => $emid,
                    'fname'        => $fname,
                    'lname'        => $lname,
                    'fullname'     => $fullname,
                    'self_marker'  => isset($cols['self']) ? trim((string) $sheet->getCell("{$cols['self']}{$r}")->getValue()) : '',
                    // Read full angle column range — covers unlabeled sub-columns between angle headers
                    // (e.g., governor file: G="องศาบน" + H=ที่ปรึกษา → both belong to top angle)
                    'top_cell'     => $this->readAngleRange($sheet, $cols, $headerRow, 'top', $r),
                    'bottom_cell'  => $this->readAngleRange($sheet, $cols, $headerRow, 'bottom', $r),
                    'left_cell'    => $this->readAngleRange($sheet, $cols, $headerRow, 'left', $r),
                ];
                $rowCount++;
            }
            $sheetSummary[] = ['sheet' => $sheet->getTitle(), 'rows' => $rowCount, 'skipped' => false];
        }

        return ['rows' => $allRows, 'sheets' => $sheetSummary];
    }

    /**
     * Build preview — annotate rows with status, lookups, unmatched names.
     */
    public function buildPreview(array $parsed, int $fiscalYear): array
    {
        $rows = $parsed['rows'];
        $allUsers = User::all();
        $byEmid = $allUsers->keyBy(fn($u) => trim($u->emid));

        // Existing assignments for duplicate detection
        $existing = EvaluationAssignment::where('fiscal_year', $fiscalYear)
            ->get(['evaluator_id', 'evaluatee_id', 'angle'])
            ->mapWithKeys(fn($a) => ["{$a->evaluator_id}-{$a->evaluatee_id}-{$a->angle}" => true]);

        $previewRows = [];
        $unmatched = []; // name → ['count' => N, 'rows' => [...]]
        $angleCounts = ['self' => 0, 'top' => 0, 'bottom' => 0, 'left' => 0];

        foreach ($rows as $row) {
            $evaluatee = $row['emid'] ? ($byEmid[$row['emid']] ?? null) : null;
            $errors = [];
            $pairs = []; // [{angle, evaluator_id, name, status}]

            // Fallback: if emid empty/missing, try to find by name (fname+lname or fullname)
            if (!$evaluatee && (($row['fname'] ?? '') || ($row['lname'] ?? '') || ($row['fullname'] ?? ''))) {
                $nameToFind = trim(($row['fname'] ?? '') . ' ' . ($row['lname'] ?? ''));
                if (!$nameToFind && !empty($row['fullname'])) $nameToFind = $row['fullname'];
                $evaluatee = $this->findUserFuzzy($nameToFind, $allUsers);
                if ($evaluatee) {
                    $row['emid'] = $evaluatee->emid;  // backfill emid for downstream
                    $errors[] = "พบผู้ถูกประเมินจากชื่อ-สกุล (Excel ไม่ได้ใส่ emid) → ใช้ {$evaluatee->emid}";
                }
            }

            if (!$evaluatee) {
                $missingRef = $row['emid'] ?: trim(($row['fname'] ?? '') . ' ' . ($row['lname'] ?? '')) ?: ($row['fullname'] ?? '(ว่าง)');
                $previewRows[] = array_merge($row, [
                    'evaluatee_name' => null,
                    'grade'          => null,
                    'evaluation_id'  => null,
                    'pairs'          => [],
                    'status'         => 'evaluatee_not_found',
                    'errors'         => ["ไม่พบผู้ถูกประเมิน: {$missingRef}"],
                ]);
                continue;
            }

            $grade = (int) $evaluatee->grade;
            $userType = $evaluatee->user_type instanceof \BackedEnum
                ? $evaluatee->user_type->value
                : ($evaluatee->user_type ?? 'internal');

            $eval = EvaluationLookupService::findByGrade($grade, $userType, $fiscalYear);
            $evalId = $eval?->id;
            if (!$evalId) {
                $errors[] = "ไม่พบแบบประเมินสำหรับ grade={$grade} fy={$fiscalYear}";
            }

            // Process angles
            $cellMap = [
                'top'    => $row['top_cell'],
                'bottom' => $row['bottom_cell'],
                'left'   => $row['left_cell'],
            ];

            // self angle
            if ($row['self_marker'] === '/') {
                $supported = EvaluationLookupService::supportsAngle($grade, 'self');
                $dupKey = "{$evaluatee->id}-{$evaluatee->id}-self";
                $pairs[] = [
                    'angle'        => 'self',
                    'name'         => $evaluatee->fname . ' ' . $evaluatee->lname,
                    'evaluator_id' => $evaluatee->id,
                    'matched'      => true,
                    'unsupported'  => !$supported,
                    'duplicate'    => isset($existing[$dupKey]),
                ];
                if ($supported) $angleCounts['self']++;
            }

            // top/bottom/left
            foreach ($cellMap as $angle => $cellValue) {
                $names = $this->splitNames($cellValue);
                $supported = EvaluationLookupService::supportsAngle($grade, $angle);
                foreach ($names as $name) {
                    $user = $this->findUserFuzzy($name, $allUsers);
                    $userId = $user?->id;
                    $dupKey = $userId ? "{$userId}-{$evaluatee->id}-{$angle}" : null;
                    $pairs[] = [
                        'angle'        => $angle,
                        'name'         => $name,
                        'evaluator_id' => $userId,
                        'matched'      => (bool) $user,
                        'unsupported'  => !$supported,
                        'duplicate'    => $dupKey ? isset($existing[$dupKey]) : false,
                    ];
                    if (!$user) {
                        if (!isset($unmatched[$name])) {
                            $unmatched[$name] = ['name' => $name, 'count' => 0, 'angles' => []];
                        }
                        $unmatched[$name]['count']++;
                        $unmatched[$name]['angles'][$angle] = ($unmatched[$name]['angles'][$angle] ?? 0) + 1;
                    } elseif ($supported && !isset($existing[$dupKey])) {
                        $angleCounts[$angle]++;
                    }
                }
            }

            $hasUnmatched = collect($pairs)->contains(fn($p) => !$p['matched']);
            $hasUnsupported = collect($pairs)->contains(fn($p) => $p['unsupported']);
            $allDuplicate = count($pairs) > 0 && collect($pairs)->every(fn($p) => $p['duplicate'] || !$p['matched']);

            if (!$evalId) $status = 'no_evaluation';
            elseif ($hasUnmatched) $status = 'has_unmatched';
            elseif ($hasUnsupported) $status = 'unsupported_grade';
            elseif (count($pairs) === 0) $status = 'empty';
            elseif ($allDuplicate) $status = 'duplicate';
            else $status = 'ok';

            $previewRows[] = array_merge($row, [
                'evaluatee_name' => trim($evaluatee->prename . $evaluatee->fname . ' ' . $evaluatee->lname),
                'grade'          => $grade,
                'evaluation_id'  => $evalId,
                'pairs'          => $pairs,
                'status'         => $status,
                'errors'         => $errors,
            ]);
        }

        // Sort unmatched by count desc
        $unmatchedList = array_values($unmatched);
        usort($unmatchedList, fn($a, $b) => $b['count'] - $a['count']);

        return [
            'sheets'          => $parsed['sheets'],
            'rows'            => $previewRows,
            'unmatched_names' => $unmatchedList,
            'summary'         => [
                'total'             => count($previewRows),
                'ok'                => count(array_filter($previewRows, fn($r) => $r['status'] === 'ok')),
                'has_unmatched'     => count(array_filter($previewRows, fn($r) => $r['status'] === 'has_unmatched')),
                'no_evaluation'     => count(array_filter($previewRows, fn($r) => $r['status'] === 'no_evaluation')),
                'unsupported_grade' => count(array_filter($previewRows, fn($r) => $r['status'] === 'unsupported_grade')),
                'duplicate'         => count(array_filter($previewRows, fn($r) => $r['status'] === 'duplicate')),
                'evaluatee_not_found' => count(array_filter($previewRows, fn($r) => $r['status'] === 'evaluatee_not_found')),
                'angle_counts'      => $angleCounts,
            ],
        ];
    }

    /**
     * Execute import.
     * $rows: preview rows from buildPreview
     * $nameMappings: {originalName: user_id | 'skip'}
     */
    public function execute(array $rows, array $nameMappings, int $fiscalYear): array
    {
        return DB::transaction(function () use ($rows, $nameMappings, $fiscalYear) {
            $created = 0;
            $skipped = 0;
            $unsupported = 0;
            $duplicate = 0;
            $details = [];
            $evaluateeSummary = []; // [evaluatee_id => {emid, name, grade, sheet, row_no, angles: {self,top,bottom,left}}]

            foreach ($rows as $row) {
                if (in_array($row['status'], ['evaluatee_not_found', 'no_evaluation', 'empty'])) {
                    $skipped += count($row['pairs'] ?? []);
                    if (!empty($row['errors'])) {
                        $details[] = "Sheet \"{$row['sheet']}\" แถว {$row['row_no']}: ข้าม (" . implode(', ', $row['errors']) . ')';
                    }
                    continue;
                }

                $evalId = $row['evaluation_id'];
                $evaluateeEmid = $row['emid'];
                $evaluatee = User::where('emid', $evaluateeEmid)->first();
                if (!$evaluatee) { $skipped++; continue; }

                $rowCreated = ['self' => 0, 'top' => 0, 'bottom' => 0, 'left' => 0];
                $rowSkipped = 0;

                foreach ($row['pairs'] as $pair) {
                    $evaluatorId = $pair['evaluator_id'];

                    // Apply manual mapping if name was unmatched
                    if (!$pair['matched'] && isset($nameMappings[$pair['name']])) {
                        $mapping = $nameMappings[$pair['name']];
                        if ($mapping === 'skip') {
                            $skipped++;
                            $rowSkipped++;
                            continue;
                        }
                        if (is_numeric($mapping)) {
                            $evaluatorId = (int) $mapping;
                        }
                    }

                    if (!$evaluatorId) {
                        $skipped++;
                        $rowSkipped++;
                        continue;
                    }

                    if ($pair['unsupported']) {
                        $unsupported++;
                        continue;
                    }

                    // Re-check duplicate at insert time (race-safe)
                    $exists = EvaluationAssignment::where('evaluator_id', $evaluatorId)
                        ->where('evaluatee_id', $evaluatee->id)
                        ->where('fiscal_year', $fiscalYear)
                        ->where('angle', $pair['angle'])
                        ->exists();

                    if ($exists) {
                        $duplicate++;
                        continue;
                    }

                    EvaluationAssignment::create([
                        'evaluation_id' => $evalId,
                        'evaluator_id'  => $evaluatorId,
                        'evaluatee_id'  => $evaluatee->id,
                        'fiscal_year'   => $fiscalYear,
                        'angle'         => $pair['angle'],
                    ]);
                    $created++;
                    $rowCreated[$pair['angle']]++;
                }

                if (array_sum($rowCreated) > 0) {
                    $evaluateeSummary[] = [
                        'emid'     => $evaluatee->emid,
                        'name'     => trim($evaluatee->prename . $evaluatee->fname . ' ' . $evaluatee->lname),
                        'grade'    => (int) $evaluatee->grade,
                        'sheet'    => $row['sheet'],
                        'row_no'   => $row['row_no'],
                        'angles'   => $rowCreated,
                        'total'    => array_sum($rowCreated),
                        'skipped'  => $rowSkipped,
                    ];
                }

                $angleStr = collect($rowCreated)
                    ->filter(fn($v) => $v > 0)
                    ->map(fn($v, $k) => "{$k}={$v}")
                    ->join(', ');
                $details[] = "Sheet \"{$row['sheet']}\" แถว {$row['row_no']}: ✓ {$row['emid']} {$row['evaluatee_name']}"
                    . ($angleStr ? " ({$angleStr})" : '')
                    . ($rowSkipped ? " [skipped: {$rowSkipped}]" : '');
            }

            return compact('created', 'skipped', 'unsupported', 'duplicate', 'details', 'evaluateeSummary');
        });
    }

    // ────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────

    private function findHeaderRow(Worksheet $sheet): ?int
    {
        $highestRow = min(5, $sheet->getHighestDataRow());
        $highestCol = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());
        for ($r = 1; $r <= $highestRow; $r++) {
            for ($c = 1; $c <= $highestCol; $c++) {
                $v = trim((string) $sheet->getCell([$c, $r])->getValue());
                if ($v === 'รหัสพนักงาน' || $v === 'รหัส') return $r;
            }
        }
        return null;
    }

    private function detectColumns(Worksheet $sheet, int $headerRow): array
    {
        $cols = [];
        $highestCol = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());
        for ($c = 1; $c <= $highestCol; $c++) {
            $v = trim((string) $sheet->getCell([$c, $headerRow])->getValue());
            if (!$v) continue;
            $letter = Coordinate::stringFromColumnIndex($c);
            foreach (self::HEADER_KEYS as $key => $variants) {
                foreach ($variants as $variant) {
                    if ($v === $variant) {
                        // 'fname' variant is 'ชื่อ' which conflicts with 'ชื่อ-นามสกุล'
                        // Only set fname if exact match (already exact above)
                        if (!isset($cols[$key])) $cols[$key] = $letter;
                    }
                }
            }
        }
        return $cols;
    }

    /**
     * Read all cells in the column range that belong to a given angle, joined by newline.
     *
     * Two layouts both produce the same effect — adjacent columns to the right of an
     * angle header have an empty header cell:
     *
     * Pattern A — merged header (file 1 ผู้ว่าการ): "องศาบน" merged across G:H. PhpSpreadsheet
     * returns the value only at G; H is empty.
     *
     * Pattern B — implicit extension (file 6 ปฏิบัติการ 3): only L="องศาซ้าย"; M, N have no
     * header but contain peer-name lists for the same angle.
     *
     * Algorithm: $end is bounded by the next angle column (if present). Otherwise $end
     * extends through empty-header columns and stops at the first non-empty non-angle
     * header (e.g. "หมายเหตุ") or at getHighestDataColumn().
     */
    private function readAngleRange(Worksheet $sheet, array $cols, int $headerRow, string $angle, int $row): string
    {
        if (!isset($cols[$angle])) return '';
        $start = Coordinate::columnIndexFromString($cols[$angle]);

        $nextStart = null;
        foreach (['top', 'bottom', 'left', 'right'] as $other) {
            if ($other === $angle || !isset($cols[$other])) continue;
            $oc = Coordinate::columnIndexFromString($cols[$other]);
            if ($oc > $start && ($nextStart === null || $oc < $nextStart)) {
                $nextStart = $oc;
            }
        }

        if ($nextStart !== null) {
            $end = $nextStart - 1;
        } else {
            // Last angle — extend through empty-header columns. Stop at first non-empty,
            // non-angle header (e.g. "หมายเหตุ") or at end of data area.
            $highest = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());
            $angleHeaders = ['องศาบน', 'องศาล่าง', 'องศาซ้าย', 'องศาขวา'];
            $end = $start;
            for ($c = $start + 1; $c <= $highest; $c++) {
                $h = trim((string) $sheet->getCell([$c, $headerRow])->getValue());
                if ($h === '' || in_array($h, $angleHeaders, true)) {
                    $end = $c;
                } else {
                    break;
                }
            }
        }

        $parts = [];
        for ($c = $start; $c <= $end; $c++) {
            $v = (string) $sheet->getCell([$c, $row])->getValue();
            if (trim($v) !== '') $parts[] = $v;
        }
        return implode("\n", $parts);
    }

    private function splitNames(?string $cellValue): array
    {
        if (!$cellValue) return [];
        $val = trim($cellValue);
        if ($val === '' || $val === 'ไม่มี') return [];

        $names = [];
        foreach (preg_split('/[\n,]+/', $val) as $line) {
            $name = trim($line);
            if ($name === '' || $name === 'ไม่มี') continue;
            // Strip leading numbering / bullet: "1 ", "1. ", "1) ", "- ", " - "
            $name = preg_replace('/^(\d+[\.\)]?\s+|\-\s+)/u', '', $name);
            $name = trim($name);
            if ($name !== '' && $name !== 'ไม่มี') $names[] = $name;
        }
        return $names;
    }

    /**
     * Fuzzy match name → User. Ported from AdminEvaluationAssignmentController.
     */
    private function findUserFuzzy(string $name, Collection $allUsers): ?User
    {
        $name = trim($name);
        if ($name === '') return null;

        // 1. Exact emid
        if (preg_match('/^\d+$/', $name)) {
            $u = $allUsers->firstWhere('emid', $name);
            if ($u) return $u;
        }

        // 2. Exact full name match
        foreach ($allUsers as $u) {
            $full = trim($u->prename . $u->fname . ' ' . $u->lname);
            $short = trim($u->fname . ' ' . $u->lname);
            if ($name === $full || $name === $short) return $u;
        }

        // 3. Strip prefix → split into words
        $clean = preg_replace('/^(ว่าที่ร้อยตรี|น\.ส\.|นางสาว|นาง|นาย|ดร\.)\s*/u', '', $name);
        $clean = trim($clean);
        // Strip role/title suffixes like "(1)", "(2)", trailing dots etc.
        $clean = preg_replace('/\(\d+\)/u', '', $clean);
        $parts = array_values(array_filter(preg_split('/\s+/', $clean), fn($p) => trim($p) !== ''));

        if (count($parts) >= 2) {
            $fname = $parts[0];

            // Try parts[0] + parts[1] as fname+lname (titles often follow lname)
            $lname2 = $parts[1];
            $match = $allUsers->first(fn($u) => $u->fname === $fname && $u->lname === $lname2);
            if ($match) return $match;

            // Try parts[0] + parts[last] as fname+lname (rare: title between)
            $lnameLast = $parts[count($parts) - 1];
            if ($lnameLast !== $lname2) {
                $match = $allUsers->first(fn($u) => $u->fname === $fname && $u->lname === $lnameLast);
                if ($match) return $match;
            }

            // Try every middle pair (parts[0] + parts[i]) — handles "fname middle lname title"
            for ($i = 2; $i < count($parts) - 1; $i++) {
                $match = $allUsers->first(fn($u) => $u->fname === $fname && $u->lname === $parts[$i]);
                if ($match) return $match;
            }

            // NOTE: do NOT fallback to fname-only when input has ≥ 2 parts.
            // If lname is provided but doesn't match any user, it's likely an external person
            // (board member, advisor, ministry rep) whose first name coincidentally matches
            // an internal user. Returning null lets admin manually map / skip in UI.
        }

        // 4. Partial match on full name (only if cell looks like personal name — has prename hint)
        foreach ($allUsers as $u) {
            $full = trim($u->prename . $u->fname . ' ' . $u->lname);
            $short = trim($u->fname . ' ' . $u->lname);
            // Substring match either direction
            if (str_contains($name, $short) || str_contains($name, $full)) return $u;
        }

        // 5. fname-only fallback — only when input is a single token (no lname provided)
        if (count($parts) === 1 && !empty($parts[0])) {
            $fnameMatches = $allUsers->filter(fn($u) => $u->fname === $parts[0]);
            if ($fnameMatches->count() === 1) return $fnameMatches->first();
        }

        return null;
    }
}
