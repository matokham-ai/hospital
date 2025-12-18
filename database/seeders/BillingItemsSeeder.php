<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\BillingAccount;
use App\Models\Encounter;
use App\Models\User;

class BillingItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get active IPD encounters
        $encounters = Encounter::where('type', 'IPD')
            ->where('status', 'ACTIVE')
            ->get();

        if ($encounters->isEmpty()) {
            $this->command->info('No active IPD encounters found. Please create some encounters first.');
            return;
        }

        $firstUser = User::first();
        if (!$firstUser) {
            $this->command->info('No users found. Please create a user first.');
            return;
        }

        // Medical service categories and items (prices in KES - Kenyan Shillings)
        $medicalServices = [
            'C' => [
                ['description' => 'General Physician Consultation', 'unit_price' => 19500.00],
                ['description' => 'Specialist Consultation', 'unit_price' => 32500.00],
                ['description' => 'Emergency Consultation', 'unit_price' => 39000.00],
                ['description' => 'Follow-up Consultation', 'unit_price' => 13000.00],
            ],
            'L' => [
                ['description' => 'Complete Blood Count (CBC)', 'unit_price' => 5850.00],
                ['description' => 'Blood Sugar Test', 'unit_price' => 3250.00],
                ['description' => 'Lipid Profile', 'unit_price' => 8450.00],
                ['description' => 'Liver Function Test', 'unit_price' => 11050.00],
                ['description' => 'Kidney Function Test', 'unit_price' => 9750.00],
                ['description' => 'Thyroid Function Test', 'unit_price' => 12350.00],
                ['description' => 'Urine Analysis', 'unit_price' => 3900.00],
                ['description' => 'Blood Culture', 'unit_price' => 15600.00],
            ],
            'R' => [
                ['description' => 'Chest X-Ray', 'unit_price' => 10400.00],
                ['description' => 'Abdominal X-Ray', 'unit_price' => 11700.00],
                ['description' => 'CT Scan - Head', 'unit_price' => 58500.00],
                ['description' => 'CT Scan - Chest', 'unit_price' => 65000.00],
                ['description' => 'MRI - Brain', 'unit_price' => 104000.00],
                ['description' => 'Ultrasound - Abdomen', 'unit_price' => 15600.00],
                ['description' => 'ECG', 'unit_price' => 6500.00],
                ['description' => 'Echocardiogram', 'unit_price' => 26000.00],
            ],
            'M' => [
                ['description' => 'IV Fluid - Normal Saline 500ml', 'unit_price' => 1950.00],
                ['description' => 'IV Fluid - Dextrose 5% 500ml', 'unit_price' => 2340.00],
                ['description' => 'Antibiotic - Ceftriaxone 1g', 'unit_price' => 3250.00],
                ['description' => 'Pain Relief - Morphine 10mg', 'unit_price' => 4550.00],
                ['description' => 'Insulin - Regular 10ml', 'unit_price' => 5850.00],
                ['description' => 'Blood Thinner - Heparin 5000u', 'unit_price' => 3900.00],
                ['description' => 'Oxygen Therapy - per hour', 'unit_price' => 1560.00],
            ],
            'P' => [
                ['description' => 'IV Cannulation', 'unit_price' => 5200.00],
                ['description' => 'Urinary Catheterization', 'unit_price' => 7800.00],
                ['description' => 'Wound Dressing - Simple', 'unit_price' => 4550.00],
                ['description' => 'Wound Dressing - Complex', 'unit_price' => 9750.00],
                ['description' => 'Blood Transfusion', 'unit_price' => 26000.00],
                ['description' => 'Nasogastric Tube Insertion', 'unit_price' => 6500.00],
                ['description' => 'Suture Removal', 'unit_price' => 3250.00],
            ],
            'B' => [
                ['description' => 'General Ward - per day', 'unit_price' => 23400.00],
                ['description' => 'Private Room - per day', 'unit_price' => 45500.00],
                ['description' => 'ICU - per day', 'unit_price' => 104000.00],
                ['description' => 'Nursing Care - per day', 'unit_price' => 15600.00],
            ],
            'S' => [
                ['description' => 'Surgical Gloves - pair', 'unit_price' => 325.00],
                ['description' => 'Disposable Syringe 5ml', 'unit_price' => 195.00],
                ['description' => 'Gauze Pads - pack', 'unit_price' => 1040.00],
                ['description' => 'Medical Tape - roll', 'unit_price' => 650.00],
                ['description' => 'Thermometer Cover - disposable', 'unit_price' => 98.00],
            ]
        ];

        foreach ($encounters as $encounter) {
            // Get or create billing account for this encounter
            $billingAccount = BillingAccount::where('encounter_id', $encounter->id)->first();
            
            if (!$billingAccount) {
                $billingAccount = BillingAccount::create([
                    'account_no' => 'BA-' . str_pad($encounter->id, 6, '0', STR_PAD_LEFT),
                    'patient_id' => $encounter->patient_id,
                    'encounter_id' => $encounter->id,
                    'status' => 'open',
                    'total_amount' => 0,
                    'net_amount' => 0,
                    'balance' => 0,
                    'created_by' => $firstUser->id,
                ]);
            }

            // Add random billing items for each encounter
            $itemsToAdd = rand(3, 8); // Each patient gets 3-8 billing items
            $addedCategories = [];

            for ($i = 0; $i < $itemsToAdd; $i++) {
                // Select a random category
                $categories = array_keys($medicalServices);
                $category = $categories[array_rand($categories)];
                
                // Select a random service from that category
                $services = $medicalServices[$category];
                $service = $services[array_rand($services)];
                
                // Random quantity (most items are qty 1, some are higher)
                $quantity = ($category === 'M' || $category === 'S') ? rand(1, 5) : 1;
                if ($category === 'B') {
                    $quantity = rand(1, 7); // 1-7 days
                }
                
                $amount = $quantity * $service['unit_price'];

                // Create billing item - but wait, we're using bill_items table, not billing_items
                // Let me use the correct table based on the structure you showed
                DB::table('bill_items')->insert([
                    'encounter_id' => $encounter->id,
                    'item_type' => $category,
                    'description' => $service['description'],
                    'quantity' => $quantity,
                    'unit_price' => $service['unit_price'],
                    'amount' => $amount,
                    'status' => 'unpaid',
                    'created_at' => now()->subDays(rand(0, 5))->subHours(rand(0, 23)),
                    'updated_at' => now(),
                ]);

                $addedCategories[] = $category;
            }

            // Ensure every patient has at least a consultation and room charge
            if (!in_array('C', $addedCategories)) {
                $consultation = $medicalServices['C'][0]; // General consultation
                DB::table('bill_items')->insert([
                    'encounter_id' => $encounter->id,
                    'item_type' => 'C',
                    'description' => $consultation['description'],
                    'quantity' => 1,
                    'unit_price' => $consultation['unit_price'],
                    'amount' => $consultation['unit_price'],
                    'status' => 'unpaid',
                    'created_at' => now()->subDays(rand(1, 3)),
                    'updated_at' => now(),
                ]);
            }

            if (!in_array('B', $addedCategories)) {
                $room = $medicalServices['B'][0]; // General ward
                $days = rand(2, 5);
                DB::table('bill_items')->insert([
                    'encounter_id' => $encounter->id,
                    'item_type' => 'B',
                    'description' => $room['description'],
                    'quantity' => $days,
                    'unit_price' => $room['unit_price'],
                    'amount' => $days * $room['unit_price'],
                    'status' => 'unpaid',
                    'created_at' => now()->subDays(rand(1, 4)),
                    'updated_at' => now(),
                ]);
            }

            // Recalculate billing account totals
            $totalAmount = DB::table('bill_items')
                ->where('encounter_id', $encounter->id)
                ->whereIn('status', ['unpaid', 'paid'])
                ->sum('amount');

            $billingAccount->update([
                'total_amount' => $totalAmount,
                'net_amount' => $totalAmount,
                'balance' => $totalAmount,
            ]);

            $this->command->info("Added billing items for patient: {$encounter->patient->first_name} {$encounter->patient->last_name} (Total: $" . number_format($totalAmount, 2) . ")");
        }

        $this->command->info('Billing items seeded successfully!');
    }
}