<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Aspect extends Model
{
    use HasFactory;

    protected $fillable = ['part_id', 'name', 'has_subaspects'];

    public function part()
    {
        return $this->belongsTo(Part::class);
    }

    public function subAspects()
    {
        return $this->hasMany(SubAspect::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}
