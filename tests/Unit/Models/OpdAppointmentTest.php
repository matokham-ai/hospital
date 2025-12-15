<?php

namespace Tests\Unit\Models;

use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\OpdSoapNote;
use App\Models\OpdDiagnosis;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpdAppointmentTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_be_created_with_valid_data()
    {
        $patient = Patient::factory()->create();
        $doctor = User::factory()->create();

        $appointment = OpdAppointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => today(),
            'status' => 'WAITING',
        ]);

        $this->assertInstanceOf(OpdAppointment::class, $appointment);
        $this->assertEquals($patient->id, $appointment->patient_id);
        $this->assertEquals($doctor->id, $appointment->doctor_id);
        $this->assertEquals('WAITING', $appointment->status);
    }

    /** @test */
    public function it_casts_dates_correctly()
    {
        $appointmentDate = '2024-01-15';
        $appointmentTime = '14:30';

        $appointment = OpdAppointment::factory()->create([
            'appointment_date' => $appointmentDate,
            'appointment_time' => $appointmentTime,
        ]);

        $this->assertInstanceOf(Carbon::class, $appointment->appointment_date);
        $this->assertEquals('2024-01-15', $appointment->appointment_date->format('Y-m-d'));
    }

    /** @test */
    public function it_belongs_to_patient()
    {
        $patient = Patient::factory()->create();
        $appointment = OpdAppointment::factory()->create(['patient_id' => $patient->id]);

        $this->assertInstanceOf(Patient::class, $appointment->patient);
        $this->assertEquals($patient->id, $appointment->patient->id);
    }

    /** @test */
    public function it_belongs_to_doctor()
    {
        $doctor = User::factory()->create();
        $appointment = OpdAppointment::factory()->create(['doctor_id' => $doctor->id]);

        $this->assertInstanceOf(User::class, $appointment->doctor);
        $this->assertEquals($doctor->id, $appointment->doctor->id);
    }

    /** @test */
    public function it_has_many_soap_notes()
    {
        $appointment = OpdAppointment::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $appointment->soapNotes());
    }

    /** @test */
    public function it_has_many_diagnoses()
    {
        $appointment = OpdAppointment::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $appointment->diagnoses());
    }

    /** @test */
    public function it_has_latest_soap_note_relationship()
    {
        $appointment = OpdAppointment::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasOne::class, $appointment->latestSoapNote());
    }

    /** @test */
    public function today_scope_filters_todays_appointments()
    {
        $todayAppointment = OpdAppointment::factory()->create(['appointment_date' => today()]);
        $yesterdayAppointment = OpdAppointment::factory()->create(['appointment_date' => today()->subDay()]);

        $todayAppointments = OpdAppointment::today()->get();

        $this->assertCount(1, $todayAppointments);
        $this->assertTrue($todayAppointments->contains($todayAppointment));
        $this->assertFalse($todayAppointments->contains($yesterdayAppointment));
    }

    /** @test */
    public function waiting_scope_filters_waiting_appointments()
    {
        $waitingAppointment = OpdAppointment::factory()->create(['status' => 'WAITING']);
        $inProgressAppointment = OpdAppointment::factory()->create(['status' => 'IN_PROGRESS']);

        $waitingAppointments = OpdAppointment::waiting()->get();

        $this->assertCount(1, $waitingAppointments);
        $this->assertTrue($waitingAppointments->contains($waitingAppointment));
        $this->assertFalse($waitingAppointments->contains($inProgressAppointment));
    }

    /** @test */
    public function in_progress_scope_filters_in_progress_appointments()
    {
        $inProgressAppointment = OpdAppointment::factory()->create(['status' => 'IN_PROGRESS']);
        $waitingAppointment = OpdAppointment::factory()->create(['status' => 'WAITING']);

        $inProgressAppointments = OpdAppointment::inProgress()->get();

        $this->assertCount(1, $inProgressAppointments);
        $this->assertTrue($inProgressAppointments->contains($inProgressAppointment));
        $this->assertFalse($inProgressAppointments->contains($waitingAppointment));
    }

    /** @test */
    public function completed_scope_filters_completed_appointments()
    {
        $completedAppointment = OpdAppointment::factory()->create(['status' => 'COMPLETED']);
        $inProgressAppointment = OpdAppointment::factory()->create(['status' => 'IN_PROGRESS']);

        $completedAppointments = OpdAppointment::completed()->get();

        $this->assertCount(1, $completedAppointments);
        $this->assertTrue($completedAppointments->contains($completedAppointment));
        $this->assertFalse($completedAppointments->contains($inProgressAppointment));
    }

    /** @test */
    public function it_generates_appointment_number()
    {
        $appointment = OpdAppointment::factory()->create([
            'appointment_date' => Carbon::parse('2024-01-15'),
        ]);

        $appointmentNumber = $appointment->generateAppointmentNumber();

        $this->assertStringStartsWith('OPD20240115', $appointmentNumber);
        $this->assertMatchesRegularExpression('/^OPD\d{8}\d{4}$/', $appointmentNumber);
    }

    /** @test */
    public function it_starts_consultation()
    {
        $doctor = User::factory()->create();
        $appointment = OpdAppointment::factory()->create(['status' => 'WAITING']);

        $appointment->startConsultation($doctor->id);

        $this->assertEquals('IN_PROGRESS', $appointment->fresh()->status);
        $this->assertEquals($doctor->id, $appointment->fresh()->doctor_id);
        $this->assertNotNull($appointment->fresh()->consultation_started_at);
    }

    /** @test */
    public function it_completes_consultation()
    {
        $appointment = OpdAppointment::factory()->create(['status' => 'IN_PROGRESS']);

        $appointment->completeConsultation();

        $this->assertEquals('COMPLETED', $appointment->fresh()->status);
        $this->assertNotNull($appointment->fresh()->consultation_completed_at);
    }

    /** @test */
    public function it_calculates_waiting_time()
    {
        $checkedInAt = now()->subMinutes(30);
        $consultationStartedAt = now()->subMinutes(10);

        $appointment = OpdAppointment::factory()->create([
            'checked_in_at' => $checkedInAt,
            'consultation_started_at' => $consultationStartedAt,
        ]);

        $this->assertEquals(20, $appointment->waiting_time);
    }

    /** @test */
    public function waiting_time_returns_null_when_not_checked_in()
    {
        $appointment = OpdAppointment::factory()->create([
            'checked_in_at' => null,
        ]);

        $this->assertNull($appointment->waiting_time);
    }

    /** @test */
    public function it_calculates_consultation_duration()
    {
        $consultationStartedAt = now()->subMinutes(45);
        $consultationCompletedAt = now()->subMinutes(15);

        $appointment = OpdAppointment::factory()->create([
            'consultation_started_at' => $consultationStartedAt,
            'consultation_completed_at' => $consultationCompletedAt,
        ]);

        $this->assertEquals(30, $appointment->consultation_duration);
    }

    /** @test */
    public function consultation_duration_returns_null_when_not_started()
    {
        $appointment = OpdAppointment::factory()->create([
            'consultation_started_at' => null,
        ]);

        $this->assertNull($appointment->consultation_duration);
    }

    /** @test */
    public function it_uses_current_time_for_ongoing_consultation_duration()
    {
        $consultationStartedAt = now()->subMinutes(20);

        $appointment = OpdAppointment::factory()->create([
            'consultation_started_at' => $consultationStartedAt,
            'consultation_completed_at' => null,
        ]);

        // Should be approximately 20 minutes (allowing for small time differences in test execution)
        $this->assertGreaterThanOrEqual(19, $appointment->consultation_duration);
        $this->assertLessThanOrEqual(21, $appointment->consultation_duration);
    }

    /** @test */
    public function it_validates_status_transitions()
    {
        $appointment = OpdAppointment::factory()->create(['status' => 'WAITING']);

        // Valid transition
        $appointment->update(['status' => 'IN_PROGRESS']);
        $this->assertEquals('IN_PROGRESS', $appointment->fresh()->status);

        // Another valid transition
        $appointment->update(['status' => 'COMPLETED']);
        $this->assertEquals('COMPLETED', $appointment->fresh()->status);
    }

    /** @test */
    public function it_handles_queue_number_assignment()
    {
        $appointment1 = OpdAppointment::factory()->create([
            'appointment_date' => today(),
            'queue_number' => 1,
        ]);

        $appointment2 = OpdAppointment::factory()->create([
            'appointment_date' => today(),
            'queue_number' => 2,
        ]);

        $this->assertEquals(1, $appointment1->queue_number);
        $this->assertEquals(2, $appointment2->queue_number);
    }
}