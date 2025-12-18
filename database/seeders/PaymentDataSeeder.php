<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Payment;
use App\Models\Invoice;
use Carbon\Carbon;

class PaymentDataSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🏥 Creating sample payment data for reports...');
        
        // Get existing invoices
        $invoices = Invoice::limit(20)->get();
        
        if ($invoices->isEmpty()) {
            $this->command->info('No invoices found. Creating some sample invoices first...');
            
            // Create some sample invoices
            for ($i = 1; $i <= 10; $i++) {
                Invoice::create([
                    'invoice_number' => 'INV-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                    'patient_id' => 'P00' . ($i % 3 + 1), // Use existing patients
                    'total_amount' => rand(5000, 50000),
                    'paid_amount' => 0,
                    'balance' => rand(5000, 50000),
                    'status' => 'pending',
                    'invoice_date' => Carbon::now()->subDays(rand(1, 30)),
                    'due_date' => Carbon::now()->addDays(rand(1, 30)),
                ]);
            }
            
            $invoices = Invoice::limit(20)->get();
        }
        
        // Create payments for the invoices
        foreach ($invoices as $invoice) {
            // Create 1-3 payments per invoice
            $numPayments = rand(1, 3);
            $totalPaid = 0;
            
            for ($p = 0; $p < $numPayments; $p++) {
                $paymentAmount = rand(1000, min(10000, $invoice->total_amount - $totalPaid));
                
                if ($paymentAmount > 0) {
                    Payment::create([
                        'invoice_id' => $invoice->id,
                        'amount' => $paymentAmount,
                        'method' => collect(['cash', 'card'])->random(),
                        'status' => 'completed',
                        'payment_date' => Carbon::now()->subDays(rand(1, 25)),
                        'reference_no' => 'PAY-' . str_pad(rand(1000, 9999), 6, '0', STR_PAD_LEFT),
                        'notes' => 'Sample payment for testing',
                        'received_by' => 1, // Use first user
                    ]);
                    
                    $totalPaid += $paymentAmount;
                }
                
                if ($totalPaid >= $invoice->total_amount) {
                    break;
                }
            }
        }
        
        $totalPayments = Payment::count();
        $totalRevenue = Payment::where('status', 'completed')->sum('amount');
        
        $this->command->info("✅ Created {$totalPayments} payments with total revenue of KES " . number_format($totalRevenue));
    }
}