<?php

namespace App\Http\Controllers;

use App\Models\DrugFormulary;
use App\Services\DrugFormularyService;
use App\Http\Requests\StoreDrugFormularyRequest;
use App\Http\Requests\UpdateDrugFormularyRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\DrugFormularyExport;

class DrugFormularyController extends Controller
{
    protected DrugFormularyService $drugFormularyService;

    public function __construct(DrugFormularyService $drugFormularyService)
    {
        $this->drugFormularyService = $drugFormularyService;
    }

    /**
     * Display a listing of drug formulary (supports Inertia + JSON)
     */
    public function index(Request $request)
    {
        // Simple query without non-existent relationships
        $query = DrugFormulary::query();

        // ---------- Filters ----------
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('atc_code', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->filled('form')) {
            $query->where('form', $request->get('form'));
        }

        if ($request->filled('stock_level')) {
            switch ($request->get('stock_level')) {
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

        if ($request->filled('atc_code')) {
            $query->where('atc_code', 'like', $request->get('atc_code') . '%');
        }

        // ---------- Handle Response Type ----------
        // Check if it's an AJAX/API request (but not an Inertia request)
        if (($request->wantsJson() || $request->expectsJson()) && !$request->header('X-Inertia')) {
            // For dashboard modal, get all drugs without pagination
            $allDrugs = $query->orderBy('name')->get();
            
            // Transform data for clean JSON structure
            $drugData = $allDrugs->map(function ($drug) {
                return [
                    'id' => $drug->id,
                    'name' => $drug->name,
                    'generic_name' => $drug->generic_name,
                    'atc_code' => $drug->atc_code,
                    'strength' => $drug->strength,
                    'form' => $drug->form,
                    'stock_quantity' => (int) $drug->stock_quantity,
                    'reorder_level' => (int) $drug->reorder_level,
                    'unit_price' => (float) $drug->unit_price,
                    'manufacturer' => $drug->manufacturer,
                    'status' => $drug->status,
                    'stock_status' => $drug->stock_status ?? 'in_stock',
                ];
            });
            
            return response()->json($drugData);
        }

        // For Inertia page, use pagination and full data
        $perPage = $request->get('per_page', 15);
        $drugs = $query->orderBy('name')->paginate($perPage);

        // Add stock status for paginated results
        $drugs->getCollection()->transform(function ($drug) {
            return $drug;
        });

        // ---------- Inertia Page ----------
        return Inertia::render('Admin/Drugs', [
            'drugs' => $drugs,
            'filters' => $request->only(['search', 'status', 'form', 'stock_level', 'atc_code']),
        ]);
    }

    /**
     * Get unique drug forms
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
     * Store new drug record
     */
    public function store(StoreDrugFormularyRequest $request): JsonResponse
    {
        try {
            $drug = DrugFormulary::create($request->validated());

            if ($request->has('substitute_ids')) {
                $drug->substitutes()->sync($request->input('substitute_ids'));
            }

            return response()->json($drug->load('substitutes'), 201);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Show single drug details
     */
    public function show(DrugFormulary $drugFormulary): JsonResponse
    {
        $drugFormulary->load('substitutes');
        $drugFormulary->stock_status = $this->drugFormularyService->getStockStatus($drugFormulary);
        return response()->json($drugFormulary);
    }

    /**
     * Update existing drug
     */
    public function update(UpdateDrugFormularyRequest $request, DrugFormulary $drugFormulary): JsonResponse
    {
        try {
            $drugFormulary->update($request->validated());

            if ($request->has('substitute_ids')) {
                $drugFormulary->substitutes()->sync($request->input('substitute_ids'));
            }

            return response()->json($drugFormulary->load('substitutes'));
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete drug formulary (safe delete)
     */
    public function destroy(DrugFormulary $drugFormulary): JsonResponse
    {
        try {
            if ($this->drugFormularyService->hasActiveReferences($drugFormulary)) {
                return response()->json(['error' => 'Cannot delete drug with active prescriptions or orders'], 409);
            }

            $drugFormulary->delete();
            return response()->json(['message' => 'Drug formulary deleted successfully']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update stock quantity (manual adjustment)
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

            $this->drugFormularyService->logStockAdjustment(
                $drugFormulary,
                $oldQuantity,
                $newQuantity,
                $request->input('adjustment_reason', 'Manual adjustment')
            );

            $drugFormulary->stock_status = $this->drugFormularyService->getStockStatus($drugFormulary);
            return response()->json($drugFormulary);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk stock update
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

                $this->drugFormularyService->logStockAdjustment(
                    $drug,
                    $oldQuantity,
                    $update['stock_quantity'],
                    $update['adjustment_reason'] ?? 'Bulk adjustment'
                );

                $updated++;
            }

            return response()->json(['message' => "Updated stock for {$updated} drugs"]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * List low stock drugs
     */
    public function getLowStockDrugs(): JsonResponse
    {
        $lowStockDrugs = DrugFormulary::whereColumn('stock_quantity', '<=', 'reorder_level')
            ->where('status', 'active')
            ->orderBy('stock_quantity')
            ->get()
            ->map(fn($drug) => tap($drug, fn($d) => 
                $d->stock_status = $this->drugFormularyService->getStockStatus($d)
            ));

        return response()->json($lowStockDrugs);
    }

    /**
     * Substitutes management
     */
    public function getSubstitutes(DrugFormulary $drugFormulary): JsonResponse
    {
        return response()->json($this->drugFormularyService->getAvailableSubstitutes($drugFormulary));
    }

    public function addSubstitute(DrugFormulary $drugFormulary, Request $request): JsonResponse
    {
        $request->validate(['substitute_id' => 'required|exists:drug_formulary,id|different:' . $drugFormulary->id]);

        try {
            $drugFormulary->substitutes()->attach($request->input('substitute_id'));
            return response()->json([
                'message' => 'Substitute added successfully',
                'substitutes' => $drugFormulary->substitutes
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function removeSubstitute(DrugFormulary $drugFormulary, DrugFormulary $substitute): JsonResponse
    {
        try {
            $drugFormulary->substitutes()->detach($substitute->id);
            return response()->json(['message' => 'Substitute removed successfully']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Stats summary for dashboard
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
     * Advanced search
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'nullable|string|max:255',
            'form' => 'nullable|string',
            'atc_code' => 'nullable|string',
            'stock_level' => 'nullable|in:in_stock,low_stock,out_of_stock',
            'status' => 'nullable|in:active,discontinued',
        ]);

        return response()->json($this->drugFormularyService->searchDrugs($request->all()));
    }

    /**
     * Options for dropdowns
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
     * Import from CSV/XLSX
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt,xlsx,xls']);

        try {
            $results = $this->drugFormularyService->importFromCsv($request->file('file'));
            return response()->json([
                'message' => 'Import completed',
                'imported' => $results['imported'],
                'errors' => $results['errors'],
                'skipped' => $results['skipped'],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export drugs list (XLSX / CSV)
     */
    public function export(Request $request)
    {
        try {
            $filters = $request->only(['status', 'form', 'low_stock', 'search']);
            $format = $request->get('format', 'xlsx');
            $extension = in_array($format, ['xlsx', 'csv']) ? $format : 'xlsx';
            $filename = "drug_formulary_export_" . now()->format('Y-m-d_H-i-s') . ".{$extension}";

            $export = new DrugFormularyExport($filters);
            return Excel::download($export, $filename);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}
