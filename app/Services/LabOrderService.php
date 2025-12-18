<?php

namespace App\Services;

use App\Models\LabOrder;
use App\Models\TestCatalog;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

/**
 * Service for managing laboratory test orders with priority levels
 */
class LabOrderService
{
    /**
     * Create a new lab order with priority validation
     * 
     * @param array $data Lab order data including test_id, patient_id, priority, etc.
     * @return LabOrder
     * @throws ValidationException if priority is missing or invalid
     */
    public function createLabOrder(array $data): LabOrder
    {
        // Validate that priority is provided
        if (!isset($data['priority']) || empty($data['priority'])) {
            throw ValidationException::withMessages([
                'priority' => ['Priority level is required for lab orders.']
            ]);
        }

        // Validate priority value
        $validPriorities = config('lab.valid_priorities', ['urgent', 'fast', 'normal']);
        if (!in_array($data['priority'], $validPriorities)) {
            throw ValidationException::withMessages([
                'priority' => ['Invalid priority level. Must be one of: ' . implode(', ', $validPriorities)]
            ]);
        }

        return DB::transaction(function () use ($data) {
            // Get test catalog information if test_id is provided
            $testCatalog = null;
            if (isset($data['test_id'])) {
                $testCatalog = TestCatalog::find($data['test_id']);
                if ($testCatalog) {
                    $data['test_name'] = $data['test_name'] ?? $testCatalog->name;
                }
            }

            // Set default status if not provided
            $data['status'] = $data['status'] ?? 'pending';
            
            // Ensure ordered_by is a string if provided (column is nullable)
            if (isset($data['ordered_by']) && $data['ordered_by'] !== null) {
                $data['ordered_by'] = (string)$data['ordered_by'];
            }

            // Create the lab order
            $labOrder = LabOrder::create($data);

            // Calculate and set expected completion time
            $this->calculateExpectedCompletion($labOrder);

            return $labOrder->fresh();
        });
    }

    /**
     * Update the priority level of an existing lab order
     * 
     * @param int $labOrderId
     * @param string $priority
     * @return LabOrder
     * @throws ValidationException if priority is invalid
     */
    public function updatePriority(int $labOrderId, string $priority): LabOrder
    {
        // Validate priority value
        $validPriorities = config('lab.valid_priorities', ['urgent', 'fast', 'normal']);
        if (!in_array($priority, $validPriorities)) {
            throw ValidationException::withMessages([
                'priority' => ['Invalid priority level. Must be one of: ' . implode(', ', $validPriorities)]
            ]);
        }

        return DB::transaction(function () use ($labOrderId, $priority) {
            $labOrder = LabOrder::findOrFail($labOrderId);
            
            // Update priority
            $labOrder->priority = $priority;
            $labOrder->save();

            // Recalculate expected completion time based on new priority
            $this->calculateExpectedCompletion($labOrder);

            return $labOrder->fresh();
        });
    }

    /**
     * Get the expected turnaround time in hours for a test with given priority
     * 
     * @param int $testId
     * @param string $priority
     * @return int Turnaround time in hours
     */
    public function getExpectedTurnaroundTime(int $testId, string $priority): int
    {
        // Get base turnaround time from config
        $baseTurnaroundHours = config("lab.priorities.{$priority}.turnaround_hours", 24);

        // Try to get test-specific turnaround time
        $testCatalog = TestCatalog::find($testId);
        
        if ($testCatalog && $testCatalog->turnaround_time) {
            $testTurnaroundHours = $testCatalog->turnaround_time;
            
            // Adjust based on priority - urgent and fast priorities cap the turnaround time
            if ($priority === 'urgent') {
                return min($testTurnaroundHours, 2);
            } elseif ($priority === 'fast') {
                return min($testTurnaroundHours, 6);
            } else {
                // For normal priority, use the test's standard turnaround time
                return $testTurnaroundHours;
            }
        }

        // Fall back to config-based turnaround time
        return $baseTurnaroundHours;
    }

    /**
     * Submit a lab order to the laboratory system
     * 
     * This method marks the order as submitted and ensures it's flagged
     * appropriately based on priority level.
     * 
     * @param LabOrder $labOrder
     * @return void
     */
    public function submitToLaboratory(LabOrder $labOrder): void
    {
        DB::transaction(function () use ($labOrder) {
            // Update status to in_progress (submitted to laboratory)
            $labOrder->status = 'in_progress';
            
            // Ensure expected completion time is set
            if (!$labOrder->expected_completion_at) {
                $this->calculateExpectedCompletion($labOrder);
            }
            
            $labOrder->save();

            // Log submission for urgent orders
            if ($labOrder->isUrgent()) {
                \Log::info('Urgent lab order submitted', [
                    'lab_order_id' => $labOrder->id,
                    'test_name' => $labOrder->test_name,
                    'patient_id' => $labOrder->patient_id,
                    'expected_completion' => $labOrder->expected_completion_at,
                ]);
            }
        });
    }

    /**
     * Calculate and set the expected completion time for a lab order
     * 
     * @param LabOrder $labOrder
     * @return void
     */
    private function calculateExpectedCompletion(LabOrder $labOrder): void
    {
        $turnaroundHours = $this->getExpectedTurnaroundTime(
            $labOrder->test_id ?? 0,
            $labOrder->priority
        );

        $labOrder->expected_completion_at = now()->addHours($turnaroundHours);
        $labOrder->save();
    }
}
