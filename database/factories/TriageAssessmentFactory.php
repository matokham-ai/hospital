<?php

namespace Database\Factories;

use App\Models\TriageAssessment;
use App\Models\EmergencyPatient;
use Illuminate\Database\Eloquent\Factories\Factory;

class TriageAssessmentFactory extends Factory
{
    protected $model = TriageAssessment::class;

    public function definition(): array
    {
        return [
            'emergency_patient_id' => EmergencyPatient::factory(),
            'triage_category' => fake()->randomElement(['red', 'yellow', 'green', 'black']),
            'temperature' => fake()->randomFloat(1, 35.0, 41.0),
            'blood_pressure' => fake()->numberBetween(90, 180) . '/' . fake()->numberBetween(60, 120),
            'heart_rate' => fake()->numberBetween(50, 150),
            'respiratory_rate' => fake()->numberBetween(12, 30),
            'oxygen_saturation' => fake()->numberBetween(85, 100),
            'gcs_eye' => fake()->numberBetween(1, 4),
            'gcs_verbal' => fake()->numberBetween(1, 5),
            'gcs_motor' => fake()->numberBetween(1, 6),
            'gcs_total' => null, // Will be calculated
            'assessment_notes' => fake()->sentence(),
            'assessed_by' => \App\Models\User::factory(),
            'assessed_at' => now()->subMinutes(rand(1, 60)),
        ];
    }
}
