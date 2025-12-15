<?php

namespace Database\Factories;

use App\Models\DrugFormulary;
use Illuminate\Database\Eloquent\Factories\Factory;
use Carbon\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DrugFormulary>
 */
class DrugFormularyFactory extends Factory
{
    protected $model = DrugFormulary::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other'];
        $formulations = ['immediate-release', 'extended-release', 'delayed-release', 'enteric-coated', 'sugar-free', 'preservative-free'];
        $therapeuticClasses = ['Antibiotics', 'Analgesics', 'Antidiabetics', 'Antihypertensives', 'NSAIDs', 'Proton Pump Inhibitors', 'Bronchodilators', 'Antitussives', 'Corticosteroids', 'Ophthalmics'];
        
        $unitPrice = $this->faker->randomFloat(2, 650, 26000); // KES 650 to KES 26,000
        $costPrice = $unitPrice * $this->faker->randomFloat(2, 0.6, 0.8); // Cost is 60-80% of unit price
        
        return [
            'name' => $this->faker->words(2, true),
            'generic_name' => $this->faker->words(2, true),
            'brand_name' => $this->faker->optional(0.7)->company(),
            'atc_code' => $this->faker->optional(0.8)->regexify('[A-Z][0-9]{2}[A-Z]{2}[0-9]{2}'),
            'therapeutic_class' => $this->faker->randomElement($therapeuticClasses),
            'strength' => $this->faker->randomElement(['5mg', '10mg', '25mg', '50mg', '100mg', '250mg', '500mg', '1g', '2.5ml', '5ml']),
            'form' => $this->faker->randomElement($forms),
            'formulation' => $this->faker->optional(0.6)->randomElement($formulations),
            'dosage_form_details' => $this->faker->optional(0.5)->sentence(4),
            'stock_quantity' => $this->faker->numberBetween(0, 500),
            'reorder_level' => $this->faker->numberBetween(10, 50),
            'unit_price' => $unitPrice,
            'cost_price' => $costPrice,
            'manufacturer' => $this->faker->company(),
            'batch_number' => $this->faker->regexify('[A-Z]{3}[0-9]{7}'),
            'expiry_date' => $this->faker->dateTimeBetween('now', '+3 years'),
            'storage_conditions' => $this->faker->optional(0.7)->randomElement([
                'Store below 25°C',
                'Store below 30°C, dry place',
                'Refrigerate 2-8°C',
                'Store at room temperature',
                'Protect from light and moisture'
            ]),
            'status' => $this->faker->randomElement(['active', 'discontinued']),
            'requires_prescription' => $this->faker->boolean(0.7),
            'notes' => $this->faker->optional(0.6)->sentence(),
            'contraindications' => $this->faker->optional(0.5)->randomElements([
                'Pregnancy', 'Breastfeeding', 'Liver disease', 'Kidney disease', 
                'Heart disease', 'Allergic reactions', 'Children under 12'
            ], $this->faker->numberBetween(1, 3)),
            'side_effects' => $this->faker->optional(0.6)->randomElements([
                'Nausea', 'Dizziness', 'Headache', 'Drowsiness', 'Dry mouth',
                'Constipation', 'Diarrhea', 'Skin rash', 'Fatigue'
            ], $this->faker->numberBetween(1, 4)),
        ];
    }

    /**
     * Indicate that the drug is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }

    /**
     * Indicate that the drug is low stock.
     */
    public function lowStock(): static
    {
        return $this->state(function (array $attributes) {
            $reorderLevel = $attributes['reorder_level'] ?? 20;
            return [
                'stock_quantity' => $this->faker->numberBetween(1, $reorderLevel),
            ];
        });
    }

    /**
     * Indicate that the drug is near expiry.
     */
    public function nearExpiry(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => $this->faker->dateTimeBetween('now', '+90 days'),
        ]);
    }

    /**
     * Indicate that the drug is expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ]);
    }

    /**
     * Indicate that the drug is discontinued.
     */
    public function discontinued(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'discontinued',
        ]);
    }

    /**
     * Indicate that the drug doesn't require prescription.
     */
    public function overTheCounter(): static
    {
        return $this->state(fn (array $attributes) => [
            'requires_prescription' => false,
        ]);
    }
}