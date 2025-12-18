<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LabOrderSeeder extends Seeder
{
    public function run()
    {
        // Get some patient IDs
        $patientIds = DB::table('patients')->pluck('id')->take(5)->toArray();
        
        if (empty($patientIds)) {
            $this->command->info('No patients found. Please seed patients first.');
            return;
        }

        $labOrders = [
            [
                'patient_id' => $patientIds[0] ?? 'PAT001',
                'test_name' => 'Complete Blood Count (CBC)',
                'priority' => 'routine',
                'status' => 'pending',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'patient_id' => $patientIds[1] ?? 'PAT002',
                'test_name' => 'Liver Function Test',
                'priority' => 'urgent',
                'status' => 'in_progress',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subHours(6),
            ],
            [
                'patient_id' => $patientIds[2] ?? 'PAT003',
                'test_name' => 'Random Blood Sugar (RBS)',
                'priority' => 'stat',
                'status' => 'completed',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subHours(12),
                'updated_at' => now()->subHours(2),
            ],
            [
                'patient_id' => $patientIds[0] ?? 'PAT001',
                'test_name' => 'Complete Blood Count (CBC)',
                'priority' => 'routine',
                'status' => 'completed',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subHours(24),
                'updated_at' => now()->subHours(4),
            ],
            [
                'patient_id' => $patientIds[1] ?? 'PAT002',
                'test_name' => 'Liver Function Test',
                'priority' => 'urgent',
                'status' => 'completed',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subHours(18),
                'updated_at' => now()->subHours(3),
            ],
            [
                'patient_id' => $patientIds[3] ?? 'PAT004',
                'test_name' => 'Thyroid Function Test (T3, T4, TSH)',
                'priority' => 'routine',
                'status' => 'pending',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subHours(8),
                'updated_at' => now()->subHours(8),
            ],
            [
                'patient_id' => $patientIds[4] ?? 'PAT005',
                'test_name' => 'Urine Culture and Sensitivity',
                'priority' => 'urgent',
                'status' => 'cancelled',
                'ordered_by' => 1,
                'encounter_id' => 1,
                'created_at' => now()->subHours(4),
                'updated_at' => now()->subHours(1),
            ],
        ];

        DB::table('lab_orders')->insert($labOrders);
        
        $this->command->info('Lab orders seeded successfully!');
    }
}