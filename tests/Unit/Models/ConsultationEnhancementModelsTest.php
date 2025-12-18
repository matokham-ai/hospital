<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\OpdAppointment;
use App\Models\Prescription;
use App\Models\LabOrder;
use App\Models\EmergencyPatient;
use App\Models\DrugFormulary;
use App\Models\TestCatalog;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class ConsultationEnhancementModelsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function opd_appointment_has_emergency_record_relationship()
    {
        $patient = Patient::factory()->create();
        $emergencyPatient = EmergencyPatient::create([
            'patient_id' => $patient->id,
            'chief_complaint' => 'Test complaint',
            'arrival_mode' => 'ambulance',
            'arrival_time' => now(),
            'status' => 'active'
        ]);

        $appointment = OpdAppointment::factory()->create([
            'patient_id' => $patient->id
        ]);

        $this->assertNotNull($appointment->emergencyRecord);
        $this->assertEquals($emergencyPatient->id, $appointment->emergencyRecord->id);
    }

    #[Test]
    public function opd_appointment_emergency_record_excludes_discharged_patients()
    {
        $patient = Patient::factory()->create();
        EmergencyPatient::create([
            'patient_id' => $patient->id,
            'chief_complaint' => 'Test complaint',
            'arrival_mode' => 'ambulance',
            'arrival_time' => now(),
            'status' => 'discharged'
        ]);

        $appointment = OpdAppointment::factory()->create([
            'patient_id' => $patient->id
        ]);

        $this->assertNull($appointment->emergencyRecord);
    }

    #[Test]
    public function prescription_has_drug_formulary_relationship()
    {
        $drug = DrugFormulary::factory()->create();
        $prescription = Prescription::factory()->create([
            'drug_id' => $drug->id
        ]);

        $this->assertNotNull($prescription->drugFormulary);
        $this->assertEquals($drug->id, $prescription->drugFormulary->id);
    }

    #[Test]
    public function prescription_can_be_marked_for_instant_dispensing()
    {
        $prescription = Prescription::factory()->create([
            'instant_dispensing' => false
        ]);

        $this->assertFalse($prescription->isInstantDispensing());

        $prescription->markForInstantDispensing();

        $this->assertTrue($prescription->fresh()->isInstantDispensing());
    }

    #[Test]
    public function prescription_can_reserve_and_release_stock()
    {
        $prescription = Prescription::factory()->create([
            'stock_reserved' => false
        ]);

        $this->assertFalse($prescription->hasStockReserved());

        $prescription->reserveStock();
        $prescription->refresh();

        $this->assertTrue($prescription->hasStockReserved());
        $this->assertNotNull($prescription->stock_reserved_at);

        $prescription->releaseStock();
        $prescription->refresh();

        $this->assertFalse($prescription->hasStockReserved());
        $this->assertNull($prescription->stock_reserved_at);
    }

    #[Test]
    public function prescription_stock_reservation_expiry_check()
    {
        $prescription = Prescription::factory()->create([
            'stock_reserved' => true,
            'stock_reserved_at' => now()->subMinutes(31)
        ]);

        $this->assertTrue($prescription->isStockReservationExpired());

        $prescription->stock_reserved_at = now()->subMinutes(29);
        $prescription->save();

        $this->assertFalse($prescription->fresh()->isStockReservationExpired());
    }

    #[Test]
    public function lab_order_has_test_catalog_relationship()
    {
        $test = TestCatalog::factory()->create();
        $appointment = OpdAppointment::factory()->create();
        $labOrder = LabOrder::create([
            'encounter_id' => $appointment->id,
            'test_id' => $test->id,
            'patient_id' => $appointment->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $this->assertNotNull($labOrder->testCatalog);
        $this->assertEquals($test->id, $labOrder->testCatalog->id);
    }

    #[Test]
    public function lab_order_priority_checks()
    {
        $appointment1 = OpdAppointment::factory()->create();
        $urgentOrder = LabOrder::create([
            'encounter_id' => $appointment1->id,
            'patient_id' => $appointment1->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'urgent'
        ]);

        $appointment2 = OpdAppointment::factory()->create();
        $fastOrder = LabOrder::create([
            'encounter_id' => $appointment2->id,
            'patient_id' => $appointment2->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'fast'
        ]);

        $appointment3 = OpdAppointment::factory()->create();
        $normalOrder = LabOrder::create([
            'encounter_id' => $appointment3->id,
            'patient_id' => $appointment3->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $this->assertTrue($urgentOrder->isUrgent());
        $this->assertFalse($urgentOrder->isFast());
        $this->assertFalse($urgentOrder->isNormal());

        $this->assertTrue($fastOrder->isFast());
        $this->assertFalse($fastOrder->isUrgent());

        $this->assertTrue($normalOrder->isNormal());
        $this->assertFalse($normalOrder->isUrgent());
    }

    #[Test]
    public function lab_order_can_set_priority()
    {
        $appointment = OpdAppointment::factory()->create();
        $labOrder = LabOrder::create([
            'encounter_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $labOrder->setPriority('urgent');

        $this->assertEquals('urgent', $labOrder->fresh()->priority);
        $this->assertTrue($labOrder->isUrgent());
    }

    #[Test]
    public function lab_order_set_priority_throws_exception_for_invalid_priority()
    {
        $appointment = OpdAppointment::factory()->create();
        $labOrder = LabOrder::create([
            'encounter_id' => $appointment->id,
            'patient_id' => $appointment->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $labOrder->setPriority('invalid');
    }

    #[Test]
    public function lab_order_priority_labels_and_colors()
    {
        $appointment1 = OpdAppointment::factory()->create();
        $urgentOrder = LabOrder::create([
            'encounter_id' => $appointment1->id,
            'patient_id' => $appointment1->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'urgent'
        ]);

        $this->assertEquals('Urgent', $urgentOrder->getPriorityLabel());
        $this->assertEquals('red', $urgentOrder->getPriorityColor());

        $appointment2 = OpdAppointment::factory()->create();
        $fastOrder = LabOrder::create([
            'encounter_id' => $appointment2->id,
            'patient_id' => $appointment2->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'fast'
        ]);

        $this->assertEquals('Fast', $fastOrder->getPriorityLabel());
        $this->assertEquals('orange', $fastOrder->getPriorityColor());

        $appointment3 = OpdAppointment::factory()->create();
        $normalOrder = LabOrder::create([
            'encounter_id' => $appointment3->id,
            'patient_id' => $appointment3->patient_id,
            'test_name' => 'Test',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $this->assertEquals('Normal', $normalOrder->getPriorityLabel());
        $this->assertEquals('blue', $normalOrder->getPriorityColor());
    }

    #[Test]
    public function lab_order_priority_scopes()
    {
        $appointment1 = OpdAppointment::factory()->create();
        LabOrder::create([
            'encounter_id' => $appointment1->id,
            'patient_id' => $appointment1->patient_id,
            'test_name' => 'Test 1',
            'status' => 'pending',
            'priority' => 'urgent'
        ]);

        $appointment2 = OpdAppointment::factory()->create();
        LabOrder::create([
            'encounter_id' => $appointment2->id,
            'patient_id' => $appointment2->patient_id,
            'test_name' => 'Test 2',
            'status' => 'pending',
            'priority' => 'fast'
        ]);

        $appointment3 = OpdAppointment::factory()->create();
        LabOrder::create([
            'encounter_id' => $appointment3->id,
            'patient_id' => $appointment3->patient_id,
            'test_name' => 'Test 3',
            'status' => 'pending',
            'priority' => 'normal'
        ]);

        $this->assertEquals(1, LabOrder::urgent()->count());
        $this->assertEquals(1, LabOrder::fast()->count());
        $this->assertEquals(1, LabOrder::normal()->count());
        $this->assertEquals(1, LabOrder::byPriority('urgent')->count());
    }
}
