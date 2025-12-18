<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\Appointment;

use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class DoctorDashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Create a doctor user if it doesn't exist
        $doctorUser = User::firstOrCreate(
            ['email' => 'doctor@hospital.com'],
            [
                'name' => 'Dr. John Smith',
                'password' => Hash::make('password@123'),
            ]
        );

        // Assign doctor role
        if (!$doctorUser->hasRole('Doctor')) {
            $doctorUser->assignRole('Doctor');
        }

        // Create physician record
        $physician = Physician::firstOrCreate(
            ['physician_code' => 'DOC001'],
            [
                'user_id' => $doctorUser->id,
                'name' => 'Dr. John Smith',
                'specialization' => 'Internal Medicine',
                'license_number' => 'LIC12345',
                'qualification' => 'MD, MBBS',
                'years_of_experience' => 10,
            ]
        );

        // Create some patients if they don't exist
        $patients = [];
        $patientData = [
            ['Alice', 'Johnson', 'alice.johnson@email.com', '1234567890'],
            ['Bob', 'Wilson', 'bob.wilson@email.com', '1234567891'],
            ['Carol', 'Brown', 'carol.brown@email.com', '1234567892'],
            ['David', 'Davis', 'david.davis@email.com', '1234567893'],
            ['Eva', 'Miller', 'eva.miller@email.com', '1234567894'],
        ];

        foreach ($patientData as $index => $data) {
            $patients[] = Patient::firstOrCreate(
                ['email' => $data[2]],
                [
                    'id' => 'PAT' . str_pad($index + 100, 6, '0', STR_PAD_LEFT),
                    'hospital_id' => 'P' . str_pad($index + 2000, 4, '0', STR_PAD_LEFT),
                    'first_name' => $data[0],
                    'last_name' => $data[1],
                    'phone' => $data[3],
                    'date_of_birth' => Carbon::now()->subYears(rand(25, 65)),
                    'gender' => rand(0, 1) ? 'M' : 'F',
                ]
            );
        }

        // Create today's appointments for the doctor
        $today = Carbon::today();
        $appointmentTimes = ['09:00:00', '10:30:00', '11:00:00', '14:00:00', '15:30:00'];
        
        foreach ($appointmentTimes as $index => $time) {
            if (isset($patients[$index])) {
                Appointment::firstOrCreate([
                    'patient_id' => $patients[$index]->id,
                    'physician_id' => $physician->physician_code,
                    'appointment_date' => $today,
                    'appointment_time' => $time,
                ], [
                    'appointment_number' => 'APT' . date('Ymd') . str_pad($index + 10, 3, '0', STR_PAD_LEFT),
                    'appointment_type' => ['SCHEDULED', 'WALK_IN', 'EMERGENCY'][rand(0, 2)],
                    'status' => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'][rand(0, 2)],
                    'appointment_notes' => 'Sample appointment for doctor dashboard',
                    'created_by' => $doctorUser->id,
                ]);
            }
        }

        // Note: Prescriptions and lab orders will be created through the actual workflow
        // This seeder focuses on appointments which are the main dashboard data
    }
}