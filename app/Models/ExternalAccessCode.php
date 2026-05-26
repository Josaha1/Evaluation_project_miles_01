<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExternalAccessCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'external_organization_id',
        'evaluation_assignment_id',
        'evaluatee_id',
        'evaluation_id',
        'fiscal_year',
        'is_used',
        'use_count',
        'max_uses',
        'used_at',
        'expires_at',
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function sessions()
    {
        return $this->hasMany(ExternalEvaluationSession::class, 'external_access_code_id');
    }

    /**
     * Pivot: evaluatees this code can evaluate.
     * 1 code now covers multiple evaluatees (1 org → N people to evaluate).
     */
    public function codeEvaluatees()
    {
        return $this->hasMany(ExternalCodeEvaluatee::class, 'external_access_code_id');
    }

    /**
     * Pre-listed stakeholders captured from Excel import (องศาขวา bulk import).
     */
    public function stakeholders()
    {
        return $this->hasMany(ExternalStakeholder::class, 'external_access_code_id');
    }

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
     * Check if the access code is valid:
     *   - Not manually revoked (is_used=true used to mean "used", now means "manually revoked")
     *   - Not expired
     *   - Not exceeded max_uses (if set)
     * Multiple people from same org can use the same code as long as max_uses not exceeded.
     */
    public function isValid(): bool
    {
        if ($this->is_used) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->use_count >= $this->max_uses) {
            return false;
        }

        return true;
    }
}
