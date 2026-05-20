<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalCodeEvaluatee extends Model
{
    protected $table = 'external_code_evaluatees';

    protected $fillable = [
        'external_access_code_id',
        'evaluatee_id',
        'evaluation_id',
    ];

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(ExternalAccessCode::class, 'external_access_code_id');
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
