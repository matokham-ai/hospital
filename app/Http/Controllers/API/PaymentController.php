<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Payment;

class PaymentController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('approve payments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = Payment::query();
        $data = $query->with(['invoice','user']).paginate(20);
        return response()->json(['message' => 'Payment list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('approve payments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'invoice_id' => 'required|integer|exists:invoices,id',
                'amount' => 'required|numeric|min:0',
                'method' => 'required|in:cash,mpesa,card,bank',
                'reference_no' => 'nullable|string',
                'received_by' => 'required|integer|exists:users,id',
            ]);
        
        $record = Payment::create($validated);
        $record->load(['invoice','user']);
        return response()->json(['message' => 'Payment created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('approve payments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Payment::with(['invoice','user']).findOrFail($id);
        return response()->json(['message' => 'Payment details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('approve payments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'amount' => 'sometimes|numeric|min:0',
                'method' => 'sometimes|in:cash,mpesa,card,bank',
                'reference_no' => 'nullable|string',
            ]);
        
        $record = Payment::findOrFail($id);
        $record->update($validated);
        $record->load(['invoice','user']);
        return response()->json(['message' => 'Payment updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('approve payments')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Payment::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Payment deleted', 'data' => $record], 200);
    }
}
