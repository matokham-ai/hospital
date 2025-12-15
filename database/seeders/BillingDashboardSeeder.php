<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\BillingAccount;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\User;
use Carbon\Carbon;

class BillingDashboardSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏥 Seeding Billing Dashboard Sample Data...');

        // Ensure we have users and patients
        $users = User::all();
        if ($users->isEmpty()) {
            $this->command->error('No users found. Please run user seeder first.');
            return;
        }

        $patients = Patient::all();
        if ($patients->count() < 20) {
            $this->command->info('Creating additional patients...');
            Patient::factory(30)->create();
            $patients = Patient::all();
        }

        // Clear existing test data
        $this->command->info('Clearing existing billing data...');
        DB::table('payments')->delete();
        DB::table('deposits')->delete();
        DB::table('insurance_claims')->delete();
        DB::table('ledger_entries')->delete();
        DB::table('bill_items')->delete();
        BillingAccount::query()->delete();
        Encounter::query()->delete();

        // Update patients with phone numbers
        $this->updatePatientsWithContactInfo($patients);
        
        // Create encounters for the last 30 days
        $this->createEncounters($patients, $users->first());
        
        // Create billing accounts and items
        $this->createBillingData();
        
        // Create payments
        $this->createPayments();
        
        // Create deposits
        $this->createDeposits();
        
        // Create insurance claims
        $this->createInsuranceClaims();
        
        // Create ledger entries
        $this->createLedgerEntries();

        $this->command->info('✅ Billing Dashboard sample data created successfully!');
    }

    private function updatePatientsWithContactInfo($patients)
    {
        $this->command->info('Updating patients with contact information...');
        
        foreach ($patients as $patient) {
            $patient->update([
                'phone' => '+254' . fake()->numberBetween(700000000, 799999999),
                'email' => fake()->email(),
            ]);
        }
    }

    private function createEncounters($patients, $user)
    {
        $this->command->info('Creating encounters...');
        
        $encounterTypes = ['OPD', 'IPD', 'EMERGENCY'];
        $statuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
        
        for ($i = 0; $i < 50; $i++) {
            $patient = $patients->random();
            $type = fake()->randomElement($encounterTypes);
            $status = fake()->randomElement($statuses);
            
            // Create encounters over the last 30 days
            $createdAt = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23));
            
            Encounter::create([
                'patient_id' => $patient->id,
                'encounter_number' => 'ENC-' . str_pad(time() + $i, 8, '0', STR_PAD_LEFT),
                'type' => $type,
                'status' => $status,
                'admission_datetime' => $createdAt,
                'discharge_datetime' => $status === 'COMPLETED' ? $createdAt->copy()->addDays(rand(1, 7)) : null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }

    private function createBillingData()
    {
        $this->command->info('Creating billing accounts and items...');
        
        $encounters = Encounter::all();
        $user = User::first();
        
        // Service categories with realistic KES pricing
        $services = [
            'consultation' => [
                ['desc' => 'General Consultation', 'price' => 2500],
                ['desc' => 'Specialist Consultation', 'price' => 5000],
                ['desc' => 'Emergency Consultation', 'price' => 7500],
            ],
            'laboratory' => [
                ['desc' => 'Complete Blood Count', 'price' => 1500],
                ['desc' => 'Blood Sugar Test', 'price' => 800],
                ['desc' => 'Liver Function Test', 'price' => 3500],
                ['desc' => 'Kidney Function Test', 'price' => 3000],
            ],
            'radiology' => [
                ['desc' => 'Chest X-Ray', 'price' => 2500],
                ['desc' => 'CT Scan Head', 'price' => 15000],
                ['desc' => 'Ultrasound Abdomen', 'price' => 4000],
            ],
            'pharmacy' => [
                ['desc' => 'Paracetamol 500mg x30', 'price' => 450],
                ['desc' => 'Amoxicillin 250mg x21', 'price' => 1200],
                ['desc' => 'Insulin 10ml', 'price' => 2800],
            ],
            'accommodation' => [
                ['desc' => 'General Ward (per day)', 'price' => 3500],
                ['desc' => 'Private Room (per day)', 'price' => 8000],
                ['desc' => 'ICU (per day)', 'price' => 25000],
            ],
        ];

        foreach ($encounters as $encounter) {
            // Create billing account
            $billingAccount = BillingAccount::create([
                'account_no' => 'BA-' . str_pad($encounter->id, 6, '0', STR_PAD_LEFT),
                'patient_id' => $encounter->patient_id,
                'encounter_id' => $encounter->id,
                'status' => fake()->randomElement(['open', 'closed', 'discharged']),
                'total_amount' => 0,
                'amount_paid' => 0,
                'balance' => 0,
                'created_at' => $encounter->created_at,
            ]);

            // Add 2-6 billing items per account
            $itemCount = rand(2, 6);
            $totalAmount = 0;

            for ($i = 0; $i < $itemCount; $i++) {
                $category = fake()->randomElement(array_keys($services));
                $service = fake()->randomElement($services[$category]);
                $quantity = ($category === 'accommodation') ? rand(1, 5) : 1;
                $amount = $service['price'] * $quantity;
                $totalAmount += $amount;

                DB::table('bill_items')->insert([
                    'encounter_id' => $encounter->id,
                    'item_type' => $category,
                    'description' => $service['desc'],
                    'quantity' => $quantity,
                    'unit_price' => $service['price'],
                    'amount' => $amount,
                    'status' => fake()->randomElement(['unpaid', 'paid', 'cancelled']),
                    'created_at' => $encounter->created_at->addHours(rand(1, 24)),
                    'updated_at' => now(),
                ]);
            }

            // Update billing account totals
            $amountPaid = ($billingAccount->status === 'closed') ? $totalAmount : 
                         (($billingAccount->status === 'discharged') ? $totalAmount * 0.6 : 0);
            
            $billingAccount->update([
                'total_amount' => $totalAmount,
                'amount_paid' => $amountPaid,
                'balance' => $totalAmount - $amountPaid,
            ]);
        }
    }

    private function createPayments()
    {
        $this->command->info('Creating payments...');
        
        // First create some invoices
        $billingAccounts = BillingAccount::whereIn('status', ['closed', 'discharged'])->get();
        $user = User::first();
        
        foreach ($billingAccounts as $account) {
            // Create invoice for this billing account
            $invoiceId = DB::table('invoices')->insertGetId([
                'encounter_id' => $account->encounter_id,
                'patient_id' => $account->patient_id,
                'total_amount' => $account->total_amount,
                'discount' => 0,
                'net_amount' => $account->total_amount,
                'paid_amount' => $account->amount_paid,
                'balance' => $account->balance,
                'status' => $account->status === 'closed' ? 'paid' : ($account->status === 'discharged' ? 'partial' : 'unpaid'),
                'created_at' => $account->created_at,
                'updated_at' => now(),
            ]);

            // Create payments for paid/partial accounts
            if ($account->amount_paid > 0) {
                $paymentCount = rand(1, 2);
                $remainingAmount = $account->amount_paid;
                
                for ($i = 0; $i < $paymentCount && $remainingAmount > 0; $i++) {
                    $amount = ($i === $paymentCount - 1) ? $remainingAmount : 
                             min($remainingAmount, rand(1000, $remainingAmount));
                    
                    DB::table('payments')->insert([
                        'invoice_id' => $invoiceId,
                        'amount' => $amount,
                        'method' => fake()->randomElement(['cash', 'mpesa', 'card', 'bank']),
                        'reference_no' => strtoupper(fake()->bothify('PAY###??')),
                        'received_by' => $user->name,
                        'created_at' => Carbon::parse($account->created_at)->addDays(rand(0, 5)),
                        'updated_at' => now(),
                    ]);
                    
                    $remainingAmount -= $amount;
                }
            }
        }
    }

    private function createDeposits()
    {
        $this->command->info('Creating deposits...');
        
        $ipdEncounters = Encounter::where('type', 'IPD')->get();
        $user = User::first();
        
        foreach ($ipdEncounters->take(20) as $encounter) {
            $amount = rand(5000, 50000);
            
            DB::table('deposits')->insert([
                'encounter_id' => $encounter->id,
                'amount' => $amount,
                'mode' => fake()->randomElement(['CASH', 'MPESA', 'CARD', 'BANK']),
                'reference_no' => strtoupper(fake()->bothify('DEP###??')),
                'deposit_date' => $encounter->admission_datetime,
                'received_by' => $user->id,
                'remarks' => 'IPD admission deposit',
                'created_at' => $encounter->created_at,
                'updated_at' => now(),
            ]);
        }
    }

    private function createInsuranceClaims()
    {
        $this->command->info('Creating insurance claims...');
        
        $billingAccounts = BillingAccount::take(15)->get();
        $insuranceProviders = ['NHIF', 'AAR Insurance', 'Jubilee Insurance', 'CIC Insurance', 'Madison Insurance'];
        $claimStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];
        $user = User::first();
        
        foreach ($billingAccounts as $account) {
            $claimAmount = $account->total_amount * 0.8; // 80% covered by insurance
            
            DB::table('insurance_claims')->insert([
                'billing_account_id' => $account->id,
                'insurer_name' => fake()->randomElement($insuranceProviders),
                'policy_number' => strtoupper(fake()->bothify('POL####??')),
                'claim_number' => strtoupper(fake()->bothify('CLM####??')),
                'claim_amount' => $claimAmount,
                'claim_status' => fake()->randomElement($claimStatuses),
                'submitted_date' => Carbon::parse($account->created_at)->addDays(rand(1, 10)),
                'submitted_by' => $user->id,
                'remarks' => 'Insurance claim for medical services',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function createLedgerEntries()
    {
        $this->command->info('Creating ledger entries...');
        
        $user = User::first();
        
        // Create entries for the last 30 days
        for ($day = 0; $day < 30; $day++) {
            $date = Carbon::now()->subDays($day);
            
            // Daily revenue entries (Credit)
            $dailyRevenue = rand(50000, 200000);
            
            DB::table('ledger_entries')->insert([
                'entry_date' => $date,
                'account_head' => 'Patient Services Revenue',
                'debit' => 0,
                'credit' => $dailyRevenue,
                'narration' => 'Daily patient services revenue',
                'created_by' => $user->id,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
            
            // Cash receipts (Debit)
            $cashReceipts = rand(30000, $dailyRevenue * 0.7);
            
            DB::table('ledger_entries')->insert([
                'entry_date' => $date,
                'account_head' => 'Cash Account',
                'debit' => $cashReceipts,
                'credit' => 0,
                'narration' => 'Cash payments received from patients',
                'created_by' => $user->id,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
            
            // Accounts receivable (Debit)
            $receivables = $dailyRevenue - $cashReceipts;
            
            DB::table('ledger_entries')->insert([
                'entry_date' => $date,
                'account_head' => 'Accounts Receivable',
                'debit' => $receivables,
                'credit' => 0,
                'narration' => 'Outstanding patient balances',
                'created_by' => $user->id,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }
    }
}