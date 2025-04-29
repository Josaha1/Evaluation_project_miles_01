<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Positions extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'department_id'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function users()
    {
        return $this->hasMany(User::class); // ถ้า User มี position_id
    }
}
