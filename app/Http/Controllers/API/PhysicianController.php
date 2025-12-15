<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Physician;

class PhysicianController extends Controller
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

        $query = Physician::query();
        $data = $query->with(['user']).paginate(20);
        return response()->json(['message' => 'Physician list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'physician_code' => 'required|string|unique:physicians,physician_code',
                'user_id' => 'required|integer|exists:users,id',
                'name' => 'required|string|max:100',
                'license_number' => 'required|string|max:50|unique:physicians,license_number',
                'specialization' => 'nullable|string',
                'qualification' => 'nullable|string',
                'medical_school' => 'nullable|string',
                'years_of_experience' => 'nullable|integer',
                'is_consultant' => 'boolean',
                'bio' => 'nullable|string',
            ]);
        
        $record = Physician::create($validated);
        $record->load(['user']);
        return response()->json(['message' => 'Physician created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Physician::with(['user']).findOrFail($id);
        return response()->json(['message' => 'Physician details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'name' => 'sometimes|string|max:100',
                'specialization' => 'nullable|string',
                'qualification' => 'nullable|string',
                'medical_school' => 'nullable|string',
                'years_of_experience' => 'nullable|integer',
                'is_consultant' => 'sometimes|boolean',
                'bio' => 'nullable|string',
            ]);
        
        $record = Physician::findOrFail($id);
        $record->update($validated);
        $record->load(['user']);
        return response()->json(['message' => 'Physician updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Physician::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Physician deleted', 'data' => $record], 200);
    }
}
