<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\Appointment;
use App\Models\OpdQueue;
use App\Models\Invoice;
use Carbon\Carbon;

class ReceptionistDashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Create some sample patients if they don't exist
        $patients = [];
        $patientData = [
            ['John', 'Doe', 'john.doe@email.com', '1234567890'],
            ['Jane', 'Wilson', 'jane.wilson@email.com', '1234567891'],
            ['Mike', 'Brown', 'mike.brown@email.com', '1234567892'],
            ['Sarah', 'Johnson', 'sarah.johnson@email.com', '1234567893'],
            ['Robert', 'Lee', 'robert.lee@email.com', '1234567894'],
            ['Emily', 'Davis', 'emily.davis@email.com', '1234567895'],
        ];

        foreach ($patientData as $index => $data) {
            $patients[] = Patient::firstOrCreate(
                ['email' => $data[2]],
                [
                    'id' => 'PAT' . str_pad($index + 1, 6, '0', STR_PAD_LEFT),
                    'hospital_id' => 'P' . str_pad($index + 1000, 4, '0', STR_PAD_LEFT),
                    'first_name' => $data[0],
                    'last_name' => $data[1],
                    'phone' => $data[3],
                    'date_of_birth' => Carbon::now()->subYears(rand(25, 65)),
                    'gender' => rand(0, 1) ? 'M' : 'F',
                ]
            );
        }

        // Create some sample physicians if they don't exist
        $physicians = [];
        $physicianData = [
            ['Dr. Smith', 'Internal Medicine'],
            ['Dr. Johnson', 'Cardiology'],
            ['Dr. Davis', 'General Practice'],
        ];

        foreach ($physicianData as $index => $data) {
            // First create a user for the physician
            $user = \App\Models\User::firstOrCreate(
                ['email' => strtolower(str_replace([' ', '.'], ['', ''], $data[0])) . '@hospital.com'],
                [
                    'name' => $data[0],
                    'password' => \Illuminate\Support\Facades\Hash::make('password'),
                ]
            );

            $physicians[] = Physician::firstOrCreate(
                ['physician_code' => 'PHY' . str_pad($index + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'user_id' => $user->id,
                    'name' => $data[0],
                    'specialization' => $data[1],
                    'license_number' => 'LIC' . rand(10000, 99999),
                    'qualification' => 'MD',
                    'years_of_experience' => rand(5, 20),
                ]
            );
        }

        // Create today's appointments
        $today = Carbon::today();
        $appointmentTimes = ['09:00:00', '10:30:00', '14:00:00', '15:30:00', '16:00:00'];
        
        foreach ($appointmentTimes as $index => $time) {
            if (isset($patients[$index]) && isset($physicians[$index % count($physicians)])) {
                Appointment::firstOrCreate([
                    'patient_id' => $patients[$index]->id,
                    'physician_id' => $physicians[$index % count($physicians)]->physician_code,
                    'appointment_date' => $today,
                    'appointment_time' => $time,
                ], [
                    'appointment_number' => 'APT' . date('Ymd') . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                    'appointment_type' => ['SCHEDULED', 'WALK_IN'][rand(0, 1)],
                    'status' => ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'][rand(0, 2)],
                    'appointment_notes' => 'Sample appointment for testing',
                    'created_by' => \Illuminate\Support\Str::uuid(),
                ]);
            }
        }

        // Create OPD queue entries
        for ($i = 0; $i < 3; $i++) {
            if (isset($patients[$i + 3]) && isset($physicians[$i % count($physicians)])) {
                OpdQueue::firstOrCreate([
                    'patient_id' => $patients[$i + 3]->id,
                    'physician_id' => $physicians[$i % count($physicians)]->physician_code,
                    'queue_number' => $i + 1,
                ], [
                    'status' => 'WAITING',
                    'priority' => 'NORMAL',
                    'queue_type' => 'WALK_IN',
                    'created_at' => Carbon::now()->subMinutes(rand(5, 30)),
                ]);
            }
        }

        // Create some pending invoices
        for ($i = 0; $i < 2; $i++) {
            if (isset($patients[$i])) {
                Invoice::firstOrCreate([
                    'patient_id' => $patients[$i]->id,
                    'encounter_id' => $i + 1,
                ], [
                    'total_amount' => rand(100, 500),
                    'net_amount' => rand(100, 500),
                    'status' => 'unpaid',
                ]);
            }
        }
    }
}