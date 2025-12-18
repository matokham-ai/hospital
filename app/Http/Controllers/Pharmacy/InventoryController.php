<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\PharmacyStock;
use App\Models\StockMovement;
use App\Models\GrnPurchase;
use App\Models\GrnItem;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * Inventory dashboard — overview of current stock
     */
    public function index()
    {
        $stock = PharmacyStock::with(['drug:id,generic_name,brand_name,strength,formulation', 'store:id,name'])
            ->orderBy('expiry_date')
            ->paginate(25);

        $lowStock = PharmacyStock::whereColumn('quantity', '<', 'min_level')->count();
        $nearExpiry = PharmacyStock::where('expiry_date', '<', Carbon::now()->addDays(90))->count();

        return Inertia::render('Pharmacist/Inventory', [
            'stock' => $stock,
            'lowStockCount' => $lowStock,
            'nearExpiryCount' => $nearExpiry,
        ]);
    }

    /**
     * Record a GRN (Goods Received Note)
     */
    public function storeGrn(Request $request)
    {
        $validated = $request->validate([
            'invoice_no' => 'required|string|max:50',
            'supplier_id' => 'nullable|integer',
            'received_date' => 'required|date',
            'items' => 'required|array',
            'items.*.drug_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.batch_no' => 'nullable|string',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated) {
            $grn = GrnPurchase::create([
                'supplier_id' => $validated['supplier_id'] ?? null,
                'invoice_no' => $validated['invoice_no'],
                'received_date' => $validated['received_date'],
                'total_amount' => collect($validated['items'])->sum(fn ($i) => $i['quantity'] * $i['unit_price']),
                'status' => 'posted',
            ]);

            foreach ($validated['items'] as $item) {
                GrnItem::create(array_merge($item, ['grn_id' => $grn->id]));

                PharmacyStock::updateOrCreate(
                    [
                        'drug_id' => $item['drug_id'],
                        'batch_no' => $item['batch_no'] ?? null,
                    ],
                    [
                        'expiry_date' => $item['expiry_date'] ?? null,
                        'quantity' => DB::raw('quantity + ' . (int)$item['quantity']),
                        'last_updated' => Carbon::now(),
                    ]
                );

                StockMovement::create([
                    'drug_id' => $item['drug_id'],
                    'movement_type' => 'GRN',
                    'quantity' => $item['quantity'],
                    'reference_no' => $grn->invoice_no,
                    'user_id' => auth()->id(),
                ]);
            }
        });

        return redirect()->back()->with('success', 'Goods received successfully.');
    }

    /**
     * Stock movement listing
     */
    public function movements()
    {
        $movements = StockMovement::with(['drug', 'user'])->latest()->paginate(30);
        return Inertia::render('Pharmacist/StockMovements', [
            'movements' => $movements,
        ]);
    }

    /**
     * Store a new stock item
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'drug_id' => 'required|integer|exists:drugs,id',
            'store_id' => 'nullable|integer|exists:pharmacy_stores,id',
            'quantity' => 'required|integer|min:0',
            'min_level' => 'required|integer|min:0',
            'max_level' => 'required|integer|min:0',
            'batch_no' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date',
        ]);

        // If no store is selected, use the first available store as default
        if (empty($validated['store_id'])) {
            $defaultStore = \App\Models\PharmacyStore::where('is_active', true)->first();
            if (!$defaultStore) {
                return redirect()->back()->withErrors(['store_id' => 'No active pharmacy store found. Please create a store first.']);
            }
            $validated['store_id'] = $defaultStore->id;
        }

        // Check if this drug already exists in the selected store with the same batch
        $existingStock = PharmacyStock::where('drug_id', $validated['drug_id'])
            ->where('store_id', $validated['store_id'])
            ->where('batch_no', $validated['batch_no'] ?? null)
            ->first();

        if ($existingStock) {
            return redirect()->back()->withErrors(['drug_id' => 'This drug with the same batch number already exists in the selected store. Please edit the existing stock instead.']);
        }

        $validated['last_updated'] = Carbon::now();

        DB::transaction(function () use ($validated) {
            $stock = PharmacyStock::create($validated);

            // Record stock movement
            StockMovement::create([
                'drug_id' => $validated['drug_id'],
                'movement_type' => 'ADJUSTMENT',
                'quantity' => $validated['quantity'],
                'reference_no' => 'ADD-' . $stock->id,
                'user_id' => auth()->id(),
                'remarks' => 'Manual stock addition',
            ]);
        });

        return redirect()->back()->with('success', 'Stock item added successfully.');
    }

    /**
     * Update an existing stock item
     */
    public function update(Request $request, PharmacyStock $stock)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
            'min_level' => 'required|integer|min:0',
            'max_level' => 'required|integer|min:0',
            'batch_no' => 'nullable|string|max:50',
            'expiry_date' => 'nullable|date',
        ]);

        $oldQuantity = $stock->quantity;
        
        // Check if medicine is expired and quantity is being increased
        if ($stock->expiry_date && $stock->expiry_date < Carbon::now()) {
            if ($validated['quantity'] > $oldQuantity) {
                return redirect()->back()->withErrors([
                    'quantity' => 'Cannot increase quantity of expired medicine. Consider disposing of expired stock safely.'
                ]);
            }
        }
        
        // Check if medicine is expiring soon (within 30 days) and quantity is being significantly increased
        if ($stock->expiry_date && $stock->expiry_date < Carbon::now()->addDays(30)) {
            if ($validated['quantity'] > $oldQuantity * 1.5) { // More than 50% increase
                return redirect()->back()->withErrors([
                    'quantity' => 'Large quantity increase detected for medicine expiring soon. Please verify this is intentional.'
                ]);
            }
        }

        $validated['last_updated'] = Carbon::now();

        DB::transaction(function () use ($stock, $validated, $oldQuantity) {
            $stock->update($validated);

            // Record stock movement if quantity changed
            if ($oldQuantity != $validated['quantity']) {
                $quantityDiff = abs($validated['quantity'] - $oldQuantity);
                $expiryWarning = '';
                
                if ($stock->expiry_date && $stock->expiry_date < Carbon::now()) {
                    $expiryWarning = ' [EXPIRED STOCK]';
                } elseif ($stock->expiry_date && $stock->expiry_date < Carbon::now()->addDays(30)) {
                    $expiryWarning = ' [EXPIRING SOON]';
                }
                
                $remarks = $validated['quantity'] > $oldQuantity 
                    ? "Manual stock increase from {$oldQuantity} to {$validated['quantity']}{$expiryWarning}"
                    : "Manual stock decrease from {$oldQuantity} to {$validated['quantity']}{$expiryWarning}";

                StockMovement::create([
                    'drug_id' => $stock->drug_id,
                    'movement_type' => 'ADJUSTMENT',
                    'quantity' => $quantityDiff,
                    'reference_no' => 'UPDATE-' . $stock->id,
                    'user_id' => auth()->id(),
                    'remarks' => $remarks,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Stock item updated successfully.');
    }

    /**
     * Delete a stock item
     */
    public function destroy(PharmacyStock $stock)
    {
        DB::transaction(function () use ($stock) {
            // Record stock movement for deletion
            if ($stock->quantity > 0) {
                StockMovement::create([
                    'drug_id' => $stock->drug_id,
                    'movement_type' => 'ADJUSTMENT',
                    'quantity' => $stock->quantity,
                    'reference_no' => 'DELETE-' . $stock->id,
                    'user_id' => auth()->id(),
                    'remarks' => 'Stock item deleted - removing ' . $stock->quantity . ' units',
                ]);
            }

            $stock->delete();
        });

        return redirect()->back()->with('success', 'Stock item deleted successfully.');
    }

    /**
     * Get drugs for dropdown
     */
    public function getDrugs()
    {
        $drugs = \App\Models\Drug::select('id', 'generic_name', 'brand_name', 'strength', 'formulation')
            ->orderBy('generic_name')
            ->get();

        return response()->json($drugs);
    }

    /**
     * Get stores for dropdown
     */
    public function getStores()
    {
        $stores = \App\Models\PharmacyStore::select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($stores);
    }

    /**
     * GRN listing page
     */
    public function grnIndex()
    {
        $grns = GrnPurchase::with(['supplier', 'items'])
            ->latest()
            ->paginate(20);

        return Inertia::render('Pharmacist/GRN/Index', [
            'grns' => $grns,
        ]);
    }

    /**
     * Create new GRN page
     */
    public function grnCreate()
    {
        $suppliers = Supplier::select('id', 'name', 'contact_person', 'phone')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $drugs = \App\Models\Drug::select('id', 'generic_name', 'brand_name', 'strength', 'formulation')
            ->where('is_active', true)
            ->orderBy('generic_name')
            ->get();

        return Inertia::render('Pharmacist/GRN/Create', [
            'suppliers' => $suppliers,
            'drugs' => $drugs,
            'grnNumber' => 'GRN-' . date('Y') . '-' . str_pad(GrnPurchase::count() + 1, 4, '0', STR_PAD_LEFT),
        ]);
    }

    /**
     * Show GRN details
     */
    public function grnShow(GrnPurchase $grn)
    {
        $grn->load(['supplier', 'items.drug']);

        return Inertia::render('Pharmacist/GRN/Show', [
            'grn' => $grn,
        ]);
    }
}
