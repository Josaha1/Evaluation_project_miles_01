<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departments extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'division_id'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function division()
    {
        return $this->belongsTo(Divisions::class);
    }

    public function positions()
    {
        return $this->hasMany(Position::class, 'department_id');
    }
}
