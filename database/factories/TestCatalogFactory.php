<?php

namespace Database\Factories;

use App\Models\TestCatalog;
use App\Models\Department;
use App\Models\TestCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class TestCatalogFactory extends Factory
{
    protected $model = TestCatalog::class;

    public function definition(): array
    {
        $testNames = [
            'Complete Blood Count',
            'Liver Function Test',
            'Kidney Function Test',
            'Lipid Profile',
            'Thyroid Function Test',
            'Blood Sugar Test',
            'Hemoglobin A1C',
            'Urine Analysis',
            'Chest X-Ray',
            'ECG',
            'Echocardiogram',
            'CT Scan',
            'MRI Scan',
            'Ultrasound'
        ];

        return [
            'name' => $this->faker->randomElement($testNames),
            'code' => $this->faker->unique()->regexify('[A-Z]{3}[0-9]{3}'),
            'deptid' => Department::factory(),
            'category_id' => TestCategory::factory(),
            'price' => $this->faker->randomFloat(2, 50, 500),
            'turnaround_time' => $this->faker->numberBetween(1, 72),
            'unit' => $this->faker->randomElement(['hours', 'days']),
            'sample_type' => $this->faker->randomElement(['blood', 'urine', 'stool', 'saliva', 'tissue']),
            'normal_range' => $this->faker->optional()->regexify('[0-9]{1,3}-[0-9]{1,3} [a-z]{2,5}'),
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    public function bloodTest(): static
    {
        return $this->state(fn (array $attributes) => [
            'sample_type' => 'blood',
            'turnaround_time' => $this->faker->numberBetween(2, 24),
            'unit' => 'hours',
        ]);
    }

    public function imagingTest(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => $this->faker->randomElement(['X-Ray', 'CT Scan', 'MRI', 'Ultrasound']),
            'sample_type' => 'imaging',
            'turnaround_time' => $this->faker->numberBetween(1, 4),
            'unit' => 'hours',
            'price' => $this->faker->randomFloat(2, 200, 1000),
        ]);
    }
}