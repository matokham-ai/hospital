<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ReportsDataSeeder extends Seeder
{
    /**
     * Seed the application's database with data needed for reports.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting reports data seeding...');
        
        $this->call([
            // Core system setup (if not already done)
            RolePermissionSeeder::class,
            UserSeeder::class,
            AdminUserSeeder::class,
            MasterDataSeeder::class,
            HospitalDataSeeder::class,
            PharmacySeeder::class,
            DrugFormularySeeder::class,
            SystemSettingsSeeder::class,
            SettingsSeeder::class,
            DiagnosesSeeder::class,
        ]);
        
        $this->command->info('✅ Reports data seeding completed successfully!');
        $this->command->info('🎉 Your reports dashboard should now have data to display!');
        
        // Display summary of what was created
        $this->command->info('');
        $this->command->info('📊 Data Summary for Reports:');
        $this->command->info('- Users: ' . \App\Models\User::count());
        $this->command->info('- Patients: ' . \App\Models\Patient::count());
        $this->command->info('- Encounters: ' . \App\Models\Encounter::count());
        $this->command->info('- Departments: ' . \App\Models\Department::count());
        $this->command->info('- Wards: ' . \App\Models\Ward::count());
        $this->command->info('- Beds: ' . \App\Models\Bed::count());
        $this->command->info('- Lab Orders: ' . \App\Models\LabOrder::count());
        $this->command->info('- Prescriptions: ' . \App\Models\Prescription::count());
        $this->command->info('- Invoices: ' . \App\Models\Invoice::count());
        
        $this->command->info('');
        $this->command->info('🔗 Login Credentials:');
        $this->command->info('📧 Email: superadmin@hospital.com');
        $this->command->info('🔑 Password: SuperAdmin@123');
        $this->command->info('');
        $this->command->info('🌐 Access your reports at: /reports/dashboard');
    }
}