<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\LabResult;

class LabResultController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = LabResult::query();
        $data = $query->with(['labOrder','validator']).paginate(20);
        return response()->json(['message' => 'LabResult list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'lab_order_id' => 'required|integer|exists:lab_orders,id',
                'result' => 'nullable|string',
                'normal_range' => 'nullable|string',
                'remarks' => 'nullable|string',
                'validated_by' => 'nullable|integer|exists:users,id',
                'validated_at' => 'nullable|date',
            ]);
        
        $record = LabResult::create($validated);
        $record->load(['labOrder','validator']);
        return response()->json(['message' => 'LabResult created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = LabResult::with(['labOrder','validator']).findOrFail($id);
        return response()->json(['message' => 'LabResult details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'result' => 'nullable|string',
                'normal_range' => 'nullable|string',
                'remarks' => 'nullable|string',
                'validated_by' => 'nullable|integer|exists:users,id',
                'validated_at' => 'nullable|date',
            ]);
        
        $record = LabResult::findOrFail($id);
        $record->update($validated);
        $record->load(['labOrder','validator']);
        return response()->json(['message' => 'LabResult updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = LabResult::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'LabResult deleted', 'data' => $record], 200);
    }
}
