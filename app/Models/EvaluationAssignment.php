<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EvaluationAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'evaluation_id',
        'evaluator_id',
        'evaluatee_id',
        'fiscal_year',
        'angle', // เพิ่ม field angle
    ];

    /**
     * ความสัมพันธ์กับ Evaluation
     */
    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    /**
     * ความสัมพันธ์กับ User (ผู้ประเมิน)
     */
    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    /**
     * ความสัมพันธ์กับ User (ผู้ถูกประเมิน)
     */
    public function evaluatee()
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    /**
     * Scope สำหรับกรองตามปีงบประมาณ
     */
    public function scopeFiscalYear($query, $year)
    {
        return $query->where('fiscal_year', $year);
    }

    /**
     * Scope สำหรับกรองตามองศา
     */
    public function scopeAngle($query, $angle)
    {
        return $query->where('angle', $angle);
    }

    /**
     * Scope สำหรับกรองตามผู้ถูกประเมิน
     */
    public function scopeForEvaluatee($query, $evaluateeId)
    {
        return $query->where('evaluatee_id', $evaluateeId);
    }

    /**
     * Scope สำหรับกรองตามผู้ประเมิน
     */
    public function scopeForEvaluator($query, $evaluatorId)
    {
        return $query->where('evaluator_id', $evaluatorId);
    }

    /**
     * ตรวจสอบว่าผู้ถูกประเมินมีผู้ประเมินครบทุกองศาหรือไม่
     */
    public static function isEvaluateeComplete($evaluateeId, $fiscalYear)
    {
        $evaluatee = User::find($evaluateeId);
        if (! $evaluatee) {
            return false;
        }

        $grade          = (int) $evaluatee->grade;
        $requiredAngles = $grade >= 9 ? ['top', 'bottom', 'left', 'right'] : ['top', 'left'];

        $assignedAngles = self::where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $fiscalYear)
            ->distinct('angle')
            ->pluck('angle')
            ->toArray();

        return count(array_intersect($requiredAngles, $assignedAngles)) === count($requiredAngles);
    }

    /**
     * ดึงสถิติการประเมินของผู้ถูกประเมิน
     */
    public static function getEvaluateeStats($evaluateeId, $fiscalYear)
    {
        $evaluatee = User::find($evaluateeId);
        if (! $evaluatee) {
            return null;
        }

        $grade          = (int) $evaluatee->grade;
        $requiredAngles = $grade >= 9 ? ['top', 'bottom', 'left', 'right'] : ['top', 'left'];

        $assignments = self::where('evaluatee_id', $evaluateeId)
            ->where('fiscal_year', $fiscalYear)
            ->get()
            ->groupBy('angle');

        $stats = [];
        foreach ($requiredAngles as $angle) {
            $stats[$angle] = [
                'required'   => true,
                'count'      => isset($assignments[$angle]) ? $assignments[$angle]->count() : 0,
                'evaluators' => isset($assignments[$angle])
                ? $assignments[$angle]->pluck('evaluator')->toArray()
                : [],
            ];
        }

        // เพิ่มองศาที่ไม่จำเป็นแต่มีการมอบหมาย
        $allAngles      = ['top', 'bottom', 'left', 'right'];
        $optionalAngles = array_diff($allAngles, $requiredAngles);

        foreach ($optionalAngles as $angle) {
            if (isset($assignments[$angle]) && $assignments[$angle]->count() > 0) {
                $stats[$angle] = [
                    'required'   => false,
                    'count'      => $assignments[$angle]->count(),
                    'evaluators' => $assignments[$angle]->pluck('evaluator')->toArray(),
                ];
            }
        }

        return [
            'evaluatee'        => $evaluatee,
            'grade'            => $grade,
            'required_angles'  => $requiredAngles,
            'assignments'      => $stats,
            'is_complete'      => self::isEvaluateeComplete($evaluateeId, $fiscalYear),
            'total_evaluators' => array_sum(array_column($stats, 'count')),
        ];
    }

    /**
     * ตรวจสอบว่าสามารถเพิ่มผู้ประเมินในองศานี้ได้หรือไม่
     */
    public function canAddEvaluator($evaluatorId, $evaluateeId, $angle, $fiscalYear)
    {
        // ตรวจสอบว่าไม่ซ้ำ
        return ! self::where('evaluator_id', $evaluatorId)
            ->where('evaluatee_id', $evaluateeId)
            ->where('angle', $angle)
            ->where('fiscal_year', $fiscalYear)
            ->exists();
    }

    /**
     * แปลงองศาจากภาษาอังกฤษเป็นไทย (สำหรับ backward compatibility)
     */
    public static function translateAngle($angle)
    {
        $translations = [
            'top'    => 'บน',
            'bottom' => 'ล่าง',
            'left'   => 'ซ้าย',
            'right'  => 'ขวา',
        ];

        return $translations[$angle] ?? $angle;
    }

    /**
     * แปลงองศาจากภาษาไทยเป็นอังกฤษ
     */
    public static function translateAngleToEnglish($angle)
    {
        $translations = [
            'บน'   => 'top',
            'ล่าง' => 'bottom',
            'ซ้าย' => 'left',
            'ขวา'  => 'right',
        ];

        return $translations[$angle] ?? $angle;
    }
}
