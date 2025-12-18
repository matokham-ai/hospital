<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\InsuranceClaim;
use App\Models\Encounter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BillingInsuranceSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing patients
        $patients = Patient::limit(20)->get();
        
        if ($patients->isEmpty()) {
            $this->command->warn('No patients found. Please run PatientSeeder first.');
            return;
        }

        // Get a user for created_by fields
        $user = User::first();
        if (!$user) {
            $this->command->warn('No users found. Please create a user first.');
            return;
        }

        $this->command->info('Creating billing and insurance data...');

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

        // Create encounters and invoices for each patient
        foreach ($patients as $patient) {
            // Create 1-3 encounters per patient
            $encounterCount = rand(1, 3);
            
            for ($i = 0; $i < $encounterCount; $i++) {
                // Create encounter
                $admissionDate = Carbon::now()->subDays(rand(1, 90));
                $dischargeDate = Carbon::now()->subDays(rand(0, 30));
                
                $encounter = Encounter::create([
                    'patient_id' => $patient->id,
                    'encounter_number' => 'ENC-' . date('Y') . '-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'type' => collect(['OPD', 'IPD', 'EMERGENCY'])->random(),
                    'status' => 'COMPLETED',
                    'admission_datetime' => $admissionDate,
                    'discharge_datetime' => $dischargeDate,
                ]);

                // Create invoice for encounter
                $totalAmount = rand(5000, 50000);
                $paidAmount = rand(0, $totalAmount);
                $balance = $totalAmount - $paidAmount;
                
                $status = 'unpaid';
                if ($paidAmount == $totalAmount) {
                    $status = 'paid';
                } elseif ($paidAmount > 0) {
                    $status = 'partial';
                }

                $invoice = Invoice::create([
                    'encounter_id' => $encounter->id,
                    'patient_id' => $patient->id,
                    'total_amount' => $totalAmount,
                    'discount' => rand(0, 2000),
                    'net_amount' => $totalAmount - rand(0, 2000),
                    'paid_amount' => $paidAmount,
                    'balance' => $balance,
                    'status' => $status,
                    'created_at' => $encounter->admission_datetime,
                ]);

                // Create payments if any amount is paid
                if ($paidAmount > 0) {
                    $remainingAmount = $paidAmount;
                    $paymentCount = rand(1, 3);
                    
                    for ($p = 0; $p < $paymentCount && $remainingAmount > 0; $p++) {
                        $paymentAmount = $p == $paymentCount - 1 ? $remainingAmount : rand(1000, min($remainingAmount, 15000));
                        $remainingAmount -= $paymentAmount;

                        Payment::create([
                            'invoice_id' => $invoice->id,
                            'amount' => $paymentAmount,
                            'method' => collect(['cash', 'mpesa', 'card', 'bank'])->random(),
                            'reference_no' => 'PAY-' . strtoupper(uniqid()),
                            'received_by' => $user->name ?? 'System',
                            'created_at' => $encounter->admission_datetime->addDays(rand(1, 10)),
                        ]);
                    }
                }

                // Skip insurance claims for now - will create them separately
                // after we have proper billing accounts
            }
        }

        $this->command->info('Billing and insurance data created successfully!');
        
        // Display summary
        $invoiceCount = Invoice::count();
        $paymentCount = Payment::count();
        $claimCount = InsuranceClaim::count();
        
        $this->command->info("Created:");
        $this->command->info("- {$invoiceCount} invoices");
        $this->command->info("- {$paymentCount} payments");
        $this->command->info("- {$claimCount} insurance claims");
    }
}