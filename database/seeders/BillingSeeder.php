<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BillingAccount;
use App\Models\BillingItem;

class BillingSeeder extends Seeder
{
    public function run(): void
    {
        // Get or create sample billing accounts
        $billingAccount1 = BillingAccount::firstOrCreate(
            ['encounter_id' => 1],
            [
                'account_no' => 'BA' . str_pad(1, 6, '0', STR_PAD_LEFT),
                'patient_id' => 'P001',
                'status' => 'open',
                'total_amount' => 0,
                'amount_paid' => 0,
                'balance' => 0,
            ]
        );

        $billingAccount2 = BillingAccount::firstOrCreate(
            ['encounter_id' => 2],
            [
                'account_no' => 'BA' . str_pad(2, 6, '0', STR_PAD_LEFT),
                'patient_id' => 'P002',
                'status' => 'open',
                'total_amount' => 0,
                'amount_paid' => 0,
                'balance' => 0,
            ]
        );

        // Create comprehensive billing items with KES pricing
        $items = [
            // Encounter 1 Items
            [
                'encounter_id' => 1,
                'item_type' => 'consultation',
                'description' => 'General Consultation - Dr. Sarah Wilson',
                'quantity' => 1,
                'unit_price' => 5000.00,
                'amount' => 5000.00,
                'discount_amount' => 0.00,
                'net_amount' => 5000.00,
                'service_code' => 'CONS001',
                'reference_type' => 'consultation',
                'reference_id' => 1,
                'status' => 'paid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 1,
                'item_type' => 'lab_test',
                'description' => 'Complete Blood Count (CBC)',
                'quantity' => 1,
                'unit_price' => 2500.00,
                'amount' => 2500.00,
                'discount_amount' => 250.00,
                'net_amount' => 2250.00,
                'service_code' => 'LAB001',
                'reference_type' => 'lab_test',
                'reference_id' => 1,
                'status' => 'paid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 1,
                'item_type' => 'pharmacy',
                'description' => 'Paracetamol 500mg - 500mg TID',
                'quantity' => 15,
                'unit_price' => 250.00,
                'amount' => 3750.00,
                'discount_amount' => 0.00,
                'net_amount' => 3750.00,
                'service_code' => 'PHARM001',
                'reference_type' => 'medication',
                'reference_id' => 1,
                'status' => 'unpaid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 1,
                'item_type' => 'bed_charge',
                'description' => 'General Ward Bed - 2 days',
                'quantity' => 2,
                'unit_price' => 3000.00,
                'amount' => 6000.00,
                'discount_amount' => 0.00,
                'net_amount' => 6000.00,
                'service_code' => 'BED001',
                'reference_type' => 'bed_assignment',
                'reference_id' => 1,
                'status' => 'unpaid',
                'posted_at' => now(),
            ],

            // Encounter 2 Items
            [
                'encounter_id' => 2,
                'item_type' => 'consultation',
                'description' => 'Specialist Consultation - Dr. Michael Brown',
                'quantity' => 1,
                'unit_price' => 8000.00,
                'amount' => 8000.00,
                'discount_amount' => 800.00,
                'net_amount' => 7200.00,
                'service_code' => 'CONS002',
                'reference_type' => 'consultation',
                'reference_id' => 2,
                'status' => 'paid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 2,
                'item_type' => 'lab_test',
                'description' => 'Liver Function Test (LFT)',
                'quantity' => 1,
                'unit_price' => 4500.00,
                'amount' => 4500.00,
                'discount_amount' => 0.00,
                'net_amount' => 4500.00,
                'service_code' => 'LAB002',
                'reference_type' => 'lab_test',
                'reference_id' => 2,
                'status' => 'unpaid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 2,
                'item_type' => 'pharmacy',
                'description' => 'Amoxicillin 250mg - 250mg BID',
                'quantity' => 14,
                'unit_price' => 1500.00,
                'amount' => 21000.00,
                'discount_amount' => 1000.00,
                'net_amount' => 20000.00,
                'service_code' => 'PHARM002',
                'reference_type' => 'medication',
                'reference_id' => 2,
                'status' => 'unpaid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 2,
                'item_type' => 'procedure',
                'description' => 'X-Ray Chest PA View',
                'quantity' => 1,
                'unit_price' => 3500.00,
                'amount' => 3500.00,
                'discount_amount' => 0.00,
                'net_amount' => 3500.00,
                'service_code' => 'PROC001',
                'reference_type' => 'procedure',
                'reference_id' => 1,
                'status' => 'paid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 2,
                'item_type' => 'consumable',
                'description' => 'IV Cannula 18G',
                'quantity' => 2,
                'unit_price' => 500.00,
                'amount' => 1000.00,
                'discount_amount' => 0.00,
                'net_amount' => 1000.00,
                'service_code' => 'CONS001',
                'reference_type' => 'consumable',
                'reference_id' => 1,
                'status' => 'unpaid',
                'posted_at' => now(),
            ],
            [
                'encounter_id' => 2,
                'item_type' => 'other',
                'description' => 'Administrative Fee',
                'quantity' => 1,
                'unit_price' => 1000.00,
                'amount' => 1000.00,
                'discount_amount' => 0.00,
                'net_amount' => 1000.00,
                'service_code' => 'ADMIN001',
                'reference_type' => null,
                'reference_id' => null,
                'status' => 'unpaid',
                'posted_at' => now(),
            ],
        ];

        foreach ($items as $itemData) {
            BillingItem::create($itemData);
        }

        // Update billing account totals using net amounts
        foreach ([$billingAccount1, $billingAccount2] as $account) {
            $totalAmount = $account->items()->sum('amount');
            $totalDiscount = $account->items()->sum('discount_amount');
            $netAmount = $account->items()->sum('net_amount');
            
            $account->update([
                'total_amount' => $netAmount, // Use net amount as the final total
                'balance' => $netAmount,
            ]);
        }
    }
}