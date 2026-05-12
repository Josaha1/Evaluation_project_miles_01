<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalStakeholder extends Model
{
    protected $fillable = [
        'external_access_code_id',
        'evaluatee_id',
        'fiscal_year',
        'group_label',
        'sub_group',
        'sequence_no',
        'organization_name',
        'contact_person',
        'contact_info',
        'coordinator',
        'code',
        'source_sheet',
        'source_row',
        'external_session_id',
    ];

    /**
     * Normalize an organization name for comparison: lowercase + strip ALL whitespace.
     * Example: "บริษัท X จำกัด (มหาชน)" and "บริษัท X จำกัด(มหาชน)" → same key.
     * Used for cross-group consolidation match where Excel files spell the same
     * company slightly differently (whitespace before parenthesis, etc.).
     */
    public static function normalizeName(?string $name): string
    {
        if (! $name) return '';
        return preg_replace('/\s+/u', '', mb_strtolower(trim($name)));
    }

    public function accessCode(): BelongsTo
    {
        return $this->belongsTo(ExternalAccessCode::class, 'external_access_code_id');
    }

    public function evaluatee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExternalEvaluationSession::class, 'external_session_id');
    }
}
