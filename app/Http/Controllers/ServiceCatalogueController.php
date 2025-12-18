<?php

namespace App\Http\Controllers;

use App\Models\ServiceCatalogue;
use App\Models\Department;
use App\Services\ServiceCodeGeneratorService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServiceCatalogueController extends Controller
{
    protected ServiceCodeGeneratorService $codeGenerator;

    public function __construct(ServiceCodeGeneratorService $codeGenerator)
    {
        $this->codeGenerator = $codeGenerator;
    }

    public function index(Request $request)
    {
        $query = ServiceCatalogue::with('department');

        if ($request->category) {
            $query->byCategory($request->category);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        $services = $query->paginate(20);
        $departments = Department::all();

        return Inertia::render('ServiceCatalogue/Index', [
            'services' => $services,
            'departments' => $departments,
            'filters' => $request->only(['category', 'search']),
            'categories' => ServiceCatalogue::CATEGORIES,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'nullable|string|unique:service_catalogues',
            'name' => 'required|string',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'unit_price' => 'required|numeric|min:0',
            'unit_of_measure' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'is_active' => 'boolean',
            'is_billable' => 'boolean',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $data = $request->all();
        
        // Auto-generate code if not provided
        if (empty($data['code'])) {
            $data['code'] = $this->codeGenerator->generateCode(
                $data['category'], 
                $data['department_id'] ?? null
            );
        }

        ServiceCatalogue::create($data);

        return back()->with('success', 'Service added successfully.');
    }

    public function update(Request $request, ServiceCatalogue $serviceCatalogue)
    {
        $request->validate([
            'code' => 'required|string|unique:service_catalogues,code,' . $serviceCatalogue->id,
            'name' => 'required|string',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'unit_price' => 'required|numeric|min:0',
            'unit_of_measure' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'is_active' => 'boolean',
            'is_billable' => 'boolean',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $serviceCatalogue->update($request->all());

        return back()->with('success', 'Service updated successfully.');
    }

    public function destroy(ServiceCatalogue $serviceCatalogue)
    {
        $serviceCatalogue->delete();

        return back()->with('success', 'Service deleted successfully.');
    }

    /**
     * Generate a service code based on category and department
     */
    public function generateCode(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $code = $this->codeGenerator->generateCode(
            $request->category,
            $request->department_id
        );

        return response()->json(['code' => $code]);
    }

    /**
     * Generate multiple code suggestions
     */
    public function generateCodeSuggestions(Request $request)
    {
        $request->validate([
            'category' => 'required|string',
            'department_id' => 'nullable|exists:departments,id',
            'count' => 'nullable|integer|min:1|max:5',
        ]);

        $suggestions = $this->codeGenerator->generateCodeSuggestions(
            $request->category,
            $request->department_id,
            $request->count ?? 3
        );

        return response()->json(['suggestions' => $suggestions]);
    }

    /**
     * Check if a service code exists
     */
    public function checkCodeExists(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $exists = $this->codeGenerator->codeExists($request->code);

        return response()->json(['exists' => $exists]);
    }
}