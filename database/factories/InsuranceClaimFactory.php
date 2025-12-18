<?php

namespace Database\Factories;

use App\Models\InsuranceClaim;
use App\Models\BillingAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InsuranceClaimFactory extends Factory
{
    protected $model = InsuranceClaim::class;

    public function definition(): array
    {
        return [
            'billing_account_id' => BillingAccount::factory(),
            'insurer_name' => $this->faker->randomElement(['NHIF', 'Britam', 'Jubilee', 'CIC', 'APA']),
            'policy_number' => strtoupper($this->faker->bothify('POL###??')),
            'claim_number' => strtoupper($this->faker->bothify('CLM###??')),
            'claim_status' => $this->faker->randomElement(['PENDING', 'APPROVED', 'REJECTED', 'PAID']),
            'claim_amount' => $this->faker->randomFloat(2, 2000, 50000),
            'submitted_date' => $this->faker->dateTimeBetween('-15 days', 'now'),
            'submitted_by' => User::factory(),
            'remarks' => $this->faker->sentence(),
        ];
    }
}
