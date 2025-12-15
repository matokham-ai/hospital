<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\LabOrder;
use App\Events\LabTestOrdered;

class LabOrderController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = LabOrder::query();
        $data = $query->with(['encounter','patient','physician','result']).paginate(20);
        return response()->json(['message' => 'LabOrder list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'patient_id' => 'required|string|exists:patients,id',
                'ordered_by' => 'required|integer',
                'test_name' => 'required|string',
                'status' => 'nullable|in:pending,in_progress,completed,cancelled',
            ]);
        
        $record = LabOrder::create($validated);
        $record->load(['encounter','patient','physician','result']);
        
        // Trigger automatic billing for lab test
        event(new LabTestOrdered(
            $record->encounter_id,
            $record->id,
            $record->test_name
        ));
        
        return response()->json(['message' => 'LabOrder created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = LabOrder::with(['encounter','patient','physician','result']).findOrFail($id);
        return response()->json(['message' => 'LabOrder details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
            ]);
        
        $record = LabOrder::findOrFail($id);
        $record->update($validated);
        $record->load(['encounter','patient','physician','result']);
        return response()->json(['message' => 'LabOrder updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = LabOrder::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'LabOrder deleted', 'data' => $record], 200);
    }
}
