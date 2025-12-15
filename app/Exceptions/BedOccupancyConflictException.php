<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BedOccupancyConflictException extends Exception
{
    protected $bed;
    protected $conflictType;
    protected $currentStatus;
    protected $requestedStatus;

    public function __construct($bed, string $conflictType, string $currentStatus = null, string $requestedStatus = null, $message = null)
    {
        $this->bed = $bed;
        $this->conflictType = $conflictType;
        $this->currentStatus = $currentStatus ?? $bed->status;
        $this->requestedStatus = $requestedStatus;
        
        $defaultMessage = match($conflictType) {
            'occupied_to_maintenance' => "Cannot change bed {$bed->bed_number} from occupied to maintenance. Please discharge the patient first.",
            'occupied_to_out_of_order' => "Cannot change bed {$bed->bed_number} from occupied to out of order. Please discharge the patient first.",
            'capacity_exceeded' => "Cannot add more beds to ward. Capacity limit exceeded.",
            'invalid_status_transition' => "Invalid status transition from {$this->currentStatus} to {$this->requestedStatus} for bed {$bed->bed_number}.",
            default => "Bed occupancy conflict detected for bed {$bed->bed_number}."
        };
        
        parent::__construct($message ?? $defaultMessage);
    }

    public function getBed()
    {
        return $this->bed;
    }

    public function getConflictType(): string
    {
        return $this->conflictType;
    }

    public function getCurrentStatus(): string
    {
        return $this->currentStatus;
    }

    public function getRequestedStatus(): ?string
    {
        return $this->requestedStatus;
    }

    public function render(Request $request): JsonResponse
    {
        $suggestions = match($this->conflictType) {
            'occupied_to_maintenance' => [
                'Discharge the patient first',
                'Transfer the patient to another bed',
                'Schedule maintenance for after patient discharge'
            ],
            'occupied_to_out_of_order' => [
                'Discharge the patient first',
                'Transfer the patient to another bed',
                'Mark bed for maintenance after discharge'
            ],
            'capacity_exceeded' => [
                'Increase ward capacity first',
                'Remove unused beds from the ward',
                'Create beds in a different ward'
            ],
            'invalid_status_transition' => [
                'Check the bed status workflow',
                'Ensure proper status transition sequence',
                'Contact system administrator if needed'
            ],
            default => ['Contact system administrator for assistance']
        };

        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'BED_OCCUPANCY_CONFLICT',
            'conflict_type' => $this->conflictType,
            'bed' => [
                'id' => $this->bed->id,
                'bed_number' => $this->bed->bed_number,
                'current_status' => $this->currentStatus,
                'requested_status' => $this->requestedStatus,
                'ward' => $this->bed->ward ? [
                    'id' => $this->bed->ward->id,
                    'name' => $this->bed->ward->name,
                ] : null,
            ],
            'suggestions' => $suggestions
        ], 422);
    }
}
