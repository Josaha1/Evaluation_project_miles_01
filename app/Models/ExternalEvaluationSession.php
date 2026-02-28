<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalEvaluationSession extends Model
{
    protected $fillable = [
        'external_access_code_id',
        'external_organization_id',
        'evaluatee_id',
        'evaluation_id',
        'session_token',
        'ip_address',
        'user_agent',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(ExternalAccessCode::class, 'external_access_code_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(ExternalOrganization::class, 'external_organization_id');
    }

    public function evaluatee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }
}
