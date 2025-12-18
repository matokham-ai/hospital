<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\OpdAppointment;
use App\Models\Prescription;
use App\Models\EmergencyPatient;
use App\Services\PrescriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class OpdPrescriptionController extends Controller
{
    protected PrescriptionService $prescriptionService;

    public function __construct(PrescriptionService $prescriptionService)
    {
        $this->prescriptionService = $prescriptionService;
    }

    /**
     * Store a new prescription for an OPD appointment
     * 
     * POST /api/opd/appointments/{id}/prescriptions
     */
    public function store(Request $request, int $appointmentId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
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
            'drug_id' => 'required|integer|exists:drug_formulary,id',
            'dosage' => 'required|string',
            'frequency' => 'required|string',
            'duration' => 'required|integer|min:1',
            'quantity' => 'required|integer|min:1',
            'instant_dispensing' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        // Check if patient is an emergency patient
        $isEmergencyPatient = EmergencyPatient::where('patient_id', $appointment->patient_id)
            ->where('status', '!=', 'discharged')
            ->exists();

        // Validate instant dispensing availability
        if (isset($validated['instant_dispensing']) && $validated['instant_dispensing']) {
            if (!$isEmergencyPatient) {
                return response()->json([
                    'message' => 'Instant dispensing is only available for emergency patients'
                ], 422);
            }
        }

        try {
            // Get drug details to populate drug_name
            $drug = \App\Models\DrugFormulary::findOrFail($validated['drug_id']);
            
            // Prepare prescription data
            $prescriptionData = array_merge($validated, [
                'encounter_id' => $appointmentId,
                'patient_id' => $appointment->patient_id,
                'physician_id' => $appointment->doctor_id,
                'drug_name' => $drug->name,
                'status' => 'pending',
            ]);

            // Create prescription using service
            $prescription = $this->prescriptionService->createPrescription($prescriptionData);

            // Load relationships
            $prescription->load(['drugFormulary', 'patient', 'physician']);

            return response()->json([
                'message' => 'Prescription created successfully',
                'data' => $prescription
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create prescription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing prescription for an OPD appointment
     * 
     * PUT /api/opd/appointments/{id}/prescriptions/{prescriptionId}
     */
    public function update(Request $request, int $appointmentId, int $prescriptionId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
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

        // Find the prescription
        $prescription = Prescription::where('id', $prescriptionId)
            ->where('encounter_id', $appointmentId)
            ->firstOrFail();

        // Validate request
        $validated = $request->validate([
            'drug_id' => 'sometimes|required|integer|exists:drug_formulary,id',
            'dosage' => 'sometimes|required|string',
            'frequency' => 'sometimes|required|string',
            'duration' => 'sometimes|required|integer|min:1',
            'quantity' => 'sometimes|required|integer|min:1',
            'instant_dispensing' => 'sometimes|boolean',
            'notes' => 'nullable|string',
        ]);

        // Check if patient is an emergency patient
        $isEmergencyPatient = EmergencyPatient::where('patient_id', $appointment->patient_id)
            ->where('status', '!=', 'discharged')
            ->exists();

        // Validate instant dispensing availability
        if (isset($validated['instant_dispensing']) && $validated['instant_dispensing']) {
            if (!$isEmergencyPatient) {
                return response()->json([
                    'message' => 'Instant dispensing is only available for emergency patients'
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // If changing instant dispensing status
            $wasInstantDispensing = $prescription->instant_dispensing;
            $willBeInstantDispensing = $validated['instant_dispensing'] ?? $wasInstantDispensing;

            // Release old stock if was instant dispensing and now isn't
            if ($wasInstantDispensing && !$willBeInstantDispensing) {
                $this->prescriptionService->releaseStock($prescription);
            }

            // Check allergies if drug_id changed
            if (isset($validated['drug_id']) && $validated['drug_id'] !== $prescription->drug_id) {
                if ($this->prescriptionService->checkAllergies($appointment->patient_id, $validated['drug_id'])) {
                    throw ValidationException::withMessages([
                        'drug_id' => ['Patient is allergic to this medication. Prescription blocked.']
                    ]);
                }

                // Check drug interactions
                $interactions = $this->prescriptionService->checkDrugInteractions($appointment->patient_id, $validated['drug_id']);
                if (!empty($interactions)) {
                    $prescription->prescription_data = array_merge(
                        $prescription->prescription_data ?? [],
                        ['drug_interactions' => $interactions]
                    );
                }
            }

            // Update prescription
            $prescription->update($validated);

            // Reserve new stock if now instant dispensing and wasn't before
            if (!$wasInstantDispensing && $willBeInstantDispensing) {
                // Validate stock availability
                if (!$this->prescriptionService->validateInstantDispensing($prescription->drug_id, $prescription->quantity)) {
                    throw ValidationException::withMessages([
                        'instant_dispensing' => ['Insufficient stock for instant dispensing.']
                    ]);
                }
                $this->prescriptionService->reserveStock($prescription);
            }
            // Update stock if quantity changed and is instant dispensing
            elseif ($wasInstantDispensing && $willBeInstantDispensing) {
                $oldQuantity = $prescription->getOriginal('quantity');
                $newQuantity = $validated['quantity'] ?? $oldQuantity;
                
                if ($oldQuantity !== $newQuantity) {
                    // Release old stock
                    $this->prescriptionService->releaseStock($prescription);
                    // Reserve new stock
                    if (!$this->prescriptionService->validateInstantDispensing($prescription->drug_id, $newQuantity)) {
                        throw ValidationException::withMessages([
                            'quantity' => ['Insufficient stock for requested quantity.']
                        ]);
                    }
                    $this->prescriptionService->reserveStock($prescription);
                }
            }

            DB::commit();

            // Load relationships
            $prescription->load(['drugFormulary', 'patient', 'physician']);

            return response()->json([
                'message' => 'Prescription updated successfully',
                'data' => $prescription
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
                'message' => 'Failed to update prescription: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a prescription for an OPD appointment
     * 
     * DELETE /api/opd/appointments/{id}/prescriptions/{prescriptionId}
     */
    public function destroy(Request $request, int $appointmentId, int $prescriptionId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
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

        // Find the prescription
        $prescription = Prescription::where('id', $prescriptionId)
            ->where('encounter_id', $appointmentId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Release stock if it was reserved
            if ($prescription->stock_reserved) {
                $this->prescriptionService->releaseStock($prescription);
            }

            // Delete the prescription
            $prescription->delete();

            DB::commit();

            return response()->json([
                'message' => 'Prescription deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete prescription: ' . $e->getMessage()
            ], 500);
        }
    }
}
