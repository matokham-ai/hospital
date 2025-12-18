<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\BedAssignment;
use App\Models\Encounter;
use App\Models\VitalSign;
use App\Models\MedicationAdministration;
use App\Models\CarePlan;
use Carbon\Carbon;

class NurseDashboardSeeder extends Seeder
{
    public function run()
    {
        // Create a ward if it doesn't exist
        $ward = Ward::firstOrCreate([
            'wardid' => 'WARD001'
        ], [
            'name' => 'General Ward',
            'description' => 'General medical ward',
            'capacity' => 20,
            'status' => 'ACTIVE'
        ]);

        // Create beds
        for ($i = 1; $i <= 10; $i++) {
            Bed::firstOrCreate([
                'ward_id' => $ward->wardid,
                'bed_number' => sprintf('%03d', $i)
            ], [
                'bed_type' => 'STANDARD',
                'status' => 'AVAILABLE'
            ]);
        }

        // Get some active encounters
        $activeEncounters = Encounter::where('status', 'ACTIVE')
            ->where('type', 'IPD')
            ->limit(5)
            ->get();

        $beds = Bed::where('ward_id', $ward->wardid)->limit(5)->get();

        // Create bed assignments for active encounters
        foreach ($activeEncounters as $index => $encounter) {
            if (isset($beds[$index])) {
                $bed = $beds[$index];
                
                // Create bed assignment
                BedAssignment::firstOrCreate([
                    'encounter_id' => $encounter->id,
                    'bed_id' => $bed->id
                ], [
                    'assigned_at' => Carbon::now()->subHours(rand(1, 48)),
                    'assigned_by' => 1,
                    'assignment_notes' => 'Assigned for nursing care'
                ]);

                // Update bed status
                $bed->update(['status' => 'OCCUPIED']);

                // Create some vital signs
                for ($j = 0; $j < 3; $j++) {
                    VitalSign::create([
                        'encounter_id' => $encounter->id,
                        'recorded_by' => 1,
                        'temperature' => rand(360, 390) / 10, // 36.0 - 39.0
                        'systolic_bp' => rand(110, 140),
                        'diastolic_bp' => rand(70, 90),
                        'heart_rate' => rand(60, 100),
                        'respiratory_rate' => rand(12, 20),
                        'oxygen_saturation' => rand(95, 100),
                        'recorded_at' => Carbon::now()->subHours(rand(1, 24))
                    ]);
                }

                // Create medication administrations (skip if no prescriptions exist)
                // We'll create some sample data without prescriptions for now

                // Create care plan
                CarePlan::firstOrCreate([
                    'encounter_id' => $encounter->id,
                    'plan_date' => Carbon::today()
                ], [
                    'shift' => 'DAY',
                    'objectives' => 'Monitor vital signs, administer medications',
                    'nursing_notes' => 'Patient stable, continue current care plan',
                    'created_by' => 1
                ]);
            }
        }

        $this->command->info('Nurse dashboard test data created successfully!');
    }
}