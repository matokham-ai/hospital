<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Icd10Code;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class Icd10Controller extends Controller
{
    /**
     * Display a listing of ICD-10 codes.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Icd10Code::active();
            
            // Search functionality
            if ($request->has('search')) {
                $query->search($request->get('search'));
            }
            
            // Category filter
            if ($request->has('category')) {
                $query->byCategory($request->get('category'));
            }
            
            $perPage = $request->get('per_page', 50);
            $codes = $query->orderBy('code')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $codes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve ICD-10 codes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search ICD-10 codes for autocomplete.
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $search = $request->get('q', '');
            $limit = $request->get('limit', 20);
            
            if (strlen($search) < 2) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }
            
            $codes = Icd10Code::active()
                ->search($search)
                ->limit($limit)
                ->orderBy('code')
                ->get()
                ->map(function ($code) {
                    return [
                        'id' => $code->id,
                        'code' => $code->code,
                        'description' => $code->description,
                        'formatted' => $code->formatted,
                        'category' => $code->category,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $codes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search ICD-10 codes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get ICD-10 categories.
     */
    public function categories(): JsonResponse
    {
        try {
            $categories = Icd10Code::active()
                ->whereNotNull('category')
                ->distinct()
                ->pluck('category')
                ->sort()
                ->values();

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified ICD-10 code.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $code = Icd10Code::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $code,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ICD-10 code not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Get popular/frequently used ICD-10 codes.
     */
    public function popular(): JsonResponse
    {
        try {
            // Get codes that are used most frequently in diagnoses
            $popularCodes = Icd10Code::active()
                ->withCount('diagnoses')
                ->having('diagnoses_count', '>', 0)
                ->orderBy('diagnoses_count', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($code) {
                    return [
                        'id' => $code->id,
                        'code' => $code->code,
                        'description' => $code->description,
                        'formatted' => $code->formatted,
                        'category' => $code->category,
                        'usage_count' => $code->diagnoses_count,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $popularCodes,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve popular codes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}