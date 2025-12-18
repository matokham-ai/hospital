<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Prescription;

class PrescriptionController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Prescription::query();
        $data = $query->with(['encounter','patient','physician','dispensation']).paginate(20);
        return response()->json(['message' => 'Prescription list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'patient_id' => 'required|string|exists:patients,id',
                'physician_id' => 'required|string',
                'drug_name' => 'required|string',
                'dosage' => 'nullable|string',
                'frequency' => 'nullable|string',
                'duration' => 'nullable|integer',
                'quantity' => 'nullable|integer',
                'status' => 'nullable|in:pending,dispensed,cancelled',
                'notes' => 'nullable|string',
            ]);
        
        $record = Prescription::create($validated);
        $record->load(['encounter','patient','physician','dispensation']);
        return response()->json(['message' => 'Prescription created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Prescription::with(['encounter','patient','physician','dispensation']).findOrFail($id);
        return response()->json(['message' => 'Prescription details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'dosage' => 'nullable|string',
                'frequency' => 'nullable|string',
                'duration' => 'nullable|integer',
                'quantity' => 'nullable|integer',
                'status' => 'nullable|in:pending,dispensed,cancelled',
                'notes' => 'nullable|string',
            ]);
        
        $record = Prescription::findOrFail($id);
        $record->update($validated);
        $record->load(['encounter','patient','physician','dispensation']);
        return response()->json(['message' => 'Prescription updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('prescribe drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Prescription::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Prescription deleted', 'data' => $record], 200);
    }

    /**
     * Send prescription to pharmacy (change status to verified)
     */
    public function sendToPharmacy(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|integer',
            'patient_id' => 'required|string',
            'doctor_id' => 'required|string',
        ]);

        try {
            // Create or update prescription record for this appointment
            $prescription = Prescription::updateOrCreate(
                [
                    'encounter_id' => $validated['appointment_id'],
                    'patient_id' => $validated['patient_id'],
                ],
                [
                    'physician_id' => $validated['doctor_id'],
                    'drug_name' => 'From SOAP Notes', // This would be extracted from SOAP notes
                    'status' => 'verified', // Changed from pending to verified (sent to pharmacy)
                    'notes' => 'Sent to pharmacy on ' . now()->format('Y-m-d H:i:s'),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Prescription sent to pharmacy successfully',
                'data' => $prescription
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send prescription to pharmacy: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark prescription as dispensed
     */
    public function dispense(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('dispense drugs')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $prescription = Prescription::findOrFail($id);
            $prescription->update([
                'status' => 'dispensed',
                'notes' => ($prescription->notes ?? '') . ' | Dispensed on ' . now()->format('Y-m-d H:i:s')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Prescription marked as dispensed',
                'data' => $prescription
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to dispense prescription: ' . $e->getMessage()
            ], 500);
        }
    }
}
