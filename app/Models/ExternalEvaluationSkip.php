<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalEvaluationSkip extends Model
{
    protected $fillable = [
        'external_evaluation_session_id',
        'evaluatee_id',
        'reason',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExternalEvaluationSession::class, 'external_evaluation_session_id');
    }

    public function evaluatee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }
}
