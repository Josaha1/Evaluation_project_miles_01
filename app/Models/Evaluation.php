<?php


namespace App\Models;

use App\Enums\UserType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'user_type',
        'grade_min',   
        'grade_max', 
    ];

    public function aspects()
    {
        return $this->belongsToMany(Aspect::class, 'evaluation_aspect');
    }

    public function sections()
    {
        return $this->belongsToMany(Section::class, 'evaluation_section');
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'evaluation_question');
    }

    public function assignments()
    {
        return $this->hasMany(EvaluationAssignment::class);
    }

    public function scopeForUserType($query, $userType)
    {
        return $query->where('user_type', $userType);
    }

    public function getUserTypeLabelAttribute()
    {
        return match ($this->user_type) {
            'internal_9_12' => 'ภายในระดับ 9-12',
            'external_9_12' => 'ภายนอกระดับ 9-12',
            'internal_5_8' => 'ภายในระดับ 5-8',
            default => 'ไม่ทราบประเภท',
        };
    }

    // Optional if you're using enum
     protected $casts = [
        'user_type' => UserType::class,
    ];
}
