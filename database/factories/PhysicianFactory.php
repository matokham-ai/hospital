<?php

namespace Database\Factories;

use App\Models\Physician;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PhysicianFactory extends Factory
{
    protected $model = Physician::class;

    public function definition(): array
    {
        return [
            'physician_code' => 'PHY' . str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'user_id' => User::factory(),
            'name' => 'Dr. ' . $this->faker->name(),
            'license_number' => 'LIC' . $this->faker->unique()->numberBetween(10000, 99999),
            'specialization' => $this->faker->randomElement([
                'General Medicine',
                'Cardiology',
                'Pediatrics',
                'Orthopedics',
                'Dermatology',
                'Neurology'
            ]),
            'qualification' => $this->faker->randomElement(['MD', 'MBChB', 'DO']),
            'medical_school' => $this->faker->company() . ' Medical School',
            'years_of_experience' => $this->faker->numberBetween(1, 30),
            'is_consultant' => $this->faker->boolean(30),
            'bio' => $this->faker->paragraph(),
        ];
    }
}