<?php

namespace App\Http\Controllers;

use App\Models\BillingAccount;
use App\Models\BillingItem;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Drug;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BillingController extends Controller
{
    /**
     * Show patient billing management interface
     */
    public function index()
    {
        $billingAccounts = BillingAccount::with(['patient'])
            ->orderByDesc('created_at')
            ->get();

        $patients = \App\Models\Patient::select('id', 'first_name', 'last_name', 'phone', 'email', 'date_of_birth')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('Billing/PatientBilling', [
            'billingAccounts' => $billingAccounts,
            'patients' => $patients,
        ]);
    }

    /**
     * Create new billing account for patient
     */
    public function createAccount(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
        ]);

        // Create a new encounter (you might want to integrate with your encounter system)
        $encounterId = time(); // Temporary - replace with actual encounter creation

        $billingAccount = BillingAccount::create([
            'patient_id' => $validated['patient_id'],
            'encounter_id' => $encounterId,
            'account_no' => 'BA' . str_pad($encounterId, 6, '0', STR_PAD_LEFT),
            'status' => 'open',
            'total_amount' => 0,
            'amount_paid' => 0,
            'balance' => 0,
        ]);

        return redirect()->route('billing.show', ['encounter' => $encounterId])
                        ->with('success', 'New billing account created successfully.');
    }

    /**
     * Generate bill for prescription
     */
    public function generatePrescriptionBill($prescriptionId)
    {
        $prescription = Prescription::with(['items.drug', 'patient', 'physician'])->findOrFail($prescriptionId);
        
        // Check if prescription is verified
        if ($prescription->status !== 'verified') {
            return redirect()->back()->with('error', 'Prescription must be verified before billing.');
        }

        DB::transaction(function () use ($prescription) {
            // Create or get billing account for this encounter (match by encounter_id only to avoid duplicates)
            $billingAccount = BillingAccount::firstOrCreate([
                'encounter_id' => $prescription->encounter_id,
            ], [
                'account_no' => 'BA' . str_pad($prescription->encounter_id, 6, '0', STR_PAD_LEFT),
                'patient_id' => $prescription->patient_id,
                'status' => 'open',
                'total_amount' => 0,
                'amount_paid' => 0,
                'balance' => 0,
            ]);

            // Check if this prescription already has billing items
            $existingBillingItem = BillingItem::where('encounter_id', $prescription->encounter_id)
                ->where('reference_type', 'prescription')
                ->where('reference_id', $prescription->id)
                ->first();

            if ($existingBillingItem) {
                \Log::info('💰 Prescription billing already exists', [
                    'prescription_id' => $prescription->id,
                    'existing_billing_item_id' => $existingBillingItem->id
                ]);
                return; // Don't create duplicate billing
            }

            // Handle two types of prescriptions:
            // 1. Prescriptions with items (PrescriptionItem models)
            // 2. Single prescription records (created by OpdController)
            
            if ($prescription->items && $prescription->items->count() > 0) {
                // Type 1: Prescription with items
                foreach ($prescription->items as $item) {
                    $unitPrice = $this->getDrugPrice($item->drug);
                    $amount = $unitPrice * $item->quantity;

                    BillingItem::create([
                        'encounter_id' => $prescription->encounter_id,
                        'item_type' => 'pharmacy',
                        'description' => $item->drug->generic_name . 
                                       ($item->drug->brand_name ? " ({$item->drug->brand_name})" : '') . 
                                       " {$item->drug->strength} - {$item->dose} {$item->frequency}",
                        'quantity' => $item->quantity,
                        'unit_price' => $unitPrice,
                        'amount' => $amount,
                        'discount_amount' => 0,
                        'net_amount' => $amount,
                        'service_code' => 'PHARM_' . $item->drug->id,
                        'reference_type' => 'prescription_item',
                        'reference_id' => $item->id,
                        'status' => 'unpaid',
                        'posted_at' => now(),
                    ]);
                }
            } else {
                // Type 2: Single prescription record (OpdController style)
                // Try to find a matching service in the service catalogue
                $service = $this->findMedicationService($prescription->drug_name ?? 'General Prescription');
                
                // If no specific service found, use or create generic prescription service
                if (!$service) {
                    $service = $this->getOrCreateGenericPrescriptionService();
                }

                // Calculate pricing - ensure numeric values
                \Log::info('🔢 Prescription quantity debug', [
                    'prescription_id' => $prescription->id,
                    'raw_quantity' => $prescription->quantity,
                    'quantity_type' => gettype($prescription->quantity),
                    'is_numeric' => is_numeric($prescription->quantity),
                    'drug_name' => $prescription->drug_name
                ]);
                
                // Handle quantity more carefully - it might be stored as string
                $rawQuantity = $prescription->quantity;
                if (is_string($rawQuantity)) {
                    $rawQuantity = trim($rawQuantity);
                }
                $quantity = is_numeric($rawQuantity) ? (int) $rawQuantity : 1;
                $quantity = max(1, $quantity); // Ensure at least 1
                
                $unitPrice = $service ? (float) $service->unit_price : 50.00; // Default KES 50
                $amount = $unitPrice * $quantity;
                
                \Log::info('💊 Billing calculation', [
                    'prescription_id' => $prescription->id,
                    'final_quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_amount' => $amount
                ]);

                BillingItem::create([
                    'encounter_id' => $prescription->encounter_id,
                    'item_type' => 'pharmacy',
                    'description' => ($prescription->drug_name ?? 'Prescription Medication') . 
                                   ($prescription->dosage ? " - {$prescription->dosage}" : '') . 
                                   ($prescription->frequency ? " {$prescription->frequency}" : '') .
                                   ($prescription->duration ? " for {$prescription->duration} days" : ''),
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'amount' => $amount,
                    'discount_amount' => 0,
                    'net_amount' => $amount,
                    'service_code' => $service ? $service->code : 'PHARM_PRESCRIPTION',
                    'reference_type' => 'prescription',
                    'reference_id' => $prescription->id,
                    'status' => 'unpaid',
                    'posted_at' => now(),
                ]);

                \Log::info('💊 Single prescription billing created', [
                    'prescription_id' => $prescription->id,
                    'drug_name' => $prescription->drug_name,
                    'amount' => $amount,
                    'service_code' => $service ? $service->code : 'PHARM_PRESCRIPTION'
                ]);
            }

            // Update billing account totals
            $this->updateBillingAccountTotals($billingAccount);
        });

        // Refresh the billing account to get updated totals and fix any balance issues
        $billingAccount = BillingAccount::where('encounter_id', $prescription->encounter_id)->first();
        
        // Force recalculation of totals to fix any inconsistencies
        if ($billingAccount) {
            $this->updateBillingAccountTotals($billingAccount);
            $billingAccount->refresh();
        }
        
        \Log::info('🔄 Redirecting to billing page', [
            'prescription_id' => $prescription->id,
            'encounter_id' => $prescription->encounter_id,
            'updated_total_amount' => $billingAccount->total_amount,
            'updated_balance' => $billingAccount->balance,
            'redirect_url' => route('billing.show', ['encounter' => $prescription->encounter_id])
        ]);

        // Clean up any duplicate billing accounts for this encounter
        $this->cleanupDuplicateBillingAccounts($prescription->encounter_id);
        
        // Fix any existing billing items with incorrect quantities
        $this->fixBillingItemQuantities($prescription->encounter_id);

        return redirect()->route('billing.show', ['encounter' => $prescription->encounter_id])
                        ->with('success', 'Prescription bill generated successfully.');
    }

    /**
     * Show billing account details
     */
    public function show($encounterId)
    {
        // Clean up any duplicates first
        $this->cleanupDuplicateBillingAccounts($encounterId);
        
        $billingAccount = BillingAccount::with(['items' => function($query) {
            $query->where('status', '!=', 'cancelled')->orderBy('created_at', 'desc');
        }])->where('encounter_id', $encounterId)->firstOrFail();
        
        // Ensure totals are correct
        $this->updateBillingAccountTotals($billingAccount);
        $billingAccount->refresh();

        // Debug: Log what we're finding
        \Log::info('🔍 Billing Account Debug', [
            'encounter_id' => $encounterId,
            'billing_account_id' => $billingAccount->id,
            'items_count' => $billingAccount->items->count(),
            'items' => $billingAccount->items->map(function($item) {
                return [
                    'id' => $item->id,
                    'item_type' => $item->item_type,
                    'description' => $item->description,
                    'status' => $item->status,
                    'encounter_id' => $item->encounter_id,
                ];
            })
        ]);

        // Also check all billing items for this encounter (regardless of relationship)
        $allItemsForEncounter = BillingItem::where('encounter_id', $encounterId)
            ->where('status', '!=', 'cancelled')
            ->get();
        
        \Log::info('📋 All Billing Items for Encounter', [
            'encounter_id' => $encounterId,
            'total_items' => $allItemsForEncounter->count(),
            'items' => $allItemsForEncounter->map(function($item) {
                return [
                    'id' => $item->id,
                    'item_type' => $item->item_type,
                    'description' => $item->description,
                    'status' => $item->status,
                ];
            })
        ]);

        // Get service catalogue data grouped by category
        $serviceCatalogue = \App\Models\ServiceCatalogue::active()
            ->billable()
            ->select('id', 'code', 'name', 'category', 'unit_price', 'description', 'unit_of_measure')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');

        return Inertia::render('Billing/BillingDetails', [
            'billingAccount' => $billingAccount,
            'serviceCatalogue' => $serviceCatalogue,
        ]);
    }

    /**
     * Add individual billing item
     */
    public function addItem(Request $request, $encounterId)
    {
        $validated = $request->validate([
            'item_type' => 'required|in:consultation,lab_test,imaging,procedure,medication,consumable,bed_charge,nursing,other',
            'description' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'service_code' => 'nullable|string|max:50',
            'reference_type' => 'nullable|string|max:100',
            'reference_id' => 'nullable|integer',
        ]);

        // Get or create billing account for this encounter
        $billingAccount = BillingAccount::firstOrCreate([
            'encounter_id' => $encounterId
        ], [
            'account_no' => 'BA' . str_pad($encounterId, 6, '0', STR_PAD_LEFT),
            'patient_id' => 'P' . str_pad($encounterId, 3, '0', STR_PAD_LEFT), // You may want to get actual patient_id
            'status' => 'open',
            'total_amount' => 0,
            'amount_paid' => 0,
            'balance' => 0,
        ]);

        $amount = $validated['quantity'] * $validated['unit_price'];
        $discountAmount = $validated['discount_amount'] ?? 0;
        $netAmount = $amount - $discountAmount;

        BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => $validated['item_type'],
            'description' => $validated['description'],
            'quantity' => $validated['quantity'],
            'unit_price' => $validated['unit_price'],
            'amount' => $amount,
            'discount_amount' => $discountAmount,
            'net_amount' => $netAmount,
            'service_code' => $validated['service_code'] ?? null,
            'reference_type' => $validated['reference_type'] ?? null,
            'reference_id' => $validated['reference_id'] ?? null,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);

        return redirect()->back()->with('success', 'Billing item added successfully.');
    }

    /**
     * Process payment
     */
    public function processPayment(Request $request, $billingAccountId)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
        ]);

        $billingAccount = BillingAccount::findOrFail($billingAccountId);
        
        $billingAccount->amount_paid += $validated['amount'];
        $billingAccount->balance = $billingAccount->total_amount - $billingAccount->amount_paid;
        
        if ($billingAccount->balance <= 0) {
            $billingAccount->status = 'closed';
        }
        
        $billingAccount->save();

        return redirect()->back()->with('success', 'Payment processed successfully.');
    }

    /**
     * Get drug price in KES (you can implement your pricing logic here)
     */
    private function getDrugPrice($drug)
    {
        // Kenyan Shilling pricing logic - you can enhance this
        $basePrices = [
            'Paracetamol' => 250.00,    // KES 250 per unit
            'Amoxicillin' => 1500.00,   // KES 1,500 per unit
            'Ibuprofen' => 375.00,      // KES 375 per unit
        ];

        return $basePrices[$drug->generic_name] ?? 1000.00; // Default price KES 1,000
    }

    /**
     * Find matching medication service in service catalogue
     */
    private function findMedicationService($drugName)
    {
        // First try to find exact or partial match in medication services
        return \App\Models\ServiceCatalogue::where('category', 'medication')
            ->where('is_active', true)
            ->where('is_billable', true)
            ->where(function($query) use ($drugName) {
                $query->where('name', 'LIKE', "%{$drugName}%")
                      ->orWhere('description', 'LIKE', "%{$drugName}%");
            })
            ->first();
    }

    /**
     * Get or create generic prescription service
     */
    private function getOrCreateGenericPrescriptionService()
    {
        return \App\Models\ServiceCatalogue::firstOrCreate([
            'code' => 'MED999',
            'category' => 'medication'
        ], [
            'name' => 'General Prescription Medication',
            'description' => 'General prescription medication billing',
            'unit_price' => 50.00,
            'unit_of_measure' => 'item',
            'is_active' => true,
            'is_billable' => true,
        ]);
    }

    /**
     * Update billing account totals
     */
    private function updateBillingAccountTotals($billingAccount)
    {
        // Use direct query to ensure we get the latest data, not cached relationship
        $totalAmount = BillingItem::where('encounter_id', $billingAccount->encounter_id)
                                    ->where('status', '!=', 'cancelled')
                                    ->sum('net_amount');
        
        // Refresh the amount_paid from database to ensure accuracy
        $billingAccount->refresh();
        $balance = $totalAmount - $billingAccount->amount_paid;
        
        $billingAccount->update([
            'total_amount' => $totalAmount,
            'balance' => $balance,
        ]);

        \Log::info('💰 Billing account totals updated', [
            'billing_account_id' => $billingAccount->id,
            'encounter_id' => $billingAccount->encounter_id,
            'total_amount' => $totalAmount,
            'amount_paid' => $billingAccount->amount_paid,
            'new_balance' => $balance,
        ]);
    }

    /**
     * Clean up duplicate billing accounts for an encounter
     */
    private function cleanupDuplicateBillingAccounts($encounterId)
    {
        $billingAccounts = BillingAccount::where('encounter_id', $encounterId)->get();
        
        if ($billingAccounts->count() > 1) {
            \Log::info('🧹 Cleaning up duplicate billing accounts', [
                'encounter_id' => $encounterId,
                'duplicate_count' => $billingAccounts->count()
            ]);
            
            // Keep the most recent one and delete others
            $keepAccount = $billingAccounts->sortByDesc('updated_at')->first();
            $duplicates = $billingAccounts->where('id', '!=', $keepAccount->id);
            
            foreach ($duplicates as $duplicate) {
                \Log::info('🗑️ Deleting duplicate billing account', [
                    'deleted_account_id' => $duplicate->id,
                    'kept_account_id' => $keepAccount->id
                ]);
                $duplicate->delete();
            }
            
            // Update the kept account with correct totals
            $this->updateBillingAccountTotals($keepAccount);
        }
    }

    /**
     * Fix billing items with incorrect quantities by checking the original prescription
     */
    private function fixBillingItemQuantities($encounterId)
    {
        $billingItems = BillingItem::where('encounter_id', $encounterId)
            ->where('item_type', 'pharmacy')
            ->where('reference_type', 'prescription')
            ->get();

        foreach ($billingItems as $item) {
            $prescription = \App\Models\Prescription::find($item->reference_id);
            if ($prescription && $prescription->quantity) {
                $correctQuantity = is_numeric($prescription->quantity) ? (int) $prescription->quantity : 1;
                $correctQuantity = max(1, $correctQuantity);
                
                if ($item->quantity != $correctQuantity) {
                    $newAmount = $item->unit_price * $correctQuantity;
                    
                    \Log::info('🔧 Fixing billing item quantity', [
                        'billing_item_id' => $item->id,
                        'prescription_id' => $prescription->id,
                        'old_quantity' => $item->quantity,
                        'new_quantity' => $correctQuantity,
                        'old_amount' => $item->amount,
                        'new_amount' => $newAmount
                    ]);
                    
                    $item->update([
                        'quantity' => $correctQuantity,
                        'amount' => $newAmount,
                        'net_amount' => $newAmount,
                    ]);
                }
            }
        }
    }
}