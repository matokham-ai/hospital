<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\OpdQueue;

class OpdQueueController extends Controller
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

        $query = OpdQueue::query();
        $data = $query->with([])->paginate(20);

        return response()->json([
            'message' => 'OpdQueue list',
            'data' => $data
        ], 200);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'appointment_id' => 'nullable|integer|exists:appointments,id',
            'patient_id' => 'required|string|exists:patients,id',
            'physician_id' => 'required|string',
            'department_id' => 'nullable|string',
            'queue_type' => 'required|in:APPOINTMENT,WALK_IN,EMERGENCY',
            'status' => 'nullable|in:WAITING,IN_PROGRESS,COMPLETED,CANCELLED',
            'queue_number' => 'required|integer',
            'priority' => 'required|in:LOW,NORMAL,HIGH,URGENT',
            'queued_at' => 'required|date',
            'called_at' => 'nullable|date',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $record = OpdQueue::create($validated);
        $record->load([]);

        return response()->json([
            'message' => 'OpdQueue created',
            'data' => $record
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = OpdQueue::with([])->findOrFail($id);

        return response()->json([
            'message' => 'OpdQueue details',
            'data' => $record
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:WAITING,IN_PROGRESS,COMPLETED,CANCELLED',
            'called_at' => 'nullable|date',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $record = OpdQueue::findOrFail($id);
        $record->update($validated);
        $record->load([]);

        return response()->json([
            'message' => 'OpdQueue updated',
            'data' => $record
        ], 200);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = OpdQueue::findOrFail($id);
        $record->delete();

        return response()->json([
            'message' => 'OpdQueue deleted',
            'data' => $record
        ], 200);
    }
}
