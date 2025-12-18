<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Invoice;

class InvoiceController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Invoice::query();
        $data = $query->with(['patient','payments']).paginate(20);
        return response()->json(['message' => 'Invoice list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'patient_id' => 'required|string|exists:patients,id',
                'total_amount' => 'required|numeric',
                'discount' => 'nullable|numeric',
                'net_amount' => 'required|numeric',
                'paid_amount' => 'nullable|numeric',
                'balance' => 'required|numeric',
                'status' => 'required|in:unpaid,partial,paid',
            ]);
        
        $record = Invoice::create($validated);
        $record->load(['patient','payments']);
        return response()->json(['message' => 'Invoice created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Invoice::with(['patient','payments']).findOrFail($id);
        return response()->json(['message' => 'Invoice details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'total_amount' => 'sometimes|numeric',
                'discount' => 'nullable|numeric',
                'net_amount' => 'sometimes|numeric',
                'paid_amount' => 'nullable|numeric',
                'balance' => 'sometimes|numeric',
                'status' => 'sometimes|in:unpaid,partial,paid',
            ]);
        
        $record = Invoice::findOrFail($id);
        $record->update($validated);
        $record->load(['patient','payments']);
        return response()->json(['message' => 'Invoice updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Invoice::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Invoice deleted', 'data' => $record], 200);
    }
}
