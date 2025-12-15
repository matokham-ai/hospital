<?php

namespace App\Services;

use App\Models\Prescription;
use App\Models\DrugFormulary;
use App\Models\Patient;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PrescriptionService
{
    /**
     * Create a new prescription with validation
     * 
     * @param array $data
     * @return Prescription
     * @throws ValidationException
     */
    public function createPrescription(array $data): Prescription
    {
        // Validate required fields
        $this->validatePrescriptionFields($data);
        
        // Check allergies if drug_id is provided
        if (isset($data['drug_id']) && isset($data['patient_id'])) {
            if ($this->checkAllergies($data['patient_id'], $data['drug_id'])) {
                throw ValidationException::withMessages([
                    'drug_id' => ['Patient is allergic to this medication. Prescription blocked.']
                ]);
            }
        }
        
        // Check drug interactions if drug_id is provided
        if (isset($data['drug_id']) && isset($data['patient_id'])) {
            $interactions = $this->checkDrugInteractions($data['patient_id'], $data['drug_id']);
            if (!empty($interactions)) {
                // Store interactions as warnings but don't block
                $data['prescription_data'] = array_merge(
                    $data['prescription_data'] ?? [],
                    ['drug_interactions' => $interactions]
                );
            }
        }
        
        // Validate instant dispensing if requested
        if (isset($data['instant_dispensing']) && $data['instant_dispensing']) {
            if (!isset($data['drug_id']) || !isset($data['quantity'])) {
                throw ValidationException::withMessages([
                    'instant_dispensing' => ['Drug ID and quantity are required for instant dispensing.']
                ]);
            }
            
            if (!$this->validateInstantDispensing($data['drug_id'], $data['quantity'])) {
                throw ValidationException::withMessages([
                    'instant_dispensing' => ['Insufficient stock for instant dispensing.']
                ]);
            }
        }
        
        DB::beginTransaction();
        try {
            // Create the prescription
            $prescription = Prescription::create($data);
            
            // Reserve stock if instant dispensing
            if ($prescription->instant_dispensing) {
                $this->reserveStock($prescription);
            }
            
            DB::commit();
            return $prescription;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Validate that all required prescription fields are provided
     * 
     * @param array $data
     * @throws ValidationException
     */
    protected function validatePrescriptionFields(array $data): void
    {
        $requiredFields = ['dosage', 'frequency', 'duration', 'quantity'];
        $missingFields = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missingFields[] = $field;
            }
        }
        
        if (!empty($missingFields)) {
            throw ValidationException::withMessages([
                'validation' => ['Required fields missing: ' . implode(', ', $missingFields)]
            ]);
        }
    }
    
    /**
     * Validate that sufficient stock exists for instant dispensing
     * 
     * @param int $drugId
     * @param int $quantity
     * @return bool
     */
    public function validateInstantDispensing(int $drugId, int $quantity): bool
    {
        $drug = DrugFormulary::find($drugId);
        
        if (!$drug) {
            return false;
        }
        
        return $drug->stock_quantity >= $quantity;
    }
    
    /**
     * Reserve stock for instant dispensing
     * 
     * @param Prescription $prescription
     * @return void
     * @throws \Exception
     */
    public function reserveStock(Prescription $prescription): void
    {
        if (!$prescription->drugFormulary) {
            throw new \Exception('Drug formulary not found for prescription.');
        }
        
        $drug = $prescription->drugFormulary;
        
        // Check stock availability again
        if ($drug->stock_quantity < $prescription->quantity) {
            throw new \Exception('Insufficient stock to reserve.');
        }
        
        // Reduce stock quantity
        $drug->decrement('stock_quantity', $prescription->quantity);
        
        // Mark prescription as having reserved stock
        $prescription->stock_reserved = true;
        $prescription->stock_reserved_at = now();
        $prescription->save();
        
        // Create stock movement record for audit trail
        StockMovement::create([
            'drug_id' => $drug->id,
            'movement_type' => 'RESERVATION',
            'quantity' => $prescription->quantity,
            'reference_no' => 'PRESCRIPTION-' . $prescription->id,
            'user_id' => auth()->id(),
            'remarks' => 'Stock reserved for instant dispensing prescription #' . $prescription->id,
        ]);
    }
    
    /**
     * Release reserved stock
     * 
     * @param Prescription $prescription
     * @return void
     */
    public function releaseStock(Prescription $prescription): void
    {
        if (!$prescription->stock_reserved) {
            return;
        }
        
        if (!$prescription->drugFormulary) {
            return;
        }
        
        $drug = $prescription->drugFormulary;
        
        // Return stock quantity
        $drug->increment('stock_quantity', $prescription->quantity);
        
        // Mark prescription as not having reserved stock
        $prescription->stock_reserved = false;
        $prescription->stock_reserved_at = null;
        $prescription->save();
        
        // Create stock movement record for audit trail
        StockMovement::create([
            'drug_id' => $drug->id,
            'movement_type' => 'RETURN',
            'quantity' => $prescription->quantity,
            'reference_no' => 'PRESCRIPTION-' . $prescription->id,
            'user_id' => auth()->id(),
            'remarks' => 'Stock released from prescription #' . $prescription->id,
        ]);
    }
    
    /**
     * Check for drug interactions with patient's existing medications
     * 
     * @param string $patientId
     * @param int $drugId
     * @return array Array of interaction warnings
     */
    public function checkDrugInteractions(string $patientId, int $drugId): array
    {
        $interactions = [];
        
        // Get the drug being prescribed
        $newDrug = DrugFormulary::find($drugId);
        if (!$newDrug) {
            return $interactions;
        }
        
        // Get patient's active prescriptions
        $activePrescriptions = Prescription::where('patient_id', $patientId)
            ->whereIn('status', ['pending', 'active', 'dispensed'])
            ->with('drugFormulary')
            ->get();
        
        foreach ($activePrescriptions as $prescription) {
            if (!$prescription->drugFormulary) {
                continue;
            }
            
            $existingDrug = $prescription->drugFormulary;
            
            // Check for same therapeutic class (potential interaction)
            if ($newDrug->therapeutic_class && 
                $existingDrug->therapeutic_class && 
                $newDrug->therapeutic_class === $existingDrug->therapeutic_class &&
                $newDrug->id !== $existingDrug->id) {
                $interactions[] = [
                    'drug_name' => $existingDrug->name,
                    'interaction_type' => 'therapeutic_class',
                    'message' => "Potential interaction: Both drugs belong to the same therapeutic class ({$newDrug->therapeutic_class})"
                ];
            }
            
            // Check for contraindications
            if ($newDrug->contraindications && is_array($newDrug->contraindications)) {
                foreach ($newDrug->contraindications as $contraindication) {
                    if (stripos($contraindication, $existingDrug->generic_name) !== false ||
                        stripos($contraindication, $existingDrug->name) !== false) {
                        $interactions[] = [
                            'drug_name' => $existingDrug->name,
                            'interaction_type' => 'contraindication',
                            'message' => "Contraindication: {$contraindication}"
                        ];
                    }
                }
            }
        }
        
        return $interactions;
    }
    
    /**
     * Check if patient is allergic to the drug
     * 
     * @param string $patientId
     * @param int $drugId
     * @return bool True if patient is allergic, false otherwise
     */
    public function checkAllergies(string $patientId, int $drugId): bool
    {
        $patient = Patient::find($patientId);
        if (!$patient || !$patient->allergies) {
            return false;
        }
        
        $drug = DrugFormulary::find($drugId);
        if (!$drug) {
            return false;
        }
        
        // Check if any patient allergies match the drug
        $allergies = is_array($patient->allergies) ? $patient->allergies : [];
        
        foreach ($allergies as $allergy) {
            $allergyLower = strtolower($allergy);
            
            // Check against drug name, generic name, and therapeutic class
            if (stripos($drug->name, $allergyLower) !== false ||
                stripos($drug->generic_name, $allergyLower) !== false ||
                stripos($drug->therapeutic_class ?? '', $allergyLower) !== false) {
                return true;
            }
        }
        
        return false;
    }
}
