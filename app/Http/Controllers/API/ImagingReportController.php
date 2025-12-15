<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\ImagingReport;

class ImagingReportController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = ImagingReport::query();
        $data = $query->with(['imagingOrder','validator']).paginate(20);
        return response()->json(['message' => 'ImagingReport list', 'data' => $data], 200);
    }

    public function store(Request $request)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'imaging_order_id' => 'required|integer|exists:imaging_orders,id',
                'findings' => 'nullable|string',
                'conclusion' => 'nullable|string',
                'validated_by' => 'nullable|integer|exists:users,id',
                'validated_at' => 'nullable|date',
            ]);
        
        $record = ImagingReport::create($validated);
        $record->load(['imagingOrder','validator']);
        return response()->json(['message' => 'ImagingReport created', 'data' => $record], 201);
    }

    public function show(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = ImagingReport::with(['imagingOrder','validator']).findOrFail($id);
        return response()->json(['message' => 'ImagingReport details', 'data' => $record], 200);
    }

    public function update(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }


            $validated = $request->validate([
                'findings' => 'nullable|string',
                'conclusion' => 'nullable|string',
                'validated_by' => 'nullable|integer|exists:users,id',
                'validated_at' => 'nullable|date',
            ]);
        
        $record = ImagingReport::findOrFail($id);
        $record->update($validated);
        $record->load(['imagingOrder','validator']);
        return response()->json(['message' => 'ImagingReport updated', 'data' => $record], 200);
    }

    public function destroy(Request $request, $id)
    {

        $user = $request->user();
        if (!$user->hasRole('Admin') && !$user->can('release results')) {
        return response()->json(['message' => 'Unauthorized'], 403);
        }

        $record = ImagingReport::findOrFail($id);
        $record->delete();
        return response()->json(['message' => 'ImagingReport deleted', 'data' => $record], 200);
    }
}
