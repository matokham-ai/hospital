<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Prescription;
use App\Models\MedicationAdministration;
use Carbon\Carbon;

class MedicationSeeder extends Seeder
{
    public function run()
    {
        // Get some patients and encounters
        $patients = Patient::with('encounters')->take(3)->get();
        
        if ($patients->isEmpty()) {
            echo "No patients found. Please seed patients first.\n";
            return;
        }

        foreach ($patients as $patient) {
            $encounter = $patient->encounters()->where('type', 'IPD')->first();
            
            if (!$encounter) {
                // Create an encounter if none exists
                $encounter = Encounter::create([
                    'patient_id' => $patient->id,
                    'encounter_number' => 'ENC-' . date('Ymd') . '-' . str_pad($patient->id, 3, '0', STR_PAD_LEFT),
                    'type' => 'IPD',
                    'status' => 'active',
                    'admission_datetime' => now()->subDays(rand(1, 5)),
                    'chief_complaint' => 'Medical treatment required'
                ]);
            }

            // Create prescriptions
            $medications = [
                ['drug_name' => 'Lisinopril', 'dosage' => '10mg', 'frequency' => 'Once daily'],
                ['drug_name' => 'Metformin', 'dosage' => '500mg', 'frequency' => 'Twice daily'],
                ['drug_name' => 'Aspirin', 'dosage' => '81mg', 'frequency' => 'Once daily'],
            ];

            foreach ($medications as $index => $med) {
                $prescription = Prescription::create([
                    'encounter_id' => $encounter->id,
                    'patient_id' => $patient->id,
                    'physician_id' => 'PHY001', // Assuming physician with this ID exists
                    'drug_name' => $med['drug_name'],
                    'dosage' => $med['dosage'],
                    'frequency' => $med['frequency'],
                    'duration' => 7,
                    'quantity' => 30,
                    'status' => 'pending'
                ]);

                // Create medication administration schedules for today
                $times = ['08:00', '12:00', '18:00'];
                foreach ($times as $timeIndex => $time) {
                    if ($med['frequency'] === 'Once daily' && $timeIndex > 0) continue;
                    if ($med['frequency'] === 'Twice daily' && $timeIndex > 1) continue;

                    $scheduledTime = Carbon::today()->setTimeFromTimeString($time);
                    $status = 'due';
                    $administeredAt = null;
                    
                    // Randomly set some as given or missed
                    $rand = rand(1, 10);
                    if ($rand <= 3) {
                        $status = 'given';
                        $administeredAt = $scheduledTime->copy()->addMinutes(rand(0, 30));
                    } elseif ($rand <= 4) {
                        $status = 'missed';
                    }

                    MedicationAdministration::create([
                        'prescription_id' => $prescription->id,
                        'encounter_id' => $encounter->id,
                        'patient_id' => $patient->id,
                        'scheduled_time' => $scheduledTime,
                        'administered_at' => $administeredAt,
                        'administered_by' => $status === 'given' ? 1 : null, // Assuming user ID 1
                        'status' => $status,
                        'dosage_given' => $status === 'given' ? $med['dosage'] : null
                    ]);
                }
            }
        }

        echo "Medication data seeded successfully!\n";
    }
}