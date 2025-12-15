<?php

namespace Database\Factories;

use App\Models\Deposit;
use App\Models\Encounter;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepositFactory extends Factory
{
    protected $model = Deposit::class;

    public function definition(): array
    {
		return [
		    'encounter_id' => \App\Models\Encounter::inRandomOrder()->value('id') ?? 1,
		    'amount' => $this->faker->randomFloat(2, 500, 10000),
		    'mode' => $this->faker->randomElement(['CASH', 'MPESA', 'CARD', 'BANK']),
		    'reference_no' => strtoupper($this->faker->bothify('REF###??')),
		    'deposit_date' => $this->faker->dateTimeBetween('-10 days', 'now'),
		    'received_by' => \App\Models\User::inRandomOrder()->value('id') ?? 1,
		    'remarks' => $this->faker->sentence(),
		];

    }
}
