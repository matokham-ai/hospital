<?php

namespace App\Rules;

use App\Models\Ward;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class WardCapacityRule implements ValidationRule
{
    protected $wardId;
    protected $departmentId;

    public function __construct($wardId = null, $departmentId = null)
    {
        $this->wardId = $wardId;
        $this->departmentId = $departmentId;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $capacity = (int) $value;

        // Basic capacity validation
        if ($capacity < 1) {
            $fail('The :attribute must be at least 1.');
            return;
        }

        if ($capacity > 500) {
            $fail('The :attribute cannot exceed 500 beds per ward.');
            return;
        }

        // Check if reducing capacity below current bed count
        if ($this->wardId) {
            $ward = Ward::find($this->wardId);
            if ($ward) {
                $currentBedCount = $ward->beds()->count();
                if ($capacity < $currentBedCount) {
                    $fail("The :attribute cannot be reduced below the current number of beds ({$currentBedCount}).");
                    return;
                }

                // Check current occupancy
                $occupiedBeds = $ward->beds()->where('status', 'occupied')->count();
                if ($capacity < $occupiedBeds) {
                    $fail("The :attribute cannot be reduced below the number of currently occupied beds ({$occupiedBeds}).");
                    return;
                }
            }
        }

        // Check department total capacity limits (optional business rule)
        if ($this->departmentId) {
            $departmentTotalCapacity = Ward::where('department_id', $this->departmentId)
                ->when($this->wardId, function ($query) {
                    return $query->where('id', '!=', $this->wardId);
                })
                ->sum('capacity');
            
            $newTotalCapacity = $departmentTotalCapacity + $capacity;
            
            if ($newTotalCapacity > 1000) {
                $fail('The total department capacity would exceed the maximum limit of 1000 beds.');
            }
        }
    }
}
