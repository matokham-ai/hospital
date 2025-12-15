<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Dispensation;

class DispensationController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('dispense drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Dispensation::query();
        $data = $query->with(['prescription','user']).paginate(20);
        return response()->json(['message' => 'Dispensation list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('dispense drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'prescription_id' => 'required|integer|exists:prescriptions,id',
                'dispensed_by' => 'required|integer|exists:users,id',
                'quantity_dispensed' => 'required|integer|min:1',
                'dispensed_at' => 'nullable|date',
                'batch_no' => 'nullable|string',
                'expiry_date' => 'nullable|date',
            ]);
        
        $record = Dispensation::create($validated);
        $record->load(['prescription','user']);
        return response()->json(['message' => 'Dispensation created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('dispense drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Dispensation::with(['prescription','user']).findOrFail($id);
        return response()->json(['message' => 'Dispensation details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('dispense drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'quantity_dispensed' => 'sometimes|integer|min:1',
                'dispensed_at' => 'nullable|date',
                'batch_no' => 'nullable|string',
                'expiry_date' => 'nullable|date',
            ]);
        
        $record = Dispensation::findOrFail($id);
        $record->update($validated);
        $record->load(['prescription','user']);
        return response()->json(['message' => 'Dispensation updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('dispense drugs')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Dispensation::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Dispensation deleted', 'data' => $record], 200);
    }
}
