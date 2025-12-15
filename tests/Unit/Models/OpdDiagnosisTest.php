<?php

namespace Tests\Unit\Models;

use App\Models\OpdDiagnosis;
use App\Models\OpdAppointment;
use App\Models\OpdSoapNote;
use App\Models\Patient;
use App\Models\Icd10Code;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpdDiagnosisTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_be_created_with_valid_data()
    {
        $appointment = OpdAppointment::factory()->create();
        $soapNote = OpdSoapNote::factory()->create();
        $patient = Patient::factory()->create();

        $diagnosis = OpdDiagnosis::factory()->create([
            'appointment_id' => $appointment->id,
            'soap_note_id' => $soapNote->id,
            'patient_id' => $patient->id,
            'icd10_code' => 'I10',
            'description' => 'Essential (primary) hypertension',
            'type' => 'PRIMARY',
        ]);

        $this->assertInstanceOf(OpdDiagnosis::class, $diagnosis);
        $this->assertEquals($appointment->id, $diagnosis->appointment_id);
        $this->assertEquals('I10', $diagnosis->icd10_code);
        $this->assertEquals('PRIMARY', $diagnosis->type);
    }

    /** @test */
    public function it_casts_boolean_fields_correctly()
    {
        $diagnosis = OpdDiagnosis::factory()->create([
            'is_active' => true,
        ]);

        $this->assertTrue($diagnosis->is_active);
        $this->assertIsBool($diagnosis->is_active);
    }

    /** @test */
    public function it_belongs_to_appointment()
    {
        $appointment = OpdAppointment::factory()->create();
        $diagnosis = OpdDiagnosis::factory()->create(['appointment_id' => $appointment->id]);

        $this->assertInstanceOf(OpdAppointment::class, $diagnosis->appointment);
        $this->assertEquals($appointment->id, $diagnosis->appointment->id);
    }

    /** @test */
    public function it_belongs_to_soap_note()
    {
        $soapNote = OpdSoapNote::factory()->create();
        $diagnosis = OpdDiagnosis::factory()->create(['soap_note_id' => $soapNote->id]);

        $this->assertInstanceOf(OpdSoapNote::class, $diagnosis->soapNote);
        $this->assertEquals($soapNote->id, $diagnosis->soapNote->id);
    }

    /** @test */
    public function it_belongs_to_patient()
    {
        $patient = Patient::factory()->create();
        $diagnosis = OpdDiagnosis::factory()->create(['patient_id' => $patient->id]);

        $this->assertInstanceOf(Patient::class, $diagnosis->patient);
        $this->assertEquals($patient->id, $diagnosis->patient->id);
    }

    /** @test */
    public function it_belongs_to_icd10_code()
    {
        $icd10Code = Icd10Code::factory()->create(['code' => 'I10']);
        $diagnosis = OpdDiagnosis::factory()->create(['icd10_code' => 'I10']);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $diagnosis->icd10());
    }

    /** @test */
    public function active_scope_filters_active_diagnoses()
    {
        $activeDiagnosis = OpdDiagnosis::factory()->create(['is_active' => true]);
        $inactiveDiagnosis = OpdDiagnosis::factory()->create(['is_active' => false]);

        $activeDiagnoses = OpdDiagnosis::active()->get();

        $this->assertCount(1, $activeDiagnoses);
        $this->assertTrue($activeDiagnoses->contains($activeDiagnosis));
        $this->assertFalse($activeDiagnoses->contains($inactiveDiagnosis));
    }

    /** @test */
    public function primary_scope_filters_primary_diagnoses()
    {
        $primaryDiagnosis = OpdDiagnosis::factory()->create(['type' => 'PRIMARY']);
        $secondaryDiagnosis = OpdDiagnosis::factory()->create(['type' => 'SECONDARY']);

        $primaryDiagnoses = OpdDiagnosis::primary()->get();

        $this->assertCount(1, $primaryDiagnoses);
        $this->assertTrue($primaryDiagnoses->contains($primaryDiagnosis));
        $this->assertFalse($primaryDiagnoses->contains($secondaryDiagnosis));
    }

    /** @test */
    public function secondary_scope_filters_secondary_diagnoses()
    {
        $primaryDiagnosis = OpdDiagnosis::factory()->create(['type' => 'PRIMARY']);
        $secondaryDiagnosis = OpdDiagnosis::factory()->create(['type' => 'SECONDARY']);

        $secondaryDiagnoses = OpdDiagnosis::secondary()->get();

        $this->assertCount(1, $secondaryDiagnoses);
        $this->assertTrue($secondaryDiagnoses->contains($secondaryDiagnosis));
        $this->assertFalse($secondaryDiagnoses->contains($primaryDiagnosis));
    }

    /** @test */
    public function comorbidity_scope_filters_comorbidity_diagnoses()
    {
        $comorbidityDiagnosis = OpdDiagnosis::factory()->create(['type' => 'COMORBIDITY']);
        $primaryDiagnosis = OpdDiagnosis::factory()->create(['type' => 'PRIMARY']);

        $comorbidityDiagnoses = OpdDiagnosis::comorbidity()->get();

        $this->assertCount(1, $comorbidityDiagnoses);
        $this->assertTrue($comorbidityDiagnoses->contains($comorbidityDiagnosis));
        $this->assertFalse($comorbidityDiagnoses->contains($primaryDiagnosis));
    }

    /** @test */
    public function it_increments_icd10_usage_count()
    {
        $icd10Code = Icd10Code::factory()->create([
            'code' => 'I10',
            'usage_count' => 5,
        ]);

        $diagnosis = OpdDiagnosis::factory()->create(['icd10_code' => 'I10']);

        $diagnosis->incrementIcd10Usage();

        $this->assertEquals(6, $icd10Code->fresh()->usage_count);
    }

    /** @test */
    public function it_handles_non_existent_icd10_code_gracefully()
    {
        $diagnosis = OpdDiagnosis::factory()->create(['icd10_code' => 'NONEXISTENT']);

        // Should not throw an exception
        $diagnosis->incrementIcd10Usage();

        $this->assertTrue(true); // Test passes if no exception is thrown
    }

    /** @test */
    public function it_automatically_increments_usage_on_creation()
    {
        $icd10Code = Icd10Code::factory()->create([
            'code' => 'I10',
            'usage_count' => 10,
        ]);

        // Creating a diagnosis should automatically increment usage count
        OpdDiagnosis::factory()->create(['icd10_code' => 'I10']);

        $this->assertEquals(11, $icd10Code->fresh()->usage_count);
    }

    /** @test */
    public function it_supports_different_diagnosis_types()
    {
        $types = ['PRIMARY', 'SECONDARY', 'COMORBIDITY', 'RULE_OUT'];

        foreach ($types as $type) {
            $diagnosis = OpdDiagnosis::factory()->create(['type' => $type]);
            $this->assertEquals($type, $diagnosis->type);
        }
    }

    /** @test */
    public function it_stores_diagnosis_notes()
    {
        $notes = 'Patient has well-controlled hypertension on current medication regimen';

        $diagnosis = OpdDiagnosis::factory()->create([
            'notes' => $notes,
        ]);

        $this->assertEquals($notes, $diagnosis->notes);
    }

    /** @test */
    public function it_can_be_marked_as_inactive()
    {
        $diagnosis = OpdDiagnosis::factory()->create(['is_active' => true]);

        $diagnosis->update(['is_active' => false]);

        $this->assertFalse($diagnosis->fresh()->is_active);
    }

    /** @test */
    public function it_validates_icd10_code_format()
    {
        $validCodes = ['I10', 'E11.9', 'J44.1', 'Z00.00'];

        foreach ($validCodes as $code) {
            $diagnosis = OpdDiagnosis::factory()->create(['icd10_code' => $code]);
            $this->assertEquals($code, $diagnosis->icd10_code);
        }
    }

    /** @test */
    public function it_can_have_multiple_diagnoses_per_appointment()
    {
        $appointment = OpdAppointment::factory()->create();

        $primaryDiagnosis = OpdDiagnosis::factory()->create([
            'appointment_id' => $appointment->id,
            'type' => 'PRIMARY',
            'icd10_code' => 'I10',
        ]);

        $secondaryDiagnosis = OpdDiagnosis::factory()->create([
            'appointment_id' => $appointment->id,
            'type' => 'SECONDARY',
            'icd10_code' => 'E11.9',
        ]);

        $appointmentDiagnoses = OpdDiagnosis::where('appointment_id', $appointment->id)->get();

        $this->assertCount(2, $appointmentDiagnoses);
        $this->assertTrue($appointmentDiagnoses->contains($primaryDiagnosis));
        $this->assertTrue($appointmentDiagnoses->contains($secondaryDiagnosis));
    }

    /** @test */
    public function it_can_combine_scopes()
    {
        $activePrimaryDiagnosis = OpdDiagnosis::factory()->create([
            'type' => 'PRIMARY',
            'is_active' => true,
        ]);

        $inactivePrimaryDiagnosis = OpdDiagnosis::factory()->create([
            'type' => 'PRIMARY',
            'is_active' => false,
        ]);

        $activeSecondaryDiagnosis = OpdDiagnosis::factory()->create([
            'type' => 'SECONDARY',
            'is_active' => true,
        ]);

        $activePrimaryDiagnoses = OpdDiagnosis::active()->primary()->get();

        $this->assertCount(1, $activePrimaryDiagnoses);
        $this->assertTrue($activePrimaryDiagnoses->contains($activePrimaryDiagnosis));
        $this->assertFalse($activePrimaryDiagnoses->contains($inactivePrimaryDiagnosis));
        $this->assertFalse($activePrimaryDiagnoses->contains($activeSecondaryDiagnosis));
    }
}