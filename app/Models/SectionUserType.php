<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionUserType extends Model
{
    protected $table = 'section_user_type';

    protected $fillable = ['section_id', 'user_type', 'grade_min', 'grade_max'];


    public function section()
    {
        return $this->belongsTo(Section::class);
    }

}
