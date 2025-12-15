<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EncountersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🏥 Creating Patient Encounters...\n";

        // Get patients, physicians, and departments
        $patients = DB::table('patients')->get();
        $physicians = DB::table('physicians')->get();
        $departments = DB::table('departments')->pluck('deptid')->toArray();

        if ($patients->isEmpty() || $physicians->isEmpty() || empty($departments)) {
            echo "⚠️  No patients, physicians, or departments found. Please seed them first.\n";
            return;
        }

        $encounters = [];
        $encounterId = 1;

        // Create 2-3 encounters per patient
        foreach ($patients as $patient) {
            $numEncounters = rand(2, 3);
            
            for ($i = 0; $i < $numEncounters; $i++) {
                $physician = $physicians->random();
                $encounterDate = Carbon::now()->subDays(rand(1, 90));
                
                $encounters[] = [
                    'id' => $encounterId++,
                    'patient_id' => $patient->id,
                    'encounter_number' => 'ENC-' . time() . str_pad($encounterId, 4, '0', STR_PAD_LEFT),
                    'type' => $this->getRandomEncounterType(),
                    'status' => $this->getRandomStatus(),
                    'department_id' => $departments[array_rand($departments)], // Random actual department ID
                    'attending_physician_id' => $physician->physician_code,
                    'chief_complaint' => $this->getRandomChiefComplaint(),
                    'admission_datetime' => $encounterDate->format('Y-m-d H:i:s'),
                    'discharge_datetime' => rand(0, 1) ? $encounterDate->copy()->addHours(rand(2, 24))->format('Y-m-d H:i:s') : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert encounters in chunks
        $chunks = array_chunk($encounters, 50);
        foreach ($chunks as $chunk) {
            DB::table('encounters')->insert($chunk);
        }

        echo "✅ Created " . count($encounters) . " patient encounters\n";
    }

    private function getRandomEncounterType(): string
    {
        $types = ['OPD', 'IPD', 'EMERGENCY'];
        return $types[array_rand($types)];
    }

    private function getRandomChiefComplaint(): string
    {
        $complaints = [
            'Chest pain',
            'Shortness of breath',
            'Abdominal pain',
            'Headache',
            'Fever',
            'Cough',
            'Back pain',
            'Joint pain',
            'Fatigue',
            'Dizziness',
            'Nausea',
            'Skin rash',
            'Anxiety',
            'Depression',
            'Sleep problems'
        ];
        return $complaints[array_rand($complaints)];
    }

    private function getRandomStatus(): string
    {
        $statuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
        return $statuses[array_rand($statuses)];
    }
}