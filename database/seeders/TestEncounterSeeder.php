<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Encounter;

class TestEncounterSeeder extends Seeder
{
    public function run()
    {
        $patient = Patient::first();
        
        if ($patient) {
            Encounter::create([
                'patient_id' => $patient->id,
                'encounter_number' => 'ENC-' . date('Ymd') . '-001',
                'type' => 'IPD',
                'status' => 'active',
                'admission_datetime' => now(),
                'chief_complaint' => 'Chest pain and shortness of breath'
            ]);
            
            echo "Test encounter created successfully\n";
        } else {
            echo "No patients found. Please create a patient first.\n";
        }
    }
}