<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DrugFormulary;
use App\Models\PharmacyStore;
use App\Models\PharmacyStock;

class PharmacySeeder extends Seeder
{
    public function run(): void
    {
        // Create a pharmacy store
        $store = PharmacyStore::create([
            'name' => 'Main Pharmacy',
            'location' => 'Ground Floor',
            'is_active' => true,
        ]);

        // Get existing drugs from DrugFormulary
        $drugs = DrugFormulary::take(3)->get();
        
        if ($drugs->isEmpty()) {
            // Create sample drugs if none exist
            $drugData = [
                [
                    'name' => 'Paracetamol',
                    'generic_name' => 'Paracetamol',
                    'brand_name' => 'Panadol',
                    'strength' => '500mg',
                    'form' => 'tablet',
                    'formulation' => 'immediate-release',
                    'atc_code' => 'N02BE01',
                    'therapeutic_class' => 'Analgesics',
                    'stock_quantity' => 0,
                    'reorder_level' => 20,
                    'unit_price' => 1560.00,
                    'cost_price' => 1105.00,
                    'status' => 'active',
                    'requires_prescription' => false,
                ],
                [
                    'name' => 'Amoxicillin',
                    'generic_name' => 'Amoxicillin',
                    'brand_name' => 'Amoxil',
                    'strength' => '250mg',
                    'form' => 'capsule',
                    'formulation' => 'immediate-release',
                    'atc_code' => 'J01CA04',
                    'therapeutic_class' => 'Antibiotics',
                    'stock_quantity' => 0,
                    'reorder_level' => 50,
                    'unit_price' => 3315.00,
                    'cost_price' => 2340.00,
                    'status' => 'active',
                    'requires_prescription' => true,
                ],
                [
                    'name' => 'Ibuprofen',
                    'generic_name' => 'Ibuprofen',
                    'brand_name' => 'Advil',
                    'strength' => '200mg',
                    'form' => 'tablet',
                    'formulation' => 'immediate-release',
                    'atc_code' => 'M01AE01',
                    'therapeutic_class' => 'NSAIDs',
                    'stock_quantity' => 0,
                    'reorder_level' => 75,
                    'unit_price' => 2372.50,
                    'cost_price' => 1625.00,
                    'status' => 'active',
                    'requires_prescription' => false,
                ]
            ];
            
            foreach ($drugData as $data) {
                $drugs[] = DrugFormulary::create($data);
            }
        }

        foreach ($drugs as $drug) {
            
            // Create stock for each drug with varied expiry dates and stock levels
            $stockScenarios = [
                ['quantity' => 5, 'min_level' => 20, 'max_level' => 200, 'expiry_months' => 1], // Low stock, expiring soon
                ['quantity' => 150, 'min_level' => 50, 'max_level' => 300, 'expiry_months' => 18], // Good stock
                ['quantity' => 0, 'min_level' => 25, 'max_level' => 150, 'expiry_months' => -2], // Out of stock, expired
            ];
            
            static $index = 0;
            $scenario = $stockScenarios[$index % count($stockScenarios)];
            $index++;
            
            PharmacyStock::create([
                'store_id' => $store->id,
                'drug_id' => $drug->id,
                'batch_no' => 'BATCH' . rand(1000, 9999),
                'expiry_date' => now()->addMonths($scenario['expiry_months']),
                'quantity' => $scenario['quantity'],
                'min_level' => $scenario['min_level'],
                'max_level' => $scenario['max_level'],
                'last_updated' => now(),
            ]);
        }
    }
}