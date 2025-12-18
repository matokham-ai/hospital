<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Encounter;

class EncounterController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Encounter::query();
        $data = $query->with(['patient','physician','department','clinicalNotes','diagnoses','vitalSigns']).paginate(20);
        return response()->json(['message' => 'Encounter list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'patient_id' => 'required|string|exists:patients,id',
                'encounter_number' => 'required|string|unique:encounters,encounter_number',
                'type' => 'required|in:OPD,IPD,EMERGENCY',
                'status' => 'nullable|in:ACTIVE,COMPLETED,CANCELLED',
                'department_id' => 'nullable|string',
                'attending_physician_id' => 'nullable|string',
                'chief_complaint' => 'nullable|string',
                'admission_datetime' => 'nullable|date',
                'discharge_datetime' => 'nullable|date|after:admission_datetime',
            ]);
        
        $record = Encounter::create($validated);
        $record->load(['patient','physician','department','clinicalNotes','diagnoses','vitalSigns']);
        return response()->json(['message' => 'Encounter created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if the ID looks like an encounter number (starts with ENC-)
        if (str_starts_with($id, 'ENC-')) {
            $record = Encounter::with(['patient','physician','department','clinicalNotes','diagnoses','vitalSigns'])
                ->where('encounter_number', $id)
                ->firstOrFail();
        } else {
            $record = Encounter::with(['patient','physician','department','clinicalNotes','diagnoses','vitalSigns'])
                ->findOrFail($id);
        }
        
        return response()->json(['message' => 'Encounter details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'status' => 'sometimes|in:ACTIVE,COMPLETED,CANCELLED',
                'department_id' => 'sometimes|string',
                'attending_physician_id' => 'sometimes|string',
                'chief_complaint' => 'sometimes|string',
                'admission_datetime' => 'sometimes|date',
                'discharge_datetime' => 'sometimes|date|after:admission_datetime',
            ]);
        
        // Check if the ID looks like an encounter number (starts with ENC-)
        if (str_starts_with($id, 'ENC-')) {
            $record = Encounter::where('encounter_number', $id)->firstOrFail();
        } else {
            $record = Encounter::findOrFail($id);
        }
        
        $record->update($validated);
        $record->load(['patient','physician','department','clinicalNotes','diagnoses','vitalSigns']);
        return response()->json(['message' => 'Encounter updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if the ID looks like an encounter number (starts with ENC-)
        if (str_starts_with($id, 'ENC-')) {
            $record = Encounter::where('encounter_number', $id)->firstOrFail();
        } else {
            $record = Encounter::findOrFail($id);
        }
        
        $record->delete();
        return response()->json(['message' => 'Encounter deleted', 'data' => $record], 200);
    }

    /**
     * Find encounter by encounter number
     */
    public function findByNumber(Request $request, $encounterNumber)
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Encounter::with(['patient','physician','department','clinicalNotes','diagnoses','vitalSigns'])
            ->where('encounter_number', $encounterNumber)
            ->firstOrFail();
            
        return response()->json(['message' => 'Encounter details', 'data' => $record], 200);
    }

    /**
     * Debug encounter lookup
     */
    public function debug(Request $request, $id)
    {
        try {
            // Check if encounter exists by number
            $byNumber = Encounter::where('encounter_number', $id)->first();
            
            // Check if encounter exists by ID
            $byId = is_numeric($id) ? Encounter::find($id) : null;
            
            return response()->json([
                'search_term' => $id,
                'found_by_number' => $byNumber ? [
                    'id' => $byNumber->id,
                    'encounter_number' => $byNumber->encounter_number,
                    'patient_id' => $byNumber->patient_id,
                    'status' => $byNumber->status
                ] : null,
                'found_by_id' => $byId ? [
                    'id' => $byId->id,
                    'encounter_number' => $byId->encounter_number,
                    'patient_id' => $byId->patient_id,
                    'status' => $byId->status
                ] : null,
                'total_encounters' => Encounter::count()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'search_term' => $id
            ], 500);
        }
    }
}
