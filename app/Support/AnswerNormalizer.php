<?php
namespace App\Support;

class AnswerNormalizer
{
    /**
     * Normalize an answer payload coming from frontend.
     * Handles 3 wire shapes:
     *   - {value, other_text}          → unwrap envelope
     *   - {option_id, other_text}      → single choice with other_text
     *   - [id, {option_id, other_text}, ...] → multi-choice with object items
     * Returns ['value' => normalized, 'other_text' => string|null]
     * Resulting `value` is bare scalar/array (NOT json_encoded yet).
     */
    public static function normalize($raw): array
    {
        $otherText = null;
        $value = $raw;

        if (is_array($raw)) {
            // {value, other_text} envelope
            if (array_key_exists('value', $raw) && array_key_exists('other_text', $raw)) {
                $value = $raw['value'];
                $otherText = $raw['other_text'];
            }
            // {option_id, other_text} — single choice form
            elseif (isset($raw['option_id']) && !array_is_list($raw)) {
                $value = $raw['option_id'];
                $otherText = $raw['other_text'] ?? null;
            }
        }

        // Walk array items, lift any embedded {option_id, other_text} object into bare ID + column
        if (is_array($value) && array_is_list($value)) {
            $normalized = [];
            foreach ($value as $item) {
                if (is_array($item) && isset($item['option_id'])) {
                    $normalized[] = $item['option_id'];
                    if (!empty($item['other_text']) && $otherText === null) {
                        $otherText = $item['other_text'];
                    }
                } else {
                    $normalized[] = $item;
                }
            }
            $value = array_values(array_unique($normalized, SORT_REGULAR));
        }

        return ['value' => $value, 'other_text' => $otherText];
    }
}
