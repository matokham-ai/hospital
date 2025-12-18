<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Deposit;
use App\Models\InsuranceClaim;
use App\Models\LedgerEntry;

class AccountingSeeder extends Seeder
{
    public function run(): void
    {
        // Create 20 inpatient deposits
        Deposit::factory(20)->create();

        // Create 15 insurance claims
        InsuranceClaim::factory(15)->create();

        // Create 30 ledger entries
        LedgerEntry::factory(30)->create();
    }
}
