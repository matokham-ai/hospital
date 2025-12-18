<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ClinicalNote;

class ClinicalNoteController extends Controller
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

        $query = ClinicalNote::query();
        $data = $query->with([]).paginate(20);
        return response()->json(['message' => 'ClinicalNote list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'note_type' => 'required|in:SOAP,PROGRESS,DISCHARGE,NURSING,CONSULTATION',
                'subjective' => 'nullable|string',
                'objective' => 'nullable|string',
                'assessment' => 'nullable|string',
                'plan' => 'nullable|string',
                'content' => 'nullable|string',
                'created_by' => 'required|string',
                'note_datetime' => 'required|date',
            ]);
        
        $record = ClinicalNote::create($validated);
        $record->load([]);
        return response()->json(['message' => 'ClinicalNote created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = ClinicalNote::with([]).findOrFail($id);
        return response()->json(['message' => 'ClinicalNote details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'note_type' => 'sometimes|in:SOAP,PROGRESS,DISCHARGE,NURSING,CONSULTATION',
                'subjective' => 'nullable|string',
                'objective' => 'nullable|string',
                'assessment' => 'nullable|string',
                'plan' => 'nullable|string',
                'content' => 'nullable|string',
            ]);
        
        $record = ClinicalNote::findOrFail($id);
        $record->update($validated);
        $record->load([]);
        return response()->json(['message' => 'ClinicalNote updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = ClinicalNote::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'ClinicalNote deleted', 'data' => $record], 200);
    }
}
