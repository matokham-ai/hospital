<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AppointmentCreationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_automatically_generates_appointment_number_when_creating_appointment()
    {
        // Create required dependencies
        $patient = Patient::factory()->create();
        $physician = Physician::factory()->create();
        $department = Department::factory()->create();

        // Create appointment without providing appointment_number
        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'physician_id' => $physician->physician_code,
            'department_id' => $department->deptid,
            'appointment_date' => today(),
            'appointment_time' => '15:30',
            'appointment_notes' => 'Test appointment',
            'status' => 'SCHEDULED',
            'created_by' => 'system'
        ]);

        // Assert that appointment_number was automatically generated
        $this->assertNotNull($appointment->appointment_number);
        $this->assertStringStartsWith('APT' . today()->format('Ymd'), $appointment->appointment_number);
        
        // Assert the appointment was saved to database
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'appointment_number' => $appointment->appointment_number,
            'patient_id' => $patient->id
        ]);
    }

    /** @test */
    public function it_generates_unique_appointment_numbers_for_same_day()
    {
        $patient = Patient::factory()->create();
        $physician = Physician::factory()->create();
        $department = Department::factory()->create();

        // Create first appointment
        $appointment1 = Appointment::create([
            'patient_id' => $patient->id,
            'physician_id' => $physician->physician_code,
            'department_id' => $department->deptid,
            'appointment_date' => today(),
            'appointment_time' => '15:30',
            'status' => 'SCHEDULED',
            'created_by' => 'system'
        ]);

        // Create second appointment
        $appointment2 = Appointment::create([
            'patient_id' => $patient->id,
            'physician_id' => $physician->physician_code,
            'department_id' => $department->deptid,
            'appointment_date' => today(),
            'appointment_time' => '16:30',
            'status' => 'SCHEDULED',
            'created_by' => 'system'
        ]);

        // Assert both have different appointment numbers
        $this->assertNotEquals($appointment1->appointment_number, $appointment2->appointment_number);
        
        // Assert they follow the expected pattern
        $expectedPrefix = 'APT' . today()->format('Ymd');
        $this->assertStringStartsWith($expectedPrefix, $appointment1->appointment_number);
        $this->assertStringStartsWith($expectedPrefix, $appointment2->appointment_number);
        
        // Assert the second one has a higher number
        $this->assertStringEndsWith('001', $appointment1->appointment_number);
        $this->assertStringEndsWith('002', $appointment2->appointment_number);
    }
}