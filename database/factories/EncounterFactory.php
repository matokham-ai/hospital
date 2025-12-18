<?php

namespace Database\Factories;

use App\Models\Encounter;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EncounterFactory extends Factory
{
    protected $model = Encounter::class;

    public function definition(): array
    {
        return [
            'patient_id' => Patient::inRandomOrder()->value('id') ?? 1,
            'encounter_number' => strtoupper($this->faker->bothify('ENC###??')),
            'type' => $this->faker->randomElement(['OPD', 'IPD']),
            'status' => $this->faker->randomElement(['ACTIVE', 'COMPLETED']),
            'department_id' => 1,
            'attending_physician_id' => User::inRandomOrder()->value('id') ?? 1,
            'chief_complaint' => $this->faker->sentence(3),
            'admission_datetime' => $this->faker->dateTimeBetween('-10 days', 'now'),
            'discharge_datetime' => null,
        ];
    }
}
