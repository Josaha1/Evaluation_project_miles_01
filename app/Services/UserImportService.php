<?php

namespace App\Services;

use App\Models\Departments;
use App\Models\Divisions;
use App\Models\Factions;
use App\Models\Position;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;

class UserImportService
{
    /**
     * Expected columns (Sheet1 row 1 = header):
     * A ลำดับ | B รหัสพนักงาน | C คำนำหน้า | D ชื่อ | E นามสกุล
     * F ตำแหน่ง | G ระดับ | H กอง | I ฝ่าย | J สายงาน | K วันเกิด
     */
    public function parseFile(string $path): array
    {
        $reader = IOFactory::createReaderForFile($path);
        $reader->setReadDataOnly(true);
        $sheet = $reader->load($path)->getActiveSheet();
        $highest = $sheet->getHighestRow();

        $rows = [];
        for ($r = 2; $r <= $highest; $r++) {
            $emid = $this->cellStr($sheet, "B{$r}");
            if (!$emid) continue;

            $rows[] = [
                'row_no'     => $r,
                'emid'       => $emid,
                'prename'    => $this->cellStr($sheet, "C{$r}"),
                'fname'      => $this->cellStr($sheet, "D{$r}"),
                'lname'      => $this->cellStr($sheet, "E{$r}"),
                'position'   => $this->cellStr($sheet, "F{$r}"),
                'grade'      => $this->cellStr($sheet, "G{$r}"),
                'department' => $this->cellStr($sheet, "H{$r}"),
                'faction'    => $this->cellStr($sheet, "I{$r}"),
                'division'   => $this->cellStr($sheet, "J{$r}"),
                'birthdate'  => $this->parseDate($sheet->getCell("K{$r}")->getValue()),
            ];
        }
        return $rows;
    }

    /**
     * Build preview — annotate each row with lookup ids, status, errors
     * and aggregate missing lookups for admin to resolve.
     */
    public function buildPreview(array $rows): array
    {
        $existingEmids = User::pluck('emid')->map(fn($e) => trim($e))->flip();

        // Index existing lookups (normalized: trim + remove trailing \n)
        $divisions   = Divisions::all()->keyBy(fn($d) => $this->norm($d->name));
        $departments = Departments::all()->keyBy(fn($d) => $this->norm($d->name));
        $factions    = Factions::all()->keyBy(fn($f) => $this->norm($f->name));
        $positions   = Position::all()->keyBy(fn($p) => $this->norm($p->title));

        $missing = ['divisions' => [], 'departments' => [], 'factions' => [], 'positions' => []];
        $previewRows = [];

        foreach ($rows as $row) {
            $errors = [];
            $status = 'ok';

            $divKey = $this->norm($row['division']);
            $depKey = $this->norm($row['department']);
            $facKey = $this->norm($row['faction']);
            $posKey = $this->norm($row['position']);

            $div = $divisions[$divKey] ?? null;
            $dep = $departments[$depKey] ?? null;
            $fac = $factions[$facKey] ?? null;
            $pos = $positions[$posKey] ?? null;

            if (!$row['prename']) $errors[] = 'ไม่มีคำนำหน้า';
            if (!$row['fname'] || !$row['lname']) $errors[] = 'ไม่มีชื่อหรือนามสกุล';
            if (!$row['birthdate']) $errors[] = 'วันเกิดไม่ถูกต้อง';
            if (!$row['emid']) $errors[] = 'ไม่มีรหัสพนักงาน';

            if (!$div && $row['division']) {
                $missing['divisions'][$row['division']] = true;
            }
            if (!$dep && $row['department']) {
                $missing['departments'][$row['department']] = true;
            }
            if (!$fac && $row['faction']) {
                $missing['factions'][$row['faction']] = true;
            }
            if (!$pos && $row['position']) {
                $missing['positions'][$row['position']] = true;
            }

            $duplicate = isset($existingEmids[$row['emid']]);
            if ($duplicate) $status = 'duplicate';
            elseif ($errors) $status = 'error';
            elseif (!$div || !$dep || !$fac || !$pos) $status = 'missing_lookup';

            $previewRows[] = array_merge($row, [
                'division_id'   => $div?->id,
                'department_id' => $dep?->id,
                'faction_id'    => $fac?->id,
                'position_id'   => $pos?->id,
                'sex'           => $this->deriveSex($row['prename']),
                'duplicate'     => $duplicate,
                'errors'        => $errors,
                'status'        => $status,
            ]);
        }

        return [
            'rows'    => $previewRows,
            'missing' => [
                'divisions'   => array_keys($missing['divisions']),
                'departments' => array_keys($missing['departments']),
                'factions'    => array_keys($missing['factions']),
                'positions'   => array_keys($missing['positions']),
            ],
            'summary' => [
                'total'          => count($previewRows),
                'ok'             => count(array_filter($previewRows, fn($r) => $r['status'] === 'ok')),
                'duplicate'      => count(array_filter($previewRows, fn($r) => $r['status'] === 'duplicate')),
                'error'          => count(array_filter($previewRows, fn($r) => $r['status'] === 'error')),
                'missing_lookup' => count(array_filter($previewRows, fn($r) => $r['status'] === 'missing_lookup')),
            ],
        ];
    }

    /**
     * Execute import. $rows = preview rows from client.
     * $mappings: ['divisions' => [name => id|'create'], 'departments' => ..., 'factions' => ..., 'positions' => ...]
     * Skips duplicate emids and rows with errors.
     */
    public function execute(array $rows, array $mappings): array
    {
        return DB::transaction(function () use ($rows, $mappings) {
            // Resolve mappings → for each missing name, get id (creating if requested)
            $resolved = [
                'divisions'   => $this->resolveMapping($mappings['divisions'] ?? [], Divisions::class, 'name'),
                'departments' => $this->resolveMapping($mappings['departments'] ?? [], Departments::class, 'name'),
                'factions'    => $this->resolveMapping($mappings['factions'] ?? [], Factions::class, 'name'),
                'positions'   => $this->resolveMapping($mappings['positions'] ?? [], Position::class, 'title'),
            ];

            $created = 0;
            $skipped = 0;
            $details = [];

            $existingEmids = User::pluck('emid')->map(fn($e) => trim($e))->flip();

            foreach ($rows as $row) {
                $emid = trim((string) $row['emid']);

                if (isset($existingEmids[$emid])) {
                    $skipped++;
                    $details[] = "แถว {$row['row_no']}: ข้าม (รหัส {$emid} มีอยู่แล้ว)";
                    continue;
                }

                if (!empty($row['errors'])) {
                    $skipped++;
                    $details[] = "แถว {$row['row_no']}: ข้าม (" . implode(', ', $row['errors']) . ')';
                    continue;
                }

                $divisionId   = $row['division_id']   ?? ($resolved['divisions'][$row['division']]     ?? null);
                $departmentId = $row['department_id'] ?? ($resolved['departments'][$row['department']] ?? null);
                $factionId    = $row['faction_id']    ?? ($resolved['factions'][$row['faction']]       ?? null);
                $positionId   = $row['position_id']   ?? ($resolved['positions'][$row['position']]     ?? null);

                if (!$divisionId || !$departmentId || !$factionId || !$positionId) {
                    $skipped++;
                    $details[] = "แถว {$row['row_no']}: ข้าม (ยังจับคู่ข้อมูลไม่ครบ)";
                    continue;
                }

                $birthdate = Carbon::parse($row['birthdate']);
                $defaultPassword = $birthdate->format('dm') . ($birthdate->year + 543);

                User::create([
                    'emid'          => $emid,
                    'prename'       => $row['prename'],
                    'fname'         => $row['fname'],
                    'lname'         => $row['lname'],
                    'sex'           => $row['sex'] ?: $this->deriveSex($row['prename']),
                    'division_id'   => $divisionId,
                    'department_id' => $departmentId,
                    'faction_id'    => $factionId,
                    'position_id'   => $positionId,
                    'grade'         => $row['grade'] ?: null,
                    'birthdate'     => $birthdate->format('Y-m-d'),
                    'password'      => Hash::make($defaultPassword),
                    'role'          => 'user',
                    'user_type'     => 'internal',
                ]);

                $existingEmids[$emid] = true;
                $created++;
                $details[] = "แถว {$row['row_no']}: ✓ {$row['prename']}{$row['fname']} {$row['lname']} ({$emid})";
            }

            return [
                'created' => $created,
                'skipped' => $skipped,
                'details' => $details,
            ];
        });
    }

    private function resolveMapping(array $mapping, string $modelClass, string $nameField): array
    {
        $out = [];
        foreach ($mapping as $originalName => $target) {
            if ($target === 'create') {
                $model = $modelClass::firstOrCreate([$nameField => trim($originalName)]);
                $out[$originalName] = $model->id;
            } elseif (is_numeric($target)) {
                $out[$originalName] = (int) $target;
            }
        }
        return $out;
    }

    private function cellStr($sheet, string $coord): string
    {
        $v = $sheet->getCell($coord)->getValue();
        if ($v === null) return '';
        return trim((string) $v);
    }

    private function norm(?string $v): string
    {
        return trim(str_replace(["\r", "\n"], '', (string) $v));
    }

    private function deriveSex(string $prename): string
    {
        $p = trim($prename);
        if (in_array($p, ['นาง', 'นางสาว', 'น.ส.', 'ดร.หญิง'], true)) return 'หญิง';
        return 'ชาย';
    }

    private function parseDate($value): ?string
    {
        if (!$value) return null;
        try {
            if (is_numeric($value)) {
                $date = Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value));
            } else {
                $date = Carbon::parse($value);
            }
            // Convert Buddhist year (พ.ศ.) → Christian year (ค.ศ.) — DB convention is AD
            if ($date->year > 2400) {
                $date = $date->subYears(543);
            }
            return $date->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
