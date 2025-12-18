<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Tariff;

class TariffController extends Controller
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

        $query = Tariff::query();
        $data = $query->with([]).paginate(20);
        return response()->json(['message' => 'Tariff list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'service_name' => 'required|string',
                'category' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'active' => 'boolean',
            ]);
        
        $record = Tariff::create($validated);
        $record->load([]);
        return response()->json(['message' => 'Tariff created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Tariff::with([]).findOrFail($id);
        return response()->json(['message' => 'Tariff details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'service_name' => 'sometimes|string',
                'category' => 'nullable|string',
                'amount' => 'sometimes|numeric|min:0',
                'active' => 'sometimes|boolean',
            ]);
        
        $record = Tariff::findOrFail($id);
        $record->update($validated);
        $record->load([]);
        return response()->json(['message' => 'Tariff updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('generate bills')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = Tariff::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'Tariff deleted', 'data' => $record], 200);
    }
}
