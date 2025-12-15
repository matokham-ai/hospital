<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ward;
use Illuminate\Validation\Rule;

class WardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Helper to authorize Admin or users with "manage patients" permission.
     */
    protected function authorizeAdminOrManager($user): void
    {
        if (!$user->hasRole('Admin') && !$user->can('manage patients')) {
            abort(response()->json([
                'status'  => 'error',
                'message' => 'Unauthorized',
            ], 403));
        }
    }

    /**
     * List wards (paginated)
     */
    public function index(Request $request)
    {
        $this->authorizeAdminOrManager($request->user());

        $data = Ward::with('department')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'status'  => 'success',
            'message' => 'Ward list retrieved successfully',
            'data'    => $data,
        ], 200);
    }

    /**
     * Create a new ward
     */
    public function store(Request $request)
    {
        $this->authorizeAdminOrManager($request->user());

        $validated = $request->validate([
            'wardid'         => 'required|string|max:50|unique:wards,wardid',
            'name'           => 'required|string|max:100',
            'code'           => 'required|string|max:20|unique:wards,code',
            'department_id'  => 'nullable|integer|exists:departments,id',
            'ward_type'      => [
                'required',
                Rule::in(['GENERAL', 'ICU', 'MATERNITY', 'PEDIATRIC', 'ISOLATION', 'PRIVATE']),
            ],
            'total_beds'     => 'required|integer|min:0',
            'is_active'      => 'boolean',
        ]);

        $ward = Ward::create($validated)->load('department');

        return response()->json([
            'status'  => 'success',
            'message' => 'Ward created successfully',
            'data'    => $ward,
        ], 201);
    }

    /**
     * Show a single ward
     */
    public function show(Request $request, $id)
    {
        $this->authorizeAdminOrManager($request->user());

        $ward = Ward::with('department')->findOrFail($id);

        return response()->json([
            'status'  => 'success',
            'message' => 'Ward details retrieved successfully',
            'data'    => $ward,
        ], 200);
    }

    /**
     * Update an existing ward
     */
    public function update(Request $request, $id)
    {
        $this->authorizeAdminOrManager($request->user());

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:100',
            'code'           => [
                'sometimes',
                'string',
                'max:20',
                Rule::unique('wards', 'code')->ignore($id),
            ],
            'department_id'  => 'nullable|integer|exists:departments,id',
            'ward_type'      => [
                'sometimes',
                Rule::in(['GENERAL', 'ICU', 'MATERNITY', 'PEDIATRIC', 'ISOLATION', 'PRIVATE']),
            ],
            'total_beds'     => 'sometimes|integer|min:0',
            'is_active'      => 'sometimes|boolean',
        ]);

        $ward = Ward::findOrFail($id);
        $ward->update($validated);
        $ward->load('department');

        return response()->json([
            'status'  => 'success',
            'message' => 'Ward updated successfully',
            'data'    => $ward,
        ], 200);
    }

    /**
     * Delete a ward
     */
    public function destroy(Request $request, $id)
    {
        $this->authorizeAdminOrManager($request->user());

        $ward = Ward::findOrFail($id);
        $ward->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Ward deleted successfully',
            'data'    => $ward,
        ], 200);
    }
}
