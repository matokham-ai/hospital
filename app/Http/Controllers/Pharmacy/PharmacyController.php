<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Drug;
use App\Models\DrugFormulary;
use App\Models\DrugInteraction;
use App\Models\DrugSubstitute;
use App\Models\PharmacyStock;
use App\Models\Prescription;
use Carbon\Carbon;

class PharmacyController extends Controller
{
    /**
     * Pharmacy dashboard view
     */
    public function index()
    {
        $drugCount = DrugFormulary::active()->count();
        
        $stats = [
            'totalDrugs' => $drugCount,
            'pendingPrescriptions' => Prescription::where('status', 'pending')->count(),
            'dispensedToday' => Prescription::whereDate('updated_at', Carbon::today())
                ->where('status', 'dispensed')->count(),
            'lowStockItems' => PharmacyStock::whereColumn('quantity', '<=', 'min_level')->count(),
            'expiringSoon' => PharmacyStock::where('expiry_date', '<=', Carbon::now()->addDays(90))->count(),
        ];

        $prescriptions = Prescription::with([
            'patient',
            'physician',
            'items' => function ($query) {
                $query->with('drug:id,generic_name,brand_name,strength,formulation');
            }
        ])
        ->where('status', 'pending')
        ->latest()
        ->take(10)
        ->get([
            'id',
            'patient_id',
            'physician_id',
            'status',
            'created_at',
            'drug_name',
            'dosage',
            'frequency',
            'duration',
            'quantity',
            'notes'
        ]);

        $inventory = PharmacyStock::with([
            'drug' => function ($query) {
                $query->select('id', 'name', 'generic_name', 'strength');
            }
        ])
        ->select('id', 'drug_id', 'quantity', 'min_level', 'max_level', 'batch_no', 'expiry_date')
        ->orderBy('quantity', 'asc')
        ->take(10)
        ->get();




        return Inertia::render('Pharmacist/Dashboard', [
            'stats' => $stats,
            'prescriptions' => $prescriptions,
            'inventory' => $inventory,
        ]);
    }

    /**
     * List formulary drugs
     */
    public function formulary(Request $request)
    {
        $query = DrugFormulary::select([
            'id', 'name', 'generic_name', 'brand_name', 'strength', 'form', 
            'formulation', 'atc_code', 'therapeutic_class', 'unit_price', 
            'cost_price', 'stock_quantity', 'reorder_level', 'manufacturer',
            'expiry_date', 'status', 'requires_prescription', 'storage_conditions'
        ])->active();

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = trim($request->search);
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%'])
                  ->orWhereRaw('LOWER(generic_name) LIKE ?', ['%' . strtolower($search) . '%'])
                  ->orWhereRaw('LOWER(brand_name) LIKE ?', ['%' . strtolower($search) . '%'])
                  ->orWhereRaw('LOWER(atc_code) LIKE ?', ['%' . strtolower($search) . '%'])
                  ->orWhereRaw('LOWER(therapeutic_class) LIKE ?', ['%' . strtolower($search) . '%'])
                  ->orWhereRaw('LOWER(manufacturer) LIKE ?', ['%' . strtolower($search) . '%']);
            });
        }

        // Filter by form
        if ($request->has('form') && $request->form) {
            $query->where('form', $request->form);
        }

        // Filter by therapeutic class
        if ($request->has('therapeutic_class') && $request->therapeutic_class) {
            $query->where('therapeutic_class', $request->therapeutic_class);
        }

        // Filter by stock status
        if ($request->has('stock_status') && $request->stock_status) {
            switch ($request->stock_status) {
                case 'in_stock':
                    $query->where('stock_quantity', '>', 0)
                          ->whereColumn('stock_quantity', '>', 'reorder_level');
                    break;
                case 'low_stock':
                    $query->where('stock_quantity', '>', 0)
                          ->whereColumn('stock_quantity', '<=', 'reorder_level');
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', 0);
                    break;
            }
        }

        // Filter by prescription requirement
        if ($request->filled('prescription')) {
            $query->where('requires_prescription', $request->prescription === '1');
        }

        // Sorting
        $sortBy = $request->get('sort', 'generic_name');
        $sortOrder = $request->get('order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $drugs = $query->paginate(25)->withQueryString();

        // Get filter options
        $forms = DrugFormulary::active()->distinct()->pluck('form')->filter()->sort()->values();
        $therapeuticClasses = DrugFormulary::active()->distinct()->pluck('therapeutic_class')->filter()->sort()->values();

        return Inertia::render('Pharmacist/Formulary', [
            'drugs' => $drugs,
            'filters' => array_merge([
                'search' => '',
                'form' => '',
                'therapeutic_class' => '',
                'stock_status' => '',
                'prescription' => '',
                'sort' => 'generic_name',
                'order' => 'asc'
            ], array_filter($request->only(['search', 'form', 'therapeutic_class', 'stock_status', 'prescription', 'sort', 'order']), function($value) {
                return $value !== null;
            })),
            'filterOptions' => [
                'forms' => $forms,
                'therapeuticClasses' => $therapeuticClasses,
            ],
        ]);
    }



    /**
     * Show drug creation wizard
     */
    public function createDrug()
    {
        \Log::info('DrugWizard: Accessing createDrug method');
        
        try {
            // Get manufacturers for autocomplete
            $manufacturers = DrugFormulary::whereNotNull('manufacturer')
                ->where('manufacturer', '!=', '')
                ->select('manufacturer')
                ->groupBy('manufacturer')
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->manufacturer,
                        'count' => DrugFormulary::where('manufacturer', $item->manufacturer)->count()
                    ];
                })
                ->sortByDesc('count')
                ->take(50)
                ->values();

            // Get ATC codes for autocomplete
            $atcCodes = DrugFormulary::whereNotNull('atc_code')
                ->where('atc_code', '!=', '')
                ->distinct()
                ->orderBy('atc_code')
                ->pluck('atc_code')
                ->values();

            return Inertia::render('Pharmacist/DrugWizard', [
                'manufacturers' => $manufacturers,
                'atcCodes' => $atcCodes,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading drug wizard: ' . $e->getMessage());
            
            // Return with empty data if query fails
            return Inertia::render('Pharmacist/DrugWizard', [
                'manufacturers' => [],
                'atcCodes' => [],
            ]);
        }
    }

    /**
     * Store new drug from wizard
     */
    public function storeDrug(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'required|string|max:255',
            'brand_name' => 'nullable|string|max:255',
            'manufacturer' => 'nullable|string|max:255',
            'requires_prescription' => 'boolean',
            'status' => 'required|in:active,discontinued',
            'atc_code' => 'nullable|string|max:20',
            'therapeutic_class' => 'nullable|string|max:255',
            'strength' => 'required|string|max:100',
            'form' => 'required|string|max:100',
            'formulation' => 'nullable|string|max:255',
            'dosage_form_details' => 'nullable|string',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'batch_number' => 'nullable|string|max:100',
            'expiry_date' => 'nullable|date',
            'storage_conditions' => 'nullable|string|max:500',
            'contraindications' => 'nullable|string',
            'side_effects' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $drug = DrugFormulary::create($validated);

        return redirect()->route('pharmacy.formulary')
            ->with('success', 'Drug added successfully!');
    }

    /**
     * Check drug interactions (basic)
     */
    public function checkInteraction(Request $request)
    {
        $drugA = $request->input('drug_a_id');
        $drugB = $request->input('drug_b_id');

        $interaction = DrugInteraction::where(function ($q) use ($drugA, $drugB) {
            $q->where('drug_a_id', $drugA)->where('drug_b_id', $drugB);
        })->orWhere(function ($q) use ($drugA, $drugB) {
            $q->where('drug_a_id', $drugB)->where('drug_b_id', $drugA);
        })->first();

        return response()->json([
            'exists' => !!$interaction,
            'interaction' => $interaction,
        ]);
    }

    /**
     * Find substitutes for a given drug
     */
    public function substitutes($id)
    {
        $drug = Drug::with('substitutes')->findOrFail($id);
        return response()->json($drug->substitutes);
    }

    /**
     * Pharmacy reports dashboard
     */
    public function reports()
    {
        $stats = [
            'totalDispensed' => Prescription::where('status', 'dispensed')->count(),
            'pendingPrescriptions' => Prescription::where('status', 'pending')->count(),
            'lowStockItems' => PharmacyStock::whereColumn('quantity', '<=', 'min_level')->count(),
            'expiringSoon' => PharmacyStock::where('expiry_date', '<=', Carbon::now()->addDays(90))->count(),
        ];

        return Inertia::render('Pharmacist/Reports/Dashboard', [
            'stats' => $stats,
        ]);
    }

    /**
     * Dispensing report
     */
    public function dispensingReport(Request $request)
    {
        $query = Prescription::with(['patient', 'physician', 'items.drug'])
            ->where('status', 'dispensed');

        if ($request->has('date_from')) {
            $query->whereDate('updated_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('updated_at', '<=', $request->date_to);
        }

        $prescriptions = $query->latest('updated_at')->paginate(25);

        return Inertia::render('Pharmacist/Reports/Dispensing', [
            'prescriptions' => $prescriptions,
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }

    /**
     * Stock report
     */
    public function stockReport(Request $request)
    {
        $query = PharmacyStock::with(['drug' => function($query) {
                $query->select('id', 'name', 'generic_name', 'strength', 'form', 'unit_price');
            }])
            ->select('id', 'drug_id', 'quantity', 'min_level', 'max_level', 'batch_no', 'expiry_date');

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('drug', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%")
                  ->orWhere('atc_code', 'like', "%{$search}%");
            })->orWhere('batch_no', 'like', "%{$search}%");
        }

        // Filter by stock status
        if ($request->has('status') && $request->status) {
            switch ($request->status) {
                case 'low':
                    $query->whereColumn('quantity', '<=', 'min_level');
                    break;
                case 'high':
                    $query->whereColumn('quantity', '>=', 'max_level');
                    break;
                case 'normal':
                    $query->whereColumn('quantity', '>', 'min_level')
                          ->whereColumn('quantity', '<', 'max_level');
                    break;
            }
        }

        // Sorting
        $sortBy = $request->get('sort', 'quantity');
        $sortOrder = $request->get('order', 'asc');
        
        if ($sortBy === 'drug_name') {
            $query->join('drug_formulary', 'pharmacy_stock.drug_id', '=', 'drug_formulary.id')
                  ->orderBy('drug_formulary.generic_name', $sortOrder)
                  ->select('pharmacy_stock.*');
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $stocks = $query->paginate(25)->withQueryString();

        // Add unit_price to each stock item for frontend compatibility
        $stocks->getCollection()->transform(function ($stock) {
            $stock->cost_price = $stock->drug->unit_price ?? 0;
            return $stock;
        });

        return Inertia::render('Pharmacist/Reports/Stock', [
            'stocks' => $stocks,
            'filters' => array_merge([
                'search' => '',
                'status' => '',
                'sort' => 'quantity',
                'order' => 'asc'
            ], $request->only(['search', 'status', 'sort', 'order'])),
        ]);
    }

    /**
     * Expiry report
     */
    public function expiryReport()
    {
        $expiringStocks = PharmacyStock::with(['drug' => function($query) {
                $query->select('id', 'name', 'generic_name', 'strength', 'form');
            }])
            ->where('expiry_date', '<=', Carbon::now()->addDays(180))
            ->orderBy('expiry_date', 'asc')
            ->paginate(25);

        return Inertia::render('Pharmacist/Reports/Expiry', [
            'expiringStocks' => $expiringStocks,
        ]);
    }
}
