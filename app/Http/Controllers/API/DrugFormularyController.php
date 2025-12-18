<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DrugFormulary;
use App\Services\DrugFormularyService;
use App\Http\Requests\StoreDrugFormularyRequest;
use App\Http\Requests\UpdateDrugFormularyRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DrugFormularyController extends Controller
{
    protected DrugFormularyService $drugFormularyService;

    public function __construct(DrugFormularyService $drugFormularyService)
    {
        $this->drugFormularyService = $drugFormularyService;
    }

    /**
     * Display a listing of drug formulary
     */
    public function index(Request $request): JsonResponse
    {
        $query = DrugFormulary::with('substitutes');

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('atc_code', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Apply form filter
        if ($request->has('form')) {
            $query->where('form', $request->get('form'));
        }

        // Apply stock level filter
        if ($request->has('stock_level')) {
            $stockLevel = $request->get('stock_level');
            switch ($stockLevel) {
                case 'in_stock':
                    $query->whereColumn('stock_quantity', '>', 'reorder_level');
                    break;
                case 'low_stock':
                    $query->whereColumn('stock_quantity', '<=', 'reorder_level')
                          ->where('stock_quantity', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', 0);
                    break;
            }
        }

        // Apply ATC code filter
        if ($request->has('atc_code')) {
            $query->where('atc_code', 'like', $request->get('atc_code') . '%');
        }

        $perPage = $request->get('per_page', 15);
        $drugs = $query->orderBy('name')->paginate($perPage);

        // Add stock status to each drug
        $drugs->getCollection()->transform(function ($drug) {
            $drug->stock_status = $this->drugFormularyService->getStockStatus($drug);
            return $drug;
        });

        return response()->json($drugs);
    }

    /**
     * Get drug forms for filtering
     */
    public function getForms(): JsonResponse
    {
        $forms = DrugFormulary::select('form')
            ->distinct()
            ->whereNotNull('form')
            ->orderBy('form')
            ->pluck('form');

        return response()->json($forms);
    }

    /**
     * Store a newly created drug formulary
     */
    public function store(StoreDrugFormularyRequest $request): JsonResponse
    {
        try {
            $drug = DrugFormulary::create($request->validated());
            
            // Add substitutes if provided
            if ($request->has('substitute_ids')) {
                $drug->substitutes()->sync($request->input('substitute_ids'));
            }
            
            return response()->json($drug->load('substitutes'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified drug formulary
     */
    public function show(DrugFormulary $drugFormulary): JsonResponse
    {
        $drugFormulary->load('substitutes');
        $drugFormulary->stock_status = $this->drugFormularyService->getStockStatus($drugFormulary);
        
        return response()->json($drugFormulary);
    }

    /**
     * Update the specified drug formulary
     */
    public function update(UpdateDrugFormularyRequest $request, DrugFormulary $drugFormulary): JsonResponse
    {
        try {
            $drugFormulary->update($request->validated());
            
            // Update substitutes if provided
            if ($request->has('substitute_ids')) {
                $drugFormulary->substitutes()->sync($request->input('substitute_ids'));
            }
            
            return response()->json($drugFormulary->load('substitutes'));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified drug formulary
     */
    public function destroy(DrugFormulary $drugFormulary): JsonResponse
    {
        try {
            // Check if drug has active prescriptions or orders
            $hasActiveReferences = $this->drugFormularyService->hasActiveReferences($drugFormulary);
            if ($hasActiveReferences) {
                return response()->json([
                    'error' => 'Cannot delete drug with active prescriptions or orders'
                ], 409);
            }

            $drugFormulary->delete();
            
            return response()->json(['message' => 'Drug formulary deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update stock quantity
     */
    public function updateStock(DrugFormulary $drugFormulary, Request $request): JsonResponse
    {
        $request->validate([
            'stock_quantity' => 'required|integer|min:0',
            'adjustment_reason' => 'nullable|string|max:255',
        ]);

        try {
            $oldQuantity = $drugFormulary->stock_quantity;
            $newQuantity = $request->input('stock_quantity');
            
            $drugFormulary->update(['stock_quantity' => $newQuantity]);
            
            // Log stock adjustment
            $this->drugFormularyService->logStockAdjustment(
                $drugFormulary,
                $oldQuantity,
                $newQuantity,
                $request->input('adjustment_reason', 'Manual adjustment')
            );
            
            $drugFormulary->stock_status = $this->drugFormularyService->getStockStatus($drugFormulary);
            
            return response()->json($drugFormulary);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update stock quantities
     */
    public function bulkUpdateStock(Request $request): JsonResponse
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:drug_formulary,id',
            'updates.*.stock_quantity' => 'required|integer|min:0',
            'updates.*.adjustment_reason' => 'nullable|string|max:255',
        ]);

        try {
            $updated = 0;

            foreach ($request->input('updates') as $update) {
                $drug = DrugFormulary::find($update['id']);
                $oldQuantity = $drug->stock_quantity;
                
                $drug->update(['stock_quantity' => $update['stock_quantity']]);
                
                // Log stock adjustment
                $this->drugFormularyService->logStockAdjustment(
                    $drug,
                    $oldQuantity,
                    $update['stock_quantity'],
                    $update['adjustment_reason'] ?? 'Bulk adjustment'
                );
                
                $updated++;
            }

            return response()->json([
                'message' => "Updated stock for {$updated} drugs"
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get drugs with low stock
     */
    public function getLowStockDrugs(): JsonResponse
    {
        $lowStockDrugs = DrugFormulary::whereColumn('stock_quantity', '<=', 'reorder_level')
            ->where('status', 'active')
            ->orderBy('stock_quantity')
            ->get()
            ->map(function ($drug) {
                $drug->stock_status = $this->drugFormularyService->getStockStatus($drug);
                return $drug;
            });

        return response()->json($lowStockDrugs);
    }

    /**
     * Get drug substitutes
     */
    public function getSubstitutes(DrugFormulary $drugFormulary): JsonResponse
    {
        $substitutes = $this->drugFormularyService->getAvailableSubstitutes($drugFormulary);
        
        return response()->json($substitutes);
    }

    /**
     * Add substitute drug
     */
    public function addSubstitute(DrugFormulary $drugFormulary, Request $request): JsonResponse
    {
        $request->validate([
            'substitute_id' => 'required|exists:drug_formulary,id|different:' . $drugFormulary->id,
        ]);

        try {
            $drugFormulary->substitutes()->attach($request->input('substitute_id'));
            
            return response()->json([
                'message' => 'Substitute added successfully',
                'substitutes' => $drugFormulary->substitutes
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove substitute drug
     */
    public function removeSubstitute(DrugFormulary $drugFormulary, DrugFormulary $substitute): JsonResponse
    {
        try {
            $drugFormulary->substitutes()->detach($substitute->id);
            
            return response()->json(['message' => 'Substitute removed successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get drug statistics
     */
    public function getStatistics(): JsonResponse
    {
        $stats = [
            'total_drugs' => DrugFormulary::count(),
            'active_drugs' => DrugFormulary::where('status', 'active')->count(),
            'discontinued_drugs' => DrugFormulary::where('status', 'discontinued')->count(),
            'low_stock_drugs' => DrugFormulary::whereColumn('stock_quantity', '<=', 'reorder_level')->count(),
            'out_of_stock_drugs' => DrugFormulary::where('stock_quantity', 0)->count(),
            'forms_count' => DrugFormulary::distinct('form')->count(),
            'average_price' => DrugFormulary::where('status', 'active')->avg('unit_price'),
            'total_stock_value' => DrugFormulary::selectRaw('SUM(stock_quantity * unit_price)')->value('SUM(stock_quantity * unit_price)'),
        ];

        return response()->json($stats);
    }

    /**
     * Search drugs with advanced filters - optimized for autocomplete
     * Supports search by generic name, brand name, and ATC code
     * Includes stock availability in response
     * Implements response caching for performance
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'q' => 'nullable|string|max:255',
            'query' => 'nullable|string|max:255',
            'form' => 'nullable|string',
            'atc_code' => 'nullable|string',
            'stock_level' => 'nullable|in:in_stock,low_stock,out_of_stock',
            'status' => 'nullable|in:active,discontinued',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        // Support both 'q' (for autocomplete) and 'query' parameters
        $searchQuery = $request->input('q') ?? $request->input('query', '');
        $limit = $request->input('limit', 10);
        
        // Return empty array for very short queries (optimization)
        if (strlen($searchQuery) < 2 && empty($request->except(['q', 'query', 'limit']))) {
            return response()->json([]);
        }

        // Create cache key based on request parameters
        $cacheKey = 'drug_search:' . md5(json_encode($request->all()));
        
        // Cache results for 5 minutes (300 seconds)
        $results = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($searchQuery, $request, $limit) {
            $query = DrugFormulary::query();
            
            // Apply status filter (default to active for autocomplete)
            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            } else {
                $query->where('status', 'active');
            }
            
            // Multi-field search: generic name, brand name, ATC code
            if (!empty($searchQuery)) {
                $query->where(function($q) use ($searchQuery) {
                    $q->where('generic_name', 'like', "%{$searchQuery}%")
                      ->orWhere('brand_name', 'like', "%{$searchQuery}%")
                      ->orWhere('name', 'like', "%{$searchQuery}%")
                      ->orWhere('atc_code', 'like', "%{$searchQuery}%");
                });
            }
            
            // Apply form filter
            if ($request->has('form')) {
                $query->where('form', $request->input('form'));
            }
            
            // Apply ATC code filter
            if ($request->has('atc_code')) {
                $query->where('atc_code', 'like', $request->input('atc_code') . '%');
            }
            
            // Apply stock level filter
            if ($request->has('stock_level')) {
                $stockLevel = $request->input('stock_level');
                switch ($stockLevel) {
                    case 'in_stock':
                        $query->whereColumn('stock_quantity', '>', 'reorder_level');
                        break;
                    case 'low_stock':
                        $query->whereColumn('stock_quantity', '<=', 'reorder_level')
                              ->where('stock_quantity', '>', 0);
                        break;
                    case 'out_of_stock':
                        $query->where('stock_quantity', 0);
                        break;
                }
            }
            
            // Select relevant fields for performance
            $query->select(
                'id', 
                'name', 
                'generic_name', 
                'brand_name', 
                'atc_code',
                'strength', 
                'form', 
                'unit_price', 
                'stock_quantity',
                'reorder_level'
            );
            
            // Order by relevance (exact matches first, then partial matches)
            if (!empty($searchQuery)) {
                $query->orderByRaw("
                    CASE 
                        WHEN generic_name = ? THEN 1
                        WHEN brand_name = ? THEN 2
                        WHEN name = ? THEN 3
                        WHEN atc_code = ? THEN 4
                        WHEN generic_name LIKE ? THEN 5
                        WHEN brand_name LIKE ? THEN 6
                        ELSE 7
                    END
                ", [
                    $searchQuery, 
                    $searchQuery, 
                    $searchQuery, 
                    $searchQuery,
                    $searchQuery . '%',
                    $searchQuery . '%'
                ]);
            } else {
                $query->orderBy('name');
            }
            
            // Limit results for autocomplete performance
            $drugs = $query->limit($limit)->get();
            
            // Enrich with stock status and formatted data
            return $drugs->map(function($drug) {
                // Determine stock status
                if ($drug->stock_quantity > $drug->reorder_level) {
                    $stockStatus = 'in_stock';
                    $stockBadgeColor = 'green';
                } elseif ($drug->stock_quantity > 0) {
                    $stockStatus = 'low_stock';
                    $stockBadgeColor = 'yellow';
                } else {
                    $stockStatus = 'out_of_stock';
                    $stockBadgeColor = 'red';
                }
                
                return [
                    'id' => $drug->id,
                    'name' => $drug->name,
                    'generic_name' => $drug->generic_name,
                    'brand_name' => $drug->brand_name,
                    'atc_code' => $drug->atc_code,
                    'strength' => $drug->strength,
                    'form' => $drug->form,
                    'unit_price' => $drug->unit_price,
                    'formatted_price' => 'KES ' . number_format($drug->unit_price, 2),
                    'stock_quantity' => $drug->stock_quantity,
                    'stock_status' => $stockStatus,
                    'stock_badge_color' => $stockBadgeColor,
                    'full_name' => trim(implode(' ', array_filter([
                        $drug->name,
                        $drug->strength,
                        $drug->form
                    ]))),
                ];
            });
        });
        
        return response()->json($results);
    }

    /**
     * Check for similar drugs (duplicate detection)
     */
    public function checkSimilar(Request $request): JsonResponse
    {
        $name = $request->input('name', '');
        $generic = $request->input('generic', '');
        
        if (strlen($name) < 3 && strlen($generic) < 3) {
            return response()->json([]);
        }
        
        $query = DrugFormulary::where('status', 'active');
        
        $query->where(function($q) use ($name, $generic) {
            if (!empty($name)) {
                $q->where('name', 'like', "%{$name}%")
                  ->orWhere('generic_name', 'like', "%{$name}%");
            }
            if (!empty($generic)) {
                $q->orWhere('generic_name', 'like', "%{$generic}%")
                  ->orWhere('name', 'like', "%{$generic}%");
            }
        });
        
        $similarDrugs = $query->select('id', 'name', 'generic_name', 'strength', 'form')
            ->limit(5)
            ->get();
        
        return response()->json($similarDrugs);
    }

    /**
     * Get drugs for dropdown/select options
     */
    public function options(): JsonResponse
    {
        $drugs = DrugFormulary::where('status', 'active')
            ->select('id', 'name', 'generic_name', 'strength', 'form', 'unit_price')
            ->orderBy('name')
            ->get();

        return response()->json($drugs);
    }

    /**
     * Import drugs from CSV
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        try {
            $results = $this->drugFormularyService->importFromCsv($request->file('file'));
            
            return response()->json([
                'message' => 'Import completed',
                'imported' => $results['imported'],
                'errors' => $results['errors'],
                'skipped' => $results['skipped'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export drug formulary to CSV/Excel
     */
    public function export(Request $request)
    {
        try {
            // Get filters from request
            $filters = $request->only(['status', 'form', 'low_stock', 'search']);
            
            // Determine file format
            $format = $request->get('format', 'xlsx');
            $extension = in_array($format, ['xlsx', 'csv']) ? $format : 'xlsx';
            
            $filename = "drug_formulary_export_" . now()->format('Y-m-d_H-i-s') . ".{$extension}";
            
            // Create export instance with filters
            $export = new \App\Exports\DrugFormularyExport($filters);
            
            return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}