<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InsuranceClaim;
use App\Models\BillingAccount;
use App\Models\User;
use Carbon\Carbon;

class InsuranceClaimsSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing billing accounts
        $billingAccounts = BillingAccount::limit(30)->get();
        
        if ($billingAccounts->isEmpty()) {
            $this->command->warn('No billing accounts found.');
            return;
        }

        // Get a user for submitted_by field
        $user = User::first();
        if (!$user) {
            $this->command->warn('No users found.');
            return;
        }

        $this->command->info('Creating insurance claims...');

        // Insurance providers
        $insuranceProviders = [
            'NHIF - National Hospital Insurance Fund',
            'AAR Insurance Kenya',
            'Jubilee Insurance',
            'CIC Insurance Group',
            'Madison Insurance',
            'Heritage Insurance',
            'Britam Insurance',
            'APA Insurance',
            'GA Insurance',
            'Kenindia Assurance'
        ];

        foreach ($billingAccounts as $billingAccount) {
            // Create insurance claim (70% chance)
            if (rand(1, 100) <= 70) {
                $claimAmount = rand(5000, 50000);
                
                InsuranceClaim::create([
                    'billing_account_id' => $billingAccount->id,
                    'insurer_name' => collect($insuranceProviders)->random(),
                    'policy_number' => 'POL-' . rand(100000, 999999),
                    'claim_number' => 'CLM-' . date('Y') . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'claim_status' => collect(['PENDING', 'APPROVED', 'REJECTED', 'PAID'])->random(),
                    'claim_amount' => $claimAmount,
                    'submitted_by' => $user->id,
                    'submitted_date' => Carbon::now()->subDays(rand(1, 30)),
                    'remarks' => collect([
                        'Standard claim submission',
                        'Pre-authorization required',
                        'Emergency treatment claim',
                        'Follow-up treatment',
                        'Specialist consultation claim',
                        'Routine medical examination',
                        'Diagnostic procedures claim'
                    ])->random(),
                ]);
            }
        }

        $claimCount = InsuranceClaim::count();
        $this->command->info("Created {$claimCount} insurance claims successfully!");
    }
}