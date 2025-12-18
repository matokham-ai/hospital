<?php

namespace Database\Factories;

use App\Models\EmergencyPatient;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmergencyPatientFactory extends Factory
{
    protected $model = EmergencyPatient::class;

    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'chief_complaint' => fake()->randomElement([
                'Chest pain',
                'Difficulty breathing',
                'Severe headache',
                'Abdominal pain',
                'Fever',
                'Trauma',
            ]),
            'history_of_present_illness' => fake()->sentence(),
            'arrival_mode' => fake()->randomElement(['ambulance', 'walk-in', 'police', 'helicopter', 'private_vehicle']),
            'arrival_time' => now()->subHours(rand(1, 12)),
            'status' => fake()->randomElement(['waiting', 'in_treatment', 'observation', 'admitted']),
            'assigned_to' => null,
        ];
    }
}
