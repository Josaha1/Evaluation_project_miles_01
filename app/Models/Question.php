<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'type', 'part_id', 'aspect_id', 'sub_aspect_id'];


    public function part()
    {
        return $this->belongsTo(Part::class);
    }

    public function aspect()
    {
        return $this->belongsTo(Aspect::class);
    }

    public function subAspect()
    {
        return $this->belongsTo(SubAspect::class);
    }

    public function options()
    {
        return $this->hasMany(Option::class);
    }
}