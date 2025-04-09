<?php
namespace App\Models;

use App\Enums\SectionTargetGroup;
use App\Models\Aspect;
use App\Models\SectionUserType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Section extends Model
{
    use HasFactory;

    protected $table = 'sections'; // ชื่อ table ในฐานข้อมูล

    protected $fillable = ['name', 'description'];

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
    protected $casts = [
        'target_group' => SectionTargetGroup::class,
    ];
    public function aspects(): BelongsToMany
    {
        return $this->belongsToMany(Aspect::class, 'aspect_section');
    }
    public function userTypes()
    {
        return $this->hasMany(SectionUserType::class);
    }

}
