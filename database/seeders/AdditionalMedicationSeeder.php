<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Prescription;
use App\Models\MedicationAdministration;
use Carbon\Carbon;

class AdditionalMedicationSeeder extends Seeder
{
    public function run()
    {
        // Get existing encounters
        $encounters = Encounter::where('type', 'IPD')->where('status', 'active')->get();
        
        if ($encounters->isEmpty()) {
            echo "No active encounters found.\n";
            return;
        }

        $medications = [
            ['drug_name' => 'Ibuprofen', 'dosage' => '400mg', 'frequency' => 'Three times daily'],
            ['drug_name' => 'Acetaminophen', 'dosage' => '500mg', 'frequency' => 'Four times daily'],
            ['drug_name' => 'Atorvastatin', 'dosage' => '20mg', 'frequency' => 'Once daily'],
            ['drug_name' => 'Amlodipine', 'dosage' => '5mg', 'frequency' => 'Once daily'],
            ['drug_name' => 'Furosemide', 'dosage' => '40mg', 'frequency' => 'Twice daily'],
            ['drug_name' => 'Warfarin', 'dosage' => '5mg', 'frequency' => 'Once daily'],
            ['drug_name' => 'Digoxin', 'dosage' => '0.25mg', 'frequency' => 'Once daily'],
            ['drug_name' => 'Insulin', 'dosage' => '10 units', 'frequency' => 'Three times daily'],
        ];

        $schedulesCreated = 0;

        foreach ($encounters as $encounter) {
            // Add 2-3 random medications per encounter
            $selectedMeds = collect($medications)->random(rand(2, 3));
            
            foreach ($selectedMeds as $med) {
                $prescription = Prescription::create([
                    'encounter_id' => $encounter->id,
                    'patient_id' => $encounter->patient_id,
                    'physician_id' => 'PHY001',
                    'drug_name' => $med['drug_name'],
                    'dosage' => $med['dosage'],
                    'frequency' => $med['frequency'],
                    'duration' => rand(3, 7),
                    'quantity' => rand(15, 30),
                    'status' => 'pending',
                    'notes' => 'Additional medication for testing pagination'
                ]);

                // Generate schedules for today
                $frequency = strtolower($med['frequency']);
                $timesPerDay = [];
                
                if (str_contains($frequency, 'once') || str_contains($frequency, '1')) {
                    $timesPerDay = ['08:00'];
                } elseif (str_contains($frequency, 'twice') || str_contains($frequency, '2')) {
                    $timesPerDay = ['08:00', '20:00'];
                } elseif (str_contains($frequency, 'three') || str_contains($frequency, '3')) {
                    $timesPerDay = ['08:00', '14:00', '20:00'];
                } elseif (str_contains($frequency, 'four') || str_contains($frequency, '4')) {
                    $timesPerDay = ['06:00', '12:00', '18:00', '22:00'];
                }

                foreach ($timesPerDay as $time) {
                    $scheduledTime = Carbon::today()->setTimeFromTimeString($time);
                    $status = collect(['due', 'given', 'missed'])->random();
                    
                    MedicationAdministration::create([
                        'prescription_id' => $prescription->id,
                        'encounter_id' => $encounter->id,
                        'patient_id' => $encounter->patient_id,
                        'scheduled_time' => $scheduledTime,
                        'status' => $status,
                        'administered_at' => $status === 'given' ? $scheduledTime->copy()->addMinutes(rand(0, 30)) : null,
                        'administered_by' => $status === 'given' ? 1 : null,
                        'dosage_given' => $status === 'given' ? $med['dosage'] : null
                    ]);
                    
                    $schedulesCreated++;
                }
            }
        }

        echo "Created {$schedulesCreated} additional medication schedules for testing pagination!\n";
    }
}