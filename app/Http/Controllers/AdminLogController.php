<?php

namespace App\Http\Controllers;

use App\Models\Answer;
use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminLogController extends Controller
{
    public function index()
    {
        return Inertia::render('AdminLogs');
    }

    /**
     * Tail of laravel.log — last N lines, parsed into entries.
     */
    public function appLog()
    {
        $path = storage_path('logs/laravel.log');
        if (!file_exists($path)) {
            return response()->json(['entries' => [], 'size' => 0, 'message' => 'log file ยังไม่ถูกสร้าง']);
        }

        $size = filesize($path);
        $lines = $this->tailFile($path, 500);

        // Parse Laravel log entries (each entry starts with "[YYYY-MM-DD HH:MM:SS]")
        $entries = [];
        $current = null;
        foreach ($lines as $line) {
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+):\s*(.*)$/', $line, $m)) {
                if ($current) $entries[] = $current;
                $current = [
                    'timestamp' => $m[1],
                    'env'       => $m[2],
                    'level'     => strtolower($m[3]),
                    'message'   => $m[4],
                    'detail'    => '',
                ];
            } elseif ($current) {
                $current['detail'] .= ($current['detail'] ? "\n" : '') . $line;
            }
        }
        if ($current) $entries[] = $current;

        return response()->json([
            'entries'  => array_reverse($entries),  // newest first
            'size_kb'  => round($size / 1024, 1),
            'count'    => count($entries),
        ]);
    }

    /**
     * Recent activity — users, assignments, answers (last 50 each).
     */
    public function recentActivity()
    {
        $recentUsers = User::orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['id', 'emid', 'prename', 'fname', 'lname', 'grade', 'role', 'user_type', 'created_at'])
            ->map(fn($u) => [
                'emid'       => $u->emid,
                'name'       => trim($u->prename . $u->fname . ' ' . $u->lname),
                'grade'      => $u->grade,
                'role'       => $u->role,
                'user_type'  => $u->user_type,
                'created_at' => $u->created_at?->format('Y-m-d H:i:s'),
            ]);

        $recentAssignments = EvaluationAssignment::with(['evaluator:id,emid,fname,lname', 'evaluatee:id,emid,fname,lname'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($a) => [
                'angle'        => $a->angle,
                'fiscal_year'  => $a->fiscal_year,
                'evaluator'    => $a->evaluator ? "{$a->evaluator->fname} {$a->evaluator->lname} ({$a->evaluator->emid})" : '-',
                'evaluatee'    => $a->evaluatee ? "{$a->evaluatee->fname} {$a->evaluatee->lname} ({$a->evaluatee->emid})" : '-',
                'created_at'   => $a->created_at?->format('Y-m-d H:i:s'),
            ]);

        $recentAnswers = DB::table('answers as a')
            ->leftJoin('users as e', 'e.id', '=', 'a.user_id')
            ->leftJoin('users as e2', 'e2.id', '=', 'a.evaluatee_id')
            ->select(
                DB::raw("CONCAT(e.fname, ' ', e.lname) AS evaluator"),
                DB::raw("CONCAT(e2.fname, ' ', e2.lname) AS evaluatee"),
                'a.created_at'
            )
            ->orderBy('a.created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'evaluator'  => $r->evaluator ?? '-',
                'evaluatee'  => $r->evaluatee ?? '-',
                'created_at' => $r->created_at,
            ]);

        return response()->json([
            'users'       => $recentUsers,
            'assignments' => $recentAssignments,
            'answers'     => $recentAnswers,
        ]);
    }

    /**
     * System stats — DB sizes, table counts, disk, PHP info.
     */
    public function systemInfo()
    {
        $dbName = DB::connection()->getDatabaseName();

        $tables = DB::select("
            SELECT table_name AS name, table_rows AS row_count,
                ROUND((data_length + index_length) / 1024 / 1024, 2) AS mb
            FROM information_schema.tables
            WHERE table_schema = ? AND table_type = 'BASE TABLE'
            ORDER BY (data_length + index_length) DESC
            LIMIT 15
        ", [$dbName]);

        $totalRows = DB::table('users')->count()
            + DB::table('evaluation_assignments')->count()
            + DB::table('answers')->count();

        $stats = [
            'app' => [
                'env'         => config('app.env'),
                'debug'       => config('app.debug'),
                'url'         => config('app.url'),
                'timezone'    => config('app.timezone'),
            ],
            'php' => [
                'version'        => PHP_VERSION,
                'memory_limit'   => ini_get('memory_limit'),
                'max_execution'  => ini_get('max_execution_time'),
                'upload_max'     => ini_get('upload_max_filesize'),
            ],
            'database' => [
                'name'        => $dbName,
                'driver'      => config('database.default'),
                'tables_count' => count($tables),
                'tables'      => $tables,
            ],
            'counts' => [
                'users'                  => User::count(),
                'evaluation_assignments' => EvaluationAssignment::count(),
                'answers'                => Answer::count(),
            ],
            'disk' => [
                'storage_used_mb' => $this->dirSize(storage_path('logs')) / 1024 / 1024,
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Submission stats — per fiscal year breakdown.
     */
    public function submissionStats()
    {
        $byYear = DB::table('answers')
            ->select('fiscal_year', DB::raw('COUNT(*) AS total'),
                DB::raw('COUNT(DISTINCT CONCAT(user_id, "-", evaluatee_id)) AS unique_pairs'),
                DB::raw('COUNT(DISTINCT user_id) AS unique_evaluators')
            )
            ->groupBy('fiscal_year')
            ->orderBy('fiscal_year', 'desc')
            ->get();

        $byAngle = DB::table('answers as a')
            ->join('evaluation_assignments as ea', function ($j) {
                $j->on('ea.evaluator_id', '=', 'a.user_id')
                    ->on('ea.evaluatee_id', '=', 'a.evaluatee_id')
                    ->on('ea.fiscal_year', '=', 'a.fiscal_year');
            })
            ->select('ea.angle', 'a.fiscal_year', DB::raw('COUNT(DISTINCT a.id) AS total'))
            ->groupBy('ea.angle', 'a.fiscal_year')
            ->orderBy('a.fiscal_year', 'desc')
            ->get();

        return response()->json([
            'by_year'  => $byYear,
            'by_angle' => $byAngle,
        ]);
    }

    private function tailFile(string $path, int $lines = 200): array
    {
        $f = fopen($path, 'rb');
        if (!$f) return [];
        $buffer = '';
        $chunk = 4096;
        $size = filesize($path);
        $pos = $size;
        while ($pos > 0 && substr_count($buffer, "\n") <= $lines) {
            $read = min($chunk, $pos);
            $pos -= $read;
            fseek($f, $pos);
            $buffer = fread($f, $read) . $buffer;
        }
        fclose($f);
        $all = explode("\n", $buffer);
        return array_slice($all, -$lines - 1);
    }

    private function dirSize(string $dir): int
    {
        if (!is_dir($dir)) return 0;
        $size = 0;
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            $size += $file->getSize();
        }
        return $size;
    }
}
