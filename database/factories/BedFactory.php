<?php

namespace Database\Factories;

use App\Models\Bed;
use App\Models\Ward;
use Illuminate\Database\Eloquent\Factories\Factory;

class BedFactory extends Factory
{
    protected $model = Bed::class;

    public function definition(): array
    {
        return [
            'ward_id' => Ward::factory(),
            'bed_number' => $this->faker->unique()->regexify('[A-Z]{2}-[0-9]{2}'),
            'bed_type' => $this->faker->randomElement(['standard', 'icu', 'isolation', 'maternity', 'pediatric']),
            'status' => $this->faker->randomElement(['available', 'occupied', 'maintenance', 'reserved', 'out_of_order']),
            'last_occupied_at' => $this->faker->optional()->dateTimeBetween('-1 month', 'now'),
            'maintenance_notes' => $this->faker->optional()->sentence(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'available',
            'last_occupied_at' => null,
        ]);
    }

    public function occupied(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'occupied',
            'last_occupied_at' => $this->faker->dateTimeBetween('-1 week', 'now'),
        ]);
    }

    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'maintenance',
            'maintenance_notes' => $this->faker->sentence(),
        ]);
    }
}