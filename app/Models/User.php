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
        'position',
        'grade',
        'organize',
        'password',
        'birthdate',
        'photo',
        'role',
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

    public function scopeSearch($query, $value): void
    {
        if (! empty($value)) {
            $query->where('emid', 'like', "%{$value}%")
                ->orWhere('fname', 'like', "%{$value}%")
                ->orWhere('lname', 'like', "%{$value}%")
                ->orWhere('email', 'like', "%{$value}%");
        }
    }
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

    public function getRouteKeyName(): string
    {
        return 'emid';
    }
    public function evaluationsGiven()
    {
        return $this->hasMany(Evaluation::class, 'evaluator_id');
    }

    public function evaluationsReceived()
    {
        return $this->hasMany(Evaluation::class, 'evaluatee_id');
    }
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
    public function position()
    {
        return $this->belongsTo(Position::class);
    }
}
