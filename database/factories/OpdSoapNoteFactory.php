<?php

namespace Database\Factories;

use App\Models\OpdSoapNote;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OpdSoapNoteFactory extends Factory
{
    protected $model = OpdSoapNote::class;

    public function definition(): array
    {
        return [
            'appointment_id' => OpdAppointment::factory(),
            'patient_id' => Patient::factory(),
            'doctor_id' => User::factory(),
            'subjective' => $this->faker->paragraph(3),
            'objective' => $this->faker->paragraph(2),
            'assessment' => $this->faker->paragraph(2),
            'plan' => $this->faker->paragraph(2),
            'blood_pressure' => $this->faker->randomElement(['120/80', '130/85', '140/90', '110/70']),
            'temperature' => $this->faker->randomFloat(1, 36.0, 39.5),
            'pulse_rate' => $this->faker->numberBetween(60, 100),
            'respiratory_rate' => $this->faker->numberBetween(12, 20),
            'weight' => $this->faker->randomFloat(2, 40.0, 120.0),
            'height' => $this->faker->randomFloat(2, 140.0, 200.0),
            'bmi' => null, // Will be calculated
            'oxygen_saturation' => $this->faker->numberBetween(95, 100),
            'physical_examination' => $this->faker->optional(0.8)->paragraph(),
            'investigations_ordered' => $this->faker->optional(0.6)->sentence(),
            'medications_prescribed' => $this->faker->optional(0.7)->sentence(),
            'follow_up_instructions' => $this->faker->optional(0.5)->sentence(),
            'next_visit_date' => $this->faker->optional(0.4)->dateTimeBetween('+1 week', '+3 months'),
            'is_draft' => $this->faker->boolean(30), // 30% chance of being draft
            'completed_at' => null,
        ];
    }

    /**
     * Configure the model factory.
     */
    public function configure(): static
    {
        return $this->afterMaking(function (OpdSoapNote $soapNote) {
            // Calculate BMI if weight and height are present
            if ($soapNote->weight && $soapNote->height) {
                $heightInMeters = $soapNote->height / 100;
                $soapNote->bmi = round($soapNote->weight / ($heightInMeters * $heightInMeters), 1);
            }
        });
    }

    /**
     * Indicate that the SOAP note is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_draft' => true,
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the SOAP note is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_draft' => false,
            'completed_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
        ]);
    }

    /**
     * Indicate that the patient has normal vital signs.
     */
    public function normalVitals(): static
    {
        return $this->state(fn (array $attributes) => [
            'blood_pressure' => '120/80',
            'temperature' => 37.0,
            'pulse_rate' => 72,
            'respiratory_rate' => 16,
            'oxygen_saturation' => 98,
        ]);
    }

    /**
     * Indicate that the patient has abnormal vital signs.
     */
    public function abnormalVitals(): static
    {
        return $this->state(fn (array $attributes) => [
            'blood_pressure' => '160/100',
            'temperature' => 38.5,
            'pulse_rate' => 110,
            'respiratory_rate' => 24,
            'oxygen_saturation' => 94,
        ]);
    }

    /**
     * Indicate that the SOAP note has complete sections.
     */
    public function complete(): static
    {
        return $this->state(fn (array $attributes) => [
            'subjective' => 'Patient complains of headache and fever for 2 days. No nausea or vomiting.',
            'objective' => 'Patient appears unwell. Temperature elevated. No obvious distress.',
            'assessment' => 'Likely viral syndrome. Rule out bacterial infection.',
            'plan' => 'Symptomatic treatment. Return if symptoms worsen. Follow up in 3 days.',
            'physical_examination' => 'General examination normal. No focal neurological signs.',
            'investigations_ordered' => 'Complete blood count, malaria test',
            'medications_prescribed' => 'Paracetamol 500mg TDS, ORS as needed',
            'follow_up_instructions' => 'Return if fever persists beyond 3 days',
        ]);
    }
}