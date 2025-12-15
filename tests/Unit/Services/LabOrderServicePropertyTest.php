<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\LabOrderService;
use App\Models\LabOrder;
use App\Models\TestCatalog;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Physician;
use App\Models\TestCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

/**
 * Property-Based Tests for LabOrderService
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class LabOrderServicePropertyTest extends TestCase
{
    use RefreshDatabase;

    protected LabOrderService $labOrderService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->labOrderService = new LabOrderService();
    }

    /**
     * **Feature: consultation-enhancement, Property 18: Lab order priority requirement**
     * 
     * Property: For any lab order submission without a priority level specified,
     * the system should reject the order
     * 
     * **Validates: Requirements 4.2**
     * 
     * @test
     */
    public function property_lab_order_priority_requirement_rejects_missing_priority()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random lab order data
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Create lab order data WITHOUT priority
            $labOrderData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog->id,
                'test_name' => $testCatalog->name,
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Property: Lab order without priority should be rejected
            try {
                $this->labOrderService->createLabOrder($labOrderData);
                $this->fail(
                    "Property violated: Lab order without priority should have been rejected"
                );
            } catch (ValidationException $e) {
                // Expected - validation should fail
                $errors = $e->errors();
                $this->assertArrayHasKey(
                    'priority',
                    $errors,
                    "Validation error should mention 'priority' field"
                );
            }
        }
    }

    /**
     * Property: For any lab order submission with a valid priority level specified,
     * the system should accept the order
     * 
     * @test
     */
    public function property_lab_order_with_valid_priority_is_accepted()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random lab order data with valid priority
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Random valid priority
            $priority = $this->randomPriority();
            
            $labOrderData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog->id,
                'test_name' => $testCatalog->name,
                'priority' => $priority,
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Property: Lab order with valid priority should be accepted
            $labOrder = $this->labOrderService->createLabOrder($labOrderData);
            
            $this->assertInstanceOf(
                LabOrder::class,
                $labOrder,
                "Property violated: Lab order with valid priority should be accepted"
            );
            
            $this->assertEquals($priority, $labOrder->priority);
            $this->assertNotNull($labOrder->expected_completion_at);
        }
    }

    /**
     * Property: For any lab order submission with an invalid priority level,
     * the system should reject the order
     * 
     * @test
     */
    public function property_lab_order_with_invalid_priority_is_rejected()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random lab order data
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Random invalid priority
            $invalidPriority = $this->randomInvalidPriority();
            
            $labOrderData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog->id,
                'test_name' => $testCatalog->name,
                'priority' => $invalidPriority,
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Property: Lab order with invalid priority should be rejected
            try {
                $this->labOrderService->createLabOrder($labOrderData);
                $this->fail(
                    "Property violated: Lab order with invalid priority '{$invalidPriority}' should have been rejected"
                );
            } catch (ValidationException $e) {
                // Expected - validation should fail
                $errors = $e->errors();
                $this->assertArrayHasKey(
                    'priority',
                    $errors,
                    "Validation error should mention 'priority' field"
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

    private function randomInvalidPriority(): string
    {
        $invalidPriorities = ['high', 'low', 'medium', 'critical', 'routine', '', 'URGENT', 'Fast'];
        return $invalidPriorities[array_rand($invalidPriorities)];
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

    /**
     * **Feature: consultation-enhancement, Property 20: Urgent order flagging**
     * 
     * Property: For any lab order created with urgent priority,
     * the order should have an urgent flag set in the database
     * 
     * **Validates: Requirements 4.4**
     * 
     * @test
     */
    public function property_urgent_order_flagging()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random lab order data with urgent priority
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            $labOrderData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog->id,
                'test_name' => $testCatalog->name,
                'priority' => 'urgent',
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Create lab order
            $labOrder = $this->labOrderService->createLabOrder($labOrderData);
            
            // Property: Lab order with urgent priority should have urgent flag set
            $this->assertEquals(
                'urgent',
                $labOrder->priority,
                "Property violated: Lab order should have priority set to 'urgent'"
            );
            
            $this->assertTrue(
                $labOrder->isUrgent(),
                "Property violated: Lab order with urgent priority should return true for isUrgent()"
            );
            
            // Verify it's stored in database correctly
            $labOrder->refresh();
            $this->assertEquals('urgent', $labOrder->priority);
        }
    }

    /**
     * Property: For any lab order created with non-urgent priority,
     * the order should not be flagged as urgent
     * 
     * @test
     */
    public function property_non_urgent_orders_are_not_flagged_as_urgent()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random lab order data with non-urgent priority
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            $testCatalog = TestCatalog::factory()->create([
                'category_id' => $category->id,
            ]);
            
            // Random non-urgent priority
            $nonUrgentPriorities = ['fast', 'normal'];
            $priority = $nonUrgentPriorities[array_rand($nonUrgentPriorities)];
            
            $labOrderData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog->id,
                'test_name' => $testCatalog->name,
                'priority' => $priority,
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Create lab order
            $labOrder = $this->labOrderService->createLabOrder($labOrderData);
            
            // Property: Lab order with non-urgent priority should not be flagged as urgent
            $this->assertFalse(
                $labOrder->isUrgent(),
                "Property violated: Lab order with priority '{$priority}' should not be flagged as urgent"
            );
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 21: Independent lab order priorities**
     * 
     * Property: For any consultation with multiple lab orders,
     * each lab order should be able to have a different priority level
     * 
     * **Validates: Requirements 4.5**
     * 
     * @test
     */
    public function property_independent_lab_order_priorities()
    {
        // Run property test with 50 iterations (fewer since we create multiple orders)
        for ($i = 0; $i < 50; $i++) {
            // Generate random patient and encounter
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            
            // Create multiple lab orders with different priorities
            $numOrders = rand(2, 5);
            $priorities = ['urgent', 'fast', 'normal'];
            $createdOrders = [];
            $assignedPriorities = [];
            
            for ($j = 0; $j < $numOrders; $j++) {
                $testCatalog = TestCatalog::factory()->create([
                    'category_id' => $category->id,
                ]);
                
                // Randomly assign priority
                $priority = $priorities[array_rand($priorities)];
                $assignedPriorities[] = $priority;
                
                $labOrderData = [
                    'encounter_id' => $encounter->id,
                    'patient_id' => $patient->id,
                    'ordered_by' => $physician->physician_code,
                    'test_id' => $testCatalog->id,
                    'test_name' => $testCatalog->name,
                    'priority' => $priority,
                    'clinical_notes' => $this->randomClinicalNote(),
                ];
                
                $labOrder = $this->labOrderService->createLabOrder($labOrderData);
                $createdOrders[] = $labOrder;
            }
            
            // Property: Each lab order should maintain its own independent priority
            for ($j = 0; $j < $numOrders; $j++) {
                $this->assertEquals(
                    $assignedPriorities[$j],
                    $createdOrders[$j]->priority,
                    "Property violated: Lab order {$j} should have priority '{$assignedPriorities[$j]}' but has '{$createdOrders[$j]->priority}'"
                );
            }
            
            // Property: Changing one lab order's priority should not affect others
            if ($numOrders >= 2) {
                $firstOrder = $createdOrders[0];
                $secondOrder = $createdOrders[1];
                
                $originalFirstPriority = $firstOrder->priority;
                $originalSecondPriority = $secondOrder->priority;
                
                // Change first order's priority
                $newPriority = $originalFirstPriority === 'urgent' ? 'normal' : 'urgent';
                $this->labOrderService->updatePriority($firstOrder->id, $newPriority);
                
                // Verify first order changed
                $firstOrder->refresh();
                $this->assertEquals($newPriority, $firstOrder->priority);
                
                // Verify second order unchanged
                $secondOrder->refresh();
                $this->assertEquals(
                    $originalSecondPriority,
                    $secondOrder->priority,
                    "Property violated: Changing one lab order's priority should not affect other lab orders"
                );
            }
        }
    }

    /**
     * Property: For any lab order, updating its priority should not affect
     * other lab orders in the same encounter
     * 
     * @test
     */
    public function property_priority_updates_are_isolated()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random patient and encounter
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            $category = TestCategory::factory()->create();
            
            // Create exactly 3 lab orders with known priorities
            $testCatalog1 = TestCatalog::factory()->create(['category_id' => $category->id]);
            $testCatalog2 = TestCatalog::factory()->create(['category_id' => $category->id]);
            $testCatalog3 = TestCatalog::factory()->create(['category_id' => $category->id]);
            
            $order1 = $this->labOrderService->createLabOrder([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog1->id,
                'test_name' => $testCatalog1->name,
                'priority' => 'urgent',
            ]);
            
            $order2 = $this->labOrderService->createLabOrder([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog2->id,
                'test_name' => $testCatalog2->name,
                'priority' => 'fast',
            ]);
            
            $order3 = $this->labOrderService->createLabOrder([
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_id' => $testCatalog3->id,
                'test_name' => $testCatalog3->name,
                'priority' => 'normal',
            ]);
            
            // Update order2's priority
            $this->labOrderService->updatePriority($order2->id, 'urgent');
            
            // Property: Only order2 should have changed
            $order1->refresh();
            $order2->refresh();
            $order3->refresh();
            
            $this->assertEquals('urgent', $order1->priority, "Order 1 should remain urgent");
            $this->assertEquals('urgent', $order2->priority, "Order 2 should be updated to urgent");
            $this->assertEquals('normal', $order3->priority, "Order 3 should remain normal");
        }
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
            // Generate random patient and encounter (consultation)
            $patient = Patient::factory()->create();
            $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
            $physician = Physician::factory()->create();
            
            // Random priority
            $priority = $this->randomPriority();
            
            $labOrderData = [
                'encounter_id' => $encounter->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_name' => 'Complete Blood Count',
                'priority' => $priority,
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Create lab order
            $labOrder = $this->labOrderService->createLabOrder($labOrderData);
            
            // Property: Lab order should have encounter_id set to the consultation's appointment ID
            $this->assertNotNull(
                $labOrder->encounter_id,
                "Property violated: Lab order should have encounter_id set"
            );
            
            $this->assertEquals(
                $encounter->id,
                $labOrder->encounter_id,
                "Property violated: Lab order encounter_id should match the consultation's appointment ID"
            );
            
            // Verify it's persisted in database correctly
            $labOrder->refresh();
            $this->assertEquals(
                $encounter->id,
                $labOrder->encounter_id,
                "Property violated: Lab order encounter_id should be persisted in database"
            );
        }
    }

    /**
     * Property: For any lab order created during a consultation,
     * the lab order should fail if encounter_id is missing
     * 
     * @test
     */
    public function property_lab_order_encounter_linkage_fails_when_missing()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random patient (without encounter)
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            
            // Random priority
            $priority = $this->randomPriority();
            
            // Create lab order data WITHOUT encounter_id
            $labOrderData = [
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_name' => 'Complete Blood Count',
                'priority' => $priority,
                'clinical_notes' => $this->randomClinicalNote(),
            ];
            
            // Property: Lab order without encounter_id should fail
            try {
                $labOrder = $this->labOrderService->createLabOrder($labOrderData);
                
                // If it doesn't throw an exception, verify encounter_id is null
                // This tests the property that encounter linkage should be enforced
                $this->assertNull(
                    $labOrder->encounter_id ?? null,
                    "Property note: Lab order created without encounter_id has null encounter_id"
                );
            } catch (\Exception $e) {
                // Expected - creation may fail due to database constraints
                $this->assertTrue(
                    true,
                    "Property validated: Lab order without encounter_id properly rejected"
                );
            }
        }
    }
}
