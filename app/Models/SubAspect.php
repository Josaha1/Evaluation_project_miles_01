<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubAspect extends Model
{
    use HasFactory;

    protected $fillable = ['aspect_id', 'name'];

    public function aspect()
    {
        return $this->belongsTo(Aspect::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}