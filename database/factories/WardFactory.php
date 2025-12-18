<?php

namespace Database\Factories;

use App\Models\Ward;
use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;

class WardFactory extends Factory
{
    protected $model = Ward::class;

    public function definition(): array
    {
        return [
            'wardid' => 'WARD' . $this->faker->unique()->numberBetween(1000, 9999),
            'name' => $this->faker->words(2, true) . ' Ward',
            'code' => 'W' . $this->faker->unique()->numberBetween(1000, 9999),
            'department_id' => Department::factory(),
            'ward_type' => $this->faker->randomElement(['GENERAL', 'ICU', 'MATERNITY', 'PEDIATRIC', 'ISOLATION', 'PRIVATE']),
            'total_beds' => $this->faker->numberBetween(10, 50),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}