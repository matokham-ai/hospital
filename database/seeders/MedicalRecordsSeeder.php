<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Encounter;
use App\Models\Physician;
use App\Models\Department;
use App\Models\VitalSign;
use App\Models\ClinicalNote;
use App\Models\Diagnosis;
use App\Models\LabOrder;
use App\Models\LabResult;
use App\Models\User;
use Carbon\Carbon;

class MedicalRecordsSeeder extends Seeder
{
    public function run()
    {
        // Create sample patients if they don't exist
        $patients = [
            [
                'id' => 'P001',
                'hospital_id' => 'H001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'date_of_birth' => '1979-01-15',
                'gender' => 'M',
                'marital_status' => 'Married',
                'occupation' => 'Engineer',
                'nationality' => 'American',
                'religion' => 'Christian',
                'allergies' => ['Penicillin', 'Shellfish'],
                'chronic_conditions' => ['Hypertension', 'Type 2 Diabetes'],
            ],
            [
                'id' => 'P002',
                'hospital_id' => 'H002',
                'first_name' => 'Sarah',
                'last_name' => 'Smith',
                'date_of_birth' => '1992-03-22',
                'gender' => 'F',
                'marital_status' => 'Single',
                'occupation' => 'Teacher',
                'nationality' => 'American',
                'religion' => 'Christian',
                'allergies' => [],
                'chronic_conditions' => [],
            ],
            [
                'id' => 'P003',
                'hospital_id' => 'H003',
                'first_name' => 'Robert',
                'last_name' => 'Johnson',
                'date_of_birth' => '1996-07-10',
                'gender' => 'M',
                'marital_status' => 'Single',
                'occupation' => 'Student',
                'nationality' => 'American',
                'religion' => 'Christian',
                'allergies' => [],
                'chronic_conditions' => [],
            ]
        ];

        foreach ($patients as $patientData) {
            Patient::updateOrCreate(['id' => $patientData['id']], $patientData);
        }

        // Create sample users for physicians
        $physicianUsers = [
            [
                'name' => 'Dr. Sarah Wilson',
                'email' => 'sarah.wilson@hospital.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Michael Chen',
                'email' => 'michael.chen@hospital.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ],
            [
                'name' => 'Dr. Emily Rodriguez',
                'email' => 'emily.rodriguez@hospital.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ],
        ];

        $createdUsers = [];
        foreach ($physicianUsers as $userData) {
            $user = User::firstOrCreate(['email' => $userData['email']], $userData);
            $createdUsers[] = $user;
        }

        // Create sample physicians if they don't exist
        $physicians = [
            [
                'physician_code' => 'PHY001',
                'user_id' => $createdUsers[0]->id,
                'name' => 'Dr. Sarah Wilson', 
                'specialization' => 'Internal Medicine',
                'license_number' => 'LIC001',
                'qualification' => 'MD',
                'years_of_experience' => 15,
                'is_consultant' => true
            ],
            [
                'physician_code' => 'PHY002',
                'user_id' => $createdUsers[1]->id,
                'name' => 'Dr. Michael Chen', 
                'specialization' => 'Pulmonology',
                'license_number' => 'LIC002',
                'qualification' => 'MD',
                'years_of_experience' => 12,
                'is_consultant' => true
            ],
            [
                'physician_code' => 'PHY003',
                'user_id' => $createdUsers[2]->id,
                'name' => 'Dr. Emily Rodriguez', 
                'specialization' => 'Emergency Medicine',
                'license_number' => 'LIC003',
                'qualification' => 'MD',
                'years_of_experience' => 8,
                'is_consultant' => false
            ],
        ];

        foreach ($physicians as $physicianData) {
            Physician::firstOrCreate(['physician_code' => $physicianData['physician_code']], $physicianData);
        }

        // Create sample departments if they don't exist
        $departments = [
            ['name' => 'Internal Medicine', 'code' => 'IM'],
            ['name' => 'Pulmonology', 'code' => 'PULM'],
            ['name' => 'Emergency Medicine', 'code' => 'EM'],
        ];

        foreach ($departments as $deptData) {
            Department::firstOrCreate(['name' => $deptData['name']], $deptData);
        }

        // Get created records
        $patient1 = Patient::find('P001');
        $patient2 = Patient::find('P002');
        $patient3 = Patient::find('P003');
        
        $physician1 = Physician::where('physician_code', 'PHY001')->first();
        $physician2 = Physician::where('physician_code', 'PHY002')->first();
        $physician3 = Physician::where('physician_code', 'PHY003')->first();
        
        $dept1 = Department::where('name', 'Internal Medicine')->first();
        $dept2 = Department::where('name', 'Pulmonology')->first();
        $dept3 = Department::where('name', 'Emergency Medicine')->first();

        // Create sample encounters
        $encounters = [
            [
                'patient_id' => $patient1->id,
                'encounter_number' => 'ENC001',
                'type' => 'OPD',
                'status' => 'ACTIVE',
                'department_id' => $dept1->id,
                'attending_physician_id' => $physician1->physician_code,
                'chief_complaint' => 'Headache and fatigue',
                'admission_datetime' => Carbon::now()->subDays(5),
            ],
            [
                'patient_id' => $patient2->id,
                'encounter_number' => 'ENC002',
                'type' => 'IPD',
                'status' => 'COMPLETED',
                'department_id' => $dept2->id,
                'attending_physician_id' => $physician2->physician_code,
                'chief_complaint' => 'Cough and fever',
                'admission_datetime' => Carbon::now()->subDays(10),
                'discharge_datetime' => Carbon::now()->subDays(3),
            ],
            [
                'patient_id' => $patient3->id,
                'encounter_number' => 'ENC003',
                'type' => 'EMERGENCY',
                'status' => 'COMPLETED',
                'department_id' => $dept3->id,
                'attending_physician_id' => $physician3->physician_code,
                'chief_complaint' => 'Severe abdominal pain',
                'admission_datetime' => Carbon::now()->subDays(20),
                'discharge_datetime' => Carbon::now()->subDays(18),
            ],
        ];

        foreach ($encounters as $encounterData) {
            $encounter = Encounter::updateOrCreate(
                ['encounter_number' => $encounterData['encounter_number']], 
                $encounterData
            );

            // Create vital signs
            VitalSign::updateOrCreate(
                ['encounter_id' => $encounter->id],
                [
                    'temperature' => rand(97, 102) + (rand(0, 9) / 10),
                    'systolic_bp' => rand(110, 160),
                    'diastolic_bp' => rand(70, 100),
                    'heart_rate' => rand(60, 100),
                    'respiratory_rate' => rand(12, 20),
                    'oxygen_saturation' => rand(94, 100),
                    'recorded_by' => 1, // Default user ID
                    'recorded_at' => $encounter->admission_datetime,
                ]
            );

            // Create clinical notes
            ClinicalNote::updateOrCreate(
                ['encounter_id' => $encounter->id],
                [
                    'note_type' => 'SOAP',
                    'content' => 'Patient presents with ' . $encounter->chief_complaint . '. Physical examination reveals... Patient shows good response to treatment. Continue current medication regimen.',
                    'created_by' => 1, // Default user ID
                    'note_datetime' => $encounter->admission_datetime,
                ]
            );

            // Create diagnoses
            $diagnoses = [
                'ENC001' => ['Hypertension', 'Type 2 Diabetes Mellitus'],
                'ENC002' => ['Community-acquired Pneumonia'],
                'ENC003' => ['Acute Appendicitis'],
            ];

            if (isset($diagnoses[$encounter->encounter_number])) {
                foreach ($diagnoses[$encounter->encounter_number] as $diagnosisText) {
                    Diagnosis::updateOrCreate(
                        [
                            'encounter_id' => $encounter->id,
                            'description' => $diagnosisText
                        ],
                        [
                            'icd10_code' => 'Z00.00', // Generic ICD-10 code
                            'type' => 'primary',
                            'diagnosed_by' => $encounter->attending_physician_id,
                            'diagnosed_at' => $encounter->admission_datetime,
                        ]
                    );
                }
            }

            // Create lab orders and results
            $labTests = [
                'ENC001' => [
                    ['test_name' => 'HbA1c', 'result' => '8.2%', 'normal_range' => '<7%', 'abnormal_flag' => 'high'],
                    ['test_name' => 'Fasting Glucose', 'result' => '180 mg/dL', 'normal_range' => '70-100 mg/dL', 'abnormal_flag' => 'high'],
                ],
                'ENC002' => [
                    ['test_name' => 'WBC Count', 'result' => '15,000/μL', 'normal_range' => '4,000-11,000/μL', 'abnormal_flag' => 'high'],
                    ['test_name' => 'CRP', 'result' => '45 mg/L', 'normal_range' => '<3 mg/L', 'abnormal_flag' => 'critical'],
                ],
                'ENC003' => [
                    ['test_name' => 'WBC Count', 'result' => '18,000/μL', 'normal_range' => '4,000-11,000/μL', 'abnormal_flag' => 'critical'],
                ],
            ];

            if (isset($labTests[$encounter->encounter_number])) {
                foreach ($labTests[$encounter->encounter_number] as $testData) {
                    $labOrder = LabOrder::updateOrCreate(
                        [
                            'encounter_id' => $encounter->id,
                            'test_name' => $testData['test_name']
                        ],
                        [
                            'patient_id' => $encounter->patient_id,
                            'ordered_by' => 1, // Default user ID
                            'status' => 'completed',
                        ]
                    );

                    LabResult::updateOrCreate(
                        ['lab_order_id' => $labOrder->id],
                        [
                            'parameter_name' => $testData['test_name'],
                            'value' => $testData['result'],
                            'result' => $testData['result'],
                            'normal_range' => $testData['normal_range'],
                            'reference_range' => $testData['normal_range'],
                            'status' => $testData['abnormal_flag'] === 'critical' ? 'critical' : 
                                       ($testData['abnormal_flag'] === 'high' ? 'abnormal' : 'normal'),
                            'validated_at' => $encounter->admission_datetime->addHours(2),
                        ]
                    );
                }
            }
        }

        $this->command->info('Medical records sample data created successfully!');
    }
}