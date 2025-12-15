<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EncounterBedSeeder extends Seeder
{
    public function run()
    {
        // Get some patient IDs
        $patientIds = DB::table('patients')->pluck('id')->take(10)->toArray();
        
        if (empty($patientIds)) {
            $this->command->info('No patients found. Please seed patients first.');
            return;
        }

        // Create some wards if they don't exist
        $wardIds = DB::table('wards')->pluck('id')->toArray();
        if (empty($wardIds)) {
            $wards = [
                ['name' => 'General Ward', 'description' => 'General medical ward', 'capacity' => 20, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'ICU', 'description' => 'Intensive Care Unit', 'capacity' => 10, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Pediatric Ward', 'description' => 'Children ward', 'capacity' => 15, 'created_at' => now(), 'updated_at' => now()],
            ];
            
            foreach ($wards as $ward) {
                DB::table('wards')->insert($ward);
            }
            
            $wardIds = DB::table('wards')->pluck('id')->toArray();
        }

        // Create some beds if they don't exist
        $bedIds = DB::table('beds')->pluck('id')->toArray();
        if (empty($bedIds)) {
            foreach ($wardIds as $wardId) {
                for ($i = 1; $i <= 5; $i++) {
                    DB::table('beds')->insert([
                        'ward_id' => $wardId,
                        'bed_number' => 'B' . $wardId . '-' . str_pad($i, 2, '0', STR_PAD_LEFT),
                        'bed_type' => 'standard',
                        'status' => 'AVAILABLE',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            
            $bedIds = DB::table('beds')->pluck('id')->toArray();
        }

        // Create encounters and bed assignments for patients
        foreach ($patientIds as $index => $patientId) {
            // Create encounter
            $encounterId = DB::table('encounters')->insertGetId([
                'patient_id' => $patientId,
                'encounter_number' => 'ENC' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                'type' => 'IPD',
                'status' => 'ACTIVE',
                'department_id' => '1',
                'attending_physician_id' => '1',
                'chief_complaint' => 'Routine admission for observation',
                'admission_datetime' => Carbon::now()->subDays(rand(1, 7)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign bed
            $bedId = $bedIds[array_rand($bedIds)];
            DB::table('bed_assignments')->insert([
                'encounter_id' => $encounterId,
                'bed_id' => $bedId,
                'assigned_at' => Carbon::now()->subDays(rand(1, 7)),
                'assigned_by' => 'System',
                'assignment_notes' => 'Automatic assignment for inpatient care',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update bed status
            DB::table('beds')->where('id', $bedId)->update(['status' => 'OCCUPIED']);
        }

        $this->command->info('Encounters and bed assignments created successfully!');
    }
}