<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluatee extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'position', 'grade', 'photo'];

    public function assignments()
    {
        return $this->hasMany(EvaluationAssignment::class);
    }
}
