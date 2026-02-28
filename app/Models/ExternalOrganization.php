<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExternalOrganization extends Model
{
    protected $fillable = [
        'name',
        'description',
        'contact_person',
        'contact_email',
        'contact_phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function accessCodes(): HasMany
    {
        return $this->hasMany(ExternalAccessCode::class);
    }

    public function evaluationSessions(): HasMany
    {
        return $this->hasMany(ExternalEvaluationSession::class);
    }
}
