<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Patient;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\BedAssignment;
use App\Models\Encounter;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Physician;
use App\Models\VitalSign;
use App\Models\CarePlan;
use App\Models\MedicationAdministration;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class NurseLiveDataSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('🏥 Starting Nurse Live Data Seeding...');

        // 1. Ensure branches exist
        $this->seedBranches();

        // 2. Create nurse users
        $nurses = $this->seedNurses();

        // 3. Create departments
        $departments = $this->seedDepartments();

        // 4. Create physicians
        $physicians = $this->seedPhysicians();

        // 5. Create wards
        $wards = $this->seedWards($departments);

        // 6. Create beds
        $beds = $this->seedBeds($wards);

        // 7. Create patients
        $patients = $this->seedPatients();

        // 8. Create active encounters (IPD)
        $encounters = $this->seedEncounters($patients, $physicians, $departments);

        // 9. Create bed assignments
        $this->seedBedAssignments($encounters, $beds, $nurses);

        // 10. Create vital signs
        $this->seedVitalSigns($encounters, $nurses);

        // 11. Create care plans
        $this->seedCarePlans($encounters, $nurses);

        $this->command->info('✅ Nurse Live Data Seeding Complete!');
        $this->command->info('📊 Summary:');
        $this->command->info('   - Nurses: ' . count($nurses));
        $this->command->info('   - Wards: ' . count($wards));
        $this->command->info('   - Beds: ' . count($beds));
        $this->command->info('   - Patients: ' . count($patients));
        $this->command->info('   - Active Encounters: ' . count($encounters));
    }

    private function seedBranches()
    {
        if (Branch::count() === 0) {
            $this->command->info('Creating branches...');
            $this->call(BranchSeeder::class);
        } else {
            $this->command->info('Branches already exist, skipping...');
        }
    }

    private function seedNurses()
    {
        $this->command->info('Creating nurse users...');
        
        // Ensure nurse role exists
        $nurseRole = Role::firstOrCreate(['name' => 'Nurse', 'guard_name' => 'web']);

        $branches = Branch::all();
        
        if ($branches->isEmpty()) {
            $this->command->warn('No branches found! Creating default branch...');
            $branches = collect([Branch::create([
                'branch_name' => 'Main Hospital',
                'branch_code' => 'MAIN',
                'address' => 'Main Street',
                'phone' => '+254-700-000000',
                'status' => 'active',
            ])]);
        }

        $nurses = [];

        $nurseData = [
            ['name' => 'Sarah Johnson', 'email' => 'nurse.sarah@hospital.com'],
            ['name' => 'Michael Chen', 'email' => 'nurse.michael@hospital.com'],
            ['name' => 'Amina Hassan', 'email' => 'nurse.amina@hospital.com'],
            ['name' => 'David Omondi', 'email' => 'nurse.david@hospital.com'],
            ['name' => 'Grace Wanjiru', 'email' => 'nurse.grace@hospital.com'],
            ['name' => 'Nurse Mary', 'email' => 'nurse@hospital.com'],
            ['name' => 'Nurse Manager Lisa', 'email' => 'lisa.manager@hospital.com'],
            ['name' => 'Nurse Jennifer Smith', 'email' => 'jennifer.smith@hospital.com'],
            ['name' => 'Nurse Robert Wilson', 'email' => 'robert.wilson@hospital.com'],
        ];

        foreach ($nurseData as $index => $data) {
            $branchId = $branches[$index % $branches->count()]->id;
            
            $nurse = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'status' => 'active',
                    'branch_id' => $branchId,
                ]
            );

            // Update branch_id if user exists but doesn't have one
            if (!$nurse->branch_id) {
                $nurse->update(['branch_id' => $branchId]);
            }

            if (!$nurse->hasRole('Nurse')) {
                $nurse->assignRole($nurseRole);
            }

            $nurses[] = $nurse;
            $this->command->info("  ✓ {$data['name']} assigned to branch: {$branches[$index % $branches->count()]->branch_name}");
        }

        return $nurses;
    }

    private function seedDepartments()
    {
        $this->command->info('Creating departments...');
        
        $departmentData = [
            ['deptid' => 'DEPT001', 'name' => 'Internal Medicine', 'code' => 'IM'],
            ['deptid' => 'DEPT002', 'name' => 'Surgery', 'code' => 'SURG'],
            ['deptid' => 'DEPT003', 'name' => 'Pediatrics', 'code' => 'PED'],
            ['deptid' => 'DEPT004', 'name' => 'Obstetrics & Gynecology', 'code' => 'OBGYN'],
            ['deptid' => 'DEPT005', 'name' => 'Emergency', 'code' => 'ER'],
        ];

        $departments = [];
        foreach ($departmentData as $data) {
            $departments[] = Department::firstOrCreate(
                ['deptid' => $data['deptid']],
                $data
            );
        }

        return $departments;
    }

    private function seedPhysicians()
    {
        $this->command->info('Creating physicians...');
        
        // Ensure doctor role exists
        $doctorRole = Role::firstOrCreate(['name' => 'doctor', 'guard_name' => 'web']);

        $physicianData = [
            ['physician_code' => 'PHY001', 'name' => 'Dr. James Kimani', 'specialization' => 'Internal Medicine', 'email' => 'dr.kimani@hospital.com'],
            ['physician_code' => 'PHY002', 'name' => 'Dr. Mary Njeri', 'specialization' => 'Surgery', 'email' => 'dr.njeri@hospital.com'],
            ['physician_code' => 'PHY003', 'name' => 'Dr. Peter Mwangi', 'specialization' => 'Pediatrics', 'email' => 'dr.mwangi@hospital.com'],
        ];

        $physicians = [];
        foreach ($physicianData as $data) {
            // Create user for physician
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'status' => 'active',
                ]
            );

            if (!$user->hasRole('doctor')) {
                $user->assignRole($doctorRole);
            }

            // Create physician record
            $physicians[] = Physician::firstOrCreate(
                ['physician_code' => $data['physician_code']],
                [
                    'user_id' => $user->id,
                    'name' => $data['name'],
                    'license_number' => 'LIC' . rand(10000, 99999),
                    'specialization' => $data['specialization'],
                    'qualification' => 'MD',
                    'years_of_experience' => rand(5, 20),
                    'is_consultant' => rand(0, 1),
                ]
            );
        }

        return $physicians;
    }

    private function seedWards($departments)
    {
        $this->command->info('Creating wards...');
        
        $wardData = [
            ['wardid' => 'WARD001', 'name' => 'General Medical Ward', 'code' => 'GMW', 'ward_type' => 'GENERAL', 'total_beds' => 20],
            ['wardid' => 'WARD002', 'name' => 'Surgical Ward', 'code' => 'SW', 'ward_type' => 'GENERAL', 'total_beds' => 15],
            ['wardid' => 'WARD003', 'name' => 'Intensive Care Unit', 'code' => 'ICU', 'ward_type' => 'ICU', 'total_beds' => 10],
            ['wardid' => 'WARD004', 'name' => 'Pediatric Ward', 'code' => 'PED', 'ward_type' => 'PEDIATRIC', 'total_beds' => 12],
            ['wardid' => 'WARD005', 'name' => 'Maternity Ward', 'code' => 'MAT', 'ward_type' => 'MATERNITY', 'total_beds' => 18],
        ];

        $wards = [];
        foreach ($wardData as $index => $data) {
            $wards[] = Ward::firstOrCreate(
                ['wardid' => $data['wardid']],
                [
                    'name' => $data['name'],
                    'code' => $data['code'],
                    'department_id' => $departments[$index % count($departments)]->deptid ?? null,
                    'ward_type' => $data['ward_type'],
                    'total_beds' => $data['total_beds'],
                    'status' => 'active',
                ]
            );
        }

        return $wards;
    }

    private function seedBeds($wards)
    {
        $this->command->info('Creating beds...');
        
        $beds = [];
        foreach ($wards as $ward) {
            $bedCount = min($ward->total_beds, 10); // Create up to 10 beds per ward for testing
            
            for ($i = 1; $i <= $bedCount; $i++) {
                $bedType = match($ward->ward_type) {
                    'ICU' => 'ICU',
                    'ISOLATION' => 'ISOLATION',
                    'PRIVATE' => 'PRIVATE',
                    default => 'STANDARD'
                };

                $beds[] = Bed::firstOrCreate(
                    [
                        'ward_id' => $ward->wardid,
                        'bed_number' => sprintf('%s-%03d', $ward->code, $i)
                    ],
                    [
                        'bed_type' => $bedType,
                        'status' => 'AVAILABLE',
                    ]
                );
            }
        }

        return $beds;
    }

    private function seedPatients()
    {
        $this->command->info('Creating patients...');
        
        $patientData = [
            ['first_name' => 'John', 'last_name' => 'Kamau', 'gender' => 'M', 'dob' => '1985-03-15', 'condition' => 'Pneumonia'],
            ['first_name' => 'Mary', 'last_name' => 'Akinyi', 'gender' => 'F', 'dob' => '1992-07-22', 'condition' => 'Post-operative care'],
            ['first_name' => 'Peter', 'last_name' => 'Ochieng', 'gender' => 'M', 'dob' => '1978-11-08', 'condition' => 'Diabetes management'],
            ['first_name' => 'Jane', 'last_name' => 'Wambui', 'gender' => 'F', 'dob' => '1988-05-30', 'condition' => 'Hypertension'],
            ['first_name' => 'David', 'last_name' => 'Kipchoge', 'gender' => 'M', 'dob' => '1995-09-12', 'condition' => 'Fracture recovery'],
            ['first_name' => 'Sarah', 'last_name' => 'Njoki', 'gender' => 'F', 'dob' => '1990-02-18', 'condition' => 'Asthma exacerbation'],
            ['first_name' => 'James', 'last_name' => 'Mutua', 'gender' => 'M', 'dob' => '1982-12-25', 'condition' => 'Cardiac monitoring'],
            ['first_name' => 'Grace', 'last_name' => 'Chebet', 'gender' => 'F', 'dob' => '1987-06-14', 'condition' => 'Pregnancy complications'],
        ];

        $patients = [];
        foreach ($patientData as $index => $data) {
            $hospitalId = 'PAT' . str_pad($index + 1, 6, '0', STR_PAD_LEFT);
            
            $patients[] = Patient::firstOrCreate(
                ['hospital_id' => $hospitalId],
                [
                    'id' => $hospitalId,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'phone' => '+254-7' . rand(10000000, 99999999),
                    'email' => strtolower($data['first_name'] . '.' . $data['last_name']) . '@email.com',
                    'date_of_birth' => $data['dob'],
                    'gender' => $data['gender'],
                    'marital_status' => ['Single', 'Married', 'Divorced'][rand(0, 2)],
                    'nationality' => 'Kenyan',
                    'chronic_conditions' => [$data['condition']],
                    'allergies' => rand(0, 1) ? ['Penicillin'] : [],
                ]
            );
        }

        return $patients;
    }

    private function seedEncounters($patients, $physicians, $departments)
    {
        $this->command->info('Creating active encounters...');
        
        $encounters = [];
        foreach ($patients as $index => $patient) {
            $encounterNumber = 'ENC' . date('Ymd') . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
            
            $encounters[] = Encounter::firstOrCreate(
                ['encounter_number' => $encounterNumber],
                [
                    'patient_id' => $patient->id,
                    'type' => 'IPD',
                    'status' => 'ACTIVE',
                    'department_id' => $departments[$index % count($departments)]->deptid,
                    'attending_physician_id' => $physicians[$index % count($physicians)]->physician_code,
                    'chief_complaint' => $patient->chronic_conditions[0] ?? 'General admission',
                    'admission_datetime' => Carbon::now()->subDays(rand(1, 7))->subHours(rand(0, 23)),
                ]
            );
        }

        return $encounters;
    }

    private function seedBedAssignments($encounters, $beds, $nurses)
    {
        $this->command->info('Creating bed assignments...');
        
        foreach ($encounters as $index => $encounter) {
            if ($index < count($beds)) {
                $bed = $beds[$index];
                
                BedAssignment::firstOrCreate(
                    ['encounter_id' => $encounter->id],
                    [
                        'bed_id' => $bed->id,
                        'assigned_at' => $encounter->admission_datetime,
                        'assigned_by' => $nurses[$index % count($nurses)]->id,
                        'assignment_notes' => 'Admitted to ' . $bed->ward->name,
                    ]
                );

                // Update bed status
                $bed->update(['status' => 'OCCUPIED', 'last_occupied_at' => $encounter->admission_datetime]);
            }
        }
    }

    private function seedVitalSigns($encounters, $nurses)
    {
        $this->command->info('Creating vital signs...');
        
        foreach ($encounters as $encounter) {
            // Create 3-5 vital sign records per patient
            $recordCount = rand(3, 5);
            
            for ($i = 0; $i < $recordCount; $i++) {
                VitalSign::create([
                    'encounter_id' => $encounter->id,
                    'recorded_by' => $nurses[array_rand($nurses)]->id,
                    'temperature' => round(rand(360, 390) / 10, 1), // 36.0 - 39.0
                    'systolic_bp' => rand(110, 150),
                    'diastolic_bp' => rand(70, 95),
                    'heart_rate' => rand(60, 110),
                    'respiratory_rate' => rand(12, 24),
                    'oxygen_saturation' => rand(92, 100),
                    'recorded_at' => Carbon::now()->subHours($i * 6), // Every 6 hours
                ]);
            }
        }
    }

    private function seedCarePlans($encounters, $nurses)
    {
        $this->command->info('Creating care plans...');
        
        $shifts = ['DAY', 'EVENING', 'NIGHT'];
        $statuses = ['pending', 'in_progress', 'completed'];
        
        foreach ($encounters as $encounter) {
            $shift = $shifts[array_rand($shifts)];
            $status = $statuses[array_rand($statuses)];
            
            CarePlan::firstOrCreate(
                [
                    'encounter_id' => $encounter->id,
                    'plan_date' => Carbon::today(),
                ],
                [
                    'shift' => $shift,
                    'status' => $status,
                    'objectives' => 'Monitor vital signs q4h, administer medications as prescribed, assess pain levels',
                    'nursing_notes' => 'Patient stable and comfortable. Vital signs within normal limits. No acute concerns.',
                    'created_by' => $nurses[array_rand($nurses)]->id,
                ]
            );
        }
    }
}
