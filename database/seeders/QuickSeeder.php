<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class QuickSeeder extends Seeder
{
    /**
     * Seed the application's database with working seeders only.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting quick database seeding...');
        
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
            PrescriptionDemoSeeder::class,
            
            // Laboratory data
            LabTestSeeder::class,
            
            // Billing and financial data
            BillingSeeder::class,
            BillingItemsSeeder::class,
            TariffSeeder::class,
            ServiceCatalogueSeeder::class,
            
            // System settings
            SystemSettingsSeeder::class,
            SettingsSeeder::class,
            
            // Supplier and inventory
            SupplierSeeder::class,
            
            // Diagnoses
            DiagnosesSeeder::class,
        ]);
        
        $this->command->info('✅ Quick database seeding completed successfully!');
        $this->command->info('🎉 Your healthcare management system now has essential demo data!');
    }
}