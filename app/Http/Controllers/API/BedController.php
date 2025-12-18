<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Bed;

class BedController extends Controller
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

        $query = Bed::query();
        $data = $query->with(['ward']).paginate(20);
        return response()->json(['message' => 'Bed list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'ward_id' => 'required|string|exists:wards,wardid',
                'bed_number' => 'required|string',
                'bed_type' => 'required|in:STANDARD,ICU,ISOLATION,PRIVATE',
                'status' => 'nullable|in:AVAILABLE,OCCUPIED,MAINTENANCE,RESERVED',
                'is_active' => 'boolean',
            ]);
        
        $record = Bed::create($validated);
        $record->load(['ward']);
        return response()->json(['message' => 'Bed created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Bed::with(['ward']).findOrFail($id);
        return response()->json(['message' => 'Bed details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'bed_number' => 'sometimes|string',
                'bed_type' => 'sometimes|in:STANDARD,ICU,ISOLATION,PRIVATE',
                'status' => 'sometimes|in:AVAILABLE,OCCUPIED,MAINTENANCE,RESERVED',
                'is_active' => 'sometimes|boolean',
            ]);
        
        $record = Bed::findOrFail($id);
        $record->update($validated);
        $record->load(['ward']);
        return response()->json(['message' => 'Bed updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Bed::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Bed deleted', 'data' => $record], 200);
    }
}
