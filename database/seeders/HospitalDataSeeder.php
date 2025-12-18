<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Bed;
use App\Models\Ward;
use App\Models\Department;
use App\Models\LabOrder;
use App\Models\Prescription;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Physician;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class HospitalDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏥 Starting Hospital Data Seeding...');
        
        $today = Carbon::today();

        // Create Departments
        $this->command->info('📋 Creating Departments...');
        $departments = [
            ['deptid' => 'EMRG', 'name' => 'Emergency', 'code' => 'EMRG', 'description' => 'Emergency Department'],
            ['deptid' => 'CARD', 'name' => 'Cardiology', 'code' => 'CARD', 'description' => 'Heart and cardiovascular care'],
            ['deptid' => 'PEDI', 'name' => 'Pediatrics', 'code' => 'PEDI', 'description' => 'Children healthcare'],
            ['deptid' => 'SURG', 'name' => 'Surgery', 'code' => 'SURG', 'description' => 'Surgical procedures'],
            ['deptid' => 'RADI', 'name' => 'Radiology', 'code' => 'RADI', 'description' => 'Medical imaging'],
            ['deptid' => 'LABO', 'name' => 'Laboratory', 'code' => 'LABO', 'description' => 'Lab tests and diagnostics'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['deptid' => $dept['deptid']], $dept);
        }

        // Create Wards
        $this->command->info('🏨 Creating Wards...');
        $wards = [
            ['wardid' => 'ICU01', 'name' => 'ICU Ward', 'code' => 'ICU', 'ward_type' => 'ICU', 'total_beds' => 20],
            ['wardid' => 'GEN01', 'name' => 'General Ward A', 'code' => 'GWA', 'ward_type' => 'General', 'total_beds' => 40],
            ['wardid' => 'GEN02', 'name' => 'General Ward B', 'code' => 'GWB', 'ward_type' => 'General', 'total_beds' => 40],
            ['wardid' => 'PEDI01', 'name' => 'Pediatric Ward', 'code' => 'PED', 'ward_type' => 'Pediatric', 'total_beds' => 25],
            ['wardid' => 'MAT01', 'name' => 'Maternity Ward', 'code' => 'MAT', 'ward_type' => 'Maternity', 'total_beds' => 20],
        ];

        foreach ($wards as $ward) {
            Ward::firstOrCreate(['wardid' => $ward['wardid']], $ward);
        }

        // Create Beds
        $this->command->info('🛏️ Creating Beds...');
        $wardIds = Ward::pluck('wardid')->toArray();
        
        foreach ($wardIds as $wardId) {
            $ward = Ward::where('wardid', $wardId)->first();
            $totalBeds = $ward->total_beds;
            $occupiedBeds = (int)($totalBeds * 0.75); // 75% occupancy
            
            // Map ward types to bed types
            $bedTypeMap = [
                'ICU' => 'ICU',
                'General' => 'STANDARD',
                'Pediatric' => 'STANDARD',
                'Maternity' => 'PRIVATE'
            ];
            
            $bedType = $bedTypeMap[$ward->ward_type] ?? 'STANDARD';
            
            for ($i = 1; $i <= $totalBeds; $i++) {
                Bed::firstOrCreate([
                    'bed_number' => $wardId . '-' . str_pad($i, 3, '0', STR_PAD_LEFT)
                ], [
                    'ward_id' => $wardId,
                    'bed_number' => $wardId . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'bed_type' => $bedType,
                    'status' => $i <= $occupiedBeds ? 'OCCUPIED' : 'AVAILABLE'
                ]);
            }
        }

        // Create Patients
        $this->command->info('👥 Creating Patients...');
        $patients = [
            ['id' => 'PAT001', 'hospital_id' => 'HMS001', 'first_name' => 'John', 'last_name' => 'Doe', 'date_of_birth' => '1985-05-15', 'gender' => 'M'],
            ['id' => 'PAT002', 'hospital_id' => 'HMS002', 'first_name' => 'Jane', 'last_name' => 'Smith', 'date_of_birth' => '1990-08-22', 'gender' => 'F'],
            ['id' => 'PAT003', 'hospital_id' => 'HMS003', 'first_name' => 'Robert', 'last_name' => 'Johnson', 'date_of_birth' => '1978-12-03', 'gender' => 'M'],
            ['id' => 'PAT004', 'hospital_id' => 'HMS004', 'first_name' => 'Mary', 'last_name' => 'Williams', 'date_of_birth' => '1995-03-18', 'gender' => 'F'],
            ['id' => 'PAT005', 'hospital_id' => 'HMS005', 'first_name' => 'David', 'last_name' => 'Brown', 'date_of_birth' => '1982-07-09', 'gender' => 'M'],
            ['id' => 'PAT006', 'hospital_id' => 'HMS006', 'first_name' => 'Sarah', 'last_name' => 'Davis', 'date_of_birth' => '1988-11-25', 'gender' => 'F'],
            ['id' => 'PAT007', 'hospital_id' => 'HMS007', 'first_name' => 'Michael', 'last_name' => 'Miller', 'date_of_birth' => '1975-04-12', 'gender' => 'M'],
            ['id' => 'PAT008', 'hospital_id' => 'HMS008', 'first_name' => 'Lisa', 'last_name' => 'Wilson', 'date_of_birth' => '1992-09-30', 'gender' => 'F'],
            ['id' => 'PAT009', 'hospital_id' => 'HMS009', 'first_name' => 'James', 'last_name' => 'Anderson', 'date_of_birth' => '1987-03-14', 'gender' => 'M'],
            ['id' => 'PAT010', 'hospital_id' => 'HMS010', 'first_name' => 'Emily', 'last_name' => 'Taylor', 'date_of_birth' => '1993-11-08', 'gender' => 'F'],
        ];

        foreach ($patients as $patient) {
            Patient::firstOrCreate(['id' => $patient['id']], array_merge($patient, [
                'marital_status' => 'single',
                'nationality' => 'Kenyan',
                'allergies' => json_encode([]),
                'chronic_conditions' => json_encode([]),
                'alerts' => json_encode([])
            ]));
        }

        // Create Patient Contacts
        $this->command->info('📞 Creating Patient Contacts...');
        $patientContacts = [
            ['patient_id' => 'PAT001', 'phone_number' => '+254701234567', 'email' => 'john.doe@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT002', 'phone_number' => '+254702345678', 'email' => 'jane.smith@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT003', 'phone_number' => '+254703456789', 'email' => 'robert.johnson@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT004', 'phone_number' => '+254704567890', 'email' => 'mary.williams@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT005', 'phone_number' => '+254705678901', 'email' => 'david.brown@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT006', 'phone_number' => '+254706789012', 'email' => 'sarah.davis@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT007', 'phone_number' => '+254707890123', 'email' => 'michael.miller@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT008', 'phone_number' => '+254708901234', 'email' => 'lisa.wilson@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT009', 'phone_number' => '+254709012345', 'email' => 'james.anderson@email.com', 'is_primary' => true],
            ['patient_id' => 'PAT010', 'phone_number' => '+254700123456', 'email' => 'emily.taylor@email.com', 'is_primary' => true],
        ];

        foreach ($patientContacts as $contact) {
            \App\Models\PatientContact::firstOrCreate(
                ['patient_id' => $contact['patient_id'], 'is_primary' => true],
                array_merge($contact, [
                    'contact_type' => 'PRIMARY'
                ])
            );
        }

        // Create Doctor Users and Physicians
        $this->command->info('👨‍⚕️ Creating Physicians...');
        $doctors = [
            ['name' => 'Dr. John Smith', 'email' => 'dr.smith@hospital.com', 'specialization' => 'Cardiology', 'license' => 'MD001'],
            ['name' => 'Dr. Sarah Johnson', 'email' => 'dr.johnson@hospital.com', 'specialization' => 'Pediatrics', 'license' => 'MD002'],
            ['name' => 'Dr. Michael Brown', 'email' => 'dr.brown@hospital.com', 'specialization' => 'Surgery', 'license' => 'MD003'],
            ['name' => 'Dr. Emily Davis', 'email' => 'dr.davis@hospital.com', 'specialization' => 'Emergency Medicine', 'license' => 'MD004'],
            ['name' => 'Dr. Robert Wilson', 'email' => 'dr.wilson@hospital.com', 'specialization' => 'Radiology', 'license' => 'MD005'],
        ];

        foreach ($doctors as $doctor) {
            $user = User::firstOrCreate(['email' => $doctor['email']], [
                'name' => $doctor['name'],
                'email' => $doctor['email'],
                'password' => Hash::make('password@123'),
            ]);
            
            if (!$user->hasRole('Doctor')) {
                $user->assignRole('Doctor');
            }

            Physician::firstOrCreate(['physician_code' => 'PHY' . str_pad(array_search($doctor, $doctors) + 1, 3, '0', STR_PAD_LEFT)], [
                'physician_code' => 'PHY' . str_pad(array_search($doctor, $doctors) + 1, 3, '0', STR_PAD_LEFT),
                'user_id' => $user->id,
                'name' => $doctor['name'],
                'license_number' => $doctor['license'],
                'specialization' => $doctor['specialization'],
                'qualification' => 'MD',
                'is_consultant' => true,
            ]);
        }

        // Create Appointments
        $this->command->info('📅 Creating Appointments...');
        $patientIds = Patient::pluck('id')->toArray();
        $physicianCodes = Physician::pluck('physician_code')->toArray();
        $adminUser = User::where('email', 'admin@hospital.com')->first();
        
        if (!$adminUser) {
            $this->command->warn('Admin user not found, skipping appointments...');
        } else {
            // Create appointments for working hours only (8 AM to 6 PM = 10 hours)
            for ($i = 0; $i < 10; $i++) {
                $hour = 8 + $i; // 8 AM to 5 PM
                $appointmentTime = sprintf('%02d:00:00', $hour);
                $status = $i < 3 ? 'COMPLETED' : ($i < 6 ? 'IN_PROGRESS' : 'SCHEDULED');
                
                Appointment::firstOrCreate([
                    'appointment_number' => 'APT' . $today->format('Ymd') . str_pad($i + 1, 3, '0', STR_PAD_LEFT)
                ], [
                    'appointment_number' => 'APT' . $today->format('Ymd') . str_pad($i + 1, 3, '0', STR_PAD_LEFT),
                    'patient_id' => $patientIds[array_rand($patientIds)],
                    'physician_id' => $physicianCodes[array_rand($physicianCodes)],
                    'appointment_type' => 'SCHEDULED',
                    'status' => $status,
                    'appointment_date' => $today,
                    'appointment_time' => $appointmentTime,
                    'chief_complaint' => 'General consultation',
                    'created_by' => $adminUser->id,
                ]);
            }
        }

        // Create Lab Orders
        $this->command->info('🔬 Creating Lab Orders...');
        $labTests = [
            'Complete Blood Count', 'Lipid Panel', 'Thyroid Function Test', 'Liver Function Test',
            'Kidney Function Test', 'Blood Sugar Test', 'Urine Analysis', 'Chest X-Ray',
            'ECG', 'Ultrasound Scan', 'CT Scan', 'MRI Scan'
        ];

        for ($i = 0; $i < 35; $i++) {
            $status = $i < 8 ? 'pending' : ($i < 20 ? 'in_progress' : 'completed');
            $priority = $i < 5 ? 'urgent' : 'normal';
            
            LabOrder::create([
                'encounter_id' => $i + 1,
                'patient_id' => $patientIds[array_rand($patientIds)],
                'ordered_by' => $adminUser->id,
                'test_name' => $labTests[array_rand($labTests)],
                'status' => $status,
            ]);
        }

        // Create Prescriptions
        $this->command->info('💊 Creating Prescriptions...');
        $medications = [
            ['name' => 'Amoxicillin', 'dosage' => '500mg', 'frequency' => 'twice daily'],
            ['name' => 'Paracetamol', 'dosage' => '500mg', 'frequency' => 'as needed'],
            ['name' => 'Ibuprofen', 'dosage' => '400mg', 'frequency' => 'three times daily'],
            ['name' => 'Lisinopril', 'dosage' => '10mg', 'frequency' => 'once daily'],
            ['name' => 'Metformin', 'dosage' => '850mg', 'frequency' => 'twice daily'],
            ['name' => 'Aspirin', 'dosage' => '75mg', 'frequency' => 'once daily'],
        ];

        for ($i = 0; $i < 20; $i++) {
            $medication = $medications[array_rand($medications)];
            $status = $i < 8 ? 'pending' : ($i < 15 ? 'dispensed' : 'cancelled');
            
            Prescription::create([
                'encounter_id' => $i + 1,
                'patient_id' => $patientIds[array_rand($patientIds)],
                'physician_id' => $physicianCodes[array_rand($physicianCodes)],
                'drug_name' => $medication['name'],
                'dosage' => $medication['dosage'],
                'frequency' => $medication['frequency'],
                'duration' => rand(3, 14),
                'quantity' => rand(10, 60),
                'status' => $status,
            ]);
        }

        // Create Invoices
        $this->command->info('💰 Creating Invoices...');
        for ($i = 0; $i < 18; $i++) {
            $totalAmount = rand(150, 800);
            $discount = rand(0, 50);
            $netAmount = $totalAmount - $discount;
            $paidAmount = $i < 4 ? 0 : ($i < 12 ? $netAmount : rand(0, $netAmount));
            $balance = $netAmount - $paidAmount;
            $status = $balance == 0 ? 'paid' : ($paidAmount > 0 ? 'partial' : 'unpaid');
            
            Invoice::create([
                'encounter_id' => $i + 1,
                'patient_id' => $patientIds[array_rand($patientIds)],
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'net_amount' => $netAmount,
                'paid_amount' => $paidAmount,
                'balance' => $balance,
                'status' => $status,
            ]);
        }

        $this->command->info('✅ Hospital data seeded successfully!');
        $this->command->info('📊 Summary:');
        $this->command->info('   - Departments: ' . Department::count());
        $this->command->info('   - Wards: ' . Ward::count());
        $this->command->info('   - Beds: ' . Bed::count());
        $this->command->info('   - Patients: ' . Patient::count());
        $this->command->info('   - Patient Contacts: ' . \App\Models\PatientContact::count());
        $this->command->info('   - Physicians: ' . Physician::count());
        $this->command->info('   - Appointments: ' . Appointment::count());
        $this->command->info('   - Lab Orders: ' . LabOrder::count());
        $this->command->info('   - Prescriptions: ' . Prescription::count());
        $this->command->info('   - Invoices: ' . Invoice::count());
    }
}