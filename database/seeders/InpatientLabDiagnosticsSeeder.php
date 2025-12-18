<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InpatientLabDiagnosticsSeeder extends Seeder
{
    public function run()
    {
        // Get active IPD encounters
        $encounters = DB::table('encounters')
            ->where('type', 'IPD')
            ->where('status', 'ACTIVE')
            ->select('id', 'patient_id')
            ->get();

        if ($encounters->isEmpty()) {
            $this->command->info('No active IPD encounters found. Creating sample encounters first...');
            
            // Create a sample patient and encounter for testing
            $patientId = DB::table('patients')->insertGetId([
                'first_name' => 'John',
                'last_name' => 'Doe',
                'date_of_birth' => '1980-05-15',
                'gender' => 'M',
                'phone' => '555-0123',
                'email' => 'john.doe@example.com',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $encounterId = DB::table('encounters')->insertGetId([
                'encounter_number' => 'IPD-' . date('Ymd') . '-0001',
                'patient_id' => $patientId,
                'type' => 'IPD',
                'status' => 'ACTIVE',
                'admission_datetime' => now()->subDays(2),
                'chief_complaint' => 'Chest pain and shortness of breath',
                'priority' => 'URGENT',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $encounters = collect([
                (object)['id' => $encounterId, 'patient_id' => $patientId]
            ]);
        }

        foreach ($encounters as $encounter) {
            $this->seedLabOrders($encounter->id, $encounter->patient_id);
            $this->seedDiagnostics($encounter->id, $encounter->patient_id);
        }

        $this->command->info('Lab orders, lab results, and diagnostics seeded successfully!');
    }

    private function seedLabOrders($encounterId, $patientId)
    {
        $labTests = [
            ['test_name' => 'Complete Blood Count (CBC)', 'category' => 'Hematology'],
            ['test_name' => 'Basic Metabolic Panel', 'category' => 'Chemistry'],
            ['test_name' => 'Lipid Panel', 'category' => 'Chemistry'],
            ['test_name' => 'Liver Function Tests', 'category' => 'Chemistry'],
            ['test_name' => 'Troponin I', 'category' => 'Cardiac Markers'],
            ['test_name' => 'D-Dimer', 'category' => 'Coagulation'],
            ['test_name' => 'Urinalysis', 'category' => 'Urinalysis'],
            ['test_name' => 'Blood Culture', 'category' => 'Microbiology'],
        ];

        foreach ($labTests as $index => $test) {
            $labOrderId = DB::table('lab_orders')->insertGetId([
                'encounter_id' => $encounterId,
                'patient_id' => $patientId,
                'test_name' => $test['test_name'],
                'status' => rand(0, 1) ? 'completed' : 'pending',
                'ordered_by' => 'Dr. Smith',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Create lab results for completed orders
            $labOrder = DB::table('lab_orders')->where('id', $labOrderId)->first();
            if ($labOrder->status === 'completed') {
                $this->createLabResults($labOrderId, $test['test_name']);
            }
        }
    }

    private function createLabResults($labOrderId, $testName)
    {
        $results = [];

        switch ($testName) {
            case 'Complete Blood Count (CBC)':
                $results = [
                    ['parameter_name' => 'White Blood Cells', 'value' => '7.2', 'unit' => 'K/uL', 'reference_range' => '4.0-11.0', 'status' => 'normal'],
                    ['parameter_name' => 'Red Blood Cells', 'value' => '4.5', 'unit' => 'M/uL', 'reference_range' => '4.2-5.4', 'status' => 'normal'],
                    ['parameter_name' => 'Hemoglobin', 'value' => '13.8', 'unit' => 'g/dL', 'reference_range' => '12.0-16.0', 'status' => 'normal'],
                    ['parameter_name' => 'Hematocrit', 'value' => '41.2', 'unit' => '%', 'reference_range' => '36.0-46.0', 'status' => 'normal'],
                    ['parameter_name' => 'Platelets', 'value' => '285', 'unit' => 'K/uL', 'reference_range' => '150-450', 'status' => 'normal'],
                ];
                break;

            case 'Basic Metabolic Panel':
                $results = [
                    ['parameter_name' => 'Glucose', 'value' => '145', 'unit' => 'mg/dL', 'reference_range' => '70-100', 'status' => 'abnormal'],
                    ['parameter_name' => 'Sodium', 'value' => '138', 'unit' => 'mEq/L', 'reference_range' => '136-145', 'status' => 'normal'],
                    ['parameter_name' => 'Potassium', 'value' => '4.2', 'unit' => 'mEq/L', 'reference_range' => '3.5-5.0', 'status' => 'normal'],
                    ['parameter_name' => 'Chloride', 'value' => '102', 'unit' => 'mEq/L', 'reference_range' => '98-107', 'status' => 'normal'],
                    ['parameter_name' => 'BUN', 'value' => '18', 'unit' => 'mg/dL', 'reference_range' => '7-20', 'status' => 'normal'],
                    ['parameter_name' => 'Creatinine', 'value' => '1.1', 'unit' => 'mg/dL', 'reference_range' => '0.7-1.3', 'status' => 'normal'],
                ];
                break;

            case 'Troponin I':
                $results = [
                    ['parameter_name' => 'Troponin I', 'value' => '0.8', 'unit' => 'ng/mL', 'reference_range' => '<0.04', 'status' => 'critical'],
                ];
                break;

            case 'D-Dimer':
                $results = [
                    ['parameter_name' => 'D-Dimer', 'value' => '650', 'unit' => 'ng/mL', 'reference_range' => '<500', 'status' => 'abnormal'],
                ];
                break;

            case 'Lipid Panel':
                $results = [
                    ['parameter_name' => 'Total Cholesterol', 'value' => '220', 'unit' => 'mg/dL', 'reference_range' => '<200', 'status' => 'abnormal'],
                    ['parameter_name' => 'HDL Cholesterol', 'value' => '45', 'unit' => 'mg/dL', 'reference_range' => '>40', 'status' => 'normal'],
                    ['parameter_name' => 'LDL Cholesterol', 'value' => '145', 'unit' => 'mg/dL', 'reference_range' => '<100', 'status' => 'abnormal'],
                    ['parameter_name' => 'Triglycerides', 'value' => '180', 'unit' => 'mg/dL', 'reference_range' => '<150', 'status' => 'abnormal'],
                ];
                break;

            default:
                $results = [
                    ['parameter_name' => $testName, 'value' => 'Normal', 'unit' => '', 'reference_range' => 'Normal', 'status' => 'normal'],
                ];
        }

        foreach ($results as $result) {
            DB::table('lab_results')->insert([
                'lab_order_id' => $labOrderId,
                'parameter_name' => $result['parameter_name'],
                'value' => $result['value'],
                'unit' => $result['unit'],
                'reference_range' => $result['reference_range'],
                'status' => $result['status'],
                'validated_by' => 'Lab Tech ' . rand(1, 5),
                'validated_at' => now()->subHours(rand(1, 24)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedDiagnostics($encounterId, $patientId)
    {
        $diagnoses = [
            [
                'type' => 'PRIMARY',
                'icd10_code' => 'I21.9',
                'description' => 'Acute ST-elevation myocardial infarction (STEMI), unspecified',
                'diagnosed_by' => 'Dr. Johnson',
            ],
            [
                'type' => 'SECONDARY',
                'icd10_code' => 'E11.9',
                'description' => 'Type 2 diabetes mellitus without complications',
                'diagnosed_by' => 'Dr. Johnson',
            ],
            [
                'type' => 'SECONDARY',
                'icd10_code' => 'I10',
                'description' => 'Essential hypertension',
                'diagnosed_by' => 'Dr. Johnson',
            ],
            [
                'type' => 'SECONDARY',
                'icd10_code' => 'E78.5',
                'description' => 'Hyperlipidemia, unspecified',
                'diagnosed_by' => 'Dr. Johnson',
            ],
        ];

        foreach ($diagnoses as $diagnosis) {
            DB::table('diagnoses')->insert([
                'encounter_id' => $encounterId,
                'type' => $diagnosis['type'],
                'icd10_code' => $diagnosis['icd10_code'],
                'description' => $diagnosis['description'],
                'diagnosed_by' => $diagnosis['diagnosed_by'],
                'diagnosed_at' => now()->subHours(rand(1, 48)),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}