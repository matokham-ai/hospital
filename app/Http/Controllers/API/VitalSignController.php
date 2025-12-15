<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\VitalSign;

class VitalSignController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('record vitals')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = VitalSign::query();
        $data = $query->with([]).paginate(20);
        return response()->json(['message' => 'VitalSign list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('record vitals')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'recorded_by' => 'required|string',
                'temperature' => 'nullable|numeric',
                'systolic_bp' => 'nullable|integer',
                'diastolic_bp' => 'nullable|integer',
                'heart_rate' => 'nullable|integer',
                'respiratory_rate' => 'nullable|integer',
                'oxygen_saturation' => 'nullable|numeric',
                'weight' => 'nullable|numeric',
                'height' => 'nullable|numeric',
                'bmi' => 'nullable|numeric',
                'notes' => 'nullable|string',
                'recorded_at' => 'required|date',
            ]);
        
        $record = VitalSign::create($validated);
        $record->load([]);
        return response()->json(['message' => 'VitalSign created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('record vitals')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = VitalSign::with([]).findOrFail($id);
        return response()->json(['message' => 'VitalSign details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('record vitals')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'temperature' => 'nullable|numeric',
                'systolic_bp' => 'nullable|integer',
                'diastolic_bp' => 'nullable|integer',
                'heart_rate' => 'nullable|integer',
                'respiratory_rate' => 'nullable|integer',
                'oxygen_saturation' => 'nullable|numeric',
                'weight' => 'nullable|numeric',
                'height' => 'nullable|numeric',
                'bmi' => 'nullable|numeric',
                'notes' => 'nullable|string',
            ]);
        
        $record = VitalSign::findOrFail($id);
        $record->update($validated);
        $record->load([]);
        return response()->json(['message' => 'VitalSign updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('record vitals')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = VitalSign::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'VitalSign deleted', 'data' => $record], 200);
    }
}
