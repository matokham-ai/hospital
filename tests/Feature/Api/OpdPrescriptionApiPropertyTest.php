<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\DrugFormulary;
use App\Models\EmergencyPatient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Property-Based Tests for OPD Prescription API Endpoints
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class OpdPrescriptionApiPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create the permission if it doesn't exist
        $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'prescribe drugs']);
        
        // Create authenticated user with prescription permissions
        $this->user = User::factory()->create();
        $this->user->givePermissionTo($permission);
        Sanctum::actingAs($this->user);
    }

    /**
     * **Feature: consultation-enhancement, Property 9: Prescription auto-population**
     * 
     * Property: For any selected drug, the prescription form should be populated
     * with the drug's details including suggested dosage
     * 
     * **Validates: Requirements 2.4**
     * 
     * @test
     */
    public function property_prescription_auto_population_includes_drug_details()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random drug with various attributes
            $drug = DrugFormulary::factory()->create([
                'name' => 'Drug ' . $i,
                'generic_name' => 'Generic' . $i,
                'strength' => $this->randomStrength(),
                'form' => $this->randomForm(),
                'stock_quantity' => rand(50, 500),
            ]);
            
            // Generate random appointment
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            // Create prescription with drug_id
            $response = $this->postJson("/api/opd/appointments/{$appointment->id}/prescriptions", [
                'drug_id' => $drug->id,
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 50),
            ]);
            
            $response->assertStatus(201);
            
            // Property: Response should include drug details
            $responseData = $response->json('data');
            
            $this->assertNotNull(
                $responseData['drug_formulary'],
                "Property violated: Prescription response should include drug_formulary relationship"
            );
            
            $this->assertEquals(
                $drug->id,
                $responseData['drug_formulary']['id'],
                "Property violated: Drug details should match the selected drug"
            );
            
            $this->assertEquals(
                $drug->name,
                $responseData['drug_formulary']['name'],
                "Property violated: Drug name should be auto-populated"
            );
            
            $this->assertEquals(
                $drug->generic_name,
                $responseData['drug_formulary']['generic_name'],
                "Property violated: Generic name should be auto-populated"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 13: Emergency instant dispensing availability**
     * 
     * Property: For any emergency patient, the prescription form should include
     * the instant dispensing option
     * 
     * **Validates: Requirements 3.1**
     * 
     * @test
     */
    public function property_emergency_instant_dispensing_availability()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random emergency patient
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            // Create emergency record for patient
            EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => $this->randomEmergencyStatus(),
            ]);
            
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => rand(100, 500),
            ]);
            
            // Property: Emergency patients should be able to create prescriptions with instant dispensing
            $response = $this->postJson("/api/opd/appointments/{$appointment->id}/prescriptions", [
                'drug_id' => $drug->id,
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 20),
                'instant_dispensing' => true,
            ]);
            
            $response->assertStatus(201);
            
            $responseData = $response->json('data');
            $this->assertTrue(
                $responseData['instant_dispensing'],
                "Property violated: Emergency patients should be able to use instant dispensing"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 16: Non-emergency instant dispensing restriction**
     * 
     * Property: For any non-emergency patient, the prescription form should not
     * include the instant dispensing option
     * 
     * **Validates: Requirements 3.4**
     * 
     * @test
     */
    public function property_non_emergency_instant_dispensing_restriction()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random non-emergency patient (no emergency record)
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => rand(100, 500),
            ]);
            
            // Property: Non-emergency patients should NOT be able to use instant dispensing
            $response = $this->postJson("/api/opd/appointments/{$appointment->id}/prescriptions", [
                'drug_id' => $drug->id,
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 20),
                'instant_dispensing' => true,
            ]);
            
            $response->assertStatus(422);
            $response->assertJsonFragment([
                'message' => 'Instant dispensing is only available for emergency patients'
            ]);
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 17: Selective instant dispensing**
     * 
     * Property: For any consultation with multiple prescriptions, each prescription
     * should be independently markable for instant dispensing
     * 
     * **Validates: Requirements 3.5**
     * 
     * @test
     */
    public function property_selective_instant_dispensing()
    {
        // Run property test with 50 iterations (fewer since we create multiple prescriptions)
        for ($i = 0; $i < 50; $i++) {
            // Generate random emergency patient
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            EmergencyPatient::factory()->create([
                'patient_id' => $patient->id,
                'status' => 'admitted',
            ]);
            
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            // Create multiple prescriptions with random instant dispensing flags
            $prescriptionCount = rand(2, 5);
            $instantDispensingFlags = [];
            
            for ($j = 0; $j < $prescriptionCount; $j++) {
                $drug = DrugFormulary::factory()->create([
                    'stock_quantity' => rand(100, 500),
                ]);
                
                $instantDispensing = (bool)rand(0, 1);
                $instantDispensingFlags[] = $instantDispensing;
                
                $response = $this->postJson("/api/opd/appointments/{$appointment->id}/prescriptions", [
                    'drug_id' => $drug->id,
                    'dosage' => $this->randomDosage(),
                    'frequency' => $this->randomFrequency(),
                    'duration' => rand(1, 30),
                    'quantity' => rand(1, 20),
                    'instant_dispensing' => $instantDispensing,
                ]);
                
                $response->assertStatus(201);
            }
            
            // Property: Each prescription should have its own instant dispensing status
            $prescriptions = Prescription::where('encounter_id', $appointment->id)->get();
            
            $this->assertCount(
                $prescriptionCount,
                $prescriptions,
                "Property violated: All prescriptions should be created"
            );
            
            foreach ($prescriptions as $index => $prescription) {
                $this->assertEquals(
                    $instantDispensingFlags[$index],
                    $prescription->instant_dispensing,
                    "Property violated: Prescription {$index} should have instant_dispensing = {$instantDispensingFlags[$index]}, but has {$prescription->instant_dispensing}"
                );
            }
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 32: Prescription encounter linkage**
     * 
     * Property: For any prescription created during a consultation, the prescription
     * should have the encounter_id set to the consultation's appointment ID
     * 
     * **Validates: Requirements 7.1**
     * 
     * @test
     */
    public function property_prescription_encounter_linkage()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random appointment
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => rand(100, 500),
            ]);
            
            // Create prescription
            $response = $this->postJson("/api/opd/appointments/{$appointment->id}/prescriptions", [
                'drug_id' => $drug->id,
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 50),
            ]);
            
            $response->assertStatus(201);
            
            // Property: Prescription should be linked to the appointment (encounter)
            $responseData = $response->json('data');
            
            $this->assertEquals(
                $appointment->id,
                $responseData['encounter_id'],
                "Property violated: Prescription encounter_id should match appointment ID"
            );
            
            // Verify in database
            $prescription = Prescription::find($responseData['id']);
            $this->assertEquals(
                $appointment->id,
                $prescription->encounter_id,
                "Property violated: Prescription in database should have correct encounter_id"
            );
        }
    }

    // Helper methods for generating random test data

    private function randomDosage(): string
    {
        $dosages = ['10mg', '20mg', '50mg', '100mg', '250mg', '500mg', '1g', '2.5mg', '5ml', '10ml'];
        return $dosages[array_rand($dosages)];
    }

    private function randomFrequency(): string
    {
        $frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'Every 6 hours', 'Every 8 hours', 'As needed', 'Before meals', 'After meals'];
        return $frequencies[array_rand($frequencies)];
    }

    private function randomStrength(): string
    {
        $strengths = ['10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1g'];
        return $strengths[array_rand($strengths)];
    }

    private function randomForm(): string
    {
        $forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops'];
        return $forms[array_rand($forms)];
    }

    private function randomEmergencyStatus(): string
    {
        $statuses = ['admitted', 'under_observation', 'waiting'];
        return $statuses[array_rand($statuses)];
    }
}
