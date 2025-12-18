<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Diagnosis;

class DiagnosisController extends Controller
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

        $query = Diagnosis::query();
        $data = $query->with([]).paginate(20);
        return response()->json(['message' => 'Diagnosis list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'icd10_code' => 'required|string|max:10',
                'description' => 'required|string|max:500',
                'type' => 'required|in:PRIMARY,SECONDARY,COMORBIDITY',
                'diagnosed_by' => 'required|string',
                'diagnosed_at' => 'required|date',
            ]);
        
        $record = Diagnosis::create($validated);
        $record->load([]);
        return response()->json(['message' => 'Diagnosis created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Diagnosis::with([]).findOrFail($id);
        return response()->json(['message' => 'Diagnosis details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'description' => 'sometimes|string|max:500',
                'type' => 'sometimes|in:PRIMARY,SECONDARY,COMORBIDITY',
            ]);
        
        $record = Diagnosis::findOrFail($id);
        $record->update($validated);
        $record->load([]);
        return response()->json(['message' => 'Diagnosis updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Diagnosis::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Diagnosis deleted', 'data' => $record], 200);
    }
}
