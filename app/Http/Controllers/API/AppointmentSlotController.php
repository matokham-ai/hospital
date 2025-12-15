<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\AppointmentSlot;

class AppointmentSlotController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = AppointmentSlot::query();
        $data = $query->with(['physician','department']).paginate(20);
        return response()->json(['message' => 'AppointmentSlot list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'physician_code' => 'required|string|exists:physicians,physician_code',
                'department_id' => 'nullable|string',
                'slot_date' => 'required|date',
                'start_time' => 'required',
                'end_time' => 'required',
                'duration_minutes' => 'required|integer|min:5',
                'max_appointments' => 'required|integer|min:1',
                'is_available' => 'boolean',
                'notes' => 'nullable|string',
            ]);
        
        $record = AppointmentSlot::create($validated);
        $record->load(['physician','department']);
        return response()->json(['message' => 'AppointmentSlot created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = AppointmentSlot::with(['physician','department']).findOrFail($id);
        return response()->json(['message' => 'AppointmentSlot details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'slot_date' => 'sometimes|date',
                'start_time' => 'sometimes',
                'end_time' => 'sometimes',
                'duration_minutes' => 'sometimes|integer|min:5',
                'max_appointments' => 'sometimes|integer|min:1',
                'is_available' => 'sometimes|boolean',
                'notes' => 'nullable|string',
            ]);
        
        $record = AppointmentSlot::findOrFail($id);
        $record->update($validated);
        $record->load(['physician','department']);
        return response()->json(['message' => 'AppointmentSlot updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = AppointmentSlot::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'AppointmentSlot deleted', 'data' => $record], 200);
    }
}
