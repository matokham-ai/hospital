<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\TestCatalog;
use App\Models\Department;
use App\Models\TestCategory;

class TestCatalogController extends Controller
{
    /**
     * Display the Test Catalog Management dashboard.
     */
    public function index(Request $request): Response
    {
        // Build query with search and filters
        $query = TestCatalog::with(['department:deptid,name', 'category:id,name,code']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('sample_type', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('name', $request->get('category'));
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        // Filter by price range
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->get('min_price'));
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->get('max_price'));
        }

        // Get filtered tests
        $tests = $query->orderBy('name')
            ->get()
            ->map(function ($test) {
                return [
                    'id' => $test->id,
                    'name' => $test->name,
                    'code' => $test->code,
                    'category' => $test->category ? $test->category->name : null,
                    'price' => $test->price,
                    'turnaround_time' => $test->turnaround_time,
                    'unit' => $test->unit,
                    'normal_range' => $test->normal_range,
                    'sample_type' => $test->sample_type,
                    'instructions' => $test->instructions,
                    'status' => $test->status,
                    'department' => $test->department ? [
                        'id' => $test->department->deptid,
                        'name' => $test->department->name
                    ] : null,
                    'created_at' => $test->created_at,
                    'updated_at' => $test->updated_at,
                ];
            });

        // Get categories from the test_categories table
        $categories = TestCategory::active()
            ->ordered()
            ->get(['id', 'name', 'code', 'is_active']);

        // Calculate statistics
        $stats = [
            'total_tests' => TestCatalog::count(),
            'active_tests' => TestCatalog::where('status', 'active')->count(),
            'inactive_tests' => TestCatalog::where('status', 'inactive')->count(),
            'categories_count' => TestCategory::active()->count(),
            'average_price' => round(TestCatalog::avg('price') ?? 0, 2),
            'average_turnaround_time' => round(TestCatalog::avg('turnaround_time') ?? 0, 2),
        ];

        // Handle JSON requests (e.g., from dashboard) but not Inertia requests
        if (($request->wantsJson() || $request->expectsJson()) && !$request->header('X-Inertia')) {
            return response()->json($tests);
        }

        return Inertia::render('Admin/Tests', [
            'tests' => $tests,
            'categories' => $categories,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created test catalog.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:test_catalogs',
            'category_id' => 'required|exists:test_categories,id',
            'price' => 'required|numeric|min:0',
            'turnaround_time' => 'required|integer|min:1',
            'unit' => 'nullable|string|max:50',
            'normal_range' => 'nullable|string|max:255',
            'sample_type' => 'nullable|string|max:100',
            'instructions' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'deptid' => 'nullable|exists:departments,deptid',
        ]);

        TestCatalog::create($validated);

        return redirect()->back()->with('success', 'Test catalog created successfully.');
    }

    /**
     * Update the specified test catalog.
     */
    public function update(Request $request, TestCatalog $testCatalog)
    {
        // For simple status updates, allow minimal validation
        if ($request->has('status') && count($request->all()) === 1) {
            $validated = $request->validate([
                'status' => 'required|in:active,inactive',
            ]);
        } else {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'code' => 'sometimes|required|string|max:50|unique:test_catalogs,code,' . $testCatalog->id,
                'category_id' => 'sometimes|required|exists:test_categories,id',
                'price' => 'sometimes|required|numeric|min:0',
                'turnaround_time' => 'sometimes|required|integer|min:1',
                'unit' => 'nullable|string|max:50',
                'normal_range' => 'nullable|string|max:255',
                'sample_type' => 'nullable|string|max:100',
                'instructions' => 'nullable|string',
                'status' => 'sometimes|required|in:active,inactive',
                'deptid' => 'nullable|exists:departments,deptid',
            ]);
        }

        $testCatalog->update($validated);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Test catalog updated successfully.',
                'data' => $testCatalog->fresh()
            ]);
        }

        return redirect()->back()->with('success', 'Test catalog updated successfully.');
    }

    /**
     * Remove the specified test catalog.
     */
    public function destroy(TestCatalog $testCatalog)
    {
        try {
            $testCatalog->delete();
            
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Test catalog deleted successfully.'
                ]);
            }
            
            return redirect()->back()->with('success', 'Test catalog deleted successfully.');
        } catch (\Exception $e) {
            if (request()->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete test catalog. It may have pending orders.'
                ], 422);
            }
            
            return redirect()->back()->with('error', 'Cannot delete test catalog. It may have pending orders.');
        }
    }

    /**
     * Bulk update test catalogs.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.id' => 'required|exists:test_catalogs,id',
            'updates.*.data' => 'required|array',
        ]);

        foreach ($validated['updates'] as $update) {
            $testCatalog = TestCatalog::find($update['id']);
            if ($testCatalog) {
                $testCatalog->update($update['data']);
            }
        }

        return redirect()->back()->with('success', 'Test catalogs updated successfully.');
    }

    /**
     * Get test catalog options for dropdowns.
     */
    public function options()
    {
        return response()->json(
            TestCatalog::where('status', 'active')
                ->select('id', 'name', 'code', 'price')
                ->orderBy('name')
                ->get()
        );
    }
}
