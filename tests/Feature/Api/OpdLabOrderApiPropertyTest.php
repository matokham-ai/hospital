<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\TestCatalog;
use App\Models\TestCategory;
use App\Models\LabOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Property-Based Tests for OPD Lab Order API
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class OpdLabOrderApiPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create the Admin role if it doesn't exist
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
        
        // Create authenticated user with Admin role
        $this->user = User::factory()->create();
        $this->user->assignRole($role);
        Sanctum::actingAs($this->user);
    }

    /**
     * **Feature: consultation-enhancement, Property 33: Lab order encounter linkage**
     * 
     * Property: For any lab order created during a consultation,
     * the lab order should have the encounter_id set to the consultation's appointment ID
     * 
     * **Validates: Requirements 7.2**
     * 
     * @test
     */
    public function property_lab_order_encounter_linkage()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random consultation data
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS', // Not completed
            ]);
            
            // Generate random test catalog
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Random priority
            $priority = $this->randomPriority();
            
            // Create lab order via API
            $response = $this->postJson("/api/opd/appointments/{$appointment->id}/lab-orders", [
                'test_id' => $testCatalog->id,
                'priority' => $priority,
                'clinical_notes' => $this->randomClinicalNote(),
            ]);
            
            // Assert successful creation
            if ($response->status() !== 201) {
                dump($response->json());
            }
            $response->assertStatus(201);
            
            // Get the created lab order
            $labOrderId = $response->json('data.id');
            $labOrder = LabOrder::find($labOrderId);
            
            // Property: Lab order should have encounter_id set to appointment ID
            $this->assertNotNull(
                $labOrder,
                "Property violated: Lab order should exist in database"
            );
            
            $this->assertEquals(
                $appointment->id,
                $labOrder->encounter_id,
                "Property violated: Lab order encounter_id should match appointment ID. " .
                "Expected: {$appointment->id}, Got: {$labOrder->encounter_id}"
            );
            
            // Additional verification: Lab order should be linked to correct patient
            $this->assertEquals(
                $patient->id,
                $labOrder->patient_id,
                "Property violated: Lab order should be linked to the correct patient"
            );
            
            // Verify the lab order can be retrieved through the encounter relationship
            $encounterLabOrders = LabOrder::where('encounter_id', $appointment->id)->get();
            $this->assertTrue(
                $encounterLabOrders->contains('id', $labOrder->id),
                "Property violated: Lab order should be retrievable via encounter_id"
            );
        }
    }

    /**
     * Property: For any lab order created during a consultation,
     * updating the lab order should not change its encounter_id
     * 
     * @test
     */
    public function property_lab_order_encounter_linkage_is_immutable()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random consultation data
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            // Generate random test catalog
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Create lab order
            $response = $this->postJson("/api/opd/appointments/{$appointment->id}/lab-orders", [
                'test_id' => $testCatalog->id,
                'priority' => 'normal',
                'clinical_notes' => 'Initial notes',
            ]);
            
            $response->assertStatus(201);
            $labOrderId = $response->json('data.id');
            $originalEncounterId = $appointment->id;
            
            // Update the lab order (change priority and notes)
            $updateResponse = $this->putJson(
                "/api/opd/appointments/{$appointment->id}/lab-orders/{$labOrderId}",
                [
                    'priority' => 'urgent',
                    'clinical_notes' => 'Updated notes',
                ]
            );
            
            $updateResponse->assertStatus(200);
            
            // Property: encounter_id should remain unchanged after update
            $labOrder = LabOrder::find($labOrderId);
            $this->assertEquals(
                $originalEncounterId,
                $labOrder->encounter_id,
                "Property violated: Lab order encounter_id should not change after update. " .
                "Original: {$originalEncounterId}, After update: {$labOrder->encounter_id}"
            );
        }
    }

    /**
     * Property: For any lab order, it should only be accessible through
     * its associated appointment endpoint
     * 
     * @test
     */
    public function property_lab_order_is_scoped_to_appointment()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Create two different appointments
            $patient1 = Patient::factory()->create();
            $patient2 = Patient::factory()->create();
            $physician = Physician::factory()->create();
            
            $appointment1 = OpdAppointment::factory()->create([
                'patient_id' => $patient1->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            $appointment2 = OpdAppointment::factory()->create([
                'patient_id' => $patient2->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            // Create test catalog
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Create lab order for appointment1
            $response = $this->postJson("/api/opd/appointments/{$appointment1->id}/lab-orders", [
                'test_id' => $testCatalog->id,
                'priority' => 'normal',
            ]);
            
            $response->assertStatus(201);
            $labOrderId = $response->json('data.id');
            
            // Property: Attempting to access the lab order through appointment2 should fail
            $wrongAppointmentResponse = $this->putJson(
                "/api/opd/appointments/{$appointment2->id}/lab-orders/{$labOrderId}",
                [
                    'priority' => 'urgent',
                ]
            );
            
            // Should return 404 because lab order doesn't belong to appointment2
            $wrongAppointmentResponse->assertStatus(404);
            
            // Verify the lab order is still linked to appointment1
            $labOrder = LabOrder::find($labOrderId);
            $this->assertEquals(
                $appointment1->id,
                $labOrder->encounter_id,
                "Property violated: Lab order should remain linked to original appointment"
            );
        }
    }

    /**
     * Property: For any lab order deleted during a consultation,
     * the encounter_id relationship should be properly cleaned up
     * 
     * @test
     */
    public function property_lab_order_deletion_maintains_encounter_integrity()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random consultation data
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS',
            ]);
            
            // Create multiple lab orders
            $category = TestCategory::factory()->create();
            $numOrders = rand(2, 4);
            $labOrderIds = [];
            
            for ($j = 0; $j < $numOrders; $j++) {
                $testCatalog = TestCatalog::factory()->create([
                    'category_id' => $category->id,
                ]);
                
                $response = $this->postJson("/api/opd/appointments/{$appointment->id}/lab-orders", [
                    'test_id' => $testCatalog->id,
                    'priority' => $this->randomPriority(),
                ]);
                
                $labOrderIds[] = $response->json('data.id');
            }
            
            // Delete one lab order
            $orderToDelete = $labOrderIds[0];
            $deleteResponse = $this->deleteJson(
                "/api/opd/appointments/{$appointment->id}/lab-orders/{$orderToDelete}"
            );
            
            $deleteResponse->assertStatus(200);
            
            // Property: Deleted lab order should not exist
            $this->assertNull(
                LabOrder::find($orderToDelete),
                "Property violated: Deleted lab order should not exist in database"
            );
            
            // Property: Other lab orders should still be linked to the encounter
            $remainingOrders = LabOrder::where('encounter_id', $appointment->id)->get();
            $this->assertCount(
                $numOrders - 1,
                $remainingOrders,
                "Property violated: Remaining lab orders should still be linked to encounter"
            );
            
            foreach ($remainingOrders as $order) {
                $this->assertEquals(
                    $appointment->id,
                    $order->encounter_id,
                    "Property violated: Remaining lab orders should maintain encounter linkage"
                );
            }
        }
    }

    // Helper methods for generating random test data

    private function randomPriority(): string
    {
        $priorities = ['urgent', 'fast', 'normal'];
        return $priorities[array_rand($priorities)];
    }

    private function randomClinicalNote(): ?string
    {
        $notes = [
            'Patient complains of chest pain',
            'Follow-up test for diabetes management',
            'Pre-operative screening',
            'Routine annual checkup',
            'Suspected infection',
            'Monitor kidney function',
            null, // Some orders may not have clinical notes
        ];
        return $notes[array_rand($notes)];
    }
}
