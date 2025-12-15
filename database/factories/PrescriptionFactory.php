<?php

namespace Database\Factories;

use App\Models\Prescription;
use App\Models\Patient;
use App\Models\DrugFormulary;
use App\Models\OpdAppointment;
use App\Models\Physician;
use Illuminate\Database\Eloquent\Factories\Factory;

class PrescriptionFactory extends Factory
{
    protected $model = Prescription::class;

    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'encounter_id' => OpdAppointment::factory(),
            'physician_id' => Physician::factory(),
            'drug_id' => DrugFormulary::factory(),
            'drug_name' => $this->faker->words(3, true),
            'dosage' => $this->faker->randomElement(['500mg', '250mg', '100mg', '10mg']),
            'frequency' => $this->faker->randomElement(['Once daily', 'Twice daily', 'Three times daily']),
            'duration' => $this->faker->numberBetween(3, 14),
            'quantity' => $this->faker->numberBetween(10, 100),
            'notes' => $this->faker->sentence(),
            'status' => 'pending',
            'instant_dispensing' => false,
            'stock_reserved' => false,
            'stock_reserved_at' => null,
        ];
    }

    public function instantDispensing(): static
    {
        return $this->state(fn (array $attributes) => [
            'instant_dispensing' => true,
            'stock_reserved' => true,
            'stock_reserved_at' => now(),
        ]);
    }

    public function withStockReserved(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_reserved' => true,
            'stock_reserved_at' => now(),
        ]);
    }
}
