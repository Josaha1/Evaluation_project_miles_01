<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'description', 'user_type', 'grade_min', 'grade_max', 'status'];

    public function parts()
    {
        return $this->hasMany(Part::class);
    }
    public function answers()
    {
        return $this->hasMany(Answer::class);
    }

    public function assignments()
    {
        return $this->hasMany(EvaluationAssignment::class);
    }
}
