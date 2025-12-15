<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AtcCodeRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return; // Allow nullable ATC codes
        }

        // ATC code format: A00AA00 (Letter, 2 digits, 2 letters, 2 digits)
        if (!preg_match('/^[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}$/', $value)) {
            $fail('The :attribute must follow the ATC code format (e.g., A02BC01).');
            return;
        }

        // Validate first level (anatomical group)
        $anatomicalGroups = ['A', 'B', 'C', 'D', 'G', 'H', 'J', 'L', 'M', 'N', 'P', 'R', 'S', 'V'];
        if (!in_array($value[0], $anatomicalGroups)) {
            $fail('The :attribute has an invalid anatomical group. Must be one of: ' . implode(', ', $anatomicalGroups));
        }
    }
}
