<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\OpdAppointment;
use App\Models\LabOrder;
use App\Services\LabOrderService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class OpdLabOrderController extends Controller
{
    protected LabOrderService $labOrderService;

    public function __construct(LabOrderService $labOrderService)
    {
        $this->labOrderService = $labOrderService;
    }

    /**
     * Store a new lab order for an OPD appointment
     * 
     * POST /api/opd/appointments/{id}/lab-orders
     */
    public function store(Request $request, int $appointmentId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['Admin', 'Doctor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Find the appointment
        $appointment = OpdAppointment::findOrFail($appointmentId);
        
        // Check if consultation is completed
        if ($appointment->status === 'COMPLETED') {
            return response()->json([
                'message' => 'Cannot modify completed consultation'
            ], 422);
        }

        // Validate request
        $validated = $request->validate([
            'test_id' => 'required|integer|exists:test_catalogs,id',
            'priority' => 'required|string|in:urgent,fast,normal',
            'clinical_notes' => 'nullable|string',
        ]);

        try {
            // Get test details to populate test_name
            $test = \App\Models\TestCatalog::findOrFail($validated['test_id']);
            
            // Prepare lab order data
            $labOrderData = array_merge($validated, [
                'encounter_id' => $appointmentId,
                'patient_id' => $appointment->patient_id,
                'ordered_by' => $appointment->doctor_id,
                'test_name' => $test->name,
                'status' => 'pending',
            ]);

            // Create lab order using service
            $labOrder = $this->labOrderService->createLabOrder($labOrderData);

            // Load relationships
            $labOrder->load(['testCatalog', 'patient', 'physician']);

            return response()->json([
                'message' => 'Lab order created successfully',
                'data' => $labOrder
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create lab order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing lab order for an OPD appointment
     * 
     * PUT /api/opd/appointments/{id}/lab-orders/{labOrderId}
     */
    public function update(Request $request, int $appointmentId, int $labOrderId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['Admin', 'Doctor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Find the appointment
        $appointment = OpdAppointment::findOrFail($appointmentId);
        
        // Check if consultation is completed
        if ($appointment->status === 'COMPLETED') {
            return response()->json([
                'message' => 'Cannot modify completed consultation'
            ], 422);
        }

        // Find the lab order
        $labOrder = LabOrder::where('id', $labOrderId)
            ->where('encounter_id', $appointmentId)
            ->firstOrFail();

        // Validate request
        $validated = $request->validate([
            'test_id' => 'sometimes|required|integer|exists:test_catalogs,id',
            'test_name' => 'sometimes|required|string',
            'priority' => 'sometimes|required|string|in:urgent,fast,normal',
            'clinical_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // If test_id changed, update test_name
            if (isset($validated['test_id']) && $validated['test_id'] !== $labOrder->test_id) {
                $test = \App\Models\TestCatalog::findOrFail($validated['test_id']);
                $validated['test_name'] = $test->name;
            }

            // Update lab order
            $labOrder->update($validated);

            // If priority changed, recalculate expected completion time
            if (isset($validated['priority']) && $validated['priority'] !== $labOrder->getOriginal('priority')) {
                $labOrder->calculateExpectedCompletion();
            }

            DB::commit();

            // Load relationships
            $labOrder->load(['testCatalog', 'patient', 'physician']);

            return response()->json([
                'message' => 'Lab order updated successfully',
                'data' => $labOrder
            ], 200);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update lab order: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a lab order for an OPD appointment
     * 
     * DELETE /api/opd/appointments/{id}/lab-orders/{labOrderId}
     */
    public function destroy(Request $request, int $appointmentId, int $labOrderId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole(['Admin', 'Doctor'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Find the appointment
        $appointment = OpdAppointment::findOrFail($appointmentId);
        
        // Check if consultation is completed
        if ($appointment->status === 'COMPLETED') {
            return response()->json([
                'message' => 'Cannot modify completed consultation'
            ], 422);
        }

        // Find the lab order
        $labOrder = LabOrder::where('id', $labOrderId)
            ->where('encounter_id', $appointmentId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Delete the lab order
            $labOrder->delete();

            DB::commit();

            return response()->json([
                'message' => 'Lab order deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete lab order: ' . $e->getMessage()
            ], 500);
        }
    }
}
