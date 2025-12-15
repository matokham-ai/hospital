<?php

namespace Database\Factories;

use App\Models\TestCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class TestCategoryFactory extends Factory
{
    protected $model = TestCategory::class;

    public function definition(): array
    {
        $categories = [
            'Hematology',
            'Biochemistry',
            'Microbiology',
            'Immunology',
            'Pathology',
            'Radiology',
            'Cardiology',
            'Endocrinology',
            'Nephrology',
            'Hepatology',
            'Oncology',
            'Neurology',
            'Dermatology',
            'Ophthalmology',
            'Otolaryngology',
            'Gastroenterology',
            'Pulmonology',
            'Rheumatology',
            'Urology',
            'Gynecology'
        ];

        // Generate unique name by appending random suffix if needed
        $baseName = $this->faker->randomElement($categories);
        $name = $baseName . ' ' . $this->faker->unique()->numberBetween(1, 10000);

        return [
            'name' => $name,
            'code' => strtoupper(substr($this->faker->unique()->bothify('??###'), 0, 10)),
            'description' => $this->faker->sentence(),
            'is_active' => $this->faker->boolean(80), // 80% chance of being active
            'sort_order' => $this->faker->numberBetween(1, 100),
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
}