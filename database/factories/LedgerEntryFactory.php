<?php

namespace Database\Factories;

use App\Models\LedgerEntry;
use App\Models\BillingAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LedgerEntryFactory extends Factory
{
    protected $model = LedgerEntry::class;

    public function definition(): array
    {
        return [
            'entry_date' => $this->faker->date(),
            'account_head' => $this->faker->randomElement([
                'Consultation Fees',
                'Pharmacy Sales',
                'Lab Income',
                'Ward Charges',
                'Procedure Fees',
            ]),
            'debit' => 0,
            'credit' => $this->faker->randomFloat(2, 1000, 20000),
            'narration' => $this->faker->sentence(),
            'billing_account_id' => BillingAccount::factory(),
            'created_by' => User::factory(),
        ];
    }
}
