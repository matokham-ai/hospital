<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\PrescriptionService;
use App\Models\Prescription;
use App\Models\DrugFormulary;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Physician;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

/**
 * Property-Based Tests for PrescriptionService
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class PrescriptionServicePropertyTest extends TestCase
{
    use RefreshDatabase;

    protected PrescriptionService $prescriptionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->prescriptionService = new PrescriptionService();
    }

    /**
     * **Feature: consultation-enhancement, Property 10: Prescription field validation**
     * 
     * Property: For any prescription submission, if any of the required fields
     * (dosage, frequency, duration, quantity) are missing, the system should reject the prescription
     * 
     * **Validates: Requirements 2.5**
     * 
     * @test
     */
    public function property_prescription_field_validation_rejects_missing_fields()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random prescription data
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $drug = DrugFormulary::factory()->create();
            
            // Create complete prescription data
            $completeData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => $drug->name,
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 100),
                'status' => 'pending',
            ];
            
            // Randomly remove one or more required fields
            $requiredFields = ['dosage', 'frequency', 'duration', 'quantity'];
            $fieldsToRemove = $this->randomSubset($requiredFields);
            
            if (empty($fieldsToRemove)) {
                // If no fields removed, prescription should succeed
                $prescription = $this->prescriptionService->createPrescription($completeData);
                $this->assertInstanceOf(Prescription::class, $prescription);
                continue;
            }
            
            $incompleteData = $completeData;
            foreach ($fieldsToRemove as $field) {
                unset($incompleteData[$field]);
            }
            
            // Property: Prescription with missing required fields should be rejected
            try {
                $this->prescriptionService->createPrescription($incompleteData);
                $this->fail(
                    "Property violated: Prescription with missing fields [" . 
                    implode(', ', $fieldsToRemove) . 
                    "] should have been rejected"
                );
            } catch (ValidationException $e) {
                // Expected - validation should fail
                $this->assertTrue(
                    true,
                    "Prescription correctly rejected for missing fields: " . implode(', ', $fieldsToRemove)
                );
            }
        }
    }

    /**
     * Property: For any prescription with all required fields present,
     * the system should accept the prescription
     * 
     * @test
     */
    public function property_prescription_with_all_required_fields_is_accepted()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random prescription data with all required fields
            $patient = Patient::factory()->create(['allergies' => []]);
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => rand(100, 1000),
            ]);
            
            $prescriptionData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => $drug->name,
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 50),
                'status' => 'pending',
            ];
            
            // Property: Prescription with all required fields should be accepted
            $prescription = $this->prescriptionService->createPrescription($prescriptionData);
            
            $this->assertInstanceOf(
                Prescription::class,
                $prescription,
                "Property violated: Prescription with all required fields should be accepted"
            );
            
            $this->assertEquals($prescriptionData['dosage'], $prescription->dosage);
            $this->assertEquals($prescriptionData['frequency'], $prescription->frequency);
            $this->assertEquals($prescriptionData['duration'], $prescription->duration);
            $this->assertEquals($prescriptionData['quantity'], $prescription->quantity);
        }
    }

    // Helper methods for generating random test data

    private function randomDosage(): string
    {
        $dosages = ['10mg', '20mg', '50mg', '100mg', '250mg', '500mg', '1g', '2.5mg', '5ml'];
        return $dosages[array_rand($dosages)];
    }

    private function randomFrequency(): string
    {
        $frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'Every 6 hours', 'Every 8 hours', 'As needed'];
        return $frequencies[array_rand($frequencies)];
    }

    private function randomSubset(array $items): array
    {
        if (empty($items)) {
            return [];
        }
        
        // Randomly decide how many items to include (0 to all)
        $count = rand(0, count($items));
        
        if ($count === 0) {
            return [];
        }
        
        // Shuffle and take the first $count items
        shuffle($items);
        return array_slice($items, 0, $count);
    }

    /**
     * **Feature: consultation-enhancement, Property 14: Instant dispensing stock validation**
     * 
     * Property: For any prescription marked for instant dispensing, if the requested quantity
     * exceeds available stock, the system should reject the prescription
     * 
     * **Validates: Requirements 3.2**
     * 
     * @test
     */
    public function property_instant_dispensing_stock_validation_rejects_insufficient_stock()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug with random stock quantity
            $stockQuantity = rand(0, 50);
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => $stockQuantity,
            ]);
            
            // Generate random quantity that exceeds stock
            $requestedQuantity = $stockQuantity + rand(1, 50);
            
            // Property: Instant dispensing validation should fail when stock is insufficient
            $isValid = $this->prescriptionService->validateInstantDispensing($drug->id, $requestedQuantity);
            
            $this->assertFalse(
                $isValid,
                "Property violated: Instant dispensing should be rejected when requested quantity ({$requestedQuantity}) exceeds available stock ({$stockQuantity})"
            );
        }
    }

    /**
     * Property: For any prescription marked for instant dispensing, if the requested quantity
     * is less than or equal to available stock, the system should accept the prescription
     * 
     * @test
     */
    public function property_instant_dispensing_stock_validation_accepts_sufficient_stock()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug with sufficient stock
            $stockQuantity = rand(50, 1000);
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => $stockQuantity,
            ]);
            
            // Generate random quantity within available stock
            $requestedQuantity = rand(1, $stockQuantity);
            
            // Property: Instant dispensing validation should succeed when stock is sufficient
            $isValid = $this->prescriptionService->validateInstantDispensing($drug->id, $requestedQuantity);
            
            $this->assertTrue(
                $isValid,
                "Property violated: Instant dispensing should be accepted when requested quantity ({$requestedQuantity}) is within available stock ({$stockQuantity})"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 15: Stock reservation on instant dispensing**
     * 
     * Property: For any prescription marked for instant dispensing and saved,
     * the drug's stock quantity should be reduced by the prescription quantity
     * 
     * **Validates: Requirements 3.3**
     * 
     * @test
     */
    public function property_stock_reservation_reduces_stock_quantity()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug with sufficient stock
            $initialStock = rand(100, 1000);
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => $initialStock,
            ]);
            
            // Generate random prescription quantity
            $quantity = rand(1, 50);
            
            // Create prescription with instant dispensing
            $patient = Patient::factory()->create(['allergies' => []]);
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            
            $prescription = Prescription::create([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => $drug->name,
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => 7,
                'quantity' => $quantity,
                'status' => 'pending',
                'instant_dispensing' => true,
            ]);
            
            // Reserve stock
            $this->prescriptionService->reserveStock($prescription);
            
            // Property: Stock should be reduced by prescription quantity
            $drug->refresh();
            $expectedStock = $initialStock - $quantity;
            
            $this->assertEquals(
                $expectedStock,
                $drug->stock_quantity,
                "Property violated: Stock should be reduced from {$initialStock} to {$expectedStock}, but is {$drug->stock_quantity}"
            );
            
            $this->assertTrue(
                $prescription->fresh()->stock_reserved,
                "Property violated: Prescription should be marked as having reserved stock"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 31: Stock release on prescription deletion**
     * 
     * Property: For any prescription with reserved stock that is deleted,
     * the reserved stock quantity should be immediately released back to available stock
     * 
     * **Validates: Requirements 6.5**
     * 
     * @test
     */
    public function property_stock_release_restores_stock_quantity()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug with sufficient stock
            $initialStock = rand(100, 1000);
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => $initialStock,
            ]);
            
            // Generate random prescription quantity
            $quantity = rand(1, 50);
            
            // Create prescription with reserved stock
            $patient = Patient::factory()->create(['allergies' => []]);
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            
            $prescription = Prescription::create([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => $drug->name,
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => 7,
                'quantity' => $quantity,
                'status' => 'pending',
                'instant_dispensing' => true,
            ]);
            
            // Reserve stock
            $this->prescriptionService->reserveStock($prescription);
            $drug->refresh();
            $stockAfterReservation = $drug->stock_quantity;
            
            // Release stock
            $this->prescriptionService->releaseStock($prescription);
            
            // Property: Stock should be restored to initial quantity
            $drug->refresh();
            
            $this->assertEquals(
                $initialStock,
                $drug->stock_quantity,
                "Property violated: Stock should be restored from {$stockAfterReservation} to {$initialStock}, but is {$drug->stock_quantity}"
            );
            
            $this->assertFalse(
                $prescription->fresh()->stock_reserved,
                "Property violated: Prescription should be marked as not having reserved stock"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 11: Drug interaction detection**
     * 
     * Property: For any patient with existing medications, when prescribing a drug
     * that interacts with those medications, the system should generate interaction warnings
     * 
     * **Validates: Requirements 2.6**
     * 
     * @test
     */
    public function property_drug_interaction_detection_warns_for_same_therapeutic_class()
    {
        // Run property test with 50 iterations (fewer since we create multiple prescriptions)
        for ($i = 0; $i < 50; $i++) {
            // Generate random patient
            $patient = Patient::factory()->create(['allergies' => []]);
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            
            // Generate random therapeutic class
            $therapeuticClass = $this->randomTherapeuticClass();
            
            // Create existing drug in same therapeutic class
            $existingDrug = DrugFormulary::factory()->create([
                'therapeutic_class' => $therapeuticClass,
                'stock_quantity' => 100,
            ]);
            
            // Create active prescription for existing drug
            Prescription::create([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $existingDrug->id,
                'drug_name' => $existingDrug->name,
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => 7,
                'quantity' => 10,
                'status' => 'active',
            ]);
            
            // Create new drug in same therapeutic class
            $newDrug = DrugFormulary::factory()->create([
                'therapeutic_class' => $therapeuticClass,
                'stock_quantity' => 100,
            ]);
            
            // Property: Interaction check should return warnings for same therapeutic class
            $interactions = $this->prescriptionService->checkDrugInteractions($patient->id, $newDrug->id);
            
            $this->assertNotEmpty(
                $interactions,
                "Property violated: Drug interaction check should return warnings when prescribing drugs in the same therapeutic class ({$therapeuticClass})"
            );
            
            // Verify interaction mentions the therapeutic class
            $foundTherapeuticClassInteraction = false;
            foreach ($interactions as $interaction) {
                if (isset($interaction['interaction_type']) && $interaction['interaction_type'] === 'therapeutic_class') {
                    $foundTherapeuticClassInteraction = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundTherapeuticClassInteraction,
                "Property violated: Interaction warnings should include therapeutic class conflicts"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 12: Allergy prevention**
     * 
     * Property: For any patient with known drug allergies, attempting to prescribe
     * a drug matching those allergies should be blocked by the system
     * 
     * **Validates: Requirements 2.7**
     * 
     * @test
     */
    public function property_allergy_prevention_blocks_allergic_drugs()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug
            $drug = DrugFormulary::factory()->create([
                'name' => 'Test Drug ' . $i,
                'generic_name' => 'TestGeneric' . $i,
                'therapeutic_class' => $this->randomTherapeuticClass(),
                'stock_quantity' => 100,
            ]);
            
            // Create patient with allergy to this drug (match on name, generic name, or class)
            $allergyType = rand(1, 3);
            $allergy = match($allergyType) {
                1 => $drug->name,
                2 => $drug->generic_name,
                3 => $drug->therapeutic_class,
            };
            
            $patient = Patient::factory()->create([
                'allergies' => [$allergy],
            ]);
            
            // Property: Allergy check should return true (patient is allergic)
            $isAllergic = $this->prescriptionService->checkAllergies($patient->id, $drug->id);
            
            $this->assertTrue(
                $isAllergic,
                "Property violated: Allergy check should return true when patient has allergy to '{$allergy}' and drug is '{$drug->name}' (generic: '{$drug->generic_name}', class: '{$drug->therapeutic_class}')"
            );
        }
    }

    /**
     * Property: For any patient without allergies, allergy check should return false
     * 
     * @test
     */
    public function property_allergy_prevention_allows_non_allergic_drugs()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => 100,
            ]);
            
            // Create patient with no allergies
            $patient = Patient::factory()->create([
                'allergies' => [],
            ]);
            
            // Property: Allergy check should return false (patient is not allergic)
            $isAllergic = $this->prescriptionService->checkAllergies($patient->id, $drug->id);
            
            $this->assertFalse(
                $isAllergic,
                "Property violated: Allergy check should return false when patient has no allergies"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 34: Stock movement audit trail**
     * 
     * Property: For any stock reservation for instant dispensing,
     * a stock movement record should be created with the reservation details
     * 
     * **Validates: Requirements 7.3**
     * 
     * @test
     */
    public function property_stock_movement_audit_trail_created_on_reservation()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug with sufficient stock
            $initialStock = rand(100, 1000);
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => $initialStock,
            ]);
            
            // Generate random prescription quantity
            $quantity = rand(1, 50);
            
            // Create prescription with instant dispensing
            $patient = Patient::factory()->create(['allergies' => []]);
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            
            $prescription = Prescription::create([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => $drug->name,
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => 7,
                'quantity' => $quantity,
                'status' => 'pending',
                'instant_dispensing' => true,
            ]);
            
            // Count stock movements before reservation
            $movementsBefore = \App\Models\StockMovement::where('drug_id', $drug->id)->count();
            
            // Reserve stock
            $this->prescriptionService->reserveStock($prescription);
            
            // Property: Stock movement record should be created
            $movementsAfter = \App\Models\StockMovement::where('drug_id', $drug->id)->count();
            
            $this->assertEquals(
                $movementsBefore + 1,
                $movementsAfter,
                "Property violated: Stock movement record should be created when reserving stock for prescription {$prescription->id}"
            );
            
            // Verify the stock movement record contains correct details
            $stockMovement = \App\Models\StockMovement::where('drug_id', $drug->id)
                ->where('reference_no', 'PRESCRIPTION-' . $prescription->id)
                ->latest()
                ->first();
            
            $this->assertNotNull(
                $stockMovement,
                "Property violated: Stock movement record should exist with reference to prescription {$prescription->id}"
            );
            
            $this->assertEquals(
                'RESERVATION',
                $stockMovement->movement_type,
                "Property violated: Stock movement type should be 'RESERVATION'"
            );
            
            $this->assertEquals(
                $quantity,
                $stockMovement->quantity,
                "Property violated: Stock movement quantity should match prescription quantity ({$quantity})"
            );
            
            // Test stock release also creates audit trail
            $movementsBeforeRelease = \App\Models\StockMovement::where('drug_id', $drug->id)->count();
            
            // Release stock
            $this->prescriptionService->releaseStock($prescription);
            
            // Property: Stock movement record should be created for release
            $movementsAfterRelease = \App\Models\StockMovement::where('drug_id', $drug->id)->count();
            
            $this->assertEquals(
                $movementsBeforeRelease + 1,
                $movementsAfterRelease,
                "Property violated: Stock movement record should be created when releasing stock for prescription {$prescription->id}"
            );
            
            // Verify the release stock movement record
            $releaseMovement = \App\Models\StockMovement::where('drug_id', $drug->id)
                ->where('reference_no', 'PRESCRIPTION-' . $prescription->id)
                ->where('movement_type', 'RETURN')
                ->latest()
                ->first();
            
            $this->assertNotNull(
                $releaseMovement,
                "Property violated: Stock movement record should exist for stock release with reference to prescription {$prescription->id}"
            );
            
            $this->assertEquals(
                $quantity,
                $releaseMovement->quantity,
                "Property violated: Release stock movement quantity should match prescription quantity ({$quantity})"
            );
        }
    }

    // Helper method for generating random therapeutic classes
    private function randomTherapeuticClass(): string
    {
        $classes = [
            'Antibiotics',
            'Analgesics',
            'Antihypertensives',
            'Antihistamines',
            'Antidiabetics',
            'Bronchodilators',
            'Corticosteroids',
            'Antidepressants',
        ];
        return $classes[array_rand($classes)];
    }
}
