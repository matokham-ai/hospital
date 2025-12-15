<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceCatalogue;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of service categories.
     */
    public function index(Request $request)
    {
        try {
            $query = ServiceCatalogue::with('department');

            // Filter by category
            if ($request->category) {
                $query->where('category', $request->category);
            }

            // Filter by department
            if ($request->department_id) {
                $query->where('department_id', $request->department_id);
            }

            // Search functionality
            if ($request->search) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('code', 'like', '%' . $request->search . '%')
                      ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            }

            // Filter by active status
            if ($request->has('active')) {
                $query->where('is_active', $request->boolean('active'));
            }

            $services = $query->orderBy('category')
                             ->orderBy('name')
                             ->paginate(10)
                             ->withQueryString();

            $departments = Department::all();
            
            // Get category statistics
            $categoryStats = ServiceCatalogue::selectRaw('category, COUNT(*) as count, AVG(unit_price) as avg_price')
                                           ->groupBy('category')
                                           ->get();

            return Inertia::render('Admin/Categories/Index', [
                'services' => $services,
                'departments' => $departments,
                'categoryStats' => $categoryStats,
                'filters' => $request->only(['category', 'department_id', 'search', 'active']),
                'categories' => config('service_categories', ServiceCatalogue::CATEGORIES),
            ]);
        } catch (\Exception $e) {
            \Log::error('Categories index error: ' . $e->getMessage());
            
            // Return with empty data to prevent crashes
            return Inertia::render('Admin/Categories/Index', [
                'services' => [
                    'data' => [],
                    'links' => [],
                    'meta' => ['last_page' => 1, 'from' => 0, 'to' => 0, 'total' => 0]
                ],
                'departments' => [],
                'categoryStats' => [],
                'filters' => [],
                'categories' => config('service_categories', ServiceCatalogue::CATEGORIES),
            ]);
        }
    }

    /**
     * Show the form for creating a new service.
     */
    public function create()
    {
        $departments = Department::all();
        
        return Inertia::render('Admin/Categories/Create', [
            'departments' => $departments,
            'categories' => config('service_categories', ServiceCatalogue::CATEGORIES),
        ]);
    }

    /**
     * Store a newly created service in storage.
     */
    public function store(Request $request)
    {
        $categories = config('service_categories', ServiceCatalogue::CATEGORIES);
        $validated = $request->validate([
            'code' => 'required|string|unique:service_catalogues|max:20',
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:' . implode(',', array_keys($categories)),
            'description' => 'nullable|string|max:1000',
            'unit_price' => 'required|numeric|min:0|max:999999.99',
            'unit_of_measure' => 'nullable|string|max:50',
            'department_id' => 'nullable|exists:departments,deptid',
            'is_active' => 'boolean',
            'is_billable' => 'boolean',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        ServiceCatalogue::create($validated);

        return redirect()->route('admin.categories.index')
                        ->with('success', 'Service created successfully.');
    }

    /**
     * Display the specified service.
     */
    public function show($id)
    {
        $category = ServiceCatalogue::with('department')->findOrFail($id);
        
        return Inertia::render('Admin/Categories/Show', [
            'service' => $category,
        ]);
    }

    /**
     * Show the form for editing the specified service.
     */
    public function edit($id)
    {
        $category = ServiceCatalogue::findOrFail($id);
        $departments = Department::all();
        
        return Inertia::render('Admin/Categories/Edit', [
            'service' => $category,
            'departments' => $departments,
            'categories' => config('service_categories', ServiceCatalogue::CATEGORIES),
        ]);
    }

    /**
     * Update the specified service in storage.
     */
    public function update(Request $request, $id)
    {
        $category = ServiceCatalogue::findOrFail($id);
        $categories = config('service_categories', ServiceCatalogue::CATEGORIES);
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:service_catalogues,code,' . $category->id,
            'name' => 'required|string|max:255',
            'category' => 'required|string|in:' . implode(',', array_keys($categories)),
            'description' => 'nullable|string|max:1000',
            'unit_price' => 'required|numeric|min:0|max:999999.99',
            'unit_of_measure' => 'nullable|string|max:50',
            'department_id' => 'nullable|exists:departments,deptid',
            'is_active' => 'boolean',
            'is_billable' => 'boolean',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $category->update($validated);

        return redirect()->route('admin.categories.index')
                        ->with('success', 'Service updated successfully.');
    }

    /**
     * Remove the specified service from storage.
     */
    public function destroy($id)
    {
        $category = ServiceCatalogue::findOrFail($id);
        
        // Check if service is being used in billing items
        $billingItemsCount = \App\Models\BillingItem::where('service_code', $category->code)->count();
        
        if ($billingItemsCount > 0) {
            return redirect()->back()
                           ->with('error', 'Cannot delete service. It is being used in ' . $billingItemsCount . ' billing items.');
        }

        $category->delete();

        return redirect()->route('admin.categories.index')
                        ->with('success', 'Service deleted successfully.');
    }

    /**
     * Bulk update service prices
     */
    public function bulkUpdatePrices(Request $request)
    {
        $categories = config('service_categories', ServiceCatalogue::CATEGORIES);
        $validated = $request->validate([
            'category' => 'required|string|in:' . implode(',', array_keys($categories)),
            'adjustment_type' => 'required|in:percentage,fixed',
            'adjustment_value' => 'required|numeric',
        ]);

        $query = ServiceCatalogue::where('category', $validated['category']);

        if ($validated['adjustment_type'] === 'percentage') {
            $multiplier = 1 + ($validated['adjustment_value'] / 100);
            $query->update([
                'unit_price' => \DB::raw('unit_price * ' . $multiplier)
            ]);
        } else {
            $query->update([
                'unit_price' => \DB::raw('unit_price + ' . $validated['adjustment_value'])
            ]);
        }

        $updatedCount = $query->count();

        return redirect()->back()
                        ->with('success', "Updated prices for {$updatedCount} services in {$validated['category']} category.");
    }

    /**
     * Toggle service active status
     */
    public function toggleStatus($id)
    {
        $category = ServiceCatalogue::findOrFail($id);
        
        $category->update([
            'is_active' => !$category->is_active
        ]);

        $status = $category->is_active ? 'activated' : 'deactivated';
        
        return redirect()->back()
                        ->with('success', "Service {$status} successfully.");
    }

    /**
     * Update service department
     */
    public function updateDepartment(Request $request, $id)
    {
        $service = ServiceCatalogue::findOrFail($id);
        
        $validated = $request->validate([
            'department_id' => 'nullable|exists:departments,deptid',
        ]);

        $service->update([
            'department_id' => $validated['department_id']
        ]);

        $deptName = $validated['department_id'] 
            ? Department::where('deptid', $validated['department_id'])->value('name')
            : 'None';
        
        return redirect()->back()
                        ->with('success', "Department updated to {$deptName} successfully.");
    }

    /**
     * Update category card (name and average price)
     */
    public function updateCategoryCard(Request $request, $categoryKey)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'avg_price' => 'required|numeric|min:0',
        ]);

        // Load current categories from config
        $configPath = config_path('service_categories.php');
        $categories = config('service_categories');

        // Check if category exists
        if (!isset($categories[$categoryKey])) {
            return redirect()->back()
                            ->with('error', 'Category not found.');
        }

        // Update the category name
        $categories[$categoryKey] = $validated['name'];

        // Write back to config file
        $content = "<?php\n\nreturn [\n";
        foreach ($categories as $key => $value) {
            $content .= "    '{$key}' => '{$value}',\n";
        }
        $content .= "];\n";

        file_put_contents($configPath, $content);

        // Clear config cache
        \Artisan::call('config:clear');

        // Update all services in this category to match the new average price
        $services = ServiceCatalogue::where('category', $categoryKey)->get();
        $currentAvg = $services->avg('unit_price');
        
        if ($currentAvg > 0) {
            $multiplier = $validated['avg_price'] / $currentAvg;
            
            // Update each service proportionally
            foreach ($services as $service) {
                $service->update([
                    'unit_price' => round($service->unit_price * $multiplier, 2)
                ]);
            }
        }

        return redirect()->back()
                        ->with('success', 'Category updated successfully. All service prices adjusted proportionally.');
    }
}