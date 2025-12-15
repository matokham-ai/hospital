<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Dispensation;
use App\Models\Prescription;
use App\Models\User;
use Carbon\Carbon;

class DispensationSeeder extends Seeder
{
    public function run(): void
    {
        // Get pharmacist users (or create a default one if none exist)
        $pharmacists = User::whereHas('roles', function($query) {
            $query->where('name', 'Pharmacist');
        })->get();

        if ($pharmacists->isEmpty()) {
            // Create a default pharmacist user if none exist
            $pharmacist = User::create([
                'name' => 'John Pharmacist',
                'email' => 'pharmacist@hospital.com',
                'password' => bcrypt('password'),
                'status' => 'active'
            ]);
            
            // Assign pharmacist role if roles exist
            if (class_exists('\Spatie\Permission\Models\Role')) {
                $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Pharmacist']);
                $pharmacist->assignRole($role);
            }
            
            $pharmacists = collect([$pharmacist]);
        }

        // Get prescriptions that can be dispensed
        $prescriptions = Prescription::whereIn('status', ['pending', 'verified'])->get();

        if ($prescriptions->isEmpty()) {
            $this->command->info('No prescriptions available for dispensation. Please run PrescriptionSeeder first.');
            return;
        }

        // Create dispensation records for various scenarios
        $dispensationData = [
            // Recent dispensations (last 7 days)
            [
                'days_ago' => 1,
                'quantity_ratio' => 1.0, // Full quantity
                'batch_prefix' => 'BATCH2024',
                'expiry_months' => 12
            ],
            [
                'days_ago' => 2,
                'quantity_ratio' => 0.8, // Partial dispensation
                'batch_prefix' => 'BATCH2024',
                'expiry_months' => 18
            ],
            [
                'days_ago' => 3,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 6
            ],
            [
                'days_ago' => 5,
                'quantity_ratio' => 0.5, // Half quantity
                'batch_prefix' => 'BATCH2024',
                'expiry_months' => 24
            ],
            [
                'days_ago' => 7,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 8
            ],
            
            // Older dispensations (last 30 days)
            [
                'days_ago' => 10,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 15
            ],
            [
                'days_ago' => 15,
                'quantity_ratio' => 0.75,
                'batch_prefix' => 'BATCH2024',
                'expiry_months' => 20
            ],
            [
                'days_ago' => 20,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 10
            ],
            [
                'days_ago' => 25,
                'quantity_ratio' => 0.9,
                'batch_prefix' => 'BATCH2024',
                'expiry_months' => 16
            ],
            [
                'days_ago' => 30,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 5
            ],
            
            // Even older dispensations (last 90 days)
            [
                'days_ago' => 45,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 12
            ],
            [
                'days_ago' => 60,
                'quantity_ratio' => 0.6,
                'batch_prefix' => 'BATCH2022',
                'expiry_months' => 8
            ],
            [
                'days_ago' => 75,
                'quantity_ratio' => 1.0,
                'batch_prefix' => 'BATCH2023',
                'expiry_months' => 14
            ],
            [
                'days_ago' => 90,
                'quantity_ratio' => 0.8,
                'batch_prefix' => 'BATCH2022',
                'expiry_months' => 6
            ]
        ];

        $dispensationCount = 0;
        
        foreach ($dispensationData as $index => $data) {
            // Get a prescription (cycle through available prescriptions)
            $prescription = $prescriptions[$index % $prescriptions->count()];
            
            // Skip if this prescription already has a dispensation
            if ($prescription->dispensation) {
                continue;
            }
            
            // Calculate quantity to dispense
            $quantityToDispense = (int) ($prescription->quantity * $data['quantity_ratio']);
            if ($quantityToDispense <= 0) {
                $quantityToDispense = 1;
            }
            
            // Get a random pharmacist
            $pharmacist = $pharmacists->random();
            
            // Create dispensation
            $dispensation = Dispensation::create([
                'prescription_id' => $prescription->id,
                'dispensed_by' => $pharmacist->id,
                'quantity_dispensed' => $quantityToDispense,
                'dispensed_at' => Carbon::now()->subDays($data['days_ago'])->addHours(rand(8, 18))->addMinutes(rand(0, 59)),
                'batch_no' => $data['batch_prefix'] . rand(1000, 9999),
                'expiry_date' => Carbon::now()->addMonths($data['expiry_months'])->addDays(rand(-30, 30))
            ]);
            
            // Update prescription status to dispensed
            $prescription->update(['status' => 'dispensed']);
            
            $dispensationCount++;
            
            $this->command->info("Created dispensation #{$dispensation->id} for prescription #{$prescription->id} - {$quantityToDispense} units dispensed {$data['days_ago']} days ago");
        }
        
        // Get actual patient and physician IDs from the database
        $patientIds = \App\Models\Patient::pluck('id')->take(10)->toArray();
        $physicianIds = \App\Models\Physician::pluck('physician_code')->take(5)->toArray();
        
        if (empty($patientIds)) {
            $this->command->warn('No patients found in database. Creating sample patients...');
            // Create some sample patients
            for ($i = 1; $i <= 5; $i++) {
                \App\Models\Patient::create([
                    'id' => 'P' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'hospital_id' => 'H' . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'first_name' => 'Patient',
                    'last_name' => 'Test' . $i,
                    'date_of_birth' => now()->subYears(rand(20, 80)),
                    'gender' => rand(0, 1) ? 'Male' : 'Female',
                ]);
            }
            $patientIds = \App\Models\Patient::pluck('id')->take(10)->toArray();
        }
        
        if (empty($physicianIds)) {
            $this->command->warn('No physicians found in database. Creating sample physicians...');
            // Create some sample physicians
            for ($i = 1; $i <= 3; $i++) {
                \App\Models\Physician::create([
                    'physician_code' => 'DOC' . str_pad($i, 3, '0', STR_PAD_LEFT),
                    'name' => 'Dr. Test' . $i,
                    'license_number' => 'LIC' . rand(10000, 99999),
                    'specialization' => ['General Medicine', 'Internal Medicine', 'Family Medicine'][rand(0, 2)],
                    'qualification' => 'MBBS',
                    'years_of_experience' => rand(5, 25),
                    'is_consultant' => rand(0, 1),
                ]);
            }
            $physicianIds = \App\Models\Physician::pluck('physician_code')->take(5)->toArray();
        }

        // Create some additional prescriptions and immediately dispense them for more data
        $additionalPrescriptions = [
            [
                'patient_id' => $patientIds[array_rand($patientIds)],
                'physician_id' => $physicianIds[array_rand($physicianIds)],
                'drug_name' => 'Metformin 500mg',
                'dosage' => '500mg',
                'frequency' => 'BID',
                'duration' => 30,
                'quantity' => 60,
                'days_ago' => 14
            ],
            [
                'patient_id' => $patientIds[array_rand($patientIds)],
                'physician_id' => $physicianIds[array_rand($physicianIds)],
                'drug_name' => 'Lisinopril 10mg',
                'dosage' => '10mg',
                'frequency' => 'OD',
                'duration' => 30,
                'quantity' => 30,
                'days_ago' => 21
            ],
            [
                'patient_id' => $patientIds[array_rand($patientIds)],
                'physician_id' => $physicianIds[array_rand($physicianIds)],
                'drug_name' => 'Atorvastatin 20mg',
                'dosage' => '20mg',
                'frequency' => 'OD',
                'duration' => 30,
                'quantity' => 30,
                'days_ago' => 35
            ]
        ];
        
        foreach ($additionalPrescriptions as $prescData) {
            // Create prescription
            $prescription = Prescription::create([
                'encounter_id' => rand(100, 999),
                'patient_id' => $prescData['patient_id'],
                'physician_id' => $prescData['physician_id'],
                'drug_name' => $prescData['drug_name'],
                'dosage' => $prescData['dosage'],
                'frequency' => $prescData['frequency'],
                'duration' => $prescData['duration'],
                'quantity' => $prescData['quantity'],
                'status' => 'dispensed',
                'notes' => 'Auto-generated for dispensation demo'
            ]);
            
            // Create dispensation
            $dispensation = Dispensation::create([
                'prescription_id' => $prescription->id,
                'dispensed_by' => $pharmacists->random()->id,
                'quantity_dispensed' => $prescData['quantity'],
                'dispensed_at' => Carbon::now()->subDays($prescData['days_ago'])->addHours(rand(9, 17))->addMinutes(rand(0, 59)),
                'batch_no' => 'BATCH' . rand(2022, 2024) . rand(1000, 9999),
                'expiry_date' => Carbon::now()->addMonths(rand(6, 24))
            ]);
            
            $dispensationCount++;
            
            $this->command->info("Created additional prescription #{$prescription->id} and dispensation #{$dispensation->id}");
        }
        
        $this->command->info("✅ DispensationSeeder completed successfully!");
        $this->command->info("📊 Total dispensations created: {$dispensationCount}");
        $this->command->info("💊 Dispensations span the last 90 days with various quantities and batch numbers");
        $this->command->info("👨‍⚕️ Used " . $pharmacists->count() . " pharmacist(s) for dispensing");
    }
}