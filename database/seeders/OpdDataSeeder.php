<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OpdAppointment;
use App\Models\Patient;
use App\Models\User;
use App\Models\Icd10Code;
use Carbon\Carbon;

class OpdDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create some sample ICD-10 codes
        $icd10Codes = [
            ['code' => 'Z00.00', 'description' => 'Encounter for general adult medical examination without abnormal findings', 'category' => 'Z00-Z13', 'subcategory' => 'Z00'],
            ['code' => 'I10', 'description' => 'Essential (primary) hypertension', 'category' => 'I10-I16', 'subcategory' => 'I10'],
            ['code' => 'E11.9', 'description' => 'Type 2 diabetes mellitus without complications', 'category' => 'E08-E13', 'subcategory' => 'E11'],
            ['code' => 'J06.9', 'description' => 'Acute upper respiratory infection, unspecified', 'category' => 'J00-J06', 'subcategory' => 'J06'],
            ['code' => 'M79.3', 'description' => 'Panniculitis, unspecified', 'category' => 'M70-M79', 'subcategory' => 'M79'],
        ];

        foreach ($icd10Codes as $code) {
            Icd10Code::firstOrCreate(['code' => $code['code']], $code);
        }

        // Get some existing patients and users (doctors)
        $patients = Patient::take(5)->get();
        $doctors = User::whereHas('roles', function($query) {
            $query->where('name', 'Doctor');
        })->take(3)->get();

        // If no doctors exist, get any users
        if ($doctors->isEmpty()) {
            $doctors = User::take(3)->get();
        }

        if ($patients->isEmpty() || $doctors->isEmpty()) {
            $this->command->info('No patients or doctors found. Please seed users and patients first.');
            return;
        }

        // Create sample OPD appointments for today
        $today = Carbon::today();
        $statuses = ['WAITING', 'IN_PROGRESS', 'COMPLETED'];
        $appointmentTypes = ['WALK_IN', 'SCHEDULED', 'EMERGENCY'];
        $complaints = [
            'General checkup',
            'Fever and headache',
            'Chest pain',
            'Abdominal pain',
            'Back pain',
            'Cough and cold',
            'Skin rash',
            'Joint pain'
        ];

        for ($i = 1; $i <= 15; $i++) {
            $patient = $patients->random();
            $doctor = $doctors->random();
            $status = $statuses[array_rand($statuses)];
            $appointmentType = $appointmentTypes[array_rand($appointmentTypes)];
            
            $checkedInAt = $today->copy()->addHours(8)->addMinutes(rand(0, 480)); // 8 AM to 4 PM
            $consultationStartedAt = null;
            $consultationCompletedAt = null;

            if ($status === 'IN_PROGRESS' || $status === 'COMPLETED') {
                $consultationStartedAt = $checkedInAt->copy()->addMinutes(rand(5, 30));
            }

            if ($status === 'COMPLETED') {
                $consultationCompletedAt = $consultationStartedAt->copy()->addMinutes(rand(15, 45));
            }

            OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $today,
                'appointment_time' => $checkedInAt->format('H:i'),
                'appointment_type' => $appointmentType,
                'status' => $status,
                'chief_complaint' => $complaints[array_rand($complaints)],
                'notes' => 'Sample appointment for testing',
                'queue_number' => $i,
                'checked_in_at' => $checkedInAt,
                'consultation_started_at' => $consultationStartedAt,
                'consultation_completed_at' => $consultationCompletedAt,
            ]);
        }

        // Create some appointments for yesterday (completed)
        $yesterday = Carbon::yesterday();
        for ($i = 1; $i <= 8; $i++) {
            $patient = $patients->random();
            $doctor = $doctors->random();
            
            $checkedInAt = $yesterday->copy()->addHours(8)->addMinutes(rand(0, 480));
            $consultationStartedAt = $checkedInAt->copy()->addMinutes(rand(5, 30));
            $consultationCompletedAt = $consultationStartedAt->copy()->addMinutes(rand(15, 45));

            OpdAppointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'appointment_date' => $yesterday,
                'appointment_time' => $checkedInAt->format('H:i'),
                'appointment_type' => $appointmentTypes[array_rand($appointmentTypes)],
                'status' => 'COMPLETED',
                'chief_complaint' => $complaints[array_rand($complaints)],
                'notes' => 'Completed appointment from yesterday',
                'queue_number' => $i,
                'checked_in_at' => $checkedInAt,
                'consultation_started_at' => $consultationStartedAt,
                'consultation_completed_at' => $consultationCompletedAt,
            ]);
        }

        $this->command->info('OPD sample data created successfully!');
        $this->command->info('Created 15 appointments for today and 8 completed appointments for yesterday.');
    }
}