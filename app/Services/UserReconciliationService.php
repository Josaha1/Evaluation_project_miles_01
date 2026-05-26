<?php

namespace App\Services;

use App\Models\Departments;
use App\Models\Divisions;
use App\Models\Factions;
use App\Models\Position;
use App\Models\User;
use App\Models\UserChangeLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Compare Excel rows against existing users (by emid) and produce diffs.
 * Apply approved diffs to users table + log every change to user_change_logs.
 *
 * Reuses parseFile / cell helpers in spirit from UserImportService but
 * focused on UPDATE flow (not CREATE).
 */
class UserReconciliationService
{
    /** Fields that can be reconciled via Excel + their human label */
    public const RECONCILABLE_FIELDS = [
        'prename'       => 'คำนำหน้า',
        'fname'         => 'ชื่อ',
        'lname'         => 'นามสกุล',
        'grade'         => 'ระดับ',
        'position_id'   => 'ตำแหน่ง',
        'department_id' => 'กอง',
        'faction_id'    => 'ฝ่าย',
        'division_id'   => 'สายงาน',
    ];

    /** Header keywords (Thai) → field name */
    private const HEADER_KEYS = [
        'emid'       => ['รหัสพนักงาน', 'รหัส'],
        'prename'    => ['คำนำหน้า'],
        'fname'      => ['ชื่อ'],
        'lname'      => ['นามสกุล'],
        'fullname'   => ['ชื่อ-นามสกุล', 'ชื่อ - นามสกุล', 'ชื่อ – นามสกุล'],
        'position'   => ['ตำแหน่ง'],
        'grade'      => ['ระดับ'],
        'department' => ['กอง'],
        'faction'    => ['ฝ่าย'],
        'division'   => ['สายงาน'],
    ];

    /**
     * Parse one Excel file. Detects header row (1 or 2) + column positions dynamically.
     * Iterates ALL sheets and dedupes by emid (last write wins per file).
     */
    public function parseFile(string $path): array
    {
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($path);

        $allRows = [];
        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $headerRow = $this->findHeaderRow($sheet);
            if (!$headerRow) continue;

            $cols = $this->detectColumns($sheet, $headerRow);
            if (!isset($cols['emid'])) continue;

            $highest = $sheet->getHighestRow();
            for ($r = $headerRow + 1; $r <= $highest; $r++) {
                $emid = $this->cellStr($sheet, "{$cols['emid']}{$r}");
                // Skip empty + malformed (must contain digits — guards against cells where prename leaks)
                if (!$emid || !preg_match('/\d{4,}/', $emid)) continue;

                // Handle "ชื่อ-นามสกุล" combined column → split into fname + lname
                $fname = isset($cols['fname']) ? $this->cellStr($sheet, "{$cols['fname']}{$r}") : '';
                $lname = isset($cols['lname']) ? $this->cellStr($sheet, "{$cols['lname']}{$r}") : '';
                $prename = isset($cols['prename']) ? $this->cellStr($sheet, "{$cols['prename']}{$r}") : '';
                if (!$fname && isset($cols['fullname'])) {
                    $combined = $this->cellStr($sheet, "{$cols['fullname']}{$r}");
                    [$prename, $fname, $lname] = $this->splitFullname($combined, $prename);
                }

                $allRows[] = [
                    'sheet'      => $sheet->getTitle(),
                    'row_no'     => $r,
                    'emid'       => $emid,
                    'prename'    => $prename,
                    'fname'      => $fname,
                    'lname'      => $lname,
                    'position'   => isset($cols['position']) ? $this->cellStr($sheet, "{$cols['position']}{$r}") : '',
                    'grade'      => isset($cols['grade']) ? $this->cellStr($sheet, "{$cols['grade']}{$r}") : '',
                    'department' => isset($cols['department']) ? $this->cellStr($sheet, "{$cols['department']}{$r}") : '',
                    'faction'    => isset($cols['faction']) ? $this->cellStr($sheet, "{$cols['faction']}{$r}") : '',
                    'division'   => isset($cols['division']) ? $this->cellStr($sheet, "{$cols['division']}{$r}") : '',
                ];
            }
        }
        return $allRows;
    }

    private function findHeaderRow($sheet): ?int
    {
        $highest = min(5, $sheet->getHighestRow());
        for ($r = 1; $r <= $highest; $r++) {
            for ($c = 'A'; $c <= 'L'; $c++) {
                $v = trim((string) $sheet->getCell("{$c}{$r}")->getValue());
                if ($v === 'รหัสพนักงาน' || $v === 'รหัส') return $r;
            }
        }
        return null;
    }

    private function detectColumns($sheet, int $headerRow): array
    {
        $cols = [];
        for ($c = 'A'; $c <= 'L'; $c++) {
            $v = trim((string) $sheet->getCell("{$c}{$headerRow}")->getValue());
            if (!$v) continue;
            foreach (self::HEADER_KEYS as $key => $variants) {
                if (in_array($v, $variants, true) && !isset($cols[$key])) {
                    $cols[$key] = $c;
                }
            }
        }
        return $cols;
    }

    /**
     * Split "นาง มัทธ์วรรณท์ เรืองดิษฐ์" → [prename='นาง', fname='มัทธ์วรรณท์', lname='เรืองดิษฐ์'].
     * Strategy: strip known prename from front, first remaining word = fname, rest joined = lname.
     */
    private function splitFullname(string $full, string $existingPrename = ''): array
    {
        $full = trim(preg_replace('/\s+/u', ' ', $full));
        if ($full === '') return [$existingPrename, '', ''];

        $prenamePatterns = ['นางสาว', 'นาง', 'นาย', 'น.ส.', 'ดร.', 'ว่าที่ร้อยตรี'];
        $prename = $existingPrename;
        foreach ($prenamePatterns as $p) {
            if (mb_strpos($full, $p . ' ') === 0) {
                $prename = $p;
                $full = trim(mb_substr($full, mb_strlen($p) + 1));
                break;
            }
        }
        $parts = preg_split('/\s+/u', $full);
        $fname = $parts[0] ?? '';
        $lname = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
        return [$prename, $fname, $lname];
    }

    /**
     * Parse multiple files into a single, deduplicated row list (last-write-wins per emid).
     */
    public function parseMany(array $paths): array
    {
        $byEmid = [];
        foreach ($paths as $path) {
            // Skip Office lock/temp files (~$xxxx.xlsx)
            if (str_starts_with(basename($path), '~$')) continue;
            foreach ($this->parseFile($path) as $row) {
                $byEmid[$row['emid']] = $row;
            }
        }
        return array_values($byEmid);
    }

    /**
     * Compare excel rows vs DB users — return per-user diff (only users with changes).
     */
    public function diffAgainstDb(array $excelRows): array
    {
        $emids = array_filter(array_column($excelRows, 'emid'));
        $existing = User::whereIn('emid', $emids)
            ->get()
            ->keyBy('emid');

        $divisions   = Divisions::all()->keyBy(fn($d) => $this->norm($d->name));
        $departments = Departments::all()->keyBy(fn($d) => $this->norm($d->name));
        $factions    = Factions::all()->keyBy(fn($f) => $this->norm($f->name));
        $positions   = Position::all()->keyBy(fn($p) => $this->norm($p->title));

        $diffs = [];
        $notFoundEmids = [];
        $missingLookups = ['divisions' => [], 'departments' => [], 'factions' => [], 'positions' => []];

        foreach ($excelRows as $row) {
            $emid = $row['emid'];
            $user = $existing->get($emid);

            if (!$user) {
                $notFoundEmids[] = $emid;
                continue;
            }

            $div = $row['division'] ? ($divisions[$this->norm($row['division'])] ?? null) : null;
            $dep = $row['department'] ? ($departments[$this->norm($row['department'])] ?? null) : null;
            $fac = $row['faction'] ? ($factions[$this->norm($row['faction'])] ?? null) : null;
            $pos = $row['position'] ? ($positions[$this->norm($row['position'])] ?? null) : null;

            if (!$div && $row['division']) $missingLookups['divisions'][$row['division']] = true;
            if (!$dep && $row['department']) $missingLookups['departments'][$row['department']] = true;
            if (!$fac && $row['faction']) $missingLookups['factions'][$row['faction']] = true;
            if (!$pos && $row['position']) $missingLookups['positions'][$row['position']] = true;

            // Build "new" values map (only what Excel provides — null = skip / no change)
            $newValues = [
                'prename'       => $row['prename'] ?: null,
                'fname'         => $row['fname'] ?: null,
                'lname'         => $row['lname'] ?: null,
                'grade'         => $row['grade'] !== '' ? (string) $row['grade'] : null,
                'position_id'   => $pos?->id,
                'department_id' => $dep?->id,
                'faction_id'    => $fac?->id,
                'division_id'   => $div?->id,
            ];

            // Map each org-id field to its Excel raw value + resolved entity for blocked-detection
            $orgFieldMap = [
                'position_id'   => ['excel' => $row['position'],   'resolved' => $pos],
                'department_id' => ['excel' => $row['department'], 'resolved' => $dep],
                'faction_id'    => ['excel' => $row['faction'],    'resolved' => $fac],
                'division_id'   => ['excel' => $row['division'],   'resolved' => $div],
            ];

            $changes = [];
            $blocked = [];
            foreach ($newValues as $field => $newVal) {
                $oldVal = $user->{$field};
                $oldLabel = $this->resolveLabel($field, $oldVal);

                // Detect blocked case: Excel had a value but lookup failed (id-fields only)
                if (isset($orgFieldMap[$field])) {
                    $excelRaw = $orgFieldMap[$field]['excel'];
                    if ($newVal === null && $excelRaw !== '' && $orgFieldMap[$field]['resolved'] === null) {
                        // Only flag if Excel value differs from current DB label
                        if ($this->norm($excelRaw) !== $this->norm((string) $oldLabel)) {
                            $blocked[$field] = [
                                'current_label' => $oldLabel,
                                'excel_value'   => $excelRaw,
                                'reason'        => 'lookup_missing',
                            ];
                        }
                        continue;
                    }
                }

                if ($newVal === null) continue;
                if ((string) $oldVal === (string) $newVal) continue;

                $newLabel = $this->resolveLabel($field, $newVal);

                // Suppress false-positive: id differs but display label is identical
                if (str_ends_with($field, '_id')
                    && $oldLabel !== null
                    && $this->norm($oldLabel) === $this->norm($newLabel)
                ) continue;

                $changes[$field] = [
                    'old' => $oldVal,
                    'new' => $newVal,
                    'old_label' => $oldLabel,
                    'new_label' => $newLabel,
                ];
            }

            if (!empty($changes) || !empty($blocked)) {
                $diffs[] = [
                    'user_id'    => $user->id,
                    'emid'       => $emid,
                    'name'       => trim($user->prename . $user->fname . ' ' . $user->lname),
                    'sheet'      => $row['sheet'],
                    'row_no'     => $row['row_no'],
                    'changes'    => $changes,
                    'blocked'    => $blocked,  // user-level changes that need lookup creation first
                ];
            }
        }

        return [
            'diffs'           => $diffs,
            'not_found'       => $notFoundEmids,
            'missing_lookups' => [
                'divisions'   => array_keys($missingLookups['divisions']),
                'departments' => array_keys($missingLookups['departments']),
                'factions'    => array_keys($missingLookups['factions']),
                'positions'   => array_keys($missingLookups['positions']),
            ],
            'summary' => [
                'total_excel'    => count($excelRows),
                'total_changed'  => count(array_filter($diffs, fn($d) => !empty($d['changes']))),
                'total_blocked'  => count(array_filter($diffs, fn($d) => !empty($d['blocked']) && empty($d['changes']))),
                'total_with_blocked' => count(array_filter($diffs, fn($d) => !empty($d['blocked']))),
                'total_unchanged'=> count($excelRows) - count($diffs) - count($notFoundEmids),
                'total_not_found'=> count($notFoundEmids),
            ],
        ];
    }

    /**
     * Apply approved diffs + resolve blocked entries (create new orgs or map to existing).
     *
     * @param array $diffs       result from diffAgainstDb()
     * @param array $approvals   [['user_id'=>N, 'fields'=>['grade',...]], ...]
     * @param array $blockedActions  [
     *   ['user_id'=>N, 'field'=>'department_id', 'action'=>'create'|'map',
     *    'excel_value'=>'name', 'target_id'=>null|int],
     *   ...
     * ]
     */
    public function applyChanges(array $diffs, array $approvals, array $blockedActions = []): array
    {
        $diffsByUser = collect($diffs)->keyBy('user_id');

        return DB::transaction(function () use ($diffsByUser, $approvals, $blockedActions) {
            $batchId = (string) Str::uuid();
            $changerId = Auth::id();
            $updatedUsers = 0;
            $loggedChanges = 0;
            $createdOrgs = ['departments' => 0, 'factions' => 0, 'divisions' => 0, 'positions' => 0];
            $details = [];

            // Step 1: resolve blocked actions → produce a map of (user_id, field) → new_value
            //         creating new org rows when action='create'
            $blockedResolutions = []; // [user_id][field] = ['new' => id, 'new_label' => name]
            foreach ($blockedActions as $b) {
                $action = $b['action'] ?? 'skip';
                if ($action === 'skip') continue;

                $field = $b['field'];
                $userId = $b['user_id'];
                $excelValue = trim((string) ($b['excel_value'] ?? ''));
                if (!$excelValue) continue;

                $newId = null;
                if ($action === 'create') {
                    // Pass user context so dept/position can inherit division/department FK
                    $contextUser = User::find($userId);
                    $newId = $this->createOrgRow($field, $excelValue, $contextUser);
                    if ($newId) {
                        $createdOrgs[$this->orgPlural($field)]++;
                        $details[] = "+ สร้าง {$this->fieldThai($field)}: {$excelValue} (id={$newId})";
                    }
                } elseif ($action === 'map' && !empty($b['target_id'])) {
                    $newId = (int) $b['target_id'];
                }

                if ($newId) {
                    $blockedResolutions[$userId][$field] = [
                        'new' => $newId,
                        'new_label' => $this->resolveLabel($field, $newId),
                    ];
                }
            }

            // Step 2: apply approvals (regular changes + blocked resolutions)
            foreach ($approvals as $approval) {
                $userId = $approval['user_id'];
                $approvedFields = $approval['fields'] ?? [];

                $diff = $diffsByUser->get($userId);
                if (!$diff) continue;
                $user = User::find($userId);
                if (!$user) continue;

                $payload = [];
                $resolvedForUser = $blockedResolutions[$userId] ?? [];

                foreach ($approvedFields as $field) {
                    // Source of truth: changes[] OR resolved blocked
                    $newValRecord = $diff['changes'][$field] ?? null;
                    $resolved = $resolvedForUser[$field] ?? null;

                    if ($resolved) {
                        $oldVal = $user->{$field};
                        $newVal = $resolved['new'];
                        if ((string) $oldVal === (string) $newVal) continue;
                        $payload[$field] = $newVal;
                        UserChangeLog::create([
                            'user_id'    => $userId,
                            'field'      => $field,
                            'old_value'  => is_null($oldVal) ? null : (string) $oldVal,
                            'new_value'  => (string) $newVal,
                            'batch_id'   => $batchId,
                            'changed_by' => $changerId,
                        ]);
                        $loggedChanges++;
                    } elseif ($newValRecord) {
                        $payload[$field] = $newValRecord['new'];
                        UserChangeLog::create([
                            'user_id'    => $userId,
                            'field'      => $field,
                            'old_value'  => is_null($newValRecord['old']) ? null : (string) $newValRecord['old'],
                            'new_value'  => is_null($newValRecord['new']) ? null : (string) $newValRecord['new'],
                            'batch_id'   => $batchId,
                            'changed_by' => $changerId,
                        ]);
                        $loggedChanges++;
                    }
                }

                if ($payload) {
                    $user->update($payload);
                    $updatedUsers++;
                    $details[] = "✓ {$diff['emid']} {$diff['name']} — " . count($payload) . " field updated";
                }
            }

            return [
                'batch_id'       => $batchId,
                'updated_users'  => $updatedUsers,
                'logged_changes' => $loggedChanges,
                'created_orgs'   => $createdOrgs,
                'details'        => $details,
            ];
        });
    }

    /**
     * Create new org row. Inherits parent FK from user context when needed
     * (department.division_id, position.department_id) since DB schema may require NOT NULL.
     */
    private function createOrgRow(string $field, string $name, ?User $context = null): ?int
    {
        return match ($field) {
            'division_id'   => Divisions::create(['name' => $name])->id,
            'department_id' => Departments::create([
                'name'        => $name,
                'division_id' => $context?->division_id,  // inherit from user
            ])->id,
            'faction_id'    => Factions::create(['name' => $name])->id,
            'position_id'   => Position::create([
                'title'         => $name,
                'department_id' => $context?->department_id,  // inherit from user
            ])->id,
            default         => null,
        };
    }

    private function orgPlural(string $field): string
    {
        return match ($field) {
            'division_id'   => 'divisions',
            'department_id' => 'departments',
            'faction_id'    => 'factions',
            'position_id'   => 'positions',
            default         => 'unknown',
        };
    }

    private function fieldThai(string $field): string
    {
        return self::RECONCILABLE_FIELDS[$field] ?? $field;
    }

    /**
     * Rollback all changes in a given batch.
     */
    public function rollback(string $batchId): array
    {
        return DB::transaction(function () use ($batchId) {
            $logs = UserChangeLog::where('batch_id', $batchId)->get();
            $reverted = 0;

            foreach ($logs->groupBy('user_id') as $userId => $userLogs) {
                $user = User::find($userId);
                if (!$user) continue;
                $payload = [];
                foreach ($userLogs as $log) {
                    $payload[$log->field] = $log->old_value;
                }
                if ($payload) {
                    $user->update($payload);
                    $reverted++;
                }
            }

            UserChangeLog::where('batch_id', $batchId)->delete();
            return ['reverted_users' => $reverted, 'deleted_logs' => $logs->count()];
        });
    }

    private function resolveLabel(string $field, $value)
    {
        if ($value === null || $value === '') return null;
        return match ($field) {
            'division_id'   => Divisions::find($value)?->name ?? "id={$value}",
            'department_id' => Departments::find($value)?->name ?? "id={$value}",
            'faction_id'    => Factions::find($value)?->name ?? "id={$value}",
            'position_id'   => Position::find($value)?->title ?? "id={$value}",
            default         => (string) $value,
        };
    }

    private function cellStr($sheet, string $coordinate): string
    {
        return trim((string) ($sheet->getCell($coordinate)->getValue() ?? ''));
    }

    private function norm(?string $s): string
    {
        return trim(preg_replace('/\s+/', ' ', (string) $s));
    }
}
