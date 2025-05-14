<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Position extends Model
{
    use HasFactory;
    protected $table = 'positions'; 
    protected $fillable = ['title'];

    public function department()
    {
        return $this->belongsTo(Departments::class);
    }

    public function users()
    {
        return $this->hasMany(User::class); // ถ้า User มี position_id
    }
}
