<?php

namespace Tests\Unit\Jobs;

use Tests\TestCase;
use App\Jobs\ReleaseExpiredStockReservations;
use App\Services\PrescriptionService;
use App\Models\Prescription;
use App\Models\DrugFormulary;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Physician;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

class ReleaseExpiredStockReservationsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the job releases expired stock reservations
     * 
     * @test
     */
    public function it_releases_expired_stock_reservations()
    {
        // Create a drug with stock
        $drug = DrugFormulary::factory()->create([
            'stock_quantity' => 100,
        ]);

        // Create a prescription with expired stock reservation (35 minutes ago)
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
            'quantity' => 10,
            'status' => 'pending',
            'instant_dispensing' => true,
            'stock_reserved' => true,
            'stock_reserved_at' => now()->subMinutes(35), // Expired
        ]);

        // Manually reduce stock to simulate reservation
        $drug->decrement('stock_quantity', 10);
        $drug->refresh();
        $this->assertEquals(90, $drug->stock_quantity);

        // Run the job
        $job = new ReleaseExpiredStockReservations();
        $prescriptionService = new PrescriptionService();
        $job->handle($prescriptionService);

        // Verify stock was released
        $drug->refresh();
        $this->assertEquals(100, $drug->stock_quantity);

        // Verify prescription is no longer marked as having reserved stock
        $prescription->refresh();
        $this->assertFalse($prescription->stock_reserved);
        $this->assertNull($prescription->stock_reserved_at);
    }

    /**
     * Test that the job does not release non-expired stock reservations
     * 
     * @test
     */
    public function it_does_not_release_non_expired_stock_reservations()
    {
        // Create a drug with stock
        $drug = DrugFormulary::factory()->create([
            'stock_quantity' => 100,
        ]);

        // Create a prescription with recent stock reservation (10 minutes ago)
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
            'quantity' => 10,
            'status' => 'pending',
            'instant_dispensing' => true,
            'stock_reserved' => true,
            'stock_reserved_at' => now()->subMinutes(10), // Not expired
        ]);

        // Manually reduce stock to simulate reservation
        $drug->decrement('stock_quantity', 10);
        $drug->refresh();
        $this->assertEquals(90, $drug->stock_quantity);

        // Run the job
        $job = new ReleaseExpiredStockReservations();
        $prescriptionService = new PrescriptionService();
        $job->handle($prescriptionService);

        // Verify stock was NOT released
        $drug->refresh();
        $this->assertEquals(90, $drug->stock_quantity);

        // Verify prescription still has reserved stock
        $prescription->refresh();
        $this->assertTrue($prescription->stock_reserved);
        $this->assertNotNull($prescription->stock_reserved_at);
    }

    /**
     * Test that the job handles multiple expired reservations
     * 
     * @test
     */
    public function it_handles_multiple_expired_reservations()
    {
        // Create drugs with stock
        $drug1 = DrugFormulary::factory()->create(['stock_quantity' => 100]);
        $drug2 = DrugFormulary::factory()->create(['stock_quantity' => 200]);

        $patient = Patient::factory()->create(['allergies' => []]);
        $encounter = Encounter::factory()->create(['patient_id' => $patient->id]);
        $physician = Physician::factory()->create();

        // Create multiple expired prescriptions
        $prescription1 = Prescription::create([
            'encounter_id' => $encounter->id,
            'patient_id' => $patient->id,
            'physician_id' => $physician->physician_code,
            'drug_id' => $drug1->id,
            'drug_name' => $drug1->name,
            'dosage' => '10mg',
            'frequency' => 'Once daily',
            'duration' => 7,
            'quantity' => 10,
            'status' => 'pending',
            'instant_dispensing' => true,
            'stock_reserved' => true,
            'stock_reserved_at' => now()->subMinutes(35),
        ]);

        $prescription2 = Prescription::create([
            'encounter_id' => $encounter->id,
            'patient_id' => $patient->id,
            'physician_id' => $physician->physician_code,
            'drug_id' => $drug2->id,
            'drug_name' => $drug2->name,
            'dosage' => '20mg',
            'frequency' => 'Twice daily',
            'duration' => 14,
            'quantity' => 20,
            'status' => 'pending',
            'instant_dispensing' => true,
            'stock_reserved' => true,
            'stock_reserved_at' => now()->subMinutes(40),
        ]);

        // Manually reduce stock
        $drug1->decrement('stock_quantity', 10);
        $drug2->decrement('stock_quantity', 20);

        // Run the job
        $job = new ReleaseExpiredStockReservations();
        $prescriptionService = new PrescriptionService();
        $job->handle($prescriptionService);

        // Verify both stocks were released
        $drug1->refresh();
        $drug2->refresh();
        $this->assertEquals(100, $drug1->stock_quantity);
        $this->assertEquals(200, $drug2->stock_quantity);

        // Verify both prescriptions are no longer marked as having reserved stock
        $prescription1->refresh();
        $prescription2->refresh();
        $this->assertFalse($prescription1->stock_reserved);
        $this->assertFalse($prescription2->stock_reserved);
    }
}
