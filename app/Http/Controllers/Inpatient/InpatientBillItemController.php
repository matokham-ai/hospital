<?php

namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\BillingAccount;
use App\Models\ServiceCatalogue;
use App\Models\Encounter;

class InpatientBillItemController extends Controller
{
    /**
     * Display the Inpatient Billing & Charges UI
     */
    public function charges()
    {
        $bills = BillingAccount::with(['patient:id,first_name,last_name'])
            ->where('status', 'open')
            ->latest()
            ->get();

        $services = ServiceCatalogue::active()
            ->billable()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return Inertia::render('Inpatient/BillingCharges', [
            'bills' => $bills,
            'services' => $services,
        ]);
    }

    /**
     * Manually add a charge to a billing account
     */
    public function addCharge(Request $request, $billingAccountId)
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'item_type'   => 'required|string|max:100',
            'quantity'    => 'required|numeric|min:1',
            'unit_price'  => 'required|numeric|min:0',
        ]);

        $billingAccount = BillingAccount::findOrFail($billingAccountId);
        $amount = $validated['quantity'] * $validated['unit_price'];

        DB::table('billing_items')->insert([
            'billing_account_id' => $billingAccount->id,
            'encounter_id'       => $billingAccount->encounter_id,
            'description'        => $validated['description'],
            'item_type'          => $validated['item_type'],
            'quantity'           => $validated['quantity'],
            'unit_price'         => $validated['unit_price'],
            'amount'             => $amount,
            'status'             => 'unpaid',
            'created_by'         => auth()->id(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $billingAccount->recalculateTotals();

        return back()->with('success', 'Charge added successfully.');
    }

    /**
     * API: Get all active inpatient encounters (patients) with billing summary
     */
    public function apiGetPatients()
    {
        try {
            $encounters = Encounter::with([
                'patient:id,first_name,last_name',
                'bedAssignments.bed:id,bed_number',
                'billingAccount'
            ])
                ->where('type', 'IPD')
                ->where('status', 'ACTIVE')
                ->get();

            $patients = $encounters->map(function ($encounter) {
                $bed = $encounter->bedAssignments->first()?->bed;
                $billingAccount = $encounter->billingAccount 
                    ?? BillingAccount::firstOrCreate([
                        'encounter_id' => $encounter->id,
                    ], [
                        'account_no'   => 'BA-' . str_pad($encounter->id, 6, '0', STR_PAD_LEFT),
                        'patient_id'   => $encounter->patient_id,
                        'status'       => 'open',
                        'total_amount' => 0,
                        'balance'      => 0,
                        'created_by'   => auth()->id(),
                    ]);

                return [
                    'id'            => $billingAccount->id,
                    'encounterId'   => $encounter->id,
                    'patientId'     => $encounter->patient_id,
                    'patientName'   => $encounter->patient
                        ? $encounter->patient->first_name . ' ' . $encounter->patient->last_name
                        : 'Unknown Patient',
                    'bedNumber'     => $bed?->bed_number ?? 'N/A',
                    'admissionDate' => optional($encounter->admission_datetime)
                        ->format('Y-m-d'),
                    'total'         => (float) $billingAccount->total_amount,
                    'status'        => 'active',
                ];
            });

            return response()->json(['data' => $patients]);

        } catch (\Exception $e) {
            \Log::error('Error fetching inpatient patients: ' . $e->getMessage());
            return response()->json(['data' => [], 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * API: Get all billing items for a billing account
     */
    public function apiGetPatientDetails($billingAccountId)
    {
        $billingAccount = BillingAccount::with('patient')->find($billingAccountId);

        if (!$billingAccount) {
            return response()->json(['error' => 'Billing account not found'], 404);
        }

        $items = DB::table('billing_items')
            ->where('billing_account_id', $billingAccountId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) {
                $quantity   = (float) ($item->quantity ?? 1);
                $unitPrice  = (float) ($item->unit_price ?? 0);
                $total      = (float) ($item->amount ?? $quantity * $unitPrice);

                return [
                    'id'          => $item->id,
                    'description' => $item->description,
                    'category'    => $item->item_type ?? 'General',
                    'quantity'    => $quantity,
                    'unitPrice'   => $unitPrice,
                    'total'       => $total,
                    'date'        => \Carbon\Carbon::parse($item->created_at)->format('Y-m-d'),
                    'status'      => $item->status,
                    'addedBy'     => 'Staff',
                ];
            });

        $subtotal = (float) $items->sum('total');
        $tax      = (float) ($subtotal * 0.1);
        $total    = $subtotal + $tax;

        $billingAccount->update([
            'total_amount' => $total,
            'net_amount'   => $total,
            'balance'      => $total - $billingAccount->amount_paid,
        ]);

        return response()->json([
            'data' => [
                'items'     => $items,
                'subtotal'  => $subtotal,
                'tax'       => $tax,
                'total'     => $total,
            ],
        ]);
    }

    /**
     * API: Add a billing item programmatically (used by front-end)
     */
    public function apiAddItem(Request $request)
    {
        $validated = $request->validate([
            'billing_account_id' => 'required|exists:billing_accounts,id',
            'description'        => 'required|string|max:255',
            'item_type'          => 'required|string|max:100',
            'quantity'           => 'required|numeric|min:1',
            'unit_price'         => 'required|numeric|min:0',
        ]);

        $billingAccount = BillingAccount::findOrFail($validated['billing_account_id']);
        $amount = $validated['quantity'] * $validated['unit_price'];

        DB::table('billing_items')->insert([
            'billing_account_id' => $billingAccount->id,
            'encounter_id'       => $billingAccount->encounter_id,
            'description'        => $validated['description'],
            'item_type'          => $validated['item_type'],
            'quantity'           => $validated['quantity'],
            'unit_price'         => $validated['unit_price'],
            'amount'             => $amount,
            'status'             => 'unpaid',
            'created_by'         => auth()->id(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $billingAccount->recalculateTotals();

        return response()->json(['success' => true, 'message' => 'Billing item added successfully']);
    }

    /**
     * API: Update an existing billing item
     */
    public function apiUpdateItem(Request $request, $itemId)
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'item_type'   => 'required|string|max:100',
            'quantity'    => 'required|numeric|min:1',
            'unit_price'  => 'required|numeric|min:0',
        ]);

        $item = DB::table('billing_items')->where('id', $itemId)->first();
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        $amount = $validated['quantity'] * $validated['unit_price'];

        DB::table('billing_items')->where('id', $itemId)->update([
            'description' => $validated['description'],
            'item_type'   => $validated['item_type'],
            'quantity'    => $validated['quantity'],
            'unit_price'  => $validated['unit_price'],
            'amount'      => $amount,
            'updated_at'  => now(),
        ]);

        $billingAccount = BillingAccount::find($item->billing_account_id);
        if ($billingAccount) {
            $billingAccount->recalculateTotals();
        }

        return response()->json(['success' => true, 'message' => 'Item updated successfully']);
    }

    /**
     * API: Delete a billing item
     */
    public function apiDeleteItem($itemId)
    {
        $item = DB::table('billing_items')->where('id', $itemId)->first();
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Item not found'], 404);
        }

        DB::table('billing_items')->where('id', $itemId)->delete();

        $billingAccount = BillingAccount::find($item->billing_account_id);
        if ($billingAccount) {
            $billingAccount->recalculateTotals();
        }

        return response()->json(['success' => true, 'message' => 'Billing item removed successfully']);
    }
}
