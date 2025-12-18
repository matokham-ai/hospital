<?php

namespace Tests\Feature\Components;

use Tests\TestCase;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\TestCatalog;
use App\Models\TestCategory;
use App\Models\LabOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Property-Based Tests for LabOrderList Component
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class LabOrderListPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create role and permission
        $role = \Spatie\Permission\Models\Role::create(['name' => 'Doctor']);
        $permission = \Spatie\Permission\Models\Permission::create(['name' => 'order lab tests']);
        $role->givePermissionTo($permission);
        
        // Create authenticated user with doctor role and lab order permission
        $this->user = User::factory()->create([
            'email_verified_at' => now(), // Ensure user is verified for 'verified' middleware
        ]);
        $this->user->assignRole($role);
        $this->actingAs($this->user);
    }

    /**
     * **Feature: consultation-enhancement, Property 28: Lab order display with priority**
     * 
     * Property: For any consultation with lab orders, all lab orders should be displayed
     * with their priority levels clearly indicated
     * 
     * **Validates: Requirements 6.2**
     * 
     * @test
     */
    public function property_lab_order_display_with_priority()
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
            
            // Create random number of lab orders (1-10)
            $labOrderCount = rand(1, 10);
            $createdLabOrders = [];
            
            for ($j = 0; $j < $labOrderCount; $j++) {
                // Create test catalog entry
                $category = TestCategory::factory()->create();
                $test = TestCatalog::factory()->create([
                    'category_id' => $category->id,
                    'status' => 'active',
                ]);
                
                // Random priority
                $priority = $this->randomPriority();
                
                $labOrder = LabOrder::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'ordered_by' => $physician->physician_code,
                    'test_name' => "{$test->name} ({$test->code})",
                    'priority' => $priority,
                    'clinical_notes' => $this->randomClinicalNotes(),
                    'status' => 'pending',
                ]);
                
                $createdLabOrders[] = $labOrder;
            }
            
            // Visit consultation page
            $response = $this->actingAs($this->user)->get("/opd/appointments/{$appointment->id}/soap");
            
            // Property: All lab orders should be visible with priority levels clearly indicated
            $response->assertStatus(200);
            $response->assertInertia(fn (Assert $page) => $page
                ->has('labOrders', $labOrderCount)
            );
            
            // Verify each lab order is present with correct priority
            $response->assertInertia(function (Assert $page) use ($createdLabOrders) {
                $labOrders = $page->toArray()['props']['labOrders'] ?? [];
                
                $this->assertCount(
                    count($createdLabOrders),
                    $labOrders,
                    "Property violated: All lab orders should be visible in consultation interface"
                );
                
                foreach ($createdLabOrders as $createdLabOrder) {
                    $found = false;
                    
                    foreach ($labOrders as $displayedLabOrder) {
                        if ($displayedLabOrder['id'] === $createdLabOrder->id) {
                            $found = true;
                            
                            // Verify lab order details are displayed
                            $this->assertEquals(
                                $createdLabOrder->test_name,
                                $displayedLabOrder['test_name'],
                                "Property violated: Test name should be displayed correctly"
                            );
                            
                            // Property: Priority level should be clearly indicated
                            $this->assertEquals(
                                $createdLabOrder->priority,
                                $displayedLabOrder['priority'],
                                "Property violated: Priority level should be displayed correctly"
                            );
                            
                            // Verify priority is one of the valid values
                            $this->assertContains(
                                $displayedLabOrder['priority'],
                                ['urgent', 'fast', 'normal'],
                                "Property violated: Priority should be one of: urgent, fast, normal"
                            );
                            
                            // Verify clinical notes if present
                            if ($createdLabOrder->clinical_notes) {
                                $this->assertEquals(
                                    $createdLabOrder->clinical_notes,
                                    $displayedLabOrder['clinical_notes'],
                                    "Property violated: Clinical notes should be displayed correctly"
                                );
                            }
                            
                            break;
                        }
                    }
                    
                    $this->assertTrue(
                        $found,
                        "Property violated: Lab order {$createdLabOrder->id} should be visible in consultation interface"
                    );
                }
            });
            
            // Clean up for next iteration
            LabOrder::where('encounter_id', $appointment->id)->delete();
            $appointment->delete();
            $patient->delete();
            $physician->delete();
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 30: Lab order editability before completion**
     * 
     * Property: For any lab order in an uncompleted consultation, the priority level
     * and test selection should be editable
     * 
     * **Validates: Requirements 6.4**
     * 
     * @test
     */
    public function property_lab_order_editability_before_completion()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random appointment (not completed)
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'IN_PROGRESS', // Not completed
            ]);
            
            // Create test catalog entries
            $category = TestCategory::factory()->create();
            $test1 = TestCatalog::factory()->create([
                'category_id' => $category->id,
                'status' => 'active',
            ]);
            $test2 = TestCatalog::factory()->create([
                'category_id' => $category->id,
                'status' => 'active',
            ]);
            
            // Create lab order with initial priority
            $initialPriority = $this->randomPriority();
            $labOrder = LabOrder::create([
                'encounter_id' => $appointment->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_name' => "{$test1->name} ({$test1->code})",
                'priority' => $initialPriority,
                'clinical_notes' => $this->randomClinicalNotes(),
                'status' => 'pending',
            ]);
            
            // Generate new random values for editable fields
            $newPriority = $this->randomPriority();
            $newTestName = "{$test2->name} ({$test2->code})";
            $newClinicalNotes = $this->randomClinicalNotes();
            
            // Property: Priority level and test selection should be editable before completion
            $response = $this->putJson("/api/opd/appointments/{$appointment->id}/lab-orders/{$labOrder->id}", [
                'test_name' => $newTestName,
                'priority' => $newPriority,
                'clinical_notes' => $newClinicalNotes,
            ]);
            
            $response->assertStatus(200);
            
            // Verify all fields were updated
            $labOrder->refresh();
            
            $this->assertEquals(
                $newPriority,
                $labOrder->priority,
                "Property violated: Priority level should be editable before completion"
            );
            
            $this->assertEquals(
                $newTestName,
                $labOrder->test_name,
                "Property violated: Test name should be editable before completion"
            );
            
            $this->assertEquals(
                $newClinicalNotes,
                $labOrder->clinical_notes,
                "Property violated: Clinical notes should be editable before completion"
            );
            
            // Clean up for next iteration
            $labOrder->delete();
            $appointment->delete();
            $patient->delete();
            $physician->delete();
        }
    }

    /**
     * Test that lab orders cannot be edited after consultation completion
     * This is the inverse property of editability before completion
     * 
     * @test
     */
    public function property_lab_order_immutability_after_completion()
    {
        // Run property test with 50 iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random appointment (completed)
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => 'COMPLETED', // Completed consultation
            ]);
            
            // Create test catalog entry
            $category = TestCategory::factory()->create();
            $test = TestCatalog::factory()->create([
                'category_id' => $category->id,
                'status' => 'active',
            ]);
            
            // Create lab order
            $originalPriority = $this->randomPriority();
            $labOrder = LabOrder::create([
                'encounter_id' => $appointment->id,
                'patient_id' => $patient->id,
                'ordered_by' => $physician->physician_code,
                'test_name' => "{$test->name} ({$test->code})",
                'priority' => $originalPriority,
                'clinical_notes' => $this->randomClinicalNotes(),
                'status' => 'pending',
            ]);
            
            // Property: Lab orders should NOT be editable after consultation completion
            $response = $this->putJson("/api/opd/appointments/{$appointment->id}/lab-orders/{$labOrder->id}", [
                'priority' => $this->randomPriority(),
                'clinical_notes' => $this->randomClinicalNotes(),
            ]);
            
            // Should be rejected
            $response->assertStatus(422);
            
            // Verify lab order was not modified
            $labOrder->refresh();
            $this->assertEquals(
                $originalPriority,
                $labOrder->priority,
                "Property violated: Lab order should not be modified after consultation completion"
            );
            
            // Clean up for next iteration
            $labOrder->delete();
            $appointment->delete();
            $patient->delete();
            $physician->delete();
        }
    }

    // Helper methods for generating random test data

    private function randomPriority(): string
    {
        $priorities = ['urgent', 'fast', 'normal'];
        return $priorities[array_rand($priorities)];
    }

    private function randomClinicalNotes(): string
    {
        $notes = [
            'Patient is fasting',
            'Urgent - suspected infection',
            'Follow-up test',
            'Pre-operative screening',
            'Routine check',
            'Patient on anticoagulants',
            'Suspected anemia',
            'Monitor kidney function',
            'Check liver enzymes',
            'Diabetes screening',
        ];
        
        // 30% chance of no notes
        if (rand(1, 10) <= 3) {
            return '';
        }
        
        return $notes[array_rand($notes)];
    }
}
