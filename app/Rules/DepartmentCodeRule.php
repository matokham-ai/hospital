<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class DepartmentCodeRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $code = strtoupper(trim($value));

        // Check code format: 2-10 characters, alphanumeric, no spaces
        if (!preg_match('/^[A-Z0-9]{2,10}$/', $code)) {
            $fail('The :attribute must be 2-10 characters long and contain only letters and numbers.');
            return;
        }

        // Check for reserved codes
        $reservedCodes = ['ADMIN', 'SYSTEM', 'TEST', 'TEMP', 'NULL', 'VOID'];
        if (in_array($code, $reservedCodes)) {
            $fail('The :attribute "' . $code . '" is reserved and cannot be used.');
            return;
        }

        // Check for common medical department code patterns
        $validPrefixes = ['CARD', 'NEUR', 'ORTH', 'PEDI', 'GYNE', 'SURG', 'MED', 'ICU', 'ER', 'LAB', 'RAD', 'PHARM'];
        $hasValidPrefix = false;
        
        foreach ($validPrefixes as $prefix) {
            if (str_starts_with($code, $prefix)) {
                $hasValidPrefix = true;
                break;
            }
        }

        // Allow custom codes but warn about non-standard patterns
        if (!$hasValidPrefix && strlen($code) < 4) {
            $fail('The :attribute should follow medical department naming conventions or be at least 4 characters long.');
        }
    }
}
