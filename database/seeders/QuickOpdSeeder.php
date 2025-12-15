<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\User;
use App\Models\OpdAppointment;
use Carbon\Carbon;

class QuickOpdSeeder extends Seeder
{
    public function run()
    {
        // Create a doctor user if none exists
        $doctor = User::firstOrCreate(
            ['email' => 'doctor@hospital.com'],
            [
                'name' => 'Dr. John Smith',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create some patients
        $patients = [];
        for ($i = 1; $i <= 5; $i++) {
            $patients[] = Patient::firstOrCreate(
                ['hospital_id' => 'HID00' . $i],
                [
                    'id' => 'PAT00' . $i,
                    'hospital_id' => 'HID00' . $i,
                    'first_name' => 'Patient',
                    'last_name' => 'Number ' . $i,
                    'phone' => '+25470000000' . $i,
                    'email' => 'patient' . $i . '@example.com',
                    'date_of_birth' => '1990-01-0' . $i,
                    'gender' => $i % 2 == 0 ? 'F' : 'M',
                    'nationality' => 'Kenyan',
                ]
            );
        }

        // Create some OPD appointments for today
        $statuses = ['WAITING', 'IN_PROGRESS', 'COMPLETED'];
        $appointmentTypes = ['WALK_IN', 'SCHEDULED', 'EMERGENCY'];
        $complaints = [
            'General checkup',
            'Fever and headache',
            'Stomach pain',
            'Cough and cold',
            'Back pain'
        ];

        foreach ($patients as $index => $patient) {
            $status = $statuses[$index % 3];
            $queueNumber = $index + 1;
            
            $appointment = OpdAppointment::create([
                'appointment_number' => 'OPD' . date('Ymd') . str_pad($queueNumber, 4, '0', STR_PAD_LEFT),
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_date' => today(),
                'appointment_time' => Carbon::now()->addMinutes($index * 30)->format('H:i'),
                'appointment_type' => $appointmentTypes[$index % 3],
                'status' => $status,
                'chief_complaint' => $complaints[$index],
                'queue_number' => $queueNumber,
                'checked_in_at' => Carbon::now()->subMinutes(60 - ($index * 10)),
            ]);

            // If status is IN_PROGRESS or COMPLETED, set consultation_started_at
            if ($status === 'IN_PROGRESS' || $status === 'COMPLETED') {
                $appointment->update([
                    'consultation_started_at' => Carbon::now()->subMinutes(30 - ($index * 5))
                ]);
            }

            // If status is COMPLETED, set consultation_completed_at
            if ($status === 'COMPLETED') {
                $appointment->update([
                    'consultation_completed_at' => Carbon::now()->subMinutes(10 - $index)
                ]);
            }
        }

        echo "✅ Created " . count($patients) . " patients and " . count($patients) . " OPD appointments\n";
    }
}