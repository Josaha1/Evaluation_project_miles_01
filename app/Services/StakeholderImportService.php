<?php

namespace App\Services;

use App\Models\EvaluationAssignment;
use App\Models\ExternalAccessCode;
use App\Models\ExternalOrganization;
use App\Models\ExternalStakeholder;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Bulk-import "องศาขวา" (right angle) stakeholders from Excel.
 *
 * Layout: 1 sheet = 1 evaluatee. Sheet columns:
 *   A: stakeholder group label (e.g., "คู่ค้าหรือคู่ความร่วมมือ")
 *   B: definition text — first line is the sub-group ("คู่ค้า" / "คู่ความร่วมมือ")
 *   C: ชื่อหน่วยงาน/บริษัท — prefixed with "1)", "2)" etc.
 *   D: ผู้ติดต่อ (name)
 *   E: ข้อมูลติดต่อ (phone / email)
 *   F: ชื่อ+เบอร์ติดต่อผู้ประสานงานของหน่วยงานท่าน
 *   G: รหัสพนักงาน — emid of evaluatee (typically G4)
 *
 * For each (evaluatee × group) it creates:
 *   - external_organizations row (firstOrCreate by name, shared)
 *   - external_access_codes row (idempotent on (org, evaluatee, fy))
 *   - external_code_evaluatees pivot row
 *   - external_stakeholders rows for every filled stakeholder line
 *
 * Does NOT create EvaluationAssignment (evaluator_id is NOT NULL FK).
 */
class StakeholderImportService
{
    /**
     * Header text → logical column key. Auto-detection scans R3 to map letters.
     * Multiple aliases per key cover the 4 known template variants:
     *
     *  Variant A (legacy 6-col): กลุ่ม | นิยาม | ชื่อหน่วยงาน | ผู้ติดต่อ | ติดต่อ | ผู้ประสาน
     *  Variant B (legacy + emid): + รหัสพนักงาน at G3
     *  Variant C (new 7-col w/ nikom staff): กลุ่ม | นิยาม | ชื่อ-นามสกุลผู้ติดต่อนิคมฯ | ชื่อหน่วยงาน | ผู้ติดต่อ | ติดต่อ | หมายเหตุ
     *      → emid in row 2 of the column whose header (R1) is "รหัส"
     *  Variant D (variant C, no emid): same as C but no emid header
     */
    private const HEADER_KEYS = [
        'group'          => ['กลุ่ม Stakeholder', 'กลุ่ม'],
        'definition'     => ['นิยาม'],
        'nikom_staff'    => ['ชื่อ-นามสกุลผู้ติดต่อประสานงานนิคมฯ', 'ชื่อ-นามสกุลผู้ประสานงาน'],
        'org_name'       => ['ชื่อหน่วยงาน/บริษัท', 'ชื่อหน่วยงาน', 'หน่วยงาน/บริษัท'],
        'contact_person' => ['ผู้ติดต่อ/ประสานงาน', 'ผู้ติดต่อ', 'ผู้ประเมิน'],
        'contact_info'   => ['ข้อมูลติดต่อ', 'ข้อมูลติดต่อ ' . "\n" . '(เบอร์โทรศัพท์/อีเมล)'],
        'coordinator'    => ['ชื่อและเบอร์ติดต่อผู้ประสานงาน' . "\n" . 'ของหน่วยงานท่าน', 'หมายเหตุ'],
        'emid'           => ['รหัสพนักงาน', 'รหัส'],
    ];
    private const FIRST_DATA_ROW = 4;
    private const DEFAULT_MAX_USES = 10;
    /** Cap data row scan — guards against sheets with inflated max_row (e.g. 1000 from styling) */
    private const MAX_DATA_ROWS = 200;
    /** Marker text in R3C1 that identifies a stakeholder template sheet */
    private const TEMPLATE_MARKER = 'กลุ่ม Stakeholder';

    public function parseFile(string $path): array
    {
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($path);

        $rows = [];
        $sheets = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $title = $sheet->getTitle();
            $titleClean = trim($title);

            // Gate: only sheets with the template marker in R3C1 are stakeholder templates.
            if (!$this->isStakeholderTemplate($sheet)) {
                $sheets[] = ['sheet' => $title, 'valid' => false, 'reason' => 'not_template'];
                continue;
            }

            $cols = $this->detectColumns($sheet);

            // Locate the header row (where "กลุ่ม Stakeholder" lives). Templates put
            // it at row 3, 5, or sometimes elsewhere — auto-detect for correct data range.
            $headerRow = $cols['group_row'] ?? 3;

            // A sheet may list MULTIPLE evaluatees in the rows BETWEEN the emid header
            // and the group header (e.g. 3 directors sharing one office's stakeholder list).
            // Collect them all; if only 1 → standard single-evaluatee mode.
            $evaluatees = $this->extractEvaluatees($sheet, $cols, $headerRow);

            $groups = $this->extractGroups($sheet, $title, $cols, $headerRow);
            if (empty($groups)) {
                $sheets[] = ['sheet' => $title, 'valid' => false, 'reason' => 'no_groups'];
                continue;
            }

            // Emit one parsed row per evaluatee — all share the same group/stakeholder lists
            foreach ($evaluatees as $i => $ev) {
                $rows[] = [
                    'sheet'           => $title,
                    'sheet_clean'     => $titleClean,
                    'r2c1'            => $ev['name'] ?? trim((string) $sheet->getCell('A2')->getValue()),
                    'emid'            => $ev['emid'] ?? null,
                    'groups'          => $groups,
                    'multi_index'     => $i,                    // 0,1,2 when sheet has 3 evaluatees
                    'multi_total'     => count($evaluatees),
                ];
            }
            $sheets[] = [
                'sheet'  => $title,
                'valid'  => true,
                'reason' => null,
                'evaluatees_in_sheet' => count($evaluatees),  // ≥ 2 means multi-evaluatee sheet
            ];
        }

        return ['rows' => $rows, 'sheets' => $sheets];
    }

    /**
     * @param int|null $defaultEvaluateeId admin-supplied fallback for sheets where
     *                                     emid + sheet/R2 fuzzy all fail (e.g. ผู้ว่าการ
     *                                     file where every sheet evaluates the same user)
     */
    public function buildPreview(array $parsed, int $fiscalYear, ?int $defaultEvaluateeId = null): array
    {
        $rows = $parsed['rows'];

        $allUsers = User::all();
        $usersByEmid = $allUsers->keyBy(fn ($u) => trim((string) $u->emid));
        $defaultEvaluatee = $defaultEvaluateeId ? $allUsers->firstWhere('id', $defaultEvaluateeId) : null;

        foreach ($rows as $i => &$row) {
            [$evaluatee, $matchSource] = $this->resolveEvaluatee($row, $usersByEmid, $allUsers);
            // Fallback: use admin-supplied default
            if (!$evaluatee && $defaultEvaluatee) {
                $evaluatee = $defaultEvaluatee;
                $matchSource = 'default';
            }
            $row['_evaluatee'] = $evaluatee;
            $row['match_source'] = $matchSource;
        }
        unset($row);

        $resolvedIds = collect($rows)->pluck('_evaluatee')->filter()->pluck('id')->unique()->values();
        $existingCodes = ExternalAccessCode::with('organization:id,name')
            ->where('fiscal_year', $fiscalYear)
            ->whereIn('evaluatee_id', $resolvedIds)
            ->get()
            ->mapWithKeys(function ($c) {
                $orgName = $c->organization?->name ?? '';
                return ["{$orgName}|{$c->evaluatee_id}" => $c];
            });

        $previewRows = [];
        $totals = [
            'total_sheets'           => count($parsed['sheets']),
            'valid_sheets'           => count($rows),
            'skipped_sheets'         => count($parsed['sheets']) - count($rows),
            'codes_to_create'        => 0,
            'codes_duplicate'        => 0,
            'stakeholders_to_create' => 0,
            'evaluatee_not_found'    => 0,
            'no_evaluation'          => 0,
            'matched_by_emid'        => 0,
            'matched_by_sheet_name'  => 0,
        ];

        foreach ($rows as $row) {
            $evaluatee = $row['_evaluatee'] ?? null;
            $matchSource = $row['match_source'] ?? null;
            unset($row['_evaluatee']);

            if (!$evaluatee) {
                $hint = $row['emid'] ?: $row['sheet_clean'];
                $previewRows[] = array_merge($row, [
                    'evaluatee_id'   => null,
                    'evaluatee_name' => null,
                    'grade'          => null,
                    'evaluation_id'  => null,
                    'status'         => 'evaluatee_not_found',
                    'errors'         => ["ไม่พบผู้ถูกประเมินจาก emid หรือชื่อ sheet: \"{$hint}\""],
                ]);
                $totals['evaluatee_not_found']++;
                continue;
            }

            if ($matchSource === 'g4_emid') $totals['matched_by_emid']++;
            elseif ($matchSource === 'sheet_name') $totals['matched_by_sheet_name']++;

            $grade = (int) $evaluatee->grade;
            $eval = EvaluationLookupService::findByGrade($grade, 'external', $fiscalYear);
            $evalId = $eval?->id;
            $errors = [];
            if (!$evalId) {
                $errors[] = "ไม่พบแบบประเมิน external สำหรับ grade={$grade} fy={$fiscalYear}";
                $totals['no_evaluation']++;
            }

            $annotatedGroups = [];
            foreach ($row['groups'] as $g) {
                $key = "{$g['label']}|{$evaluatee->id}";
                $isDup = isset($existingCodes[$key]);
                $filledCount = count(array_filter(
                    $g['stakeholders'],
                    fn ($s) => !empty(trim((string) ($s['organization_name'] ?? '')))
                ));
                $isEmpty = $filledCount === 0;
                $annotatedGroups[] = array_merge($g, [
                    'duplicate'         => $isDup,
                    'empty'             => $isEmpty,
                    'existing_code'     => $isDup ? $existingCodes[$key]->code : null,
                    'stakeholder_count' => $filledCount,
                ]);
                if ($isEmpty) {
                    $totals['empty_groups'] = ($totals['empty_groups'] ?? 0) + 1;
                } elseif ($isDup) {
                    $totals['codes_duplicate']++;
                } elseif ($evalId) {
                    $totals['codes_to_create']++;
                    $totals['stakeholders_to_create'] += $filledCount;
                }
            }

            // Status precedence: no_evaluation > all_empty > all_duplicate > ok
            $allEmpty = collect($annotatedGroups)->every(fn ($g) => $g['empty']);
            $allDupOrEmpty = collect($annotatedGroups)->every(fn ($g) => $g['duplicate'] || $g['empty']);
            $status = !$evalId
                ? 'no_evaluation'
                : ($allEmpty ? 'all_empty' : ($allDupOrEmpty ? 'duplicate' : 'ok'));

            $previewRows[] = array_merge($row, [
                'evaluatee_id'   => $evaluatee->id,
                'evaluatee_name' => trim(($evaluatee->prename ?? '') . ($evaluatee->fname ?? '') . ' ' . ($evaluatee->lname ?? '')),
                'grade'          => $grade,
                'evaluation_id'  => $evalId,
                'groups'         => $annotatedGroups,
                'status'         => $status,
                'errors'         => $errors,
            ]);
        }

        return [
            'sheets'  => $parsed['sheets'],
            'rows'    => $previewRows,
            'summary' => $totals,
        ];
    }

    /**
     * Execute import.
     *
     * @param array $rows         preview rows
     * @param int   $fiscalYear
     * @param array $mappings     [sheet_title => user_id | 'skip'] — admin override
     *                            for rows where auto-resolution failed.
     */
    public function execute(array $rows, int $fiscalYear, array $mappings = []): array
    {
        // Apply manual mappings to unresolved rows BEFORE transaction —
        // re-run buildPreview-style resolution with the override applied.
        $rows = $this->applyMappings($rows, $fiscalYear, $mappings);

        return DB::transaction(function () use ($rows, $fiscalYear) {
            $createdOrgs = 0;
            $createdCodes = 0;
            $createdStakeholders = 0;
            $skippedDuplicate = 0;
            $skippedNoEvaluatee = 0;
            $skippedNoEvaluation = 0;
            $skippedEmptyGroups = 0;
            $details = [];
            $codeSummary = [];
            $codesByOrg = []; // [(org_id) => $accessCode]  shared across evaluatees within fy

            foreach ($rows as $row) {
                if (($row['status'] ?? null) === 'evaluatee_not_found') {
                    $skippedNoEvaluatee += count($row['groups'] ?? []);
                    $details[] = "Sheet \"{$row['sheet']}\": ข้าม (ไม่พบผู้ถูกประเมิน emid={$row['emid']})";
                    continue;
                }
                if (($row['status'] ?? null) === 'no_evaluation') {
                    $skippedNoEvaluation += count($row['groups'] ?? []);
                    $details[] = "Sheet \"{$row['sheet']}\": ข้าม (ไม่พบแบบประเมิน external)";
                    continue;
                }

                $evaluatee = User::find($row['evaluatee_id']);
                if (!$evaluatee) { $skippedNoEvaluatee++; continue; }

                $evalId = $row['evaluation_id'];
                if (!$evalId) { $skippedNoEvaluation++; continue; }

                foreach ($row['groups'] as $group) {
                    $orgName = $group['label'];

                    // EARLY SKIP: if no real stakeholder names in col C/D for this group,
                    // don't create org/code — admin left it blank intentionally.
                    $filledStakeholders = array_values(array_filter(
                        $group['stakeholders'] ?? [],
                        fn ($s) => !empty(trim((string) ($s['organization_name'] ?? '')))
                    ));
                    if (count($filledStakeholders) === 0) {
                        $skippedEmptyGroups++;
                        $details[] = "Sheet \"{$row['sheet']}\": ⊘ ข้าม {$orgName} (ไม่มีรายชื่อหน่วยงาน/บริษัท)";
                        $codeSummary[] = [
                            'sheet'              => $row['sheet'],
                            'evaluatee'          => $row['evaluatee_name'],
                            'emid'               => $row['emid'],
                            'group'              => $orgName,
                            'code'               => null,
                            'max_uses'           => null,
                            'stakeholders_new'   => 0,
                            'stakeholders_total' => 0,
                            'status'             => 'skipped_empty',
                        ];
                        continue;
                    }

                    // 1. External organization (1 row per group label, shared globally)
                    $orgBefore = ExternalOrganization::where('name', $orgName)->exists();
                    $org = ExternalOrganization::firstOrCreate(
                        ['name' => $orgName],
                        ['org_code' => $this->generateOrgCode($orgName), 'is_active' => true]
                    );
                    if (!$orgBefore) $createdOrgs++;

                    // 2. Access code — 1 PER (group × fy), SHARED across evaluatees
                    $cacheKey = "{$org->id}|{$fiscalYear}";
                    if (!isset($codesByOrg[$cacheKey])) {
                        $existing = ExternalAccessCode::where('external_organization_id', $org->id)
                            ->where('fiscal_year', $fiscalYear)
                            ->whereNull('evaluatee_id')
                            ->first();
                        if ($existing) {
                            $codesByOrg[$cacheKey] = $existing;
                            $codeStatus = 'duplicate';
                            $skippedDuplicate++;
                        } else {
                            $codesByOrg[$cacheKey] = ExternalAccessCode::create([
                                'code'                     => $this->generateUniqueCode($org->org_code),
                                'external_organization_id' => $org->id,
                                'evaluatee_id'             => null,
                                'evaluation_id'            => null,
                                'fiscal_year'              => $fiscalYear,
                                'max_uses'                 => null,  // unlimited — N evaluatees × M stakeholders
                                'expires_at'               => null,
                            ]);
                            $createdCodes++;
                            $codeStatus = 'created';
                        }
                    } else {
                        $codeStatus = 'duplicate';
                    }
                    $code = $codesByOrg[$cacheKey];

                    // 3. Pivot row — adds this evaluatee to the code's coverage
                    DB::table('external_code_evaluatees')->insertOrIgnore([
                        'external_access_code_id' => $code->id,
                        'evaluatee_id'            => $evaluatee->id,
                        'evaluation_id'           => $evalId,
                        'created_at'              => now(),
                        'updated_at'              => now(),
                    ]);

                    // 4. Stakeholder rows for THIS evaluatee under the shared code
                    //    (filledStakeholders already computed before code creation)
                    $stakeholderInsertCount = 0;
                    foreach ($filledStakeholders as $s) {
                        $created = ExternalStakeholder::firstOrCreate(
                            [
                                'external_access_code_id' => $code->id,
                                'evaluatee_id'            => $evaluatee->id,
                                'sequence_no'             => $s['sequence_no'] ?: '',
                                'organization_name'       => $s['organization_name'],
                            ],
                            [
                                'fiscal_year'     => $fiscalYear,
                                'group_label'     => $orgName,
                                'sub_group'       => $s['sub_group'],
                                'contact_person'  => $s['contact_person'],
                                'contact_info'    => $s['contact_info'],
                                'coordinator'     => $s['coordinator'],
                                'source_sheet'    => $row['sheet'],
                                'source_row'      => $s['source_row'],
                            ]
                        );
                        if ($created->wasRecentlyCreated) {
                            $createdStakeholders++;
                            $stakeholderInsertCount++;
                        }
                    }

                    $details[] = "Sheet \"{$row['sheet']}\": " .
                        ($codeStatus === 'created' ? "✓ สร้าง code" : "→ ใช้ code เดิม") .
                        " {$orgName} = {$code->code} · +{$stakeholderInsertCount} stakeholders";

                    // Effective row status:
                    //   'created'         = new code + new pivot + new stakeholders
                    //   'shared'          = code reused but THIS evaluatee added new pivot/stakeholders
                    //   'duplicate'       = nothing new (true re-import)
                    $rowStatus = $codeStatus;
                    if ($codeStatus === 'duplicate' && $stakeholderInsertCount > 0) {
                        $rowStatus = 'shared';
                    }

                    $codeSummary[] = [
                        'sheet'              => $row['sheet'],
                        'evaluatee'          => $row['evaluatee_name'],
                        'emid'               => $row['emid'],
                        'group'              => $orgName,
                        'code'               => $code->code,
                        'max_uses'           => null,
                        'stakeholders_new'   => $stakeholderInsertCount,
                        'stakeholders_total' => count($filledStakeholders),
                        'status'             => $rowStatus,
                    ];
                }
            }

            cache()->forget('access_code_fiscal_years');

            return [
                'created_orgs'         => $createdOrgs,
                'created_codes'        => $createdCodes,
                'created_stakeholders' => $createdStakeholders,
                'skipped_duplicate'    => $skippedDuplicate,
                'skipped_no_evaluatee' => $skippedNoEvaluatee,
                'skipped_no_evaluation'=> $skippedNoEvaluation,
                'skipped_empty_groups' => $skippedEmptyGroups,
                'details'              => $details,
                'code_summary'         => $codeSummary,
            ];
        });
    }

    // ────────────────────────────────────────────────
    // Parsing helpers
    // ────────────────────────────────────────────────

    /**
     * Scan R1-R5 to map header text → column letter. Templates differ wildly in
     * column ordering — we never hardcode column letters.
     *
     * @return array<string, string>
     */
    private function detectColumns(Worksheet $sheet): array
    {
        $cols = [];
        $highestCol = Coordinate::columnIndexFromString($sheet->getHighestDataColumn());
        for ($r = 1; $r <= 5; $r++) {
            for ($c = 1; $c <= min($highestCol, 30); $c++) {
                $raw = trim((string) $sheet->getCell([$c, $r])->getValue());
                if ($raw === '') continue;
                $letter = Coordinate::stringFromColumnIndex($c);
                foreach (self::HEADER_KEYS as $key => $variants) {
                    foreach ($variants as $variant) {
                        if ($raw === $variant || str_starts_with($raw, $variant)) {
                            if (!isset($cols[$key])) {
                                $cols[$key] = $letter;
                                $cols[$key . '_row'] = $r;
                            }
                        }
                    }
                }
            }
        }
        $cols['group']      = $cols['group']      ?? 'A';
        $cols['group_row']  = $cols['group_row']  ?? 3;
        $cols['definition'] = $cols['definition'] ?? 'B';

        // Legacy fallback: if `nikom_staff` is NOT detected → assume legacy 6-col layout
        // (org_name=C, contact_person=D, contact_info=E, coordinator=F).
        // This keeps existing tests + simple-fixture imports working.
        if (!isset($cols['nikom_staff'])) {
            $cols['org_name']       = $cols['org_name']       ?? 'C';
            $cols['contact_person'] = $cols['contact_person'] ?? 'D';
            $cols['contact_info']   = $cols['contact_info']   ?? 'E';
            $cols['coordinator']    = $cols['coordinator']    ?? 'F';
        }
        return $cols;
    }

    /**
     * Extract list of evaluatees from rows BETWEEN the emid header and the
     * group header. Most sheets have 1 evaluatee here; some have 2-3 (e.g.
     * "สำนักงานนิคมอุตสาหกรรมมาบตาพุด" lists 3 directors sharing one
     * stakeholder template).
     *
     * Returns ≥1 entry: [{emid, name (R2-style)}, ...]. Always returns at
     * least one element (the first emid found, or null) so caller can iterate.
     *
     * @return array<int, array{emid:?string, name:?string, row:int}>
     */
    private function extractEvaluatees(Worksheet $sheet, array $cols, int $headerRow): array
    {
        $evaluatees = [];

        if (isset($cols['emid'])) {
            $emidCol = $cols['emid'];
            $emidHeaderRow = $cols['emid_row'] ?? 1;
            // Scan rows between emid header and group header for (emid, name) pairs
            for ($r = $emidHeaderRow + 1; $r < $headerRow; $r++) {
                $emid = trim((string) $sheet->getCell($emidCol . $r)->getValue());
                if (!preg_match('/^\d+$/', $emid)) continue;
                // Name from col A (most common) — strip trailing facility name
                $name = trim((string) $sheet->getCell('A' . $r)->getValue());
                $evaluatees[] = ['emid' => $emid, 'name' => $name, 'row' => $r];
            }
        }

        // Fallback: single evaluatee from broad emid sweep
        if (empty($evaluatees)) {
            $emid = $this->extractEmid($sheet, $cols);
            $r2 = trim((string) $sheet->getCell('A2')->getValue());
            $evaluatees[] = ['emid' => $emid, 'name' => $r2, 'row' => 2];
        }

        return $evaluatees;
    }

    /**
     * Extract emid by scanning the column under the "รหัสพนักงาน" / "รหัส" header
     * for a numeric value. Falls back to a broad sweep of rows 1-5 / cols 1-15.
     */
    private function extractEmid(Worksheet $sheet, array $cols): ?string
    {
        if (isset($cols['emid'])) {
            $col = $cols['emid'];
            $headerRow = $cols['emid_row'] ?? 3;
            for ($r = $headerRow + 1; $r <= $headerRow + 5; $r++) {
                $v = trim((string) $sheet->getCell($col . $r)->getValue());
                if ($v !== '' && preg_match('/^\d+$/', $v)) return $v;
            }
        }
        // Last-resort sweep — rows 1-5 × cols 1-15 for 5-7 digit numbers
        for ($r = 1; $r <= 5; $r++) {
            for ($c = 1; $c <= 15; $c++) {
                $v = trim((string) $sheet->getCell([$c, $r])->getValue());
                if (preg_match('/^\d{5,7}$/', $v)) return $v;
            }
        }
        return null;
    }

    /**
     * Walk column A from row 4 down. Each non-empty A starts a new group.
     * Within each group, capture all stakeholder lines (full row data).
     * Sub-group is tracked from the first line of column B (carries forward).
     *
     * @return array<int, array{label:string, row_start:int, stakeholders:array<int, array>}>
     */
    private function extractGroups(Worksheet $sheet, string $sheetTitle, array $cols, ?int $headerRow = null): array
    {
        // Data starts the row AFTER the header. Default to legacy R3 header → R4 first data.
        $firstDataRow = ($headerRow ?? 3) + 1;
        // Cap iteration — guards against sheets where Excel reports inflated max_row (e.g. 1000)
        $highest = min($sheet->getHighestDataRow(), $firstDataRow + self::MAX_DATA_ROWS);
        if ($highest < $firstDataRow) return [];

        $groupCol      = $cols['group']      ?? 'A';
        $defCol        = $cols['definition'] ?? 'B';
        $orgCol        = $cols['org_name']   ?? 'C'; // missing → assume legacy variant
        $contactCol    = $cols['contact_person'] ?? null;
        $infoCol       = $cols['contact_info']   ?? null;
        $coordinatorCol = $cols['coordinator']    ?? null;

        $boundaries = [];
        for ($r = $firstDataRow; $r <= $highest; $r++) {
            $label = trim((string) $sheet->getCell($groupCol . $r)->getValue());
            if ($label !== '') {
                $boundaries[] = ['row' => $r, 'label' => $label];
            }
        }
        if (empty($boundaries)) return [];

        $groups = [];
        foreach ($boundaries as $i => $b) {
            $startRow = $b['row'];
            $endRow = isset($boundaries[$i + 1]) ? $boundaries[$i + 1]['row'] - 1 : $highest;

            $currentSubGroup = null;
            $stakeholders = [];

            for ($r = $startRow; $r <= $endRow; $r++) {
                $defRaw = trim((string) $sheet->getCell($defCol . $r)->getValue());
                if ($defRaw !== '') {
                    $firstLine = trim(strtok($defRaw, "\n"));
                    if ($firstLine !== '') $currentSubGroup = $firstLine;
                }

                $orgRaw = trim((string) $sheet->getCell($orgCol . $r)->getValue());
                [$seq, $orgName] = $this->parseOrgCell($orgRaw);

                $contactPerson = $contactCol
                    ? $this->cleanContact(trim((string) $sheet->getCell($contactCol . $r)->getValue()))
                    : null;
                $contactInfo = $infoCol
                    ? (trim((string) $sheet->getCell($infoCol . $r)->getValue()) ?: null)
                    : null;
                $coordinator = $coordinatorCol
                    ? (trim((string) $sheet->getCell($coordinatorCol . $r)->getValue()) ?: null)
                    : null;

                $stakeholders[] = [
                    'source_row'        => $r,
                    'sub_group'         => $currentSubGroup,
                    'sequence_no'       => $seq,
                    'organization_name' => $orgName,
                    'contact_person'    => $contactPerson,
                    'contact_info'      => $contactInfo,
                    'coordinator'       => $coordinator,
                ];
            }

            $groups[] = [
                'label'        => $b['label'],
                'row_start'    => $startRow,
                'stakeholders' => $stakeholders,
            ];
        }
        return $groups;
    }

    /**
     * Split "1) บริษัท ก จำกัด" into ["1)", "บริษัท ก จำกัด"].
     * Returns ['', ''] for empty cells, ['1)', ''] for bullet-only placeholders.
     */
    private function parseOrgCell(string $cell): array
    {
        if ($cell === '') return ['', ''];
        if (preg_match('/^(\d+[\.\)])\s*(.*)$/u', $cell, $m)) {
            $rest = trim($m[2]);
            // Has at least 3 letters → real org name
            $hasName = (bool) preg_match('/[\p{L}]{3,}/u', $rest);
            return [$m[1], $hasName ? $rest : ''];
        }
        $hasName = (bool) preg_match('/[\p{L}]{3,}/u', $cell);
        return ['', $hasName ? $cell : ''];
    }

    /**
     * Strip "ชื่อ-นามสกุล :" prefix from contact column. Return null when empty.
     */
    private function cleanContact(string $cell): ?string
    {
        if ($cell === '') return null;
        $stripped = preg_replace('/^ชื่อ\s*-\s*นามสกุล\s*:\s*/u', '', $cell);
        $stripped = trim((string) $stripped);
        return $stripped === '' ? null : $stripped;
    }

    // ────────────────────────────────────────────────
    // Code generation
    // ────────────────────────────────────────────────

    /**
     * Apply admin mapping overrides to preview rows.
     *
     * For each row whose status is 'evaluatee_not_found' (or whose sheet is in $mappings):
     *   - mapping = 'skip' → leave row marked as evaluatee_not_found (will be skipped in execute)
     *   - mapping = user_id → re-resolve evaluatee + grade + evaluation, mark match_source='manual'
     *
     * Mappings keyed on the original (untrimmed) sheet title — same as preview row['sheet'].
     */
    private function applyMappings(array $rows, int $fiscalYear, array $mappings): array
    {
        if (empty($mappings)) return $rows;

        // Pre-resolve users referenced in mappings
        $userIds = collect($mappings)
            ->filter(fn ($v) => $v !== 'skip' && $v !== '' && $v !== null)
            ->map(fn ($v) => (int) $v)
            ->unique()
            ->values()
            ->all();
        $usersById = empty($userIds)
            ? collect()
            : User::whereIn('id', $userIds)->get()->keyBy('id');

        foreach ($rows as &$row) {
            $sheet = $row['sheet'] ?? null;
            if ($sheet === null || !array_key_exists($sheet, $mappings)) continue;

            $mapping = $mappings[$sheet];
            if ($mapping === 'skip' || $mapping === '' || $mapping === null) {
                // Keep row state — execute() will skip not_found rows
                $row['mapping_applied'] = 'skip';
                continue;
            }

            $userId = (int) $mapping;
            $user = $usersById[$userId] ?? null;
            if (!$user) continue;

            $grade = (int) $user->grade;
            $eval = EvaluationLookupService::findByGrade($grade, 'external', $fiscalYear);

            $row['evaluatee_id']   = $user->id;
            $row['evaluatee_name'] = trim(($user->prename ?? '') . ($user->fname ?? '') . ' ' . ($user->lname ?? ''));
            $row['grade']          = $grade;
            $row['evaluation_id']  = $eval?->id;
            $row['emid']           = (string) $user->emid;
            $row['match_source']   = 'manual';
            $row['mapping_applied'] = 'mapped';
            $row['status']         = $eval ? 'ok' : 'no_evaluation';
            $row['errors']         = $eval ? [] : ["ไม่พบแบบประเมิน external สำหรับ grade={$grade} fy={$fiscalYear}"];
        }
        unset($row);
        return $rows;
    }

    /**
     * Sheet is a stakeholder template if "กลุ่ม Stakeholder" appears anywhere
     * in the header row scan area (R1-R5, cols 1-15). Some templates put the
     * label at B3 (with emid header at A3).
     */
    private function isStakeholderTemplate(Worksheet $sheet): bool
    {
        for ($r = 1; $r <= 5; $r++) {
            for ($c = 1; $c <= 15; $c++) {
                $v = trim((string) $sheet->getCell([$c, $r])->getValue());
                if ($v !== '' && str_contains($v, self::TEMPLATE_MARKER)) return true;
            }
        }
        return false;
    }

    /**
     * Resolve evaluatee from a parsed row — emid first, sheet name second.
     * Returns [User|null, source] where source is 'g4_emid' / 'sheet_name' / null.
     */
    private function resolveEvaluatee(array $row, Collection $usersByEmid, Collection $allUsers): array
    {
        // 1. emid
        $emid = trim((string) ($row['emid'] ?? ''));
        if ($emid !== '' && isset($usersByEmid[$emid])) {
            return [$usersByEmid[$emid], 'emid'];
        }

        // 2. Sheet name fuzzy
        $hint = trim((string) ($row['sheet_clean'] ?? ''));
        if ($hint !== '') {
            $u = $this->findUserByName($hint, $allUsers);
            if ($u) return [$u, 'sheet_name'];
        }

        // 3. R2 cell fuzzy — extract first 2-4 tokens before facility/position keyword
        //    Common R2 patterns: "นาย ธีรชัย ปรัชญาคุณ\tสำนักงาน..." or "นาง ก ข ผู้อำนวยการ..."
        $r2 = trim((string) ($row['r2c1'] ?? ''));
        if ($r2 !== '') {
            // Trim everything after tab, "ผู้อำนวยการ", "ผู้ช่วย", "รอง", or "สำนักงาน"
            $r2head = preg_split('/\t|\b(ผู้อำนวยการ|ผู้ช่วยผู้ว่าการ|รองผู้ว่าการ|สำนักงาน|ระดับ\s*\d)/u', $r2)[0];
            $r2head = trim($r2head);
            if ($r2head !== '' && $r2head !== $hint) {
                $u = $this->findUserByName($r2head, $allUsers);
                if ($u) return [$u, 'r2_name'];
            }
        }

        return [null, null];
    }

    /**
     * Fuzzy match a sheet name (or any name string) to a User.
     * Multi-step strategy — early returns on first hit:
     *
     *   1. Exact full-name match (with/without prename concatenation styles)
     *   2. Strip prename → fname + lname (parts[0] + parts[1])
     *   3. Strip prename → fname + parts[last] (handles middle title)
     *   4. Multi-token lname (parts[0] + concat parts[1..N-1] OR parts[1..N])
     *      — catches lnames like "ปทุมโรจน์ สวัสดิ์ - ชูโต"
     *   5. fname-only when parts has just 1 token AND DB has unique fname match
     *   6. Substring match (DB user fullname ⊂ input)
     */
    private function findUserByName(string $name, Collection $allUsers): ?User
    {
        $name = trim($name);
        if ($name === '') return null;

        // 1. Exact full-name match
        foreach ($allUsers as $u) {
            $full = trim(($u->prename ?? '') . ($u->fname ?? '') . ' ' . ($u->lname ?? ''));
            $fullSpaced = trim(($u->prename ?? '') . ' ' . ($u->fname ?? '') . ' ' . ($u->lname ?? ''));
            $short = trim(($u->fname ?? '') . ' ' . ($u->lname ?? ''));
            if ($name === $full || $name === $fullSpaced || $name === $short) return $u;
        }

        $clean = preg_replace('/^(ว่าที่ร้อยตรี|น\.ส\.|นางสาว|นาง|นาย|ดร\.)\s*/u', '', $name);
        $clean = trim((string) $clean);
        $parts = array_values(array_filter(preg_split('/\s+/', $clean), fn ($p) => trim($p) !== ''));

        if (count($parts) >= 2) {
            $fname = $parts[0];

            // 2. parts[0] + parts[1]
            $match = $allUsers->first(fn ($u) => $u->fname === $fname && $u->lname === $parts[1]);
            if ($match) return $match;

            // 3. parts[0] + parts[last]
            $lnameLast = $parts[count($parts) - 1];
            if ($lnameLast !== $parts[1]) {
                $match = $allUsers->first(fn ($u) => $u->fname === $fname && $u->lname === $lnameLast);
                if ($match) return $match;
            }

            // 4. Multi-token lname: try concatenating tail tokens with single space
            //    (covers "นาง กนกพร ปทุมโรจน์ สวัสดิ์ - ชูโต" where lname has 4 tokens)
            for ($cut = 2; $cut <= count($parts); $cut++) {
                $tailLname = trim(implode(' ', array_slice($parts, 1, $cut - 1)));
                if ($tailLname === '') continue;
                $match = $allUsers->first(fn ($u) => $u->fname === $fname && trim((string) $u->lname) === $tailLname);
                if ($match) return $match;
            }

            // Try sheet-name substring containment (DB user's "fname lname" appears in sheet name)
            foreach ($allUsers as $u) {
                $shortDb = trim(($u->fname ?? '') . ' ' . ($u->lname ?? ''));
                if ($shortDb !== '' && mb_strlen($shortDb) >= 8 && str_contains($name, $shortDb)) return $u;
            }
        } elseif (count($parts) === 1) {
            // 5. fname-only — only if unique
            $matches = $allUsers->filter(fn ($u) => $u->fname === $parts[0]);
            if ($matches->count() === 1) return $matches->first();
        }

        return null;
    }

    /**
     * Generate an ASCII-only org_code (≤8 chars). The code is embedded in URLs
     * that get encoded to QR — Thai/Unicode chars break ISO-8859-1 encoding in
     * BaconQrCode (and look ugly in URLs anyway).
     *
     * Strategy: take ASCII initials from tokens; if name has no ASCII letters
     * (Thai-only), fall back to a deterministic 3-char hash-based prefix.
     */
    private function generateOrgCode(string $name): string
    {
        $existing = ExternalOrganization::where('name', $name)->value('org_code');
        // Reuse existing only if it is already ASCII-clean
        if ($existing && preg_match('/^[A-Z0-9]+$/i', $existing)) return $existing;

        $tokens = preg_split('/\s+/u', trim($name)) ?: [];
        $base = '';
        foreach ($tokens as $t) {
            // Find the first ASCII letter/digit in this token
            if (preg_match('/[A-Za-z0-9]/', $t, $m)) {
                $base .= strtoupper($m[0]);
            }
            if (strlen($base) >= 6) break;
        }
        if (strlen($base) < 3) {
            // Pure-Thai name → derive 3-char ASCII prefix from md5
            $base = strtoupper(substr(md5($name), 0, 3));
        }
        $base = substr($base, 0, 6);
        $candidate = $base;

        $attempt = 0;
        while (ExternalOrganization::where('org_code', $candidate)->exists()) {
            $attempt++;
            $candidate = substr($base, 0, 4) . strtoupper(Str::random(2));
            if ($attempt > 20) {
                $candidate = strtoupper(Str::random(8));
                break;
            }
        }
        return $candidate;
    }

    /**
     * Generate a unique access code matching IEAT-{ORG}-{RANDOM6}.
     * Uses strlen (byte) — orgCode is guaranteed ASCII by generateOrgCode().
     */
    /**
     * Per-stakeholder login code: shared across all `external_stakeholders`
     * rows where (organization_name, group_label, fiscal_year) match.
     *
     * Look up an existing code first; if none, generate a new ASCII-only one
     * uniquely across both `external_stakeholders.code` and
     * `external_access_codes.code` (so admin can paste either into login).
     */
    private function resolveStakeholderCode(string $orgName, string $groupLabel, int $fiscalYear): string
    {
        // In-memory cache for this batch — avoids repeated DB lookups
        static $cache = [];
        $key = "{$orgName}|{$groupLabel}|{$fiscalYear}";
        if (isset($cache[$key])) return $cache[$key];

        $existing = ExternalStakeholder::where('organization_name', $orgName)
            ->where('group_label', $groupLabel)
            ->where('fiscal_year', $fiscalYear)
            ->whereNotNull('code')
            ->value('code');

        if ($existing) {
            return $cache[$key] = $existing;
        }

        // Generate new — short, ASCII, unique across both code spaces
        do {
            $candidate = 'IEAT-S-' . strtoupper(Str::random(8));
        } while (
            ExternalStakeholder::where('code', $candidate)->exists() ||
            ExternalAccessCode::where('code', $candidate)->exists()
        );
        return $cache[$key] = $candidate;
    }

    private function generateUniqueCode(?string $orgCode): string
    {
        $prefix = $orgCode ? "IEAT-{$orgCode}-" : 'IEAT-';
        if (strlen($prefix . 'XXXXXX') > 20) {
            $prefix = substr($prefix, 0, 14);
        }
        do {
            $candidate = $prefix . strtoupper(Str::random(6));
        } while (ExternalAccessCode::where('code', $candidate)->exists());
        return $candidate;
    }
}
