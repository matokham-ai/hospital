<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class QuickUserSeeder extends Seeder
{
    /**
     * Quick seeder to set up users for admin master data system
     * Run with: php artisan db:seed --class=QuickUserSeeder
     */
    public function run(): void
    {
        $this->command->info('🚀 Setting up Admin Master Data System Users...');
        $this->command->info('================================================');
        
        // Run the required seeders in order
        $this->call([
            RolePermissionSeeder::class,
            AdminUserSeeder::class,
        ]);
        
        $this->command->info('');
        $this->command->info('🎉 Admin Master Data System is ready!');
        $this->command->info('');
        $this->command->info('📋 Quick Access Guide:');
        $this->command->info('======================');
        $this->command->info('🌐 Admin Dashboard: /admin/dashboard');
        $this->command->info('👥 Departments: /admin/departments');
        $this->command->info('🏥 Wards & Beds: /admin/wards');
        $this->command->info('🧪 Test Catalogs: /admin/master-data/tests');
        $this->command->info('💊 Drug Formulary: /admin/master-data/drugs');
        $this->command->info('');
        $this->command->info('🔐 Default Admin Login:');
        $this->command->info('Email: masterdata@hospital.com');
        $this->command->info('Password: MasterData@2024');
        $this->command->info('');
        $this->command->warn('⚠️  Remember to change default passwords!');
    }
}