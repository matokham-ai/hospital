<?php

namespace Database\Factories;

use App\Models\DrugSubstitute;
use App\Models\DrugFormulary;
use Illuminate\Database\Eloquent\Factories\Factory;

class DrugSubstituteFactory extends Factory
{
    protected $model = DrugSubstitute::class;

    public function definition(): array
    {
        return [
            'drug_id' => DrugFormulary::factory(),
            'substitute_drug_id' => DrugFormulary::factory(),
            'substitution_reason' => $this->faker->randomElement([
                'Generic alternative',
                'Lower cost option',
                'Better availability',
                'Reduced side effects',
                'Same therapeutic effect'
            ]),
            'is_preferred' => $this->faker->boolean(30), // 30% chance of being preferred
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function preferred(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_preferred' => true,
        ]);
    }
}