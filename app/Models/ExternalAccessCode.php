<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExternalAccessCode extends Model
{
    protected $fillable = [
        'code',
        'external_organization_id',
        'evaluation_assignment_id',
        'evaluatee_id',
        'evaluation_id',
        'fiscal_year',
        'is_used',
        'used_at',
        'expires_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(ExternalOrganization::class, 'external_organization_id');
    }

    public function evaluationAssignment(): BelongsTo
    {
        return $this->belongsTo(EvaluationAssignment::class);
    }

    public function evaluatee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function session(): HasOne
    {
        return $this->hasOne(ExternalEvaluationSession::class, 'external_access_code_id');
    }

    /**
     * Check if the access code is valid (not used AND not expired).
     */
    public function isValid(): bool
    {
        if ($this->is_used) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
