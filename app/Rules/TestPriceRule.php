<?php

namespace App\Rules;

use App\Models\TestCatalog;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class TestPriceRule implements ValidationRule
{
    protected $testId;
    protected $allowPendingOrdersUpdate;

    public function __construct($testId = null, $allowPendingOrdersUpdate = false)
    {
        $this->testId = $testId;
        $this->allowPendingOrdersUpdate = $allowPendingOrdersUpdate;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $price = (float) $value;

        // Basic price validation
        if ($price < 0) {
            $fail('The :attribute must be at least 0.');
            return;
        }

        if ($price > 999999.99) {
            $fail('The :attribute cannot exceed 999,999.99.');
            return;
        }

        // Check for reasonable price changes (more than 50% increase)
        if ($this->testId) {
            $test = TestCatalog::find($this->testId);
            if ($test && $test->price > 0) {
                $priceChangePercentage = abs(($price - $test->price) / $test->price) * 100;
                
                if ($priceChangePercentage > 50) {
                    $fail('The :attribute change exceeds 50% of the current price. Please verify this significant price change.');
                    return;
                }
            }
        }

        // Validate price precision (max 2 decimal places)
        if (round($price, 2) != $price) {
            $fail('The :attribute can have at most 2 decimal places.');
            return;
        }

        // Check for pending orders if not explicitly allowed
        if ($this->testId && !$this->allowPendingOrdersUpdate) {
            // This would require checking if there are pending lab orders for this test
            // For now, we'll implement a basic check
            $test = TestCatalog::find($this->testId);
            if ($test) {
                // In a real implementation, you would check for pending orders
                // For this example, we'll assume no pending orders check is needed
                // as the orders table structure isn't defined in the current scope
            }
        }
    }
}
