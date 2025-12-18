<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TestCatalog;
use App\Services\TestCatalogService;
use App\Http\Requests\StoreTestCatalogRequest;
use App\Http\Requests\UpdateTestCatalogRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TestCatalogController extends Controller
{
    protected TestCatalogService $testCatalogService;

    public function __construct(TestCatalogService $testCatalogService)
    {
        $this->testCatalogService = $testCatalogService;
    }

    /**
     * Display a listing of test catalogs
     */
    public function index(Request $request): JsonResponse
    {
        $query = TestCatalog::with('department:id,name');

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        // Apply category filter
        if ($request->has('category')) {
            $query->where('category', $request->get('category'));
        }

        // Apply status filter
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        // Apply department filter
        if ($request->has('department_id')) {
            $query->where('department_id', $request->get('department_id'));
        }

        // Apply price range filter
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->get('min_price'));
        }
        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->get('max_price'));
        }

        $perPage = $request->get('per_page', 15);
        $tests = $query->orderBy('name')->paginate($perPage);

        return response()->json($tests);
    }

    /**
     * Get test categories for filtering
     */
    public function getCategories(): JsonResponse
    {
        // Get categories from test_categories table
        $categories = \App\Models\TestCategory::select('name')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->pluck('name');

        return response()->json($categories);
    }

    /**
     * Store a newly created test catalog
     */
    public function store(StoreTestCatalogRequest $request): JsonResponse
    {
        try {
            $test = TestCatalog::create($request->validated());
            
            return response()->json($test->load('department'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified test catalog
     */
    public function show(TestCatalog $testCatalog): JsonResponse
    {
        $testCatalog->load('department');
        
        return response()->json($testCatalog);
    }

    /**
     * Update the specified test catalog
     */
    public function update(UpdateTestCatalogRequest $request, TestCatalog $testCatalog): JsonResponse
    {
        try {
            // Check if test has pending orders before price change
            if ($request->has('price') && $request->input('price') != $testCatalog->price) {
                $hasPendingOrders = $this->testCatalogService->hasPendingOrders($testCatalog);
                if ($hasPendingOrders) {
                    return response()->json([
                        'warning' => 'This test has pending orders. Price change will affect future orders only.',
                        'pending_orders_count' => $hasPendingOrders
                    ], 200);
                }
            }

            $testCatalog->update($request->validated());
            
            return response()->json($testCatalog->load('department'));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified test catalog
     */
    public function destroy(TestCatalog $testCatalog): JsonResponse
    {
        try {
            // Check if test has pending orders
            $pendingOrders = $this->testCatalogService->hasPendingOrders($testCatalog);
            if ($pendingOrders) {
                return response()->json([
                    'error' => 'Cannot delete test with pending orders',
                    'pending_orders_count' => $pendingOrders
                ], 409);
            }

            $testCatalog->delete();
            
            return response()->json(['message' => 'Test catalog deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update tests
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:test_catalogs,id',
            'updates.*.data' => 'required|array',
        ]);

        try {
            $updated = 0;
            $warnings = [];

            foreach ($request->input('updates') as $update) {
                $test = TestCatalog::find($update['id']);
                $data = $update['data'];
                
                // Check for pending orders if price is being changed
                if (isset($data['price']) && $data['price'] != $test->price) {
                    $pendingOrders = $this->testCatalogService->hasPendingOrders($test);
                    if ($pendingOrders) {
                        $warnings[] = "Test '{$test->name}' has {$pendingOrders} pending orders";
                    }
                }

                $test->update($data);
                $updated++;
            }

            return response()->json([
                'message' => "Updated {$updated} test" . ($updated !== 1 ? 's' : ''),
                'warnings' => $warnings
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk update test prices
     */
    public function bulkUpdatePrices(Request $request): JsonResponse
    {
        $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:test_catalogs,id',
            'updates.*.price' => 'required|numeric|min:0',
        ]);

        try {
            $updated = 0;
            $warnings = [];

            foreach ($request->input('updates') as $update) {
                $test = TestCatalog::find($update['id']);
                
                // Check for pending orders
                $pendingOrders = $this->testCatalogService->hasPendingOrders($test);
                if ($pendingOrders) {
                    $warnings[] = "Test '{$test->name}' has {$pendingOrders} pending orders";
                }

                $test->update(['price' => $update['price']]);
                $updated++;
            }

            return response()->json([
                'message' => "Updated prices for {$updated} tests",
                'warnings' => $warnings
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update test turnaround time
     */
    public function updateTurnaroundTime(TestCatalog $testCatalog, Request $request): JsonResponse
    {
        $request->validate([
            'turnaround_time' => 'required|integer|min:1|max:168', // Max 1 week
        ]);

        try {
            $testCatalog->update(['turnaround_time' => $request->input('turnaround_time')]);
            
            return response()->json($testCatalog);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get test statistics
     */
    public function getStatistics(): JsonResponse
    {
        $stats = [
            'total_tests' => TestCatalog::count(),
            'active_tests' => TestCatalog::where('status', 'active')->count(),
            'inactive_tests' => TestCatalog::where('status', 'inactive')->count(),
            'categories_count' => TestCatalog::distinct('category')->count(),
            'average_price' => TestCatalog::where('status', 'active')->avg('price'),
            'average_turnaround_time' => TestCatalog::where('status', 'active')->avg('turnaround_time'),
            'price_range' => [
                'min' => TestCatalog::where('status', 'active')->min('price'),
                'max' => TestCatalog::where('status', 'active')->max('price'),
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Search tests with advanced filters
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate([
            'query' => 'nullable|string|max:255',
            'category' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'min_turnaround_time' => 'nullable|integer|min:1',
            'max_turnaround_time' => 'nullable|integer|min:1',
            'status' => 'nullable|in:active,inactive',
        ]);

        $query = $request->input('query', '');
        $filters = $request->except('query');
        
        $results = $this->testCatalogService->searchTests($query, $filters);
        
        return response()->json($results);
    }

    /**
     * Get tests for dropdown/select options
     */
    public function options(): JsonResponse
    {
        $tests = TestCatalog::where('status', 'active')
            ->select('id', 'name', 'code', 'price', 'category')
            ->orderBy('name')
            ->get();

        return response()->json($tests);
    }

    /**
     * Import tests from CSV
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        try {
            $results = $this->testCatalogService->importFromCsv($request->file('file'));
            
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
     * Export test catalogs to CSV/Excel
     */
    public function export(Request $request)
    {
        try {
            // Get filters from request
            $filters = $request->only(['status', 'category', 'department_id', 'search']);
            
            // Determine file format
            $format = $request->get('format', 'xlsx');
            $extension = in_array($format, ['xlsx', 'csv']) ? $format : 'xlsx';
            
            $filename = "test_catalogs_export_" . now()->format('Y-m-d_H-i-s') . ".{$extension}";
            
            // Create export instance with filters
            $export = new \App\Exports\TestCatalogExport($filters);
            
            return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}