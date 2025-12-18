<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\BedAssignment;
use App\Models\Bed;
use App\Events\PatientAdmitted;

class BedAssignmentController extends Controller
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

        $query = BedAssignment::query();
        $data = $query->with(['bed','encounter']).paginate(20);
        return response()->json(['message' => 'BedAssignment list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'bed_id' => 'required|integer|exists:beds,id',
                'assigned_at' => 'required|date',
                'released_at' => 'nullable|date|after:assigned_at',
                'assigned_by' => 'required|string',
                'released_by' => 'nullable|string',
                'assignment_notes' => 'nullable|string',
                'release_notes' => 'nullable|string',
            ]);
        
        $record = BedAssignment::create($validated);
        $record->load(['bed','encounter']);
        
        // Trigger automatic billing for bed assignment
        $bed = Bed::find($record->bed_id);
        $bedType = 'general'; // Default
        if ($bed && $bed->ward) {
            // Determine bed type based on ward name or bed properties
            $wardName = strtolower($bed->ward->name ?? '');
            if (str_contains($wardName, 'icu') || str_contains($wardName, 'intensive')) {
                $bedType = 'icu';
            } elseif (str_contains($wardName, 'private')) {
                $bedType = 'private';
            } elseif (str_contains($wardName, 'maternity')) {
                $bedType = 'maternity';
            }
        }
        
        event(new PatientAdmitted(
            $record->encounter_id,
            $record->bed_id,
            $bedType
        ));
        
        return response()->json(['message' => 'BedAssignment created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = BedAssignment::with(['bed','encounter']).findOrFail($id);
        return response()->json(['message' => 'BedAssignment details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'released_at' => 'nullable|date|after:assigned_at',
                'released_by' => 'nullable|string',
                'release_notes' => 'nullable|string',
            ]);
        
        $record = BedAssignment::findOrFail($id);
        $record->update($validated);
        $record->load(['bed','encounter']);
        return response()->json(['message' => 'BedAssignment updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = BedAssignment::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'BedAssignment deleted', 'data' => $record], 200);
    }
}
