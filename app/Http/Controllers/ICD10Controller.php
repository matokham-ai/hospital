<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Icd10Code;
use Illuminate\Http\JsonResponse;

class ICD10Controller extends Controller
{
    /**
     * Display a listing of the ICD10 codes.
     * Supports search, category filter, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Icd10Code::query()
                ->where('is_active', true);

            // Optional search term
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            }

            // Optional category filter
            if ($category = $request->input('category')) {
                $query->where('category', $category);
            }

            // Limit results or paginate
            $limit = (int) $request->input('limit', 100);
            $limit = min($limit, 500); // prevent excessive load

            $codes = $query
                ->select('id', 'code', 'description', 'category', 'subcategory', 'usage_count')
                ->orderBy('code')
                ->limit($limit)
                ->get();

            return response()->json($codes);
        } catch (\Exception $e) {
            \Log::error('Error fetching ICD10 codes: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch ICD10 codes.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified ICD10 code.
     */
    public function show(string $code): JsonResponse
    {
        $icd = Icd10Code::where('code', $code)->first();

        if (!$icd) {
            return response()->json(['error' => 'ICD10 code not found'], 404);
        }

        return response()->json($icd);
    }

    /**
     * Store a newly created ICD10 code (Admin use).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:icd10_codes,code',
            'description' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'subcategory' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $icd = Icd10Code::create($validated);

        return response()->json([
            'message' => 'ICD10 code created successfully',
            'data' => $icd,
        ], 201);
    }

    /**
     * Update an existing ICD10 code (Admin use).
     */
    public function update(Request $request, string $code): JsonResponse
    {
        $icd = Icd10Code::where('code', $code)->firstOrFail();

        $validated = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:100',
            'subcategory' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $icd->update($validated);

        return response()->json([
            'message' => 'ICD10 code updated successfully',
            'data' => $icd,
        ]);
    }

    /**
     * Soft delete / deactivate ICD10 code (Admin use).
     */
    public function destroy(string $code): JsonResponse
    {
        $icd = Icd10Code::where('code', $code)->first();

        if (!$icd) {
            return response()->json(['error' => 'ICD10 code not found'], 404);
        }

        $icd->update(['is_active' => false]);

        return response()->json(['message' => 'ICD10 code deactivated successfully']);
    }
}
