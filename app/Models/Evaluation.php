<?php


namespace App\Models;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'description', 'user_type','grade_min', 'grade_max'];

    public function parts()
    {
        return $this->hasMany(Part::class);
    }
}
