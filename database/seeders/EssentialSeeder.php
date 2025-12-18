<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EssentialSeeder extends Seeder
{
    /**
     * Seed the application's database with essential data only.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting essential database seeding...');
        
        $this->call([
            // Core system setup
            RolePermissionSeeder::class,
            
            // User management
            UserSeeder::class,
            AdminUserSeeder::class,
            
            // Master data and hospital structure
            MasterDataSeeder::class,
            HospitalDataSeeder::class,
            
            // Pharmacy and medication data
            PharmacySeeder::class,
            DrugFormularySeeder::class,
            
            // Laboratory data
            LabTestSeeder::class,
            
            // System settings
            SystemSettingsSeeder::class,
            SettingsSeeder::class,
            
            // Diagnoses
            DiagnosesSeeder::class,
        ]);
        
        $this->command->info('✅ Essential database seeding completed successfully!');
        $this->command->info('🎉 Your healthcare management system now has essential data for the reports dashboard!');
    }
}