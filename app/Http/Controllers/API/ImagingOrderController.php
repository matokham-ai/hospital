<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ImagingOrder;

class ImagingOrderController extends Controller
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

        $query = ImagingOrder::query();
        $data = $query->with(['encounter','patient','physician','report']).paginate(20);
        return response()->json(['message' => 'ImagingOrder list', 'data' => $data], 200);
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
                'study_name' => 'required|string',
                'status' => 'nullable|in:pending,scheduled,completed,cancelled',
                'scheduled_at' => 'nullable|date',
            ]);
        
        $record = ImagingOrder::create($validated);
        $record->load(['encounter','patient','physician','report']);
        return response()->json(['message' => 'ImagingOrder created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = ImagingOrder::with(['encounter','patient','physician','report']).findOrFail($id);
        return response()->json(['message' => 'ImagingOrder details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'status' => 'sometimes|in:pending,scheduled,completed,cancelled',
                'scheduled_at' => 'nullable|date',
            ]);
        
        $record = ImagingOrder::findOrFail($id);
        $record->update($validated);
        $record->load(['encounter','patient','physician','report']);
        return response()->json(['message' => 'ImagingOrder updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('order labs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = ImagingOrder::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'ImagingOrder deleted', 'data' => $record], 200);
    }
}
