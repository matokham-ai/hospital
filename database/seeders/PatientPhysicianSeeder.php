<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;
use App\Models\Physician;
use App\Models\User;

class PatientPhysicianSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample patients
        Patient::firstOrCreate(['id' => 'P001'], [
            'hospital_id' => 'H001',
            'first_name' => 'John',
            'last_name' => 'Smith',
            'date_of_birth' => '1985-05-15',
            'gender' => 'M',
        ]);

        Patient::firstOrCreate(['id' => 'P002'], [
            'hospital_id' => 'H002',
            'first_name' => 'Mary',
            'last_name' => 'Johnson',
            'date_of_birth' => '1990-08-22',
            'gender' => 'F',
        ]);

        Patient::firstOrCreate(['id' => 'P003'], [
            'hospital_id' => 'H003',
            'first_name' => 'Robert',
            'last_name' => 'Wilson',
            'date_of_birth' => '1978-12-10',
            'gender' => 'M',
        ]);

        // Create sample users for physicians
        $user1 = User::firstOrCreate(['email' => 'dr.wilson@hospital.com'], [
            'name' => 'Dr. Sarah Wilson',
            'password' => bcrypt('password'),
        ]);

        $user2 = User::firstOrCreate(['email' => 'dr.brown@hospital.com'], [
            'name' => 'Dr. Michael Brown',
            'password' => bcrypt('password'),
        ]);

        // Create sample physicians
        Physician::firstOrCreate(['physician_code' => 'DOC001'], [
            'user_id' => $user1->id,
            'name' => 'Dr. Sarah Wilson',
            'license_number' => 'LIC001',
            'specialization' => 'General Medicine',
            'qualification' => 'MD',
            'years_of_experience' => 10,
            'is_consultant' => true,
        ]);

        Physician::firstOrCreate(['physician_code' => 'DOC002'], [
            'user_id' => $user2->id,
            'name' => 'Dr. Michael Brown',
            'license_number' => 'LIC002',
            'specialization' => 'Internal Medicine',
            'qualification' => 'MD',
            'years_of_experience' => 8,
            'is_consultant' => false,
        ]);
    }
}