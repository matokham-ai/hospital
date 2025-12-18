<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Encounter;
use App\Models\Prescription;

class TestPrescriptionSeeder extends Seeder
{
    public function run()
    {
        $encounter = Encounter::where('type', 'IPD')->where('status', 'active')->first();
        
        if (!$encounter) {
            echo "No active encounters found.\n";
            return;
        }

        $prescription = Prescription::create([
            'encounter_id' => $encounter->id,
            'patient_id' => $encounter->patient_id,
            'physician_id' => 'PHY001',
            'drug_name' => 'Test Medication',
            'dosage' => '100mg',
            'frequency' => 'Twice daily',
            'duration' => 3,
            'quantity' => 10,
            'status' => 'pending',
            'notes' => 'Test prescription for schedule generation'
        ]);

        echo "Test prescription created with ID: {$prescription->id} for encounter {$encounter->id}\n";
    }
}