<?php

namespace Database\Factories;

use App\Models\BillingAccount;
use App\Models\Patient;
use App\Models\Encounter;
use Illuminate\Database\Eloquent\Factories\Factory;

class BillingAccountFactory extends Factory
{
    protected $model = BillingAccount::class;

    public function definition(): array
    {
        $totalAmount = $this->faker->randomFloat(2, 1000, 25000);
        $amountPaid = $this->faker->randomFloat(2, 0, $totalAmount);
        $balance = $totalAmount - $amountPaid;

        return [
            'account_no' => strtoupper($this->faker->bothify('BA###??')),
            'patient_id' => Patient::factory(),
            'encounter_id' => Encounter::factory(),
            'status' => $this->faker->randomElement(['open', 'closed', 'discharged']),
            'total_amount' => $totalAmount,
            'amount_paid' => $amountPaid,
            'balance' => $balance,
        ];
    }

    public function closed(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'closed',
                'amount_paid' => $attributes['total_amount'],
                'balance' => 0,
            ];
        });
    }

    public function open(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'open',
                'amount_paid' => 0,
                'balance' => $attributes['total_amount'],
            ];
        });
    }
}