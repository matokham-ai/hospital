<?php

namespace Tests\Feature\Components;

use Tests\TestCase;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\DrugFormulary;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Property-Based Tests for PrescriptionList Component
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class PrescriptionListPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create role and permission
        $role = \Spatie\Permission\Models\Role::create(['name' => 'Doctor']);
        $permission = \Spatie\Permission\Models\Permission::create(['name' => 'prescribe drugs']);
        $role->givePermissionTo($permission);
        
        // Create authenticated user with doctor role and prescribe permission
        $this->user = User::factory()->create([
            'email_verified_at' => now(), // Ensure user is verified for 'verified' middleware
        ]);
        $this->user->assignRole($role);
        $this->actingAs($this->user);
    }

    /**
     * **Feature: consultation-enhancement, Property 27: Prescription display in consultation**
     * 
     * Property: For any consultation with prescriptions, all prescriptions created
     * in that consultation session should be visible in the consultation interface
     * 
     * **Validates: Requirements 6.1**
     * 
     * @test
     */
    public function property_prescription_display_in_consultation()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random appointment
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            // Create random number of prescriptions (1-10)
            $prescriptionCount = rand(1, 10);
            $createdPrescriptions = [];
            
            for ($j = 0; $j < $prescriptionCount; $j++) {
                $drug = DrugFormulary::factory()->create([
                    'stock_quantity' => rand(50, 500),
                ]);
                
                $prescription = Prescription::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'physician_id' => $physician->physician_code,
                    'drug_id' => $drug->id,
                    'drug_name' => "{$drug->generic_name} {$drug->strength} ({$drug->form})",
                    'dosage' => $this->randomDosage(),
                    'frequency' => $this->randomFrequency(),
                    'duration' => rand(1, 30),
                    'quantity' => rand(1, 100),
                    'instant_dispensing' => (bool)rand(0, 1),
                    'status' => 'pending',
                ]);
                
                $createdPrescriptions[] = $prescription;
            }
            
            // Visit consultation page - use the correct route with proper authentication
            $response = $this->actingAs($this->user)->get("/opd/appointments/{$appointment->id}/soap");
            
            // Property: All prescriptions should be visible in the consultation interface
            $response->assertStatus(200);
            $response->assertInertia(fn (Assert $page) => $page
                ->has('prescriptions', $prescriptionCount)
            );
            
            // Verify each prescription is present with correct data
            $response->assertInertia(function (Assert $page) use ($createdPrescriptions) {
                $prescriptions = $page->toArray()['props']['prescriptions'] ?? [];
                
                $this->assertCount(
                    count($createdPrescriptions),
                    $prescriptions,
                    "Property violated: All prescriptions should be visible in consultation interface"
                );
                
                foreach ($createdPrescriptions as $index => $createdPrescription) {
                    $found = false;
                    
                    foreach ($prescriptions as $displayedPrescription) {
                        if ($displayedPrescription['id'] === $createdPrescription->id) {
                            $found = true;
                            
                            // Verify prescription details are displayed
                            $this->assertEquals(
                                $createdPrescription->drug_name,
                                $displayedPrescription['drug_name'],
                                "Property violated: Drug name should be displayed correctly"
                            );
                            
                            $this->assertEquals(
                                $createdPrescription->dosage,
                                $displayedPrescription['dosage'],
                                "Property violated: Dosage should be displayed correctly"
                            );
                            
                            $this->assertEquals(
                                $createdPrescription->frequency,
                                $displayedPrescription['frequency'],
                                "Property violated: Frequency should be displayed correctly"
                            );
                            
                            $this->assertEquals(
                                $createdPrescription->duration,
                                $displayedPrescription['duration'],
                                "Property violated: Duration should be displayed correctly"
                            );
                            
                            $this->assertEquals(
                                $createdPrescription->quantity,
                                $displayedPrescription['quantity'],
                                "Property violated: Quantity should be displayed correctly"
                            );
                            
                            $this->assertEquals(
                                $createdPrescription->instant_dispensing,
                                $displayedPrescription['instant_dispensing'],
                                "Property violated: Instant dispensing status should be displayed correctly"
                            );
                            
                            break;
                        }
                    }
                    
                    $this->assertTrue(
                        $found,
                        "Property violated: Prescription {$createdPrescription->id} should be visible in consultation interface"
                    );
                }
            });
            
            // Clean up for next iteration
            Prescription::where('encounter_id', $appointment->id)->delete();
            $appointment->delete();
            $patient->delete();
            $physician->delete();
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 29: Prescription editability before completion**
     * 
     * Property: For any prescription in an uncompleted consultation, all fields
     * (dosage, frequency, duration, quantity, instant dispensing status) should be editable
     * 
     * **Validates: Requirements 6.3**
     * 
     * @test
     */
    public function property_prescription_editability_before_completion()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random appointment (not completed)
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS', // Not completed
            ]);
            
            // Randomly decide if this is an emergency patient (50% chance)
            $isEmergencyPatient = (bool)rand(0, 1);
            if ($isEmergencyPatient) {
                \App\Models\EmergencyPatient::create([
                    'patient_id' => $patient->id,
                    'arrival_time' => now(),
                    'mode_of_arrival' => 'Ambulance',
                    'chief_complaint' => 'Test complaint',
                    'status' => 'in_treatment',
                ]);
            }
            
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => rand(100, 500),
            ]);
            
            // Create prescription
            $prescription = Prescription::create([
                'encounter_id' => $appointment->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => "{$drug->generic_name} {$drug->strength} ({$drug->form})",
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 100),
                'instant_dispensing' => false,
                'status' => 'pending',
            ]);
            
            // Generate new random values for all editable fields
            $newDosage = $this->randomDosage();
            $newFrequency = $this->randomFrequency();
            $newDuration = rand(1, 30);
            $newQuantity = rand(1, 100);
            // Only allow instant_dispensing=true for emergency patients
            $newInstantDispensing = $isEmergencyPatient ? (bool)rand(0, 1) : false;
            
            // Property: All fields should be editable before consultation completion
            $response = $this->putJson("/api/opd/appointments/{$appointment->id}/prescriptions/{$prescription->id}", [
                'dosage' => $newDosage,
                'frequency' => $newFrequency,
                'duration' => $newDuration,
                'quantity' => $newQuantity,
                'instant_dispensing' => $newInstantDispensing,
            ]);
            
            $response->assertStatus(200);
            
            // Verify all fields were updated
            $prescription->refresh();
            
            $this->assertEquals(
                $newDosage,
                $prescription->dosage,
                "Property violated: Dosage should be editable before completion"
            );
            
            $this->assertEquals(
                $newFrequency,
                $prescription->frequency,
                "Property violated: Frequency should be editable before completion"
            );
            
            $this->assertEquals(
                $newDuration,
                $prescription->duration,
                "Property violated: Duration should be editable before completion"
            );
            
            $this->assertEquals(
                $newQuantity,
                $prescription->quantity,
                "Property violated: Quantity should be editable before completion"
            );
            
            $this->assertEquals(
                $newInstantDispensing,
                $prescription->instant_dispensing,
                "Property violated: Instant dispensing status should be editable before completion"
            );
            
            // Clean up for next iteration
            $prescription->delete();
            $appointment->delete();
            $patient->delete();
            $physician->delete();
        }
    }

    /**
     * Test that prescriptions cannot be edited after consultation completion
     * This is the inverse property of editability before completion
     * 
     * @test
     */
    public function property_prescription_immutability_after_completion()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random appointment (completed)
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'COMPLETED', // Completed consultation
            ]);
            
            $drug = DrugFormulary::factory()->create([
                'stock_quantity' => rand(100, 500),
            ]);
            
            // Create prescription
            $prescription = Prescription::create([
                'encounter_id' => $appointment->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => "{$drug->generic_name} {$drug->strength} ({$drug->form})",
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 100),
                'instant_dispensing' => false,
                'status' => 'pending',
            ]);
            
            $originalDosage = $prescription->dosage;
            
            // Property: Prescriptions should NOT be editable after consultation completion
            $response = $this->putJson("/api/opd/appointments/{$appointment->id}/prescriptions/{$prescription->id}", [
                'dosage' => $this->randomDosage(),
                'frequency' => $this->randomFrequency(),
                'duration' => rand(1, 30),
                'quantity' => rand(1, 100),
            ]);
            
            // Should be rejected
            $response->assertStatus(422);
            
            // Verify prescription was not modified
            $prescription->refresh();
            $this->assertEquals(
                $originalDosage,
                $prescription->dosage,
                "Property violated: Prescription should not be modified after consultation completion"
            );
            
            // Clean up for next iteration
            $prescription->delete();
            $appointment->delete();
            $patient->delete();
            $physician->delete();
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
}

