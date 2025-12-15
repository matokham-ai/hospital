<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\Alert;
use App\Models\Assessment;
use App\Models\User;
use App\Models\Patient;
use Carbon\Carbon;

class NurseTasksSeeder extends Seeder
{
    public function run(): void
    {
        // Get a nurse user (assuming role-based system)
        $nurse = User::whereHas('roles', function($query) {
            $query->where('name', 'Nurse');
        })->first();

        // If no nurse found, get any user
        if (!$nurse) {
            $nurse = User::first();
        }

        if (!$nurse) {
            $this->command->info('No users found. Please create users first.');
            return;
        }

        // Get some patients
        $patients = Patient::limit(3)->get();

        if ($patients->isEmpty()) {
            $this->command->info('No patients found. Please create patients first.');
            return;
        }

        // Create sample tasks
        $tasks = [
            [
                'title' => 'Complete patient rounds',
                'description' => 'Check on all assigned patients and update their status',
                'priority' => 'high',
                'due_date' => Carbon::now()->addHours(2),
                'assigned_to' => $nurse->id,
                'assigned_by' => $nurse->id,
            ],
            [
                'title' => 'Update care plans',
                'description' => 'Review and update care plans for patients in room 101-105',
                'priority' => 'medium',
                'due_date' => Carbon::now()->addHours(4),
                'assigned_to' => $nurse->id,
                'assigned_by' => $nurse->id,
            ],
            [
                'title' => 'Medication inventory check',
                'description' => 'Verify medication stock levels and report shortages',
                'priority' => 'low',
                'due_date' => Carbon::now()->addDay(),
                'assigned_to' => $nurse->id,
                'assigned_by' => $nurse->id,
            ],
        ];

        foreach ($tasks as $taskData) {
            Task::create($taskData);
        }

        // Create sample alerts
        foreach ($patients as $index => $patient) {
            Alert::create([
                'patient_id' => $patient->id,
                'type' => ['medical', 'vital_signs', 'medication'][$index % 3],
                'priority' => ['high', 'medium', 'critical'][$index % 3],
                'message' => [
                    'Patient showing signs of elevated temperature',
                    'Blood pressure readings outside normal range',
                    'Medication allergy alert - check before administration'
                ][$index % 3],
                'notes' => 'Requires immediate nursing attention',
                'created_by' => $nurse->id,
            ]);
        }

        // Create sample assessments
        foreach ($patients as $index => $patient) {
            Assessment::create([
                'patient_id' => $patient->id,
                'assessment_date' => Carbon::today(),
                'type' => ['daily', 'admission', 'specialty'][$index % 3],
                'findings' => [
                    'general_condition' => 'stable',
                    'mobility' => 'assisted',
                    'pain_level' => rand(1, 5)
                ],
                'recommendations' => [
                    'continue_current_treatment',
                    'monitor_vital_signs_q4h',
                    'encourage_mobility'
                ],
                'assessed_by' => $nurse->id,
            ]);
        }

        // Create sample medication administrations and vital signs
        $encounters = \App\Models\Encounter::whereIn('patient_id', $patients->pluck('id'))->get();
        
        foreach ($encounters as $encounter) {
            // Create some sample vital signs
            \App\Models\VitalSign::create([
                'encounter_id' => $encounter->id,
                'temperature' => 36.5 + (rand(-10, 10) / 10),
                'heart_rate' => 70 + rand(-10, 20),
                'systolic_bp' => 120 + rand(-20, 20),
                'diastolic_bp' => 80 + rand(-10, 10),
                'respiratory_rate' => 16 + rand(-4, 4),
                'oxygen_saturation' => 98 + rand(-3, 2),
                'notes' => 'Patient stable, no concerns',
                'recorded_at' => Carbon::now()->subHours(rand(1, 12)),
                'recorded_by' => $nurse->id
            ]);
            // Create sample prescriptions first
            $medications = [
                ['drug_name' => 'Paracetamol', 'dosage' => '500mg', 'frequency' => 'TID'],
                ['drug_name' => 'Amoxicillin', 'dosage' => '250mg', 'frequency' => 'BID'],
                ['drug_name' => 'Ibuprofen', 'dosage' => '400mg', 'frequency' => 'QID'],
                ['drug_name' => 'Aspirin', 'dosage' => '75mg', 'frequency' => 'OD']
            ];

            foreach ($medications as $index => $med) {
                $prescription = \App\Models\Prescription::create([
                    'encounter_id' => $encounter->id,
                    'patient_id' => $encounter->patient_id,
                    'physician_id' => 'DOC001', // Use the first physician
                    'drug_name' => $med['drug_name'],
                    'dosage' => $med['dosage'],
                    'frequency' => $med['frequency'],
                    'duration' => '7',
                    'quantity' => 21,
                    'status' => 'verified'
                ]);

                // Create medication administration records for each prescription
                $scheduledTimes = [
                    Carbon::now()->addHour(),
                    Carbon::now()->addHours(2),
                    Carbon::now()->subHour(),
                    Carbon::now()->subHours(4)
                ];

                $statuses = ['due', 'due', 'due', 'given'];

                \App\Models\MedicationAdministration::create([
                    'prescription_id' => $prescription->id,
                    'encounter_id' => $encounter->id,
                    'patient_id' => $encounter->patient_id,
                    'scheduled_time' => $scheduledTimes[$index],
                    'status' => $statuses[$index],
                    'administered_at' => $statuses[$index] === 'given' ? $scheduledTimes[$index] : null,
                    'administered_by' => $statuses[$index] === 'given' ? $nurse->id : null,
                    'dosage_given' => $statuses[$index] === 'given' ? $med['dosage'] : null
                ]);
            }
        }

        $this->command->info('Sample nurse tasks, alerts, assessments, and medications created successfully!');
    }
}