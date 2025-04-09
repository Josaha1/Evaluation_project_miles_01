<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = ['aspect_id', 'title', 'type'];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function options()
    {
        return $this->hasMany(Option::class);
    }

    public function answers()
    {
        return $this->hasMany(EvaluationAnswer::class);
    }

    public function aspects()
    {
        return $this->belongsToMany(Aspect::class, 'aspect_question');
    }

}
