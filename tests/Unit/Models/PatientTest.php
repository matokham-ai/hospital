<?php

namespace Tests\Unit\Models;

use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Admission;
use App\Models\PatientAddress;
use App\Models\PatientContact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PatientTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_be_created_with_valid_data()
    {
        $patient = Patient::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'gender' => 'M',
        ]);

        $this->assertInstanceOf(Patient::class, $patient);
        $this->assertEquals('John', $patient->first_name);
        $this->assertEquals('Doe', $patient->last_name);
        $this->assertEquals('M', $patient->gender);
    }

    /** @test */
    public function it_uses_string_primary_key()
    {
        $patient = Patient::factory()->create();

        $this->assertIsString($patient->id);
        $this->assertFalse($patient->incrementing);
        $this->assertEquals('string', $patient->getKeyType());
    }

    /** @test */
    public function it_casts_json_fields_correctly()
    {
        $insuranceInfo = ['provider' => 'NHIS', 'policy_number' => 'NHIS-12345678'];
        $allergies = ['Penicillin', 'Aspirin'];
        $chronicConditions = ['Hypertension', 'Diabetes'];
        $alerts = ['High Risk Patient'];

        $patient = Patient::factory()->create([
            'insurance_info' => $insuranceInfo,
            'allergies' => $allergies,
            'chronic_conditions' => $chronicConditions,
            'alerts' => $alerts,
        ]);

        $this->assertEquals($insuranceInfo, $patient->insurance_info);
        $this->assertEquals($allergies, $patient->allergies);
        $this->assertEquals($chronicConditions, $patient->chronic_conditions);
        $this->assertEquals($alerts, $patient->alerts);
    }

    /** @test */
    public function it_has_name_accessor()
    {
        $patient = Patient::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $this->assertEquals('John Doe', $patient->name);
    }

    /** @test */
    public function name_accessor_handles_empty_middle_name()
    {
        $patient = Patient::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'middle_name' => null,
        ]);

        $this->assertEquals('John Doe', $patient->name);
    }

    /** @test */
    public function it_has_addresses_relationship()
    {
        $patient = Patient::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $patient->addresses());
    }

    /** @test */
    public function it_has_contacts_relationship()
    {
        $patient = Patient::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $patient->contacts());
    }

    /** @test */
    public function it_has_encounters_relationship()
    {
        $patient = Patient::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $patient->encounters());
    }

    /** @test */
    public function it_has_latest_encounter_relationship()
    {
        $patient = Patient::factory()->create();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasOne::class, $patient->latestEncounter());
    }



    /** @test */
    public function it_uses_soft_deletes()
    {
        $patient = Patient::factory()->create();
        $patientId = $patient->id;

        $patient->delete();

        $this->assertSoftDeleted('patients', ['id' => $patientId]);
        $this->assertNotNull($patient->fresh()->deleted_at);
    }

    /** @test */
    public function it_can_be_restored_after_soft_delete()
    {
        $patient = Patient::factory()->create();
        $patient->delete();

        $patient->restore();

        $this->assertNull($patient->fresh()->deleted_at);
        $this->assertDatabaseHas('patients', ['id' => $patient->id]);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Patient::create([
            // Missing required fields should cause database constraint violation
        ]);
    }

    /** @test */
    public function it_handles_empty_json_fields_gracefully()
    {
        $patient = Patient::factory()->create([
            'insurance_info' => null,
            'allergies' => [],
            'chronic_conditions' => [],
            'alerts' => [],
        ]);

        $this->assertNull($patient->insurance_info);
        $this->assertEquals([], $patient->allergies);
        $this->assertEquals([], $patient->chronic_conditions);
        $this->assertEquals([], $patient->alerts);
    }

    /** @test */
    public function it_can_store_complex_insurance_info()
    {
        $complexInsurance = [
            'provider' => 'Private Insurance',
            'policy_number' => 'PI-87654321',
            'coverage_type' => 'Comprehensive',
            'expiry_date' => '2024-12-31',
            'copay_amount' => 50.00,
        ];

        $patient = Patient::factory()->create([
            'insurance_info' => $complexInsurance,
        ]);

        $this->assertEquals($complexInsurance, $patient->insurance_info);
        $this->assertEquals('Private Insurance', $patient->insurance_info['provider']);
        $this->assertEquals(50.00, $patient->insurance_info['copay_amount']);
    }

    /** @test */
    public function it_can_store_multiple_allergies()
    {
        $allergies = ['Penicillin', 'Aspirin', 'Peanuts', 'Shellfish', 'Latex'];

        $patient = Patient::factory()->create([
            'allergies' => $allergies,
        ]);

        $this->assertEquals($allergies, $patient->allergies);
        $this->assertCount(5, $patient->allergies);
        $this->assertContains('Penicillin', $patient->allergies);
    }

    /** @test */
    public function it_can_store_multiple_chronic_conditions()
    {
        $conditions = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Arthritis'];

        $patient = Patient::factory()->create([
            'chronic_conditions' => $conditions,
        ]);

        $this->assertEquals($conditions, $patient->chronic_conditions);
        $this->assertCount(4, $patient->chronic_conditions);
        $this->assertContains('Type 2 Diabetes', $patient->chronic_conditions);
    }
}