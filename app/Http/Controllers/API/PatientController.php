<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Patient;

class PatientController extends Controller
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

        $query = Patient::query();
        $data = $query->with(['addresses','contacts','encounters']).paginate(20);
        return response()->json(['message' => 'Patient list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'id' => 'required|string|unique:patients,id',
                'hospital_id' => 'required|string|unique:patients,hospital_id',
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'date_of_birth' => 'required|date',
                'gender' => 'required|in:M,F,O',
                'insurance_info' => 'nullable|array',
                'allergies' => 'nullable|array',
                'chronic_conditions' => 'nullable|array',
                'alerts' => 'nullable|array',
            ]);
        
        $record = Patient::create($validated);
        $record->load(['addresses','contacts','encounters']);
        return response()->json(['message' => 'Patient created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Patient::with(['addresses','contacts','encounters']).findOrFail($id);
        return response()->json(['message' => 'Patient details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'hospital_id' => 'sometimes|string|unique:patients,hospital_id,' . $id . ',id',
                'first_name' => 'sometimes|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'date_of_birth' => 'sometimes|date',
                'gender' => 'sometimes|in:M,F,O',
                'insurance_info' => 'nullable|array',
                'allergies' => 'nullable|array',
                'chronic_conditions' => 'nullable|array',
                'alerts' => 'nullable|array',
            ]);
        
        $record = Patient::findOrFail($id);
        $record->update($validated);
        $record->load(['addresses','contacts','encounters']);
        return response()->json(['message' => 'Patient updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Patient::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Patient deleted', 'data' => $record], 200);
    }
}
