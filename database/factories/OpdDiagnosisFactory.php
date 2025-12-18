<?php

namespace Database\Factories;

use App\Models\OpdDiagnosis;
use App\Models\OpdAppointment;
use App\Models\OpdSoapNote;
use App\Models\Patient;
use App\Models\Icd10Code;
use Illuminate\Database\Eloquent\Factories\Factory;

class OpdDiagnosisFactory extends Factory
{
    protected $model = OpdDiagnosis::class;

    public function definition(): array
    {
        // Common ICD-10 codes for testing
        $commonCodes = [
            'J00' => 'Acute nasopharyngitis [common cold]',
            'K59.0' => 'Constipation',
            'R50.9' => 'Fever, unspecified',
            'M79.3' => 'Panniculitis, unspecified',
            'I10' => 'Essential (primary) hypertension',
            'E11.9' => 'Type 2 diabetes mellitus without complications',
            'J44.1' => 'Chronic obstructive pulmonary disease with acute exacerbation',
            'N39.0' => 'Urinary tract infection, site not specified',
        ];

        $selectedCode = $this->faker->randomElement(array_keys($commonCodes));

        return [
            'appointment_id' => OpdAppointment::factory(),
            'soap_note_id' => OpdSoapNote::factory(),
            'patient_id' => Patient::factory(),
            'icd10_code' => $selectedCode,
            'description' => $commonCodes[$selectedCode],
            'type' => $this->faker->randomElement(['PRIMARY', 'SECONDARY', 'COMORBIDITY', 'RULE_OUT']),
            'notes' => $this->faker->optional(0.6)->sentence(),
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
        ];
    }

    /**
     * Indicate that the diagnosis is primary.
     */
    public function primary(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'PRIMARY',
        ]);
    }

    /**
     * Indicate that the diagnosis is secondary.
     */
    public function secondary(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'SECONDARY',
        ]);
    }

    /**
     * Indicate that the diagnosis is a comorbidity.
     */
    public function comorbidity(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'COMORBIDITY',
        ]);
    }

    /**
     * Indicate that the diagnosis is rule out.
     */
    public function ruleOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'RULE_OUT',
        ]);
    }

    /**
     * Indicate that the diagnosis is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the diagnosis is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Create a diagnosis for hypertension.
     */
    public function hypertension(): static
    {
        return $this->state(fn (array $attributes) => [
            'icd10_code' => 'I10',
            'description' => 'Essential (primary) hypertension',
            'type' => 'PRIMARY',
        ]);
    }

    /**
     * Create a diagnosis for diabetes.
     */
    public function diabetes(): static
    {
        return $this->state(fn (array $attributes) => [
            'icd10_code' => 'E11.9',
            'description' => 'Type 2 diabetes mellitus without complications',
            'type' => 'COMORBIDITY',
        ]);
    }
}