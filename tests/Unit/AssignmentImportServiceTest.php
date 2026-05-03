<?php

use App\Services\AssignmentImportService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

/**
 * Build a temp xlsx file from a 2D array (row-major, 1-indexed coords),
 * return its absolute path. Caller is responsible for unlink in afterEach.
 */
function makeXlsx(array $cells, ?array $merges = null): string
{
    $sp = new Spreadsheet();
    $sheet = $sp->getActiveSheet();
    foreach ($cells as $row => $cols) {
        foreach ($cols as $col => $val) {
            $sheet->setCellValue([$col, $row], $val);
        }
    }
    foreach ($merges ?? [] as $range) $sheet->mergeCells($range);

    $tmp = tempnam(sys_get_temp_dir(), 'import_').'.xlsx';
    $writer = IOFactory::createWriter($sp, 'Xlsx');
    $writer->save($tmp);
    return $tmp;
}

afterEach(function () {
    foreach (glob(sys_get_temp_dir().'/import_*.xlsx') as $f) @unlink($f);
});

it('reads multi-column left angle when no องศาขวา boundary (Pattern B)', function () {
    // Layout: J=องศาบน K=องศาล่าง L=องศาซ้าย, no right
    // Data row spills into M and N (no headers there)
    $path = makeXlsx([
        2 => [
            1 => 'ลำดับ', 2 => 'รหัสพนักงาน', 3 => 'ชื่อ-นามสกุล',
            10 => 'องศาบน', 11 => 'องศาล่าง', 12 => 'องศาซ้าย',
        ],
        3 => [
            1 => 1, 2 => '100001', 3 => 'นาง ก',
            10 => 'นาย ผู้บริหาร',
            11 => 'ไม่มี',
            12 => "นาย คนที่หนึ่ง\nนาย คนที่สอง",
            13 => "นาย คนที่สาม\nนาย คนที่สี่",
            14 => "นาย คนที่ห้า",
        ],
    ]);

    $svc = new AssignmentImportService();
    $parsed = $svc->parseFile($path);

    $row = collect($parsed['rows'])->firstWhere('row_no', 3);
    expect($row)->not->toBeNull();
    $names = array_filter(explode("\n", $row['left_cell']));
    expect($names)->toHaveCount(5);
    expect($row['left_cell'])->toContain('นาย คนที่ห้า');
});

it('does not extend left angle into a non-angle header column (e.g. หมายเหตุ)', function () {
    // M=องศาซ้าย, N=หมายเหตุ — left must read M only, not N
    $path = makeXlsx([
        1 => [
            1 => 'รหัสพนักงาน', 2 => 'ชื่อ', 3 => 'นามสกุล',
            11 => 'องศาบน', 12 => 'องศาล่าง', 13 => 'องศาซ้าย', 14 => 'หมายเหตุ',
        ],
        2 => [
            1 => '100001', 2 => 'ก', 3 => 'ข',
            11 => 'นาย หัวหน้า',
            12 => 'ไม่มี',
            13 => "นาย เพื่อน1\nนาย เพื่อน2",
            14 => 'มาใหม่',
        ],
    ]);

    $svc = new AssignmentImportService();
    $parsed = $svc->parseFile($path);
    $row = collect($parsed['rows'])->firstWhere('row_no', 2);
    expect($row['left_cell'])->toBe("นาย เพื่อน1\nนาย เพื่อน2");
    expect($row['left_cell'])->not->toContain('มาใหม่');
});

it('respects merged-header layout (Pattern A): bounded ranges still correct', function () {
    // Pattern A like file 1: G:H = องศาบน, I:K = องศาล่าง, L:M = องศาซ้าย, N = องศาขวา
    $path = makeXlsx([
        1 => [
            1 => 'รหัส', 2 => 'คำนำหน้า', 3 => 'ชื่อ', 4 => 'นามสกุล',
            5 => 'ตำแหน่ง', 6 => 'ประเมินตนเอง',
            7 => 'องศาบน', 9 => 'องศาล่าง', 12 => 'องศาซ้าย', 14 => 'องศาขวา',
        ],
        2 => [
            1 => '100001', 2 => 'นาย', 3 => 'A', 4 => 'B', 5 => 'CEO', 6 => '/',
            7 => 'top1', 8 => 'top2',
            9 => 'bot1', 10 => 'bot2', 11 => 'bot3',
            12 => 'left1', 13 => 'left2',
            14 => 'right1',
        ],
    ], merges: ['G1:H1', 'I1:K1', 'L1:M1']);

    $svc = new AssignmentImportService();
    $parsed = $svc->parseFile($path);
    $row = collect($parsed['rows'])->firstWhere('row_no', 2);
    expect($row['top_cell'])->toBe("top1\ntop2");
    expect($row['bottom_cell'])->toBe("bot1\nbot2\nbot3");
    expect($row['left_cell'])->toBe("left1\nleft2");
});

it('detects header columns past column P', function () {
    // Header column at Q (index 17) — current bug: scan stops at P
    $path = makeXlsx([
        1 => [
            1 => 'รหัสพนักงาน', 2 => 'ชื่อ', 3 => 'นามสกุล',
            15 => 'องศาบน', 16 => 'องศาล่าง', 17 => 'องศาซ้าย',
        ],
        2 => [
            1 => '100001', 2 => 'ก', 3 => 'ข',
            15 => 'นาย หัวหน้า',
            16 => 'ไม่มี',
            17 => "นาย เพื่อน1\nนาย เพื่อน2",
        ],
    ]);

    $svc = new AssignmentImportService();
    $parsed = $svc->parseFile($path);
    $row = collect($parsed['rows'])->firstWhere('row_no', 2);
    expect($row)->not->toBeNull('row at column-Q layout should be parsed');
    expect($row['left_cell'])->toBe("นาย เพื่อน1\nนาย เพื่อน2");
});
