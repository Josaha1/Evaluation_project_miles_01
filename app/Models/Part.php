<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    use HasFactory;

    protected $fillable = ['evaluation_id', 'title', 'order'];

    public function evaluation()
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function aspects()
    {
        return $this->hasMany(Aspect::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
}