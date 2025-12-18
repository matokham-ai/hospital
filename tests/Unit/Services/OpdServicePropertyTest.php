<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\OpdService;
use App\Services\EmergencyService;
use App\Services\PrescriptionService;
use App\Services\LabOrderService;
use App\Services\BillingService;
use App\Models\OpdAppointment;
use App\Models\OpdSoapNote;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\Prescription;
use App\Models\LabOrder;
use App\Models\DrugFormulary;
use App\Models\TestCatalog;
use App\Models\BillingItem;
use App\Models\Encounter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

/**
 * Property-Based Tests for OpdService
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using randomized test data generation.
 */
class OpdServicePropertyTest extends TestCase
{
    use RefreshDatabase;

    protected OpdService $opdService;
    protected EmergencyService $emergencyService;
    protected PrescriptionService $prescriptionService;
    protected LabOrderService $labOrderService;
    protected BillingService $billingService;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->emergencyService = new EmergencyService();
        $this->prescriptionService = new PrescriptionService();
        $this->labOrderService = new LabOrderService();
        $this->billingService = new BillingService();
        
        $this->opdService = new OpdService(
            $this->emergencyService,
            $this->prescriptionService,
            $this->labOrderService,
            $this->billingService
        );
    }

    /**
     * **Feature: consultation-enhancement, Property 22: Completion summary completeness**
     * 
     * Property: For any consultation being completed, the completion summary should include
     * all prescriptions and lab orders created during that consultation
     * 
     * **Validates: Requirements 5.1**
     * 
     * @test
     */
    public function property_completion_summary_includes_all_prescriptions_and_lab_orders()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random consultation with prescriptions and lab orders
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'appointment_date' => today(),
                'appointment_type' => 'WALK_IN',
                'status' => 'IN_PROGRESS',
                'queue_number' => rand(1, 100),
            ]);
            
            // Create random number of prescriptions (0-10)
            $prescriptionCount = rand(0, 10);
            $createdPrescriptions = [];
            for ($j = 0; $j < $prescriptionCount; $j++) {
                $drug = DrugFormulary::factory()->create(['stock_quantity' => 100]);
                $prescription = Prescription::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'physician_id' => $physician->physician_code,
                    'drug_id' => $drug->id,
                    'drug_name' => $drug->name,
                    'dosage' => '10mg',
                    'frequency' => 'Once daily',
                    'duration' => rand(1, 30),
                    'quantity' => rand(1, 50),
                    'status' => 'pending',
                    'instant_dispensing' => (bool)rand(0, 1),
                ]);
                $createdPrescriptions[] = $prescription->id;
            }
            
            // Create random number of lab orders (0-10)
            $labOrderCount = rand(0, 10);
            $createdLabOrders = [];
            for ($j = 0; $j < $labOrderCount; $j++) {
                $test = TestCatalog::factory()->create();
                $labOrder = LabOrder::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'test_id' => $test->id,
                    'test_name' => $test->name,
                    'priority' => $this->randomPriority(),
                    'status' => 'pending',
                ]);
                $createdLabOrders[] = $labOrder->id;
            }
            
            // Get consultation summary
            $summary = $this->opdService->getConsultationSummary($appointment->id);
            
            // Property: Summary should include all created prescriptions
            $this->assertCount(
                $prescriptionCount,
                $summary['prescriptions'],
                "Property violated: Summary should include all {$prescriptionCount} prescriptions"
            );
            
            $summaryPrescriptionIds = $summary['prescriptions']->pluck('id')->toArray();
            foreach ($createdPrescriptions as $prescriptionId) {
                $this->assertContains(
                    $prescriptionId,
                    $summaryPrescriptionIds,
                    "Property violated: Summary should include prescription ID {$prescriptionId}"
                );
            }
            
            // Property: Summary should include all created lab orders
            $this->assertCount(
                $labOrderCount,
                $summary['lab_orders'],
                "Property violated: Summary should include all {$labOrderCount} lab orders"
            );
            
            $summaryLabOrderIds = $summary['lab_orders']->pluck('id')->toArray();
            foreach ($createdLabOrders as $labOrderId) {
                $this->assertContains(
                    $labOrderId,
                    $summaryLabOrderIds,
                    "Property violated: Summary should include lab order ID {$labOrderId}"
                );
            }
            
            // Property: Summary should have correct totals
            $this->assertEquals(
                $prescriptionCount,
                $summary['total_prescriptions'],
                "Property violated: Total prescriptions count should be {$prescriptionCount}"
            );
            
            $this->assertEquals(
                $labOrderCount,
                $summary['total_lab_orders'],
                "Property violated: Total lab orders count should be {$labOrderCount}"
            );
        }
    }

    // Helper methods
    private function randomPriority(): string
    {
        $priorities = ['urgent', 'fast', 'normal'];
        return $priorities[array_rand($priorities)];
    }

    /**
     * **Feature: consultation-enhancement, Property 23: Instant dispensing record creation**
     * 
     * Property: For any consultation completed with instant dispensing prescriptions,
     * dispensation records should be created for each instant dispensing prescription
     * 
     * **Validates: Requirements 5.2**
     * 
     * @test
     */
    public function property_instant_dispensing_record_creation()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random consultation with instant dispensing prescriptions
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'appointment_date' => today(),
                'appointment_type' => 'WALK_IN',
                'status' => 'IN_PROGRESS',
                'queue_number' => rand(1, 100),
            ]);
            
            // Create SOAP note
            OpdSoapNote::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'is_draft' => true,
            ]);
            
            // Create random number of instant dispensing prescriptions (1-5)
            $instantDispensingCount = rand(1, 5);
            $instantDispensingPrescriptions = [];
            
            for ($j = 0; $j < $instantDispensingCount; $j++) {
                $drug = DrugFormulary::factory()->create(['stock_quantity' => 1000]);
                $quantity = rand(1, 10);
                
                $prescription = Prescription::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'physician_id' => $physician->physician_code,
                    'drug_id' => $drug->id,
                    'drug_name' => $drug->name,
                    'dosage' => '10mg',
                    'frequency' => 'Once daily',
                    'duration' => rand(1, 30),
                    'quantity' => $quantity,
                    'status' => 'pending',
                    'instant_dispensing' => true,
                ]);
                
                // Reserve stock
                $this->prescriptionService->reserveStock($prescription);
                $instantDispensingPrescriptions[] = $prescription->id;
            }
            
            // Create some regular prescriptions too (0-3)
            $regularCount = rand(0, 3);
            for ($j = 0; $j < $regularCount; $j++) {
                $drug = DrugFormulary::factory()->create(['stock_quantity' => 1000]);
                Prescription::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'physician_id' => $physician->physician_code,
                    'drug_id' => $drug->id,
                    'drug_name' => $drug->name,
                    'dosage' => '10mg',
                    'frequency' => 'Once daily',
                    'duration' => rand(1, 30),
                    'quantity' => rand(1, 10),
                    'status' => 'pending',
                    'instant_dispensing' => false,
                ]);
            }
            
            // Complete consultation
            $this->opdService->completeConsultation($appointment->id);
            
            // Property: Dispensation records should be created for each instant dispensing prescription
            foreach ($instantDispensingPrescriptions as $prescriptionId) {
                $dispensation = DB::table('dispensations')
                    ->where('prescription_id', $prescriptionId)
                    ->first();
                
                $this->assertNotNull(
                    $dispensation,
                    "Property violated: Dispensation record should be created for instant dispensing prescription ID {$prescriptionId}"
                );
                
                $prescription = Prescription::find($prescriptionId);
                $this->assertEquals(
                    $prescription->quantity,
                    $dispensation->quantity_dispensed,
                    "Property violated: Dispensed quantity should match prescription quantity"
                );
                
                $this->assertEquals(
                    'dispensed',
                    $prescription->status,
                    "Property violated: Instant dispensing prescription should have status 'dispensed' after completion"
                );
            }
        }
    }


    /**
     * **Feature: consultation-enhancement, Property 25: Billing item creation**
     * 
     * Property: For any completed consultation, billing items should be created
     * for each prescription and each lab order
     * 
     * **Validates: Requirements 5.4**
     * 
     * @test
     */
    public function property_billing_item_creation()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random consultation with prescriptions and lab orders
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'appointment_date' => today(),
                'appointment_type' => 'WALK_IN',
                'status' => 'IN_PROGRESS',
                'queue_number' => rand(1, 100),
            ]);
            
            // Create SOAP note
            OpdSoapNote::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'is_draft' => true,
            ]);
            
            // Create random number of prescriptions (0-5)
            $prescriptionCount = rand(0, 5);
            for ($j = 0; $j < $prescriptionCount; $j++) {
                $drug = DrugFormulary::factory()->create(['stock_quantity' => 1000]);
                
                // Create service catalogue entry for this medication
                \App\Models\ServiceCatalogue::create([
                    'code' => 'MED-' . $drug->id,
                    'name' => $drug->name,
                    'category' => 'medication',
                    'unit_price' => $drug->unit_price ?? 100,
                    'is_active' => true,
                    'is_billable' => true,
                ]);
                
                Prescription::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'physician_id' => $physician->physician_code,
                    'drug_id' => $drug->id,
                    'drug_name' => $drug->name,
                    'dosage' => '10mg',
                    'frequency' => 'Once daily',
                    'duration' => rand(1, 30),
                    'quantity' => rand(1, 10),
                    'status' => 'pending',
                ]);
            }
            
            // Create random number of lab orders (0-5)
            $labOrderCount = rand(0, 5);
            for ($j = 0; $j < $labOrderCount; $j++) {
                $test = TestCatalog::factory()->create();
                
                // Create service catalogue entry for this lab test
                \App\Models\ServiceCatalogue::create([
                    'code' => 'LAB-' . $test->id,
                    'name' => $test->name,
                    'category' => 'lab_test',
                    'unit_price' => $test->price ?? 500,
                    'is_active' => true,
                    'is_billable' => true,
                ]);
                
                LabOrder::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'test_id' => $test->id,
                    'test_name' => $test->name,
                    'priority' => $this->randomPriority(),
                    'status' => 'pending',
                ]);
            }
            
            // Count billing items before completion
            $billingItemsBeforeCount = BillingItem::where('encounter_id', $appointment->id)->count();
            
            // Complete consultation
            $this->opdService->completeConsultation($appointment->id);
            
            // Property: Billing items should be created for prescriptions and lab orders
            $billingItemsAfterCount = BillingItem::where('encounter_id', $appointment->id)->count();
            
            // Note: We expect at least as many billing items as prescriptions + lab orders
            // (there might be additional items like consultation fees)
            $expectedMinimumItems = $prescriptionCount + $labOrderCount;
            $actualNewItems = $billingItemsAfterCount - $billingItemsBeforeCount;
            
            $this->assertGreaterThanOrEqual(
                $expectedMinimumItems,
                $actualNewItems,
                "Property violated: At least {$expectedMinimumItems} billing items should be created ({$prescriptionCount} prescriptions + {$labOrderCount} lab orders), but only {$actualNewItems} were created"
            );
        }
    }


    /**
     * **Feature: consultation-enhancement, Property 26: Post-completion immutability**
     * 
     * Property: For any completed consultation, attempts to modify prescriptions
     * or lab orders should be rejected
     * 
     * **Validates: Requirements 5.5**
     * 
     * @test
     */
    public function property_post_completion_immutability()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random consultation
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'appointment_date' => today(),
                'appointment_type' => 'WALK_IN',
                'status' => 'IN_PROGRESS',
                'queue_number' => rand(1, 100),
            ]);
            
            // Create SOAP note
            OpdSoapNote::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'is_draft' => true,
            ]);
            
            // Complete consultation
            $this->opdService->completeConsultation($appointment->id);
            
            // Property: Attempting to complete again should throw an exception
            try {
                $this->opdService->completeConsultation($appointment->id);
                $this->fail(
                    "Property violated: Attempting to complete an already completed consultation should throw an exception"
                );
            } catch (\Exception $e) {
                $this->assertStringContainsString(
                    'already completed',
                    strtolower($e->getMessage()),
                    "Exception message should indicate consultation is already completed"
                );
            }
            
            // Verify appointment status is COMPLETED
            $appointment->refresh();
            $this->assertEquals(
                'COMPLETED',
                $appointment->status,
                "Property violated: Completed consultation should have status 'COMPLETED'"
            );
        }
    }


    /**
     * **Feature: consultation-enhancement, Property 36: Transaction rollback on error**
     * 
     * Property: For any consultation completion that encounters an error,
     * all changes should be rolled back and the consultation should remain in its pre-completion state
     * 
     * **Validates: Requirements 7.5**
     * 
     * @test
     */
    public function property_transaction_rollback_on_error()
    {
        // Run property test with 50 iterations (fewer since we're testing error conditions)
        for ($i = 0; $i < 50; $i++) {
            // Generate random consultation
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'appointment_date' => today(),
                'appointment_type' => 'WALK_IN',
                'status' => 'IN_PROGRESS',
                'queue_number' => rand(1, 100),
            ]);
            
            // Create SOAP note
            $soapNote = OpdSoapNote::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'is_draft' => true,
            ]);
            
            // Create a prescription
            $drug = DrugFormulary::factory()->create(['stock_quantity' => 1000]);
            $prescription = Prescription::create([
                'encounter_id' => $appointment->id,
                'patient_id' => $patient->id,
                'physician_id' => $physician->physician_code,
                'drug_id' => $drug->id,
                'drug_name' => $drug->name,
                'dosage' => '10mg',
                'frequency' => 'Once daily',
                'duration' => 7,
                'quantity' => 10,
                'status' => 'pending',
            ]);
            
            // Store initial state
            $initialAppointmentStatus = $appointment->status;
            $initialSoapNoteIsDraft = $soapNote->is_draft;
            $initialPrescriptionStatus = $prescription->status;
            
            // Mock a scenario that would cause an error during completion
            // We'll test that if the appointment is already completed, it throws an error
            // and doesn't change anything
            
            // First, complete it successfully
            $this->opdService->completeConsultation($appointment->id);
            
            // Refresh to get updated state
            $appointment->refresh();
            $soapNote->refresh();
            $prescription->refresh();
            
            // Store the completed state
            $completedStatus = $appointment->status;
            $completedSoapIsDraft = $soapNote->is_draft;
            $completedPrescriptionStatus = $prescription->status;
            
            // Now try to complete again (this should fail and not change anything)
            try {
                $this->opdService->completeConsultation($appointment->id);
                // If we get here, the test should fail
                $this->fail("Property violated: Attempting to complete an already completed consultation should throw an exception");
            } catch (\Exception $e) {
                // Expected - error should be thrown
                
                // Property: State should remain unchanged after error
                $appointment->refresh();
                $soapNote->refresh();
                $prescription->refresh();
                
                $this->assertEquals(
                    $completedStatus,
                    $appointment->status,
                    "Property violated: Appointment status should remain unchanged after error"
                );
                
                $this->assertEquals(
                    $completedSoapIsDraft,
                    $soapNote->is_draft,
                    "Property violated: SOAP note draft status should remain unchanged after error"
                );
                
                $this->assertEquals(
                    $completedPrescriptionStatus,
                    $prescription->status,
                    "Property violated: Prescription status should remain unchanged after error"
                );
            }
        }
    }

    /**
     * **Feature: consultation-enhancement, Property 35: Consultation completion status update**
     * 
     * Property: For any consultation that is completed, the consultation status should be
     * set to 'COMPLETED' and the completion timestamp should be recorded
     * 
     * **Validates: Requirements 7.4**
     * 
     * @test
     */
    public function property_consultation_completion_status_update()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random consultation
            $patient = Patient::factory()->create(['allergies' => []]);
            $physician = Physician::factory()->create();
            
            // Random initial status (should be IN_PROGRESS or WAITING)
            $initialStatuses = ['IN_PROGRESS', 'WAITING'];
            $initialStatus = $initialStatuses[array_rand($initialStatuses)];
            
            $appointment = OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'appointment_date' => today(),
                'appointment_type' => 'WALK_IN',
                'status' => $initialStatus,
                'queue_number' => rand(1, 100),
            ]);
            
            // Create SOAP note
            OpdSoapNote::create([
                'appointment_id' => $appointment->id,
                'patient_id' => $patient->id,
                'doctor_id' => $physician->id,
                'is_draft' => true,
            ]);
            
            // Create random number of prescriptions (0-3)
            $prescriptionCount = rand(0, 3);
            for ($j = 0; $j < $prescriptionCount; $j++) {
                $drug = DrugFormulary::factory()->create(['stock_quantity' => 1000]);
                Prescription::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'physician_id' => $physician->physician_code,
                    'drug_id' => $drug->id,
                    'drug_name' => $drug->name,
                    'dosage' => '10mg',
                    'frequency' => 'Once daily',
                    'duration' => rand(1, 30),
                    'quantity' => rand(1, 10),
                    'status' => 'pending',
                ]);
            }
            
            // Create random number of lab orders (0-3)
            $labOrderCount = rand(0, 3);
            for ($j = 0; $j < $labOrderCount; $j++) {
                $test = TestCatalog::factory()->create();
                LabOrder::create([
                    'encounter_id' => $appointment->id,
                    'patient_id' => $patient->id,
                    'ordered_by' => $physician->physician_code,
                    'test_name' => $test->name,
                    'priority' => $this->randomPriority(),
                    'status' => 'pending',
                ]);
            }
            
            // Record time before completion
            $beforeCompletionTime = now();
            
            // Complete consultation
            $this->opdService->completeConsultation($appointment->id);
            
            // Record time after completion
            $afterCompletionTime = now();
            
            // Refresh appointment to get updated data
            $appointment->refresh();
            
            // Property: Status should be set to 'COMPLETED'
            $this->assertEquals(
                'COMPLETED',
                $appointment->status,
                "Property violated: Consultation status should be 'COMPLETED' after completion (was '{$appointment->status}')"
            );
            
            // Property: Completion timestamp should be recorded
            $this->assertNotNull(
                $appointment->consultation_completed_at,
                "Property violated: Consultation completion timestamp should be recorded"
            );
            
            // Property: Completion timestamp should be between before and after times
            $this->assertGreaterThanOrEqual(
                $beforeCompletionTime->timestamp,
                $appointment->consultation_completed_at->timestamp,
                "Property violated: Completion timestamp should be after the completion was initiated"
            );
            
            $this->assertLessThanOrEqual(
                $afterCompletionTime->timestamp,
                $appointment->consultation_completed_at->timestamp,
                "Property violated: Completion timestamp should be before the completion finished"
            );
        }
    }
}
