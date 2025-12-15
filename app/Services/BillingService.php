<?php

namespace App\Services;

use App\Models\BillingAccount;
use App\Models\BillingItem;
use App\Models\Encounter;
use App\Models\ServiceCatalogue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BillingService
{
    /**
     * Create or get billing account for an encounter
     */
    public function getOrCreateBillingAccount($encounterId, $patientId = null)
    {
        // Try to find Encounter first
        $encounter = Encounter::find($encounterId);
        
        // If no Encounter found, try OpdAppointment
        if (!$encounter) {
            $opdAppointment = \App\Models\OpdAppointment::find($encounterId);
            if ($opdAppointment) {
                $patientId = $patientId ?? $opdAppointment->patient_id;
            } elseif (!$patientId) {
                throw new \Exception("Encounter or OPD Appointment not found");
            }
        } else {
            $patientId = $patientId ?? $encounter->patient_id;
        }

        return BillingAccount::firstOrCreate([
            'encounter_id' => $encounterId,
        ], [
            'account_no' => 'BA' . str_pad($encounterId, 6, '0', STR_PAD_LEFT),
            'patient_id' => $patientId,
            'status' => 'open',
            'total_amount' => 0,
            'amount_paid' => 0,
            'balance' => 0,
            'created_by'      => auth()->id() ?? 1,
        ]);
    }

    /**
     * Generic method to fetch a service dynamically by category and keyword
     */
    private function findService($category, $keyword)
    {
        return ServiceCatalogue::where('category', $category)
            ->where('is_active', 1)
            ->where('is_billable', 1)
            ->where(function ($query) use ($keyword) {
                $query->where('code', 'LIKE', "%{$keyword}%")
                      ->orWhere('name', 'LIKE', "%{$keyword}%")
                      ->orWhere('description', 'LIKE', "%{$keyword}%");
            })
            ->first();
    }

    /**
     * Add a consultation charge (fully dynamic)
     */

    public function addConsultationCharge($encounterId, $physicianId, $consultationType = 'OPD')
    {
        try {
            // 🩺 Step 1: Locate Encounter
            $encounter = \App\Models\Encounter::find($encounterId);
            if (!$encounter) {
                throw new \Exception("Encounter not found for ID: {$encounterId}");
            }

            $patientId = $encounter->patient_id;

            // 🧾 Step 2: Find or Create Billing Account (auto-generate account number)
            $account = \App\Models\BillingAccount::firstOrCreate(
                ['encounter_id' => $encounterId],
                [
                    'patient_id' => $patientId,
                    'account_no' => 'BA' . str_pad(random_int(1, 999999), 6, '0', STR_PAD_LEFT),
                    'status' => 'open',
                    'total_charges' => 0.00,
                    'total_payments' => 0.00,
                    'balance_due' => 0.00,
                ]
            );

            // 🧠 Step 3: Define flexible search map for consultation types
            $searchMap = [
                'OPD' => 'General Physician Consultation',
                'Specialist' => 'Specialist Consultation',
                'FollowUp' => 'Follow-up Consultation',
                'Emergency' => 'Emergency Consultation',
            ];
            $searchTerm = $searchMap[$consultationType] ?? 'Consultation';

            // 💊 Step 4: Smart service match based on confirmed SQL ordering
            $service = \App\Models\ServiceCatalogue::where('is_active', 1)
                ->where('is_billable', 1)
                ->where(function ($q) use ($searchTerm) {
                    $q->where('category', 'like', '%consultation%')
                      ->orWhere('name', 'like', "%{$searchTerm}%")
                      ->orWhere('name', 'like', '%consultation%');
                })
                ->orderByRaw("
                    CASE
                        WHEN name LIKE '%General Physician%' THEN 1
                        WHEN name LIKE '%General%' THEN 2
                        WHEN name LIKE '%Specialist%' THEN 3
                        WHEN name LIKE '%Emergency%' THEN 4
                        WHEN name LIKE '%Follow%' THEN 5
                        ELSE 6
                    END
                ")
                ->first();

            if (!$service) {
                throw new \Exception("No matching consultation service found for type '{$consultationType}'.");
            }

            $unitPrice = $service->unit_price ?? 0.00;
            $description = "{$consultationType} Consultation ({$service->name})";
            // 🩺 Step 4.9: Ensure reference_id is stored as physician code (alphanumeric)
            $referenceId = $physicianId; // e.g. 'PHY004'

            // 💵 Step 5: Create Billing Item
            $item = \App\Models\BillingItem::create([
                'encounter_id'   => $encounterId,
                'item_type'      => 'consultation',
                'item_id'        => $service->id,
                'description'    => $description,
                'quantity'       => 1,
                'unit_price'     => $unitPrice,
                'amount'         => $unitPrice,
                'net_amount'     => $unitPrice,
                'status'         => 'unpaid',
                'service_code'   => $service->code,
                'reference_type' => 'physician',
                'reference_id' => is_numeric($physicianId)
                    ? (string) $physicianId
                    : (\App\Models\Physician::where('physician_code', $physicianId)->exists()
                        ? $physicianId
                        : (string) $physicianId),

                'posted_at'      => now(),
            ]);


            // 💰 Step 6: Update Billing Account Totals (aligned with billing_accounts schema)
            $account->increment('total_amount', $unitPrice);

            // Recalculate derived totals
            $account->net_amount = $account->total_amount - ($account->discount_amount ?? 0);
            $account->balance = $account->net_amount - ($account->amount_paid ?? 0);
            $account->save();


            // 🪶 Step 7: Logging Trace
            \Log::info('✅ Consultation charge posted successfully', [
                'encounter_id'       => $encounterId,
                'billing_account_id' => $account->id,
                'billing_item_id'    => $item->id,
                'service'            => $service->name,
                'consultation_type'  => $consultationType,
                'amount'             => $unitPrice,
                'balance_due'        => $account->balance_due,
            ]);

            return $item;

        } catch (\Throwable $e) {
            \Log::error('❌ Consultation charge posting failed', [
                'encounter_id' => $encounterId,
                'consultation_type' => $consultationType,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }


    /**
     * Add bed charge dynamically
     */
    public function addBedCharge($encounterId, $bedId, $days = 1, $bedType = 'general')
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);
        $service = $this->findService('bed_charge', $bedType);

        if (!$service) {
            Log::warning("No bed charge found for type '{$bedType}'");
            return;
        }

        $amount = $service->unit_price * $days;

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'bed_charge',
            'description' => "{$service->name} ({$days} day(s))",
            'quantity' => $days,
            'unit_price' => $service->unit_price,
            'amount' => $amount,
            'discount_amount' => 0,
            'net_amount' => $amount,
            'service_code' => $service->code,
            'reference_type' => 'bed_assignment',
            'reference_id' => $bedId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);
        return $billingItem;
    }

    /**
     * Add lab test charge dynamically
     */
    public function addLabTestCharge($encounterId, $testId, $testName)
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);
        $service = $this->findService('lab_test', $testName);

        if (!$service) {
            Log::warning("No lab test found for '{$testName}'");
            return;
        }

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'lab_test',
            'description' => $service->name,
            'quantity' => 1,
            'unit_price' => $service->unit_price,
            'amount' => $service->unit_price,
            'discount_amount' => 0,
            'net_amount' => $service->unit_price,
            'service_code' => $service->code,
            'reference_type' => 'lab_test',
            'reference_id' => $testId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);
        return $billingItem;
    }

    /**
     * Add procedure charge dynamically
     */
    public function addProcedureCharge($encounterId, $procedureId, $procedureName)
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);
        $service = $this->findService('procedure', $procedureName);

        if (!$service) {
            Log::warning("No procedure found for '{$procedureName}'");
            return;
        }

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'procedure',
            'description' => $service->name,
            'quantity' => 1,
            'unit_price' => $service->unit_price,
            'amount' => $service->unit_price,
            'discount_amount' => 0,
            'net_amount' => $service->unit_price,
            'service_code' => $service->code,
            'reference_type' => 'procedure',
            'reference_id' => $procedureId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);
        return $billingItem;
    }

    /**
     * Add medication charge dynamically
     */
    public function addMedicationCharge($encounterId, $medicationId, $medicationName, $quantity = 1)
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);
        $service = $this->findService('medication', $medicationName);

        if (!$service) {
            Log::warning("No medication found for '{$medicationName}'");
            return;
        }

        $amount = $service->unit_price * $quantity;

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'pharmacy',
            'description' => $service->name,
            'quantity' => $quantity,
            'unit_price' => $service->unit_price,
            'amount' => $amount,
            'discount_amount' => 0,
            'net_amount' => $amount,
            'service_code' => $service->code,
            'reference_type' => 'medication',
            'reference_id' => $medicationId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);
        return $billingItem;
    }

    /**
     * Update billing account totals
     */
    private function updateBillingAccountTotals($billingAccount)
    {
        $totalAmount = BillingItem::where('encounter_id', $billingAccount->encounter_id)
            ->where('status', '!=', 'cancelled')
            ->sum('net_amount');

        $billingAccount->update([
            'total_amount' => $totalAmount,
            'balance' => $totalAmount - $billingAccount->amount_paid,
        ]);
    }

    /**
     * Get billing summary
     */
    public function getBillingSummary($encounterId)
    {
        $billingAccount = BillingAccount::where('encounter_id', $encounterId)->first();

        if (!$billingAccount) {
            return [
                'account_exists' => false,
                'total_amount' => 0,
                'amount_paid' => 0,
                'balance' => 0,
                'items_count' => 0,
            ];
        }

        $itemsCount = BillingItem::where('encounter_id', $encounterId)
            ->where('status', '!=', 'cancelled')
            ->count();

        return [
            'account_exists' => true,
            'account_no' => $billingAccount->account_no,
            'total_amount' => $billingAccount->total_amount,
            'amount_paid' => $billingAccount->amount_paid,
            'balance' => $billingAccount->balance,
            'status' => $billingAccount->status,
            'items_count' => $itemsCount,
        ];
    }
}
