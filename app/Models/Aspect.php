<?php
namespace App\Models;

use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Aspect extends Model
{
    use HasFactory;

    protected $fillable = ['section_id', 'name', 'description'];

    public function sections(): BelongsToMany
    {
        return $this->belongsToMany(Section::class, 'aspect_section');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

}
