<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ProductionDatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for production.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Production Database Seeding...');
        
        // Seed roles and permissions (no demo users)
        $this->call([
            ProductionRolePermissionSeeder::class,
        ]);
        
        $this->command->info('✅ Production database seeding completed!');
        $this->command->line('');
        $this->command->warn('⚠️  No demo users created for security.');
        $this->command->info('📝 Create admin users with: php artisan admin:create-user');
        $this->command->line('');
    }
}