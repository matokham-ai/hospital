<?php

namespace Database\Factories;

use App\Models\Icd10Code;
use Illuminate\Database\Eloquent\Factories\Factory;

class Icd10CodeFactory extends Factory
{
    protected $model = Icd10Code::class;

    public function definition(): array
    {
        // Generate unique ICD-10 codes
        $categories = [
            'Respiratory' => ['Upper respiratory infections', 'Lower respiratory infections', 'Chronic respiratory diseases'],
            'Circulatory' => ['Hypertensive diseases', 'Ischemic heart diseases', 'Cerebrovascular diseases'],
            'Digestive' => ['Intestinal disorders', 'Liver diseases', 'Gastric disorders'],
            'Endocrine' => ['Diabetes mellitus', 'Thyroid disorders', 'Metabolic disorders'],
            'Musculoskeletal' => ['Joint disorders', 'Soft tissue disorders', 'Bone diseases'],
            'Genitourinary' => ['Urinary tract infections', 'Kidney diseases', 'Reproductive disorders'],
            'Symptoms' => ['General symptoms', 'Respiratory symptoms', 'Neurological symptoms'],
            'Health status' => ['Health examinations', 'Preventive care', 'Follow-up care'],
        ];

        $category = $this->faker->randomElement(array_keys($categories));
        $subcategory = $this->faker->randomElement($categories[$category]);

        // Generate a unique code pattern
        $codePrefix = $this->faker->randomElement(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']);
        $codeNumber = $this->faker->numberBetween(10, 99);
        $codeSuffix = $this->faker->optional(0.5)->numberBetween(0, 9);
        
        $code = $codePrefix . $codeNumber . ($codeSuffix !== null ? '.' . $codeSuffix : '');

        return [
            'code' => $code,
            'description' => $this->faker->sentence(4),
            'category' => $category,
            'subcategory' => $subcategory,
            'usage_count' => $this->faker->numberBetween(0, 100),
            'is_active' => $this->faker->boolean(95), // 95% chance of being active
        ];
    }

    /**
     * Indicate that the ICD-10 code is popular (high usage).
     */
    public function popular(): static
    {
        return $this->state(fn (array $attributes) => [
            'usage_count' => $this->faker->numberBetween(50, 200),
        ]);
    }

    /**
     * Indicate that the ICD-10 code is rarely used.
     */
    public function rare(): static
    {
        return $this->state(fn (array $attributes) => [
            'usage_count' => $this->faker->numberBetween(0, 5),
        ]);
    }

    /**
     * Indicate that the ICD-10 code is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the ICD-10 code is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Create respiratory category codes.
     */
    public function respiratory(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'J' . $this->faker->unique()->numberBetween(10, 99),
            'description' => 'Respiratory condition - ' . $this->faker->words(3, true),
            'category' => 'Respiratory',
            'subcategory' => 'Respiratory disorders',
        ]);
    }

    /**
     * Create cardiovascular category codes.
     */
    public function cardiovascular(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'I' . $this->faker->unique()->numberBetween(10, 99),
            'description' => 'Cardiovascular condition - ' . $this->faker->words(3, true),
            'category' => 'Circulatory',
            'subcategory' => 'Cardiovascular disorders',
        ]);
    }
}