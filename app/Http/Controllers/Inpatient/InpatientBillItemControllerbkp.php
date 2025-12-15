<?php

namespace App\Http\Controllers\Inpatient;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\BillingAccount;
use App\Models\ServiceCatalogue;
use App\Models\Encounter;

class InpatientBillItemController extends Controller
{
    /**
     * Show the Inpatient Billing & Charges UI.
     */
    public function charges()
    {
        $bills = BillingAccount::with(['patient:id,first_name,last_name'])
            ->where('status', 'open')
            ->get();

        // Get all active services grouped by category
        $services = ServiceCatalogue::active()
            ->billable()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        \Log::info('Services loaded: ' . $services->count() . ' categories');
        \Log::info('Services data: ' . $services->toJson());

        return Inertia::render('Inpatient/BillingCharges', [
            'bills' => $bills,
            'services' => $services,
        ]);
    }

    /**
     * Add a new charge for a patient’s billing account.
     */
    public function addCharge($billingAccountId)
    {
        request()->validate([
            'description' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'quantity' => 'required|numeric|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $billingAccount = BillingAccount::findOrFail($billingAccountId);
        $amount = request('quantity') * request('unit_price');

        DB::table('billing_items')->insert([
            'billing_account_id' => $billingAccount->id,
            'encounter_id' => $billingAccount->encounter_id,
            'description' => request('description'),
            'item_type' => request('category'),
            'quantity' => request('quantity'),
            'unit_price' => request('unit_price'),
            'amount' => $amount,
            'status' => 'pending',
            'created_by' => auth()->id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('success', 'Charge added successfully.');
    }

    /**
     * API: Get all active inpatient encounters (patients) with their basic info
     */
    public function apiGetPatients()
    {
        try {
            // Get active inpatient encounters with current bed assignments
            $encounters = Encounter::with([
                'patient:id,first_name,last_name',
                'bedAssignments' => function($query) {
                    $query->with('bed:id,bed_number')->latest();
                },
                'billingAccount'
            ])
            ->where('type', 'IPD')
            ->where('status', 'ACTIVE')
            ->get();

            \Log::info('Found encounters: ' . $encounters->count());

            $patients = $encounters->map(function ($encounter) {
                // Get current bed assignment
                $currentBed = $encounter->bedAssignments->first();
                $bedNumber = $currentBed && $currentBed->bed ? $currentBed->bed->bed_number : 'N/A';

                // Use encounter ID as the billing ID for now
                $billingId = $encounter->billingAccount ? $encounter->billingAccount->id : $encounter->id;
                $totalAmount = $encounter->billingAccount ? $encounter->billingAccount->total_amount : 0;

                return [
                    'id' => $billingId,
                    'encounterId' => $encounter->id,
                    'patientId' => $encounter->patient_id,
                    'patientName' => $encounter->patient ? 
                        $encounter->patient->first_name . ' ' . $encounter->patient->last_name : 
                        'Unknown Patient',
                    'bedNumber' => $bedNumber,
                    'admissionDate' => $encounter->admission_datetime ? 
                        \Carbon\Carbon::parse($encounter->admission_datetime)->format('Y-m-d') : 
                        $encounter->created_at->format('Y-m-d'),
                    'items' => [],
                    'subtotal' => 0.0,
                    'tax' => 0.0,
                    'total' => (float) ($totalAmount ?? 0),
                    'status' => 'active'
                ];
            });

            \Log::info('Mapped patients: ' . $patients->count());

            return response()->json([
                'data' => $patients,
                'debug' => [
                    'encounter_count' => $encounters->count(),
                    'patient_count' => $patients->count()
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in apiGetPatients: ' . $e->getMessage());
            return response()->json([
                'data' => [],
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API: Get detailed billing items for a specific billing account
     */
    public function apiGetPatientDetails($billingAccountId)
    {
        // Try to find billing account, if not found, try to find encounter
        $billingAccount = BillingAccount::find($billingAccountId);
        
        if (!$billingAccount) {
            // If no billing account, try to find encounter and create billing account
            $encounter = Encounter::with('patient')->find($billingAccountId);
            if (!$encounter) {
                return response()->json(['error' => 'Patient not found'], 404);
            }
            
            // Create billing account for this encounter
            $billingAccount = BillingAccount::create([
                'account_no' => 'BA-' . str_pad($encounter->id, 6, '0', STR_PAD_LEFT),
                'patient_id' => $encounter->patient_id,
                'encounter_id' => $encounter->id,
                'status' => BillingAccount::STATUS_OPEN,
                'total_amount' => 0,
                'net_amount' => 0,
                'balance' => 0,
                'created_by' => auth()->id(),
            ]);
        }
        
        // Get billing items from the correct tables
        $items = collect();
        
        // Get encounter_id for bill_items table
        $encounterId = $billingAccount->encounter_id;
        
        // Get items from bill_items table (uses encounter_id)
        try {
            $billItems = DB::table('bill_items')
                ->where('encounter_id', $encounterId)
                ->get();
            $items = $items->merge($billItems);
        } catch (\Exception $e) {
            \Log::error('Error querying bill_items: ' . $e->getMessage());
        }
        
        // Get items from billing_items table (uses billing_account_id)
        try {
            $billingItems = DB::table('billing_items')
                ->where('billing_account_id', $billingAccountId)
                ->get();
            $items = $items->merge($billingItems);
        } catch (\Exception $e) {
            \Log::error('Error querying billing_items: ' . $e->getMessage());
        }

        $formattedItems = $items->map(function ($item) {
            $quantity = (float) ($item->quantity ?? 1);
            $unitPrice = (float) ($item->unit_price ?? $item->amount ?? 0);
            $total = (float) ($item->amount ?? ($quantity * $unitPrice));
            
            return [
                'id' => $item->id,
                'description' => $item->description,
                'category' => $item->item_type ?? $item->type ?? 'General',
                'quantity' => $quantity,
                'unitPrice' => $unitPrice,
                'total' => $total,
                'date' => isset($item->created_at) ? 
                    \Carbon\Carbon::parse($item->created_at)->format('Y-m-d') : 
                    now()->format('Y-m-d'),
                'addedBy' => 'Staff'
            ];
        });

        $subtotal = (float) $formattedItems->sum('total');
        $tax = (float) ($subtotal * 0.1); // 10% tax
        $total = (float) ($subtotal + $tax);

        // Update billing account totals
        $billingAccount->update([
            'total_amount' => $total,
            'net_amount' => $total,
            'balance' => $total - $billingAccount->amount_paid
        ]);

        return response()->json([
            'data' => [
                'items' => $formattedItems,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total
            ]
        ]);
    }

    /**
     * API: Add a new billing item
     */
    public function apiAddItem()
    {
        request()->validate([
            'encounter_id' => 'required|exists:billing_accounts,id',
            'description' => 'required|string|max:255',
            'item_type' => 'required|string|max:100',
            'quantity' => 'required|numeric|min:1',
            'unit_price' => 'required|numeric|min:0',
            'amount' => 'required|numeric|min:0',
        ]);

        $billingAccountId = request('encounter_id');
        $billingAccount = BillingAccount::findOrFail($billingAccountId);

        // Insert into billing_items table (the main one with billing_account_id)
        DB::table('billing_items')->insert([
            'billing_account_id' => $billingAccountId,
            'encounter_id' => $billingAccount->encounter_id,
            'description' => request('description'),
            'item_type' => request('item_type'),
            'quantity' => request('quantity'),
            'unit_price' => request('unit_price'),
            'amount' => request('amount'),
            'status' => 'posted',
            'created_by' => auth()->id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Recalculate billing account totals
        $billingAccount->recalculateTotals();

        return response()->json([
            'success' => true,
            'message' => 'Billing item added successfully'
        ]);
    }

    /**
     * API: Delete a billing item
     */
    public function apiDeleteItem($itemId)
    {
        try {
            // Find and delete the item from bill_items table
            $deleted = DB::table('bill_items')->where('id', $itemId)->delete();
            
            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Billing item not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Billing item removed successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting billing item: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove billing item'
            ], 500);
        }
    }

    /**
     * API: Update a billing item
     */
    public function apiUpdateItem($itemId)
    {
        try {
            request()->validate([
                'description' => 'required|string|max:255',
                'item_type' => 'required|string|max:100',
                'quantity' => 'required|numeric|min:1',
                'unit_price' => 'required|numeric|min:0',
                'amount' => 'required|numeric|min:0',
            ]);

            $updated = DB::table('bill_items')
                ->where('id', $itemId)
                ->update([
                    'description' => request('description'),
                    'item_type' => request('item_type'),
                    'quantity' => request('quantity'),
                    'unit_price' => request('unit_price'),
                    'amount' => request('amount'),
                    'updated_at' => now(),
                ]);

            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Billing item not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Billing item updated successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating billing item: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update billing item'
            ], 500);
        }
    }
}
