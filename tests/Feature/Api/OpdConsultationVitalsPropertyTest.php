<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Property-Based Tests for OPD Consultation Vitals Data Inclusion
 * 
 * These tests verify that consultation data includes vital signs information
 * for display in the vitals widget.
 */
class OpdConsultationVitalsPropertyTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create the permission if it doesn't exist
        $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'view consultations']);
        
        // Create authenticated user with consultation permissions
        $this->user = User::factory()->create();
        $this->user->givePermissionTo($permission);
        Sanctum::actingAs($this->user);
    }

    /**
     * **Feature: consultation-enhancement, Property 37: Vitals widget data inclusion**
     * 
     * Property: For any consultation interface loaded, the consultation data should
     * include current vital signs for display in the vitals widget
     * 
     * **Validates: Requirements 8.2**
     * 
     * @test
     */
    public function property_consultation_data_includes_vital_signs()
    {
        // Run property test with 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Generate random patient and appointment with vital signs
            $patient = Patient::factory()->create();
            $physician = Physician::factory()->create();
            
            // Generate random vital signs data
            $vitalSigns = $this->generateRandomVitalSigns();
            
            $appointment = OpdAppointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $physician->physician_code,
                'status' => $this->randomAppointmentStatus(),
                'temperature' => $vitalSigns['temperature'],
                'blood_pressure' => $vitalSigns['blood_pressure'],
                'heart_rate' => $vitalSigns['heart_rate'],
                'respiratory_rate' => $vitalSigns['respiratory_rate'],
                'oxygen_saturation' => $vitalSigns['oxygen_saturation'],
                'weight' => $vitalSigns['weight'],
                'height' => $vitalSigns['height'],
            ]);
            
            // Property: When consultation data is loaded, it should include all vital signs
            // We verify this by loading the appointment and checking that all vital sign fields
            // are accessible and contain the expected values
            $loadedAppointment = OpdAppointment::with(['patient', 'physician'])->find($appointment->id);
            
            $this->assertNotNull(
                $loadedAppointment,
                "Property violated: Consultation data should be loadable"
            );
            
            // Verify all vital signs are present and accessible
            $this->assertNotNull(
                $loadedAppointment->temperature,
                "Property violated: Consultation data should include temperature for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['temperature'],
                $loadedAppointment->temperature,
                "Property violated: Temperature should match the stored value"
            );
            
            $this->assertNotNull(
                $loadedAppointment->blood_pressure,
                "Property violated: Consultation data should include blood pressure for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['blood_pressure'],
                $loadedAppointment->blood_pressure,
                "Property violated: Blood pressure should match the stored value"
            );
            
            $this->assertNotNull(
                $loadedAppointment->heart_rate,
                "Property violated: Consultation data should include heart rate for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['heart_rate'],
                $loadedAppointment->heart_rate,
                "Property violated: Heart rate should match the stored value"
            );
            
            $this->assertNotNull(
                $loadedAppointment->respiratory_rate,
                "Property violated: Consultation data should include respiratory rate for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['respiratory_rate'],
                $loadedAppointment->respiratory_rate,
                "Property violated: Respiratory rate should match the stored value"
            );
            
            $this->assertNotNull(
                $loadedAppointment->oxygen_saturation,
                "Property violated: Consultation data should include oxygen saturation for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['oxygen_saturation'],
                $loadedAppointment->oxygen_saturation,
                "Property violated: Oxygen saturation should match the stored value"
            );
            
            // Verify weight and height are also accessible
            $this->assertNotNull(
                $loadedAppointment->weight,
                "Property violated: Consultation data should include weight for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['weight'],
                $loadedAppointment->weight,
                "Property violated: Weight should match the stored value"
            );
            
            $this->assertNotNull(
                $loadedAppointment->height,
                "Property violated: Consultation data should include height for vitals widget"
            );
            
            $this->assertEquals(
                $vitalSigns['height'],
                $loadedAppointment->height,
                "Property violated: Height should match the stored value"
            );
        }
    }

    // Helper methods for generating random test data

    /**
     * Generate random vital signs within realistic medical ranges
     */
    private function generateRandomVitalSigns(): array
    {
        return [
            'temperature' => $this->randomTemperature(),
            'blood_pressure' => $this->randomBloodPressure(),
            'heart_rate' => rand(50, 150),
            'respiratory_rate' => rand(12, 30),
            'oxygen_saturation' => rand(85, 100),
            'weight' => rand(40, 150),
            'height' => rand(140, 200),
        ];
    }

    /**
     * Generate random temperature in Celsius (realistic range)
     */
    private function randomTemperature(): float
    {
        return round(rand(350, 420) / 10, 1); // 35.0 to 42.0
    }

    /**
     * Generate random blood pressure reading
     */
    private function randomBloodPressure(): string
    {
        $systolic = rand(90, 180);
        $diastolic = rand(60, 120);
        return "{$systolic}/{$diastolic}";
    }

    /**
     * Generate random appointment status
     */
    private function randomAppointmentStatus(): string
    {
        $statuses = ['WAITING', 'IN_PROGRESS', 'COMPLETED'];
        return $statuses[array_rand($statuses)];
    }
}
