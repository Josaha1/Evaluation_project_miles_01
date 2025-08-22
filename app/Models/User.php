<?php
namespace App\Models;

use App\Enums\UserType;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'emid',
        'prename',
        'fname',
        'lname',
        'sex',
        'position_id', // ใช้ position_id แทน position
        'grade',
        'division_id',   // เพิ่ม division_id
        'department_id', // เพิ่ม department_id
        'faction_id',
        'role',
        'password',
        'birthdate',
        'photo',
        'user_type',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'birthdate'  => 'date',
        'user_type'  => UserType::class,
    ];

    // Relationships
    public function position()
    {
        return $this->belongsTo(Position::class)->withDefault([
            'title' => 'ไม่ระบุตำแหน่ง',
            'name'  => 'ไม่ระบุตำแหน่ง',
        ]);
    }

    public function division()
    {
        return $this->belongsTo(Divisions::class)->withDefault([
            'name' => 'ไม่ระบุสายงาน',
        ]);
    }

    public function department()
    {
        return $this->belongsTo(Departments::class)->withDefault([
            'name' => 'ไม่ระบุหน่วยงาน',
        ]);
    }
    public function faction()
    {
        return $this->belongsTo(Factions::class)->withDefault([
            'name' => 'ไม่ระบุฝ่าย',
        ]);
    }

    // Existing relationships
    public function assignmentsAsEvaluator()
    {
        return $this->hasMany(EvaluationAssignment::class, 'evaluator_id');
    }

    public function assignmentsAsEvaluatee()
    {
        return $this->hasMany(EvaluationAssignment::class, 'evaluatee_id');
    }

    public function answersGiven()
    {
        return $this->hasMany(Answer::class, 'user_id');
    }

    public function answersReceived()
    {
        return $this->hasMany(Answer::class, 'evaluatee_id');
    }

    public function assignedEvaluations()
    {
        return $this->hasMany(EvaluationAssignment::class, 'evaluatee_id');
    }

    // Scopes
    public function scopeSearch($query, $value): void
    {
        if (! empty($value)) {
            $query->where('emid', 'like', "%{$value}%")
                ->orWhere('fname', 'like', "%{$value}%")
                ->orWhere('lname', 'like', "%{$value}%");
        }
    }

    public function scopeInternal($query)
    {
        return $query->where('user_type', 'internal');
    }

    public function scopeExternal($query)
    {
        return $query->where('user_type', 'external');
    }

    public function scopeByGrade($query, $grade)
    {
        return $query->where('grade', $grade);
    }

    public function scopeByGradeRange($query, $minGrade, $maxGrade)
    {
        return $query->whereBetween('grade', [$minGrade, $maxGrade]);
    }

    // Accessors
    public function getPhotoUrlAttribute()
    {
        if (! $this->photo) {
            return '/images/default.jpg';
        }

        if (str_starts_with($this->photo, 'http')) {
            return $this->photo;
        }

        return asset('storage/' . $this->photo);
    }

    public function getFullNameAttribute()
    {
        return $this->prename . $this->fname . ' ' . $this->lname;
    }

    public function getPositionTitleAttribute()
    {
        return $this->position?->title ?? $this->position?->name ?? 'ไม่ระบุตำแหน่ง';
    }

    public function getDivisionNameAttribute()
    {
        return $this->division?->name ?? 'ไม่ระบุสายงาน';
    }
    public function getFactionNameAttribute()
    {
        return $this->faction?->name ?? 'ไม่ระบุฝ่าย';
    }
    public function getDepartmentNameAttribute()
    {
        return $this->department?->name ?? 'ไม่ระบุหน่วยงาน';
    }

    // Helper Methods
    public function getRequiredEvaluationAngles()
    {
        $grade = (int) $this->grade;
        return $grade >= 9 ? ['บน', 'ล่าง', 'ซ้าย', 'ขวา'] : ['บน', 'ซ้าย'];
    }

    public function isEvaluationComplete($fiscalYear)
    {
        $requiredAngles = $this->getRequiredEvaluationAngles();
        $assignedAngles = $this->assignmentsAsEvaluatee()
            ->where('fiscal_year', $fiscalYear)
            ->distinct('angle')
            ->pluck('angle')
            ->toArray();

        return count(array_intersect($requiredAngles, $assignedAngles)) === count($requiredAngles);
    }

    public function getEvaluationProgress($fiscalYear)
    {
        $requiredAngles = $this->getRequiredEvaluationAngles();
        $assignedAngles = $this->assignmentsAsEvaluatee()
            ->where('fiscal_year', $fiscalYear)
            ->distinct('angle')
            ->pluck('angle')
            ->toArray();

        return [
            'required_count'  => count($requiredAngles),
            'assigned_count'  => count(array_intersect($requiredAngles, $assignedAngles)),
            'completion_rate' => count($requiredAngles) > 0
            ? round((count(array_intersect($requiredAngles, $assignedAngles)) / count($requiredAngles)) * 100, 2)
            : 0,
            'is_complete'     => count(array_intersect($requiredAngles, $assignedAngles)) === count($requiredAngles),
        ];
    }

    public function canEvaluateUser($userId, $angle)
    {
        $targetUser = self::find($userId);
        if (! $targetUser) {
            return false;
        }

        $myGrade     = (int) $this->grade;
        $targetGrade = (int) $targetUser->grade;

        switch ($angle) {
            case 'บน':
                return $myGrade > $targetGrade;
            case 'ล่าง':
                return $myGrade < $targetGrade;
            case 'ซ้าย':
                return $myGrade === $targetGrade;
            case 'ขวา':
                return $this->user_type === 'external';
            default:
                return false;
        }
    }

    public function getRouteKeyName(): string
    {
        return 'emid';
    }
}
