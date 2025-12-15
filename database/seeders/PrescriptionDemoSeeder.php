<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Encounter;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Drug;
use App\Models\Patient;
use App\Models\Physician;

class PrescriptionDemoSeeder extends Seeder
{
    public function run()
    {
        // Get available drugs
        $drugs = Drug::all();
        if ($drugs->isEmpty()) {
            echo "No drugs found. Please run PharmacySeeder first.\n";
            return;
        }

        // Get existing patients or use existing encounters
        $existingEncounters = Encounter::with('patient')->take(3)->get();
        
        if ($existingEncounters->isEmpty()) {
            echo "No encounters found. Please create some encounters first.\n";
            return;
        }

        // Get or create a physician
        $physician = Physician::first();
        if (!$physician) {
            $physician = Physician::create([
                'physician_code' => 'PHY001',
                'name' => 'Dr. Demo Physician',
                'specialization' => 'General Medicine',
                'license_number' => 'LIC001',
                'phone' => '0701234567',
                'email' => 'doctor@demo.com',
            ]);
        }

        // Create prescriptions with items using existing encounters
        foreach ($existingEncounters as $encounter) {
            // Create 1-2 prescriptions per encounter
            for ($p = 0; $p < rand(1, 2); $p++) {
                $prescription = Prescription::create([
                    'encounter_id' => $encounter->id,
                    'patient_id' => $encounter->patient_id,
                    'physician_id' => $encounter->attending_physician_id ?? $physician->physician_code,
                    'drug_name' => 'Multiple medications', // Legacy field
                    'status' => 'pending',
                    'notes' => 'Take as prescribed by physician'
                ]);

                // Add 1-3 prescription items per prescription
                $selectedDrugs = $drugs->random(rand(1, min(3, $drugs->count())));
                
                foreach ($selectedDrugs as $drug) {
                    PrescriptionItem::create([
                        'prescription_id' => $prescription->id,
                        'drug_id' => $drug->id,
                        'dose' => $this->getRandomDose($drug),
                        'frequency' => $this->getRandomFrequency(),
                        'duration' => rand(5, 14) . ' days',
                        'quantity' => rand(10, 60),
                        'route' => $drug->route ?? 'Oral',
                        'instructions' => $this->getRandomInstructions(),
                    ]);
                }
            }
        }

        echo "Demo prescriptions with items created successfully!\n";
    }

    private function getRandomDose($drug): string
    {
        $doses = [
            'Paracetamol' => ['500mg', '650mg', '1000mg'],
            'Amoxicillin' => ['250mg', '500mg', '875mg'],
            'Ibuprofen' => ['200mg', '400mg', '600mg'],
        ];

        $drugDoses = $doses[$drug->generic_name] ?? ['1 tablet', '2 tablets', '1 capsule'];
        return $drugDoses[array_rand($drugDoses)];
    }

    private function getRandomFrequency(): string
    {
        $frequencies = [
            'Once daily',
            'Twice daily',
            'Three times daily',
            'Four times daily',
            'Every 6 hours',
            'Every 8 hours',
            'Every 12 hours',
            'As needed'
        ];

        return $frequencies[array_rand($frequencies)];
    }

    private function getRandomInstructions(): string
    {
        $instructions = [
            'Take with food',
            'Take on empty stomach',
            'Take with plenty of water',
            'Take before meals',
            'Take after meals',
            'Take at bedtime',
            'Complete the full course'
        ];

        return $instructions[array_rand($instructions)];
    }
}