<?php

namespace App\Services;

use App\Models\EvaluationAssignment;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;

/**
 * Service that reads a colored Excel export and applies the indicated changes
 * back to evaluation_assignments:
 *  - 🔴 Red FILL on a row → delete all of that evaluator's assignments for the year
 *  - 🔴 Red FONT run inside a cell → delete that specific (evaluator, evaluatee) pair
 *  - 🟢 Green FONT run → add (evaluator, evaluatee) with auto-resolved angle
 *  - 🟡 Yellow FONT run → flag duplicate; keep only the row whose angle matches the rule
 *
 * Name matching is STRICT: `(prename + fname + lname)` after whitespace normalization.
 * If a name does not match exactly to one user, it is reported as `unmatched`.
 *
 * Angle resolution (internal evaluators):
 *   evaluator_grade > evaluatee_grade  → 'top'    (boss → subordinate)
 *   evaluator_grade < evaluatee_grade  → 'bottom' (subordinate → boss)
 *   evaluator_grade == evaluatee_grade → 'left'   (peer)
 *   evaluator user_type='external'     → 'right'
 */
class ApplyColoredAnnotationsService
{
    public const COLOR_RED   = 'FFFF0000';
    public const COLOR_GREEN = 'FF00B050';
    public const COLOR_YELLOW = 'FFFFFF00';

    /**
     * Strip ordinal/dash prefix and detail suffix from a single line.
     * Returns null if the line has no recognizable name part.
     */
    public function parseLine(string $line): ?string
    {
        $line = trim($line);
        if ($line === '') return null;

        // Strip leading ordinal "1." / "1)" / "-" / "•"
        $line = preg_replace('/^(?:\d+[\.\)]\s*|[-–•]\s*)/u', '', $line);

        // Strip suffix from " · " (used as separator for grade/division)
        $idx = mb_strpos($line, ' · ');
        if ($idx !== false) $line = mb_substr($line, 0, $idx);

        // Strip suffix from " ผอ." / " ผช." / "(" — these mark titles/positions
        foreach ([' ผอ.', ' ผช.', ' (', ' ระดับ '] as $marker) {
            $idx = mb_strpos($line, $marker);
            if ($idx !== false) $line = mb_substr($line, 0, $idx);
        }

        $line = trim($line);
        return $line !== '' ? $line : null;
    }

    /**
     * Manual aliases for known spelling differences in the colored Excel that
     * cannot be auto-matched. Map normalized cell text → canonical user emid.
     */
    private const NAME_ALIASES = [
        'นางสาวศิริรัตน์เกลี้ยง' => '361032',  // actual: ภู่เกลี้ยง
    ];

    /**
     * Strict user matcher: returns a single User if exactly one user matches,
     * null otherwise (no match OR ambiguous).
     */
    public function findUserExact(string $name, Collection $allUsers): ?User
    {
        $key = $this->normalizeName($name);
        if ($key === '') return null;

        // 1. Try alias table first
        if (isset(self::NAME_ALIASES[$key])) {
            $emid = self::NAME_ALIASES[$key];
            $u = $allUsers->firstWhere('emid', $emid);
            if ($u) return $u;
        }

        $matches = $allUsers->filter(function ($u) use ($key) {
            $candidates = [
                $this->normalizeName(($u->prename ?? '') . ($u->fname ?? '') . ($u->lname ?? '')),
                $this->normalizeName(($u->prename ?? '') . ' ' . ($u->fname ?? '') . ' ' . ($u->lname ?? '')),
                $this->normalizeName(($u->fname ?? '') . ' ' . ($u->lname ?? '')),
            ];
            return in_array($key, $candidates, true);
        });

        return $matches->count() === 1 ? $matches->first() : null;
    }

    /** Lowercase + remove all whitespace, for tolerant strict comparison. */
    public function normalizeName(?string $s): string
    {
        if (! $s) return '';
        return preg_replace('/\s+/u', '', mb_strtolower(trim($s)));
    }

    /** Compute the correct angle from grades + user types. */
    public function computeAngle(?int $evaluatorGrade, ?int $evaluateeGrade, ?string $evaluatorType = 'internal'): string
    {
        if ($evaluatorType === 'external' || $evaluatorType === 'external_org') return 'right';
        $eg = (int) $evaluatorGrade;
        $tg = (int) $evaluateeGrade;
        if ($eg > $tg) return 'top';
        if ($eg < $tg) return 'bottom';
        return 'left';
    }

    /**
     * Apply Phase 1 (red rows) — DELETE all assignments for the listed evaluator emids.
     * Returns ['deleted' => N, 'evaluators' => [emid => count]].
     */
    public function applyRedRows(array $emids, int $fiscalYear, bool $dryRun = false): array
    {
        $users = User::whereIn('emid', $emids)->get(['id', 'emid', 'fname', 'lname']);
        $userIds = $users->pluck('id')->all();
        if (empty($userIds)) return ['deleted' => 0, 'evaluators' => []];

        $perEmid = [];
        foreach ($users as $u) {
            $perEmid[$u->emid] = EvaluationAssignment::where('fiscal_year', $fiscalYear)
                ->where('evaluator_id', $u->id)->count();
        }

        $deleted = 0;
        if (! $dryRun) {
            $deleted = EvaluationAssignment::where('fiscal_year', $fiscalYear)
                ->whereIn('evaluator_id', $userIds)->delete();
        } else {
            $deleted = array_sum($perEmid);
        }
        return ['deleted' => $deleted, 'evaluators' => $perEmid];
    }

    /**
     * Apply Phase Yellow — for each (evaluator, evaluatee, fy) tuple with multiple
     * angle rows, keep only the row whose angle matches computeAngle(); delete the rest.
     */
    public function applyYellowDedup(array $pairs, int $fiscalYear, bool $dryRun = false): array
    {
        $report = ['kept' => 0, 'deleted' => 0, 'pairs' => []];

        foreach ($pairs as [$evaluatorId, $evaluateeId]) {
            $rows = EvaluationAssignment::with(['evaluator:id,grade,user_type', 'evaluatee:id,grade'])
                ->where('fiscal_year', $fiscalYear)
                ->where('evaluator_id', $evaluatorId)
                ->where('evaluatee_id', $evaluateeId)
                ->get();
            if ($rows->count() < 2) continue;

            $first = $rows->first();
            $expectedAngle = $this->computeAngle(
                $first->evaluator?->grade,
                $first->evaluatee?->grade,
                $first->evaluator?->user_type instanceof \BackedEnum
                    ? $first->evaluator->user_type->value
                    : ($first->evaluator?->user_type ?? 'internal')
            );

            $toKeep = $rows->firstWhere('angle', $expectedAngle);
            if (! $toKeep) {
                // No row has the expected angle — keep first as-is, no deletes
                $report['pairs'][] = "evaluator=$evaluatorId evaluatee=$evaluateeId NO_MATCH (kept all " . $rows->count() . ")";
                continue;
            }

            $toDelete = $rows->where('id', '!=', $toKeep->id);
            $report['kept']++;
            $report['deleted'] += $toDelete->count();
            $report['pairs'][] = "evaluator=$evaluatorId evaluatee=$evaluateeId kept_angle=$expectedAngle deleted=" . $toDelete->count();

            if (! $dryRun) {
                EvaluationAssignment::whereIn('id', $toDelete->pluck('id'))->delete();
            }
        }
        return $report;
    }

    /**
     * Apply Phase Green — INSERT (evaluator, evaluatee, angle, evaluation_id).
     * Skips if an assignment already exists or if angle resolution failed.
     */
    public function applyGreenAdds(array $rows, int $fiscalYear, bool $dryRun = false): array
    {
        $report = ['inserted' => 0, 'skipped' => 0, 'duplicates' => 0, 'log' => []];

        foreach ($rows as $row) {
            $evaluatorId = $row['evaluator_id'];
            $evaluateeId = $row['evaluatee_id'];
            $evaluator = User::find($evaluatorId);
            $evaluatee = User::find($evaluateeId);
            if (! $evaluator || ! $evaluatee) {
                $report['skipped']++;
                continue;
            }

            $type = $evaluator->user_type instanceof \BackedEnum
                ? $evaluator->user_type->value
                : ($evaluator->user_type ?? 'internal');
            $angle = $this->computeAngle((int) $evaluator->grade, (int) $evaluatee->grade, $type);

            // Check duplicate
            $exists = EvaluationAssignment::where('fiscal_year', $fiscalYear)
                ->where('evaluator_id', $evaluatorId)
                ->where('evaluatee_id', $evaluateeId)
                ->where('angle', $angle)
                ->exists();
            if ($exists) {
                $report['duplicates']++;
                $report['log'][] = "DUP evaluator=$evaluatorId evaluatee=$evaluateeId angle=$angle";
                continue;
            }

            $evalId = $row['evaluation_id'] ?? EvaluationLookupService::findByGrade(
                (int) $evaluatee->grade, 'internal', $fiscalYear
            )?->id;

            if (! $dryRun) {
                $created = EvaluationAssignment::create([
                    'evaluator_id' => $evaluatorId,
                    'evaluatee_id' => $evaluateeId,
                    'evaluation_id' => $evalId,
                    'angle' => $angle,
                    'fiscal_year' => $fiscalYear,
                ]);
                if ($created && $created->exists) {
                    $report['inserted']++;
                    $report['log'][] = "INS evaluator=$evaluatorId evaluatee=$evaluateeId angle=$angle";
                } else {
                    $report['skipped']++;
                    $report['log'][] = "BLOCKED evaluator=$evaluatorId evaluatee=$evaluateeId angle=$angle (likely model guard)";
                }
            } else {
                $report['inserted']++;
                $report['log'][] = "DRY-INS evaluator=$evaluatorId evaluatee=$evaluateeId angle=$angle eval_id=$evalId";
            }
        }
        return $report;
    }

    /**
     * Read colored Excel and extract structured findings:
     *  ['red_rows' => [emid,…], 'red_runs' => [...], 'green_runs' => [...], 'yellow_runs' => [...]]
     */
    public function scanFile(string $filePath): array
    {
        $ss = IOFactory::load($filePath);
        $sh = $ss->getActiveSheet();
        $highRow = $sh->getHighestRow();

        $out = ['red_rows' => [], 'red_runs' => [], 'green_runs' => [], 'yellow_runs' => []];
        $ignoreFill = ['FFFFFFFF', 'FFF8F9FE', 'FFFFF7E6', 'FF5B6FBC'];
        $ignoreFont = ['FF000000', 'FFFFFFFF', 'FF999999'];

        for ($r = 3; $r <= $highRow; $r++) {
            $emid = trim((string) $sh->getCell("B$r")->getValue());
            if (! $emid || $emid === '—') continue;

            for ($ci = 1; $ci <= 11; $ci++) {
                $col = Coordinate::stringFromColumnIndex($ci);
                $cell = $sh->getCell("$col$r");
                $style = $cell->getStyle();

                $fill = strtoupper((string) $style->getFill()->getStartColor()->getARGB());
                if ($fill === self::COLOR_RED) {
                    $out['red_rows'][$emid] = $emid;
                }

                $val = $cell->getValue();
                if (! ($val instanceof RichText)) continue;
                foreach ($val->getRichTextElements() as $run) {
                    if (! method_exists($run, 'getFont') || ! $run->getFont()) continue;
                    $color = strtoupper((string) $run->getFont()->getColor()->getARGB());
                    if (! $color || in_array($color, $ignoreFont)) continue;

                    // Split by newlines first; some lines have "name - name" pairs
                    $rawLines = preg_split('/\r?\n/', $run->getText());
                    $names = [];
                    foreach ($rawLines as $rl) {
                        // If a line contains " - " (mid-line dash separator) AND
                        // the second half also looks like a Thai prename name, split it.
                        if (preg_match('/^(.+?)\s+-\s+(นาย|นาง|นางสาว|ดร\.|น\.ส\.).*$/u', $rl)) {
                            $halves = preg_split('/\s+-\s+(?=(นาย|นาง|นางสาว|ดร\.|น\.ส\.))/u', $rl);
                            foreach ($halves as $h) {
                                $clean = $this->parseLine($h);
                                if ($clean) $names[] = $clean;
                            }
                            continue;
                        }
                        $clean = $this->parseLine($rl);
                        if ($clean) $names[] = $clean;
                    }
                    if (empty($names)) continue;

                    foreach ($names as $name) {
                        $bucket = match ($color) {
                            self::COLOR_RED    => 'red_runs',
                            self::COLOR_GREEN  => 'green_runs',
                            self::COLOR_YELLOW => 'yellow_runs',
                            default => null,
                        };
                        if (! $bucket) continue;
                        $out[$bucket][] = [
                            'evaluator_emid' => $emid,
                            'col'            => $col,
                            'row'            => $r,
                            'name'           => $name,
                        ];
                    }
                }
            }
        }
        $out['red_rows'] = array_values($out['red_rows']);
        return $out;
    }
}
