<?php

namespace App\Services;

use App\Models\BillingAccount;
use App\Models\BillingItem;
use App\Models\Encounter;
use App\Models\Patient;
use Illuminate\Support\Facades\DB;

class BillingService
{
    /**
     * Create or get billing account for an encounter
     */
    public function getOrCreateBillingAccount($encounterId, $patientId = null)
    {
        $encounter = Encounter::find($encounterId);
        if (!$encounter && $patientId) {
            // If encounter doesn't exist but we have patient ID, we might need to create it
            throw new \Exception("Encounter not found");
        }

        $patientId = $patientId ?? $encounter->patient_id;

        return BillingAccount::firstOrCreate([
            'encounter_id' => $encounterId
        ], [
            'account_no' => 'BA' . str_pad($encounterId, 6, '0', STR_PAD_LEFT),
            'patient_id' => $patientId,
            'status' => 'open',
            'total_amount' => 0,
            'amount_paid' => 0,
            'balance' => 0,
        ]);
    }

    /**
     * Add consultation charge automatically
     */
    public function addConsultationCharge($encounterId, $physicianId = null, $consultationType = 'general')
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);

        // Check if consultation already billed
        $existingConsultation = BillingItem::where('encounter_id', $encounterId)
            ->where('item_type', 'consultation')
            ->where('reference_type', 'consultation')
            ->first();

        if ($existingConsultation) {
            return $existingConsultation; // Already billed
        }

        // Consultation pricing in KES
        $consultationPrices = [
            'general' => 5000.00,
            'specialist' => 8000.00,
            'emergency' => 12000.00,
            'follow_up' => 3000.00,
        ];

        $unitPrice = $consultationPrices[$consultationType] ?? $consultationPrices['general'];
        
        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'consultation',
            'description' => ucfirst($consultationType) . ' Consultation',
            'quantity' => 1,
            'unit_price' => $unitPrice,
            'amount' => $unitPrice,
            'discount_amount' => 0,
            'net_amount' => $unitPrice,
            'service_code' => 'CONS_' . strtoupper($consultationType),
            'reference_type' => 'consultation',
            'reference_id' => $physicianId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);

        return $billingItem;
    }

    /**
     * Add bed charge automatically
     */
    public function addBedCharge($encounterId, $bedId, $days = 1, $bedType = 'general')
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);

        // Bed pricing in KES per day
        $bedPrices = [
            'general' => 3000.00,
            'private' => 6000.00,
            'icu' => 15000.00,
            'maternity' => 4000.00,
        ];

        $unitPrice = $bedPrices[$bedType] ?? $bedPrices['general'];
        $amount = $unitPrice * $days;

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'bed_charge',
            'description' => ucfirst($bedType) . ' Ward Bed - ' . $days . ' day(s)',
            'quantity' => $days,
            'unit_price' => $unitPrice,
            'amount' => $amount,
            'discount_amount' => 0,
            'net_amount' => $amount,
            'service_code' => 'BED_' . strtoupper($bedType),
            'reference_type' => 'bed_assignment',
            'reference_id' => $bedId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);

        return $billingItem;
    }

    /**
     * Add lab test charge automatically
     */
    public function addLabTestCharge($encounterId, $testId, $testName, $testPrice = null)
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);

        // Default lab test prices in KES
        $defaultLabPrices = [
            'Complete Blood Count' => 2500.00,
            'Blood Sugar' => 1500.00,
            'Liver Function Test' => 4500.00,
            'Kidney Function Test' => 4000.00,
            'Lipid Profile' => 3500.00,
            'Thyroid Function Test' => 5500.00,
            'Urine Analysis' => 1200.00,
            'Blood Culture' => 6000.00,
            'Malaria Test' => 800.00,
            'HIV Test' => 2000.00,
        ];

        $unitPrice = $testPrice ?? $defaultLabPrices[$testName] ?? 2000.00;

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'lab_test',
            'description' => $testName,
            'quantity' => 1,
            'unit_price' => $unitPrice,
            'amount' => $unitPrice,
            'discount_amount' => 0,
            'net_amount' => $unitPrice,
            'service_code' => 'LAB_' . $testId,
            'reference_type' => 'lab_test',
            'reference_id' => $testId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);

        return $billingItem;
    }

    /**
     * Add procedure charge automatically
     */
    public function addProcedureCharge($encounterId, $procedureId, $procedureName, $procedurePrice = null)
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);

        // Default procedure prices in KES
        $defaultProcedurePrices = [
            'X-Ray Chest' => 3500.00,
            'X-Ray Abdomen' => 4000.00,
            'CT Scan Head' => 25000.00,
            'CT Scan Chest' => 30000.00,
            'MRI Brain' => 45000.00,
            'Ultrasound Abdomen' => 6000.00,
            'ECG' => 2500.00,
            'Echocardiogram' => 12000.00,
            'Endoscopy' => 15000.00,
            'Colonoscopy' => 20000.00,
        ];

        $unitPrice = $procedurePrice ?? $defaultProcedurePrices[$procedureName] ?? 5000.00;

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'procedure',
            'description' => $procedureName,
            'quantity' => 1,
            'unit_price' => $unitPrice,
            'amount' => $unitPrice,
            'discount_amount' => 0,
            'net_amount' => $unitPrice,
            'service_code' => 'PROC_' . $procedureId,
            'reference_type' => 'procedure',
            'reference_id' => $procedureId,
            'status' => 'unpaid',
            'posted_at' => now(),
        ]);

        $this->updateBillingAccountTotals($billingAccount);

        return $billingItem;
    }

    /**
     * Add pharmacy/medication charge automatically
     */
    public function addMedicationCharge($encounterId, $medicationId, $medicationName, $quantity, $unitPrice)
    {
        $billingAccount = $this->getOrCreateBillingAccount($encounterId);

        $amount = $unitPrice * $quantity;

        $billingItem = BillingItem::create([
            'encounter_id' => $encounterId,
            'item_type' => 'pharmacy',
            'description' => $medicationName,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'amount' => $amount,
            'discount_amount' => 0,
            'net_amount' => $amount,
            'service_code' => 'PHARM_' . $medicationId,
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
     * Get billing summary for an encounter
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