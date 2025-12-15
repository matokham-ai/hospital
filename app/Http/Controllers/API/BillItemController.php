<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\BillItem;

class BillItemController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

       /* $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }*/

        $query = BillItem::query();
        $data = $query->with([]).paginate(20);
        return response()->json(['message' => 'BillItem list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'encounter_id' => 'required|integer|exists:encounters,id',
                'item_type' => 'required|string',
                'item_id' => 'nullable|integer',
                'description' => 'required|string',
                'quantity' => 'required|integer|min:1',
                'unit_price' => 'required|numeric|min:0',
                'amount' => 'required|numeric|min:0',
                'status' => 'nullable|in:unpaid,paid,cancelled',
            ]);
        
        $record = BillItem::create($validated);
        $record->load([]);
        return response()->json(['message' => 'BillItem created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = BillItem::with([]).findOrFail($id);
        return response()->json(['message' => 'BillItem details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'description' => 'sometimes|string',
                'quantity' => 'sometimes|integer|min:1',
                'unit_price' => 'sometimes|numeric|min:0',
                'amount' => 'sometimes|numeric|min:0',
                'status' => 'sometimes|in:unpaid,paid,cancelled',
            ]);
        
        $record = BillItem::findOrFail($id);
        $record->update($validated);
        $record->load([]);
        return response()->json(['message' => 'BillItem updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = BillItem::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'BillItem deleted', 'data' => $record], 200);
    }
}
