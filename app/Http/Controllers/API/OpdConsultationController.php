<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\OpdAppointment;
use App\Services\OpdService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OpdConsultationController extends Controller
{
    protected OpdService $opdService;

    public function __construct(OpdService $opdService)
    {
        $this->opdService = $opdService;
    }

    /**
     * Complete a consultation
     * 
     * POST /api/opd/appointments/{id}/complete
     * 
     * This endpoint:
     * - Generates a completion summary of all prescriptions and lab orders
     * - Processes instant dispensing prescriptions (creates dispensation records)
     * - Submits all lab orders to the laboratory system with their priority levels
     * - Creates billing items for all prescriptions and lab tests
     * - Updates the consultation status to COMPLETED
     * - Prevents further modifications to prescriptions and lab orders
     * 
     * All operations are wrapped in a database transaction to ensure data integrity.
     * If any error occurs, all changes are rolled back and the consultation remains in draft state.
     */
    public function complete(Request $request, int $appointmentId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('complete consultations')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Find the appointment
            $appointment = OpdAppointment::findOrFail($appointmentId);
            
            // Check if consultation is already completed
            if ($appointment->status === 'COMPLETED') {
                return response()->json([
                    'message' => 'Consultation is already completed and cannot be modified.'
                ], 422);
            }

            // Get consultation summary before completion
            $summary = $this->opdService->getConsultationSummary($appointmentId);

            // Complete the consultation (wrapped in transaction)
            $result = $this->opdService->completeConsultation($appointmentId);

            return response()->json([
                'message' => 'Consultation completed successfully',
                'data' => [
                    'appointment' => $result['appointment'],
                    'soap_note' => $result['soap_note'],
                    'summary' => [
                        'total_prescriptions' => $summary['total_prescriptions'],
                        'total_lab_orders' => $summary['total_lab_orders'],
                        'instant_dispensing_prescriptions' => $summary['instant_dispensing_prescriptions']->count(),
                        'prescriptions_processed' => $result['prescriptions_processed'],
                        'lab_orders_submitted' => $result['lab_orders_submitted'],
                    ]
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Appointment not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to complete consultation', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to complete consultation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get consultation summary before completion
     * 
     * GET /api/opd/appointments/{id}/summary
     * 
     * Returns a summary of all prescriptions and lab orders for the consultation
     * to be displayed before the doctor confirms completion.
     */
    public function summary(Request $request, int $appointmentId): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('view consultations')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Find the appointment
            $appointment = OpdAppointment::findOrFail($appointmentId);

            // Get consultation summary
            $summary = $this->opdService->getConsultationSummary($appointmentId);

            return response()->json([
                'data' => [
                    'appointment' => $summary['appointment'],
                    'prescriptions' => $summary['prescriptions'],
                    'regular_prescriptions' => $summary['regular_prescriptions'],
                    'instant_dispensing_prescriptions' => $summary['instant_dispensing_prescriptions'],
                    'lab_orders' => $summary['lab_orders'],
                    'total_prescriptions' => $summary['total_prescriptions'],
                    'total_lab_orders' => $summary['total_lab_orders'],
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Appointment not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to get consultation summary', [
                'appointment_id' => $appointmentId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to get consultation summary: ' . $e->getMessage()
            ], 500);
        }
    }
}
