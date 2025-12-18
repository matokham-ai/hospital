<?php

namespace Tests\Unit\Models;

use App\Models\OpdSoapNote;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\OpdDiagnosis;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpdSoapNoteTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_be_created_with_valid_data()
    {
        $appointment = OpdAppointment::factory()->create();
        $patient = Patient::factory()->create();
        $doctor = User::factory()->create();

        $soapNote = OpdSoapNote::factory()->create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'subjective' => 'Patient complains of headache',
            'objective' => 'Patient appears well',
            'assessment' => 'Tension headache',
            'plan' => 'Rest and hydration',
        ]);

        $this->assertInstanceOf(OpdSoapNote::class, $soapNote);
        $this->assertEquals($appointment->id, $soapNote->appointment_id);
        $this->assertEquals('Patient complains of headache', $soapNote->subjective);
    }

    /** @test */
    public function it_casts_numeric_fields_correctly()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'temperature' => 37.5,
            'weight' => 70.25,
            'height' => 175.50,
            'bmi' => 22.9,
            'pulse_rate' => 72,
            'respiratory_rate' => 16,
            'oxygen_saturation' => 98,
        ]);

        $this->assertEquals(37.5, $soapNote->temperature);
        $this->assertEquals(70.25, $soapNote->weight);
        $this->assertEquals(175.50, $soapNote->height);
        $this->assertEquals(22.9, $soapNote->bmi);
        $this->assertEquals(72, $soapNote->pulse_rate);
        $this->assertEquals(16, $soapNote->respiratory_rate);
        $this->assertEquals(98, $soapNote->oxygen_saturation);
    }

    /** @test */
    public function it_casts_boolean_fields_correctly()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'is_draft' => true,
        ]);

        $this->assertTrue($soapNote->is_draft);
        $this->assertIsBool($soapNote->is_draft);
    }

    /** @test */
    public function it_casts_date_fields_correctly()
    {
        $nextVisitDate = '2024-02-15';

        $soapNote = OpdSoapNote::factory()->create([
            'next_visit_date' => $nextVisitDate,
            'completed_at' => now(),
        ]);

        $this->assertInstanceOf(Carbon::class, $soapNote->next_visit_date);
        $this->assertInstanceOf(Carbon::class, $soapNote->completed_at);
        $this->assertEquals('2024-02-15', $soapNote->next_visit_date->format('Y-m-d'));
    }

    /** @test */
    public function it_belongs_to_appointment()
    {
        $appointment = OpdAppointment::factory()->create();
        $soapNote = OpdSoapNote::factory()->create(['appointment_id' => $appointment->id]);

        $this->assertInstanceOf(OpdAppointment::class, $soapNote->appointment);
        $this->assertEquals($appointment->id, $soapNote->appointment->id);
    }

    /** @test */
    public function it_belongs_to_patient()
    {
        $patient = Patient::factory()->create();
        $soapNote = OpdSoapNote::factory()->create(['patient_id' => $patient->id]);

        $this->assertInstanceOf(Patient::class, $soapNote->patient);
        $this->assertEquals($patient->id, $soapNote->patient->id);
    }

    /** @test */
    public function it_belongs_to_doctor()
    {
        $doctor = User::factory()->create();
        $soapNote = OpdSoapNote::factory()->create(['doctor_id' => $doctor->id]);

        $this->assertInstanceOf(User::class, $soapNote->doctor);
        $this->assertEquals($doctor->id, $soapNote->doctor->id);
    }

    /** @test */
    public function it_has_many_diagnoses()
    {
        $soapNote = OpdSoapNote::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $soapNote->diagnoses());
    }

    /** @test */
    public function drafts_scope_filters_draft_notes()
    {
        $draftNote = OpdSoapNote::factory()->create(['is_draft' => true]);
        $completedNote = OpdSoapNote::factory()->create(['is_draft' => false]);

        $draftNotes = OpdSoapNote::drafts()->get();

        $this->assertCount(1, $draftNotes);
        $this->assertTrue($draftNotes->contains($draftNote));
        $this->assertFalse($draftNotes->contains($completedNote));
    }

    /** @test */
    public function completed_scope_filters_completed_notes()
    {
        $draftNote = OpdSoapNote::factory()->create(['is_draft' => true]);
        $completedNote = OpdSoapNote::factory()->create(['is_draft' => false]);

        $completedNotes = OpdSoapNote::completed()->get();

        $this->assertCount(1, $completedNotes);
        $this->assertTrue($completedNotes->contains($completedNote));
        $this->assertFalse($completedNotes->contains($draftNote));
    }

    /** @test */
    public function it_calculates_bmi_correctly()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'weight' => 70.0,
            'height' => 175.0,
            'bmi' => null,
        ]);

        $soapNote->calculateBMI();

        // BMI = weight(kg) / height(m)^2 = 70 / (1.75)^2 = 22.9
        $this->assertEquals(22.9, $soapNote->fresh()->bmi);
    }

    /** @test */
    public function it_does_not_calculate_bmi_without_weight_and_height()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'weight' => null,
            'height' => 175.0,
            'bmi' => null,
        ]);

        $soapNote->calculateBMI();

        $this->assertNull($soapNote->fresh()->bmi);
    }

    /** @test */
    public function it_completes_soap_note()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'is_draft' => true,
            'completed_at' => null,
        ]);

        $soapNote->complete();

        $freshNote = $soapNote->fresh();
        $this->assertFalse($freshNote->is_draft);
        $this->assertNotNull($freshNote->completed_at);
        $this->assertInstanceOf(Carbon::class, $freshNote->completed_at);
    }

    /** @test */
    public function it_returns_vital_signs_as_array()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'blood_pressure' => '120/80',
            'temperature' => 37.0,
            'pulse_rate' => 72,
            'respiratory_rate' => 16,
            'weight' => 70.0,
            'height' => 175.0,
            'bmi' => 22.9,
            'oxygen_saturation' => 98,
        ]);

        $vitalSigns = $soapNote->vital_signs;

        $this->assertIsArray($vitalSigns);
        $this->assertEquals('120/80', $vitalSigns['blood_pressure']);
        $this->assertEquals(37.0, $vitalSigns['temperature']);
        $this->assertEquals(72, $vitalSigns['pulse_rate']);
        $this->assertEquals(16, $vitalSigns['respiratory_rate']);
        $this->assertEquals(70.0, $vitalSigns['weight']);
        $this->assertEquals(175.0, $vitalSigns['height']);
        $this->assertEquals(22.9, $vitalSigns['bmi']);
        $this->assertEquals(98, $vitalSigns['oxygen_saturation']);
    }

    /** @test */
    public function it_handles_null_vital_signs()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'blood_pressure' => null,
            'temperature' => null,
            'pulse_rate' => null,
            'respiratory_rate' => null,
            'weight' => null,
            'height' => null,
            'bmi' => null,
            'oxygen_saturation' => null,
        ]);

        $vitalSigns = $soapNote->vital_signs;

        $this->assertIsArray($vitalSigns);
        $this->assertNull($vitalSigns['blood_pressure']);
        $this->assertNull($vitalSigns['temperature']);
        $this->assertNull($vitalSigns['pulse_rate']);
        $this->assertNull($vitalSigns['respiratory_rate']);
        $this->assertNull($vitalSigns['weight']);
        $this->assertNull($vitalSigns['height']);
        $this->assertNull($vitalSigns['bmi']);
        $this->assertNull($vitalSigns['oxygen_saturation']);
    }

    /** @test */
    public function it_validates_temperature_range()
    {
        $soapNote = OpdSoapNote::factory()->create(['temperature' => 42.0]);
        $this->assertEquals(42.0, $soapNote->temperature);

        $soapNote = OpdSoapNote::factory()->create(['temperature' => 35.0]);
        $this->assertEquals(35.0, $soapNote->temperature);
    }

    /** @test */
    public function it_validates_vital_signs_ranges()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'pulse_rate' => 120,
            'respiratory_rate' => 25,
            'oxygen_saturation' => 95,
        ]);

        $this->assertEquals(120, $soapNote->pulse_rate);
        $this->assertEquals(25, $soapNote->respiratory_rate);
        $this->assertEquals(95, $soapNote->oxygen_saturation);
    }

    /** @test */
    public function it_stores_comprehensive_soap_sections()
    {
        $soapNote = OpdSoapNote::factory()->create([
            'subjective' => 'Patient reports severe headache for 2 days, associated with nausea',
            'objective' => 'BP: 140/90, Temp: 37.2°C, Alert and oriented, no focal neurological deficits',
            'assessment' => 'Tension headache, rule out hypertension',
            'plan' => 'Analgesics, BP monitoring, follow-up in 1 week if symptoms persist',
            'physical_examination' => 'Head and neck examination normal, cardiovascular examination reveals elevated BP',
            'investigations_ordered' => 'Complete blood count, basic metabolic panel',
            'medications_prescribed' => 'Ibuprofen 400mg TDS, Amlodipine 5mg OD',
            'follow_up_instructions' => 'Return if headache worsens or new symptoms develop',
        ]);

        $this->assertStringContains('severe headache', $soapNote->subjective);
        $this->assertStringContains('BP: 140/90', $soapNote->objective);
        $this->assertStringContains('Tension headache', $soapNote->assessment);
        $this->assertStringContains('Analgesics', $soapNote->plan);
        $this->assertStringContains('Head and neck examination', $soapNote->physical_examination);
        $this->assertStringContains('Complete blood count', $soapNote->investigations_ordered);
        $this->assertStringContains('Ibuprofen', $soapNote->medications_prescribed);
        $this->assertStringContains('Return if headache worsens', $soapNote->follow_up_instructions);
    }
}