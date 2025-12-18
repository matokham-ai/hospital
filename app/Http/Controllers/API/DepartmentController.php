<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Department;

class DepartmentController extends Controller
{
    public function __construct()
    {
        // Sanctum API authentication
        $this->middleware('auth:sanctum');
    }

    /**
     * GET /api/departments
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $departments = Department::with(['wards', 'testCatalogs'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'message' => 'Department list',
            'data' => $departments,
        ], 200);
    }

    /**
     * POST /api/departments
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'deptid' => 'required|string|unique:departments,deptid',
            'name' => 'required|string|max:191',
            'code' => 'required|string|max:191|unique:departments,code',
            'description' => 'nullable|string',
            'status' => 'in:active,inactive',
            'sort_order' => 'integer|min:0',
        ]);

        $department = Department::create($validated)->load(['wards', 'testCatalogs']);

        return response()->json([
            'message' => 'Department created successfully',
            'data' => $department,
        ], 201);
    }

    /**
     * GET /api/departments/{id}
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department = Department::with(['wards', 'testCatalogs'])->findOrFail($id);

        return response()->json([
            'message' => 'Department details',
            'data' => $department,
        ], 200);
    }

    /**
     * PUT /api/departments/{id}
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:191',
            'code' => 'sometimes|string|max:191|unique:departments,code,' . $id . ',deptid',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $department = Department::findOrFail($id);
        $department->update($validated);
        $department->load(['wards', 'testCatalogs']);

        return response()->json([
            'message' => 'Department updated successfully',
            'data' => $department,
        ], 200);
    }

    /**
     * DELETE /api/departments/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully',
        ], 200);
    }
}
